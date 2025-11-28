/**
 * Storage Service
 * Handles Firebase Storage operations
 */

import { ref, getDownloadURL, uploadString, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Get download URL for a file
 * @param {string} path - Path in Storage
 * @returns {Promise<string>} Download URL
 */
export const getFileURL = async (path) => {
  try {
    const fileRef = ref(storage, path);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

/**
 * Download file content as text
 * @param {string} path - Path in Storage
 * @returns {Promise<string>} File content
 */
export const downloadFileAsText = async (path) => {
  try {
    const url = await getFileURL(path);
    const response = await fetch(url);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Upload text content to Storage
 * @param {string} path - Destination path
 * @param {string} content - Text content
 * @returns {Promise<string>} Download URL
 */
export const uploadTextFile = async (path, content) => {
  try {
    const fileRef = ref(storage, path);
    await uploadString(fileRef, content);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Delete a file from Storage
 * @param {string} path - Path to file
 * @returns {Promise<boolean>} Success status
 */
export const deleteFile = async (path) => {
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * List all files in a directory
 * @param {string} path - Directory path
 * @returns {Promise<Array>} List of file references
 */
export const listFiles = async (path) => {
  try {
    const dirRef = ref(storage, path);
    const result = await listAll(dirRef);
    return result.items;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};

/**
 * Get all split files for a book
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} Categorized files
 */
export const getSplitFiles = async (bookId) => {
  try {
    const categories = {
      questions: [],
      answerKeys: [],
      explanations: []
    };

    // List Question_output files
    const questionFiles = await listFiles(`books/${bookId}/splits/Question_output/`);
    for (const fileRef of questionFiles) {
      categories.questions.push({
        name: fileRef.name,
        path: fileRef.fullPath,
        category: 'question'
      });
    }

    // List Answer_key files
    const keyFiles = await listFiles(`books/${bookId}/splits/Answer_key/`);
    for (const fileRef of keyFiles) {
      categories.answerKeys.push({
        name: fileRef.name,
        path: fileRef.fullPath,
        category: 'answer_key'
      });
    }

    // List Answer_output files
    const answerFiles = await listFiles(`books/${bookId}/splits/Answer_output/`);
    for (const fileRef of answerFiles) {
      categories.explanations.push({
        name: fileRef.name,
        path: fileRef.fullPath,
        category: 'explanation'
      });
    }

    return categories;
  } catch (error) {
    console.error('Error getting split files:', error);
    return { questions: [], answerKeys: [], explanations: [] };
  }
};

/**
 * Get all images for a book
 * @param {string} bookId - Book ID
 * @returns {Promise<Array>} List of image references
 */
export const getBookImages = async (bookId) => {
  try {
    const images = await listFiles(`books/${bookId}/extracted/images/`);
    return images.map(img => ({
      name: img.name,
      path: img.fullPath
    }));
  } catch (error) {
    console.error('Error getting book images:', error);
    return [];
  }
};

