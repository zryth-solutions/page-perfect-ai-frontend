# Project Structure & Implementation Plan

## Current Project Structure

```
page-perfect-ai-frontend/
├── public/
├── src/
│   ├── components/          # Existing components
│   │   ├── AdminPanel.js
│   │   ├── Analytics.js
│   │   ├── BookReport.js
│   │   ├── Dashboard.js
│   │   ├── Login.js
│   │   ├── MyBooks.js
│   │   ├── MyProjects.js
│   │   ├── ProjectBooks.js
│   │   ├── ProjectSettings.js
│   │   └── ...
│   ├── hooks/
│   │   ├── useMarkdownSync.js
│   │   └── useUserRole.js
│   ├── firebase.js
│   ├── App.js
│   └── index.js
├── SPLIT/                   # Python splitting scripts (reference only)
│   ├── split_content.py
│   └── patterns_config.py
├── package.json
├── firebase.json
└── firestore.rules
```

---

## New Project Structure (After Implementation)

```
page-perfect-ai-frontend/
├── functions/                          # NEW: Firebase Cloud Functions (Python)
│   ├── main.py                        # Main Cloud Functions entry point
│   ├── requirements.txt               # Python dependencies
│   ├── .env                           # Environment variables (gitignored)
│   ├── .env.example                   # Example environment variables
│   ├── extraction/                    # Extraction module
│   │   ├── __init__.py
│   │   ├── mineru_client.py          # MinerU API client
│   │   └── pdf_processor.py          # PDF processing logic
│   ├── splitting/                     # Splitting module
│   │   ├── __init__.py
│   │   ├── patterns_config.py        # Ported from SPLIT/
│   │   ├── split_content.py          # Ported from SPLIT/
│   │   └── content_extractor.py      # Content extraction logic
│   └── utils/                         # Utility functions
│       ├── __init__.py
│       ├── storage_helper.py         # Firebase Storage helpers
│       └── firestore_helper.py       # Firestore helpers
│
├── src/
│   ├── components/
│   │   ├── BookEditor/               # NEW: Book Editor components
│   │   │   ├── BookEditor.js         # Main editor container
│   │   │   ├── BookEditor.css
│   │   │   ├── ExtractionPanel.js    # Step 1: Extraction UI
│   │   │   ├── ExtractionPanel.css
│   │   │   ├── SplittingPanel.js     # Step 2: Splitting status
│   │   │   ├── SplittingPanel.css
│   │   │   ├── EditorPanel.js        # Step 3: Main editor
│   │   │   ├── EditorPanel.css
│   │   │   ├── FileExplorer.js       # File tree sidebar
│   │   │   ├── FileExplorer.css
│   │   │   ├── MarkdownEditor.js     # Markdown editor
│   │   │   ├── MarkdownEditor.css
│   │   │   ├── PDFViewer.js          # PDF viewer panel
│   │   │   ├── PDFViewer.css
│   │   │   ├── ImageGallery.js       # Image preview modal
│   │   │   ├── ImageGallery.css
│   │   │   └── index.js              # Export all components
│   │   │
│   │   ├── ProjectBooks.js           # UPDATED: Add "Open Editor" button
│   │   └── ... (existing components)
│   │
│   ├── hooks/
│   │   ├── useBookEditor.js          # NEW: Book editor state management
│   │   ├── useFileOperations.js      # NEW: File CRUD operations
│   │   ├── useBookLock.js            # NEW: Lock management
│   │   └── ... (existing hooks)
│   │
│   ├── services/                     # NEW: Service layer
│   │   ├── cloudFunctions.js         # Cloud Functions API calls
│   │   ├── extractionService.js      # Extraction service
│   │   ├── splittingService.js       # Splitting service
│   │   └── storageService.js         # Storage operations
│   │
│   ├── utils/                        # NEW: Utility functions
│   │   ├── fileHelpers.js            # File manipulation helpers
│   │   └── markdownHelpers.js        # Markdown processing helpers
│   │
│   ├── firebase.js                   # UPDATED: Add Cloud Functions
│   ├── App.js                        # UPDATED: Add new routes
│   └── ... (existing files)
│
├── SPLIT/                            # Keep for reference
│   ├── split_content.py
│   └── patterns_config.py
│
├── .env                              # UPDATED: Add MinerU config
├── .env.example                      # UPDATED: Add MinerU config
├── package.json                      # UPDATED: Add new dependencies
├── firebase.json                     # UPDATED: Add functions config
├── BOOK_EDITOR_WORKFLOW.md           # Workflow documentation
├── PROJECT_STRUCTURE.md              # This file
└── ... (existing files)
```

---

## Implementation Plan - Step by Step

### Phase 1: Setup & Dependencies (Steps 1-4)

#### Step 1: Update package.json with new dependencies
```json
{
  "dependencies": {
    // Existing dependencies...
    "@uiw/react-md-editor": "^4.0.0",           // Markdown editor
    "react-pdf": "^7.7.0",                      // PDF viewer
    "prismjs": "^1.29.0",                       // Syntax highlighting
    "firebase-functions": "^4.5.0"              // Cloud Functions SDK
  }
}
```

#### Step 2: Create functions/ directory structure
```
functions/
├── main.py
├── requirements.txt
├── .env.example
├── extraction/
│   ├── __init__.py
│   ├── mineru_client.py
│   └── pdf_processor.py
├── splitting/
│   ├── __init__.py
│   ├── patterns_config.py
│   └── split_content.py
└── utils/
    ├── __init__.py
    ├── storage_helper.py
    └── firestore_helper.py
```

#### Step 3: Create src/services/ directory
```
src/services/
├── cloudFunctions.js
├── extractionService.js
├── splittingService.js
└── storageService.js
```

#### Step 4: Create src/components/BookEditor/ directory
```
src/components/BookEditor/
├── BookEditor.js
├── BookEditor.css
├── ExtractionPanel.js
├── ExtractionPanel.css
├── SplittingPanel.js
├── SplittingPanel.css
├── EditorPanel.js
├── EditorPanel.css
├── FileExplorer.js
├── FileExplorer.css
├── MarkdownEditor.js
├── MarkdownEditor.css
├── PDFViewer.js
├── PDFViewer.css
├── ImageGallery.js
├── ImageGallery.css
└── index.js
```

---

### Phase 2: Backend - Cloud Functions (Steps 5-10)

#### Step 5: Setup Firebase Functions
- Initialize functions directory
- Create requirements.txt
- Create .env.example

#### Step 6: Port Python splitting logic
- Copy patterns_config.py to functions/splitting/
- Copy split_content.py to functions/splitting/
- Adapt for Cloud Functions environment

#### Step 7: Create MinerU API client
- Implement mineru_client.py
- Handle API authentication
- Implement extraction logic

#### Step 8: Create Cloud Functions
- extractPDF function
- splitContent function
- updateSplitFile function
- deleteImage function
- lockBook/unlockBook functions

#### Step 9: Create utility helpers
- storage_helper.py (Firebase Storage operations)
- firestore_helper.py (Firestore operations)

#### Step 10: Test and deploy Cloud Functions
- Local testing
- Deploy to Firebase

---

### Phase 3: Frontend - Services Layer (Steps 11-14)

#### Step 11: Create cloudFunctions.js
- Wrapper for calling Cloud Functions
- Error handling
- Loading states

#### Step 12: Create extractionService.js
- Start extraction
- Poll extraction status
- Handle extraction results

#### Step 13: Create splittingService.js
- Trigger splitting
- Poll splitting status
- Fetch split files

#### Step 14: Create storageService.js
- Upload/download files
- Generate signed URLs
- Delete files

---

### Phase 4: Frontend - Custom Hooks (Steps 15-17)

#### Step 15: Create useBookEditor.js
- Manage editor state
- Handle file selection
- Track modifications

#### Step 16: Create useFileOperations.js
- Load file content
- Save file changes
- Create/delete files

#### Step 17: Create useBookLock.js
- Acquire lock
- Release lock
- Check lock status

---

### Phase 5: Frontend - UI Components (Steps 18-25)

#### Step 18: Create BookEditor.js (main container)
- Route setup
- State management
- Tab navigation

#### Step 19: Create ExtractionPanel.js
- Start extraction button
- Progress indicator
- Status display

#### Step 20: Create SplittingPanel.js
- Auto-trigger after extraction
- Progress indicator
- File list preview

#### Step 21: Create FileExplorer.js
- File tree display
- Folder collapse/expand
- File selection

#### Step 22: Create MarkdownEditor.js
- Raw markdown editing
- Syntax highlighting
- Auto-save

#### Step 23: Create PDFViewer.js
- PDF display
- Zoom controls
- Page navigation

#### Step 24: Create ImageGallery.js
- Image preview modal
- Delete functionality
- Image metadata

#### Step 25: Create EditorPanel.js
- Three-panel layout
- Responsive design
- Save/cancel buttons

---

### Phase 6: Integration (Steps 26-30)

#### Step 26: Update firebase.js
- Add Cloud Functions initialization
- Export functions instance

#### Step 27: Update App.js
- Add BookEditor route
- Add route protection

#### Step 28: Update ProjectBooks.js
- Add "Open Editor" button
- Link to editor route

#### Step 29: Update .env files
- Add MinerU API configuration
- Add Cloud Functions URL

#### Step 30: Update firebase.json
- Add functions configuration
- Set runtime to Python 3.11

---

### Phase 7: Testing & Refinement (Steps 31-35)

#### Step 31: Test extraction flow
- Upload test PDF
- Verify MinerU API call
- Check extracted files

#### Step 32: Test splitting flow
- Verify 19 files created
- Check content accuracy
- Validate file structure

#### Step 33: Test editor functionality
- Load/edit/save files
- Create new files
- Delete files

#### Step 34: Test image management
- Preview images
- Delete images
- Verify markdown updates

#### Step 35: Test lock mechanism
- Acquire/release locks
- Multi-user scenarios
- Auto-release timeout

---

## File Dependencies Map

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  App.js  →  BookEditor.js  →  ExtractionPanel.js           │
│                            →  SplittingPanel.js             │
│                            →  EditorPanel.js                │
│                                  ↓                           │
│                            FileExplorer.js                   │
│                            MarkdownEditor.js                 │
│                            PDFViewer.js                      │
│                            ImageGallery.js                   │
│                                  ↓                           │
│                            useBookEditor.js                  │
│                            useFileOperations.js              │
│                            useBookLock.js                    │
│                                  ↓                           │
│                            cloudFunctions.js                 │
│                            extractionService.js              │
│                            splittingService.js               │
│                            storageService.js                 │
│                                  ↓                           │
└──────────────────────────────────┼───────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────┐
│              Firebase Cloud Functions (Python)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  main.py  →  extractPDF()  →  mineru_client.py             │
│           →  splitContent()  →  split_content.py            │
│           →  updateSplitFile()  →  patterns_config.py       │
│           →  deleteImage()                                   │
│           →  lockBook()                                      │
│           →  unlockBook()                                    │
│                    ↓                                         │
│              storage_helper.py                               │
│              firestore_helper.py                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Files to Create (In Order)

### Backend (Cloud Functions)
1. `functions/requirements.txt`
2. `functions/.env.example`
3. `functions/utils/__init__.py`
4. `functions/utils/storage_helper.py`
5. `functions/utils/firestore_helper.py`
6. `functions/splitting/__init__.py`
7. `functions/splitting/patterns_config.py`
8. `functions/splitting/split_content.py`
9. `functions/extraction/__init__.py`
10. `functions/extraction/mineru_client.py`
11. `functions/extraction/pdf_processor.py`
12. `functions/main.py`

### Frontend (Services)
13. `src/services/cloudFunctions.js`
14. `src/services/storageService.js`
15. `src/services/extractionService.js`
16. `src/services/splittingService.js`

### Frontend (Hooks)
17. `src/hooks/useBookEditor.js`
18. `src/hooks/useFileOperations.js`
19. `src/hooks/useBookLock.js`

### Frontend (Components)
20. `src/components/BookEditor/BookEditor.js`
21. `src/components/BookEditor/ExtractionPanel.js`
22. `src/components/BookEditor/SplittingPanel.js`
23. `src/components/BookEditor/FileExplorer.js`
24. `src/components/BookEditor/MarkdownEditor.js`
25. `src/components/BookEditor/PDFViewer.js`
26. `src/components/BookEditor/ImageGallery.js`
27. `src/components/BookEditor/EditorPanel.js`
28. `src/components/BookEditor/index.js`

### Frontend (CSS)
29-36. All corresponding CSS files

### Updates
37. `src/firebase.js` (add Cloud Functions)
38. `src/App.js` (add routes)
39. `src/components/ProjectBooks.js` (add editor button)
40. `package.json` (add dependencies)
41. `firebase.json` (add functions config)
42. `.env.example` (add MinerU config)

---

## Execution Order

### Round 1: Setup (Now)
- ✅ Create PROJECT_STRUCTURE.md (this file)
- ⏳ Install dependencies
- ⏳ Create directory structure

### Round 2: Backend Foundation
- Create utility helpers
- Port Python splitting logic
- Create MinerU client

### Round 3: Backend Functions
- Implement extractPDF
- Implement splitContent
- Implement file operations
- Implement lock functions

### Round 4: Frontend Services
- Create service layer
- Implement API wrappers
- Add error handling

### Round 5: Frontend Hooks
- Create custom hooks
- Implement state management
- Add side effects

### Round 6: Frontend Components (Part 1)
- Create main container
- Create extraction panel
- Create splitting panel

### Round 7: Frontend Components (Part 2)
- Create file explorer
- Create markdown editor
- Create PDF viewer
- Create image gallery

### Round 8: Frontend Components (Part 3)
- Create editor panel
- Integrate all components
- Add styling

### Round 9: Integration
- Update existing components
- Add routes
- Connect services

### Round 10: Testing & Polish
- Test all flows
- Fix bugs
- Optimize performance

---

## Next Steps

1. **Install Dependencies** (Step 1)
   ```bash
   npm install @uiw/react-md-editor react-pdf prismjs
   ```

2. **Create Directory Structure** (Steps 2-4)
   - Create functions/ directory
   - Create src/services/ directory
   - Create src/components/BookEditor/ directory

3. **Start Backend Implementation** (Steps 5-10)
   - Setup Cloud Functions
   - Port Python code
   - Implement MinerU integration

---

## Progress Tracking

- [ ] Phase 1: Setup & Dependencies (Steps 1-4)
- [ ] Phase 2: Backend - Cloud Functions (Steps 5-10)
- [ ] Phase 3: Frontend - Services Layer (Steps 11-14)
- [ ] Phase 4: Frontend - Custom Hooks (Steps 15-17)
- [ ] Phase 5: Frontend - UI Components (Steps 18-25)
- [ ] Phase 6: Integration (Steps 26-30)
- [ ] Phase 7: Testing & Refinement (Steps 31-35)

---

**Status:** Ready to begin implementation 🚀  
**Next Action:** Install dependencies and create directory structure

