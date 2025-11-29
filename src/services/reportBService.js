/**
 * Report B Service
 * Handles Firestore operations for Report B (Quality Check Reports)
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Upload Report B JSON data
 * @param {string} bookId - Book ID
 * @param {object} reportData - Parsed JSON report data
 * @param {string} fileName - Original file name
 * @param {string} userId - User ID who uploaded
 * @returns {Promise<void>}
 */
export const uploadReportB = async (bookId, reportData, fileName, userId) => {
  try {
    // Extract file order from the JSON to preserve it
    const fileOrder = reportData.results_by_source_file 
      ? Object.keys(reportData.results_by_source_file)
      : [];

    const reportRef = doc(db, 'books', bookId, 'reportB', 'data');
    await setDoc(reportRef, {
      uploadedBy: userId,
      uploadedAt: serverTimestamp(),
      fileName: fileName,
      reportData: reportData,
      fileOrder: fileOrder // Store the original file order
    });
  } catch (error) {
    console.error('Error uploading Report B:', error);
    throw error;
  }
};

/**
 * Get Report B data
 * @param {string} bookId - Book ID
 * @returns {Promise<object|null>} Report data or null if not found
 */
export const getReportB = async (bookId) => {
  try {
    const reportRef = doc(db, 'books', bookId, 'reportB', 'data');
    const reportSnap = await getDoc(reportRef);
    
    if (reportSnap.exists()) {
      return reportSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting Report B:', error);
    throw error;
  }
};

/**
 * Save user feedback for an issue
 * @param {string} bookId - Book ID
 * @param {string} userId - User ID
 * @param {object} feedbackData - Feedback data with issueId, status, notes
 * @returns {Promise<string>} Feedback document ID
 */
export const saveFeedback = async (bookId, userId, feedbackData) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }
    
    if (!feedbackData.issueId) {
      throw new Error('issueId is required in feedbackData');
    }

    const feedbackRef = collection(db, 'books', bookId, 'reportB_feedback');
    
    // Check if feedback already exists for this issue
    const q = query(
      feedbackRef,
      where('userId', '==', userId),
      where('issueId', '==', feedbackData.issueId)
    );
    
    const existingDocs = await getDocs(q);
    
    // Prepare data object, excluding undefined values
    const dataToSave = {
      issueId: feedbackData.issueId,
      userId: userId,
      updatedAt: serverTimestamp()
    };

    // Only add status if it's not undefined
    if (feedbackData.status !== undefined) {
      dataToSave.status = feedbackData.status;
    }

    // Only add notes if it's not undefined
    if (feedbackData.notes !== undefined) {
      dataToSave.notes = feedbackData.notes;
    }
    
    if (!existingDocs.empty) {
      // Update existing feedback
      const existingDoc = existingDocs.docs[0];
      const updateData = {
        updatedAt: serverTimestamp()
      };
      
      // Only update fields that are provided
      if (feedbackData.status !== undefined) {
        updateData.status = feedbackData.status;
      }
      if (feedbackData.notes !== undefined) {
        updateData.notes = feedbackData.notes;
      }
      
      await updateDoc(existingDoc.ref, updateData);
      return existingDoc.id;
    } else {
      // Create new feedback
      dataToSave.createdAt = serverTimestamp();
      const docRef = await addDoc(feedbackRef, dataToSave);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
};

/**
 * Get user's feedback for a book
 * @param {string} bookId - Book ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of feedback documents
 */
export const getUserFeedback = async (bookId, userId) => {
  try {
    if (!userId) {
      return [];
    }

    const feedbackRef = collection(db, 'books', bookId, 'reportB_feedback');
    const q = query(feedbackRef, where('userId', '==', userId));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user feedback:', error);
    throw error;
  }
};

/**
 * Add manual issue
 * @param {string} bookId - Book ID
 * @param {string} userId - User ID
 * @param {object} issueData - Issue data
 * @returns {Promise<string>} Issue document ID
 */
export const addManualIssue = async (bookId, userId, issueData) => {
  try {
    const issuesRef = collection(db, 'books', bookId, 'reportB_manualIssues');
    const docRef = await addDoc(issuesRef, {
      ...issueData,
      userId: userId,
      addedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding manual issue:', error);
    throw error;
  }
};

/**
 * Get user's manual issues
 * @param {string} bookId - Book ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of manual issue documents
 */
export const getUserManualIssues = async (bookId, userId) => {
  try {
    const issuesRef = collection(db, 'books', bookId, 'reportB_manualIssues');
    const q = query(issuesRef, where('userId', '==', userId));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting manual issues:', error);
    throw error;
  }
};

/**
 * Delete manual issue
 * @param {string} bookId - Book ID
 * @param {string} issueId - Issue document ID
 * @returns {Promise<void>}
 */
export const deleteManualIssue = async (bookId, issueId) => {
  try {
    const issueRef = doc(db, 'books', bookId, 'reportB_manualIssues', issueId);
    await deleteDoc(issueRef);
  } catch (error) {
    console.error('Error deleting manual issue:', error);
    throw error;
  }
};

/**
 * Get all feedback for metrics (admin view)
 * @param {string} bookId - Book ID
 * @returns {Promise<Array>} Array of all feedback documents
 */
export const getAllFeedback = async (bookId) => {
  try {
    const feedbackRef = collection(db, 'books', bookId, 'reportB_feedback');
    const snapshot = await getDocs(feedbackRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all feedback:', error);
    throw error;
  }
};

