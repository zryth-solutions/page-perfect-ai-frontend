import React from 'react';
import './Skeleton.css';

// Base skeleton component
export const Skeleton = ({ width, height, borderRadius = '8px', className = '' }) => {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '20px',
        borderRadius 
      }}
    />
  );
};

// Analytics card skeleton
export const AnalyticsCardSkeleton = () => {
  return (
    <div className="analytics-card skeleton-card">
      <div className="analytics-icon">
        <Skeleton width="32px" height="32px" borderRadius="8px" />
      </div>
      <div className="analytics-stat">
        <Skeleton width="60px" height="32px" className="skeleton-stat-value" />
        <Skeleton width="80px" height="16px" className="skeleton-stat-label" />
      </div>
    </div>
  );
};

// Book table row skeleton
export const BookTableRowSkeleton = () => {
  return (
    <tr className="skeleton-row">
      <td><Skeleton width="150px" height="16px" /></td>
      <td><Skeleton width="120px" height="16px" /></td>
      <td><Skeleton width="100px" height="16px" /></td>
      <td><Skeleton width="90px" height="24px" borderRadius="12px" /></td>
      <td>
        <div className="progress-cell">
          <Skeleton width="45px" height="45px" borderRadius="50%" />
        </div>
      </td>
      <td><Skeleton width="100px" height="32px" borderRadius="6px" /></td>
    </tr>
  );
};

// Mobile book card skeleton
export const MobileBookCardSkeleton = () => {
  return (
    <div className="mobile-book-card card skeleton-mobile-card">
      <div className="mobile-card-header">
        <Skeleton width="60%" height="20px" />
        <Skeleton width="40px" height="40px" borderRadius="50%" />
      </div>
      
      <div className="mobile-card-body">
        <div className="mobile-info-row">
          <Skeleton width="30%" height="14px" />
          <Skeleton width="50%" height="14px" />
        </div>
        <div className="mobile-info-row">
          <Skeleton width="30%" height="14px" />
          <Skeleton width="40%" height="14px" />
        </div>
        <div className="mobile-info-row">
          <Skeleton width="30%" height="14px" />
          <Skeleton width="70px" height="24px" borderRadius="12px" />
        </div>
      </div>
      
      <div className="mobile-card-footer">
        <Skeleton width="100%" height="40px" borderRadius="6px" />
      </div>
    </div>
  );
};

// Admin table row skeleton
export const AdminTableRowSkeleton = () => {
  return (
    <tr className="skeleton-row">
      <td><Skeleton width="150px" height="16px" /></td>
      <td><Skeleton width="180px" height="16px" /></td>
      <td><Skeleton width="120px" height="16px" /></td>
      <td><Skeleton width="100px" height="16px" /></td>
      <td><Skeleton width="90px" height="32px" borderRadius="6px" /></td>
      <td>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="110px" height="32px" borderRadius="6px" />
          <Skeleton width="70px" height="32px" borderRadius="6px" />
        </div>
      </td>
    </tr>
  );
};

// User management table row skeleton
export const UserTableRowSkeleton = () => {
  return (
    <tr className="skeleton-row">
      <td><Skeleton width="180px" height="16px" /></td>
      <td><Skeleton width="140px" height="16px" /></td>
      <td><Skeleton width="80px" height="24px" borderRadius="20px" /></td>
      <td><Skeleton width="100px" height="16px" /></td>
      <td><Skeleton width="120px" height="36px" borderRadius="8px" /></td>
    </tr>
  );
};

export default Skeleton;

