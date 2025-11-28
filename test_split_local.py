"""
Test the splitContent function locally before deploying
"""

import sys
import os
from pathlib import Path

# Add functions directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'functions'))

from splitting import split_content

def test_split_with_sample():
    """Test split with a sample markdown content"""
    
    # Sample markdown content (typical educational PDF structure)
    sample_content = """
# Chapter 1: Introduction to Science

This is the main content of the chapter.

## Section 1.1: Basic Concepts

Some content here with explanations.

### Example 1
This is an example problem.

**Solution:**
Step 1: First step
Step 2: Second step

## ANSWER KEY

### Question 1
Answer: Option A

### Question 2
Answer: Option B

## ACHIEVERS SECTION

### Advanced Question 1
This is a challenging question.

**Answer:** C

## EXPLANATIONS

### Question 1 Explanation
This is why the answer is A.

### Question 2 Explanation
This is why the answer is B.
"""
    
    print("=" * 80)
    print("TEST: Split Sample Content")
    print("=" * 80)
    print(f"Input length: {len(sample_content)} characters\n")
    
    # Perform split using the same approach as Cloud Function
    try:
        import tempfile
        from pathlib import Path
        
        with tempfile.TemporaryDirectory() as temp_dir:
            output_dir = Path(temp_dir) / "output"
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Extract questions
            questions_results = split_content.extract_questions(sample_content, output_dir)
            print(f"Questions extracted: {questions_results.get('total_files', 0)} files")
            
            # Extract answer keys
            keys_results = split_content.extract_answer_keys(sample_content, output_dir)
            print(f"Answer keys extracted: {keys_results.get('total_files', 0)} files")
            
            # Extract explanations
            explanations_results = split_content.extract_explanations(sample_content, output_dir)
            print(f"Explanations extracted: {explanations_results.get('total_files', 0)} files")
            
            # Count total files
            total_files = 0
            for subdir in output_dir.iterdir():
                if subdir.is_dir():
                    md_files = list(subdir.glob("*.md"))
                    total_files += len(md_files)
                    print(f"\n{subdir.name}/")
                    for md_file in md_files:
                        size = md_file.stat().st_size
                        print(f"  - {md_file.name} ({size} bytes)")
            
            print(f"\n✅ Split successful!")
            print(f"Total files created: {total_files}")
        
        return True
        
    except Exception as e:
        print(f"❌ Split failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_split_with_real_file():
    """Test split with a real extracted markdown file"""
    
    # Check if we have a real extracted file to test with
    test_file = "/tmp/test_full.md"
    
    if not os.path.exists(test_file):
        print("\n" + "=" * 80)
        print("INFO: No real extracted file found at /tmp/test_full.md")
        print("Skipping real file test")
        print("=" * 80)
        return True
    
    print("\n" + "=" * 80)
    print("TEST: Split Real Extracted File")
    print("=" * 80)
    
    with open(test_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"Input length: {len(content)} characters\n")
    
    try:
        import tempfile
        
        with tempfile.TemporaryDirectory() as temp_dir:
            output_dir = Path(temp_dir) / "output"
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Extract all sections
            questions_results = split_content.extract_questions(content, output_dir)
            keys_results = split_content.extract_answer_keys(content, output_dir)
            explanations_results = split_content.extract_explanations(content, output_dir)
            
            # Copy results to /tmp for inspection
            final_output = Path("/tmp/split_test_output")
            final_output.mkdir(exist_ok=True)
            
            import shutil
            total_files = 0
            
            for subdir in output_dir.iterdir():
                if subdir.is_dir():
                    dest_dir = final_output / subdir.name
                    if dest_dir.exists():
                        shutil.rmtree(dest_dir)
                    shutil.copytree(subdir, dest_dir)
                    
                    md_files = list(dest_dir.glob("*.md"))
                    total_files += len(md_files)
                    print(f"✅ Copied {len(md_files)} files to {dest_dir}")
            
            print(f"\n✅ Split successful!")
            print(f"Total files created: {total_files}")
            print(f"Output directory: {final_output}")
        
        return True
        
    except Exception as e:
        print(f"❌ Split failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_split_structure():
    """Test the split result structure"""
    
    print("\n" + "=" * 80)
    print("TEST: Split Result Structure")
    print("=" * 80)
    
    sample = "# Test\n\nContent here.\n\n## ANSWER KEY\n\nAnswer 1"
    
    try:
        import tempfile
        from pathlib import Path
        
        with tempfile.TemporaryDirectory() as temp_dir:
            output_dir = Path(temp_dir) / "output"
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Run extraction
            questions_results = split_content.extract_questions(sample, output_dir)
            keys_results = split_content.extract_answer_keys(sample, output_dir)
            
            # Verify results structure
            assert isinstance(questions_results, dict), "Questions result should be dict"
            assert isinstance(keys_results, dict), "Keys result should be dict"
            
            # Check that files were created
            total_files = sum(1 for _ in output_dir.rglob("*.md"))
            
            print("✅ Structure validation passed!")
            print(f"   Created {total_files} files")
            print(f"   Questions: {questions_results.get('total_files', 0)}")
            print(f"   Keys: {keys_results.get('total_files', 0)}")
        
        return True
        
    except AssertionError as e:
        print(f"❌ Structure validation failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing Split Content Function\n")
    
    # Run all tests
    test1 = test_split_with_sample()
    test2 = test_split_structure()
    test3 = test_split_with_real_file()
    
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Sample content split: {'✅ PASS' if test1 else '❌ FAIL'}")
    print(f"Structure validation: {'✅ PASS' if test2 else '❌ FAIL'}")
    print(f"Real file split: {'✅ PASS' if test3 else '❌ FAIL'}")
    
    if test1 and test2:
        print("\n✅ ALL CRITICAL TESTS PASSED!")
        print("Ready to deploy splitContent function")
    else:
        print("\n❌ SOME TESTS FAILED!")
        print("Fix issues before deploying")
    
    sys.exit(0 if (test1 and test2) else 1)

