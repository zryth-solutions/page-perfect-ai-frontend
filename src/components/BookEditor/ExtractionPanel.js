/**
 * ExtractionPanel Component
 * Handles PDF extraction UI and status
 */

import React, { useState } from 'react';
import { startExtraction } from '../../services/extractionService';
import './ExtractionPanel.css';

const ExtractionPanel = ({ book, extractionStatus, onExtractionComplete }) => {
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);

  const handleStartExtraction = async () => {
    if (!book || !book.filePath) {
      setError('No PDF file found for this book');
      return;
    }

    setExtracting(true);
    setError(null);

    try {
      console.log('Starting extraction for book:', book.id);
      const result = await startExtraction(book.id, book.filePath);

      if (result.success) {
        console.log('Extraction started successfully');
        // Status will be updated via real-time listener
        if (onExtractionComplete) {
          onExtractionComplete(result);
        }
      } else {
        setError(result.error || 'Failed to start extraction');
      }
    } catch (err) {
      console.error('Error starting extraction:', err);
      setError(err.message || 'Failed to start extraction');
    } finally {
      setExtracting(false);
    }
  };

  const getStatusIcon = () => {
    switch (extractionStatus) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '📄';
    }
  };

  const getStatusText = () => {
    switch (extractionStatus) {
      case 'completed':
        return 'Extraction Completed';
      case 'processing':
        return 'Extracting Content...';
      case 'failed':
        return 'Extraction Failed';
      default:
        return 'Ready to Extract';
    }
  };

  const getStatusClass = () => {
    switch (extractionStatus) {
      case 'completed':
        return 'status-success';
      case 'processing':
        return 'status-processing';
      case 'failed':
        return 'status-error';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="extraction-panel">
      <div className="panel-header">
        <h2>📄 PDF Extraction</h2>
        <p className="panel-subtitle">Extract content and images from your PDF using MinerU AI</p>
      </div>

      <div className={`status-card ${getStatusClass()}`}>
        <div className="status-icon">{getStatusIcon()}</div>
        <div className="status-content">
          <h3>{getStatusText()}</h3>
          {extractionStatus === 'not_started' && (
            <p>Click the button below to start extracting content from your PDF.</p>
          )}
          {extractionStatus === 'processing' && (
            <p>This may take 2-5 minutes depending on PDF size. Please wait...</p>
          )}
          {extractionStatus === 'completed' && (
            <div>
              <p>✓ Content extracted successfully</p>
              <p className="status-detail">Markdown and images are ready for processing</p>
            </div>
          )}
          {extractionStatus === 'failed' && error && (
            <p className="error-message">Error: {error}</p>
          )}
        </div>
      </div>

      {(extractionStatus === 'not_started' || extractionStatus === 'failed' || extractionStatus === 'completed') && (
        <div className="action-section">
          <button
            className="btn-primary btn-large"
            onClick={handleStartExtraction}
            disabled={extracting}
          >
            {extracting ? (
              <>
                <span className="spinner"></span>
                Starting Extraction...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {extractionStatus === 'not_started' ? 'Start Extraction' : 'Restart Extraction'}
              </>
            )}
          </button>
        </div>
      )}

      {extractionStatus === 'processing' && (
        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill animated"></div>
          </div>
          <p className="progress-text">Extracting content from PDF...</p>
        </div>
      )}

      {error && extractionStatus !== 'failed' && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="info-section">
        <h4>What happens during extraction:</h4>
        <ul className="info-list">
          <li>✓ PDF is sent to MinerU API v4 with Vision Language Model (VLM)</li>
          <li>✓ Content is extracted and converted to markdown format</li>
          <li>✓ Images are extracted and stored separately</li>
          <li>✓ Results are saved to Firebase Storage for processing</li>
        </ul>
      </div>
    </div>
  );
};

export default ExtractionPanel;

