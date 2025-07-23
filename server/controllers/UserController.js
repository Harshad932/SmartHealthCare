import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import {pool}  from "../config/db.js";

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

// Get Patient Profile
export const getPatientProfile = async (req, res) => {
  try {
    const patientId = req.user.userId; // From JWT middleware

    const result = await pool.query(
      `SELECT patient_id, email, first_name, last_name, phone, date_of_birth,
              gender, address, emergency_contact_name, emergency_contact_phone,
              blood_group, allergies, medical_history, created_at, updated_at
       FROM patients WHERE patient_id = $1 AND is_active = true`,
      [patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Patient not found'
      });
    }

    const patient = result.rows[0];

    res.status(200).json({
      patient: {
        id: patient.patient_id,
        email: patient.email,
        firstName: patient.first_name,
        lastName: patient.last_name,
        phone: patient.phone,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        address: patient.address,
        emergencyContactName: patient.emergency_contact_name,
        emergencyContactPhone: patient.emergency_contact_phone,
        bloodGroup: patient.blood_group,
        allergies: patient.allergies,
        medicalHistory: patient.medical_history,
        createdAt: patient.created_at,
        updatedAt: patient.updated_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching profile'
    });
  }
};