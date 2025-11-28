/**
 * PatternEditor Component
 * Allows users to view and edit pattern configurations for content splitting
 * Shows full.md content for easy pattern copying
 */

import React, { useState, useEffect } from 'react';
import { storage } from '../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import './PatternEditor.css';

const PatternEditor = ({ bookId, onPatternsSubmit, onCancel }) => {
  const [fullMdContent, setFullMdContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(true);
  const [headings, setHeadings] = useState([]);
  const [patterns, setPatterns] = useState({
    // QUESTIONS SECTION
    competencyStart: '# Competency-Focused Questions',
    competencyEnd: '# LEVEL1',
    
    level1Start: '# LEVEL1',
    level1End: '# LEVEL',
    
    level2Start: '# LEVEL',
    level2End: "# ACHIEVERS' SECTION",
    
    achieversStart: "# ACHIEVERS' SECTION",
    achieversEnd: '# Answer-Key',
    
    // ANSWER KEYS SECTION
    answerKeySectionStart: '# Answer-Key',
    
    answerKeyCompetencyStart: '# NCERT COMPETENCY BASED QUESTIONS',
    answerKeyCompetencyEnd: '# LEVEL1',
    
    answerKeyLevel1Start: '# LEVEL1',
    answerKeyLevel1End: '# LEVEL2',
    
    answerKeyLevel2Start: '# LEVEL2',
    answerKeyLevel2End: "# ACHIEVERS' SECTION",
    
    answerKeyAchieversStart: "# ACHIEVERS' SECTION",
    answerKeyAchieversEnd: '# Answers with Explanations',
    
    // EXPLANATIONS SECTION
    explanationSectionStart: '# Answers with Explanations',
    
    explanationCompetencyStart: '# NCERT COMPETENCY BASED QUESTIONS',
    explanationCompetencyEnd: '# LEVEL1',
    
    explanationLevel1Start: '# LEVEL1',
    explanationLevel1End: '# LEVEL2',
    
    explanationLevel2Start: '# LEVEL2',
    explanationLevel2End: "# ACHIEVERS SECTION",
    
    explanationAchieversStart: "# ACHIEVERS SECTION",
    explanationAchieversEnd: '' // End of file
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedHeading, setSelectedHeading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detectingPatterns, setDetectingPatterns] = useState(false);
  const [detectionError, setDetectionError] = useState(null);

  // Load full.md on mount
  useEffect(() => {
    loadFullMd();
  }, [bookId]);

  const loadFullMd = async () => {
    if (!bookId) {
      setLoadingContent(false);
      return;
    }

    try {
      setLoadingContent(true);
      const fullMdPath = `books/${bookId}/extracted/full.md`;
      const storageRef = ref(storage, fullMdPath);
      const downloadUrl = await getDownloadURL(storageRef);

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to load full.md');
      }

      const text = await response.text();
      setFullMdContent(text);

      // Extract all headings
      const headingMatches = text.match(/^#+\s+.+$/gm) || [];
      const uniqueHeadings = [...new Set(headingMatches)].sort();
      setHeadings(uniqueHeadings);
    } catch (err) {
      console.error('Error loading full.md:', err);
      setFullMdContent('Error loading full.md');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleChange = (key, value) => {
    setPatterns(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = () => {
    // Helper function to safely split patterns
    const safeSplit = (value) => {
      if (!value || value === '') return [];
      return value.split('|').filter(p => p && p.trim() !== '');
    };

    // Convert patterns to the format expected by backend
    const formattedPatterns = {
      // Questions section patterns
      questions: {
        competency: {
          start: safeSplit(patterns.competencyStart),
          end: safeSplit(patterns.competencyEnd)
        },
        level1: {
          start: safeSplit(patterns.level1Start),
          end: safeSplit(patterns.level1End)
        },
        level2: {
          start: safeSplit(patterns.level2Start),
          end: safeSplit(patterns.level2End)
        },
        achievers: {
          start: safeSplit(patterns.achieversStart),
          end: safeSplit(patterns.achieversEnd)
        }
      },
      
      // Answer keys section patterns
      answerKeys: {
        sectionStart: safeSplit(patterns.answerKeySectionStart),
        competency: {
          start: safeSplit(patterns.answerKeyCompetencyStart),
          end: safeSplit(patterns.answerKeyCompetencyEnd)
        },
        level1: {
          start: safeSplit(patterns.answerKeyLevel1Start),
          end: safeSplit(patterns.answerKeyLevel1End)
        },
        level2: {
          start: safeSplit(patterns.answerKeyLevel2Start),
          end: safeSplit(patterns.answerKeyLevel2End)
        },
        achievers: {
          start: safeSplit(patterns.answerKeyAchieversStart),
          end: safeSplit(patterns.answerKeyAchieversEnd)
        }
      },
      
      // Explanations section patterns
      explanations: {
        sectionStart: safeSplit(patterns.explanationSectionStart),
        competency: {
          start: safeSplit(patterns.explanationCompetencyStart),
          end: safeSplit(patterns.explanationCompetencyEnd)
        },
        level1: {
          start: safeSplit(patterns.explanationLevel1Start),
          end: safeSplit(patterns.explanationLevel1End)
        },
        level2: {
          start: safeSplit(patterns.explanationLevel2Start),
          end: safeSplit(patterns.explanationLevel2End)
        },
        achievers: {
          start: safeSplit(patterns.explanationAchieversStart),
          end: safeSplit(patterns.explanationAchieversEnd)
        }
      }
    };

    onPatternsSubmit(formattedPatterns);
  };

  const handleReset = () => {
    setPatterns({
      // QUESTIONS SECTION
      competencyStart: '# Competency-Focused Questions',
      competencyEnd: '# LEVEL1',
      level1Start: '# LEVEL1',
      level1End: '# LEVEL',
      level2Start: '# LEVEL',
      level2End: "# ACHIEVERS' SECTION",
      achieversStart: "# ACHIEVERS' SECTION",
      achieversEnd: '# Answer-Key',
      
      // ANSWER KEYS SECTION
      answerKeySectionStart: '# Answer-Key',
      answerKeyCompetencyStart: '# NCERT COMPETENCY BASED QUESTIONS',
      answerKeyCompetencyEnd: '# LEVEL1',
      answerKeyLevel1Start: '# LEVEL1',
      answerKeyLevel1End: '# LEVEL2',
      answerKeyLevel2Start: '# LEVEL2',
      answerKeyLevel2End: "# ACHIEVERS' SECTION",
      answerKeyAchieversStart: "# ACHIEVERS' SECTION",
      answerKeyAchieversEnd: '# Answers with Explanations',
      
      // EXPLANATIONS SECTION
      explanationSectionStart: '# Answers with Explanations',
      explanationCompetencyStart: '# NCERT COMPETENCY BASED QUESTIONS',
      explanationCompetencyEnd: '# LEVEL1',
      explanationLevel1Start: '# LEVEL1',
      explanationLevel1End: '# LEVEL2',
      explanationLevel2Start: '# LEVEL2',
      explanationLevel2End: "# ACHIEVERS SECTION",
      explanationAchieversStart: "# ACHIEVERS SECTION",
      explanationAchieversEnd: ''
    });
  };

  const handleTextSelect = () => {
    const selection = window.getSelection().toString();
    if (selection) {
      setSelectedHeading(selection);
      navigator.clipboard.writeText(selection);
    }
  };

  const handleAIDetection = async () => {
    if (!bookId) return;

    setDetectingPatterns(true);
    setDetectionError(null);

    try {
      // Import the cloud function
      const { detectPatternsAI } = await import('../../services/cloudFunctions');
      
      // Call AI detection
      const result = await detectPatternsAI(bookId);

      if (result.success && result.patterns) {
        // Convert AI patterns to UI format
        const aiPatterns = result.patterns;
        
        setPatterns({
          // Questions
          competencyStart: aiPatterns.questions?.competency?.start?.[0] || patterns.competencyStart || '',
          competencyEnd: aiPatterns.questions?.competency?.end?.[0] || patterns.competencyEnd || '',
          level1Start: aiPatterns.questions?.level1?.start?.[0] || patterns.level1Start || '',
          level1End: aiPatterns.questions?.level1?.end?.[0] || patterns.level1End || '',
          level2Start: aiPatterns.questions?.level2?.start?.[0] || patterns.level2Start || '',
          level2End: aiPatterns.questions?.level2?.end?.[0] || patterns.level2End || '',
          achieversStart: aiPatterns.questions?.achievers?.start?.[0] || patterns.achieversStart || '',
          achieversEnd: aiPatterns.questions?.achievers?.end?.[0] || patterns.achieversEnd || '',
          
          // Answer Keys
          answerKeySectionStart: aiPatterns.answerKeys?.sectionStart?.[0] || patterns.answerKeySectionStart || '',
          answerKeyCompetencyStart: aiPatterns.answerKeys?.competency?.start?.[0] || patterns.answerKeyCompetencyStart || '',
          answerKeyCompetencyEnd: aiPatterns.answerKeys?.competency?.end?.[0] || patterns.answerKeyCompetencyEnd || '',
          answerKeyLevel1Start: aiPatterns.answerKeys?.level1?.start?.[0] || patterns.answerKeyLevel1Start || '',
          answerKeyLevel1End: aiPatterns.answerKeys?.level1?.end?.[0] || patterns.answerKeyLevel1End || '',
          answerKeyLevel2Start: aiPatterns.answerKeys?.level2?.start?.[0] || patterns.answerKeyLevel2Start || '',
          answerKeyLevel2End: aiPatterns.answerKeys?.level2?.end?.[0] || patterns.answerKeyLevel2End || '',
          answerKeyAchieversStart: aiPatterns.answerKeys?.achievers?.start?.[0] || patterns.answerKeyAchieversStart || '',
          answerKeyAchieversEnd: aiPatterns.answerKeys?.achievers?.end?.[0] || patterns.answerKeyAchieversEnd || '',
          
          // Explanations
          explanationSectionStart: aiPatterns.explanations?.sectionStart?.[0] || patterns.explanationSectionStart || '',
          explanationCompetencyStart: aiPatterns.explanations?.competency?.start?.[0] || patterns.explanationCompetencyStart || '',
          explanationCompetencyEnd: aiPatterns.explanations?.competency?.end?.[0] || patterns.explanationCompetencyEnd || '',
          explanationLevel1Start: aiPatterns.explanations?.level1?.start?.[0] || patterns.explanationLevel1Start || '',
          explanationLevel1End: aiPatterns.explanations?.level1?.end?.[0] || patterns.explanationLevel1End || '',
          explanationLevel2Start: aiPatterns.explanations?.level2?.start?.[0] || patterns.explanationLevel2Start || '',
          explanationLevel2End: aiPatterns.explanations?.level2?.end?.[0] || patterns.explanationLevel2End || '',
          explanationAchieversStart: aiPatterns.explanations?.achievers?.start?.[0] || patterns.explanationAchieversStart || '',
          explanationAchieversEnd: aiPatterns.explanations?.achievers?.end?.[0] || patterns.explanationAchieversEnd || '',
        });

        alert(`✅ AI detected patterns with ${result.confidence} confidence!\n\n${result.notes || 'Patterns have been populated in the fields below.'}`);
      } else {
        setDetectionError(result.error || 'AI detection failed');
        alert(`❌ AI detection failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error in AI detection:', error);
      setDetectionError(error.message);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setDetectingPatterns(false);
    }
  };

  return (
    <div className="pattern-editor-modal">
      <div className="pattern-editor-content">
        <div className="pattern-editor-header">
          <div className="header-title-section">
            <h3>🎯 Configure Splitting Patterns</h3>
            <button
              className={`btn-ai ${detectingPatterns ? 'loading' : ''}`}
              onClick={handleAIDetection}
              disabled={detectingPatterns}
            >
              {detectingPatterns ? (
                <>
                  <span className="spinner-small"></span>
                  Analyzing with AI...
                </>
              ) : (
                <>
                  🤖 Auto-Detect with AI
                </>
              )}
            </button>
          </div>
          <p>Use AI to auto-detect patterns, or manually configure by selecting text from your PDF</p>
          {detectionError && (
            <div className="detection-error">
              ⚠️ {detectionError}
            </div>
          )}
        </div>

        <div className="pattern-editor-layout">
          {/* Left: Full.md Content */}
          <div className="pdf-content-panel">
            <div className="panel-header-section">
              <h4>📄 Your PDF Content (full.md)</h4>
              <p className="header-hint">Select any text to copy it</p>
            </div>

            {loadingContent ? (
              <div className="loading-content">
                <div className="spinner"></div>
                <p>Loading full.md...</p>
              </div>
            ) : fullMdContent ? (
              <div 
                className="content-viewer"
                onMouseUp={handleTextSelect}
              >
                <pre className="markdown-content">
                  <code>{fullMdContent}</code>
                </pre>
              </div>
            ) : (
              <div className="no-content">
                <p>Could not load full.md</p>
              </div>
            )}

            {selectedHeading && (
              <div className="copied-notification">
                ✓ Copied: {selectedHeading.length > 50 ? selectedHeading.substring(0, 50) + '...' : selectedHeading}
              </div>
            )}
          </div>

          {/* Right: Pattern Configuration */}
          <div className="pattern-editor-body">
          {/* Section Markers */}
          <div className="pattern-section">
            <h4>📋 Section Markers</h4>
            <p className="section-hint">Specify where each section starts and ends. Use | for multiple variations.</p>
            
            <div className="info-box">
              <strong>💡 Theory Section:</strong> Automatically extracted from start of file until Competency Start
            </div>

            {/* Competency Section */}
            <div className="section-marker-group">
              <h5>1️⃣ Competency Section</h5>
              <div className="pattern-group">
                <label>Start Marker</label>
                <input
                  type="text"
                  value={patterns.competencyStart}
                  onChange={(e) => handleChange('competencyStart', e.target.value)}
                  placeholder="# NCERT COMPETENCY BASED QUESTIONS"
                />
              </div>
              <div className="pattern-group">
                <label>End Marker</label>
                <input
                  type="text"
                  value={patterns.competencyEnd}
                  onChange={(e) => handleChange('competencyEnd', e.target.value)}
                  placeholder="# LEVEL 1"
                />
                <span className="pattern-hint">Where does Competency section end? (Usually Level 1 start)</span>
              </div>
            </div>

            {/* Level 1 Section */}
            <div className="section-marker-group">
              <h5>2️⃣ Level 1 Section</h5>
              <div className="pattern-group">
                <label>Start Marker</label>
                <input
                  type="text"
                  value={patterns.level1Start}
                  onChange={(e) => handleChange('level1Start', e.target.value)}
                  placeholder="# LEVEL 1"
                />
              </div>
              <div className="pattern-group">
                <label>End Marker</label>
                <input
                  type="text"
                  value={patterns.level1End}
                  onChange={(e) => handleChange('level1End', e.target.value)}
                  placeholder="# LEVEL 2"
                />
              </div>
            </div>

            {/* Level 2 Section */}
            <div className="section-marker-group">
              <h5>3️⃣ Level 2 Section</h5>
              <div className="pattern-group">
                <label>Start Marker</label>
                <input
                  type="text"
                  value={patterns.level2Start}
                  onChange={(e) => handleChange('level2Start', e.target.value)}
                  placeholder="# LEVEL 2"
                />
              </div>
              <div className="pattern-group">
                <label>End Marker</label>
                <input
                  type="text"
                  value={patterns.level2End}
                  onChange={(e) => handleChange('level2End', e.target.value)}
                  placeholder="# ACHIEVERS SECTION"
                />
              </div>
            </div>

            {/* Achievers Section */}
            <div className="section-marker-group">
              <h5>4️⃣ Achievers Section</h5>
              <div className="pattern-group">
                <label>Start Marker</label>
                <input
                  type="text"
                  value={patterns.achieversStart}
                  onChange={(e) => handleChange('achieversStart', e.target.value)}
                  placeholder="# ACHIEVERS SECTION"
                />
              </div>
              <div className="pattern-group">
                <label>End Marker</label>
                <input
                  type="text"
                  value={patterns.achieversEnd}
                  onChange={(e) => handleChange('achieversEnd', e.target.value)}
                  placeholder="# Answer-Key"
                />
              </div>
            </div>
          </div>

          {/* Answer Keys Section */}
          <div className="pattern-section">
            <h4>🔑 Answer Keys Section</h4>
            <p className="section-hint">Configure where answer keys for each section are located</p>
            
            <div className="pattern-group">
              <label>Answer-Key Section Start</label>
              <input
                type="text"
                value={patterns.answerKeySectionStart}
                onChange={(e) => handleChange('answerKeySectionStart', e.target.value)}
                placeholder="# Answer-Key"
              />
              <span className="pattern-hint">Where does the answer key section begin?</span>
            </div>

            {/* Answer Key Sub-sections */}
            <div className="subsection-group">
              <h5>Answer Key Patterns (within Answer-Key section)</h5>
              
              <div className="mini-section">
                <label>Competency Answer Keys</label>
                <input
                  type="text"
                  value={patterns.answerKeyCompetencyStart}
                  onChange={(e) => handleChange('answerKeyCompetencyStart', e.target.value)}
                  placeholder="# NCERT COMPETENCY BASED QUESTIONS"
                />
              </div>

              <div className="mini-section">
                <label>Level 1 Answer Keys</label>
                <input
                  type="text"
                  value={patterns.answerKeyLevel1Start}
                  onChange={(e) => handleChange('answerKeyLevel1Start', e.target.value)}
                  placeholder="# LEVEL1"
                />
              </div>

              <div className="mini-section">
                <label>Level 2 Answer Keys</label>
                <input
                  type="text"
                  value={patterns.answerKeyLevel2Start}
                  onChange={(e) => handleChange('answerKeyLevel2Start', e.target.value)}
                  placeholder="# LEVEL2"
                />
              </div>

              <div className="mini-section">
                <label>Achievers Answer Keys</label>
                <input
                  type="text"
                  value={patterns.answerKeyAchieversStart}
                  onChange={(e) => handleChange('answerKeyAchieversStart', e.target.value)}
                  placeholder="# ACHIEVERS' SECTION"
                />
              </div>
            </div>
          </div>

          {/* Explanations Section */}
          <div className="pattern-section">
            <h4>💡 Explanations Section</h4>
            <p className="section-hint">Configure where answer explanations for each section are located</p>
            
            <div className="pattern-group">
              <label>Explanations Section Start</label>
              <input
                type="text"
                value={patterns.explanationSectionStart}
                onChange={(e) => handleChange('explanationSectionStart', e.target.value)}
                placeholder="# Answers with Explanations"
              />
              <span className="pattern-hint">Where do the answer explanations begin?</span>
            </div>

            {/* Explanation Sub-sections */}
            <div className="subsection-group">
              <h5>Explanation Patterns (within Explanations section)</h5>
              
              <div className="mini-section">
                <label>Competency Explanations</label>
                <input
                  type="text"
                  value={patterns.explanationCompetencyStart}
                  onChange={(e) => handleChange('explanationCompetencyStart', e.target.value)}
                  placeholder="# NCERT COMPETENCY BASED QUESTIONS"
                />
              </div>

              <div className="mini-section">
                <label>Level 1 Explanations</label>
                <input
                  type="text"
                  value={patterns.explanationLevel1Start}
                  onChange={(e) => handleChange('explanationLevel1Start', e.target.value)}
                  placeholder="# LEVEL1"
                />
              </div>

              <div className="mini-section">
                <label>Level 2 Explanations</label>
                <input
                  type="text"
                  value={patterns.explanationLevel2Start}
                  onChange={(e) => handleChange('explanationLevel2Start', e.target.value)}
                  placeholder="# LEVEL2"
                />
              </div>

              <div className="mini-section">
                <label>Achievers Explanations</label>
                <input
                  type="text"
                  value={patterns.explanationAchieversStart}
                  onChange={(e) => handleChange('explanationAchieversStart', e.target.value)}
                  placeholder="# ACHIEVERS SECTION"
                />
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="pattern-help">
            <h5>💡 How to Use:</h5>
            <ul>
              <li><strong>Step 1:</strong> Read through your PDF content on the left</li>
              <li><strong>Step 2:</strong> Select any text to copy it (e.g., "# LEVEL 1")</li>
              <li><strong>Step 3:</strong> Paste into the Start/End marker fields</li>
              <li><strong>Step 4:</strong> Add variations with | if needed (e.g., "# LEVEL 1|# Level-1")</li>
              <li><strong>Theory:</strong> Automatically extracted from start until Competency starts</li>
            </ul>
          </div>
        </div>
        </div>

        <div className="pattern-editor-footer">
          <button className="btn-secondary" onClick={handleReset}>
            Reset to Default
          </button>
          <div className="footer-actions">
            <button className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              Apply & Split Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternEditor;

