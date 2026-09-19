"use client";

import * as React from "react";
import {
  Users, UserCheck, UserX, ArrowLeftRight, Search, Filter, X,
  ArrowDownToLine, ArrowUpFromLine, Crown, Hash, TrendingUp,
  TrendingDown, Calendar, Globe, Type, Award, Scale, Repeat,
  Wallet, ChevronLeft, Languages, FileText, Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import { NamesData, NameEntry, BothDirectionEntry, formatSAR, formatDateAr } from "@/lib/analytics";
import { TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, TOOLTIP_CURSOR_STYLE } from "@/lib/chart-tooltip";
import { KpiCard, SectionHeader } from "./kpi-card";
import { cn } from "@/lib/utils";

interface NamesAnalyzerProps {
  data: NamesData;
}

type SortField = "total_amount" | "count" | "avg_amount" | "name";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 15;

export function NamesAnalyzer({ data }: NamesAnalyzerProps) {
  const { summary, incoming_names, outgoing_names, both_directions, all_names } = data;

  const [view, setView] = React.useState<"incoming" | "outgoing" | "both" | "all">("incoming");
  const [search, setSearch] = React.useState("");
  const [langFilter, setLangFilter] = React.useState<string>("all");
  const [sortField, setSortField] = React.useState<SortField>("total_amount");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [page, setPage] = React.useState(1);
  const [selectedName, setSelectedName] = React.useState<string | null>(null);

  // Get current view's data
  const currentData = React.useMemo(() => {
    if (view === "incoming") return incoming_names;
    if (view === "outgoing") return outgoing_names;
    if (view === "both") return both_directions as any; // different shape
    return all_names;
  }, [view, incoming_names, outgoing_names, both_directions, all_names]);

  // Apply filters
  const filtered = React.useMemo(() => {
    let result = currentData as any[];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((n) => n.name.toLowerCase().includes(q));
    }
    if (langFilter !== "all" && view !== "both") {
      result = result.filter((n) => n.language === langFilter);
    }
    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = (a.name || "").localeCompare(b.name || "", "ar");
      } else if (sortField === "total_amount") {
        cmp = (a.total_amount || 0) - (b.total_amount || 0);
      } else if (sortField === "count") {
        cmp = (a.count || 0) - (b.count || 0);
      } else if (sortField === "avg_amount") {
        cmp = (a.avg_amount || 0) - (b.avg_amount || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [currentData, search, langFilter, sortField, sortDir, view]);

  React.useEffect(() => { setPage(1); }, [view, search, langFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);

  // Top 10 charts data
  const topIncomingChart = incoming_names.slice(0, 10).map(n => ({
    name: n.name.length > 18 ? n.name.substring(0, 18) + "…" : n.name,
    fullName: n.name,
    amount: n.total_amount,
    count: n.count,
  }));
  const topOutgoingChart = outgoing_names.slice(0, 10).map(n => ({
    name: n.name.length > 18 ? n.name.substring(0, 18) + "…" : n.name,
    fullName: n.name,
    amount: n.total_amount,
    count: n.count,
  }));

  // Language distribution
  const arCount = all_names.filter(n => n.language === 'ar').length;
  const enCount = all_names.filter(n => n.language === 'en').length;
  const langPie = [
    { name: "أسماء عربية", value: arCount, color: "oklch(0.55 0.16 160)" },
    { name: "أسماء إنجليزية", value: enCount, color: "oklch(0.65 0.14 75)" },
  ].filter(p => p.value > 0);

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
    setLangFilter("all");
    setSortField("total_amount");
    setSortDir("desc");
  }

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="إجمالي الأسماء المكتشفة"
          value={<span className="ltr-numbers">{summary.total_unique_names.toLocaleString("en-US")}</span>}
          sublabel="أسماء فريدة في الوارد والصادر"
          icon={Users}
          variant="primary"
        />
        <KpiCard
          label="أسماء الوارد"
          value={<span className="ltr-numbers">{summary.incoming_names_count.toLocaleString("en-US")}</span>}
          sublabel="مُرسلون إلى الحساب"
          icon={ArrowDownToLine}
          variant="success"
        />
        <KpiCard
          label="أسماء الصادر"
          value={<span className="ltr-numbers">{summary.outgoing_names_count.toLocaleString("en-US")}</span>}
          sublabel="مستفيدون من الحساب"
          icon={ArrowUpFromLine}
          variant="danger"
        />
        <KpiCard
          label="أسماء في الاتجاهين"
          value={<span className="ltr-numbers">{summary.both_directions_count.toLocaleString("en-US")}</span>}
          sublabel="ورد وصدر مع نفس الشخص"
          icon={ArrowLeftRight}
          variant="gold"
        />
      </div>

      {/* Coverage info */}
      <Card className="p-4 bg-secondary/30 border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-success" />
            <span className="font-cairo text-muted-foreground">
              تم مطابقة <span className="font-bold text-foreground ltr-numbers">{summary.matched_transactions.toLocaleString("en-US")}</span> معاملة بأسماء
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <UserX className="h-4 w-4 text-muted-foreground" />
            <span className="font-cairo text-muted-foreground">
              <span className="font-bold text-foreground ltr-numbers">{summary.no_name_transactions.toLocaleString("en-US")}</span> معاملة بدون اسم قابل للاستخراج
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Languages className="h-4 w-4 text-primary" />
            <span className="font-cairo text-muted-foreground">
              <span className="font-bold text-foreground ltr-numbers">{arCount}</span> عربي ·
              <span className="font-bold text-foreground ltr-numbers"> {enCount}</span> إنجليزي
            </span>
          </div>
        </div>
      </Card>

      {/* Top 10 charts side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أعلى 10 أسماء واردة"
            subtitle="حسب إجمالي المبلغ المُرسل إلى الحساب"
            icon={ArrowDownToLine}
          />
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topIncomingChart} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.02 160)" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "oklch(0.18 0.02 160)", fontFamily: "var(--font-cairo)" }}
                  width={120}
                />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  cursor={TOOLTIP_CURSOR_STYLE}
                  formatter={(v: any, n: string) => n === "amount" ? [formatSAR(v), "المبلغ"] : [v, "عدد المعاملات"]}
                  labelFormatter={(_, p: any) => p && p[0] ? p[0].payload.fullName : ""}
                />
                <Bar dataKey="amount" fill="oklch(0.55 0.16 160)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أعلى 10 أسماء صادرة"
            subtitle="حسب إجمالي المبلغ المُستلم من الحساب"
            icon={ArrowUpFromLine}
          />
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topOutgoingChart} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.02 160)" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "oklch(0.18 0.02 160)", fontFamily: "var(--font-cairo)" }}
                  width={120}
                />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  cursor={TOOLTIP_CURSOR_STYLE}
                  formatter={(v: any, n: string) => n === "amount" ? [formatSAR(v), "المبلغ"] : [v, "عدد المعاملات"]}
                  labelFormatter={(_, p: any) => p && p[0] ? p[0].payload.fullName : ""}
                />
                <Bar dataKey="amount" fill="oklch(0.65 0.18 25)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Both directions summary + Language distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5 lg:col-span-2">
          <SectionHeader
            title="أعلى الأسماء في الاتجاهين"
            subtitle="أشخاص أرسلوا وتلقوا مبالغ من الحساب"
            icon={ArrowLeftRight}
          />
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pe-1">
            {both_directions.slice(0, 10).map((n, i) => (
              <div key={`${n.name_normalized}-${i}`} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gradient-to-l from-primary/5 to-gold/5 border border-primary/10 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gold/15 text-gold flex items-center justify-center font-cairo font-bold text-xs">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-cairo font-semibold text-foreground truncate">{n.name}</p>
                    <p className="text-[11px] text-muted-foreground ltr-numbers">
                      {formatDateAr(n.first_date)} → {formatDateAr(n.last_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground font-cairo">وارد</p>
                    <p className="text-xs font-cairo font-bold text-success ltr-numbers">{formatSAR(n.in_amount, { compact: true })}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground font-cairo">صادر</p>
                    <p className="text-xs font-cairo font-bold text-destructive ltr-numbers">{formatSAR(n.out_amount, { compact: true })}</p>
                  </div>
                  <div className="text-center ps-2 border-s border-border">
                    <p className="text-[10px] text-muted-foreground font-cairo">الصافي</p>
                    <p className={cn("text-xs font-cairo font-bold ltr-numbers", n.net >= 0 ? "text-success" : "text-destructive")}>
                      {formatSAR(n.net, { compact: true, sign: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="توزيع اللغات"
            subtitle="عربي vs إنجليزي"
            icon={Languages}
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={langPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                  label={({ name, percent }) => percent ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
                  labelLine={false}
                  style={{ fontSize: "11px", fontFamily: "var(--font-cairo)" }}
                >
                  {langPie.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  cursor={false}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {langPie.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: p.color }}></span>
                  <span className="font-cairo">{p.name}</span>
                </div>
                <span className="font-cairo font-bold ltr-numbers">{p.value.toLocaleString("en-US")}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detailed table with filters */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/60 space-y-3">
          {/* View switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted/50 p-1">
              <ViewTab active={view === "incoming"} onClick={() => setView("incoming")} icon={ArrowDownToLine} label="الوارد" count={incoming_names.length} color="success" />
              <ViewTab active={view === "outgoing"} onClick={() => setView("outgoing")} icon={ArrowUpFromLine} label="الصادر" count={outgoing_names.length} color="danger" />
              <ViewTab active={view === "both"} onClick={() => setView("both")} icon={ArrowLeftRight} label="الاتجاهين" count={both_directions.length} color="gold" />
              <ViewTab active={view === "all"} onClick={() => setView("all")} icon={Users} label="الكل" count={all_names.length} color="primary" />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن اسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 font-cairo"
              />
            </div>
            {view !== "both" && (
              <Select value={langFilter} onValueChange={setLangFilter}>
                <SelectTrigger className="w-[130px] font-cairo">
                  <SelectValue placeholder="اللغة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل اللغات</SelectItem>
                  <SelectItem value="ar">عربي</SelectItem>
                  <SelectItem value="en">إنجليزي</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={resetFilters} className="font-cairo">
              <X className="h-4 w-4 ml-1" />
              مسح
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground">
                  <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground">
                    الاسم
                    <SortIcon field="name" current={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground">اللغة</th>
                {view === "both" ? (
                  <>
                    <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground">عدد الوارد</th>
                    <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground">عدد الصادر</th>
                    <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">قيمة الوارد</th>
                    <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">قيمة الصادر</th>
                    <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">الصافي</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground">
                      <button onClick={() => toggleSort("count")} className="flex items-center gap-1 hover:text-foreground mx-auto">
                        العدد
                        <SortIcon field="count" current={sortField} dir={sortDir} />
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">
                      <button onClick={() => toggleSort("total_amount")} className="flex items-center gap-1 hover:text-foreground mr-auto">
                        الإجمالي
                        <SortIcon field="total_amount" current={sortField} dir={sortDir} />
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">
                      <button onClick={() => toggleSort("avg_amount")} className="flex items-center gap-1 hover:text-foreground mr-auto">
                        المتوسط
                        <SortIcon field="avg_amount" current={sortField} dir={sortDir} />
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground">الفترة</th>
                  </>
                )}
                <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground whitespace-nowrap">
                  <span className="flex items-center gap-1 justify-center">
                    <FileText className="h-3.5 w-3.5" />
                    الصفحات
                  </span>
                </th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={view === "both" ? 9 : 7} className="px-3 py-12 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="font-cairo">لا توجد أسماء مطابقة</p>
                  </td>
                </tr>
              ) : (
                pageData.map((n: any, i) => {
                  const isSelected = selectedName === (n.name_normalized || n.name);
                  return (
                    <React.Fragment key={`${n.name_normalized || n.name}-${n.direction || ""}-${i}`}>
                      <tr
                        className={cn(
                          "border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer",
                          isSelected && "bg-primary/5"
                        )}
                        onClick={() => setSelectedName(isSelected ? null : (n.name_normalized || n.name))}
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-8 w-8 shrink-0 rounded-full flex items-center justify-center",
                              view === "incoming" && "bg-success/15 text-success",
                              view === "outgoing" && "bg-destructive/15 text-destructive",
                              view === "both" && "bg-gold/15 text-gold",
                              view === "all" && (n.direction === "in" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"),
                            )}>
                              {n.language === "ar" ? <Type className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                            </div>
                            <span className="font-cairo font-semibold text-foreground">{n.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge variant="outline" className="font-cairo text-xs">
                            {n.language === "ar" ? "عربي" : "إنجليزي"}
                          </Badge>
                        </td>
                        {view === "both" ? (
                          <>
                            <td className="px-3 py-3 text-center">
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-cairo ltr-numbers">
                                {n.in_count.toLocaleString("en-US")}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-cairo ltr-numbers">
                                {n.out_count.toLocaleString("en-US")}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-left font-cairo font-semibold text-success ltr-numbers">
                              {formatSAR(n.in_amount, { compact: true })}
                            </td>
                            <td className="px-3 py-3 text-left font-cairo font-semibold text-destructive ltr-numbers">
                              {formatSAR(n.out_amount, { compact: true })}
                            </td>
                            <td className={cn("px-3 py-3 text-left font-cairo font-bold ltr-numbers", n.net >= 0 ? "text-success" : "text-destructive")}>
                              {formatSAR(n.net, { compact: true, sign: true })}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-3 text-center">
                              <Badge variant="outline" className="font-cairo ltr-numbers">
                                {n.count.toLocaleString("en-US")}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-left">
                              <span className={cn(
                                "font-cairo font-bold ltr-numbers",
                                n.direction === "in" ? "text-success" : "text-destructive"
                              )}>
                                {formatSAR(n.total_amount, { compact: true })}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-left font-cairo text-foreground ltr-numbers">
                              {formatSAR(n.avg_amount)}
                            </td>
                            <td className="px-3 py-3 text-center text-[11px] text-muted-foreground ltr-numbers">
                              {n.first_date ? n.first_date.substring(0, 7) : "—"}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-3 text-center">
                          <Badge variant="outline" className="font-cairo text-[10px] bg-primary/5 border-primary/20 text-primary ltr-numbers gap-0.5">
                            <FileText className="h-2.5 w-2.5" />
                            {n.page_count || 0} صفحة
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-left">
                          <ChevronLeft className={cn("h-4 w-4 text-muted-foreground transition-transform", isSelected && "-rotate-90")} />
                        </td>
                      </tr>
                      {isSelected && (
                        <tr>
                          <td colSpan={view === "both" ? 9 : 7} className="px-3 py-4 bg-muted/20 border-b border-border/40">
                            <NameDetail name={n} view={view} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="font-cairo">الأولى</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
              <span className="px-3 text-xs font-cairo ltr-numbers">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>التالي</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages} className="font-cairo">الأخيرة</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function NameDetail({ name, view }: { name: any; view: string }) {
  const [showAllTx, setShowAllTx] = React.useState(false);
  const [selectedTx, setSelectedTx] = React.useState<any | null>(null);

  // Get all transactions (or fall back to samples)
  const allTx = (name.transactions && name.transactions.length > 0)
    ? name.transactions
    : (name.sample_transactions || []);

  // Show 5 most recent by default; toggle for all
  const displayTx = showAllTx ? allTx : allTx.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {view === "both" ? (
          <>
            <DetailBox label="إجمالي المعاملات" value={`${(name.in_count + name.out_count).toLocaleString("en-US")}`} />
            <DetailBox label="إجمالي المبلغ" value={formatSAR(name.total_amount, { compact: true })} />
            <DetailBox label="أول معاملة" value={formatDateAr(name.first_date)} />
            <DetailBox label="آخر معاملة" value={formatDateAr(name.last_date)} />
            <DetailBox label="نسبة الوارد" value={`${((name.in_amount / name.total_amount) * 100).toFixed(1)}%`} />
            <DetailBox label="نسبة الصادر" value={`${((name.out_amount / name.total_amount) * 100).toFixed(1)}%`} />
            <DetailBox label="متوسط الوارد" value={formatSAR(name.in_amount / Math.max(1, name.in_count))} />
            <DetailBox label="متوسط الصادر" value={formatSAR(name.out_amount / Math.max(1, name.out_count))} />
          </>
        ) : (
          <>
            <DetailBox label="عدد المعاملات" value={name.count.toLocaleString("en-US")} />
            <DetailBox label="إجمالي المبلغ" value={formatSAR(name.total_amount)} />
            <DetailBox label="متوسط المبلغ" value={formatSAR(name.avg_amount)} />
            <DetailBox label="أول معاملة" value={formatDateAr(name.first_date)} />
            <DetailBox label="آخر معاملة" value={formatDateAr(name.last_date)} />
            <DetailBox label="اللغة" value={name.language === "ar" ? "عربي" : "إنجليزي"} />
            <DetailBox label="الاتجاه" value={name.direction === "in" ? "وارد" : "صادر"} />
            <DetailBox label="عدد الفئات" value={`${(name.categories || []).length}`} />
          </>
        )}
      </div>

      {/* Pages info */}
      {name.pages && name.pages.length > 0 && (
        <div>
          <h5 className="font-cairo text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            ظهر في {name.page_count} صفحة من كشف الحساب:
          </h5>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar p-2 rounded-lg bg-card border border-border/60">
            {name.pages.map((p: number, idx: number) => (
              <Badge
                key={`${p}-${idx}`}
                variant="outline"
                className="font-cairo text-[10px] bg-primary/5 border-primary/20 text-primary ltr-numbers cursor-default"
                title={`صفحة ${p} من كشف الحساب`}
              >
                ص. {p}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* All transactions list */}
      {allTx.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-cairo text-sm font-bold text-foreground flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
              {showAllTx ? `جميع المعاملات (${allTx.length})` : `أحدث ${displayTx.length} معاملات`}
            </h5>
            {allTx.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllTx(!showAllTx)}
                className="font-cairo text-xs h-7"
              >
                {showAllTx ? "عرض أقل" : `عرض الكل (${allTx.length})`}
              </Button>
            )}
          </div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto custom-scrollbar pe-1">
            {displayTx.map((t: any, i: number) => {
              const dir = t.direction || (view === "incoming" ? "in" : view === "outgoing" ? "out" : name.direction);
              return (
                <div
                  key={`${t.page}-${t.seq_in_page}-${i}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-md bg-card border border-border/60 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedTx(t)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Page badge */}
                    <Badge variant="outline" className="font-cairo text-[9px] shrink-0 bg-primary/5 border-primary/20 text-primary ltr-numbers gap-0.5 px-1.5 py-0">
                      <FileText className="h-2.5 w-2.5" />
                      ص.{t.page}
                      {t.seq_in_page ? `#${t.seq_in_page}` : ""}
                    </Badge>
                    <Badge variant="outline" className="font-cairo text-[10px] shrink-0">{t.category_ar}</Badge>
                    <span className="font-cairo text-foreground truncate">{t.description}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.reference_number && (
                      <Badge variant="outline" className="font-cairo text-[9px] bg-secondary/50 ltr-numbers gap-0.5">
                        <Hash className="h-2.5 w-2.5" />
                        {t.reference_number.length > 18 ? t.reference_number.substring(0, 18) + "…" : t.reference_number}
                      </Badge>
                    )}
                    <span className="text-muted-foreground ltr-numbers text-[10px]">{formatDateAr(t.date_greg)}</span>
                    <span className={cn("font-cairo font-bold ltr-numbers", dir === "in" ? "text-success" : "text-destructive")}>
                      {dir === "out" ? "-" : "+"}{formatSAR(t.amount, { compact: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {showAllTx && allTx.length > 5 && (
            <p className="text-[11px] text-muted-foreground font-cairo text-center mt-2">
              انقر على أي معاملة لرؤية النص الأصلي من كشف الحساب PDF
            </p>
          )}
        </div>
      )}

      {/* Transaction Detail Dialog (raw PDF text) */}
      <NameTransactionDialog
        transaction={selectedTx}
        open={!!selectedTx}
        onOpenChange={(v) => !v && setSelectedTx(null)}
        nameLabel={name.name}
      />
    </div>
  );
}

/**
 * Dialog showing a single transaction's raw PDF text block.
 */
function NameTransactionDialog({
  transaction,
  open,
  onOpenChange,
  nameLabel,
}: {
  transaction: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  nameLabel?: string;
}) {
  if (!transaction) return null;
  const dir = transaction.direction;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="font-cairo text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            معاملة {nameLabel ? `· ${nameLabel}` : ""}
          </DialogTitle>
          <DialogDescription className="font-cairo">
            النص الأصلي للمعاملة من كشف حساب بنك الراجحي
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Key info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <p className="text-[10px] text-muted-foreground font-cairo mb-0.5">التاريخ الميلادي</p>
              <p className="text-xs font-cairo font-bold text-foreground ltr-numbers" dir="auto">{formatDateAr(transaction.date_greg)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <p className="text-[10px] text-muted-foreground font-cairo mb-0.5">التاريخ الهجري</p>
              <p className="text-xs font-cairo font-bold text-foreground ltr-numbers" dir="auto">{transaction.date_hijri || "—"}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <p className="text-[10px] text-muted-foreground font-cairo mb-0.5">رقم الصفحة</p>
              <p className="text-xs font-cairo font-bold text-primary ltr-numbers">
                صفحة {transaction.page}
                {transaction.seq_in_page ? ` · معاملة #${transaction.seq_in_page}` : ""}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <p className="text-[10px] text-muted-foreground font-cairo mb-0.5">الرقم المرجعي</p>
              <p className="text-xs font-cairo font-bold text-foreground ltr-numbers" dir="auto">
                {transaction.reference_number || "غير متوفر"}
              </p>
            </div>
          </div>

          {/* Amount & Direction */}
          <div className="p-3 rounded-lg bg-secondary/30 grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground font-cairo mb-0.5">الاتجاه</p>
              {dir === "in" ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1 font-cairo text-xs">
                  <ArrowDownToLine className="h-3 w-3" /> وارد
                </Badge>
              ) : dir === "out" ? (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 font-cairo text-xs">
                  <ArrowUpFromLine className="h-3 w-3" /> صادر
                </Badge>
              ) : (
                <Badge variant="outline" className="font-cairo text-xs">غير محدد</Badge>
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-cairo mb-0.5">المبلغ</p>
              <p className={cn("font-cairo font-bold text-sm ltr-numbers", dir === "in" ? "text-success" : dir === "out" ? "text-destructive" : "text-foreground")}>
                {dir === "out" ? "-" : ""}{formatSAR(transaction.amount)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-cairo mb-0.5">الرصيد بعد المعاملة</p>
              <p className="font-cairo font-bold text-sm text-foreground ltr-numbers">{formatSAR(transaction.balance_after)}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-cairo text-xs font-bold text-foreground mb-1.5">وصف المعاملة</h4>
            <Card className="p-2.5 bg-card">
              <p className="font-cairo text-xs text-foreground leading-relaxed">{transaction.description}</p>
              {transaction.description_full && transaction.description_full !== transaction.description && (
                <p className="font-cairo text-[11px] text-muted-foreground leading-relaxed mt-1.5 pt-1.5 border-t border-border/60">
                  {transaction.description_full}
                </p>
              )}
            </Card>
          </div>

          {/* Raw PDF Text */}
          <div>
            <h4 className="font-cairo text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-gold" />
              النص الأصلي من كشف الحساب PDF
            </h4>
            <Card className="p-0 overflow-hidden border-gold/30">
              <div className="bg-gold/10 px-3 py-1.5 border-b border-gold/20">
                <p className="text-[10px] text-gold-foreground font-cairo flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" />
                  بنك الراجحي · صفحة {transaction.page} · معاملة #{transaction.seq_in_page || "—"}
                </p>
              </div>
              <pre
                dir="rtl"
                className="p-3 text-[11px] font-mono text-foreground leading-relaxed overflow-x-auto custom-scrollbar bg-card text-right"
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  unicodeBidi: "plaintext",
                }}
              >
{transaction.raw_text_block || "لا يوجد نص أصلي متوفر"}
              </pre>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-card border border-border/60">
      <p className="text-[11px] text-muted-foreground font-cairo">{label}</p>
      <p className="text-sm font-cairo font-bold text-foreground mt-1 ltr-numbers">{value}</p>
    </div>
  );
}

function ViewTab({ active, onClick, icon: Icon, label, count, color }: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  count: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    success: "bg-success/15 text-success",
    danger: "bg-destructive/15 text-destructive",
    gold: "bg-gold/15 text-gold",
    primary: "bg-primary/15 text-primary",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-cairo font-medium transition-all",
        active ? cn(colorClasses[color], "shadow-sm") : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label}</span>
      <Badge variant="outline" className="font-cairo text-[10px] ltr-numbers px-1.5 py-0">
        {count.toLocaleString("en-US")}
      </Badge>
    </button>
  );
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (current !== field) return <span className="opacity-30">⇅</span>;
  return <span>{dir === "asc" ? "↑" : "↓"}</span>;
}
