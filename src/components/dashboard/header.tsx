"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Moon, Sun, Building2, FileSpreadsheet, LogOut, User, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onLogout: () => void;
  userEmail: string;
}

export function Header({ onLogout, userEmail }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Mask email for display: m***5@gmail.com
  const maskedEmail = React.useMemo(() => {
    if (!userEmail) return "";
    const [name, domain] = userEmail.split("@");
    if (!domain) return userEmail;
    if (name.length <= 3) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  }, [userEmail]);

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

          {/* Theme toggle */}
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

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2 sm:px-3 gap-1.5 hover:bg-secondary">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="hidden sm:inline text-xs font-cairo text-muted-foreground ltr-numbers">
                  {maskedEmail}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-cairo">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">البريد الإلكتروني</span>
                  <span className="text-sm font-medium ltr-numbers" dir="ltr">{userEmail}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="font-cairo text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
