/**
 * ReportBViewer Component
 * Displays Report B in a flat table format with pagination
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useReportBFeedback } from '../../hooks/useReportBFeedback';
import ManualIssueForm from './ManualIssueForm';
import MetricsSummary from './MetricsSummary';
import LaTeXRenderer from './LaTeXRenderer';
import './ReportBViewer.css';
import './LaTeXRenderer.css';

const ReportBViewer = ({ bookId, userId }) => {
  const {
    reportData,
    manualIssues,
    loading,
    error,
    getFeedbackForIssue,
    updateFeedback,
    addIssue,
    removeIssue,
    getMetrics
  } = useReportBFeedback(bookId, userId);

  const [filter, setFilter] = useState('all'); // 'all', 'my_feedback'
  const [issueTypeFilter, setIssueTypeFilter] = useState('all'); // 'all', 'Grammar', 'Conceptual', 'Logical'
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIssues, setExpandedIssues] = useState({});
  const [savingFeedback, setSavingFeedback] = useState({});
  const [editingNotes, setEditingNotes] = useState({});
  const itemsPerPage = 25;
  const isInitialMount = useRef(true);

  // Scroll to top when page changes
  useEffect(() => {
    // Skip scroll on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Scroll to top smoothly when page changes
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [currentPage]);

  // Flatten all issues into a single array - preserving exact JSON order
  const flattenedIssues = useMemo(() => {
    if (!reportData?.reportData?.results_by_source_file) return [];

    const results = reportData.reportData.results_by_source_file;
    const allIssues = [];

    // Use stored file order if available, otherwise fall back to Object.keys()
    const fileNames = reportData.fileOrder || Object.keys(results);

    // Process each file in the exact order from JSON
    fileNames.forEach(sourceFile => {
      const items = results[sourceFile];
      if (!items) return; // Skip if file doesn't exist in results
      
      // Process each item in the order it appears
      items.forEach(item => {
        const itemId = item.item_id;

        // Process question_issues in order
        (item.question_issues || []).forEach((issue, idx) => {
          allIssues.push({
            id: `${sourceFile}_${itemId}_question_${idx}`,
            sourceFile,
            questionNumber: itemId,
            issueType: 'Grammar',
            severity: issue.severity || 'medium',
            location: issue.location || 'Question',
            issue: issue.issue || '',
            suggestion: issue.suggestion || '',
            originalIssue: issue
          });
        });

        // Process answer_issues in order
        (item.answer_issues || []).forEach((issue, idx) => {
          allIssues.push({
            id: `${sourceFile}_${itemId}_answer_${idx}`,
            sourceFile,
            questionNumber: itemId,
            issueType: 'Grammar',
            severity: issue.severity || 'medium',
            location: issue.location || 'Answer',
            issue: issue.issue || '',
            suggestion: issue.suggestion || '',
            originalIssue: issue
          });
        });

        // Process conceptual_errors in order
        (item.conceptual_errors || []).forEach((error, idx) => {
          allIssues.push({
            id: `${sourceFile}_${itemId}_conceptual_${idx}`,
            sourceFile,
            questionNumber: itemId,
            issueType: 'Conceptual',
            severity: error.severity || 'high',
            location: error.location || 'Content',
            issue: error.error_description || '',
            suggestion: error.correct_information || '',
            originalIssue: error
          });
        });

        // Process logical_errors in order
        (item.logical_errors || []).forEach((error, idx) => {
          allIssues.push({
            id: `${sourceFile}_${itemId}_logical_${idx}`,
            sourceFile,
            questionNumber: itemId,
            issueType: 'Logical',
            severity: error.severity || 'critical',
            location: error.location || 'Logic',
            issue: error.error_description || '',
            suggestion: error.correct_value_or_statement || error.correct_information || '',
            originalIssue: error
          });
        });
      });
    });

    return allIssues;
  }, [reportData]);

  // Filter issues based on feedback and issue type
  const filteredIssues = useMemo(() => {
    let issues = flattenedIssues;

    // Filter by feedback
    if (filter === 'my_feedback') {
      issues = issues.filter(issue => {
        const fb = getFeedbackForIssue(issue.id);
        return fb && (fb.status || fb.notes);
      });
    }

    // Filter by issue type
    if (issueTypeFilter !== 'all') {
      issues = issues.filter(issue => issue.issueType === issueTypeFilter);
    }

    return issues;
  }, [flattenedIssues, filter, issueTypeFilter, getFeedbackForIssue]);

  // Pagination
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const paginatedIssues = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredIssues.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredIssues, currentPage, itemsPerPage]);

  // Toggle issue expansion
  const toggleIssueExpansion = (issueId, field) => {
    setExpandedIssues(prev => ({
      ...prev,
      [`${issueId}_${field}`]: !prev[`${issueId}_${field}`]
    }));
  };

  // Truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  };

  // Handle feedback change (Accept/Reject)
  const handleFeedbackChange = useCallback(async (issueId, status) => {
    try {
      setSavingFeedback(prev => ({ ...prev, [issueId]: true }));
      await updateFeedback(issueId, { status });
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Failed to save feedback. Please try again.');
    } finally {
      setSavingFeedback(prev => ({ ...prev, [issueId]: false }));
    }
  }, [updateFeedback]);

  // Handle notes input change
  const handleNotesInputChange = (issueId, value) => {
    setEditingNotes(prev => ({
      ...prev,
      [issueId]: value
    }));
  };

  // Handle save notes
  const handleSaveNotes = useCallback(async (issueId) => {
    try {
      setSavingFeedback(prev => ({ ...prev, [`${issueId}_notes`]: true }));
      const notes = editingNotes[issueId] || '';
      await updateFeedback(issueId, { notes });
      // Notes saved successfully (no alert)
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSavingFeedback(prev => ({ ...prev, [`${issueId}_notes`]: false }));
    }
  }, [updateFeedback, editingNotes]);

  // Get issue type color
  const getIssueTypeColor = (type) => {
    switch (type) {
      case 'Grammar': return '#3b82f6';
      case 'Conceptual': return '#8b5cf6';
      case 'Logical': return '#ec4899';
      default: return '#6b7280';
    }
  };

  // Get source files for manual issue form
  const sourceFiles = useMemo(() => {
    if (!reportData?.reportData?.results_by_source_file) return [];
    return Object.keys(reportData.reportData.results_by_source_file);
  }, [reportData]);

  // Initialize editing notes from feedback only once when issues load
  useEffect(() => {
    const initialNotes = {};
    paginatedIssues.forEach(issue => {
      const fb = getFeedbackForIssue(issue.id);
      // Only initialize if not already in editingNotes (including empty strings)
      if (fb && fb.notes && editingNotes[issue.id] === undefined) {
        initialNotes[issue.id] = fb.notes;
      }
    });
    if (Object.keys(initialNotes).length > 0) {
      setEditingNotes(prev => ({ ...prev, ...initialNotes }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedIssues.map(i => i.id).join(',')]);

  if (loading) {
    return (
      <div className="report-b-loading">
        <div className="loading-spinner"></div>
        <p>Loading report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-b-error">
        <h3>Error Loading Report</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="report-b-empty">
        <h3>No Report Available</h3>
        <p>Report B has not been uploaded for this book yet.</p>
      </div>
    );
  }

  const metrics = getMetrics();

  return (
    <div className="report-b-viewer">
      <div className="report-header">
        <h2>📊 Quality Check Report</h2>
        <div className="report-meta">
          <span>{flattenedIssues.length} total issues</span>
          <span>•</span>
          <span>{sourceFiles.length} files</span>
        </div>
      </div>

      {/* Filters */}
      <div className="report-filters">
        <div className="filter-group">
          <label>Feedback:</label>
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilter('all');
              setCurrentPage(1);
            }}
          >
            All Issues
          </button>
          <button
            className={`filter-btn ${filter === 'my_feedback' ? 'active' : ''}`}
            onClick={() => {
              setFilter('my_feedback');
              setCurrentPage(1);
            }}
          >
            My Feedback Only
          </button>
        </div>

        <div className="filter-group">
          <label>Issue Type:</label>
          <button
            className={`filter-btn ${issueTypeFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setIssueTypeFilter('all');
              setCurrentPage(1);
            }}
          >
            All Types
          </button>
          <button
            className={`filter-btn ${issueTypeFilter === 'Grammar' ? 'active' : ''}`}
            onClick={() => {
              setIssueTypeFilter('Grammar');
              setCurrentPage(1);
            }}
          >
            Grammar
          </button>
          <button
            className={`filter-btn ${issueTypeFilter === 'Conceptual' ? 'active' : ''}`}
            onClick={() => {
              setIssueTypeFilter('Conceptual');
              setCurrentPage(1);
            }}
          >
            Conceptual
          </button>
          <button
            className={`filter-btn ${issueTypeFilter === 'Logical' ? 'active' : ''}`}
            onClick={() => {
              setIssueTypeFilter('Logical');
              setCurrentPage(1);
            }}
          >
            Logical
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th>Source File / Question #</th>
              <th>Issue Type</th>
              <th>Location</th>
              <th>Issue</th>
              <th>Suggestion</th>
              <th>Accept/Reject</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {paginatedIssues.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  {filter === 'my_feedback' 
                    ? 'No issues with feedback yet. Start reviewing issues above!'
                    : issueTypeFilter !== 'all'
                    ? `No ${issueTypeFilter} issues found.`
                    : 'No issues found in this report.'}
                </td>
              </tr>
            ) : (
              paginatedIssues.map((issue) => {
                const fb = getFeedbackForIssue(issue.id) || {};
                const isIssueExpanded = expandedIssues[`${issue.id}_issue`];
                const isSuggestionExpanded = expandedIssues[`${issue.id}_suggestion`];
                const truncatedIssue = truncateText(issue.issue, 100);
                const truncatedSuggestion = truncateText(issue.suggestion, 100);
                const isSaving = savingFeedback[issue.id];
                const isSavingNotes = savingFeedback[`${issue.id}_notes`];
                const currentNotes = editingNotes[issue.id] !== undefined ? editingNotes[issue.id] : (fb.notes || '');

                return (
                  <tr key={issue.id}>
                    {/* Source File / Question Number - Combined */}
                    <td className="source-question-cell">
                      <div className="source-question-content">
                        <span className="source-file-name">{issue.sourceFile}</span>
                        <span className="question-number">{issue.questionNumber}</span>
                      </div>
                    </td>

                    {/* Issue Type */}
                    <td className="issue-type-cell">
                      <span 
                        className="issue-type-badge"
                        style={{ backgroundColor: getIssueTypeColor(issue.issueType) }}
                      >
                        {issue.issueType}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="location-cell">
                      <span className="location-text">{issue.location}</span>
                    </td>

                    {/* Issue */}
                    <td className="issue-cell">
                      <div className="issue-content">
                        <div className="issue-text">
                          <LaTeXRenderer 
                            text={isIssueExpanded ? issue.issue : truncatedIssue}
                            inline={true}
                          />
                        </div>
                        {issue.issue.length > 100 && (
                          <button
                            className="read-more-btn"
                            onClick={() => toggleIssueExpansion(issue.id, 'issue')}
                          >
                            {isIssueExpanded ? 'Read less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Suggestion */}
                    <td className="suggestion-cell">
                      <div className="suggestion-content">
                        <div className="suggestion-text">
                          <LaTeXRenderer 
                            text={isSuggestionExpanded ? issue.suggestion : truncatedSuggestion}
                            inline={true}
                          />
                        </div>
                        {issue.suggestion.length > 100 && (
                          <button
                            className="read-more-btn"
                            onClick={() => toggleIssueExpansion(issue.id, 'suggestion')}
                          >
                            {isSuggestionExpanded ? 'Read less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Accept/Reject */}
                    <td className="feedback-cell">
                      <div className="feedback-buttons">
                        <button
                          className={`feedback-btn accept-btn ${fb.status === 'accepted' ? 'active' : ''}`}
                          onClick={() => handleFeedbackChange(issue.id, fb.status === 'accepted' ? null : 'accepted')}
                          title="Accept this issue"
                          disabled={isSaving}
                        >
                          {isSaving ? '...' : '✓'}
                        </button>
                        <button
                          className={`feedback-btn reject-btn ${fb.status === 'rejected' ? 'active' : ''}`}
                          onClick={() => handleFeedbackChange(issue.id, fb.status === 'rejected' ? null : 'rejected')}
                          title="Reject this issue"
                          disabled={isSaving}
                        >
                          {isSaving ? '...' : '✗'}
                        </button>
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="notes-cell">
                      <div className="notes-container">
                        <input
                          type="text"
                          className="notes-input"
                          placeholder="Add notes about the issue..."
                          value={currentNotes}
                          onChange={(e) => handleNotesInputChange(issue.id, e.target.value)}
                          disabled={isSavingNotes}
                        />
                        <button
                          className="save-notes-btn"
                          onClick={() => handleSaveNotes(issue.id)}
                          disabled={isSavingNotes || currentNotes === (fb.notes || '')}
                          title="Save notes"
                        >
                          {isSavingNotes ? '...' : '💾'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          
          <div className="pagination-info">
            <span>Page {currentPage} of {totalPages}</span>
            <span className="pagination-details">
              ({((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredIssues.length)} of {filteredIssues.length} issues)
            </span>
          </div>

          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {/* Manual Issues Form */}
      <div className="manual-issues-section">
        <h3>➕ Add Missing Issues</h3>
        <p className="section-description">
          Found an issue that's not in the report? Add it here.
        </p>
        <ManualIssueForm
          sourceFiles={sourceFiles}
          manualIssues={manualIssues || []}
          onAddIssue={addIssue}
          onDeleteIssue={removeIssue}
        />
      </div>

      {/* Metrics Summary */}
      <div className="metrics-section">
        <MetricsSummary
          metrics={metrics}
          totalIssues={flattenedIssues.length}
        />
      </div>
    </div>
  );
};

export default ReportBViewer;
