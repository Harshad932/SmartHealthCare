import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, EyeOff, Mail, Lock, Heart, AlertCircle, CheckCircle, 
  Menu, X, Leaf, Brain, ChevronRight,Stethoscope,  Users 
} from 'lucide-react';
import styles from  '../../assets/styles/patient/Login.module.css';

const PatientLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error
    if (error) setError('');
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/patient/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Login successful! Redirecting...');
        
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.patient));
        localStorage.setItem('userRole', data.role);
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/patient-dashboard');
        }, 1500);
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className={styles["patient-login-container"]}>
      <div className={styles["patient-login-background-overlay"]}></div>
      
      {/* Header */}
      <header className={styles["patient-login-header"]}>
        <div className={styles["patient-login-nav-container"]}>
          <div className={styles["patient-login-nav-wrapper"]}>
            <div className={styles["patient-login-logo"]}>
              <div className={styles["patient-login-logo-icon"]}>
                <Heart className={styles["patient-login-logo-heart"]} />
              </div>
              <h1 className={styles["patient-login-logo-text"]} onClick={() => handleNavigation('/')}>AYUMATE</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className={styles["patient-login-desktop-nav"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={styles["patient-login-nav-link"]}
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={styles["patient-login-nav-link"]}
              >
                AI Symptom Checker
              </button>
              <div className={styles["patient-login-auth-buttons"]}>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className={styles["patient-login-login-btn"]}
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className={styles["patient-login-admin-btn"]}
                >
                  Admin
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={styles["patient-login-mobile-menu-btn"]}
            >
              {isMenuOpen ? <X className={styles["patient-login-menu-icon"]} /> : <Menu className={styles["patient-login-menu-icon"]} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={styles["patient-login-mobile-nav"]}>
            <div className={styles["patient-login-mobile-nav-container"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={styles["patient-login-mobile-nav-link"]}
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={styles["patient-login-mobile-nav-link"]}
              >
                AI Symptom Checker
              </button>
              <div className={styles["patient-login-mobile-auth"]}>
                <button 
                  onClick={() => handleNavigation('/patient-register')}
                  className={styles["patient-login-mobile-register"]}
                >
                  Patient Register
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className={styles["patient-login-mobile-login"]}
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-register')}
                  className={styles["patient-login-mobile-register"]}
                >
                  Doctor Register
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className={styles["patient-login-mobile-admin"]}
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      
      <div className={styles["patient-login-content-wrapper"]}>
        {/* Left Side - Branding */}
        <div className={styles["patient-login-branding-section"]}>
          <div className={styles["patient-login-branding-content"]}>
            <div className={styles["patient-login-brand-logo-container"]}>
              <Heart className={styles["patient-login-brand-logo-icon"]} />
              <h1 className={styles["patient-login-brand-title"]}>Ayumate</h1>
            </div>
            <p className={styles["patient-login-brand-subtitle"]}>
              Your health, our priority. Connect with specialists and manage your healthcare journey through personalized Ayurvedic care.
            </p>
            <div className={styles["patient-login-features-list"]}>
              <div className={styles["patient-login-feature-item"]}>
                <CheckCircle className={styles["patient-login-feature-icon"]} />
                <span>AI-powered symptom analysis</span>
              </div>
              <div className={styles["patient-login-feature-item"]}>
                <CheckCircle className={styles["patient-login-feature-icon"]} />
                <span>Personalized Prakriti assessment</span>
              </div>
              <div className={styles["patient-login-feature-item"]}>
                <CheckCircle className={styles["patient-login-feature-icon"]} />
                <span>Easy appointment booking</span>
              </div>
              <div className={styles["patient-login-feature-item"]}>
                <CheckCircle className={styles["patient-login-feature-icon"]} />
                <span>Secure medical records</span>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className={styles["patient-login-stats-grid"]}>
              <div className={`${styles["patient-login-stat-card"]} ${styles["patient-login-stat-green"]}`}>
                <Users className={styles["patient-login-stat-icon"]} />
                <div className={styles["patient-login-stat-number"]}>10K+</div>
                <div className={styles["patient-login-stat-label"]}>Happy Patients</div>
              </div>
              <div className={`${styles["patient-login-stat-card"]} ${styles["patient-login-stat-blue"]}`}>
                <Stethoscope className={styles["patient-login-stat-icon"]} />
                <div className={styles["patient-login-stat-number"]}>500+</div>
                <div className={styles["patient-login-stat-label"]}>Expert Doctors</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className={styles["patient-login-form-section"]}>
          <div className={styles["patient-login-form-container"]}>
            <div className={styles["patient-login-form-header"]}>
              <h2 className={styles["patient-login-form-title"]}>Welcome Back</h2>
              <p className={styles["patient-login-form-subtitle"]}>
                Sign in to your patient account to continue your health journey
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className={`${styles["patient-login-alert"]} ${styles["patient-login-alert-success"]}`}>
                <CheckCircle className={styles["patient-login-alert-icon"]} />
                <span>{success}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={`${styles["patient-login-alert"]} ${styles["patient-login-alert-error"]}`}>
                <AlertCircle className={styles["patient-login-alert-icon"]} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles["patient-login-form"]}>
              {/* Email Field */}
              <div className={styles["patient-login-form-group"]}>
                <label htmlFor="email" className={styles["patient-login-label"]}>
                  Email Address
                </label>
                <div className={styles["patient-login-input-wrapper"]}>
                  <Mail className={styles["patient-login-input-icon"]} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`${styles["patient-login-input"]} ${validationErrors.email ? styles["patient-login-input-error"] : ''}`}
                    placeholder="Enter your email address"
                    autoComplete="email"
                  />
                </div>
                {validationErrors.email && (
                  <span className={styles["patient-login-error-text"]}>{validationErrors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div className={styles["patient-login-form-group"]}>
                <label htmlFor="password" className={styles["patient-login-label"]}>
                  Password
                </label>
                <div className={styles["patient-login-input-wrapper"]}>
                  <Lock className={styles["patient-login-input-icon"]} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${styles["patient-login-input"]} ${validationErrors.password ? styles["patient-login-input-error"] : ''}`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className={styles["patient-login-password-toggle"]}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {validationErrors.password && (
                  <span className={styles["patient-login-error-text"]}>{validationErrors.password}</span>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className={styles["patient-login-form-options"]}>
                <label className={styles["patient-login-checkbox-wrapper"]}>
                  <input type="checkbox" className={styles["patient-login-checkbox"]} />
                  <span className={styles["patient-login-checkbox-label"]}>Remember me</span>
                </label>
                <Link to="/forgot-password" className={styles["patient-login-forgot-link"]}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`${styles["patient-login-submit-btn"]} ${loading ? styles["patient-login-submit-btn-loading"] : ''}`}
              >
                {loading ? (
                  <>
                    <div className={styles["patient-login-spinner"]}></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className={styles["patient-login-signup-prompt"]}>
              <p>
                Don't have an account?{' '}
                <Link to="/patient-register" className={styles["patient-login-signup-link"]}>
                  Sign up for free
                </Link>
              </p>
            </div>

            {/* Role Switch Links */}
            <div className={styles["patient-login-role-switch"]}>
              <p className={styles["patient-login-role-text"]}>Sign in as:</p>
              <div className={styles["patient-login-role-links"]}>
                <Link to="/doctor-login" className={styles["patient-login-role-link"]}>
                  Doctor
                </Link>
                <span className={styles["patient-login-role-divider"]}>|</span>
                <Link to="/admin-login" className={styles["patient-login-role-link"]}>
                  Admin
                </Link>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className={styles["patient-login-quick-actions"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={`${styles["patient-login-quick-action-btn"]} ${styles["patient-login-quick-action-green"]}`}
              >
                <Leaf className={styles["patient-login-quick-icon"]} />
                <span>Check Your Prakriti</span>
                <ChevronRight className={styles["patient-login-quick-arrow"]} />
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={`${styles["patient-login-quick-action-btn"]} ${styles["patient-login-quick-action-blue"]}`}
              >
                <Brain className={styles["patient-login-quick-icon"]} />
                <span>AI Health Check</span>
                <ChevronRight className={styles["patient-login-quick-arrow"]} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles["patient-login-footer"]}>
        <div className={styles["patient-login-footer-container"]}>
          <div className={styles["patient-login-footer-content"]}>
            <div className={styles["patient-login-footer-brand"]}>
              <div className={styles["patient-login-footer-logo"]}>
                <div className={styles["patient-login-footer-logo-icon"]}>
                  <Heart className={styles["patient-login-footer-heart"]} />
                </div>
                <h3 className={styles["patient-login-footer-title"]}>AYUMATE</h3>
              </div>
              <p className={styles["patient-login-footer-desc"]}>
                Your comprehensive Ayurvedic health companion, combining ancient wisdom with modern technology for optimal wellness.
              </p>
            </div>

            <div className={styles["patient-login-footer-links"]}>
              <h4 className={styles["patient-login-footer-heading"]}>Quick Links</h4>
              <ul className={styles["patient-login-footer-list"]}>
                <li><button onClick={() => handleNavigation('/dosha')} className={styles["patient-login-footer-link"]}>Prakriti Assessment</button></li>
                <li><button onClick={() => handleNavigation('/chatBot')} className={styles["patient-login-footer-link"]}>AI Symptom Checker</button></li>
                <li><button onClick={() => handleNavigation('/patient-register')} className={styles["patient-login-footer-link"]}>Patient Portal</button></li>
                <li><button onClick={() => handleNavigation('/doctor-register')} className={styles["patient-login-footer-link"]}>Doctor Portal</button></li>
              </ul>
            </div>

            <div className={styles["patient-login-footer-features"]}>
              <h4 className={styles["patient-login-footer-heading"]}>Features</h4>
              <ul className={styles["patient-login-footer-list"]}>
                <li className={styles["patient-login-footer-item"]}>Medical Records Storage</li>
                <li className={styles["patient-login-footer-item"]}>Doctor Appointments</li>
                <li className={styles["patient-login-footer-item"]}>Smart Consultations</li>
                <li className={styles["patient-login-footer-item"]}>Health Analytics</li>
              </ul>
            </div>

            <div className={styles["patient-login-footer-contact"]}>
              <h4 className={styles["patient-login-footer-heading"]}>Support</h4>
              <ul className={styles["patient-login-footer-list"]}>
                <li className={styles["patient-login-footer-item"]}>24/7 Customer Support</li>
                <li className={styles["patient-login-footer-item"]}>Help Center</li>
                <li className={styles["patient-login-footer-item"]}>Privacy Policy</li>
                <li className={styles["patient-login-footer-item"]}>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className={styles["patient-login-footer-bottom"]}>
            <p className={styles["patient-login-copyright"]}>
              © 2025 AYUMATE. All rights reserved. Empowering health through technology and tradition.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PatientLogin;