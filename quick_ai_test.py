#!/usr/bin/env python3
"""
Quick AI Pattern Detection Test (Non-Interactive)
Tests the AI detection logic without requiring user input.
"""

import sys
from pathlib import Path

# Add functions directory to path
sys.path.insert(0, str(Path(__file__).parent / "functions"))

# Try to import AI detection (will fail if vertexai not installed)
try:
    from ai_pattern_detection import detect_patterns_with_ai
    AI_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Warning: Could not import AI detection: {e}")
    print("   This is expected if vertexai is not installed locally.")
    AI_AVAILABLE = False
    
    # Create a mock function for testing
    def detect_patterns_with_ai(content: str, project_id: str = None, location: str = "us-central1"):
        """Mock function that returns simulated patterns"""
        return {
            'success': True,
            'patterns': {
                'questions': {
                    'competency': {
                        'start': ['# Competency-Focused Questions'],
                        'end': ['# LEVEL1']
                    },
                    'level1': {
                        'start': ['# LEVEL1'],
                        'end': ['# LEVEL']
                    },
                    'level2': {
                        'start': ['# LEVEL'],
                        'end': ['# ACHIEVERS\' SECTION']
                    },
                    'achievers': {
                        'start': ['# ACHIEVERS\' SECTION'],
                        'end': ['# Answer-Key']
                    }
                },
                'answerKeys': {
                    'sectionStart': ['# Answer-Key'],
                    'competency': {'start': ['# NCERT COMPETENCY BASED QUESTIONS']},
                    'level1': {'start': ['# LEVEL1']},
                    'level2': {'start': ['# LEVEL']},
                    'achievers': {'start': ['# ACHIEVERS\' SECTION']}
                },
                'explanations': {
                    'sectionStart': ['# Answers with Explanations'],
                    'competency': {'start': ['# NCERT COMPETENCY BASED QUESTIONS']},
                    'level1': {'start': ['# LEVEL1']},
                    'level2': {'start': ['# LEVEL']},
                    'achievers': {'start': ['# ACHIEVERS\' SECTION']}
                }
            },
            'confidence': 'simulated',
            'notes': 'Simulated patterns for local testing'
        }

def main():
    print("\n" + "="*70)
    print("🤖 QUICK AI PATTERN DETECTION TEST")
    print("="*70)
    
    # Check if full.md exists
    full_md_path = Path(__file__).parent / "full.md"
    if not full_md_path.exists():
        print(f"\n❌ Error: full.md not found at {full_md_path}")
        print("   Please ensure full.md is in the project root.")
        return 1
    
    # Load content
    print(f"\n📄 Loading: {full_md_path.name}")
    full_md_content = full_md_path.read_text(encoding='utf-8')
    print(f"   Size: {len(full_md_content):,} characters, {full_md_content.count(chr(10)):,} lines")
    
    # Detect patterns
    print(f"\n🔍 Running AI pattern detection... (AI_AVAILABLE: {AI_AVAILABLE})")
    
    if not AI_AVAILABLE:
        print("   Using SIMULATED mode (vertexai not installed)")
    
    try:
        result = detect_patterns_with_ai(full_md_content)
        
        if not result.get('success'):
            print(f"\n❌ AI detection failed: {result.get('error', 'Unknown error')}")
            return 1
        
        detected_patterns = result.get('patterns', {})
        confidence = result.get('confidence', 'unknown')
        notes = result.get('notes', '')
        
        if not detected_patterns:
            print("\n❌ AI detection returned empty patterns!")
            return 1
        
        print("\n✅ AI Detection Successful!")
        print(f"   Confidence: {confidence}")
        if notes:
            print(f"   Notes: {notes}")
        
        print("\n📋 Detected Patterns:")
        print("-" * 70)
        
        # Display questions patterns
        print("\n🔹 QUESTIONS:")
        for section in ['competency', 'level1', 'level2', 'achievers']:
            if section in detected_patterns.get('questions', {}):
                data = detected_patterns['questions'][section]
                start = data.get('start', ['NOT_FOUND'])[0] if data.get('start') else 'NOT_FOUND'
                
                # Find line number
                line_num = "?"
                if start != 'NOT_FOUND':
                    try:
                        lines = full_md_content.splitlines()
                        for i, line in enumerate(lines, 1):
                            if start.strip() in line:
                                line_num = str(i)
                                break
                    except:
                        pass
                
                status = "✅" if start != 'NOT_FOUND' else "❌"
                print(f"  {status} {section:15} Line {line_num:>5}: {start}")
        
        # Display answer keys patterns
        print("\n🔹 ANSWER KEYS:")
        if 'answerKeys' in detected_patterns:
            ak = detected_patterns['answerKeys']
            if 'sectionStart' in ak:
                start = ak['sectionStart'][0] if isinstance(ak['sectionStart'], list) else ak['sectionStart']
                print(f"  ✅ {'Section Start':15} : {start}")
            
            for section in ['competency', 'level1', 'level2', 'achievers']:
                if section in ak:
                    start = ak[section].get('start', ['NOT_FOUND'])[0] if ak[section].get('start') else 'NOT_FOUND'
                    status = "✅" if start != 'NOT_FOUND' else "❌"
                    print(f"  {status} {section:15} : {start}")
        
        # Display explanations patterns
        print("\n🔹 EXPLANATIONS:")
        if 'explanations' in detected_patterns:
            exp = detected_patterns['explanations']
            if 'sectionStart' in exp:
                start = exp['sectionStart'][0] if isinstance(exp['sectionStart'], list) else exp['sectionStart']
                print(f"  ✅ {'Section Start':15} : {start}")
            
            for section in ['competency', 'level1', 'level2', 'achievers']:
                if section in exp:
                    start = exp[section].get('start', ['NOT_FOUND'])[0] if exp[section].get('start') else 'NOT_FOUND'
                    status = "✅" if start != 'NOT_FOUND' else "❌"
                    print(f"  {status} {section:15} : {start}")
        
        print("\n" + "="*70)
        print("🎉 AI PATTERN DETECTION TEST PASSED!")
        print("="*70)
        
        # Check if it's simulated or real
        if not AI_AVAILABLE or confidence == 'simulated':
            print("\n💡 Note: Currently running in SIMULATED mode")
            print("   To test with real AI:")
            print("   1. Install: pip install google-cloud-aiplatform vertexai")
            print("   2. Set up GCP credentials")
            print("   3. Run this test again")
        else:
            print("\n🚀 Real AI detection is working!")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Error during AI detection: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)

