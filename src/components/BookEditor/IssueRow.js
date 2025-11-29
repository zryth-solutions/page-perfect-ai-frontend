/**
 * IssueRow Component
 * Displays a single issue with feedback controls
 */

import React, { useState, useEffect } from 'react';
import './IssueRow.css';

const IssueRow = ({ 
  issue, 
  issueType, 
  sourceFile, 
  itemId, 
  issueIndex,
  feedback,
  onFeedbackChange 
}) => {
  const [status, setStatus] = useState(feedback?.status || null);
  const [notes, setNotes] = useState(feedback?.notes || '');
  const [saving, setSaving] = useState(false);

  // Update local state when feedback prop changes
  useEffect(() => {
    setStatus(feedback?.status || null);
    setNotes(feedback?.notes || '');
  }, [feedback]);

  const handleStatusChange = async (newStatus) => {
    try {
      setSaving(true);
      setStatus(newStatus);
      await onFeedbackChange(sourceFile, itemId, issueType, issueIndex, newStatus, notes);
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert on error
      setStatus(feedback?.status || null);
    } finally {
      setSaving(false);
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handleNotesBlur = async () => {
    // Only save if notes changed
    if (notes === (feedback?.notes || '')) return;

    try {
      setSaving(true);
      await onFeedbackChange(sourceFile, itemId, issueType, issueIndex, status, notes);
    } catch (error) {
      console.error('Error updating notes:', error);
      // Revert on error
      setNotes(feedback?.notes || '');
    } finally {
      setSaving(false);
    }
  };

  const getIssueTypeLabel = () => {
    switch (issueType) {
      case 'question_issues':
        return 'Question';
      case 'answer_issues':
        return 'Answer';
      case 'conceptual_errors':
        return 'Conceptual';
      case 'logical_errors':
        return 'Logical';
      default:
        return issueType;
    }
  };

  const getIssueTypeBadgeClass = () => {
    switch (issueType) {
      case 'question_issues':
      case 'answer_issues':
        return 'badge-formatting';
      case 'conceptual_errors':
        return 'badge-conceptual';
      case 'logical_errors':
        return 'badge-logical';
      default:
        return 'badge-default';
    }
  };

  const renderIssueContent = () => {
    // For formatting issues (question_issues, answer_issues)
    if (issueType === 'question_issues' || issueType === 'answer_issues') {
      return (
        <>
          <div className="issue-field">
            <span className="field-label">Location:</span>
            <span className="field-value">{issue.location || 'N/A'}</span>
          </div>
          <div className="issue-field">
            <span className="field-label">Issue:</span>
            <span className="field-value">{issue.issue || 'N/A'}</span>
          </div>
          {issue.text && (
            <div className="issue-field">
              <span className="field-label">Text:</span>
              <code className="field-code">{issue.text}</code>
            </div>
          )}
          <div className="issue-field">
            <span className="field-label">Suggestion:</span>
            <span className="field-value suggestion">{issue.suggestion || 'N/A'}</span>
          </div>
        </>
      );
    }

    // For content errors (conceptual_errors, logical_errors)
    if (issueType === 'conceptual_errors' || issueType === 'logical_errors') {
      return (
        <>
          <div className="issue-field">
            <span className="field-label">Location:</span>
            <span className="field-value">{issue.location || 'N/A'}</span>
          </div>
          <div className="issue-field">
            <span className="field-label">Error Description:</span>
            <span className="field-value">{issue.error_description || 'N/A'}</span>
          </div>
          {issue.incorrect_content && (
            <div className="issue-field">
              <span className="field-label">Incorrect Content:</span>
              <code className="field-code error">{issue.incorrect_content}</code>
            </div>
          )}
          {issue.incorrect_value_or_statement && (
            <div className="issue-field">
              <span className="field-label">Incorrect Statement:</span>
              <code className="field-code error">{issue.incorrect_value_or_statement}</code>
            </div>
          )}
          <div className="issue-field">
            <span className="field-label">Correct Information:</span>
            <span className="field-value suggestion">
              {issue.correct_information || issue.correct_value_or_statement || 'N/A'}
            </span>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className={`issue-row ${saving ? 'saving' : ''}`}>
      <div className="issue-header">
        <span className={`issue-type-badge ${getIssueTypeBadgeClass()}`}>
          {getIssueTypeLabel()}
        </span>
        {issue.severity && (
          <span className={`severity-badge severity-${issue.severity}`}>
            {issue.severity}
          </span>
        )}
        {issue.type && (
          <span className="type-badge">
            {issue.type}
          </span>
        )}
      </div>

      <div className="issue-content">
        {renderIssueContent()}
      </div>

      <div className="issue-feedback">
        <div className="feedback-actions">
          <button
            className={`btn-feedback ${status === 'accepted' ? 'active' : ''}`}
            onClick={() => handleStatusChange('accepted')}
            disabled={saving}
            title="Accept this issue"
          >
            <span className="btn-icon">✓</span>
            Accept
          </button>
          <button
            className={`btn-feedback btn-reject ${status === 'rejected' ? 'active' : ''}`}
            onClick={() => handleStatusChange('rejected')}
            disabled={saving}
            title="Reject this issue"
          >
            <span className="btn-icon">✗</span>
            Reject
          </button>
        </div>

        <div className="feedback-notes">
          <label htmlFor={`notes-${sourceFile}-${itemId}-${issueIndex}`}>
            Notes:
          </label>
          <textarea
            id={`notes-${sourceFile}-${itemId}-${issueIndex}`}
            value={notes}
            onChange={handleNotesChange}
            onBlur={handleNotesBlur}
            placeholder="Add your notes here..."
            rows="2"
            disabled={saving}
          />
        </div>
      </div>

      {saving && (
        <div className="saving-indicator">
          <span className="spinner tiny"></span>
          Saving...
        </div>
      )}
    </div>
  );
};

export default IssueRow;

