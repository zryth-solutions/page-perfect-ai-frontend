import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook to manage user roles stored in Firestore
 * 
 * User document structure in Firestore:
 * users/{uid}
 *   - email: string
 *   - role: 'admin' | 'user' | 'editor' (default: 'user')
 *   - createdAt: timestamp
 *   - updatedAt: timestamp
 */
export const useUserRole = (user) => {
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserRole(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Real-time listener for user role changes
    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const role = userData.role || 'user';
        setUserRole(role);
        setIsAdmin(role === 'admin');
        setLoading(false);
      } else {
        // User document doesn't exist, create it with default role
        try {
          await setDoc(userDocRef, {
            email: user.email,
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          setUserRole('user');
          setIsAdmin(false);
          setLoading(false);
        } catch (error) {
          console.error('Error creating user document:', error);
          setLoading(false);
        }
      }
    }, (error) => {
      console.error('Error listening to user role:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { userRole, isAdmin, loading };
};

/**
 * Helper function to manually check if a user is admin
 * Useful for one-time checks without a hook
 */
export const checkUserRole = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data().role || 'user';
    }
    return 'user';
  } catch (error) {
    console.error('Error checking user role:', error);
    return 'user';
  }
};

/**
 * Helper function to check if a specific user is admin
 */
export const isUserAdmin = async (userId) => {
  const role = await checkUserRole(userId);
  return role === 'admin';
};

