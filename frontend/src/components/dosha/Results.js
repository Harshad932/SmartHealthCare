// client/src/components/Results.js
import React from 'react';
import '../../assets/styles/dosha/Results.css';

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

export default Results;