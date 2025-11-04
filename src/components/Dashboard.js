import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [books, setBooks] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'books'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBooks(booksData);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !bookTitle.trim()) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('Starting upload for:', selectedFile.name);
      const timestamp = Date.now();
      const fileName = `${auth.currentUser.uid}/${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, `books/${fileName}`);
      
      console.log('Storage ref created:', fileName);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress + '%');
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          
          let errorMessage = 'Failed to upload book. ';
          if (error.code === 'storage/unauthorized') {
            errorMessage += 'Storage access denied. Please check Firebase Storage rules.';
          } else if (error.code === 'storage/canceled') {
            errorMessage += 'Upload was canceled.';
          } else if (error.code === 'storage/unknown') {
            errorMessage += 'Unknown error occurred. Check Firebase configuration.';
          } else {
            errorMessage += error.message;
          }
          
          alert(errorMessage);
          setUploading(false);
        },
        async () => {
          try {
            console.log('Upload complete, getting download URL...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL:', downloadURL);
            
            console.log('Saving to Firestore...');
            await addDoc(collection(db, 'books'), {
              title: bookTitle.trim(),
              fileName: selectedFile.name,
              fileUrl: downloadURL,
              filePath: fileName,
              userId: auth.currentUser.uid,
              userEmail: auth.currentUser.email,
              status: 'pending',
              uploadedAt: new Date().toISOString(),
              reportData: null
            });

            console.log('Book saved successfully!');
            setShowUploadModal(false);
            setBookTitle('');
            setSelectedFile(null);
            setUploading(false);
            setUploadProgress(0);
          } catch (firestoreError) {
            console.error('Firestore error:', firestoreError);
            alert('File uploaded but failed to save to database: ' + firestoreError.message);
            setUploading(false);
          }
        }
      );
    } catch (error) {
      console.error('Upload initialization error:', error);
      alert('Failed to start upload: ' + error.message);
      setUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'processing':
        return 'status-processing';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <div className="nav-left">
            <img src="/page_perfect_ai.png" alt="PagePerfect AI" className="nav-logo" />
            <h1 className="nav-title gradient-text">PagePerfect AI</h1>
          </div>
          <div className="nav-right">
            <span className="user-email">{auth.currentUser?.email}</span>
            <button onClick={handleLogout} className="btn-logout">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h2 className="dashboard-title">My Books</h2>
            <p className="dashboard-subtitle">Upload and track your manuscript reviews</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-gradient btn-upload"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Upload Book
          </button>
        </div>

        {books.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <path d="M16 8H48C50.2091 8 52 9.79086 52 12V52C52 54.2091 50.2091 56 48 56H16C13.7909 56 12 54.2091 12 52V12C12 9.79086 13.7909 8 16 8Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 20H44M20 28H44M20 36H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h3>No books uploaded yet</h3>
            <p>Upload your first manuscript to get started with AI-powered review</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-gradient"
            >
              Upload Your First Book
            </button>
          </div>
        ) : (
          <div className="books-grid">
            {books.map((book) => (
              <div
                key={book.id}
                className="book-card card"
                onClick={() => book.status === 'completed' && navigate(`/book/${book.id}`)}
                style={{ cursor: book.status === 'completed' ? 'pointer' : 'default' }}
              >
                <div className="book-icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M10 5H30C31.1046 5 32 5.89543 32 7V33C32 34.1046 31.1046 35 30 35H10C8.89543 35 8 34.1046 8 33V7C8 5.89543 8.89543 5 10 5Z" fill="url(#gradient)" fillOpacity="0.2" stroke="url(#gradient)" strokeWidth="2"/>
                    <path d="M13 12H27M13 17H27M13 22H20" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="gradient" x1="8" y1="5" x2="32" y2="35">
                        <stop stopColor="#6366f1"/>
                        <stop offset="1" stopColor="#8b5cf6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="book-info">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-filename">{book.fileName}</p>
                  <p className="book-date">
                    Uploaded {new Date(book.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className={`book-status ${getStatusColor(book.status)}`}>
                  {getStatusText(book.status)}
                </div>
                {book.status === 'completed' && (
                  <div className="view-report-hint">
                    Click to view report →
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload New Book</h2>
              <button
                className="modal-close"
                onClick={() => !uploading && setShowUploadModal(false)}
                disabled={uploading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpload} className="upload-form">
              <div className="form-group">
                <label htmlFor="bookTitle">Book Title</label>
                <input
                  type="text"
                  id="bookTitle"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Enter book title"
                  required
                  disabled={uploading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="bookFile">Select File</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="bookFile"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt"
                    required
                    disabled={uploading}
                  />
                  <div className="file-input-display">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 14V6M10 6L7 9M10 6L13 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 14V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {selectedFile ? selectedFile.name : 'Choose a file'}
                  </div>
                </div>
                <p className="file-hint">Supported formats: PDF, DOC, DOCX, TXT</p>
              </div>
              {uploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">{Math.round(uploadProgress)}% uploaded</p>
                </div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gradient"
                  disabled={uploading || !selectedFile || !bookTitle.trim()}
                >
                  {uploading ? 'Uploading...' : 'Upload Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

