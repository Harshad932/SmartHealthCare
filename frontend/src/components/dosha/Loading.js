// client/src/components/Loading.js
import React from 'react';
import '../../assets/styles/dosha/Loading.css';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="dosha-loading-container">
      <div className="dosha-loading-spinner">
        <div className="dosha-spinner-ring"></div>
        <div className="dosha-spinner-ring"></div>
        <div className="dosha-spinner-ring"></div>
      </div>
      <p className="dosha-loading-message">{message}</p>
    </div>
  );
};

export default Loading;