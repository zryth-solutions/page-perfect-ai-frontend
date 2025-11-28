# 🧪 Test Extraction Now

## ✅ What's Fixed

1. **UTF-8 decode error** - Fixed binary file handling
2. **Upload service** - Using tmpfiles.org (tested and working)
3. **MinerU compatibility** - Verified to work

## 🚀 Test Steps

### 1. Wait for Deployment (2-3 minutes)
```bash
# Optional: Wait for old instances to shut down
sleep 180
```

### 2. Test in Browser

1. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Navigate to a book** in your project
3. **Click "Restart Extraction"** button
4. **Watch the status** - should show:
   - "Processing..." 
   - Then "Completed" or error message

### 3. Monitor Logs (Optional)

**Real-time streaming:**
```bash
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" --project=pageperfectai
```

**View last 50 entries:**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" --limit=50 --format="value(textPayload)" --project=pageperfectai
```

**View only errors:**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf AND severity>=ERROR" --limit=20 --format="value(textPayload)" --project=pageperfectai
```

## ✅ Expected Success Flow

You should see in logs:
```
Starting extraction for book: <BOOK_ID>
Downloading PDF from Storage: books/<PATH>
Uploading PDF to temporary public location...
Temporary public URL: http://tmpfiles.org/dl/<ID>/document.pdf
Creating MinerU extraction task...
MinerU task created: <TASK_ID>
Waiting for extraction to complete...
Extraction completed!
Saved full.md (<SIZE> bytes)
Saved <N> images
```

In browser:
- Status changes to "Processing..."
- Then "Completed" ✅
- "Proceed to Splitting" button appears

## ❌ If It Still Fails

### 1. Check the Error Message
Look at the error in the browser console or UI.

### 2. Check Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" --limit=50 --format="value(textPayload)" --project=pageperfectai | grep -i "error\|failed"
```

### 3. Test Upload Service
```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
python3 test_upload_services.py
```

Should show:
```
✅ SUCCESS! URL: http://tmpfiles.org/dl/<ID>/document.pdf
✅ URL is publicly accessible!
```

### 4. Common Issues

**Issue:** "Failed to create temporary public URL"
**Solution:** tmpfiles.org might be down. Check with test script.

**Issue:** "PDF file not found"
**Solution:** Check the PDF path in Firestore book document.

**Issue:** "MinerU API key not configured"
**Solution:** Check `functions/.env` has `MINERU_API_KEY`.

**Issue:** Still getting UTF-8 error
**Solution:** Old function instance still running. Wait 5 minutes.

## 📊 Verify Results

After successful extraction:

### 1. Check Firebase Storage
Navigate to: `books/<BOOK_ID>/extracted/`

Should contain:
- `full.md` - Extracted markdown
- `images/` folder with extracted images

### 2. Check Firestore
Book document should have:
```json
{
  "extractionStatus": "completed",
  "extractionMetadata": {
    "fullMdPath": "books/<BOOK_ID>/extracted/full.md",
    "imageCount": <N>,
    "fullMdSize": <SIZE>,
    "mineruJobId": "<TASK_ID>"
  }
}
```

## 🎯 Quick Test Command

Run everything in one go:
```bash
# Wait, then check logs
sleep 180 && gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" --limit=20 --format="value(textPayload)" --project=pageperfectai
```

## 📝 Report Results

Please let me know:
1. ✅ Success or ❌ Failed
2. Error message (if failed)
3. Log output (if needed)

---

## 🎉 Ready!

**Everything is deployed and tested. Please try the extraction now!**

The solution has been:
- ✅ Tested locally
- ✅ Verified with MinerU
- ✅ Deployed to production

Good luck! 🚀

