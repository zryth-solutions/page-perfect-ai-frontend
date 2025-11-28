/**
 * ImageGallery Component
 * Modal for image preview and deletion
 */

import React, { useState, useEffect } from 'react';
import { getFileURL } from '../../services/storageService';
import { deleteImage } from '../../services/cloudFunctions';
import './ImageGallery.css';

const ImageGallery = ({ bookId, imagePath, onClose, onImageDeleted }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePath]);

  const loadImage = async () => {
    if (!imagePath) return;

    setLoading(true);
    setError(null);

    try {
      const url = await getFileURL(imagePath);
      setImageUrl(url);
    } catch (err) {
      console.error('Error loading image:', err);
      setError('Failed to load image');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this image? This will remove it from all files that reference it.'
    );

    if (!confirmDelete) return;

    setDeleting(true);
    setError(null);

    try {
      const result = await deleteImage(bookId, imagePath, []);

      if (result.success) {
        console.log('Image deleted successfully');
        if (onImageDeleted) {
          onImageDeleted(imagePath);
        }
        onClose();
      } else {
        setError(result.error || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err.message || 'Failed to delete image');
    } finally {
      setDeleting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getImageName = () => {
    if (!imagePath) return '';
    const parts = imagePath.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="image-gallery-overlay" onClick={handleOverlayClick}>
      <div className="image-gallery-modal">
        {/* Header */}
        <div className="gallery-header">
          <h3>Image Preview</h3>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Content */}
        <div className="gallery-content">
          {loading && (
            <div className="gallery-loading">
              <div className="spinner-large"></div>
              <p>Loading image...</p>
            </div>
          )}

          {error && (
            <div className="gallery-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && imageUrl && (
            <div className="gallery-image-container">
              <img src={imageUrl} alt={getImageName()} className="gallery-image" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="gallery-footer">
          <div className="image-info">
            <span className="image-name">{getImageName()}</span>
          </div>
          <div className="gallery-actions">
            <button
              className="btn-secondary"
              onClick={onClose}
              disabled={deleting}
            >
              Close
            </button>
            <button
              className="btn-danger"
              onClick={handleDelete}
              disabled={deleting || loading}
            >
              {deleting ? (
                <>
                  <span className="spinner-small"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Delete Image
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;

