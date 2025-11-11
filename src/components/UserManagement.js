import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { UserTableRowSkeleton } from './Skeleton';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ Role updated for user ${userId} to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      alert('Please fill in all fields');
      return;
    }

    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setCreating(true);

    try {
      // Create new user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );
      
      const newUserId = userCredential.user.uid;

      // Create Firestore user document
      await setDoc(doc(db, 'users', newUserId), {
        email: newUser.email,
        role: newUser.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Sign out the newly created user and sign back in as admin
      await auth.signOut();
      
      // Wait a bit for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Admin will be automatically signed back in via onAuthStateChanged
      // but we need to redirect them or refresh
      
      alert(`✅ User ${newUser.email} created successfully! Please sign in again as admin.`);
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user: ';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage += 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage += 'Password is too weak';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === auth.currentUser?.uid) {
      alert("You cannot delete your own account!");
      return;
    }

    const confirmDelete = window.confirm(
      `⚠️ Are you sure you want to delete ${userEmail}?\n\nThis will:\n- Remove their Firestore user document\n- Keep their Firebase Auth account (you'll need to delete that separately in Firebase Console)\n- This action cannot be undone!`
    );

    if (!confirmDelete) return;

    setDeleting(userId);

    try {
      // Delete Firestore user document
      await deleteDoc(doc(db, 'users', userId));
      
      alert(`✅ User ${userEmail} deleted from Firestore successfully!\n\n⚠️ Note: You should also delete their Firebase Auth account from the Firebase Console → Authentication.`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setNewUser({
      email: '',
      password: '',
      role: 'user'
    });
    setShowAddModal(false);
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'role-badge role-admin';
      case 'editor':
        return 'role-badge role-editor';
      case 'user':
      default:
        return 'role-badge role-user';
    }
  };

  // Pagination calculations
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div>
          <h2 className="section-title">User Management</h2>
          <p className="section-subtitle">Manage user roles and permissions</p>
        </div>
        <button
          className="btn-add-user"
          onClick={() => setShowAddModal(true)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add New User
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>User ID</th>
              <th>Current Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <UserTableRowSkeleton />
                <UserTableRowSkeleton />
                <UserTableRowSkeleton />
                <UserTableRowSkeleton />
                <UserTableRowSkeleton />
              </>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No users found
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="user-email-cell">
                    {user.email}
                    {user.id === auth.currentUser?.uid && (
                      <span className="you-badge">You</span>
                    )}
                  </td>
                  <td className="user-id-cell">
                    <code>{user.id.substring(0, 12)}...</code>
                  </td>
                  <td>
                    <span className={getRoleBadgeClass(user.role || 'user')}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <div className="actions-wrapper">
                      <select
                        className="role-select"
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={updating === user.id || user.id === auth.currentUser?.uid}
                      >
                        <option value="user">User</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      {user.id === auth.currentUser?.uid ? (
                        <span className="cannot-edit-self">Can't edit yourself</span>
                      ) : (
                        <button
                          className="btn-delete-user"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={deleting === user.id}
                          title="Delete user"
                        >
                          {deleting === user.id ? (
                            <span className="spinner-small"></span>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                              <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && users.length > usersPerPage && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, users.length)} of {users.length} users
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
              ) : (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )
            ))}

            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !creating && resetForm()}>
          <div className="modal-content-user" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button
                className="modal-close"
                onClick={() => !creating && resetForm()}
                disabled={creating}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="user-form">
              <div className="form-group">
                <label htmlFor="userEmail">Email Address *</label>
                <input
                  type="email"
                  id="userEmail"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                  disabled={creating}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="userPassword">Password *</label>
                <input
                  type="password"
                  id="userPassword"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  required
                  disabled={creating}
                  minLength="6"
                  autoComplete="new-password"
                />
                <p className="form-hint">Minimum 6 characters. User can change this after first login.</p>
              </div>

              <div className="form-group">
                <label htmlFor="userRole">User Role *</label>
                <select
                  id="userRole"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  disabled={creating}
                  className="role-select-modal"
                >
                  <option value="user">User - Standard access</option>
                  <option value="editor">Editor - Content editing access</option>
                  <option value="admin">Admin - Full access</option>
                </select>
              </div>

              <div className="form-warning">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>
                  <strong>Important:</strong> Creating a user will sign you out. You'll need to sign back in as admin after the user is created.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={resetForm}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-create-user"
                  disabled={creating || !newUser.email || !newUser.password}
                >
                  {creating ? (
                    <span className="btn-loading">
                      <span className="btn-spinner"></span>
                      Creating User...
                    </span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

