import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import ReactMarkdown from 'react-markdown';
import useMarkdownSync from '../hooks/useMarkdownSync';
import './BookReport.css';

const BookReport = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportType = searchParams.get('report') || 'A'; // Default to 'A'
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bookRef = doc(db, 'books', bookId);
    
    const unsubscribe = onSnapshot(bookRef, (docSnap) => {
      if (docSnap.exists()) {
        const bookData = { id: docSnap.id, ...docSnap.data() };
        setBook(bookData);
      } else {
        navigate('/books');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [bookId, navigate]);

  // Sync markdown files from storage to Firestore
  useMarkdownSync(book);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="shimmer-loader">
          <div className="shimmer-bar"></div>
          <div className="shimmer-bar"></div>
          <div className="shimmer-bar"></div>
          <div className="shimmer-bar"></div>
          <div className="shimmer-bar"></div>
        </div>
        <p className="loading-text">Loading book report...</p>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  const handleBack = () => {
    // If book belongs to a project, navigate back to project books page
    if (book?.projectId) {
      navigate(`/projects/${book.projectId}/books`);
    } else {
      // Otherwise, navigate to /books (for books not in a project)
      navigate('/books');
    }
  };

  return (
    <div className="report-container">
      <nav className="report-nav">
        <button onClick={handleBack} className="back-button">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      </nav>

      <div className="report-main">
        <div className="report-header card">
          <div className="report-header-content">
            <div className="report-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M12 6H36C37.6569 6 39 7.34315 39 9V39C39 40.6569 37.6569 42 36 42H12C10.3431 42 9 40.6569 9 39V9C9 7.34315 10.3431 6 12 6Z" fill="url(#gradient)" fillOpacity="0.2" stroke="url(#gradient)" strokeWidth="2"/>
                <path d="M15 14H33M15 20H33M15 26H24" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="gradient" x1="9" y1="6" x2="39" y2="42">
                    <stop stopColor="#6366f1"/>
                    <stop offset="1" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="report-header-info">
              <h1 className="report-title">{book.title}</h1>
              <div className="report-meta">
                <span className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 4V8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Uploaded {new Date(book.uploadedAt).toLocaleDateString()}
                </span>
                <span className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 4H13C13.5523 4 14 4.44772 14 5V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V5C2 4.44772 2.44772 4 3 4Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 8H14" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 2V4M11 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {book.fileName}
                </span>
              </div>
            </div>
          </div>
          <div className={`report-status status-${book.status}`}>
            {book.status === 'completed' && '✓ Analysis Complete'}
            {book.status === 'processing' && (
              <span>
                ⟳ Processing
                <span className="loading-dots">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </span>
              </span>
            )}
            {book.status === 'pending' && '⏱ Pending'}
          </div>
        </div>

        {book.status === 'completed' && (book.reportData || book.reportDataB) ? (
          <div className="report-content card">
            <div className="report-body">
              {reportType === 'A' && book.reportData ? (
                <ReactMarkdown>{book.reportData}</ReactMarkdown>
              ) : reportType === 'B' && book.reportDataB ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: book.reportDataB }}
                  style={{ 
                    maxWidth: '100%',
                    overflow: 'auto'
                  }}
                />
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {reportType === 'A' 
                    ? 'Report A (Markdown) is not available yet.' 
                    : 'Report B (HTML) is not available yet.'}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="report-pending card">
            <div className="pending-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/>
                <path d="M32 20V32L40 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h2>Report in Progress</h2>
            <p>
              {book.status === 'processing' 
                ? 'Your manuscript is currently being analyzed. This may take some time depending on the length and complexity of your book.'
                : 'Your manuscript is in the queue for review. You will be notified once the analysis is complete.'}
            </p>
            <div className="pending-steps">
              <div className={`step ${book.status !== 'pending' ? 'completed' : ''}`}>
                <div className="step-icon">1</div>
                <div className="step-info">
                  <h4>Upload Complete</h4>
                  <p>Book uploaded successfully</p>
                </div>
              </div>
              <div className={`step ${book.status === 'completed' ? 'completed' : book.status === 'processing' ? 'active' : ''}`}>
                <div className="step-icon">2</div>
                <div className="step-info">
                  <h4>AI Analysis</h4>
                  <p>Processing manuscript content</p>
                </div>
              </div>
              <div className={`step ${book.status === 'completed' ? 'completed' : ''}`}>
                <div className="step-icon">3</div>
                <div className="step-info">
                  <h4>Report Ready</h4>
                  <p>Comprehensive review available</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookReport;

