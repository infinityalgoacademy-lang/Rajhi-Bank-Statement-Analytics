"use client";

import * as React from "react";
import { Header } from "@/components/dashboard/header";
import { TabsNav } from "@/components/dashboard/tabs-nav";
import { Overview } from "@/components/dashboard/overview";
import { Flow } from "@/components/dashboard/flow";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { Categories } from "@/components/dashboard/categories";
import { Trends } from "@/components/dashboard/trends";
import { DeepAnalysis } from "@/components/dashboard/deep-analysis";
import { Sizes } from "@/components/dashboard/sizes";
import { NamesAnalyzer } from "@/components/dashboard/names-analyzer";
import { Analytics, Transaction, TransactionData, NamesData } from "@/lib/analytics";
import { Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [namesData, setNamesData] = React.useState<NamesData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load analytics (lightweight)
  React.useEffect(() => {
    fetch("/analytics.json")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load analytics");
        return r.json();
      })
      .then((data: Analytics) => {
        setAnalytics(data);
      })
      .catch((e) => {
        console.error(e);
        setError("تعذر تحميل بيانات التحليل");
      });
  }, []);

  // Load transactions (heavy) only when table tab is opened
  React.useEffect(() => {
    if (activeTab !== "transactions") return;
    if (transactions.length > 0) return;
    fetch("/transactions.json")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load transactions");
        return r.json();
      })
      .then((data: TransactionData) => {
        setTransactions(data.transactions);
      })
      .catch((e) => {
        console.error(e);
        setError("تعذر تحميل المعاملات");
      });
  }, [activeTab, transactions.length]);

  // Load names data only when names tab is opened
  React.useEffect(() => {
    if (activeTab !== "names") return;
    if (namesData) return;
    fetch("/names.json")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load names");
        return r.json();
      })
      .then((data: NamesData) => {
        setNamesData(data);
      })
      .catch((e) => {
        console.error(e);
        setError("تعذر تحميل بيانات الأسماء");
      });
  }, [activeTab, namesData]);

  React.useEffect(() => {
    if (analytics) setLoading(false);
  }, [analytics]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="font-cairo text-sm text-muted-foreground">جارٍ تحليل 685 صفحة من بيانات كشف الحساب...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-6 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h2 className="font-cairo text-lg font-bold text-foreground mb-1">حدث خطأ</h2>
          <p className="text-sm text-muted-foreground font-cairo">{error || "تعذر تحميل البيانات"}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <TabsNav active={activeTab} onChange={setActiveTab} />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div key={activeTab} className="animate-fade-in-up">
          {activeTab === "overview" && <Overview data={analytics} />}
          {activeTab === "flow" && <Flow data={analytics} />}
          {activeTab === "transactions" && (
            transactions.length > 0 ? (
              <TransactionsTable transactions={transactions} />
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )
          )}
          {activeTab === "names" && (
            namesData ? (
              <NamesAnalyzer data={namesData} />
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="font-cairo text-sm text-muted-foreground ms-3">جارٍ تحليل الأسماء...</p>
              </div>
            )
          )}
          {activeTab === "categories" && <Categories data={analytics} />}
          {activeTab === "trends" && <Trends data={analytics} />}
          {activeTab === "deep" && <DeepAnalysis data={analytics} />}
          {activeTab === "sizes" && <Sizes data={analytics} />}
        </div>
      </main>

      <footer className="mt-auto border-t border-border/60 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground font-cairo">
          <p>
            لوحة تحليل كشف حساب الراجحي · {analytics.kpis.total_transactions.toLocaleString("en-US")} معاملة · {analytics.kpis.active_years} سنة
          </p>
          <p className="flex items-center gap-2">
            <span>الفترة:</span>
            <span className="ltr-numbers">{analytics.kpis.period_from}</span>
            <span>←</span>
            <span className="ltr-numbers">{analytics.kpis.period_to}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
