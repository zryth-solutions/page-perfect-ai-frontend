# 🚀 Quick Start - Environment Variables

## For New Team Members

```bash
# 1. Clone and install
git clone <repository-url>
cd page-perfect-ai-frontend
npm install

# 2. Set up environment variables
cp .env.example .env

# 3. Edit .env with your Firebase credentials
nano .env  # or use your preferred editor

# 4. Start development
npm start
```

## For Existing Developers (After Pulling This Update)

```bash
# Your .env file is already created!
# Just restart your dev server
npm start
```

## Environment Variables Needed

Copy these from Firebase Console → Project Settings → Your apps:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Common Issues

### "Missing required environment variables"
**Fix:** Make sure `.env` file exists and has all variables

### Changes not reflecting
**Fix:** Restart dev server (Ctrl+C, then `npm start`)

### Firebase initialization fails
**Fix:** Double-check values in `.env` match Firebase Console exactly

## 📚 Full Documentation

- **ENV_SETUP.md** - Detailed setup instructions
- **MIGRATION_GUIDE.md** - Migration from old setup
- **CHECKLIST.md** - Pre-deployment checklist
- **ENVIRONMENT_VARIABLES_SUMMARY.md** - Complete overview

## 🔒 Security Reminder

**NEVER commit `.env` to git!** It's already in `.gitignore`.

## 📞 Need Help?

- Email: contact@zryth.com
- Phone: +91-9870661438

---

**That's it!** You're ready to develop. 🎉
