"""
Firebase Cloud Functions for PDF Extraction and Content Splitting
Main entry point for all Cloud Functions
"""

import os
import tempfile
from pathlib import Path
from typing import Dict, Any

import firebase_admin
from firebase_admin import credentials, initialize_app
from firebase_functions import https_fn, options
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    initialize_app()

# Import our modules
from extraction.mineru_client import MinerUClient
from splitting import split_content, patterns_config
from utils import storage_helper, firestore_helper


# =============================================================================
# CLOUD FUNCTION 1: Extract PDF using MinerU API
# =============================================================================

@https_fn.on_call()
def extractPDF(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Extract PDF content using MinerU API v4
    
    Expected request data:
    {
        "bookId": "book123",
        "pdfPath": "books/book123/original.pdf"
    }
    
    Returns:
    {
        "success": True/False,
        "bookId": "book123",
        "extractionPath": "books/book123/extracted/",
        "imageCount": 15,
        "fullMdSize": 125000,
        "error": "error message" (if failed)
    }
    """
    try:
        # Get request data
        book_id = req.data.get('bookId')
        pdf_path = req.data.get('pdfPath')
        
        if not book_id or not pdf_path:
            return {
                'success': False,
                'error': 'Missing required parameters: bookId and pdfPath'
            }
        
        print(f"Starting extraction for book: {book_id}")
        print(f"PDF path received: {pdf_path}")
        
        # Ensure the path includes 'books/' prefix
        if not pdf_path.startswith('books/'):
            pdf_path = f"books/{pdf_path}"
            print(f"Added 'books/' prefix. Full path: {pdf_path}")
        
        # Update status to processing
        firestore_helper.update_extraction_status(
            book_id,
            'processing',
            metadata={'mineruJobId': None}
        )
        
        # Verify the blob exists
        if not storage_helper.file_exists(pdf_path):
            return {
                'success': False,
                'error': f'PDF file not found at path: {pdf_path}'
            }
        
        # Download PDF from Firebase Storage to temporary file
        print(f"Downloading PDF from Storage: {pdf_path}")
        import requests
        temp_pdf_path = tempfile.mktemp(suffix='.pdf')
        storage_helper.download_file_from_storage(pdf_path, temp_pdf_path)
        print(f"Downloaded to temporary file: {temp_pdf_path}")
        
        # Upload to transfer.sh for temporary public access
        # This works around Firebase Storage access issues with MinerU
        print("Uploading PDF to temporary public location...")
        with open(temp_pdf_path, 'rb') as f:
            pdf_bytes = f.read()
        
        # Upload to tmpfiles.org (tested and working with MinerU)
        try:
            response = requests.post(
                'https://tmpfiles.org/api/v1/upload',
                files={'file': ('document.pdf', pdf_bytes, 'application/pdf')},
                timeout=120
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get('status') == 'success':
                # tmpfiles.org returns a URL that needs to be modified for direct download
                pdf_url = result['data']['url']
                pdf_url = pdf_url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
                print(f"Temporary public URL: {pdf_url}")
            else:
                raise Exception(f"tmpfiles.org upload failed: {result.get('message', 'Unknown error')}")
        except Exception as e:
            print(f"Failed to upload to tmpfiles.org: {e}")
            return {
                'success': False,
                'error': f'Failed to create temporary public URL: {str(e)}'
            }
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_pdf_path)
            except:
                pass
        
        # Initialize MinerU client
        # Try to get API key from environment variable or Firebase config
        api_token = os.getenv('MINERU_API_KEY') or os.getenv('mineru_api_key')
        
        if not api_token:
            return {
                'success': False,
                'error': 'MinerU API key not configured. Please set it using: firebase functions:config:set mineru.api_key="YOUR_KEY"'
            }
        
        mineru_client = MinerUClient(token=api_token)
        
        # Create extraction task with all features enabled
        print("Creating MinerU extraction task...")
        task_result = mineru_client.create_extraction_task(
            pdf_url=pdf_url,
            is_ocr=True,              # Enable OCR
            enable_formula=True,       # Enable formula recognition
            enable_table=True,         # Enable table recognition
            language="en",             # English language
            model_version="vlm",       # VLM model for best accuracy
            data_id=book_id            # Use book ID as data ID
        )
        
        if not task_result.get('success'):
            error_msg = task_result.get('error', 'Unknown error')
            print(f"Failed to create extraction task: {error_msg}")
            
            firestore_helper.update_extraction_status(
                book_id,
                'failed',
                error=error_msg
            )
            
            return {
                'success': False,
                'error': error_msg,
                'code': 'TASK_CREATION_FAILED'
            }
        
        task_id = task_result.get('task_id')
        print(f"Extraction task created: {task_id}")
        
        # Update Firestore with task ID
        firestore_helper.update_extraction_status(
            book_id,
            'processing',
            metadata={'mineruTaskId': task_id}
        )
        
        # Wait for extraction to complete
        print("Waiting for extraction to complete...")
        extraction_result = mineru_client.wait_for_completion(
            task_id=task_id,
            poll_interval=5,
            max_wait_time=3600  # 1 hour max
        )
        
        if not extraction_result.get('success'):
            error_msg = extraction_result.get('error', 'Unknown error')
            print(f"Extraction failed: {error_msg}")
            
            firestore_helper.update_extraction_status(
                book_id,
                'failed',
                error=error_msg
            )
            
            return {
                'success': False,
                'error': error_msg,
                'code': 'EXTRACTION_FAILED'
            }
        
        # Check if extraction completed successfully
        if extraction_result.get('state') != 'done':
            error_msg = extraction_result.get('err_msg', 'Extraction did not complete')
            print(f"Extraction not completed: {error_msg}")
            
            firestore_helper.update_extraction_status(
                book_id,
                'failed',
                error=error_msg
            )
            
            return {
                'success': False,
                'error': error_msg,
                'code': 'EXTRACTION_INCOMPLETE'
            }
        
        # Get the ZIP file URL from result
        zip_url = extraction_result.get('full_zip_url')
        if not zip_url:
            return {
                'success': False,
                'error': 'No ZIP URL in extraction result',
                'code': 'NO_ZIP_URL'
            }
        
        print(f"Downloading extraction results from: {zip_url}")
        
        # Download ZIP file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_zip:
            zip_path = temp_zip.name
        
        download_result = mineru_client.download_result_zip(zip_url, zip_path)
        
        if not download_result.get('success'):
            return {
                'success': False,
                'error': f"Failed to download results: {download_result.get('error')}",
                'code': 'DOWNLOAD_FAILED'
            }
        
        print(f"Downloaded ZIP file ({download_result.get('file_size')} bytes)")
        
        # Extract ZIP file
        import zipfile
        extract_dir = tempfile.mkdtemp()
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            print(f"Extracted ZIP to: {extract_dir}")
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to extract ZIP: {str(e)}",
                'code': 'ZIP_EXTRACT_FAILED'
            }
        
        # Find and upload markdown file
        markdown_content = ""
        full_md_path = f"books/{book_id}/extracted/full.md"
        
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                if file.endswith('.md'):
                    md_file_path = os.path.join(root, file)
                    with open(md_file_path, 'r', encoding='utf-8') as f:
                        markdown_content = f.read()
                    
                    # Upload to Storage
                    storage_helper.upload_string_to_storage(
                        markdown_content,
                        full_md_path,
                        content_type='text/markdown'
                    )
                    print(f"Saved full.md ({len(markdown_content)} bytes)")
                    break
        
        # Upload all images from extracted folder
        image_count = 0
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                    image_path = os.path.join(root, file)
                    image_storage_path = f"books/{book_id}/extracted/images/{file}"
                    
                    try:
                        storage_helper.upload_file_to_storage(image_path, image_storage_path)
                        image_count += 1
                        print(f"Saved image: {file}")
                    except Exception as e:
                        print(f"Error uploading image {file}: {e}")
        
        print(f"Saved {image_count} images")
        
        # Clean up temporary files
        try:
            os.unlink(zip_path)
            import shutil
            shutil.rmtree(extract_dir)
        except Exception as e:
            print(f"Warning: Failed to clean up temp files: {e}")
        
        # Update Firestore with success
        firestore_helper.update_extraction_status(
            book_id,
            'completed',
            metadata={
                'fullMdPath': full_md_path,
                'imagesPath': f"books/{book_id}/extracted/images/",
                'imageCount': image_count,
                'mineruJobId': extraction_result.get('job_id')
            }
        )
        
        print(f"Extraction completed successfully for book: {book_id}")
        
        return {
            'success': True,
            'bookId': book_id,
            'extractionPath': f"books/{book_id}/extracted/",
            'imageCount': image_count,
            'fullMdSize': len(markdown_content)
        }
    
    except Exception as e:
        print(f"Unexpected error in extractPDF: {e}")
        
        if book_id:
            firestore_helper.update_extraction_status(
                book_id,
                'failed',
                error=str(e)
            )
        
        return {
            'success': False,
            'error': str(e)
        }


# =============================================================================
# CLOUD FUNCTION 2: Split Content into Structured Files
# =============================================================================

@https_fn.on_call()
def splitContent(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Split extracted markdown into structured files
    
    Expected request data:
    {
        "bookId": "book123",
        "fullMdPath": "books/book123/extracted/full.md",
        "customPatterns": {...} (optional)
    }
    
    Returns:
    {
        "success": True/False,
        "bookId": "book123",
        "totalFiles": 19,
        "files": [...],
        "error": "error message" (if failed)
    }
    """
    try:
        # Get request data
        book_id = req.data.get('bookId')
        full_md_path = req.data.get('fullMdPath')
        custom_patterns = req.data.get('customPatterns')
        
        if not book_id or not full_md_path:
            return {
                'success': False,
                'error': 'Missing required parameters: bookId and fullMdPath'
            }
        
        print(f"Starting content splitting for book: {book_id}")
        if custom_patterns:
            print(f"✨ Using custom patterns from UI: {list(custom_patterns.keys())}")
        else:
            print("Using default patterns")
        
        # Update status to processing
        firestore_helper.update_splitting_status(book_id, 'processing')
        
        # Download full.md from Storage
        print(f"Downloading full.md from: {full_md_path}")
        content = storage_helper.download_string_from_storage(full_md_path)
        print(f"Downloaded {len(content)} characters")
        
        # Create temporary directory for output
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_output_dir = Path(temp_dir) / "output"
            temp_output_dir.mkdir(parents=True, exist_ok=True)
            
            print("Running content splitting...")
            
            # Extract questions (pass custom patterns)
            questions_results = split_content.extract_questions(
                content, 
                temp_output_dir,
                custom_patterns=custom_patterns
            )
            
            # Extract answer keys (patterns already set by extract_questions)
            keys_results = split_content.extract_answer_keys(
                content, 
                temp_output_dir,
                custom_patterns=None  # Already set
            )
            
            # Extract explanations (patterns already set)
            explanations_results = split_content.extract_explanations(
                content, 
                temp_output_dir,
                custom_patterns=None  # Already set
            )
            
            # Upload all generated files to Storage
            print("Uploading split files to Firebase Storage...")
            
            uploaded_files = []
            
            # Upload Question_output files
            question_dir = temp_output_dir / "Question_output"
            if question_dir.exists():
                for file_path in question_dir.glob("*.md"):
                    storage_path = f"books/{book_id}/splits/Question_output/{file_path.name}"
                    storage_helper.upload_file_to_storage(str(file_path), storage_path)
                    
                    uploaded_files.append({
                        'name': file_path.name,
                        'path': storage_path,
                        'category': 'question',
                        'size': file_path.stat().st_size
                    })
                    print(f"Uploaded: {file_path.name}")
            
            # Upload Answer_key files
            key_dir = temp_output_dir / "Answer_key"
            if key_dir.exists():
                for file_path in key_dir.glob("*.md"):
                    storage_path = f"books/{book_id}/splits/Answer_key/{file_path.name}"
                    storage_helper.upload_file_to_storage(str(file_path), storage_path)
                    
                    uploaded_files.append({
                        'name': file_path.name,
                        'path': storage_path,
                        'category': 'answer_key',
                        'size': file_path.stat().st_size
                    })
                    print(f"Uploaded: {file_path.name}")
            
            # Upload Answer_output files
            answer_dir = temp_output_dir / "Answer_output"
            if answer_dir.exists():
                for file_path in answer_dir.glob("*.md"):
                    storage_path = f"books/{book_id}/splits/Answer_output/{file_path.name}"
                    storage_helper.upload_file_to_storage(str(file_path), storage_path)
                    
                    uploaded_files.append({
                        'name': file_path.name,
                        'path': storage_path,
                        'category': 'explanation',
                        'size': file_path.stat().st_size
                    })
                    print(f"Uploaded: {file_path.name}")
        
        print(f"Uploaded {len(uploaded_files)} files")
        
        # Update Firestore with success
        firestore_helper.update_splitting_status(
            book_id,
            'completed',
            files=uploaded_files,
            total_files=len(uploaded_files)
        )
        
        print(f"Content splitting completed successfully for book: {book_id}")
        
        return {
            'success': True,
            'bookId': book_id,
            'totalFiles': len(uploaded_files),
            'files': uploaded_files
        }
    
    except Exception as e:
        print(f"Unexpected error in splitContent: {e}")
        
        if book_id:
            firestore_helper.update_splitting_status(
                book_id,
                'failed',
                error=str(e)
            )
        
        return {
            'success': False,
            'error': str(e)
        }


# =============================================================================
# CLOUD FUNCTION 3: Update Split File
# =============================================================================

@https_fn.on_call()
def updateSplitFile(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Update a split file's content
    
    Expected request data:
    {
        "bookId": "book123",
        "filePath": "books/book123/splits/Question_output/theory.md",
        "content": "# Updated content...",
        "userId": "user456"
    }
    """
    try:
        book_id = req.data.get('bookId')
        file_path = req.data.get('filePath')
        content = req.data.get('content')
        user_id = req.data.get('userId')
        
        if not all([book_id, file_path, content, user_id]):
            return {
                'success': False,
                'error': 'Missing required parameters'
            }
        
        # Check lock status
        lock_status = firestore_helper.check_lock_status(book_id)
        if lock_status.get('locked') and lock_status.get('lockedBy') != user_id:
            return {
                'success': False,
                'error': f"Book is locked by another user: {lock_status.get('lockedBy')}"
            }
        
        # Upload updated content
        storage_helper.upload_string_to_storage(content, file_path, content_type='text/markdown')
        
        # Update modification metadata
        file_name = Path(file_path).name
        firestore_helper.update_file_modification(book_id, user_id, file_name)
        
        return {
            'success': True,
            'filePath': file_path,
            'updatedAt': firestore_helper.datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


# =============================================================================
# CLOUD FUNCTION 4: Delete Image
# =============================================================================

@https_fn.on_call()
def deleteImage(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Delete an image and update affected files
    
    Expected request data:
    {
        "bookId": "book123",
        "imagePath": "books/book123/extracted/images/image_005.png",
        "affectedFiles": ["theory.md", "Competency_Focused_Questions.md"]
    }
    """
    try:
        book_id = req.data.get('bookId')
        image_path = req.data.get('imagePath')
        affected_files = req.data.get('affectedFiles', [])
        
        if not book_id or not image_path:
            return {
                'success': False,
                'error': 'Missing required parameters'
            }
        
        # Delete image from Storage
        storage_helper.delete_file_from_storage(image_path)
        
        # Get image filename
        image_filename = Path(image_path).name
        
        # Update affected files (remove image references)
        updated_files = []
        for file_name in affected_files:
            # Find file path
            for category in ['Question_output', 'Answer_key', 'Answer_output']:
                file_path = f"books/{book_id}/splits/{category}/{file_name}"
                
                if storage_helper.file_exists(file_path):
                    # Download content
                    content = storage_helper.download_string_from_storage(file_path)
                    
                    # Remove image references
                    import re
                    pattern = rf'!\[.*?\]\(.*?{re.escape(image_filename)}.*?\)'
                    updated_content = re.sub(pattern, '', content)
                    
                    # Upload updated content
                    storage_helper.upload_string_to_storage(
                        updated_content,
                        file_path,
                        content_type='text/markdown'
                    )
                    
                    updated_files.append(file_name)
                    break
        
        return {
            'success': True,
            'deletedImage': image_filename,
            'updatedFiles': updated_files
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


# =============================================================================
# CLOUD FUNCTION 5: Lock Book
# =============================================================================

@https_fn.on_call()
def lockBook(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Acquire editing lock for a book
    
    Expected request data:
    {
        "bookId": "book123",
        "userId": "user456"
    }
    """
    try:
        book_id = req.data.get('bookId')
        user_id = req.data.get('userId')
        
        if not book_id or not user_id:
            return {
                'success': False,
                'error': 'Missing required parameters'
            }
        
        result = firestore_helper.acquire_lock(book_id, user_id)
        return result
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


# =============================================================================
# CLOUD FUNCTION 6: Unlock Book
# =============================================================================

@https_fn.on_call()
def unlockBook(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Release editing lock for a book
    
    Expected request data:
    {
        "bookId": "book123",
        "userId": "user456"
    }
    """
    try:
        book_id = req.data.get('bookId')
        user_id = req.data.get('userId')
        
        if not book_id or not user_id:
            return {
                'success': False,
                'error': 'Missing required parameters'
            }
        
        result = firestore_helper.release_lock(book_id, user_id)
        return result
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


# =============================================================================
# CLOUD FUNCTION 7: Auto-Detect Patterns using Vertex AI + Gemini
# =============================================================================

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST"]
    ),
    memory=options.MemoryOption.GB_1,  # Increase memory to 1GB for AI processing
    timeout_sec=300  # 5 minutes timeout for AI processing
)
def detectPatternsAI(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Use Vertex AI Gemini to automatically detect section patterns in full.md
    
    Expected request data:
    {
        "bookId": "book123"
    }
    
    Returns:
    {
        "success": True/False,
        "patterns": {...},  # Detected patterns
        "confidence": "high|medium|low",
        "notes": "..."
    }
    """
    try:
        # Get request data
        book_id = req.data.get('bookId')
        
        if not book_id:
            return {'success': False, 'error': 'Missing bookId'}
        
        print(f"🤖 Auto-detecting patterns for book: {book_id}")
        
        # Download full.md content
        full_md_path = f"books/{book_id}/extracted/full.md"
        
        try:
            content = storage_helper.download_string_from_storage(full_md_path)
        except Exception as e:
            return {
                'success': False,
                'error': f'Could not load full.md: {str(e)}'
            }
        
        # Check if AI detection is available
        try:
            from ai_pattern_detection import detect_patterns_with_ai
        except ImportError:
            return {
                'success': False,
                'error': 'AI pattern detection not available. Please install google-cloud-aiplatform.'
            }
        
        # Get project ID from environment or Firebase
        project_id = os.environ.get('GOOGLE_CLOUD_PROJECT') or os.environ.get('GCP_PROJECT')
        
        print(f"  Using Vertex AI in project: {project_id}")
        print(f"  Analyzing {len(content)} characters...")
        
        # Detect patterns using AI
        result = detect_patterns_with_ai(content, project_id=project_id)
        
        if result.get('success'):
            print(f"  ✓ Patterns detected with {result.get('confidence', 'unknown')} confidence")
            print(f"  Notes: {result.get('notes', 'None')}")
        else:
            print(f"  ✗ Pattern detection failed: {result.get('error')}")
        
        return result
        
    except Exception as e:
        print(f"✗ Error in AI pattern detection: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }
