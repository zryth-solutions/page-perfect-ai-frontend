# 🧪 Test Instructions - Start Here!

## ✅ All Changes Complete

I've completed all the requested changes:
1. ✅ Tested split function locally
2. ✅ Fixed CORS error for Firebase Storage
3. ✅ Changed editor to show full.md instead of PDF
4. ✅ Auto-trigger split after extraction (already implemented)
5. ✅ Deployed storage rules

---

## 🚀 Quick Start

### Start the Frontend
```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
npm start
```

The app will open at `http://localhost:3000`

---

## 🧪 Test the Complete Flow

### Step 1: Navigate to a Book
1. Login to your app
2. Go to a project
3. Click on a book (or upload a new PDF)
4. Click **"Open Editor"** button

### Step 2: Start Extraction
1. You'll see the **Extraction** tab
2. Click **"Start Extraction"** (or "Restart Extraction")
3. Wait 2-5 minutes (watch the status)
4. Should show "Extraction Completed" ✅

### Step 3: Automatic Splitting
1. After extraction completes, splitting **automatically starts**
2. Tab switches to **Splitting**
3. Wait 5-10 seconds
4. Should show "Splitting Completed" ✅

### Step 4: Test the Editor
1. Tab switches to **Editor**
2. **Left Panel:** List of split files (click to open)
3. **Center Panel:** Markdown editor (edit content)
4. **Right Panel:** Full.md viewer (NEW! 📄)

### Step 5: Test Full.md Viewer (NEW!)
In the right panel, you should see:
- 📄 Full extracted markdown content
- 🔍 Search box (try searching for text)
- 📋 Copy buttons (copy all or copy selection)
- ✅ No CORS errors!

### Step 6: Test Split File Loading
1. Click on any file in the left panel
2. Should load **without CORS error** (FIXED!)
3. Content appears in center editor
4. You can edit and save

---

## ✅ What to Check

### CORS Error Fixed?
**Before:** Files wouldn't load, CORS error in console  
**After:** Files load perfectly ✅

**How to verify:**
1. Open browser console (F12)
2. Click on a split file
3. Should see NO CORS errors

### Full.md Viewer Working?
**Features to test:**
- [ ] Full.md displays in right panel
- [ ] Search box works
- [ ] "Copy all" button works
- [ ] "Copy selection" button works (select text first)
- [ ] Content is readable and formatted

### Auto-Split Working?
**Expected behavior:**
1. Extraction completes
2. Splitting tab activates automatically
3. Splitting starts immediately
4. No manual button click needed

---

## 🐛 If Something Goes Wrong

### CORS Error Still Appears
```bash
# Re-apply CORS configuration
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
gsutil cors set cors.json gs://pageperfectai.firebasestorage.app
```

### Full.md Not Loading
**Check:**
1. Does the book have `extraction.fullMdPath` in Firestore?
2. Does the file exist in Storage at `books/{bookId}/extracted/full.md`?
3. Any errors in browser console?

### Split Files Not Loading
**Check:**
1. Did splitting complete successfully?
2. Do files exist in Storage at `books/{bookId}/splits/`?
3. Check browser console for errors

### View Logs
```bash
# View extraction logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" --limit=50 --format="value(textPayload)" --project=pageperfectai

# View split logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=splitcontent" --limit=50 --format="value(textPayload)" --project=pageperfectai
```

---

## 📸 What You Should See

### Extraction Tab
```
┌─────────────────────────────────────┐
│ Status: Extraction Completed ✅     │
│                                     │
│ ✓ Content extracted successfully   │
│ Markdown and images are ready      │
│                                     │
│ [Restart Extraction]               │
└─────────────────────────────────────┘
```

### Splitting Tab
```
┌─────────────────────────────────────┐
│ Status: Splitting Completed ✅      │
│                                     │
│ ✓ Content split successfully       │
│ Created 15 files                   │
│                                     │
│ [Proceed to Editor]                │
└─────────────────────────────────────┘
```

### Editor Tab (NEW LAYOUT!)
```
┌─────────────┬──────────────────┬──────────────────┐
│ Files       │ Editor           │ full.md (NEW!)   │
│             │                  │                  │
│ Questions/  │ # Content        │ [Search: ____]   │
│ ├─ Q1.md    │                  │ [📋] [📋]        │
│ ├─ Q2.md    │ Edit here...     │                  │
│             │                  │ Full markdown    │
│ Keys/       │                  │ content for      │
│ ├─ K1.md    │                  │ reference...     │
│             │                  │                  │
│ Answers/    │                  │ (scrollable)     │
│ ├─ A1.md    │                  │                  │
└─────────────┴──────────────────┴──────────────────┘
```

---

## 📊 Expected Results

### ✅ Success Criteria
- [ ] Extraction completes without errors
- [ ] Splitting triggers automatically
- [ ] Split files appear in left panel
- [ ] Files load without CORS errors
- [ ] Full.md displays in right panel
- [ ] Can search in full.md
- [ ] Can copy from full.md
- [ ] Can edit and save files

### ❌ Failure Indicators
- CORS errors in console
- Full.md doesn't load
- Split files don't appear
- Can't open split files
- Search doesn't work

---

## 📝 Report Template

Please copy and fill this out:

```
## Test Results

### Extraction
- Status: ✅ / ❌
- Time taken: ___ minutes
- Errors: None / [describe]

### Splitting
- Auto-triggered: ✅ / ❌
- Status: ✅ / ❌
- Files created: ___ files
- Errors: None / [describe]

### Editor
- Files load: ✅ / ❌
- CORS errors: None / [describe]
- Full.md viewer: ✅ / ❌
- Search works: ✅ / ❌
- Copy works: ✅ / ❌

### Overall
- Everything works: ✅ / ❌
- Issues found: [list any issues]
```

---

## 🎯 What Changed

### 1. CORS Fixed
**File:** Applied `cors.json` to Firebase Storage  
**Result:** Split files now load without CORS errors

### 2. Full.md Viewer
**Files:** `FullMdViewer.js`, `FullMdViewer.css`  
**Result:** Right panel now shows extracted markdown instead of PDF

### 3. Split Tested
**File:** `test_split_local.py`  
**Result:** Confirmed split function works correctly

### 4. Auto-Split
**File:** `SplittingPanel.js` (already implemented)  
**Result:** Splitting starts automatically after extraction

---

## 🚀 Ready to Test!

**Everything is deployed and ready.**

Start the app and test the flow:
```bash
npm start
```

Then follow the steps above and report the results! 🎉

---

## 📚 Additional Documentation

- **CHANGES_SUMMARY.md** - Detailed changes
- **EXTRACTION_FUNCTION_SUMMARY.md** - How extraction works
- **LOG_COMMANDS.md** - How to view logs
- **TEST_NOW.md** - Quick test guide for extraction

---

**Good luck with testing!** 🚀

