#!/usr/bin/env python3
"""
Fix reversed Arabic text in raw_text_block fields.

The PDF text extraction stores Arabic text in visual order (right-to-left
appearance mapped to left-to-right string order). This script:

1. For each line in raw_text_block, detects if it contains Arabic
2. For lines with Arabic, reverses the character order to restore logical order
3. Preserves English/number lines as-is
4. For mixed lines (Arabic + English/numbers), handles each segment appropriately

Output: updates transactions_enhanced.json in place with corrected raw_text_block.
"""
import json
import re
import unicodedata
import os

IN_PATH = "/home/z/my-project/scripts/transactions_enhanced.json"
OUT_PATH = "/home/z/my-project/scripts/transactions_enhanced.json"


def is_arabic_char(c):
    """Check if char is Arabic (including Presentation Forms)."""
    cp = ord(c)
    if 0x0600 <= cp <= 0x06FF:
        return True
    if 0x0750 <= cp <= 0x077F:
        return True
    if 0xFB50 <= cp <= 0xFDFF:
        return True
    if 0xFE70 <= cp <= 0xFEFF:
        return True
    return False


def is_latin_char(c):
    """Check if char is Latin letter or digit."""
    return c.isascii() and (c.isalnum() or c in ' .,;:-_/\\()[]{}')


def normalize_arabic_segment(s):
    """Normalize Arabic text: NFKC to convert presentation forms to base letters."""
    return unicodedata.normalize('NFKC', s)


def fix_arabic_line(line):
    """
    Fix a line that contains Arabic text by reversing its visual order
    to logical order.

    The PDF text extraction stores Arabic text in visual order (the order
    characters appear visually from left to right). For correct display,
    we need to reverse the entire line so Arabic reads right-to-left logically.

    Strategy:
    1. Normalize all Arabic chars via NFKC (converts presentation forms to base letters)
    2. If line is pure Arabic (no Latin/digits): reverse the entire line
    3. If line is mixed (Arabic + Latin): reverse the line, then re-reverse Latin runs
       so Latin text reads correctly L→R within the otherwise R→L line
    """
    if not line or not line.strip():
        return line

    # Check if line has any Arabic
    if not any(is_arabic_char(c) for c in line):
        return line  # Pure Latin/numbers — leave as-is

    # First, normalize all Arabic characters via NFKC
    normalized_line = unicodedata.normalize('NFKC', line)

    # Check if line has any Latin letters or digits
    has_latin = any(c.isascii() and c.isalnum() for c in normalized_line)

    if not has_latin:
        # Pure Arabic line (with possible spaces and punctuation)
        # Reverse the entire line — this restores both word order AND character order
        return normalized_line[::-1]
    else:
        # Mixed line: Arabic + Latin/numbers
        # Strategy: reverse the entire line, then re-reverse Latin/number runs
        # so they read correctly L→R
        reversed_line = normalized_line[::-1]

        # Find Latin/number runs in the reversed line and re-reverse them
        result = []
        i = 0
        while i < len(reversed_line):
            c = reversed_line[i]
            # Check if this is start of a Latin/number run
            if c.isascii() and (c.isalnum() or c in '.,;:-_/'):
                # Find the end of the Latin run
                j = i
                while j < len(reversed_line) and (reversed_line[j].isascii() and (reversed_line[j].isalnum() or reversed_line[j] in '.,;:-_/')):
                    j += 1
                # Re-reverse this Latin segment
                latin_segment = reversed_line[i:j]
                result.append(latin_segment[::-1])
                i = j
            else:
                result.append(c)
                i += 1

        return ''.join(result)


def fix_raw_text_block(raw_text):
    """Fix all lines in a raw text block."""
    if not raw_text:
        return raw_text

    lines = raw_text.split('\n')
    fixed_lines = [fix_arabic_line(line) for line in lines]
    return '\n'.join(fixed_lines)


def main():
    with open(IN_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    transactions = data["transactions"]
    print(f"Processing {len(transactions)} transactions...")

    fixed_count = 0
    for t in transactions:
        raw = t.get("raw_text_block")
        if not raw:
            continue

        fixed = fix_raw_text_block(raw)
        if fixed != raw:
            t["raw_text_block"] = fixed
            fixed_count += 1

    print(f"Fixed Arabic text in {fixed_count} transactions")

    # Show samples
    print("\n=== Sample fixed transactions ===")
    samples_shown = 0
    for t in transactions:
        raw = t.get("raw_text_block", "")
        if not raw:
            continue
        if not any(is_arabic_char(c) for c in raw):
            continue

        print(f"\n--- Transaction: {t['description']} | Page {t['page']} ---")
        for line in raw.split('\n')[:6]:
            print(f"  | {line}")

        samples_shown += 1
        if samples_shown >= 5:
            break

    # Save
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_PATH}")
    print(f"File size: {os.path.getsize(OUT_PATH):,} bytes")


if __name__ == "__main__":
    main()
