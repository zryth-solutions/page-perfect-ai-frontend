/**
 * MarkdownImageRenderer Component
 * Renders markdown images with preview and delete functionality
 */

import React, { useState, useEffect } from 'react';
import { storage } from '../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import './MarkdownImageRenderer.css';

const MarkdownImageRenderer = ({ 
  bookId, 
  imagePath, 
  onDelete, 
  readOnly = false 
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const loadImage = async () => {
      try {
        if (!mounted) return;
        
        setLoading(true);
        setError(null);

        // Extract filename from markdown path
        const filename = imagePath.replace(/^(images\/|\.\.\/images\/)/, '');
        
        // Construct full Firebase Storage path
        const storagePath = `books/${bookId}/extracted/images/${filename}`;
        
        console.log(`Loading image: ${storagePath}`);
        
        const storageRef = ref(storage, storagePath);
        const url = await getDownloadURL(storageRef);
        
        if (mounted) {
          setImageUrl(url);
          console.log(`Image loaded successfully: ${filename}`);
        }
      } catch (err) {
        console.error(`Error loading image (attempt ${retryCount + 1}/${maxRetries}):`, imagePath, err);
        
        if (mounted && retryCount < maxRetries) {
          // Retry after a delay
          retryCount++;
          setTimeout(() => {
            if (mounted) {
              loadImage();
            }
          }, 1000 * retryCount); // Exponential backoff: 1s, 2s, 3s
        } else if (mounted) {
          setError(err.message || 'Failed to load image');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [imagePath, bookId]);

  const handleDelete = async () => {
    if (readOnly) return;

    try {
      setDeleting(true);
      
      console.log('Starting image deletion process for:', imagePath);
      
      // First, notify parent to remove from markdown
      if (onDelete) {
        console.log('Removing image reference from markdown...');
        onDelete(imagePath);
      }
      
      // Extract filename
      const filename = imagePath.replace(/^(images\/|\.\.\/images\/)/, '');
      const fullPath = `books/${bookId}/extracted/images/${filename}`;
      
      console.log('Deleting image from Firebase Storage:', fullPath);
      
      // Call Firebase function to delete image
      const deleteImageFn = httpsCallable(functions, 'deleteImage');
      const result = await deleteImageFn({
        bookId,
        imagePath: fullPath
      });

      if (result.data.success) {
        console.log('Image deleted successfully from storage');
        alert('Image deleted successfully! Remember to save the file.');
      } else {
        throw new Error(result.data.error || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert(`Failed to delete image from storage: ${err.message}\nThe image reference was removed from the markdown.`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="markdown-image-renderer loading">
        <div className="image-spinner"></div>
        <span className="image-loading-text">Loading image...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="markdown-image-renderer error">
        <span className="error-icon">🖼️</span>
        <span className="error-text">Image not found: {imagePath}</span>
        {!readOnly && (
          <button 
            className="btn-delete-broken"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Remove
          </button>
        )}
        {showDeleteConfirm && (
          <div className="delete-confirm">
            <p>Remove this broken image reference?</p>
            <button onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Removing...' : 'Yes'}
            </button>
            <button onClick={() => setShowDeleteConfirm(false)}>No</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="markdown-image-renderer">
      <div className="image-container">
        <img 
          src={imageUrl} 
          alt={imagePath}
          className="rendered-image"
        />
        {!readOnly && (
          <div className="image-overlay">
            <button
              className="btn-delete-image"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete this image"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path 
                  d="M6 7V16C6 16.5523 6.44772 17 7 17H13C13.5523 17 14 16.5523 14 16V7M6 7H4M6 7H8M14 7H16M14 7H12M8 7V5C8 4.44772 8.44772 4 9 4H11C11.5523 4 12 4.44772 12 5V7M8 7H12" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
                <path d="M9 10V14M11 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
      
      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="modal-content">
            <h4>Delete Image?</h4>
            <p>This will remove the image from storage and all markdown references.</p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="spinner-small"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="image-info">
        <span className="image-filename">{imagePath}</span>
      </div>
    </div>
  );
};

export default MarkdownImageRenderer;

