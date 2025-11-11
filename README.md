# PagePerfect AI Dashboard

Book auditing dashboard built with React and Firebase.

## Features

- Email/Password Authentication
- Book Upload with Firebase Storage
- Admin Panel for uploading markdown reports
- Automatic markdown sync and rendering
- Real-time updates

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

## Firebase Setup

Deploy these rules in Firebase Console to enable uploads:

### Storage Rules (Storage → Rules tab)
Copy from `storage.rules` file

### Firestore Rules (Firestore Database → Rules tab)
Copy from `firestore.rules` file

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
  reportData: string (Markdown) | null,
  markdownFileUrl: string (optional),
  markdownFileName: string (optional),
  processedAt: string (ISO, optional)
}
```

### Storage Structure

```
books/
  └── {userId}/
      ├── {timestamp}_{original_file}.pdf
      └── {timestamp}_{original_file}_report.md
```

## Routes

- `/login` - Authentication
- `/dashboard` - User dashboard
- `/admin` - Admin panel (requires admin custom claim)
- `/book/:id` - View book report

## Setting Admin Users

Use `scripts/setAdminClaim.js` to set admin custom claims

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `npm run eject`
**Note: this is a one-way operation!**

## Structure

- `src/components/` - Login, Dashboard, AdminPanel, BookReport
- `src/hooks/` - useMarkdownSync (auto-sync markdown from Storage)
- `scripts/setAdminClaim.js` - Set admin custom claims

## License

© 2025 PagePerfect AI by Zryth Solutions. All rights reserved.

## Support

For support, email contact@zryth.com or call +91-9870661438

