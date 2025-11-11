import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useUserRole } from './hooks/useUserRole';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import MyBooks from './components/MyBooks';
import BookReport from './components/BookReport';
import AdminPanel from './components/AdminPanel';
import UserManagement from './components/UserManagement';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: roleLoading } = useUserRole(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading || roleLoading) {
    return (
      <div className="loading-screen">
        <div className="shimmer-loader">
          <div className="shimmer-bar"></div>
          <div className="shimmer-bar"></div>
          <div className="shimmer-bar"></div>
          <div className="shimmer-bar"></div>
          <div className="shimmer-bar"></div>
        </div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/analytics" /> : <Login />} 
        />
        <Route 
          path="/" 
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        >
          <Route index element={<Navigate to="/analytics" replace />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="books" element={<MyBooks />} />
          <Route 
            path="user-management" 
            element={isAdmin ? <UserManagement /> : <Navigate to="/analytics" />} 
          />
        </Route>
        <Route 
          path="/admin" 
          element={user && isAdmin ? <AdminPanel /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/book/:bookId" 
          element={user ? <BookReport /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;

