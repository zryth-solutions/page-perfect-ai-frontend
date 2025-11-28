/**
 * EditorPanel Component
 * Three-panel layout: FileExplorer + MarkdownEditor + PDFViewer
 */

import React, { useState } from 'react';
import { useFileOperations } from '../../hooks/useFileOperations';
import FileExplorer from './FileExplorer';
import MarkdownEditor from './MarkdownEditor';
import FullMdViewer from './FullMdViewer';
import ImageGallery from './ImageGallery';
import './EditorPanel.css';

const EditorPanel = ({ book, splitFiles, hasLock, isLocked, onAcquireLock, acquiring }) => {
  const {
    selectedFile,
    fileContent,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    loadFile,
    updateContent,
    saveFile,
    discardChanges
  } = useFileOperations(book.id);

  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleFileSelect = async (file) => {
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        'You have unsaved changes. Do you want to discard them and switch files?'
      );
      if (!confirmSwitch) return;
    }
    await loadFile(file);
  };

  const handleSave = async () => {
    const success = await saveFile();
    if (success) {
      // Show success message
      console.log('File saved successfully');
    }
  };

  const handleDiscard = async () => {
    const confirmDiscard = window.confirm(
      'Are you sure you want to discard all changes?'
    );
    if (confirmDiscard) {
      await discardChanges();
    }
  };

  const handleImageClick = (imagePath) => {
    setSelectedImage(imagePath);
    setShowImageGallery(true);
  };

  if (!hasLock && isLocked) {
    return (
      <div className="editor-panel-locked">
        <div className="locked-message">
          <span className="lock-icon">🔒</span>
          <h3>Book is Locked</h3>
          <p>This book is currently being edited by another user.</p>
          <p className="locked-detail">You can view the files but cannot make changes.</p>
        </div>
      </div>
    );
  }

  if (!hasLock && !isLocked) {
    return (
      <div className="editor-panel-locked">
        <div className="locked-message">
          <span className="lock-icon">🔓</span>
          <h3>Acquire Editing Access</h3>
          <p>Click the button below to start editing this book.</p>
          <button
            className="btn-primary btn-large"
            onClick={onAcquireLock}
            disabled={acquiring}
          >
            {acquiring ? (
              <>
                <span className="spinner"></span>
                Acquiring Access...
              </>
            ) : (
              'Start Editing'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-panel">
      {/* Top Bar */}
      <div className="editor-top-bar">
        <div className="editor-info">
          {selectedFile ? (
            <>
              <span className="file-name">📄 {selectedFile.name}</span>
              {hasUnsavedChanges && <span className="unsaved-badge">● Unsaved changes</span>}
            </>
          ) : (
            <span className="no-file">Select a file to start editing</span>
          )}
        </div>
        <div className="editor-actions">
          {selectedFile && (
            <>
              {hasUnsavedChanges && (
                <button
                  className="btn-secondary btn-small"
                  onClick={handleDiscard}
                  disabled={saving}
                >
                  Discard
                </button>
              )}
              <button
                className="btn-primary btn-small"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M16 4L7 13L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Save
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Three-Panel Layout */}
      <div className="editor-layout">
        {/* Left Panel: File Explorer */}
        <div className="editor-sidebar">
          <FileExplorer
            files={splitFiles}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>

        {/* Center Panel: Markdown Editor */}
        <div className="editor-main">
          <MarkdownEditor
            content={fileContent}
            onChange={updateContent}
            loading={loading}
            readOnly={!hasLock}
            onImageClick={handleImageClick}
            bookId={book.id}
          />
          {error && (
            <div className="editor-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Panel: Full.md Viewer */}
        <div className="editor-reference">
          <FullMdViewer bookId={book.id} />
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <ImageGallery
          bookId={book.id}
          imagePath={selectedImage}
          onClose={() => {
            setShowImageGallery(false);
            setSelectedImage(null);
          }}
        />
      )}
    </div>
  );
};

export default EditorPanel;

