"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "gold" | "primary";
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}

const variantStyles: Record<string, { iconBg: string; iconColor: string; accent: string }> = {
  default: { iconBg: "bg-muted", iconColor: "text-foreground", accent: "text-foreground" },
  success: { iconBg: "bg-success/15", iconColor: "text-success", accent: "text-success" },
  warning: { iconBg: "bg-warning/15", iconColor: "text-warning", accent: "text-warning" },
  danger: { iconBg: "bg-destructive/15", iconColor: "text-destructive", accent: "text-destructive" },
  gold: { iconBg: "bg-gold/15", iconColor: "text-gold", accent: "text-gold" },
  primary: { iconBg: "bg-primary/15", iconColor: "text-primary", accent: "text-primary" },
};

export function KpiCard({ label, value, sublabel, icon: Icon, variant = "default", trend, className }: KpiCardProps) {
  const styles = variantStyles[variant] || variantStyles.default;
  return (
    <Card className={cn("relative p-4 sm:p-5 overflow-hidden card-lift shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-cairo text-xs sm:text-sm text-muted-foreground font-medium truncate">
            {label}
          </p>
          <p className={cn("mt-1.5 text-xl sm:text-2xl lg:text-[26px] font-cairo font-bold ltr-numbers leading-tight", styles.accent)}>
            {value}
          </p>
          {sublabel && (
            <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground truncate">
              {sublabel}
            </p>
          )}
          {trend && (
            <p className={cn(
              "mt-2 inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md",
              trend.direction === "up" && "bg-success/10 text-success",
              trend.direction === "down" && "bg-destructive/10 text-destructive",
              trend.direction === "neutral" && "bg-muted text-muted-foreground"
            )}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl", styles.iconBg)}>
          <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", styles.iconColor)} />
        </div>
      </div>
    </Card>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, icon: Icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
        <div>
          <h2 className="font-cairo text-lg sm:text-xl font-bold text-foreground leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
