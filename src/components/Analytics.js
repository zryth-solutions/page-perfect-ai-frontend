import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useUserRole } from '../hooks/useUserRole';
import { AnalyticsCardSkeleton } from './Skeleton';
import './Analytics.css';

const Analytics = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: roleLoading } = useUserRole(auth.currentUser);

  useEffect(() => {
    if (!auth.currentUser || roleLoading) return;

    // If admin, fetch all books; otherwise fetch only user's books
    const q = isAdmin 
      ? query(collection(db, 'books'))
      : query(
          collection(db, 'books'),
          where('userId', '==', auth.currentUser.uid)
        );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const booksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBooks(booksData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching books:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin, roleLoading]);

  return (
    <>
      <div className="content-header">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="page-subtitle">
            {isAdmin 
              ? 'Overview of all manuscript reviews and performance across all users'
              : 'Overview of your manuscript reviews and performance'
            }
          </p>
        </div>
      </div>
      <div className="analytics-content card">
        <div className="analytics-grid">
          {loading ? (
            <>
              <AnalyticsCardSkeleton />
              <AnalyticsCardSkeleton />
              <AnalyticsCardSkeleton />
              <AnalyticsCardSkeleton />
            </>
          ) : (
            <>
          <div className="analytics-card">
            <div className="analytics-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 8H24C25.1046 8 26 8.89543 26 10V22C26 23.1046 25.1046 24 24 24H8C6.89543 24 6 23.1046 6 22V10C6 8.89543 6.89543 8 8 8Z" stroke="#6366f1" strokeWidth="2"/>
              </svg>
            </div>
            <div className="analytics-stat">
              <div className="stat-value">{books.length}</div>
              <div className="stat-label">Total Books</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z" stroke="#10b981" strokeWidth="2"/>
                <path d="M12 16L15 19L20 13" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="analytics-stat">
              <div className="stat-value">{books.filter(b => b.status === 'completed').length}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="12" stroke="#f59e0b" strokeWidth="2"/>
                <path d="M16 16L16 10" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="16" cy="20" r="1" fill="#f59e0b"/>
              </svg>
            </div>
            <div className="analytics-stat">
              <div className="stat-value">{books.filter(b => b.status === 'pending').length}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4V16L22 22" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="16" cy="16" r="12" stroke="#3b82f6" strokeWidth="2"/>
              </svg>
            </div>
            <div className="analytics-stat">
              <div className="stat-value">{books.filter(b => b.status === 'processing').length}</div>
              <div className="stat-label">Processing</div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Analytics;

