"use client";

import * as React from "react";
import {
  PieChart as PieChartIcon, TrendingUp, TrendingDown, Hash,
  DollarSign, Award, ChevronLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "./kpi-card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Analytics, formatSAR, categoryColor, categoryIconName } from "@/lib/analytics";
import * as LucideIcons from "lucide-react";

interface CategoriesProps {
  data: Analytics;
}

export function Categories({ data }: CategoriesProps) {
  const { categories } = data;
  const [selected, setSelected] = React.useState<string | null>(null);

  // Sorted by total amount
  const sorted = [...categories].sort((a, b) => b.total_amount - a.total_amount);
  const maxAmount = Math.max(...sorted.map(c => c.total_amount), 1);

  // Pie data
  const pieData = sorted.slice(0, 10).map((c) => ({
    name: c.category_ar,
    value: c.total_amount,
    color: categoryColor(c.category),
  }));

  const selectedCat = selected ? sorted.find(c => c.category === selected) : null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="h-4 w-4 text-primary" />
            <p className="text-xs font-cairo text-muted-foreground">عدد الفئات</p>
          </div>
          <p className="text-xl font-cairo font-bold text-foreground ltr-numbers">{categories.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-success" />
            <p className="text-xs font-cairo text-muted-foreground">أعلى فئة قيمة</p>
          </div>
          <p className="text-base font-cairo font-bold text-foreground truncate">{sorted[0]?.category_ar}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-gold" />
            <p className="text-xs font-cairo text-muted-foreground">أكثر فئة تكراراً</p>
          </div>
          <p className="text-base font-cairo font-bold text-foreground truncate">
            {[...categories].sort((a, b) => b.total_count - a.total_count)[0]?.category_ar}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-xs font-cairo text-muted-foreground">متوسط المعاملة</p>
          </div>
          <p className="text-xl font-cairo font-bold text-foreground ltr-numbers">
            {formatSAR(categories.reduce((s, c) => s + c.total_amount, 0) / categories.reduce((s, c) => s + c.total_count, 0), { compact: true })}
          </p>
        </Card>
      </div>

      {/* Pie chart */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="توزيع المعاملات حسب الفئة"
          subtitle="نسبة كل فئة من إجمالي المبالغ"
          icon={PieChartIcon}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={60}
                  paddingAngle={2}
                  label={({ name, percent }) => percent && percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
                  labelLine={false}
                  style={{ fontSize: "11px", fontFamily: "var(--font-cairo)" }}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.02 160)",
                    border: "1px solid oklch(0.3 0.05 160)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    color: "white",
                  }}
                  formatter={(v: any, _n: string, p: any) => [formatSAR(v), p.payload.name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pe-1">
            {sorted.slice(0, 10).map((c) => {
              const Icon = (LucideIcons as any)[categoryIconName(c.category)] || LucideIcons.CircleDashed;
              const color = categoryColor(c.category);
              const pct = (c.total_amount / sorted.reduce((s, x) => s + x.total_amount, 0)) * 100;
              return (
                <div key={c.category} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                      </div>
                      <span className="font-cairo font-medium truncate">{c.category_ar}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-cairo font-bold ltr-numbers">{formatSAR(c.total_amount, { compact: true })}</span>
                      <span className="text-muted-foreground ltr-numbers">({pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(c.total_amount / maxAmount) * 100}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Detailed categories table */}
      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="تفصيل جميع الفئات"
          subtitle="انقر على أي فئة لرؤية التفاصيل"
          icon={Hash}
        />
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-3 py-3 text-right font-cairo font-semibold text-muted-foreground">الفئة</th>
                <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground">عدد الوارد</th>
                <th className="px-3 py-3 text-center font-cairo font-semibold text-muted-foreground">عدد الصادر</th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">قيمة الوارد</th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">قيمة الصادر</th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">الإجمالي</th>
                <th className="px-3 py-3 text-left font-cairo font-semibold text-muted-foreground">المتوسط</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const Icon = (LucideIcons as any)[categoryIconName(c.category)] || LucideIcons.CircleDashed;
                const color = categoryColor(c.category);
                const isSelected = selected === c.category;
                return (
                  <React.Fragment key={c.category}>
                    <tr
                      className={`border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer ${isSelected ? "bg-primary/5" : ""}`}
                      onClick={() => setSelected(isSelected ? null : c.category)}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}>
                            <Icon className="h-4 w-4" style={{ color }} />
                          </div>
                          <span className="font-cairo font-semibold text-foreground">{c.category_ar}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-cairo ltr-numbers">
                          {c.in_count.toLocaleString("en-US")}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-cairo ltr-numbers">
                          {c.out_count.toLocaleString("en-US")}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-left font-cairo font-semibold text-success ltr-numbers">
                        {formatSAR(c.in_amount, { compact: true })}
                      </td>
                      <td className="px-3 py-3 text-left font-cairo font-semibold text-destructive ltr-numbers">
                        {formatSAR(c.out_amount, { compact: true })}
                      </td>
                      <td className="px-3 py-3 text-left font-cairo font-bold text-foreground ltr-numbers">
                        {formatSAR(c.total_amount, { compact: true })}
                      </td>
                      <td className="px-3 py-3 text-left font-cairo text-foreground ltr-numbers">
                        {formatSAR(c.avg_amount)}
                      </td>
                      <td className="px-3 py-3 text-left">
                        <ChevronLeft className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "-rotate-90" : ""}`} />
                      </td>
                    </tr>
                    {isSelected && selectedCat && (
                      <tr>
                        <td colSpan={8} className="px-3 py-4 bg-muted/20 border-b border-border/40">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <DetailBox label="إجمالي المعاملات" value={selectedCat.total_count.toLocaleString("en-US")} />
                            <DetailBox label="نسبة من الإجمالي" value={`${((selectedCat.total_amount / sorted.reduce((s, x) => s + x.total_amount, 0)) * 100).toFixed(2)}%`} />
                            <DetailBox label="نسبة الوارد" value={`${selectedCat.total_count > 0 ? ((selectedCat.in_count / selectedCat.total_count) * 100).toFixed(1) : 0}%`} />
                            <DetailBox label="نسبة الصادر" value={`${selectedCat.total_count > 0 ? ((selectedCat.out_count / selectedCat.total_count) * 100).toFixed(1) : 0}%`} />
                            <DetailBox label="أعلى معاملة واردة" value={formatSAR(selectedCat.in_amount / Math.max(1, selectedCat.in_count))} />
                            <DetailBox label="أعلى معاملة صادرة" value={formatSAR(selectedCat.out_amount / Math.max(1, selectedCat.out_count))} />
                            <DetailBox label="صافي التدفق" value={formatSAR(selectedCat.in_amount - selectedCat.out_amount, { sign: true })} />
                            <DetailBox label="المتوسط العام" value={formatSAR(selectedCat.avg_amount)} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
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
