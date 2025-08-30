import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, EyeOff, Mail, Lock, Heart, AlertCircle, CheckCircle, 
  Menu, X, ChevronRight, Stethoscope,Users, Activity
} from 'lucide-react';
import styles from '../../assets/styles/admin/AdminLogin.module.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

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
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
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
        localStorage.setItem('user', JSON.stringify(data.admin));
        localStorage.setItem('userRole', data.role);
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/admin-dashboard');
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

  return (
    <div className={styles["admin-login-container"]}>
      {/* Header */}
      <header className={styles["header"]}>
        <div className={styles["nav-container"]}>
          <div className={styles["nav-wrapper"]}>
            <div className={styles["logo"]} onClick={() => handleNavigation('/')}>
              <div className={styles["logo-icon"]}>
                <Heart className={styles["logo-heart"]} />
              </div>
              <h1 className={styles["logo-text"]}>AYUMATE</h1>
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
                  onClick={() => handleNavigation('/')}
                  className={styles["home-btn"]}
                >
                  Home
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
                  onClick={() => handleNavigation('/doctor-login')}
                  className={styles["mobile-login"]}
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/')}
                  className={styles["mobile-home"]}
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={styles["admin-login-main"]}>
        <div className={styles["admin-login-background"]}></div>
        
        <div className={styles["admin-login-content"]}>
          {/* Left Side - Branding */}
          <div className={styles["admin-login-branding"]}>
            <div className={styles["admin-login-brand-content"]}>
              <div className={styles["admin-login-brand-logo"]}>
                <div className={styles["brand-icon-container"]}>
                  <Heart className={styles["brand-icon"]} />
                </div>
                <h2 className={styles["brand-title"]}>Admin Portal</h2>
              </div>
              <p className={styles["brand-subtitle"]}>
                Manage your healthcare platform with comprehensive administrative tools and analytics.
              </p>
              <div className={styles["admin-features"]}>
                <div className={styles["admin-feature"]}>
                  <div className={`${styles["feature-icon-bg"]} ${styles["bg-green"]}`}>
                    <Users className={styles["feature-icon-white"]} />
                  </div>
                  <div className={styles["feature-content"]}>
                    <h3>User Management</h3>
                    <p>Manage patients, doctors, and their profiles</p>
                  </div>
                </div>
                <div className={styles["admin-feature"]}>
                  <div className={`${styles["feature-icon-bg"]} ${styles["bg-blue"]}`}>
                    <Activity className={styles["feature-icon-white"]} />
                  </div>
                  <div className={styles["feature-content"]}>
                    <h3>System Analytics</h3>
                    <p>Monitor platform performance and usage</p>
                  </div>
                </div>
                <div className={styles["admin-feature"]}>
                  <div className={`${styles["feature-icon-bg"]} ${styles["bg-purple"]}`}>
                    <Stethoscope className={styles["feature-icon-white"]} />
                  </div>
                  <div className={styles["feature-content"]}>
                    <h3>Healthcare Oversight</h3>
                    <p>Oversee consultations and medical records</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className={styles["admin-login-form-section"]}>
            <div className={styles["admin-login-form-container"]}>
              <div className={styles["admin-login-header"]}>
                <h2 className={styles["admin-login-title"]}>Admin Access</h2>
                <p className={styles["admin-login-subtitle"]}>
                  Sign in to your administrative dashboard
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className={`${styles["alert"]} ${styles["alert-success"]}`}>
                  <CheckCircle className={styles["alert-icon"]} />
                  <span>{success}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className={`${styles["alert"]} ${styles["alert-error"]}`}>
                  <AlertCircle className={styles["alert-icon"]} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles["admin-login-form"]}>
                {/* Email Field */}
                <div className={styles["form-group"]}>
                  <label htmlFor="email" className={styles["form-label"]}>
                    Admin Email
                  </label>
                  <div className={styles["input-wrapper"]}>
                    <Mail className={styles["input-icon"]} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`${styles["form-input"]} ${validationErrors.email ? styles["input-error"] : ''}`}
                      placeholder="Enter your admin email"
                      autoComplete="email"
                    />
                  </div>
                  {validationErrors.email && (
                    <span className={styles["error-text"]}>{validationErrors.email}</span>
                  )}
                </div>

                {/* Password Field */}
                <div className={styles["form-group"]}>
                  <label htmlFor="password" className={styles["form-label"]}>
                    Password
                  </label>
                  <div className={styles["input-wrapper"]}>
                    <Lock className={styles["input-icon"]} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`${styles["form-input"]} ${validationErrors.password ? styles["input-error"] : ''}`}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className={styles["password-toggle"]}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <span className={styles["error-text"]}>{validationErrors.password}</span>
                  )}
                </div>

                {/* Remember Me */}
                <div className={styles["form-options"]}>
                  <label className={styles["checkbox-wrapper"]}>
                    <input type="checkbox" className={styles["checkbox"]} />
                    <span className={styles["checkbox-label"]}>Keep me signed in</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`${styles["submit-btn"]} ${loading ? styles["submit-btn-loading"] : ''}`}
                >
                  {loading ? (
                    <>
                      <div className={styles["spinner"]}></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Access Dashboard</span>
                      <ChevronRight className={styles["btn-icon"]} />
                    </>
                  )}
                </button>
              </form>

              {/* Role Switch Links */}
              <div className={styles["role-switch"]}>
                <p className={styles["role-text"]}>Sign in as:</p>
                <div className={styles["role-links"]}>
                  <button 
                    onClick={() => handleNavigation('/patient-login')}
                    className={styles["role-link"]}
                  >
                    Patient
                  </button>
                  <span className={styles["role-divider"]}>|</span>
                  <button 
                    onClick={() => handleNavigation('/doctor-login')}
                    className={styles["role-link"]}
                  >
                    Doctor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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

export default AdminLogin;