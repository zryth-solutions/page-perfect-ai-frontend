"""
Firestore Helper Functions
Handles database operations for books and projects
"""

from datetime import datetime
from firebase_admin import firestore
from typing import Dict, Any, Optional, List
from google.cloud.firestore_v1 import FieldFilter


db = firestore.client()


def get_book(book_id: str) -> Optional[Dict[str, Any]]:
    """
    Get book document from Firestore
    
    Args:
        book_id: Book document ID
    
    Returns:
        Book data dictionary or None if not found
    """
    try:
        doc_ref = db.collection('books').document(book_id)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id
            return data
        return None
    except Exception as e:
        print(f"Error getting book: {e}")
        return None


def update_book(book_id: str, data: Dict[str, Any]) -> bool:
    """
    Update book document in Firestore
    
    Args:
        book_id: Book document ID
        data: Data to update
    
    Returns:
        True if successful
    """
    try:
        doc_ref = db.collection('books').document(book_id)
        doc_ref.update(data)
        return True
    except Exception as e:
        print(f"Error updating book: {e}")
        return False


def update_extraction_status(book_id: str, status: str, 
                             error: Optional[str] = None,
                             metadata: Optional[Dict[str, Any]] = None) -> bool:
    """
    Update extraction status for a book
    
    Args:
        book_id: Book document ID
        status: Status ('not_started', 'processing', 'completed', 'failed')
        error: Optional error message
        metadata: Optional metadata (fullMdPath, imageCount, etc.)
    
    Returns:
        True if successful
    """
    try:
        update_data = {
            'extraction.status': status,
        }
        
        if status == 'processing':
            update_data['extraction.startedAt'] = datetime.utcnow().isoformat()
        elif status in ['completed', 'failed']:
            update_data['extraction.completedAt'] = datetime.utcnow().isoformat()
        
        if error:
            update_data['extraction.error'] = error
        
        if metadata:
            for key, value in metadata.items():
                update_data[f'extraction.{key}'] = value
        
        return update_book(book_id, update_data)
    except Exception as e:
        print(f"Error updating extraction status: {e}")
        return False


def update_splitting_status(book_id: str, status: str,
                            error: Optional[str] = None,
                            files: Optional[List[Dict[str, Any]]] = None,
                            total_files: Optional[int] = None) -> bool:
    """
    Update splitting status for a book
    
    Args:
        book_id: Book document ID
        status: Status ('not_started', 'processing', 'completed', 'failed')
        error: Optional error message
        files: Optional list of file metadata
        total_files: Optional total file count
    
    Returns:
        True if successful
    """
    try:
        update_data = {
            'splitting.status': status,
        }
        
        if status == 'processing':
            update_data['splitting.startedAt'] = datetime.utcnow().isoformat()
        elif status in ['completed', 'failed']:
            update_data['splitting.completedAt'] = datetime.utcnow().isoformat()
        
        if error:
            update_data['splitting.error'] = error
        
        if files:
            update_data['splitting.files'] = files
        
        if total_files is not None:
            update_data['splitting.totalFiles'] = total_files
        
        return update_book(book_id, update_data)
    except Exception as e:
        print(f"Error updating splitting status: {e}")
        return False


def acquire_lock(book_id: str, user_id: str, lock_duration_hours: int = 1) -> Dict[str, Any]:
    """
    Acquire editing lock for a book
    
    Args:
        book_id: Book document ID
        user_id: User ID requesting lock
        lock_duration_hours: Lock duration in hours
    
    Returns:
        Dictionary with success status and message
    """
    try:
        doc_ref = db.collection('books').document(book_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return {'success': False, 'message': 'Book not found'}
        
        book_data = doc.to_dict()
        editing = book_data.get('editing', {})
        
        # Check if already locked
        if editing.get('isLocked'):
            locked_by = editing.get('lockedBy')
            lock_expiry = editing.get('lockExpiry')
            
            # Check if lock expired
            if lock_expiry:
                expiry_time = datetime.fromisoformat(lock_expiry.replace('Z', '+00:00'))
                if datetime.utcnow() < expiry_time:
                    if locked_by != user_id:
                        return {
                            'success': False,
                            'message': f'Book is locked by another user',
                            'lockedBy': locked_by
                        }
        
        # Acquire lock
        from datetime import timedelta
        lock_expiry = (datetime.utcnow() + timedelta(hours=lock_duration_hours)).isoformat()
        
        update_data = {
            'editing.isLocked': True,
            'editing.lockedBy': user_id,
            'editing.lockedAt': datetime.utcnow().isoformat(),
            'editing.lockExpiry': lock_expiry
        }
        
        doc_ref.update(update_data)
        
        return {
            'success': True,
            'message': 'Lock acquired successfully',
            'lockExpiry': lock_expiry
        }
    except Exception as e:
        print(f"Error acquiring lock: {e}")
        return {'success': False, 'message': str(e)}


def release_lock(book_id: str, user_id: str) -> Dict[str, Any]:
    """
    Release editing lock for a book
    
    Args:
        book_id: Book document ID
        user_id: User ID releasing lock
    
    Returns:
        Dictionary with success status and message
    """
    try:
        doc_ref = db.collection('books').document(book_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return {'success': False, 'message': 'Book not found'}
        
        book_data = doc.to_dict()
        editing = book_data.get('editing', {})
        
        # Verify user owns the lock
        if editing.get('lockedBy') != user_id:
            return {'success': False, 'message': 'You do not own this lock'}
        
        # Release lock
        update_data = {
            'editing.isLocked': False,
            'editing.lockedBy': None,
            'editing.lockedAt': None,
            'editing.lockExpiry': None
        }
        
        doc_ref.update(update_data)
        
        return {'success': True, 'message': 'Lock released successfully'}
    except Exception as e:
        print(f"Error releasing lock: {e}")
        return {'success': False, 'message': str(e)}


def check_lock_status(book_id: str) -> Dict[str, Any]:
    """
    Check lock status for a book
    
    Args:
        book_id: Book document ID
    
    Returns:
        Dictionary with lock status
    """
    try:
        doc_ref = db.collection('books').document(book_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return {'locked': False, 'message': 'Book not found'}
        
        book_data = doc.to_dict()
        editing = book_data.get('editing', {})
        
        is_locked = editing.get('isLocked', False)
        locked_by = editing.get('lockedBy')
        lock_expiry = editing.get('lockExpiry')
        
        # Check if lock expired
        if is_locked and lock_expiry:
            expiry_time = datetime.fromisoformat(lock_expiry.replace('Z', '+00:00'))
            if datetime.utcnow() >= expiry_time:
                # Auto-release expired lock
                release_lock(book_id, locked_by)
                is_locked = False
                locked_by = None
        
        return {
            'locked': is_locked,
            'lockedBy': locked_by,
            'lockExpiry': lock_expiry
        }
    except Exception as e:
        print(f"Error checking lock status: {e}")
        return {'locked': False, 'message': str(e)}


def update_file_modification(book_id: str, user_id: str, file_name: str) -> bool:
    """
    Update file modification metadata
    
    Args:
        book_id: Book document ID
        user_id: User ID who modified the file
        file_name: Name of modified file
    
    Returns:
        True if successful
    """
    try:
        doc_ref = db.collection('books').document(book_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return False
        
        book_data = doc.to_dict()
        editing = book_data.get('editing', {})
        modified_files = editing.get('modifiedFiles', [])
        
        # Add file to modified list if not already there
        if file_name not in modified_files:
            modified_files.append(file_name)
        
        update_data = {
            'editing.lastModified': datetime.utcnow().isoformat(),
            'editing.modifiedBy': user_id,
            'editing.modifiedFiles': modified_files
        }
        
        doc_ref.update(update_data)
        return True
    except Exception as e:
        print(f"Error updating file modification: {e}")
        return False

