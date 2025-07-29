import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import {pool}  from "../../config/db.js";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

// Generate JWT Token
const generateToken = (userId, email, role = 'patient') => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.APP_PASSWORD, 
  },
});

// Send OTP Email
const sendOTPEmail = async (email, otp, firstName = '') => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Smart Healthcare Portal - Email Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification Required</h2>
        <p>Hello ${firstName},</p>
        <p>Thank you for registering with Smart Healthcare Portal. Please use the following verification code to complete your registration:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #007bff; margin: 0; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>This code will expire in 5 minutes.</strong></p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Smart Healthcare Portal - Your Health, Our Priority</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Store OTP in database
const storeOTP = async (email, otp, purpose = 'registration') => {
  // Delete any existing OTPs for this email and purpose
  await pool.query(
    'DELETE FROM otp_verifications WHERE email = $1 AND purpose = $2',
    [email.toLowerCase(), purpose]
  );
  
  // Insert new OTP
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  
  await pool.query(
    `INSERT INTO otp_verifications (email, otp_code, purpose, expires_at) 
     VALUES ($1, $2, $3, $4)`,
    [email.toLowerCase(), otp, purpose, expiresAt]
  );
};

// Patient Registration (Step 1 - Send OTP)
export const registerPatient = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      allergies,
      medicalHistory
    } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Email, password, first name, and last name are required'
      });
    }

    // Check if user already exists and is verified
    const existingUser = await pool.query(
      'SELECT patient_id, email_verified FROM patients WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0 && existingUser.rows[0].email_verified) {
      return res.status(409).json({
        error: 'User with this email already exists and is verified'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // If user exists but not verified, update their data
    if (existingUser.rows.length > 0 && !existingUser.rows[0].email_verified) {
      await pool.query(
        `UPDATE patients SET 
         password_hash = $1, first_name = $2, last_name = $3, phone = $4, 
         date_of_birth = $5, gender = $6, address = $7, 
         emergency_contact_name = $8, emergency_contact_phone = $9,
         blood_group = $10, allergies = $11, medical_history = $12, 
         updated_at = CURRENT_TIMESTAMP
         WHERE email = $13`,
        [
          passwordHash,
          firstName.trim(),
          lastName.trim(),
          phone?.trim() || null,
          dateOfBirth || null,
          gender || null,
          address?.trim() || null,
          emergencyContactName?.trim() || null,
          emergencyContactPhone?.trim() || null,
          bloodGroup || null,
          allergies?.trim() || null,
          medicalHistory?.trim() || null,
          email.toLowerCase()
        ]
      );
    } else {
      // Insert new patient (email_verified = false)
      await pool.query(
        `INSERT INTO patients (
          email, password_hash, first_name, last_name, phone, date_of_birth,
          gender, address, emergency_contact_name, emergency_contact_phone,
          blood_group, allergies, medical_history, email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false)`,
        [
          email.toLowerCase(),
          passwordHash,
          firstName.trim(),
          lastName.trim(),
          phone?.trim() || null,
          dateOfBirth || null,
          gender || null,
          address?.trim() || null,
          emergencyContactName?.trim() || null,
          emergencyContactPhone?.trim() || null,
          bloodGroup || null,
          allergies?.trim() || null,
          medicalHistory?.trim() || null
        ]
      );
    }

    // Generate and send OTP
    const otp = generateOTP();
    await storeOTP(email, otp, 'registration');
    await sendOTPEmail(email, otp, firstName);

    res.status(200).json({
      message: 'Registration initiated. Please check your email for verification code.',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }
    
    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
};

// Verify OTP (Step 2 - Complete Registration)
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose = 'registration' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: 'Email and OTP are required'
      });
    }

    // Get OTP record from database
    const otpRecord = await pool.query(
      `SELECT * FROM otp_verifications 
       WHERE email = $1 AND purpose = $2 AND is_used = false 
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), purpose]
    );

    if (otpRecord.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired OTP'
      });
    }

    const otpData = otpRecord.rows[0];

    // Check if OTP is expired
    if (new Date() > new Date(otpData.expires_at)) {
      return res.status(400).json({
        error: 'OTP has expired. Please request a new one.'
      });
    }

    // Check if max attempts reached
    if (otpData.attempts >= otpData.max_attempts) {
      return res.status(429).json({
        error: 'Maximum verification attempts reached. Please request a new OTP.'
      });
    }

    // Check if OTP matches
    if (otpData.otp_code !== otp) {
      // Increment attempts
      await pool.query(
        'UPDATE otp_verifications SET attempts = attempts + 1 WHERE otp_id = $1',
        [otpData.otp_id]
      );
      
      const remainingAttempts = otpData.max_attempts - (otpData.attempts + 1);
      return res.status(400).json({
        error: `Invalid OTP. ${remainingAttempts} attempts remaining.`
      });
    }

    // Mark OTP as used
    await pool.query(
      'UPDATE otp_verifications SET is_used = true WHERE otp_id = $1',
      [otpData.otp_id]
    );

    if (purpose === 'registration') {
      // Update patient email_verified status
      const result = await pool.query(
        `UPDATE patients SET email_verified = true, updated_at = CURRENT_TIMESTAMP 
         WHERE email = $1 
         RETURNING patient_id, email, first_name, last_name, created_at`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Patient record not found'
        });
      }

      const patient = result.rows[0];
      const token = generateToken(patient.patient_id, patient.email, 'patient');

      res.status(200).json({
        message: 'Email verified successfully. Registration completed!',
        patient: {
          id: patient.patient_id,
          email: patient.email,
          firstName: patient.first_name,
          lastName: patient.last_name,
          createdAt: patient.created_at
        },
        token,
        role: 'patient'
      });
    } else {
      // Handle other OTP purposes (password reset, etc.)
      res.status(200).json({
        message: 'OTP verified successfully',
        verified: true
      });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      error: 'Internal server error during OTP verification'
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email, purpose = 'registration' } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Check if user exists (for registration purpose)
    if (purpose === 'registration') {
      const existingUser = await pool.query(
        'SELECT first_name, email_verified FROM patients WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found. Please register first.'
        });
      }

      if (existingUser.rows[0].email_verified) {
        return res.status(400).json({
          error: 'Email is already verified'
        });
      }
    }

    // Check rate limiting (prevent spam)
    const recentOTP = await pool.query(
      `SELECT created_at FROM otp_verifications 
       WHERE email = $1 AND purpose = $2 
       AND created_at > NOW() - INTERVAL '1 minute'
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), purpose]
    );

    if (recentOTP.rows.length > 0) {
      return res.status(429).json({
        error: 'Please wait at least 1 minute before requesting a new OTP'
      });
    }

    // Generate and send new OTP
    const otp = generateOTP();
    await storeOTP(email, otp, purpose);
    
    // Get user's first name for email
    const userQuery = await pool.query(
      'SELECT first_name FROM patients WHERE email = $1',
      [email.toLowerCase()]
    );
    const firstName = userQuery.rows[0]?.first_name || '';

    await sendOTPEmail(email, otp, firstName);

    res.status(200).json({
      message: 'New OTP sent successfully. Please check your email.',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      error: 'Internal server error while resending OTP'
    });
  }
};

// Patient Login
export const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Get patient from database
    const result = await pool.query(
      `SELECT patient_id, email, password_hash, first_name, last_name, 
              email_verified, is_active, last_login
       FROM patients WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const patient = result.rows[0];

    // Check if email is verified
    if (!patient.email_verified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in'
      });
    }

    // Check if account is active
    if (!patient.is_active) {
      return res.status(403).json({
        error: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, patient.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Update last login
    await pool.query(
      'UPDATE patients SET last_login = CURRENT_TIMESTAMP WHERE patient_id = $1',
      [patient.patient_id]
    );

    // Generate JWT token
    const token = generateToken(patient.patient_id, patient.email, 'patient');

    res.status(200).json({
      message: 'Login successful',
      patient: {
        id: patient.patient_id,
        email: patient.email,
        firstName: patient.first_name,
        lastName: patient.last_name,
        lastLogin: new Date()
      },
      token,
      role: 'patient'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
};

// Get patient dashboard overview data
export const getDashboardOverview = async (req, res) => {
  try {
    const patientId = req.user.userId;

    // Get dashboard statistics
    const [appointmentsResult, documentsResult, notificationsResult, symptomAnalysesResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as total_appointments,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_appointments,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_appointments
         FROM appointments WHERE patient_id = $1 AND appointment_date >= CURRENT_DATE`,
        [patientId]
      ),
      pool.query(
        'SELECT COUNT(*) as total_documents FROM medical_files WHERE patient_id = $1',
        [patientId]
      ),
      pool.query(
        `SELECT COUNT(*) as total_notifications,
                COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications
         FROM patient_notifications WHERE patient_id = $1`,
        [patientId]
      ),
      pool.query(
        'SELECT COUNT(*) as total_analyses FROM symptom_analyses WHERE patient_id = $1',
        [patientId]
      ),
    ]);

    // Get recent appointments
    const recentAppointments = await pool.query(
      `SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.status, a.reason_for_visit,
              CONCAT(d.first_name, ' ', d.last_name) as doctor_name, d.specialization
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.patient_id = $1 AND a.appointment_date >= CURRENT_DATE
       ORDER BY a.appointment_date ASC, a.appointment_time ASC
       LIMIT 5`,
      [patientId]
    );

    // Get recent notifications
    const recentNotifications = await pool.query(
      `SELECT notification_id, type, title, message, is_read, created_at
       FROM patient_notifications
       WHERE patient_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [patientId]
    );

    // Get recent symptom analyses
    const recentSymptoms = await pool.query(
      `SELECT analysis_id, symptoms, severity, analysis_results, created_at
       FROM symptom_analyses
       WHERE patient_id = $1
       ORDER BY created_at DESC
       LIMIT 3`,
      [patientId]
    );

    const dashboardData = {
      stats: {
        totalAppointments: parseInt(appointmentsResult.rows[0].total_appointments),
        confirmedAppointments: parseInt(appointmentsResult.rows[0].confirmed_appointments),
        pendingAppointments: parseInt(appointmentsResult.rows[0].pending_appointments),
        totalDocuments: parseInt(documentsResult.rows[0].total_documents),
        totalNotifications: parseInt(notificationsResult.rows[0].total_notifications),
        unreadNotifications: parseInt(notificationsResult.rows[0].unread_notifications),
        totalAnalyses: parseInt(symptomAnalysesResult.rows[0].total_analyses),
      },
      recentAppointments: recentAppointments.rows,
      recentNotifications: recentNotifications.rows,
      recentSymptoms: recentSymptoms.rows,
    };

    res.status(200).json({
      message: 'Dashboard overview retrieved successfully',
      data: dashboardData,
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching dashboard data',
    });
  }
};

// Get patient appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.duration,
             a.status, a.reason_for_visit, a.consultation_notes, a.created_at,
             CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
             d.specialization, d.consultation_fee, d.clinic_address
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      WHERE a.patient_id = $1
    `;

    const queryParams = [patientId];

    if (status) {
      query += ` AND a.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM appointments WHERE patient_id = $1';
    const countParams = [patientId];

    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.status(200).json({
      message: 'Appointments retrieved successfully',
      data: {
        appointments: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: offset + limit < totalCount,
          hasPrevious: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching appointments',
    });
  }
};

export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newDate, newTime, reason } = req.body;
    const patientId = req.user.userId;

    // Validate input
    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        error: 'New date and time are required'
      });
    }

    // Check if appointment exists and belongs to patient
    const appointmentQuery = `
      SELECT a.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name 
      FROM appointments a 
      JOIN doctors d ON a.doctor_id = d.doctor_id 
      WHERE a.appointment_id = $1 AND a.patient_id = $2
    `;
    const appointmentResult = await pool.query(appointmentQuery, [appointmentId, patientId]);

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    const appointment = appointmentResult.rows[0];

    // Check if appointment can be rescheduled (only pending and confirmed appointments)
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        error: 'This appointment cannot be rescheduled'
      });
    }

    // Check if the new time slot is available
    const availabilityQuery = `
      SELECT * FROM appointments 
      WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 
      AND status IN ('pending', 'confirmed') AND appointment_id != $4
    `;
    const availabilityResult = await pool.query(availabilityQuery, [
      appointment.doctor_id, 
      newDate, 
      newTime, 
      appointmentId
    ]);

    if (availabilityResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'The selected time slot is not available'
      });
    }

    // Update appointment with new date/time and reset status to pending
    const updateQuery = `
      UPDATE appointments 
      SET appointment_date = $1, 
          appointment_time = $2, 
          status = 'pending',
          updated_at = CURRENT_TIMESTAMP
      WHERE appointment_id = $3 AND patient_id = $4
      RETURNING *
    `;
    const updateResult = await pool.query(updateQuery, [newDate, newTime, appointmentId, patientId]);

    // Create notification for doctor about rescheduling
    const notificationQuery = `
      INSERT INTO doctor_notifications (doctor_id, type, title, message)
      VALUES ($1, 'appointment_rescheduled', 'Appointment Rescheduled', $2)
    `;
    const notificationMessage = `Patient has rescheduled appointment to ${newDate} at ${newTime}. ${reason ? 'Reason: ' + reason : ''}`;
    await pool.query(notificationQuery, [appointment.doctor_id, notificationMessage]);

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: {
        appointment: updateResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule appointment'
    });
  }
};

// Update the existing cancelAppointment function to handle both pending and confirmed appointments
export const cancelAppointmentUpdated = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    const patientId = req.user.userId;

    // Check if appointment exists and belongs to patient
    const appointmentQuery = `
      SELECT a.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name 
      FROM appointments a 
      JOIN doctors d ON a.doctor_id = d.doctor_id 
      WHERE a.appointment_id = $1 AND a.patient_id = $2
    `;
    const appointmentResult = await pool.query(appointmentQuery, [appointmentId, patientId]);

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    const appointment = appointmentResult.rows[0];

    // Check if appointment can be cancelled
    if (!['pending'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        error: 'This appointment cannot be cancelled'
      });
    }

    // Update appointment status to cancelled
    const updateQuery = `
      UPDATE appointments 
      SET status = 'cancelled', 
          cancellation_reason = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE appointment_id = $2 AND patient_id = $3
      RETURNING *
    `;
    const updateResult = await pool.query(updateQuery, [reason, appointmentId, patientId]);

    // Create notification for doctor about cancellation
    const notificationQuery = `
      INSERT INTO doctor_notifications (doctor_id, type, title, message)
      VALUES ($1, 'appointment_cancelled', 'Appointment Cancelled', $2)
    `;
    const notificationMessage = `Patient has cancelled appointment scheduled for ${appointment.appointment_date} at ${appointment.appointment_time}. ${reason ? 'Reason: ' + reason : ''}`;
    await pool.query(notificationQuery, [appointment.doctor_id, notificationMessage]);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointment: updateResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel appointment'
    });
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to get file extension
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

// Helper function to sanitize filename for Cloudinary
const sanitizeFilename = (filename) => {
  // Remove file extension for the public_id, keep only alphanumeric, hyphens, and underscores
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
  return nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
};

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const fileExtension = getFileExtension(file.originalname);
    const timestamp = Date.now();
    const sanitizedName = sanitizeFilename(file.originalname);
    
    // Determine resource type and format based on file type
    let resourceType = 'image';
    let format = undefined;
    
    if (file.mimetype === 'application/pdf') {
      resourceType = 'raw';
      format = 'pdf';
    } else if (file.mimetype.includes('application/') || 
               file.mimetype.includes('text/') ||
               ['doc', 'docx', 'txt', 'rtf'].includes(fileExtension)) {
      resourceType = 'raw';
      format = fileExtension;
    } else if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
      // Let Cloudinary auto-detect image format
      format = undefined;
    } else {
      resourceType = 'raw';
      format = fileExtension;
    }

    return {
      folder: 'medical-documents',
      resource_type: resourceType,
      format: format,
      public_id: `${req.user.userId}_${sanitizedName}_${timestamp}`,
      // For raw files, preserve original filename in metadata
      context: resourceType === 'raw' ? `original_filename=${file.originalname}` : undefined,
    };
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/jpg', 
      'image/gif',
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  },
});

// Get patient medical documents
export const getPatientDocuments = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { category, search, page = 1, limit = 12 } = req.query;

    let query = `
      SELECT file_id, file_name, cloudinary_public_id, cloudinary_url,
             file_type, category, uploaded_by_patient, created_at,
             appointment_id,
             CASE 
               WHEN uploaded_by_doctor_id IS NOT NULL 
               THEN (SELECT CONCAT(first_name, ' ', last_name) FROM doctors WHERE doctor_id = uploaded_by_doctor_id)
               ELSE 'You'
             END as uploaded_by
      FROM medical_files
      WHERE patient_id = $1
    `;

    const queryParams = [patientId];

    if (category) {
      query += ` AND category = $${queryParams.length + 1}`;
      queryParams.push(category);
    }

    if (search) {
      query += ` AND file_name ILIKE $${queryParams.length + 1}`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM medical_files WHERE patient_id = $1';
    const countParams = [patientId];

    if (category) {
      countQuery += ' AND category = $2';
      countParams.push(category);
    }

    if (search) {
      const searchIndex = countParams.length + 1;
      countQuery += ` AND file_name ILIKE $${searchIndex}`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Process the documents to ensure proper URLs
    const processedDocuments = result.rows.map(doc => ({
      ...doc,
      // Ensure proper download URL for raw files (PDFs, DOCs, etc.)
      download_url: doc.file_type === 'application/pdf' || 
                   doc.file_type.includes('application/') ?
                   `${doc.cloudinary_url}?fl_attachment:${encodeURIComponent(doc.file_name)}` :
                   doc.cloudinary_url
    }));

    res.status(200).json({
      message: 'Documents retrieved successfully',
      data: {
        documents: processedDocuments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: offset + limit < totalCount,
          hasPrevious: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching documents',
    });
  }
};

// Upload medical documents
export const uploadDocuments = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { category = 'document' } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
      });
    }

    const uploadedFiles = [];

    // Process each uploaded file
    for (const file of req.files) {
      const fileData = {
        patient_id: patientId,
        file_name: file.originalname,
        cloudinary_public_id: file.filename,
        cloudinary_url: file.path,
        file_type: file.mimetype,
        category: category,
        uploaded_by_patient: true,
      };

      const result = await pool.query(
        `INSERT INTO medical_files (
          patient_id, file_name, cloudinary_public_id, cloudinary_url,
          file_type, category, uploaded_by_patient
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING file_id, file_name, cloudinary_url, file_type, created_at`,
        [
          fileData.patient_id,
          fileData.file_name,
          fileData.cloudinary_public_id,
          fileData.cloudinary_url,
          fileData.file_type,
          fileData.category,
          fileData.uploaded_by_patient,
        ]
      );

      const uploadedFile = result.rows[0];
      
      // Add proper download URL for raw files
      uploadedFile.download_url = uploadedFile.file_type === 'application/pdf' || 
                                 uploadedFile.file_type.includes('application/') ?
                                 `${uploadedFile.cloudinary_url}?fl_attachment:${encodeURIComponent(uploadedFile.file_name)}` :
                                 uploadedFile.cloudinary_url;

      uploadedFiles.push(uploadedFile);
    }

    // Create notification for successful upload
    await pool.query(
      `INSERT INTO patient_notifications (patient_id, type, title, message)
       VALUES ($1, 'document_upload', 'Documents Uploaded', $2)`,
      [
        patientId,
        `Successfully uploaded ${uploadedFiles.length} document(s)`,
      ]
    );

    res.status(201).json({
      message: 'Documents uploaded successfully',
      data: {
        uploadedFiles,
        totalUploaded: uploadedFiles.length,
      },
    });

  } catch (error) {
    console.error('Upload documents error:', error);
    
    // Clean up uploaded files from Cloudinary if database insertion fails
    if (req.files) {
      for (const file of req.files) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (cleanupError) {
          console.error('Cloudinary cleanup error:', cleanupError);
        }
      }
    }

    res.status(500).json({
      error: 'Internal server error while uploading documents',
    });
  }
};

// Delete medical document
export const deleteDocument = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { documentId } = req.params;

    // Get document details first
    const documentResult = await pool.query(
      `SELECT file_id, cloudinary_public_id, file_name, file_type
       FROM medical_files 
       WHERE file_id = $1 AND patient_id = $2`,
      [documentId, patientId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Document not found or access denied',
      });
    }

    const document = documentResult.rows[0];

    // Delete from Cloudinary
    try {
      // For raw files, we need to specify the resource_type
      const resourceType = document.file_type === 'application/pdf' || 
                          document.file_type.includes('application/') ||
                          document.file_type.includes('text/') ? 'raw' : 'image';
      
      await cloudinary.uploader.destroy(document.cloudinary_public_id, {
        resource_type: resourceType
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion error:', cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await pool.query(
      'DELETE FROM medical_files WHERE file_id = $1 AND patient_id = $2',
      [documentId, patientId]
    );

    res.status(200).json({
      message: 'Document deleted successfully',
      data: {
        deletedDocument: {
          id: document.file_id,
          fileName: document.file_name,
        },
      },
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Internal server error while deleting document',
    });
  }
};

// Helper function to get proper download URL
export const getDownloadUrl = (cloudinaryUrl, fileName, fileType) => {
  if (fileType === 'application/pdf' || fileType.includes('application/')) {
    return `${cloudinaryUrl}?fl_attachment:${encodeURIComponent(fileName)}`;
  }
  return cloudinaryUrl;
};

export const getSymptomHistory = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const query = `
      SELECT sa.analysis_id, sa.symptoms, sa.severity, sa.duration,
             sa.analysis_results, sa.conversation_context, sa.ai_model_used,
             sa.created_at, sc.conversation_title, sc.total_analyses
      FROM symptom_analyses sa
      LEFT JOIN symptom_conversations sc ON sa.conversation_id = sc.conversation_id
      WHERE sa.patient_id = $1
      ORDER BY sa.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const offset = (page - 1) * limit;
    const result = await pool.query(query, [patientId, limit, offset]);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM symptom_analyses WHERE patient_id = $1',
      [patientId]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    res.status(200).json({
      message: 'Symptom history retrieved successfully',
      data: {
        analyses: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: offset + limit < totalCount,
          hasPrevious: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get symptom history error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching symptom history',
    });
  }
};

// Get patient notifications
export const getPatientNotifications = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    let query = `
      SELECT notification_id, type, title, message, is_read, created_at
      FROM patient_notifications
      WHERE patient_id = $1
    `;

    const queryParams = [patientId];

    if (unreadOnly === 'true') {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM patient_notifications WHERE patient_id = $1';
    const countParams = [patientId];

    if (unreadOnly === 'true') {
      countQuery += ' AND is_read = false';
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      data: {
        notifications: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: offset + limit < totalCount,
          hasPrevious: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching notifications',
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { notificationId } = req.params;

    const result = await pool.query(
      `UPDATE patient_notifications 
       SET is_read = true 
       WHERE notification_id = $1 AND patient_id = $2
       RETURNING notification_id`,
      [notificationId, patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Notification not found or access denied',
      });
    }

    res.status(200).json({
      message: 'Notification marked as read',
      data: {
        notificationId: result.rows[0].notification_id,
      },
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      error: 'Internal server error while updating notification',
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const patientId = req.user.userId;

    const result = await pool.query(
      `UPDATE patient_notifications 
       SET is_read = true 
       WHERE patient_id = $1 AND is_read = false
       RETURNING COUNT(*)`,
      [patientId]
    );

    res.status(200).json({
      message: 'All notifications marked as read',
      data: {
        updatedCount: result.rowCount,
      },
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      error: 'Internal server error while updating notifications',
    });
  }
};

// Get patient profile
export const getPatientProfile = async (req, res) => {
  try {
    const patientId = req.user.userId;

    const result = await pool.query(
      `SELECT patient_id, email, first_name, last_name, phone, date_of_birth,
              gender, address, emergency_contact_name, emergency_contact_phone,
              blood_group, allergies, medical_history, created_at, last_login
       FROM patients
       WHERE patient_id = $1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Patient profile not found',
      });
    }

    const profile = result.rows[0];

    res.status(200).json({
      message: 'Profile retrieved successfully',
      data: {
        profile,
      },
    });

  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching profile',
    });
  }
};

// Update patient profile
export const updatePatientProfile = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      allergies,
      medicalHistory,
    } = req.body;

    const result = await pool.query(
      `UPDATE patients SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        date_of_birth = COALESCE($4, date_of_birth),
        gender = COALESCE($5, gender),
        address = COALESCE($6, address),
        emergency_contact_name = COALESCE($7, emergency_contact_name),
        emergency_contact_phone = COALESCE($8, emergency_contact_phone),
        blood_group = COALESCE($9, blood_group),
        allergies = COALESCE($10, allergies),
        medical_history = COALESCE($11, medical_history),
        updated_at = CURRENT_TIMESTAMP
       WHERE patient_id = $12
       RETURNING patient_id, first_name, last_name, email`,
      [
        firstName?.trim(),
        lastName?.trim(),
        phone?.trim(),
        dateOfBirth,
        gender,
        address?.trim(),
        emergencyContactName?.trim(),
        emergencyContactPhone?.trim(),
        bloodGroup,
        allergies?.trim(),
        medicalHistory?.trim(),
        patientId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Patient not found',
      });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      data: {
        updatedProfile: result.rows[0],
      },
    });

  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({
      error: 'Internal server error while updating profile',
    });
  }
};

