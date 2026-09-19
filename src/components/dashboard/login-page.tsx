"use client";

import * as React from "react";
import {
  Building2, Lock, Mail, Eye, EyeOff, ShieldCheck, Loader2,
  AlertCircle, ArrowLeft, Sparkles, BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { validateCredentials, saveSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface LoginPageProps {
  onSuccess: (email: string) => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("صيغة البريد الإلكتروني غير صحيحة");
      return;
    }

    setLoading(true);

    // Simulate brief loading for UX
    setTimeout(() => {
      if (validateCredentials(email, password)) {
        saveSession(email.trim());
        onSuccess(email.trim());
      } else {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div className="min-h-screen w-full flex items-stretch bg-background">
      {/* Left side - Brand panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary to-emerald-800">
        {/* Decorative shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-gold/30 blur-3xl"></div>
          <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full bg-white/20 blur-3xl"></div>
          <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-emerald-300/20 blur-3xl"></div>
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Top brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-cairo text-xl font-bold leading-tight">لوحة تحليل الراجحي</h2>
              <p className="text-xs text-white/70 leading-tight">Al Rajhi Statement Analytics</p>
            </div>
          </div>

          {/* Center hero */}
          <div className="space-y-6 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-cairo">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span>تحليل مالي متقدم · 26 سنة من البيانات</span>
            </div>
            <h1 className="font-cairo text-4xl xl:text-5xl font-bold leading-tight">
              تحليل عميق لكشف حسابك البنكي
            </h1>
            <p className="text-white/80 font-cairo text-base leading-relaxed">
              منصة احترافية تستخرج جميع المعاملات الصادرة والواردة من ملف كشف الحساب،
              مع رسوم بيانية تفاعلية، تصنيفات ذكية، وتحليلات معمقة لكل اسم وفئة ومعاملة.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <BrandStat icon={BarChart3} value="5,796" label="معاملة" />
              <BrandStat icon={Building2} value="685" label="صفحة PDF" />
              <BrandStat icon={ShieldCheck} value="26" label="سنة بيانات" />
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-2 text-xs text-white/60 font-cairo">
            <ShieldCheck className="h-4 w-4" />
            <span>منطقة محمية · جميع البيانات سرية</span>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-cairo text-lg font-bold leading-tight text-foreground">لوحة تحليل الراجحي</h2>
              <p className="text-[11px] text-muted-foreground leading-tight">Al Rajhi Statement Analytics</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-cairo text-primary mb-2">
              <Lock className="h-3.5 w-3.5" />
              <span>منطقة محمية</span>
            </div>
            <h1 className="font-cairo text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              تسجيل الدخول
            </h1>
            <p className="text-sm text-muted-foreground font-cairo leading-relaxed">
              أدخل بيانات الدخول للوصول إلى لوحات التحكم والتحليلات المالية.
              لا يمكن عرض البيانات إلا للمستخدمين المخولين.
            </p>
          </div>

          <Card className="p-6 sm:p-7 shadow-lg border-border/60">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-cairo text-sm font-semibold text-foreground">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                    dir="ltr"
                    className="pr-9 pl-3 font-cairo text-left"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="font-cairo text-sm font-semibold text-foreground">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    dir="ltr"
                    className="pr-9 pl-9 font-cairo text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive animate-fade-in-up">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm font-cairo">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 font-cairo font-semibold text-sm bg-primary hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جارٍ التحقق...
                  </>
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4 ml-2" />
                    دخول إلى لوحة التحكم
                  </>
                )}
              </Button>
            </form>

            {/* Security note */}
            <div className="mt-5 pt-5 border-t border-border/60 flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-cairo">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              <span>محمي بتشفير جلسة لمدة 24 ساعة</span>
            </div>
          </Card>

          <p className="text-center text-xs text-muted-foreground font-cairo leading-relaxed">
            جميع البيانات في هذه المنصة سرية ومحمية.
            <br />
            محاولة الوصول غير المصرح بها مخالفة للقانون.
          </p>
        </div>
      </div>
    </div>
  );
}

function BrandStat({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-3">
      <Icon className="h-4 w-4 text-gold mb-1.5" />
      <p className="text-xl font-cairo font-bold ltr-numbers leading-tight">{value}</p>
      <p className="text-[10px] text-white/70 font-cairo">{label}</p>
    </div>
  );
}
