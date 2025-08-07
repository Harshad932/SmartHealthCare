import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/doctor/DoctorLogin.css';
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
    <div className="doctor-login-container">
      {/* Header */}
      <header className="doctor-header">
        <div className="doctor-nav-container">
          <div className="doctor-nav-wrapper">
            <div className="doctor-logo">
              <div className="doctor-logo-icon">
                <Heart className="doctor-logo-heart" />
              </div>
              <h1 className="doctor-logo-text">AYUMATE</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="doctor-desktop-nav">
              <button 
                onClick={() => handleNavigation('/dosha')}
                className="doctor-nav-link"
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className="doctor-nav-link"
              >
                AI Symptom Checker
              </button>
              <div className="doctor-auth-buttons">
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className="doctor-login-btn"
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-register')}
                  className="doctor-register-btn"
                >
                  Doctor Register
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className="doctor-admin-btn"
                >
                  Admin
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="doctor-mobile-menu-btn"
            >
              {isMenuOpen ? <X className="doctor-menu-icon" /> : <Menu className="doctor-menu-icon" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="doctor-mobile-nav">
            <div className="doctor-mobile-nav-container">
              <button 
                onClick={() => handleNavigation('/dosha')}
                className="doctor-mobile-nav-link"
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className="doctor-mobile-nav-link"
              >
                AI Symptom Checker
              </button>
              <div className="doctor-mobile-auth">
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className="doctor-mobile-login"
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-register')}
                  className="doctor-mobile-register"
                >
                  Doctor Register
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className="doctor-mobile-admin"
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="doctor-main-content">
        <div className="doctor-login-background"></div>
        
        <div className="doctor-login-wrapper">
          {/* Login Card */}
          <div className="doctor-login-card">
            {/* Card Header */}
            <div className="doctor-login-card-header">
              <div className="doctor-login-icon-container">
                <div className="doctor-login-icon-bg">
                  <Heart className="doctor-login-icon" />
                </div>
              </div>
              <h2 className="doctor-login-title">Doctor Portal</h2>
              <p className="doctor-login-subtitle">
                Welcome back! Please sign in to access your medical dashboard
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="doctor-login-form">
              {/* Email Field */}
              <div className="doctor-form-group">
                <label htmlFor="email" className="doctor-form-label">
                  Email Address
                  <span className="doctor-required">*</span>
                </label>
                <div className="doctor-input-wrapper">
                  <div className="doctor-input-icon">
                    <Mail className="doctor-icon" />
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
                    className="doctor-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="doctor-form-group">
                <label htmlFor="password" className="doctor-form-label">
                  Password
                  <span className="doctor-required">*</span>
                </label>
                <div className="doctor-input-wrapper">
                  <div className="doctor-input-icon">
                    <Lock className="doctor-icon" />
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
                    className="doctor-input"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="doctor-password-toggle"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="doctor-toggle-icon" />
                    ) : (
                      <Eye className="doctor-toggle-icon" />
                    )}
                  </button>
                </div>
              </div>

              {/* Form Options */}
              <div className="doctor-form-options">
                <label className="doctor-checkbox-wrapper">
                  <input
                    type="checkbox"
                    className="doctor-checkbox"
                    disabled={loading}
                  />
                  <span className="doctor-checkbox-checkmark"></span>
                  <span className="doctor-checkbox-label">Remember me</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => navigate('/doctor/forgot-password')}
                  className="doctor-forgot-link"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="doctor-error-message">
                  <AlertCircle className="doctor-error-icon" />
                  <p className="doctor-error-text">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !formData.email || !formData.password}
                className="doctor-submit-button"
              >
                {loading ? (
                  <div className="doctor-loading-content">
                    <Loader2 className="doctor-spinner" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="doctor-button-content">
                    <LogIn className="doctor-btn-icon" />
                    <span>Sign In to Portal</span>
                  </div>
                )}
              </button>
            </form>

            {/* Registration Link */}
            <div className="doctor-register-section">
              <p className="doctor-register-text">
                Don't have an account?
                <button
                  type="button"
                  onClick={() => navigate('/doctor/register')}
                  className="doctor-register-link"
                  disabled={loading}
                >
                  <UserPlus className="doctor-register-icon" />
                  Register as Doctor
                </button>
              </p>
            </div>
          </div>

          {/* Side Features */}
          <div className="doctor-features-panel">
            <div className="doctor-feature-item">
              <div className="doctor-feature-icon doctor-feature-green">
                <Shield className="doctor-feature-svg" />
              </div>
              <div className="doctor-feature-content">
                <h3 className="doctor-feature-title">Secure & Private</h3>
                <p className="doctor-feature-desc">Your data is protected with enterprise-grade security</p>
              </div>
            </div>
            
            <div className="doctor-feature-item">
              <div className="doctor-feature-icon doctor-feature-blue">
                <Heart className="doctor-feature-svg" />
              </div>
              <div className="doctor-feature-content">
                <h3 className="doctor-feature-title">Patient Care</h3>
                <p className="doctor-feature-desc">Comprehensive tools for better patient management</p>
              </div>
            </div>
            
            <div className="doctor-feature-item">
              <div className="doctor-feature-icon doctor-feature-purple">
                <HelpCircle className="doctor-feature-svg" />
              </div>
              <div className="doctor-feature-content">
                <h3 className="doctor-feature-title">24/7 Support</h3>
                <p className="doctor-feature-desc">Round-the-clock assistance for all your needs</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="doctor-footer">
        <div className="doctor-footer-container">
          <div className="doctor-footer-content">
            <div className="doctor-footer-brand">
              <div className="doctor-footer-logo">
                <div className="doctor-footer-logo-icon">
                  <Heart className="doctor-footer-heart" />
                </div>
                <h3 className="doctor-footer-title">AYUMATE</h3>
              </div>
              <p className="doctor-footer-desc">
                Your comprehensive Ayurvedic health companion, combining ancient wisdom with modern technology for optimal wellness.
              </p>
            </div>

            <div className="doctor-footer-links">
              <h4 className="doctor-footer-heading">Quick Links</h4>
              <ul className="doctor-footer-list">
                <li><button onClick={() => handleNavigation('/dosha')} className="doctor-footer-link">Prakriti Assessment</button></li>
                <li><button onClick={() => handleNavigation('/chatBot')} className="doctor-footer-link">AI Symptom Checker</button></li>
                <li><button onClick={() => handleNavigation('/patient-register')} className="doctor-footer-link">Patient Portal</button></li>
                <li><button onClick={() => handleNavigation('/doctor-register')} className="doctor-footer-link">Doctor Register</button></li>
              </ul>
            </div>

            <div className="doctor-footer-features">
              <h4 className="doctor-footer-heading">Doctor Features</h4>
              <ul className="doctor-footer-list">
                <li className="doctor-footer-item">Patient Management</li>
                <li className="doctor-footer-item">Consultation Tools</li>
                <li className="doctor-footer-item">Medical Records</li>
                <li className="doctor-footer-item">Analytics Dashboard</li>
              </ul>
            </div>

            <div className="doctor-footer-contact">
              <h4 className="doctor-footer-heading">Support</h4>
              <ul className="doctor-footer-list">
                <li className="doctor-footer-item">24/7 Doctor Support</li>
                <li className="doctor-footer-item">Help Center</li>
                <li className="doctor-footer-item">Privacy Policy</li>
                <li className="doctor-footer-item">Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="doctor-footer-bottom">
            <div className="doctor-footer-navigation">
              <button
                onClick={() => handleNavigation('/')}
                className="doctor-footer-nav-link"
              >
                <Home className="doctor-footer-nav-icon" />
                Back to Home
              </button>
              
              <span className="doctor-footer-divider">•</span>
              
              <a href="/help" className="doctor-footer-nav-link">
                Help & Support
              </a>
              
              <span className="doctor-footer-divider">•</span>
              
              <a href="/privacy" className="doctor-footer-nav-link">
                Privacy Policy
              </a>
            </div>
            
            <p className="doctor-copyright">
              © 2025 AYUMATE. All rights reserved. Empowering healthcare through technology and tradition.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="doctor-security-notice">
          <div className="doctor-security-icon">
            <Shield className="doctor-security-shield" />
          </div>
          <p className="doctor-security-text">
            Your login is secured with 256-bit SSL encryption
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DoctorLogin;