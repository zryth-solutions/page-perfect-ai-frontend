/**
 * useBookEditor Hook
 * Main state management for Book Editor
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useBookEditor = (bookId) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extractionStatus, setExtractionStatus] = useState('not_started');
  const [splittingStatus, setSplittingStatus] = useState('not_started');
  const [splitFiles, setSplitFiles] = useState([]);

  // Listen to book document changes
  useEffect(() => {
    if (!bookId) return;

    setLoading(true);
    const bookRef = doc(db, 'books', bookId);

    const unsubscribe = onSnapshot(
      bookRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setBook(data);

          // Update extraction status
          const extraction = data.extraction || {};
          setExtractionStatus(extraction.status || 'not_started');

          // Update splitting status
          const splitting = data.splitting || {};
          setSplittingStatus(splitting.status || 'not_started');
          setSplitFiles(splitting.files || []);

          setError(null);
        } else {
          setError('Book not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to book:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bookId]);

  // Get extraction data
  const getExtractionData = useCallback(() => {
    if (!book) return null;
    return book.extraction || {};
  }, [book]);

  // Get splitting data
  const getSplittingData = useCallback(() => {
    if (!book) return null;
    return book.splitting || {};
  }, [book]);

  // Check if extraction is complete
  const isExtractionComplete = useCallback(() => {
    return extractionStatus === 'completed';
  }, [extractionStatus]);

  // Check if splitting is complete
  const isSplittingComplete = useCallback(() => {
    return splittingStatus === 'completed';
  }, [splittingStatus]);

  // Check if editor is ready (splitting complete)
  const isEditorReady = useCallback(() => {
    return isSplittingComplete();
  }, [isSplittingComplete]);

  return {
    book,
    loading,
    error,
    extractionStatus,
    splittingStatus,
    splitFiles,
    getExtractionData,
    getSplittingData,
    isExtractionComplete,
    isSplittingComplete,
    isEditorReady
  };
};

