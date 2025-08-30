import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../assets/styles/doctor/DoctorLogin.module.css';
import { 
  Heart, Menu, X, Eye, EyeOff, Mail, Lock, 
  LogIn, UserPlus, Home, HelpCircle, Shield,
  AlertCircle, Loader2
} from 'lucide-react';

const DoctorLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navigate = useNavigate();

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/doctor/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('doctorToken', data.token);
      localStorage.setItem('doctorData', JSON.stringify({
        id: data.doctor.doctor_id,
        email: data.doctor.email,
        firstName: data.doctor.first_name,
        lastName: data.doctor.last_name,
        specialization: data.doctor.specialization,
        approvalStatus: data.doctor.approval_status
      }));

      // Redirect based on approval status
      if (data.doctor.approval_status === 'approved') {
        navigate('/doctor-dashboard');
      } else if (data.doctor.approval_status === 'pending') {
        navigate('/doctor/pending-approval');
      } else {
        navigate('/doctor/application-rejected');
      }

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
    <div className={styles["doctor-login-container"]}>
      {/* Header */}
      <header className={styles["doctor-header"]}>
        <div className={styles["doctor-nav-container"]}>
          <div className={styles["doctor-nav-wrapper"]}>
            <div className={styles["doctor-logo"]}>
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
                  onClick={() => handleNavigation('/doctor-register')}
                  className={styles["doctor-register-btn"]}
                >
                  Doctor Register
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
                  onClick={() => handleNavigation('/doctor-register')}
                  className={styles["doctor-mobile-register"]}
                >
                  Doctor Register
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
        <div className={styles["doctor-login-background"]}></div>
        
        <div className={styles["doctor-login-wrapper"]}>
          {/* Login Card */}
          <div className={styles["doctor-login-card"]}>
            {/* Card Header */}
            <div className={styles["doctor-login-card-header"]}>
              <div className={styles["doctor-login-icon-container"]}>
                <div className={styles["doctor-login-icon-bg"]}>
                  <Heart className={styles["doctor-login-icon"]} />
                </div>
              </div>
              <h2 className={styles["doctor-login-title"]}>Doctor Portal</h2>
              <p className={styles["doctor-login-subtitle"]}>
                Welcome back! Please sign in to access your medical dashboard
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className={styles["doctor-login-form"]}>
              {/* Email Field */}
              <div className={styles["doctor-form-group"]}>
                <label htmlFor="email" className={styles["doctor-form-label"]}>
                  Email Address
                  <span className={styles["doctor-required"]}>*</span>
                </label>
                <div className={styles["doctor-input-wrapper"]}>
                  <div className={styles["doctor-input-icon"]}>
                    <Mail className={styles["doctor-icon"]} />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="doctor@example.com"
                    className={styles["doctor-input"]}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className={styles["doctor-form-group"]}>
                <label htmlFor="password" className={styles["doctor-form-label"]}>
                  Password
                  <span className={styles["doctor-required"]}>*</span>
                </label>
                <div className={styles["doctor-input-wrapper"]}>
                  <div className={styles["doctor-input-icon"]}>
                    <Lock className={styles["doctor-icon"]} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Enter your password"
                    className={styles["doctor-input"]}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles["doctor-password-toggle"]}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className={styles["doctor-toggle-icon"]} />
                    ) : (
                      <Eye className={styles["doctor-toggle-icon"]} />
                    )}
                  </button>
                </div>
              </div>

              {/* Form Options */}
              <div className={styles["doctor-form-options"]}>
                <label className={styles["doctor-checkbox-wrapper"]}>
                  <input
                    type="checkbox"
                    className={styles["doctor-checkbox"]}
                    disabled={loading}
                  />
                  <span className={styles["doctor-checkbox-checkmark"]}></span>
                  <span className={styles["doctor-checkbox-label"]}>Remember me</span>
                </label>
                
                <button
                  type="button"
                  // onClick={() => navigate('/doctor/forgot-password')}
                  className={styles["doctor-forgot-link"]}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className={styles["doctor-error-message"]}>
                  <AlertCircle className={styles["doctor-error-icon"]} />
                  <p className={styles["doctor-error-text"]}>{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !formData.email || !formData.password}
                className={styles["doctor-submit-button"]}
              >
                {loading ? (
                  <div className={styles["doctor-loading-content"]}>
                    <Loader2 className={styles["doctor-spinner"]} />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className={styles["doctor-button-content"]}>
                    <LogIn className={styles["doctor-btn-icon"]} />
                    <span>Sign In to Portal</span>
                  </div>
                )}
              </button>
            </form>

            {/* Registration Link */}
            <div className={styles["doctor-register-section"]}>
              <p className={styles["doctor-register-text"]}>
                Don't have an account?
                <button
                  type="button"
                  onClick={() => navigate('/doctor-register')}
                  className={styles["doctor-register-link"]}
                  disabled={loading}
                >
                  <UserPlus className={styles["doctor-register-icon"]} />
                  Register as Doctor
                </button>
              </p>
            </div>
          </div>

          {/* Side Features */}
          <div className={styles["doctor-features-panel"]}>
            <div className={styles["doctor-feature-item"]}>
              <div className={`${styles["doctor-feature-icon"]} ${styles["doctor-feature-green"]}`}>
                <Shield className={styles["doctor-feature-svg"]} />
              </div>
              <div className={styles["doctor-feature-content"]}>
                <h3 className={styles["doctor-feature-title"]}>Secure & Private</h3>
                <p className={styles["doctor-feature-desc"]}>Your data is protected with enterprise-grade security</p>
              </div>
            </div>
            
            <div className={styles["doctor-feature-item"]}>
              <div className={`${styles["doctor-feature-icon"]} ${styles["doctor-feature-blue"]}`}>
                <Heart className={styles["doctor-feature-svg"]} />
              </div>
              <div className={styles["doctor-feature-content"]}>
                <h3 className={styles["doctor-feature-title"]}>Patient Care</h3>
                <p className={styles["doctor-feature-desc"]}>Comprehensive tools for better patient management</p>
              </div>
            </div>
            
            <div className={styles["doctor-feature-item"]}>
              <div className={`${styles["doctor-feature-icon"]} ${styles["doctor-feature-purple"]}`}>
                <HelpCircle className={styles["doctor-feature-svg"]} />
              </div>
              <div className={styles["doctor-feature-content"]}>
                <h3 className={styles["doctor-feature-title"]}>24/7 Support</h3>
                <p className={styles["doctor-feature-desc"]}>Round-the-clock assistance for all your needs</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles["doctor-footer"]}>
        <div className={styles["doctor-footer-container"]}>
          <div className={styles["doctor-footer-content"]}>
            <div className={styles["doctor-footer-brand"]}>
              <div className={styles["doctor-footer-logo"]}>
                <div className={styles["doctor-footer-logo-icon"]}>
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
                <li><button onClick={() => handleNavigation('/doctor-register')} className={styles["doctor-footer-link"]}>Doctor Register</button></li>
              </ul>
            </div>

            <div className={styles["doctor-footer-features"]}>
              <h4 className={styles["doctor-footer-heading"]}>Doctor Features</h4>
              <ul className={styles["doctor-footer-list"]}>
                <li className={styles["doctor-footer-item"]}>Patient Management</li>
                <li className={styles["doctor-footer-item"]}>Consultation Tools</li>
                <li className={styles["doctor-footer-item"]}>Medical Records</li>
                <li className={styles["doctor-footer-item"]}>Analytics Dashboard</li>
              </ul>
            </div>

            <div className={styles["doctor-footer-contact"]}>
              <h4 className={styles["doctor-footer-heading"]}>Support</h4>
              <ul className={styles["doctor-footer-list"]}>
                <li className={styles["doctor-footer-item"]}>24/7 Doctor Support</li>
                <li className={styles["doctor-footer-item"]}>Help Center</li>
                <li className={styles["doctor-footer-item"]}>Privacy Policy</li>
                <li className={styles["doctor-footer-item"]}>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className={styles["doctor-footer-bottom"]}>
            <div className={styles["doctor-footer-navigation"]}>
              <button
                onClick={() => handleNavigation('/')}
                className={styles["doctor-footer-nav-link"]}
              >
                <Home className={styles["doctor-footer-nav-icon"]} />
                Back to Home
              </button>
              
              <span className={styles["doctor-footer-divider"]}>•</span>
              
              <a href="/help" className={styles["doctor-footer-nav-link"]}>
                Help & Support
              </a>
              
              <span className={styles["doctor-footer-divider"]}>•</span>
              
              <a href="/privacy" className={styles["doctor-footer-nav-link"]}>
                Privacy Policy
              </a>
            </div>
            
            <p className={styles["doctor-copyright"]}>
              © 2025 AYUMATE. All rights reserved. Empowering healthcare through technology and tradition.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className={styles["doctor-security-notice"]}>
          <div className={styles["doctor-security-icon"]}>
            <Shield className={styles["doctor-security-shield"]} />
          </div>
          <p className={styles["doctor-security-text"]}>
            Your login is secured with 256-bit SSL encryption
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DoctorLogin;