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
  markNotificationAsRead
} from '../controllers/doctor/DoctorDashboardController.js';
import { authenticateToken, requireDoctor } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/doctor/register', registerDoctor);
router.post('/doctor/verify-otp', verifyDoctorOTP);
router.post('/doctor/resend-otp', resendDoctorOTP);
router.post('/doctor/login', loginDoctor);

router.use(authenticateToken, requireDoctor);

router.get('/doctor/profile', getDoctorProfile);
router.put('/doctor/profile', updateDoctorProfile);

router.get('/doctor/dashboard/stats',  getDashboardStats);

// Appointments management
router.get('/doctor/appointments', getDoctorAppointments);
router.put('/doctor/appointments/:appointmentId/:action', updateAppointmentStatus);

// Patients management
router.get('/doctor/patients', getDoctorPatients);

// Schedule/Availability management
router.get('/doctor/availability', getDoctorAvailability);
router.put('/doctor/availability/schedule',  updateDoctorSchedule);
router.put('/doctor/availability/status',updateAvailabilityStatus);

// Notifications
router.get('/doctor/notifications',getDoctorNotifications);
router.put('/doctor/notifications/:notificationId/read', markNotificationAsRead);

export default router;