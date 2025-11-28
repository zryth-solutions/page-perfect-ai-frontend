# Firebase Deployment Guide

## Current Status ✅

- ✅ Firebase project selected: `pageperfectai`
- ✅ Firestore rules deployed successfully
- ✅ Storage rules deployed successfully
- ✅ Cloud Functions code validated successfully
- ⚠️ Cloud Functions deployment failed due to permissions

## Issue: Cloud Build Service Account Permissions

The deployment failed because the Cloud Build service account doesn't have the required permissions. This is common with new Firebase projects.

## Solution: Grant Required Permissions

### Option 1: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/project/pageperfectai/overview)

2. Click on the gear icon ⚙️ next to "Project Overview" → **Project settings**

3. Go to the **Service accounts** tab

4. Click on **Google Cloud Platform (GCP) Service Accounts** link

5. This will open the GCP IAM page. Find the service account that looks like:
   ```
   270919752365@cloudbuild.gserviceaccount.com
   ```
   (The number is your project number)

6. Click the **pencil icon** (Edit) next to this service account

7. Click **+ ADD ANOTHER ROLE** and add these roles:
   - `Cloud Build Service Account`
   - `Cloud Functions Developer`
   - `Service Account User`
   - `Storage Admin` (if not already present)

8. Click **SAVE**

### Option 2: Using gcloud CLI

Run these commands in your terminal:

```bash
# Set your project
gcloud config set project pageperfectai

# Grant the required roles
PROJECT_NUMBER="270919752365"
gcloud projects add-iam-policy-binding pageperfectai \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding pageperfectai \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/cloudfunctions.developer"

gcloud projects add-iam-policy-binding pageperfectai \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### Option 3: Enable Billing (If Not Already Enabled)

Sometimes this error occurs because billing is not enabled for the project:

1. Go to [Google Cloud Console](https://console.cloud.google.com/billing/projects)
2. Select your project `pageperfectai`
3. Link a billing account to the project
4. Note: Firebase has a generous free tier, so you won't be charged unless you exceed the limits

## After Fixing Permissions

Once you've granted the permissions, try deploying again:

```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
firebase deploy --only functions
```

## Alternative: Deploy with Force Flag

If you want to skip the cleanup policy warning, you can use:

```bash
firebase deploy --only functions --force
```

## Verify Deployment

After successful deployment, you should see:

```
✔  functions[deleteImage(us-central1)] Successful create operation.
✔  functions[extractPDF(us-central1)] Successful create operation.
✔  functions[lockBook(us-central1)] Successful create operation.
✔  functions[splitContent(us-central1)] Successful create operation.
✔  functions[unlockBook(us-central1)] Successful create operation.
✔  functions[updateSplitFile(us-central1)] Successful create operation.

✔  Deploy complete!
```

## Next Steps After Successful Deployment

1. **Set Environment Variables for Cloud Functions:**
   ```bash
   firebase functions:config:set mineru.api_key="YOUR_MINERU_API_KEY"
   ```

2. **Redeploy to apply the config:**
   ```bash
   firebase deploy --only functions
   ```

3. **Start the Frontend:**
   ```bash
   npm start
   ```

4. **Test the Workflow:**
   - Create a project
   - Upload a PDF book
   - Click "Open Editor"
   - Start extraction
   - Wait for splitting
   - Edit the split files

## Troubleshooting

### If you get "APIs not enabled" errors:

The following APIs need to be enabled (Firebase CLI should do this automatically):
- Cloud Functions API
- Cloud Build API
- Artifact Registry API
- Cloud Run API
- Eventarc API

You can manually enable them at:
https://console.cloud.google.com/apis/library?project=pageperfectai

### If you get "quota exceeded" errors:

Check your project quotas at:
https://console.cloud.google.com/iam-admin/quotas?project=pageperfectai

### If functions are deployed but not working:

Check the logs:
```bash
firebase functions:log
```

Or view them in the console:
https://console.cloud.google.com/functions/list?project=pageperfectai

## Important Notes

- The Cloud Functions are deployed to `us-central1` region
- Each function has a timeout of 540 seconds (9 minutes)
- Memory allocated: 512MB per function
- All functions require authentication (Firebase Auth)
- The MinerU API key needs to be set via environment variables

## Cost Considerations

- **Firestore:** Free tier includes 50K reads, 20K writes, 20K deletes per day
- **Storage:** Free tier includes 5GB storage, 1GB download per day
- **Cloud Functions:** Free tier includes 2M invocations, 400K GB-seconds per month
- **MinerU API:** Check your MinerU subscription for rate limits and costs

For most development and small-scale production use, you should stay within the free tier.

## Support

If you continue to have issues:
1. Check the [Firebase documentation](https://firebase.google.com/docs/functions)
2. View the [Cloud Build troubleshooting guide](https://cloud.google.com/functions/docs/troubleshooting#build-service-account)
3. Check the Firebase Console for detailed error messages

