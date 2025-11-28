/**
 * SplittingPanel Component
 * Handles content splitting UI and status with pattern configuration
 */

import React, { useState, useEffect } from 'react';
import { startSplitting } from '../../services/splittingService';
import PatternEditor from './PatternEditor';
import './SplittingPanel.css';

const SplittingPanel = ({ book, splittingStatus, splitFiles, onSplittingComplete }) => {
  const [error, setError] = useState(null);
  const [showPatternEditor, setShowPatternEditor] = useState(false);
  const [customPatterns, setCustomPatterns] = useState(null);

  // Auto-trigger splitting when extraction completes
  useEffect(() => {
    const shouldAutoSplit = 
      book?.extraction?.status === 'completed' &&
      splittingStatus === 'not_started';

    if (shouldAutoSplit) {
      handleStartSplitting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, splittingStatus]);

  const handleStartSplitting = async (patterns = null) => {
    if (!book || !book.extraction?.fullMdPath) {
      setError('No extracted content found');
      return;
    }

    setError(null);
    setShowPatternEditor(false);

    try {
      console.log('Starting splitting for book:', book.id);
      console.log('Using patterns:', patterns || 'default');
      
      const result = await startSplitting(
        book.id, 
        book.extraction.fullMdPath,
        patterns
      );

      if (result.success) {
        console.log('Splitting started successfully');
        if (patterns) {
          setCustomPatterns(patterns);
        }
        if (onSplittingComplete) {
          onSplittingComplete(result);
        }
      } else {
        setError(result.error || 'Failed to start splitting');
      }
    } catch (err) {
      console.error('Error starting splitting:', err);
      setError(err.message || 'Failed to start splitting');
    }
  };

  const handleConfigurePatterns = () => {
    setShowPatternEditor(true);
  };

  const handlePatternsSubmit = (patterns) => {
    handleStartSplitting(patterns);
  };

  const handleRetry = () => {
    if (customPatterns) {
      // Use custom patterns if they were set before
      handleStartSplitting(customPatterns);
    } else {
      // Show pattern editor for manual configuration
      setShowPatternEditor(true);
    }
  };

  const getStatusIcon = () => {
    switch (splittingStatus) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '✂️';
    }
  };

  const getStatusText = () => {
    switch (splittingStatus) {
      case 'completed':
        return 'Content Split Successfully';
      case 'processing':
        return 'Splitting Content...';
      case 'failed':
        return 'Splitting Failed';
      default:
        return 'Ready to Split';
    }
  };

  const getStatusClass = () => {
    switch (splittingStatus) {
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

  const categorizeFiles = () => {
    const categories = {
      questions: [],
      answerKeys: [],
      explanations: []
    };

    splitFiles.forEach(file => {
      if (file.category === 'question') {
        categories.questions.push(file);
      } else if (file.category === 'answer_key') {
        categories.answerKeys.push(file);
      } else if (file.category === 'explanation') {
        categories.explanations.push(file);
      }
    });

    return categories;
  };

  const categories = categorizeFiles();

  return (
    <div className="splitting-panel">
      <div className="panel-header">
        <h2>✂️ Content Splitting</h2>
        <p className="panel-subtitle">Organize extracted content into structured sections</p>
      </div>

      <div className={`status-card ${getStatusClass()}`}>
        <div className="status-icon">{getStatusIcon()}</div>
        <div className="status-content">
          <h3>{getStatusText()}</h3>
          {splittingStatus === 'not_started' && (
            <>
              <p>Waiting for extraction to complete...</p>
              <button 
                className="btn-configure"
                onClick={handleConfigurePatterns}
                disabled={!book?.extraction?.fullMdPath}
              >
                🎯 Configure Custom Patterns
              </button>
            </>
          )}
          {splittingStatus === 'processing' && (
            <p>Splitting content into structured files. This will take a moment...</p>
          )}
          {splittingStatus === 'completed' && (
            <div>
              <p>✓ Content split into {splitFiles.length} files</p>
              <p className="status-detail">Ready for editing</p>
              {customPatterns && (
                <p className="custom-pattern-badge">✓ Used custom patterns</p>
              )}
              <button 
                className="btn-resplit"
                onClick={handleConfigurePatterns}
              >
                🔄 Re-split with Different Patterns
              </button>
            </div>
          )}
          {splittingStatus === 'failed' && (
            <div>
              <p className="error-message">Error: {error}</p>
              <p className="error-hint">
                💡 The patterns might not match your PDF structure.
              </p>
              <button 
                className="btn-retry"
                onClick={handleRetry}
              >
                🎯 Configure Patterns & Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {splittingStatus === 'processing' && (
        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill animated"></div>
          </div>
          <p className="progress-text">Analyzing and splitting content...</p>
        </div>
      )}

      {splittingStatus === 'completed' && splitFiles.length > 0 && (
        <div className="files-preview">
          <h4>Generated Files ({splitFiles.length})</h4>
          
          <div className="file-categories">
            {categories.questions.length > 0 && (
              <div className="file-category">
                <h5>📋 Questions ({categories.questions.length})</h5>
                <ul className="file-list">
                  {categories.questions.map((file, idx) => (
                    <li key={idx} className="file-item">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {categories.answerKeys.length > 0 && (
              <div className="file-category">
                <h5>🔑 Answer Keys ({categories.answerKeys.length})</h5>
                <ul className="file-list">
                  {categories.answerKeys.map((file, idx) => (
                    <li key={idx} className="file-item">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {categories.explanations.length > 0 && (
              <div className="file-category">
                <h5>💡 Explanations ({categories.explanations.length})</h5>
                <ul className="file-list">
                  {categories.explanations.map((file, idx) => (
                    <li key={idx} className="file-item">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {error && splittingStatus !== 'failed' && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="info-section">
        <h4>Content Structure:</h4>
        <ul className="info-list">
          <li>✓ <strong>Questions:</strong> Theory, Competency, Level 1 & 2, Achievers</li>
          <li>✓ <strong>Answer Keys:</strong> Complete answer keys for all sections</li>
          <li>✓ <strong>Explanations:</strong> Detailed explanations for all questions</li>
          <li>✓ <strong>Level 1:</strong> Split into Part 1 (Q1-12) and Part 2 (Q13-25)</li>
          <li>✓ <strong>Level 2:</strong> Split into Part 1 (Q1-10) and Part 2 (Q11-20)</li>
        </ul>
        
        {splittingStatus === 'not_started' && book?.extraction?.fullMdPath && (
          <div className="pattern-info-box">
            <p className="info-highlight">
              💡 <strong>Patterns not matching?</strong> Click "Configure Custom Patterns" 
              to manually set the heading patterns for your PDF structure.
            </p>
          </div>
        )}
      </div>

      {/* Pattern Editor Modal */}
      {showPatternEditor && (
        <PatternEditor
          bookId={book.id}
          onPatternsSubmit={handlePatternsSubmit}
          onCancel={() => setShowPatternEditor(false)}
        />
      )}
    </div>
  );
};

export default SplittingPanel;

