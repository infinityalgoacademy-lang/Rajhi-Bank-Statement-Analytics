#!/usr/bin/env python3
"""
Enhance names.json with full transaction list per name, including:
- page (PDF page number)
- seq_in_page (transaction sequence in page)
- reference_number (extracted reference)
- date_greg, date_hijri_raw, amount, direction, description, category, category_ar, balance_after
- raw_text_block (the original PDF text)

This produces a richer names.json with full transaction history per name.
"""
import json
import os
import sys

# Import the name extraction logic
sys.path.insert(0, '/home/z/my-project/scripts')
from extract_names import (
    extract_candidate_names, normalize_name_for_grouping,
    normalize_arabic_text,
)

IN_TX_PATH = "/home/z/my-project/scripts/transactions_enhanced.json"
IN_NAMES_PATH = "/home/z/my-project/scripts/transactions_enhanced.json"  # has all tx data
OUT_PATH = "/home/z/my-project/public/names.json"

from collections import defaultdict


def main():
    # Load enhanced transactions (with raw_text_block, reference_number, seq_in_page)
    with open(IN_TX_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    transactions = data["transactions"]
    print(f"Loaded {len(transactions)} enhanced transactions")

    # Group all transactions by (name_normalized, direction)
    # Each name entry will hold ALL its transactions (not just samples)
    name_stats = defaultdict(lambda: {
        "name": "",
        "name_normalized": "",
        "language": "",
        "direction": "",
        "count": 0,
        "total_amount": 0.0,
        "first_date": None,
        "last_date": None,
        "categories": set(),
        "transactions": [],  # ALL transactions for this name
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

        # Pick the longest candidate (most specific)
        primary_name = None
        primary_lang = None
        for name, lang in candidates:
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

        if t.get("date_greg"):
            if s["first_date"] is None or t["date_greg"] < s["first_date"]:
                s["first_date"] = t["date_greg"]
            if s["last_date"] is None or t["date_greg"] > s["last_date"]:
                s["last_date"] = t["date_greg"]

        # Store full transaction info
        tx_info = {
            "page": t.get("page"),
            "seq_in_page": t.get("seq_in_page"),
            "reference_number": t.get("reference_number"),
            "date_greg": t.get("date_greg"),
            "date_hijri": t.get("date_hijri"),
            "date_hijri_raw": t.get("date_hijri_raw"),
            "amount": t.get("amount"),
            "direction": t.get("direction"),
            "description": t.get("description"),
            "description_full": t.get("description_full"),
            "category": t.get("category"),
            "category_ar": t.get("category_ar"),
            "balance_after": t.get("balance_after"),
            "raw_text_block": t.get("raw_text_block"),
        }
        s["transactions"].append(tx_info)

    print(f"Matched names: {matched_count}")
    print(f"Unique (name, direction) pairs: {len(name_stats)}")

    # Build final list
    name_list = []
    for (norm, direction), s in name_stats.items():
        if len(s["name"]) < 3:
            continue
        if len(s["name"].strip()) <= 1:
            continue

        # Filter stopwords
        words = s["name"].split()
        if s["language"] == 'ar':
            from extract_names import is_stopword_arabic
            if all(is_stopword_arabic(w) for w in words):
                continue
        else:
            from extract_names import is_stopword_english
            if all(is_stopword_english(w) for w in words):
                continue

        import re
        if re.match(r'^[\d\s\-/.,]+$', s["name"]):
            continue

        # Sort transactions chronologically
        s["transactions"].sort(key=lambda x: (x.get("date_greg") or "", x.get("page") or 0))

        # Sample transactions for the listing (keep 5 most recent)
        sample = s["transactions"][-5:] if len(s["transactions"]) > 5 else s["transactions"][:5]
        sample.reverse()  # most recent first

        # Build unique page list
        pages = sorted(set(t["page"] for t in s["transactions"] if t.get("page")))

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
            "pages": pages,
            "page_count": len(pages),
            "sample_transactions": sample,
            "transactions": s["transactions"],  # ALL transactions
        })

    name_list.sort(key=lambda x: -x["total_amount"])

    # Build incoming/outgoing splits
    incoming_names = [n for n in name_list if n["direction"] == "in"]
    outgoing_names = [n for n in name_list if n["direction"] == "out"]

    # Build "both directions" entries
    incoming_set = {n["name_normalized"] for n in incoming_names}
    outgoing_set = {n["name_normalized"] for n in outgoing_names}
    both_directions = incoming_set & outgoing_set

    both_list = []
    for norm in both_directions:
        in_entry = next((n for n in incoming_names if n["name_normalized"] == norm), None)
        out_entry = next((n for n in outgoing_names if n["name_normalized"] == norm), None)
        if in_entry and out_entry:
            # Merge all transactions from both
            all_txs = (in_entry.get("transactions", []) or []) + (out_entry.get("transactions", []) or [])
            all_txs.sort(key=lambda x: (x.get("date_greg") or "", x.get("page") or 0))
            all_pages = sorted(set(t["page"] for t in all_txs if t.get("page")))
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
                "pages": all_pages,
                "page_count": len(all_pages),
                "transactions": all_txs,
            })
    both_list.sort(key=lambda x: -x["total_amount"])

    print(f"\nIncoming names: {len(incoming_names)}")
    print(f"Outgoing names: {len(outgoing_names)}")
    print(f"Both directions: {len(both_list)}")

    # Top transactions count
    print(f"\nTop 5 incoming by transaction count:")
    for n in sorted(incoming_names, key=lambda x: -x["count"])[:5]:
        print(f'  {n["count"]:>4d} txs · pages={n["page_count"]} · {n["name"][:40]}')

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
