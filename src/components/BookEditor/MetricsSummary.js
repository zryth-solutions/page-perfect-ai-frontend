/**
 * MetricsSummary Component
 * Displays feedback metrics and statistics
 */

import React from 'react';
import './MetricsSummary.css';

const MetricsSummary = ({ metrics }) => {
  if (!metrics) {
    return null;
  }

  const {
    totalIssues,
    accepted,
    rejected,
    pending,
    withNotes,
    manualIssuesCount,
    acceptanceRate,
    rejectionRate
  } = metrics;

  return (
    <div className="metrics-summary">
      <div className="metrics-header">
        <h3>📊 Your Feedback Summary</h3>
        <p>Overview of your review progress and feedback</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card metric-total">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <div className="metric-value">{totalIssues}</div>
            <div className="metric-label">Total Issues</div>
          </div>
        </div>

        <div className="metric-card metric-accepted">
          <div className="metric-icon">✓</div>
          <div className="metric-content">
            <div className="metric-value">{accepted}</div>
            <div className="metric-label">Accepted</div>
            <div className="metric-percentage">{acceptanceRate}%</div>
          </div>
        </div>

        <div className="metric-card metric-rejected">
          <div className="metric-icon">✗</div>
          <div className="metric-content">
            <div className="metric-value">{rejected}</div>
            <div className="metric-label">Rejected</div>
            <div className="metric-percentage">{rejectionRate}%</div>
          </div>
        </div>

        <div className="metric-card metric-pending">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <div className="metric-value">{pending}</div>
            <div className="metric-label">Pending Review</div>
          </div>
        </div>

        <div className="metric-card metric-notes">
          <div className="metric-icon">📝</div>
          <div className="metric-content">
            <div className="metric-value">{withNotes}</div>
            <div className="metric-label">With Notes</div>
          </div>
        </div>

        <div className="metric-card metric-manual">
          <div className="metric-icon">➕</div>
          <div className="metric-content">
            <div className="metric-value">{manualIssuesCount}</div>
            <div className="metric-label">You Added</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="metrics-progress">
        <div className="progress-label">Review Progress</div>
        <div className="progress-bar">
          <div 
            className="progress-fill progress-accepted" 
            style={{ width: `${acceptanceRate}%` }}
          ></div>
          <div 
            className="progress-fill progress-rejected" 
            style={{ width: `${rejectionRate}%` }}
          ></div>
        </div>
        <div className="progress-legend">
          <span className="legend-item">
            <span className="legend-color legend-accepted"></span>
            Accepted ({acceptanceRate}%)
          </span>
          <span className="legend-item">
            <span className="legend-color legend-rejected"></span>
            Rejected ({rejectionRate}%)
          </span>
          <span className="legend-item">
            <span className="legend-color legend-pending"></span>
            Pending ({(100 - parseFloat(acceptanceRate) - parseFloat(rejectionRate)).toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default MetricsSummary;

