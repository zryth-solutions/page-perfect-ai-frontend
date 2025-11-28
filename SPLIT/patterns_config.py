"""
Pattern Configuration for Content Extraction
==============================================

This file contains all pattern variations for detecting sections in full.md

HOW TO ADD NEW PATTERNS:
------------------------
1. When you encounter a new format variation, add it to the relevant section
2. Place more specific patterns BEFORE generic ones (order matters!)
3. Add a comment explaining when this pattern occurs

EXAMPLE:
--------
If you see "PYQs Marathon# LEVEL (1" in a new chapter:
1. Find the 'level1_start' section below
2. Add: 'PYQs Marathon# LEVEL (1',  # No space between Marathon and Level
3. Save and the extractor will now handle this format!
"""

# =============================================================================
# QUESTIONS SECTION PATTERNS
# =============================================================================

QUESTION_PATTERNS = {
    'competency': {
        'start': [
            '# Competency Focused Questions',      # Standard format
            '# Competency Based Questions',        # Alternative wording
            '# COMPETENCY FOCUSED QUESTIONS',      # All caps
            'Competency Focused Questions',        # No hash symbol
            '# Competency-Focused Questions',      # With hyphen
        ],
        'end': [
            '# PYQs Marathon\n# LEVEL (1',        # Standard with Marathon header
            '# LEVEL (1',                          # Direct Level 1
            'PYQs Marathon# LEVEL (1',            # No newline after Marathon
            '# PYQs Marathon\n\n# LEVEL (1',      # Extra newline
            'LEVEL (1',                            # No hash
        ]
    },
    
    'level1': {
        'start': [
            '# PYQs Marathon\n# LEVEL (1',        # With Marathon header (most common)
            '# LEVEL (1',                          # Standard
            'PYQs Marathon# LEVEL (1',            # Marathon concatenated (no newline)
            '# Level (1',                          # Different capitalization
            'LEVEL (1',                            # No hash
            '# LEVEL 1',                           # Without parentheses
            '# Level-1',                           # With hyphen
            '# PYQs MARATHON\n# LEVEL (1',        # Uppercase MARATHON
        ],
        'end': [
            '# LEVEL (2',                          # Standard
            '# Level (2',                          # Different capitalization
            'LEVEL (2',                            # No hash
            '# LEVEL 2',                           # Without parentheses
        ]
    },
    
    'level2': {
        'start': [
            '# LEVEL (2',                          # Standard
            '# Level (2',                          # Different capitalization
            'LEVEL (2',                            # No hash
            '# LEVEL 2',                           # Without parentheses
            '# Level-2',                           # With hyphen
        ],
        'end': [
            '# ACHIEVERS SECTION',                 # Standard (all caps)
            '# Achievers Section',                 # Title case
            '# ACHIEVER SECTION',                  # Typo variant (singular)
            'ACHIEVERS SECTION',                   # No hash
            '# Achievers',                         # Short form
        ]
    },
    
    'achievers': {
        'start': [
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
            '# COMPETENCY FOCUSED QUESTIONS',      # All caps (common in answer section)
            '# Competency Focused Questions',      # Title case
            '# Competency Based Questions',        # Alternative wording
            'COMPETENCY FOCUSED QUESTIONS',        # No hash
        ],
        'end': [
            '# PYQs MARATHON',                     # All caps
            '# PYQs Marathon',                     # Mixed case
            'PYQs MARATHON',                       # No hash
            '# PYQS MARATHON',                     # Different capitalization
        ]
    },
    
    'level1': {
        'start': [
            '# LEVEL (1',                          # Standard in answer key section
            '# Level (1',                          # Mixed case
            'LEVEL (1',                            # No hash
            '# LEVEL 1',                           # Without parentheses
        ],
        'end': [
            '# LEVEL (2',                          # Standard
            '# Level (2',                          # Mixed case
            'LEVEL (2',                            # No hash
        ]
    },
    
    'level2': {
        'start': [
            '# LEVEL (2',                          # Standard
            '# Level (2',                          # Mixed case
            'LEVEL (2',                            # No hash
        ],
        'end': [
            '# ACHIEVERS SECTION',                 # Standard
            '# Achievers Section',                 # Title case
            'ACHIEVERS SECTION',                   # No hash
        ]
    },
    
    'achievers': {
        'start': [
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
            '# COMPETENCY FOCUSED QUESTIONS',      # Standard
            '# Competency Focused Questions',      # Mixed case
            'COMPETENCY FOCUSED QUESTIONS',        # No hash
        ],
        'end': [
            '# PYQs Marathon',                     # Standard
            '# PYQS MARATHON',                     # Different case
            '# PYQs MARATHON',                     # All caps
            'PYQs Marathon',                       # No hash
        ]
    },
    
    'level1': {
        'start': [
            '# LEVEL (1',                          # Standard
            '# Level (1',                          # Mixed case
            'LEVEL (1',                            # No hash
        ],
        'end': [
            '# LEVEL (',                           # Generic (matches Level 2)
            '# LEVEL (2',                          # Explicit Level 2
            '# Level (',                           # Mixed case
        ]
    },
    
    'level2': {
        'start': [
            '# LEVEL (',                           # Generic (second occurrence)
            '# LEVEL (2',                          # Explicit
            '# Level (2',                          # Mixed case
        ],
        'end': [
            '# ACHIEVERS SECTION',                 # Standard
            '# Achievers Section',                 # Mixed case
            'ACHIEVERS SECTION',                   # No hash
        ]
    },
    
    'achievers': {
        'start': [
            '# ACHIEVERS SECTION',                 # Standard
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
    """Get patterns for a question section"""
    return QUESTION_PATTERNS.get(section_name, {})


def get_answer_key_patterns(section_name):
    """Get patterns for an answer key section"""
    if section_name == 'section_start':
        return {'start': ANSWER_KEY_PATTERNS['section_start'], 'end': []}
    return ANSWER_KEY_PATTERNS.get(section_name, {})


def get_explanation_patterns(section_name):
    """Get patterns for an explanation section"""
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

