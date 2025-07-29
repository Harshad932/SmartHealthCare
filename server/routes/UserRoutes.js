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
  rescheduleAppointment,        // Add this
  cancelAppointmentUpdated,
} from '../controllers/patient/UserController.js';

import {
  getDoctors,
  getSpecializations,
  getDoctorAvailability,
  bookAppointment,
  getAppointmentDetails,     // Add this 
} from '../controllers/patient/AppointmentBookingController.js';

const router = express.Router();

// Public routes
router.post('/register', registerPatient);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginPatient);

router.get('/overview',authenticateToken,requirePatient, getDashboardOverview);

router.get('/doctors', authenticateToken, requirePatient, getDoctors);
// Appointments routes
router.patch('/appointments/:appointmentId/reschedule', authenticateToken, requirePatient, rescheduleAppointment);
router.patch('/appointments/:appointmentId/cancel', authenticateToken, requirePatient, cancelAppointmentUpdated);
router.get('/appointments', authenticateToken, requirePatient, getPatientAppointments);
router.get('/appointments/:appointmentId', authenticateToken, requirePatient, getAppointmentDetails);

// Appointment booking routes
router.get('/doctors/specializations', authenticateToken, requirePatient, getSpecializations);
router.get('/doctors/:doctorId/availability', authenticateToken, requirePatient, getDoctorAvailability);
router.post('/appointments/book', authenticateToken, requirePatient, bookAppointment);

// Documents routes
router.get('/documents', authenticateToken, requirePatient, getPatientDocuments);
router.post('/documents/upload', authenticateToken, requirePatient, upload.array('documents', 10), uploadDocuments);
router.delete('/documents/:documentId', authenticateToken, requirePatient, deleteDocument);

// Symptom history routes
router.get('/symptoms', authenticateToken, requirePatient, getSymptomHistory);

// Notifications routes
router.get('/notifications', authenticateToken, requirePatient, getPatientNotifications);
router.patch('/notifications/:notificationId/read', authenticateToken, requirePatient, markNotificationAsRead);
router.patch('/notifications/read-all', authenticateToken, requirePatient, markAllNotificationsAsRead);

// Profile routes
router.get('/profile', authenticateToken, requirePatient, getPatientProfile);
router.patch('/profile', authenticateToken, requirePatient, updatePatientProfile);



export default router;