import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/doctor/DoctorLogin.css';

const DoctorLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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

  const handleRegisterRedirect = () => {
    navigate('/doctor/register');
  };

  const handleForgotPassword = () => {
    navigate('/doctor/forgot-password');
  };

  const handleHomeRedirect = () => {
    navigate('/');
  };

  return (
    <div className="doctor-login-container">
      <div className="doctor-login-wrapper">
        {/* Header Section */}
        <div className="doctor-login-header">
          <div className="doctor-login-logo">
            <div className="doctor-login-logo-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
                <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
              </svg>
            </div>
            <h1 className="doctor-login-title">Doctor Portal</h1>
          </div>
          <p className="doctor-login-subtitle">Sign in to access your medical dashboard</p>
        </div>

        {/* Main Login Form */}
        <div className="doctor-login-card">
          <div className="doctor-login-card-header">
            <h2 className="doctor-login-form-title">Welcome Back</h2>
            <p className="doctor-login-form-subtitle">Please sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="doctor-login-form">

            {/* Email Field */}
            <div className="doctor-login-form-group">
              <label htmlFor="email" className="doctor-login-label">
                Email Address
                <span className="doctor-login-required">*</span>
              </label>
              <div className="doctor-login-input-wrapper">
                <div className="doctor-login-input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
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
                  className="doctor-login-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="doctor-login-form-group">
              <label htmlFor="password" className="doctor-login-label">
                Password
                <span className="doctor-login-required">*</span>
              </label>
              <div className="doctor-login-input-wrapper">
                <div className="doctor-login-input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
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
                  className="doctor-login-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="doctor-login-password-toggle"
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="doctor-login-form-options">
              <label className="doctor-login-checkbox-label">
                <input
                  type="checkbox"
                  className="doctor-login-checkbox"
                  disabled={loading}
                />
                <span className="doctor-login-checkbox-text">Remember me</span>
              </label>
              
              <button
                type="button"
                onClick={handleForgotPassword}
                className="doctor-login-forgot-link"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="doctor-login-error-message">
                <div className="doctor-login-error-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <p className="doctor-login-error-text">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className="doctor-login-submit-button"
            >
              {loading ? (
                <div className="doctor-login-loading-content">
                  <div className="doctor-login-spinner"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="doctor-login-button-content">
                  <span>Sign In</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10,17 15,12 10,7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                </div>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="doctor-login-register-section">
            <p className="doctor-login-register-text">
              Don't have an account?
              <button
                type="button"
                onClick={handleRegisterRedirect}
                className="doctor-login-register-link"
                disabled={loading}
              >
                Register as Doctor
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="doctor-login-footer">
          <div className="doctor-login-footer-links">
            <button
              type="button"
              onClick={handleHomeRedirect}
              className="doctor-login-footer-link"
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              Back to Home
            </button>
            
            <span className="doctor-login-footer-divider">•</span>
            
            <a href="/help" className="doctor-login-footer-link">
              Help & Support
            </a>
            
            <span className="doctor-login-footer-divider">•</span>
            
            <a href="/privacy" className="doctor-login-footer-link">
              Privacy Policy
            </a>
          </div>
          
          <p className="doctor-login-footer-copyright">
            © 2025 Smart Healthcare Portal. All rights reserved.
          </p>
        </div>

        {/* Security Notice */}
        <div className="doctor-login-security-notice">
          <div className="doctor-login-security-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <p className="doctor-login-security-text">
            Your login is secured with 256-bit SSL encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;