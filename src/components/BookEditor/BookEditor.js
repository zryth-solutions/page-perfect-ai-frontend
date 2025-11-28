/**
 * BookEditor Component
 * Main container for book editing workflow
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useBookEditor } from '../../hooks/useBookEditor';
import { useBookLock } from '../../hooks/useBookLock';
import ExtractionPanel from './ExtractionPanel';
import SplittingPanel from './SplittingPanel';
import EditorPanel from './EditorPanel';
import ExecutionReportsTab from './ExecutionReportsTab';
import './BookEditor.css';

const BookEditor = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  
  const {
    book,
    loading,
    error,
    extractionStatus,
    splittingStatus,
    splitFiles,
    isEditorReady
  } = useBookEditor(bookId);

  const {
    isLocked,
    hasLock,
    lockedBy,
    acquiring,
    acquireLock,
    releaseLock
  } = useBookLock(bookId);

  const [currentTab, setCurrentTab] = useState('extraction');

  // Auto-switch tabs based on status
  useEffect(() => {
    if (extractionStatus === 'completed' && splittingStatus === 'not_started') {
      setCurrentTab('splitting');
    } else if (splittingStatus === 'completed') {
      setCurrentTab('editor');
    }
  }, [extractionStatus, splittingStatus]);

  // Try to acquire lock when entering editor tab
  useEffect(() => {
    if (currentTab === 'editor' && !hasLock && !isLocked) {
      acquireLock();
    }
  }, [currentTab, hasLock, isLocked, acquireLock]);

  // Release lock on unmount
  useEffect(() => {
    return () => {
      if (hasLock) {
        releaseLock();
      }
    };
  }, [hasLock, releaseLock]);

  const handleBack = () => {
    if (hasLock) {
      const confirmLeave = window.confirm(
        'You have editing access. Are you sure you want to leave? Your lock will be released.'
      );
      if (!confirmLeave) return;
      releaseLock();
    }
    navigate(`/projects/${book?.projectId}/books`);
  };

  const handleExtractionComplete = (result) => {
    console.log('Extraction completed:', result);
  };

  const handleSplittingComplete = (result) => {
    console.log('Splitting completed:', result);
  };

  if (loading) {
    return (
      <div className="book-editor-loading">
        <div className="spinner-large"></div>
        <p>Loading book editor...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="book-editor-error">
        <h2>Error</h2>
        <p>{error || 'Book not found'}</p>
        <button onClick={() => navigate('/projects')} className="btn-secondary">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="book-editor">
      {/* Header */}
      <div className="editor-header">
        <button onClick={handleBack} className="btn-back">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 16L6 10L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <div className="editor-title">
          <h1>{book.title}</h1>
          <p className="editor-subtitle">{book.fileName}</p>
        </div>
        {currentTab === 'editor' && (
          <div className="editor-lock-status">
            {hasLock ? (
              <span className="lock-badge lock-owned">
                🔓 You have editing access
              </span>
            ) : isLocked ? (
              <span className="lock-badge lock-other">
                🔒 Locked by {lockedBy}
              </span>
            ) : (
              <span className="lock-badge lock-available">
                ✓ Available
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="editor-tabs">
        <button
          className={`tab ${currentTab === 'extraction' ? 'active' : ''}`}
          onClick={() => setCurrentTab('extraction')}
        >
          <span className="tab-icon">📄</span>
          <span className="tab-label">Extraction</span>
          {extractionStatus === 'completed' && <span className="tab-check">✓</span>}
        </button>
        
        <button
          className={`tab ${currentTab === 'splitting' ? 'active' : ''}`}
          onClick={() => setCurrentTab('splitting')}
          disabled={extractionStatus !== 'completed'}
        >
          <span className="tab-icon">✂️</span>
          <span className="tab-label">Splitting</span>
          {splittingStatus === 'completed' && <span className="tab-check">✓</span>}
        </button>
        
        <button
          className={`tab ${currentTab === 'editor' ? 'active' : ''}`}
          onClick={() => setCurrentTab('editor')}
          disabled={!isEditorReady()}
        >
          <span className="tab-icon">✏️</span>
          <span className="tab-label">Editor</span>
        </button>
        
        <button
          className={`tab ${currentTab === 'execution' ? 'active' : ''}`}
          onClick={() => setCurrentTab('execution')}
          disabled={!isEditorReady()}
        >
          <span className="tab-icon">⚡</span>
          <span className="tab-label">Execution & Reports</span>
        </button>
      </div>

      {/* Content */}
      <div className="editor-content">
        {currentTab === 'extraction' && (
          <ExtractionPanel
            book={book}
            extractionStatus={extractionStatus}
            onExtractionComplete={handleExtractionComplete}
          />
        )}

        {currentTab === 'splitting' && (
          <SplittingPanel
            book={book}
            splittingStatus={splittingStatus}
            splitFiles={splitFiles}
            onSplittingComplete={handleSplittingComplete}
          />
        )}

        {currentTab === 'editor' && (
          <EditorPanel
            book={book}
            splitFiles={splitFiles}
            hasLock={hasLock}
            isLocked={isLocked}
            onAcquireLock={acquireLock}
            acquiring={acquiring}
          />
        )}

        {currentTab === 'execution' && (
          <ExecutionReportsTab
            book={book}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
};

export default BookEditor;

