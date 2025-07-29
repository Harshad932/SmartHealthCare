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
router.post('/login', loginAdmin);

// // Ptes - require admin authenticatrotected rouion
router.use(authenticateToken, requireAdmin);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/activities/recent', getRecentActivities);
router.get('/notifications', getNotifications);

// Count routes for stats
router.get('/patients/count', getPatientsCount);
router.get('/doctors/count', getDoctorsCount);
router.get('/appointments/count', getAppointmentsCount);
router.get('/symptom-analyses/count', getSymptomAnalysesCount);

// Doctor management routes
router.get('/doctors/pending', getPendingDoctors);
router.get('/doctors', getDoctors);
router.post('/doctors/approve', approveDoctor);
router.post('/doctors/reject', rejectDoctor);

// Patient management routes
router.get('/patients', getPatients);
router.put('/patients/status', updatePatientStatus);

// Appointment management routes
router.get('/appointments', getAppointments);

// Analytics routes
router.get('/analytics', getAnalytics);

export default router;