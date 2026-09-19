# Rajhi Bank Statement Analytics | لوحة تحليل كشف حساب الراجحي

A professional Arabic RTL dashboard for deep analysis of Al Rajhi bank statements. Built with Next.js 16, TypeScript, Tailwind CSS 4, and shadcn/ui.

لوحة تحكم احترافية لتحليل كشف حساب بنك الراجحي بعمق - تستخرج جميع المعاملات الصادرة والواردة من ملف PDF وتعرضها مع تحليلات تفصيلية.

## Features | المميزات

- **7 تحليلات تفصيلية**: نظرة عامة، الوارد والصادر، سجل المعاملات، الأسماء، التصنيفات، الاتجاهات الزمنية، التحليل العميق، والأحجام
- **استخراج المعاملات**: يدعم استخراج 5,796+ معاملة من 685 صفحة PDF
- **تحليل الأسماء**: استخراج 733 اسم فريد مع كل معاملاتهم وأرقام صفحاتهم
- **النص الأصلي من PDF**: عرض كل معاملة بنصها الأصلي كما يظهر في كشف الحساب
- **أرقام مرجعية**: استخراج 2,294 رقم مرجعي (IPS، سداد، شيكات، إلخ)
- **Tooltips احترافية**: خلفية بيضاء بدعم RTL كامل
- **نظام تسجيل دخول**: حماية كاملة للوحات التحكم
- **وضع ليلي/نهاري**: دعم كامل للثيمات
- **تصميم متجاوب**: يعمل على جميع الأحجام

## Tech Stack | التقنيات

- Next.js 16 with App Router
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui (New York style)
- Recharts for visualizations
- PyMuPDF for PDF extraction
- Lucide React for icons
- Cairo + Tajawal Arabic fonts

## Getting Started | البدء

### Prerequisites

- Node.js 18+
- Python 3.10+ (for PDF extraction)
- bun (package manager)

### Installation

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Push database schema
bun run db:push

# Start development server
bun run dev
```

### Generating Analytics Data

The dashboard requires pre-generated JSON files. Place your bank statement PDF in `upload/` folder, then run:

```bash
# Extract all transactions from PDF
python3 scripts/extract_transactions.py

# Enhance transactions with reference numbers and raw PDF text
python3 scripts/enhance_transactions.py

# Fix reversed Arabic text in raw blocks
python3 scripts/fix_arabic_text.py

# Build aggregated analytics
python3 scripts/build_analytics.py

# Extract and enhance names data
python3 scripts/extract_names.py
python3 scripts/enhance_names.py

# Copy generated files to public/
cp scripts/transactions_enhanced.json public/transactions.json
# analytics.json and names.json are already in public/
```

### Default Login | بيانات الدخول الافتراضية

```
Email: mr.msf515@gmail.com
Password: mr.msf515
```

> **Note**: Change these credentials in `src/lib/auth.ts` before deploying to production.

## Project Structure | هيكل المشروع

```
src/
├── app/
│   ├── layout.tsx          # Root layout with RTL & Arabic fonts
│   ├── page.tsx            # Main dashboard with auth gate
│   └── globals.css         # Theme & global styles
├── components/
│   ├── dashboard/
│   │   ├── header.tsx              # Top header with user menu
│   │   ├── tabs-nav.tsx            # Navigation tabs
│   │   ├── login-page.tsx          # Login page
│   │   ├── overview.tsx            # Overview tab
│   │   ├── flow.tsx                # Inflow/Outflow analysis
│   │   ├── transactions-table.tsx  # Transactions table with detail dialog
│   │   ├── names-analyzer.tsx      # Names analysis with full transaction history
│   │   ├── categories.tsx          # Category breakdown
│   │   ├── trends.tsx              # Time trends
│   │   ├── deep-analysis.tsx       # Deep financial insights
│   │   ├── sizes.tsx               # Transaction size distribution
│   │   └── kpi-card.tsx            # Shared KPI card component
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── analytics.ts        # TypeScript types & formatters
│   ├── auth.ts             # Authentication logic
│   ├── chart-tooltip.ts    # Shared chart tooltip styles
│   └── db.ts               # Prisma client
scripts/
├── extract_transactions.py  # Extract transactions from PDF
├── enhance_transactions.py  # Add reference numbers & raw text
├── fix_arabic_text.py       # Fix reversed Arabic in raw text
├── build_analytics.py       # Build aggregated analytics
├── extract_names.py         # Extract names from descriptions
└── enhance_names.py         # Add full transaction history per name
```

## Security Notes | ملاحظات أمنية

- **Never commit** the PDF bank statement or generated JSON files (they're in .gitignore)
- The auth system uses client-side localStorage (suitable for demo, not production)
- For production deployment, use proper server-side authentication (NextAuth.js recommended)
- The IBAN and account holder name appear in `account_info` - handle with care

## License | الترخيص

MIT License - see [LICENSE](LICENSE) file for details.

## Author | المطور

Built for analyzing Al Rajhi bank statements with deep financial insights.
