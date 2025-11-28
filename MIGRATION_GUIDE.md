# Environment Variables Migration Guide

## What Changed?

Firebase configuration credentials have been moved from hardcoded values in `src/firebase.js` to environment variables in `.env` file for better security.

## Before (Old Code)

```javascript
// src/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyDGKbBTG2_yYCnFAeX2TLiO6Bgs3m9xh1k",
  authDomain: "pageperfectai.firebaseapp.com",
  projectId: "pageperfectai",
  // ... hardcoded values
};
```

## After (New Code)

```javascript
// src/firebase.js
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  // ... values from environment variables
};
```

## Benefits

✅ **Security**: Credentials are not exposed in source code
✅ **Flexibility**: Easy to use different configs for dev/staging/prod
✅ **Best Practice**: Follows industry standards for credential management
✅ **Git Safety**: `.env` is gitignored, preventing accidental commits
✅ **Validation**: Automatic checking for missing environment variables

## Files Created/Modified

### New Files
- `.env` - Your actual Firebase credentials (gitignored)
- `.env.example` - Template for team members
- `ENV_SETUP.md` - Detailed setup instructions
- `MIGRATION_GUIDE.md` - This file

### Modified Files
- `src/firebase.js` - Now uses environment variables
- `.gitignore` - Explicitly includes `.env`
- `README.md` - Updated installation instructions
- `SETUP.md` - Updated with environment variable setup

## Migration Steps for Team Members

If you're pulling these changes, follow these steps:

### 1. Pull the Latest Code
```bash
git pull origin main
```

### 2. Create Your .env File
```bash
cp .env.example .env
```

### 3. Get Firebase Credentials
Contact your team lead or get them from Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `pageperfectai`
3. Project Settings → Your apps → Web app config

### 4. Update .env File
Edit `.env` and paste your Firebase configuration values.

### 5. Install Dependencies (if needed)
```bash
npm install
```

### 6. Start Development Server
```bash
npm start
```

## For Existing Developers

Your `.env` file has already been created with the existing credentials. You should:

1. ✅ Verify `.env` exists in your project root
2. ✅ Restart your development server
3. ✅ Test that the app still works
4. ✅ Never commit `.env` to git

## Deployment Updates

### Netlify
Add environment variables in:
**Site Settings → Build & Deploy → Environment**

Add these variables:
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_FIREBASE_MEASUREMENT_ID
```

### Firebase Hosting
No changes needed. The build process will use your local `.env` file.

### Vercel
Add environment variables in:
**Project Settings → Environment Variables**

## Troubleshooting

### App won't start after pulling changes

**Error:** "Missing required environment variables"

**Solution:**
```bash
# Make sure .env file exists
ls -la .env

# If not, create it
cp .env.example .env

# Edit and add your Firebase credentials
nano .env  # or use your preferred editor

# Restart dev server
npm start
```

### Firebase initialization fails

**Solution:**
1. Check `.env` file has all required variables
2. Verify no extra spaces or quotes around values
3. Ensure values match Firebase Console exactly
4. Clear cache and restart:
```bash
rm -rf node_modules/.cache
npm start
```

### Changes to .env not reflecting

**Solution:**
```bash
# Stop dev server (Ctrl+C)
# Restart it
npm start
```

Note: React only reads `.env` on startup, so you must restart after changes.

## Security Reminders

🔒 **NEVER commit `.env` to version control**
🔒 **Don't share `.env` via email or messaging**
🔒 **Use different credentials for dev/prod**
🔒 **Rotate keys if accidentally exposed**

## Rollback (If Needed)

If you need to rollback to hardcoded credentials:

```bash
git revert <commit-hash>
```

Or manually restore the old `src/firebase.js` from git history.

## Questions?

Contact:
- Email: contact@zryth.com
- Phone: +91-9870661438

---

**Migration Date:** November 26, 2025
**Status:** ✅ Complete
