// ===== CONTROLLERS =====

// AdminController.js - Enhanced version
import { pool } from "../../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {


    const query = "SELECT * FROM admins WHERE email = $1";
    const result = await pool.query(query, [email]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!admin.is_active) {
      return res.status(401).json({ message: 'Admin account is deactivated' });
    }


    // Update last login
    await pool.query("UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE admin_id = $1", [admin.admin_id]);

    // Log admin login activity
    await pool.query(
      "INSERT INTO admin_logs (admin_id, action_type, action_details, ip_address) VALUES ($1, $2, $3, $4)",
      [admin.admin_id, 'LOGIN', 'Admin logged in', req.ip]
    );

    const token = jwt.sign(
      { 
        id: admin.admin_id, 
        email: admin.email, 
        role: admin.role_level,
        permissions: admin.permissions 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      admin: { 
        id: admin.admin_id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        role_level: admin.role_level,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const [
      patientsResult,
      doctorsResult,
      appointmentsResult,
      analysesResult
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM patients WHERE is_active = true"),
      pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE approval_status = 'approved') as approved,
          COUNT(*) FILTER (WHERE approval_status = 'pending') as pending,
          COUNT(*) as total
        FROM doctors
      `),
      pool.query("SELECT COUNT(*) as count FROM appointments"),
      pool.query("SELECT COUNT(*) as count FROM symptom_analyses")
    ]);

    res.json({
      totalPatients: parseInt(patientsResult.rows[0].count),
      totalDoctors: parseInt(doctorsResult.rows[0].approved),
      pendingApprovals: parseInt(doctorsResult.rows[0].pending),
      totalAppointments: parseInt(appointmentsResult.rows[0].count),
      totalAnalyses: parseInt(analysesResult.rows[0].count)
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};

// Get recent activities
export const getRecentActivities = async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    
    const query = `
      SELECT 
        al.action_type,
        al.action_details,
        al.created_at,
        CONCAT(a.first_name, ' ', a.last_name) as admin_name,
        CASE 
          WHEN al.target_patient_id IS NOT NULL THEN CONCAT('Patient: ', p.first_name, ' ', p.last_name)
          WHEN al.target_doctor_id IS NOT NULL THEN CONCAT('Doctor: ', d.first_name, ' ', d.last_name)
          ELSE NULL
        END as target_info
      FROM admin_logs al
      LEFT JOIN admins a ON al.admin_id = a.admin_id
      LEFT JOIN patients p ON al.target_patient_id = p.patient_id
      LEFT JOIN doctors d ON al.target_doctor_id = d.doctor_id
      ORDER BY al.created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    
    const activities = result.rows.map(row => ({
      id: row.log_id,
      message: `${row.admin_name} ${row.action_details} ${row.target_info || ''}`.trim(),
      time: new Date(row.created_at).toLocaleString(),
      type: row.action_type
    }));

    res.json({ activities });

  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ message: 'Error fetching recent activities' });
  }
};

// Get pending doctors
export const getPendingDoctors = async (req, res) => {
  try {
    const query = `
      SELECT 
        doctor_id,
        first_name,
        last_name,
        email,
        specialization,
        license_number,
        experience_years,
        approval_status,
        created_at
      FROM doctors 
      WHERE approval_status = 'pending'
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    const doctors = result.rows.map(doctor => ({
      ...doctor,
      name: `${doctor.first_name} ${doctor.last_name}`,
      applied: new Date(doctor.created_at).toLocaleDateString()
    }));

    res.json({ doctors });

  } catch (error) {
    console.error("Error fetching pending doctors:", error);
    res.status(500).json({ message: 'Error fetching pending doctors' });
  }
};

// Approve doctor
export const approveDoctor = async (req, res) => {
  const { doctorId } = req.body;
  const adminId = req.user.id;
  console.log(` is approving doctor ${doctorId}`);

  try {
    await pool.query('BEGIN');

    // Update doctor status
    await pool.query(
      "UPDATE doctors SET approval_status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE doctor_id = $1",
      [doctorId]
    );

    // Get doctor info for logging
    const doctorResult = await pool.query(
      "SELECT first_name, last_name, email FROM doctors WHERE doctor_id = $1",
      [doctorId]
    );
    const doctor = doctorResult.rows[0];
    console.log(doctor);

    // Log admin action
    await pool.query(
      "INSERT INTO admin_logs (admin_id, action_type, target_doctor_id, action_details, ip_address) VALUES ($1, $2, $3, $4, $5)",
      [adminId, 'DOCTOR_APPROVAL', doctorId, `Approved doctor: ${doctor.first_name} ${doctor.last_name}`, req.ip]
    );

    // Create notification for doctor
    await pool.query(
      "INSERT INTO doctor_notifications (doctor_id, type, title, message) VALUES ($1, $2, $3, $4)",
      [doctorId, 'APPROVAL', 'Application Approved', 'Congratulations! Your doctor application has been approved. You can now start accepting appointments.']
    );

    await pool.query('COMMIT');

    res.json({ message: 'Doctor approved successfully' });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error approving doctor:", error);
    res.status(500).json({ message: 'Error approving doctor' });
  }
};

// Reject doctor
export const rejectDoctor = async (req, res) => {
  const { doctorId, reason } = req.body;
  const adminId = req.user.id;

  try {
    await pool.query('BEGIN');

    // Update doctor status
    await pool.query(
      "UPDATE doctors SET approval_status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE doctor_id = $1",
      [doctorId]
    );

    // Get doctor info for logging
    const doctorResult = await pool.query(
      "SELECT first_name, last_name, email FROM doctors WHERE doctor_id = $1",
      [doctorId]
    );
    const doctor = doctorResult.rows[0];

    // Log admin action
    await pool.query(
      "INSERT INTO admin_logs (admin_id, action_type, target_doctor_id, action_details, ip_address) VALUES ($1, $2, $3, $4, $5)",
      [adminId, 'DOCTOR_REJECTION', doctorId, `Rejected doctor: ${doctor.first_name} ${doctor.last_name}`, req.ip]
    );

    // Create notification for doctor
    await pool.query(
      "INSERT INTO doctor_notifications (doctor_id, type, title, message) VALUES ($1, $2, $3, $4)",
      [doctorId, 'REJECTION', 'Application Status', `Unfortunately, your doctor application has been rejected. ${reason || 'Please contact support for more information.'}`]
    );

    await pool.query('COMMIT');

    res.json({ message: 'Doctor rejected successfully' });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error rejecting doctor:", error);
    res.status(500).json({ message: 'Error rejecting doctor' });
  }
};

// Get all patients with search
export const getPatients = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        patient_id,
        email,
        first_name,
        last_name,
        phone,
        date_of_birth,
        gender,
        is_active,
        email_verified,
        created_at,
        last_login
      FROM patients
    `;
    
    let countQuery = "SELECT COUNT(*) FROM patients";
    let values = [];
    let whereClause = "";

    if (search) {
      whereClause = " WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)";
      values = [`%${search}%`];
    }

    query += whereClause + " ORDER BY created_at DESC LIMIT $" + (values.length + 1) + " OFFSET $" + (values.length + 2);
    countQuery += whereClause;

    const [patientsResult, countResult] = await Promise.all([
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);

    res.json({
      patients: patientsResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });

  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: 'Error fetching patients' });
  }
};

// Update patient status
export const updatePatientStatus = async (req, res) => {
  const { patientId, action } = req.body;
  const adminId = req.user.id;

  try {
    let updateQuery;
    let logMessage;

    switch (action) {
      case 'activate':
        updateQuery = "UPDATE patients SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE patient_id = $1";
        logMessage = "Activated patient account";
        break;
      case 'deactivate':
        updateQuery = "UPDATE patients SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE patient_id = $1";
        logMessage = "Deactivated patient account";
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await pool.query('BEGIN');

    await pool.query(updateQuery, [patientId]);

    // Get patient info for logging
    const patientResult = await pool.query(
      "SELECT first_name, last_name FROM patients WHERE patient_id = $1",
      [patientId]
    );
    const patient = patientResult.rows[0];

    // Log admin action
    await pool.query(
      "INSERT INTO admin_logs (admin_id, action_type, target_patient_id, action_details, ip_address) VALUES ($1, $2, $3, $4, $5)",
      [adminId, 'PATIENT_STATUS_UPDATE', patientId, `${logMessage}: ${patient.first_name} ${patient.last_name}`, req.ip]
    );

    await pool.query('COMMIT');

    res.json({ message: `Patient ${action}d successfully` });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error updating patient status:", error);
    res.status(500).json({ message: 'Error updating patient status' });
  }
};

// Get all doctors
export const getDoctors = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        doctor_id,
        email,
        first_name,
        last_name,
        phone,
        license_number,
        specialization,
        qualification,
        experience_years,
        consultation_fee,
        approval_status,
        availability_status,
        is_active,
        created_at,
        last_login
      FROM doctors
    `;

    let values = [];
    let whereClause = "";

    if (status !== 'all') {
      whereClause = " WHERE approval_status = $1";
      values = [status];
    }

    query += whereClause + " ORDER BY created_at DESC LIMIT $" + (values.length + 1) + " OFFSET $" + (values.length + 2);

    const result = await pool.query(query, [...values, limit, offset]);

    res.json({ doctors: result.rows });

  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
};

// Get all appointments
export const getAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason_for_visit,
        a.created_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialization as doctor_specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
    `;

    let values = [];
    let whereClause = "";

    if (status !== 'all') {
      whereClause = " WHERE a.status = $1";
      values = [status];
    }

    query += whereClause + " ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $" + (values.length + 1) + " OFFSET $" + (values.length + 2);

    const result = await pool.query(query, [...values, limit, offset]);

    res.json({ appointments: result.rows });

  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
};

// Get analytics data
export const getAnalytics = async (req, res) => {
  try {
    const [
      registrationTrendResult,
      commonSymptomsResult,
      popularSpecialistsResult,
      systemStatsResult
    ] = await Promise.all([
      // Registration trend (last 30 days)
      pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as registrations
        FROM patients 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `),

      // Most common symptoms
      pool.query(`
        SELECT 
          symptom,
          COUNT(*) as frequency,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM symptom_analyses)), 2) as percentage
        FROM (
          SELECT UNNEST(string_to_array(symptoms, ',')) as symptom
          FROM symptom_analyses
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ) s
        GROUP BY symptom
        ORDER BY frequency DESC
        LIMIT 10
      `),

      // Popular specialists
      pool.query(`
        SELECT 
          d.specialization,
          COUNT(a.appointment_id) as consultations
        FROM doctors d
        LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
        WHERE a.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY d.specialization
        ORDER BY consultations DESC
        LIMIT 10
      `),

      // System performance stats (mock data - replace with actual metrics)
      Promise.resolve([{
        serverUptime: '99.9%',
        avgResponseTime: '245ms',
        apiSuccessRate: '99.2%'
      }])
    ]);

    const analytics = {
      registrationTrend: registrationTrendResult.rows,
      commonSymptoms: commonSymptomsResult.rows.map(row => ({
        name: row.symptom.trim(),
        percentage: parseFloat(row.percentage),
        count: parseInt(row.frequency)
      })),
      popularSpecialists: popularSpecialistsResult.rows,
      serverUptime: '99.9%',
      avgResponseTime: '245ms',
      apiSuccessRate: '99.2%'
    };

    res.json(analytics);

  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
};

// Get notifications
export const getNotifications = async (req, res) => {
  try {
    // For admin notifications, we'll create a simple system
    const notifications = [
      {
        id: 1,
        type: 'system',
        title: 'System Update',
        message: 'System maintenance scheduled for tonight',
        unread: true,
        created_at: new Date()
      },
      {
        id: 2,
        type: 'approval',
        title: 'Doctor Approval',
        message: 'New doctor applications awaiting approval',
        unread: true,
        created_at: new Date()
      }
    ];

    res.json({ notifications });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Count endpoints for dashboard stats
export const getPatientsCount = async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) as count FROM patients WHERE is_active = true");
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error("Error fetching patients count:", error);
    res.status(500).json({ message: 'Error fetching patients count' });
  }
};

export const getDoctorsCount = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE approval_status = 'approved') as approved,
        COUNT(*) FILTER (WHERE approval_status = 'pending') as pending
      FROM doctors
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching doctors count:", error);
    res.status(500).json({ message: 'Error fetching doctors count' });
  }
};

export const getAppointmentsCount = async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) as count FROM appointments");
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error("Error fetching appointments count:", error);
    res.status(500).json({ message: 'Error fetching appointments count' });
  }
};

export const getSymptomAnalysesCount = async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) as count FROM symptom_analyses");
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error("Error fetching symptom analyses count:", error);
    res.status(500).json({ message: 'Error fetching symptom analyses count' });
  }
};

// ===== MIDDLEWARE =====

// authMiddleware.js
export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify admin still exists and is active
    const result = await pool.query(
      "SELECT admin_id, email, role_level, permissions, is_active FROM admins WHERE admin_id = $1",
      [decoded.id]
    );

    if (!result.rows[0] || !result.rows[0].is_active) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

