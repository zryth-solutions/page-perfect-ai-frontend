/**
 * useReportBFeedback Hook
 * Manages Report B feedback state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getReportB,
  getUserFeedback,
  saveFeedback,
  getUserManualIssues,
  addManualIssue,
  deleteManualIssue
} from '../services/reportBService';

export const useReportBFeedback = (bookId, userId) => {
  const [reportData, setReportData] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [manualIssues, setManualIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load report and user feedback
  useEffect(() => {
    if (!bookId || !userId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load report data
        const report = await getReportB(bookId);
        setReportData(report);

        // Load user feedback
        const userFeedback = await getUserFeedback(bookId, userId);
        
        // Convert feedback array to map for easy lookup by issueId
        const feedbackMap = {};
        userFeedback.forEach(fb => {
          if (fb.issueId) {
            feedbackMap[fb.issueId] = fb;
          }
        });
        setFeedback(feedbackMap);

        // Load manual issues
        const issues = await getUserManualIssues(bookId, userId);
        setManualIssues(issues);

      } catch (err) {
        console.error('Error loading Report B data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bookId, userId]);

  // Get feedback for a specific issue by issueId
  const getFeedbackForIssue = useCallback((issueId) => {
    return feedback[issueId] || null;
  }, [feedback]);

  // Update feedback for an issue
  const updateFeedback = useCallback(async (issueId, updates) => {
    if (!userId) {
      console.error('userId is required for updateFeedback');
      return false;
    }

    try {
      // Get existing feedback or create new
      const existingFeedback = feedback[issueId] || {};
      
      // Build feedback data, only including defined fields
      const feedbackData = {
        issueId
      };

      // Only add status if it's defined (not null or undefined)
      if (updates.status !== undefined) {
        feedbackData.status = updates.status;
      } else if (existingFeedback.status !== undefined) {
        feedbackData.status = existingFeedback.status;
      } else {
        feedbackData.status = null; // Explicitly set to null instead of undefined
      }

      // Only add notes if it's defined
      if (updates.notes !== undefined) {
        feedbackData.notes = updates.notes;
      } else if (existingFeedback.notes !== undefined) {
        feedbackData.notes = existingFeedback.notes;
      } else {
        feedbackData.notes = ''; // Empty string instead of undefined
      }

      await saveFeedback(bookId, userId, feedbackData);

      // Update local state
      setFeedback(prev => ({
        ...prev,
        [issueId]: feedbackData
      }));

      return true;
    } catch (err) {
      console.error('Error updating feedback:', err);
      throw err;
    }
  }, [bookId, userId, feedback]);

  // Add a manual issue
  const addIssue = useCallback(async (issueData) => {
    if (!userId) {
      console.error('userId is required for addIssue');
      throw new Error('User ID is required');
    }

    try {
      const issueId = await addManualIssue(bookId, userId, issueData);
      
      // Update local state
      setManualIssues(prev => [...prev, { id: issueId, ...issueData }]);
      
      return issueId;
    } catch (err) {
      console.error('Error adding manual issue:', err);
      throw err;
    }
  }, [bookId, userId]);

  // Delete a manual issue
  const removeIssue = useCallback(async (issueId) => {
    try {
      await deleteManualIssue(bookId, issueId);
      
      // Update local state
      setManualIssues(prev => prev.filter(issue => issue.id !== issueId));
      
      return true;
    } catch (err) {
      console.error('Error deleting manual issue:', err);
      throw err;
    }
  }, [bookId]);

  // Calculate metrics
  const getMetrics = useCallback(() => {
    if (!reportData) return null;

    // Count total issues from report
    let totalIssues = 0;
    const results = reportData.reportData?.results_by_source_file || {};
    
    Object.values(results).forEach(items => {
      items.forEach(item => {
        // Count issues from all arrays
        totalIssues += (item.question_issues?.length || 0);
        totalIssues += (item.answer_issues?.length || 0);
        totalIssues += (item.conceptual_errors?.length || 0);
        totalIssues += (item.logical_errors?.length || 0);
      });
    });

    // Count feedback statuses
    const feedbackValues = Object.values(feedback);
    const accepted = feedbackValues.filter(fb => fb.status === 'accepted').length;
    const rejected = feedbackValues.filter(fb => fb.status === 'rejected').length;
    const withNotes = feedbackValues.filter(fb => fb.notes && fb.notes.trim() !== '').length;
    const pending = totalIssues - accepted - rejected;

    return {
      totalIssues,
      accepted,
      rejected,
      pending,
      withNotes,
      manualIssuesCount: manualIssues.length,
      acceptanceRate: totalIssues > 0 ? ((accepted / totalIssues) * 100).toFixed(1) : 0,
      rejectionRate: totalIssues > 0 ? ((rejected / totalIssues) * 100).toFixed(1) : 0
    };
  }, [reportData, feedback, manualIssues]);

  return {
    reportData,
    feedback,
    manualIssues,
    loading,
    error,
    getFeedbackForIssue,
    updateFeedback,
    addIssue,
    removeIssue,
    getMetrics
  };
};
