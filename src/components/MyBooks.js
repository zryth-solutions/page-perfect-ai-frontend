import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, increment } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import CircularProgress from './CircularProgress';
import { BookTableRowSkeleton, MobileBookCardSkeleton } from './Skeleton';
import './MyBooks.css';

const MyBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMdUploadModal, setShowMdUploadModal] = useState(false);
  const [showHtmlUploadModal, setShowHtmlUploadModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [mdFile, setMdFile] = useState(null);
  const [htmlFile, setHtmlFile] = useState(null);
  const [deletingBookId, setDeletingBookId] = useState(null);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole(auth.currentUser);

  useEffect(() => {
    if (!auth.currentUser || roleLoading) return;

    // If admin, fetch all books; otherwise fetch only user's books
    // Simple query without orderBy to avoid index issues
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
        // Sort on client side
        booksData.sort((a, b) => {
          const dateA = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
          const dateB = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
          return dateB - dateA;
        });
        console.log('Books loaded:', booksData);
        setBooks(booksData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching books:', error);
        alert('Error loading books: ' + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin, roleLoading]);

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
      const timestamp = Date.now();
      const fileName = `${auth.currentUser.uid}/${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, `books/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          let errorMessage = 'Failed to upload book. ';
          if (error.code === 'storage/unauthorized') {
            errorMessage += 'Storage access denied. Please check Firebase Storage rules.';
          } else {
            errorMessage += error.message;
          }
          alert(errorMessage);
          setUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
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

  const handleMdFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.md') || file.name.endsWith('.markdown'))) {
      setMdFile(file);
    } else {
      alert('Please select a markdown file (.md or .markdown)');
    }
  };

  const handleHtmlFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
      setHtmlFile(file);
    } else {
      alert('Please select an HTML file (.html or .htm)');
    }
  };

  const handleMdUpload = async (e) => {
    e.preventDefault();
    if (!mdFile || !selectedBook) return;

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
          
          const uploadTask = uploadBytesResumable(storageRef, mdFile);

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
                setShowMdUploadModal(false);
                setMdFile(null);
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
      reader.readAsText(mdFile);
    } catch (error) {
      console.error('Upload initialization error:', error);
      alert('Failed to start upload: ' + error.message);
      setUploading(false);
    }
  };

  const handleHtmlUpload = async (e) => {
    e.preventDefault();
    if (!htmlFile || !selectedBook) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const htmlContent = event.target.result;
        
        try {
          const pathParts = selectedBook.filePath.split('/');
          const folderPath = pathParts.slice(0, -1).join('/');
          const originalFileName = pathParts[pathParts.length - 1];
          const baseName = originalFileName.split('.')[0];
          const htmlFileName = `${baseName}_report_b.html`;
          const htmlPath = `${folderPath}/${htmlFileName}`;
          const storageRef = ref(storage, `books/${htmlPath}`);
          
          const uploadTask = uploadBytesResumable(storageRef, htmlFile);

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
                
                const bookRef = doc(db, 'books', selectedBook.id);
                await updateDoc(bookRef, {
                  reportDataB: htmlContent,
                  htmlFileUrl: downloadURL,
                  htmlFileName: htmlFileName,
                  reportBProcessedAt: new Date().toISOString()
                });

                alert('HTML file uploaded and Report B updated successfully!');
                setShowHtmlUploadModal(false);
                setHtmlFile(null);
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

      reader.readAsText(htmlFile);
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

  const handleDeleteBook = async (bookId, bookTitle, projectId) => {
    const confirmDelete = window.confirm(
      `⚠️ Are you sure you want to delete "${bookTitle}"?\n\nThis action cannot be undone!`
    );

    if (!confirmDelete) return;

    setDeletingBookId(bookId);

    try {
      // Delete the book
      await deleteDoc(doc(db, 'books', bookId));
      
      // Decrement book count in project if book belongs to a project
      if (projectId) {
        await updateDoc(doc(db, 'projects', projectId), {
          bookCount: increment(-1),
          updatedAt: new Date().toISOString()
        });
      }
      
      // Analytics will automatically update since they read from the collections in real-time
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book: ' + error.message);
    } finally {
      setDeletingBookId(null);
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

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'processing':
        return 50;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  const totalPages = Math.ceil(books.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBooks = books.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      <div className="content-header">
        <div>
          <h2 className="page-title">{isAdmin ? 'All Books' : 'My Books'}</h2>
          <p className="page-subtitle">
            Total {books.length} book{books.length !== 1 ? 's' : ''} • 
            {books.filter(b => b.status === 'completed').length} completed
            {isAdmin && ' • Admin View'}
          </p>
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

      {loading ? (
        <>
          {/* Desktop Skeleton */}
          <div className="table-container card desktop-only">
            <table className="books-table">
              <thead>
                <tr>
                  <th>TITLE</th>
                  <th>FILE NAME</th>
                  <th>UPLOAD DATE</th>
                  <th>STATUS</th>
                  <th>PROGRESS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <BookTableRowSkeleton />
                <BookTableRowSkeleton />
                <BookTableRowSkeleton />
                <BookTableRowSkeleton />
                <BookTableRowSkeleton />
              </tbody>
            </table>
          </div>

          {/* Mobile Skeleton */}
          <div className="mobile-books-container mobile-only">
            <MobileBookCardSkeleton />
            <MobileBookCardSkeleton />
            <MobileBookCardSkeleton />
          </div>
        </>
      ) : books.length === 0 ? (
        <div className="empty-state card">
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
        <>
          {/* Desktop Table View */}
          <div className="table-container card desktop-only">
            <table className="books-table">
              <thead>
                <tr>
                  <th>TITLE</th>
                  {isAdmin && <th>USER</th>}
                  <th>FILE NAME</th>
                  <th>UPLOAD DATE</th>
                  <th>STATUS</th>
                  {!isAdmin && <th>PROGRESS</th>}
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentBooks.map((book) => (
                  <tr key={book.id}>
                    <td className="book-title-cell">{book.title}</td>
                    {isAdmin && <td className="book-user-cell">{book.userEmail}</td>}
                    <td className="book-filename-cell">{book.fileName}</td>
                    <td>{new Date(book.uploadedAt).toLocaleDateString()}</td>
                    <td>
                      {isAdmin ? (
                        <select
                          className={`status-select ${getStatusColor(book.status)}`}
                          value={book.status}
                          onChange={(e) => handleUpdateStatus(book.id, e.target.value)}
                        >
                          <option value="pending">Pending Review</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </select>
                      ) : (
                      <span className={`status-badge ${getStatusColor(book.status)}`}>
                        {getStatusText(book.status)}
                      </span>
                      )}
                    </td>
                    {!isAdmin && (
                    <td>
                      <div className="progress-cell">
                        <CircularProgress 
                          percentage={getProgressPercentage(book.status)} 
                        />
                      </div>
                    </td>
                    )}
                    <td>
                      <div className="actions-cell">
                        {isAdmin && (
                          <>
                            <button
                              className="btn-upload-md"
                              onClick={() => {
                                setSelectedBook(book);
                                setShowMdUploadModal(true);
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
                          </>
                        )}
                      {book.reportData && (
                        <button
                          className="btn-view"
                          onClick={() => navigate(`/book/${book.id}?report=A`)}
                          disabled={book.status !== 'completed'}
                          title="View Report A (Markdown)"
                        >
                          View Report A
                        </button>
                      )}
                      {book.reportDataB && (
                        <button
                          className="btn-view"
                          onClick={() => navigate(`/book/${book.id}?report=B`)}
                          disabled={book.status !== 'completed'}
                          title="View Report B (HTML)"
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none'
                          }}
                        >
                          View Report B
                        </button>
                      )}
                      <button
                        className="btn-delete-table"
                        onClick={() => handleDeleteBook(book.id, book.title, book.projectId)}
                        disabled={deletingBookId === book.id}
                        title="Delete book"
                      >
                        {deletingBookId === book.id ? (
                          <span className="spinner-small"></span>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                            <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Desktop Pagination */}
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M12 16L6 10L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div className="pagination-numbers">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

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

          {/* Mobile Card View */}
          <div className="mobile-books-container mobile-only">
            {currentBooks.map((book) => (
              <div key={book.id} className="mobile-book-card card">
                <div className="mobile-card-header">
                  <h3 className="mobile-book-title">{book.title}</h3>
                </div>
                
                <div className="mobile-card-body">
                  {isAdmin && (
                    <div className="mobile-info-row">
                      <span className="mobile-label">User:</span>
                      <span className="mobile-value">{book.userEmail}</span>
                    </div>
                  )}
                  <div className="mobile-info-row">
                    <span className="mobile-label">File:</span>
                    <span className="mobile-value">{book.fileName}</span>
                  </div>
                  <div className="mobile-info-row">
                    <span className="mobile-label">Date:</span>
                    <span className="mobile-value">{new Date(book.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mobile-info-row">
                    <span className="mobile-label">Status:</span>
                    {isAdmin ? (
                      <select
                        className={`status-select ${getStatusColor(book.status)}`}
                        value={book.status}
                        onChange={(e) => handleUpdateStatus(book.id, e.target.value)}
                      >
                        <option value="pending">Pending Review</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${getStatusColor(book.status)}`}>
                        {getStatusText(book.status)}
                      </span>
                    )}
                  </div>
                  {!isAdmin && (
                    <div className="mobile-info-row mobile-progress-row">
                      <span className="mobile-label">Progress:</span>
                      <div className="mobile-progress-wrapper">
                        <CircularProgress 
                          percentage={getProgressPercentage(book.status)} 
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mobile-card-footer">
                  {isAdmin && (
                    <>
                      <button
                        className="btn-upload-md mobile-btn-upload-md"
                        onClick={() => {
                          setSelectedBook(book);
                          setShowMdUploadModal(true);
                        }}
                      >
                        Upload Report A
                      </button>
                      <button
                        className="btn-upload-html mobile-btn-upload-md"
                        onClick={() => {
                          setSelectedBook(book);
                          setShowHtmlUploadModal(true);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        }}
                      >
                        Upload Report B
                      </button>
                    </>
                  )}
                  {book.reportData && (
                    <button
                      className="btn-view mobile-btn-view"
                      onClick={() => navigate(`/book/${book.id}?report=A`)}
                      disabled={book.status !== 'completed'}
                    >
                      View Report A
                    </button>
                  )}
                  {book.reportDataB && (
                    <button
                      className="btn-view mobile-btn-view"
                      onClick={() => navigate(`/book/${book.id}?report=B`)}
                      disabled={book.status !== 'completed'}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none'
                      }}
                    >
                      View Report B
                    </button>
                  )}
                  <button
                    className="btn-delete-mobile"
                    onClick={() => handleDeleteBook(book.id, book.title, book.projectId)}
                    disabled={deletingBookId === book.id}
                  >
                    {deletingBookId === book.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
            
            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="mobile-pagination">
                <button
                  className="mobile-pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M12 16L6 10L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Previous
                </button>
                
                <span className="mobile-pagination-info">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  className="mobile-pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </>
      )}

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
                  {uploading ? (
                    <span className="btn-loading">
                      <span className="btn-spinner"></span>
                      Uploading...
                    </span>
                  ) : (
                    'Upload Book'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMdUploadModal && selectedBook && (
        <div className="modal-overlay" onClick={() => !uploading && setShowMdUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Report A (Markdown) for "{selectedBook.title}"</h2>
              <button
                className="modal-close"
                onClick={() => !uploading && setShowMdUploadModal(false)}
                disabled={uploading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleMdUpload} className="upload-form">
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
                    onChange={handleMdFileSelect}
                    accept=".md,.markdown"
                    required
                    disabled={uploading}
                  />
                  <div className="file-input-display">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 14V6M10 6L7 9M10 6L13 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 14V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {mdFile ? mdFile.name : 'Choose a markdown file'}
                  </div>
                </div>
                <p className="file-hint">Upload the .md report file</p>
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
                  onClick={() => setShowMdUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gradient"
                  disabled={uploading || !mdFile}
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
                    {htmlFile ? htmlFile.name : 'Choose an HTML file'}
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
                  disabled={uploading || !htmlFile}
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
    </>
  );
};

export default MyBooks;
