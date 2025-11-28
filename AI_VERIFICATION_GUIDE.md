# AI Pattern Detection - Verification Guide

## 🎯 Quick Frontend Test (2 minutes)

### Step 1: Open Your App
1. Go to: https://pageperfectai.web.app
2. Navigate to any book that has been extracted
3. Click **"Configure Custom Patterns"** button

### Step 2: Test AI Detection
1. Look for the **"🤖 Auto-Detect with AI"** button (top right of pattern editor)
2. Click it
3. Watch for:
   - Button text changes to "Detecting..."
   - Spinner appears
   - After 5-10 seconds, all pattern fields auto-populate

### Step 3: Verify Results
✅ **AI is Working** if you see:
- All pattern fields filled automatically:
  - `competency_questions_start`: "# Competency-Focused Questions"
  - `level1_questions_start`: "# LEVEL1"
  - `level2_questions_start`: "# LEVEL"
  - `achievers_questions_start`: "# ACHIEVERS' SECTION"
  - `answer_key_section_start`: "# Answer-Key"
  - `explanations_section_start`: "# Answers with Explanations"
- Success toast message appears

❌ **AI is NOT Working** if:
- Button doesn't exist (frontend not deployed)
- Button stays "Detecting..." forever (backend error)
- Error message appears
- Fields remain empty

---

## **Method 2: Check Backend Logs** (3 minutes)

### View Function Logs
```bash
# Check if detectPatternsAI function exists
firebase functions:list | grep detectPatternsAI

# View recent logs
firebase functions:log --only detectPatternsAI --limit 20
```

### What to Look For

✅ **Success Logs:**
```
🤖 AI Pattern Detection requested for book: book123, path: books/book123/extracted/full.md
✅ AI Pattern Detection successful for book: book123
```

❌ **Error Logs:**
```
❌ Error in detectPatternsAI: [error message]
❌ HttpsError in detectPatternsAI: [error message]
```

---

## **Method 3: Direct Backend Test** (5 minutes)

### Test via Firebase Console

1. **Go to Firebase Console**
   - https://console.firebase.google.com
   - Select your project: `pageperfectai`
   - Navigate to: **Functions** → **detectPatternsAI**

2. **Click "Test Function"**

3. **Enter Test Data:**
```json
{
  "bookId": "test-book-123",
  "fullMdPath": "books/YOUR_ACTUAL_BOOK_ID/extracted/full.md"
}
```
*(Replace `YOUR_ACTUAL_BOOK_ID` with a real book ID from your database)*

4. **Click "Run Test"**

5. **Check Response:**

✅ **Success Response:**
```json
{
  "success": true,
  "bookId": "test-book-123",
  "patterns": {
    "competency_questions_start": "# Competency-Focused Questions",
    "level1_questions_start": "# LEVEL1",
    "level2_questions_start": "# LEVEL",
    "achievers_questions_start": "# ACHIEVERS' SECTION",
    "answer_key_section_start": "# Answer-Key",
    "explanations_section_start": "# Answers with Explanations"
  }
}
```

❌ **Error Response:**
```json
{
  "error": {
    "message": "Internal server error...",
    "status": "INTERNAL"
  }
}
```

---

## **Method 4: Check Browser Console** (Developer Mode)

### Open Developer Tools
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
- **Firefox**: Press `F12` or `Ctrl+Shift+K`
- **Safari**: `Cmd+Option+I`

### Click AI Button and Watch Console

✅ **Success Console Output:**
```
🤖 Calling detectPatternsAI for book: book123
✅ AI Detection successful
Detected patterns: {competency_questions_start: "# Competency-Focused Questions", ...}
```

❌ **Error Console Output:**
```
❌ AI Detection failed: [error message]
Error calling Cloud Function: [details]
```

---

## **Method 5: Test Locally** (Most Detailed - 10 minutes)

### Run Local Test Script

```bash
cd /home/manas/Desktop/Projects/QC/page-perfect-ai-frontend

# Make sure you have full.md in the root directory
# (You already have it based on your files)

# Run the test
python3 test_ai_detection.py
```

### What You'll See

✅ **AI Working (Simulated Mode):**
```
======================================================================
AI PATTERN DETECTION TEST - Simulated Mode
======================================================================

📄 Loaded: 45678 characters, 1228 lines

🔍 Detecting patterns...

✅ Patterns detected:
  competency_questions_start    Line  123: # Competency-Focused Questions
  level1_questions_start        Line  234: # LEVEL1
  level2_questions_start        Line  456: # LEVEL
  achievers_questions_start     Line  678: # ACHIEVERS' SECTION
  answer_key_section_start      Line  890: # Answer-Key
  explanations_section_start    Line 1012: # Answers with Explanations

======================================================================
TESTING SPLIT WITH DETECTED PATTERNS
======================================================================
📁 Output: test_ai_split_output

🔄 Running extraction...
✨ Custom patterns loaded successfully
✅ Split test completed. Check 'test_ai_split_output' for results.

======================================================================
VERIFYING GENERATED FILES
======================================================================
✅ Found file: Question_output/theory.md (1234 bytes)
✅ Found file: Question_output/Competency_Focused_Questions.md (2345 bytes)
✅ Found file: Question_output/Multiple_Choice_Questions_Level_1.md (3456 bytes)
... (all 19 files)

🎉 All expected files are present!
✅ Level 2 Questions content looks correct (contains questions).
```

❌ **AI Not Working:**
```
Error: full.md not found at /path/to/full.md
```
or
```
Error calling Gemini Pro: [authentication error]
```

---

## **Current Status: Simulated AI Mode**

### ⚠️ Important Note

**Right now, the AI is running in SIMULATED MODE:**
- The `ai_pattern_detection.py` file returns **mock/hardcoded patterns**
- This is intentional for testing without Vertex AI costs
- The patterns are based on your actual `full.md` structure

### To Enable Real AI (Vertex AI + Gemini Pro)

**In `functions/ai_pattern_detection.py`, uncomment lines 82-99:**

```python
# Current (Simulated):
def detect_patterns_from_markdown(markdown_content: str) -> Dict[str, str]:
    # Mock response for local testing
    mock_patterns = {
        "competency_questions_start": "# Competency-Focused Questions",
        ...
    }
    return mock_patterns  # ← Returns hardcoded patterns

# To Enable Real AI:
def detect_patterns_from_markdown(markdown_content: str) -> Dict[str, str]:
    try:
        prompt = _generate_prompt(markdown_content)
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        if response_text.startswith("```json") and response_text.endswith("```"):
            response_text = response_text[7:-3].strip()
        
        detected_patterns = json.loads(response_text)
        return detected_patterns
    except Exception as e:
        print(f"Error calling Gemini Pro: {e}")
        return {}  # ← Returns AI-detected patterns
```

**Then redeploy:**
```bash
firebase deploy --only functions:detectPatternsAI
```

---

## **Quick Decision Tree**

```
Do you want to test AI?
│
├─ YES, just verify it's wired up correctly
│  └─ Use Method 1 (Frontend Test)
│     └─ If button exists and fields populate → ✅ Working!
│
├─ YES, but want to see backend logs
│  └─ Use Method 2 (Backend Logs)
│     └─ Check for success/error messages
│
├─ YES, and want to test without opening browser
│  └─ Use Method 5 (Local Test Script)
│     └─ Run python3 test_ai_detection.py
│
└─ YES, and want to enable REAL AI (costs money!)
   └─ Uncomment Vertex AI code in ai_pattern_detection.py
   └─ Redeploy function
   └─ Test with Method 1
```

---

## **Recommended Testing Order**

### For Quick Verification:
1. ✅ **Method 1** - Frontend test (2 min)
2. ✅ **Method 2** - Check logs (3 min)

### For Thorough Testing:
1. ✅ **Method 5** - Local test (10 min)
2. ✅ **Method 1** - Frontend test (2 min)
3. ✅ **Method 3** - Direct backend test (5 min)

### Before Enabling Real AI:
1. ✅ Test simulated mode first (Methods 1 & 5)
2. ✅ Verify all 19 files generate correctly
3. ✅ Check Level 2 has questions (not answer table)
4. ✅ Then enable real AI if needed

---

## **Expected Behavior Summary**

| Feature | Simulated AI | Real AI (Vertex) |
|---------|-------------|------------------|
| Button exists | ✅ | ✅ |
| Fields populate | ✅ (hardcoded) | ✅ (AI-detected) |
| Works offline | ✅ | ❌ |
| Costs money | ❌ | ✅ (minimal) |
| Adapts to new formats | ❌ | ✅ |
| Speed | Instant | 5-10 sec |

---

## **Next Steps**

1. **Start with Method 1** (easiest)
2. **If button doesn't exist** → Frontend not deployed yet
3. **If button exists but errors** → Check Method 2 (logs)
4. **If everything works** → You're done! 🎉
5. **If you want real AI** → Uncomment code and redeploy

---

## **Need Help?**

If you see errors, share:
- Which method you used
- What you saw (screenshot or error message)
- Browser console output (if using Method 1)
- Function logs (if using Method 2)

I'll help debug! 🐛

