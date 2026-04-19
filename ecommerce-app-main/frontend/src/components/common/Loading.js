/**
 * ===========================================
 * LOADING COMPONENT
 * ===========================================
 * 
 * Reusable loading spinner.
 */

import React from 'react';
import './Loading.css';

const Loading = ({ fullScreen = false, size = 'medium', text = 'Loading...' }) => {
  const sizeClass = `loading-spinner-${size}`;
  
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-content">
          <div className={`loading-spinner ${sizeClass}`}></div>
          {text && <p className="loading-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading">
      <div className={`loading-spinner ${sizeClass}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default Loading;
