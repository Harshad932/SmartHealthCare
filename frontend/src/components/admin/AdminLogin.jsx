import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, EyeOff, Mail, Lock, Heart, AlertCircle, CheckCircle, 
  Menu, X, ChevronRight, Leaf, Brain, UserCheck, Stethoscope,
  Users, Activity, FileText, Calendar, Mic, Cloud
} from 'lucide-react';
import '../../assets/styles/admin/AdminLogin.css';

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
    <div className="admin-login-container">
      {/* Header */}
      <header className="header">
        <div className="nav-container">
          <div className="nav-wrapper">
            <div className="logo" onClick={() => handleNavigation('/')}>
              <div className="logo-icon">
                <Heart className="logo-heart" />
              </div>
              <h1 className="logo-text">AYUMATE</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="desktop-nav">
              <button 
                onClick={() => handleNavigation('/dosha')}
                className="nav-link"
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className="nav-link"
              >
                AI Symptom Checker
              </button>
              <div className="auth-buttons">
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className="login-btn"
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className="login-btn"
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/')}
                  className="home-btn"
                >
                  Home
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="mobile-menu-btn"
            >
              {isMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mobile-nav">
            <div className="mobile-nav-container">
              <button 
                onClick={() => handleNavigation('/dosha')}
                className="mobile-nav-link"
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className="mobile-nav-link"
              >
                AI Symptom Checker
              </button>
              <div className="mobile-auth">
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className="mobile-login"
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className="mobile-login"
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/')}
                  className="mobile-home"
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="admin-login-main">
        <div className="admin-login-background"></div>
        
        <div className="admin-login-content">
          {/* Left Side - Branding */}
          <div className="admin-login-branding">
            <div className="admin-login-brand-content">
              <div className="admin-login-brand-logo">
                <div className="brand-icon-container">
                  <Heart className="brand-icon" />
                </div>
                <h2 className="brand-title">Admin Portal</h2>
              </div>
              <p className="brand-subtitle">
                Manage your healthcare platform with comprehensive administrative tools and analytics.
              </p>
              <div className="admin-features">
                <div className="admin-feature">
                  <div className="feature-icon-bg bg-green">
                    <Users className="feature-icon-white" />
                  </div>
                  <div className="feature-content">
                    <h3>User Management</h3>
                    <p>Manage patients, doctors, and their profiles</p>
                  </div>
                </div>
                <div className="admin-feature">
                  <div className="feature-icon-bg bg-blue">
                    <Activity className="feature-icon-white" />
                  </div>
                  <div className="feature-content">
                    <h3>System Analytics</h3>
                    <p>Monitor platform performance and usage</p>
                  </div>
                </div>
                <div className="admin-feature">
                  <div className="feature-icon-bg bg-purple">
                    <Stethoscope className="feature-icon-white" />
                  </div>
                  <div className="feature-content">
                    <h3>Healthcare Oversight</h3>
                    <p>Oversee consultations and medical records</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="admin-login-form-section">
            <div className="admin-login-form-container">
              <div className="admin-login-header">
                <h2 className="admin-login-title">Admin Access</h2>
                <p className="admin-login-subtitle">
                  Sign in to your administrative dashboard
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="alert alert-success">
                  <CheckCircle className="alert-icon" />
                  <span>{success}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-error">
                  <AlertCircle className="alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="admin-login-form">
                {/* Email Field */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Admin Email
                  </label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
                      placeholder="Enter your admin email"
                      autoComplete="email"
                    />
                  </div>
                  {validationErrors.email && (
                    <span className="error-text">{validationErrors.email}</span>
                  )}
                </div>

                {/* Password Field */}
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="password-toggle"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <span className="error-text">{validationErrors.password}</span>
                  )}
                </div>

                {/* Remember Me */}
                <div className="form-options">
                  <label className="checkbox-wrapper">
                    <input type="checkbox" className="checkbox" />
                    <span className="checkbox-label">Keep me signed in</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`submit-btn ${loading ? 'submit-btn-loading' : ''}`}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Access Dashboard</span>
                      <ChevronRight className="btn-icon" />
                    </>
                  )}
                </button>
              </form>

              {/* Role Switch Links */}
              <div className="role-switch">
                <p className="role-text">Sign in as:</p>
                <div className="role-links">
                  <button 
                    onClick={() => handleNavigation('/patient-login')}
                    className="role-link"
                  >
                    Patient
                  </button>
                  <span className="role-divider">|</span>
                  <button 
                    onClick={() => handleNavigation('/doctor-login')}
                    className="role-link"
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
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon">
                  <Heart className="footer-heart" />
                </div>
                <h3 className="footer-title">AYUMATE</h3>
              </div>
              <p className="footer-desc">
                Your comprehensive Ayurvedic health companion, combining ancient wisdom with modern technology for optimal wellness.
              </p>
            </div>

            <div className="footer-links">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-list">
                <li><button onClick={() => handleNavigation('/dosha')} className="footer-link">Prakriti Assessment</button></li>
                <li><button onClick={() => handleNavigation('/chatBot')} className="footer-link">AI Symptom Checker</button></li>
                <li><button onClick={() => handleNavigation('/patient-register')} className="footer-link">Patient Portal</button></li>
                <li><button onClick={() => handleNavigation('/doctor-register')} className="footer-link">Doctor Portal</button></li>
              </ul>
            </div>

            <div className="footer-features">
              <h4 className="footer-heading">Features</h4>
              <ul className="footer-list">
                <li className="footer-item">Medical Records Storage</li>
                <li className="footer-item">Doctor Appointments</li>
                <li className="footer-item">Smart Consultations</li>
                <li className="footer-item">Health Analytics</li>
              </ul>
            </div>

            <div className="footer-contact">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-list">
                <li className="footer-item">24/7 Customer Support</li>
                <li className="footer-item">Help Center</li>
                <li className="footer-item">Privacy Policy</li>
                <li className="footer-item">Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="copyright">
              © 2024 AYUMATE. All rights reserved. Empowering health through technology and tradition.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLogin;