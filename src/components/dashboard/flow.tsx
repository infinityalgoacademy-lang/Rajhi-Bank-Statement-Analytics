"use client";

import * as React from "react";
import {
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown,
  Equal, Percent, Activity, Award, AlertCircle, BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard, SectionHeader } from "./kpi-card";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Legend, LineChart, Line,
} from "recharts";
import { Analytics, formatSAR, formatDateAr } from "@/lib/analytics";

interface FlowProps {
  data: Analytics;
}

export function Flow({ data }: FlowProps) {
  const { kpis, monthly, yearly, largest_incoming, largest_outgoing, top_recurring_in, top_recurring_out } = data;

  // Last 36 months for trend chart
  const recentMonthly = monthly.slice(-36).map((m) => ({
    ...m,
    label: `${m.year}/${String(m.month).padStart(2, "0")}`,
  }));

  // Ratio per year
  const ratioData = yearly.map((y) => {
    const total = y.in_amount + y.out_amount;
    const inPct = total > 0 ? (y.in_amount / total) * 100 : 0;
    const outPct = total > 0 ? (y.out_amount / total) * 100 : 0;
    return {
      year: y.year,
      inPct: Number(inPct.toFixed(1)),
      outPct: Number(outPct.toFixed(1)),
      inAmount: y.in_amount,
      outAmount: y.out_amount,
    };
  });

  // Ratio of count
  const inOutRatio = kpis.total_outgoing_count + kpis.total_incoming_count > 0
    ? (kpis.total_incoming_count / (kpis.total_outgoing_count + kpis.total_incoming_count) * 100).toFixed(1)
    : "0";
  const outPctCount = 100 - Number(inOutRatio);

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="عدد المعاملات الواردة"
          value={<span className="ltr-numbers">{kpis.total_incoming_count.toLocaleString("en-US")}</span>}
          sublabel={`بنسبة ${inOutRatio}% من الإجمالي`}
          icon={ArrowDownToLine}
          variant="success"
        />
        <KpiCard
          label="عدد المعاملات الصادرة"
          value={<span className="ltr-numbers">{kpis.total_outgoing_count.toLocaleString("en-US")}</span>}
          sublabel={`بنسبة ${outPctCount.toFixed(1)}% من الإجمالي`}
          icon={ArrowUpFromLine}
          variant="danger"
        />
        <KpiCard
          label="متوسط المعاملة الواردة"
          value={formatSAR(kpis.avg_incoming, { compact: false })}
          sublabel="إجمالي الوارد / عدد الوارد"
          icon={TrendingUp}
          variant="success"
        />
        <KpiCard
          label="متوسط المعاملة الصادرة"
          value={formatSAR(kpis.avg_outgoing, { compact: false })}
          sublabel="إجمالي الصادر / عدد الصادر"
          icon={TrendingDown}
          variant="danger"
        />
      </div>

      {/* In vs Out counts visual */}
      <Card className="p-5">
        <SectionHeader
          title="نسبة المعاملات الواردة إلى الصادرة"
          subtitle="حسب العدد وحسب القيمة"
          icon={Equal}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By count */}
          <div>
            <h4 className="text-sm font-cairo font-semibold text-muted-foreground mb-3">حسب العدد</h4>
            <div className="flex h-8 w-full overflow-hidden rounded-lg bg-muted">
              <div
                className="flex items-center justify-center text-white text-xs font-cairo font-bold transition-all"
                style={{ width: `${inOutRatio}%`, background: "oklch(0.55 0.16 160)" }}
              >
                {inOutRatio}%
              </div>
              <div
                className="flex items-center justify-center text-white text-xs font-cairo font-bold transition-all"
                style={{ width: `${outPctCount}%`, background: "oklch(0.65 0.18 25)" }}
              >
                {outPctCount.toFixed(0)}%
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-success font-cairo font-medium flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.55 0.16 160)" }}></span>
                وارد ({kpis.total_incoming_count.toLocaleString("en-US")})
              </span>
              <span className="text-destructive font-cairo font-medium flex items-center gap-1">
                صادر ({kpis.total_outgoing_count.toLocaleString("en-US")})
                <span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.65 0.18 25)" }}></span>
              </span>
            </div>
          </div>

          {/* By amount */}
          <div>
            <h4 className="text-sm font-cairo font-semibold text-muted-foreground mb-3">حسب القيمة</h4>
            {(() => {
              const total = kpis.total_incoming_amount + kpis.total_outgoing_amount;
              const inAmtPct = total > 0 ? (kpis.total_incoming_amount / total) * 100 : 0;
              const outAmtPct = 100 - inAmtPct;
              return (
                <>
                  <div className="flex h-8 w-full overflow-hidden rounded-lg bg-muted">
                    <div
                      className="flex items-center justify-center text-white text-xs font-cairo font-bold"
                      style={{ width: `${inAmtPct}%`, background: "oklch(0.55 0.16 160)" }}
                    >
                      {inAmtPct.toFixed(0)}%
                    </div>
                    <div
                      className="flex items-center justify-center text-white text-xs font-cairo font-bold"
                      style={{ width: `${outAmtPct}%`, background: "oklch(0.65 0.18 25)" }}
                    >
                      {outAmtPct.toFixed(0)}%
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-success font-cairo font-medium">
                      وارد ({formatSAR(kpis.total_incoming_amount, { compact: true })})
                    </span>
                    <span className="text-destructive font-cairo font-medium">
                      صادر ({formatSAR(kpis.total_outgoing_amount, { compact: true })})
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </Card>

      {/* Monthly In/Out Trend */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="التدفق الشهري: الوارد مقابل الصادر"
          subtitle="آخر 36 شهراً من المعاملات"
          icon={BarChart3}
        />
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={recentMonthly} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.16 160)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.55 0.16 160)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.18 25)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.65 0.18 25)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "oklch(0.5 0.02 160)" }}
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.02 160)",
                  border: "1px solid oklch(0.3 0.05 160)",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  color: "white",
                }}
                formatter={(v: any, n: string) => [formatSAR(v), n === "in_amount" ? "وارد" : "صادر"]}
                labelFormatter={(v) => `الشهر: ${v}`}
              />
              <Legend
                formatter={(v) => (v === "in_amount" ? "وارد" : "صادر")}
                wrapperStyle={{ fontSize: "12px", fontFamily: "var(--font-cairo)" }}
              />
              <Area
                type="monotone"
                dataKey="in_amount"
                stroke="oklch(0.55 0.16 160)"
                strokeWidth={2}
                fill="url(#inGrad)"
              />
              <Area
                type="monotone"
                dataKey="out_amount"
                stroke="oklch(0.65 0.18 25)"
                strokeWidth={2}
                fill="url(#outGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Yearly ratio stacked bar */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="نسبة الوارد إلى الصادر سنوياً"
          subtitle="توزيع المبالغ سنوياً بين الوارد والصادر"
          icon={Percent}
        />
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ratioData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                tickFormatter={(v) => String(v)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                tickFormatter={(v) => `${v}%`}
                width={45}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.02 160)",
                  border: "1px solid oklch(0.3 0.05 160)",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  color: "white",
                }}
                formatter={(v: any, n: string) => [`${v}%`, n === "inPct" ? "نسبة الوارد" : "نسبة الصادر"]}
                labelFormatter={(v) => `سنة ${v}`}
              />
              <Legend
                formatter={(v) => (v === "inPct" ? "نسبة الوارد" : "نسبة الصادر")}
                wrapperStyle={{ fontSize: "12px", fontFamily: "var(--font-cairo)" }}
              />
              <Bar dataKey="inPct" stackId="a" fill="oklch(0.55 0.16 160)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="outPct" stackId="a" fill="oklch(0.65 0.18 25)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Largest Incoming & Outgoing side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أكبر 10 معاملات واردة"
            subtitle="أعلى المعاملات دخولاً للحساب"
            icon={Award}
          />
          <div className="space-y-2 max-h-[28rem] overflow-y-auto custom-scrollbar pe-1">
            {largest_incoming.slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-success/5 border border-success/10 hover:bg-success/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-success/15 text-success flex items-center justify-center font-cairo font-bold text-xs">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-cairo font-semibold text-foreground truncate">{t.description}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateAr(t.date_greg)} · {t.category_ar}
                    </p>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-cairo font-bold text-success ltr-numbers">
                    {formatSAR(t.amount, { sign: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أكبر 10 معاملات صادرة"
            subtitle="أعلى المعاملات خروجاً من الحساب"
            icon={AlertCircle}
          />
          <div className="space-y-2 max-h-[28rem] overflow-y-auto custom-scrollbar pe-1">
            {largest_outgoing.slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-destructive/15 text-destructive flex items-center justify-center font-cairo font-bold text-xs">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-cairo font-semibold text-foreground truncate">{t.description}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateAr(t.date_greg)} · {t.category_ar}
                    </p>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-cairo font-bold text-destructive ltr-numbers">
                    -{formatSAR(t.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top recurring descriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أكثر المعاملات الواردة تكراراً"
            subtitle="أنماط الدخل المتكررة"
            icon={Activity}
          />
          <div className="space-y-2">
            {top_recurring_in.slice(0, 8).map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-cairo text-xs text-muted-foreground shrink-0">#{i + 1}</span>
                  <p className="text-sm font-cairo text-foreground truncate">{r.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary" className="font-cairo text-xs">{r.count}×</Badge>
                  <span className="text-sm font-cairo font-semibold text-success ltr-numbers">
                    {formatSAR(r.total_amount, { compact: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أكثر المعاملات الصادرة تكراراً"
            subtitle="أنماط الإنفاق المتكررة"
            icon={Activity}
          />
          <div className="space-y-2">
            {top_recurring_out.slice(0, 8).map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-cairo text-xs text-muted-foreground shrink-0">#{i + 1}</span>
                  <p className="text-sm font-cairo text-foreground truncate">{r.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary" className="font-cairo text-xs">{r.count}×</Badge>
                  <span className="text-sm font-cairo font-semibold text-destructive ltr-numbers">
                    {formatSAR(r.total_amount, { compact: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
