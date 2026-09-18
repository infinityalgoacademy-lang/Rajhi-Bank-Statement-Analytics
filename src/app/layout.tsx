import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "لوحة تحليل كشف حساب الراجحي | Al Rajhi Statement Analytics",
  description: "لوحة تحكم احترافية لتحليل كشف حساب بنك الراجحي بعمق - جميع المعاملات الصادرة والواردة مع تحليلات تفصيلية",
  keywords: ["الراجحي", "كشف حساب", "تحليل مالي", "Al Rajhi", "Bank Statement", "Analytics"],
  authors: [{ name: "Al Rajhi Analytics" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "لوحة تحليل كشف حساب الراجحي",
    description: "تحليل عميق لجميع المعاملات الصادرة والواردة",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${tajawal.variable} antialiased bg-background text-foreground font-tajawal`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
