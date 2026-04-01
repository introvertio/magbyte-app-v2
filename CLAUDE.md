# MagByte App — Project Instructions
# Location: ./CLAUDE.md (project root)
# Committed to git. Every developer who clones this repo gets these rules.

@README.md
@package.json

## What this project is
MagByte is a **global, multi-industry business analytics platform** for SME owners.
It turns raw business data (uploaded as CSV/Excel) into clear, actionable dashboards.

### Target market
**ICP today:** Nigerian SME owners — provision stores, retailers, food businesses, artisans.
**Long-term:** Any small business owner, anywhere in the world, in any industry.
The platform starts with Nigerian SMEs because that is where the founding team has the deepest context. The architecture must support global expansion from day one.

### Industry model
MagByte supports **12 core SME industries in Nigeria**, each with its own data templates and industry-specific KPIs. Every industry has three tiers:

| Tier | Who it is for | What data it uses |
|---|---|---|
| **Basic** | Just starting — 1 location, simple tracking | Sales + Product list (2–3 tabs) |
| **Intermediate** | Growing shop — regular customers, stock control | Adds Stock Movement, Expenses, Customer list |
| **Advanced** | Established / multi-branch | Adds Staff, Debt Management, Customer DB, Master Stock |

**The 12 industries (in order of build priority):**
1. Retail & Provision Stores ← **current ICP, built first**
2. Food & Restaurants (mama-put, bukka, fast food, catering)
3. Agriculture & Agro-Processing
4. Fashion & Tailoring
5. Beauty, Salon & Barber
6. Transport & Logistics
7. Education
8. Construction & Artisan Services
9. Health & Pharmacy
10. Manufacturing & Production
11. Events & Entertainment
12. Digital & Tech Services

Each industry has its own data template structure documented in:
`Cowork - MagByte/Context/All Templates.md` and the `Business Data Templates for the 12 Core SME Industries in Nigeria/` folder.

When building for a new industry, **always read that industry's template and guide first** before defining TypeScript interfaces or building UI.

### Currency
MagByte is a global product. Currency must be configurable per user account:
- Default for Nigerian users: **₦ (NGN)**
- Must support: **$ (USD)**, **€ (EUR)**, **£ (GBP)**, **KES**, **GHS**, **ZAR** and other major currencies
- **Never hardcode ₦ symbols or NGN formatting** — always use `formatCurrency(value, currency)` helper
- `formatCurrency` follows the same compact notation: 1,200,000 → 1.2M, 45,000 → 45K
- The user's currency preference is stored in their profile (not hardcoded anywhere)
- The `lib/utils.ts` `formatNaira()` function is **Retail-MVP only** — it will be replaced by `formatCurrency()` when multi-currency support is built. Do not use `formatNaira` in any new code written after this decision.

### Period filter system
The dashboard period filter must support granular date drilling — not just broad ranges.
The Zustand store `period` field and `useFilteredData` hook must be updated to support this
when the full date filter UI is built (scheduled — not yet implemented in code).

**Filter levels (planned, build in this order):**
| Filter | UI control | Description |
|---|---|---|
| **All** | Button (current) | Full dataset, no cutoff |
| **Year** | Dropdown — years available in data | e.g. 2023, 2024, 2025 |
| **Quarter** | Dropdown per year — Q1 / Q2 / Q3 / Q4 | Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec |
| **Month** | Dropdown — Jan to Dec (only months in data) | Single calendar month |
| **Week** | Dropdown — weeks in data (e.g. "Week 3, Jan 2025") | Mon–Sun ISO week |
| **Day** | Date picker / calendar | Single specific day |

**Implementation rules when building the filter UI:**
- Year, Quarter, Month, Week dropdowns must only show options that exist in the dataset — do not show empty periods
- Day picker must be anchored to the dataset date range (min/max from `metadata.date_range`)
- All filter controls live in the TopBar (global, persisted in Zustand)
- `PeriodFilter` type in `useDashboardStore` will expand to a discriminated union covering all levels
- `useFilteredData` hook must be updated to handle each level's cutoff logic
- Cockpit and Forecast pages always show full-dataset data regardless of filter — show an amber notice when a filter is active

## Stack
- Next.js 16 App Router (TypeScript)
- React 19
- Tailwind CSS v4 via PostCSS
- tailwind-merge for conditional classes
- TanStack React Query v5 for all server state
- Zustand v5 for client/UI state
- Axios for HTTP — base URL: https://mag-byte-api.vercel.app/api
- Heroicons + React Icons for icons
- pnpm as package manager (never use npm or yarn)

## Commands
```bash
pnpm dev          # Start dev server → http://localhost:3302
pnpm build        # Production build
pnpm lint         # ESLint
pnpm type-check   # tsc --noEmit
```
Always run `pnpm type-check` and `pnpm lint` before marking any task done.

## Project structure
```
magbyte-app/
├── app/                        # Next.js App Router — all pages live here
│   ├── components/             # Shared UI components
│   │   ├── ui/                 # Primitive, reusable UI (Button, Card, Badge…)
│   │   ├── charts/             # Chart wrapper components
│   │   └── dashboard/          # Feature-specific dashboard components
│   ├── dashboard/              # Dashboard route pages
│   ├── oauth-callback/         # OAuth redirect handler
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing / login redirect
├── lib/
│   └── api/                    # Axios instance + all API call functions
├── fonts/                      # Local font files
├── public/                     # Static assets
├── CLAUDE.md                   # This file — project instructions
└── CLAUDE.local.md             # Personal overrides (gitignored)
```

New folders to create as needed:
- `app/hooks/` — custom React hooks
- `app/stores/` — Zustand stores
- `app/types/` — shared TypeScript interfaces
- `lib/utils.ts` — shared utilities (formatNaira, cn, etc.)

## Authentication
Google OAuth only. Email/password components exist in code but are commented out — do not uncomment them.

Flow:
1. User clicks "Continue with Google" → API returns a `redirect_url` → browser goes to Google
2. Google redirects to `/oauth-callback?code=...`
3. Callback page exchanges code for a JWT via the API
4. JWT stored in `localStorage` via Zustand persist (key: `"auth"`)
5. New users → `/dashboard/user/update` (profile setup)
6. Returning users → `/dashboard`

Route protection: `<AuthGuard />` in `app/dashboard/layout.tsx` — validates token on mount and
every 10 minutes. Redirects to `/` if invalid.

**Never touch the auth flow unless explicitly asked. It is working.**

## What is built and working

### Auth + shell
| Route | Status |
|---|---|
| `/` | Login page — Google OAuth button works |
| `/oauth-callback` | Fully working — exchanges code, stores JWT |
| `/dashboard/user` | Empty placeholder — `<div>User</div>` |
| `/dashboard/user/update` | ✅ Built — two-step onboarding (business name + industry grid) |

### Dashboard shell — Session 1 (2026-03-28)
Rebuilt `app/dashboard/layout.tsx` with a full adaptive shell:
- `TopBar.tsx` — sticky midnight bar: logo, page nav pills, date range badge, health mini-widget, period filter, account avatar, **dark mode toggle (moon/sun icon)**
- `SideRail.tsx` — desktop collapsible icon rail (56px collapsed / 208px expanded, midnight bg). Dev tier buttons auto-navigate to `/dashboard` on click.
- `BottomNav.tsx` — mobile fixed bottom nav (hidden on md+)
- Zustand store `useDashboardStore.ts` — `period` filter + `sideRailExpanded` + **`theme: 'light'|'dark'` + `toggleTheme()`** (all persisted in `"dashboard-prefs"` key)
- `app/components/ThemeApplier.tsx` — client component that syncs Zustand `theme` to `document.documentElement.classList` via `useEffect`

### Dashboard pages — Session 1 (2026-03-28, mock data from Rida's bakery)
| Route | Status | Key UI |
|---|---|---|
| `/dashboard` | ✅ Built | Executive Summary (Cockpit): health gauge SVG, vital signs, signal cards, 3 charts, plays, forecast insight |
| `/dashboard/sales` | ✅ Built | 7 KPI cards, 4 charts, paginated detail table |
| `/dashboard/products` | ✅ Built | 5 KPI cards, top-10 bar chart, category bar, sortable product table |
| `/dashboard/forecast` | ✅ Built | 5 KPI cards, month progress card, forecast line chart, category bars, seasonality, product forecast table |

Mock data files: `app/mock/basic_analysis_output.json`, `app/mock/executive_summary_output_all.json`
Types: `app/types/basicAnalysis.ts`, `app/types/executiveSummary.ts`
Hooks: `app/hooks/useDashboardData.ts` (swap point — returns mock now, API later) · `app/hooks/useFilteredData.ts` (period-aware wrapper — use this on Sales/Products pages)
Charts library: `recharts 3.8.1`

### Period filter — Session 3 (2026-03-28)
The TopBar period filter (All / Wk / Mo / Yr) is now fully wired up.

**How it works:**
- `app/hooks/useFilteredData.ts` — wraps `useBasicAnalysis()`, reads `period` from Zustand, and re-derives all page_1 and page_2 data from the filtered `detail_table` rows. Cutoff is anchored to the dataset end date (not today), so mock data always has rows to show.
- Sales (`/dashboard/sales`) and Products (`/dashboard/products`) call `useFilteredData()` — every KPI, chart, and table reacts to the filter instantly.
- When a filter is active, a blue banner appears below the page title showing the cutoff date and row count.
- Cockpit and Forecast always use the full dataset (by design). When a filter is active on those pages, an amber notice explains this.
- Page 3 (Forecast) is intentionally excluded from filtering — forecasts are computed over the full dataset.

**Filter implementation rule:** Always use `useFilteredData()` on pages that show page_1 or page_2 data. Never use raw `useBasicAnalysis()` on those pages — the filter will silently stop working.

### Onboarding — Session 4 (2026-03-28)
`/dashboard/user/update` — two-step split-panel card:
- Step 1: business name (required) + phone (optional)
- Step 2: 12-industry grid — user picks their sector
- `app/dashboard/user/layout.tsx` covers the parent shell (`fixed inset-0 z-50`) so TopBar/SideRail are hidden
- On submit: `PATCH /user/update` with `{ business_name, phone, business_industry }` → redirect to `/dashboard`
- Tier is **never selected by the user** — n8n auto-detects from sheet count in uploaded Excel

### Tier system — Session 4 (2026-03-28)
Dashboard pages are tier-aware. All routes exist under `/dashboard/` — the SideRail filters which ones are visible based on the user's tier.

**Retail & Provisions route map:**

| Tier | Routes | Status |
|---|---|---|
| Basic | `/dashboard`, `/dashboard/sales`, `/dashboard/products`, `/dashboard/forecast` | ✅ Built |
| Intermediate | + `/dashboard/expenses` | ✅ Built |
| Advanced | + `/dashboard/staff` (Expenses also shown) | ✅ Built |

**Tier switcher (dev mode only):**
- A 3-button switcher (Basic / Intermediate / Advanced) appears in the SideRail when `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`
- Clicking a tier sets `devTier` in `useDashboardStore` (Zustand, persisted)
- SideRail reads `devTier` in dev mode (or `user.tier` in production) to show the correct nav items
- Mock data files per tier:
  - Basic: `app/mock/basic_analysis_output.json`
  - Intermediate: `app/mock/intermediate_analysis_output.json`
  - Advanced: `app/mock/advanced_analysis_output.json`
- Hooks per tier: `useBasicAnalysis`, `useIntermediateAnalysis`, `useAdvancedAnalysis` (all in `app/hooks/`)
- Each page reads from its tier's hook — no cross-tier data bleeding

**Production tier rule:** `user.tier` comes from the API profile response. When n8n processes an upload it sets the tier. `useDashboardStore` is NOT the source of truth for tier in production — only in dev.

### Dark mode — Session 5 (2026-03-29)
Full light + dark mode implemented across the entire app. Toggle via moon/sun button in TopBar. Theme persists across refresh via Zustand + localStorage.

**How it works (Tailwind v4):**
- `app/globals.css` — `@custom-variant dark (&:where(.dark, .dark *));` enables class-based dark mode
- `.dark` class toggled on `<html>` by `ThemeApplier` component in `app/layout.tsx`
- All dark variants added as `dark:` utilities alongside existing classes — no architecture change

**Pages with full dark mode:**
- `app/page.tsx` — landing/login
- `app/dashboard/layout.tsx` — page background
- `app/components/ui/dashboard/ChartUtils.tsx` — ChartCard, KpiCard, DashTooltip, SectionHeader (cascades to all pages automatically)
- `app/dashboard/sales/page.tsx`
- `app/dashboard/products/page.tsx`
- `app/dashboard/customers/page.tsx`
- `app/dashboard/expenses/page.tsx`
- `app/dashboard/staff/page.tsx`
- `app/dashboard/forecast/page.tsx`
- `app/dashboard/user/update/page.tsx`

**Glass/frosted-card styling (also session 5):**
- ChartCard: `bg-white/80 backdrop-blur-sm` with `ring-1 ring-black/[0.04]`
- DashTooltip: frosted glass `bg-white/90 backdrop-blur-md border border-white/60`
- KpiCard: value size bumped to `text-[26px]`, ACCENT_STYLES all have dark counterparts

### Pending (not yet built)
- Remaining tier pages: Stock Movement, Customers (Intermediate); Debt Management, Enterprise Sales (Advanced) — need Python scripts to generate mock data first
- Chart focus/expand mode (click to full-screen a chart)
- Chart-as-filter interaction (click a chart segment to filter the page)
- Download PDF / "Download Summary" button
- Thumbs up/down feedback on AI insight signal cards
- Wire real API when n8n is reactivated

### Security — deferred to post-MVP
Full audit documented in conversation (2026-03-28). Critical items:
- Fix AuthGuard token validation logic (never actually rejects invalid tokens)
- Disable NEXT_PUBLIC_DEV_BYPASS_AUTH before any production deploy
- Migrate JWT from localStorage → httpOnly cookies (requires backend change)
- Add CSP headers to next.config.ts
- Validate user image URL in Account.tsx before rendering

## Current focus — Executive Summary page
The Executive Summary page at `/dashboard` is built. It is the first page a
logged-in user sees. Next iteration will add chart focus/expand mode and
chart-as-filter interactions per the UX principles below.

### Page layout (top to bottom)
```
1. Dashboard greeting — "Good morning, [First Name]" (adapts to time of day)
2. Business Health Snapshot — intelligent KPI cards (TOP)
3. [ Key Business Health ]
4. [ What Happened ]
5. [ Why It Happened ]
6. [ What Will Likely Happen ]
7. [ What You Should Do ]
```

Only **high signal charts + automated text insights** — no noise.

### Intelligent KPI cards (Health Snapshot)
These are NOT normal KPI cards — each one carries a colour signal and a delta.

Example cards:
- Total Sales — ₦1.92M ▲ +12% vs last period
- Total Profit — ₦603K ▲ +9%
- Best Category — Grocery
- Worst Category — Personal Care
- Top Product — Product 19
- Risk Alert — Sales dropped in September

**Every card must have a colour signal:**
- 🟢 green = improving
- 🟡 yellow = stable
- 🔴 red = declining

This instantly tells the owner: *Is my business healthy?*

### Chart behaviour rules
- Charts function as **filters on the current page** — clicking a chart filters
  the rest of the page to that selection
- Clicking a chart triggers **focus mode**: the chart expands to fill most of
  the screen with its filters highlighted; everything else blurs out
- All filters affect **single pages only** — never bleed across pages
- Every chart must have a **tooltip icon** (small `?`) that explains what the
  chart shows in plain ELI5 language

### Other executive summary features
- **Date range badge** — always visible in TopBar, shows data coverage period
- **Sales target card** — user can set a target (₦5M, ₦10M, ₦15M); card shows
  progress toward that goal
- **Download Insights & Reports** button — exports the current view (pending)
- **Thumbs up/down feedback** on AI insights — trains the engine over time (pending)

### API data shape
The API returns executive summary data under the `executive_summary` key.
Consistent across tiers: `health_score`, `vital_signs`, `signals`, `charts`,
`plays`, `ai_brief`, `comparison`, `forecast_insight`.

TypeScript interfaces are in `app/types/executiveSummary.ts` and `app/types/basicAnalysis.ts`.

### Data access pattern
Mock data lives in `app/mock/` (JSON files + typed exports in `index.ts`).
Hooks in `app/hooks/useDashboardData.ts` return mock data now — swap to API calls
by changing that one file when n8n is reactivated.

## Product UX principles
These are non-negotiable design decisions that apply across every dashboard page.
Always follow these — do not deviate without being explicitly asked to.

**Dashboard greeting**
Every dashboard page opens with a personalised greeting using the user's first name
and the correct time of day: Good morning / Good afternoon / Good evening.

**Charts as filters**
Every chart on a page is interactive and acts as a filter for that page.
Clicking a chart element filters all other components on the same page.
Filters never affect other pages.

**Focus mode on charts**
Every chart has a focus/expand button. When clicked:
- The chart grows to occupy most of the screen
- Its associated filters are highlighted
- Everything else on the page blurs out
- Clicking outside or pressing Escape exits focus mode

**Tooltips everywhere**
Every chart and every KPI card must have a small `?` tooltip icon in the corner.
The tooltip explains what the metric means and how to read the chart — written
in the simplest possible language (assume the user has never seen a dashboard before).

**Colour signals on KPI cards**
Every KPI card shows a colour signal alongside the value:
- 🟢 green = improving vs previous period
- 🟡 yellow = stable (within ±2%)
- 🔴 red = declining vs previous period
Never show a KPI card without its colour signal.

**Loading screen copy**
While data loads, show dynamic facts pulled from the data itself, e.g.:
- "Your store has 200 entries"
- "Sales generated is ₦XXX"
- "You have XXX customers"
This keeps users engaged during loading and makes the product feel alive.

**Language of the UI**
Write all chart labels, card titles, and insight text in plain, clear language.
No jargon. No analyst-speak. A market trader should be able to read every word.

## API conventions
Base URL: `https://mag-byte-api.vercel.app/api`
- All API functions live in `lib/api/`
- All data fetching uses TanStack React Query — no raw useEffect for data fetching
- Query keys follow the pattern: `['resource', 'sub-resource', params]`
- Handle loading, error, and empty states on every data-dependent component
- The API returns dashboard data structured by tier (basic, growth, advanced)

## Component rules
- Server Components by default in App Router — only add `'use client'` when needed
- Client components needed for: interactive state, Zustand, React Query hooks
- Every component in `app/components/ui/` must be fully reusable with no business logic
- Use `tailwind-merge` (the `cn()` utility) for all conditional class names
- Heroicons for UI icons, React Icons only for brand/social icons

## Data formatting
```typescript
// Always use these helpers — never format inline
formatNaira(value: number)   // → ₦1.2M / ₦45K / ₦500
formatPercent(value: number) // → +12.5% / -3.2%
formatDate(date: string)     // → consistent date display
```

## Dashboard tiers
Each tier has its own pages and data shape. The structure below is for **Retail & Provisions**
(current build). Other industries follow the same tier model but with industry-specific pages and KPIs.

**Retail & Provisions:**
- **Basic**: page_1 (Sales Overview), page_2 (Products), page_3 (Forecast)
- **Intermediate**: adds page_4 (Expenses) — note: actual mock data does not include Stock Movement or Customers pages
- **Advanced**: adds page_7 (Staff), page_8 (Debt Management), page_9 (Enterprise Sales)

**Rule for new industries:** read the industry's data template in `All Templates.md` to determine
what pages exist at each tier. Define TypeScript interfaces in `app/types/` before any UI.
Never assume a page from Retail applies to another industry without checking.

## TypeScript rules
- All API response shapes must have an interface in `app/types/`
- No `any` — use the response types
- React Query's `useQuery` must be typed: `useQuery<YourType>(...)`
- Props interfaces named `[ComponentName]Props`

## Git conventions
- Branch naming: `feature/short-description` or `fix/short-description`
- Commit messages: imperative mood — "Add sales chart component" not "Added"
- Never commit directly to `main`
- Always tell me the proposed commit message before committing

## Upcoming features — do not build yet
These are planned but not in scope for current sessions. Be aware of them so
nothing built now conflicts with or blocks them later.

- **AI companion ("The Brain")** — users can ask questions about their data in
  natural language; only answers questions about the uploaded CSV/data file
- **Alert system** — notify users when a value crosses a set threshold
- **Multi-language reports** — download reports in English, Yoruba, Igbo, Hausa
- **Quarterly report generation** — auto-generated 3 months after first upload
- **Moniepoint POS integration** — POS transaction history upload and analysis
- **Google Sheets connector** — connect the web app to a live Google Sheet
- **Bank statement processing** — upload and analyse bank statements
- **Company logo upload** — or toggle to use Google profile picture
- **Data library / settings page** — view all uploaded files and data sources
- **Social media analytics** — submit a company profile link for analysis
- **Colour/theme customisation** — let users pick graph colour schemes
- **"Select Your Industry" onboarding** — currently Retail & Provisions only;
  future versions will support multiple industries with industry-specific KPIs
- **Cybersecurity augmentation** — future expansion of the platform
- **Content creator analytics** — for people who earn from X, YouTube, Shopify

## What NOT to do
- Never use `npm` or `yarn` — this project uses `pnpm`
- Never add a new package without explaining what it replaces or why it's needed
- Never use inline styles — Tailwind classes only
- Never skip error/loading states in components that fetch data
- Never hardcode the API URL — always import from the axios config in `lib/api/`
- Never mix server and client component concerns in the same file
