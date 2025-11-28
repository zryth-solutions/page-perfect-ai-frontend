# 🚀 Quick Command Reference

## Essential Commands for Deployment

### 1. Fix Permissions (Do This First!)

Go to: https://console.cloud.google.com/iam-admin/iam?project=pageperfectai

Find and edit service account: `270919752365@cloudbuild.gserviceaccount.com`

Add these roles:
- Cloud Build Service Account
- Cloud Functions Developer  
- Service Account User

**OR** use gcloud CLI:

```bash
gcloud config set project pageperfectai

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

---

### 2. Deploy Cloud Functions

```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
firebase deploy --only functions --force
```

---

### 3. Set MinerU API Key

```bash
firebase functions:config:set mineru.api_key="eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ.eyJqdGkiOiI3OTQwMDE4NCIsInJvbCI6IlJPTEVfUkVHSVNURVIiLCJpc3MiOiJPcGVuWExhYiIsImlhdCI6MTc2MzQ1MTc4MywiY2xpZW50SWQiOiJsa3pkeDU3bnZ5MjJqa3BxOXgydyIsInBob25lIjoiIiwib3BlbklkIjpudWxsLCJ1dWlkIjoiMjY4ZjkxZGEtNjE0Ny00Y2ZhLWI3NjAtNjJkYzdhZDBlN2I2IiwiZW1haWwiOiJtYW5hc0B6cnl0aC5jb20iLCJleHAiOjE3NjQ2NjEzODN9.20nRG36w20Ntxkn44bukRy3o6kV-CYJIt27HAeCF2mUSvwV_81p3dlJ20H971IV-QLhgC1pc19C-CRxkHvMXfw"
```

Then redeploy:

```bash
firebase deploy --only functions --force
```

---

### 4. Start Frontend

```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
npm start
```

---

## Useful Commands

### Firebase

```bash
# Login to Firebase
firebase login

# List projects
firebase projects:list

# Select project
firebase use pageperfectai

# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only rules
firebase deploy --only firestore:rules,storage

# View function logs
firebase functions:log

# View function config
firebase functions:config:get

# Delete function config
firebase functions:config:unset mineru.api_key
```

### NPM

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Check for linting errors
npm run lint
```

### Git

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main
```

### Python (Cloud Functions)

```bash
# Navigate to functions directory
cd functions

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Deactivate virtual environment
deactivate
```

---

## Troubleshooting Commands

### Check Firebase Project

```bash
firebase projects:list
firebase use
```

### Check Python Version

```bash
python3 --version
python3.12 --version
```

### Check Node Version

```bash
node --version
npm --version
```

### Check Firebase CLI Version

```bash
firebase --version
```

### View Cloud Functions Logs

```bash
# All logs
firebase functions:log

# Specific function
firebase functions:log --only extractPDF

# Last N entries
firebase functions:log --limit 50
```

### Test Firebase Connection

```bash
firebase projects:list
firebase use pageperfectai
firebase firestore:indexes
```

---

## Quick Fixes

### If deployment fails with "No project active"

```bash
firebase use pageperfectai
```

### If "command not found: firebase"

```bash
npm install -g firebase-tools
```

### If Python dependencies are missing

```bash
cd functions
source venv/bin/activate
pip install -r requirements.txt
```

### If frontend won't start

```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

### If functions won't deploy

```bash
cd functions
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
firebase deploy --only functions --force
```

---

## Environment Setup

### Create .env file (if missing)

```bash
cat > .env << 'EOF'
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=pageperfectai.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=pageperfectai
REACT_APP_FIREBASE_STORAGE_BUCKET=pageperfectai.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
EOF
```

### Verify Firebase Config

```bash
cat firebase.json
cat .firebaserc
```

---

## Testing Commands

### Test Cloud Function Locally (if needed)

```bash
cd functions
source venv/bin/activate
python main.py
```

### Test Frontend Build

```bash
npm run build
```

### Check for Linting Errors

```bash
npm run lint
```

---

## Monitoring & Logs

### Firebase Console Links

- **Project Overview:** https://console.firebase.google.com/project/pageperfectai/overview
- **Firestore:** https://console.firebase.google.com/project/pageperfectai/firestore
- **Storage:** https://console.firebase.google.com/project/pageperfectai/storage
- **Functions:** https://console.firebase.google.com/project/pageperfectai/functions
- **Authentication:** https://console.firebase.google.com/project/pageperfectai/authentication

### GCP Console Links

- **IAM:** https://console.cloud.google.com/iam-admin/iam?project=pageperfectai
- **Cloud Build:** https://console.cloud.google.com/cloud-build/builds?project=pageperfectai
- **APIs:** https://console.cloud.google.com/apis/dashboard?project=pageperfectai

---

## Complete Deployment Sequence

```bash
# 1. Navigate to project
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend

# 2. Ensure Firebase project is selected
firebase use pageperfectai

# 3. Deploy Cloud Functions
firebase deploy --only functions --force

# 4. Set MinerU API key
firebase functions:config:set mineru.api_key="YOUR_KEY_HERE"

# 5. Redeploy to apply config
firebase deploy --only functions

# 6. Start frontend
npm start
```

---

## One-Line Deployment (After Permissions Fixed)

```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend && firebase use pageperfectai && firebase deploy --only functions --force && firebase functions:config:set mineru.api_key="eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ.eyJqdGkiOiI3OTQwMDE4NCIsInJvbCI6IlJPTEVfUkVHSVNURVIiLCJpc3MiOiJPcGVuWExhYiIsImlhdCI6MTc2MzQ1MTc4MywiY2xpZW50SWQiOiJsa3pkeDU3bnZ5MjJqa3BxOXgydyIsInBob25lIjoiIiwib3BlbklkIjpudWxsLCJ1dWlkIjoiMjY4ZjkxZGEtNjE0Ny00Y2ZhLWI3NjAtNjJkYzdhZDBlN2I2IiwiZW1haWwiOiJtYW5hc0B6cnl0aC5jb20iLCJleHAiOjE3NjQ2NjEzODN9.20nRG36w20Ntxkn44bukRy3o6kV-CYJIt27HAeCF2mUSvwV_81p3dlJ20H971IV-QLhgC1pc19C-CRxkHvMXfw" && firebase deploy --only functions && npm start
```

---

**Pro Tip:** Bookmark this file for quick reference! 🔖

