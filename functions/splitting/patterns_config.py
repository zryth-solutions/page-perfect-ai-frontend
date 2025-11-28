"""
Pattern Configuration for Content Extraction
==============================================

This file contains all pattern variations for detecting sections in full.md

HOW TO ADD NEW PATTERNS:
------------------------
1. When you encounter a new format variation, add it to the relevant section
2. Place more specific patterns BEFORE generic ones (order matters!)
3. Add a comment explaining when this pattern occurs

DYNAMIC PATTERNS:
-----------------
Patterns can be overridden at runtime by passing custom_patterns to extraction functions.
This allows the UI to configure patterns per PDF without modifying this file.

EXAMPLE:
--------
If you see "PYQs Marathon# LEVEL (1" in a new chapter:
1. Find the 'level1_start' section below
2. Add: 'PYQs Marathon# LEVEL (1',  # No space between Marathon and Level
3. Save and the extractor will now handle this format!
"""

# Global variable to store custom patterns (set at runtime)
_custom_patterns = None

def set_custom_patterns(patterns: dict):
    """
    Set custom patterns to override defaults
    
    Args:
        patterns: Dictionary with custom pattern configuration from UI
    """
    global _custom_patterns
    _custom_patterns = patterns
    print("✨ Custom patterns loaded successfully")

def clear_custom_patterns():
    """Clear custom patterns and revert to defaults"""
    global _custom_patterns
    _custom_patterns = None

def convert_ui_patterns_to_internal(ui_patterns: dict) -> dict:
    """
    Convert patterns from UI format to internal format
    
    Supports TWO UI formats:
    
    Format 1 (OLD - with separate endMarkers):
    {
        "questions": {
            "competency": ["# NCERT COMPETENCY BASED QUESTIONS"],
            ...
        },
        "endMarkers": {
            "competency": ["# LEVEL 1"],
            ...
        }
    }
    
    Format 2 (NEW - already in internal format):
    {
        "questions": {
            "competency": {
                "start": ["# NCERT COMPETENCY..."],
                "end": ["# LEVEL 1"]
            },
            ...
        },
        "answerKeys": { ... },
        "explanations": { ... }
    }
    
    Internal Format (what we need):
    {
        "questions": {
            "competency": {
                "start": ["# NCERT COMPETENCY..."],
                "end": ["# LEVEL 1"]
            },
            ...
        },
        "answer_keys": { ... },
        "explanations": { ... }
    }
    """
    internal = {
        'questions': {},
        'answer_keys': {},
        'explanations': {}
    }
    
    # Check if already in internal format (has 'start' and 'end' keys)
    if 'questions' in ui_patterns and ui_patterns['questions']:
        first_section = list(ui_patterns['questions'].values())[0]
        if isinstance(first_section, dict) and 'start' in first_section:
            # Already in internal format! Just copy and rename keys
            print("  Patterns already in internal format")
            internal['questions'] = ui_patterns.get('questions', {})
            internal['answer_keys'] = ui_patterns.get('answerKeys', {})
            internal['explanations'] = ui_patterns.get('explanations', {})
            
            print(f"  Loaded patterns:")
            print(f"    Questions: {list(internal['questions'].keys())}")
            print(f"    Answer Keys: {list(internal['answer_keys'].keys())}")
            print(f"    Explanations: {list(internal['explanations'].keys())}")
            
            return internal
    
    # OLD FORMAT: Convert with separate endMarkers
    end_markers = ui_patterns.get('endMarkers', {})
    
    # Convert question patterns with explicit end markers
    if 'questions' in ui_patterns:
        ui_q = ui_patterns['questions']
        
        # Competency
        if 'competency' in ui_q:
            internal['questions']['competency'] = {
                'start': ui_q['competency'] if isinstance(ui_q['competency'], list) else [ui_q['competency']],
                'end': end_markers.get('competency', QUESTION_PATTERNS['competency']['end'])
            }
        
        # Level 1
        if 'level1' in ui_q:
            internal['questions']['level1'] = {
                'start': ui_q['level1'] if isinstance(ui_q['level1'], list) else [ui_q['level1']],
                'end': end_markers.get('level1', QUESTION_PATTERNS['level1']['end'])
            }
        
        # Level 2
        if 'level2' in ui_q:
            internal['questions']['level2'] = {
                'start': ui_q['level2'] if isinstance(ui_q['level2'], list) else [ui_q['level2']],
                'end': end_markers.get('level2', QUESTION_PATTERNS['level2']['end'])
            }
        
        # Achievers
        if 'achievers' in ui_q:
            internal['questions']['achievers'] = {
                'start': ui_q['achievers'] if isinstance(ui_q['achievers'], list) else [ui_q['achievers']],
                'end': end_markers.get('achievers', QUESTION_PATTERNS['achievers']['end'])
            }
    
    # Convert answer patterns
    if 'answers' in ui_patterns:
        internal['answer_keys'] = ui_patterns['answers']
    
    print(f"  Converted UI patterns to internal format:")
    print(f"    Questions: {list(internal['questions'].keys())}")
    if internal['answer_keys']:
        print(f"    Answer Keys: {list(internal['answer_keys'].keys())}")
    
    return internal

# =============================================================================
# QUESTIONS SECTION PATTERNS
# =============================================================================

QUESTION_PATTERNS = {
    'competency': {
        'start': [
            '# Competency-Focused Questions',      # With hyphen (common in newer books)
            '# Competency Focused Questions',      # Standard format
            '# NCERT COMPETENCY BASED QUESTIONS',  # Full NCERT text
            '# Competency Based Questions',        # Alternative wording
            '# COMPETENCY FOCUSED QUESTIONS',      # All caps
            'Competency Focused Questions',        # No hash symbol
            'Competency-Focused Questions',        # With hyphen, no hash
        ],
        'end': [
            "# PYQ's Marathon",                    # With apostrophe (most common)
            '# PYQs Marathon\n# LEVEL',            # Marathon with Level
            '# LEVEL1',                            # Direct Level 1 no space
            '# LEVEL (1',                          # Level with parentheses
            '# LEVEL 1',                           # Level with space
            'PYQs Marathon# LEVEL (1',            # No newline after Marathon
            'LEVEL (1',   
        ]
    },
    
    'level1': {
        'start': [
            '# LEVEL1',                            # No space (common in newer books)
            '# PYQs Marathon\n# LEVEL1',          # With Marathon header
            '# LEVEL (1',                          # With parentheses
            '# LEVEL 1',                           # With space
            'PYQs Marathon# LEVEL1',              # Marathon concatenated
            '# Level (1',                          # Different capitalization
            'LEVEL (1',                            # No hash
            '# Level-1',                           # With hyphen
            '# PYQs MARATHON\n# LEVEL (1',        # Uppercase MARATHON
        ],
        'end': [
            '# LEVEL\n',                           # Just LEVEL with newline (Level 2 marker) - MOST COMMON!
            '# LEVEL (2',                          # With parentheses
            '# LEVEL 2',                           # With space
            '# Level (2',                          # Different capitalization
            'LEVEL (2',                            # No hash
        ]
    },
    
    'level2': {
        'start': [
            '# LEVEL\n',                           # Just LEVEL with newline (MOST COMMON for Level 2 questions!)
            '# LEVEL (2',                          # With parentheses
            '# LEVEL 2',                           # With space
            '# LEVEL2',                            # No space (but often in answer keys, not questions)
            '# Level (2',                          # Different capitalization
            'LEVEL (2',                            # No hash
            '# Level-2',                           # With hyphen
        ],
        'end': [
            "# ACHIEVERS' SECTION",                # With apostrophe (common)
            '# ACHIEVERS SECTION',                 # Standard (all caps)
            '# Achievers Section',                 # Title case
            '# ACHIEVER SECTION',                  # Typo variant (singular)
            'ACHIEVERS SECTION',                   # No hash
            '# Achievers',                         # Short form
        ]
    },
    
    'achievers': {
        'start': [
            "# ACHIEVERS' SECTION",                # With apostrophe (common)
            '# ACHIEVERS SECTION',                 # Standard
            '# Achievers Section',                 # Title case
            '# ACHIEVER SECTION',                  # Typo variant
            'ACHIEVERS SECTION',                   # No hash
            '# Achievers',                         # Short form
        ],
        'end': [
            '# Answer-Key',                        # Standard (with hyphen)
            '# Answer Key',                        # Without hyphen
            '# ANSWER-KEY',                        # All caps
            '# Answer key',                        # Lowercase 'key'
            'Answer-Key',                          # No hash
        ]
    }
}

# =============================================================================
# ANSWER KEY SECTION PATTERNS
# =============================================================================

ANSWER_KEY_PATTERNS = {
    'section_start': [
        '# Answer-Key',                            # Standard
        '# Answer Key',                            # Without hyphen
        '# ANSWER-KEY',                            # All caps
        'Answer-Key',                              # No hash
    ],
    
    'competency': {
        'start': [
            '# NCERT COMPETENCY BASED QUESTIONS',  # Full text (common in newer books)
            '# COMPETENCY FOCUSED QUESTIONS',      # All caps
            '# Competency Focused Questions',      # Title case
            '# Competency-Focused Questions',      # With hyphen
            '# Competency Based Questions',        # Alternative wording
            'COMPETENCY FOCUSED QUESTIONS',        # No hash
        ],
        'end': [
            '# LEVEL1',                            # No space (common)
            '# LEVEL\n',                           # Just LEVEL with newline
            '# LEVEL',                             # Just LEVEL
            '# PYQs MARATHON',                     # All caps
            '# PYQs Marathon',                     # Mixed case
            'PYQs MARATHON',                       # No hash
            '# PYQS MARATHON',                     # Different capitalization
        ]
    },
    
    'level1': {
        'start': [
            '# LEVEL1',                            # No space (common)
            '# LEVEL\n',                           # Just LEVEL (first after competency)
            '# LEVEL',                             # Just LEVEL
            '# LEVEL (1',                          # Standard in answer key section
            '# LEVEL 1',                           # Without parentheses
            '# Level (1',                          # Mixed case
            'LEVEL (1',                            # No hash
        ],
        'end': [
            '# LEVEL2',                            # No space (common)
            '# LEVEL (2',                          # Standard
            '# LEVEL 2',                           # With space
            '# Level (2',                          # Mixed case
            'LEVEL (2',                            # No hash
        ]
    },
    
    'level2': {
        'start': [
            '# LEVEL2',                            # No space (common)
            '# LEVEL (2',                          # Standard
            '# LEVEL 2',                           # With space
            '# Level (2',                          # Mixed case
            'LEVEL (2',                            # No hash
        ],
        'end': [
            "# ACHIEVERS' SECTION",                # With apostrophe
            '# ACHIEVERS SECTION',                 # Standard
            '# Achievers Section',                 # Title case
            'ACHIEVERS SECTION',                   # No hash
        ]
    },
    
    'achievers': {
        'start': [
            "# ACHIEVERS' SECTION",                # With apostrophe (common)
            '# ACHIEVERS SECTION',                 # Standard
            '# Achievers Section',                 # Title case
            'ACHIEVERS SECTION',                   # No hash
        ],
        'end': [
            '# Answers with Explanations',         # Standard
            '# ANSWERS WITH EXPLANATIONS',         # All caps
            '# Answers With Explanations',         # Different case
            'Answers with Explanations',           # No hash
        ]
    }
}

# =============================================================================
# EXPLANATION SECTION PATTERNS
# =============================================================================

EXPLANATION_PATTERNS = {
    'section_start': [
        '# Answers with Explanations',             # Standard
        '# ANSWERS WITH EXPLANATIONS',             # All caps
        '# Answers With Explanations',             # Different capitalization
        '# Answer with Explanation',               # Singular form
        'Answers with Explanations',               # No hash
    ],
    
    'competency': {
        'start': [
            '# NCERT COMPETENCY BASED QUESTIONS',  # Full text (common)
            '# COMPETENCY FOCUSED QUESTIONS',      # Standard
            '# Competency Focused Questions',      # Mixed case
            '# Competency-Focused Questions',      # With hyphen
            'COMPETENCY FOCUSED QUESTIONS',        # No hash
        ],
        'end': [
            '# LEVEL1',                            # No space
            '# LEVEL\n',                           # Just LEVEL
            '# LEVEL',                             # Just LEVEL
            '# PYQs Marathon',                     # Standard
            '# PYQS MARATHON',                     # Different case
            '# PYQs MARATHON',                     # All caps
            'PYQs Marathon',                       # No hash
        ]
    },
    
    'level1': {
        'start': [
            '# LEVEL1',                            # No space (common)
            '# LEVEL\n',                           # Just LEVEL (first occurrence after competency)
            '# LEVEL',                             # Just LEVEL
            '# LEVEL (1',                          # Standard
            '# LEVEL 1',                           # With space
            '# Level (1',                          # Mixed case
            'LEVEL (1',                            # No hash
        ],
        'end': [
            '# LEVEL2',                            # No space
            '# LEVEL (',                           # Generic (matches Level 2)
            '# LEVEL (2',                          # Explicit Level 2
            '# LEVEL 2',                           # With space
            '# Level (',                           # Mixed case
        ]
    },
    
    'level2': {
        'start': [
            '# LEVEL2',                            # No space (common)
            '# LEVEL (',                           # Generic (second occurrence)
            '# LEVEL (2',                          # Explicit
            '# LEVEL 2',                           # With space
            '# Level (2',                          # Mixed case
        ],
        'end': [
            "# ACHIEVERS' SECTION",                # With apostrophe
            "# ACHIEVERS SECTION",                 # Without apostrophe
            '# Achievers Section',                 # Mixed case
            'ACHIEVERS SECTION',                   # No hash
        ]
    },
    
    'achievers': {
        'start': [
            '# ACHIEVERS SECTION',                 # Without apostrophe (common in explanations)
            "# ACHIEVERS' SECTION",                # With apostrophe
            '# Achievers Section',                 # Mixed case
            'ACHIEVERS SECTION',                   # No hash
        ],
        'end': [
            # Use end of file - no specific marker
        ]
    }
}

# =============================================================================
# SPLIT CONFIGURATION
# =============================================================================

SPLIT_CONFIG = {
    'level1': {
        'enabled': True,
        'split_at_question': 13,  # Split after Q12, start Part 2 with Q13
        'total_expected': 25,     # Expected total questions (for validation)
        'part1_range': '1-12',    # For logging/documentation
        'part2_range': '13-25',   # For logging/documentation
    },
    'level2': {
        'enabled': True,
        'split_at_question': 11,  # Split after Q10, start Part 2 with Q11
        'total_expected': 20,     # Expected total questions (for validation)
        'part1_range': '1-10',    # For logging/documentation
        'part2_range': '11-20',   # For logging/documentation
    }
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_question_patterns(section_name):
    """
    Get patterns for a question section
    Checks custom patterns first, then falls back to defaults
    """
    # Check if custom patterns are set
    if _custom_patterns and 'questions' in _custom_patterns:
        custom = _custom_patterns['questions'].get(section_name, {})
        if custom:
            print(f"  Using custom patterns for questions/{section_name}")
            return custom
    
    # Fall back to default patterns
    return QUESTION_PATTERNS.get(section_name, {})


def get_answer_key_patterns(section_name):
    """
    Get patterns for an answer key section
    Checks custom patterns first, then falls back to defaults
    """
    # Check if custom patterns are set
    if _custom_patterns and 'answers' in _custom_patterns:
        if section_name == 'section_start':
            custom_start = _custom_patterns['answers'].get('answerKey', [])
            if custom_start:
                print(f"  Using custom patterns for answer_keys/section_start")
                return {'start': custom_start, 'end': []}
        
        custom = _custom_patterns['answers'].get(section_name, {})
        if custom:
            print(f"  Using custom patterns for answer_keys/{section_name}")
            return custom
    
    # Fall back to default patterns
    if section_name == 'section_start':
        return {'start': ANSWER_KEY_PATTERNS['section_start'], 'end': []}
    return ANSWER_KEY_PATTERNS.get(section_name, {})


def get_explanation_patterns(section_name):
    """
    Get patterns for an explanation section
    Checks custom patterns first, then falls back to defaults
    """
    # Check if custom patterns are set
    if _custom_patterns and 'answers' in _custom_patterns:
        if section_name == 'section_start':
            custom_start = _custom_patterns['answers'].get('answerKey', [])
            if custom_start:
                print(f"  Using custom patterns for explanations/section_start")
                return {'start': custom_start, 'end': []}
        
        custom = _custom_patterns['answers'].get(section_name, {})
        if custom:
            print(f"  Using custom patterns for explanations/{section_name}")
            return custom
    
    # Fall back to default patterns
    if section_name == 'section_start':
        return {'start': EXPLANATION_PATTERNS['section_start'], 'end': []}
    return EXPLANATION_PATTERNS.get(section_name, {})


def get_split_config(level_name):
    """Get split configuration for a level"""
    return SPLIT_CONFIG.get(level_name, {})


def add_custom_pattern(section_type, section_name, marker_type, pattern):
    """
    Add a custom pattern at runtime
    
    Args:
        section_type: 'questions', 'answer_keys', or 'explanations'
        section_name: 'competency', 'level1', 'level2', 'achievers'
        marker_type: 'start' or 'end'
        pattern: The pattern string to add
    
    Example:
        add_custom_pattern('questions', 'level1', 'start', 'NEW PATTERN HERE')
    """
    pattern_dict = {
        'questions': QUESTION_PATTERNS,
        'answer_keys': ANSWER_KEY_PATTERNS,
        'explanations': EXPLANATION_PATTERNS
    }
    
    if section_type in pattern_dict:
        if section_name in pattern_dict[section_type]:
            if marker_type in pattern_dict[section_type][section_name]:
                # Add to beginning of list (highest priority)
                pattern_dict[section_type][section_name][marker_type].insert(0, pattern)
                print(f"✓ Added pattern '{pattern}' to {section_type}/{section_name}/{marker_type}")
            else:
                print(f"✗ Invalid marker_type: {marker_type} (use 'start' or 'end')")
        else:
            print(f"✗ Invalid section_name: {section_name}")
    else:
        print(f"✗ Invalid section_type: {section_type}")


# =============================================================================
# VALIDATION PATTERNS
# =============================================================================

# Patterns to validate we extracted the right content
VALIDATION_PATTERNS = {
    'question_start': [
        r'^\d+\.',           # Starts with number and period (e.g., "1.")
        r'^\(\w\)',          # Starts with option (e.g., "(a)")
    ],
    'answer_key_format': [
        r'\d+\.\s*\([a-d]\)',   # Format: "1. (b)"
        r'<table>',              # Table format for keys
    ],
    'explanation_format': [
        r'#\s*\d+\.\s*Correct option',  # Format: "# 1. Correct option is (b)"
        r'Explanation:',                 # Contains "Explanation:"
    ]
}


if __name__ == '__main__':
    # Demo: Print all configured patterns
    print("=" * 70)
    print("CONFIGURED PATTERNS FOR CONTENT EXTRACTION")
    print("=" * 70)
    
    print("\n📋 QUESTION PATTERNS:")
    for section, patterns in QUESTION_PATTERNS.items():
        print(f"\n  {section.upper()}:")
        print(f"    Start patterns ({len(patterns['start'])}):")
        for p in patterns['start'][:3]:  # Show first 3
            print(f"      - '{p}'")
        if len(patterns['start']) > 3:
            print(f"      ... and {len(patterns['start']) - 3} more")
        print(f"    End patterns ({len(patterns['end'])}):")
        for p in patterns['end'][:3]:
            print(f"      - '{p}'")
        if len(patterns['end']) > 3:
            print(f"      ... and {len(patterns['end']) - 3} more")
    
    print("\n🔑 ANSWER KEY PATTERNS:")
    for section, patterns in ANSWER_KEY_PATTERNS.items():
        if section == 'section_start':
            print(f"\n  SECTION START:")
            for p in patterns[:2]:
                print(f"    - '{p}'")
        else:
            print(f"\n  {section.upper()}: {len(patterns.get('start', []))} start, {len(patterns.get('end', []))} end patterns")
    
    print("\n💡 EXPLANATION PATTERNS:")
    for section, patterns in EXPLANATION_PATTERNS.items():
        if section == 'section_start':
            print(f"\n  SECTION START:")
            for p in patterns[:2]:
                print(f"    - '{p}'")
        else:
            print(f"\n  {section.upper()}: {len(patterns.get('start', []))} start, {len(patterns.get('end', []))} end patterns")
    
    print("\n✂️  SPLIT CONFIGURATION:")
    for level, config in SPLIT_CONFIG.items():
        print(f"\n  {level.upper()}:")
        print(f"    Enabled: {config['enabled']}")
        print(f"    Split at question: {config['split_at_question']}")
        print(f"    Part 1: {config['part1_range']}")
        print(f"    Part 2: {config['part2_range']}")
    
    print("\n" + "=" * 70)
    print("To add new patterns, edit this file or use add_custom_pattern()")
    print("=" * 70)

