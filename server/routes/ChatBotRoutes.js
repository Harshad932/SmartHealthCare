import express from 'express';
import { chatBot, getSymptomHistory, getUserAnalytics } from '../controllers/patient/ChatBotController.js';
import { authenticateToken, requirePatient } from '../middleware/auth.js';

const router = express.Router();

// Route for chatbot interaction - OPEN TO ALL USERS (registered and anonymous)
router.post('/analyze-symptoms', chatBot);

// Route for symptom history - REQUIRES AUTHENTICATION (only registered users)
router.get('/symptom-history', authenticateToken, requirePatient, getSymptomHistory);

// Route for user analytics - REQUIRES AUTHENTICATION (only registered users)
router.get('/user-analytics', authenticateToken, requirePatient, getUserAnalytics);

export default router;