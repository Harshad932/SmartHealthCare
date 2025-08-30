import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/patient/SymptomChecker.module.css';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Menu, X
} from 'lucide-react';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

useEffect(() => {
  // Check if user is authenticated by verifying token with backend
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Verify token by making a test request to backend
        const response = await fetch(`${API_BASE_URL}/chatbot/symptom-history`, {
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

    const response = await fetch(`${API_BASE_URL}/chatbot/symptom-history`, {
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

      const response = await fetch(`${API_BASE_URL}/chatbot/analyze-symptoms`, {
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

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
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

      {/* Main Content */}
      <div className={styles["symptom-checker-container"]}>
        <div className={styles["symptom-checker-header"]}>
          <h1 className={styles["symptom-checker-title"]}>AI Symptom Checker</h1>
          <p className={styles["symptom-checker-subtitle"]}>Describe your symptoms and get AI-powered suggestions</p>
          
          <div className={styles["symptom-checker-user-status"]}>
            {isAuthenticated ? (
              <div className={styles["symptom-checker-authenticated-status"]}>
                <span className={styles["symptom-checker-status-badge authenticated"]}>✓ Logged In</span>
                <span className={styles["symptom-checker-status-text"]}>Your history is being saved</span>
              </div>
            ) : (
              <div className={styles["symptom-checker-anonymous-status"]}>
                <span className={styles["symptom-checker-status-badge anonymous"]}>👤 Anonymous</span>
                <span className={styles["symptom-checker-status-text"]}>History not saved - Register to track symptoms</span>
              </div>
            )}
          </div>

          <div className={styles["symptom-checker-disclaimer"]}>
            <strong>Disclaimer:</strong> This tool is for informational purposes only. 
            Always consult with a healthcare professional for proper medical diagnosis and treatment.
          </div>
        </div>

        {/* History section - Only show for authenticated users */}
        {isAuthenticated && history.length > 0 && (
          <div className={styles["symptom-checker-history-section"]}>
            <button 
              type="button" 
              onClick={toggleHistory}
              className={styles["symptom-checker-history-toggle"]}
            >
              {showHistory ? 'Hide History' : `View Previous Analyses (${history.length})`}
            </button>
            
            {showHistory && (
              <div className={styles["symptom-checker-history-list"]}>
                <h3 className={styles["symptom-checker-history-title"]}>Your Symptom History</h3>
                {history.map((item, index) => (
                  <div key={item.analysis_id || index} className={styles["symptom-checker-history-item"]}>
                    <div className={styles["symptom-checker-history-header"]}>
                      <span className={styles["symptom-checker-history-date"]}>
                        {formatDate(item.created_at)}
                      </span>
                      <span className={styles["symptom-checker-history-severity"]}>
                        Severity: {item.severity}/10
                      </span>
                    </div>
                    <div className={styles["symptom-checker-history-symptoms"]}>
                      {item.symptoms.length > 100 
                        ? `${item.symptoms.substring(0, 100)}...` 
                        : item.symptoms
                      }
                    </div>
                    <button 
                      onClick={() => loadPreviousSymptoms(item)}
                      className={styles["symptom-checker-history-load-btn"]}
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
        <div className={styles["symptom-checker-form"]}>
          <div className={styles["symptom-checker-form-group"]}>
            <label htmlFor="symptoms" className={styles["symptom-checker-label"]}>
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
              className={styles["symptom-checker-textarea"]}
            />
          </div>

          <div className={styles["symptom-checker-form-group"]}>
            <label htmlFor="severity" className={styles["symptom-checker-label"]}>
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
              className={styles["symptom-checker-slider"]}
            />
            <span className={styles["symptom-checker-severity-value"]}>Current: {severity}/10</span>
          </div>

          <div className={styles["symptom-checker-form-group"]}>
            <label htmlFor="duration" className={styles["symptom-checker-label"]}>
              How long have you had these symptoms?
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              disabled={loading}
              className={styles["symptom-checker-select"]}
            >
              <option value="">Select duration</option>
              <option value="less_than_1_day">Less than 1 day</option>
              <option value="1_3_days">1-3 days</option>
              <option value="4_7_days">4-7 days</option>
              <option value="1_2_weeks">1-2 weeks</option>
              <option value="more_than_2_weeks">More than 2 weeks</option>
            </select>
          </div>

          <div className={styles["symptom-checker-form-actions"]}>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={loading || !symptoms.trim()}
              className={styles["symptom-checker-submit-btn"]}
            >
              {loading ? 'Analyzing...' : 'Analyze Symptoms'}
            </button>
            <button 
              type="button" 
              onClick={handleReset} 
              disabled={loading}
              className={styles["symptom-checker-reset-btn"]}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Login prompt for anonymous users */}
        {showLoginPrompt && !isAuthenticated && (
          <div className={styles["symptom-checker-login-prompt"]}>
            <div className={styles["symptom-checker-prompt-header"]}>
              <h3 className={styles["symptom-checker-prompt-title"]}>Save Your Health Data!</h3>
              <button 
                onClick={() => setShowLoginPrompt(false)}
                className={styles["symptom-checker-prompt-close"]}
              >
                ×
              </button>
            </div>
            <div className={styles["symptom-checker-prompt-content"]}>
              <p className={styles["symptom-checker-prompt-text"]}>
                Create an account to save your symptom history, track patterns over time, get personalized recommendations, and access your data from anywhere.
              </p>
              <div className={styles["symptom-checker-prompt-actions"]}>
                <button 
                  onClick={handleLoginRedirect}
                  className={styles["symptom-checker-prompt-btn login"]}
                >
                  Login
                </button>
                <button 
                  onClick={handleRegisterRedirect}
                  className={styles["symptom-checker-prompt-btn register"]}
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className={styles["symptom-checker-error-message"]}>
            <h3 className={styles["symptom-checker-error-title"]}>Error</h3>
            <p className={styles["symptom-checker-error-text"]}>{error}</p>
          </div>
        )}

        {/* Results display */}
        {results && (
          <div className={styles["symptom-checker-results-container"]}>
            <h2 className={styles["symptom-checker-results-title"]}>Analysis Results</h2>
            
            {results.hasHistory && isAuthenticated && (
              <div className={styles["symptom-checker-context-notice"]}>
                <span className={styles["symptom-checker-context-icon"]}>📊</span>
                <span className={styles["symptom-checker-context-text"]}>
                  This analysis considers your previous symptom history
                </span>
              </div>
            )}
            
            <div className={styles["symptom-checker-analysis-summary"]}>
              <h3 className={styles["symptom-checker-section-title"]}>Symptom Analysis</h3>
              <div className={styles["symptom-checker-summary-grid"]}>
                <div className={styles["symptom-checker-summary-item"]}>
                  <span className={styles["symptom-checker-summary-label"]}>Severity:</span>
                  <span className={styles["symptom-checker-summary-value"]}>{results.severity}/10</span>
                </div>
                <div className={styles["symptom-checker-summary-item"]}>
                  <span className={styles["symptom-checker-summary-label"]}>Duration:</span>
                  <span className={styles["symptom-checker-summary-value"]}>{results.duration}</span>
                </div>
                <div className={styles["symptom-checker-summary-item"]}>
                  <span className={styles["symptom-checker-summary-label"]}>Urgency Level:</span>
                  <span className={styles["symptom-checker-summary-value"]}>{results.urgencyLevel}</span>
                </div>
              </div>
            </div>

            <div className={styles["symptom-checker-ai-suggestions"]}>
              <h3 className={styles["symptom-checker-section-title"]}>AI Suggestions</h3>
              <div className={styles["symptom-checker-suggestion-content"]}>
                {results.aiSuggestion.split('\n').map((paragraph, index) => (
                  <p key={index} className={styles["symptom-checker-suggestion-paragraph"]}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div className={styles["symptom-checker-possible-conditions"]}>
              <h3 className={styles["symptom-checker-section-title"]}>Possible Conditions</h3>
              <ul className={styles["symptom-checker-conditions-list"]}>
                {results.possibleConditions.map((condition, index) => (
                  <li key={index} className={styles["symptom-checker-condition-item"]}>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles["symptom-checker-recommended-specialists"]}>
              <h3 className={styles["symptom-checker-section-title"]}>Recommended Specialists</h3>
              <ul className={styles["symptom-checker-specialists-list"]}>
                {results.recommendedSpecialists.map((specialist, index) => (
                  <li key={index} className={styles["symptom-checker-specialist-item"]}>
                    {specialist}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles["symptom-checker-next-steps"]}>
              <h3 className={styles["symptom-checker-section-title"]}>Recommended Next Steps</h3>
              <ul className={styles["symptom-checker-steps-list"]}>
                {results.nextSteps.map((step, index) => (
                  <li key={index} className={styles["symptom-checker-step-item"]}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {results.emergencyWarning && (
              <div className={styles["symptom-checker-emergency-warning"]}>
                <div className={styles["symptom-checker-emergency-alert"]}>
                  <span className={styles["symptom-checker-emergency-icon"]}>⚠️</span>
                  <div className={styles["symptom-checker-emergency-content"]}>
                    <strong className={styles["symptom-checker-emergency-title"]}>Emergency Warning:</strong>
                    <span className={styles["symptom-checker-emergency-text"]}>{results.emergencyWarning}</span>
                  </div>
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <div className={styles["symptom-checker-register-cta"]}>
                <h3 className={styles["symptom-checker-cta-title"]}>Want to Track Your Health Over Time?</h3>
                <p className={styles["symptom-checker-cta-text"]}>
                  Register to save your symptom history, get personalized recommendations based on your patterns, and access your health data from anywhere.
                </p>
                <div className={styles["symptom-checker-cta-actions"]}>
                  <button 
                    onClick={handleRegisterRedirect}
                    className={styles["symptom-checker-cta-btn primary"]}
                  >
                    Create Account
                  </button>
                  <button 
                    onClick={handleLoginRedirect}
                    className={styles["symptom-checker-cta-btn secondary"]}
                  >
                    Already have an account?
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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

export default PatientSymptomChecker;