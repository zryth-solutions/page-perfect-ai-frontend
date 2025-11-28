/**
 * Cloud Functions Service
 * Wrapper for calling Firebase Cloud Functions
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

// Initialize functions with the correct region
const functions = getFunctions(app, 'us-central1');

/**
 * Call a Cloud Function
 * @param {string} functionName - Name of the function
 * @param {Object} data - Data to send
 * @returns {Promise<Object>} Function result
 */
const callFunction = async (functionName, data) => {
  try {
    const callable = httpsCallable(functions, functionName);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
};

/**
 * Extract PDF using MinerU API
 * @param {string} bookId - Book ID
 * @param {string} pdfPath - Path to PDF in Storage
 * @returns {Promise<Object>} Extraction result
 */
export const extractPDF = async (bookId, pdfPath) => {
  return await callFunction('extractPDF', { bookId, pdfPath });
};

/**
 * Split content into structured files
 * @param {string} bookId - Book ID
 * @param {string} fullMdPath - Path to full.md in Storage
 * @param {Object} customPatterns - Optional custom patterns configuration
 * @returns {Promise<Object>} Splitting result
 */
export const splitContent = async (bookId, fullMdPath, customPatterns = null) => {
  const data = { bookId, fullMdPath };
  if (customPatterns) {
    data.customPatterns = customPatterns;
  }
  return await callFunction('splitContent', data);
};

/**
 * Update a split file
 * @param {string} bookId - Book ID
 * @param {string} filePath - Path to file in Storage
 * @param {string} content - New content
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
export const updateSplitFile = async (bookId, filePath, content, userId) => {
  return await callFunction('updateSplitFile', {
    bookId,
    filePath,
    content,
    userId
  });
};

/**
 * Delete an image
 * @param {string} bookId - Book ID
 * @param {string} imagePath - Path to image in Storage
 * @param {Array<string>} affectedFiles - List of affected file names
 * @returns {Promise<Object>} Delete result
 */
export const deleteImage = async (bookId, imagePath, affectedFiles) => {
  return await callFunction('deleteImage', {
    bookId,
    imagePath,
    affectedFiles
  });
};

/**
 * Acquire editing lock for a book
 * @param {string} bookId - Book ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Lock result
 */
export const lockBook = async (bookId, userId) => {
  return await callFunction('lockBook', { bookId, userId });
};

/**
 * Release editing lock for a book
 * @param {string} bookId - Book ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Unlock result
 */
export const unlockBook = async (bookId, userId) => {
  return await callFunction('unlockBook', { bookId, userId });
};


/**
 * Auto-detect section patterns using Vertex AI + Gemini
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} Detected patterns
 */
export const detectPatternsAI = async (bookId) => {
  return await callFunction('detectPatternsAI', { bookId });
};
