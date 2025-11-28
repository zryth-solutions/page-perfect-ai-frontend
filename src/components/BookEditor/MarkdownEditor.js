/**
 * MarkdownEditor Component
 * Simple, reliable markdown editor with image preview
 * Using textarea for better cursor positioning and editing experience
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import MarkdownImageRenderer from './MarkdownImageRenderer';
import './MarkdownEditor.css';

const MarkdownEditor = ({ content, onChange, loading, readOnly, onImageClick, bookId }) => {
  const [showImagePreviews, setShowImagePreviews] = useState(false); // Default to false - only load when user clicks
  const textareaRef = useRef(null);

  // Parse markdown images from content
  const parseImages = useCallback((text) => {
    if (!text) return [];
    
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;
    
    while ((match = imageRegex.exec(text)) !== null) {
      images.push({
        fullMatch: match[0],
        alt: match[1],
        path: match[2],
        index: match.index
      });
    }
    
    return images;
  }, []);

  const images = useMemo(() => parseImages(content), [content, parseImages]);

  const handleImageDelete = useCallback((imagePath) => {
    if (!content || !onChange || readOnly) return;
    
    console.log('Deleting image from markdown:', imagePath);
    
    // Extract just the filename from the path
    const filename = imagePath.replace(/^(images\/|\.\.\/images\/)/, '');
    console.log('Extracted filename:', filename);
    
    // Create multiple regex patterns to match different image path formats
    // Matches: ![...](images/filename), ![...](../images/filename), ![...](filename)
    const patterns = [
      `!\\[[^\\]]*\\]\\(images/${filename}\\)`,
      `!\\[[^\\]]*\\]\\(\\.\\.\\/images/${filename}\\)`,
      `!\\[[^\\]]*\\]\\(${filename}\\)`,
      `!\\[[^\\]]*\\]\\([^)]*${filename}[^)]*\\)` // Catch-all for any path containing the filename
    ];
    
    let updatedContent = content;
    let changesMade = false;
    
    // Try each pattern
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'g');
      const beforeLength = updatedContent.length;
      updatedContent = updatedContent.replace(regex, '');
      if (updatedContent.length !== beforeLength) {
        changesMade = true;
        console.log(`Pattern matched and removed: ${pattern}`);
      }
    });
    
    if (changesMade) {
      console.log('Image references removed from markdown');
      onChange(updatedContent);
    } else {
      console.warn('No image references found to remove');
    }
  }, [content, onChange, readOnly]);

  if (loading) {
    return (
      <div className="markdown-loading">
        <div className="spinner-large"></div>
        <p>Loading file...</p>
      </div>
    );
  }

  if (!content && content !== '') {
    return (
      <div className="markdown-empty">
        <div className="empty-icon">📝</div>
        <h3>No File Selected</h3>
        <p>Select a file from the sidebar to start editing</p>
      </div>
    );
  }

  return (
    <div className="markdown-editor-wrapper">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <span className="editor-mode-label">Markdown Editor</span>
          {images.length > 0 && (
            <button
              className="btn-toggle-images"
              onClick={() => setShowImagePreviews(!showImagePreviews)}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="7" cy="9" r="1.5" fill="currentColor"/>
                <path d="M2 13L6 9L9 12L13 8L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {showImagePreviews ? 'Hide' : 'Show'} Images ({images.length})
            </button>
          )}
        </div>
        <div className="toolbar-right">
          <span className="char-count">{content?.length || 0} characters</span>
        </div>
      </div>

      {/* Textarea Editor */}
    <div className="markdown-editor-container">
        <textarea
          ref={textareaRef}
          className="markdown-textarea"
          value={content || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start editing markdown..."
          readOnly={readOnly}
          spellCheck={false}
      />
      {readOnly && (
        <div className="readonly-overlay">
          <span className="readonly-badge">Read Only</span>
          </div>
        )}
      </div>

      {/* Image previews section */}
      {showImagePreviews && images.length > 0 && bookId && (
        <div className="image-previews-section">
          <div className="previews-header">
            <h4>📸 Images in this file</h4>
            <span className="image-count">{images.length} image{images.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="image-previews-grid">
            {images.map((image, idx) => (
              <MarkdownImageRenderer
                key={`${bookId}-${image.path}-${idx}`}
                bookId={bookId}
                imagePath={image.path}
                onDelete={handleImageDelete}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;

