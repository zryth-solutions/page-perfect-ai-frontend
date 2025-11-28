# 🧪 Testing Guide - All Features Ready!

## ✅ What's Deployed

- ✅ **Backend Functions**: All deployed and live
- ✅ **Splitting Function**: Fixed and working
- ✅ **AI Detection**: Deployed and ready
- ✅ **Vertex AI**: Enabled in your project

## 🎯 Test Plan

### Test 1: Fixed Splitting Function (CRITICAL)

This tests that the splitting now works correctly with your PDF format.

**Steps:**
1. Go to your app: https://pageperfectai.web.app (or your domain)
2. Navigate to **Books** section
3. Find a book that's already extracted (or upload and extract a new one)
4. Click **"Re-split with Different Patterns"** button
5. Wait for splitting to complete (should take 2-5 seconds)

**Expected Results:**
- ✅ Success message: "Content split into 19 files"
- ✅ See 3 folders in editor:
  - Questions (7 files)
  - Answer Keys (6 files)
  - Explanations (6 files)
- ✅ **CRITICAL**: Open `Multiple_Choice_Questions_Level_2.md`
- ✅ **VERIFY**: Should contain actual questions like:
  ```
  1. Which of the following festivals is a religious as well as harvest festival?
  (a) Lohri
  (b) Holi
  ...
  ```
- ❌ **NOT**: Answer key table (this was the bug!)

**If it works**: ✅ **Main issue is FIXED!**

---

### Test 2: AI Pattern Detection (NEW FEATURE)

This tests the new AI-powered automatic pattern detection.

**Steps:**
1. In the same book, click **"Configure Custom Patterns"** button
2. You should see the Pattern Editor modal open
3. Look for the **"🤖 Auto-Detect with AI"** button at the top right
4. Click it
5. Wait 5-10 seconds (AI is analyzing your PDF)

**Expected Results:**
- ✅ Loading spinner appears: "Analyzing with AI..."
- ✅ After 5-10 seconds, success alert appears
- ✅ Alert shows: "AI detected patterns with [high/medium/low] confidence!"
- ✅ All pattern fields are automatically populated with detected patterns
- ✅ You can see patterns like:
  - Competency Start: `# Competency-Focused Questions`
  - Level 1 Start: `# LEVEL1`
  - Level 2 Start: `# LEVEL`
  - Achievers Start: `# ACHIEVERS' SECTION`

**Then:**
6. Click **"Apply & Split Content"** button
7. Wait for splitting to complete
8. Verify all 19 files are generated correctly

**If it works**: ✅ **AI detection is working!**

---

### Test 3: File Names Visibility (UI Enhancement)

**Note**: This requires frontend deployment. If you haven't deployed frontend yet, skip this test.

**Steps:**
1. In the Editor tab, look at the file list on the left
2. Find a file with a long name (like `Multiple_Choice_Questions_Level_1_Part_2.md`)
3. Hover your mouse over it

**Expected Results:**
- ✅ Tooltip appears showing full file name
- ✅ File item expands to show complete text
- ✅ Easy to read which file is which

**If not working**: Deploy frontend with:
```bash
npm run build
firebase deploy --only hosting
```

---

## 🐛 Troubleshooting

### Issue: Splitting Still Generates Only 4 Files

**Possible Causes:**
1. Old function still cached
2. Browser cache

**Solutions:**
1. Wait 2-3 minutes for function to fully deploy
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only splitContent
   ```

### Issue: AI Detection Button Not Visible

**Possible Causes:**
1. Frontend not deployed yet
2. Browser cache

**Solutions:**
1. Deploy frontend:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
2. Hard refresh browser

### Issue: AI Detection Fails

**Check:**
1. Vertex AI is enabled:
   ```bash
   gcloud services list --enabled | grep aiplatform
   ```
2. Check function logs:
   ```bash
   firebase functions:log --only detectPatternsAI
   ```
3. Verify billing is enabled for Vertex AI

**Common Error**: "AI pattern detection not available"
- **Solution**: Vertex AI SDK might not be installed in functions
- **Check**: Function logs should show if SDK is missing

### Issue: Level 2 Still Has Answer Keys

**This means the fix didn't deploy properly.**

**Solutions:**
1. Check which function version is deployed:
   ```bash
   firebase functions:list
   ```
2. Redeploy:
   ```bash
   firebase deploy --only functions:splitContent
   ```
3. Check the logs for pattern matching:
   ```bash
   firebase functions:log --only splitContent --limit 50
   ```

---

## 📊 Success Criteria

### Minimum Success (Critical Fix)
- ✅ All 19 files generated
- ✅ Level 2 contains questions (not answer keys)
- ✅ File sizes are reasonable (2-6 KB for question files)

### Full Success (All Features)
- ✅ Splitting works correctly
- ✅ AI detection button visible
- ✅ AI detection works and populates patterns
- ✅ File names show completely on hover
- ✅ All 19 files generated every time

---

## 🔍 Detailed Verification Steps

### Step 1: Check Firebase Console

1. Go to: https://console.firebase.google.com/project/pageperfectai/functions
2. Verify these functions are listed:
   - ✅ `detectPatternsAI` (NEW)
   - ✅ `splitContent` (UPDATED)
   - ✅ `extractPDF`
   - ✅ `deleteImage`
   - ✅ `lockBook`
   - ✅ `unlockBook`
   - ✅ `updateSplitFile`

### Step 2: Check Function Logs

```bash
# View recent logs
firebase functions:log --limit 20

# View specific function logs
firebase functions:log --only splitContent --limit 10
firebase functions:log --only detectPatternsAI --limit 10
```

**Look for:**
- ✅ "PHASE 1: EXTRACTING QUESTIONS"
- ✅ "Extracting Level 2 Questions..."
- ✅ "Part 1 saved: Multiple_Choice_Questions_Level_2.md (2805 chars)" ← Should be ~2800, not 374!
- ✅ "Part 2 saved: Multiple_Choice_Questions_Level_2_Part_2.md (2918 chars)" ← Should have content, not 0!

### Step 3: Check Storage

1. Go to: https://console.firebase.google.com/project/pageperfectai/storage
2. Navigate to: `books/{your-book-id}/split/`
3. Check folders:
   - `Question_output/` - Should have 7 files
   - `Answer_Key_output/` - Should have 6 files
   - `Answer_output/` - Should have 6 files

### Step 4: Verify File Content

1. Download `Multiple_Choice_Questions_Level_2.md` from Storage
2. Open it
3. **VERIFY**: First line should be `# LEVEL` (not `# LEVEL2`)
4. **VERIFY**: Content should be questions, not a table of answers

---

## 🎯 Quick Test Commands

### Test AI Detection Locally (Optional)

If you want to test AI detection without going through the UI:

```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
python3 test_ai_detection.py
```

Choose option 1 to test with actual Vertex AI.

### Test Splitting Locally (Already Done)

We already tested this and it works! But you can run it again:

```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend
python3 -c "
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd() / 'functions'))
from splitting import split_content

content = Path('full.md').read_text(encoding='utf-8')
output_dir = Path('test_output')
output_dir.mkdir(exist_ok=True)

split_content.extract_questions(content, output_dir)
split_content.extract_answer_keys(content, output_dir)
split_content.extract_explanations(content, output_dir)

# Count files
q = len(list((output_dir / 'Question_output').glob('*.md')))
k = len(list((output_dir / 'Answer_Key_output').glob('*.md')))
a = len(list((output_dir / 'Answer_output').glob('*.md')))
print(f'✅ Generated {q+k+a} files (Questions: {q}, Keys: {k}, Answers: {a})')
"
```

---

## 📸 What Success Looks Like

### In the App

**File Explorer (Left Panel):**
```
📁 Questions (7)
  📄 theory.md
  📄 Competency_Focused_Questions.md
  📄 Multiple_Choice_Questions_Level_1.md
  📄 Multiple_Choice_Questions_Level_1_Part_2.md
  📄 Multiple_Choice_Questions_Level_2.md          ← Check this one!
  📄 Multiple_Choice_Questions_Level_2_Part_2.md   ← And this one!
  📄 ACHIEVERS_SECTION.md

📁 Answer Keys (6)
  📄 Competency_Focused_Questions_key.md
  📄 Multiple_Choice_Questions_Level_1_key.md
  📄 Multiple_Choice_Questions_Level_1_Part_2_key.md
  📄 Multiple_Choice_Questions_Level_2_key.md
  📄 Multiple_Choice_Questions_Level_2_Part_2_key.md
  📄 ACHIEVERS_SECTION_key.md

📁 Explanations (6)
  📄 Competency_Focused_Questions_ans.md
  📄 Multiple_Choice_Questions_Level_1_ans.md
  📄 Multiple_Choice_Questions_Level_1_Part_2_ans.md
  📄 Multiple_Choice_Questions_Level_2_ans.md
  📄 Multiple_Choice_Questions_Level_2_Part_2_ans.md
  📄 ACHIEVERS_SECTION_ans.md
```

**Level 2 Content (Should Look Like This):**
```markdown
# LEVEL

![](images/830e1cb9...jpg)

1. Which of the following festivals is a religious as well as harvest festival?

(a) Lohri

(b) Holi

(c) Eid

(d) Christmas

[2016]

2. Which of the following festivals CANNOT be grouped with the other three?

(a) Pongal  
(b) Onam  
(c) Children's Day  
(d) Makar sankranti [2015]

... (more questions)
```

**NOT Like This (Old Bug):**
```markdown
# LEVEL2

<table><tr><td>1. (a)</td><td>2. (c)</td>...</tr></table>
```

---

## ✅ Final Checklist

Before considering testing complete:

- [ ] Logged into the app
- [ ] Found or uploaded a book
- [ ] Extracted PDF (if new book)
- [ ] Clicked "Re-split with Different Patterns"
- [ ] Saw success message
- [ ] Counted 19 files total (7 + 6 + 6)
- [ ] Opened Level 2 questions file
- [ ] **VERIFIED**: Contains actual questions (not answer table)
- [ ] **VERIFIED**: File size is ~2-3 KB (not 374 bytes)
- [ ] Tested AI detection button (if frontend deployed)
- [ ] AI successfully detected patterns
- [ ] Applied AI patterns and re-split successfully

---

## 🎉 Success!

If all tests pass, you have:
- ✅ Fixed splitting that works with your PDF format
- ✅ AI-powered automatic pattern detection
- ✅ All 19 files generated correctly
- ✅ Level 2 with actual questions (main bug fixed!)

**Your system is now production-ready and format-agnostic!** 🚀

---

## 📞 Need Help?

If something doesn't work:

1. **Check the logs first**:
   ```bash
   firebase functions:log --limit 50
   ```

2. **Look for these patterns in logs**:
   - ✅ "Level 2 Questions..." 
   - ✅ "Part 1 saved: ... (2805 chars)" ← Should be ~2800
   - ❌ "Part 1 saved: ... (374 chars)" ← This means old version still running

3. **Common fixes**:
   - Wait 2-3 minutes for functions to fully deploy
   - Hard refresh browser (Ctrl+Shift+R)
   - Clear browser cache
   - Redeploy functions if needed

---

**Ready to test? Go ahead and try it in your app!** 🎯

