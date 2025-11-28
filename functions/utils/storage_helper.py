"""
Firebase Storage Helper Functions
Handles file uploads, downloads, and URL generation
"""

import os
import tempfile
from datetime import timedelta
from firebase_admin import storage
from typing import Optional, List, Tuple


def upload_file_to_storage(local_path: str, storage_path: str, bucket_name: Optional[str] = None) -> str:
    """
    Upload a file to Firebase Storage
    
    Args:
        local_path: Local file path
        storage_path: Destination path in Storage (e.g., 'books/book123/extracted/full.md')
        bucket_name: Optional bucket name (uses default if not provided)
    
    Returns:
        Public URL of uploaded file
    """
    try:
        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
        blob = bucket.blob(storage_path)
        
        blob.upload_from_filename(local_path)
        
        # Make file publicly readable (optional, can use signed URLs instead)
        # blob.make_public()
        
        return f"gs://{bucket.name}/{storage_path}"
    except Exception as e:
        print(f"Error uploading file to storage: {e}")
        raise


def download_file_from_storage(storage_path: str, local_path: Optional[str] = None, 
                                bucket_name: Optional[str] = None) -> str:
    """
    Download a file from Firebase Storage
    
    Args:
        storage_path: Path in Storage (e.g., 'books/book123/extracted/full.md')
        local_path: Optional local destination path (creates temp file if not provided)
        bucket_name: Optional bucket name
    
    Returns:
        Local file path
    """
    try:
        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
        blob = bucket.blob(storage_path)
        
        if not local_path:
            # Create temporary file
            suffix = os.path.splitext(storage_path)[1]
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
            local_path = temp_file.name
            temp_file.close()
        
        blob.download_to_filename(local_path)
        return local_path
    except Exception as e:
        print(f"Error downloading file from storage: {e}")
        raise


def get_signed_url(storage_path: str, expiration_hours: int = 1, 
                   bucket_name: Optional[str] = None) -> str:
    """
    Generate a public URL for Firebase Storage files
    
    Args:
        storage_path: Path in Storage
        expiration_hours: URL expiration time in hours (not used, kept for compatibility)
        bucket_name: Optional bucket name
    
    Returns:
        Public URL for the file
    """
    try:
        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
        
        # Get bucket name
        actual_bucket_name = bucket_name or bucket.name
        
        # Construct the public URL
        # Don't URL encode - Firebase Storage expects the path as-is
        public_url = f"https://storage.googleapis.com/{actual_bucket_name}/{storage_path}"
        
        print(f"Generated public URL: {public_url}")
        print(f"Bucket name: {actual_bucket_name}")
        return public_url
        
    except Exception as e:
        print(f"Error generating URL: {e}")
        # Fallback: return a basic URL
        bucket_name = bucket_name or storage.bucket().name
        return f"https://storage.googleapis.com/{bucket_name}/{storage_path}"


def delete_file_from_storage(storage_path: str, bucket_name: Optional[str] = None) -> bool:
    """
    Delete a file from Firebase Storage
    
    Args:
        storage_path: Path in Storage
        bucket_name: Optional bucket name
    
    Returns:
        True if successful
    """
    try:
        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
        blob = bucket.blob(storage_path)
        blob.delete()
        return True
    except Exception as e:
        print(f"Error deleting file from storage: {e}")
        return False


def list_files_in_directory(directory_path: str, bucket_name: Optional[str] = None) -> List[str]:
    """
    List all files in a Storage directory
    
    Args:
        directory_path: Directory path in Storage (e.g., 'books/book123/extracted/images/')
        bucket_name: Optional bucket name
    
    Returns:
        List of file paths
    """
    try:
        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
        
        # Ensure directory path ends with /
        if not directory_path.endswith('/'):
            directory_path += '/'
        
        blobs = bucket.list_blobs(prefix=directory_path)
        return [blob.name for blob in blobs if not blob.name.endswith('/')]
    except Exception as e:
        print(f"Error listing files in directory: {e}")
        return []


def file_exists(storage_path: str, bucket_name: Optional[str] = None) -> bool:
    """
    Check if a file exists in Storage
    
    Args:
        storage_path: Path in Storage
        bucket_name: Optional bucket name
    
    Returns:
        True if file exists
    """
    try:
        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
        blob = bucket.blob(storage_path)
        return blob.exists()
    except Exception as e:
        print(f"Error checking file existence: {e}")
        return False


def get_file_size(storage_path: str, bucket_name: Optional[str] = None) -> int:
    """
    Get file size in bytes
    
    Args:
        storage_path: Path in Storage
        bucket_name: Optional bucket name
    
    Returns:
        File size in bytes, or 0 if file doesn't exist
    """
    try:
        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
        blob = bucket.blob(storage_path)
        blob.reload()
        return blob.size or 0
    except Exception as e:
        print(f"Error getting file size: {e}")
        return 0


def upload_string_to_storage(content: str, storage_path: str, 
                             content_type: str = 'text/plain',
                             bucket_name: Optional[str] = None) -> str:
    """
    Upload string content directly to Storage
    
    Args:
        content: String content to upload
        storage_path: Destination path in Storage
        content_type: MIME type (default: text/plain)
        bucket_name: Optional bucket name
    
    Returns:
        Storage path
    """
    try:
        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
        blob = bucket.blob(storage_path)
        
        blob.upload_from_string(content, content_type=content_type)
        
        return f"gs://{bucket.name}/{storage_path}"
    except Exception as e:
        print(f"Error uploading string to storage: {e}")
        raise


def download_string_from_storage(storage_path: str, bucket_name: Optional[str] = None) -> str:
    """
    Download file content as string
    
    Args:
        storage_path: Path in Storage
        bucket_name: Optional bucket name
    
    Returns:
        File content as string
    """
    try:
        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
        blob = bucket.blob(storage_path)
        return blob.download_as_text()
    except Exception as e:
        print(f"Error downloading string from storage: {e}")
        raise

