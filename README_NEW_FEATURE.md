# 📚 PDF Processing & Editing Workflow - Feature Documentation

## 🎯 Overview

This feature adds a complete PDF processing and editing workflow to your application, allowing users to:
1. Extract data from PDFs using MinerU API
2. Automatically split content into structured sections
3. Edit markdown files with a side-by-side PDF comparison
4. Manage images embedded in the content

---

## 🌟 Key Features

### 1. **PDF Data Extraction**
- Integrates with MinerU API v2.5 (with VLM support)
- Extracts markdown content and images from PDFs
- Stores extracted data in Firebase Storage
- Updates book status in real-time

### 2. **Intelligent Content Splitting**
- Uses regex patterns to identify content sections
- Splits educational PDFs into:
  - Main content
  - Answer keys
  - Explanations
  - Custom sections
- Configurable splitting patterns

### 3. **Three-Panel Editor**
- **Left Panel:** List of split markdown files
- **Middle Panel:** Raw markdown editor with syntax highlighting
- **Right Panel:** Original PDF for comparison
- Seamless navigation between files

### 4. **Image Management**
- Preview all images in the content
- Delete unwanted images
- Automatic cleanup from markdown and storage

### 5. **File Operations**
- Create new markdown files
- Edit existing files
- Save changes to Firebase Storage
- Real-time status updates

### 6. **Book Locking**
- Prevents concurrent editing
- Automatic lock expiry
- Simple one-user-at-a-time mechanism

---

## 🎨 User Interface

### Main Editor Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  📖 Book Title                                          [Close]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────┬───────────┬───────────┐                         │
│  │Extraction │ Splitting │  Editor   │  ← Tabs                 │
│  └───────────┴───────────┴───────────┘                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    [Tab Content Area]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Extraction Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  📄 PDF Extraction                                              │
│                                                                 │
│  Status: Ready to extract                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  This will extract text and images from your PDF using  │  │
│  │  MinerU API. The process may take a few minutes.        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│              [🚀 Start Extraction]                              │
│                                                                 │
│  ⏳ Extracting... 45%                                           │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Splitting Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  ✂️ Content Splitting                                           │
│                                                                 │
│  Status: Ready to split                                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Split the extracted content into multiple files based  │  │
│  │  on structural patterns (questions, answers, etc.)      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│              [✂️ Start Splitting]                               │
│                                                                 │
│  ✅ Split complete! Created 5 files                             │
│     • main-content.md                                           │
│     • answer-key.md                                             │
│     • explanations.md                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Editor Tab (Three-Panel Layout)

```
┌──────────────┬────────────────────────────┬──────────────────┐
│  📁 Files    │  ✏️ Markdown Editor        │  📄 PDF Viewer   │
│              │                            │                  │
│ □ main.md    │ # Chapter 1                │  ┌────────────┐  │
│ □ answers.md │                            │  │            │  │
│ □ explain.md │ ## Introduction            │  │  PDF Page  │  │
│              │                            │  │            │  │
│ [+ New File] │ Lorem ipsum dolor sit...   │  │    [1]     │  │
│              │                            │  │            │  │
│              │ ```python                  │  └────────────┘  │
│              │ def hello():               │                  │
│              │     print("Hello")         │  [◀] Page 1 [▶] │
│              │ ```                        │  [+ Zoom] [-]    │
│              │                            │                  │
│              │ [💾 Save] [🖼️ Images]      │                  │
└──────────────┴────────────────────────────┴──────────────────┘
```

### Image Gallery

```
┌─────────────────────────────────────────────────────────────────┐
│  🖼️ Image Gallery                                    [Close]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │ Image 1 │  │ Image 2 │  │ Image 3 │  │ Image 4 │          │
│  │ [View]  │  │ [View]  │  │ [View]  │  │ [View]  │          │
│  │ [Delete]│  │ [Delete]│  │ [Delete]│  │ [Delete]│          │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘          │
│                                                                 │
│  Total: 12 images                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Workflow

### Step-by-Step User Journey

```
1. User Login
   ↓
2. Navigate to "My Projects"
   ↓
3. Select or Create a Project
   ↓
4. Upload PDF Book
   ↓
5. Click "Open Editor" on Book Card
   ↓
┌────────────────────────────────────────┐
│        EXTRACTION TAB                  │
│  • Click "Start Extraction"            │
│  • Wait for MinerU processing          │
│  • Status updates in real-time         │
│  • ✅ Extraction complete              │
└────────────────────────────────────────┘
   ↓
┌────────────────────────────────────────┐
│        SPLITTING TAB                   │
│  • Click "Start Splitting"             │
│  • Content split into files            │
│  • See list of created files           │
│  • ✅ Splitting complete               │
└────────────────────────────────────────┘
   ↓
┌────────────────────────────────────────┐
│        EDITOR TAB                      │
│  • Select file from left panel         │
│  • Edit markdown in middle panel       │
│  • Compare with PDF in right panel     │
│  • Save changes                        │
│  • Create new files if needed          │
│  • Manage images                       │
│  • ✅ Editing complete                 │
└────────────────────────────────────────┘
   ↓
7. Close Editor
   ↓
8. Book ready with edited content
```

---

## 🏗️ Technical Architecture

### Frontend Components

```
BookEditor (Main Container)
├── ExtractionPanel
│   ├── Status display
│   ├── Progress bar
│   └── Start button
│
├── SplittingPanel
│   ├── Status display
│   ├── File list
│   └── Start button
│
└── EditorPanel
    ├── FileExplorer (Left)
    │   ├── File list
    │   ├── File selection
    │   └── Create new file
    │
    ├── MarkdownEditor (Middle)
    │   ├── Syntax highlighting
    │   ├── Auto-save (optional)
    │   └── Save button
    │
    ├── PDFViewer (Right)
    │   ├── Page navigation
    │   ├── Zoom controls
    │   └── PDF rendering
    │
    └── ImageGallery (Modal)
        ├── Image grid
        ├── Preview
        └── Delete functionality
```

### Backend Cloud Functions

```
Cloud Functions (Python 3.12)
│
├── extractPDF
│   ├── Generate signed URL for PDF
│   ├── Call MinerU API
│   ├── Store markdown in Storage
│   ├── Store images in Storage
│   └── Update book status
│
├── splitContent
│   ├── Load extracted markdown
│   ├── Apply regex patterns
│   ├── Create split files
│   ├── Store in Storage
│   └── Update book with file list
│
├── updateSplitFile
│   ├── Validate file path
│   ├── Update content in Storage
│   └── Update metadata
│
├── deleteImage
│   ├── Remove from Storage
│   ├── Update markdown content
│   └── Return updated content
│
├── lockBook
│   ├── Check existing lock
│   ├── Set lock with expiry
│   └── Return lock status
│
└── unlockBook
    ├── Verify lock owner
    ├── Remove lock
    └── Return success
```

### Data Flow

```
User Action
    ↓
React Component
    ↓
Service Layer (extractionService, splittingService, etc.)
    ↓
Cloud Function (HTTP Callable)
    ↓
┌─────────────────────────────────────┐
│  • Firebase Storage (files)         │
│  • Firestore (metadata)             │
│  • MinerU API (extraction)          │
└─────────────────────────────────────┘
    ↓
Response
    ↓
Service Layer
    ↓
React Component
    ↓
UI Update
```

---

## 📊 Database Schema

### Firestore: `books` Collection

```javascript
{
  // Existing fields
  id: "book-123",
  title: "Mathematics Chapter 1",
  fileName: "math-ch1.pdf",
  fileUrl: "https://storage.googleapis.com/...",
  filePath: "books/proj-1/user-1/1234567890_math-ch1.pdf",
  projectId: "proj-1",
  userId: "user-1",
  status: "split",  // pending → extracting → extracted → splitting → split
  uploadedAt: "2025-11-26T10:00:00Z",
  
  // New fields added by extraction
  extractedMarkdownPath: "extracted/book-123/full-content.md",
  extractedImagesPath: "extracted/book-123/images/",
  extractedAt: "2025-11-26T10:05:00Z",
  
  // New fields added by splitting
  splitFiles: [
    {
      name: "main-content.md",
      path: "split/book-123/main-content.md",
      size: 15234,
      createdAt: "2025-11-26T10:10:00Z"
    },
    {
      name: "answer-key.md",
      path: "split/book-123/answer-key.md",
      size: 8456,
      createdAt: "2025-11-26T10:10:00Z"
    }
  ],
  splitAt: "2025-11-26T10:10:00Z",
  
  // New fields for locking
  lockedBy: "user-1",
  lockedAt: "2025-11-26T10:15:00Z",
  lockExpiry: "2025-11-26T11:15:00Z"  // 1 hour from lock
}
```

### Firebase Storage Structure

```
pageperfectai.appspot.com/
│
├── books/                          # Original PDFs
│   └── {projectId}/
│       └── {userId}/
│           └── {timestamp}_{filename}.pdf
│
├── extracted/                      # Extracted content
│   └── {bookId}/
│       ├── full-content.md         # Full markdown
│       └── images/                 # Extracted images
│           ├── image-1.png
│           ├── image-2.jpg
│           └── ...
│
└── split/                          # Split files
    └── {bookId}/
        ├── main-content.md
        ├── answer-key.md
        ├── explanations.md
        └── ...
```

---

## 🔧 Configuration

### MinerU API Configuration

**Base URL:** `https://mineru.net/api/v4`

**API Key:** Set via Firebase Functions config
```bash
firebase functions:config:set mineru.api_key="YOUR_KEY"
```

**Features Used:**
- PDF to Markdown conversion
- VLM (Vision Language Model) support
- Image extraction
- Layout analysis

### Splitting Patterns

Defined in `functions/splitting/patterns_config.py`:

```python
# Question patterns
QUESTION_PATTERNS = [
    r'^\d+\.',           # 1. Question
    r'^Q\d+:',           # Q1: Question
    r'^\(\d+\)',         # (1) Question
]

# Answer key patterns
ANSWER_KEY_PATTERNS = [
    r'answer\s*key',
    r'answers?\s*:',
    r'solution\s*key',
]

# Explanation patterns
EXPLANATION_PATTERNS = [
    r'explanation\s*:',
    r'detailed\s*solution',
    r'step-by-step',
]
```

---

## 🚀 Performance

### Optimization Techniques

1. **Lazy Loading**
   - Components loaded on demand
   - PDF pages rendered as needed
   - Images loaded when visible

2. **Efficient State Management**
   - Custom hooks for state isolation
   - Memoization of expensive operations
   - Minimal re-renders

3. **Cloud Functions**
   - 512MB memory allocation
   - 540 seconds timeout
   - Concurrent execution support

4. **Storage**
   - Signed URLs for secure access
   - Efficient file uploads
   - Automatic cleanup

### Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| PDF Upload | 1-5s | Depends on file size |
| Extraction | 30-180s | Depends on PDF complexity |
| Splitting | 2-10s | Depends on content size |
| File Load | <1s | From Firebase Storage |
| File Save | <2s | To Firebase Storage |
| Image Delete | <1s | Storage + content update |

---

## 🔒 Security

### Authentication & Authorization

- ✅ Firebase Authentication required for all operations
- ✅ User can only access their own books
- ✅ Admin role support (can access all books)
- ✅ Cloud Functions validate auth tokens
- ✅ Firestore rules enforce ownership

### Data Protection

- ✅ Signed URLs for temporary PDF access
- ✅ Secure API key storage (Cloud Functions config)
- ✅ No sensitive data in frontend
- ✅ HTTPS only communication
- ✅ Book locking prevents conflicts

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Books collection
    match /books/{bookId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      
      allow write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

---

## 📈 Scalability

### Current Limits

- **Firestore:** 50K reads, 20K writes per day (free tier)
- **Storage:** 5GB storage, 1GB download per day (free tier)
- **Cloud Functions:** 2M invocations per month (free tier)
- **MinerU API:** Check your subscription limits

### Scaling Considerations

1. **Horizontal Scaling**
   - Cloud Functions scale automatically
   - Firestore scales automatically
   - Storage has no practical limits

2. **Optimization for Scale**
   - Implement caching for frequently accessed files
   - Use CDN for static assets
   - Batch operations where possible
   - Monitor and optimize Cloud Function execution time

3. **Cost Management**
   - Monitor usage in Firebase Console
   - Set up billing alerts
   - Optimize storage (delete unused files)
   - Cache extracted content

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User can create a project
- [ ] User can upload a PDF
- [ ] User can open the editor
- [ ] Extraction starts and completes successfully
- [ ] Splitting creates the expected files
- [ ] User can select and edit files
- [ ] Markdown syntax highlighting works
- [ ] PDF viewer displays correctly
- [ ] User can navigate PDF pages
- [ ] User can save file changes
- [ ] User can create new files
- [ ] User can view images
- [ ] User can delete images
- [ ] Book locking works correctly
- [ ] Error handling works properly

### Test Scenarios

1. **Happy Path**
   - Upload → Extract → Split → Edit → Save

2. **Error Handling**
   - Network failure during extraction
   - Invalid PDF file
   - MinerU API error
   - Storage quota exceeded

3. **Edge Cases**
   - Very large PDF (100+ pages)
   - PDF with no images
   - PDF with complex layouts
   - Concurrent edit attempts

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `START_HERE.md` | Quick start guide |
| `DEPLOYMENT_GUIDE.md` | Deployment instructions |
| `BOOK_EDITOR_WORKFLOW.md` | Technical documentation |
| `FINAL_STATUS.md` | Implementation status |
| `QUICK_COMMANDS.md` | Command reference |
| `README_NEW_FEATURE.md` | This file |

---

## 🎉 Summary

This feature transforms your application from a simple PDF storage system into a powerful PDF processing and editing platform. Users can now:

✅ Extract structured data from PDFs  
✅ Automatically split content into sections  
✅ Edit content with a professional interface  
✅ Compare edits with the original PDF  
✅ Manage images efficiently  
✅ Collaborate safely with locking  

**Total Implementation:**
- 35+ files created
- 5000+ lines of code
- 6 Cloud Functions
- 8 React components
- 4 services
- 3 custom hooks
- Complete documentation

**Ready to deploy!** 🚀

---

**Need Help?** Check the other documentation files or contact support.

