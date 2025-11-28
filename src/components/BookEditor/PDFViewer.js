/**
 * PDFViewer Component
 * Display PDF with zoom and navigation controls
 */

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PDFViewer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF');
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  if (!pdfUrl) {
    return (
      <div className="pdf-viewer-empty">
        <div className="empty-icon">📄</div>
        <p>No PDF available</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      {/* Controls */}
      <div className="pdf-controls">
        <div className="pdf-navigation">
          <button
            className="pdf-btn"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            title="Previous page"
          >
            ◀
          </button>
          <span className="pdf-page-info">
            {pageNumber} / {numPages || '?'}
          </span>
          <button
            className="pdf-btn"
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1)}
            title="Next page"
          >
            ▶
          </button>
        </div>

        <div className="pdf-zoom">
          <button
            className="pdf-btn"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            title="Zoom out"
          >
            −
          </button>
          <span className="pdf-zoom-info">{Math.round(scale * 100)}%</span>
          <button
            className="pdf-btn"
            onClick={zoomIn}
            disabled={scale >= 2.0}
            title="Zoom in"
          >
            +
          </button>
          <button
            className="pdf-btn"
            onClick={resetZoom}
            title="Reset zoom"
          >
            ⟲
          </button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="pdf-content">
        {loading && (
          <div className="pdf-loading">
            <div className="spinner-large"></div>
            <p>Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="pdf-error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          error=""
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;

