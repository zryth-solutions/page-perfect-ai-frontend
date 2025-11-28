"""
AI Pattern Detection using Vertex AI Gemini
Analyzes full.md content and automatically detects section markers
"""

import vertexai
from vertexai.generative_models import GenerativeModel
import json
import re
from typing import Dict, List


def detect_patterns_with_ai(content: str, project_id: str = None, location: str = "us-central1") -> Dict:
    """
    Use Vertex AI Gemini to analyze content and detect section markers.
    
    Args:
        content: Full markdown content from full.md
        project_id: Google Cloud project ID
        location: Vertex AI location
        
    Returns:
        Dictionary with detected patterns
    """
    
    # Initialize Vertex AI
    if project_id:
        vertexai.init(project=project_id, location=location)
    
    # Use Gemini 2.5 Pro model
    model = GenerativeModel("gemini-2.5-pro")
    
    # Create a comprehensive prompt for pattern detection
    prompt = f"""
You are an expert at analyzing educational PDF content that has been converted to markdown.
Analyze the following markdown content and identify the exact heading patterns for different sections.

The content typically contains these sections in order:
1. **Theory/Introduction** - Educational content at the beginning
2. **Competency-Focused Questions** - Multiple choice questions testing competency
3. **Level 1 Questions** - Look for headings like "# LEVEL1" or "# LEVEL 1" (NOT "# PYQ's Marathon")
4. **Level 2 Questions** - Look for headings like "# LEVEL" (without number), "# LEVEL2", or "# LEVEL 2"
5. **Achievers Section** - Look for "# ACHIEVERS' SECTION" or "# ACHIEVERS SECTION"
6. **Answer-Key Section** - Contains answer keys for all questions
7. **Explanations Section** - Contains detailed explanations for all answers

Within the Answer-Key section, there are subsections for:
- Competency answer keys
- Level 1 answer keys  
- Level 2 answer keys
- Achievers answer keys

Similarly, the Explanations section has subsections for each question type.

**CRITICAL INSTRUCTIONS:**
1. Find the EXACT heading text (including # symbols, spacing, capitalization, punctuation)
2. For Level 1 questions: Look for "# LEVEL1" heading (may appear after "# PYQ's Marathon")
3. For Level 2 questions: Look for "# LEVEL" heading (just "LEVEL" without a number)
4. Pay attention to apostrophes (e.g., "ACHIEVERS' SECTION" vs "ACHIEVERS SECTION")
5. The END marker for Level 1 should be the START marker for Level 2
6. Include the newline character in patterns when needed (e.g., "# LEVEL\n" to distinguish from "# LEVEL1")

Analyze this content and return a JSON object with the detected patterns:

```markdown
{content[:50000]}  # First 50k characters to stay within context limits
```

... (content continues)

**EXAMPLE:**
If you see:
- Line 169: `# Competency-Focused Questions`
- Line 284: `# LEVEL1`
- Line 587: `# LEVEL` (this is Level 2, NOT Level 1!)
- Line 853: `# ACHIEVERS' SECTION`

Then return:
- level1 start: ["# LEVEL1"]
- level1 end: ["# LEVEL"] (or ["# LEVEL\\n"] to be more specific)
- level2 start: ["# LEVEL"]

Return ONLY valid JSON in this exact format (no markdown code blocks, no explanations):
{{
  "questions": {{
    "competency": {{
      "start": ["exact heading text"],
      "end": ["next section heading"],
      "lineNumber": approximate_line_number
    }},
    "level1": {{
      "start": ["exact heading text"],
      "end": ["next section heading"],
      "lineNumber": approximate_line_number
    }},
    "level2": {{
      "start": ["exact heading text"],  
      "end": ["next section heading"],
      "lineNumber": approximate_line_number
    }},
    "achievers": {{
      "start": ["exact heading text"],
      "end": ["next section heading"],
      "lineNumber": approximate_line_number
    }}
  }},
  "answerKeys": {{
    "sectionStart": ["exact heading text"],
    "competency": {{"start": ["..."], "lineNumber": ...}},
    "level1": {{"start": ["..."], "lineNumber": ...}},
    "level2": {{"start": ["..."], "lineNumber": ...}},
    "achievers": {{"start": ["..."], "lineNumber": ...}}
  }},
  "explanations": {{
    "sectionStart": ["exact heading text"],
    "competency": {{"start": ["..."], "lineNumber": ...}},
    "level1": {{"start": ["..."], "lineNumber": ...}},
    "level2": {{"start": ["..."], "lineNumber": ...}},
    "achievers": {{"start": ["..."], "lineNumber": ...}}
  }},
  "confidence": "high|medium|low",
  "notes": "Any important observations about the content structure"
}}
"""
    
    try:
        # Generate response from Gemini
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,  # Low temperature for consistent output
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 40000,  # Gemini 2.5 Pro supports up to 64k tokens
            }
        )
        
        # Extract JSON from response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = re.sub(r'^```json\s*\n', '', response_text)
            response_text = re.sub(r'\n```\s*$', '', response_text)
            response_text = re.sub(r'^```\s*\n', '', response_text)
        
        # Parse JSON
        detected_patterns = json.loads(response_text)
        
        # Validate and clean the patterns
        validated_patterns = validate_and_clean_patterns(detected_patterns, content)
        
        return {
            'success': True,
            'patterns': validated_patterns,
            'confidence': detected_patterns.get('confidence', 'medium'),
            'notes': detected_patterns.get('notes', '')
        }
        
    except json.JSONDecodeError as e:
        print(f"Error parsing AI response: {e}")
        print(f"Response text: {response_text[:500]}")
        return {
            'success': False,
            'error': f'Failed to parse AI response: {str(e)}',
            'raw_response': response_text[:1000]
        }
    except Exception as e:
        print(f"Error in AI pattern detection: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def validate_and_clean_patterns(patterns: Dict, content: str) -> Dict:
    """
    Validate detected patterns by checking if they exist in the content.
    
    Args:
        patterns: Patterns detected by AI
        content: Original markdown content
        
    Returns:
        Validated and cleaned patterns
    """
    validated = {
        'questions': {},
        'answerKeys': {},
        'explanations': {}
    }
    
    # Validate questions section
    for section in ['competency', 'level1', 'level2', 'achievers']:
        if section in patterns.get('questions', {}):
            section_data = patterns['questions'][section]
            start_patterns = section_data.get('start', [])
            
            # Check if pattern exists in content
            valid_starts = [p for p in start_patterns if p in content]
            
            if valid_starts:
                validated['questions'][section] = {
                    'start': valid_starts,
                    'end': section_data.get('end', [])
                }
    
    # Validate answer keys
    if 'answerKeys' in patterns:
        ak = patterns['answerKeys']
        if 'sectionStart' in ak:
            section_start = [p for p in ak['sectionStart'] if p in content]
            if section_start:
                validated['answerKeys']['sectionStart'] = section_start
        
        for section in ['competency', 'level1', 'level2', 'achievers']:
            if section in ak:
                start_patterns = ak[section].get('start', [])
                valid_starts = [p for p in start_patterns if p in content]
                if valid_starts:
                    validated['answerKeys'][section] = {'start': valid_starts}
    
    # Validate explanations
    if 'explanations' in patterns:
        exp = patterns['explanations']
        if 'sectionStart' in exp:
            section_start = [p for p in exp['sectionStart'] if p in content]
            if section_start:
                validated['explanations']['sectionStart'] = section_start
        
        for section in ['competency', 'level1', 'level2', 'achievers']:
            if section in exp:
                start_patterns = exp[section].get('start', [])
                valid_starts = [p for p in start_patterns if p in content]
                if valid_starts:
                    validated['explanations'][section] = {'start': valid_starts}
    
    return validated


def extract_sample_content(content: str, max_lines: int = 1000) -> str:
    """
    Extract a representative sample from the content for AI analysis.
    Includes beginning, middle, and end sections.
    
    Args:
        content: Full content
        max_lines: Maximum number of lines to include
        
    Returns:
        Sample content with section markers preserved
    """
    lines = content.split('\n')
    total_lines = len(lines)
    
    if total_lines <= max_lines:
        return content
    
    # Take sections from beginning, middle, and end
    section_size = max_lines // 3
    
    beginning = lines[:section_size]
    middle_start = (total_lines - section_size) // 2
    middle = lines[middle_start:middle_start + section_size]
    end = lines[-section_size:]
    
    sample = (
        '\n'.join(beginning) + 
        '\n\n... (content truncated for analysis) ...\n\n' +
        '\n'.join(middle) +
        '\n\n... (content truncated for analysis) ...\n\n' +
        '\n'.join(end)
    )
    
    return sample

