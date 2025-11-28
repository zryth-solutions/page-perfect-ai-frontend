#!/usr/bin/env python3
"""
Content Extraction and Organization Script
===========================================

Automatically extracts and organizes questions, answer keys, and explanations
from MinerU extracted full.md files.

Usage:
------
python3 split_content.py --input Minerucode/Output/Science-8-Chapter-1 \\
                         --output Output/Science-8-Chapter-1

Features:
---------
- Automatic section detection using configurable patterns
- Smart content splitting for Level 1 and Level 2
- Answer key duplication (no splitting needed)
- Complete validation and reporting
- Handles multiple format variations

Author: Automated QC System
Version: 1.0
"""

import os
import sys
import shutil
import argparse
from pathlib import Path
from typing import Optional, Tuple, Dict, List

from .patterns_config import (
    get_question_patterns,
    get_answer_key_patterns,
    get_explanation_patterns,
    get_split_config,
    set_custom_patterns,
    clear_custom_patterns,
    convert_ui_patterns_to_internal,
    ANSWER_KEY_PATTERNS,
    EXPLANATION_PATTERNS
)


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def find_section_marker(content: str, patterns: List[str], start_from: int = 0) -> Tuple[Optional[int], Optional[str]]:
    """
    Find the first matching pattern from a list of patterns.
    
    Args:
        content: Content to search
        patterns: List of pattern strings to try
        start_from: Position to start searching from
        
    Returns:
        Tuple of (position, matched_pattern) or (None, None)
    """
    for pattern in patterns:
        position = content.find(pattern, start_from)
        if position != -1:
            return position, pattern
    return None, None


def extract_between_markers(content: str, start_pattern: str, end_pattern: str, 
                            start_offset: int = 0) -> Tuple[Optional[str], int, int]:
    """
    Extract content between two markers.
    
    Args:
        content: Full content
        start_pattern: Starting marker
        end_pattern: Ending marker
        start_offset: Where to start searching
        
    Returns:
        Tuple of (extracted_content, start_pos, end_pos)
    """
    start_pos = content.find(start_pattern, start_offset)
    if start_pos == -1:
        return None, -1, -1
    
    end_pos = content.find(end_pattern, start_pos + len(start_pattern))
    if end_pos == -1:
        # No end marker found, take until end of content
        end_pos = len(content)
    
    extracted = content[start_pos:end_pos]
    return extracted, start_pos, end_pos


def split_at_question_number(content: str, question_num: int) -> Tuple[str, str]:
    """
    Split content at a specific question number.
    
    Args:
        content: Content containing questions
        question_num: Question number to split at (this will be start of part 2)
        
    Returns:
        Tuple of (part1_content, part2_content)
    """
    # Look for pattern like "\n13." or "\n11."
    split_pattern = f"\n{question_num}."
    split_pos = content.find(split_pattern)
    
    if split_pos == -1:
        print(f"  ⚠️  Warning: Could not find question {question_num} for splitting")
        print(f"     Returning full content as part 1")
        return content, ""
    
    part1 = content[:split_pos]
    part2 = content[split_pos:]
    
    return part1, part2


def split_at_explanation_number(content: str, explanation_num: int) -> Tuple[str, str]:
    """
    Split explanations at a specific number.
    
    Args:
        content: Content containing explanations
        explanation_num: Explanation number to split at
        
    Returns:
        Tuple of (part1_content, part2_content)
    """
    # Look for pattern like "# 13. Correct option" or "# 11. Correct option"
    split_pattern = f"# {explanation_num}. Correct option"
    split_pos = content.find(split_pattern)
    
    if split_pos == -1:
        # Try alternative pattern without "Correct option"
        split_pattern = f"# {explanation_num}."
        split_pos = content.find(split_pattern)
    
    if split_pos == -1:
        print(f"  ⚠️  Warning: Could not find explanation {explanation_num} for splitting")
        return content, ""
    
    part1 = content[:split_pos]
    part2 = content[split_pos:]
    
    return part1, part2


# =============================================================================
# SECTION EXTRACTION FUNCTIONS
# =============================================================================

def extract_section_with_patterns(content: str, section_name: str, 
                                  start_patterns: List[str], 
                                  end_patterns: List[str],
                                  start_from: int = 0) -> Tuple[Optional[str], Dict]:
    """
    Extract a section using pattern matching.
    
    Returns:
        Tuple of (extracted_content, metadata_dict)
    """
    metadata = {
        'section': section_name,
        'start_pattern': None,
        'end_pattern': None,
        'start_pos': -1,
        'end_pos': -1,
        'length': 0,
        'success': False
    }
    
    # Find start marker
    start_pos, start_pattern = find_section_marker(content, start_patterns, start_from)
    if start_pos is None:
        print(f"  ✗ Could not find {section_name} start marker")
        print(f"    Tried: {start_patterns[:2]}...")
        return None, metadata
    
    metadata['start_pattern'] = start_pattern
    metadata['start_pos'] = start_pos
    
    # Find end marker
    end_pos, end_pattern = find_section_marker(content, end_patterns, start_pos + len(start_pattern))
    if end_pos is None:
        # Use end of content as fallback
        end_pos = len(content)
        end_pattern = "END_OF_FILE"
    
    metadata['end_pattern'] = end_pattern
    metadata['end_pos'] = end_pos
    
    # Extract content
    extracted = content[start_pos:end_pos]
    metadata['length'] = len(extracted)
    metadata['success'] = True
    
    return extracted, metadata


# =============================================================================
# QUESTIONS EXTRACTION
# =============================================================================

def extract_questions(content: str, output_dir: Path, custom_patterns: Optional[Dict] = None) -> Dict:
    """
    Extract all question sections and save to files.
    
    Args:
        content: Full markdown content
        output_dir: Output directory
        custom_patterns: Optional custom patterns from UI (will be converted internally)
    
    Returns:
        Dictionary with extraction results
    """
    # Set custom patterns if provided
    if custom_patterns:
        print("\n🎯 Loading custom patterns from UI...")
        internal_patterns = convert_ui_patterns_to_internal(custom_patterns)
        set_custom_patterns(internal_patterns)
    
    print("\n" + "="*70)
    print("PHASE 1: EXTRACTING QUESTIONS")
    print("="*70)
    
    results = {
        'theory': {'success': False},
        'competency': {'success': False},
        'level1': {'success': False},
        'level2': {'success': False},
        'achievers': {'success': False}
    }
    
    question_output = output_dir / "Question_output"
    question_output.mkdir(parents=True, exist_ok=True)
    
    # 1. Extract Theory Content (from start to Competency Questions)
    print("\n📚 Extracting Theory Content...")
    patterns = get_question_patterns('competency')
    theory_end_pos, theory_end_pattern = find_section_marker(content, patterns['start'])
    
    if theory_end_pos is not None and theory_end_pos > 0:
        theory_content = content[0:theory_end_pos].strip()
        if theory_content:
            output_file = question_output / "theory.md"
            output_file.write_text(theory_content, encoding='utf-8')
            print(f"  ✓ Saved to: {output_file.name}")
            print(f"    Length: {len(theory_content)} characters")
            results['theory'] = {
                'success': True,
                'start_pos': 0,
                'end_pos': theory_end_pos,
                'length': len(theory_content),
                'end_pattern': theory_end_pattern
            }
        else:
            print(f"  ⚠️  No theory content found before Competency Questions")
    else:
        print(f"  ⚠️  Could not find Competency Questions marker to extract theory")
    
    # 2. Extract Competency Questions
    print("\n📋 Extracting Competency Focused Questions...")
    patterns = get_question_patterns('competency')
    comp_content, metadata = extract_section_with_patterns(
        content, 
        "Competency Questions",
        patterns['start'],
        patterns['end'],
        start_from=0  # Start from beginning
    )
    
    comp_end_pos = 0
    if comp_content:
        output_file = question_output / "Competency_Focused_Questions.md"
        output_file.write_text(comp_content, encoding='utf-8')
        print(f"  ✓ Saved to: {output_file.name}")
        print(f"    Length: {metadata['length']} characters")
        results['competency'] = metadata
        comp_end_pos = metadata.get('end_pos', 0)
    
    # 3. Extract Level 1 Questions (with splitting)
    print("\n📋 Extracting Level 1 Questions...")
    patterns = get_question_patterns('level1')
    level1_content, metadata = extract_section_with_patterns(
        content,
        "Level 1 Questions",
        patterns['start'],
        patterns['end'],
        start_from=comp_end_pos  # Start after Competency section
    )
    
    level1_end_pos = comp_end_pos
    if level1_content:
        split_config = get_split_config('level1')
        split_at = split_config.get('split_at_question', 13)
        
        print(f"  ↪ Splitting at question {split_at}...")
        part1, part2 = split_at_question_number(level1_content, split_at)
        
        # Save Part 1
        output_file1 = question_output / "Multiple_Choice_Questions_Level_1.md"
        output_file1.write_text(part1, encoding='utf-8')
        print(f"  ✓ Part 1 saved: {output_file1.name} ({len(part1)} chars)")
        
        # Save Part 2
        output_file2 = question_output / "Multiple_Choice_Questions_Level_1_Part_2.md"
        output_file2.write_text(part2, encoding='utf-8')
        print(f"  ✓ Part 2 saved: {output_file2.name} ({len(part2)} chars)")
        
        results['level1'] = metadata
        results['level1']['split'] = True
        results['level1']['part1_length'] = len(part1)
        results['level1']['part2_length'] = len(part2)
        level1_end_pos = metadata.get('end_pos', comp_end_pos)
    
    # 4. Extract Level 2 Questions (with splitting)
    print("\n📋 Extracting Level 2 Questions...")
    patterns = get_question_patterns('level2')
    level2_content, metadata = extract_section_with_patterns(
        content,
        "Level 2 Questions",
        patterns['start'],
        patterns['end'],
        start_from=level1_end_pos  # Start after Level 1 section
    )
    
    level2_end_pos = level1_end_pos
    if level2_content:
        split_config = get_split_config('level2')
        split_at = split_config.get('split_at_question', 11)
        
        print(f"  ↪ Splitting at question {split_at}...")
        part1, part2 = split_at_question_number(level2_content, split_at)
        
        # Save Part 1
        output_file1 = question_output / "Multiple_Choice_Questions_Level_2.md"
        output_file1.write_text(part1, encoding='utf-8')
        print(f"  ✓ Part 1 saved: {output_file1.name} ({len(part1)} chars)")
        
        # Save Part 2
        output_file2 = question_output / "Multiple_Choice_Questions_Level_2_Part_2.md"
        output_file2.write_text(part2, encoding='utf-8')
        print(f"  ✓ Part 2 saved: {output_file2.name} ({len(part2)} chars)")
        
        results['level2'] = metadata
        results['level2']['split'] = True
        results['level2']['part1_length'] = len(part1)
        results['level2']['part2_length'] = len(part2)
        level2_end_pos = metadata.get('end_pos', level1_end_pos)
    
    # 5. Extract Achievers Section
    print("\n📋 Extracting Achievers Section...")
    patterns = get_question_patterns('achievers')
    achievers_content, metadata = extract_section_with_patterns(
        content,
        "Achievers Section",
        patterns['start'],
        patterns['end'],
        start_from=level2_end_pos  # Start after Level 2 section
    )
    
    if achievers_content:
        output_file = question_output / "ACHIEVERS_SECTION.md"
        output_file.write_text(achievers_content, encoding='utf-8')
        print(f"  ✓ Saved to: {output_file.name}")
        print(f"    Length: {metadata['length']} characters")
        results['achievers'] = metadata
    
    # Ensure all required files exist (create empty ones if not found)
    print("\n🔍 Ensuring all question files exist...")
    required_files = [
        "theory.md",
        "Competency_Focused_Questions.md",
        "Multiple_Choice_Questions_Level_1.md",
        "Multiple_Choice_Questions_Level_1_Part_2.md",
        "Multiple_Choice_Questions_Level_2.md",
        "Multiple_Choice_Questions_Level_2_Part_2.md",
        "ACHIEVERS_SECTION.md"
    ]
    
    for filename in required_files:
        filepath = question_output / filename
        if not filepath.exists():
            filepath.write_text("# Content Not Found\n\nThe extraction script could not find this section in the PDF.\nPlease configure custom patterns or manually split the content.\n", encoding='utf-8')
            print(f"  ⚠️  Created placeholder: {filename}")
        else:
            print(f"  ✓ {filename} exists")
    
    return results


# =============================================================================
# ANSWER KEYS EXTRACTION
# =============================================================================

def extract_answer_keys(content: str, output_dir: Path, custom_patterns: Optional[Dict] = None) -> Dict:
    """
    Extract all answer key sections and save to files.
    Note: Answer keys are DUPLICATED for split sections (not split).
    
    Args:
        content: Full markdown content
        output_dir: Output directory
        custom_patterns: Optional custom patterns (already set if provided)
    
    Returns:
        Dictionary with extraction results
    """
    print("\n" + "="*70)
    print("PHASE 2: EXTRACTING ANSWER KEYS")
    print("="*70)
    
    results = {}
    answer_key_output = output_dir / "Answer_key"
    answer_key_output.mkdir(parents=True, exist_ok=True)
    
    # First, find the Answer-Key section
    print("\n🔍 Locating Answer-Key section...")
    answer_key_start, _ = find_section_marker(
        content,
        ANSWER_KEY_PATTERNS['section_start']
    )
    
    if answer_key_start is None:
        print("  ✗ Could not find Answer-Key section!")
        return results
    
    print(f"  ✓ Found at position {answer_key_start}")
    
    # Find where explanations start (end of answer key section)
    explanations_start, _ = find_section_marker(
        content,
        EXPLANATION_PATTERNS['section_start'],
        answer_key_start
    )
    
    if explanations_start is None:
        explanations_start = len(content)
    
    answer_key_section = content[answer_key_start:explanations_start]
    
    # Extract each subsection
    # 1. Competency Keys
    print("\n🔑 Extracting Competency answer keys...")
    patterns = get_answer_key_patterns('competency')
    comp_keys, metadata = extract_section_with_patterns(
        answer_key_section,
        "Competency Keys",
        patterns['start'],
        patterns['end']
    )
    
    if comp_keys:
        output_file = answer_key_output / "Competency_Focused_Questions_key.md"
        output_file.write_text(comp_keys, encoding='utf-8')
        print(f"  ✓ Saved to: {output_file.name}")
        results['competency'] = metadata
    
    # 2. Level 1 Keys (DUPLICATE - no splitting!)
    print("\n🔑 Extracting Level 1 answer keys...")
    patterns = get_answer_key_patterns('level1')
    level1_keys, metadata = extract_section_with_patterns(
        answer_key_section,
        "Level 1 Keys",
        patterns['start'],
        patterns['end']
    )
    
    if level1_keys:
        print("  ✨ Duplicating keys to both Part 1 and Part 2 files...")
        
        # Save to Part 1
        output_file1 = answer_key_output / "Multiple_Choice_Questions_Level_1_key.md"
        output_file1.write_text(level1_keys, encoding='utf-8')
        print(f"  ✓ Part 1: {output_file1.name}")
        
        # Save to Part 2 (SAME CONTENT!)
        output_file2 = answer_key_output / "Multiple_Choice_Questions_Level_1_Part_2_key.md"
        output_file2.write_text(level1_keys, encoding='utf-8')
        print(f"  ✓ Part 2: {output_file2.name} (same content)")
        
        results['level1'] = metadata
        results['level1']['duplicated'] = True
    
    # 3. Level 2 Keys (DUPLICATE - no splitting!)
    print("\n🔑 Extracting Level 2 answer keys...")
    patterns = get_answer_key_patterns('level2')
    level2_keys, metadata = extract_section_with_patterns(
        answer_key_section,
        "Level 2 Keys",
        patterns['start'],
        patterns['end']
    )
    
    if level2_keys:
        print("  ✨ Duplicating keys to both Part 1 and Part 2 files...")
        
        # Save to Part 1
        output_file1 = answer_key_output / "Multiple_Choice_Questions_Level_2_key.md"
        output_file1.write_text(level2_keys, encoding='utf-8')
        print(f"  ✓ Part 1: {output_file1.name}")
        
        # Save to Part 2 (SAME CONTENT!)
        output_file2 = answer_key_output / "Multiple_Choice_Questions_Level_2_Part_2_key.md"
        output_file2.write_text(level2_keys, encoding='utf-8')
        print(f"  ✓ Part 2: {output_file2.name} (same content)")
        
        results['level2'] = metadata
        results['level2']['duplicated'] = True
    
    # 4. Achievers Keys
    print("\n🔑 Extracting Achievers answer keys...")
    patterns = get_answer_key_patterns('achievers')
    achievers_keys, metadata = extract_section_with_patterns(
        answer_key_section,
        "Achievers Keys",
        patterns['start'],
        patterns['end']
    )
    
    if achievers_keys:
        output_file = answer_key_output / "ACHIEVERS_SECTION_key.md"
        output_file.write_text(achievers_keys, encoding='utf-8')
        print(f"  ✓ Saved to: {output_file.name}")
        results['achievers'] = metadata
    
    # Ensure all required files exist (create empty ones if not found)
    print("\n🔍 Ensuring all answer key files exist...")
    required_files = [
        "Competency_Focused_Questions_key.md",
        "Multiple_Choice_Questions_Level_1_key.md",
        "Multiple_Choice_Questions_Level_1_Part_2_key.md",
        "Multiple_Choice_Questions_Level_2_key.md",
        "Multiple_Choice_Questions_Level_2_Part_2_key.md",
        "ACHIEVERS_SECTION_key.md"
    ]
    
    for filename in required_files:
        filepath = answer_key_output / filename
        if not filepath.exists():
            filepath.write_text("# Answer Keys Not Found\n\nThe extraction script could not find this section in the PDF.\nPlease configure custom patterns or manually add the answer keys.\n", encoding='utf-8')
            print(f"  ⚠️  Created placeholder: {filename}")
        else:
            print(f"  ✓ {filename} exists")
    
    return results


# =============================================================================
# EXPLANATIONS EXTRACTION
# =============================================================================

def extract_explanations(content: str, output_dir: Path, custom_patterns: Optional[Dict] = None) -> Dict:
    """
    Extract all explanation sections and save to files.
    
    Args:
        content: Full markdown content
        output_dir: Output directory
        custom_patterns: Optional custom patterns (already set if provided)
    
    Returns:
        Dictionary with extraction results
    """
    print("\n" + "="*70)
    print("PHASE 3: EXTRACTING EXPLANATIONS")
    print("="*70)
    
    results = {}
    answer_output = output_dir / "Answer_output"
    answer_output.mkdir(parents=True, exist_ok=True)
    
    # First, find the Explanations section
    print("\n🔍 Locating Explanations section...")
    explanations_start, _ = find_section_marker(
        content,
        EXPLANATION_PATTERNS['section_start']
    )
    
    if explanations_start is None:
        print("  ✗ Could not find Explanations section!")
        return results
    
    print(f"  ✓ Found at position {explanations_start}")
    explanations_section = content[explanations_start:]
    
    # 1. Competency Explanations
    print("\n💡 Extracting Competency explanations...")
    patterns = get_explanation_patterns('competency')
    comp_exp, metadata = extract_section_with_patterns(
        explanations_section,
        "Competency Explanations",
        patterns['start'],
        patterns['end']
    )
    
    if comp_exp:
        output_file = answer_output / "Competency_Focused_Questions_ans.md"
        output_file.write_text(comp_exp, encoding='utf-8')
        print(f"  ✓ Saved to: {output_file.name}")
        results['competency'] = metadata
    
    # 2. Level 1 Explanations (with splitting)
    print("\n💡 Extracting Level 1 explanations...")
    patterns = get_explanation_patterns('level1')
    level1_exp, metadata = extract_section_with_patterns(
        explanations_section,
        "Level 1 Explanations",
        patterns['start'],
        patterns['end']
    )
    
    if level1_exp:
        split_config = get_split_config('level1')
        split_at = split_config.get('split_at_question', 13)
        
        print(f"  ↪ Splitting at explanation {split_at}...")
        part1, part2 = split_at_explanation_number(level1_exp, split_at)
        
        # Save Part 1
        output_file1 = answer_output / "Multiple_Choice_Questions_Level_1_ans.md"
        output_file1.write_text(part1, encoding='utf-8')
        print(f"  ✓ Part 1 saved: {output_file1.name} ({len(part1)} chars)")
        
        # Save Part 2
        output_file2 = answer_output / "Multiple_Choice_Questions_Level_1_Part_2_ans.md"
        output_file2.write_text(part2, encoding='utf-8')
        print(f"  ✓ Part 2 saved: {output_file2.name} ({len(part2)} chars)")
        
        results['level1'] = metadata
        results['level1']['split'] = True
    
    # 3. Level 2 Explanations (with splitting)
    print("\n💡 Extracting Level 2 explanations...")
    patterns = get_explanation_patterns('level2')
    
    # For Level 2, we need to find the second occurrence of "# LEVEL ("
    # First find where Level 1 explanations end
    level1_end = metadata.get('end_pos', 0) if metadata else 0
    
    level2_exp, metadata = extract_section_with_patterns(
        explanations_section,
        "Level 2 Explanations",
        patterns['start'],
        patterns['end'],
        start_from=level1_end
    )
    
    if level2_exp:
        split_config = get_split_config('level2')
        split_at = split_config.get('split_at_question', 11)
        
        print(f"  ↪ Splitting at explanation {split_at}...")
        part1, part2 = split_at_explanation_number(level2_exp, split_at)
        
        # Save Part 1
        output_file1 = answer_output / "Multiple_Choice_Questions_Level_2_ans.md"
        output_file1.write_text(part1, encoding='utf-8')
        print(f"  ✓ Part 1 saved: {output_file1.name} ({len(part1)} chars)")
        
        # Save Part 2
        output_file2 = answer_output / "Multiple_Choice_Questions_Level_2_Part_2_ans.md"
        output_file2.write_text(part2, encoding='utf-8')
        print(f"  ✓ Part 2 saved: {output_file2.name} ({len(part2)} chars)")
        
        results['level2'] = metadata
        results['level2']['split'] = True
    
    # 4. Achievers Explanations
    print("\n💡 Extracting Achievers explanations...")
    patterns = get_explanation_patterns('achievers')
    achievers_exp, metadata = extract_section_with_patterns(
        explanations_section,
        "Achievers Explanations",
        patterns['start'],
        patterns['end']
    )
    
    if achievers_exp:
        output_file = answer_output / "ACHIEVERS_SECTION_ans.md"
        output_file.write_text(achievers_exp, encoding='utf-8')
        print(f"  ✓ Saved to: {output_file.name}")
        results['achievers'] = metadata
    
    # Ensure all required files exist (create empty ones if not found)
    print("\n🔍 Ensuring all answer explanation files exist...")
    required_files = [
        "Competency_Focused_Questions_ans.md",
        "Multiple_Choice_Questions_Level_1_ans.md",
        "Multiple_Choice_Questions_Level_1_Part_2_ans.md",
        "Multiple_Choice_Questions_Level_2_ans.md",
        "Multiple_Choice_Questions_Level_2_Part_2_ans.md",
        "ACHIEVERS_SECTION_ans.md"
    ]
    
    for filename in required_files:
        filepath = answer_output / filename
        if not filepath.exists():
            filepath.write_text("# Answer Explanations Not Found\n\nThe extraction script could not find this section in the PDF.\nPlease configure custom patterns or manually add the explanations.\n", encoding='utf-8')
            print(f"  ⚠️  Created placeholder: {filename}")
        else:
            print(f"  ✓ {filename} exists")
    
    return results


# =============================================================================
# FILE COPYING
# =============================================================================

def copy_supporting_files(input_dir: Path, output_dir: Path) -> Dict:
    """
    Copy full.md and images folder to output directory.
    
    Returns:
        Dictionary with copy results
    """
    print("\n" + "="*70)
    print("PHASE 4: COPYING SUPPORTING FILES")
    print("="*70)
    
    results = {
        'full_md': False,
        'images': False
    }
    
    # Copy full.md
    print("\n📄 Copying full.md...")
    source_md = input_dir / "full.md"
    dest_md = output_dir / "full.md"
    
    try:
        shutil.copy2(source_md, dest_md)
        print(f"  ✓ Copied: {source_md.name} → {dest_md}")
        results['full_md'] = True
    except Exception as e:
        print(f"  ✗ Error copying full.md: {e}")
    
    # Copy images folder
    print("\n🖼️  Copying images folder...")
    source_images = input_dir / "images"
    dest_images = output_dir / "images"
    
    try:
        if source_images.exists() and source_images.is_dir():
            if dest_images.exists():
                shutil.rmtree(dest_images)
            shutil.copytree(source_images, dest_images)
            
            # Count images
            image_files = list(dest_images.glob("*"))
            print(f"  ✓ Copied images folder: {len(image_files)} files")
            results['images'] = True
            results['image_count'] = len(image_files)
        else:
            print(f"  ⚠️  Images folder not found: {source_images}")
    except Exception as e:
        print(f"  ✗ Error copying images: {e}")
    
    return results


# =============================================================================
# VALIDATION AND REPORTING
# =============================================================================

def generate_report(questions_results: Dict, keys_results: Dict, 
                   explanations_results: Dict, files_results: Dict,
                   output_dir: Path):
    """
    Generate a comprehensive validation report.
    """
    print("\n" + "="*70)
    print("VALIDATION REPORT")
    print("="*70)
    
    # Count files
    question_files = list((output_dir / "Question_output").glob("*.md")) if (output_dir / "Question_output").exists() else []
    key_files = list((output_dir / "Answer_key").glob("*.md")) if (output_dir / "Answer_key").exists() else []
    answer_files = list((output_dir / "Answer_output").glob("*.md")) if (output_dir / "Answer_output").exists() else []
    
    print(f"\n📊 FILES GENERATED:")
    print(f"  Questions: {len(question_files)} files")
    for f in sorted(question_files):
        print(f"    ✓ {f.name}")
    
    print(f"\n  Answer Keys: {len(key_files)} files")
    for f in sorted(key_files):
        print(f"    ✓ {f.name}")
    
    print(f"\n  Explanations: {len(answer_files)} files")
    for f in sorted(answer_files):
        print(f"    ✓ {f.name}")
    
    print(f"\n📁 SUPPORTING FILES:")
    if files_results.get('full_md'):
        print(f"  ✓ full.md")
    if files_results.get('images'):
        print(f"  ✓ images/ ({files_results.get('image_count', 0)} files)")
    
    # Summary
    total_files = len(question_files) + len(key_files) + len(answer_files)
    if files_results.get('full_md'):
        total_files += 1
    
    print(f"\n{'='*70}")
    print(f"TOTAL FILES: {total_files}")
    print(f"{'='*70}")
    
    # Status
    expected_files = 19  # 7 questions (theory + 6 sections) + 6 keys + 6 explanations
    if total_files >= expected_files:
        print(f"\n✅ SUCCESS: All expected files generated!")
    else:
        print(f"\n⚠️  WARNING: Expected {expected_files} content files, got {total_files - 1}")
        print(f"   Some sections may be missing.")


# =============================================================================
# MAIN FUNCTION
# =============================================================================

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Extract and organize content from MinerU full.md files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 split_content.py --input Minerucode/Output/Science-8-Chapter-1 \\
                           --output Output/Science-8-Chapter-1
  
  python3 split_content.py --input Minerucode/Output/Math-9-Chapter-2 \\
                           --output Output/Math-9-Chapter-2 \\
                           --validate
        """
    )
    
    parser.add_argument(
        '--input',
        type=str,
        required=True,
        help='Input directory containing full.md (from MinerU extraction)'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        required=True,
        help='Output directory for organized content'
    )
    
    parser.add_argument(
        '--validate',
        action='store_true',
        help='Run validation checks after extraction'
    )
    
    args = parser.parse_args()
    
    # Setup paths
    input_dir = Path(args.input)
    output_dir = Path(args.output)
    full_md_path = input_dir / "full.md"
    
    # Validate input
    if not input_dir.exists():
        print(f"✗ Error: Input directory not found: {input_dir}")
        sys.exit(1)
    
    if not full_md_path.exists():
        print(f"✗ Error: full.md not found in: {input_dir}")
        sys.exit(1)
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Display header
    print("\n" + "#"*70)
    print("# CONTENT EXTRACTION AND ORGANIZATION")
    print("#"*70)
    print(f"Input:  {input_dir}")
    print(f"Output: {output_dir}")
    print(f"File:   {full_md_path.name}")
    print("#"*70)
    
    # Read full.md
    print("\n📖 Reading full.md...")
    try:
        content = full_md_path.read_text(encoding='utf-8')
        print(f"  ✓ Loaded: {len(content)} characters, {content.count(chr(10))} lines")
    except Exception as e:
        print(f"  ✗ Error reading file: {e}")
        sys.exit(1)
    
    # Extract content (no custom patterns in CLI mode)
    questions_results = extract_questions(content, output_dir)
    keys_results = extract_answer_keys(content, output_dir)
    explanations_results = extract_explanations(content, output_dir)
    files_results = copy_supporting_files(input_dir, output_dir)
    
    # Clear custom patterns after extraction
    clear_custom_patterns()
    
    # Generate report
    generate_report(questions_results, keys_results, explanations_results, 
                   files_results, output_dir)
    
    print(f"\n✅ Extraction complete!")
    print(f"   Output directory: {output_dir}")
    print("\n" + "#"*70 + "\n")


if __name__ == '__main__':
    main()

