# 🔥 Firebase Project Setup Required

## ⚠️ Important: Create `pageperfectai` Firebase Project

The project is configured to use **`pageperfectai`** as the Firebase project ID, but this project doesn't exist in your Firebase account yet.

---

## 📋 Step-by-Step Setup

### Step 1: Create Firebase Project

1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: **`Page Perfect AI`** (or any display name you prefer)
4. **Important:** The Project ID should be **`pageperfectai`**
   - If it's taken, Firebase will suggest alternatives like `pageperfectai-1`, `pageperfectai-2`, etc.
   - If you use a different ID, you'll need to update `.firebaserc` and `.env` files
5. Enable/Disable Google Analytics (your choice)
6. Click **"Create project"**

### Step 2: Enable Required Services

Once the project is created:

#### A. Enable Firestore Database
1. In Firebase Console, go to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we have custom rules)
4. Select a location (choose closest to your users)
5. Click **"Enable"**

#### B. Enable Firebase Storage
1. Go to **Build → Storage**
2. Click **"Get started"**
3. Use default security rules (we have custom rules)
4. Use same location as Firestore
5. Click **"Done"**

#### C. Enable Authentication
1. Go to **Build → Authentication**
2. Click **"Get started"**
3. Enable **"Email/Password"** sign-in method
4. Click **"Save"**

#### D. Enable Cloud Functions (Required for Backend)
1. Go to **Build → Functions**
2. Click **"Get started"**
3. Click **"Upgrade project"** (Functions require Blaze plan)
4. **⚠️ Important:** You need to enable billing for Cloud Functions
   - Don't worry: Firebase has generous free tier
   - Functions: 2M invocations/month free
   - You'll only pay for what you use beyond free tier

### Step 3: Update Your Local Configuration

#### If Project ID is `pageperfectai` (exact match):
```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
firebase use pageperfectai
```

#### If Project ID is different (e.g., `pageperfectai-1`):

1. **Update `.firebaserc`:**
```json
{
  "projects": {
    "default": "pageperfectai-1"  // Use your actual project ID
  }
}
```

2. **Update `.env`:**
```env
REACT_APP_FIREBASE_PROJECT_ID=pageperfectai-1  // Use your actual project ID
```

3. **Set active project:**
```bash
firebase use pageperfectai-1  // Use your actual project ID
```

### Step 4: Deploy Firestore & Storage Rules

```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
firebase deploy --only firestore:rules,storage:rules
```

### Step 5: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ → **Project Settings**
2. Scroll down to **"Your apps"** section
3. Click **Web icon** (</>) to add a web app
4. Register app name: **"Page Perfect AI Frontend"**
5. Copy the configuration values
6. Update your `.env` file with these values:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=pageperfectai.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=pageperfectai
REACT_APP_FIREBASE_STORAGE_BUCKET=pageperfectai.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Step 6: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

**Note:** This may take 5-10 minutes for the first deployment.

---

## 🎯 Current Status

- ✅ Frontend code is ready
- ✅ All compilation errors fixed
- ✅ Cloud Functions code is ready
- ⏳ **Waiting for Firebase project setup**

---

## 📝 Quick Reference

### Your Firebase Projects
```
Available projects:
- booking-cab-8d8d5 (for cab booking app)
- cabbookr (for cab booking app)

Need to create:
- pageperfectai (for THIS project - Page Perfect AI)
```

### Important Files
```
.firebaserc          → Firebase project configuration
.env                 → Firebase credentials
firebase.json        → Firebase services configuration
firestore.rules      → Database security rules
storage.rules        → Storage security rules
```

---

## ⚠️ Important Notes

1. **Don't mix projects:** Keep Page Perfect AI separate from cab booking projects
2. **Billing required:** Cloud Functions need Blaze (pay-as-you-go) plan
3. **Free tier:** You get 2M function invocations/month free
4. **MinerU costs:** Separate from Firebase, check https://mineru.net/ for pricing

---

## 🆘 If You Can't Create `pageperfectai` Project ID

If the project ID `pageperfectai` is already taken globally, Firebase will suggest alternatives:

### Option A: Use Suggested ID
Firebase might suggest: `pageperfectai-1`, `pageperfectai-2`, etc.

**Update these files:**
1. `.firebaserc` → Change project ID
2. `.env` → Change `REACT_APP_FIREBASE_PROJECT_ID`

### Option B: Use Different Name
Choose a different project ID like: `page-perfect-ai`, `pageperfect-ai`, etc.

**Update these files:**
1. `.firebaserc` → Change project ID
2. `.env` → Change `REACT_APP_FIREBASE_PROJECT_ID`

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] Storage enabled
- [ ] Authentication enabled
- [ ] Billing enabled (for Functions)
- [ ] `.firebaserc` has correct project ID
- [ ] `.env` has correct Firebase config
- [ ] Rules deployed: `firebase deploy --only firestore:rules,storage:rules`
- [ ] Functions deployed: `firebase deploy --only functions`
- [ ] App runs: `npm start`

---

## 🚀 Once Setup is Complete

Run these commands:
```bash
# 1. Set active project
firebase use pageperfectai  # or your actual project ID

# 2. Deploy rules
firebase deploy --only firestore:rules,storage:rules

# 3. Deploy functions
firebase deploy --only functions

# 4. Start app
npm start
```

---

**Next Step:** Create the `pageperfectai` Firebase project in the console, then come back here! 🎯

