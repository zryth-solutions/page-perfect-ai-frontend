"""
Test MinerU API locally with a PDF file
This will help us verify if the issue is with MinerU API or our Cloud Function
"""

import sys
import os
import time

# Add the functions directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'functions'))

from extraction.mineru_client import MinerUClient

# MinerU API token
MINERU_TOKEN = "eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ.eyJqdGkiOiI3OTQwMDE4NCIsInJvbCI6IlJPTEVfUkVHSVNURVIiLCJpc3MiOiJPcGVuWExhYiIsImlhdCI6MTc2MzQ1MTc4MywiY2xpZW50SWQiOiJsa3pkeDU3bnZ5MjJqa3BxOXgydyIsInBob25lIjoiIiwib3BlbklkIjpudWxsLCJ1dWlkIjoiMjY4ZjkxZGEtNjE0Ny00Y2ZhLWI3NjAtNjJkYzdhZDBlN2I2IiwiZW1haWwiOiJtYW5hc0B6cnl0aC5jb20iLCJleHAiOjE3NjQ2NjEzODN9.20nRG36w20Ntxkn44bukRy3o6kV-CYJIt27HAeCF2mUSvwV_81p3dlJ20H971IV-QLhgC1pc19C-CRxkHvMXfw"

def test_with_url(pdf_url):
    """Test MinerU with a PDF URL"""
    print("=" * 80)
    print("Testing MinerU API with URL")
    print("=" * 80)
    print(f"\nPDF URL: {pdf_url}")
    
    # Initialize client
    client = MinerUClient(token=MINERU_TOKEN)
    
    # Create extraction task
    print("\n1. Creating extraction task...")
    task_result = client.create_extraction_task(
        pdf_url=pdf_url,
        is_ocr=True,
        enable_formula=True,
        enable_table=True,
        language="en",
        model_version="vlm"
    )
    
    if not task_result.get('success'):
        print(f"❌ Failed to create task: {task_result.get('error')}")
        return False
    
    task_id = task_result.get('task_id')
    print(f"✅ Task created: {task_id}")
    
    # Wait for completion
    print("\n2. Waiting for extraction to complete...")
    result = client.wait_for_completion(
        task_id=task_id,
        poll_interval=5,
        max_wait_time=600  # 10 minutes
    )
    
    if not result.get('success'):
        print(f"❌ Extraction failed: {result.get('error')}")
        return False
    
    if result.get('state') != 'done':
        print(f"❌ Extraction incomplete: {result.get('state')}")
        print(f"Error: {result.get('err_msg')}")
        return False
    
    print(f"✅ Extraction completed!")
    print(f"ZIP URL: {result.get('full_zip_url')}")
    
    return True

def test_with_firebase_storage():
    """Test with a Firebase Storage URL"""
    print("\n" + "=" * 80)
    print("Testing with Firebase Storage URL")
    print("=" * 80)
    
    # Example Firebase Storage URL format
    # Replace with actual URL from your storage
    firebase_url = input("\nEnter Firebase Storage URL (or press Enter to skip): ").strip()
    
    if firebase_url:
        return test_with_url(firebase_url)
    else:
        print("Skipped Firebase Storage test")
        return None

def test_with_public_pdf():
    """Test with a known public PDF"""
    print("\n" + "=" * 80)
    print("Testing with a public PDF (sample)")
    print("=" * 80)
    
    # A small public PDF for testing
    public_pdf = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    
    return test_with_url(public_pdf)

def main():
    print("MinerU API Local Test")
    print("=" * 80)
    
    # Test 1: Public PDF (to verify API works)
    print("\n### TEST 1: Public PDF (Baseline Test)")
    test1_result = test_with_public_pdf()
    
    if test1_result:
        print("\n✅ MinerU API is working correctly!")
    else:
        print("\n❌ MinerU API test failed!")
        print("This suggests an issue with the API key or MinerU service.")
        return
    
    # Test 2: Firebase Storage URL
    print("\n### TEST 2: Firebase Storage URL")
    test2_result = test_with_firebase_storage()
    
    if test2_result is None:
        print("\nSkipped Firebase Storage test")
    elif test2_result:
        print("\n✅ Firebase Storage URL works with MinerU!")
    else:
        print("\n❌ Firebase Storage URL failed!")
        print("\nPossible issues:")
        print("1. URL is not publicly accessible")
        print("2. URL format is incorrect")
        print("3. File is corrupted or not a valid PDF")
        print("4. Storage rules are blocking access")
    
    print("\n" + "=" * 80)
    print("Test Complete")
    print("=" * 80)

if __name__ == "__main__":
    main()

