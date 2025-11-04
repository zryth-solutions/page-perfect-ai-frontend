# 🔥 Firebase Setup - REQUIRED for Upload to Work

## ⚠️ IMPORTANT: Storage is not working because it needs to be enabled first!

### Step 1: Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pageperfectai**
3. In the left sidebar, click on **Build** → **Storage**
4. Click **Get Started**
5. Click **Next** on the security rules screen
6. Select a Cloud Storage location (choose the one closest to you)
7. Click **Done**

### Step 2: Configure Storage Rules

1. In Firebase Console, go to **Storage** → **Rules** tab
2. Replace the existing rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Books storage - users can read/write their own files
    match /books/{userId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
                    request.auth.uid == userId &&
                    request.resource.size < 50 * 1024 * 1024; // 50MB limit
    }
  }
}
```

3. Click **Publish**

### Step 3: Configure Firestore Rules

1. In Firebase Console, go to **Firestore Database** → **Rules** tab
2. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /books/{bookId} {
      // Users can read their own books
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Users can create books with their own userId
      allow create: if request.auth != null && 
                     request.resource.data.userId == request.auth.uid;
      
      // Users can update their own books, or admins can update any book
      allow update: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      request.auth.token.admin == true);
      
      // Users can delete their own books
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **Publish**

### Step 4: Verify Everything is Set Up

1. **Check Authentication**:
   - Go to **Authentication** → **Sign-in method**
   - Ensure **Email/Password** is **Enabled**

2. **Check Firestore**:
   - Go to **Firestore Database**
   - You should see the database is created

3. **Check Storage**:
   - Go to **Storage**
   - You should see the storage bucket active

### Step 5: Test the Upload

1. Refresh your application at http://localhost:3000
2. Try uploading a book again
3. Open Browser Console (F12) to see detailed logs
4. If there are errors, they will now show specific messages

## Common Issues & Solutions

### Error: "Storage access denied"
- **Solution**: Make sure Storage rules are published (Step 2)

### Error: "storage/unauthorized"
- **Solution**: 
  1. Check that you're logged in
  2. Verify Storage rules allow access for your user
  3. Make sure the bucket name matches in Firebase config

### Error: "storage/unknown" or upload stuck at 0%
- **Solution**: 
  1. Storage might not be enabled - follow Step 1
  2. Check browser console for CORS errors
  3. Try disabling browser extensions

### CORS Error
If you see CORS errors in the console, you need to configure CORS:

1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Run these commands:

```bash
# Create cors.json file
echo '[
  {
    "origin": ["http://localhost:3000", "http://localhost:*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]' > cors.json

# Apply CORS configuration
gsutil cors set cors.json gs://pageperfectai.firebasestorage.app
```

## Quick Checklist

Before upload will work, ensure:

- [ ] Firebase Storage is enabled in Console
- [ ] Storage rules are published
- [ ] Firestore rules are published
- [ ] Email/Password authentication is enabled
- [ ] User account is created
- [ ] User is logged in to the app
- [ ] Browser console shows no errors

## Testing Upload After Setup

1. Login to the app
2. Click "Upload Book"
3. Enter a title and select a file
4. Click "Upload Book"
5. Watch the browser console (F12 → Console) for detailed logs:
   - "Starting upload for: [filename]"
   - "Upload progress: X%"
   - "Upload complete, getting download URL..."
   - "Book saved successfully!"

If you see these logs, it's working! If not, check the error messages.

## Need Help?

Contact: contact@zryth.com or +91-9870661438

