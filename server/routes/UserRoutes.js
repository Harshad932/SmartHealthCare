import express from 'express';
import { registerPatient,verifyOTP,resendOTP,loginPatient} from '../controllers/UserController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerPatient);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginPatient);

export default router;