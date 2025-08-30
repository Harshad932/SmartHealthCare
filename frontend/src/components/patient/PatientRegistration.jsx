import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart,  ChevronRight, Leaf, UserCheck,CheckCircle, Menu, X
} from 'lucide-react';
import styles from  "../../assets/styles/patient/Registration.module.css";

const PatientRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Registration Form, 2: OTP Verification
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    allergies: '',
    medicalHistory: ''
  });
  
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

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

    try {
      const response = await fetch(`${API_BASE_URL}/patient/register`, {
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

      setSuccess('OTP sent to your email! Please verify to complete registration.');
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
      const response = await fetch(`${API_BASE_URL}/patient/verify-otp`, {
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

      setSuccess('Registration completed successfully!');
      setTimeout(() => {
        navigate('/patient-login');
      }, 2000);

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
      const response = await fetch(`${API_BASE_URL}/patient/resend-otp`, {
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

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className={styles["home-container"]}>
      {/* Header */}
      <header className={styles["header"]}>
        <div className={styles["nav-container"]}>
          <div className={styles["nav-wrapper"]}>
            <div className={styles["logo"]}>
              <div className={styles["logo-icon"]}>
                <Heart className={styles["logo-heart"]} />
              </div>
              <h1 className={styles["logo-text"]} onClick={() => handleNavigation('/')}>AYUMATE</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className={styles["desktop-nav"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={styles["nav-link"]}
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={styles["nav-link"]}
              >
                AI Symptom Checker
              </button>
              <div className={styles["auth-buttons"]}>
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className={styles["login-btn"]}
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className={styles["login-btn"]}
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className={styles["admin-btn"]}
                >
                  Admin
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={styles["mobile-menu-btn"]}
            >
              {isMenuOpen ? <X className={styles["menu-icon"]} /> : <Menu className={styles["menu-icon"]} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={styles["mobile-nav"]}>
            <div className={styles["mobile-nav-container"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={styles["mobile-nav-link"]}
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={styles["mobile-nav-link"]}
              >
                AI Symptom Checker
              </button>
              <div className={styles["mobile-auth"]}>
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className={styles["mobile-login"]}
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/patient-register')}
                  className={styles["mobile-register"]}
                >
                  Patient Register
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className={styles["mobile-login"]}
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-register')}
                  className={styles["mobile-register"]}
                >
                  Doctor Register
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className={styles["mobile-admin"]}
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Registration Content */}
      {currentStep === 2 ? (
        // OTP Verification Step
        <section className={styles["hero"]}>
          <div className={styles["hero-bg"]}></div>
          <div className={styles["hero-container"]}>
            <div className={styles["hero-content"]}>
              <div className={styles["registration-container"]}>
                <div className={styles["registration-header"]}>
                  <div className={`${styles["feature-icon-container"]} ${styles["bg-green"]}`}>
                    <Leaf className={styles["feature-icon-white"]} />
                  </div>
                  <h1 className={styles["hero-title"]}>
                    <span className={styles["hero-highlight"]}>Verify Your Email</span>
                  </h1>
                  <p className={styles["hero-subtitle"]}>Enter the 6-digit code sent to {formData.email}</p>
                </div>

                <form onSubmit={handleOtpSubmit} className={styles["otp-form"]}>
                  <div className={`${styles["access-card"]} ${styles["access-card-green"]}`}>
                    <div className={styles["otp-group"]}>
                      <label htmlFor="otp" className={styles["card-title"]}>Verification Code</label>
                      <input
                        type="text"
                        id="otp"
                        name="otp"
                        value={otp}
                        onChange={handleOtpChange}
                        placeholder="Enter 6-digit code"
                        maxLength="6"
                        className={styles["form-input"]}
                        disabled={loading}
                        autoComplete="one-time-code"
                      />
                    </div>

                    <div className={styles["timer-section"]}>
                      {!canResendOtp ? (
                        <p className={styles["card-desc"]}>Code expires in: {formatTime(otpTimer)}</p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={loading}
                          className={styles["cta-secondary"]}
                        >
                          Resend Code
                        </button>
                      )}
                    </div>

                    {error && (
                      <div className={styles["error-message"]}>
                        <p className={styles["point-desc"]}>{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className={styles["success-message"]}>
                        <p className={styles["point-desc"]}>{success}</p>
                      </div>
                    )}

                    <div className={styles["form-actions"]}>
                      <button 
                        type="submit" 
                        disabled={loading || otp.length !== 6}
                        className={styles["cta-primary"]}
                      >
                        <CheckCircle className={styles["btn-icon"]} />
                        {loading ? 'Verifying...' : 'Verify & Complete Registration'}
                      </button>
                      
                      <button 
                        type="button" 
                        onClick={() => setCurrentStep(1)}
                        disabled={loading}
                        className={styles["cta-secondary"]}
                      >
                        <ChevronRight className={styles["btn-icon"]} />
                        Back to Registration
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      ) : (
        // Registration Form Step
        <section className={styles["hero"]}>
          <div className={styles["hero-bg"]}></div>
          <div className={styles["hero-container"]}>
            <div className={styles["hero-content"]}>
              <div className={styles["registration-container"]}>
                <div className={styles["registration-header"]}>
                  <div className={`${styles["feature-icon-container"]} ${styles["bg-green"]}`}>
                    <UserCheck className={styles["feature-icon-white"]} />
                  </div>
                  <h1 className={styles["hero-title"]}>
                    <span className={styles["hero-highlight"]}>Patient Registration</span>
                  </h1>
                  <p className={styles["hero-subtitle"]}>Create your account to access the Smart Healthcare Portal</p>
                </div>

                <form onSubmit={handleSubmit} className={styles["registration-form"]}>
                  
                  {/* Basic Information Section */}
                  <div className={styles["feature-card"]}>
                    <h2 className={styles["feature-title"]}>Basic Information</h2>
                    
                    <div className={styles["hero-actions"]}>
                      <div className={`${styles["access-card"]} ${styles["access-card-blue"]}`}>
                        <label htmlFor="firstName" className={styles["card-title"]}>First Name *</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className={styles["form-input"]}
                        />
                      </div>
                      
                      <div className={`${styles["access-card"]} ${styles["access-card-blue"]}`}>
                        <label htmlFor="lastName" className={styles["card-title"]}>Last Name *</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className={styles["form-input"]}
                        />
                      </div>
                    </div>

                    <div className={`${styles["access-card"]} ${styles["access-card-green"]}`}>
                      <label htmlFor="email" className={styles["card-title"]}>Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className={styles["form-input"]}
                      />
                    </div>

                    <div className={styles["hero-actions"]}>
                      <div className={`${styles["access-card"]} ${styles["access-card-purple"]}`}>
                        <label htmlFor="password" className={styles["card-title"]}>Password *</label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className={styles["form-input"]}
                          minLength="6"
                        />
                      </div>
                      
                      <div className={`${styles["access-card"]} ${styles["access-card-purple"]}`}>
                        <label htmlFor="confirmPassword" className={styles["card-title"]}>Confirm Password *</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className={styles["form-input"]}
                          minLength="6"
                        />
                      </div>
                    </div>

                    <div className={styles["hero-actions"]}>
                      <div className={`${styles["access-card"]} ${styles["access-card-orange"]}`}>
                        <label htmlFor="phone" className={styles["card-title"]}>Phone Number</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={loading}
                          className={styles["form-input"]}
                        />
                      </div>
                      
                      <div className={`${styles["access-card"]} ${styles["access-card-orange"]}`}>
                        <label htmlFor="dateOfBirth" className={styles["card-title"]}>Date of Birth</label>
                        <input
                          type="date"
                          id="dateOfBirth"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          disabled={loading}
                          className={styles["form-input"]}
                        />
                      </div>
                    </div>

                    <div className={styles["hero-actions"]}>
                      <div className={`${styles["access-card"]} ${styles["access-card-blue"]}`}>
                        <label htmlFor="gender" className={styles["card-title"]}>Gender</label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          disabled={loading}
                          className={styles["form-select"]}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                      
                      <div className={`${styles["access-card"]} ${styles["access-card-blue"]}`}>
                        <label htmlFor="bloodGroup" className={styles["card-title"]}>Blood Group</label>
                        <select
                          id="bloodGroup"
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          disabled={loading}
                          className={styles["form-select"]}
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    </div>

                    <div className={`${styles["access-card"]} ${styles["access-card-green"]}`}>
                      <label htmlFor="address" className={styles["card-title"]}>Address</label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={loading}
                        className={styles["form-textarea"]}
                        rows="3"
                        placeholder="Enter your full address"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact Section */}
                  <div className={styles["feature-card"]}>
                    <h2 className={styles["feature-title"]}>Emergency Contact</h2>
                    
                    <div className={styles["hero-actions"]}>
                      <div className={`${styles["access-card"]} ${styles["access-card-purple"]}`}>
                        <label htmlFor="emergencyContactName" className={styles["card-title"]}>Emergency Contact Name</label>
                        <input
                          type="text"
                          id="emergencyContactName"
                          name="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={handleChange}
                          disabled={loading}
                          className={styles["form-input"]}
                        />
                      </div>
                      
                      <div className={`${styles["access-card"]} ${styles["access-card-purple"]}`}>
                        <label htmlFor="emergencyContactPhone" className={styles["card-title"]}>Emergency Contact Phone</label>
                        <input
                          type="tel"
                          id="emergencyContactPhone"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleChange}
                          disabled={loading}
                          className={styles["form-input"]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medical Information Section */}
                  <div className={styles["feature-card"]}>
                    <h2 className={styles["feature-title"]}>Medical Information</h2>
                    
                    <div className={`${styles["access-card"]} ${styles["access-card-orange"]}`}>
                      <label htmlFor="allergies" className={styles["card-title"]}>Allergies</label>
                      <textarea
                        id="allergies"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        disabled={loading}
                        className={styles["form-textarea"]}
                        rows="3"
                        placeholder="List any allergies you have (medications, food, environmental, etc.)"
                      />
                    </div>

                    <div className={`${styles["access-card"]} ${styles["access-card-orange"]}`}>
                      <label htmlFor="medicalHistory" className={styles["card-title"]}>Medical History</label>
                      <textarea
                        id="medicalHistory"
                        name="medicalHistory"
                        value={formData.medicalHistory}
                        onChange={handleChange}
                        disabled={loading}
                        className={styles["form-textarea"]}
                        rows="4"
                        placeholder="Brief medical history (chronic conditions, surgeries, etc.)"
                      />
                    </div>
                  </div>

                  {/* Error and Success Messages */}
                  {error && (
                    <div className={`${styles["access-card"]} ${styles["access-card-purple"]}`}>
                      <p className={styles["point-desc"]}>{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className={`${styles["access-card"]} ${styles["access-card-green"]}`}>
                      <p className={styles["point-desc"]}>{success}</p>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className={styles["hero-actions"]}>
                    <button 
                      type="submit" 
                      disabled={loading || !formData.email || !formData.password || !formData.firstName || !formData.lastName}
                      className={styles["cta-primary"]}
                    >
                      <UserCheck className={styles["btn-icon"]} />
                      {loading ? 'Sending OTP...' : 'Register & Send OTP'}
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => handleNavigation('/patient-login')}
                      disabled={loading}
                      className={styles["cta-secondary"]}
                    >
                      <ChevronRight className={styles["btn-icon"]} />
                      Already have an account? Login
                    </button>
                  </div>

                  <div className={`${styles["access-card"]} ${styles["access-card-blue"]}`}>
                    <p className={styles["point-desc"]}>
                      By registering, you agree to our Terms of Service and Privacy Policy. 
                      All medical information is kept confidential and secure.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className={styles["footer"]}>
        <div className={styles["footer-container"]}>
          <div className={styles["footer-content"]}>
            <div className={styles["footer-brand"]}>
              <div className={styles["footer-logo"]}>
                <div className={styles["logo-icon"]}>
                  <Heart className={styles["footer-heart"]} />
                </div>
                <h3 className={styles["footer-title"]}>AYUMATE</h3>
              </div>
              <p className={styles["footer-desc"]}>
                Your comprehensive Ayurvedic health companion, combining ancient wisdom with modern technology for optimal wellness.
              </p>
            </div>

            <div className={styles["footer-links"]}>
              <h4 className={styles["footer-heading"]}>Quick Links</h4>
              <ul className={styles["footer-list"]}>
                <li><button onClick={() => handleNavigation('/dosha')} className={styles["footer-link"]}>Prakriti Assessment</button></li>
                <li><button onClick={() => handleNavigation('/chatBot')} className={styles["footer-link"]}>AI Symptom Checker</button></li>
                <li><button onClick={() => handleNavigation('/patient-register')} className={styles["footer-link"]}>Patient Portal</button></li>
                <li><button onClick={() => handleNavigation('/doctor-register')} className={styles["footer-link"]}>Doctor Portal</button></li>
              </ul>
            </div>

            <div className={styles["footer-features"]}>
              <h4 className={styles["footer-heading"]}>Features</h4>
              <ul className={styles["footer-list"]}>
                <li className={styles["footer-item"]}>Medical Records Storage</li>
                <li className={styles["footer-item"]}>Doctor Appointments</li>
                <li className={styles["footer-item"]}>Smart Consultations</li>
                <li className={styles["footer-item"]}>Health Analytics</li>
              </ul>
            </div>

            <div className={styles["footer-contact"]}>
              <h4 className={styles["footer-heading"]}>Support</h4>
              <ul className={styles["footer-list"]}>
                <li className={styles["footer-item"]}>24/7 Customer Support</li>
                <li className={styles["footer-item"]}>Help Center</li>
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

export default PatientRegistration;