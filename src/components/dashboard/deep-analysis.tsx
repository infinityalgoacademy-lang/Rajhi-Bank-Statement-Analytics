"use client";

import * as React from "react";
import {
  Microscope, Brain, Sparkles, AlertTriangle, Target,
  Calendar, Repeat, Gauge, TrendingUp, Activity, Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "./kpi-card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { Analytics, formatSAR, formatDateAr } from "@/lib/analytics";

interface DeepAnalysisProps {
  data: Analytics;
}

export function DeepAnalysis({ data }: DeepAnalysisProps) {
  const { kpis, categories, yearly, monthly, largest_incoming, largest_outgoing, top_recurring_in, top_recurring_out, day_of_week } = data;

  // Calculate insights
  // 1. Inflow-to-Outflow ratio
  const ratio = kpis.total_outgoing_amount > 0 ? kpis.total_incoming_amount / kpis.total_outgoing_amount : 0;
  const ratioPct = (ratio * 100).toFixed(1);

  // 2. Most volatile year (highest std dev in monthly amounts)
  const yearVols = yearly.map(y => {
    const yearMonths = monthly.filter(m => m.year === y.year);
    const amounts = yearMonths.map(m => m.in_amount + m.out_amount);
    const mean = amounts.reduce((s, a) => s + a, 0) / (amounts.length || 1);
    const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / (amounts.length || 1);
    return { year: y.year, std: Math.sqrt(variance), mean };
  });
  const mostVolatile = yearVols.filter(y => y.std > 0).sort((a, b) => b.std - a.std)[0];

  // 3. Spending concentration (top 10% of txs vs total)
  const allOutgoing = largest_outgoing; // already sorted desc
  const totalOutAmt = kpis.total_outgoing_amount;

  // 4. Top categories radar
  const top5Cats = categories.slice(0, 5);
  const radarData = top5Cats.map(c => ({
    category: c.category_ar,
    amount: Math.round(c.total_amount / 1000), // in thousands for radar scale
    count: c.total_count,
  }));

  // 5. Yearly scatter: count vs amount
  const scatterData = yearly.map(y => ({
    year: y.year,
    count: y.total_count,
    amount: y.in_amount + y.out_amount,
    net: y.net,
  }));

  // 6. Recurring amount detection (same amount occurring many times)
  const recurringAmounts = top_recurring_in.filter(r => r.count >= 10).concat(top_recurring_out.filter(r => r.count >= 10));

  // 7. Best year (highest net positive)
  const bestYear = yearly.filter(y => y.net > 0).sort((a, b) => b.net - a.net)[0];
  const worstYear = yearly.filter(y => y.net < 0).sort((a, b) => a.net - b.net)[0];

  // 8. Monthly seasonality index
  const monthlyAvg = monthly.reduce((s, m) => s + m.in_amount + m.out_amount, 0) / monthly.length;
  const monthSeasonality = data.month_pattern.map(m => ({
    month: m.month_name_ar,
    index: monthlyAvg > 0 ? Number(((m.in_amount + m.out_amount) / monthlyAvg * 100).toFixed(0)) : 0,
    total: m.in_amount + m.out_amount,
  }));

  // 9. Calculate financial discipline score (composite)
  const balanceDiscipline = kpis.min_balance < 0 ? 50 : 100; // negative balance = penalty
  const ratioDiscipline = Math.min(100, ratio * 50); // 2:1 ratio = perfect
  const consistencyScore = Math.min(100, (kpis.active_months / (kpis.active_years * 12)) * 100);
  const overallScore = Math.round((balanceDiscipline + ratioDiscipline + consistencyScore) / 3);

  return (
    <div className="space-y-6">
      {/* Insights header */}
      <Card className="p-5 bg-gradient-to-l from-gold/10 via-card to-primary/10 border-gold/30">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-cairo text-base font-bold text-foreground">رؤى مالية متقدمة</h3>
            <p className="text-sm text-muted-foreground mt-1 font-cairo leading-relaxed">
              تحليل عميق لـ {kpis.total_transactions.toLocaleString("en-US")} معاملة على مدار {kpis.active_years} سنة،
              بإجمالي تدفق مالي يتجاوز {formatSAR(kpis.total_incoming_amount + kpis.total_outgoing_amount, { compact: true })}.
              يكشف هذا التحليل الأنماط الخفية والاتجاهات طويلة الأمد في حسابك البنكي.
            </p>
          </div>
        </div>
      </Card>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Ratio insight */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Gauge className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-cairo font-bold text-sm text-foreground">نسبة الوارد إلى الصادر</h4>
          </div>
          <p className="text-2xl font-cairo font-bold text-primary ltr-numbers mb-1">{ratioPct}%</p>
          <p className="text-xs text-muted-foreground font-cairo leading-relaxed">
            لكل كل ريال واحد يخرج من الحساب، يرد {ratio.toFixed(2)} ريال.
            {ratio >= 1 ? " الحساب يحقق توازناً إيجابياً." : " الحساب يعاني من عجز في التدفق."}
          </p>
        </Card>

        {/* Volatility */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-warning/15 text-warning flex items-center justify-center">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-cairo font-bold text-sm text-foreground">أكثر سنة تقلباً</h4>
          </div>
          <p className="text-2xl font-cairo font-bold text-warning ltr-numbers mb-1">{mostVolatile?.year || "—"}</p>
          <p className="text-xs text-muted-foreground font-cairo leading-relaxed">
            انحراف معياري شهري قدره {formatSAR(mostVolatile?.std || 0, { compact: true })}.
            يشير إلى تذبذب كبير في التدفقات المالية.
          </p>
        </Card>

        {/* Best/Worst year */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-success/15 text-success flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-cairo font-bold text-sm text-foreground">أفضل سنة</h4>
          </div>
          <p className="text-2xl font-cairo font-bold text-success ltr-numbers mb-1">{bestYear?.year || "—"}</p>
          <p className="text-xs text-muted-foreground font-cairo leading-relaxed">
            صافي تدفق موجب قدره {formatSAR(bestYear?.net || 0, { compact: true, sign: true })}.
            أعلى فائض سنوي في تاريخ الحساب.
          </p>
        </Card>

        {/* Worst year */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-cairo font-bold text-sm text-foreground">أصعب سنة</h4>
          </div>
          <p className="text-2xl font-cairo font-bold text-destructive ltr-numbers mb-1">{worstYear?.year || "—"}</p>
          <p className="text-xs text-muted-foreground font-cairo leading-relaxed">
            صافي تدفق سالب قدره {formatSAR(worstYear?.net || 0, { compact: true })}.
            أكبر عجز سنوي في تاريخ الحساب.
          </p>
        </Card>

        {/* Discipline score */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
              <Target className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-cairo font-bold text-sm text-foreground">مؤشر الانضباط المالي</h4>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-2xl font-cairo font-bold text-gold ltr-numbers">{overallScore}</p>
            <p className="text-xs text-muted-foreground font-cairo">/ 100</p>
          </div>
          <Progress value={overallScore} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground font-cairo mt-1.5">
            توازن الرصيد + نسبة التدفق + الاستمرارية
          </p>
        </Card>

        {/* Spending concentration */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Award className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-cairo font-bold text-sm text-foreground">تركز الإنفاق</h4>
          </div>
          <p className="text-2xl font-cairo font-bold text-primary ltr-numbers mb-1">
            {largest_outgoing.length} معاملة
          </p>
          <p className="text-xs text-muted-foreground font-cairo leading-relaxed">
            أكبر 20 معاملة صادرة تستحوذ على
            {" "}{((largest_outgoing.reduce((s, t) => s + (t.amount || 0), 0) / totalOutAmt) * 100).toFixed(1)}%
            من إجمالي الصادر.
          </p>
        </Card>
      </div>

      {/* Radar chart for category balance */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="خريطة التوازن الفئوية"
          subtitle="مقارنة أعلى 5 فئات من حيث الحجم والمبلغ"
          icon={Brain}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(0.7 0.02 160 / 0.3)" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)", fontFamily: "var(--font-cairo)" }}
                />
                <PolarRadiusAxis
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.02 160)" }}
                  angle={90}
                />
                <Radar
                  name="المبلغ (ألف ر.س)"
                  dataKey="amount"
                  stroke="oklch(0.55 0.16 160)"
                  fill="oklch(0.55 0.16 160)"
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.02 160)",
                    border: "1px solid oklch(0.3 0.05 160)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    color: "white",
                  }}
                  formatter={(v: any) => [`${v.toLocaleString("en-US")} ألف ر.س`, "المبلغ"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(0.7 0.02 160 / 0.3)" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)", fontFamily: "var(--font-cairo)" }}
                />
                <PolarRadiusAxis
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.02 160)" }}
                  angle={90}
                />
                <Radar
                  name="عدد المعاملات"
                  dataKey="count"
                  stroke="oklch(0.78 0.15 80)"
                  fill="oklch(0.78 0.15 80)"
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.02 160)",
                    border: "1px solid oklch(0.3 0.05 160)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    color: "white",
                  }}
                  formatter={(v: any) => [`${v.toLocaleString("en-US")} معاملة`, "العدد"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Scatter: count vs amount */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="العلاقة بين عدد المعاملات وحجم المبالغ"
          subtitle="كل نقطة تمثل سنة - الحجم يمثل صافي التدفق"
          icon={Microscope}
        />
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
              <XAxis
                type="number"
                dataKey="count"
                name="عدد المعاملات"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                tickFormatter={(v) => v.toLocaleString("en-US")}
                label={{ value: "عدد المعاملات", position: "insideBottom", offset: -5, style: { fontSize: 11, fill: "oklch(0.5 0.02 160)", fontFamily: "var(--font-cairo)" } }}
              />
              <YAxis
                type="number"
                dataKey="amount"
                name="إجمالي المبلغ"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                width={60}
                label={{ value: "المبلغ (ر.س)", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "oklch(0.5 0.02 160)", fontFamily: "var(--font-cairo)" } }}
              />
              <ZAxis
                type="number"
                dataKey="net"
                range={[60, 600]}
                name="صافي التدفق"
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.02 160)",
                  border: "1px solid oklch(0.3 0.05 160)",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  color: "white",
                }}
                formatter={(v: any, n: string) => {
                  if (n === "count") return [`${v} معاملة`, "العدد"];
                  if (n === "amount") return [formatSAR(v), "المبلغ"];
                  if (n === "net") return [formatSAR(v, { sign: true }), "الصافي"];
                  return [v, n];
                }}
                labelFormatter={() => ""}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Scatter
                data={scatterData}
                fill="oklch(0.55 0.16 160)"
                fillOpacity={0.6}
              >
                {scatterData.map((d, i) => (
                  <Cell key={i} fill={d.net >= 0 ? "oklch(0.55 0.16 160)" : "oklch(0.65 0.18 25)"} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs font-cairo">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: "oklch(0.55 0.16 160)" }}></span>
            صافي موجب
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: "oklch(0.65 0.18 25)" }}></span>
            صافي سالب
          </span>
          <span className="text-muted-foreground">حجم النقطة يمثل قيمة الصافي</span>
        </div>
      </Card>

      {/* Seasonality */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="مؤشر الموسمية الشهري"
          subtitle="100 = المتوسط الشهري. أعلى من 100 = شهر أكثر نشاطاً"
          icon={Calendar}
        />
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthSeasonality} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "oklch(0.5 0.02 160)", fontFamily: "var(--font-cairo)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                width={45}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.02 160)",
                  border: "1px solid oklch(0.3 0.05 160)",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  color: "white",
                }}
                formatter={(v: any, n: string) => {
                  if (n === "index") return [v, "المؤشر (100=متوسط)"];
                  return [formatSAR(v), "إجمالي المبلغ"];
                }}
              />
              <Bar
                dataKey="index"
                radius={[4, 4, 0, 0]}
              >
                {monthSeasonality.map((d, i) => (
                  <Cell key={i} fill={d.index >= 100 ? "oklch(0.55 0.16 160)" : "oklch(0.65 0.18 25)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recurring transactions */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="المعاملات المتكررة (10+ مرات)"
          subtitle="أنماط دورية تشير إلى التزامات أو دخل منتظم"
          icon={Repeat}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recurringAmounts.slice(0, 12).map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/60 bg-card">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Repeat className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-cairo font-semibold text-foreground truncate">{r.description}</p>
                  <p className="text-[11px] text-muted-foreground font-cairo">
                    يتكرر {r.count} مرة · {formatSAR(r.total_amount / r.count, { compact: false })} للمعاملة
                  </p>
                </div>
              </div>
              <div className="text-end shrink-0">
                <Badge variant="outline" className="font-cairo ltr-numbers mb-0.5">{r.count}×</Badge>
                <p className="text-xs font-cairo font-semibold text-foreground ltr-numbers">
                  {formatSAR(r.total_amount, { compact: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import { Cell } from "recharts";
