/**
 * FullMdViewer Component
 * Displays the full extracted markdown for reference with image previews
 */

import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import MarkdownImageRenderer from './MarkdownImageRenderer';
import './FullMdViewer.css';

const FullMdViewer = ({ bookId }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImagePreviews, setShowImagePreviews] = useState(false);

  const loadFullMd = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the full.md file from Storage
      const fullMdPath = `books/${bookId}/extracted/full.md`;
      const storageRef = ref(storage, fullMdPath);
      const downloadUrl = await getDownloadURL(storageRef);

      // Fetch the content
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to load full.md');
      }

      const text = await response.text();
      setContent(text);
    } catch (err) {
      console.error('Error loading full.md:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFullMd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert('Full content copied to clipboard!');
  };

  const handleCopySelection = () => {
    const selection = window.getSelection().toString();
    if (selection) {
      navigator.clipboard.writeText(selection);
      alert('Selected text copied to clipboard!');
    } else {
      alert('Please select some text first');
    }
  };

  const highlightSearch = (text) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.split(regex).map((part, index) => 
      regex.test(part) ? <mark key={index}>{part}</mark> : part
    );
  };

  // Parse markdown images from content
  const parseImages = (text) => {
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
  };

  const images = useMemo(() => parseImages(content), [content]);

  if (loading) {
    return (
      <div className="full-md-viewer">
        <div className="full-md-loading">
          <div className="spinner"></div>
          <p>Loading full.md...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="full-md-viewer">
        <div className="full-md-error">
          <span className="error-icon">⚠️</span>
          <p>Error loading full.md</p>
          <small>{error}</small>
          <button className="btn-secondary btn-small" onClick={loadFullMd}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="full-md-viewer">
      {/* Header */}
      <div className="full-md-header">
        <div className="full-md-title">
          <span className="file-icon">📄</span>
          <span>full.md</span>
          <span className="file-size">({(content.length / 1024).toFixed(1)} KB)</span>
        </div>
        <div className="full-md-actions">
          {images.length > 0 && (
            <button
              className="btn-icon"
              onClick={() => setShowImagePreviews(!showImagePreviews)}
              title={showImagePreviews ? 'Hide images' : 'Show images'}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="7" cy="9" r="1.5" fill="currentColor"/>
                <path d="M2 13L6 9L9 12L13 8L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="btn-icon"
            onClick={handleCopySelection}
            title="Copy selected text"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M8 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V14C4 14.5304 4.21071 15.0391 4.58579 15.4142C4.96086 15.7893 5.46957 16 6 16H14C14.5304 16 15.0391 15.7893 15.4142 15.4142C15.7893 15.0391 16 14.5304 16 14V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className="btn-icon"
            onClick={handleCopy}
            title="Copy all content"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="6" y="6" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V4" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="full-md-content">
        <pre className="full-md-pre">
          <code>{searchTerm ? highlightSearch(content) : content}</code>
        </pre>
      </div>

      {/* Image previews section */}
      {showImagePreviews && images.length > 0 && (
        <div className="full-md-images">
          <div className="images-header">
            <h4>📸 Images ({images.length})</h4>
          </div>
          <div className="images-grid">
            {images.map((image, idx) => (
              <MarkdownImageRenderer
                key={idx}
                bookId={bookId}
                imagePath={image.path}
                readOnly={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="full-md-footer">
        <span className="footer-info">
          💡 Tip: Select text and click copy icon to copy specific sections
        </span>
        {images.length > 0 && (
          <span className="footer-info">
            📸 {images.length} image{images.length !== 1 ? 's' : ''} in document
          </span>
        )}
      </div>
    </div>
  );
};

export default FullMdViewer;

