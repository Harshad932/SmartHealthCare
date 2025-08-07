import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../assets/styles/dosha/Dosha.css";
import { 
  Heart, Menu, X,
} from 'lucide-react';

// Import your working API service
import { doshaAPI } from '../../services/api';

// Welcome Component
const Welcome = ({ onStart }) => (
  <div className="dosha-welcome-container">
    <div className="dosha-welcome-content">
      <h2>Welcome to Your Ayurvedic Journey</h2>
      
      <div className="dosha-intro-text">
        <p>
          Ayurveda, the ancient Indian system of medicine, recognizes three fundamental 
          energies or doshas that govern our physical and mental characteristics:
        </p>
        
        <div className="dosha-intro">
          <div className="dosha-card vata">
            <h3>🌬️ Vata</h3>
            <p>Air & Space - Creative, Quick, Light</p>
          </div>
          
          <div className="dosha-card pitta">
            <h3>🔥 Pitta</h3>
            <p>Fire & Water - Focused, Intense, Sharp</p>
          </div>
          
          <div className="dosha-card kapha">
            <h3>🌍 Kapha</h3>
            <p>Earth & Water - Stable, Calm, Grounded</p>
          </div>
        </div>
        
        <p className="dosha-instructions">
          This assessment will ask you 10-15 personalized questions about your 
          physical traits, mental tendencies, and lifestyle preferences. Our AI 
          will analyze your responses to determine your unique dosha constitution.
        </p>
        
        <div className="dosha-disclaimer">
          <p>
            <strong>Note:</strong> This is for educational purposes only and should 
            not replace professional medical advice.
          </p>
        </div>
      </div>

      <button className="dosha-start-button" onClick={onStart}>
        Begin Assessment
      </button>
    </div>
  </div>
);

// Question Card Component
const QuestionCard = ({ question, onAnswer, progress }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSubmit = () => {
    if (selectedOption) {
      onAnswer(selectedOption);
      setSelectedOption(null);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'physical':
        return '💪';
      case 'mental':
        return '🧠';
      case 'behavioral':
        return '🎯';
      default:
        return '❓';
    }
  };

  return (
    <div className="dosha-question-container">
      <div className="dosha-progress-bar">
        <div className="dosha-progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="dosha-question-card">
        <div className="dosha-question-header">
          <span className="dosha-question-number">Question {question.questionNumber} of 15</span>
          <span className="dosha-category-badge">
            {getCategoryIcon(question.category)} {question.category}
          </span>
        </div>

        <h3 className="dosha-question-text">{question.question}</h3>

        <div className="dosha-options-container">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`dosha-option-button ${selectedOption === option.value ? 'selected' : ''}`}
              onClick={() => setSelectedOption(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <button
          className="dosha-submit-button"
          onClick={handleSubmit}
          disabled={!selectedOption}
        >
          Next Question →
        </button>
      </div>
    </div>
  );
};

// Loading Component
const Loading = ({ message = 'Loading...' }) => (
  <div className="dosha-loading-container">
    <div className="dosha-loading-spinner">
      <div className="dosha-spinner-ring"></div>
      <div className="dosha-spinner-ring"></div>
      <div className="dosha-spinner-ring"></div>
    </div>
    <p className="dosha-loading-message">{message}</p>
  </div>
);

// Error Message Component
const ErrorMessage = ({ message }) => (
  <div className="dosha-error-container">
    <div className="dosha-error-icon">⚠️</div>
    <p className="dosha-error-message">{message}</p>
  </div>
);

// Results Component
const Results = ({ results, onRestart }) => {
  const getDoshaIcon = (dosha) => {
    switch (dosha?.toLowerCase()) {
      case 'vata':
        return '🌬️';
      case 'pitta':
        return '🔥';
      case 'kapha':
        return '🌍';
      default:
        return '🕉️';
    }
  };

  return (
    <div className="dosha-results-container">
      <div className="dosha-results-header">
        <h2>Your Dosha Analysis</h2>
        <div className="dosha-display">
          <span className="dosha-icon">{getDoshaIcon(results.primaryDosha)}</span>
          <h3 className="dosha-type">
            {results.primaryDosha}
            {results.secondaryDosha && ` - ${results.secondaryDosha}`}
          </h3>
          <p className="dosha-subtype">{results.doshaType}</p>
        </div>
      </div>

      <div className="dosha-results-content">
        <section className="dosha-description-section">
          <h4>About Your Constitution</h4>
          <p>{results.description}</p>
        </section>

        <section className="dosha-characteristics-section">
          <h4>Key Characteristics</h4>
          <ul>
            {results.characteristics.map((char, index) => (
              <li key={index}>{char}</li>
            ))}
          </ul>
        </section>

        <section className="dosha-recommendations-section">
          <h4>Dietary Recommendations</h4>
          <div className="dosha-diet-columns">
            <div className="dosha-diet-favorable">
              <h5>✅ Foods to Favor</h5>
              <ul>
                {results.dietaryRecommendations.favorable.map((food, index) => (
                  <li key={index}>{food}</li>
                ))}
              </ul>
            </div>
            <div className="dosha-diet-avoid">
              <h5>❌ Foods to Avoid</h5>
              <ul>
                {results.dietaryRecommendations.avoid.map((food, index) => (
                  <li key={index}>{food}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="dosha-lifestyle-section">
          <h4>Lifestyle Recommendations</h4>
          <ul>
            {results.lifestyleRecommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </section>

        <section className="dosha-remedies-section">
          <h4>Ayurvedic Remedies</h4>
          <ul>
            {results.ayurvedicRemedies.map((remedy, index) => (
              <li key={index}>{remedy}</li>
            ))}
          </ul>
        </section>

        {results.dailyRoutine && (
          <section className="dosha-routine-section">
            <h4>Recommended Daily Routine</h4>
            <div className="dosha-routine-grid">
              <div className="dosha-routine-time">
                <h5>🌅 Morning</h5>
                <p>{results.dailyRoutine.morning}</p>
              </div>
              <div className="dosha-routine-time">
                <h5>☀️ Afternoon</h5>
                <p>{results.dailyRoutine.afternoon}</p>
              </div>
              <div className="dosha-routine-time">
                <h5>🌙 Evening</h5>
                <p>{results.dailyRoutine.evening}</p>
              </div>
            </div>
          </section>
        )}

        {results.seasonalGuidance && (
          <section className="dosha-seasonal-section">
            <h4>Seasonal Guidance</h4>
            <p>{results.seasonalGuidance}</p>
          </section>
        )}
      </div>

      <div className="dosha-results-footer">
        <button className="dosha-restart-button" onClick={onRestart}>
          Take Assessment Again
        </button>
        <p className="dosha-disclaimer">
          Remember: This assessment is for educational purposes only.
          Please consult with a qualified Ayurvedic practitioner for personalized advice.
        </p>
      </div>
    </div>
  );
};

// Main Dosha Component
const Dosha = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stage, setStage] = useState('welcome'); // welcome, quiz, loading, results
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [doshaResults, setDoshaResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const startQuiz = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const question = await doshaAPI.getInitialQuestion();
      setCurrentQuestion(question);
      setStage('quiz');
    } catch (err) {
      console.error('Failed to start quiz:', err);
      setError('Failed to start quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    const newAnswers = [...answers, {
      questionNumber: currentQuestion.questionNumber,
      question: currentQuestion.question,
      category: currentQuestion.category,
      answer: answer
    }];
    setAnswers(newAnswers);
    setIsLoading(true);
    setError(null);

    try {
      // Check if we need more questions
      if (newAnswers.length < 15) {
        const nextQuestion = await doshaAPI.getNextQuestion(
          newAnswers,
          currentQuestion.questionNumber
        );
        
        if (nextQuestion.complete) {
          // API indicates assessment is complete, analyze dosha
          await analyzeDoshaType(newAnswers);
        } else {
          setCurrentQuestion(nextQuestion);
        }
      } else {
        // We have enough answers, analyze dosha
        await analyzeDoshaType(newAnswers);
      }
    } catch (err) {
      console.error('Failed to process answer:', err);
      setError('Failed to process your answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeDoshaType = async (allAnswers) => {
    setStage('loading');
    setError(null);
    try {
      const results = await doshaAPI.analyzeDoshaType(allAnswers);
      setDoshaResults(results);
      setStage('results');
    } catch (err) {
      console.error('Failed to analyze dosha:', err);
      setError('Failed to analyze your dosha. Please try again.');
      setStage('quiz');
    }
  };

  const resetQuiz = () => {
    setStage('welcome');
    setCurrentQuestion(null);
    setAnswers([]);
    setDoshaResults(null);
    setError(null);
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        <div className="nav-container">
          <div className="nav-wrapper">
            <div className="logo">
              <div className="logo-icon">
                <Heart className="logo-heart" />
              </div>
              <h1 className="logo-text">AYUMATE</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="desktop-nav">
              <button 
                onClick={() => handleNavigation('/')}
                className="nav-link"
              >
                Home
              </button>
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
                  onClick={() => handleNavigation('/admin-login')}
                  className="admin-btn"
                >
                  Admin
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
                onClick={() => handleNavigation('/')}
                className="mobile-nav-link"
              >
                Home
              </button>
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
                  onClick={() => handleNavigation('/patient-register')}
                  className="mobile-register"
                >
                  Patient Register
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className="mobile-login"
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-register')}
                  className="mobile-register"
                >
                  Doctor Register
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className="mobile-admin"
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="dosha-main">
        <div className="dosha">
          <header className="dosha-header">
            <h1>🕉️ Prakriti Check</h1>
            <p className="dosha-subtitle">Discover your mind-body constitution</p>
          </header>

          <section className="dosha-content">
            {error && <ErrorMessage message={error} />}
            
            {isLoading && stage !== 'loading' && <Loading />}
            
            {stage === 'welcome' && !isLoading && (
              <Welcome onStart={startQuiz} />
            )}
            
            {stage === 'quiz' && currentQuestion && !isLoading && (
              <QuestionCard 
                question={currentQuestion} 
                onAnswer={handleAnswer} 
                progress={(answers.length / 15) * 100} 
              />
            )}
            
            {stage === 'loading' && (
              <Loading message="Analyzing your dosha constitution..." />
            )}
            
            {stage === 'results' && doshaResults && (
              <Results results={doshaResults} onRestart={resetQuiz} />
            )}
          </section>
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

export default Dosha;