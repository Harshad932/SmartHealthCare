import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import {pool}  from "../config/db.js";
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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'medical-documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    resource_type: 'image', // Use 'image' for all files
    format: (req, file) => {
      // Preserve original format
      if (file.mimetype === 'application/pdf') return 'pdf';
      return undefined; // Let Cloudinary auto-detect
    },
    public_id: (req, file) => {
      const timestamp = Date.now();
      const originalName = file.originalname.split('.')[0];
      return `${req.user.userId}_${originalName}_${timestamp}`;
    },
    flags: 'attachment', // This helps with proper download behavior
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, PDF, DOC, and DOCX files are allowed.'));
    }
  },
});

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

// Get patient medical documents
export const getPatientDocuments = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { category, search, page = 1, limit = 12 } = req.query;

    let query = `
      SELECT file_id, file_name, cloudinary_public_id, cloudinary_url,
             file_type, category, uploaded_by_patient, created_at,
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

    res.status(200).json({
      message: 'Documents retrieved successfully',
      data: {
        documents: result.rows,
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
        RETURNING file_id, file_name, cloudinary_url, created_at`,
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

      uploadedFiles.push(result.rows[0]);
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
      `SELECT file_id, cloudinary_public_id, file_name 
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
      await cloudinary.uploader.destroy(document.cloudinary_public_id);
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

