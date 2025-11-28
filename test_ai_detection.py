#!/usr/bin/env python3
"""
Local Test Script for AI Pattern Detection
Tests the pattern detection with your actual full.md file
"""

import sys
import os
from pathlib import Path

# Add functions directory to path
sys.path.insert(0, str(Path(__file__).parent / 'functions'))

def test_with_actual_ai():
    """Test with actual Vertex AI (requires credentials)"""
    try:
        from ai_pattern_detection import detect_patterns_with_ai
        
        print("🤖 Testing with Actual Vertex AI Gemini...")
        print("=" * 70)
        
        # Read full.md
        full_md_path = Path(__file__).parent / "full.md"
        if not full_md_path.exists():
            print(f"❌ Error: full.md not found at {full_md_path}")
            return False
        
        print(f"📄 Reading: {full_md_path}")
        content = full_md_path.read_text(encoding='utf-8')
        print(f"✓ Loaded: {len(content)} characters, {content.count(chr(10))} lines")
        
        # Get project ID from environment
        project_id = os.environ.get('GOOGLE_CLOUD_PROJECT') or os.environ.get('GCP_PROJECT')
        if not project_id:
            print("\n⚠️  No GOOGLE_CLOUD_PROJECT environment variable set")
            print("   Set it with: export GOOGLE_CLOUD_PROJECT=your-project-id")
            return False
        
        print(f"\n🌐 Using project: {project_id}")
        print("\n🔍 Calling Vertex AI Gemini Pro...")
        print("   This may take 5-10 seconds...")
        
        # Detect patterns
        result = detect_patterns_with_ai(content, project_id=project_id)
        
        print("\n" + "=" * 70)
        print("RESULTS")
        print("=" * 70)
        
        if result.get('success'):
            print(f"✅ Success! Confidence: {result.get('confidence', 'unknown')}")
            print(f"\n📝 Notes: {result.get('notes', 'None')}")
            
            patterns = result.get('patterns', {})
            
            # Display detected patterns
            print("\n" + "-" * 70)
            print("QUESTIONS SECTION")
            print("-" * 70)
            for section in ['competency', 'level1', 'level2', 'achievers']:
                if section in patterns.get('questions', {}):
                    data = patterns['questions'][section]
                    print(f"\n{section.upper()}:")
                    print(f"  Start: {data.get('start', [])}")
                    if 'end' in data:
                        print(f"  End:   {data.get('end', [])}")
            
            print("\n" + "-" * 70)
            print("ANSWER KEYS SECTION")
            print("-" * 70)
            if 'answerKeys' in patterns:
                ak = patterns['answerKeys']
                print(f"\nSection Start: {ak.get('sectionStart', [])}")
                for section in ['competency', 'level1', 'level2', 'achievers']:
                    if section in ak:
                        print(f"\n{section.upper()}: {ak[section].get('start', [])}")
            
            print("\n" + "-" * 70)
            print("EXPLANATIONS SECTION")
            print("-" * 70)
            if 'explanations' in patterns:
                exp = patterns['explanations']
                print(f"\nSection Start: {exp.get('sectionStart', [])}")
                for section in ['competency', 'level1', 'level2', 'achievers']:
                    if section in exp:
                        print(f"\n{section.upper()}: {exp[section].get('start', [])}")
            
            return True
        else:
            print(f"❌ Failed: {result.get('error', 'Unknown error')}")
            if 'raw_response' in result:
                print(f"\n📄 Raw Response (first 500 chars):")
                print(result['raw_response'][:500])
            return False
            
    except ImportError as e:
        print(f"❌ Error: {e}")
        print("\n💡 Install required packages:")
        print("   pip install google-cloud-aiplatform")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_with_mock_ai():
    """Test with simulated AI response (no credentials needed)"""
    print("🎭 Testing with Simulated AI Response...")
    print("=" * 70)
    
    # Read full.md
    full_md_path = Path(__file__).parent / "full.md"
    if not full_md_path.exists():
        print(f"❌ Error: full.md not found at {full_md_path}")
        return False
    
    print(f"📄 Reading: {full_md_path}")
    content = full_md_path.read_text(encoding='utf-8')
    print(f"✓ Loaded: {len(content)} characters, {content.count(chr(10))} lines")
    
    # Simulate AI detection by analyzing actual content
    print("\n🔍 Analyzing content patterns manually...")
    
    import re
    headings = re.findall(r'^#+\s+.+$', content, re.MULTILINE)
    
    # Find key patterns
    patterns_found = {}
    for i, heading in enumerate(headings):
        line_num = content[:content.find(heading)].count('\n') + 1
        
        # Questions
        if 'Competency' in heading and 'Questions' in heading:
            patterns_found['competency_start'] = (heading, line_num)
        elif 'LEVEL1' in heading and i < 50:  # First occurrence
            patterns_found['level1_start'] = (heading, line_num)
        elif heading == '# LEVEL' and 'level2_start' not in patterns_found:
            patterns_found['level2_start'] = (heading, line_num)
        elif 'ACHIEVERS' in heading and 'SECTION' in heading and 'achievers_start' not in patterns_found:
            patterns_found['achievers_start'] = (heading, line_num)
        elif 'Answer-Key' in heading or 'Answer Key' in heading:
            patterns_found['answer_key_section'] = (heading, line_num)
        elif 'Answers with Explanations' in heading:
            patterns_found['explanations_section'] = (heading, line_num)
    
    print("\n" + "=" * 70)
    print("DETECTED PATTERNS")
    print("=" * 70)
    
    for key, (heading, line_num) in patterns_found.items():
        print(f"\n{key:30s} Line {line_num:4d}: {heading}")
    
    # Create simulated AI response
    simulated_result = {
        'success': True,
        'confidence': 'high',
        'notes': 'Simulated detection based on pattern analysis',
        'patterns': {
            'questions': {
                'competency': {
                    'start': [patterns_found.get('competency_start', ('', 0))[0]],
                    'end': [patterns_found.get('level1_start', ('', 0))[0]]
                },
                'level1': {
                    'start': [patterns_found.get('level1_start', ('', 0))[0]],
                    'end': [patterns_found.get('level2_start', ('', 0))[0]]
                },
                'level2': {
                    'start': [patterns_found.get('level2_start', ('', 0))[0]],
                    'end': [patterns_found.get('achievers_start', ('', 0))[0]]
                },
                'achievers': {
                    'start': [patterns_found.get('achievers_start', ('', 0))[0]],
                    'end': [patterns_found.get('answer_key_section', ('', 0))[0]]
                }
            },
            'answerKeys': {
                'sectionStart': [patterns_found.get('answer_key_section', ('', 0))[0]]
            },
            'explanations': {
                'sectionStart': [patterns_found.get('explanations_section', ('', 0))[0]]
            }
        }
    }
    
    return simulated_result


def test_splitting_with_detected_patterns(patterns):
    """Test the actual splitting with detected patterns"""
    print("\n\n" + "=" * 70)
    print("TESTING SPLITTING WITH DETECTED PATTERNS")
    print("=" * 70)
    
    # Import splitting modules
    try:
        from splitting import split_content, patterns_config
    except ImportError:
        print("❌ Error: Could not import splitting modules")
        return False
    
    # Read full.md
    full_md_path = Path(__file__).parent / "full.md"
    content = full_md_path.read_text(encoding='utf-8')
    
    # Convert patterns to internal format
    print("\n📝 Converting AI patterns to internal format...")
    
    # Set patterns
    custom_patterns = {}
    
    if 'questions' in patterns:
        custom_patterns['questions'] = {}
        for section in ['competency', 'level1', 'level2', 'achievers']:
            if section in patterns['questions']:
                sect_data = patterns['questions'][section]
                custom_patterns['questions'][section] = {
                    'start': sect_data.get('start', []),
                    'end': sect_data.get('end', [])
                }
    
    if 'answerKeys' in patterns:
        custom_patterns['answerKeys'] = patterns['answerKeys']
    
    if 'explanations' in patterns:
        custom_patterns['explanations'] = patterns['explanations']
    
    # Create output directory
    output_dir = Path(__file__).parent / "test_ai_split_output"
    output_dir.mkdir(exist_ok=True)
    
    print(f"📁 Output directory: {output_dir}")
    print("\n🔄 Running extraction...")
    
    # Run extraction
    try:
        questions_results = split_content.extract_questions(
            content, 
            output_dir, 
            custom_patterns=custom_patterns
        )
        
        keys_results = split_content.extract_answer_keys(
            content,
            output_dir,
            custom_patterns=custom_patterns
        )
        
        explanations_results = split_content.extract_explanations(
            content,
            output_dir,
            custom_patterns=custom_patterns
        )
        
        # Show results
        print("\n" + "=" * 70)
        print("EXTRACTION RESULTS")
        print("=" * 70)
        
        # List generated files
        question_files = list((output_dir / "Question_output").glob("*.md")) if (output_dir / "Question_output").exists() else []
        key_files = list((output_dir / "Answer_Key_output").glob("*.md")) if (output_dir / "Answer_Key_output").exists() else []
        answer_files = list((output_dir / "Answer_output").glob("*.md")) if (output_dir / "Answer_output").exists() else []
        
        print(f"\n✅ Generated {len(question_files)} question files")
        for f in sorted(question_files):
            size = f.stat().st_size
            print(f"   ✓ {f.name:45s} {size:6,d} bytes")
        
        print(f"\n✅ Generated {len(key_files)} answer key files")
        for f in sorted(key_files):
            size = f.stat().st_size
            print(f"   ✓ {f.name:45s} {size:6,d} bytes")
        
        print(f"\n✅ Generated {len(answer_files)} explanation files")
        for f in sorted(answer_files):
            size = f.stat().st_size
            print(f"   ✓ {f.name:45s} {size:6,d} bytes")
        
        total_files = len(question_files) + len(key_files) + len(answer_files)
        print(f"\n🎉 Total: {total_files} files generated!")
        
        if total_files == 19:
            print("✅ SUCCESS! All 19 expected files generated!")
            return True
        else:
            print(f"⚠️  Expected 19 files, got {total_files}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error during extraction: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main test function"""
    print("\n" + "=" * 70)
    print("AI PATTERN DETECTION - LOCAL TEST")
    print("=" * 70)
    print("\nThis script tests AI pattern detection locally before deployment.")
    print("\nOptions:")
    print("  1. Test with actual Vertex AI (requires credentials)")
    print("  2. Test with simulated AI (no credentials needed)")
    print("  3. Both")
    print()
    
    choice = input("Choose option (1/2/3) [default: 2]: ").strip() or "2"
    
    patterns = None
    
    if choice in ['1', '3']:
        print("\n")
        success = test_with_actual_ai()
        if success:
            # Extract patterns would need to be stored
            print("\n✅ Actual AI test passed!")
        else:
            print("\n❌ Actual AI test failed")
            if choice == '1':
                return
    
    if choice in ['2', '3']:
        print("\n")
        result = test_with_mock_ai()
        if result:
            patterns = result.get('patterns')
            print("\n✅ Mock AI test completed!")
        else:
            print("\n❌ Mock AI test failed")
            return
    
    # Test splitting with detected patterns
    if patterns:
        proceed = input("\n\nTest splitting with detected patterns? (y/n) [default: y]: ").strip().lower()
        if proceed != 'n':
            test_splitting_with_detected_patterns(patterns)
    
    print("\n" + "=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)


if __name__ == '__main__':
    main()

