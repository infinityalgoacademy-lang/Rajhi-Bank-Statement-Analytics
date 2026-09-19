"use client";

import * as React from "react";
import {
  TrendingDown, TrendingUp, Wallet, Banknote,
  ArrowDownToLine, ArrowUpFromLine, Activity, Calendar,
  Building2, MapPin, Hash, Scale, Layers, BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard, SectionHeader } from "./kpi-card";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Legend, PieChart, Pie, Cell,
} from "recharts";
import { Analytics, formatSAR, formatDateAr, categoryColor } from "@/lib/analytics";
import { TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, TOOLTIP_CURSOR_STYLE } from "@/lib/chart-tooltip";

interface OverviewProps {
  data: Analytics;
}

export function Overview({ data }: OverviewProps) {
  const { kpis, account_info: account, yearly, categories, sizes, balance_history } = data;

  // Top 6 categories by total amount
  const topCategories = categories.slice(0, 6);
  const pieData = topCategories.map((c) => ({
    name: c.category_ar,
    value: c.total_amount,
    color: categoryColor(c.category),
  }));

  // Yearly bar chart data
  const yearlyChart = yearly.map((y) => ({
    year: y.year,
    inbound: y.in_amount,
    outbound: y.out_amount,
  }));

  // Size distribution
  const sizePieData = sizes.filter(s => s.total_count > 0).map((s) => ({
    name: s.size_ar,
    value: s.total_count,
    amount: s.total_amount,
  }));
  const sizeColors = ["oklch(0.55 0.16 160)", "oklch(0.65 0.14 75)", "oklch(0.7 0.15 50)", "oklch(0.6 0.02 160)"];

  // Years active badge
  const yearsActive = kpis.active_years_list.length > 0
    ? `${kpis.active_years_list[0]} - ${kpis.active_years_list[kpis.active_years_list.length - 1]}`
    : "—";

  return (
    <div className="space-y-6">
      {/* Account Info Banner */}
      <Card className="p-5 bg-gradient-to-l from-primary/5 via-card to-gold/5 border-primary/20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <InfoItem icon={Building2} label="اسم العميل" value={account.name_ar || account.name || "—"} />
          <InfoItem icon={Building2} label="البنك" value="مصرف الراجحي" />
          <InfoItem icon={MapPin} label="الفرع" value={account.branch_name ? `${account.branch_name} (${account.branch_code})` : "—"} />
          <InfoItem icon={Hash} label="رقم الآيبان" value={account.iban ? `...${account.iban.slice(-4)}` : "—"} mono />
          <InfoItem icon={Calendar} label="فترة الكشف" value={yearsActive} />
          <InfoItem icon={Scale} label="العملة" value="ريال سعودي" />
        </div>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="إجمالي المعاملات"
          value={<span className="ltr-numbers">{kpis.total_transactions.toLocaleString("en-US")}</span>}
          sublabel="معاملة على مدار 26 سنة"
          icon={Activity}
          variant="primary"
        />
        <KpiCard
          label="إجمالي الوارد"
          value={formatSAR(kpis.total_incoming_amount, { compact: true })}
          sublabel={`${kpis.total_incoming_count.toLocaleString("en-US")} معاملة واردة`}
          icon={ArrowDownToLine}
          variant="success"
        />
        <KpiCard
          label="إجمالي الصادر"
          value={formatSAR(kpis.total_outgoing_amount, { compact: true })}
          sublabel={`${kpis.total_outgoing_count.toLocaleString("en-US")} معاملة صادرة`}
          icon={ArrowUpFromLine}
          variant="danger"
        />
        <KpiCard
          label="صافي التدفق"
          value={formatSAR(kpis.net_flow, { sign: true })}
          sublabel="الفرق بين الوارد والصادر"
          icon={Wallet}
          variant={kpis.net_flow >= 0 ? "success" : "danger"}
        />
        <KpiCard
          label="الرصيد النهائي"
          value={formatSAR(kpis.final_balance, { compact: false })}
          sublabel="آخر رصيد مسجل"
          icon={Banknote}
          variant="gold"
        />
        <KpiCard
          label="أعلى رصيد"
          value={formatSAR(kpis.max_balance, { compact: true })}
          sublabel="الذروة في تاريخ الحساب"
          icon={TrendingUp}
          variant="success"
        />
        <KpiCard
          label="متوسط الرصيد"
          value={formatSAR(kpis.avg_balance, { compact: true })}
          sublabel="عبر جميع المعاملات"
          icon={Layers}
          variant="primary"
        />
        <KpiCard
          label="أدنى رصيد"
          value={formatSAR(kpis.min_balance, { compact: true })}
          sublabel="أقل رصيد مسجل"
          icon={TrendingDown}
          variant="danger"
        />
      </div>

      {/* Balance History Chart */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="تطور الرصيد عبر الزمن"
          subtitle="مسار الرصيد عبر 26 سنة من المعاملات"
          icon={TrendingUp}
        />
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balance_history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.16 160)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.55 0.16 160)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                tickFormatter={(v) => v?.substring(0, 7)}
                minTickGap={50}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                width={50}
              />
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                cursor={TOOLTIP_CURSOR_STYLE}
                formatter={(v: any) => [formatSAR(v), "الرصيد"]}
                labelFormatter={(v) => `التاريخ: ${formatDateAr(v)}`}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="oklch(0.55 0.16 160)"
                strokeWidth={2}
                fill="url(#balanceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Yearly In/Out Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="الوارد والصادر سنوياً"
            subtitle="مقارنة التدفقات السنوية بالريال السعودي"
            icon={BarChart3}
          />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyChart} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                  tickFormatter={(v) => `'${String(v).slice(2)}`}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  width={50}
                />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  cursor={TOOLTIP_CURSOR_STYLE}
                  formatter={(v: any, n: string) => [formatSAR(v), n === "inbound" ? "وارد" : "صادر"]}
                  labelFormatter={(v) => `سنة ${v}`}
                />
                <Legend
                  formatter={(v) => (v === "inbound" ? "وارد" : "صادر")}
                  wrapperStyle={{ fontSize: "12px", fontFamily: "var(--font-cairo)" }}
                />
                <Bar dataKey="inbound" fill="oklch(0.55 0.16 160)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outbound" fill="oklch(0.65 0.18 25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أعلى الفئات إنفاقاً"
            subtitle="توزيع المعاملات حسب الفئة"
            icon={Layers}
          />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  cursor={TOOLTIP_CURSOR_STYLE}
                  formatter={(v: any, _n: string, p: any) => [formatSAR(v), p.payload.name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", fontFamily: "var(--font-cairo)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Transaction Size Distribution */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="توزيع المعاملات حسب الحجم"
          subtitle="تصنيف المعاملات إلى كبيرة ومتوسطة وصغيرة"
          icon={Scale}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sizes.filter(s => s.total_count > 0).map((s, idx) => {
            const color = sizeColors[idx] || sizeColors[3];
            const pct = kpis.total_transactions > 0 ? (s.total_count / kpis.total_transactions) * 100 : 0;
            return (
              <div
                key={s.size}
                className="relative p-4 rounded-xl border border-border/60 bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-cairo font-bold text-base text-foreground">{s.size_ar}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.total_count.toLocaleString("en-US")} معاملة</p>
                  </div>
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: color }}
                  >
                    {pct.toFixed(0)}%
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">وارد</span>
                    <span className="font-cairo font-semibold text-success ltr-numbers">
                      {formatSAR(s.in_amount, { compact: true })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">صادر</span>
                    <span className="font-cairo font-semibold text-destructive ltr-numbers">
                      {formatSAR(s.out_amount, { compact: true })}
                    </span>
                  </div>
                  <div className="pt-1.5 mt-1.5 border-t border-border/60 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">الإجمالي</span>
                    <span className="font-cairo font-bold text-foreground ltr-numbers">
                      {formatSAR(s.total_amount, { compact: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="font-cairo">{label}</span>
      </div>
      <p className={`text-sm font-cairo font-semibold text-foreground truncate ${mono ? "ltr-numbers" : ""}`}>
        {value}
      </p>
    </div>
  );
}
