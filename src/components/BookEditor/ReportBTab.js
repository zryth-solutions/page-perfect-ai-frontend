/**
 * ReportBTab Component
 * Manages Report B upload (admin) and viewing (users)
 */

import React, { useState, useEffect } from 'react';
import { getReportB } from '../../services/reportBService';
import ReportBUpload from './ReportBUpload';
import ReportBViewer from './ReportBViewer';
import './ReportBTab.css';

const ReportBTab = ({ book, currentUser }) => {
  const [reportExists, setReportExists] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if current user is the book owner
  const isOwner = currentUser && book.userId === currentUser.uid;

  useEffect(() => {
    checkReportExists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id]);

  const checkReportExists = async () => {
    if (!book?.id) return;

    try {
      setLoading(true);
      const report = await getReportB(book.id);
      setReportExists(!!report);
    } catch (error) {
      console.error('Error checking report:', error);
      setReportExists(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setReportExists(true);
  };

  if (loading) {
    return (
      <div className="report-b-tab">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-b-tab">
      {/* Admin View: Upload interface */}
      {isOwner && (
        <div className="admin-section">
          <ReportBUpload
            bookId={book.id}
            userId={currentUser.uid}
            onUploadSuccess={handleUploadSuccess}
          />
          
          {reportExists && (
            <div className="admin-notice">
              <p>✓ A report has been uploaded. Users can now review and provide feedback.</p>
            </div>
          )}
        </div>
      )}

      {/* User View: Report viewer (if report exists) */}
      {reportExists && currentUser && (
        <div className="user-section">
          {isOwner && <div className="section-divider"></div>}
          <ReportBViewer
            bookId={book.id}
            userId={currentUser.uid}
          />
        </div>
      )}

      {/* No report message for non-owners */}
      {!isOwner && !reportExists && (
        <div className="no-report-message">
          <h3>📋 No Report Available</h3>
          <p>The book owner hasn't uploaded a quality check report yet.</p>
          <p>Once uploaded, you'll be able to review issues and provide feedback.</p>
        </div>
      )}
    </div>
  );
};

export default ReportBTab;

