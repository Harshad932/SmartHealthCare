// backend/controllers/voiceConsultationController.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CONSULTATION_PROMPT = `You are an expert medical AI scribe with multilingual capabilities. 

TASK 1: Detect the language(s) of the conversation (English, Hindi, Marathi, or mixed).
TASK 2: Translate and convert the doctor-patient conversation into structured clinical notes in ENGLISH.
TASK 3: Analyze the patient's behavior, tone, and emotional state during the consultation.
TASK 4: Generate two separate reports - one for the patient and one for the doctor's internal use.

TRANSCRIPT:
{{TRANSCRIPT}}

Generate a JSON response with this exact structure:

{
  "detectedLanguages": ["array of detected languages"],
  "patientReport": {
    "visitDate": "string (today's date YYYY-MM-DD)",
    "chiefComplaint": "string (in simple English the patient can understand)",
    "symptoms": ["array of symptoms mentioned"],
    "diagnosis": "string (simplified explanation for patient)",
    "prescriptions": [
      {
        "medication": "string",
        "dosage": "string", 
        "frequency": "string",
        "duration": "string",
        "instructions": "string (clear patient instructions)"
      }
    ],
    "lifestyle": ["array of lifestyle recommendations"],
    "nextVisit": "string (when to follow up)",
    "emergencyInstructions": "string (when to seek immediate care)"
  },
  "doctorReport": {
    "clinicalNotes": {
      "subjective": "string (detailed patient history, symptoms, duration, triggers)",
      "objective": "string (examination findings, vital signs, test results mentioned)",
      "assessment": "string (differential diagnosis, clinical reasoning, risk factors)",
      "plan": "string (treatment plan, tests ordered, referrals, follow-up)"
    },
    "behavioralAnalysis": {
      "emotionalState": "string (anxiety, depression, stress levels observed)",
      "compliance": "string (likelihood of following treatment based on conversation)",
      "communication": "string (how well patient communicated concerns)",
      "redFlags": ["array of concerning behaviors or statements if any"],
      "familyDynamics": "string (if family members mentioned or involved)"
    },
    "therapyConsiderations": {
      "recommended": "boolean (true if therapy might help)",
      "type": "string (CBT, counseling, etc. if recommended)",
      "frequency": "string (suggested frequency if recommended)",
      "focusAreas": ["array of areas to address in therapy if recommended"],
      "goals": ["array of therapy goals if recommended"]
    },
    "internalNotes": "string (confidential observations for follow-up)",
    "languageNotes": "string (important cultural or language-specific observations)",
    "riskAssessment": "string (medical risk level and monitoring needs)"
  }
}

CRITICAL RULES:
1. Translate everything to English while preserving medical accuracy
2. Patient report should be simple and jargon-free for patient understanding
3. Doctor report should be comprehensive and include detailed clinical analysis
4. Detect emotional cues and mental health indicators from the conversation
5. Note any cultural context that might affect treatment
6. If medications are mentioned, format them properly in the prescriptions array
7. Extract actual examination findings from the conversation for objective section
8. Today's date is: ${new Date().toISOString().split('T')[0]}
9. Be thorough but accurate - only include information actually discussed in the conversation`;

// Process multilingual voice transcript with Gemini AI
export const processVoiceTranscript = async (req, res) => {
  try {
    const { transcript, appointmentId } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No transcript provided' 
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Gemini API key not configured' 
      });
    }

    console.log('Processing voice transcript with Gemini AI...');
    console.log('Transcript length:', transcript.length);

    // Get the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prepare the prompt with transcript
    const prompt = CONSULTATION_PROMPT.replace('{{TRANSCRIPT}}', transcript);

    // Generate content with AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    console.log('AI Response received, length:', aiResponse.length);

    // Parse the JSON response
    let parsedResponse;
    try {
      // Clean the response - remove markdown formatting if present
      const cleanedResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw AI response:', aiResponse);
      
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to parse AI response',
        rawResponse: aiResponse
      });
    }

    // Validate the response structure
    if (!parsedResponse.patientReport || !parsedResponse.doctorReport) {
      return res.status(500).json({ 
        success: false, 
        error: 'Invalid AI response structure',
        response: parsedResponse
      });
    }

    console.log('Successfully processed transcript');
    console.log('Detected languages:', parsedResponse.detectedLanguages);

    res.json({
      success: true,
      appointmentId,
      detectedLanguages: parsedResponse.detectedLanguages || ['English'],
      patientReport: parsedResponse.patientReport,
      doctorReport: parsedResponse.doctorReport,
      processingTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing voice transcript:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return res.status(500).json({ 
        success: false, 
        error: 'Invalid or missing Gemini API key' 
      });
    }

    if (error.message?.includes('quota')) {
      return res.status(429).json({ 
        success: false, 
        error: 'API quota exceeded. Please try again later.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to process transcript',
      details: error.message
    });
  }
};

// Test Gemini API connection
export const testGeminiConnection = async (req, res) => {
  try { 
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Gemini API key not configured' 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const testPrompt = "Respond with a simple JSON: {\"status\": \"connected\", \"message\": \"Gemini AI is working\"}";
    
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      geminiStatus: 'connected',
      response: text
    });

  } catch (error) {
    console.error('Gemini connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to connect to Gemini AI',
      details: error.message
    });
  }
};

// Language detection helper (can be used for pre-processing if needed)
export const detectLanguage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No text provided for language detection' 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Detect the language(s) in this text and return a JSON with detected languages and confidence: "${text.substring(0, 500)}"
    
    Return format: {"languages": ["English", "Hindi"], "confidence": "high", "isPrimarilyEnglish": true}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Parse the response
    const cleanedResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsedResponse = JSON.parse(cleanedResponse);

    res.json({
      success: true,
      detection: parsedResponse
    });

  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to detect language',
      details: error.message
    });
  }
};

// Get consultation summary (optional - for quick review)
export const getConsultationSummary = async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ 
        success: false, 
        error: 'No transcript provided' 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Provide a brief summary of this medical consultation in English. 
    Focus on: chief complaint, key symptoms, and main treatment discussed.
    Keep it under 100 words.
    
    Transcript: ${transcript}
    
    Return as JSON: {"summary": "brief summary text", "keyPoints": ["point1", "point2", "point3"]}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    const cleanedResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsedResponse = JSON.parse(cleanedResponse);

    res.json({
      success: true,
      summary: parsedResponse
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate summary',
      details: error.message
    });
  }
};