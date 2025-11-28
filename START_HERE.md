# 🚀 Quick Start Guide - PDF Processing & Editing Workflow

## ✅ What's Already Done

### Backend (Cloud Functions)
- ✅ All 6 Cloud Functions created and validated
- ✅ Python dependencies installed
- ✅ MinerU API integration ready
- ✅ Content splitting logic implemented
- ✅ Firebase Storage and Firestore helpers ready

### Frontend (React)
- ✅ All components created and working
- ✅ Services for extraction, splitting, and file operations ready
- ✅ Custom hooks for state management implemented
- ✅ Routing configured
- ✅ UI components styled and responsive

### Firebase Configuration
- ✅ Project selected: `pageperfectai`
- ✅ Firestore rules deployed
- ✅ Storage rules deployed
- ✅ firebase.json configured correctly

## ⚠️ Current Issue: Cloud Functions Deployment

The Cloud Functions code is ready and validated, but deployment failed due to a **permissions issue** with the Cloud Build service account.

### What Happened?
When we tried to deploy the functions, Google Cloud Build couldn't build them because the service account doesn't have the required permissions. This is a common issue with new Firebase projects.

### How to Fix It?

**Please follow the detailed instructions in `DEPLOYMENT_GUIDE.md`**

The quickest fix is:

1. Go to [GCP IAM Console](https://console.cloud.google.com/iam-admin/iam?project=pageperfectai)

2. Find the service account: `270919752365@cloudbuild.gserviceaccount.com`

3. Click the pencil icon to edit it

4. Add these roles:
   - Cloud Build Service Account
   - Cloud Functions Developer
   - Service Account User

5. Click SAVE

6. Then run:
   ```bash
   cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
   firebase deploy --only functions --force
   ```

## 📋 Complete Setup Steps

### Step 1: Fix Cloud Build Permissions ⚠️ REQUIRED
Follow the instructions in `DEPLOYMENT_GUIDE.md` to grant the necessary permissions.

### Step 2: Deploy Cloud Functions
```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
firebase deploy --only functions --force
```

### Step 3: Set MinerU API Key
```bash
firebase functions:config:set mineru.api_key="eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ.eyJqdGkiOiI3OTQwMDE4NCIsInJvbCI6IlJPTEVfUkVHSVNURVIiLCJpc3MiOiJPcGVuWExhYiIsImlhdCI6MTc2MzQ1MTc4MywiY2xpZW50SWQiOiJsa3pkeDU3bnZ5MjJqa3BxOXgydyIsInBob25lIjoiIiwib3BlbklkIjpudWxsLCJ1dWlkIjoiMjY4ZjkxZGEtNjE0Ny00Y2ZhLWI3NjAtNjJkYzdhZDBlN2I2IiwiZW1haWwiOiJtYW5hc0B6cnl0aC5jb20iLCJleHAiOjE3NjQ2NjEzODN9.20nRG36w20Ntxkn44bukRy3o6kV-CYJIt27HAeCF2mUSvwV_81p3dlJ20H971IV-QLhgC1pc19C-CRxkHvMXfw"
```

Then redeploy:
```bash
firebase deploy --only functions --force
```

### Step 4: Install Frontend Dependencies (if not already done)
```bash
npm install
```

### Step 5: Start the Frontend
```bash
npm start
```

The app should open at `http://localhost:3000`

## 🎯 How to Use the Application

### 1. Create a Project
- Go to "My Projects"
- Click "Create New Project"
- Enter project name and description
- Click "Create Project"

### 2. Upload a PDF Book
- Click on your project
- Click "Upload New Book"
- Select a PDF file
- Enter a title
- Click "Upload"

### 3. Open the Editor
- Click "Open Editor" button on the book card
- You'll see three tabs: Extraction, Splitting, and Editor

### 4. Extract PDF Data
- In the "Extraction" tab, click "Start Extraction"
- Wait for MinerU to process the PDF (this may take a few minutes)
- The extracted markdown and images will be stored in Firebase Storage

### 5. Split Content
- After extraction completes, go to the "Splitting" tab
- Click "Start Splitting"
- The content will be automatically split into sections based on the patterns

### 6. Edit Split Files
- Go to the "Editor" tab
- You'll see three panels:
  - **Left:** List of split markdown files
  - **Middle:** Markdown editor with syntax highlighting
  - **Right:** Original PDF for comparison
- Click on any file in the left panel to edit it
- Make your changes in the middle panel
- Click "Save Current File" to save changes

### 7. Manage Images
- Click "View Images" to see all images in the content
- You can delete images that are not needed
- Deleting an image removes it from the markdown content

### 8. Create New Files
- Click "Create New File" in the file explorer
- Enter a filename (e.g., "chapter-1.md")
- Start editing the new file

## 📁 Project Structure

```
page-perfect-ai-frontend/
├── functions/                    # Cloud Functions (Backend)
│   ├── main.py                  # Main Cloud Functions entry point
│   ├── extraction/              # MinerU API integration
│   ├── splitting/               # Content splitting logic
│   ├── utils/                   # Helper functions
│   ├── requirements.txt         # Python dependencies
│   └── venv/                    # Python virtual environment
│
├── src/                         # React Frontend
│   ├── components/
│   │   ├── BookEditor/         # Main editor components
│   │   │   ├── BookEditor.js   # Main container
│   │   │   ├── ExtractionPanel.js
│   │   │   ├── SplittingPanel.js
│   │   │   ├── EditorPanel.js
│   │   │   ├── FileExplorer.js
│   │   │   ├── MarkdownEditor.js
│   │   │   ├── PDFViewer.js
│   │   │   └── ImageGallery.js
│   │   ├── MyProjects.js       # Project management
│   │   └── ProjectBooks.js     # Book management
│   │
│   ├── services/               # API services
│   │   ├── cloudFunctions.js   # Cloud Functions client
│   │   ├── storageService.js   # Firebase Storage
│   │   ├── extractionService.js
│   │   └── splittingService.js
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useBookEditor.js
│   │   ├── useFileOperations.js
│   │   └── useBookLock.js
│   │
│   └── firebase.js             # Firebase config
│
├── firebase.json               # Firebase configuration
├── firestore.rules             # Firestore security rules
├── storage.rules               # Storage security rules
├── .firebaserc                 # Firebase project selection
└── .env                        # Environment variables
```

## 🔧 Environment Variables

Make sure your `.env` file has:

```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=pageperfectai.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=pageperfectai
REACT_APP_FIREBASE_STORAGE_BUCKET=pageperfectai.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## 📚 Documentation Files

- **DEPLOYMENT_GUIDE.md** - Detailed deployment instructions and troubleshooting
- **BOOK_EDITOR_WORKFLOW.md** - Complete technical documentation
- **IMPLEMENTATION_COMPLETE.md** - Summary of all implemented features
- **SETUP_WITH_EXISTING_PROJECT.md** - Detailed setup guide

## ⚠️ Important Notes

1. **Firebase Project:** We're using `pageperfectai` project only
2. **Python Version:** Using Python 3.12 (system default)
3. **MinerU API:** Make sure to set the API key in Cloud Functions config
4. **Billing:** Enable billing on the Firebase project for Cloud Functions to work
5. **Permissions:** The Cloud Build service account needs proper IAM roles

## 🐛 Troubleshooting

### Cloud Functions deployment fails
- Check `DEPLOYMENT_GUIDE.md` for permission fixes
- Ensure billing is enabled
- Verify all required APIs are enabled

### Frontend can't connect to Cloud Functions
- Make sure functions are deployed successfully
- Check Firebase config in `.env`
- Verify you're logged in with `firebase login`

### MinerU extraction fails
- Verify the API key is set correctly
- Check if the PDF is publicly accessible
- Look at Cloud Functions logs: `firebase functions:log`

### Splitting doesn't work
- Check if extraction completed successfully
- Verify the markdown file exists in Storage
- Check the splitting patterns in `patterns_config.py`

## 🎉 Next Steps

Once everything is deployed and running:

1. Test the complete workflow with a sample PDF
2. Adjust splitting patterns if needed (in `functions/splitting/patterns_config.py`)
3. Customize the UI styling to match your brand
4. Add more features as needed

## 📞 Support

If you encounter any issues:
1. Check the documentation files
2. Review Firebase Console logs
3. Check Cloud Functions logs: `firebase functions:log`
4. Review the error messages in the browser console

---

**Current Status:** Ready to deploy after fixing Cloud Build permissions! 🚀
