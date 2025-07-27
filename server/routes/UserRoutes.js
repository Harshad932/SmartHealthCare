import express from 'express';
import { registerPatient,verifyOTP,resendOTP,loginPatient} from '../controllers/patient/UserController.js';
import { authenticateToken ,requirePatient} from '../middleware/auth.js';

import {
  getDashboardOverview,
  getPatientAppointments,
  getPatientDocuments,
  uploadDocuments,
  deleteDocument,
  getSymptomHistory,
  getPatientNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getPatientProfile,
  updatePatientProfile,
  upload,
} from '../controllers/patient/UserController.js';

import {
  getDoctors,
  getSpecializations,
  getDoctorAvailability,
  bookAppointment,
  getAppointmentDetails,
  cancelAppointment,
} from '../controllers/patient/AppointmentBookingController.js';

const router = express.Router();

// Public routes
router.post('/register', registerPatient);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginPatient);

router.get('/patient/overview',authenticateToken,requirePatient, getDashboardOverview);

// Appointments routes
router.get('/patient/appointments', authenticateToken, requirePatient, getPatientAppointments);

router.get('/doctors', authenticateToken, requirePatient, getDoctors);
// Appointments routes
router.get('/patient/appointments', authenticateToken, requirePatient, getPatientAppointments);
router.get('/appointments/:appointmentId', authenticateToken, requirePatient, getAppointmentDetails);
router.patch('/appointments/:appointmentId/cancel', authenticateToken, requirePatient, cancelAppointment);

// Appointment booking routes
router.get('/doctors/specializations', authenticateToken, requirePatient, getSpecializations);
router.get('/doctors/:doctorId/availability', authenticateToken, requirePatient, getDoctorAvailability);
router.post('/appointments/book', authenticateToken, requirePatient, bookAppointment);

// Documents routes
router.get('/patient/documents', authenticateToken, requirePatient, getPatientDocuments);
router.post('/patient/documents/upload', authenticateToken, requirePatient, upload.array('documents', 10), uploadDocuments);
router.delete('/patient/documents/:documentId', authenticateToken, requirePatient, deleteDocument);

// Symptom history routes
router.get('/patient/symptoms', authenticateToken, requirePatient, getSymptomHistory);

// Notifications routes
router.get('/patient/notifications', authenticateToken, requirePatient, getPatientNotifications);
router.patch('/patient/notifications/:notificationId/read', authenticateToken, requirePatient, markNotificationAsRead);
router.patch('/patient/notifications/read-all', authenticateToken, requirePatient, markAllNotificationsAsRead);

// Profile routes
router.get('/patient/profile', authenticateToken, requirePatient, getPatientProfile);
router.patch('/patient/profile', authenticateToken, requirePatient, updatePatientProfile);



export default router;