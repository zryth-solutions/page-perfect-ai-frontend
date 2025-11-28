/**
 * useFileOperations Hook
 * Handles file CRUD operations
 */

import { useState, useCallback } from 'react';
import { downloadFileAsText } from '../services/storageService';
import { updateSplitFile } from '../services/cloudFunctions';
import { auth } from '../firebase';

export const useFileOperations = (bookId) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load file content
  const loadFile = useCallback(async (file) => {
    if (!file || !file.path) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`Loading file: ${file.name}`);
      const content = await downloadFileAsText(file.path);
      setFileContent(content);
      setSelectedFile(file);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error loading file:', err);
      setError(`Failed to load file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update file content (local only)
  const updateContent = useCallback((newContent) => {
    setFileContent(newContent);
    setHasUnsavedChanges(true);
  }, []);

  // Save file content
  const saveFile = useCallback(async () => {
    if (!selectedFile || !bookId) return;

    setSaving(true);
    setError(null);

    try {
      console.log(`Saving file: ${selectedFile.name}`);
      
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Call Cloud Function to update file
      const result = await updateSplitFile(
        bookId,
        selectedFile.path,
        fileContent,
        userId
      );

      if (result.success) {
        console.log('File saved successfully');
        setHasUnsavedChanges(false);
        return true;
      } else {
        throw new Error(result.error || 'Failed to save file');
      }
    } catch (err) {
      console.error('Error saving file:', err);
      setError(`Failed to save file: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [bookId, selectedFile, fileContent]);

  // Discard changes
  const discardChanges = useCallback(async () => {
    if (selectedFile) {
      await loadFile(selectedFile);
    }
  }, [selectedFile, loadFile]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setFileContent('');
    setHasUnsavedChanges(false);
    setError(null);
  }, []);

  return {
    selectedFile,
    fileContent,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    loadFile,
    updateContent,
    saveFile,
    discardChanges,
    clearSelection
  };
};

