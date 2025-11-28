"""
Test different file upload services to find which one works
"""

import requests
import sys
import os

def test_upload_services(pdf_path):
    """Test different file upload services"""
    
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        return None
    
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()
    
    print(f"Testing with PDF: {pdf_path}")
    print(f"File size: {len(pdf_bytes):,} bytes ({len(pdf_bytes)/1024/1024:.2f} MB)\n")
    
    # Test 1: 0x0.st (Simple and reliable)
    print("=" * 80)
    print("TEST 1: 0x0.st")
    print("=" * 80)
    try:
        print("Uploading...")
        response = requests.post(
            'https://0x0.st',
            files={'file': ('document.pdf', pdf_bytes, 'application/pdf')},
            timeout=120
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        if response.status_code == 200:
            url = response.text.strip()
            print(f"✅ SUCCESS! URL: {url}")
            
            # Verify it's accessible
            print("Verifying URL is accessible...")
            verify = requests.head(url, timeout=10)
            print(f"Verification: {verify.status_code}")
            if verify.status_code == 200:
                print("✅ URL is publicly accessible!")
                return url
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: tmpfiles.org
    print("\n" + "=" * 80)
    print("TEST 2: tmpfiles.org")
    print("=" * 80)
    try:
        print("Uploading...")
        response = requests.post(
            'https://tmpfiles.org/api/v1/upload',
            files={'file': ('document.pdf', pdf_bytes, 'application/pdf')},
            timeout=120
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('status') == 'success':
                url = result['data']['url']
                # tmpfiles.org returns a URL that needs to be modified for direct download
                url = url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
                print(f"✅ SUCCESS! URL: {url}")
                
                # Verify it's accessible
                print("Verifying URL is accessible...")
                verify = requests.head(url, timeout=10)
                print(f"Verification: {verify.status_code}")
                if verify.status_code == 200:
                    print("✅ URL is publicly accessible!")
                    return url
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: file.io
    print("\n" + "=" * 80)
    print("TEST 3: file.io")
    print("=" * 80)
    try:
        print("Uploading...")
        response = requests.post(
            'https://file.io/',
            files={'file': ('document.pdf', pdf_bytes, 'application/pdf')},
            data={'expires': '1d'},
            timeout=120
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                url = result.get('link')
                print(f"✅ SUCCESS! URL: {url}")
                return url
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: catbox.moe
    print("\n" + "=" * 80)
    print("TEST 4: catbox.moe")
    print("=" * 80)
    try:
        print("Uploading...")
        response = requests.post(
            'https://catbox.moe/user/api.php',
            data={'reqtype': 'fileupload'},
            files={'fileToUpload': ('document.pdf', pdf_bytes, 'application/pdf')},
            timeout=120
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        if response.status_code == 200 and response.text.startswith('http'):
            url = response.text.strip()
            print(f"✅ SUCCESS! URL: {url}")
            
            # Verify it's accessible
            print("Verifying URL is accessible...")
            verify = requests.head(url, timeout=10)
            print(f"Verification: {verify.status_code}")
            if verify.status_code == 200:
                print("✅ URL is publicly accessible!")
                return url
        else:
            print(f"❌ Failed")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 80)
    print("❌ ALL SERVICES FAILED")
    print("=" * 80)
    return None

if __name__ == "__main__":
    # Use the downloaded test PDF
    test_pdf = "/tmp/test.pdf"
    
    if not os.path.exists(test_pdf):
        print("Downloading test PDF...")
        response = requests.get("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
        with open(test_pdf, 'wb') as f:
            f.write(response.content)
        print(f"Downloaded to {test_pdf}\n")
    
    working_url = test_upload_services(test_pdf)
    
    if working_url:
        print(f"\n✅ FOUND WORKING SERVICE!")
        print(f"URL: {working_url}")
        print("\nThis service can be used in the Cloud Function.")
    else:
        print("\n❌ No working service found.")
        print("You may need to use a different approach (e.g., your own server).")

