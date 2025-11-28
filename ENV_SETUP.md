# Environment Variables Setup Guide

## Overview

This project uses environment variables to securely store Firebase configuration credentials. This approach keeps sensitive information out of the codebase and allows for different configurations across development, staging, and production environments.

## Quick Setup

### 1. Copy the Example File

```bash
cp .env.example .env
```

### 2. Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project Settings"
5. Scroll down to "Your apps" section
6. If you haven't added a web app yet:
   - Click "Add app" and select the web icon (</>)
   - Register your app with a nickname
7. Copy the configuration object

### 3. Fill in Your .env File

Open `.env` and replace the placeholder values:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Restart Your Development Server

After updating `.env`, restart your development server:

```bash
npm start
```

## Environment Variables Explained

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_FIREBASE_API_KEY` | Your Firebase API key | Yes |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain | Yes |
| `REACT_APP_FIREBASE_PROJECT_ID` | Your Firebase project ID | Yes |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket URL | Yes |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging sender ID | Yes |
| `REACT_APP_FIREBASE_APP_ID` | Your Firebase app ID | Yes |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID | No |

## Security Best Practices

### ✅ DO:
- Keep `.env` file in `.gitignore` (already configured)
- Use `.env.example` as a template for team members
- Use different Firebase projects for development and production
- Rotate API keys if they are accidentally exposed
- Use Firebase App Check for additional security

### ❌ DON'T:
- Commit `.env` file to version control
- Share your `.env` file via email or messaging
- Use production credentials in development
- Hardcode credentials in your code
- Push `.env` to public repositories

## Multiple Environments

### Development
Use `.env` for local development (already set up)

### Production
For production builds, set environment variables in your hosting platform:

#### Netlify
1. Go to Site Settings → Build & Deploy → Environment
2. Add each variable (without the file)

#### Vercel
1. Go to Project Settings → Environment Variables
2. Add each variable for Production environment

#### Firebase Hosting
Create `.env.production`:
```bash
# Production environment variables
REACT_APP_FIREBASE_API_KEY=your_production_key
# ... other production values
```

Then build with:
```bash
npm run build
```

## Troubleshooting

### Error: "Missing required environment variables"

**Solution:** Make sure all required variables are set in your `.env` file and restart your dev server.

### Changes to .env not reflecting

**Solution:** 
1. Stop your development server (Ctrl+C)
2. Clear the cache: `rm -rf node_modules/.cache`
3. Restart: `npm start`

### Firebase initialization fails

**Solution:**
1. Verify all values in `.env` match your Firebase Console
2. Check for extra spaces or quotes in `.env` values
3. Ensure you're using the correct Firebase project

### Variables showing as undefined

**Solution:**
- All React environment variables MUST start with `REACT_APP_`
- Restart your development server after adding new variables

## Validation

The app includes automatic validation of environment variables. If any required variables are missing, you'll see an error message in the console with details about which variables are missing.

## Getting Help

If you encounter issues:
1. Check that `.env` file exists in the project root
2. Verify all required variables are present
3. Ensure no typos in variable names
4. Check Firebase Console for correct values
5. Review browser console for specific error messages

## Support

For additional help:
- Email: contact@zryth.com
- Phone: +91-9870661438
