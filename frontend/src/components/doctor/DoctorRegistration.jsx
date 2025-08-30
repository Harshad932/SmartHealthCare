import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Stethoscope, Menu, X, UserCheck, Brain, CheckCircle, 
  ChevronRight, Users, Activity, Eye, EyeOff
} from 'lucide-react';
import styles from '../../assets/styles/doctor/DoctorRegistration.module.css';

const DoctorRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Registration Form, 2: OTP Verification, 3: Pending Approval
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
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

  return (
    <div className={styles["doctor-registration-container"]}>
      {/* Header */}
      <header className={styles["doctor-header"]}>
        <div className={styles["doctor-nav-container"]}>
          <div className={styles["doctor-nav-wrapper"]}>
            <div className={styles["doctor-logo"]} onClick={() => handleNavigation('/')}>
              <div className={styles["doctor-logo-icon"]}>
                <Heart className={styles["doctor-logo-heart"]} />
              </div>
              <h1 className={styles["doctor-logo-text"]} onClick={() => handleNavigation('/')}>AYUMATE</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className={styles["doctor-desktop-nav"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={styles["doctor-nav-link"]}
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={styles["doctor-nav-link"]}
              >
                AI Symptom Checker
              </button>
              <div className={styles["doctor-auth-buttons"]}>
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className={styles["doctor-login-btn"]}
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className={styles["doctor-login-btn"]}
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className={styles["doctor-admin-btn"]}
                >
                  Admin
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={styles["doctor-mobile-menu-btn"]}
            >
              {isMenuOpen ? <X className={styles["doctor-menu-icon"]} /> : <Menu className={styles["doctor-menu-icon"]} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={styles["doctor-mobile-nav"]}>
            <div className={styles["doctor-mobile-nav-container"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={styles["doctor-mobile-nav-link"]}
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={styles["doctor-mobile-nav-link"]}
              >
                AI Symptom Checker
              </button>
              <div className={styles["doctor-mobile-auth"]}>
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className={styles["doctor-mobile-login"]}
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/patient-register')}
                  className={styles["doctor-mobile-register"]}
                >
                  Patient Register
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className={styles["doctor-mobile-login"]}
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className={styles["doctor-mobile-admin"]}
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={styles["doctor-main-content"]}>
        {/* Pending Approval Step */}
        {currentStep === 3 && (
          <section className={styles["doctor-approval-section"]}>
            <div className={styles["doctor-approval-container"]}>
              <div className={styles["doctor-approval-card"]}>
                <div className={styles["doctor-success-icon"]}>
                  <CheckCircle className={styles["success-check"]} />
                </div>
                <h1 className={styles["doctor-approval-title"]}>Application Submitted Successfully!</h1>
                <p className={styles["doctor-approval-subtitle"]}>Your doctor registration is under review</p>
                
                <div className={styles["doctor-approval-content"]}>
                  <div className={styles["doctor-status-info"]}>
                    <h3>What happens next?</h3>
                    <div className={styles["doctor-status-steps"]}>
                      <div className={styles["doctor-status-step"]}>
                        <div className={styles["step-icon"]}>
                          <Users className={styles["step-icon-svg"]} />
                        </div>
                        <div className={styles["step-content"]}>
                          <h4>Application Review</h4>
                          <p>Our admin team will review your application and credentials</p>
                        </div>
                      </div>
                      <div className={styles["doctor-status-step"]}>
                        <div className={styles["step-icon"]}>
                          <Activity className={styles["step-icon-svg"]} />
                        </div>
                        <div className={styles["step-content"]}>
                          <h4>Processing Time</h4>
                          <p>This process typically takes 1-3 business days</p>
                        </div>
                      </div>
                      <div className={styles["doctor-status-step"]}>
                        <div className={styles["step-icon"]}>
                          <CheckCircle className={styles["step-icon-svg"]} />
                        </div>
                        <div className={styles["step-content"]}>
                          <h4>Approval Notification</h4>
                          <p>You'll receive an email notification once reviewed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles["doctor-contact-info"]}>
                    <h3>Need assistance?</h3>
                    <p>If you have any questions about your application status, please contact our support team.</p>
                  </div>

                  <div className={styles["doctor-approval-actions"]}>
                    <button 
                      onClick={() => handleNavigation('/')}
                      className={styles["doctor-home-button"]}
                    >
                      <Heart className={styles["btn-icon"]} />
                      Return to Homepage
                    </button>
                    
                    <button 
                      onClick={() => handleNavigation('/doctor/login')}
                      className={styles["doctor-login-button"]}
                    >
                      <Stethoscope className={styles["btn-icon"]} />
                      Try Login (if approved)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* OTP Verification Step */}
        {currentStep === 2 && (
          <section className={styles["doctor-otp-section"]}>
            <div className={styles["doctor-otp-container"]}>
              <div className={styles["doctor-otp-card"]}>
                <div className={styles["doctor-otp-header"]}>
                  <div className={styles["doctor-otp-icon"]}>
                    <Brain className={styles["otp-brain-icon"]} />
                  </div>
                  <h1 className={styles["doctor-otp-title"]}>Verify Your Email</h1>
                  <p className={styles["doctor-otp-subtitle"]}>Enter the 6-digit code sent to {formData.email}</p>
                </div>

                <form onSubmit={handleOtpSubmit} className={styles["doctor-otp-form"]}>
                  <div className={styles["doctor-otp-input-group"]}>
                    <label htmlFor="otp" className={styles["doctor-otp-label"]}>Verification Code</label>
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      value={otp}
                      onChange={handleOtpChange}
                      placeholder="Enter 6-digit code"
                      maxLength="6"
                      className={styles["doctor-otp-input"]}
                      disabled={loading}
                      autoComplete="one-time-code"
                    />
                  </div>

                  <div className={styles["doctor-timer-section"]}>
                    {!canResendOtp ? (
                      <p className={styles["doctor-timer-text"]}>Code expires in: {formatTime(otpTimer)}</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className={styles["doctor-resend-button"]}
                      >
                        Resend Code
                      </button>
                    )}
                  </div>

                  {error && (
                    <div className={styles["doctor-error-message"]}>
                      <p>{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className={styles["doctor-success-message"]}>
                      <p>{success}</p>
                    </div>
                  )}

                  <div className={styles["doctor-otp-actions"]}>
                    <button 
                      type="submit" 
                      disabled={loading || otp.length !== 6}
                      className={styles["doctor-verify-button"]}
                    >
                      {loading ? 'Verifying...' : 'Verify & Submit Application'}
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => setCurrentStep(1)}
                      disabled={loading}
                      className={styles["doctor-back-button"]}
                    >
                      Back to Registration
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Registration Form Step */}
        {currentStep === 1 && (
          <section className={styles["doctor-form-section"]}>
            <div className={styles["doctor-form-container"]}>
              <div className={styles["doctor-form-header"]}>
                <div className={styles["doctor-form-icon"]}>
                  <Stethoscope className={styles["form-stethoscope-icon"]} />
                </div>
                <h1 className={styles["doctor-form-title"]}>Doctor Registration</h1>
                <p className={styles["doctor-form-subtitle"]}>Join our Smart Healthcare Portal as a medical professional</p>
                <div className={styles["doctor-form-note"]}>
                  <CheckCircle className={styles["note-icon"]} />
                  <p><strong>Note:</strong> Your application will be reviewed by our admin team before approval</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className={styles["doctor-registration-form"]}>
                
                {/* Personal Information Section */}
                <div className={styles["doctor-form-section-card"]}>
                  <div className={styles["doctor-section-header"]}>
                    <UserCheck className={styles["section-icon"]} />
                    <h2 className={styles["section-title"]}>Personal Information</h2>
                  </div>
                  
                  <div className={styles["doctor-form-grid"]}>
                    <div className={styles["doctor-input-group"]}>
                      <label htmlFor="firstName" className={styles["doctor-label"]}>First Name *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className={styles["doctor-input"]}
                        placeholder="Enter your first name"
                      />
                    </div>
                    
                    <div className={styles["doctor-input-group"]}>
                      <label htmlFor="lastName" className={styles["doctor-label"]}>Last Name *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className={styles["doctor-input"]}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div className={styles["doctor-input-group"]}>
                    <label htmlFor="email" className={styles["doctor-label"]}>Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className={styles["doctor-input"]}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className={styles["doctor-form-grid"]}>
                    <div className={styles["doctor-input-group"]}>
                      <label htmlFor="password" className={styles["doctor-label"]}>Password *</label>
                      <div className={styles["doctor-password-input"]}>
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className={styles["doctor-input"]}
                          minLength="6"
                          placeholder="Minimum 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={styles["doctor-password-toggle"]}
                        >
                          {showPassword ? <EyeOff className={styles["eye-icon"]} /> : <Eye className={styles["eye-icon"]} />}
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles["doctor-input-group"]}>
                      <label htmlFor="confirmPassword" className={styles["doctor-label"]}>Confirm Password *</label>
                      <div className={styles["doctor-password-input"]}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className={styles["doctor-input"]}
                          minLength="6"
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className={styles["doctor-password-toggle"]}
                        >
                          {showConfirmPassword ? <EyeOff className={styles["eye-icon"]} /> : <Eye className={styles["eye-icon"]} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles["doctor-input-group"]}>
                    <label htmlFor="phone" className={styles["doctor-label"]}>Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className={styles["doctor-input"]}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                {/* Professional Information Section */}
                <div className={styles["doctor-form-section-card"]}>
                  <div className={styles["doctor-section-header"]}>
                    <Stethoscope className={styles["section-icon"]} />
                    <h2 className={styles["section-title"]}>Professional Information</h2>
                  </div>
                  
                  <div className={styles["doctor-input-group"]}>
                    <label htmlFor="licenseNumber" className={styles["doctor-label"]}>Medical License Number *</label>
                    <input
                      type="text"
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className={styles["doctor-input"]}
                      placeholder="Enter your medical license number"
                    />
                  </div>

                  <div className={styles["doctor-form-grid"]}>
                    <div className={styles["doctor-input-group"]}>
                      <label htmlFor="specialization" className={styles["doctor-label"]}>Specialization *</label>
                      <select
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className={styles["doctor-select"]}
                      >
                        <option value="">Select Specialization</option>
                        {specializations.map((spec) => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className={styles["doctor-input-group"]}>
                      <label htmlFor="experienceYears" className={styles["doctor-label"]}>Years of Experience</label>
                      <input
                        type="number"
                        id="experienceYears"
                        name="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        disabled={loading}
                        className={styles["doctor-input"]}
                        min="0"
                        max="50"
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>

                  <div className={styles["doctor-input-group"]}>
                    <label htmlFor="qualification" className={styles["doctor-label"]}>Qualification *</label>
                    <textarea
                      id="qualification"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className={styles["doctor-textarea"]}
                      rows="3"
                      placeholder="e.g., MBBS, MD Internal Medicine, Fellowship in Cardiology"
                    />
                  </div>

                  <div className={styles["doctor-input-group"]}>
                    <label htmlFor="consultationFee" className={styles["doctor-label"]}>Consultation Fee (₹)</label>
                    <input
                      type="number"
                      id="consultationFee"
                      name="consultationFee"
                      value={formData.consultationFee}
                      onChange={handleChange}
                      disabled={loading}
                      className={styles["doctor-input"]}
                      min="0"
                      step="50"
                      placeholder="e.g., 500"
                    />
                  </div>

                  <div className={styles["doctor-input-group"]}>
                    <label htmlFor="bio" className={styles["doctor-label"]}>Professional Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={loading}
                      className={styles["doctor-textarea"]}
                      rows="4"
                      placeholder="Brief description of your medical practice, expertise, and approach to patient care"
                    />
                  </div>

                  <div className={styles["doctor-input-group"]}>
                    <label htmlFor="clinicAddress" className={styles["doctor-label"]}>Clinic/Hospital Address</label>
                    <textarea
                      id="clinicAddress"
                      name="clinicAddress"
                      value={formData.clinicAddress}
                      onChange={handleChange}
                      disabled={loading}
                      className={styles["doctor-textarea"]}
                      rows="3"
                      placeholder="Enter your clinic or hospital address"
                    />
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className={styles["doctor-terms-section"]}>
                  <h3 className={styles["doctor-terms-title"]}>Terms and Conditions</h3>
                  <div className={styles["doctor-terms-list"]}>
                    <div className={styles["doctor-term-item"]}>
                      <CheckCircle className={styles["check-icon"]} />
                      <span>I certify that all information provided is accurate and complete</span>
                    </div>
                    <div className={styles["doctor-term-item"]}>
                      <CheckCircle className={styles["check-icon"]} />
                      <span>I hold a valid medical license to practice in my jurisdiction</span>
                    </div>
                    <div className={styles["doctor-term-item"]}>
                      <CheckCircle className={styles["check-icon"]} />
                      <span>I agree to provide professional medical services through this platform</span>
                    </div>
                    <div className={styles["doctor-term-item"]}>
                      <CheckCircle className={styles["check-icon"]} />
                      <span>I understand that my application will be reviewed by the admin team</span>
                    </div>
                    <div className={styles["doctor-term-item"]}>
                      <CheckCircle className={styles["check-icon"]} />
                      <span>I agree to maintain patient confidentiality and follow medical ethics</span>
                    </div>
                    <div className={styles["doctor-term-item"]}>
                      <CheckCircle className={styles["check-icon"]} />
                      <span>I agree to the platform's terms of service and privacy policy</span>
                    </div>
                  </div>
                </div>

                {/* Error and Success Messages */}
                {error && (
                  <div className={styles["doctor-error-message"]}>
                    <p>{error}</p>
                  </div>
                )}

                {success && (
                  <div className={styles["doctor-success-message"]}>
                    <p>{success}</p>
                  </div>
                )}

                {/* Form Actions */}
                <div className={styles["doctor-form-actions"]}>
                  <button 
                    type="submit" 
                    disabled={loading || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.licenseNumber || !formData.specialization || !formData.qualification}
                    className={styles["doctor-register-button"]}
                  >
                    {loading ? (
                      <>
                        <div className={styles["loading-spinner"]}></div>
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Stethoscope className={styles["btn-icon"]} />
                        Register & Send OTP
                      </>
                    )}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => handleNavigation('/doctor-login')}
                    disabled={loading}
                    className={styles["doctor-login-redirect-button"]}
                  >
                    Already registered? Login
                    <ChevronRight className={styles["btn-icon"]} />
                  </button>
                </div>

                <div className={styles["doctor-form-footer"]}>
                  <p>
                    By registering, you agree to our Terms of Service and Privacy Policy. 
                    Your application will be reviewed by our admin team within 1-3 business days.
                  </p>
                </div>
              </form>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className={styles["doctor-footer"]}>
        <div className={styles["doctor-footer-container"]}>
          <div className={styles["doctor-footer-content"]}>
            <div className={styles["doctor-footer-brand"]}>
              <div className={styles["doctor-footer-logo"]}>
                <div className={styles["doctor-logo-icon"]}>
                  <Heart className={styles["doctor-footer-heart"]} />
                </div>
                <h3 className={styles["doctor-footer-title"]}>AYUMATE</h3>
              </div>
              <p className={styles["doctor-footer-desc"]}>
                Your comprehensive Ayurvedic health companion, combining ancient wisdom with modern technology for optimal wellness.
              </p>
            </div>

            <div className={styles["doctor-footer-links"]}>
              <h4 className={styles["doctor-footer-heading"]}>Quick Links</h4>
              <ul className={styles["doctor-footer-list"]}>
                <li><button onClick={() => handleNavigation('/dosha')} className={styles["doctor-footer-link"]}>Prakriti Assessment</button></li>
                <li><button onClick={() => handleNavigation('/chatBot')} className={styles["doctor-footer-link"]}>AI Symptom Checker</button></li>
                <li><button onClick={() => handleNavigation('/patient-register')} className={styles["doctor-footer-link"]}>Patient Portal</button></li>
                <li><button onClick={() => handleNavigation('/doctor-register')} className={styles["doctor-footer-link"]}>Doctor Portal</button></li>
              </ul>
            </div>

            <div className={styles["doctor-footer-features"]}>
              <h4 className={styles["doctor-footer-heading"]}>Features</h4>
              <ul className={styles["doctor-footer-list"]}>
                <li className={styles["doctor-footer-item"]}>Medical Records Storage</li>
                <li className={styles["doctor-footer-item"]}>Doctor Appointments</li>
                <li className={styles["doctor-footer-item"]}>Smart Consultations</li>
                <li className={styles["doctor-footer-item"]}>Health Analytics</li>
              </ul>
            </div>

            <div className={styles["doctor-footer-contact"]}>
              <h4 className={styles["doctor-footer-heading"]}>Support</h4>
              <ul className={styles["doctor-footer-list"]}>
                <li className={styles["doctor-footer-item"]}>24/7 Customer Support</li>
                <li className={styles["doctor-footer-item"]}>Help Center</li>
                <li className={styles["footer-item"]}>Privacy Policy</li>
                <li className={styles["footer-item"]}>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className={styles["footer-bottom"]}>
            <p className={styles["copyright"]}>
              © 2025 AYUMATE. All rights reserved. Empowering health through technology and tradition.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DoctorRegistration;