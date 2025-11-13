import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import './ProjectSettings.css';

const ProjectSettings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [project, setProject] = useState(null);
  const [ragFiles, setRagFiles] = useState([]);
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    basePrompt: '',
    reportParameters: '',
    knowledgeBaseText: ''
  });

  useEffect(() => {
    if (!auth.currentUser || roleLoading) return;
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, roleLoading]);

  const loadRagFiles = async () => {
    try {
      const ragFolderRef = ref(storage, `projects/${projectId}/rag`);
      const filesList = await listAll(ragFolderRef);
      
      const filesData = await Promise.all(
        filesList.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            path: itemRef.fullPath,
            url: url
          };
        })
      );
      
      setRagFiles(filesData);
    } catch (error) {
      // Folder doesn't exist yet, that's okay
      if (error.code !== 'storage/object-not-found') {
        console.error('Error loading RAG files:', error);
      }
      setRagFiles([]);
    }
  };

  const loadProject = async () => {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      
      if (!projectDoc.exists()) {
        alert('Project not found');
        navigate('/projects');
        return;
      }

      const projectData = projectDoc.data();
      
      // Check if user owns this project or is admin
      if (projectData.userId !== auth.currentUser.uid && !isAdmin) {
        alert('You do not have permission to edit this project');
        navigate('/projects');
        return;
      }

      const projectObj = { id: projectDoc.id, ...projectData };
      setProject(projectObj);
      setSettings({
        name: projectData.name,
        description: projectData.description || '',
        basePrompt: projectData.settings?.basePrompt || '',
        reportParameters: projectData.settings?.reportParameters || '',
        knowledgeBaseText: projectData.settings?.knowledgeBaseText || ''
      });
      
      setLoading(false);
      
      // Load RAG files after project is set
      await loadRagFiles();
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Failed to load project: ' + error.message);
      navigate('/projects');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateDoc(doc(db, 'projects', projectId), {
        name: settings.name,
        description: settings.description,
        settings: {
          basePrompt: settings.basePrompt,
          reportParameters: settings.reportParameters,
          knowledgeBaseText: settings.knowledgeBaseText
        },
        updatedAt: new Date().toISOString()
      });

      alert('✅ Project settings saved successfully!');
      setSaving(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings: ' + error.message);
      setSaving(false);
    }
  };


  const handleRagFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `projects/${projectId}/rag/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          alert('Failed to upload file: ' + error.message);
          setUploading(false);
          setUploadProgress(0);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const newFile = {
              name: fileName,
              path: uploadTask.snapshot.ref.fullPath,
              url: downloadURL
            };
            setRagFiles([...ragFiles, newFile]);
            setUploading(false);
            setUploadProgress(0);
            alert('✅ File uploaded successfully!');
            e.target.value = ''; // Reset file input
          } catch (error) {
            console.error('Error getting download URL:', error);
            alert('File uploaded but failed to get URL: ' + error.message);
            setUploading(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (error) {
      console.error('Upload initialization error:', error);
      alert('Failed to start upload: ' + error.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteRagFile = async (filePath, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      setRagFiles(ragFiles.filter(f => f.path !== filePath));
      alert('✅ File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-header">
          <h2 className="page-title">Project Settings</h2>
        </div>
        <div className="settings-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <button onClick={() => navigate(`/projects/${projectId}/books`)} className="back-button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 16L6 10L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Books
          </button>
          <h2 className="page-title">Project Settings</h2>
          <p className="page-subtitle">{project.name}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings-form card">
        <div className="settings-section">
          <h3 className="section-title">General Information</h3>
          
          <div className="form-group">
            <label htmlFor="projectName">Project Name *</label>
            <input
              type="text"
              id="projectName"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="projectDescription">Description</label>
            <textarea
              id="projectDescription"
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              rows="3"
              disabled={saving}
              placeholder="Describe the purpose of this project..."
            />
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Knowledge Base Files</h3>
          
          <div className="form-group">
            <label htmlFor="ragFileUpload">Upload Files to Knowledge Base</label>
            <div className="file-upload-wrapper">
              <div className="file-upload-content">
                <svg className="file-upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4V16M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 16V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div className="file-upload-text">
                  <p className="file-upload-main-text">
                    {uploading ? 'Uploading file...' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="file-upload-sub-text">PDF, DOC, DOCX, TXT, or MD files</p>
                </div>
                <input
                  type="file"
                  id="ragFileUpload"
                  onChange={handleRagFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.md"
                  disabled={uploading || saving}
                  style={{ display: 'none' }}
                />
                <label htmlFor="ragFileUpload" className="file-upload-label">
                  {uploading ? 'Uploading...' : 'Choose File'}
                </label>
              </div>
              {uploading && (
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  <span className="upload-progress-text">{Math.round(uploadProgress)}%</span>
                </div>
              )}
            </div>
            <p className="field-hint">Upload files to enhance the knowledge base for this project</p>
            
            {ragFiles.length > 0 && (
              <div className="rag-files-list">
                <h4 className="rag-files-title">Uploaded Files ({ragFiles.length})</h4>
                {ragFiles.map((file, index) => (
                  <div key={index} className="rag-file-item">
                    <div className="rag-file-info">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path d="M4 4H16C17.1046 4 18 4.89543 18 6V14C18 15.1046 17.1046 16 16 16H4C2.89543 16 2 15.1046 2 14V6C2 4.89543 2.89543 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span className="rag-file-name">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-delete-rag-file"
                      onClick={() => handleDeleteRagFile(file.path, file.name)}
                      disabled={saving}
                      title="Delete file"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="knowledgeBaseText">Text Data for Knowledge Base</label>
            <textarea
              id="knowledgeBaseText"
              value={settings.knowledgeBaseText}
              onChange={(e) => setSettings({ ...settings, knowledgeBaseText: e.target.value })}
              rows="6"
              disabled={saving}
              placeholder="Enter text data, notes, or context that should be included in the knowledge base for this project..."
            />
            <p className="field-hint">Add text data, notes, or context that will be used to enhance AI understanding for this project</p>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">AI Configuration</h3>
          
          <div className="form-group">
            <label htmlFor="basePrompt">Customized Base Prompt</label>
            <textarea
              id="basePrompt"
              value={settings.basePrompt}
              onChange={(e) => setSettings({ ...settings, basePrompt: e.target.value })}
              rows="6"
              disabled={saving}
              placeholder="Enter the base prompt that will be used for AI analysis. This will be combined with the report parameters and knowledge base..."
            />
            <p className="field-hint">Define the base prompt/instructions for AI analysis. This will be used as the foundation for all reports in this project.</p>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Report Parameters</h3>
          
          <div className="form-group">
            <label htmlFor="reportParameters">Parameters to Check for Report</label>
            <textarea
              id="reportParameters"
              value={settings.reportParameters}
              onChange={(e) => setSettings({ ...settings, reportParameters: e.target.value })}
              rows="6"
              disabled={saving}
              placeholder="Enter the parameters that should be checked in the report generation. For example: grammar, spelling, style, structure, content quality, consistency, citations, formatting..."
            />
            <p className="field-hint">Specify the parameters or criteria that should be checked when generating reports for books in this project</p>
          </div>
        </div>

        <div className="settings-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/projects/${projectId}/books`)}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-gradient"
            disabled={saving || !settings.name.trim()}
          >
            {saving ? (
              <span className="btn-loading">
                <span className="btn-spinner"></span>
                Saving...
              </span>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectSettings;

