"use client";

import * as React from "react";
import {
  Wallet, TrendingUp, TrendingDown, Scale, Crown,
  ArrowDownToLine, ArrowUpFromLine, Hash, Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard, SectionHeader } from "./kpi-card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import { Analytics, formatSAR, formatDateAr } from "@/lib/analytics";

interface SizesProps {
  data: Analytics;
}

export function Sizes({ data }: SizesProps) {
  const { sizes, kpis, largest_incoming, largest_outgoing, smallest_incoming, smallest_outgoing } = data;

  // Calculate totals
  const large = sizes.find(s => s.size === "large") || { total_count: 0, total_amount: 0, in_amount: 0, out_amount: 0, in_count: 0, out_count: 0 };
  const medium = sizes.find(s => s.size === "medium") || { total_count: 0, total_amount: 0, in_amount: 0, out_amount: 0, in_count: 0, out_count: 0 };
  const small = sizes.find(s => s.size === "small") || { total_count: 0, total_amount: 0, in_amount: 0, out_amount: 0, in_count: 0, out_count: 0 };

  const totalCount = large.total_count + medium.total_count + small.total_count;
  const totalAmount = large.total_amount + medium.total_amount + small.total_amount;

  // Pie data
  const pieData = [
    { name: "كبيرة (10,000+ ر.س)", value: large.total_amount, count: large.total_count, color: "oklch(0.55 0.16 160)" },
    { name: "متوسطة (1,000 - 9,999 ر.س)", value: medium.total_amount, count: medium.total_count, color: "oklch(0.65 0.14 75)" },
    { name: "صغيرة (أقل من 1,000 ر.س)", value: small.total_amount, count: small.total_count, color: "oklch(0.7 0.15 50)" },
  ].filter(p => p.count > 0);

  // Bar data
  const barData = [
    {
      name: "كبيرة",
      in_amount: large.in_amount,
      out_amount: large.out_amount,
      in_count: large.in_count,
      out_count: large.out_count,
    },
    {
      name: "متوسطة",
      in_amount: medium.in_amount,
      out_amount: medium.out_amount,
      in_count: medium.in_count,
      out_count: medium.out_count,
    },
    {
      name: "صغيرة",
      in_amount: small.in_amount,
      out_amount: small.out_amount,
      in_count: small.in_count,
      out_count: small.out_count,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="معاملات كبيرة"
          value={<span className="ltr-numbers">{large.total_count.toLocaleString("en-US")}</span>}
          sublabel={`${((large.total_count / totalCount) * 100).toFixed(1)}% من العدد`}
          icon={Crown}
          variant="gold"
        />
        <KpiCard
          label="قيمة المعاملات الكبيرة"
          value={formatSAR(large.total_amount, { compact: true })}
          sublabel={`${((large.total_amount / totalAmount) * 100).toFixed(1)}% من القيمة`}
          icon={Wallet}
          variant="primary"
        />
        <KpiCard
          label="معاملات صغيرة"
          value={<span className="ltr-numbers">{small.total_count.toLocaleString("en-US")}</span>}
          sublabel={`${((small.total_count / totalCount) * 100).toFixed(1)}% من العدد`}
          icon={Hash}
          variant="default"
        />
        <KpiCard
          label="قيمة المعاملات الصغيرة"
          value={formatSAR(small.total_amount, { compact: true })}
          sublabel={`${((small.total_amount / totalAmount) * 100).toFixed(1)}% من القيمة`}
          icon={Activity}
          variant="warning"
        />
      </div>

      {/* Pareto principle visual */}
      <Card className="p-5">
        <SectionHeader
          title="مبدأ باريتو في المعاملات"
          subtitle="هل نسبة صغيرة من المعاملات تستحوذ على نسبة كبيرة من المبالغ؟"
          icon={Scale}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {pieData.map((p) => {
            const countPct = (p.count / totalCount) * 100;
            const amountPct = (p.value / totalAmount) * 100;
            return (
              <div key={p.name} className="p-4 rounded-xl border border-border/60 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-cairo font-bold text-sm text-foreground">{p.name}</h4>
                  <div className="h-3 w-3 rounded-full mt-1" style={{ background: p.color }}></div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-cairo mb-1">
                      <span className="text-muted-foreground">نسبة العدد</span>
                      <span className="font-bold text-foreground ltr-numbers">{countPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${countPct}%`, background: p.color }}></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 ltr-numbers">{p.count.toLocaleString("en-US")} معاملة</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-cairo mb-1">
                      <span className="text-muted-foreground">نسبة القيمة</span>
                      <span className="font-bold text-foreground ltr-numbers">{amountPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${amountPct}%`, background: p.color }}></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 ltr-numbers">{formatSAR(p.value, { compact: false })}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Comparison chart */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="مقارنة الوارد والصادر حسب حجم المعاملة"
          subtitle="بالقيمة المالية"
          icon={TrendingUp}
        />
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "oklch(0.5 0.02 160)", fontFamily: "var(--font-cairo)" }} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={50} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.02 160)",
                  border: "1px solid oklch(0.3 0.05 160)",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  color: "white",
                }}
                formatter={(v: any, n: string) => [formatSAR(v), n === "in_amount" ? "وارد" : "صادر"]}
              />
              <Legend
                formatter={(v) => (v === "in_amount" ? "وارد" : "صادر")}
                wrapperStyle={{ fontSize: "12px", fontFamily: "var(--font-cairo)" }}
              />
              <Bar dataKey="in_amount" fill="oklch(0.55 0.16 160)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="out_amount" fill="oklch(0.65 0.18 25)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Detail tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أكبر 15 معاملة واردة"
            subtitle="أعلى المعاملات دخولاً للحساب"
            icon={ArrowDownToLine}
          />
          <div className="space-y-2 max-h-[28rem] overflow-y-auto custom-scrollbar pe-1">
            {largest_incoming.slice(0, 15).map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-success/5 border border-success/10 hover:bg-success/10 transition-colors">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-cairo text-xs text-muted-foreground shrink-0 w-5">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-cairo font-semibold text-foreground truncate">{t.description}</p>
                    <p className="text-[11px] text-muted-foreground ltr-numbers">{formatDateAr(t.date_greg)} · {t.category_ar}</p>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-cairo font-bold text-success ltr-numbers">{formatSAR(t.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أكبر 15 معاملة صادرة"
            subtitle="أعلى المعاملات خروجاً من الحساب"
            icon={ArrowUpFromLine}
          />
          <div className="space-y-2 max-h-[28rem] overflow-y-auto custom-scrollbar pe-1">
            {largest_outgoing.slice(0, 15).map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-cairo text-xs text-muted-foreground shrink-0 w-5">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-cairo font-semibold text-foreground truncate">{t.description}</p>
                    <p className="text-[11px] text-muted-foreground ltr-numbers">{formatDateAr(t.date_greg)} · {t.category_ar}</p>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-cairo font-bold text-destructive ltr-numbers">-{formatSAR(t.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أصغر 15 معاملة واردة"
            subtitle="أقل المعاملات دخولاً للحساب"
            icon={ArrowDownToLine}
          />
          <div className="space-y-2 max-h-[28rem] overflow-y-auto custom-scrollbar pe-1">
            {smallest_incoming.slice(0, 15).map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-cairo text-xs text-muted-foreground shrink-0 w-5">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-cairo text-foreground truncate">{t.description}</p>
                    <p className="text-[11px] text-muted-foreground ltr-numbers">{formatDateAr(t.date_greg)} · {t.category_ar}</p>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-cairo font-semibold text-success ltr-numbers">{formatSAR(t.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أصغر 15 معاملة صادرة"
            subtitle="أقل المعاملات خروجاً من الحساب"
            icon={ArrowUpFromLine}
          />
          <div className="space-y-2 max-h-[28rem] overflow-y-auto custom-scrollbar pe-1">
            {smallest_outgoing.slice(0, 15).map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-cairo text-xs text-muted-foreground shrink-0 w-5">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-cairo text-foreground truncate">{t.description}</p>
                    <p className="text-[11px] text-muted-foreground ltr-numbers">{formatDateAr(t.date_greg)} · {t.category_ar}</p>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-cairo font-semibold text-destructive ltr-numbers">-{formatSAR(t.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Stats per size */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="إحصائيات تفصيلية حسب الحجم"
          icon={Activity}
        />
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground">الحجم</th>
                <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground">عدد الوارد</th>
                <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground">عدد الصادر</th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">قيمة الوارد</th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">قيمة الصادر</th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">الإجمالي</th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">المتوسط</th>
              </tr>
            </thead>
            <tbody>
              {sizes.filter(s => s.total_count > 0).map((s) => (
                <tr key={s.size} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-3 font-cairo font-semibold text-foreground">{s.size_ar}</td>
                  <td className="px-3 py-3 text-center">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-cairo ltr-numbers">
                      {s.in_count.toLocaleString("en-US")}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-cairo ltr-numbers">
                      {s.out_count.toLocaleString("en-US")}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-left font-cairo font-semibold text-success ltr-numbers">
                    {formatSAR(s.in_amount)}
                  </td>
                  <td className="px-3 py-3 text-left font-cairo font-semibold text-destructive ltr-numbers">
                    {formatSAR(s.out_amount)}
                  </td>
                  <td className="px-3 py-3 text-left font-cairo font-bold text-foreground ltr-numbers">
                    {formatSAR(s.total_amount)}
                  </td>
                  <td className="px-3 py-3 text-left font-cairo text-foreground ltr-numbers">
                    {s.total_count > 0 ? formatSAR(s.total_amount / s.total_count) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
