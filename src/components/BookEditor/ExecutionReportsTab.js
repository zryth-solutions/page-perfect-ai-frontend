import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import './ExecutionReportsTab.css';

const GEMINI_MODELS = [
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
];

const EXECUTION_ITEMS = [
  {
    id: 'theory',
    name: 'Theory',
    files: {
      question: 'theory.md',
      key: null,
      explanation: null
    }
  },
  {
    id: 'competency',
    name: 'Competency Focused Questions',
    files: {
      question: 'Competency_Focused_Questions.md',
      key: 'Competency_Focused_Questions_key.md',
      explanation: 'Competency_Focused_Questions_ans.md'
    }
  },
  {
    id: 'level1',
    name: 'Multiple Choice Questions Level 1',
    files: {
      question: 'Multiple_Choice_Questions_Level_1.md',
      key: 'Multiple_Choice_Questions_Level_1_key.md',
      explanation: 'Multiple_Choice_Questions_Level_1_ans.md'
    }
  },
  {
    id: 'level1_part2',
    name: 'Multiple Choice Questions Level 1 Part 2',
    files: {
      question: 'Multiple_Choice_Questions_Level_1_Part_2.md',
      key: 'Multiple_Choice_Questions_Level_1_Part_2_key.md',
      explanation: 'Multiple_Choice_Questions_Level_1_Part_2_ans.md'
    }
  },
  {
    id: 'level2',
    name: 'Multiple Choice Questions Level 2',
    files: {
      question: 'Multiple_Choice_Questions_Level_2.md',
      key: 'Multiple_Choice_Questions_Level_2_key.md',
      explanation: 'Multiple_Choice_Questions_Level_2_ans.md'
    }
  },
  {
    id: 'level2_part2',
    name: 'Multiple Choice Questions Level 2 Part 2',
    files: {
      question: 'Multiple_Choice_Questions_Level_2_Part_2.md',
      key: 'Multiple_Choice_Questions_Level_2_Part_2_key.md',
      explanation: 'Multiple_Choice_Questions_Level_2_Part_2_ans.md'
    }
  },
  {
    id: 'achievers',
    name: 'Achievers Section',
    files: {
      question: 'ACHIEVERS_SECTION.md',
      key: 'ACHIEVERS_SECTION_key.md',
      explanation: 'ACHIEVERS_SECTION_ans.md'
    }
  }
];

const ExecutionReportsTab = ({ book, currentUser }) => {
  const [config, setConfig] = useState({
    model: 'gemini-2.5-pro',
    grade: '',
    board: '',
    subject: ''
  });
  const [executions, setExecutions] = useState({});
  const [fileValidation, setFileValidation] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [runningExecution, setRunningExecution] = useState(null);

  // Check if current user is the book owner
  const isOwner = currentUser && book.userId === currentUser.uid;

  useEffect(() => {
    if (book?.id) {
      loadConfigAndExecutions();
      validateFiles();
    }
  }, [book?.id]);

  const loadConfigAndExecutions = async () => {
    try {
      setLoading(true);

      // Load execution config
      const configRef = doc(db, 'books', book.id, 'executionConfig', 'config');
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        setConfig(configSnap.data());
      }

      // Load execution statuses
      const executionData = {};
      for (const item of EXECUTION_ITEMS) {
        const execRef = doc(db, 'books', book.id, 'executions', item.id);
        const execSnap = await getDoc(execRef);
        
        if (execSnap.exists()) {
          executionData[item.id] = execSnap.data();
        } else {
          executionData[item.id] = {
            status: 'not_started',
            reportPath: null,
            error: null
          };
        }
      }
      
      setExecutions(executionData);
    } catch (error) {
      console.error('Error loading config and executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateFiles = async () => {
    // TODO: Implement actual file validation by checking Firebase Storage
    // For now, assume all files exist
    const validation = {};
    
    for (const item of EXECUTION_ITEMS) {
      validation[item.id] = {
        question: true,
        key: item.files.key ? true : null, // null means not required
        explanation: item.files.explanation ? true : null
      };
    }
    
    setFileValidation(validation);
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveConfig = async () => {
    if (!config.grade || !config.board || !config.subject) {
      alert('Please fill in all configuration fields');
      return;
    }

    try {
      setSavingConfig(true);
      const configRef = doc(db, 'books', book.id, 'executionConfig', 'config');
      await setDoc(configRef, config);
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleStartExecution = async (itemId) => {
    const item = EXECUTION_ITEMS.find(i => i.id === itemId);
    
    // Validate configuration
    if (!config.grade || !config.board || !config.subject) {
      alert('Please configure Grade, Board, and Subject before starting execution');
      return;
    }

    // Check file validation
    const validation = fileValidation[itemId];
    if (!validation?.question) {
      alert(`Question file is missing for ${item.name}`);
      return;
    }

    // Warn if key or explanation is missing
    if (item.files.key && !validation?.key) {
      const proceed = window.confirm(
        `Warning: Answer key file is missing for ${item.name}.\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    if (item.files.explanation && !validation?.explanation) {
      const proceed = window.confirm(
        `Warning: Explanation file is missing for ${item.name}.\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    try {
      setRunningExecution(itemId);

      // Update status to running
      const execRef = doc(db, 'books', book.id, 'executions', itemId);
      await setDoc(execRef, {
        status: 'running',
        startedAt: new Date(),
        config: config,
        error: null,
        reportPath: null
      });

      // Update local state
      setExecutions(prev => ({
        ...prev,
        [itemId]: {
          status: 'running',
          startedAt: new Date(),
          config: config
        }
      }));

      // TODO: Call Cloud Run endpoint (mock for now)
      await mockCloudRunExecution(itemId, item);

    } catch (error) {
      console.error('Error starting execution:', error);
      
      // Update status to failed
      const execRef = doc(db, 'books', book.id, 'executions', itemId);
      await updateDoc(execRef, {
        status: 'failed',
        error: error.message,
        completedAt: new Date()
      });

      setExecutions(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          status: 'failed',
          error: error.message
        }
      }));
    } finally {
      setRunningExecution(null);
    }
  };

  const mockCloudRunExecution = async (itemId, item) => {
    // Simulate Cloud Run execution (5 seconds)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Simulate success (90% success rate)
    const success = Math.random() > 0.1;

    const execRef = doc(db, 'books', book.id, 'executions', itemId);
    
    if (success) {
      const reportPath = `books/${book.id}/reports/${itemId}_report.json`;
      
      await updateDoc(execRef, {
        status: 'completed',
        completedAt: new Date(),
        reportPath: reportPath
      });

      setExecutions(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          status: 'completed',
          reportPath: reportPath
        }
      }));
    } else {
      throw new Error('Resource exhaustion - Cloud Run failed');
    }
  };

  const handleViewReport = (itemId) => {
    // TODO: Implement report viewing
    alert('Report viewing will be implemented after report JSON structure is finalized');
  };

  const handleDownloadReport = async (itemId) => {
    const execution = executions[itemId];
    if (!execution?.reportPath) return;

    // TODO: Download from Firebase Storage
    alert(`Download report from: ${execution.reportPath}\n\nDownload functionality will be implemented with actual Cloud Run integration`);
  };

  if (!isOwner) {
    return (
      <div className="execution-reports-tab">
        <div className="access-denied">
          <h2>🔒 Access Denied</h2>
          <p>Only the book owner can access execution and reports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="execution-reports-tab">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading execution data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="execution-reports-tab">
      <div className="tab-header">
        <h2>⚡ Execution & Reports</h2>
        <p>Configure settings and execute validation for each file pair</p>
      </div>

      {/* Configuration Section */}
      <div className="config-section">
        <h3>📋 Configuration</h3>
        <p className="config-subtitle">These settings apply to all executions</p>
        
        <div className="config-form">
          <div className="form-group">
            <label htmlFor="model">Model *</label>
            <select
              id="model"
              value={config.model}
              onChange={(e) => handleConfigChange('model', e.target.value)}
              className="form-select"
            >
              {GEMINI_MODELS.map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="grade">Grade *</label>
            <input
              id="grade"
              type="text"
              value={config.grade}
              onChange={(e) => handleConfigChange('grade', e.target.value)}
              placeholder="e.g., 8"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="board">Board *</label>
            <input
              id="board"
              type="text"
              value={config.board}
              onChange={(e) => handleConfigChange('board', e.target.value)}
              placeholder="e.g., CBSE"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <input
              id="subject"
              type="text"
              value={config.subject}
              onChange={(e) => handleConfigChange('subject', e.target.value)}
              placeholder="e.g., Science"
              className="form-input"
            />
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="btn-save-config"
          >
            {savingConfig ? 'Saving...' : '💾 Save Configuration'}
          </button>
        </div>
      </div>

      {/* Execution Items */}
      <div className="execution-items">
        <h3>📊 Execution Items</h3>
        
        <div className="execution-table-container">
          <table className="execution-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Files</th>
                <th>Status</th>
                <th>Last Execution</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {EXECUTION_ITEMS.map(item => {
                const execution = executions[item.id] || { status: 'not_started' };
                const validation = fileValidation[item.id] || {};
                const isRunning = runningExecution === item.id;
                const canExecute = !runningExecution && execution.status !== 'running';

                return (
                  <ExecutionRow
                    key={item.id}
                    item={item}
                    execution={execution}
                    validation={validation}
                    isRunning={isRunning}
                    canExecute={canExecute}
                    onStart={() => handleStartExecution(item.id)}
                    onViewReport={() => handleViewReport(item.id)}
                    onDownloadReport={() => handleDownloadReport(item.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Execution Row Component
const ExecutionRow = ({ 
  item, 
  execution, 
  validation, 
  isRunning, 
  canExecute,
  onStart,
  onViewReport,
  onDownloadReport
}) => {
  const getStatusIcon = () => {
    switch (execution.status) {
      case 'not_started': return '⚪';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    switch (execution.status) {
      case 'not_started': return 'Not Started';
      case 'running': return 'Running...';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const getStatusClass = () => {
    return `status-${execution.status || 'not_started'}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  };

  return (
    <tr className={`execution-row ${getStatusClass()}`}>
      {/* Item Name */}
      <td className="item-name">
        <div className="item-name-wrapper">
          <strong>{item.name}</strong>
          {execution.error && (
            <div className="error-tooltip" title={execution.error}>
              ⚠️ {execution.error}
            </div>
          )}
        </div>
      </td>

      {/* File Validation */}
      <td className="file-validation">
        <div className="file-badges">
          <span className={`file-badge ${validation.question ? 'valid' : 'invalid'}`} title="Question File">
            {validation.question ? '✓' : '✗'} Q
          </span>
          
          {item.files.key && (
            <span className={`file-badge ${validation.key ? 'valid' : 'warning'}`} title="Answer Key File">
              {validation.key ? '✓' : '⚠'} K
            </span>
          )}
          
          {item.files.explanation && (
            <span className={`file-badge ${validation.explanation ? 'valid' : 'warning'}`} title="Explanation File">
              {validation.explanation ? '✓' : '⚠'} E
            </span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="status-cell">
        <span className={`status-badge ${getStatusClass()}`}>
          {getStatusIcon()} {getStatusText()}
        </span>
      </td>

      {/* Last Execution */}
      <td className="execution-time">
        {execution.completedAt ? (
          <span className="timestamp">{formatDate(execution.completedAt)}</span>
        ) : execution.startedAt ? (
          <span className="timestamp">Started: {formatDate(execution.startedAt)}</span>
        ) : (
          <span className="no-execution">-</span>
        )}
      </td>

      {/* Actions */}
      <td className="actions-cell">
        <div className="action-buttons">
          <button
            onClick={onStart}
            disabled={!canExecute || isRunning}
            className="btn-action btn-execute"
            title={isRunning ? 'Running...' : execution.status === 'failed' ? 'Retry Execution' : 'Start Execution'}
          >
            {isRunning ? (
              <span className="spinner small"></span>
            ) : execution.status === 'failed' ? (
              '🔄'
            ) : (
              '▶'
            )}
          </button>

          <button
            onClick={onViewReport}
            disabled={execution.status !== 'completed'}
            className="btn-action btn-view"
            title="View Report"
          >
            📊
          </button>

          <button
            onClick={onDownloadReport}
            disabled={execution.status !== 'completed'}
            className="btn-action btn-download"
            title="Download Report"
          >
            ⬇
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ExecutionReportsTab;

