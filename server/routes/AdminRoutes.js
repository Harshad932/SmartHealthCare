// ===== ROUTES =====

// adminRoutes.js
import express from 'express';
import {
  loginAdmin,
  getDashboardStats,
  getRecentActivities,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  getPatients,
  updatePatientStatus,
  getDoctors,
  getAppointments,
  getAnalytics,
  getNotifications,
  getPatientsCount,
  getDoctorsCount,
  getAppointmentsCount,
  getSymptomAnalysesCount
} from '../controllers/admin/AdminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/admin/login', loginAdmin);

// // Ptes - require admin authenticatrotected rouion
// router.use(authenticateToken, requireAdmin);

// Dashboard routes
router.get('/admin/dashboard/stats', getDashboardStats);
router.get('/admin/activities/recent', getRecentActivities);
router.get('/admin/notifications', getNotifications);

// Count routes for stats
router.get('/admin/patients/count', getPatientsCount);
router.get('/admin/doctors/count', getDoctorsCount);
router.get('/admin/appointments/count', getAppointmentsCount);
router.get('/admin/symptom-analyses/count', getSymptomAnalysesCount);

// Doctor management routes
router.get('/admin/doctors/pending', getPendingDoctors);
router.get('/admin/doctors', getDoctors);
router.post('/admin/doctors/approve', approveDoctor);
router.post('/admin/doctors/reject', rejectDoctor);

// Patient management routes
router.get('/admin/patients', getPatients);
router.put('/admin/patients/status', updatePatientStatus);

// Appointment management routes
router.get('/admin/appointments', getAppointments);

// Analytics routes
router.get('/admin/analytics', getAnalytics);

export default router;