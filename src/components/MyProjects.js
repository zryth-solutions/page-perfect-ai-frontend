import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { ProjectTableRowSkeleton, MobileProjectCardSkeleton } from './Skeleton';
import './MyProjects.css';

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage] = useState(10);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    settings: {
      allowedFileTypes: ['pdf', 'doc', 'docx', 'txt'],
      maxFileSize: 10, // MB
      autoProcess: false,
      reportFormat: 'markdown'
    }
  });
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole(auth.currentUser);

  useEffect(() => {
    if (!auth.currentUser || roleLoading) return;

    console.log('Fetching projects for user:', auth.currentUser.uid, 'isAdmin:', isAdmin);

    // Start with simple query without orderBy to avoid index issues
    const q = isAdmin 
      ? query(collection(db, 'projects'))
      : query(
          collection(db, 'projects'),
          where('userId', '==', auth.currentUser.uid)
        );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const projectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort on client side
        projectsData.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        console.log('Projects loaded:', projectsData);
        setProjects(projectsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching projects:', error);
        alert('Error loading projects: ' + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin, roleLoading]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    setCreating(true);

    try {
      await addDoc(collection(db, 'projects'), {
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        settings: newProject.settings,
        bookCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setShowCreateModal(false);
      setNewProject({
        name: '',
        description: '',
        settings: {
          allowedFileTypes: ['pdf', 'doc', 'docx', 'txt'],
          maxFileSize: 10,
          autoProcess: false,
          reportFormat: 'markdown'
        }
      });
      setCreating(false);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project: ' + error.message);
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    const confirmDelete = window.confirm(
      `⚠️ Are you sure you want to delete "${projectName}"?\n\nThis will delete the project and all its books. This action cannot be undone!`
    );

    if (!confirmDelete) return;

    setDeleting(projectId);

    try {
      // First, delete all books under this project
      const booksQuery = query(
        collection(db, 'books'),
        where('projectId', '==', projectId)
      );
      const booksSnapshot = await getDocs(booksQuery);
      
      const deletePromises = booksSnapshot.docs.map(bookDoc => 
        deleteDoc(doc(db, 'books', bookDoc.id))
      );
      
      await Promise.all(deletePromises);
      
      // Then delete the project itself
      await deleteDoc(doc(db, 'projects', projectId));
      
      // Analytics will automatically update since they read from the collections in real-time
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  // Pagination calculations
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(projects.length / projectsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="content-header">
        <div>
          <h2 className="page-title">{isAdmin ? 'All Projects' : 'My Projects'}</h2>
          <p className="page-subtitle">
            Total {projects.length} project{projects.length !== 1 ? 's' : ''}
            {isAdmin && ' • Admin View'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-gradient btn-create-project"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create Project
        </button>
      </div>

      {loading ? (
        <>
          {/* Desktop Skeleton */}
          <div className="table-container card desktop-only">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>PROJECT NAME</th>
                  <th>DESCRIPTION</th>
                  <th>BOOKS</th>
                  <th>CREATED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <ProjectTableRowSkeleton />
                <ProjectTableRowSkeleton />
                <ProjectTableRowSkeleton />
              </tbody>
            </table>
          </div>

          {/* Mobile Skeleton */}
          <div className="mobile-projects-container mobile-only">
            <MobileProjectCardSkeleton />
            <MobileProjectCardSkeleton />
            <MobileProjectCardSkeleton />
          </div>
        </>
      ) : projects.length === 0 ? (
        <div className="empty-state card">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <path d="M32 8L8 18V32C8 44 16 54 32 56C48 54 56 44 56 32V18L32 8Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M32 24V32M32 40H32.02" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>No projects yet</h3>
          <p>Create your first project to organize your books and reports</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-gradient"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container card desktop-only">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>PROJECT NAME</th>
                  {isAdmin && <th>OWNER</th>}
                  <th>DESCRIPTION</th>
                  <th>BOOKS</th>
                  <th>CREATED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="project-name-cell">
                      <div className="project-name-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="project-icon-inline">
                          <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M3 7L12 13L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="project-name-text">{project.name}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="project-owner-cell">{project.userEmail}</td>
                    )}
                    <td className="project-description-cell">
                      {project.description || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No description</span>}
                    </td>
                    <td>
                      <span className="book-count-badge">{project.bookCount || 0}</span>
                    </td>
                    <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn-view"
                          onClick={() => navigate(`/projects/${project.id}/books`)}
                        >
                          View Books
                        </button>
                        <button
                          className="btn-settings-table"
                          onClick={() => navigate(`/projects/${project.id}/settings`)}
                          title="Project Settings"
                        >
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                            <path d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z" stroke="currentColor" strokeWidth="2"/>
                            <path d="M16 10C16 10.5 16.2 10.9 16.4 11.3L15.2 12.5C15.5 13.2 15.9 13.8 16.4 14.3L17.7 13.1C18.1 13.3 18.5 13.5 19 13.5V15H20C20 14.5 19.8 14.1 19.6 13.7L20.8 12.5C20.5 11.8 20.1 11.2 19.6 10.7L18.3 11.9C17.9 11.7 17.5 11.5 17 11.5V10H16Z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button
                          className="btn-delete-table"
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          disabled={deleting === project.id}
                          title="Delete project"
                        >
                          {deleting === project.id ? (
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
            {totalPages > 1 && (
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
            )}
          </div>

          {/* Mobile Card View */}
          <div className="mobile-projects-container mobile-only">
            {currentProjects.map((project) => (
              <div key={project.id} className="mobile-project-card card">
                <div className="mobile-project-header">
                  <div className="project-icon-small">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 className="mobile-project-name">{project.name}</h3>
                </div>

                <p className="mobile-project-description">
                  {project.description || 'No description'}
                </p>

                {isAdmin && (
                  <div className="mobile-project-user">
                    <span className="project-label">Owner:</span>
                    <span>{project.userEmail}</span>
                  </div>
                )}

                <div className="mobile-project-stats">
                  <div className="mobile-stat">
                    <span className="stat-label">Books:</span>
                    <span className="stat-value">{project.bookCount || 0}</span>
                  </div>
                  <div className="mobile-stat">
                    <span className="stat-label">Created:</span>
                    <span className="stat-value">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mobile-project-actions">
                  <button
                    className="btn-view-books-mobile"
                    onClick={() => navigate(`/projects/${project.id}/books`)}
                  >
                    View Books
                  </button>
                  <button
                    className="btn-settings-mobile"
                    onClick={() => navigate(`/projects/${project.id}/settings`)}
                  >
                    Settings
                  </button>
                  <button
                    className="btn-delete-mobile"
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    disabled={deleting === project.id}
                  >
                    Delete
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

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !creating && setShowCreateModal(false)}>
          <div className="modal-content-project" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button
                className="modal-close"
                onClick={() => !creating && setShowCreateModal(false)}
                disabled={creating}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="project-form">
              <div className="form-group">
                <label htmlFor="projectName">Project Name *</label>
                <input
                  type="text"
                  id="projectName"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g., Novel Manuscript Reviews"
                  required
                  disabled={creating}
                />
              </div>

              <div className="form-group">
                <label htmlFor="projectDescription">Description</label>
                <textarea
                  id="projectDescription"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe the purpose of this project..."
                  rows="3"
                  disabled={creating}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gradient"
                  disabled={creating || !newProject.name.trim()}
                >
                  {creating ? (
                    <span className="btn-loading">
                      <span className="btn-spinner"></span>
                      Creating...
                    </span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Create Project
                    </>
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

export default MyProjects;

