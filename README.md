# PagePerfect AI Dashboard

Professional AI book auditing and content quality solutions dashboard built with React and Firebase.

## Features

- **Email/Password Authentication**: Secure login system using Firebase Auth
- **Book Upload**: Upload manuscripts for AI-powered review
- **Status Tracking**: Monitor the processing status of your books
- **Report Viewing**: View comprehensive analysis reports rendered from Markdown
- **Real-time Updates**: Automatic updates when book status changes

## Tech Stack

- **Frontend**: React 18
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Styling**: Custom CSS with modern design
- **Routing**: React Router v6
- **Markdown Rendering**: React Markdown

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Firebase Configuration

The application is pre-configured with Firebase credentials. The following services are used:

- **Firebase Authentication**: Email/password sign-in
- **Cloud Firestore**: Store book metadata and reports
- **Cloud Storage**: Store uploaded book files

### Firestore Structure

**books** collection:
```javascript
{
  title: string,
  fileName: string,
  fileUrl: string,
  filePath: string,
  userId: string,
  userEmail: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  uploadedAt: string (ISO),
  reportData: string (Markdown) | null
}
```

## Development Workflow

### For Users:
1. Sign in with email and password
2. Upload a book from the dashboard
3. Monitor the status (pending → processing → completed)
4. View the report once completed

### For Developers:
To manually update a book's status and add a report:

1. Go to Firebase Console → Firestore Database
2. Find the book document in the `books` collection
3. Update the `status` field to `'processing'` or `'completed'`
4. Add the report content to the `reportData` field in Markdown format

Example Markdown report:
```markdown
# Book Analysis Report

## Overview
This is a comprehensive analysis of your manuscript...

## Strengths
- Engaging narrative
- Well-developed characters

## Areas for Improvement
- Pacing in chapter 3
- Character development in Act 2

## Recommendations
1. Revise the opening scene
2. Add more dialogue
```

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `npm run eject`
**Note: this is a one-way operation!**

## Project Structure

```
src/
├── components/
│   ├── Login.js          # Login page
│   ├── Login.css
│   ├── Dashboard.js      # Main dashboard with book list
│   ├── Dashboard.css
│   ├── BookReport.js     # Book report viewer
│   └── BookReport.css
├── firebase.js           # Firebase configuration
├── App.js               # Main app component with routing
├── App.css              # Global styles
├── index.js             # App entry point
└── index.css
```

## Design System

The application uses a modern dark theme with blue/purple gradient accents matching the [PagePerfect AI landing page](https://pageperfectai.zryth.com/).

### Color Palette
- Primary Blue: `#6366f1`
- Primary Purple: `#8b5cf6`
- Dark Background: `#0f172a`
- Card Background: `#1e293b`
- Text Primary: `#f1f5f9`
- Text Secondary: `#94a3b8`

## Security Notes

- Authentication is required for all dashboard routes
- File uploads are scoped to authenticated users
- Firestore security rules should be configured to restrict access
- Users can only view their own books

## License

© 2025 PagePerfect AI by Zryth Solutions. All rights reserved.

## Support

For support, email contact@zryth.com or call +91-9870661438

