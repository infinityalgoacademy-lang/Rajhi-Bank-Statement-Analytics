"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Building2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-cairo text-base font-bold leading-tight text-foreground">
              لوحة تحليل كشف حساب الراجحي
            </h1>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Al Rajhi Bank Statement Analytics
            </p>
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden md:flex gap-1.5 px-3 py-1.5 bg-secondary/50">
            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
            <span className="font-cairo text-xs">685 صفحة</span>
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="تبديل المظهر"
            className="h-9 w-9"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
