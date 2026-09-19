"use client";

import * as React from "react";
import {
  Search, Filter, Download, ArrowUpDown, ArrowUp, ArrowDown,
  ArrowDownToLine, ArrowUpFromLine, Inbox, X, FileText, Hash,
  ChevronLeft, Calendar, Building2, Hash as RefIcon, Eye, EyeOff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Transaction, formatSAR, formatDateAr, categoryColor, categoryIconName } from "@/lib/analytics";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionsTableProps {
  transactions: Transaction[];
}

type SortField = "date_greg" | "amount" | "balance_after" | "description" | "page";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [search, setSearch] = React.useState("");
  const [directionFilter, setDirectionFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [sizeFilter, setSizeFilter] = React.useState<string>("all");
  const [yearFilter, setYearFilter] = React.useState<string>("all");
  const [hasRefFilter, setHasRefFilter] = React.useState<string>("all");
  const [minAmount, setMinAmount] = React.useState<string>("");
  const [maxAmount, setMaxAmount] = React.useState<string>("");
  const [sortField, setSortField] = React.useState<SortField>("date_greg");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [page, setPage] = React.useState(1);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);

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
        (t.date_greg || "").includes(q) ||
        (t.reference_number || "").toLowerCase().includes(q) ||
        String(t.page).includes(q)
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
    if (hasRefFilter === "with") {
      result = result.filter((t) => t.reference_number);
    } else if (hasRefFilter === "without") {
      result = result.filter((t) => !t.reference_number);
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
      } else if (sortField === "page") {
        cmp = (a.page || 0) - (b.page || 0);
        if (cmp === 0) cmp = (a.seq_in_page || 0) - (b.seq_in_page || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [transactions, search, directionFilter, categoryFilter, sizeFilter, yearFilter, hasRefFilter, minAmount, maxAmount, sortField, sortDir]);

  // Reset page when filters change
  React.useEffect(() => { setPage(1); }, [search, directionFilter, categoryFilter, sizeFilter, yearFilter, hasRefFilter, minAmount, maxAmount, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);

  // Summary
  const filteredSumIn = filtered.filter(t => t.direction === "in").reduce((s, t) => s + (t.amount || 0), 0);
  const filteredSumOut = filtered.filter(t => t.direction === "out").reduce((s, t) => s + (t.amount || 0), 0);
  const filteredWithRef = filtered.filter(t => t.reference_number).length;

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
    setHasRefFilter("all");
    setMinAmount("");
    setMaxAmount("");
  }

  function exportCSV() {
    const headers = ["التاريخ", "الصفحة", "تسلسل الصفحة", "النوع", "الفئة", "الوصف", "الرقم المرجعي", "مدين (صادر)", "دائن (وارد)", "الرصيد"];
    const rows = filtered.map((t) => [
      t.date_greg || "",
      t.page || "",
      t.seq_in_page || "",
      t.direction === "in" ? "وارد" : t.direction === "out" ? "صادر" : "غير محدد",
      t.category_ar,
      t.description.replace(/["\n]/g, " "),
      t.reference_number || "",
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
                placeholder="ابحث في الوصف أو التاريخ أو الرقم المرجعي أو رقم الصفحة..."
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
              <Select value={hasRefFilter} onValueChange={setHasRefFilter}>
                <SelectTrigger className="font-cairo">
                  <SelectValue placeholder="الرقم المرجعي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المعاملات</SelectItem>
                  <SelectItem value="with">مع رقم مرجعي</SelectItem>
                  <SelectItem value="without">بدون رقم مرجعي</SelectItem>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
        <Card className="p-3">
          <p className="text-[11px] text-muted-foreground font-cairo">مع رقم مرجعي</p>
          <p className="text-lg font-cairo font-bold text-primary ltr-numbers">
            {filteredWithRef.toLocaleString("en-US")}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground whitespace-nowrap">
                  <button onClick={() => toggleSort("date_greg")} className="flex items-center gap-1 hover:text-foreground">
                    <Calendar className="h-3.5 w-3.5 ml-0.5" />
                    التاريخ
                    <SortIcon field="date_greg" current={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground whitespace-nowrap">النوع</th>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground whitespace-nowrap">الفئة</th>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground">
                  <button onClick={() => toggleSort("description")} className="flex items-center gap-1 hover:text-foreground">
                    الوصف
                    <SortIcon field="description" current={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    <RefIcon className="h-3.5 w-3.5 ml-0.5" />
                    الرقم المرجعي
                  </span>
                </th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground whitespace-nowrap">
                  <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 hover:text-foreground mr-auto">
                    المبلغ
                    <SortIcon field="amount" current={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground whitespace-nowrap">
                  <button onClick={() => toggleSort("balance_after")} className="flex items-center gap-1 hover:text-foreground mr-auto">
                    الرصيد
                    <SortIcon field="balance_after" current={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground whitespace-nowrap">
                  <button onClick={() => toggleSort("page")} className="flex items-center gap-1 hover:text-foreground mx-auto">
                    <FileText className="h-3.5 w-3.5 ml-0.5" />
                    الصفحة
                    <SortIcon field="page" current={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-muted-foreground">
                    <Inbox className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="font-cairo">لا توجد نتائج مطابقة</p>
                  </td>
                </tr>
              ) : (
                pageData.map((t, i) => {
                  const Icon = (LucideIcons as any)[categoryIconName(t.category)] || LucideIcons.CircleDashed;
                  const color = categoryColor(t.category);
                  return (
                    <tr
                      key={start + i}
                      className="border-b border-border/40 hover:bg-primary/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedTx(t)}
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground ltr-numbers font-numeric">
                        <div className="flex flex-col">
                          <span>{formatDateAr(t.date_greg)}</span>
                          {t.date_hijri && (
                            <span className="text-[10px] opacity-70" dir="rtl">هجري: {t.date_hijri}</span>
                          )}
                        </div>
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
                      <td className="px-3 py-2.5 max-w-[180px]">
                        {t.reference_number ? (
                          <Badge variant="outline" className="font-cairo text-[10px] bg-primary/5 border-primary/30 text-primary ltr-numbers gap-1 whitespace-nowrap">
                            <Hash className="h-2.5 w-2.5" />
                            {t.reference_number}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/50 font-cairo">—</span>
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
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <Badge variant="secondary" className="font-cairo text-[10px] ltr-numbers gap-0.5">
                            <FileText className="h-2.5 w-2.5" />
                            ص. {t.page}
                          </Badge>
                          {t.seq_in_page && (
                            <span className="text-[9px] text-muted-foreground mt-0.5 ltr-numbers">
                              #{t.seq_in_page}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
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

      {/* Transaction Detail Dialog */}
      <TransactionDetailDialog
        transaction={selectedTx}
        open={!!selectedTx}
        onOpenChange={(v) => !v && setSelectedTx(null)}
      />
    </div>
  );
}

/**
 * Detail Dialog showing full transaction info as it appears in the PDF statement.
 */
function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [showRawText, setShowRawText] = React.useState(true);

  if (!transaction) return null;

  const Icon = (LucideIcons as any)[categoryIconName(transaction.category)] || LucideIcons.CircleDashed;
  const color = categoryColor(transaction.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="font-cairo text-lg flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}>
              <Icon className="h-4.5 w-4.5" style={{ color }} />
            </div>
            تفاصيل المعاملة
          </DialogTitle>
          <DialogDescription className="font-cairo">
            المعلومات الأصلية للمعاملة كما تظهر في كشف حساب بنك الراجحي
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Key info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DetailInfoCard
              icon={Calendar}
              label="التاريخ الميلادي"
              value={formatDateAr(transaction.date_greg)}
              color="oklch(0.55 0.16 160)"
            />
            <DetailInfoCard
              icon={Calendar}
              label="التاريخ الهجري"
              value={transaction.date_hijri || "—"}
              color="oklch(0.55 0.16 160)"
            />
            <DetailInfoCard
              icon={FileText}
              label="رقم الصفحة"
              value={`صفحة ${transaction.page}${transaction.seq_in_page ? ` · معاملة #${transaction.seq_in_page}` : ""}`}
              color="oklch(0.65 0.14 75)"
            />
            <DetailInfoCard
              icon={RefIcon}
              label="الرقم المرجعي"
              value={transaction.reference_number || "غير متوفر"}
              color="oklch(0.55 0.13 280)"
            />
          </div>

          {/* Amount & Direction */}
          <Card className="p-4 bg-secondary/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] text-muted-foreground font-cairo mb-1">الاتجاه</p>
                {transaction.direction === "in" ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1 font-cairo">
                    <ArrowDownToLine className="h-3.5 w-3.5" /> وارد (دائن)
                  </Badge>
                ) : transaction.direction === "out" ? (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 font-cairo">
                    <ArrowUpFromLine className="h-3.5 w-3.5" /> صادر (مدين)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-cairo">غير محدد</Badge>
                )}
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-cairo mb-1">المبلغ</p>
                <p className={cn(
                  "font-cairo font-bold text-base ltr-numbers",
                  transaction.direction === "in" ? "text-success" : transaction.direction === "out" ? "text-destructive" : "text-foreground"
                )}>
                  {transaction.direction === "out" ? "-" : ""}{formatSAR(transaction.amount)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-cairo mb-1">الرصيد بعد المعاملة</p>
                <p className="font-cairo font-bold text-base text-foreground ltr-numbers">
                  {formatSAR(transaction.balance_after)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-cairo mb-1">الفئة</p>
                <div className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <span className="font-cairo text-sm">{transaction.category_ar}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Description */}
          <div>
            <h4 className="font-cairo text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              وصف المعاملة
            </h4>
            <Card className="p-3 bg-card">
              <p className="font-cairo text-sm text-foreground leading-relaxed">{transaction.description}</p>
              {transaction.description_full && transaction.description_full !== transaction.description && (
                <p className="font-cairo text-xs text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border/60">
                  {transaction.description_full}
                </p>
              )}
            </Card>
          </div>

          {/* Raw PDF Text Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-cairo text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-gold" />
                النص الأصلي من كشف الحساب PDF
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawText(!showRawText)}
                className="font-cairo text-xs h-7"
              >
                {showRawText ? (
                  <><EyeOff className="h-3.5 w-3.5 ml-1" /> إخفاء</>
                ) : (
                  <><Eye className="h-3.5 w-3.5 ml-1" /> إظهار</>
                )}
              </Button>
            </div>
            {showRawText && (
              <Card className="p-0 overflow-hidden border-gold/30">
                <div className="bg-gold/10 px-3 py-1.5 border-b border-gold/20">
                  <p className="text-[11px] text-gold-foreground font-cairo flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" />
                    كشف حساب بنك الراجحي — صفحة {transaction.page} — معاملة #{transaction.seq_in_page || "—"}
                  </p>
                </div>
                <pre
                  dir="rtl"
                  className="p-4 text-xs font-mono text-foreground leading-relaxed overflow-x-auto custom-scrollbar bg-card text-right"
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    unicodeBidi: "plaintext",
                  }}
                >
{transaction.raw_text_block || "لا يوجد نص أصلي متوفر"}
                </pre>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailInfoCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <p className="text-[11px] text-muted-foreground font-cairo">{label}</p>
      </div>
      <p className="text-sm font-cairo font-bold text-foreground ltr-numbers" dir="auto">
        {value}
      </p>
    </Card>
  );
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (current !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}
