import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/doctor/DoctorRegistration.css';

const DoctorRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Registration Form, 2: OTP Verification, 3: Pending Approval
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    licenseNumber: '',
    specialization: '',
    qualification: '',
    experienceYears: '',
    consultationFee: '',
    bio: '',
    clinicAddress: ''
  });
  
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const specializations = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Radiology',
    'Surgery',
    'Urology',
    'Gynecology',
    'Ophthalmology',
    'ENT',
    'Anesthesiology',
    'Emergency Medicine',
    'Family Medicine',
    'Internal Medicine',
    'Pathology',
    'Physical Medicine',
    'Plastic Surgery',
    'Preventive Medicine',
    'Other'
  ];

  // Timer effect for OTP expiry
  React.useEffect(() => {
    if (currentStep === 2 && otpTimer > 0) {
      const timer = setTimeout(() => {
        setOtpTimer(otpTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
  }, [currentStep, otpTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.experienceYears && (isNaN(formData.experienceYears) || formData.experienceYears < 0)) {
      setError('Please enter a valid number of experience years');
      setLoading(false);
      return;
    }

    if (formData.consultationFee && (isNaN(formData.consultationFee) || formData.consultationFee < 0)) {
      setError('Please enter a valid consultation fee');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/doctor/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('OTP sent to your email! Please verify to submit your application.');
      setCurrentStep(2);
      setOtpTimer(300); // Reset timer
      setCanResendOtp(false);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/doctor/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp,
          purpose: 'registration'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      setSuccess('Email verified successfully! Your application has been submitted for admin approval.');
      setCurrentStep(3);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/doctor/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          purpose: 'registration'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      setSuccess('New OTP sent to your email!');
      setOtpTimer(300);
      setCanResendOtp(false);
      setOtp('');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/doctor/login');
  };

  const handleHomeRedirect = () => {
    navigate('/');
  };

  // Pending Approval Step
  if (currentStep === 3) {
    return (
      <div className="doctor-registration-container">
        <div className="doctor-registration-header">
          <h1>Application Submitted Successfully!</h1>
          <div className="doctor-registration-success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </div>
        </div>

        <div className="doctor-registration-pending-message">
          <h2>Your doctor registration is under review</h2>
          <p>Thank you for applying to join our Smart Healthcare Portal as a medical professional.</p>
          
          <div className="doctor-registration-status-info">
            <h3>What happens next?</h3>
            <ul>
              <li>Our admin team will review your application and credentials</li>
              <li>This process typically takes 1-3 business days</li>
              <li>You will receive an email notification once your application is reviewed</li>
              <li>If approved, you'll be able to access your doctor dashboard</li>
              <li>If additional information is needed, we'll contact you directly</li>
            </ul>
          </div>

          <div className="doctor-registration-contact-info">
            <h3>Need assistance?</h3>
            <p>If you have any questions about your application status, please contact our support team.</p>
          </div>

          <div className="doctor-registration-actions">
            <button 
              type="button" 
              onClick={handleHomeRedirect}
              className="doctor-registration-home-button"
            >
              Return to Homepage
            </button>
            
            <button 
              type="button" 
              onClick={handleLoginRedirect}
              className="doctor-registration-login-button"
            >
              Try Login (if approved)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // OTP Verification Step
  if (currentStep === 2) {
    return (
      <div className="doctor-registration-container">
        <div className="doctor-registration-header">
          <h1>Verify Your Email</h1>
          <p>Enter the 6-digit code sent to {formData.email}</p>
        </div>

        <form onSubmit={handleOtpSubmit} className="doctor-registration-otp-form">
          <div className="doctor-registration-otp-group">
            <label htmlFor="otp">Verification Code</label>
            <input
              type="text"
              id="otp"
              name="otp"
              value={otp}
              onChange={handleOtpChange}
              placeholder="Enter 6-digit code"
              maxLength="6"
              className="doctor-registration-otp-input"
              disabled={loading}
              autoComplete="one-time-code"
            />
          </div>

          <div className="doctor-registration-timer-section">
            {!canResendOtp ? (
              <p>Code expires in: {formatTime(otpTimer)}</p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="doctor-registration-resend-button"
              >
                Resend Code
              </button>
            )}
          </div>

          {error && (
            <div className="doctor-registration-error-message">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="doctor-registration-success-message">
              <p>{success}</p>
            </div>
          )}

          <div className="doctor-registration-form-actions">
            <button 
              type="submit" 
              disabled={loading || otp.length !== 6}
              className="doctor-registration-verify-button"
            >
              {loading ? 'Verifying...' : 'Verify & Submit Application'}
            </button>
            
            <button 
              type="button" 
              onClick={() => setCurrentStep(1)}
              disabled={loading}
              className="doctor-registration-back-button"
            >
              Back to Registration
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Registration Form Step
  return (
    <div className="doctor-registration-container">
      <div className="doctor-registration-header">
        <h1>Doctor Registration</h1>
        <p>Join our Smart Healthcare Portal as a medical professional</p>
        <div className="doctor-registration-note">
          <p><strong>Note:</strong> Your application will be reviewed by our admin team before approval</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="doctor-registration-form">
        
        {/* Personal Information Section */}
        <div className="doctor-registration-form-section">
          <h2>Personal Information</h2>
          
          <div className="doctor-registration-form-row">
            <div className="doctor-registration-form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
                className="doctor-registration-form-input"
              />
            </div>
            
            <div className="doctor-registration-form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
                className="doctor-registration-form-input"
              />
            </div>
          </div>

          <div className="doctor-registration-form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="doctor-registration-form-input"
              placeholder="your.email@example.com"
            />
          </div>

          <div className="doctor-registration-form-row">
            <div className="doctor-registration-form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="doctor-registration-form-input"
                minLength="6"
                placeholder="Minimum 6 characters"
              />
            </div>
            
            <div className="doctor-registration-form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                className="doctor-registration-form-input"
                minLength="6"
              />
            </div>
          </div>

          <div className="doctor-registration-form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={loading}
              className="doctor-registration-form-input"
              placeholder="+1234567890"
            />
          </div>
        </div>

        {/* Professional Information Section */}
        <div className="doctor-registration-form-section">
          <h2>Professional Information</h2>
          
          <div className="doctor-registration-form-group">
            <label htmlFor="licenseNumber">Medical License Number *</label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              required
              disabled={loading}
              className="doctor-registration-form-input"
              placeholder="Enter your medical license number"
            />
          </div>

          <div className="doctor-registration-form-row">
            <div className="doctor-registration-form-group">
              <label htmlFor="specialization">Specialization *</label>
              <select
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                required
                disabled={loading}
                className="doctor-registration-form-select"
              >
                <option value="">Select Specialization</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            
            <div className="doctor-registration-form-group">
              <label htmlFor="experienceYears">Years of Experience</label>
              <input
                type="number"
                id="experienceYears"
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleChange}
                disabled={loading}
                className="doctor-registration-form-input"
                min="0"
                max="50"
                placeholder="e.g., 5"
              />
            </div>
          </div>

          <div className="doctor-registration-form-group">
            <label htmlFor="qualification">Qualification *</label>
            <textarea
              id="qualification"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              required
              disabled={loading}
              className="doctor-registration-form-textarea"
              rows="3"
              placeholder="e.g., MBBS, MD Internal Medicine, Fellowship in Cardiology"
            />
          </div>

          <div className="doctor-registration-form-group">
            <label htmlFor="consultationFee">Consultation Fee (₹)</label>
            <input
              type="number"
              id="consultationFee"
              name="consultationFee"
              value={formData.consultationFee}
              onChange={handleChange}
              disabled={loading}
              className="doctor-registration-form-input"
              min="0"
              step="50"
              placeholder="e.g., 500"
            />
          </div>

          <div className="doctor-registration-form-group">
            <label htmlFor="bio">Professional Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              disabled={loading}
              className="doctor-registration-form-textarea"
              rows="4"
              placeholder="Brief description of your medical practice, expertise, and approach to patient care"
            />
          </div>

          <div className="doctor-registration-form-group">
            <label htmlFor="clinicAddress">Clinic/Hospital Address</label>
            <textarea
              id="clinicAddress"
              name="clinicAddress"
              value={formData.clinicAddress}
              onChange={handleChange}
              disabled={loading}
              className="doctor-registration-form-textarea"
              rows="3"
              placeholder="Enter your clinic or hospital address"
            />
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="doctor-registration-form-section">
          <div className="doctor-registration-terms">
            <h3>Terms and Conditions</h3>
            <ul>
              <li>I certify that all information provided is accurate and complete</li>
              <li>I hold a valid medical license to practice in my jurisdiction</li>
              <li>I agree to provide professional medical services through this platform</li>
              <li>I understand that my application will be reviewed by the admin team</li>
              <li>I agree to maintain patient confidentiality and follow medical ethics</li>
              <li>I agree to the platform's terms of service and privacy policy</li>
            </ul>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="doctor-registration-error-message">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="doctor-registration-success-message">
            <p>{success}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="doctor-registration-form-actions">
          <button 
            type="submit" 
            disabled={loading || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.licenseNumber || !formData.specialization || !formData.qualification}
            className="doctor-registration-register-button"
          >
            {loading ? 'Sending OTP...' : 'Register & Send OTP'}
          </button>
          
          <button 
            type="button" 
            onClick={handleLoginRedirect}
            disabled={loading}
            className="doctor-registration-login-redirect-button"
          >
            Already registered? Login
          </button>
        </div>

        <div className="doctor-registration-form-footer">
          <p>
            By registering, you agree to our Terms of Service and Privacy Policy. 
            Your application will be reviewed by our admin team within 1-3 business days.
          </p>
        </div>
      </form>
    </div>
  );
};

export default DoctorRegistration;