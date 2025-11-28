"""
Test script to get and test Firebase Storage URL
"""

import sys
import os

# Add functions directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'functions'))

from extraction.mineru_client import MinerUClient

# MinerU API token
MINERU_TOKEN = "eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ.eyJqdGkiOiI3OTQwMDE4NCIsInJvbCI6IlJPTEVfUkVHSVNURVIiLCJpc3MiOiJPcGVuWExhYiIsImlhdCI6MTc2MzQ1MTc4MywiY2xpZW50SWQiOiJsa3pkeDU3bnZ5MjJqa3BxOXgydyIsInBob25lIjoiIiwib3BlbklkIjpudWxsLCJ1dWlkIjoiMjY4ZjkxZGEtNjE0Ny00Y2ZhLWI3NjAtNjJkYzdhZDBlN2I2IiwiZW1haWwiOiJtYW5hc0B6cnl0aC5jb20iLCJleHAiOjE3NjQ2NjEzODN9.20nRG36w20Ntxkn44bukRy3o6kV-CYJIt27HAeCF2mUSvwV_81p3dlJ20H971IV-QLhgC1pc19C-CRxkHvMXfw"

def test_firebase_url(pdf_url):
    """Test MinerU with Firebase Storage URL"""
    print("=" * 80)
    print("Testing Firebase Storage URL with MinerU")
    print("=" * 80)
    print(f"\nPDF URL: {pdf_url}\n")
    
    # Initialize client
    client = MinerUClient(token=MINERU_TOKEN)
    
    # Create extraction task
    print("1. Creating extraction task...")
    task_result = client.create_extraction_task(
        pdf_url=pdf_url,
        is_ocr=True,
        enable_formula=True,
        enable_table=True,
        language="en",
        model_version="vlm"
    )
    
    print(f"\nTask Result: {task_result}\n")
    
    if not task_result.get('success'):
        print(f"❌ Failed to create task!")
        print(f"Error: {task_result.get('error')}")
        print(f"Error Type: {task_result.get('error_type')}")
        return False
    
    task_id = task_result.get('task_id')
    print(f"✅ Task created successfully: {task_id}")
    
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 test_firebase_url.py <firebase_storage_url>")
        print("\nExample:")
        print("python3 test_firebase_url.py 'https://storage.googleapis.com/pageperfectai.appspot.com/books/...'")
        sys.exit(1)
    
    pdf_url = sys.argv[1]
    test_firebase_url(pdf_url)

