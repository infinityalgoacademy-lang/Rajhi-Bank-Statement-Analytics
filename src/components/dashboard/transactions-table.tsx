"use client";

import * as React from "react";
import {
  Search, Filter, Download, ArrowUpDown, ArrowUp, ArrowDown,
  ArrowDownToLine, ArrowUpFromLine, Inbox, X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Transaction, formatSAR, formatDateAr, categoryColor, categoryIconName } from "@/lib/analytics";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionsTableProps {
  transactions: Transaction[];
}

type SortField = "date_greg" | "amount" | "balance_after" | "description";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [search, setSearch] = React.useState("");
  const [directionFilter, setDirectionFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [sizeFilter, setSizeFilter] = React.useState<string>("all");
  const [yearFilter, setYearFilter] = React.useState<string>("all");
  const [minAmount, setMinAmount] = React.useState<string>("");
  const [maxAmount, setMaxAmount] = React.useState<string>("");
  const [sortField, setSortField] = React.useState<SortField>("date_greg");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [page, setPage] = React.useState(1);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Extract available categories and years
  const categories = React.useMemo(() => {
    const set = new Map<string, string>();
    transactions.forEach((t) => set.set(t.category, t.category_ar));
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1], "ar"));
  }, [transactions]);

  const years = React.useMemo(() => {
    const set = new Set<number>();
    transactions.forEach((t) => { if (t.year) set.add(t.year); });
    return Array.from(set).sort((a, b) => a - b);
  }, [transactions]);

  // Apply filters
  const filtered = React.useMemo(() => {
    let result = transactions;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) =>
        t.description.toLowerCase().includes(q) ||
        (t.description_full || "").toLowerCase().includes(q) ||
        (t.date_greg || "").includes(q)
      );
    }
    if (directionFilter !== "all") {
      result = result.filter((t) => t.direction === directionFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((t) => t.category === categoryFilter);
    }
    if (sizeFilter !== "all") {
      result = result.filter((t) => t.size === sizeFilter);
    }
    if (yearFilter !== "all") {
      const y = Number(yearFilter);
      result = result.filter((t) => t.year === y);
    }
    if (minAmount.trim()) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) result = result.filter((t) => (t.amount || 0) >= min);
    }
    if (maxAmount.trim()) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) result = result.filter((t) => (t.amount || 0) <= max);
    }
    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date_greg") {
        cmp = (a.date_greg || "").localeCompare(b.date_greg || "");
      } else if (sortField === "amount") {
        cmp = (a.amount || 0) - (b.amount || 0);
      } else if (sortField === "balance_after") {
        cmp = (a.balance_after || 0) - (b.balance_after || 0);
      } else if (sortField === "description") {
        cmp = (a.description || "").localeCompare(b.description || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [transactions, search, directionFilter, categoryFilter, sizeFilter, yearFilter, minAmount, maxAmount, sortField, sortDir]);

  // Reset page when filters change
  React.useEffect(() => { setPage(1); }, [search, directionFilter, categoryFilter, sizeFilter, yearFilter, minAmount, maxAmount, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);

  // Summary
  const filteredSumIn = filtered.filter(t => t.direction === "in").reduce((s, t) => s + (t.amount || 0), 0);
  const filteredSumOut = filtered.filter(t => t.direction === "out").reduce((s, t) => s + (t.amount || 0), 0);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function resetFilters() {
    setSearch("");
    setDirectionFilter("all");
    setCategoryFilter("all");
    setSizeFilter("all");
    setYearFilter("all");
    setMinAmount("");
    setMaxAmount("");
  }

  function exportCSV() {
    const headers = ["التاريخ", "النوع", "الفئة", "الوصف", "مدين (صادر)", "دائن (وارد)", "الرصيد"];
    const rows = filtered.map((t) => [
      t.date_greg || "",
      t.direction === "in" ? "وارد" : t.direction === "out" ? "صادر" : "غير محدد",
      t.category_ar,
      t.description.replace(/["\n]/g, " "),
      t.debit || "",
      t.credit || "",
      t.balance_after ?? "",
    ]);
    const csv = [
      headers.join(","),
      ...rows.map(r => r.map(c => typeof c === "string" && c.includes(",") ? `"${c}"` : c).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-3">
          {/* Top row: Search + actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في الوصف أو التاريخ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 font-cairo"
              />
            </div>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[140px] font-cairo">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                <SelectItem value="in">وارد</SelectItem>
                <SelectItem value="out">صادر</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] font-cairo">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">كل الفئات</SelectItem>
                {categories.map(([key, ar]) => (
                  <SelectItem key={key} value={key}>{ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-label="فلاتر متقدمة"
              className={cn(showAdvanced && "bg-primary/10")}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetFilters} className="font-cairo">
              <X className="h-4 w-4 ml-1" />
              مسح
            </Button>
            <Button variant="default" size="sm" onClick={exportCSV} className="font-cairo bg-primary">
              <Download className="h-4 w-4 ml-1" />
              تصدير CSV
            </Button>
          </div>

          {/* Advanced filters */}
          {showAdvanced && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-border/60">
              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="font-cairo">
                  <SelectValue placeholder="الحجم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأحجام</SelectItem>
                  <SelectItem value="large">كبيرة (10,000+)</SelectItem>
                  <SelectItem value="medium">متوسطة (1,000-9,999)</SelectItem>
                  <SelectItem value="small">صغيرة (أقل من 1,000)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="font-cairo">
                  <SelectValue placeholder="السنة" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">كل السنوات</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="الحد الأدنى (ر.س)"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                type="number"
                className="font-cairo ltr-numbers"
              />
              <Input
                placeholder="الحد الأعلى (ر.س)"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                type="number"
                className="font-cairo ltr-numbers"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Summary of filtered results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-[11px] text-muted-foreground font-cairo">عدد المعاملات</p>
          <p className="text-lg font-cairo font-bold text-foreground ltr-numbers">
            {filtered.length.toLocaleString("en-US")}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] text-muted-foreground font-cairo">إجمالي الوارد</p>
          <p className="text-lg font-cairo font-bold text-success ltr-numbers">
            {formatSAR(filteredSumIn, { compact: true })}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] text-muted-foreground font-cairo">إجمالي الصادر</p>
          <p className="text-lg font-cairo font-bold text-destructive ltr-numbers">
            {formatSAR(filteredSumOut, { compact: true })}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] text-muted-foreground font-cairo">صافي التدفق</p>
          <p className={`text-lg font-cairo font-bold ltr-numbers ${filteredSumIn - filteredSumOut >= 0 ? "text-success" : "text-destructive"}`}>
            {formatSAR(filteredSumIn - filteredSumOut, { compact: true, sign: true })}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground">
                  <button onClick={() => toggleSort("date_greg")} className="flex items-center gap-1 hover:text-foreground">
                    التاريخ
                    <SortIcon field="date_greg" current={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground">النوع</th>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground">الفئة</th>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground">
                  <button onClick={() => toggleSort("description")} className="flex items-center gap-1 hover:text-foreground">
                    الوصف
                    <SortIcon field="description" current={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">
                  <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 hover:text-foreground mr-auto">
                    المبلغ
                    <SortIcon field="amount" current={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">
                  <button onClick={() => toggleSort("balance_after")} className="flex items-center gap-1 hover:text-foreground mr-auto">
                    الرصيد
                    <SortIcon field="balance_after" current={sortField} dir={sortDir} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">
                    <Inbox className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="font-cairo">لا توجد نتائج مطابقة</p>
                  </td>
                </tr>
              ) : (
                pageData.map((t, i) => {
                  const Icon = (LucideIcons as any)[categoryIconName(t.category)] || LucideIcons.CircleDashed;
                  const color = categoryColor(t.category);
                  return (
                    <tr key={start + i} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground ltr-numbers font-numeric">
                        {formatDateAr(t.date_greg)}
                      </td>
                      <td className="px-3 py-2.5">
                        {t.direction === "in" ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1 font-cairo text-xs">
                            <ArrowDownToLine className="h-3 w-3" /> وارد
                          </Badge>
                        ) : t.direction === "out" ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 font-cairo text-xs">
                            <ArrowUpFromLine className="h-3 w-3" /> صادر
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-cairo text-xs">غير محدد</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}>
                            <Icon className="h-3.5 w-3.5" style={{ color }} />
                          </div>
                          <span className="font-cairo text-xs">{t.category_ar}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[280px]">
                        <p className="font-cairo text-sm text-foreground truncate">{t.description}</p>
                        {t.description_full && t.description_full !== t.description && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{t.description_full}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-left whitespace-nowrap ltr-numbers">
                        <span className={cn(
                          "font-cairo font-bold text-sm",
                          t.direction === "in" ? "text-success" : t.direction === "out" ? "text-destructive" : "text-foreground"
                        )}>
                          {t.direction === "out" ? "-" : ""}
                          {formatSAR(t.amount)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-left whitespace-nowrap ltr-numbers">
                        <span className="font-cairo text-sm text-muted-foreground">
                          {formatSAR(t.balance_after)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground font-cairo">
              عرض {start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)} من {filtered.length.toLocaleString("en-US")}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="font-cairo"
              >
                الأولى
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                السابق
              </Button>
              <span className="px-3 text-xs font-cairo ltr-numbers">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                التالي
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="font-cairo"
              >
                الأخيرة
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (current !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}
