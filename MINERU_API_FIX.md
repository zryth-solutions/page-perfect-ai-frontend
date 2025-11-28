# MinerU API Integration Fix ✅

## Issue

The Cloud Function was calling the wrong MinerU API endpoint:
- **Wrong:** `POST /api/v4/extract` (404 Not Found)
- **Correct:** `POST /api/v4/extract/task` (Creates extraction task)

## Solution

Completely rewrote the MinerU client to match your working script exactly.

### Changes Made

#### 1. Updated `functions/extraction/mineru_client.py`

**Copied from your working script** (`MinerU/script.py`):
- ✅ Correct API endpoint: `/api/v4/extract/task`
- ✅ Correct request payload structure
- ✅ Task-based extraction workflow
- ✅ Polling for completion
- ✅ ZIP file download and extraction

#### 2. Updated `functions/main.py` - extractPDF Function

**New workflow:**

```python
# 1. Create extraction task
task_result = mineru_client.create_extraction_task(
    pdf_url=pdf_url,
    is_ocr=True,              # ✅ OCR enabled
    enable_formula=True,       # ✅ Formula recognition enabled
    enable_table=True,         # ✅ Table recognition enabled
    language="en",             # ✅ English language
    model_version="vlm",       # ✅ VLM model (best accuracy)
    data_id=book_id
)

# 2. Wait for completion (with polling)
extraction_result = mineru_client.wait_for_completion(
    task_id=task_id,
    poll_interval=5,
    max_wait_time=3600
)

# 3. Download ZIP file
download_result = mineru_client.download_result_zip(zip_url, zip_path)

# 4. Extract ZIP and upload files to Firebase Storage
- Extract markdown file → Upload as full.md
- Extract all images → Upload to images/ folder
```

## Features Enabled

As requested, all features are enabled for complex PDF extraction:

| Feature | Status | Description |
|---------|--------|-------------|
| **OCR** | ✅ Enabled | Optical Character Recognition for scanned PDFs |
| **Formula Recognition** | ✅ Enabled | Mathematical formulas and equations |
| **Table Recognition** | ✅ Enabled | Tables and structured data |
| **Language** | ✅ English (`en`) | Document language |
| **Model** | ✅ VLM | Vision Language Model (best accuracy) |

## MinerU API Workflow

```
1. Frontend calls extractPDF Cloud Function
   ↓
2. Function generates public URL for PDF
   ↓
3. Function calls MinerU: POST /api/v4/extract/task
   ↓
4. MinerU returns task_id
   ↓
5. Function polls: GET /api/v4/extract/task/{task_id}
   ↓
6. MinerU processes PDF (state: pending → running → converting)
   ↓
7. MinerU completes (state: done)
   ↓
8. Function gets full_zip_url from result
   ↓
9. Function downloads ZIP file
   ↓
10. Function extracts ZIP (markdown + images)
    ↓
11. Function uploads to Firebase Storage
    ↓
12. Function updates Firestore status
    ↓
13. Frontend shows "Extraction Complete"
```

## API Request Format

### Create Task Request

```json
POST https://mineru.net/api/v4/extract/task
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json

Body:
{
  "url": "https://storage.googleapis.com/your-pdf.pdf",
  "is_ocr": true,
  "enable_formula": true,
  "enable_table": true,
  "language": "en",
  "model_version": "vlm",
  "data_id": "book123"
}
```

### Response

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "task_id": "abc123xyz"
  },
  "trace_id": "..."
}
```

### Check Status Request

```json
GET https://mineru.net/api/v4/extract/task/abc123xyz
Headers:
  Authorization: Bearer YOUR_TOKEN
```

### Response (In Progress)

```json
{
  "code": 0,
  "data": {
    "task_id": "abc123xyz",
    "state": "running",
    "extract_progress": {
      "extracted_pages": 5,
      "total_pages": 10,
      "start_time": "2025-11-27T08:00:00Z"
    }
  }
}
```

### Response (Completed)

```json
{
  "code": 0,
  "data": {
    "task_id": "abc123xyz",
    "state": "done",
    "full_zip_url": "https://mineru.net/download/abc123xyz.zip",
    "data_id": "book123"
  }
}
```

## Deployment

```bash
firebase deploy --only functions:extractPDF
```

✅ Successfully deployed

## Testing

**Try the extraction now:**

1. **Refresh your browser** (Ctrl+Shift+R)
2. **Go to your project**
3. **Click "Open Editor"** on a book
4. **Click "Start Extraction"**

**Expected behavior:**
- ✅ Task created successfully
- ✅ Status updates: "Processing..."
- ✅ Progress shown (if available)
- ✅ After 1-5 minutes: "Extraction Complete"
- ✅ Auto-switches to "Splitting" tab

## What Gets Extracted

From your PDF, MinerU will extract:

1. **Markdown Content:**
   - Text with proper formatting
   - Headings and structure
   - Lists and paragraphs
   - Mathematical formulas (LaTeX format)
   - Tables (markdown table format)

2. **Images:**
   - Figures and diagrams
   - Charts and graphs
   - Scanned images (if OCR enabled)
   - All images saved as separate files

## File Structure After Extraction

```
Firebase Storage:
└── books/
    └── {bookId}/
        └── extracted/
            ├── full.md              # Complete markdown content
            └── images/
                ├── image_001.png
                ├── image_002.png
                └── ...
```

## Troubleshooting

### If extraction fails:

1. **Check Cloud Functions logs:**
   ```bash
   firebase functions:log --only extractPDF
   ```

2. **Check MinerU API status:**
   - Verify API key is correct
   - Check if you have credits
   - Verify PDF is publicly accessible

3. **Check PDF requirements:**
   - PDF must be publicly accessible
   - File size limits (check MinerU docs)
   - PDF must not be corrupted

### Common Issues

**"API request failed: 404"**
- ✅ Fixed: Now using correct endpoint `/extract/task`

**"Task did not complete within X seconds"**
- Large PDFs take longer to process
- Increase `max_wait_time` if needed
- Check MinerU API status

**"No ZIP URL in extraction result"**
- Task may have failed
- Check MinerU task status
- Review error message

## API Key Configuration

Make sure your MinerU API key is set:

```bash
firebase functions:config:set mineru.api_key="YOUR_KEY"
firebase deploy --only functions
```

Or check current config:

```bash
firebase functions:config:get
```

## Performance

**Typical extraction times:**
- Small PDF (1-10 pages): 30 seconds - 2 minutes
- Medium PDF (10-50 pages): 2-5 minutes
- Large PDF (50-100 pages): 5-15 minutes
- Very large PDF (100+ pages): 15-30 minutes

Times depend on:
- Number of pages
- Complexity (formulas, tables, images)
- OCR requirements
- MinerU server load

## Summary

✅ **Fixed:** MinerU API endpoint and workflow  
✅ **Enabled:** All features (OCR, Formula, Table, VLM)  
✅ **Deployed:** extractPDF function updated  
✅ **Ready:** Test extraction now!  

**Next Step:** Try extracting a PDF in your browser! 🚀

