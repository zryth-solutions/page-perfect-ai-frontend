# Cloud Run Project - Requirements & Integration Guide

## 📋 **Project Overview**

This document outlines the requirements for the **Cloud Run service** that will process educational content (questions, answer keys, explanations) using an Agentic Development Kit and generate validation reports.

---

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React App)                          │
│  - User configures: Model, Grade, Board, Subject                │
│  - User clicks "Start Execution" for a file pair                │
│  - Frontend calls Cloud Run endpoint with file paths            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTPS POST Request
                 │ (with auth token)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloud Run Service                             │
│  1. Receives request with file paths & config                   │
│  2. Downloads files from Firebase Storage                       │
│  3. Processes with Agentic Development Kit                      │
│  4. Generates validation report (JSON)                          │
│  5. Uploads report to Firebase Storage                          │
│  6. Returns success/failure response                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Report stored
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Storage                              │
│  - Input: books/{bookId}/split/*.md                            │
│  - Output: books/{bookId}/reports/{itemId}_report.json         │
└─────────────────────────────────────────────────────────────────┘
                 │
                 │ Frontend fetches report
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React App)                          │
│  - Displays report in table format                              │
│  - Allows download of JSON report                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📥 **API Endpoint Specification**

### **Endpoint URL**
```
POST https://YOUR-SERVICE-NAME-HASH-uc.a.run.app/execute
```

### **Authentication**
- **Method**: Firebase Auth Bearer Token (or Service Account)
- **Header**: `Authorization: Bearer <token>`

### **Request Format**

```json
{
  "bookId": "sNQc7XVjRfdQgySCK49M",
  "itemId": "competency",
  "itemName": "Competency Focused Questions",
  "filePair": {
    "question": "Competency_Focused_Questions.md",
    "key": "Competency_Focused_Questions_key.md",
    "explanation": "Competency_Focused_Questions_ans.md"
  },
  "config": {
    "model": "gemini-2.5-pro",
    "grade": "8",
    "board": "CBSE",
    "subject": "Science"
  }
}
```

**Note on Images:**
- Markdown files contain image references like `![](images/82e97d9fa201a390...jpg)`
- Images are stored at: `books/{bookId}/extracted/images/{filename}`
- You'll need to download images separately if your agent needs to analyze them
- See "Accessing Images from Firebase Storage" section below for details

### **Special Case: Theory (No Key/Explanation)**
```json
{
  "bookId": "sNQc7XVjRfdQgySCK49M",
  "itemId": "theory",
  "itemName": "Theory",
  "filePair": {
    "question": "theory.md",
    "key": null,
    "explanation": null
  },
  "config": {
    "model": "gemini-2.5-pro",
    "grade": "8",
    "board": "CBSE",
    "subject": "Science"
  }
}
```

### **Response Format**

**Success:**
```json
{
  "success": true,
  "reportPath": "books/sNQc7XVjRfdQgySCK49M/reports/competency_report.json",
  "executionTime": "45s",
  "status": "completed",
  "message": "Execution completed successfully"
}
```

**Failure:**
```json
{
  "success": false,
  "error": "Resource exhaustion - insufficient memory",
  "status": "failed",
  "executionTime": "30s",
  "message": "Execution failed due to resource constraints"
}
```

---

## 📂 **File Access & Storage**

### **1. Accessing Input Files from Firebase Storage**

**Storage Structure:**
```
books/
  └── {bookId}/
      ├── extracted/
      │   ├── full.md                    # Complete extracted markdown
      │   └── images/                    # All extracted images
      │       ├── 82e97d9fa201a390...jpg
      │       ├── 79f1489d21bce0d1...jpg
      │       └── ... (all image files)
      │
      └── split/                         # Split markdown files
          ├── theory.md
          ├── Competency_Focused_Questions.md
          ├── Competency_Focused_Questions_key.md
          ├── Competency_Focused_Questions_ans.md
          ├── Multiple_Choice_Questions_Level_1.md
          ├── Multiple_Choice_Questions_Level_1_key.md
          ├── Multiple_Choice_Questions_Level_1_ans.md
          └── ... (other files)
```

**How to Download Files:**

Using Firebase Admin SDK (Python):
```python
from firebase_admin import storage
import firebase_admin
from firebase_admin import credentials

# Initialize Firebase Admin
cred = credentials.Certificate('path/to/serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'pageperfectai.appspot.com'
})

def download_file_from_storage(book_id, filename):
    """Download a file from Firebase Storage"""
    bucket = storage.bucket()
    blob_path = f"books/{book_id}/split/{filename}"
    blob = bucket.blob(blob_path)
    
    # Download as string
    content = blob.download_as_text()
    return content

# Example usage
book_id = "sNQc7XVjRfdQgySCK49M"
question_content = download_file_from_storage(book_id, "Competency_Focused_Questions.md")
key_content = download_file_from_storage(book_id, "Competency_Focused_Questions_key.md")
explanation_content = download_file_from_storage(book_id, "Competency_Focused_Questions_ans.md")
```

### **3. Accessing Images from Firebase Storage**

**Image Storage Location:**
```
books/
  └── {bookId}/
      └── extracted/
          └── images/
              ├── 82e97d9fa201a390cfb1a9f639770deaea5f2a24dc760c0ad32393e1ddc28bf2.jpg
              ├── 79f1489d21bce0d14229227b00382ffda4f50731cbf967bd1d4f46dee3aa3555.jpg
              ├── 35c69b85e463ff976c85accc412fc5f0beb214de5c3a70d061783ed9a2279b04.jpg
              └── ... (all extracted images)
```

**Image References in Markdown:**

In the markdown files, images are referenced as:
```markdown
![](images/82e97d9fa201a390cfb1a9f639770deaea5f2a24dc760c0ad32393e1ddc28bf2.jpg)
```

**How to Download Images:**

```python
from firebase_admin import storage
import os

def download_image_from_storage(book_id, image_filename):
    """Download an image file from Firebase Storage"""
    bucket = storage.bucket()
    blob_path = f"books/{book_id}/extracted/images/{image_filename}"
    blob = bucket.blob(blob_path)
    
    # Download as bytes
    image_bytes = blob.download_as_bytes()
    return image_bytes

def save_image_locally(book_id, image_filename, local_path='./temp_images'):
    """Download and save image locally"""
    # Create local directory if it doesn't exist
    os.makedirs(local_path, exist_ok=True)
    
    # Download image
    image_bytes = download_image_from_storage(book_id, image_filename)
    
    # Save to local file
    local_file_path = os.path.join(local_path, image_filename)
    with open(local_file_path, 'wb') as f:
        f.write(image_bytes)
    
    return local_file_path

# Example usage
book_id = "sNQc7XVjRfdQgySCK49M"
image_filename = "82e97d9fa201a390cfb1a9f639770deaea5f2a24dc760c0ad32393e1ddc28bf2.jpg"

# Download and save locally
local_path = save_image_locally(book_id, image_filename)
print(f"Image saved to: {local_path}")
```

**Extracting Image References from Markdown:**

```python
import re

def extract_image_references(markdown_content):
    """Extract all image filenames from markdown content"""
    # Pattern to match: ![](images/filename.jpg) or ![](../images/filename.jpg)
    pattern = r'!\[.*?\]\((?:\.\.\/)?images\/([^)]+)\)'
    
    image_filenames = re.findall(pattern, markdown_content)
    return image_filenames

# Example usage
markdown_content = """
# Question 1
Look at the image below:

![](images/82e97d9fa201a390cfb1a9f639770deaea5f2a24dc760c0ad32393e1ddc28bf2.jpg)

Which festival is this?
"""

images = extract_image_references(markdown_content)
print(f"Found {len(images)} images: {images}")

# Download all images
for image_filename in images:
    save_image_locally(book_id, image_filename)
```

**Getting Public URL for Images (if needed):**

```python
from firebase_admin import storage
from datetime import timedelta

def get_image_url(book_id, image_filename, expiration_minutes=60):
    """Get a signed URL for an image (valid for specified time)"""
    bucket = storage.bucket()
    blob_path = f"books/{book_id}/extracted/images/{image_filename}"
    blob = bucket.blob(blob_path)
    
    # Generate signed URL (valid for 60 minutes by default)
    url = blob.generate_signed_url(
        expiration=timedelta(minutes=expiration_minutes),
        method='GET'
    )
    
    return url

# Example usage
image_url = get_image_url(book_id, image_filename)
print(f"Image URL: {image_url}")
```

**Processing Images with AI (if needed):**

If your Agentic Development Kit needs to analyze images:

```python
from google.cloud import aiplatform
from vertexai.preview.vision_models import ImageTextModel, Image

def analyze_image_with_gemini(image_bytes, prompt):
    """Analyze image using Gemini Vision"""
    # Initialize Vertex AI
    aiplatform.init(project="pageperfectai", location="us-central1")
    
    # Load model
    model = ImageTextModel.from_pretrained("imagetext@001")
    
    # Create image object
    image = Image(image_bytes=image_bytes)
    
    # Generate response
    response = model.ask(
        prompt=prompt,
        image=image
    )
    
    return response.text

# Example usage
book_id = "sNQc7XVjRfdQgySCK49M"
image_filename = "82e97d9fa201a390cfb1a9f639770deaea5f2a24dc760c0ad32393e1ddc28bf2.jpg"

# Download image
image_bytes = download_image_from_storage(book_id, image_filename)

# Analyze with AI
prompt = "Describe what you see in this image. Is it related to an educational question?"
analysis = analyze_image_with_gemini(image_bytes, prompt)
print(f"Image analysis: {analysis}")
```

**Image Naming Convention:**

Images are named using SHA-256 hashes of their content:
- **Format**: `{sha256_hash}.{extension}`
- **Example**: `82e97d9fa201a390cfb1a9f639770deaea5f2a24dc760c0ad32393e1ddc28bf2.jpg`
- **Extensions**: `.jpg`, `.png`, `.gif`, `.webp`

**Important Notes:**

1. **Image Count**: A typical book may have 10-50 images
2. **Image Size**: Usually 50KB - 2MB per image
3. **Image Types**: Mostly diagrams, charts, photos related to questions
4. **Processing**: If your agent needs to analyze images, download them first
5. **Cleanup**: Delete temporary local images after processing to save space

### **2. Storing Output Reports**

**Report Storage Path:**
```
books/
  └── {bookId}/
      └── reports/
          ├── theory_report.json
          ├── competency_report.json
          ├── level1_report.json
          ├── level1_part2_report.json
          ├── level2_report.json
          ├── level2_part2_report.json
          └── achievers_report.json
```

**Complete Firebase Storage Structure:**
```
books/
  └── {bookId}/
      ├── original/
      │   └── {original_filename}.pdf          # Original uploaded PDF
      │
      ├── extracted/
      │   ├── full.md                          # Complete extracted markdown
      │   └── images/                          # All extracted images
      │       ├── {hash1}.jpg
      │       ├── {hash2}.png
      │       └── ...
      │
      ├── split/                               # Split markdown files
      │   ├── Question_output/
      │   │   ├── theory.md
      │   │   ├── Competency_Focused_Questions.md
      │   │   ├── Multiple_Choice_Questions_Level_1.md
      │   │   └── ...
      │   │
      │   ├── Answer_key_output/
      │   │   ├── Competency_Focused_Questions_key.md
      │   │   ├── Multiple_Choice_Questions_Level_1_key.md
      │   │   └── ...
      │   │
      │   └── Answer_explanations_output/
      │       ├── Competency_Focused_Questions_ans.md
      │       ├── Multiple_Choice_Questions_Level_1_ans.md
      │       └── ...
      │
      └── reports/                             # Execution reports (YOUR OUTPUT)
          ├── theory_report.json
          ├── competency_report.json
          ├── level1_report.json
          └── ...
```

**How to Upload Report:**

```python
import json
from firebase_admin import storage

def upload_report_to_storage(book_id, item_id, report_data):
    """Upload report JSON to Firebase Storage"""
    bucket = storage.bucket()
    blob_path = f"books/{book_id}/reports/{item_id}_report.json"
    blob = bucket.blob(blob_path)
    
    # Convert report to JSON string
    report_json = json.dumps(report_data, indent=2)
    
    # Upload with proper content type
    blob.upload_from_string(
        report_json,
        content_type='application/json'
    )
    
    return blob_path

# Example usage
report_data = {
    "summary": {...},
    "validation_results": {...},
    "errors": [...]
}

report_path = upload_report_to_storage(
    book_id="sNQc7XVjRfdQgySCK49M",
    item_id="competency",
    report_data=report_data
)
```

---

## 📊 **Report JSON Structure**

### **Expected Report Format**

```json
{
  "metadata": {
    "bookId": "sNQc7XVjRfdQgySCK49M",
    "itemId": "competency",
    "itemName": "Competency Focused Questions",
    "executionTime": "45s",
    "timestamp": "2025-11-27T20:45:30Z",
    "model": "gemini-2.5-pro",
    "grade": "8",
    "board": "CBSE",
    "subject": "Science"
  },
  "summary": {
    "totalQuestions": 10,
    "questionsValidated": 10,
    "questionsWithIssues": 2,
    "answerKeysValidated": 10,
    "explanationsValidated": 10,
    "overallScore": 85.5
  },
  "validation_results": [
    {
      "questionNumber": 1,
      "questionText": "Which of the following is...",
      "status": "valid",
      "issues": [],
      "answerKey": {
        "provided": "(b)",
        "validated": true,
        "correct": true
      },
      "explanation": {
        "provided": true,
        "validated": true,
        "quality": "good",
        "issues": []
      }
    },
    {
      "questionNumber": 2,
      "questionText": "Identify the festival...",
      "status": "warning",
      "issues": [
        "Answer key mismatch with explanation",
        "Explanation could be more detailed"
      ],
      "answerKey": {
        "provided": "(a)",
        "validated": true,
        "correct": false,
        "suggestion": "(c)"
      },
      "explanation": {
        "provided": true,
        "validated": true,
        "quality": "fair",
        "issues": ["Lacks detail", "Missing reference"]
      }
    }
  ],
  "errors": [
    {
      "severity": "warning",
      "message": "Question 2: Answer key does not match explanation",
      "location": "question_2"
    }
  ],
  "recommendations": [
    "Review answer key for question 2",
    "Add more detail to explanation for question 2",
    "Consider adding diagrams for visual questions"
  ]
}
```

**Note:** This is a suggested structure. You can modify it based on what your Agentic Development Kit generates. The frontend will be updated to render whatever structure you provide.

---

## 🔧 **Cloud Run Service Implementation**

### **Recommended Tech Stack**
- **Language**: Python 3.11+
- **Framework**: Flask or FastAPI
- **Libraries**:
  - `firebase-admin` - Firebase Storage access
  - `google-cloud-aiplatform` - Vertex AI (if using Gemini)
  - Your Agentic Development Kit dependencies

### **Sample Cloud Run Service Structure**

```python
from flask import Flask, request, jsonify
from firebase_admin import credentials, initialize_app, storage
import json
import time

app = Flask(__name__)

# Initialize Firebase Admin
cred = credentials.Certificate('serviceAccountKey.json')
initialize_app(cred, {
    'storageBucket': 'pageperfectai.appspot.com'
})

@app.route('/execute', methods=['POST'])
def execute():
    """Main execution endpoint"""
    try:
        # Parse request
        data = request.json
        book_id = data['bookId']
        item_id = data['itemId']
        file_pair = data['filePair']
        config = data['config']
        
        # Download files from Firebase Storage
        question_content = download_file(book_id, file_pair['question'])
        key_content = download_file(book_id, file_pair['key']) if file_pair['key'] else None
        explanation_content = download_file(book_id, file_pair['explanation']) if file_pair['explanation'] else None
        
        # Process with your Agentic Development Kit
        start_time = time.time()
        report = process_with_agent(
            question_content,
            key_content,
            explanation_content,
            config
        )
        execution_time = time.time() - start_time
        
        # Upload report to Firebase Storage
        report_path = upload_report(book_id, item_id, report)
        
        # Return success response
        return jsonify({
            'success': True,
            'reportPath': report_path,
            'executionTime': f"{execution_time:.1f}s",
            'status': 'completed',
            'message': 'Execution completed successfully'
        }), 200
        
    except Exception as e:
        # Return error response
        return jsonify({
            'success': False,
            'error': str(e),
            'status': 'failed',
            'message': f'Execution failed: {str(e)}'
        }), 500

def download_file(book_id, filename):
    """Download file from Firebase Storage"""
    if not filename:
        return None
    bucket = storage.bucket()
    blob = bucket.blob(f"books/{book_id}/split/{filename}")
    return blob.download_as_text()

def upload_report(book_id, item_id, report):
    """Upload report to Firebase Storage"""
    bucket = storage.bucket()
    blob_path = f"books/{book_id}/reports/{item_id}_report.json"
    blob = bucket.blob(blob_path)
    blob.upload_from_string(
        json.dumps(report, indent=2),
        content_type='application/json'
    )
    return blob_path

def process_with_agent(question, key, explanation, config):
    """
    Process files with your Agentic Development Kit
    
    This is where you integrate your agent logic
    """
    # TODO: Implement your agent processing logic here
    # Example:
    # from your_agent import validate_content
    # report = validate_content(question, key, explanation, config)
    
    # For now, return a mock report
    return {
        "metadata": {...},
        "summary": {...},
        "validation_results": [...],
        "errors": [],
        "recommendations": []
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

### **Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy service account key (for Firebase Admin)
COPY serviceAccountKey.json .

# Expose port
EXPOSE 8080

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "8", "--timeout", "300", "main:app"]
```

### **requirements.txt**

```txt
flask==3.0.0
gunicorn==21.2.0
firebase-admin==6.4.0
google-cloud-aiplatform==1.40.0
# Add your Agentic Development Kit dependencies here
```

---

## 🔐 **Authentication & Security**

### **Option 1: Service Account (Recommended)**
- Cloud Run uses a service account with Firebase Storage access
- No need for user authentication
- Simpler implementation

**Setup:**
1. Create service account in Firebase Console
2. Grant "Storage Object Admin" role
3. Download service account key JSON
4. Add to Cloud Run as secret or environment variable

### **Option 2: Firebase Auth Token**
- Frontend passes user's Firebase Auth token
- Cloud Run validates token
- More secure but complex

**Implementation:**
```python
from firebase_admin import auth

def verify_token(token):
    """Verify Firebase Auth token"""
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        raise ValueError(f"Invalid token: {str(e)}")

@app.route('/execute', methods=['POST'])
def execute():
    # Get token from header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing authorization'}), 401
    
    token = auth_header.split('Bearer ')[1]
    user_id = verify_token(token)
    
    # Continue with execution...
```

---

## ⚙️ **Environment Variables**

Set these in Cloud Run:

```bash
# Firebase
FIREBASE_PROJECT_ID=pageperfectai
FIREBASE_STORAGE_BUCKET=pageperfectai.appspot.com

# Vertex AI (if using)
GOOGLE_CLOUD_PROJECT=pageperfectai
GOOGLE_CLOUD_REGION=us-central1

# Service Account
GOOGLE_APPLICATION_CREDENTIALS=/app/serviceAccountKey.json

# Timeouts
EXECUTION_TIMEOUT=300  # 5 minutes
```

---

## 🚨 **Error Handling**

### **Common Error Scenarios**

1. **Resource Exhaustion**
   - **Cause**: Agent uses too much memory/CPU
   - **Response**: Return 500 with specific error
   - **Frontend**: Shows "Retry" button

2. **File Not Found**
   - **Cause**: File doesn't exist in Storage
   - **Response**: Return 404 with file path
   - **Frontend**: Shows validation error

3. **Timeout**
   - **Cause**: Processing takes > 5 minutes
   - **Response**: Return 408 (Request Timeout)
   - **Frontend**: Shows timeout message with retry

4. **Invalid Input**
   - **Cause**: Malformed markdown, missing data
   - **Response**: Return 400 with details
   - **Frontend**: Shows validation error

### **Error Response Format**

```json
{
  "success": false,
  "error": "Resource exhaustion - insufficient memory",
  "errorCode": "RESOURCE_EXHAUSTED",
  "status": "failed",
  "executionTime": "30s",
  "message": "Execution failed due to resource constraints",
  "details": {
    "memoryUsed": "2.5GB",
    "memoryLimit": "2GB",
    "suggestion": "Reduce batch size or increase memory allocation"
  }
}
```

---

## 📈 **Performance & Scaling**

### **Recommended Cloud Run Configuration**

```yaml
# cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: page-perfect-executor
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containerConcurrency: 1  # One execution at a time per instance
      timeoutSeconds: 300  # 5 minutes
      containers:
      - image: gcr.io/pageperfectai/executor:latest
        resources:
          limits:
            memory: 4Gi  # Increase if agent needs more
            cpu: 2
```

### **Optimization Tips**
1. **Memory**: Start with 2GB, increase if needed
2. **CPU**: 2 vCPUs recommended for AI processing
3. **Concurrency**: 1 (one execution at a time)
4. **Timeout**: 5 minutes (300 seconds)
5. **Cold Start**: Keep min instances = 0 to save costs

---

## 🧪 **Testing**

### **Local Testing**

```bash
# Run locally
python main.py

# Test with curl
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "test123",
    "itemId": "competency",
    "filePair": {
      "question": "Competency_Focused_Questions.md",
      "key": "Competency_Focused_Questions_key.md",
      "explanation": "Competency_Focused_Questions_ans.md"
    },
    "config": {
      "model": "gemini-2.5-pro",
      "grade": "8",
      "board": "CBSE",
      "subject": "Science"
    }
  }'
```

### **Integration Testing**

1. Deploy to Cloud Run
2. Get Cloud Run URL
3. Update frontend with URL
4. Test from frontend UI
5. Verify report generation

---

## 📝 **Deployment Checklist**

- [ ] Service account created with Storage access
- [ ] Service account key downloaded
- [ ] Cloud Run service deployed
- [ ] Environment variables configured
- [ ] Timeout set to 300 seconds
- [ ] Memory allocated (2-4GB)
- [ ] Cloud Run URL obtained
- [ ] Test execution successful
- [ ] Report uploaded to Storage
- [ ] Frontend integration tested
- [ ] Error handling verified

---

## 🔗 **Integration with Frontend**

Once deployed, provide:

1. **Cloud Run URL**: `https://your-service-xyz.run.app`
2. **Authentication method**: Service Account or Token
3. **Expected response time**: ~30-60 seconds per execution
4. **Sample report JSON**: For frontend rendering

Frontend will update:
- `ExecutionReportsTab.js` → Replace `mockCloudRunExecution()`
- Add real Cloud Run endpoint
- Handle actual responses
- Display real reports

---

## 📞 **Support & Contact**

**Frontend Team:**
- Repository: `/home/manas/Desktop/Projects/QC/page-perfect-ai-frontend`
- Contact: [Your contact info]

**Questions to Answer:**
1. What is your Cloud Run URL?
2. What authentication method do you prefer?
3. What is the expected execution time?
4. Can you provide a sample report JSON?
5. What error codes should we handle?

---

## 📚 **Additional Resources**

- [Firebase Admin SDK - Python](https://firebase.google.com/docs/admin/setup)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

## 💡 **Complete Working Example**

Here's a complete example that downloads files, processes them, and uploads the report:

```python
from flask import Flask, request, jsonify
from firebase_admin import credentials, initialize_app, storage
import json
import time
import re

app = Flask(__name__)

# Initialize Firebase Admin
cred = credentials.Certificate('serviceAccountKey.json')
initialize_app(cred, {
    'storageBucket': 'pageperfectai.appspot.com'
})

@app.route('/execute', methods=['POST'])
def execute():
    """Main execution endpoint"""
    try:
        # Parse request
        data = request.json
        book_id = data['bookId']
        item_id = data['itemId']
        item_name = data['itemName']
        file_pair = data['filePair']
        config = data['config']
        
        print(f"Processing {item_name} for book {book_id}")
        
        # Download markdown files
        question_content = download_file(book_id, file_pair['question'])
        key_content = download_file(book_id, file_pair['key']) if file_pair['key'] else None
        explanation_content = download_file(book_id, file_pair['explanation']) if file_pair['explanation'] else None
        
        # Extract image references from markdown
        image_filenames = extract_all_images(question_content, key_content, explanation_content)
        print(f"Found {len(image_filenames)} images")
        
        # Download images if needed for processing
        images = {}
        for img_filename in image_filenames:
            try:
                images[img_filename] = download_image(book_id, img_filename)
            except Exception as e:
                print(f"Warning: Could not download image {img_filename}: {e}")
        
        # Process with your Agentic Development Kit
        start_time = time.time()
        report = process_with_agent(
            question_content,
            key_content,
            explanation_content,
            images,
            config
        )
        execution_time = time.time() - start_time
        
        # Upload report to Firebase Storage
        report_path = upload_report(book_id, item_id, report)
        
        print(f"Execution completed in {execution_time:.1f}s")
        
        # Return success response
        return jsonify({
            'success': True,
            'reportPath': report_path,
            'executionTime': f"{execution_time:.1f}s",
            'status': 'completed',
            'message': 'Execution completed successfully'
        }), 200
        
    except Exception as e:
        print(f"Execution failed: {str(e)}")
        # Return error response
        return jsonify({
            'success': False,
            'error': str(e),
            'status': 'failed',
            'message': f'Execution failed: {str(e)}'
        }), 500

def download_file(book_id, filename):
    """Download markdown file from Firebase Storage"""
    if not filename:
        return None
    
    bucket = storage.bucket()
    
    # Try different possible paths
    possible_paths = [
        f"books/{book_id}/split/{filename}",
        f"books/{book_id}/split/Question_output/{filename}",
        f"books/{book_id}/split/Answer_key_output/{filename}",
        f"books/{book_id}/split/Answer_explanations_output/{filename}"
    ]
    
    for blob_path in possible_paths:
        try:
            blob = bucket.blob(blob_path)
            if blob.exists():
                return blob.download_as_text()
        except:
            continue
    
    raise FileNotFoundError(f"File not found: {filename}")

def download_image(book_id, image_filename):
    """Download image from Firebase Storage"""
    bucket = storage.bucket()
    blob_path = f"books/{book_id}/extracted/images/{image_filename}"
    blob = bucket.blob(blob_path)
    return blob.download_as_bytes()

def extract_all_images(*markdown_contents):
    """Extract all image filenames from markdown contents"""
    pattern = r'!\[.*?\]\((?:\.\.\/)?images\/([^)]+)\)'
    all_images = set()
    
    for content in markdown_contents:
        if content:
            images = re.findall(pattern, content)
            all_images.update(images)
    
    return list(all_images)

def upload_report(book_id, item_id, report):
    """Upload report to Firebase Storage"""
    bucket = storage.bucket()
    blob_path = f"books/{book_id}/reports/{item_id}_report.json"
    blob = bucket.blob(blob_path)
    blob.upload_from_string(
        json.dumps(report, indent=2),
        content_type='application/json'
    )
    return blob_path

def process_with_agent(question, key, explanation, images, config):
    """
    Process files with your Agentic Development Kit
    
    Args:
        question: Question markdown content
        key: Answer key markdown content (or None)
        explanation: Explanation markdown content (or None)
        images: Dict of {filename: image_bytes}
        config: Dict with model, grade, board, subject
    
    Returns:
        Dict with report data
    """
    # TODO: Implement your agent processing logic here
    
    # Example mock report
    return {
        "metadata": {
            "model": config['model'],
            "grade": config['grade'],
            "board": config['board'],
            "subject": config['subject'],
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "executionTime": "45s"
        },
        "summary": {
            "totalQuestions": 10,
            "questionsValidated": 10,
            "questionsWithIssues": 2,
            "imagesFound": len(images),
            "overallScore": 85.5
        },
        "validation_results": [],
        "errors": [],
        "recommendations": []
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

---

## 🎯 **Quick Start Guide**

### **Step 1: Set Up Firebase Admin**
```bash
# Install dependencies
pip install firebase-admin flask gunicorn

# Download service account key from Firebase Console
# Save as serviceAccountKey.json
```

### **Step 2: Test Locally**
```bash
# Run the service
python main.py

# Test with sample request
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d @sample_request.json
```

### **Step 3: Deploy to Cloud Run**
```bash
# Build container
gcloud builds submit --tag gcr.io/pageperfectai/executor

# Deploy to Cloud Run
gcloud run deploy executor \
  --image gcr.io/pageperfectai/executor \
  --platform managed \
  --region us-central1 \
  --memory 4Gi \
  --timeout 300 \
  --allow-unauthenticated
```

### **Step 4: Share with Frontend Team**
Provide:
- Cloud Run URL
- Expected response time
- Sample report JSON
- Any special requirements

---

## 🧪 **Real Test Data for Development**

### **Test Book ID**
```
bookId: sNQc7XVjRfdQgySCK49M
```

This is a real book in Firebase Storage with complete data you can use for testing.

### **Available Files in Test Book**

**Question Files:**
```
books/sNQc7XVjRfdQgySCK49M/split/Question_output/
  ├── theory.md
  ├── Competency_Focused_Questions.md
  ├── Multiple_Choice_Questions_Level_1.md
  ├── Multiple_Choice_Questions_Level_1_Part_2.md
  ├── Multiple_Choice_Questions_Level_2.md
  ├── Multiple_Choice_Questions_Level_2_Part_2.md
  └── ACHIEVERS_SECTION.md
```

**Answer Key Files:**
```
books/sNQc7XVjRfdQgySCK49M/split/Answer_key_output/
  ├── Competency_Focused_Questions_key.md
  ├── Multiple_Choice_Questions_Level_1_key.md
  ├── Multiple_Choice_Questions_Level_1_Part_2_key.md
  ├── Multiple_Choice_Questions_Level_2_key.md
  ├── Multiple_Choice_Questions_Level_2_Part_2_key.md
  └── ACHIEVERS_SECTION_key.md
```

**Explanation Files:**
```
books/sNQc7XVjRfdQgySCK49M/split/Answer_explanations_output/
  ├── Competency_Focused_Questions_ans.md
  ├── Multiple_Choice_Questions_Level_1_ans.md
  ├── Multiple_Choice_Questions_Level_1_Part_2_ans.md
  ├── Multiple_Choice_Questions_Level_2_ans.md
  ├── Multiple_Choice_Questions_Level_2_Part_2_ans.md
  └── ACHIEVERS_SECTION_ans.md
```

**Images:**
```
books/sNQc7XVjRfdQgySCK49M/extracted/images/
  ├── 82e97d9fa201a390cfb1a9f639770deaea5f2a24dc760c0ad32393e1ddc28bf2.jpg
  ├── 79f1489d21bce0d14229227b00382ffda4f50731cbf967bd1d4f46dee3aa3555.jpg
  ├── 35c69b85e463ff976c85accc412fc5f0beb214de5c3a70d061783ed9a2279b04.jpg
  └── ... (total ~50 images)
```

### **Sample Test Requests**

**Test 1: Competency Questions (with images)**
```json
{
  "bookId": "sNQc7XVjRfdQgySCK49M",
  "itemId": "competency",
  "itemName": "Competency Focused Questions",
  "filePair": {
    "question": "Competency_Focused_Questions.md",
    "key": "Competency_Focused_Questions_key.md",
    "explanation": "Competency_Focused_Questions_ans.md"
  },
  "config": {
    "model": "gemini-2.5-pro",
    "grade": "8",
    "board": "CBSE",
    "subject": "Science"
  }
}
```

**Test 2: Theory (no key/explanation)**
```json
{
  "bookId": "sNQc7XVjRfdQgySCK49M",
  "itemId": "theory",
  "itemName": "Theory",
  "filePair": {
    "question": "theory.md",
    "key": null,
    "explanation": null
  },
  "config": {
    "model": "gemini-2.5-pro",
    "grade": "8",
    "board": "CBSE",
    "subject": "Science"
  }
}
```

**Test 3: Level 1 Questions**
```json
{
  "bookId": "sNQc7XVjRfdQgySCK49M",
  "itemId": "level1",
  "itemName": "Multiple Choice Questions Level 1",
  "filePair": {
    "question": "Multiple_Choice_Questions_Level_1.md",
    "key": "Multiple_Choice_Questions_Level_1_key.md",
    "explanation": "Multiple_Choice_Questions_Level_1_ans.md"
  },
  "config": {
    "model": "gemini-2.5-pro",
    "grade": "8",
    "board": "CBSE",
    "subject": "Science"
  }
}
```

### **Sample Content from Test Book**

**Competency_Focused_Questions.md (excerpt):**
```markdown
# Competency-Focused Questions

1. Identify the festival being celebrated in the picture below

![](images/b88f732e974108bdc2680a872908d1eeb9e280f5217bc82fd15bf08e0552ca5a.jpg)

(a) Dussehra
(b) Diwali
(c) Holi
(d) Onam

2. Aman visited a place with many beaches and saw people celebrating Pongal. Which city was he most likely in?

(a) Chennai
(b) Delhi
(c) Mumbai
(d) Kolkata

... (total 10 questions)
```

**Competency_Focused_Questions_key.md (excerpt):**
```markdown
# NCERT COMPETENCY BASED QUESTIONS

| 1. (b) | 2. (a) | 3. (b) | 4. (b) | 5. (c) |
| 6. (a) | 7. (d) | 8. (b) | 9. (a) | 10. (c) |
```

**Competency_Focused_Questions_ans.md (excerpt):**
```markdown
# NCERT COMPETENCY BASED QUESTIONS

1. Correct option is (b).

Explanation: Diyas and lights symbolise Diwali, the festival of lights celebrated to welcome Lord Rama back to Ayodhya.

2. Correct option is (a).

Explanation: Chennai is on the eastern coast near the sea and celebrates Pongal, a major Tamil harvest festival.

... (explanations for all 10 questions)
```

### **Firebase Project Details**

**Project ID:** `pageperfectai`  
**Storage Bucket:** `pageperfectai.appspot.com`  
**Region:** `us-central1`

### **Getting Service Account Key**

To access Firebase Storage for testing:

1. Go to [Firebase Console](https://console.firebase.google.com/project/pageperfectai/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Save as `serviceAccountKey.json`
4. **Important**: Keep this file secure, don't commit to git

**Or contact the frontend team to get the service account key.**

### **Testing Script**

Save this as `test_cloud_run.py`:

```python
#!/usr/bin/env python3
"""
Test script for Cloud Run service
Tests with real Firebase data
"""

import requests
import json
from firebase_admin import credentials, initialize_app, storage

# Initialize Firebase (for verification)
cred = credentials.Certificate('serviceAccountKey.json')
initialize_app(cred, {
    'storageBucket': 'pageperfectai.appspot.com'
})

def test_file_access():
    """Test that we can access files from Firebase Storage"""
    print("Testing Firebase Storage access...")
    
    bucket = storage.bucket()
    test_file = "books/sNQc7XVjRfdQgySCK49M/split/Question_output/Competency_Focused_Questions.md"
    
    try:
        blob = bucket.blob(test_file)
        content = blob.download_as_text()
        print(f"✓ Successfully downloaded file ({len(content)} characters)")
        print(f"  First 100 chars: {content[:100]}...")
        return True
    except Exception as e:
        print(f"✗ Failed to download file: {e}")
        return False

def test_image_access():
    """Test that we can access images from Firebase Storage"""
    print("\nTesting image access...")
    
    bucket = storage.bucket()
    test_image = "books/sNQc7XVjRfdQgySCK49M/extracted/images/82e97d9fa201a390cfb1a9f639770deaea5f2a24dc760c0ad32393e1ddc28bf2.jpg"
    
    try:
        blob = bucket.blob(test_image)
        image_bytes = blob.download_as_bytes()
        print(f"✓ Successfully downloaded image ({len(image_bytes)} bytes)")
        return True
    except Exception as e:
        print(f"✗ Failed to download image: {e}")
        return False

def test_cloud_run_endpoint(url):
    """Test Cloud Run endpoint"""
    print(f"\nTesting Cloud Run endpoint: {url}")
    
    test_request = {
        "bookId": "sNQc7XVjRfdQgySCK49M",
        "itemId": "competency",
        "itemName": "Competency Focused Questions",
        "filePair": {
            "question": "Competency_Focused_Questions.md",
            "key": "Competency_Focused_Questions_key.md",
            "explanation": "Competency_Focused_Questions_ans.md"
        },
        "config": {
            "model": "gemini-2.5-pro",
            "grade": "8",
            "board": "CBSE",
            "subject": "Science"
        }
    }
    
    try:
        response = requests.post(
            f"{url}/execute",
            json=test_request,
            headers={"Content-Type": "application/json"},
            timeout=300
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✓ Cloud Run execution successful!")
            return True
        else:
            print("✗ Cloud Run execution failed")
            return False
            
    except Exception as e:
        print(f"✗ Error calling Cloud Run: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Cloud Run Integration Test")
    print("=" * 60)
    
    # Test Firebase access
    file_ok = test_file_access()
    image_ok = test_image_access()
    
    if not (file_ok and image_ok):
        print("\n❌ Firebase access failed. Check your serviceAccountKey.json")
        exit(1)
    
    print("\n✅ Firebase access working!")
    
    # Test Cloud Run (if URL provided)
    cloud_run_url = input("\nEnter Cloud Run URL (or press Enter to skip): ").strip()
    
    if cloud_run_url:
        test_cloud_run_endpoint(cloud_run_url)
    else:
        print("\nSkipping Cloud Run test")
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)
```

**Run the test:**
```bash
python test_cloud_run.py
```

### **Expected Test Results**

**Successful Execution:**
```json
{
  "success": true,
  "reportPath": "books/sNQc7XVjRfdQgySCK49M/reports/competency_report.json",
  "executionTime": "45.2s",
  "status": "completed",
  "message": "Execution completed successfully"
}
```

**Sample Report Content:**
The report should be uploaded to:
```
books/sNQc7XVjRfdQgySCK49M/reports/competency_report.json
```

You can verify it was uploaded by checking Firebase Storage Console or using:
```python
bucket = storage.bucket()
blob = bucket.blob("books/sNQc7XVjRfdQgySCK49M/reports/competency_report.json")
if blob.exists():
    report = json.loads(blob.download_as_text())
    print(json.dumps(report, indent=2))
```

### **Content Statistics (for Test Book)**

| Item | Questions | Images | File Size |
|------|-----------|--------|-----------|
| Theory | N/A | ~20 | ~15 KB |
| Competency | 10 | ~10 | ~8 KB |
| Level 1 | 25 | ~15 | ~12 KB |
| Level 1 Part 2 | 0 (split) | 0 | ~1 KB |
| Level 2 | 20 | ~10 | ~10 KB |
| Level 2 Part 2 | 0 (split) | 0 | ~1 KB |
| Achievers | 5 | ~5 | ~5 KB |

**Total Images:** ~50 images (ranging from 50KB to 500KB each)

### **Common Issues & Solutions**

**Issue 1: "File not found"**
- **Cause**: File path might be in subdirectory
- **Solution**: Check both `books/{bookId}/split/{filename}` and `books/{bookId}/split/Question_output/{filename}`

**Issue 2: "Permission denied"**
- **Cause**: Service account doesn't have Storage access
- **Solution**: Grant "Storage Object Admin" role to service account

**Issue 3: "Image download fails"**
- **Cause**: Image might not exist or path is wrong
- **Solution**: Images are always at `books/{bookId}/extracted/images/{filename}`, not in split folder

**Issue 4: "Timeout"**
- **Cause**: Processing takes too long
- **Solution**: Increase Cloud Run timeout to 300 seconds (5 minutes)

---

**Document Version:** 1.2  
**Last Updated:** November 27, 2025  
**Status:** Ready for Cloud Run Development  
**Changelog:** 
- v1.0: Initial document
- v1.1: Added images section and complete working example
- v1.2: Added real test data, sample files, and testing script

