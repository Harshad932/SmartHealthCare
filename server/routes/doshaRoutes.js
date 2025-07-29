// server/routes/doshaRoutes.js
import express from 'express';
import { 
  getInitialQuestion, 
  getNextQuestion, 
  analyzeDoshaType 
} from '../controllers/dosha/doshaController.js';

const router = express.Router();

// Get the initial question
router.get('/initial-question', getInitialQuestion);

// Get the next question based on previous answers
router.post('/next-question', getNextQuestion);

// Analyze dosha type based on all answers
router.post('/analyze', analyzeDoshaType);

export default router;