# Fix 403 Error - Cloud Functions Invoker Permissions

## Problem

The Cloud Functions are returning `403 Forbidden` error because they don't have the correct IAM permissions set. By default, Cloud Functions (2nd gen) require explicit invoker permissions.

## Solution

You need to grant **Cloud Functions Invoker** role to allow authenticated users to call the functions.

### Option 1: Using Firebase Console (Easiest) ✅

1. Go to [Google Cloud Console - Cloud Functions](https://console.cloud.google.com/functions/list?project=pageperfectai)

2. For **each function** (`extractPDF`, `splitContent`, `updateSplitFile`, `deleteImage`, `lockBook`, `unlockBook`):
   
   a. Click on the function name
   
   b. Go to the **PERMISSIONS** tab
   
   c. Click **GRANT ACCESS**
   
   d. In "New principals", enter: `allUsers`
   
   e. In "Role", select: **Cloud Functions Invoker**
   
   f. Click **SAVE**

3. Repeat for all 6 functions

### Option 2: Using gcloud CLI (Faster)

Run these commands in your terminal:

```bash
# Login to gcloud
gcloud auth login

# Set project
gcloud config set project pageperfectai

# Grant invoker permission to all functions
gcloud functions add-iam-policy-binding extractPDF \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/cloudfunctions.invoker

gcloud functions add-iam-policy-binding splitContent \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/cloudfunctions.invoker

gcloud functions add-iam-policy-binding updateSplitFile \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/cloudfunctions.invoker

gcloud functions add-iam-policy-binding deleteImage \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/cloudfunctions.invoker

gcloud functions add-iam-policy-binding lockBook \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/cloudfunctions.invoker

gcloud functions add-iam-policy-binding unlockBook \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/cloudfunctions.invoker
```

### Option 3: One-Line Command (All Functions)

```bash
for func in extractPDF splitContent updateSplitFile deleteImage lockBook unlockBook; do
  gcloud functions add-iam-policy-binding $func \
    --region=us-central1 \
    --member=allUsers \
    --role=roles/cloudfunctions.invoker \
    --project=pageperfectai
done
```

## Security Note

**Q: Is it safe to allow `allUsers`?**

**A: Yes!** Here's why:

1. **Firebase Authentication Still Required:** The functions check `req.auth` to ensure the user is authenticated via Firebase
2. **`allUsers` only means:** Anyone can *invoke* the function (send a request)
3. **The function code validates:** User identity and permissions before processing
4. **This is the standard pattern** for Firebase Callable Functions

Without `allUsers` invoker permission, even authenticated Firebase users can't call the functions!

## Alternative: Allow Only Authenticated Users

If you prefer to be more restrictive, you can allow only authenticated users:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe pageperfectai --format="value(projectNumber)")

# Grant permission to authenticated users only
for func in extractPDF splitContent updateSplitFile deleteImage lockBook unlockBook; do
  gcloud functions add-iam-policy-binding $func \
    --region=us-central1 \
    --member="allAuthenticatedUsers" \
    --role=roles/cloudfunctions.invoker \
    --project=pageperfectai
done
```

However, this might still cause issues with Firebase SDK's automatic token handling.

## Verification

After granting permissions, verify they're set correctly:

```bash
# Check permissions for a function
gcloud functions get-iam-policy extractPDF \
  --region=us-central1 \
  --project=pageperfectai
```

You should see output like:

```yaml
bindings:
- members:
  - allUsers
  role: roles/cloudfunctions.invoker
```

## Test After Fixing

1. **Refresh your browser** (hard refresh: Ctrl+Shift+R)
2. **Go to your project**
3. **Click "Open Editor"** on a book
4. **Click "Start Extraction"**

The 403 error should be gone! ✅

## Why This Happens

Firebase Cloud Functions 2nd Gen (which we're using) have stricter default permissions than 1st Gen. They require explicit IAM permissions to be invoked, even by authenticated users.

This is different from 1st Gen functions which were publicly invokable by default.

## Common Errors

### Error: "403 Forbidden"
**Cause:** Missing invoker permissions  
**Fix:** Grant `roles/cloudfunctions.invoker` as shown above

### Error: "CORS error"
**Cause:** Usually appears alongside 403 when browser can't complete preflight  
**Fix:** Same as above - grant invoker permissions

### Error: "Unauthenticated"
**Cause:** User not logged in to Firebase  
**Fix:** Ensure user is logged in before calling functions

## Documentation

- [Cloud Functions IAM](https://cloud.google.com/functions/docs/securing/managing-access-iam)
- [Firebase Callable Functions](https://firebase.google.com/docs/functions/callable)
- [Cloud Functions 2nd Gen](https://cloud.google.com/functions/docs/2nd-gen/overview)

---

**After applying these permissions, your functions will work! 🎉**

