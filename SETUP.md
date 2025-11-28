# Wrytflow AI - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Then edit `.env` and add your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Where to find these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → Project Settings
4. Scroll down to "Your apps" section
5. Copy the configuration values

**Security Note:** Never commit your `.env` file to version control!

### 3. Start the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

## Initial Setup

### Create a User Account

Since there's no signup page, you need to create users manually in Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `wrytflowai`
3. Navigate to **Authentication** → **Users** tab
4. Click **Add user**
5. Enter email and password
6. Click **Add user**

Now you can login with those credentials!

## How It Works

### User Flow

1. **Login**: Users sign in with email/password
2. **Dashboard**: View all uploaded books
3. **Upload**: Upload a new book manuscript
4. **Track**: Monitor processing status
5. **View Report**: Read the completed analysis

### Book Status Flow

```
pending → processing → completed
```

- **pending**: Book uploaded, waiting for review
- **processing**: Book is being analyzed
- **completed**: Analysis complete, report available

## Developer Guide

### Manually Update Book Status

To simulate the AI processing workflow:

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Go to **Firestore Database**
3. Find the `books` collection
4. Click on a book document
5. Update fields:

#### To mark as processing:
```
status: "processing"
```

#### To mark as completed with report:
```
status: "completed"
reportData: "# Your Markdown Report Here

## Analysis Overview
Your book has been thoroughly analyzed...

## Strengths
- Compelling narrative
- Strong character development

## Recommendations
1. Consider revising chapter 3
2. Add more descriptive language in act 2
"
```

### Report Format

The `reportData` field accepts Markdown format. You can include:

- Headers (`#`, `##`, `###`)
- Bold text (`**bold**`)
- Italic text (`*italic*`)
- Lists (numbered and bulleted)
- Links `[text](url)`
- Code blocks
- Blockquotes
- Tables

Example:
```markdown
# Manuscript Analysis Report

## Executive Summary
This manuscript shows great promise with a compelling narrative arc and well-developed characters.

## Detailed Analysis

### Plot Structure
The three-act structure is well-executed with clear turning points:
- **Act 1**: Strong opening hook
- **Act 2**: Rising tension maintains reader interest
- **Act 3**: Satisfying resolution

### Character Development
**Protagonist**: 
- Shows clear growth arc
- Motivations are well-established
- Could benefit from additional backstory

### Writing Style
- Clear and engaging prose
- Good pacing overall
- Some sections could be tightened

## Recommendations

1. **Chapter 3**: Consider revising the dialogue to feel more natural
2. **Act 2 pacing**: Add more action beats to maintain tension
3. **Character backstory**: Expand on the protagonist's history

## Conclusion
Overall score: 8.5/10

This manuscript is ready for the next stage with minor revisions.
```

## Firebase Structure

### Collections

#### books
```javascript
{
  title: "The Great Novel",
  fileName: "manuscript.pdf",
  fileUrl: "https://storage.googleapis.com/...",
  filePath: "books/userId/timestamp_filename",
  userId: "user-firebase-uid",
  userEmail: "user@example.com",
  status: "pending" | "processing" | "completed" | "failed",
  uploadedAt: "2025-11-04T10:30:00.000Z",
  reportData: "# Markdown content..." | null
}
```

## Security Setup

### Firestore Rules

Add these rules to secure your data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /books/{bookId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      request.auth.token.admin == true);
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /books/{userId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize hosting:
```bash
firebase init hosting
```

Select:
- Use existing project: `wrytflowai`
- Public directory: `build`
- Single-page app: `Yes`
- Automatic builds: `No`

4. Deploy:
```bash
npm run build
firebase deploy --only hosting
```

## Troubleshooting

### "User not found" error
- Make sure the user is created in Firebase Authentication

### Books not showing up
- Check that the user is logged in
- Verify Firestore rules allow read access
- Check browser console for errors

### Upload fails
- Verify Storage rules are correctly configured
- Check file size limits (default: 10MB)
- Ensure user has proper authentication

### Report not displaying
- Ensure `reportData` field contains valid Markdown
- Check that `status` is set to "completed"
- Verify the user has read access to the document

## Support

For issues or questions:
- Email: contact@zryth.com
- Phone: +91-9870661438

## Tech Stack Reference

- **React**: 18.2.0
- **Firebase**: 10.7.1
- **React Router**: 6.20.1
- **React Markdown**: 9.0.1

