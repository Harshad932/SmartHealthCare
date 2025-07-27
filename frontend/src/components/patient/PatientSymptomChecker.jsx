import React, { useState, useEffect } from 'react';
import '../../assets/styles/patient/SymptomChecker.css';
import { useNavigate } from 'react-router-dom';

const PatientSymptomChecker = () => {
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

useEffect(() => {
  // Check if user is authenticated by verifying token with backend
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Verify token by making a test request to backend
        const response = await fetch(`${API_BASE_URL}/symptom-history`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
          const data = await response.json();
          setHistory(data.history || []);
        } else {
          // Token is invalid, remove it and set as anonymous
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setHistory([]);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setHistory([]);
      }
    } else {
      setIsAuthenticated(false);
      setHistory([]);
      setShowLoginPrompt(false);
    }
  };

  checkAuthStatus();
}, [API_BASE_URL]);

 const loadUserHistory = async () => {
  if (!isAuthenticated) return;
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/symptom-history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setHistory(data.history || []);
    } else if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setHistory([]);
    }
  } catch (err) {
    console.error('Error loading history:', err);
    // Don't change auth status on network errors
  }
};

  const handleSubmit = async () => {
    if (!symptoms.trim()) return;
    
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      // Only add authorization header for authenticated users
      if (isAuthenticated) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
      }

      const response = await fetch(`${API_BASE_URL}/analyze-symptoms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symptoms,
          severity,
          duration
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze symptoms');
      }

      setResults(data);
      
      // Show login prompt for anonymous users after first analysis
      if (!isAuthenticated) {
        setShowLoginPrompt(true);
      }

      // Refresh history only for authenticated users
      if (isAuthenticated) {
        loadUserHistory();
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSymptoms('');
    setSeverity(5);
    setDuration('');
    setResults(null);
    setError('');
    setShowLoginPrompt(false);
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadPreviousSymptoms = (historyItem) => {
    setSymptoms(historyItem.symptoms);
    setSeverity(historyItem.severity);
    setDuration(historyItem.duration);
    setShowHistory(false);
  };

  return (
    <div className="symptom-checker-container">
      <div className="symptom-checker-header">
        <h1 className="symptom-checker-title">AI Symptom Checker</h1>
        <p className="symptom-checker-subtitle">Describe your symptoms and get AI-powered suggestions</p>
        
        <div className="symptom-checker-user-status">
          {isAuthenticated ? (
            <div className="symptom-checker-authenticated-status">
              <span className="symptom-checker-status-badge authenticated">✓ Logged In</span>
              <span className="symptom-checker-status-text">Your history is being saved</span>
            </div>
          ) : (
            <div className="symptom-checker-anonymous-status">
              <span className="symptom-checker-status-badge anonymous">👤 Anonymous</span>
              <span className="symptom-checker-status-text">History not saved - Register to track symptoms</span>
            </div>
          )}
        </div>

        <div className="symptom-checker-disclaimer">
          <strong>Disclaimer:</strong> This tool is for informational purposes only. 
          Always consult with a healthcare professional for proper medical diagnosis and treatment.
        </div>
      </div>

      {/* History section - Only show for authenticated users */}
      {isAuthenticated && history.length > 0 && (
        <div className="symptom-checker-history-section">
          <button 
            type="button" 
            onClick={toggleHistory}
            className="symptom-checker-history-toggle"
          >
            {showHistory ? 'Hide History' : `View Previous Analyses (${history.length})`}
          </button>
          
          {showHistory && (
            <div className="symptom-checker-history-list">
              <h3 className="symptom-checker-history-title">Your Symptom History</h3>
              {history.map((item, index) => (
                <div key={item.analysis_id || index} className="symptom-checker-history-item">
                  <div className="symptom-checker-history-header">
                    <span className="symptom-checker-history-date">
                      {formatDate(item.created_at)}
                    </span>
                    <span className="symptom-checker-history-severity">
                      Severity: {item.severity}/10
                    </span>
                  </div>
                  <div className="symptom-checker-history-symptoms">
                    {item.symptoms.length > 100 
                      ? `${item.symptoms.substring(0, 100)}...` 
                      : item.symptoms
                    }
                  </div>
                  <button 
                    onClick={() => loadPreviousSymptoms(item)}
                    className="symptom-checker-history-load-btn"
                  >
                    Load These Symptoms
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main symptom form */}
      <div className="symptom-checker-form">
        <div className="symptom-checker-form-group">
          <label htmlFor="symptoms" className="symptom-checker-label">
            Describe your symptoms:
          </label>
          <textarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Please describe your symptoms in detail (e.g., headache, fever, cough, stomach pain, etc.)"
            required
            rows={4}
            disabled={loading}
            className="symptom-checker-textarea"
          />
        </div>

        <div className="symptom-checker-form-group">
          <label htmlFor="severity" className="symptom-checker-label">
            Severity Level (1-10):
          </label>
          <input
            type="range"
            id="severity"
            min="1"
            max="10"
            value={severity}
            onChange={(e) => setSeverity(parseInt(e.target.value))}
            disabled={loading}
            className="symptom-checker-slider"
          />
          <span className="symptom-checker-severity-value">Current: {severity}/10</span>
        </div>

        <div className="symptom-checker-form-group">
          <label htmlFor="duration" className="symptom-checker-label">
            How long have you had these symptoms?
          </label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            disabled={loading}
            className="symptom-checker-select"
          >
            <option value="">Select duration</option>
            <option value="less_than_1_day">Less than 1 day</option>
            <option value="1_3_days">1-3 days</option>
            <option value="4_7_days">4-7 days</option>
            <option value="1_2_weeks">1-2 weeks</option>
            <option value="more_than_2_weeks">More than 2 weeks</option>
          </select>
        </div>

        <div className="symptom-checker-form-actions">
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={loading || !symptoms.trim()}
            className="symptom-checker-submit-btn"
          >
            {loading ? 'Analyzing...' : 'Analyze Symptoms'}
          </button>
          <button 
            type="button" 
            onClick={handleReset} 
            disabled={loading}
            className="symptom-checker-reset-btn"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Login prompt for anonymous users */}
      {showLoginPrompt && !isAuthenticated && (
        <div className="symptom-checker-login-prompt">
          <div className="symptom-checker-prompt-header">
            <h3 className="symptom-checker-prompt-title">Save Your Health Data!</h3>
            <button 
              onClick={() => setShowLoginPrompt(false)}
              className="symptom-checker-prompt-close"
            >
              ×
            </button>
          </div>
          <div className="symptom-checker-prompt-content">
            <p className="symptom-checker-prompt-text">
              Create an account to save your symptom history, track patterns over time, get personalized recommendations, and access your data from anywhere.
            </p>
            <div className="symptom-checker-prompt-actions">
              <button 
                onClick={handleLoginRedirect}
                className="symptom-checker-prompt-btn login"
              >
                Login
              </button>
              <button 
                onClick={handleRegisterRedirect}
                className="symptom-checker-prompt-btn register"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="symptom-checker-error-message">
          <h3 className="symptom-checker-error-title">Error</h3>
          <p className="symptom-checker-error-text">{error}</p>
        </div>
      )}

      {/* Results display */}
      {results && (
        <div className="symptom-checker-results-container">
          <h2 className="symptom-checker-results-title">Analysis Results</h2>
          
          {results.hasHistory && isAuthenticated && (
            <div className="symptom-checker-context-notice">
              <span className="symptom-checker-context-icon">📊</span>
              <span className="symptom-checker-context-text">
                This analysis considers your previous symptom history
              </span>
            </div>
          )}
          
          <div className="symptom-checker-analysis-summary">
            <h3 className="symptom-checker-section-title">Symptom Analysis</h3>
            <div className="symptom-checker-summary-grid">
              <div className="symptom-checker-summary-item">
                <span className="symptom-checker-summary-label">Severity:</span>
                <span className="symptom-checker-summary-value">{results.severity}/10</span>
              </div>
              <div className="symptom-checker-summary-item">
                <span className="symptom-checker-summary-label">Duration:</span>
                <span className="symptom-checker-summary-value">{results.duration}</span>
              </div>
              <div className="symptom-checker-summary-item">
                <span className="symptom-checker-summary-label">Urgency Level:</span>
                <span className="symptom-checker-summary-value">{results.urgencyLevel}</span>
              </div>
            </div>
          </div>

          <div className="symptom-checker-ai-suggestions">
            <h3 className="symptom-checker-section-title">AI Suggestions</h3>
            <div className="symptom-checker-suggestion-content">
              {results.aiSuggestion.split('\n').map((paragraph, index) => (
                <p key={index} className="symptom-checker-suggestion-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="symptom-checker-possible-conditions">
            <h3 className="symptom-checker-section-title">Possible Conditions</h3>
            <ul className="symptom-checker-conditions-list">
              {results.possibleConditions.map((condition, index) => (
                <li key={index} className="symptom-checker-condition-item">
                  {condition}
                </li>
              ))}
            </ul>
          </div>

          <div className="symptom-checker-recommended-specialists">
            <h3 className="symptom-checker-section-title">Recommended Specialists</h3>
            <ul className="symptom-checker-specialists-list">
              {results.recommendedSpecialists.map((specialist, index) => (
                <li key={index} className="symptom-checker-specialist-item">
                  {specialist}
                </li>
              ))}
            </ul>
          </div>

          <div className="symptom-checker-next-steps">
            <h3 className="symptom-checker-section-title">Recommended Next Steps</h3>
            <ul className="symptom-checker-steps-list">
              {results.nextSteps.map((step, index) => (
                <li key={index} className="symptom-checker-step-item">
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {results.emergencyWarning && (
            <div className="symptom-checker-emergency-warning">
              <div className="symptom-checker-emergency-alert">
                <span className="symptom-checker-emergency-icon">⚠️</span>
                <div className="symptom-checker-emergency-content">
                  <strong className="symptom-checker-emergency-title">Emergency Warning:</strong>
                  <span className="symptom-checker-emergency-text">{results.emergencyWarning}</span>
                </div>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="symptom-checker-register-cta">
              <h3 className="symptom-checker-cta-title">Want to Track Your Health Over Time?</h3>
              <p className="symptom-checker-cta-text">
                Register to save your symptom history, get personalized recommendations based on your patterns, and access your health data from anywhere.
              </p>
              <div className="symptom-checker-cta-actions">
                <button 
                  onClick={handleRegisterRedirect}
                  className="symptom-checker-cta-btn primary"
                >
                  Create Account
                </button>
                <button 
                  onClick={handleLoginRedirect}
                  className="symptom-checker-cta-btn secondary"
                >
                  Already have an account?
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSymptomChecker;