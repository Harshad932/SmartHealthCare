import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {pool} from '../../config/db.js'; // Adjust path as needed

dotenv.config();

// Generate JWT Token
const generateToken = (userId, email, role = 'doctor') => {
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


// Send OTP Email for Doctor
const sendDoctorOTPEmail = async (email, otp, firstName = '') => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Smart Healthcare Portal - Doctor Registration Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Doctor Registration - Email Verification</h2>
        <p>Hello Dr. ${firstName},</p>
        <p>Thank you for applying to join Smart Healthcare Portal as a medical professional. Please use the following verification code to complete your registration:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #28a745; margin: 0; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>This code will expire in 5 minutes.</strong></p>
        <p>After email verification, your application will be reviewed by our admin team for approval.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Smart Healthcare Portal - Connecting Healthcare Professionals</p>
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

// Doctor Registration (Step 1 - Send OTP)
export const registerDoctor = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      licenseNumber,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      bio,
      clinicAddress
    } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !licenseNumber || !specialization || !qualification) {
      return res.status(400).json({
        error: 'Email, password, name, license number, specialization, and qualification are required'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Validate experience years if provided
    if (experienceYears && (isNaN(experienceYears) || experienceYears < 0)) {
      return res.status(400).json({
        error: 'Please enter a valid number of experience years'
      });
    }

    // Validate consultation fee if provided
    if (consultationFee && (isNaN(consultationFee) || consultationFee < 0)) {
      return res.status(400).json({
        error: 'Please enter a valid consultation fee'
      });
    }

    // Check if doctor already exists and is verified
    const existingDoctor = await pool.query(
      'SELECT doctor_id, email_verified, approval_status FROM doctors WHERE email = $1 OR license_number = $2',
      [email.toLowerCase(), licenseNumber.trim()]
    );

    if (existingDoctor.rows.length > 0) {
      const doctor = existingDoctor.rows[0];
      if (doctor.email_verified && doctor.approval_status !== 'rejected') {
        return res.status(409).json({
          error: 'Doctor with this email or license number already exists'
        });
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // If doctor exists but not verified or was rejected, update their data
    if (existingDoctor.rows.length > 0 && (!existingDoctor.rows[0].email_verified || existingDoctor.rows[0].approval_status === 'rejected')) {
      await pool.query(
        `UPDATE doctors SET 
         password_hash = $1, first_name = $2, last_name = $3, phone = $4, 
         license_number = $5, specialization = $6, qualification = $7, 
         experience_years = $8, consultation_fee = $9, bio = $10, 
         clinic_address = $11, approval_status = 'pending', email_verified = false,
         updated_at = CURRENT_TIMESTAMP
         WHERE email = $12`,
        [
          passwordHash,
          firstName.trim(),
          lastName.trim(),
          phone?.trim() || null,
          licenseNumber.trim(),
          specialization.trim(),
          qualification.trim(),
          experienceYears ? parseInt(experienceYears) : null,
          consultationFee ? parseFloat(consultationFee) : null,
          bio?.trim() || null,
          clinicAddress?.trim() || null,
          email.toLowerCase()
        ]
      );
    } else {
      // Insert new doctor (email_verified = false, approval_status = 'pending')
      await pool.query(
        `INSERT INTO doctors (
          email, password_hash, first_name, last_name, phone, license_number,
          specialization, qualification, experience_years, consultation_fee,
          bio, clinic_address, email_verified, approval_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, 'pending')`,
        [
          email.toLowerCase(),
          passwordHash,
          firstName.trim(),
          lastName.trim(),
          phone?.trim() || null,
          licenseNumber.trim(),
          specialization.trim(),
          qualification.trim(),
          experienceYears ? parseInt(experienceYears) : null,
          consultationFee ? parseFloat(consultationFee) : null,
          bio?.trim() || null,
          clinicAddress?.trim() || null
        ]
      );
    }

    // Generate and send OTP
    const otp = generateOTP();
    await storeOTP(email, otp, 'registration');
    await sendDoctorOTPEmail(email, otp, firstName);

    res.status(200).json({
      message: 'Registration initiated. Please check your email for verification code.',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Doctor registration error:', error);
    
    if (error.code === '23505') { // Unique violation
      if (error.constraint && error.constraint.includes('email')) {
        return res.status(409).json({
          error: 'Doctor with this email already exists'
        });
      } else if (error.constraint && error.constraint.includes('license')) {
        return res.status(409).json({
          error: 'Doctor with this license number already exists'
        });
      }
    }
    
    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
};

// Verify OTP (Step 2 - Complete Registration)
export const verifyDoctorOTP = async (req, res) => {
  try {
    const { email, otp, purpose = 'registration' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: 'Email and OTP are required'
      });
    }

    if (otp.length !== 6) {
      return res.status(400).json({
        error: 'OTP must be 6 digits'
      });
    }

    // Find and validate OTP
    const otpRecord = await pool.query(
      `SELECT * FROM otp_verifications 
       WHERE email = $1 AND otp_code = $2 AND purpose = $3 AND is_used = false`,
      [email.toLowerCase(), otp, purpose]
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

    // Check attempts
    if (otpData.attempts >= otpData.max_attempts) {
      return res.status(400).json({
        error: 'Maximum OTP attempts exceeded. Please request a new OTP.'
      });
    }

    // Mark OTP as used
    await pool.query(
      'UPDATE otp_verifications SET is_used = true WHERE otp_id = $1',
      [otpData.otp_id]
    );

    // Update doctor's email verification status
    const updateResult = await pool.query(
      'UPDATE doctors SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE email = $1 RETURNING doctor_id, first_name, last_name',
      [email.toLowerCase()]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Doctor not found'
      });
    }

    res.status(200).json({
      message: 'Email verified successfully! Your application has been submitted for admin approval.',
      doctor: {
        doctorId: updateResult.rows[0].doctor_id,
        firstName: updateResult.rows[0].first_name,
        lastName: updateResult.rows[0].last_name
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      error: 'Internal server error during OTP verification'
    });
  }
};

// Resend OTP
export const resendDoctorOTP = async (req, res) => {
  try {
    const { email, purpose = 'registration' } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Check if doctor exists
    const doctor = await pool.query(
      'SELECT first_name, email_verified FROM doctors WHERE email = $1',
      [email.toLowerCase()]
    );

    if (doctor.rows.length === 0) {
      return res.status(404).json({
        error: 'Doctor not found'
      });
    }

    if (doctor.rows[0].email_verified) {
      return res.status(400).json({
        error: 'Email is already verified'
      });
    }

    // Generate and send new OTP
    const otp = generateOTP();
    await storeOTP(email, otp, purpose);
    await sendDoctorOTPEmail(email, otp, doctor.rows[0].first_name);

    res.status(200).json({
      message: 'New OTP sent to your email'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      error: 'Internal server error while resending OTP'
    });
  }
};

export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Check if doctor exists
    const doctorQuery = await pool.query(
      `SELECT 
        doctor_id, 
        email, 
        password_hash, 
        first_name, 
        last_name, 
        specialization, 
        approval_status, 
        email_verified, 
        is_active,
        phone,
        license_number,
        qualification,
        experience_years,
        consultation_fee,
        bio,
        clinic_address,
        availability_status
      FROM doctors 
      WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (doctorQuery.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const doctor = doctorQuery.rows[0];

    // Check if doctor account is active
    if (!doctor.is_active) {
      return res.status(403).json({
        error: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if email is verified
    if (!doctor.email_verified) {
      return res.status(403).json({
        error: 'Please verify your email address before logging in'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, doctor.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check approval status
    if (doctor.approval_status === 'rejected') {
      return res.status(403).json({
        error: 'Your application has been rejected by the admin. Please contact support for more information.'
      });
    }

    // Update last login timestamp
    await pool.query(
      'UPDATE doctors SET last_login = CURRENT_TIMESTAMP WHERE doctor_id = $1',
      [doctor.doctor_id]
    );

    // Generate JWT token
    const token = generateToken(doctor.doctor_id, doctor.email, 'doctor');

    // Remove sensitive data from response
    const doctorData = {
      doctor_id: doctor.doctor_id,
      email: doctor.email,
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      specialization: doctor.specialization,
      approval_status: doctor.approval_status,
      phone: doctor.phone,
      license_number: doctor.license_number,
      qualification: doctor.qualification,
      experience_years: doctor.experience_years,
      consultation_fee: doctor.consultation_fee,
      bio: doctor.bio,
      clinic_address: doctor.clinic_address,
      availability_status: doctor.availability_status
    };

    // Create login notification for doctor
    if (doctor.approval_status === 'approved') {
      await pool.query(
        `INSERT INTO doctor_notifications (doctor_id, type, title, message) 
         VALUES ($1, 'login', 'Login Successful', 'You have successfully logged in to your account.')`,
        [doctor.doctor_id]
      );
    }

    res.status(200).json({
      message: 'Login successful',
      token,
      doctor: doctorData
    });

  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
};
