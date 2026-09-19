#!/usr/bin/env python3
"""
Enhance transactions.json with:
1. raw_text_block - the original PDF text block exactly as it appears
2. reference_number - extracted reference number (cheque, SAI, CID, ATM, Sadad, etc.)
3. seq_in_page - the sequence number of the transaction on its page

Input: scripts/transactions.json (existing)
Output: scripts/transactions_enhanced.json (with new fields)
"""
import fitz
import json
import re
import os

PDF_PATH = "/home/z/my-project/upload/كشف حساب ابوي الراجحي.pdf"
IN_PATH = "/home/z/my-project/scripts/transactions.json"
OUT_PATH = "/home/z/my-project/scripts/transactions_enhanced.json"

AMT = r'-?\d{1,3}(?:,\d{3})*(?:\.\d+)?-?'

# Pattern for transaction line: ...description... YYMMDD YYYYMMDD
TX_LINE_PATTERN = re.compile(
    r'^(.*?)\s+(\d{6})\s+(\d{8})\s*$'
)

# Page summary line
SUMMARY_PATTERN = re.compile(
    r'(' + AMT + r')\s+(' + AMT + r')\s+(' + AMT + r')\s+Currency\s*$'
)

SKIP_PATTERNS = [
    r'DEAR CUST',
    r'KPMG',
    r'ERNST',
    r'P\.O\.?\.?BOX',
    r'P\.O\. BOX',
    r'Saudi Arabia',
    r'^\s*MR\.',
    r'^\s*\d+\s*$',  # page number
    r'^\s*28700-',
    r'\d{4}/\d{2}/\d{2}\s*-\s*\d{4}/\d{2}/\d{2}',
    r'BEGINNING BALANCE',
    r'^\s*SA45',
    r'SALEM MOHAMED',
    r'^\s*Currency\s*$',
    r'^\s*Saudi Riyal\s*$',
]


def should_skip(line):
    s = line.strip()
    if not s:
        return True
    if s == "ـــ":
        return True
    for pat in SKIP_PATTERNS:
        if re.search(pat, line, re.IGNORECASE):
            return True
    return False


def extract_reference_number(description_full, description):
    """
    Try to extract a transaction reference number from the description.
    Returns the most relevant reference found, or None.
    """
    text = description_full or description
    if not text:
        return None

    # Try various reference patterns in order of priority

    # 1. Cheque number: "Cheque Withdrawal" with "لكم0000000152" or 8-10 digit number
    # Pattern: cheque number after "لكم" or "رقم الشيك"
    m = re.search(r'لكم\s*(\d{6,12})', text)
    if m:
        return f"شيك: {m.group(1)}"

    # Pattern: "رقم الشيك" + number
    m = re.search(r'رقم\s*الشيك\s*[:\-]?\s*(\d{6,12})', text)
    if m:
        return f"شيك: {m.group(1)}"

    # 2. SAI reference (Sarie): SAI followed by 6+ digits
    m = re.search(r'SAI\s*(\d{4,12})', text, re.IGNORECASE)
    if m:
        return f"سريع: SAI{m.group(1)}"

    # 3. Sarie payment order: ER-XXXXXXXXXX
    m = re.search(r'ER[-/]?(\d{8,15})', text, re.IGNORECASE)
    if m:
        return f"سريع: ER-{m.group(1)}"

    # 4. IPS / Inward-Outward: TOACCT/XXXXXXXXXX or FRACCT/XXXXXXXXXX
    m = re.search(r'(TO|FR)\s*[-/]?\s*ACCT\s*[/]?\s*(\d{6,15})', text, re.IGNORECASE)
    if m:
        return f"IPS: {m.group(1)}-{m.group(2)}"

    # 5. CID (Civil ID / Government): CID-XXXXXXXX
    m = re.search(r'CID[-/]?(\d{6,12})', text, re.IGNORECASE)
    if m:
        return f"حكومي: CID-{m.group(1)}"

    # 6. Traffic Violation: TV/CID-XXXXXXXX
    m = re.search(r'TV\s*/\s*CID[-/]?(\d{6,12})', text, re.IGNORECASE)
    if m:
        return f"مخالفة: TV-{m.group(1)}"

    # 7. ATM terminal ID: DRAJHIA1L038006BC41 (DR + city + ... + BC + number)
    m = re.search(r'(DR[A-Z]{2,5}A\dL\d{6}BC\d{2})', text)
    if m:
        # Also try to get Sadad biller code
        sadad_match = re.search(r'(5000\d{6})', text)
        if sadad_match:
            return f"ATM: {m.group(1)} · سداد: {sadad_match.group(1)}"
        return f"ATM: {m.group(1)}"

    # 8. Sadad biller code (5000313231)
    m = re.search(r'(5000\d{6,8})', text)
    if m:
        return f"سداد: {m.group(1)}"

    # 9. Foreign payment order: ECEO01 + something, or I-/ER- number
    m = re.search(r'ER[-/]?0*(\d{6,12})', text, re.IGNORECASE)
    if m:
        return f"تحويل: ER-{m.group(1)}"

    # 10. Sarie payment order ref: FT + digits (FT20343942936108)
    m = re.search(r'FT\s*(\d{8,15})', text, re.IGNORECASE)
    if m:
        return f"تحويل: FT{m.group(1)}"

    # 11. SABB/RIB reference: SRJHI + digits (SRJHI220470)
    m = re.search(r'(SRJHI\d{4,10})', text, re.IGNORECASE)
    if m:
        return f"بنكي: {m.group(1)}"

    # 12. SABBTT/RTGS: SN-XXXX
    m = re.search(r'SN[-/]?\s*([A-Z0-9]{4,15})', text)
    if m:
        return f"مرجع: SN-{m.group(1)}"

    # 13. Draft Issuance number
    m = re.search(r'(\d{6,12})\s*EGOUG', text)
    if m:
        return f"مسودة: {m.group(1)}"

    # 14. SPOUD/MROUD code (Sadad)
    m = re.search(r'(SPOUD|MROUD)(\d{3})', text)
    if m:
        return f"سداد: {m.group(1)}{m.group(2)}"

    # 15. Card transaction: card number (masked) 409201******5382
    m = re.search(r'(\d{6}\*{4,6}\d{4})', text)
    if m:
        return f"بطاقة: {m.group(1)}"

    # 16. POS / Online Purchase: merchant reference
    # (6393422003155983-322822403852) — long reference
    m = re.search(r'\((\d{10,16})-(\d{10,15})\)', text)
    if m:
        return f"مرجع: {m.group(1)}"

    # 17. Reference number like W#002-5753251002-30081581101
    m = re.search(r'W#?\s*([\d\-]{8,25})', text)
    if m:
        return f"مرجع: W-{m.group(1)}"

    # 18. ARNB / SABB bank reference
    m = re.search(r'(ARNB\d{4,12}|SABB\d{4,12}|ALB\d{4,12})', text)
    if m:
        return f"بنكي: {m.group(1)}"

    # 19. SARIE Payment ref: SRRJHI22047000527
    m = re.search(r'(SRRJHI\d{4,15})', text, re.IGNORECASE)
    if m:
        return f"سريع: {m.group(1)}"

    # 20. IBAN-like references
    m = re.search(r'(SA\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4})', text)
    if m:
        return f"آيبان: {m.group(1).replace(' ', '')[-4:]}"

    # 21. Repurchased Cheque number: (5515319003104790,153190441826)
    m = re.search(r'\(?\s*(\d{12,16})\s*,\s*(\d{10,15})\s*\)?', text)
    if m:
        return f"شيك: {m.group(1)[-8:]}"

    return None


def main():
    # Load existing transactions
    with open(IN_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    transactions = data["transactions"]
    print(f"Loaded {len(transactions)} transactions from existing JSON")

    # Open PDF and get page text
    doc = fitz.open(PDF_PATH)
    page_texts = {}
    for i, page in enumerate(doc):
        page_texts[i + 1] = page.get_text()
    doc.close()
    print(f"Loaded text from {len(page_texts)} pages")

    # For each page, extract transaction line ranges with their continuation lines
    # We'll match transactions to their raw text blocks by their date+description

    # Group transactions by page
    tx_by_page = {}
    for tx in transactions:
        tx_by_page.setdefault(tx["page"], []).append(tx)

    # For each page, find transaction lines and capture their continuation
    enhanced_count = 0
    for page_num, page_txs in tx_by_page.items():
        if page_num not in page_texts:
            continue
        lines = page_texts[page_num].split("\n")

        # Find indices of transaction lines on this page
        # A transaction line ends with YYMMDD YYYYMMDD (6 digits + 8 digits)
        tx_line_indices = []
        for i, ln in enumerate(lines):
            if should_skip(ln):
                continue
            m = TX_LINE_PATTERN.match(ln)
            if m:
                # Verify this is a real transaction (has amounts)
                prefix = m.group(1)
                # Check if has at least one amount
                if re.search(AMT, prefix):
                    tx_line_indices.append(i)

        # For each transaction in page_txs (in order), assign to next tx_line
        # Both lists should be roughly the same length
        # We'll match by description+date to be safe
        for tx_idx, tx in enumerate(page_txs):
            # Find matching tx_line by checking date
            greg = tx.get("date_greg_raw", "")
            hijri = tx.get("date_hijri_raw", "")
            desc_start = tx["description"].split(" ")[0].lower() if tx["description"] else ""

            matched_line_idx = None
            for line_idx in tx_line_indices:
                ln = lines[line_idx]
                if greg in ln and hijri in ln:
                    # Verify description matches (first 5 chars)
                    if desc_start and desc_start[:5] in ln.lower():
                        matched_line_idx = line_idx
                        break
                    # If no desc match, take first available
                    if matched_line_idx is None:
                        matched_line_idx = line_idx

            if matched_line_idx is None:
                # Fallback: use tx_idx if available
                if tx_idx < len(tx_line_indices):
                    matched_line_idx = tx_line_indices[tx_idx]

            if matched_line_idx is None:
                tx["raw_text_block"] = tx.get("description", "")
                tx["reference_number"] = extract_reference_number(
                    tx.get("description_full", ""), tx.get("description", ""))
                tx["seq_in_page"] = tx_idx + 1
                continue

            # Capture the transaction line + continuation lines until next tx or summary
            block_lines = [lines[matched_line_idx]]
            j = matched_line_idx + 1
            while j < len(lines):
                next_ln = lines[j]
                # Stop if next line is another transaction
                if not should_skip(next_ln):
                    if TX_LINE_PATTERN.match(next_ln) and re.search(AMT, next_ln):
                        break
                    if SUMMARY_PATTERN.search(next_ln):
                        break
                # Skip header/footer lines (don't include them in the raw block)
                if should_skip(next_ln):
                    j += 1
                    continue
                block_lines.append(next_ln)
                j += 1
                # Limit to 10 continuation lines max
                if len(block_lines) >= 12:
                    break

            raw_text = "\n".join(block_lines).strip()
            tx["raw_text_block"] = raw_text
            tx["reference_number"] = extract_reference_number(
                tx.get("description_full", ""), tx.get("description", ""))
            tx["seq_in_page"] = tx_idx + 1
            enhanced_count += 1

    print(f"Enhanced {enhanced_count}/{len(transactions)} transactions with raw text blocks")

    # Stats on reference numbers
    with_ref = sum(1 for t in transactions if t.get("reference_number"))
    print(f"Transactions with reference numbers: {with_ref}/{len(transactions)}")

    # Sample
    print("\n=== Sample transactions ===")
    for i, t in enumerate(transactions[:5]):
        print(f"\nTransaction #{i+1}:")
        print(f"  Date: {t.get('date_greg')} (Hijri: {t.get('date_hijri_raw')})")
        print(f"  Page: {t.get('page')}, Seq: {t.get('seq_in_page')}")
        print(f"  Description: {t.get('description')}")
        print(f"  Reference: {t.get('reference_number')}")
        print(f"  Raw text block:")
        for ln in (t.get('raw_text_block') or '').split('\n'):
            print(f"    | {ln}")

    # Save enhanced file
    output = {
        **data,
        "transactions": transactions,
    }
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_PATH}")
    print(f"File size: {os.path.getsize(OUT_PATH):,} bytes")


if __name__ == "__main__":
    main()
