#!/usr/bin/env python3
"""
Extract and aggregate beneficiary/sender names from transaction descriptions.
Handles Arabic (reversed due to PDF extraction) and English (merchant) names.

Output: /home/z/my-project/public/names.json
"""
import json
import re
import os
from collections import defaultdict
from datetime import datetime

IN_PATH = "/home/z/my-project/scripts/transactions.json"
OUT_PATH = "/home/z/my-project/public/names.json"

# Arabic common words/banking terms to filter out (these are NOT names)
ARABIC_STOPWORDS = {
    # Banking terms
    "من", "إلى", "الى", "حساب", "بنك", "الراجحي", "البلاد", "الاهلي",
    "السالم", "السلام", "للعميل", "العميل", "الشريف", "المحسن",
    "المستحق", "عليكم", "لكم", "منكم", "اليكم", "المصرف",
    "تحويل", "تحویل", "ايداع", "إيداع", "سداد", "مدفوعات", "دفع",
    "صادر", "وارد", "مدين", "دائن", "رصيد", "عملة",
    "ريال", "سعودي", "السعودية", "المملكة", "العربية",
    "مدني", "فيزا", "ماستر", "كارت", "بطاقة", "نقدي",
    "صرف", "حواله", "حوالة", "استلام", "وصول",
    # Generic descriptors
    "الي", "علي", "في", "منذ", "حتي", "حتى", "عند", "مع",
    "هذا", "هذه", "ذلك", "تلك", "الذي", "التي", "الذين",
    "ال", "ابن", "بن",  # too common as standalone
    "نفسه", "نفسها", "انفسهم",  # himself/herself
    "شركة", "شركه", "مؤسسة", "مؤسسه",  # company/establishment
    "لل", "للـ",  # generic prefix
    # Day/month words
    "الاحد", "الاثنين", "الثلاثاء", "الاربعاء", "الخميس", "الجمعة", "السبت",
    "يناير", "فبراير", "مارس", "ابريل", "مايو", "يونيو", "يوليو",
    "اغسطس", "سبتمبر", "اكتوبر", "نوفمبر", "ديسمبر",
    # Place names that aren't person names
    "صفوى", "صفوة", "الدكم", "الدمام", "الرياض", "جدة",
    "الساحك", "ساحك", "الجبيل", "الخبر", "القطيف",
}

# English common words/banking terms to filter out
ENGLISH_STOPWORDS = {
    "the", "and", "for", "with", "from", "to", "of", "in", "at", "by",
    "transfer", "payment", "payments", "deposit", "withdrawal", "debit", "credit",
    "transaction", "transactions", "account", "bank", "card", "visa",
    "mastercard", "pos", "atm", "online", "purchase", "bill", "fee",
    "fees", "vat", "commission", "charges", "balance", "currency",
    "saudi", "riyal", "riyals", "sar", "stmt", "statement",
    "stc", "sceco", "elc", "sadad", "ipo", "subscription",
    "refund", "reversal", "recovery", "repurchased", "cheque", "cheques", "draft",
    "sarie", "sariee", "ips", "inward", "outward", "domestic",
    "foreign", "international", "local", "internal", "external",
    "order", "remittance", "top", "up", "low", "average", "monthly",
    "dammam", "riyadh", "jeddah", "safwa", "arabia", "branch",
    "customer", "shrimps", "house", "restaura", "restaurant",
    # Non-name descriptors
    "cash", "advance", "pension", "operation", "ca-um", "um", "al-sahik",
    "almanar", "laundry", "cards", "card",  # merchant type words
    # Generic
    "fr", "to", "w-", "i-", "m-", "s-", "e-", "p-", "u-",
    "toi", "fro", "toacct", "fracct", "toid", "frid",
    "arnb", "sabb", "alb", "ncb", "bic", "iban",
    "ec", "ee", "wk", "dr", "cr", "tx", "tr", "ft",
    "toacct", "fracct", "toid", "frid", "ssabb", "ornb",
}

# Patterns that indicate a non-name (account number, reference code)
NON_NAME_PATTERNS = [
    r'^\d+$',  # pure numbers
    r'^[A-Z]{2,4}\d',  # bank codes like SAI123456
    r'^[A-Z]{2,5}-?\d{4,}',  # reference codes like ER-000002468627
    r'^\d{4,}',  # starts with 4+ digits
    r'^CID-',  # civil ID
    r'^TO\d',  # transfer order
    r'^FR\d',  # from reference
    r'^DRAJH',  # ATM ID
    r'^HRAJH',  # ATM ID
    r'^MROUD',  # sadad code
    r'^EGOUG',  # government code
    r'^SPOUD',  # sadad code
    r'^ECEO',  # code
    r'^IBOU',  # code
    r'^IBOA',  # code
    r'^TOﻲﻟﻋ',  # mixed
    r'^\d{4}/',  # date-like
    r'^[A-Z]{3}\d{6}',  # sarie ref
    r'^[A-Z]{4}\d{3}',  # bank ref
]


def is_arabic_char(c):
    """Check if char is Arabic (including Presentation Forms from PDF extraction)."""
    cp = ord(c)
    # Standard Arabic block
    if 0x0600 <= cp <= 0x06FF:
        return True
    # Arabic Supplement
    if 0x0750 <= cp <= 0x077F:
        return True
    # Arabic Presentation Forms-A (FB50-FDFF) — PDF extraction often produces these
    if 0xFB50 <= cp <= 0xFDFF:
        return True
    # Arabic Presentation Forms-B (FE70-FEFF) — includes shaped letters
    if 0xFE70 <= cp <= 0xFEFF:
        return True
    return False


def normalize_arabic_to_base(c):
    """Convert Arabic Presentation Form char to its base Arabic form.
    Returns the char as-is if not a presentation form."""
    cp = ord(c)
    # Simple mapping for common Presentation Forms to base letters
    # This is a simplified version — full mapping would be large
    # We rely on Unicode normalization instead
    return c


def normalize_arabic_text(s):
    """Normalize Arabic text: convert presentation forms to base letters,
    remove diacritics, and standardize."""
    import unicodedata
    # First normalize to NFKC which converts presentation forms to base
    s = unicodedata.normalize('NFKC', s)
    # Then normalize to NFD to decompose, then remove combining marks (diacritics)
    s = unicodedata.normalize('NFD', s)
    # Remove combining marks (tashkeel)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    # Normalize specific Arabic letters
    s = s.replace('\u0623', '\u0627')  # أ → ا
    s = s.replace('\u0625', '\u0627')  # إ → ا
    s = s.replace('\u0622', '\u0627')  # آ → ا
    s = s.replace('\u0649', '\u064A')  # ى → ي
    s = s.replace('\u0629', '\u0647')  # ة → ه
    return s


# Common Arabic name components (Saudi/Gulf context) for segmentation
# These are first names, prefixes, and common name parts
ARABIC_NAME_PARTS = [
    # First names (longer first for greedy matching)
    "عبدالرحمن", "عبدالله", "عبدالعزيز", "عبدالمحسن", "عبدالحميد",
    "عبدالجليل", "عبدالكريم", "عبدالقادر", "عبدالواحد", "عبدالستار",
    "عبدالرسول", "عبدالنبي", "عبدالحفيظ", "عبدالمجيد", "عبدالحي",
    "ابراهيم", "إبراهيم", "محمد", "أحمد", "احمد", "سالم", "سعود",
    "خالد", "سعيد", "ناصر", "علي", "حسن", "حسين", "يوسف", "عيسى",
    "موسى", "اسماعيل", "إسماعيل", "اسحاق", "إسحاق", "يعقوب", "يحيى",
    "زكريا", "داود", "سليمان", "ادريس", "إدريس", "الياس", "إلياس",
    "عمر", "عثمان", "ابوبكر", "أبوبكر", "عمران", "زكي", "زاهر",
    "فهد", "تركي", "بدر", "ماجد", "وليد", "فيصل", "سلطان", "نواف",
    "متعب", "عبدالعزيز", "راكان", "مشاري", "ثامر", "ناهض",
    # Family/tribe indicators
    "آل", "ال", "ابن", "بن",
    # Common family names
    "الفارس", "القحطاني", "الغامدي", "الشهري", "العمري", "الحربي",
    "العتيبي", "الدوسري", "الزهراني", "الشهري", "القرني", "البيشي",
    "المطيري", "الحازمي", "البقمي", "العنزي", "الرشيدي", "الشمري",
    "الأنصاري", "الانصاري", "المالكي", "الجهني", "البلوي", "الخالدي",
    "السهلي", "الرشيدي", "العمري", "السهلي",
    # Common words that appear in names
    "حمد", "راشد", "سعد", "فايز", "مري", "بدوي", "جاسم", "كريم",
    "ناجي", "هاني", "فواز", "ماجد", "راوي", "صالح", "طاهر", "عادل",
    "غازي", "كمال", "مامون", "نبيه", "وهيب", "ياسر", "يمن",
    # Common verb/preposition in transfer descriptions
    "من", "الى", "الي", "حساب", "بنك", "تحويل",
]


def segment_arabic_name(concatenated):
    """
    Try to segment a concatenated Arabic name string into words.
    Uses greedy matching against a dictionary of common name parts.
    """
    if ' ' in concatenated:
        return concatenated  # Already has spaces
    
    # Try to segment
    result = []
    remaining = concatenated
    while remaining:
        matched = False
        # Try longest match first
        for part in sorted(ARABIC_NAME_PARTS, key=len, reverse=True):
            if remaining.startswith(part):
                result.append(part)
                remaining = remaining[len(part):]
                matched = True
                break
        if not matched:
            # If no match, take first 3-4 chars as a "word"
            # This is a fallback for unknown names
            chunk_size = min(4, len(remaining))
            result.append(remaining[:chunk_size])
            remaining = remaining[chunk_size:]
    
    return ' '.join(result)


def is_english_char(c):
    return 'a' <= c.lower() <= 'z'


def has_arabic(s):
    return any(is_arabic_char(c) for c in s)


def has_english(s):
    return any(is_english_char(c) for c in s)


def reverse_arabic_segment(s):
    """
    Arabic text from PDF can be in two forms:
    1. Presentation forms (FE** range) — NFKC normalization gives correct order
    2. Standard Arabic (06** range) — stored in REVERSED order, needs reversal
    """
    return s[::-1]


def has_presentation_forms(s):
    """Check if string contains Arabic Presentation Forms (FE** range)."""
    for c in s:
        cp = ord(c)
        if 0xFB50 <= cp <= 0xFEFF:
            return True
    return False


def count_known_name_parts(s):
    """Count how many known Arabic name parts appear in string s."""
    count = 0
    s_lower = s
    for part in ARABIC_NAME_PARTS:
        if part in s_lower:
            count += 1
            s_lower = s_lower.replace(part, '', 1)
    return count


def normalize_arabic_name(s):
    """Clean an Arabic segment to get a readable name.
    Handles both presentation forms (NFKC) and reversed standard Arabic."""
    # Normalize the Arabic text (convert presentation forms to base letters)
    s = normalize_arabic_text(s)
    # Normalize whitespace
    s = re.sub(r'\s+', ' ', s).strip()
    # Remove non-Arabic, non-space chars (keep only Arabic + spaces)
    cleaned = ''.join(c for c in s if is_arabic_char(c) or c == ' ')
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    # Re-normalize after cleaning
    cleaned = normalize_arabic_text(cleaned)
    
    # Detect if the string is in reversed order.
    # Strategy: try both the original and the reversed version,
    # pick whichever contains more known Arabic name parts.
    if cleaned and len(cleaned) > 3:
        reversed_cleaned = cleaned[::-1]
        # Also reverse word order (since words might be in reverse order too)
        words = reversed_cleaned.split()
        reversed_cleaned = ' '.join(reversed(words))
        
        original_score = count_known_name_parts(cleaned)
        reversed_score = count_known_name_parts(reversed_cleaned)
        
        # Use reversed if it scores higher (more known name parts)
        if reversed_score > original_score:
            cleaned = reversed_cleaned
    
    # If the cleaned name has no spaces (concatenated), try to segment it
    if cleaned and ' ' not in cleaned and len(cleaned) > 6:
        cleaned = segment_arabic_name(cleaned)
    return cleaned


def normalize_english_name(s):
    """Clean an English merchant/company name."""
    # Remove leading/trailing punctuation
    s = s.strip(' .,;:-()[]{}')
    # Remove pure number tokens
    tokens = s.split()
    cleaned_tokens = []
    for t in tokens:
        # Keep tokens that have at least one letter
        if any(c.isalpha() for c in t):
            # Strip punctuation from token
            t_clean = re.sub(r'^[^A-Za-z]+|[^A-Za-z]+$', '', t)
            if t_clean:
                cleaned_tokens.append(t_clean)
    return ' '.join(cleaned_tokens)


def is_stopword_arabic(word):
    """Check if Arabic word is a stopword."""
    word = word.strip()
    if not word:
        return True
    # Normalize for comparison
    word_norm = normalize_arabic_text(word)
    if word_norm in ARABIC_STOPWORDS:
        return True
    if word in ARABIC_STOPWORDS:
        return True
    if len(word) <= 1:
        return True
    return False


def is_stopword_english(word):
    """Check if English word is a stopword."""
    word = word.lower().strip()
    if not word:
        return True
    if word in ENGLISH_STOPWORDS:
        return True
    if len(word) <= 1:
        return True
    return False


def is_non_name_pattern(s):
    """Check if string matches a non-name pattern (account number, code)."""
    for pat in NON_NAME_PATTERNS:
        if re.match(pat, s, re.IGNORECASE):
            return True
    return False


def extract_candidate_names(description_full):
    """
    Extract candidate names from a full description string.
    Returns list of (name, language) tuples.
    """
    candidates = []
    # Split by pipe and other separators
    parts = re.split(r'[|/\\#]', description_full)
    
    for part in parts:
        part = part.strip()
        if not part or len(part) < 2:
            continue
        
        # Skip if it's a non-name pattern (account number, code)
        if is_non_name_pattern(part):
            continue
        
        # Skip if it's mostly digits
        digit_ratio = sum(1 for c in part if c.isdigit()) / len(part)
        if digit_ratio > 0.5:
            continue
        
        # Handle Arabic segments
        if has_arabic(part) and not has_english(part):
            # Pure Arabic segment - reverse it
            name = normalize_arabic_name(part)
            if name and len(name) >= 3:
                # Filter out single stopword
                words = name.split()
                non_stopwords = [w for w in words if not is_stopword_arabic(w)]
                if non_stopwords:
                    # If 1+ non-stopword, take the cleaned name
                    cleaned = ' '.join(non_stopwords)
                    if len(cleaned) >= 3 and not is_non_name_pattern(cleaned):
                        candidates.append((cleaned, 'ar'))
                elif len(words) >= 2 and all(not is_stopword_arabic(w) for w in words):
                    candidates.append((name, 'ar'))
        
        # Handle English segments (merchant names - typically ALL CAPS)
        elif has_english(part) and not has_arabic(part):
            # Skip if it's mostly lowercase (likely a sentence, not a name)
            upper_count = sum(1 for c in part if c.isupper())
            lower_count = sum(1 for c in part if c.islower())
            alpha_count = upper_count + lower_count
            
            # Merchant names are usually ALL CAPS or Title Case
            if alpha_count > 0:
                upper_ratio = upper_count / alpha_count
                # Accept if mostly upper (merchant) OR has multiple words
                if upper_ratio > 0.5 or len(part.split()) >= 2:
                    name = normalize_english_name(part)
                    if name and len(name) >= 3:
                        # Filter stopwords
                        words = name.split()
                        non_stopwords = [w for w in words if not is_stopword_english(w)]
                        if non_stopwords:
                            cleaned = ' '.join(non_stopwords)
                            if len(cleaned) >= 3 and not is_non_name_pattern(cleaned):
                                candidates.append((cleaned.upper(), 'en'))
        
        # Mixed Arabic+English — try to split and extract both
        elif has_arabic(part) and has_english(part):
            # Extract Arabic portion
            arabic_chars = []
            for c in part:
                if is_arabic_char(c) or c == ' ':
                    arabic_chars.append(c)
                else:
                    arabic_chars.append(' ')
            arabic_seg = re.sub(r'\s+', ' ', ''.join(arabic_chars)).strip()
            if arabic_seg and len(arabic_seg) >= 3:
                name = normalize_arabic_name(arabic_seg)
                if name and len(name) >= 3:
                    words = name.split()
                    non_stopwords = [w for w in words if not is_stopword_arabic(w)]
                    if non_stopwords:
                        cleaned = ' '.join(non_stopwords)
                        if len(cleaned) >= 3 and not is_non_name_pattern(cleaned):
                            candidates.append((cleaned, 'ar'))
            
            # Extract English portion
            english_chars = []
            for c in part:
                if is_english_char(c) or c in ' .,&-':
                    english_chars.append(c)
                else:
                    english_chars.append(' ')
            english_seg = re.sub(r'\s+', ' ', ''.join(english_chars)).strip()
            if english_seg and len(english_seg) >= 3:
                upper_count = sum(1 for c in english_seg if c.isupper())
                alpha_count = sum(1 for c in english_seg if c.isalpha())
                if alpha_count > 0 and upper_count / alpha_count > 0.5:
                    name = normalize_english_name(english_seg)
                    if name and len(name) >= 3:
                        words = name.split()
                        non_stopwords = [w for w in words if not is_stopword_english(w)]
                        if non_stopwords:
                            cleaned = ' '.join(non_stopwords)
                            if len(cleaned) >= 3 and not is_non_name_pattern(cleaned):
                                candidates.append((cleaned.upper(), 'en'))
    
    return candidates


def normalize_name_for_grouping(name, lang):
    """
    Normalize a name for grouping (case-insensitive, trim, etc.)
    Keep the original form for display but use normalized form as key.
    """
    if lang == 'ar':
        # Arabic: normalize (remove diacritics, unify alef forms, etc.) + trim
        normalized = normalize_arabic_text(name)
        return re.sub(r'\s+', ' ', normalized).strip()
    else:
        # English: uppercase
        return re.sub(r'\s+', ' ', name).strip().upper()


def main():
    with open(IN_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    transactions = data["transactions"]
    print(f"Processing {len(transactions)} transactions...")

    # Aggregate by name + direction
    # Key: (normalized_name, direction)
    name_stats = defaultdict(lambda: {
        "name": "",
        "name_normalized": "",
        "language": "",
        "direction": "",
        "count": 0,
        "total_amount": 0.0,
        "first_date": None,
        "last_date": None,
        "transactions": [],  # store sample tx info
        "categories": set(),
    })

    no_name_count = 0
    matched_count = 0

    for t in transactions:
        if not t.get("amount") or t["direction"] not in ("in", "out"):
            continue
        
        full = t.get("description_full", t["description"])
        candidates = extract_candidate_names(full)
        
        if not candidates:
            no_name_count += 1
            continue
        
        # Use the first candidate (usually the most relevant)
        # But also try other candidates if first seems weak
        primary_name = None
        primary_lang = None
        for name, lang in candidates:
            # Prefer longer names (more specific)
            if primary_name is None or len(name) > len(primary_name):
                primary_name = name
                primary_lang = lang
        
        if not primary_name:
            no_name_count += 1
            continue
        
        matched_count += 1
        norm = normalize_name_for_grouping(primary_name, primary_lang)
        key = (norm, t["direction"])
        
        s = name_stats[key]
        s["name"] = primary_name
        s["name_normalized"] = norm
        s["language"] = primary_lang
        s["direction"] = t["direction"]
        s["count"] += 1
        s["total_amount"] += t["amount"]
        s["categories"].add(t["category"])
        
        # Track dates
        if t.get("date_greg"):
            if s["first_date"] is None or t["date_greg"] < s["first_date"]:
                s["first_date"] = t["date_greg"]
            if s["last_date"] is None or t["date_greg"] > s["last_date"]:
                s["last_date"] = t["date_greg"]
        
        # Store sample transactions (max 5)
        if len(s["transactions"]) < 5:
            s["transactions"].append({
                "date_greg": t["date_greg"],
                "amount": t["amount"],
                "description": t["description"][:80],
                "category": t["category"],
                "category_ar": t["category_ar"],
            })

    print(f"Matched names: {matched_count}")
    print(f"No name extracted: {no_name_count}")
    print(f"Unique (name, direction) pairs: {len(name_stats)}")

    # Build final list
    name_list = []
    for (norm, direction), s in name_stats.items():
        # Skip very short or weird names
        if len(s["name"]) < 3:
            continue
        # Skip single-char names
        if len(s["name"].strip()) <= 1:
            continue
        # Skip names that are ALL stopwords (after splitting)
        words = s["name"].split()
        if s["language"] == 'ar':
            if all(is_stopword_arabic(w) for w in words):
                continue
        else:
            if all(is_stopword_english(w) for w in words):
                continue
        # Skip if name is just digits or codes
        if re.match(r'^[\d\s\-/.,]+$', s["name"]):
            continue
        
        name_list.append({
            "name": s["name"],
            "name_normalized": s["name_normalized"],
            "language": s["language"],
            "direction": direction,
            "count": s["count"],
            "total_amount": round(s["total_amount"], 2),
            "avg_amount": round(s["total_amount"] / s["count"], 2),
            "first_date": s["first_date"],
            "last_date": s["last_date"],
            "categories": sorted(list(s["categories"])),
            "sample_transactions": s["transactions"],
        })

    # Sort by total amount desc
    name_list.sort(key=lambda x: -x["total_amount"])

    # Build summary stats
    incoming_names = [n for n in name_list if n["direction"] == "in"]
    outgoing_names = [n for n in name_list if n["direction"] == "out"]
    
    # Names that appear in both directions
    incoming_set = {n["name_normalized"] for n in incoming_names}
    outgoing_set = {n["name_normalized"] for n in outgoing_names}
    both_directions = incoming_set & outgoing_set
    
    # Build "both directions" entries
    both_list = []
    for norm in both_directions:
        in_entry = next((n for n in incoming_names if n["name_normalized"] == norm), None)
        out_entry = next((n for n in outgoing_names if n["name_normalized"] == norm), None)
        if in_entry and out_entry:
            both_list.append({
                "name": in_entry["name"],
                "name_normalized": norm,
                "language": in_entry["language"],
                "in_count": in_entry["count"],
                "out_count": out_entry["count"],
                "in_amount": in_entry["total_amount"],
                "out_amount": out_entry["total_amount"],
                "total_amount": in_entry["total_amount"] + out_entry["total_amount"],
                "net": round(in_entry["total_amount"] - out_entry["total_amount"], 2),
                "first_date": min(in_entry["first_date"], out_entry["first_date"]),
                "last_date": max(in_entry["last_date"], out_entry["last_date"]),
            })
    both_list.sort(key=lambda x: -x["total_amount"])

    print(f"\nIncoming names: {len(incoming_names)}")
    print(f"Outgoing names: {len(outgoing_names)}")
    print(f"Both directions: {len(both_list)}")

    print(f"\nTop 10 incoming names by amount:")
    for n in incoming_names[:10]:
        print(f"  {n['total_amount']:>12,.2f} | {n['count']:>4d}× | {n['name'][:50]}")
    print(f"\nTop 10 outgoing names by amount:")
    for n in outgoing_names[:10]:
        print(f"  {n['total_amount']:>12,.2f} | {n['count']:>4d}× | {n['name'][:50]}")
    print(f"\nTop 5 both-direction names:")
    for n in both_list[:5]:
        print(f"  in={n['in_amount']:>10,.2f} out={n['out_amount']:>10,.2f} | {n['name'][:50]}")

    # Build output
    output = {
        "summary": {
            "total_unique_names": len(name_list),
            "incoming_names_count": len(incoming_names),
            "outgoing_names_count": len(outgoing_names),
            "both_directions_count": len(both_list),
            "matched_transactions": matched_count,
            "no_name_transactions": no_name_count,
            "total_incoming_amount": round(sum(n["total_amount"] for n in incoming_names), 2),
            "total_outgoing_amount": round(sum(n["total_amount"] for n in outgoing_names), 2),
        },
        "incoming_names": incoming_names,
        "outgoing_names": outgoing_names,
        "both_directions": both_list,
        "all_names": name_list,
    }

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_PATH}")
    print(f"File size: {os.path.getsize(OUT_PATH):,} bytes")


if __name__ == "__main__":
    main()
