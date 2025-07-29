// client/src/components/Welcome.js
import React from 'react';
import '../../assets/styles/dosha/Welcome.css';

const Welcome = ({ onStart }) => {
  return (
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
};

export default Welcome;