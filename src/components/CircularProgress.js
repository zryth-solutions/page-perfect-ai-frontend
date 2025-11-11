import React from 'react';
import './CircularProgress.css';

const CircularProgress = ({ percentage }) => {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-track">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        >
          <span className="progress-percentage">{percentage}%</span>
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;
