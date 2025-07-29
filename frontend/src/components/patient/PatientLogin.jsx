import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Heart, AlertCircle, CheckCircle } from 'lucide-react';
import '../../assets/styles/patient/Login.css';

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

  return (
    <div className="user-login-main-container">
      <div className="user-login-background-overlay"></div>
      
      <div className="user-login-content-wrapper">
        {/* Left Side - Branding */}
        <div className="user-login-branding-section">
          <div className="user-login-branding-content">
            <div className="user-login-logo-container">
              <Heart className="user-login-logo-icon" />
              <h1 className="user-login-brand-title">Smart Healthcare</h1>
            </div>
            <p className="user-login-brand-subtitle">
              Your health, our priority. Connect with specialists and manage your healthcare journey.
            </p>
            <div className="user-login-features-list">
              <div className="user-login-feature-item">
                <CheckCircle className="user-login-feature-icon" />
                <span>AI-powered symptom analysis</span>
              </div>
              <div className="user-login-feature-item">
                <CheckCircle className="user-login-feature-icon" />
                <span>Easy appointment booking</span>
              </div>
              <div className="user-login-feature-item">
                <CheckCircle className="user-login-feature-icon" />
                <span>Secure medical records</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="user-login-form-section">
          <div className="user-login-form-container">
            <div className="user-login-header">
              <h2 className="user-login-title">Welcome Back</h2>
              <p className="user-login-subtitle">
                Sign in to your patient account to continue
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="user-login-alert user-login-alert-success">
                <CheckCircle className="user-login-alert-icon" />
                <span>{success}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="user-login-alert user-login-alert-error">
                <AlertCircle className="user-login-alert-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="user-login-form">
              {/* Email Field */}
              <div className="user-login-form-group">
                <label htmlFor="email" className="user-login-label">
                  Email Address
                </label>
                <div className="user-login-input-wrapper">
                  <Mail className="user-login-input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`user-login-input ${validationErrors.email ? 'user-login-input-error' : ''}`}
                    placeholder="Enter your email address"
                    autoComplete="email"
                  />
                </div>
                {validationErrors.email && (
                  <span className="user-login-error-text">{validationErrors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="user-login-form-group">
                <label htmlFor="password" className="user-login-label">
                  Password
                </label>
                <div className="user-login-input-wrapper">
                  <Lock className="user-login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`user-login-input ${validationErrors.password ? 'user-login-input-error' : ''}`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="user-login-password-toggle"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {validationErrors.password && (
                  <span className="user-login-error-text">{validationErrors.password}</span>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="user-login-form-options">
                <label className="user-login-checkbox-wrapper">
                  <input type="checkbox" className="user-login-checkbox" />
                  <span className="user-login-checkbox-label">Remember me</span>
                </label>
                <Link to="/forgot-password" className="user-login-forgot-link">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`user-login-submit-btn ${loading ? 'user-login-submit-btn-loading' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="user-login-spinner"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="user-login-signup-prompt">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="user-login-signup-link">
                  Sign up for free
                </Link>
              </p>
            </div>

            {/* Role Switch Links */}
            <div className="user-login-role-switch">
              <p className="user-login-role-text">Sign in as:</p>
              <div className="user-login-role-links">
                <Link to="/doctor-login" className="user-login-role-link">
                  Doctor
                </Link>
                <span className="user-login-role-divider">|</span>
                <Link to="/admin-login" className="user-login-role-link">
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;