# MinerU + Firebase Storage Issue & Solution

## Problem Summary

MinerU API cannot reliably access PDFs from Firebase Storage due to:

1. **Timeout Issues:** Large PDFs (>10MB) cause "file read timeout" errors
2. **Access Issues:** Firebase Storage URLs sometimes return "failed to read file"
3. **URL Format:** Different URL formats produce different errors

## Test Results

### ✅ MinerU API Works
- Tested with public PDF: **SUCCESS**
- MinerU API is functional and working

### ❌ Firebase Storage URLs Fail

**Format 1: Direct Storage URL**
```
https://storage.googleapis.com/pageperfectai.firebasestorage.app/books/...
```
- Result: "failed to read file" (-60003)
- File is publicly accessible (verified with curl)
- MinerU cannot access it

**Format 2: Firebase REST API URL**
```
https://firebasestorage.googleapis.com/v0/b/pageperfectai.firebasestorage.app/o/...?alt=media
```
- Result: "file read timeout" (-60008)
- MinerU can access but times out on large files (11MB+)

## Root Cause

MinerU's servers may have:
1. **Firewall rules** blocking Firebase Storage domains
2. **Timeout limits** for large file downloads
3. **Network routing issues** to Firebase Storage
4. **Rate limiting** from Firebase Storage

## Solutions

### Option 1: Use a CDN or Proxy (Recommended)

Create a Cloud Function that proxies the PDF:

```python
@https_fn.on_request()
def pdfProxy(req):
    """Proxy PDF files for MinerU"""
    file_path = req.args.get('path')
    
    # Download from Storage
    blob = storage.bucket().blob(file_path)
    pdf_bytes = blob.download_as_bytes()
    
    # Return with proper headers
    return Response(
        pdf_bytes,
        mimetype='application/pdf',
        headers={
            'Content-Disposition': 'inline',
            'Cache-Control': 'public, max-age=3600'
        }
    )
```

Then use: `https://your-region-project.cloudfunctions.net/pdfProxy?path=books/...`

### Option 2: Use Cloud Storage Signed URLs with Custom Domain

Set up a custom domain for your Storage bucket and use signed URLs.

### Option 3: Upload to Alternative Storage

Use a service that MinerU can reliably access:
- AWS S3 with public URLs
- Google Cloud Storage (non-Firebase)
- Cloudflare R2
- Any simple HTTP server

### Option 4: Pre-process PDFs

Download PDF → Upload to temporary public location → Process → Delete

```python
# 1. Download from Firebase Storage
blob = storage.bucket().blob(pdf_path)
pdf_bytes = blob.download_as_bytes()

# 2. Upload to temporary public location (e.g., transfer.sh)
response = requests.post(
    'https://transfer.sh/',
    files={'file': ('document.pdf', pdf_bytes, 'application/pdf')}
)
temp_url = response.text.strip()

# 3. Process with MinerU
result = mineru_client.create_extraction_task(temp_url)

# 4. Temp URL expires automatically after 14 days
```

## Recommended Implementation

**Use Option 4 (Temporary Upload)** as it's the simplest:

```python
import requests

def upload_to_transfer_sh(pdf_bytes, filename):
    """Upload PDF to transfer.sh for temporary public access"""
    response = requests.post(
        'https://transfer.sh/',
        files={'file': (filename, pdf_bytes, 'application/pdf')}
    )
    return response.text.strip()

# In extractPDF function:
# Download from Firebase Storage
blob = storage.bucket().blob(pdf_path)
pdf_bytes = blob.download_as_bytes()

# Upload to temporary location
temp_url = upload_to_transfer_sh(pdf_bytes, 'document.pdf')

# Use temp URL with MinerU
task_result = mineru_client.create_extraction_task(temp_url)
```

**Pros:**
- Simple to implement
- No infrastructure changes needed
- Files auto-delete after 14 days
- Reliable access for MinerU

**Cons:**
- Depends on third-party service (transfer.sh)
- Additional upload time
- File size limits (usually 10GB, more than enough)

## Alternative Services

Instead of transfer.sh, you could use:
- **file.io** - Similar to transfer.sh
- **tmpfiles.org** - Temporary file hosting
- **0x0.st** - Simple file sharing
- **Your own simple HTTP server** - Full control

## Implementation Steps

1. Update `functions/main.py` extractPDF function
2. Add temporary upload logic
3. Use temp URL for MinerU
4. Continue with existing extraction logic
5. No need to clean up (auto-expires)

## Testing

After implementing, test with:
```bash
python3 test_mineru_local.py
```

Should see:
- ✅ PDF uploaded to temporary location
- ✅ MinerU task created successfully
- ✅ Extraction completes

## Summary

Firebase Storage URLs don't work reliably with MinerU due to network/timeout issues. The solution is to use a temporary public file hosting service as an intermediary.

This is a common pattern when integrating third-party APIs that need file access.

