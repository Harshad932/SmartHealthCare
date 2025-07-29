// server/controllers/doshaController.js
import geminiService from '../../services/geminiService.js';

// Get initial question
export const getInitialQuestion = async (req, res) => {
  try {
    const question = await geminiService.generateInitialQuestion();
    res.json(question);
  } catch (error) {
    console.error('Error getting initial question:', error);
    res.status(500).json({ error: 'Failed to generate initial question' });
  }
};

// Get next question based on answers
export const getNextQuestion = async (req, res) => {
  try {
    const { answers, currentQuestionNumber } = req.body;
    
    // Check if we've reached the question limit
    if (currentQuestionNumber >= 15) {
      res.json({ complete: true });
      return;
    }
    
    const nextQuestion = await geminiService.generateNextQuestion(answers, currentQuestionNumber);
    res.json(nextQuestion);
  } catch (error) {
    console.error('Error getting next question:', error);
    res.status(500).json({ error: 'Failed to generate next question' });
  }
};

// Analyze dosha type
export const analyzeDoshaType = async (req, res) => {
  try {
    const { answers } = req.body;
    const analysis = await geminiService.analyzeDoshaType(answers);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing dosha:', error);
    res.status(500).json({ error: 'Failed to analyze dosha type' });
  }
};