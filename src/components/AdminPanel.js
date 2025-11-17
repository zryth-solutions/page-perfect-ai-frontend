import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { AdminTableRowSkeleton } from './Skeleton';
import UserManagement from './UserManagement';
import SyncAuthUsers from './SyncAuthUsers';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedHtmlFile, setSelectedHtmlFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showHtmlUploadModal, setShowHtmlUploadModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'books'),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBooks(booksData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching books:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.md') || file.name.endsWith('.markdown'))) {
      setSelectedFile(file);
    } else {
      alert('Please select a markdown file (.md or .markdown)');
    }
  };

  const handleHtmlFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
      setSelectedHtmlFile(file);
    } else {
      alert('Please select an HTML file (.html or .htm)');
    }
  };

  const handleMarkdownUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedBook) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Read the markdown content from the file BEFORE uploading
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const markdownContent = event.target.result;

    try {
      // Extract the folder path from the book's filePath
      const pathParts = selectedBook.filePath.split('/');
      const folderPath = pathParts.slice(0, -1).join('/');
      
      // Create a markdown filename based on the original file
      const originalFileName = pathParts[pathParts.length - 1];
      const baseName = originalFileName.split('.')[0];
      const markdownFileName = `${baseName}_report.md`;
      
      const markdownPath = `${folderPath}/${markdownFileName}`;
      const storageRef = ref(storage, `books/${markdownPath}`);
      
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          alert('Failed to upload markdown file: ' + error.message);
          setUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
                // Update Firestore with the markdown content we already read
            const bookRef = doc(db, 'books', selectedBook.id);
            await updateDoc(bookRef, {
              reportData: markdownContent,
              status: 'completed',
              markdownFileUrl: downloadURL,
              markdownFileName: markdownFileName,
              processedAt: new Date().toISOString()
            });

            alert('Markdown file uploaded and Report A updated successfully!');
            setShowUploadModal(false);
            setSelectedFile(null);
            setSelectedBook(null);
            setUploading(false);
            setUploadProgress(0);
          } catch (error) {
            console.error('Error updating document:', error);
            alert('File uploaded but failed to update database: ' + error.message);
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

      reader.onerror = () => {
        alert('Failed to read markdown file');
        setUploading(false);
      };

      // Read the file as text
      reader.readAsText(selectedFile);
    } catch (error) {
      console.error('Upload initialization error:', error);
      alert('Failed to start upload: ' + error.message);
      setUploading(false);
    }
  };

  const handleHtmlUpload = async (e) => {
    e.preventDefault();
    if (!selectedHtmlFile || !selectedBook) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Read the HTML content from the file BEFORE uploading
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const htmlContent = event.target.result;

        try {
          // Extract the folder path from the book's filePath
          const pathParts = selectedBook.filePath.split('/');
          const folderPath = pathParts.slice(0, -1).join('/');
          
          // Create an HTML filename based on the original file
          const originalFileName = pathParts[pathParts.length - 1];
          const baseName = originalFileName.split('.')[0];
          const htmlFileName = `${baseName}_report_b.html`;
          
          const htmlPath = `${folderPath}/${htmlFileName}`;
          const storageRef = ref(storage, `books/${htmlPath}`);
          
          const uploadTask = uploadBytesResumable(storageRef, selectedHtmlFile);

          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Upload error:', error);
              alert('Failed to upload HTML file: ' + error.message);
              setUploading(false);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                // Update Firestore with the HTML content we already read
                const bookRef = doc(db, 'books', selectedBook.id);
                await updateDoc(bookRef, {
                  reportDataB: htmlContent,
                  htmlFileUrl: downloadURL,
                  htmlFileName: htmlFileName,
                  reportBProcessedAt: new Date().toISOString()
                });

                alert('HTML file uploaded and Report B updated successfully!');
                setShowHtmlUploadModal(false);
                setSelectedHtmlFile(null);
                setSelectedBook(null);
                setUploading(false);
                setUploadProgress(0);
              } catch (error) {
                console.error('Error updating document:', error);
                alert('File uploaded but failed to update database: ' + error.message);
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

      reader.onerror = () => {
        alert('Failed to read HTML file');
        setUploading(false);
      };

      // Read the file as text
      reader.readAsText(selectedHtmlFile);
    } catch (error) {
      console.error('Upload initialization error:', error);
      alert('Failed to start upload: ' + error.message);
      setUploading(false);
    }
  };

  const handleUpdateStatus = async (bookId, newStatus) => {
    try {
      const bookRef = doc(db, 'books', bookId);
      await updateDoc(bookRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + error.message);
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

  return (
    <div className="admin-container">
      <nav className="admin-nav">
        <div className="nav-content">
          <div className="nav-left">
            <img src="/page_perfect_ai.png" alt="Wrytflow AI" className="nav-logo" />
            <h1 className="nav-title gradient-text">Admin Panel</h1>
          </div>
          <div className="nav-right">
            <span className="user-email">{auth.currentUser?.email}</span>
            <button onClick={handleLogout} className="btn-logout">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="admin-main">
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            📚 Book Submissions
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 User Management
          </button>
          <button
            className={`tab-button ${activeTab === 'sync' ? 'active' : ''}`}
            onClick={() => setActiveTab('sync')}
          >
            🔄 Sync Users
          </button>
        </div>

        {activeTab === 'books' ? (
          <>
            <div className="admin-header">
              <div>
                <h2 className="admin-title">All Submissions</h2>
                <p className="admin-subtitle">Manage book reviews and upload reports</p>
              </div>
            </div>

            <div className="books-table-container">
          <table className="books-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>User</th>
                <th>File</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <AdminTableRowSkeleton />
                  <AdminTableRowSkeleton />
                  <AdminTableRowSkeleton />
                  <AdminTableRowSkeleton />
                  <AdminTableRowSkeleton />
                  <AdminTableRowSkeleton />
                  <AdminTableRowSkeleton />
                </>
              ) : (
                books.map((book) => (
                <tr key={book.id}>
                  <td className="book-title-cell">{book.title}</td>
                  <td>{book.userEmail}</td>
                  <td>{book.fileName}</td>
                  <td>{new Date(book.uploadedAt).toLocaleDateString()}</td>
                  <td>
                    <select
                      className={`status-select ${getStatusColor(book.status)}`}
                      value={book.status}
                      onChange={(e) => handleUpdateStatus(book.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="btn-upload-md"
                        onClick={() => {
                          setSelectedBook(book);
                          setShowUploadModal(true);
                        }}
                        title="Upload Report A (Markdown)"
                      >
                        Upload Report A
                      </button>
                      <button
                        className="btn-upload-html"
                        onClick={() => {
                          setSelectedBook(book);
                          setShowHtmlUploadModal(true);
                        }}
                        title="Upload Report B (HTML)"
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          color: 'white',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Upload Report B
                      </button>
                      {book.status === 'completed' && (
                        <>
                          {book.reportData && (
                            <button
                              className="btn-view"
                              onClick={() => navigate(`/book/${book.id}?report=A`)}
                              title="View Report A (Markdown)"
                            >
                              View Report A
                            </button>
                          )}
                          {book.reportDataB && (
                            <button
                              className="btn-view"
                              onClick={() => navigate(`/book/${book.id}?report=B`)}
                              title="View Report B (HTML)"
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                marginLeft: '8px'
                              }}
                            >
                              View Report B
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
          </>
        ) : activeTab === 'users' ? (
          <UserManagement />
        ) : (
          <SyncAuthUsers />
        )}
      </main>

      {showUploadModal && selectedBook && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Report for "{selectedBook.title}"</h2>
              <button
                className="modal-close"
                onClick={() => !uploading && setShowUploadModal(false)}
                disabled={uploading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleMarkdownUpload} className="upload-form">
              <div className="form-group">
                <label>User: {selectedBook.userEmail}</label>
                <label>Original File: {selectedBook.fileName}</label>
              </div>
              <div className="form-group">
                <label htmlFor="markdownFile">Select Markdown File</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="markdownFile"
                    onChange={handleFileSelect}
                    accept=".md,.markdown"
                    required
                    disabled={uploading}
                  />
                  <div className="file-input-display">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 14V6M10 6L7 9M10 6L13 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 14V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {selectedFile ? selectedFile.name : 'Choose a markdown file'}
                  </div>
                </div>
                <p className="file-hint">Upload the .md report file to the same folder as the uploaded book</p>
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
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <span className="btn-loading">
                      <span className="btn-spinner"></span>
                      Uploading...
                    </span>
                  ) : (
                    'Upload & Process'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHtmlUploadModal && selectedBook && (
        <div className="modal-overlay" onClick={() => !uploading && setShowHtmlUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Report B (HTML) for "{selectedBook.title}"</h2>
              <button
                className="modal-close"
                onClick={() => !uploading && setShowHtmlUploadModal(false)}
                disabled={uploading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleHtmlUpload} className="upload-form">
              <div className="form-group">
                <label>User: {selectedBook.userEmail}</label>
                <label>Original File: {selectedBook.fileName}</label>
              </div>
              <div className="form-group">
                <label htmlFor="htmlFile">Select HTML File</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="htmlFile"
                    onChange={handleHtmlFileSelect}
                    accept=".html,.htm"
                    required
                    disabled={uploading}
                  />
                  <div className="file-input-display">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 14V6M10 6L7 9M10 6L13 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 14V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {selectedHtmlFile ? selectedHtmlFile.name : 'Choose an HTML file'}
                  </div>
                </div>
                <p className="file-hint">Upload the .html report file (Report B) for A/B testing</p>
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
                  onClick={() => setShowHtmlUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gradient"
                  disabled={uploading || !selectedHtmlFile}
                >
                  {uploading ? (
                    <span className="btn-loading">
                      <span className="btn-spinner"></span>
                      Uploading...
                    </span>
                  ) : (
                    'Upload Report B'
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

export default AdminPanel;

