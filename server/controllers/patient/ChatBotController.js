import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { pool } from "../../config/db.js";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Middleware to extract user info from token
const getUserInfo = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      if (decoded.role === 'patient') {
        // Verify the patient actually exists in database
        const patientCheck = await pool.query(
          'SELECT patient_id, email FROM patients WHERE patient_id = $1 AND is_active = true',
          [decoded.userId]
        );
        
        if (patientCheck.rows.length > 0) {
          return {
            isAuthenticated: true,
            patientId: decoded.userId,
            email: decoded.email
          };
        } else {
          console.log('Patient not found in database, treating as anonymous');
        }
      }
    } catch (error) {
      console.log('Invalid token, treating as anonymous:', error.message);
    }
  }
  
  // Handle anonymous user - no session storage needed
  return {
    isAuthenticated: false,
    patientId: null,
    email: null
  };
};

// Get conversation history for context (REGISTERED USERS ONLY)
const getConversationHistory = async (userInfo, limit = 5) => {
  // Only get history for authenticated users
  if (!userInfo.isAuthenticated) {
    return [];
  }
  
  const query = `
    SELECT sa.symptoms, sa.analysis_results, sa.created_at,
           sc.conversation_title
    FROM symptom_analyses sa
    LEFT JOIN symptom_conversations sc ON sa.conversation_id = sc.conversation_id
    WHERE sa.patient_id = $1
    ORDER BY sa.created_at DESC
    LIMIT $2
  `;
  const params = [userInfo.patientId, limit];
  
  const result = await pool.query(query, params);
  return result.rows;
};

// Create or get active conversation (REGISTERED USERS ONLY)
// Create or get active conversation (REGISTERED USERS ONLY)
const getOrCreateConversation = async (userInfo, symptoms) => {
  // Only create conversations for authenticated users
  if (!userInfo.isAuthenticated || !userInfo.patientId) {
    return null;
  }
  
  // Verify patient exists before creating conversation
  const patientExists = await pool.query(
    'SELECT patient_id FROM patients WHERE patient_id = $1 AND is_active = true',
    [userInfo.patientId]
  );
  
  if (patientExists.rows.length === 0) {
    console.log('Patient not found, cannot create conversation');
    return null;
  }
  
  // Generate conversation title from symptoms (first 50 chars)
  const conversationTitle = symptoms.substring(0, 50) + (symptoms.length > 50 ? '...' : '');
  
  // Rest of the function remains the same...
  const activeConv = await pool.query(
    'SELECT conversation_id FROM symptom_conversations WHERE patient_id = $1 AND is_active = true ORDER BY updated_at DESC LIMIT 1',
    [userInfo.patientId]
  );
  
  if (activeConv.rows.length > 0) {
    return activeConv.rows[0].conversation_id;
  }
  
  // Create new conversation for authenticated user
  const newConv = await pool.query(
    `INSERT INTO symptom_conversations (patient_id, conversation_title) 
     VALUES ($1, $2) RETURNING conversation_id`,
    [userInfo.patientId, conversationTitle]
  );
  
  return newConv.rows[0].conversation_id;
};

// Symptom analysis keywords and patterns
const symptomPatterns = {
  fever: ['fever', 'high temperature', 'hot', 'chills', 'burning up'],
  pain: ['pain', 'ache', 'hurt', 'sore', 'throbbing', 'stabbing'],
  respiratory: ['cough', 'breathing', 'shortness of breath', 'wheeze', 'chest tightness'],
  digestive: ['nausea', 'vomit', 'diarrhea', 'stomach', 'abdominal', 'bloating'],
  neurological: ['headache', 'dizziness', 'confusion', 'memory', 'seizure'],
  skin: ['rash', 'itching', 'swelling', 'red', 'blister', 'hives'],
  musculoskeletal: ['joint', 'muscle', 'stiffness', 'weakness', 'cramp']
};

const specialistMapping = {
  fever: ['General Practitioner', 'Internal Medicine'],
  pain: ['Pain Management Specialist', 'General Practitioner'],
  respiratory: ['Pulmonologist', 'General Practitioner'],
  digestive: ['Gastroenterologist', 'General Practitioner'],
  neurological: ['Neurologist', 'General Practitioner'],
  skin: ['Dermatologist', 'General Practitioner'],
  musculoskeletal: ['Orthopedist', 'Rheumatologist']
};

// Function to analyze symptoms using pattern matching
const analyzeSymptoms = (symptoms) => {
  const lowerSymptoms = symptoms.toLowerCase();
  const detectedCategories = [];
  
  Object.keys(symptomPatterns).forEach(category => {
    const patterns = symptomPatterns[category];
    const found = patterns.some(pattern => lowerSymptoms.includes(pattern));
    if (found) {
      detectedCategories.push(category);
    }
  });
  
  return detectedCategories;
};

// Function to get specialist recommendations
const getSpecialistRecommendations = (categories) => {
  const specialists = new Set();
  
  categories.forEach(category => {
    if (specialistMapping[category]) {
      specialistMapping[category].forEach(spec => specialists.add(spec));
    }
  });
  
  return Array.from(specialists);
};

// Function to determine urgency level
const getUrgencyLevel = (severity, duration, symptoms) => {
  const emergencyKeywords = ['chest pain', 'difficulty breathing', 'severe headache', 'unconscious', 'bleeding', 'severe pain'];
  const hasEmergencySymptom = emergencyKeywords.some(keyword => 
    symptoms.toLowerCase().includes(keyword)
  );
  
  if (hasEmergencySymptom || severity >= 8) {
    return 'HIGH - Seek immediate medical attention';
  } else if (severity >= 6 || duration.includes('more_than_2_weeks')) {
    return 'MEDIUM - Schedule appointment soon';
  } else {
    return 'LOW - Monitor symptoms';
  }
};

// Function to generate AI suggestion using OpenRouter with conversation context
const generateAISuggestion = async (symptoms, severity, duration, conversationHistory, userInfo) => {
  try {
    // Build context from conversation history (only for authenticated users)
    let contextPrompt = '';
    if (userInfo.isAuthenticated && conversationHistory.length > 0) {
      contextPrompt = `\n\nPrevious consultation history:\n`;
      conversationHistory.forEach((entry, index) => {
        contextPrompt += `${index + 1}. Previous symptoms: ${entry.symptoms} (${new Date(entry.created_at).toLocaleDateString()})\n`;
      });
      contextPrompt += `\nPlease consider this history when providing your analysis.\n`;
    }

    // Create a detailed medical prompt with context
    const medicalPrompt = `As a medical AI assistant, analyze these symptoms and provide helpful suggestions:

Current Symptoms: ${symptoms}
Severity (1-10): ${severity}
Duration: ${duration}
${contextPrompt}
${userInfo.isAuthenticated ? '' : '\n[Note: This is an anonymous consultation - consider suggesting registration for better health tracking and personalized recommendations]'}

Please provide:
1. Brief analysis of the symptoms${userInfo.isAuthenticated && conversationHistory.length > 0 ? ' considering previous history' : ''}
2. General health recommendations
3. When to seek medical attention
4. Self-care suggestions if applicable
${!userInfo.isAuthenticated ? '5. Brief mention of benefits of creating an account for better health tracking and personalized care' : ''}

Important: This is for informational purposes only and not a substitute for professional medical advice.`;

    // Define models to try in order (fallback strategy)
    const models = [
      "mixtral-8x7b-32768",      
      "llama3-70b-8192",           
      "llama3-8b-8192",           
      "gemma-7b-it",               
    ];

    
    let botResponse = null;
    let lastError = null;
    
    // Try each model until one works
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
          model: model,
          messages: [
            { 
              role: "system", 
              content: "You are a helpful medical AI assistant. Provide informative, accurate, and empathetic responses about health symptoms. Always remind users that your advice is for informational purposes only and cannot replace professional medical consultation."
            },
            { role: "user", content: medicalPrompt }
          ],
          max_tokens: 400,
          temperature: 0.7
        }, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Symptom Checker App"
          },
          timeout: 15000
        });
        
        if (response.data?.choices?.[0]?.message?.content) {
          botResponse = response.data.choices[0].message.content;
          console.log(`Successfully got response from ${model}`);
          return botResponse;
        }
      } catch (modelError) {
        console.error(`Error with model ${model}:`, modelError.response?.data || modelError.message);
        lastError = modelError;
        
        if (modelError.response?.status !== 429) {
          continue;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.error("All AI models failed. Last error:", lastError?.response?.data || lastError?.message);
    return `Unable to generate AI suggestion at this time. Please consult with a healthcare professional for proper medical advice. Based on your symptoms, consider monitoring them closely and seek medical attention if they worsen.${!userInfo.isAuthenticated ? '\n\nTip: Create an account to track your symptoms over time and get more personalized suggestions based on your health history.' : ''}`;
    
  } catch (error) {
    console.error('AI API Error:', error);
    return `Unable to generate AI suggestion at this time. Please consult with a healthcare professional for proper medical advice.${!userInfo.isAuthenticated ? '\n\nTip: Create an account to track your symptoms over time and receive personalized health recommendations.' : ''}`;
  }
};

// Save symptom analysis to database (REGISTERED USERS ONLY)
const saveSymptomAnalysis = async (userInfo, symptoms, severity, duration, analysisResults, conversationId, aiModelUsed = 'openrouter-fallback') => {
  // Only save analysis for authenticated users
  if (!userInfo.isAuthenticated) {
    // For anonymous users, just increment analytics counter
    await pool.query('SELECT increment_anonymous_analytics()');
    return;
  }

  const conversationContext = {
    timestamp: new Date().toISOString(),
    symptoms,
    severity,
    duration
  };

  // Save analysis for registered user
  await pool.query(
    `INSERT INTO symptom_analyses (
      patient_id, symptoms, severity, duration, analysis_results, 
      conversation_context, ai_model_used, conversation_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      userInfo.patientId,
      symptoms,
      severity,
      duration,
      JSON.stringify(analysisResults),
      JSON.stringify(conversationContext),
      aiModelUsed,
      conversationId
    ]
  );

  // Update conversation for registered user
  if (conversationId) {
    await pool.query(
      `UPDATE symptom_conversations SET 
       total_analyses = total_analyses + 1,
       last_symptoms = $1,
       last_analysis_results = $2,
       updated_at = CURRENT_TIMESTAMP
       WHERE conversation_id = $3`,
      [symptoms, JSON.stringify(analysisResults), conversationId]
    );
  }

  // Update registered analyses count in analytics
  await pool.query(`
    INSERT INTO symptom_analytics (date, registered_analyses, total_analyses) 
    VALUES (CURRENT_DATE, 1, 1)
    ON CONFLICT (date) 
    DO UPDATE SET 
      registered_analyses = symptom_analytics.registered_analyses + 1,
      total_analyses = symptom_analytics.total_analyses + 1
  `);
};

// API endpoint for symptom analysis
export const chatBot = async (req, res) => {
  try {
    const { symptoms, severity, duration } = req.body;
    
    if (!symptoms || !severity || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user info (authenticated or anonymous)
    const userInfo = await getUserInfo(req);
    
    // Get conversation history for context (only for authenticated users)
    const conversationHistory = await getConversationHistory(userInfo);
    
    // Get or create conversation (only for authenticated users)
    const conversationId = await getOrCreateConversation(userInfo, symptoms);
    
    // Analyze symptoms
    const categories = analyzeSymptoms(symptoms);
    const recommendedSpecialists = getSpecialistRecommendations(categories);
    const urgencyLevel = getUrgencyLevel(severity, duration, symptoms);
    
    // Generate AI suggestion with context
    const aiSuggestion = await generateAISuggestion(symptoms, severity, duration, conversationHistory, userInfo);
    
    // Generate possible conditions (simplified)
    const possibleConditions = [];
    if (categories.includes('fever')) possibleConditions.push('Viral infection', 'Bacterial infection');
    if (categories.includes('respiratory')) possibleConditions.push('Common cold', 'Flu', 'Bronchitis');
    if (categories.includes('digestive')) possibleConditions.push('Gastroenteritis', 'Food poisoning');
    if (categories.includes('pain')) possibleConditions.push('Inflammation', 'Injury');
    if (categories.includes('neurological')) possibleConditions.push('Tension headache', 'Migraine');
    
    if (possibleConditions.length === 0) {
      possibleConditions.push('Multiple possible conditions - professional evaluation needed');
    }
    
    // Generate next steps
    const nextSteps = [];
    if (urgencyLevel.includes('HIGH')) {
      nextSteps.push('Seek emergency medical care immediately');
      nextSteps.push('Call emergency services if symptoms worsen');
    } else if (urgencyLevel.includes('MEDIUM')) {
      nextSteps.push('Schedule appointment with healthcare provider');
      nextSteps.push('Monitor symptoms closely');
      if (!userInfo.isAuthenticated) {
        nextSteps.push('Consider registering to track symptom patterns over time');
      }
    } else {
      nextSteps.push('Rest and monitor symptoms');
      nextSteps.push('Stay hydrated');
      nextSteps.push('Contact healthcare provider if symptoms persist or worsen');
      if (!userInfo.isAuthenticated) {
        nextSteps.push('Create an account to track symptoms and get personalized recommendations');
      }
    }
    
    // Emergency warning
    let emergencyWarning = null;
    const emergencySymptoms = ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious'];
    if (emergencySymptoms.some(symptom => symptoms.toLowerCase().includes(symptom))) {
      emergencyWarning = 'These symptoms may indicate a medical emergency. Seek immediate medical attention.';
    }
    
    const results = {
      severity,
      duration,
      urgencyLevel,
      aiSuggestion,
      possibleConditions,
      recommendedSpecialists: recommendedSpecialists.length > 0 ? recommendedSpecialists : ['General Practitioner'],
      nextSteps,
      emergencyWarning,
      hasHistory: conversationHistory.length > 0,
      isAuthenticated: userInfo.isAuthenticated,
      // Remove sessionToken from response since we're not using it
      analysisId: null // Will be set only for registered users after saving
    };
    
    // Save to database (only for registered users, anonymous just updates analytics)
    await saveSymptomAnalysis(userInfo, symptoms, severity, duration, results, conversationId);
    
    // Add additional messaging for anonymous users
    if (!userInfo.isAuthenticated) {
      results.anonymousMessage = "This analysis is temporary and won't be saved. Create an account to track your symptoms, view history, and get personalized health insights.";
    }
    
    res.json(results);
    
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get symptom history endpoint (REGISTERED USERS ONLY)
export const getSymptomHistory = async (req, res) => {
  try {
    const userInfo = await getUserInfo(req);
    
    // Only authenticated users can access history
    if (!userInfo.isAuthenticated) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to view your symptom history. Anonymous users cannot access saved history.'
      });
    }
    
    const query = `
      SELECT 
        sa.analysis_id,
        sa.symptoms,
        sa.severity,
        sa.duration,
        sa.analysis_results,
        sa.created_at,
        sc.conversation_title,
        sc.total_analyses
      FROM symptom_analyses sa
      LEFT JOIN symptom_conversations sc ON sa.conversation_id = sc.conversation_id
      WHERE sa.patient_id = $1
      ORDER BY sa.created_at DESC
      LIMIT 50
    `;
    const params = [userInfo.patientId];
    
    const result = await pool.query(query, params);
    
    res.json({
      history: result.rows,
      isAuthenticated: true,
      totalAnalyses: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching symptom history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user analytics endpoint (REGISTERED USERS ONLY)
export const getUserAnalytics = async (req, res) => {
  try {
    const userInfo = await getUserInfo(req);
    
    if (!userInfo.isAuthenticated) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to view your health analytics.'
      });
    }
    
    // Get user's symptom analytics
    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_analyses,
        AVG(severity) as average_severity,
        COUNT(DISTINCT DATE(created_at)) as days_tracked,
        MIN(created_at) as first_analysis,
        MAX(created_at) as last_analysis
      FROM symptom_analyses 
      WHERE patient_id = $1
    `;
    
    const analyticsResult = await pool.query(analyticsQuery, [userInfo.patientId]);
    
    // Get most common symptoms
    const symptomsQuery = `
      SELECT symptoms, COUNT(*) as frequency
      FROM symptom_analyses 
      WHERE patient_id = $1
      GROUP BY symptoms
      ORDER BY frequency DESC
      LIMIT 5
    `;
    
    const symptomsResult = await pool.query(symptomsQuery, [userInfo.patientId]);
    
    res.json({
      analytics: analyticsResult.rows[0],
      commonSymptoms: symptomsResult.rows,
      isAuthenticated: true
    });
    
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};