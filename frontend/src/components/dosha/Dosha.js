import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "../../assets/styles/dosha/Dosha.module.css";
import { 
  Heart, Menu, X,
} from 'lucide-react';

// Import your working API service
import { doshaAPI } from '../../services/api';

// Welcome Component
const Welcome = ({ onStart }) => (
  <div className={styles["dosha-welcome-container"]}>
    <div className={styles["dosha-welcome-content"]}>
      <h2>Welcome to Your Ayurvedic Journey</h2>
      
      <div className={styles["dosha-intro-text"]}>
        <p>
          Ayurveda, the ancient Indian system of medicine, recognizes three fundamental 
          energies or doshas that govern our physical and mental characteristics:
        </p>
        
        <div className={styles["dosha-intro"]}>
          <div className={`${styles["dosha-card"]} ${styles["vata"]}`}>
            <h3>🌬️ Vata</h3>
            <p>Air & Space - Creative, Quick, Light</p>
          </div>
          
          <div className={`${styles["dosha-card"]} ${styles["pitta"]}`}>
            <h3>🔥 Pitta</h3>
            <p>Fire & Water - Focused, Intense, Sharp</p>
          </div>
          
          <div className={`${styles["dosha-card"]} ${styles["kapha"]}`}>
            <h3>🌍 Kapha</h3>
            <p>Earth & Water - Stable, Calm, Grounded</p>
          </div>
        </div>
        
        <p className={styles["dosha-instructions"]}>
          This assessment will ask you 10-15 personalized questions about your 
          physical traits, mental tendencies, and lifestyle preferences. Our AI 
          will analyze your responses to determine your unique dosha constitution.
        </p>
        
        <div className={styles["dosha-disclaimer"]}>
          <p>
            <strong>Note:</strong> This is for educational purposes only and should 
            not replace professional medical advice.
          </p>
        </div>
      </div>

      <button className={styles["dosha-start-button"]} onClick={onStart}>
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
    <div className={styles["dosha-question-container"]}>
      <div className={styles["dosha-progress-bar"]}>
        <div className={styles["dosha-progress-fill"]} style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className={styles["dosha-question-card"]}>
        <div className={styles["dosha-question-header"]}>
          <span className={styles["dosha-question-number"]}>Question {question.questionNumber} of 15</span>
          <span className={styles["dosha-category-badge"]}>
            {getCategoryIcon(question.category)} {question.category}
          </span>
        </div>

        <h3 className={styles["dosha-question-text"]}>{question.question}</h3>

        <div className={styles["dosha-options-container"]}>
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`${styles["dosha-option-button"]} ${selectedOption === option.value ? styles["selected"] : ''}`}
              onClick={() => setSelectedOption(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <button
          className={styles["dosha-submit-button"]}
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
  <div className={styles["dosha-loading-container"]}>
    <div className={styles["dosha-loading-spinner"]}>
      <div className={styles["dosha-spinner-ring"]}></div>
      <div className={styles["dosha-spinner-ring"]}></div>
      <div className={styles["dosha-spinner-ring"]}></div>
    </div>
    <p className={styles["dosha-loading-message"]}>{message}</p>
  </div>
);

// Error Message Component
const ErrorMessage = ({ message }) => (
  <div className={styles["dosha-error-container"]}>
    <div className={styles["dosha-error-icon"]}>⚠️</div>
    <p className={styles["dosha-error-message"]}>{message}</p>
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
    <div className={styles["dosha-results-container"]}>
      <div className={styles["dosha-results-header"]}>
        <h2>Your Dosha Analysis</h2>
        <div className={styles["dosha-display"]}>
          <span className={styles["dosha-icon"]}>{getDoshaIcon(results.primaryDosha)}</span>
          <h3 className={styles["dosha-type"]}>
            {results.primaryDosha}
            {results.secondaryDosha && ` - ${results.secondaryDosha}`}
          </h3>
          <p className={styles["dosha-subtype"]}>{results.doshaType}</p>
        </div>
      </div>

      <div className={styles["dosha-results-content"]}>
        <section className={styles["dosha-description-section"]}>
          <h4>About Your Constitution</h4>
          <p>{results.description}</p>
        </section>

        <section className={styles["dosha-characteristics-section"]}>
          <h4>Key Characteristics</h4>
          <ul>
            {results.characteristics.map((char, index) => (
              <li key={index}>{char}</li>
            ))}
          </ul>
        </section>

        <section className={styles["dosha-recommendations-section"]}>
          <h4>Dietary Recommendations</h4>
          <div className={styles["dosha-diet-columns"]}>
            <div className={styles["dosha-diet-favorable"]}>
              <h5>✅ Foods to Favor</h5>
              <ul>
                {results.dietaryRecommendations.favorable.map((food, index) => (
                  <li key={index}>{food}</li>
                ))}
              </ul>
            </div>
            <div className={styles["dosha-diet-avoid"]}>
              <h5>❌ Foods to Avoid</h5>
              <ul>
                {results.dietaryRecommendations.avoid.map((food, index) => (
                  <li key={index}>{food}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className={styles["dosha-lifestyle-section"]}>
          <h4>Lifestyle Recommendations</h4>
          <ul>
            {results.lifestyleRecommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </section>

        <section className={styles["dosha-remedies-section"]}>
          <h4>Ayurvedic Remedies</h4>
          <ul>
            {results.ayurvedicRemedies.map((remedy, index) => (
              <li key={index}>{remedy}</li>
            ))}
          </ul>
        </section>

        {results.dailyRoutine && (
          <section className={styles["dosha-routine-section"]}>
            <h4>Recommended Daily Routine</h4>
            <div className={styles["dosha-routine-grid"]}>
              <div className={styles["dosha-routine-time"]}>
                <h5>🌅 Morning</h5>
                <p>{results.dailyRoutine.morning}</p>
              </div>
              <div className={styles["dosha-routine-time"]}>
                <h5>☀️ Afternoon</h5>
                <p>{results.dailyRoutine.afternoon}</p>
              </div>
              <div className={styles["dosha-routine-time"]}>
                <h5>🌙 Evening</h5>
                <p>{results.dailyRoutine.evening}</p>
              </div>
            </div>
          </section>
        )}

        {results.seasonalGuidance && (
          <section className={styles["dosha-seasonal-section"]}>
            <h4>Seasonal Guidance</h4>
            <p>{results.seasonalGuidance}</p>
          </section>
        )}
      </div>

      <div className={styles["dosha-results-footer"]}>
        <button className={styles["dosha-restart-button"]} onClick={onRestart}>
          Take Assessment Again
        </button>
        <p className={styles["dosha-disclaimer"]}>
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
                onClick={() => handleNavigation('/')}
                className={styles["nav-link"]}
              >
                Home
              </button>
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
                onClick={() => handleNavigation('/')}
                className={styles["mobile-nav-link"]}
              >
                Home
              </button>
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
      <main className={styles["dosha-main"]}>
        <div className={styles["dosha"]}>
          <header className={styles["dosha-header"]}>
            <h1>🕉️ Prakriti Check</h1>
            <p className={styles["dosha-subtitle"]}>Discover your mind-body constitution</p>
          </header>

          <section className={styles["dosha-content"]}>
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

export default Dosha;