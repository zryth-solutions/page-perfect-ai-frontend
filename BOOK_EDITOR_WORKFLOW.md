# Book Editor Workflow Documentation

## Overview

This document describes the complete workflow for PDF extraction, splitting, and editing functionality in the Page Perfect AI system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [User Flow](#user-flow)
3. [MinerU API Integration](#mineru-api-integration)
4. [Data Structure](#data-structure)
5. [Storage Structure](#storage-structure)
6. [Cloud Functions](#cloud-functions)
7. [Frontend Components](#frontend-components)
8. [Implementation Steps](#implementation-steps)
9. [API Reference](#api-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ProjectBooks │→ │  BookEditor  │→ │ File Explorer│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         ↓                  ↓                  ↓                  │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Firestore   │  │   Storage    │  │   Functions  │          │
│  │  (Metadata)  │  │ (Files/PDFs) │  │   (Python)   │          │
│  └──────────────┘  └──────────────┘  └──────┬───────┘          │
└────────────────────────────────────────────────┼─────────────────┘
                                                 │
                                                 ↓
                                    ┌────────────────────────┐
                                    │   MinerU API v4        │
                                    │   (VLM Extraction)     │
                                    └────────────────────────┘
```

---

## User Flow

### Step 1: Project & Book Upload (Existing)
```
User → Create Project → Upload PDF Chapter → Book Listed
```

### Step 2: Book Processing (New)
```
User clicks on Book
    ↓
BookEditor Screen Opens
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Extraction                                           │
│   - Click "Start Extraction" button                         │
│   - System generates temporary public URL for PDF           │
│   - Cloud Function calls MinerU API v4                      │
│   - MinerU extracts:                                         │
│     * full.md (complete markdown content)                   │
│     * images/ (all extracted images)                        │
│   - Results stored in Firebase Storage                      │
│   - Status: not_started → processing → completed/failed     │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Splitting (Auto-triggered after extraction)         │
│   - Cloud Function reads extracted full.md                  │
│   - Applies splitting logic from patterns_config.py         │
│   - Creates structured files:                               │
│     * Question_output/ (7 files)                            │
│       - theory.md                                            │
│       - Competency_Focused_Questions.md                     │
│       - Multiple_Choice_Questions_Level_1.md                │
│       - Multiple_Choice_Questions_Level_1_Part_2.md         │
│       - Multiple_Choice_Questions_Level_2.md                │
│       - Multiple_Choice_Questions_Level_2_Part_2.md         │
│       - ACHIEVERS_SECTION.md                                │
│     * Answer_key/ (6 files)                                 │
│       - Competency_Focused_Questions_key.md                 │
│       - Multiple_Choice_Questions_Level_1_key.md            │
│       - Multiple_Choice_Questions_Level_1_Part_2_key.md     │
│       - Multiple_Choice_Questions_Level_2_key.md            │
│       - Multiple_Choice_Questions_Level_2_Part_2_key.md     │
│       - ACHIEVERS_SECTION_key.md                            │
│     * Answer_output/ (6 files)                              │
│       - Competency_Focused_Questions_ans.md                 │
│       - Multiple_Choice_Questions_Level_1_ans.md            │
│       - Multiple_Choice_Questions_Level_1_Part_2_ans.md     │
│       - Multiple_Choice_Questions_Level_2_ans.md            │
│       - Multiple_Choice_Questions_Level_2_Part_2_ans.md     │
│       - ACHIEVERS_SECTION_ans.md                            │
│   - Files saved to Firebase Storage                         │
│   - Metadata updated in Firestore                           │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Editor Interface (Enabled after splitting)          │
│                                                              │
│  ┌─────────────────┬──────────────────┬──────────────────┐ │
│  │  Left Panel     │  Center Panel    │   Right Panel    │ │
│  │  File Explorer  │  Markdown Editor │   PDF Viewer     │ │
│  ├─────────────────┼──────────────────┼──────────────────┤ │
│  │ 📁 Questions    │  # Theory        │   [PDF Page 1]   │ │
│  │   📄 theory.md  │                  │                  │ │
│  │   📄 Comp...    │  Content here... │   [PDF Page 2]   │ │
│  │   📄 Level1.md  │                  │                  │ │
│  │   📄 Level1...  │  ![image](...)   │   [PDF Page 3]   │ │
│  │ 📁 Answer Keys  │                  │                  │ │
│  │   📄 Comp_key   │  More content... │                  │ │
│  │ 📁 Explanations │                  │                  │ │
│  │   📄 Comp_ans   │                  │                  │ │
│  │                 │                  │                  │ │
│  │ [+ New File]    │  [Save] [Cancel] │   [Zoom] [Nav]   │ │
│  └─────────────────┴──────────────────┴──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Image Management                                     │
│   - Images displayed inline in markdown preview             │
│   - Click image → Preview modal opens                       │
│   - Delete button → Removes image from:                     │
│     * Firebase Storage                                       │
│     * Markdown content (removes ![...] reference)           │
│     * Updates file in Storage                               │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: File Operations                                      │
│   - Create new file → Add to file tree                      │
│   - Edit existing file → Update in real-time               │
│   - Delete file → Remove from Storage & Firestore          │
│   - Save All → Batch update all modified files              │
│   - Lock mechanism: One user editing at a time              │
└─────────────────────────────────────────────────────────────┘
```

---

## MinerU API Integration

### API Details

**Base URL:** `https://mineru.net/api/v4`

**Authentication Token:**
```
eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ.eyJqdGkiOiI3OTQwMDE4NCIsInJvbCI6IlJPTEVfUkVHSVNURVIiLCJpc3MiOiJPcGVuWExhYiIsImlhdCI6MTc2MzQ1MTc4MywiY2xpZW50SWQiOiJsa3pkeDU3bnZ5MjJqa3BxOXgydyIsInBob25lIjoiIiwib3BlbklkIjpudWxsLCJ1dWlkIjoiMjY4ZjkxZGEtNjE0Ny00Y2ZhLWI3NjAtNjJkYzdhZDBlN2I2IiwiZW1haWwiOiJtYW5hc0B6cnl0aC5jb20iLCJleHAiOjE3NjQ2NjEzODN9.20nRG36w20Ntxkn44bukRy3o6kV-CYJIt27HAeCF2mUSvwV_81p3dlJ20H971IV-QLhgC1pc19C-CRxkHvMXfw
```

**Documentation:** https://mineru.net/apiManage/docs

### Extraction Workflow

1. **Generate Temporary Public URL**
   ```javascript
   // Firebase Storage signed URL (valid for 1 hour)
   const signedUrl = await getDownloadURL(storageRef);
   ```

2. **Call MinerU API v4**
   ```python
   # Cloud Function
   import requests
   
   BASE_URL = "https://mineru.net/api/v4"
   TOKEN = "eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ..."
   
   headers = {
       "Authorization": f"Bearer {TOKEN}",
       "Content-Type": "application/json"
   }
   
   payload = {
       "pdf_url": pdf_public_url,
       "mode": "vlm",  # Vision Language Model
       "version": "2.5"
   }
   
   response = requests.post(
       f"{BASE_URL}/extract",
       headers=headers,
       json=payload
   )
   ```

3. **Process Response**
   - MinerU returns:
     - `full.md`: Complete markdown content
     - `images[]`: Array of extracted images
   - Store in Firebase Storage
   - Update Firestore metadata

---

## Data Structure

### Firestore: `books/{bookId}`

```javascript
{
  // Existing fields
  id: "book123",
  title: "Science Chapter 1",
  fileName: "science-ch1.pdf",
  fileUrl: "https://...",
  filePath: "books/project123/user456/...",
  projectId: "project123",
  userId: "user456",
  status: "pending",
  uploadedAt: "2024-01-15T10:00:00Z",
  
  // NEW: Extraction metadata
  extraction: {
    status: "not_started" | "processing" | "completed" | "failed",
    startedAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T10:35:00Z",
    error: null | "Error message",
    fullMdPath: "books/book123/extracted/full.md",
    imagesPath: "books/book123/extracted/images/",
    imageCount: 15,
    mineruJobId: "mineru_job_xyz123"  // For tracking
  },
  
  // NEW: Splitting metadata
  splitting: {
    status: "not_started" | "processing" | "completed" | "failed",
    startedAt: "2024-01-15T10:35:00Z",
    completedAt: "2024-01-15T10:36:00Z",
    error: null | "Error message",
    totalFiles: 19,
    files: [
      {
        name: "theory.md",
        path: "books/book123/splits/Question_output/theory.md",
        category: "question",
        size: 15420,
        createdAt: "2024-01-15T10:36:00Z"
      },
      {
        name: "Competency_Focused_Questions.md",
        path: "books/book123/splits/Question_output/Competency_Focused_Questions.md",
        category: "question",
        size: 8920,
        createdAt: "2024-01-15T10:36:00Z"
      },
      // ... more files
    ]
  },
  
  // NEW: Editing metadata
  editing: {
    lastModified: "2024-01-15T11:00:00Z",
    modifiedBy: "user456",
    modifiedFiles: ["theory.md", "Competency_Focused_Questions.md"],
    isLocked: true,
    lockedBy: "user456",
    lockedAt: "2024-01-15T10:50:00Z",
    lockExpiry: "2024-01-15T11:50:00Z"  // Auto-release after 1 hour
  }
}
```

---

## Storage Structure

### Firebase Storage Organization

```
storage/
└── books/
    └── {bookId}/
        ├── original.pdf                    # Original uploaded PDF
        │
        ├── extracted/                      # MinerU extraction results
        │   ├── full.md                     # Complete extracted markdown
        │   └── images/                     # Extracted images
        │       ├── image_001.png
        │       ├── image_002.png
        │       ├── image_003.jpg
        │       └── ...
        │
        └── splits/                         # Split content files
            ├── Question_output/
            │   ├── theory.md
            │   ├── Competency_Focused_Questions.md
            │   ├── Multiple_Choice_Questions_Level_1.md
            │   ├── Multiple_Choice_Questions_Level_1_Part_2.md
            │   ├── Multiple_Choice_Questions_Level_2.md
            │   ├── Multiple_Choice_Questions_Level_2_Part_2.md
            │   └── ACHIEVERS_SECTION.md
            │
            ├── Answer_key/
            │   ├── Competency_Focused_Questions_key.md
            │   ├── Multiple_Choice_Questions_Level_1_key.md
            │   ├── Multiple_Choice_Questions_Level_1_Part_2_key.md
            │   ├── Multiple_Choice_Questions_Level_2_key.md
            │   ├── Multiple_Choice_Questions_Level_2_Part_2_key.md
            │   └── ACHIEVERS_SECTION_key.md
            │
            └── Answer_output/
                ├── Competency_Focused_Questions_ans.md
                ├── Multiple_Choice_Questions_Level_1_ans.md
                ├── Multiple_Choice_Questions_Level_1_Part_2_ans.md
                ├── Multiple_Choice_Questions_Level_2_ans.md
                ├── Multiple_Choice_Questions_Level_2_Part_2_ans.md
                └── ACHIEVERS_SECTION_ans.md
```

---

## Cloud Functions

### Function 1: `extractPDF`

**Trigger:** HTTP Callable Function

**Input:**
```javascript
{
  bookId: "book123",
  pdfPath: "books/book123/original.pdf"
}
```

**Process:**
1. Validate book exists in Firestore
2. Generate temporary signed URL for PDF (1 hour expiry)
3. Update book status: `extraction.status = "processing"`
4. Call MinerU API v4 with VLM mode
5. Poll for completion (or use webhook if available)
6. Download extracted files:
   - `full.md`
   - `images/*`
7. Upload to Firebase Storage:
   - `books/{bookId}/extracted/full.md`
   - `books/{bookId}/extracted/images/*`
8. Update Firestore:
   - `extraction.status = "completed"`
   - `extraction.fullMdPath = "..."`
   - `extraction.imageCount = X`
9. Trigger `splitContent` function

**Output:**
```javascript
{
  success: true,
  bookId: "book123",
  extractionPath: "books/book123/extracted/",
  imageCount: 15,
  fullMdSize: 125000
}
```

**Error Handling:**
- MinerU API errors → Update `extraction.status = "failed"`, store error message
- Network errors → Retry up to 3 times
- Timeout (>10 minutes) → Mark as failed

---

### Function 2: `splitContent`

**Trigger:** HTTP Callable Function (auto-triggered after extraction)

**Input:**
```javascript
{
  bookId: "book123",
  fullMdPath: "books/book123/extracted/full.md"
}
```

**Process:**
1. Download `full.md` from Storage
2. Apply splitting logic (from `split_content.py`):
   - Use patterns from `patterns_config.py`
   - Extract sections:
     * Theory content
     * Competency Questions
     * Level 1 Questions (split into Part 1 & 2)
     * Level 2 Questions (split into Part 1 & 2)
     * Achievers Section
   - Extract Answer Keys (duplicate for split sections)
   - Extract Explanations (split for Level 1 & 2)
3. Upload split files to Storage:
   - `books/{bookId}/splits/Question_output/*`
   - `books/{bookId}/splits/Answer_key/*`
   - `books/{bookId}/splits/Answer_output/*`
4. Update Firestore:
   - `splitting.status = "completed"`
   - `splitting.files = [...]` (array of file metadata)
   - `splitting.totalFiles = 19`

**Output:**
```javascript
{
  success: true,
  bookId: "book123",
  totalFiles: 19,
  files: [
    { name: "theory.md", path: "...", category: "question", size: 15420 },
    // ... more files
  ]
}
```

**Splitting Rules (from patterns_config.py):**

- **Level 1 Questions:**
  - Split at Question 13
  - Part 1: Questions 1-12
  - Part 2: Questions 13-25

- **Level 2 Questions:**
  - Split at Question 11
  - Part 1: Questions 1-10
  - Part 2: Questions 11-20

- **Answer Keys:**
  - NOT split (duplicated to both parts)
  - Full answer key available for both Part 1 and Part 2

- **Explanations:**
  - Split at same question numbers as questions
  - Level 1: Split at explanation 13
  - Level 2: Split at explanation 11

---

### Function 3: `updateSplitFile`

**Trigger:** HTTP Callable Function

**Input:**
```javascript
{
  bookId: "book123",
  filePath: "books/book123/splits/Question_output/theory.md",
  content: "# Updated Theory Content\n\n...",
  userId: "user456"
}
```

**Process:**
1. Check lock status (ensure user has lock)
2. Upload updated content to Storage
3. Update Firestore metadata:
   - `editing.lastModified = now()`
   - `editing.modifiedBy = userId`
   - Add filename to `editing.modifiedFiles[]`

**Output:**
```javascript
{
  success: true,
  filePath: "books/book123/splits/Question_output/theory.md",
  updatedAt: "2024-01-15T11:00:00Z"
}
```

---

### Function 4: `deleteImage`

**Trigger:** HTTP Callable Function

**Input:**
```javascript
{
  bookId: "book123",
  imagePath: "books/book123/extracted/images/image_005.png",
  affectedFiles: ["theory.md", "Competency_Focused_Questions.md"]
}
```

**Process:**
1. Delete image from Storage
2. For each affected file:
   - Download file content
   - Remove image markdown reference: `![...](image_005.png)`
   - Upload updated content
3. Update Firestore metadata

**Output:**
```javascript
{
  success: true,
  deletedImage: "image_005.png",
  updatedFiles: ["theory.md", "Competency_Focused_Questions.md"]
}
```

---

### Function 5: `lockBook` / `unlockBook`

**Trigger:** HTTP Callable Function

**Input (lock):**
```javascript
{
  bookId: "book123",
  userId: "user456"
}
```

**Process (lock):**
1. Check if already locked by another user
2. If not locked or lock expired:
   - Set `editing.isLocked = true`
   - Set `editing.lockedBy = userId`
   - Set `editing.lockedAt = now()`
   - Set `editing.lockExpiry = now() + 1 hour`
3. Return lock status

**Process (unlock):**
1. Verify user owns the lock
2. Set `editing.isLocked = false`
3. Clear lock metadata

---

## Frontend Components

### Component Structure

```
src/
└── components/
    ├── BookEditor/
    │   ├── BookEditor.js           # Main editor screen
    │   ├── BookEditor.css
    │   ├── ExtractionPanel.js      # Step 1: Extraction UI
    │   ├── SplittingPanel.js       # Step 2: Splitting status
    │   ├── EditorPanel.js          # Step 3: Main editor
    │   ├── FileExplorer.js         # Left panel: File tree
    │   ├── MarkdownEditor.js       # Center: Raw markdown editor
    │   ├── PDFViewer.js            # Right: PDF viewer
    │   ├── ImageGallery.js         # Image preview modal
    │   └── ImageManager.js         # Image deletion
    └── ProjectBooks.js             # Updated to link to editor
```

---

### Component 1: BookEditor.js

**Route:** `/book/:bookId/editor`

**State Management:**
```javascript
const [book, setBook] = useState(null);
const [extractionStatus, setExtractionStatus] = useState('not_started');
const [splittingStatus, setSplittingStatus] = useState('not_started');
const [currentTab, setCurrentTab] = useState('extraction'); // extraction | editor
const [selectedFile, setSelectedFile] = useState(null);
const [fileContent, setFileContent] = useState('');
const [files, setFiles] = useState([]);
const [isLocked, setIsLocked] = useState(false);
const [hasLock, setHasLock] = useState(false);
```

**Tabs:**
1. **Extraction Tab** (shown if extraction not completed)
2. **Editor Tab** (shown if splitting completed)

---

### Component 2: ExtractionPanel.js

**UI:**
```
┌─────────────────────────────────────────────────────────────┐
│  📄 PDF Extraction                                           │
│                                                              │
│  Status: Not Started                                         │
│                                                              │
│  [Start Extraction]                                          │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  What happens during extraction:                            │
│  ✓ PDF is sent to MinerU API v4 with VLM                   │
│  ✓ Content is extracted to markdown                         │
│  ✓ Images are extracted and stored                          │
│  ✓ Results are saved to Firebase Storage                    │
└─────────────────────────────────────────────────────────────┘
```

**When Processing:**
```
┌─────────────────────────────────────────────────────────────┐
│  📄 PDF Extraction                                           │
│                                                              │
│  Status: Processing... ⏳                                    │
│                                                              │
│  [████████████░░░░░░░░] 65%                                 │
│                                                              │
│  Extracting content from PDF...                             │
│  This may take 2-5 minutes depending on PDF size.           │
└─────────────────────────────────────────────────────────────┘
```

**When Completed:**
```
┌─────────────────────────────────────────────────────────────┐
│  📄 PDF Extraction                                           │
│                                                              │
│  Status: Completed ✓                                         │
│                                                              │
│  ✓ Extracted 125 KB of content                              │
│  ✓ Found 15 images                                           │
│  ✓ Saved to Firebase Storage                                │
│                                                              │
│  [View Extracted Content] [Proceed to Splitting]            │
└─────────────────────────────────────────────────────────────┘
```

---

### Component 3: FileExplorer.js

**UI:**
```
┌─────────────────────────┐
│  📁 File Explorer       │
├─────────────────────────┤
│                         │
│ 📂 Questions            │
│   📄 theory.md          │
│   📄 Competency_Foc...  │
│   📄 MCQ_Level_1.md     │
│   📄 MCQ_Level_1_P2.md  │
│   📄 MCQ_Level_2.md     │
│   📄 MCQ_Level_2_P2.md  │
│   📄 ACHIEVERS.md       │
│                         │
│ 📂 Answer Keys          │
│   📄 Competency_key.md  │
│   📄 MCQ_L1_key.md      │
│   📄 MCQ_L1_P2_key.md   │
│   📄 MCQ_L2_key.md      │
│   📄 MCQ_L2_P2_key.md   │
│   📄 ACHIEVERS_key.md   │
│                         │
│ 📂 Explanations         │
│   📄 Competency_ans.md  │
│   📄 MCQ_L1_ans.md      │
│   📄 MCQ_L1_P2_ans.md   │
│   📄 MCQ_L2_ans.md      │
│   📄 MCQ_L2_P2_ans.md   │
│   📄 ACHIEVERS_ans.md   │
│                         │
│ [+ New File]            │
└─────────────────────────┘
```

**Features:**
- Click file → Load in editor
- Highlight modified files (*)
- Collapsible folders
- Create new file button
- File size indicators

---

### Component 4: MarkdownEditor.js

**Library:** `@uiw/react-md-editor` or `react-simple-code-editor`

**UI:**
```
┌─────────────────────────────────────────────────────────────┐
│  theory.md                                      [Save] [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  # Theory Content                                            │
│                                                              │
│  This is the theory section...                              │
│                                                              │
│  ![Image 1](../extracted/images/image_001.png)              │
│                                                              │
│  More content here...                                        │
│                                                              │
│                                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Syntax highlighting for markdown
- Line numbers
- Auto-save (debounced)
- Undo/Redo
- Find & Replace
- Image preview on hover

---

### Component 5: PDFViewer.js

**Library:** `@react-pdf-viewer/core`

**UI:**
```
┌─────────────────────────────────────────────────────────────┐
│  Original PDF                    [Zoom] [Prev] [Next]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    [PDF Page Preview]                        │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                    Page 1 of 45                              │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Zoom in/out
- Page navigation
- Search in PDF
- Synchronized scrolling (optional)

---

### Component 6: ImageGallery.js

**UI (Modal):**
```
┌─────────────────────────────────────────────────────────────┐
│  Image Preview                                          [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    [Large Image Preview]                     │
│                                                              │
│  image_005.png                                               │
│  Used in: theory.md, Competency_Focused_Questions.md        │
│                                                              │
│  [Delete Image] [Close]                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Backend Setup (Cloud Functions)

1. **Initialize Firebase Functions (Python)**
   ```bash
   cd functions
   firebase init functions
   # Select Python runtime
   ```

2. **Create `functions/requirements.txt`**
   ```
   firebase-admin==6.2.0
   firebase-functions==0.1.0
   requests==2.31.0
   ```

3. **Create `functions/main.py`**
   - Implement `extractPDF` function
   - Implement `splitContent` function
   - Implement `updateSplitFile` function
   - Implement `deleteImage` function
   - Implement `lockBook` / `unlockBook` functions

4. **Port Python splitting logic**
   - Copy logic from `split_content.py`
   - Copy patterns from `patterns_config.py`
   - Adapt for Cloud Functions environment

5. **Deploy functions**
   ```bash
   firebase deploy --only functions
   ```

---

### Phase 2: Frontend Components

1. **Install dependencies**
   ```bash
   npm install @uiw/react-md-editor
   npm install @react-pdf-viewer/core
   npm install react-router-dom  # (already installed)
   ```

2. **Create BookEditor component structure**
   - `BookEditor.js` (main container)
   - `ExtractionPanel.js`
   - `SplittingPanel.js`
   - `EditorPanel.js`

3. **Create sub-components**
   - `FileExplorer.js`
   - `MarkdownEditor.js`
   - `PDFViewer.js`
   - `ImageGallery.js`

4. **Add route to App.js**
   ```javascript
   <Route path="/book/:bookId/editor" element={<BookEditor />} />
   ```

5. **Update ProjectBooks.js**
   - Add "Open Editor" button for each book
   - Link to `/book/:bookId/editor`

---

### Phase 3: Integration & Testing

1. **Test extraction flow**
   - Upload test PDF
   - Trigger extraction
   - Verify MinerU API response
   - Check Storage for extracted files

2. **Test splitting flow**
   - Verify all 19 files created
   - Check content accuracy
   - Validate file structure

3. **Test editor functionality**
   - Load files in editor
   - Edit and save
   - Create new files
   - Delete files

4. **Test image management**
   - Preview images
   - Delete images
   - Verify markdown updates

5. **Test locking mechanism**
   - Lock book for editing
   - Try accessing from another user
   - Auto-release after timeout

---

## API Reference

### MinerU API v4

**Endpoint:** `https://mineru.net/api/v4/extract`

**Method:** POST

**Headers:**
```
Authorization: Bearer {TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "pdf_url": "https://storage.googleapis.com/...",
  "mode": "vlm",
  "version": "2.5",
  "options": {
    "extract_images": true,
    "output_format": "markdown"
  }
}
```

**Response (Success):**
```json
{
  "status": "success",
  "job_id": "mineru_job_xyz123",
  "result": {
    "markdown": "# Content here...",
    "images": [
      {
        "filename": "image_001.png",
        "url": "https://...",
        "base64": "iVBORw0KGgo..."
      }
    ]
  }
}
```

**Response (Processing):**
```json
{
  "status": "processing",
  "job_id": "mineru_job_xyz123",
  "progress": 45,
  "message": "Extracting content..."
}
```

**Response (Error):**
```json
{
  "status": "error",
  "error": "Invalid PDF URL",
  "code": "INVALID_URL"
}
```

---

## Environment Variables

### Frontend (.env)
```env
# Existing Firebase config
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=...
```

### Cloud Functions (.env)
```env
# MinerU API Configuration
MINERU_API_BASE_URL=https://mineru.net/api/v4
MINERU_API_TOKEN=eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ...
MINERU_API_VERSION=2.5
MINERU_API_MODE=vlm

# Firebase Admin (auto-configured)
# No need to add Firebase config here
```

---

## Error Handling

### Common Errors & Solutions

1. **MinerU API Rate Limit**
   - Error: `429 Too Many Requests`
   - Solution: Implement exponential backoff, show user-friendly message

2. **PDF Too Large**
   - Error: `PDF exceeds size limit`
   - Solution: Check file size before extraction, show warning

3. **Invalid PDF Format**
   - Error: `Cannot parse PDF`
   - Solution: Validate PDF before upload, show error message

4. **Network Timeout**
   - Error: `Request timeout`
   - Solution: Retry up to 3 times, then mark as failed

5. **Storage Quota Exceeded**
   - Error: `Storage quota exceeded`
   - Solution: Check quota before upload, notify admin

6. **Lock Conflict**
   - Error: `Book is locked by another user`
   - Solution: Show message with lock owner, offer to request unlock

---

## Security Considerations

1. **API Key Protection**
   - Store MinerU token in Cloud Functions environment variables
   - Never expose in frontend code

2. **PDF Access Control**
   - Generate signed URLs with short expiry (1 hour)
   - Validate user permissions before generating URLs

3. **File Access Control**
   - Verify user owns the book before allowing edits
   - Check lock status before saving changes

4. **Firestore Security Rules**
   ```javascript
   match /books/{bookId} {
     allow read: if request.auth != null && 
                  (resource.data.userId == request.auth.uid || 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
     
     allow update: if request.auth != null && 
                    (resource.data.userId == request.auth.uid || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin') &&
                    (!resource.data.editing.isLocked || 
                     resource.data.editing.lockedBy == request.auth.uid);
   }
   ```

5. **Storage Security Rules**
   ```javascript
   match /books/{bookId}/{allPaths=**} {
     allow read: if request.auth != null;
     allow write: if request.auth != null && 
                   get(/databases/$(database)/documents/books/$(bookId)).data.userId == request.auth.uid;
   }
   ```

---

## Performance Optimization

1. **Lazy Loading**
   - Load files only when selected
   - Paginate file list if > 50 files

2. **Caching**
   - Cache file content in local state
   - Use React Query for server state management

3. **Debouncing**
   - Debounce auto-save (2 seconds)
   - Debounce search/filter (300ms)

4. **Code Splitting**
   - Lazy load BookEditor component
   - Lazy load PDF viewer library

5. **Image Optimization**
   - Generate thumbnails for image preview
   - Lazy load images in markdown preview

---

## Testing Checklist

### Extraction Testing
- [ ] Upload valid PDF → Extraction succeeds
- [ ] Upload invalid file → Error shown
- [ ] Upload large PDF (>50MB) → Handles correctly
- [ ] Cancel extraction mid-process → Cleans up properly
- [ ] Network error during extraction → Retries and recovers

### Splitting Testing
- [ ] Extract and split valid educational PDF → 19 files created
- [ ] Verify Level 1 split at Q13 → Correct
- [ ] Verify Level 2 split at Q11 → Correct
- [ ] Verify answer keys duplicated → Both parts have full keys
- [ ] Verify explanations split correctly → Matches questions

### Editor Testing
- [ ] Load file in editor → Content displays
- [ ] Edit and save file → Changes persist
- [ ] Create new file → Appears in file tree
- [ ] Delete file → Removed from Storage and Firestore
- [ ] Unsaved changes warning → Shows on navigation

### Image Testing
- [ ] Images display in markdown preview → Correct
- [ ] Click image → Preview modal opens
- [ ] Delete image → Removed from Storage
- [ ] Delete image → Markdown references removed
- [ ] Delete image used in multiple files → All files updated

### Lock Testing
- [ ] User A locks book → Lock acquired
- [ ] User B tries to edit → Blocked with message
- [ ] User A unlocks book → Lock released
- [ ] Lock expires after 1 hour → Auto-released
- [ ] User A closes browser → Lock persists until expiry

---

## Future Enhancements

1. **Real-time Collaboration**
   - Multiple users can view (read-only)
   - Show who's currently viewing

2. **Version History**
   - Track all file changes
   - Allow rollback to previous versions

3. **AI-Powered Suggestions**
   - Grammar/spelling check
   - Content improvement suggestions

4. **Export Options**
   - Export to PDF
   - Export to DOCX
   - Export to HTML

5. **Batch Operations**
   - Bulk edit multiple files
   - Find & replace across all files

6. **Advanced Search**
   - Search across all split files
   - Regex support

---

## Troubleshooting

### Issue: Extraction Stuck at "Processing"

**Symptoms:** Extraction status shows "processing" for > 10 minutes

**Possible Causes:**
1. MinerU API is slow/overloaded
2. PDF is very large
3. Network issues

**Solutions:**
1. Check MinerU API status
2. Implement timeout (10 minutes)
3. Add retry mechanism
4. Show estimated time based on PDF size

---

### Issue: Split Files Missing Content

**Symptoms:** Some split files are empty or incomplete

**Possible Causes:**
1. Pattern matching failed (new format variation)
2. Extraction incomplete
3. Splitting logic error

**Solutions:**
1. Check `full.md` for content
2. Add new patterns to `patterns_config.py`
3. Review splitting logs
4. Manual intervention if needed

---

### Issue: Images Not Loading

**Symptoms:** Image references in markdown but images don't display

**Possible Causes:**
1. Image path incorrect
2. Storage permissions issue
3. Image not uploaded

**Solutions:**
1. Verify image exists in Storage
2. Check image path in markdown
3. Regenerate signed URLs
4. Re-extract if needed

---

## Maintenance

### Regular Tasks

1. **Monitor MinerU API Usage**
   - Check API quota daily
   - Alert if approaching limit

2. **Clean Up Old Locks**
   - Run daily Cloud Function to release expired locks
   - Notify users if lock was force-released

3. **Storage Cleanup**
   - Archive old extracted files (>90 days)
   - Compress images to save space

4. **Performance Monitoring**
   - Track extraction times
   - Monitor Cloud Function execution times
   - Alert if times exceed thresholds

---

## Support & Documentation

- **MinerU API Docs:** https://mineru.net/apiManage/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **React PDF Viewer:** https://react-pdf-viewer.dev/
- **React MD Editor:** https://uiwjs.github.io/react-md-editor/

---

## Changelog

### Version 1.0 (Initial Implementation)
- PDF extraction via MinerU API v4
- Automatic content splitting
- Dual-panel editor (file tree + markdown + PDF)
- Image management
- Simple locking mechanism

---

**Last Updated:** 2024-01-15  
**Author:** Development Team  
**Status:** Ready for Implementation 🚀

