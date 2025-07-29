// client/src/App.js
import React, { useState } from 'react';
import '../../assets/styles/dosha/Dosha.css';
import Welcome from './Welcome';
import QuestionCard from './QuestionCard';
import Results from './Results';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';
import { doshaAPI } from '../../services/api';

function Dosha() {
  const [stage, setStage] = useState('welcome'); // welcome, quiz, loading, results
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [doshaResults, setDoshaResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const startQuiz = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const question = await doshaAPI.getInitialQuestion();
      setCurrentQuestion(question);
      setStage('quiz');
    } catch (err) {
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
          // Analyze dosha
          await analyzeDoshaType(newAnswers);
        } else {
          setCurrentQuestion(nextQuestion);
        }
      } else {
        // We have enough answers, analyze dosha
        await analyzeDoshaType(newAnswers);
      }
    } catch (err) {
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
    <div className="dosha">
      <header className="dosha-header">
        <h1>🕉️ Ayurvedic Dosha Identifier</h1>
        <p className="dosha-subtitle">Discover your mind-body constitution</p>
      </header>

      <main className="dosha-main">
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
          <Results
            results={doshaResults}
            onRestart={resetQuiz}
          />
        )}
      </main>

      <footer className="dosha-footer">
        <p>© 2024 Ayurvedic Dosha Identifier | For educational purposes only</p>
      </footer>
    </div>
  );
}

export default Dosha;