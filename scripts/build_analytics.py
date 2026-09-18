#!/usr/bin/env python3
"""
Build pre-aggregated analytics from transactions.json for fast dashboard loading.
Outputs:
  - /home/z/my-project/public/analytics.json  (overview KPIs + charts)
"""
import json
import os
from collections import Counter, defaultdict
from datetime import datetime

IN_PATH = "/home/z/my-project/scripts/transactions.json"
OUT_PATH = "/home/z/my-project/public/analytics.json"

AR_MONTHS = {
    1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
    5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
    9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر",
}

EN_MONTHS = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
    5: "May", 6: "Jun", 7: "Jul", 8: "Aug",
    9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
}


def main():
    with open(IN_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    transactions = data["transactions"]
    account = data["account_info"]
    stats = data["stats"]

    # ===== KPIs =====
    out_txs = [t for t in transactions if t["direction"] == "out"]
    in_txs = [t for t in transactions if t["direction"] == "in"]

    total_out_count = len(out_txs)
    total_in_count = len(in_txs)
    total_out_amount = sum(t["amount"] for t in out_txs if t["amount"])
    total_in_amount = sum(t["amount"] for t in in_txs if t["amount"])
    net_flow = total_in_amount - total_out_amount

    avg_out = total_out_amount / total_out_count if total_out_count else 0
    avg_in = total_in_amount / total_in_count if total_in_count else 0

    # Largest transactions
    largest_out = sorted(out_txs, key=lambda x: -(x["amount"] or 0))[:20]
    largest_in = sorted(in_txs, key=lambda x: -(x["amount"] or 0))[:20]

    # Smallest
    smallest_out = sorted([t for t in out_txs if t["amount"] and t["amount"] > 0],
                          key=lambda x: x["amount"])[:20]
    smallest_in = sorted([t for t in in_txs if t["amount"] and t["amount"] > 0],
                         key=lambda x: x["amount"])[:20]

    # ===== Yearly aggregation =====
    yearly = defaultdict(lambda: {"in_count": 0, "out_count": 0,
                                   "in_amount": 0.0, "out_amount": 0.0})
    for t in transactions:
        if not t["year"]:
            continue
        y = t["year"]
        if t["direction"] == "in":
            yearly[y]["in_count"] += 1
            yearly[y]["in_amount"] += t["amount"] or 0
        elif t["direction"] == "out":
            yearly[y]["out_count"] += 1
            yearly[y]["out_amount"] += t["amount"] or 0

    yearly_list = []
    for y in sorted(yearly.keys()):
        d = yearly[y]
        net = d["in_amount"] - d["out_amount"]
        yearly_list.append({
            "year": y,
            "in_count": d["in_count"],
            "out_count": d["out_count"],
            "in_amount": round(d["in_amount"], 2),
            "out_amount": round(d["out_amount"], 2),
            "net": round(net, 2),
            "total_count": d["in_count"] + d["out_count"],
        })

    # ===== Monthly aggregation (year-month) =====
    monthly = defaultdict(lambda: {"in_count": 0, "out_count": 0,
                                    "in_amount": 0.0, "out_amount": 0.0})
    for t in transactions:
        if not t.get("year_month"):
            continue
        ym = t["year_month"]
        if t["direction"] == "in":
            monthly[ym]["in_count"] += 1
            monthly[ym]["in_amount"] += t["amount"] or 0
        elif t["direction"] == "out":
            monthly[ym]["out_count"] += 1
            monthly[ym]["out_amount"] += t["amount"] or 0

    monthly_list = []
    for ym in sorted(monthly.keys()):
        d = monthly[ym]
        net = d["in_amount"] - d["out_amount"]
        year, month = ym.split("-")
        monthly_list.append({
            "year_month": ym,
            "year": int(year),
            "month": int(month),
            "month_name_ar": AR_MONTHS.get(int(month), ""),
            "month_name_en": EN_MONTHS.get(int(month), ""),
            "in_count": d["in_count"],
            "out_count": d["out_count"],
            "in_amount": round(d["in_amount"], 2),
            "out_amount": round(d["out_amount"], 2),
            "net": round(net, 2),
            "total_count": d["in_count"] + d["out_count"],
        })

    # ===== Category aggregation =====
    cat_agg = defaultdict(lambda: {"in_count": 0, "out_count": 0,
                                    "in_amount": 0.0, "out_amount": 0.0})
    for t in transactions:
        c = t["category"]
        if t["direction"] == "in":
            cat_agg[c]["in_count"] += 1
            cat_agg[c]["in_amount"] += t["amount"] or 0
        elif t["direction"] == "out":
            cat_agg[c]["out_count"] += 1
            cat_agg[c]["out_amount"] += t["amount"] or 0

    # Map category to Arabic name
    cat_name_ar = {}
    for t in transactions:
        if t["category"] not in cat_name_ar:
            cat_name_ar[t["category"]] = t["category_ar"]

    cat_list = []
    for c, d in cat_agg.items():
        total_amount = d["in_amount"] + d["out_amount"]
        total_count = d["in_count"] + d["out_count"]
        cat_list.append({
            "category": c,
            "category_ar": cat_name_ar.get(c, c),
            "in_count": d["in_count"],
            "out_count": d["out_count"],
            "in_amount": round(d["in_amount"], 2),
            "out_amount": round(d["out_amount"], 2),
            "total_amount": round(total_amount, 2),
            "total_count": total_count,
            "avg_amount": round(total_amount / total_count, 2) if total_count else 0,
        })
    cat_list.sort(key=lambda x: -x["total_amount"])

    # ===== Transaction size distribution =====
    size_agg = defaultdict(lambda: {"in_count": 0, "out_count": 0,
                                     "in_amount": 0.0, "out_amount": 0.0})
    for t in transactions:
        s = t.get("size", "unknown")
        if t["direction"] == "in":
            size_agg[s]["in_count"] += 1
            size_agg[s]["in_amount"] += t["amount"] or 0
        elif t["direction"] == "out":
            size_agg[s]["out_count"] += 1
            size_agg[s]["out_amount"] += t["amount"] or 0

    size_ar = {"large": "كبيرة (10,000+)", "medium": "متوسطة (1,000-9,999)", "small": "صغيرة (أقل من 1,000)", "unknown": "غير محدد"}
    size_list = []
    for s in ["large", "medium", "small", "unknown"]:
        d = size_agg.get(s, {"in_count": 0, "out_count": 0, "in_amount": 0, "out_amount": 0})
        size_list.append({
            "size": s,
            "size_ar": size_ar.get(s, s),
            "in_count": d["in_count"],
            "out_count": d["out_count"],
            "in_amount": round(d["in_amount"], 2),
            "out_amount": round(d["out_amount"], 2),
            "total_count": d["in_count"] + d["out_count"],
            "total_amount": round(d["in_amount"] + d["out_amount"], 2),
        })

    # ===== Day of week aggregation =====
    dow_agg = defaultdict(lambda: {"in_count": 0, "out_count": 0,
                                    "in_amount": 0.0, "out_amount": 0.0})
    dow_ar = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
    dow_en = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for t in transactions:
        if not t["date_greg"]:
            continue
        try:
            dt = datetime.strptime(t["date_greg"], "%Y-%m-%d")
            dow = dt.weekday()  # 0=Monday
            if t["direction"] == "in":
                dow_agg[dow]["in_count"] += 1
                dow_agg[dow]["in_amount"] += t["amount"] or 0
            elif t["direction"] == "out":
                dow_agg[dow]["out_count"] += 1
                dow_agg[dow]["out_amount"] += t["amount"] or 0
        except Exception:
            continue

    dow_list = []
    for i in range(7):
        d = dow_agg.get(i, {"in_count": 0, "out_count": 0, "in_amount": 0, "out_amount": 0})
        dow_list.append({
            "dow": i,
            "dow_ar": dow_ar[i],
            "dow_en": dow_en[i],
            "in_count": d["in_count"],
            "out_count": d["out_count"],
            "in_amount": round(d["in_amount"], 2),
            "out_amount": round(d["out_amount"], 2),
            "total_count": d["in_count"] + d["out_count"],
        })

    # ===== Top recurring descriptions (frequent transactions) =====
    desc_counter_in = Counter()
    desc_counter_out = Counter()
    desc_amount_in = defaultdict(float)
    desc_amount_out = defaultdict(float)
    for t in transactions:
        # Use the first 3 words of description as the "type"
        desc_key = " ".join(t["description"].split()[:3])
        if t["direction"] == "in":
            desc_counter_in[desc_key] += 1
            desc_amount_in[desc_key] += t["amount"] or 0
        elif t["direction"] == "out":
            desc_counter_out[desc_key] += 1
            desc_amount_out[desc_key] += t["amount"] or 0

    top_recurring_in = [{"description": d, "count": c, "total_amount": round(desc_amount_in[d], 2)}
                        for d, c in desc_counter_in.most_common(15)]
    top_recurring_out = [{"description": d, "count": c, "total_amount": round(desc_amount_out[d], 2)}
                         for d, c in desc_counter_out.most_common(15)]

    # ===== Hour-of-day pattern (not available, but month-of-year pattern) =====
    month_year_pattern = defaultdict(lambda: {"in_count": 0, "out_count": 0,
                                                "in_amount": 0.0, "out_amount": 0.0})
    for t in transactions:
        if not t.get("month"):
            continue
        m = t["month"]
        if t["direction"] == "in":
            month_year_pattern[m]["in_count"] += 1
            month_year_pattern[m]["in_amount"] += t["amount"] or 0
        elif t["direction"] == "out":
            month_year_pattern[m]["out_count"] += 1
            month_year_pattern[m]["out_amount"] += t["amount"] or 0

    month_pattern_list = []
    for m in range(1, 13):
        d = month_year_pattern.get(m, {"in_count": 0, "out_count": 0, "in_amount": 0, "out_amount": 0})
        month_pattern_list.append({
            "month": m,
            "month_name_ar": AR_MONTHS[m],
            "in_count": d["in_count"],
            "out_count": d["out_count"],
            "in_amount": round(d["in_amount"], 2),
            "out_amount": round(d["out_amount"], 2),
            "total_count": d["in_count"] + d["out_count"],
        })

    # ===== Balance history (sample every Nth transaction to keep size small) =====
    balance_history = []
    sample_step = max(1, len(transactions) // 500)  # ~500 points max
    for i, t in enumerate(transactions):
        if i % sample_step == 0 and t.get("balance_after") is not None and t.get("date_greg"):
            balance_history.append({
                "date": t["date_greg"],
                "balance": t["balance_after"],
                "page": t["page"],
            })
    # Always include the last point
    if transactions and transactions[-1].get("balance_after") is not None:
        balance_history.append({
            "date": transactions[-1]["date_greg"],
            "balance": transactions[-1]["balance_after"],
            "page": transactions[-1]["page"],
        })

    # ===== Final balance =====
    final_balance = None
    if transactions:
        for t in reversed(transactions):
            if t.get("balance_after") is not None:
                final_balance = t["balance_after"]
                final_balance_date = t["date_greg"]
                break

    # ===== Min/max balance =====
    balances = [t["balance_after"] for t in transactions if t.get("balance_after") is not None]
    max_balance = max(balances) if balances else 0
    min_balance = min(balances) if balances else 0
    avg_balance = sum(balances) / len(balances) if balances else 0

    # ===== Active years & months count =====
    active_years = sorted(set(t["year"] for t in transactions if t.get("year")))
    active_months_count = len(set(t["year_month"] for t in transactions if t.get("year_month")))

    # ===== Year-over-year growth =====
    yoy = []
    for i in range(1, len(yearly_list)):
        prev = yearly_list[i - 1]
        curr = yearly_list[i]
        prev_total = prev["in_amount"] + prev["out_amount"]
        curr_total = curr["in_amount"] + curr["out_amount"]
        growth = ((curr_total - prev_total) / prev_total * 100) if prev_total > 0 else 0
        yoy.append({
            "year": curr["year"],
            "prev_year": prev["year"],
            "total_amount": round(curr_total, 2),
            "prev_total_amount": round(prev_total, 2),
            "growth_pct": round(growth, 2),
        })

    # ===== Largest single day (by total absolute amount) =====
    daily = defaultdict(lambda: {"in_amount": 0.0, "out_amount": 0.0, "count": 0})
    for t in transactions:
        if not t["date_greg"]:
            continue
        daily[t["date_greg"]]["count"] += 1
        if t["direction"] == "in":
            daily[t["date_greg"]]["in_amount"] += t["amount"] or 0
        elif t["direction"] == "out":
            daily[t["date_greg"]]["out_amount"] += t["amount"] or 0

    busiest_days = sorted(daily.items(), key=lambda x: -x[1]["count"])[:10]
    busiest_days_list = [{
        "date": d,
        "count": v["count"],
        "in_amount": round(v["in_amount"], 2),
        "out_amount": round(v["out_amount"], 2),
    } for d, v in busiest_days]

    largest_volume_days = sorted(daily.items(), key=lambda x: -(x[1]["in_amount"] + x[1]["out_amount"]))[:10]
    largest_volume_days_list = [{
        "date": d,
        "count": v["count"],
        "in_amount": round(v["in_amount"], 2),
        "out_amount": round(v["out_amount"], 2),
        "total_volume": round(v["in_amount"] + v["out_amount"], 2),
    } for d, v in largest_volume_days]

    # ===== Build output =====
    output = {
        "account_info": account,
        "kpis": {
            "total_transactions": len(transactions),
            "total_outgoing_count": total_out_count,
            "total_incoming_count": total_in_count,
            "total_outgoing_amount": round(total_out_amount, 2),
            "total_incoming_amount": round(total_in_amount, 2),
            "net_flow": round(net_flow, 2),
            "avg_outgoing": round(avg_out, 2),
            "avg_incoming": round(avg_in, 2),
            "beginning_balance": account.get("beginning_balance", 0),
            "final_balance": final_balance,
            "max_balance": round(max_balance, 2),
            "min_balance": round(min_balance, 2),
            "avg_balance": round(avg_balance, 2),
            "active_years": len(active_years),
            "active_months": active_months_count,
            "period_from": account.get("period_from"),
            "period_to": account.get("period_to"),
            "active_years_list": active_years,
        },
        "yearly": yearly_list,
        "monthly": monthly_list,
        "categories": cat_list,
        "sizes": size_list,
        "day_of_week": dow_list,
        "month_pattern": month_pattern_list,
        "top_recurring_in": top_recurring_in,
        "top_recurring_out": top_recurring_out,
        "largest_outgoing": [{"date_greg": t["date_greg"], "amount": t["amount"],
                              "description": t["description"], "category": t["category"],
                              "category_ar": t["category_ar"], "balance_after": t["balance_after"]}
                             for t in largest_out],
        "largest_incoming": [{"date_greg": t["date_greg"], "amount": t["amount"],
                              "description": t["description"], "category": t["category"],
                              "category_ar": t["category_ar"], "balance_after": t["balance_after"]}
                             for t in largest_in],
        "smallest_outgoing": [{"date_greg": t["date_greg"], "amount": t["amount"],
                               "description": t["description"], "category": t["category"],
                               "category_ar": t["category_ar"], "balance_after": t["balance_after"]}
                              for t in smallest_out],
        "smallest_incoming": [{"date_greg": t["date_greg"], "amount": t["amount"],
                               "description": t["description"], "category": t["category"],
                               "category_ar": t["category_ar"], "balance_after": t["balance_after"]}
                              for t in smallest_in],
        "balance_history": balance_history,
        "yoy_growth": yoy,
        "busiest_days": busiest_days_list,
        "largest_volume_days": largest_volume_days_list,
    }

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"Wrote {OUT_PATH}")
    print(f"File size: {os.path.getsize(OUT_PATH):,} bytes")
    print(f"KPIs: {output['kpis']}")


if __name__ == "__main__":
    main()
