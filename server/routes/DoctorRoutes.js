import express from 'express';
import { 
  registerDoctor, 
  verifyDoctorOTP, 
  resendDoctorOTP, 
  loginDoctor,
} from '../controllers/doctor/DoctorController.js';
import { 
  getDoctorProfile,
  updateDoctorProfile,
  getDashboardStats,
  getDoctorAppointments,
  updateAppointmentStatus,
  getDoctorPatients,
  getDoctorAvailability,
  updateDoctorSchedule,
  updateAvailabilityStatus,
  getDoctorNotifications,
  markNotificationAsRead,
  getDoctorAvailabilitySlots
} from '../controllers/doctor/DoctorDashboardController.js';

import {
  processVoiceTranscript,
  testGeminiConnection,
  detectLanguage,
  getConsultationSummary
} from '../controllers/doctor/VoiceConsultation.js';

import { authenticateToken, requireDoctor } from '../middleware/auth.js';

const router = express.Router();

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================
router.post('/register', registerDoctor);
router.post('/verify-otp', verifyDoctorOTP);
router.post('/resend-otp', resendDoctorOTP);
router.post('/login', loginDoctor);

// Public route for patients to view doctor availability
router.get('/:doctorId/availability', getDoctorAvailabilitySlots);
router.post('/process-transcript', processVoiceTranscript);
router.get('/test-connection', testGeminiConnection);
router.post('/detect-language', detectLanguage);
router.post('/summary', getConsultationSummary);

// =============================================
// APPLY AUTHENTICATION MIDDLEWARE
// All routes below this line require authentication
// =============================================
router.use(authenticateToken, requireDoctor);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Profile management
router.get('/profile', getDoctorProfile);
router.put('/profile', updateDoctorProfile);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Appointments management
router.get('/appointments', getDoctorAppointments);
router.put('/appointments/:appointmentId/:action', updateAppointmentStatus);

// Patients management
router.get('/patients', getDoctorPatients);

// Schedule/Availability management
router.get('/availability', getDoctorAvailability);
router.put('/availability/schedule', updateDoctorSchedule);
router.put('/availability/status', updateAvailabilityStatus);

// Notifications
router.get('/notifications', getDoctorNotifications);
router.put('/notifications/:notificationId/read', markNotificationAsRead);

// =============================================
// VOICE CONSULTATION ROUTES (All protected)
// =============================================


export default router;