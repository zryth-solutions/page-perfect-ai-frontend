/**
 * ReportBPage - Standalone page for viewing Report B
 * Opens in a new tab from the books list
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import ReportBViewer from '../components/BookEditor/ReportBViewer';
import './ReportBPage.css';

const ReportBPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return (
      <div className="report-b-page">
        <div className="auth-required">
          <h2>🔒 Authentication Required</h2>
          <p>Please log in to view this report.</p>
          <button onClick={() => navigate('/login')} className="btn-login">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-b-page">
      <div className="report-b-header">
        <button onClick={() => window.close()} className="btn-close-tab">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Close
        </button>
        <h1>Quality Check Report</h1>
      </div>
      
      <ReportBViewer bookId={bookId} userId={currentUser.uid} />
    </div>
  );
};

export default ReportBPage;

