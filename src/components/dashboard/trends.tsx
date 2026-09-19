"use client";

import * as React from "react";
import {
  TrendingUp, Calendar, Activity, BarChart3, LineChart as LineIcon,
  Flame, ArrowUp, ArrowDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "./kpi-card";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Legend, AreaChart, Area,
} from "recharts";
import { Analytics, formatSAR, formatDateAr } from "@/lib/analytics";
import { TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, TOOLTIP_CURSOR_STYLE } from "@/lib/chart-tooltip";

interface TrendsProps {
  data: Analytics;
}

export function Trends({ data }: TrendsProps) {
  const { yearly, monthly, day_of_week, month_pattern, balance_history, yoy_growth, busiest_days, largest_volume_days } = data;

  // Year-over-year growth
  const yoyChart = yoy_growth.map((y) => ({
    year: y.year,
    growth: y.growth_pct,
    total: y.total_amount,
  }));

  // Day of week pattern
  const dowChart = day_of_week.map((d) => ({
    name: d.dow_ar,
    in_amount: d.in_amount,
    out_amount: d.out_amount,
    total_count: d.total_count,
  }));

  // Month-of-year pattern (all years aggregated)
  const monthChart = month_pattern.map((m) => ({
    name: m.month_name_ar,
    in_amount: m.in_amount,
    out_amount: m.out_amount,
    total_count: m.total_count,
  }));

  // Cumulative net flow
  const cumulativeData = yearly.reduce<{ year: number; cumulative: number; net: number }[]>((arr, y) => {
    const prev = arr.length > 0 ? arr[arr.length - 1].cumulative : 0;
    arr.push({ year: y.year, cumulative: Number((prev + y.net).toFixed(2)), net: y.net });
    return arr;
  }, []);

  // Busiest days
  const busiestChart = busiest_days.map((d) => ({
    date: d.date,
    count: d.count,
    in_amount: d.in_amount,
    out_amount: d.out_amount,
  }));

  // Peak year
  const peakYear = yearly.reduce((max, y) => y.total_count > max.total_count ? y : max, yearly[0]);
  const peakVolumeYear = yearly.reduce((max, y) => (y.in_amount + y.out_amount) > (max.in_amount + max.out_amount) ? y : max, yearly[0]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-destructive" />
            <p className="text-xs font-cairo text-muted-foreground">أكثر سنة نشاطاً</p>
          </div>
          <p className="text-xl font-cairo font-bold text-foreground ltr-numbers">{peakYear.year}</p>
          <p className="text-[11px] text-muted-foreground font-cairo">{peakYear.total_count.toLocaleString("en-US")} معاملة</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-gold" />
            <p className="text-xs font-cairo text-muted-foreground">أعلى سنة حجماً</p>
          </div>
          <p className="text-xl font-cairo font-bold text-foreground ltr-numbers">{peakVolumeYear.year}</p>
          <p className="text-[11px] text-muted-foreground font-cairo">
            {formatSAR(peakVolumeYear.in_amount + peakVolumeYear.out_amount, { compact: true })}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-primary" />
            <p className="text-xs font-cairo text-muted-foreground">أكثر يوم ازدحاماً</p>
          </div>
          <p className="text-sm font-cairo font-bold text-foreground ltr-numbers">{formatDateAr(busiest_days[0]?.date)}</p>
          <p className="text-[11px] text-muted-foreground font-cairo">{busiest_days[0]?.count.toLocaleString("en-US")} معاملة</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-success" />
            <p className="text-xs font-cairo text-muted-foreground">أشهر نشطة</p>
          </div>
          <p className="text-xl font-cairo font-bold text-foreground ltr-numbers">{monthly.length}</p>
          <p className="text-[11px] text-muted-foreground font-cairo">شهر عبر السنوات</p>
        </Card>
      </div>

      {/* Yearly transaction count + volume */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="تطور عدد المعاملات والمبالغ سنوياً"
          subtitle="عدد المعاملات والإجمالي السنوي"
          icon={TrendingUp}
        />
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearly} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                width={50}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                width={45}
              />
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                cursor={TOOLTIP_CURSOR_STYLE}
                formatter={(v: any, n: string) => {
                  if (n === "total_count") return [`${v.toLocaleString("en-US")} معاملة`, "عدد المعاملات"];
                  return [formatSAR(v), n === "in_amount" ? "وارد" : "صادر"];
                }}
                labelFormatter={(v) => `سنة ${v}`}
              />
              <Legend
                formatter={(v) => v === "total_count" ? "عدد المعاملات" : v === "in_amount" ? "وارد" : "صادر"}
                wrapperStyle={{ fontSize: "12px", fontFamily: "var(--font-cairo)" }}
              />
              <Bar yAxisId="left" dataKey="in_amount" fill="oklch(0.55 0.16 160)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="out_amount" fill="oklch(0.65 0.18 25)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="total_count" stroke="oklch(0.78 0.15 80)" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cumulative net flow */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="التدفق التراكمي عبر السنوات"
          subtitle="صافي التدفق المتراكم سنة بعد سنة"
          icon={LineIcon}
        />
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cumulGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.78 0.15 80)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.78 0.15 80)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                width={55}
              />
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                cursor={TOOLTIP_CURSOR_STYLE}
                formatter={(v: any, n: string) => [formatSAR(v), n === "cumulative" ? "التراكمي" : "صافي السنة"]}
                labelFormatter={(v) => `سنة ${v}`}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="oklch(0.78 0.15 80)"
                strokeWidth={2.5}
                fill="url(#cumulGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* YoY growth */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="معدل النمو السنوي (Year-over-Year)"
          subtitle="نسبة التغير في إجمالي المبالغ مقارنة بالسنة السابقة"
          icon={Activity}
        />
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yoyChart} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                tickFormatter={(v) => `${v}%`}
                width={55}
              />
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                cursor={TOOLTIP_CURSOR_STYLE}
                formatter={(v: any, n: string) => {
                  if (n === "growth") return [`${v}%`, "النمو"];
                  return [formatSAR(v), "الإجمالي"];
                }}
                labelFormatter={(v) => `سنة ${v}`}
              />
              <Bar
                dataKey="growth"
                radius={[4, 4, 0, 0]}
              >
                {yoyChart.map((d, i) => (
                  <Cell key={i} fill={d.growth >= 0 ? "oklch(0.55 0.16 160)" : "oklch(0.65 0.18 25)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Day of week pattern */}
        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="النمط الأسبوعي"
            subtitle="توزيع المعاملات حسب يوم الأسبوع"
            icon={Calendar}
          />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowChart} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "oklch(0.5 0.02 160)", fontFamily: "var(--font-cairo)" }}
                  width={70}
                />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  cursor={TOOLTIP_CURSOR_STYLE}
                  formatter={(v: any, n: string) => [formatSAR(v), n === "in_amount" ? "وارد" : "صادر"]}
                />
                <Legend
                  formatter={(v) => (v === "in_amount" ? "وارد" : "صادر")}
                  wrapperStyle={{ fontSize: "12px", fontFamily: "var(--font-cairo)" }}
                />
                <Bar dataKey="in_amount" fill="oklch(0.55 0.16 160)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="out_amount" fill="oklch(0.65 0.18 25)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Month of year pattern */}
        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="النمط الشهري"
            subtitle="توزيع المعاملات حسب الشهر (مجموع كل السنوات)"
            icon={Calendar}
          />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthChart} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0.02 160 / 0.2)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.02 160)", fontFamily: "var(--font-cairo)" }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
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
      </div>

      {/* Busiest days & largest volume days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أكثر الأيام ازدحاماً"
            subtitle="أعلى الأيام من حيث عدد المعاملات"
            icon={Flame}
          />
          <div className="space-y-2">
            {busiest_days.slice(0, 8).map((d, i) => (
              <div key={d.date} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-cairo font-bold text-xs">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-cairo font-semibold text-foreground ltr-numbers">{formatDateAr(d.date)}</p>
                    <p className="text-[11px] text-muted-foreground">{d.count} معاملة</p>
                  </div>
                </div>
                <div className="text-end shrink-0 flex items-center gap-2">
                  {d.in_amount > 0 && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-cairo ltr-numbers text-xs">
                      <ArrowDown className="h-3 w-3 ml-0.5" />
                      {formatSAR(d.in_amount, { compact: true })}
                    </Badge>
                  )}
                  {d.out_amount > 0 && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-cairo ltr-numbers text-xs">
                      <ArrowUp className="h-3 w-3 ml-0.5" />
                      {formatSAR(d.out_amount, { compact: true })}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="أعلى الأيام حجماً"
            subtitle="أعلى الأيام من حيث إجمالي المبالغ"
            icon={BarChart3}
          />
          <div className="space-y-2">
            {largest_volume_days.slice(0, 8).map((d, i) => (
              <div key={d.date} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-gold/15 text-gold flex items-center justify-center font-cairo font-bold text-xs">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-cairo font-semibold text-foreground ltr-numbers">{formatDateAr(d.date)}</p>
                    <p className="text-[11px] text-muted-foreground">{d.count} معاملة</p>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="font-cairo font-bold text-gold ltr-numbers text-sm">
                    {formatSAR(d.total_volume, { compact: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Need to import Cell from recharts
import { Cell } from "recharts";
