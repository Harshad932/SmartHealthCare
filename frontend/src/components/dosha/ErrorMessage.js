// client/src/components/ErrorMessage.js
import React from 'react';
import '../../assets/styles/dosha/ErrorMessage.css';

const ErrorMessage = ({ message }) => {
  return (
    <div className="dosha-error-container">
      <div className="dosha-error-icon">⚠️</div>
      <p className="dosha-error-message">{message}</p>
    </div>
  );
};

export default ErrorMessage;