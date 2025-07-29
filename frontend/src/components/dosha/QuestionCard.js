// client/src/components/QuestionCard.js
import React, { useState } from 'react';
import '../../assets/styles/dosha/QuestionCard.css';

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

export default QuestionCard;