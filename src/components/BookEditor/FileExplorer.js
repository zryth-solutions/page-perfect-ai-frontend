/**
 * FileExplorer Component
 * File tree with folders for Questions, Answer Keys, and Explanations
 */

import React, { useState, useMemo } from 'react';
import './FileExplorer.css';

const FileExplorer = ({ files, selectedFile, onFileSelect, hasUnsavedChanges }) => {
  const [expandedFolders, setExpandedFolders] = useState({
    questions: true,
    answerKeys: true,
    explanations: true
  });

  // Categorize files
  const categorizedFiles = useMemo(() => {
    const categories = {
      questions: [],
      answerKeys: [],
      explanations: []
    };

    files.forEach(file => {
      if (file.category === 'question') {
        categories.questions.push(file);
      } else if (file.category === 'answer_key') {
        categories.answerKeys.push(file);
      } else if (file.category === 'explanation') {
        categories.explanations.push(file);
      }
    });

    // Sort files alphabetically
    Object.keys(categories).forEach(key => {
      categories[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    return categories;
  }, [files]);

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  const handleFileClick = (file) => {
    if (hasUnsavedChanges) {
      // Parent component will handle confirmation
      onFileSelect(file);
    } else {
      onFileSelect(file);
    }
  };

  const isFileSelected = (file) => {
    return selectedFile && selectedFile.path === file.path;
  };

  const renderFolder = (title, icon, files, folderKey) => {
    const isExpanded = expandedFolders[folderKey];

    return (
      <div className="folder">
        <div
          className="folder-header"
          onClick={() => toggleFolder(folderKey)}
        >
          <span className="folder-icon">
            {isExpanded ? '📂' : '📁'}
          </span>
          <span className="folder-title">{title}</span>
          <span className="folder-count">({files.length})</span>
          <span className="folder-toggle">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>

        {isExpanded && (
          <div className="folder-content">
            {files.length === 0 ? (
              <div className="empty-folder">No files</div>
            ) : (
              files.map((file, idx) => (
                <div
                  key={idx}
                  className={`file-item ${isFileSelected(file) ? 'selected' : ''}`}
                  onClick={() => handleFileClick(file)}
                  title={file.name}
                >
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <h3>Files</h3>
        <span className="file-total">{files.length} total</span>
      </div>

      <div className="explorer-content">
        {renderFolder(
          'Questions',
          '📋',
          categorizedFiles.questions,
          'questions'
        )}

        {renderFolder(
          'Answer Keys',
          '🔑',
          categorizedFiles.answerKeys,
          'answerKeys'
        )}

        {renderFolder(
          'Explanations',
          '💡',
          categorizedFiles.explanations,
          'explanations'
        )}
      </div>

      {hasUnsavedChanges && (
        <div className="explorer-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">Unsaved changes</span>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;

