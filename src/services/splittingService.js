/**
 * Splitting Service
 * Handles content splitting workflow
 */

import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { splitContent } from './cloudFunctions';

/**
 * Start content splitting
 * @param {string} bookId - Book ID
 * @param {string} fullMdPath - Path to full.md in Storage
 * @param {Object} customPatterns - Optional custom patterns configuration
 * @returns {Promise<Object>} Splitting result
 */
export const startSplitting = async (bookId, fullMdPath, customPatterns = null) => {
  try {
    console.log(`Starting splitting for book: ${bookId}`);
    if (customPatterns) {
      console.log('Using custom patterns:', customPatterns);
    }
    const result = await splitContent(bookId, fullMdPath, customPatterns);
    return result;
  } catch (error) {
    console.error('Error starting splitting:', error);
    throw error;
  }
};

/**
 * Listen to splitting status changes
 * @param {string} bookId - Book ID
 * @param {Function} callback - Callback function(status, data)
 * @returns {Function} Unsubscribe function
 */
export const listenToSplittingStatus = (bookId, callback) => {
  const bookRef = doc(db, 'books', bookId);
  
  const unsubscribe = onSnapshot(bookRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const splitting = data.splitting || {};
      
      callback(splitting.status || 'not_started', splitting);
    }
  }, (error) => {
    console.error('Error listening to splitting status:', error);
    callback('error', { error: error.message });
  });
  
  return unsubscribe;
};

/**
 * Get splitting status
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} Splitting data
 */
export const getSplittingStatus = async (bookId) => {
  try {
    const bookRef = doc(db, 'books', bookId);
    const docSnap = await getDoc(bookRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.splitting || { status: 'not_started' };
    }
    
    return { status: 'not_started' };
  } catch (error) {
    console.error('Error getting splitting status:', error);
    return { status: 'error', error: error.message };
  }
};

/**
 * Get split files list
 * @param {string} bookId - Book ID
 * @returns {Promise<Array>} List of split files
 */
export const getSplitFilesList = async (bookId) => {
  try {
    const bookRef = doc(db, 'books', bookId);
    const docSnap = await getDoc(bookRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const splitting = data.splitting || {};
      return splitting.files || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting split files list:', error);
    return [];
  }
};

