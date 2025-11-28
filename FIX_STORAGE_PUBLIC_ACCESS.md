# Fix Firebase Storage Public Access

## Problem

Firebase Storage files are returning **403 Forbidden** even though:
- ✅ Storage rules allow public read (`allow read: if true`)
- ✅ Cloud Function tries to make files public

**Root Cause:** The bucket has **Uniform Bucket-Level Access** enabled, which means:
- Individual file ACLs (like `make_public()`) don't work
- IAM permissions control access at the bucket level
- Storage rules are secondary to IAM

## Solution

We need to grant public read access at the IAM level.

### Option 1: Using Google Cloud Console (Recommended)

1. **Go to Cloud Storage:**
   https://console.cloud.google.com/storage/browser?project=pageperfectai

2. **Find your bucket:**
   - Look for `pageperfectai.firebasestorage.app` or `pageperfectai.appspot.com`

3. **Click on the bucket name**

4. **Go to the "PERMISSIONS" tab**

5. **Click "GRANT ACCESS"**

6. **Add public access:**
   - New principals: `allUsers`
   - Role: `Storage Object Viewer`
   - Click **SAVE**

7. **Confirm the warning** about making data public

### Option 2: Using gsutil Command

```bash
# Make the entire bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://pageperfectai.firebasestorage.app

# Or just the books folder
gsutil iam ch allUsers:objectViewer gs://pageperfectai.firebasestorage.app/books
```

### Option 3: Using gcloud Command

```bash
# Add IAM policy binding
gcloud storage buckets add-iam-policy-binding gs://pageperfectai.firebasestorage.app \
    --member=allUsers \
    --role=roles/storage.objectViewer
```

## Verification

After applying the fix, test if the file is publicly accessible:

```bash
curl -I "https://storage.googleapis.com/pageperfectai.firebasestorage.app/books/MK6MPIynTlrHgqMPvJ3H/Rw0jMwvPi7cMjgRGtIPPNTY6Bq83/1764085066109_chp-11.pdf"
```

**Expected:** `HTTP/2 200` (not 403 or 404)

## Security Considerations

### Is This Safe?

**For this use case, YES:**

1. **Read-Only Access:**
   - Only viewing files is public
   - Upload/delete still requires authentication

2. **Obscure URLs:**
   - Storage paths are long and random
   - Hard to guess or enumerate

3. **No Sensitive Data:**
   - Educational PDF content
   - Not personal or confidential

4. **Application Controls:**
   - Your app controls who can upload
   - Firestore rules control who sees book records
   - Users only see their own books in UI

### Alternative: Restrict to Specific Folder

If you want only the `books/` folder to be public:

Unfortunately, with Uniform Bucket-Level Access, you can't restrict IAM to specific folders. You have two options:

1. **Make entire bucket public** (simplest, what we're doing)
2. **Use a separate bucket** for public files

## After Fixing

Once public access is granted:

1. **Refresh browser** (Ctrl+Shift+R)
2. **Click "Restart Extraction"**
3. **Wait for completion**

**Expected result:**
- ✅ MinerU can access the PDF
- ✅ Extraction completes successfully
- ✅ Files saved to Storage

## Rollback (If Needed)

To remove public access:

```bash
# Remove public access
gsutil iam ch -d allUsers:objectViewer gs://pageperfectai.firebasestorage.app
```

**Note:** This will break MinerU extraction!

## Summary

The issue is that Firebase Storage's **Uniform Bucket-Level Access** requires IAM permissions, not just Storage rules.

**Steps to fix:**
1. Go to Cloud Storage console
2. Select your bucket
3. Go to Permissions
4. Grant `allUsers` the `Storage Object Viewer` role
5. Test extraction again

This is the final piece needed to make MinerU extraction work! 🚀

