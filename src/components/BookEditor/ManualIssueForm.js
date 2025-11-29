/**
 * ManualIssueForm Component
 * Form for users to add issues not found in the report
 */

import React, { useState } from 'react';
import './ManualIssueForm.css';

const ManualIssueForm = ({ sourceFiles = [], manualIssues = [], onAddIssue, onDeleteIssue }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    sourceFile: '',
    questionNumber: '',
    issueDescription: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.sourceFile || !formData.questionNumber || !formData.issueDescription.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      await onAddIssue(formData);
      
      // Reset form
      setFormData({
        sourceFile: '',
        questionNumber: '',
        issueDescription: ''
      });
      setShowForm(false);
      
    } catch (error) {
      console.error('Error adding issue:', error);
      alert('Failed to add issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      sourceFile: '',
      questionNumber: '',
      issueDescription: ''
    });
    setShowForm(false);
  };

  const handleDelete = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) {
      return;
    }

    try {
      await onDeleteIssue(issueId);
    } catch (error) {
      console.error('Error deleting issue:', error);
      alert('Failed to delete issue. Please try again.');
    }
  };

  return (
    <div className="manual-issue-form-container">
      <div className="manual-issue-header">
        <h3>➕ Add Missing Issues</h3>
        <p>Found issues that the report didn't catch? Add them here.</p>
      </div>

      {!showForm ? (
        <button 
          className="btn-add-issue"
          onClick={() => setShowForm(true)}
        >
          <span>+</span>
          Add New Issue
        </button>
      ) : (
        <form className="manual-issue-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sourceFile">Source File *</label>
            <select
              id="sourceFile"
              value={formData.sourceFile}
              onChange={(e) => handleInputChange('sourceFile', e.target.value)}
              required
              disabled={submitting}
            >
              <option value="">Select a file...</option>
              {sourceFiles.map(file => (
                <option key={file} value={file}>{file}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="questionNumber">Question Number *</label>
            <input
              id="questionNumber"
              type="text"
              value={formData.questionNumber}
              onChange={(e) => handleInputChange('questionNumber', e.target.value)}
              placeholder="e.g., (i), 2(ii), Q7"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="issueDescription">Issue Description *</label>
            <textarea
              id="issueDescription"
              value={formData.issueDescription}
              onChange={(e) => handleInputChange('issueDescription', e.target.value)}
              placeholder="Describe the issue you found..."
              rows="4"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Issue'}
            </button>
            <button 
              type="button" 
              className="btn-cancel"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {manualIssues.length > 0 && (
        <div className="manual-issues-list">
          <h4>Your Added Issues ({manualIssues.length})</h4>
          <div className="issues-list">
            {manualIssues.map(issue => (
              <div key={issue.id} className="manual-issue-item">
                <div className="issue-item-header">
                  <span className="issue-file">{issue.sourceFile}</span>
                  <span className="issue-question">Q{issue.questionNumber}</span>
                </div>
                <div className="issue-item-description">
                  {issue.issueDescription}
                </div>
                <button
                  className="btn-delete-issue"
                  onClick={() => handleDelete(issue.id)}
                  title="Delete this issue"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualIssueForm;

