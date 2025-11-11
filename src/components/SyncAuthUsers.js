import React, { useState } from 'react';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './SyncAuthUsers.css';

/**
 * Temporary component to sync Firebase Auth users to Firestore
 * Use this once to create user documents for existing authenticated users
 */
const SyncAuthUsers = () => {
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Add users manually based on Firebase Authentication
  const authUsers = [
    {
      uid: 'yRW0CC2zYsOeJ57yoGxwdXM1234', // Replace with actual UID
      email: 'manas@zryth.com',
      role: 'user',
    },
    {
      uid: 'u8afn4km570p95VaTgMAAJhZ456', // Replace with actual UID
      email: 'sharshit416@gmail.com',
      role: 'user',
    },
    {
      uid: 'JfUgOaWJp8VJpOsf5vk9rFHERKR2',
      email: 'kushagra@zryth.com',
      role: 'admin',
    },
  ];

  const syncUsers = async () => {
    setSyncing(true);
    setResults([]);
    const syncResults = [];

    try {
      for (const user of authUsers) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            // Create new user document
            await setDoc(userRef, {
              email: user.email,
              role: user.role,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            syncResults.push({
              email: user.email,
              status: 'created',
              message: 'User document created successfully',
            });
          } else {
            syncResults.push({
              email: user.email,
              status: 'exists',
              message: 'User document already exists',
            });
          }
        } catch (error) {
          syncResults.push({
            email: user.email,
            status: 'error',
            message: error.message,
          });
        }
      }

      setResults(syncResults);
      setShowResults(true);
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync users: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="sync-auth-users-container">
      <div className="sync-header">
        <h3>🔄 Sync Firebase Auth Users</h3>
        <p className="sync-description">
          This will create Firestore user documents for all authenticated users who don't have them yet.
        </p>
      </div>

      <div className="sync-info-box">
        <h4>Users to sync:</h4>
        <ul className="users-list">
          {authUsers.map((user, index) => (
            <li key={index}>
              <strong>{user.email}</strong> - Role: <span className="role-badge">{user.role}</span>
            </li>
          ))}
        </ul>
        <p className="sync-note">
          ⚠️ <strong>Important:</strong> Make sure the UIDs in the code match the actual UIDs from Firebase Authentication!
        </p>
      </div>

      <button
        onClick={syncUsers}
        disabled={syncing}
        className="btn-sync"
      >
        {syncing ? (
          <span className="btn-loading">
            <span className="btn-spinner"></span>
            Syncing Users...
          </span>
        ) : (
          '🚀 Sync Users to Firestore'
        )}
      </button>

      {showResults && (
        <div className="sync-results">
          <h4>Sync Results:</h4>
          {results.map((result, index) => (
            <div
              key={index}
              className={`result-item result-${result.status}`}
            >
              <span className="result-icon">
                {result.status === 'created' ? '✅' : result.status === 'exists' ? 'ℹ️' : '❌'}
              </span>
              <div className="result-content">
                <strong>{result.email}</strong>
                <p>{result.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SyncAuthUsers;

