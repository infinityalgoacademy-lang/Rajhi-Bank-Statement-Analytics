/**
 * Types and data loader for Al Rajhi bank statement analytics.
 */

export interface AccountInfo {
  name?: string;
  name_ar?: string;
  iban?: string;
  country?: string;
  country_ar?: string;
  branch_code?: string;
  branch_name?: string;
  beginning_balance?: number;
  period_from?: string;
  period_to?: string;
}

export interface Transaction {
  page: number;
  seq_in_page?: number;
  reference_number?: string | null;
  raw_text_block?: string;
  balance_after: number | null;
  debit: number | null;
  credit: number | null;
  description: string;
  description_full?: string;
  date_greg: string | null;
  date_greg_raw: string;
  date_hijri?: string | null;
  date_hijri_raw: string;
  category: string;
  category_ar: string;
  direction: "in" | "out" | "unknown";
  amount: number | null;
  year?: number | null;
  month?: number | null;
  year_month?: string | null;
  size?: "large" | "medium" | "small" | "unknown";
}

export interface TransactionData {
  account_info: AccountInfo;
  transactions: Transaction[];
  page_summaries: any[];
  stats: {
    total_transactions: number;
    total_outgoing: number;
    total_incoming: number;
    total_outgoing_amount: number;
    total_incoming_amount: number;
    first_page: number;
    last_page: number;
  };
}

export interface KPIs {
  total_transactions: number;
  total_outgoing_count: number;
  total_incoming_count: number;
  total_outgoing_amount: number;
  total_incoming_amount: number;
  net_flow: number;
  avg_outgoing: number;
  avg_incoming: number;
  beginning_balance: number;
  final_balance: number | null;
  max_balance: number;
  min_balance: number;
  avg_balance: number;
  active_years: number;
  active_months: number;
  period_from: string | null;
  period_to: string | null;
  active_years_list: number[];
}

export interface YearlyDatum {
  year: number;
  in_count: number;
  out_count: number;
  in_amount: number;
  out_amount: number;
  net: number;
  total_count: number;
}

export interface MonthlyDatum {
  year_month: string;
  year: number;
  month: number;
  month_name_ar: string;
  month_name_en: string;
  in_count: number;
  out_count: number;
  in_amount: number;
  out_amount: number;
  net: number;
  total_count: number;
}

export interface CategoryDatum {
  category: string;
  category_ar: string;
  in_count: number;
  out_count: number;
  in_amount: number;
  out_amount: number;
  total_amount: number;
  total_count: number;
  avg_amount: number;
}

export interface SizeDatum {
  size: string;
  size_ar: string;
  in_count: number;
  out_count: number;
  in_amount: number;
  out_amount: number;
  total_count: number;
  total_amount: number;
}

export interface DayOfWeekDatum {
  dow: number;
  dow_ar: string;
  dow_en: string;
  in_count: number;
  out_count: number;
  in_amount: number;
  out_amount: number;
  total_count: number;
}

export interface RecurringDatum {
  description: string;
  count: number;
  total_amount: number;
}

export interface MiniTransaction {
  date_greg: string | null;
  amount: number | null;
  description: string;
  category: string;
  category_ar: string;
  balance_after: number | null;
}

export interface BalancePoint {
  date: string;
  balance: number;
  page: number;
}

export interface YoYGrowth {
  year: number;
  prev_year: number;
  total_amount: number;
  prev_total_amount: number;
  growth_pct: number;
}

export interface BusiestDay {
  date: string;
  count: number;
  in_amount: number;
  out_amount: number;
  total_volume?: number;
}

export interface Analytics {
  account_info: AccountInfo;
  kpis: KPIs;
  yearly: YearlyDatum[];
  monthly: MonthlyDatum[];
  categories: CategoryDatum[];
  sizes: SizeDatum[];
  day_of_week: DayOfWeekDatum[];
  month_pattern: DayOfWeekDatum[];
  top_recurring_in: RecurringDatum[];
  top_recurring_out: RecurringDatum[];
  largest_outgoing: MiniTransaction[];
  largest_incoming: MiniTransaction[];
  smallest_outgoing: MiniTransaction[];
  smallest_incoming: MiniTransaction[];
  balance_history: BalancePoint[];
  yoy_growth: YoYGrowth[];
  busiest_days: BusiestDay[];
  largest_volume_days: BusiestDay[];
}

// ===== Names Analysis Types =====

export interface NameSampleTx {
  date_greg: string | null;
  amount: number | null;
  description: string;
  category: string;
  category_ar: string;
  page?: number | null;
  seq_in_page?: number | null;
  reference_number?: string | null;
  date_hijri?: string | null;
  balance_after?: number | null;
  direction?: 'in' | 'out' | 'unknown';
  description_full?: string;
  raw_text_block?: string;
}

export interface NameEntry {
  name: string;
  name_normalized: string;
  language: 'ar' | 'en';
  direction: 'in' | 'out';
  count: number;
  total_amount: number;
  avg_amount: number;
  first_date: string | null;
  last_date: string | null;
  categories: string[];
  pages?: number[];
  page_count?: number;
  sample_transactions: NameSampleTx[];
  transactions?: NameSampleTx[];
}

export interface BothDirectionEntry {
  name: string;
  name_normalized: string;
  language: 'ar' | 'en';
  in_count: number;
  out_count: number;
  in_amount: number;
  out_amount: number;
  total_amount: number;
  net: number;
  first_date: string | null;
  last_date: string | null;
  pages?: number[];
  page_count?: number;
  transactions?: NameSampleTx[];
}

export interface NamesData {
  summary: {
    total_unique_names: number;
    incoming_names_count: number;
    outgoing_names_count: number;
    both_directions_count: number;
    matched_transactions: number;
    no_name_transactions: number;
    total_incoming_amount: number;
    total_outgoing_amount: number;
  };
  incoming_names: NameEntry[];
  outgoing_names: NameEntry[];
  both_directions: BothDirectionEntry[];
  all_names: NameEntry[];
}

/**
 * Format a number as Saudi Riyal currency in Arabic.
 */
export function formatSAR(amount: number | null | undefined, options?: { compact?: boolean; sign?: boolean }): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  const sign = options?.sign && amount > 0 ? "+" : "";
  if (options?.compact) {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) return `${sign}${(amount / 1_000_000).toFixed(2)} م ر.س`;
    if (abs >= 1_000) return `${sign}${(amount / 1_000).toFixed(1)} ألف ر.س`;
  }
  return `${sign}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
}

/**
 * Format a number compactly (K, M).
 */
export function formatCompact(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return "—";
  const abs = Math.abs(num);
  if (abs >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format a date YYYY-MM-DD to Arabic display.
 */
export function formatDateAr(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const [y, m, d] = dateStr.split("-");
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  } catch {
    return dateStr;
  }
}

/**
 * Map category key to Lucide icon name.
 */
export function categoryIconName(category: string): string {
  const map: Record<string, string> = {
    cash_deposit: "Banknote",
    atm_withdrawal: "Banknote",
    cheque: "ScrollText",
    sarie_transfer: "Send",
    ips_transfer: "Globe",
    local_transfer: "ArrowLeftRight",
    foreign_transfer: "Globe",
    card: "CreditCard",
    stc_bill: "Smartphone",
    electricity_bill: "Zap",
    water_bill: "Droplets",
    sadad: "ReceiptText",
    government: "Landmark",
    salary: "Wallet",
    refund: "Undo2",
    ipo: "TrendingUp",
    fees: "Percent",
    loan: "HandCoins",
    insurance: "ShieldCheck",
    charity: "HeartHandshake",
    dividends: "Percent",
    other: "CircleDashed",
  };
  return map[category] || "CircleDashed";
}

/**
 * Get category color (hex/oklch).
 */
export function categoryColor(category: string): string {
  const map: Record<string, string> = {
    cash_deposit: "oklch(0.55 0.16 160)",
    atm_withdrawal: "oklch(0.65 0.18 25)",
    cheque: "oklch(0.55 0.13 280)",
    sarie_transfer: "oklch(0.6 0.14 200)",
    ips_transfer: "oklch(0.55 0.18 250)",
    local_transfer: "oklch(0.55 0.14 180)",
    foreign_transfer: "oklch(0.55 0.18 300)",
    card: "oklch(0.65 0.15 75)",
    stc_bill: "oklch(0.55 0.16 200)",
    electricity_bill: "oklch(0.7 0.2 75)",
    water_bill: "oklch(0.6 0.15 230)",
    sadad: "oklch(0.55 0.13 150)",
    government: "oklch(0.5 0.05 60)",
    salary: "oklch(0.6 0.18 140)",
    refund: "oklch(0.7 0.15 160)",
    ipo: "oklch(0.65 0.2 50)",
    fees: "oklch(0.65 0.18 25)",
    loan: "oklch(0.55 0.15 320)",
    insurance: "oklch(0.55 0.15 250)",
    charity: "oklch(0.6 0.18 350)",
    dividends: "oklch(0.7 0.18 100)",
    other: "oklch(0.6 0.02 160)",
  };
  return map[category] || "oklch(0.6 0.02 160)";
}
