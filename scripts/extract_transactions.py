#!/usr/bin/env python3
"""
Extract all transactions from Al Rajhi Bank PDF statement - V2.
The PDF column layout (positional) is:
  COL1 (~col 10-20): Running balance AFTER transaction (with optional "-" suffix for negative)
  COL2 (~col 28-38): CREDIT amount (incoming money)
  COL3 (~col 45-55): DEBIT amount (outgoing money)
  Then: Description text
  Then: Gregorian date YYMMDD
  Then: Hijri date YYYYMMDD

Page summary line at bottom:
  ending_balance  total_credits  total_debits   Currency  Saudi Riyal
"""
import fitz
import re
import json
import os

PDF_PATH = "/home/z/my-project/upload/كشف حساب ابوي الراجحي.pdf"
OUT_PATH = "/home/z/my-project/scripts/transactions.json"

AMT = r'-?\d{1,3}(?:,\d{3})*(?:\.\d+)?-?'

# Match any line ending with 6-digit gregorian date and 8-digit hijri date
TX_LINE_PATTERN = re.compile(
    r'^(.*?)\s+(\d{6})\s+(\d{8})\s*$'
)

# Page summary: three amounts then "Currency" + "Saudi Riyal"
SUMMARY_PATTERN = re.compile(
    r'(' + AMT + r')\s+(' + AMT + r')\s+(' + AMT + r')\s+Currency\s*$'
)

# Lines we want to skip (header/footer noise)
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


def parse_amount(s):
    if s is None or s == "":
        return None
    s = s.strip()
    if s == "":
        return None
    negative = s.endswith("-")
    s = s.rstrip("-").replace(",", "").strip()
    try:
        v = float(s)
        return -v if negative else v
    except ValueError:
        return None


def greg_to_date(greg_str):
    if not greg_str or len(greg_str) != 6:
        return None
    yy = int(greg_str[0:2])
    mm = int(greg_str[2:4])
    dd = int(greg_str[4:6])
    year = 2000 + yy if yy <= 50 else 1900 + yy
    try:
        datetime_check = (year, mm, dd)
        if mm < 1 or mm > 12 or dd < 1 or dd > 31:
            return None
        return f"{year:04d}-{mm:02d}-{dd:02d}"
    except Exception:
        return None


def hijri_to_date(hijri_str):
    """Convert Hijri YYYYMMDD to YYYY-MM-DD."""
    if not hijri_str or len(hijri_str) != 8:
        return None
    y = hijri_str[0:4]
    m = hijri_str[4:6]
    d = hijri_str[6:8]
    return f"{y}-{m}-{d}"


def extract_all_text():
    doc = fitz.open(PDF_PATH)
    pages = []
    for i, page in enumerate(doc):
        pages.append((i + 1, page.get_text()))
    doc.close()
    return pages


def find_amounts_with_positions(line):
    """
    Find all amount-like tokens on the line and return list of (start_col, end_col, raw, value, is_negative).
    Positions are 0-indexed character columns.
    """
    results = []
    # Match amounts with optional trailing dash for negative
    for m in re.finditer(r'(\d{1,3}(?:,\d{3})*(?:\.\d+)?)(-?)', line):
        start = m.start()
        end = m.end()
        raw = m.group(0)
        # Skip very short matches that are likely part of dates
        # (we'll filter later)
        val = parse_amount(raw)
        if val is None:
            continue
        results.append((start, end, raw, val))
    return results


def parse_transaction_line(line, greg, hijri):
    """
    Parse a transaction line. Returns dict with balance, debit, credit, description.
    Column layout:
      COL1 (~col 10-20): Balance after
      COL2 (~col 28-38): CREDIT
      COL3 (~col 45-55): DEBIT
    """
    # The line format is: [balance] [credit] [debit] description date hijri
    # OR: [balance] [debit] description date hijri  (if credit empty)
    # OR: [balance] [credit] description date hijri (if debit empty)
    # OR: [balance] description date hijri (rare, only if both empty - shouldn't happen)

    # Strategy: Find all amount tokens with positions on the part before description
    # Description is the text between the last amount and the greg date.
    # The greg+hijri are at the end (matched separately).
    
    # Find where the date starts (greg 6 digits, then 8 digits hijri at end)
    # Actually, the TX_LINE_PATTERN already captured (.*?)\s+(\d{6})\s+(\d{8})
    # So `line` should be just the prefix part (before the dates).
    # But we receive the full line. Let's strip the trailing dates.
    
    full_match = re.search(r'^(.*?)\s+(\d{6})\s+(\d{8})\s*$', line)
    if not full_match:
        return None
    prefix = full_match.group(1)
    # Note: greg and hijri are full_match.group(2) and group(3), already passed
    
    # Now find all amount tokens in prefix
    amounts = find_amounts_with_positions(prefix)
    
    if not amounts:
        return None
    
    # Determine column for each amount by character position
    # Based on observation:
    #   Balance: chars 0-20 (typically around 10-18)
    #   Credit:  chars 25-40 (typically around 28-38)
    #   Debit:   chars 40-60 (typically around 45-55)
    
    balance = None
    credit = None
    debit = None
    
    # Sort by position
    amounts.sort(key=lambda x: x[0])
    
    # The first amount is always the balance
    if len(amounts) >= 1:
        balance = amounts[0][3]
    
    # For remaining amounts, classify by position
    for amt in amounts[1:]:
        pos = amt[0]
        val = amt[3]
        if pos < 42:  # credit column (closer to balance)
            if credit is None:
                credit = val
            else:
                # Already have credit — maybe this is actually debit
                if debit is None:
                    debit = val
        else:  # debit column (further right)
            if debit is None:
                debit = val
            else:
                # Already have debit, skip (shouldn't happen normally)
                pass
    
    # Description: text after the last amount, stripped
    last_amt_end = amounts[-1][1]
    description = prefix[last_amt_end:].strip()
    # Remove leading/trailing pipes
    description = description.strip(" |")
    
    # Clean description: collapse multiple spaces
    description = re.sub(r'\s+', ' ', description)
    
    return {
        "balance_after": balance,
        "debit": debit,
        "credit": credit,
        "description": description,
    }


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


def extract_account_info(text):
    info = {}
    for ln in text.split("\n"):
        if "SALEM MOHAMED A ALFARES" in ln.upper():
            info["name"] = "SALEM MOHAMED A ALFARES"
            info["name_ar"] = "سالم محمد الفارس"
        m = re.search(r'(SA\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4})', ln)
        if m:
            info["iban"] = m.group(1).replace(" ", "")
        if "Saudi Arabia" in ln and len(ln.strip()) < 30:
            info["country"] = "Saudi Arabia"
            info["country_ar"] = "المملكة العربية السعودية"
        m = re.search(r'(\d{5})-([A-Za-z]+)', ln)
        if m and "28700" in ln:
            info["branch_code"] = m.group(1)
            info["branch_name"] = m.group(2)
        m = re.search(r'(\d{4}/\d{2}/\d{2})\s*-\s*(\d{4}/\d{2}/\d{2})', ln)
        if m:
            info["period_from"] = m.group(1)
            info["period_to"] = m.group(2)
        if "BEGINNING BALANCE" in ln.upper():
            m = re.search(r'(-?\d{1,3}(?:,\d{3})*(?:\.\d+)?)(-?)', ln)
            if m:
                v = parse_amount(m.group(1) + m.group(2))
                info["beginning_balance"] = v
    return info


def parse_pages(pages):
    transactions = []
    page_summaries = []
    account_info = {}

    # State for multi-line descriptions
    last_tx = None

    for page_no, text in pages:
        if page_no == 1:
            account_info = extract_account_info(text)

        lines = text.split("\n")
        for ln in lines:
            # Skip headers/footers
            if should_skip(ln):
                continue

            # Check for page summary line
            sm = SUMMARY_PATTERN.search(ln)
            if sm:
                # But also need to verify this isn't accidentally matching a tx line
                # Page summary has "Currency" + "Saudi Riyal"
                if "Currency" in ln and "Saudi Riyal" in ln:
                    page_summaries.append({
                        "page": page_no,
                        "ending_balance": parse_amount(sm.group(1)),
                        "total_credit_page": parse_amount(sm.group(2)),
                        "total_debit_page": parse_amount(sm.group(3)),
                    })
                    continue

            # Try transaction match (line ends with 6-digit greg + 8-digit hijri)
            m = TX_LINE_PATTERN.match(ln)
            if not m:
                continue

            prefix = m.group(1)
            greg = m.group(2)
            hijri = m.group(3)

            # Skip lines that look like header noise that happened to match the pattern
            if any(re.search(p, prefix, re.IGNORECASE) for p in SKIP_PATTERNS):
                continue

            parsed = parse_transaction_line(ln, greg, hijri)
            if parsed is None:
                continue
            if not parsed["description"]:
                continue
            # Skip if description has no alpha chars (just numbers/garbage)
            if not re.search(r'[A-Za-z\u0600-\u06FF]', parsed["description"]):
                continue

            tx = {
                "page": page_no,
                "balance_after": parsed["balance_after"],
                "debit": parsed["debit"],
                "credit": parsed["credit"],
                "description": parsed["description"],
                "date_greg": greg_to_date(greg),
                "date_greg_raw": greg,
                "date_hijri": hijri_to_date(hijri),
                "date_hijri_raw": hijri,
            }
            transactions.append(tx)
            last_tx = tx
            continue

        # After processing each line on the page, we may have continuation
        # description lines that we missed. We'll handle this in a second pass.

    return transactions, page_summaries, account_info


def attach_multiline_descriptions(transactions, pages):
    """
    Second pass: for each transaction, look at lines BELOW the transaction line
    on the same page that are not amount lines and not headers — those are
    continuation description lines.
    
    We do this by re-parsing the pages with the index of each transaction.
    """
    # Group transactions by page
    by_page = {}
    for tx in transactions:
        by_page.setdefault(tx["page"], []).append(tx)
    
    for page_no, page_txs in by_page.items():
        if page_no > len(pages):
            continue
        text = pages[page_no - 1][1]
        lines = text.split("\n")
        # Find line index of each transaction
        for tx in page_txs:
            # Find the line that contains the greg+hijri date of this tx
            tx_line_idx = None
            for i, ln in enumerate(lines):
                if tx["date_greg_raw"] in ln and tx["date_hijri_raw"] in ln:
                    # Verify this line has the right description start
                    if tx["description"].split(" ")[0] in ln or len(tx["description"]) > 5:
                        tx_line_idx = i
                        break
            if tx_line_idx is None:
                continue
            # Look at lines below until we hit another amount line or empty section
            extra_lines = []
            for j in range(tx_line_idx + 1, min(tx_line_idx + 10, len(lines))):
                next_ln = lines[j]
                if not next_ln.strip():
                    break
                # If next line has the next transaction's pattern (ends with dates), stop
                if TX_LINE_PATTERN.match(next_ln):
                    break
                # If next line has Currency (page summary), stop
                if "Currency" in next_ln and "Saudi Riyal" in next_ln:
                    break
                # Skip header noise
                if should_skip(next_ln):
                    continue
                # Skip pure number lines
                if re.match(r'^\s*\d+\s*$', next_ln):
                    continue
                # Skip very short lines (likely noise)
                if len(next_ln.strip()) < 2:
                    continue
                # Skip lines that are just an amount
                if re.match(r'^\s*' + AMT + r'\s*$', next_ln):
                    continue
                extra_lines.append(next_ln.strip())
            if extra_lines:
                tx["description_full"] = tx["description"] + " | " + " | ".join(extra_lines)
            else:
                tx["description_full"] = tx["description"]


def classify_transactions(transactions):
    """Add type/category fields to each transaction."""
    CATEGORIES = [
        # (key, [keywords], ar_label, ar_keywords) — order matters, first match wins
        ("cash_deposit", ["cash deposit", "cash deposit - atm"], "إيداع نقدي", ["ايداع", "إيداع"]),
        ("atm_withdrawal", ["atm withdrawal", "cash withdrawal", "electron withdrawal", "kiosk - atm"], "سحب ATM", ["سحب"]),
        ("cheque", ["cheque withdrawal", "repurchased cheque", "draft issuance", "correspondent draft", "cheque"], "شيكات", ["شيك"]),
        ("sarie_transfer", ["sarie", "domestic sarie", "sarie payment", "sariee inward"], "تحويل سريع", []),
        ("ips_transfer", ["inward ips", "outward ips", "ips credit", "ips payment"], "تحويل دولي IPS", []),
        ("local_transfer", ["local payment", "inward local", "internal transfer", "transfer to account", "transfer from account", "transfer to customer", "transfer from", "transfer to gl", "am transfer", "transfer to arc", "bankab", "bank transfer", "transfer"], "تحويل محلي", ["تحويل"]),
        ("foreign_transfer", ["foreign payment", "international payment", "outward remittance", "inward remittance"], "تحويل دولي", []),
        ("card", ["debit - credit", "visa", "mastercard", "card payment", "pos purchase", "pos payment", "pos credit", "online purchase", "dynamic currency", "card purchase", "atm card", "atm deposit", "prepaid card", "sawa prepaid", "qiyas prepaid", "electron ", "mada"], "مشتريات بطاقة", ["بطاقة", "شراء"]),
        ("stc_bill", ["stc bill", "stc payment", "stc - high", "saudi telecom", "telecom"], "فاتورة STC", []),
        ("electricity_bill", ["sceco bill", "sceco payment", "elc", "electricity", "sec bill"], "فاتورة كهرباء", ["كهرباء"]),
        ("water_bill", ["water bill", "wco", "water payment"], "فاتورة مياه", ["مياه"]),
        ("sadad", ["sadad"], "سداد", ["سداد"]),
        ("government", ["passport office", "vehicle registration", "driving licence", "labor import", "traffic violation", "violation", "government", "civil affairs", "qiyas", "absher"], "مدفوعات حكومية", ["مخالفة", "حكوم", "جواز", "رخص"]),
        ("salary", ["salary", "payroll"], "راتب", ["راتب"]),
        ("refund", ["refund", "reversal", "recovery", "atm credit"], "استرداد", ["استرداد", "رد"]),
        ("ipo", ["ipo", "subscription -", "ittihad", "subscription"], "اكتتاب عام", ["اكتتاب"]),
        ("fees", ["low average", "fees", "fee ", " vat", "commission", "charges", "minimum balance"], "رسوم", ["رسوم"]),
        ("loan", ["loan", "financing", "murabaha", "tawarruq"], "تمويل", ["تمويل", "قرض"]),
        ("insurance", ["insurance", "tawuniya", "cooper insu"], "تأمين", ["تأمين"]),
        ("charity", ["charity", "donation", "zakat"], "صدقة وزكاة", ["صدقة", "زكاة", "تبرع"]),
        ("dividends", ["dividend", "share dividend"], "توزيعات أرباح", ["أرباح"]),
        ("other", [], "أخرى", []),
    ]

    for tx in transactions:
        desc_lower = tx["description"].lower()
        desc_full = tx.get("description_full", tx["description"])
        desc_full_lower = desc_full.lower()
        category = "other"
        category_ar = "أخرى"
        for key, keywords, ar_label, ar_kw in CATEGORIES:
            if any(kw in desc_lower or kw in desc_full_lower for kw in keywords):
                category = key
                category_ar = ar_label
                break
            # Check Arabic keywords in the full description
            if any(kw in desc_full for kw in ar_kw):
                category = key
                category_ar = ar_label
                break
        tx["category"] = category
        tx["category_ar"] = category_ar

        # Direction
        if tx["debit"] is not None and tx["debit"] > 0:
            tx["direction"] = "out"
            tx["amount"] = tx["debit"]
        elif tx["credit"] is not None and tx["credit"] > 0:
            tx["direction"] = "in"
            tx["amount"] = tx["credit"]
        else:
            tx["direction"] = "unknown"
            tx["amount"] = None

        # Year & month
        if tx["date_greg"]:
            tx["year"] = int(tx["date_greg"][0:4])
            tx["month"] = int(tx["date_greg"][5:7])
            tx["year_month"] = tx["date_greg"][0:7]
        else:
            tx["year"] = None
            tx["month"] = None
            tx["year_month"] = None

        # Transaction size category
        if tx["amount"] is not None:
            if tx["amount"] >= 10000:
                tx["size"] = "large"
            elif tx["amount"] >= 1000:
                tx["size"] = "medium"
            else:
                tx["size"] = "small"
        else:
            tx["size"] = "unknown"

    return transactions


def main():
    print(f"Opening {PDF_PATH} ...")
    pages = extract_all_text()
    print(f"Extracted text from {len(pages)} pages")

    transactions, page_summaries, account_info = parse_pages(pages)
    print(f"Parsed {len(transactions)} raw transactions")
    print(f"Parsed {len(page_summaries)} page summaries")
    print(f"Account info: {account_info}")

    # Attach multi-line descriptions
    attach_multiline_descriptions(transactions, pages)

    # Classify
    transactions = classify_transactions(transactions)

    # Stats
    out_txs = [t for t in transactions if t["direction"] == "out"]
    in_txs = [t for t in transactions if t["direction"] == "in"]
    total_out = sum(t["amount"] for t in out_txs if t["amount"])
    total_in = sum(t["amount"] for t in in_txs if t["amount"])
    print(f"Outgoing: {len(out_txs)} txs, total = {total_out:,.2f} SAR")
    print(f"Incoming: {len(in_txs)} txs, total = {total_in:,.2f} SAR")

    # Verify against page summaries
    if page_summaries:
        final = page_summaries[-1]
        print(f"Final balance (page {final['page']}): {final['ending_balance']:,.2f} SAR")
        total_credits_summary = sum(p["total_credit_page"] for p in page_summaries if p["total_credit_page"])
        total_debits_summary = sum(p["total_debit_page"] for p in page_summaries if p["total_debit_page"])
        print(f"From summaries: total credits = {total_credits_summary:,.2f}, total debits = {total_debits_summary:,.2f}")

    # Category stats
    print("\nTop categories by count:")
    from collections import Counter
    cat_count = Counter(t["category"] for t in transactions)
    for cat, cnt in cat_count.most_common(15):
        cat_txs = [t for t in transactions if t["category"] == cat]
        cat_sum = sum(t["amount"] for t in cat_txs if t["amount"])
        print(f"  {cat}: {cnt} txs, total = {cat_sum:,.2f} SAR")

    print("\nTop categories by amount:")
    cat_amount = {}
    for t in transactions:
        if t["amount"]:
            cat_amount[t["category"]] = cat_amount.get(t["category"], 0) + t["amount"]
    for cat, amt in sorted(cat_amount.items(), key=lambda x: -x[1])[:15]:
        print(f"  {cat}: {amt:,.2f} SAR")

    # Sample transactions
    print("\nFirst 5 transactions:")
    for t in transactions[:5]:
        print(f"  {t['date_greg']} | {t['direction']:3s} | {t['amount']:>10,.2f} | bal={t['balance_after']:>10,.2f} | {t['description'][:60]}")
    print("\nLast 5 transactions:")
    for t in transactions[-5:]:
        print(f"  {t['date_greg']} | {t['direction']:3s} | {t['amount']:>10,.2f} | bal={t['balance_after']:>10,.2f} | {t['description'][:60]}")

    # Save
    out = {
        "account_info": account_info,
        "transactions": transactions,
        "page_summaries": page_summaries,
        "stats": {
            "total_transactions": len(transactions),
            "total_outgoing": len(out_txs),
            "total_incoming": len(in_txs),
            "total_outgoing_amount": round(total_out, 2),
            "total_incoming_amount": round(total_in, 2),
            "first_page": 1,
            "last_page": len(pages),
        }
    }
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_PATH}")
    print(f"File size: {os.path.getsize(OUT_PATH):,} bytes")


if __name__ == "__main__":
    main()
