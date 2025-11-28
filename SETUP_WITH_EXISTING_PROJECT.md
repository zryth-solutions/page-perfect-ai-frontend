# 🔧 Setup with Existing Firebase Project

## ✅ Situation

- Firebase project `pageperfectai` already exists
- Created by different account
- You (`manas@zryth.com`) have been given access
- Need to connect your local environment to this project

---

## 🚀 Setup Steps

### Step 1: Login to Firebase CLI with Your Account

```bash
# Logout from current account (if any)
firebase logout

# Login with manas@zryth.com
firebase login
```

This will:
1. Open browser for authentication
2. Login with **manas@zryth.com**
3. Grant Firebase CLI access

---

### Step 2: Verify Project Access

```bash
# List all projects you have access to
firebase projects:list
```

You should now see `pageperfectai` in the list.

---

### Step 3: Set Active Project

```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend

# Set pageperfectai as active project
firebase use pageperfectai
```

This will update `.firebaserc` automatically.

---

### Step 4: Verify Firebase Configuration

Check if your `.env` file has the correct Firebase config for `pageperfectai`:

```bash
cat .env
```

**Required variables:**
```env
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=pageperfectai.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=pageperfectai
REACT_APP_FIREBASE_STORAGE_BUCKET=pageperfectai.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=...
```

**If missing or incorrect:**
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select `pageperfectai` project
3. Click gear icon ⚙️ → Project Settings
4. Scroll to "Your apps" → Web app
5. Copy configuration values
6. Update `.env` file

---

### Step 5: Check Your Permissions

You need these permissions to deploy Cloud Functions:

**Required Roles:**
- ✅ **Editor** or **Owner** role on the project
- ✅ **Cloud Functions Admin** (for deploying functions)
- ✅ **Service Account User** (for functions deployment)

**To check your role:**
1. Go to Firebase Console
2. Select `pageperfectai` project
3. Click gear icon ⚙️ → Project Settings → Users and permissions
4. Find `manas@zryth.com` and check your role

**If you don't have sufficient permissions:**
- Ask the project owner to grant you **Editor** or **Owner** role
- Or at minimum: **Cloud Functions Admin** + **Service Account User**

---

### Step 6: Verify Services are Enabled

Check if these services are already enabled in the Firebase project:

#### A. Firestore Database
```bash
firebase firestore:databases:list
```

If not enabled:
1. Go to Firebase Console → Build → Firestore Database
2. Click "Create database"
3. Production mode → Choose location → Enable

#### B. Storage
Check in Firebase Console → Build → Storage

If not enabled:
1. Click "Get started"
2. Default rules → Same location → Done

#### C. Authentication
Check in Firebase Console → Build → Authentication

If not enabled:
1. Click "Get started"
2. Enable Email/Password method

#### D. Functions (Requires Billing)
Check in Firebase Console → Build → Functions

**⚠️ Important:** Cloud Functions require **Blaze (pay-as-you-go)** plan.

If not enabled:
1. Click "Get started"
2. Upgrade to Blaze plan
3. Free tier: 2M invocations/month

---

### Step 7: Deploy Firestore & Storage Rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

This deploys:
- `firestore.rules` - Database security rules
- `storage.rules` - Storage security rules

---

### Step 8: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

**This will deploy 6 Cloud Functions:**
1. `extractPDF` - PDF extraction via MinerU
2. `splitContent` - Content splitting
3. `updateSplitFile` - File updates
4. `deleteImage` - Image deletion
5. `lockBook` - Acquire editing lock
6. `unlockBook` - Release editing lock

**Deployment time:** 5-10 minutes (first time)

**Note:** If deployment fails with "billing required", you need to upgrade to Blaze plan.

---

### Step 9: Start Development Server

```bash
npm start
```

App opens at: **http://localhost:3000**

---

## 🔐 Authentication Setup

### Create Your User Account

Since you're using `manas@zryth.com`:

1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Email: `manas@zryth.com`
4. Password: (choose a password)
5. Click "Add user"

Now you can login to the app!

---

## 🧪 Testing the Complete Workflow

### 1. Login
- Open app at http://localhost:3000
- Login with `manas@zryth.com`

### 2. Create Project
- Go to Projects
- Click "Create Project"
- Enter name and description
- Click "Create"

### 3. Upload Book
- Open the project
- Click "Upload Book"
- Select a PDF file
- Enter title
- Click "Upload"

### 4. Open Editor
- Click "Open Editor" button on the uploaded book
- You'll see the BookEditor screen

### 5. Extract PDF
- In "Extraction" tab
- Click "Start Extraction"
- Wait 2-5 minutes (MinerU API processing)
- Status updates in real-time

### 6. Content Splitting
- Automatically triggered after extraction
- Wait 30-60 seconds
- 19 files will be created

### 7. Edit Files
- Switch to "Editor" tab
- Click "Start Editing" to acquire lock
- Select a file from sidebar
- Edit markdown content
- View PDF on the right
- Click "Save"

---

## 🐛 Troubleshooting

### Issue: "firebase login" doesn't work
**Solution:**
```bash
firebase login --no-localhost
```
Follow the URL and paste the token.

### Issue: "Permission denied" when deploying
**Solution:**
- Ask project owner to grant you **Editor** role
- Or grant specific permissions: Cloud Functions Admin + Service Account User

### Issue: "Billing required" error
**Solution:**
- Go to Firebase Console → Upgrade to Blaze plan
- Don't worry: Free tier is generous (2M function calls/month)

### Issue: Functions deployment fails
**Solution:**
```bash
# Check Python version
python3 --version  # Should be 3.11+

# Install dependencies locally to test
cd functions
pip3 install -r requirements.txt
cd ..

# Try deploying again
firebase deploy --only functions
```

### Issue: MinerU API errors
**Solution:**
- Check `functions/.env` has correct token
- Verify token at https://mineru.net/
- Check API quota/limits

---

## 📊 What's Already Configured

### In Your Codebase
- ✅ `.firebaserc` → Points to `pageperfectai`
- ✅ `.env` → Has `REACT_APP_FIREBASE_PROJECT_ID=pageperfectai`
- ✅ `functions/.env` → Has MinerU API token
- ✅ `firebase.json` → Functions configured
- ✅ All code complete and error-free

### What You Need to Do
- ⏳ Login with `manas@zryth.com`
- ⏳ Verify project access
- ⏳ Deploy rules and functions
- ⏳ Test the workflow

---

## 🎯 Quick Command Reference

```bash
# 1. Login with your account
firebase logout
firebase login

# 2. Verify access
firebase projects:list
# Should show: pageperfectai

# 3. Set active project
firebase use pageperfectai

# 4. Deploy rules
firebase deploy --only firestore:rules,storage:rules

# 5. Deploy functions
firebase deploy --only functions

# 6. Start app
npm start
```

---

## ✅ Success Criteria

After completing setup, you should be able to:
- ✅ Login to the app
- ✅ Create projects
- ✅ Upload PDFs
- ✅ Click "Open Editor"
- ✅ Extract PDFs (MinerU)
- ✅ Split content (19 files)
- ✅ Edit markdown files
- ✅ View PDF side-by-side
- ✅ Save changes

---

## 📞 If You Need Help

1. Check Firebase Console for your role/permissions
2. Verify all services are enabled
3. Check Firebase Functions logs for errors
4. Review `BOOK_EDITOR_WORKFLOW.md` for detailed workflow

---

**Status:** ✅ Code Ready | ⏳ Waiting for Firebase Login & Deployment

**Next Command:** `firebase logout && firebase login`

🚀 **Let's get this running!**

