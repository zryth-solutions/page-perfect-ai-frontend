"""
Test the extraction logic locally before deploying
"""

import sys
import os
import tempfile
import requests

# Add functions directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'functions'))

from extraction.mineru_client import MinerUClient
from firebase_admin import initialize_app, storage

# Initialize Firebase
initialize_app()

# MinerU API token
MINERU_TOKEN = "eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ.eyJqdGkiOiI3OTQwMDE4NCIsInJvbCI6IlJPTEVfUkVHSVNURVIiLCJpc3MiOiJPcGVuWExhYiIsImlhdCI6MTc2MzQ1MTc4MywiY2xpZW50SWQiOiJsa3pkeDU3bnZ5MjJqa3BxOXgydyIsInBob25lIjoiIiwib3BlbklkIjpudWxsLCJ1dWlkIjoiMjY4ZjkxZGEtNjE0Ny00Y2ZhLWI3NjAtNjJkYzdhZDBlN2I2IiwiZW1haWwiOiJtYW5hc0B6cnl0aC5jb20iLCJleHAiOjE3NjQ2NjEzODN9.20nRG36w20Ntxkn44bukRy3o6kV-CYJIt27HAeCF2mUSvwV_81p3dlJ20H971IV-QLhgC1pc19C-CRxkHvMXfw"

def test_file_upload_services():
    """Test different file upload services"""
    
    # Use a small test PDF
    test_pdf = "/tmp/test.pdf"
    
    # Download a test PDF if it doesn't exist
    if not os.path.exists(test_pdf):
        print("Downloading test PDF...")
        response = requests.get("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
        with open(test_pdf, 'wb') as f:
            f.write(response.content)
    
    with open(test_pdf, 'rb') as f:
        pdf_bytes = f.read()
    
    print(f"Test PDF size: {len(pdf_bytes)} bytes\n")
    
    # Test 1: file.io
    print("=" * 80)
    print("TEST 1: file.io")
    print("=" * 80)
    try:
        response = requests.post(
            'https://file.io/',
            files={'file': ('document.pdf', pdf_bytes, 'application/pdf')},
            data={'expires': '1d'},
            timeout=30
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success')}")
            print(f"Link: {result.get('link')}")
            if result.get('success'):
                print("✅ file.io works!")
                return result.get('link')
        else:
            print("❌ file.io failed")
    except Exception as e:
        print(f"❌ file.io error: {e}")
    
    # Test 2: 0x0.st
    print("\n" + "=" * 80)
    print("TEST 2: 0x0.st")
    print("=" * 80)
    try:
        response = requests.post(
            'https://0x0.st',
            files={'file': ('document.pdf', pdf_bytes, 'application/pdf')},
            timeout=30
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            url = response.text.strip()
            print(f"URL: {url}")
            print("✅ 0x0.st works!")
            return url
        else:
            print("❌ 0x0.st failed")
    except Exception as e:
        print(f"❌ 0x0.st error: {e}")
    
    # Test 3: tmpfiles.org
    print("\n" + "=" * 80)
    print("TEST 3: tmpfiles.org")
    print("=" * 80)
    try:
        response = requests.post(
            'https://tmpfiles.org/api/v1/upload',
            files={'file': ('document.pdf', pdf_bytes, 'application/pdf')},
            timeout=30
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Status: {result.get('status')}")
            if result.get('status') == 'success':
                url = result['data']['url']
                # tmpfiles.org returns a URL that needs to be modified
                url = url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
                print(f"URL: {url}")
                print("✅ tmpfiles.org works!")
                return url
        else:
            print("❌ tmpfiles.org failed")
    except Exception as e:
        print(f"❌ tmpfiles.org error: {e}")
    
    print("\n❌ All services failed!")
    return None

def test_with_firebase_storage():
    """Test downloading from Firebase Storage and uploading"""
    
    print("\n" + "=" * 80)
    print("TEST: Complete Flow with Firebase Storage")
    print("=" * 80)
    
    # Download a PDF from Firebase Storage
    pdf_path = "books/MK6MPIynTlrHgqMPvJ3H/Rw0jMwvPi7cMjgRGtIPPNTY6Bq83/1764085066109_chp-11.pdf"
    
    print(f"\n1. Downloading from Firebase Storage: {pdf_path}")
    try:
        bucket = storage.bucket('pageperfectai.firebasestorage.app')
        blob = bucket.blob(pdf_path)
        
        temp_pdf = tempfile.mktemp(suffix='.pdf')
        blob.download_to_filename(temp_pdf)
        
        file_size = os.path.getsize(temp_pdf)
        print(f"✅ Downloaded {file_size} bytes to {temp_pdf}")
        
        # Read the file
        with open(temp_pdf, 'rb') as f:
            pdf_bytes = f.read()
        
        print(f"\n2. Uploading to temporary service...")
        
        # Try 0x0.st (simplest, most reliable)
        response = requests.post(
            'https://0x0.st',
            files={'file': ('document.pdf', pdf_bytes, 'application/pdf')},
            timeout=60
        )
        
        if response.status_code == 200:
            pdf_url = response.text.strip()
            print(f"✅ Uploaded successfully: {pdf_url}")
            
            print(f"\n3. Testing with MinerU...")
            client = MinerUClient(token=MINERU_TOKEN)
            
            task_result = client.create_extraction_task(
                pdf_url=pdf_url,
                is_ocr=True,
                enable_formula=True,
                enable_table=True,
                language="en",
                model_version="vlm"
            )
            
            if task_result.get('success'):
                print(f"✅ MinerU task created: {task_result.get('task_id')}")
                print("\n🎉 COMPLETE FLOW WORKS!")
                return True
            else:
                print(f"❌ MinerU failed: {task_result.get('error')}")
                return False
        else:
            print(f"❌ Upload failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        try:
            os.unlink(temp_pdf)
        except:
            pass

if __name__ == "__main__":
    print("Testing File Upload Services\n")
    
    # Test 1: Which service works?
    working_url = test_file_upload_services()
    
    if working_url:
        print(f"\n✅ Found working service: {working_url}")
        
        # Test 2: Complete flow
        print("\n" + "=" * 80)
        success = test_with_firebase_storage()
        
        if success:
            print("\n" + "=" * 80)
            print("✅ ALL TESTS PASSED!")
            print("=" * 80)
            print("\nReady to deploy!")
        else:
            print("\n❌ Complete flow failed")
    else:
        print("\n❌ No working upload service found")

