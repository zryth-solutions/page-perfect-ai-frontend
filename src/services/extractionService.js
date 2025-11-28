/**
 * Extraction Service
 * Handles PDF extraction workflow
 */

import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { extractPDF } from './cloudFunctions';

/**
 * Start PDF extraction
 * @param {string} bookId - Book ID
 * @param {string} pdfPath - Path to PDF in Storage
 * @returns {Promise<Object>} Extraction result
 */
export const startExtraction = async (bookId, pdfPath) => {
  try {
    console.log(`Starting extraction for book: ${bookId}`);
    const result = await extractPDF(bookId, pdfPath);
    return result;
  } catch (error) {
    console.error('Error starting extraction:', error);
    throw error;
  }
};

/**
 * Listen to extraction status changes
 * @param {string} bookId - Book ID
 * @param {Function} callback - Callback function(status, data)
 * @returns {Function} Unsubscribe function
 */
export const listenToExtractionStatus = (bookId, callback) => {
  const bookRef = doc(db, 'books', bookId);
  
  const unsubscribe = onSnapshot(bookRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const extraction = data.extraction || {};
      
      callback(extraction.status || 'not_started', extraction);
    }
  }, (error) => {
    console.error('Error listening to extraction status:', error);
    callback('error', { error: error.message });
  });
  
  return unsubscribe;
};

/**
 * Get extraction status
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} Extraction data
 */
export const getExtractionStatus = async (bookId) => {
  try {
    const bookRef = doc(db, 'books', bookId);
    const docSnap = await getDoc(bookRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.extraction || { status: 'not_started' };
    }
    
    return { status: 'not_started' };
  } catch (error) {
    console.error('Error getting extraction status:', error);
    return { status: 'error', error: error.message };
  }
};

