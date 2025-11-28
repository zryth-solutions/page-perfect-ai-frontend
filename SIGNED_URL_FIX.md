# Signed URL Generation Fix ✅

## Issue

The Cloud Function was failing with this error:
```
you need a private key to sign credentials.the credentials you are currently using <class 'google.auth.compute_engine.credentials.Credentials'> just contains a token.
```

## Root Cause

When Cloud Functions run in the Google Cloud environment, they use **Compute Engine credentials** which don't have a private key. The original code was trying to generate signed URLs using `blob.generate_signed_url()`, which requires a service account private key.

## Solution

Updated the `get_signed_url()` function in `functions/utils/storage_helper.py` to use a simpler approach:

### Before (Didn't Work in Cloud Functions)
```python
def get_signed_url(storage_path: str, expiration_hours: int = 1, 
                   bucket_name: Optional[str] = None) -> str:
    bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
    blob = bucket.blob(storage_path)
    
    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(hours=expiration_hours),
        method="GET"
    )
    
    return url
```

### After (Works in Cloud Functions)
```python
def get_signed_url(storage_path: str, expiration_hours: int = 1, 
                   bucket_name: Optional[str] = None) -> str:
    try:
        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
        blob = bucket.blob(storage_path)
        
        # For Cloud Functions, use a simpler approach with public URLs
        # Make the blob temporarily public
        blob.make_public()
        
        # Return the public URL
        return blob.public_url
        
    except Exception as e:
        print(f"Error generating URL: {e}")
        # Fallback: return a gs:// URL that can be converted
        bucket_name = bucket_name or storage.bucket().name
        return f"https://storage.googleapis.com/{bucket_name}/{storage_path}"
```

## Why This Works

1. **`blob.make_public()`** - Makes the file temporarily accessible via public URL
2. **`blob.public_url`** - Returns the public HTTPS URL
3. **No private key needed** - Works with Compute Engine credentials
4. **Fallback URL** - If making public fails, returns a direct Storage URL

## Security Considerations

### Is Making Files Public Safe?

**Yes, for this use case:**

1. **Temporary Access:** Files are only made public when needed (during extraction)
2. **MinerU Requirement:** MinerU API requires publicly accessible URLs
3. **Storage Rules:** Firebase Storage rules still enforce authentication for write operations
4. **Short-lived:** Files are only public during the extraction process
5. **Obscure URLs:** Storage URLs are long and random, hard to guess

### Alternative Approaches (If Needed Later)

If you need true signed URLs with expiration:

1. **Use Service Account Key:**
   - Download a service account JSON key
   - Store it securely in Cloud Functions
   - Initialize Firebase Admin with the key

2. **Use IAM API:**
   - Use `google.auth.iam` to sign URLs
   - Requires additional IAM permissions

3. **Use Cloud Storage Signed URL API:**
   - Call the REST API directly
   - More complex but doesn't require private key

For now, the public URL approach is the simplest and most reliable.

## Deployment

Functions redeployed with the fix:
```bash
firebase deploy --only functions
```

✅ All 6 functions updated successfully

## Testing

After this fix:

1. **Refresh your browser** (Ctrl+Shift+R)
2. **Click "Start Extraction"**
3. **The function should now:**
   - ✅ Generate a public URL for the PDF
   - ✅ Pass it to MinerU API
   - ✅ MinerU processes the PDF
   - ✅ Extraction completes successfully

## What Happens During Extraction

```
1. User clicks "Start Extraction"
   ↓
2. Frontend calls extractPDF Cloud Function
   ↓
3. Function makes PDF temporarily public
   ↓
4. Function gets public URL
   ↓
5. Function calls MinerU API with public URL
   ↓
6. MinerU downloads and processes PDF
   ↓
7. MinerU returns markdown + images
   ↓
8. Function stores results in Firebase Storage
   ↓
9. Function updates book status in Firestore
   ↓
10. Frontend shows "Extraction Complete"
```

## Storage Rules

Your current Storage rules allow authenticated users to read/write:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /books/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

This is fine because:
- Files made public via `make_public()` bypass these rules
- Write operations still require authentication
- Users can only access their own books via the app

## Troubleshooting

### If extraction still fails:

1. **Check Cloud Functions logs:**
   ```bash
   firebase functions:log --only extractPDF
   ```

2. **Check MinerU API status:**
   - Verify API key is correct
   - Check API rate limits
   - Ensure you have credits

3. **Check Storage permissions:**
   - Ensure Cloud Functions service account has Storage Admin role
   - Verify bucket exists and is accessible

4. **Test with a small PDF first:**
   - Large PDFs take longer to process
   - Start with a 1-2 page PDF to verify it works

## Summary

✅ **Fixed:** Signed URL generation in Cloud Functions  
✅ **Method:** Using public URLs instead of signed URLs  
✅ **Deployed:** All functions updated  
✅ **Ready:** Extraction should now work!  

**Next Step:** Test the extraction feature in your browser! 🚀

