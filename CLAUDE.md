# MagByte App

@README.md
@package.json

## Product
Global SME analytics platform. Nigerian SMEs are ICP. Retail & Provisions is built first.
12 industries × 3 tiers (Basic / Intermediate / Advanced). Each has its own data template.
**Before building for any new industry:** read its template in `Cowork - MagByte/Context/All Templates.md` first.

## Stack
Next.js 16 App Router · React 19 · Tailwind CSS v4 · tailwind-merge · TanStack React Query v5 · Zustand v5 · Axios · Heroicons + React Icons · pnpm

## Commands
```bash
pnpm dev           # → http://localhost:3302
pnpm build
pnpm lint
pnpm tsc --noEmit  # type-check — run after every set of changes (pnpm type-check does not exist)
```

## Structure
```
app/
  components/ui/        # primitive UI — no business logic
  components/charts/    # chart wrappers
  components/dashboard/ # feature components
  dashboard/            # route pages
  hooks/                # custom hooks
  stores/               # Zustand stores
  types/                # TypeScript interfaces
  mock/                 # mock JSON + typed exports (index.ts)
lib/api/                # Axios instance + all API functions
```

## Auth
Google OAuth only. Do not uncomment email/password code.
Flow: Google → `/oauth-callback?code=` → JWT → localStorage (Zustand persist key: `"auth"`)
New users → `/dashboard/user/update` · Returning → `/dashboard`
`<AuthGuard />` in `app/dashboard/layout.tsx` — validates on mount + every 10 min.
**Never touch the auth flow unless explicitly asked.**

## What is built (Retail & Provisions)

| Route | Status |
|---|---|
| `/` | Login — Google OAuth |
| `/oauth-callback` | ✅ Working |
| `/dashboard` | ✅ Executive Summary (Cockpit) |
| `/dashboard/sales` | ✅ |
| `/dashboard/products` | ✅ |
| `/dashboard/forecast` | ✅ |
| `/dashboard/expenses` | ✅ Intermediate+ |
| `/dashboard/staff` | ✅ Advanced+ |
| `/dashboard/user/update` | ✅ Two-step onboarding |

**Shell:** `TopBar.tsx` · `SideRail.tsx` (56/208px, tier-switcher only — no nav links) · `BottomNav.tsx` · `ThemeApplier.tsx`
**TopBar nav:** center pills with icons (Home/Banknotes/ShoppingBag/Users/ReceiptPercent/UserGroup/ArrowTrendingUp) + back/forward buttons left of pills.
**Store:** `useDashboardStore.ts` — period, sideRailExpanded, filterPaneOpen, theme, devTier (persisted: `"dashboard-prefs"`)
**Mock data:** `app/mock/` — `basic_analysis_output.json` · `executive_summary_output_all.json` · `intermediate_analysis_output.json` · `advanced_analysis_output.json`
**Types:** `app/types/basicAnalysis.ts` · `app/types/executiveSummary.ts`
**Hooks:** `useDashboardData.ts` (swap point for real API) · `useFilteredData.ts` (period-aware — use on Sales/Products)
**Shared UI:** `EditableGreeting` (`app/components/ui/dashboard/EditableGreeting.tsx`) — used on every page. Saves to `localStorage` key `"greeting-display-name"`. Do not duplicate this logic in page files.

## Tier system

| Tier | Routes | Hook |
|---|---|---|
| Basic | dashboard, sales, products, forecast | `useBasicAnalysis` |
| Intermediate | + expenses | `useIntermediateAnalysis` |
| Advanced | + staff | `useAdvancedAnalysis` |

Prod tier: `user.tier` from API. Dev tier: `devTier` in Zustand, set via SideRail switcher (`NEXT_PUBLIC_DEV_BYPASS_AUTH=true`).
Tier is **never selected by the user** — n8n auto-detects from Excel sheet count.

## Period filter
Current: FilterPane Year / Month / Day of Week checkboxes (TopBar period buttons removed).
**Rule:** Always use `useFilteredData()` on pages showing page_1 or page_2 data. Never call `useBasicAnalysis()` directly on those pages — filter silently breaks.
Cockpit + Forecast always use full dataset; show amber notice when a filter is active.
Period filters should affect KPIs + charts + tables where date-bearing data exists.
Staff page currently has no date dimension in payload; show amber notice when filters are active.
Dropdowns should only show periods that exist in the dataset. Day picker anchored to `metadata.date_range`.

## Currency
Never hardcode ₦. Use `formatCurrency(value, currency)` — currency stored in user profile.
`formatNaira()` in `lib/utils.ts` is Retail-MVP legacy — **do not use in new code**.
Compact notation: 1,200,000 → 1.2M · 45,000 → 45K

## Dark mode
Class-based via `@custom-variant dark` in `globals.css`. `.dark` on `<html>` toggled by `ThemeApplier`.
All pages have full dark mode. Use `dark:` Tailwind utilities alongside existing classes.
**Brand palette (globals.css `@theme`):** `--color-primary` #001BB7 · `--color-primary-dark` #00022D · `--color-ghost-white` #FAFAFF · `--color-secondary` #1F7AFF · `--color-aqua` #57FFDB (dark mode accent).
Full guidelines: `Cowork - MagByte/Context/MagByte Brand Guidelines.pdf`

## UX principles (non-negotiable)
- **Greeting:** "Good morning/afternoon/evening, [Name]" on every page. Use `<EditableGreeting fallbackName={firstName} />` — never inline the editable logic. Name is user-editable via pencil-on-hover icon; persisted in localStorage.
- **Charts as filters:** clicking a chart element filters the rest of that page only — never bleeds across pages. Pattern: `Cell onClick` with `opacity` + `stroke` selection indicator. `ChartFilterBadges` component shows active filters with × to clear.
- **Signal deep-link:** signal cards on cockpit use `?glow=chart_id1,chart_id2` → target page scrolls + applies `.chart-glow` CSS pulse. `Signal` type has `chart_refs?: string[]`. `ChartCard` accepts `chartId` + `glowing` props.
- **Date format on x-axis + tooltips:** `fmtAxisDate` → "13 Mar 26" (`year: "2-digit"`). `DashTooltip` accepts `labelFormatter` prop — pass it there, not on `<Tooltip>`. Use `minTickGap={70}` to prevent label crowding. `DashTooltip` also accepts `payloadOrder?: string[]` — pass an array of `dataKey` names to control tooltip row order (used on forecast chart: `["historical", "upper", "forecast", "lower"]`).
- **Focus mode:** `ChartCard` accepts `focusable` + optional `focusContent` props. Clicking "Focus" opens a full-screen portal modal at `z-[300]`. Modal is transparent with title + chart on `bg-black/70 backdrop-blur-md`. Insets itself via `sideRailExpanded` + `filterPaneOpen`. `focusContent` must use `<ResponsiveContainer height={500}>` — NOT 200. Using 200 causes a coordinate mismatch (Recharts maps tooltips to a 200px SVG stretched to 500px display; tooltips only fire in the top 40%). The FilterPane tab button and pane are at `z-[350]` so they remain clickable and usable while a focus modal is open. Currently wired: all 4 BasicContent charts in Sales.
- **Tooltips:** every chart + KPI card has a `?` icon — plain ELI5 language
- **KPI colour signals:** 🟢 improving · 🟡 stable (±2%) · 🔴 declining — always show, never omit
- **Loading copy:** show live data facts while loading ("Your store has 200 entries")
- **Language:** plain English, no jargon — a market trader should understand every word

## Executive Summary (`/dashboard`)
Layout: Greeting → Health Snapshot KPIs → Key Health → What Happened → Why → Forecast → Plays
KPI cards: colour signal + delta vs last period.
API shape: `executive_summary.{ health_score, vital_signs, signals, charts, plays, ai_brief, comparison, forecast_insight }`

## API conventions
Base URL: `https://mag-byte-api.vercel.app/api` — never hardcode, always import from `lib/api/`
All fetching via TanStack React Query — no raw `useEffect` for data.
Query keys: `['resource', 'sub-resource', params]`
Handle loading, error, and empty states on every data-dependent component.

## Component rules
- Server Components by default — `'use client'` only when needed (state, Zustand, React Query)
- `app/components/ui/` — fully reusable, no business logic
- `cn()` (tailwind-merge) for all conditional classes
- Heroicons for UI · React Icons for brand/social only

## TypeScript rules
- Interfaces for all API shapes in `app/types/`
- No `any` — use response types; narrow `unknown` properly
- `useQuery<YourType>()` — always typed
- Props interfaces: `[ComponentName]Props`

## Data formatting
```typescript
formatCurrency(value, currency) // global — use in all new code
formatNaira(value)              // Retail-MVP legacy only — do not use in new code
formatPercent(value)            // → +12.5% / -3.2%
formatDate(date)
```

## Git
- Commits: imperative mood ("Add sales chart")
- Committing directly to `main` — no feature branches while sole developer
- Always state proposed commit message before committing

## FilterPane — architecture notes
- Right edge tab button: `z-[350]`, `w-8` at rest, `hover:w-24` expands left revealing "Filters" label (inner `<span>` with `overflow-hidden max-w-0 group-hover:max-w-[4rem]`). Badge sits outside the overflow-hidden span so it's never clipped.
- Pane div: `z-[350]` — renders above the focus modal (`z-[300]`), so users can apply filters without closing focus mode.
- Period section (formerly "Date Range") has Year / Month / Day of Week sub-groups.
- `TIER_FILTER_GROUPS` in `FilterPane.tsx` controls which filter groups appear per tier. Basic now includes `payment`. Pages that don't register a group (Cockpit, Forecast for `payment`) auto-show "Not available on this page".
- Payment method filter for Basic tier lives in the FilterPane only — not as inline chips on the page.
- Pane top behavior: normal mode sits under TopBar; in chart focus mode, pane background extends to top (no top-right gap) while content remains offset below TopBar.

## Forecast page — architecture notes
- `ForecastMeta` interface lives in `app/types/intermediateAnalysis.ts` and is shared by Int + Adv via `import("./intermediateAnalysis").ForecastMeta`.
- `InsufficientDataGate` component in `forecast/page.tsx` — renders when `forecast_meta.sufficient_data === false` (threshold: `min_months_required = 3` months across all tiers). Shows days remaining + progress bar. Reads threshold from the data so it stays correct if the Python constant changes.
- Confidence bands (`upper_band` / `lower_band`) on the forecast line chart: computed in Python as `forecast ± std_dev(daily_sales)`. Basic script had them; Int + Adv scripts updated to match. Adv values divide by `1_000_000` before output. Bands only show for forecast points, not historical.
- `ForecastLineChart` is a single shared component — tooltip order fix (`payloadOrder`) and gate logic apply across all tiers automatically.

## Expenses page — removed KPIs
Intermediate and Advanced expenses pages had 3 KPIs removed (redundant / filter-handled):
- **Net Profit** — same as Operating Profit when no below-the-line items exist
- **Expense to Sales** — same information as Expense Share
- **YTD Expenses** — literally equalled `total_expenses` in the script; filters handle time-slicing
These are removed from both `IntExpenseKpis` (type) and the page render. The Python `net_profit` variable is still computed in `analyze_retail_intermediate.py` because `net_margin` still needs it.

## Pending (not yet built)
- **Focus mode — roll out** — wire `focusable` + `focusContent` (with `height={500}`) to all ChartCards across Products, Customers, Expenses, Forecast, Staff. Exclude Cockpit (`/dashboard`).
- **Chart-as-filter** — done: Basic Sales, Int Sales (category + payment + staff). Still needed: Products Basic category bar, Products (Int), Customers, Expenses charts
- **Period filters** — wired on Sales Basic, Products Basic, Customers Intermediate, Expenses Intermediate/Advanced. Staff shows amber "not applied" notice (non-date payload).
- **Signal `chart_refs`** — added to basic exec summary mock. Int + Adv signals still need `chart_refs` populated
- Stock Movement, Customers (Intermediate) — need Python mock data scripts first
- Debt Management, Enterprise Sales (Advanced) — same
- Download PDF / report
- Thumbs up/down on AI signal cards
- Wire real API (when n8n reactivated)
- Delete unused `app/components/ui/dashboard/PageFilterBar.tsx`

## Security — deferred to post-MVP
- Fix AuthGuard: currently never rejects invalid tokens
- Disable `NEXT_PUBLIC_DEV_BYPASS_AUTH` before prod deploy
- Migrate JWT localStorage → httpOnly cookies (backend change required)
- Add CSP headers to `next.config.ts`
- Validate user image URL in `Account.tsx`

## Upcoming — do not build yet
AI companion ("The Brain") · Alert system · Multi-language reports · Quarterly report gen · Moniepoint POS · Google Sheets connector · Bank statement processing · Company logo upload · Data library/settings · Social media analytics · Colour/theme customisation · Multi-industry onboarding · Cybersecurity augmentation · Content creator analytics

## Do not
- Use `npm`/`yarn` — pnpm only
- Add packages without explaining what they replace or why
- Use inline styles — Tailwind only
- Skip error/loading states on data-dependent components
- Hardcode the API URL
- Mix server + client concerns in one file
- Use `formatNaira` in new code
