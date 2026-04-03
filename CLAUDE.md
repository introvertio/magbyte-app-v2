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
pnpm dev        # → http://localhost:3302
pnpm build
pnpm lint
pnpm type-check # run after every set of changes
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

**Shell:** `TopBar.tsx` · `SideRail.tsx` (56/208px) · `BottomNav.tsx` · `ThemeApplier.tsx`
**Store:** `useDashboardStore.ts` — period, sideRailExpanded, theme, devTier (persisted: `"dashboard-prefs"`)
**Mock data:** `app/mock/` — `basic_analysis_output.json` · `executive_summary_output_all.json` · `intermediate_analysis_output.json` · `advanced_analysis_output.json`
**Types:** `app/types/basicAnalysis.ts` · `app/types/executiveSummary.ts`
**Hooks:** `useDashboardData.ts` (swap point for real API) · `useFilteredData.ts` (period-aware — use on Sales/Products)

## Tier system

| Tier | Routes | Hook |
|---|---|---|
| Basic | dashboard, sales, products, forecast | `useBasicAnalysis` |
| Intermediate | + expenses | `useIntermediateAnalysis` |
| Advanced | + staff | `useAdvancedAnalysis` |

Prod tier: `user.tier` from API. Dev tier: `devTier` in Zustand, set via SideRail switcher (`NEXT_PUBLIC_DEV_BYPASS_AUTH=true`).
Tier is **never selected by the user** — n8n auto-detects from Excel sheet count.

## Period filter
Current: All / Wk / Mo / Yr buttons in TopBar. Planned: expand to Year/Quarter/Month/Week/Day dropdowns (build in that order).
**Rule:** Always use `useFilteredData()` on pages showing page_1 or page_2 data. Never call `useBasicAnalysis()` directly on those pages — filter silently breaks.
Cockpit + Forecast always use full dataset; show amber notice when a filter is active.
Dropdowns must only show periods that exist in the dataset. Day picker anchored to `metadata.date_range`.

## Currency
Never hardcode ₦. Use `formatCurrency(value, currency)` — currency stored in user profile.
`formatNaira()` in `lib/utils.ts` is Retail-MVP legacy — **do not use in new code**.
Compact notation: 1,200,000 → 1.2M · 45,000 → 45K

## Dark mode
Class-based via `@custom-variant dark` in `globals.css`. `.dark` on `<html>` toggled by `ThemeApplier`.
All pages have full dark mode. Use `dark:` Tailwind utilities alongside existing classes.
ChartCard: `bg-white/80 backdrop-blur-sm` · DashTooltip: `bg-white/90 backdrop-blur-md`

## UX principles (non-negotiable)
- **Greeting:** "Good morning/afternoon/evening, [First Name]" on every page
- **Charts as filters:** clicking a chart element filters the rest of that page only — never bleeds across pages
- **Focus mode:** click chart → expands full-screen, others blur; Escape to exit
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
- Branch: `feature/short-desc` or `fix/short-desc`
- Commits: imperative mood ("Add sales chart")
- Never commit to `main` directly
- Always state proposed commit message before committing

## Pending (not yet built)
- Stock Movement, Customers (Intermediate) — need Python mock data scripts first
- Debt Management, Enterprise Sales (Advanced) — same
- Chart focus/expand mode + chart-as-filter interaction
- Download PDF / report
- Thumbs up/down on AI signal cards
- Wire real API (when n8n reactivated)

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
