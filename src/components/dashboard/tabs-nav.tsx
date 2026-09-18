"use client";

import {
  LayoutDashboard,
  ArrowRightLeft,
  Table2,
  PieChart,
  TrendingUp,
  Microscope,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TABS: TabDef[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "flow", label: "الوارد والصادر", icon: ArrowRightLeft },
  { id: "transactions", label: "سجل المعاملات", icon: Table2 },
  { id: "categories", label: "التصنيفات", icon: PieChart },
  { id: "trends", label: "الاتجاهات الزمنية", icon: TrendingUp },
  { id: "deep", label: "التحليل العميق", icon: Microscope },
  { id: "sizes", label: "الكبير والصغير", icon: Wallet },
];

export function TabsNav({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <nav className="w-full overflow-x-auto hide-scrollbar border-b border-border/60 bg-background/60 backdrop-blur-sm">
      <div className="container mx-auto flex items-center gap-1 px-2 sm:px-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-cairo font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
