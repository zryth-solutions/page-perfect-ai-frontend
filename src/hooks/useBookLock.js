/**
 * useBookLock Hook
 * Manages editing locks for books
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { lockBook, unlockBook } from '../services/cloudFunctions';

export const useBookLock = (bookId) => {
  const [isLocked, setIsLocked] = useState(false);
  const [hasLock, setHasLock] = useState(false);
  const [lockedBy, setLockedBy] = useState(null);
  const [lockExpiry, setLockExpiry] = useState(null);
  const [acquiring, setAcquiring] = useState(false);
  const [releasing, setReleasing] = useState(false);

  // Listen to lock status
  useEffect(() => {
    if (!bookId) return;

    const bookRef = doc(db, 'books', bookId);

    const unsubscribe = onSnapshot(bookRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const editing = data.editing || {};

        setIsLocked(editing.isLocked || false);
        setLockedBy(editing.lockedBy || null);
        setLockExpiry(editing.lockExpiry || null);

        // Check if current user has the lock
        const currentUserId = auth.currentUser?.uid;
        setHasLock(editing.isLocked && editing.lockedBy === currentUserId);
      }
    });

    return () => unsubscribe();
  }, [bookId]);

  // Acquire lock
  const acquireLock = useCallback(async () => {
    if (!bookId || !auth.currentUser) return { success: false, message: 'Not authenticated' };

    setAcquiring(true);

    try {
      const result = await lockBook(bookId, auth.currentUser.uid);
      
      if (result.success) {
        console.log('Lock acquired successfully');
      } else {
        console.warn('Failed to acquire lock:', result.message);
      }

      return result;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return { success: false, message: error.message };
    } finally {
      setAcquiring(false);
    }
  }, [bookId]);

  // Release lock
  const releaseLock = useCallback(async () => {
    if (!bookId || !auth.currentUser) return { success: false, message: 'Not authenticated' };

    setReleasing(true);

    try {
      const result = await unlockBook(bookId, auth.currentUser.uid);
      
      if (result.success) {
        console.log('Lock released successfully');
      } else {
        console.warn('Failed to release lock:', result.message);
      }

      return result;
    } catch (error) {
      console.error('Error releasing lock:', error);
      return { success: false, message: error.message };
    } finally {
      setReleasing(false);
    }
  }, [bookId]);

  // Check if lock is expired
  const isLockExpired = useCallback(() => {
    if (!lockExpiry) return false;

    try {
      const expiryTime = new Date(lockExpiry);
      return new Date() >= expiryTime;
    } catch (error) {
      return false;
    }
  }, [lockExpiry]);

  // Get lock status message
  const getLockMessage = useCallback(() => {
    if (!isLocked) {
      return 'Book is available for editing';
    }

    if (hasLock) {
      return 'You have editing access';
    }

    if (isLockExpired()) {
      return 'Lock has expired';
    }

    return `Book is locked by another user${lockedBy ? `: ${lockedBy}` : ''}`;
  }, [isLocked, hasLock, lockedBy, isLockExpired]);

  return {
    isLocked,
    hasLock,
    lockedBy,
    lockExpiry,
    acquiring,
    releasing,
    acquireLock,
    releaseLock,
    isLockExpired,
    getLockMessage
  };
};

