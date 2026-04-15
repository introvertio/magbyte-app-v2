# MagByte Handover (Compact)

## Session outcome
- Filter/system UX is aligned between Cursor and Claude Code with shared behavior documented in `CLAUDE.md`.
- Core fixes delivered on Sales/Products/Customers/Expenses, plus shared UI polish in `ChartUtils` and `FilterPane`.

## Shipped in this session
- **FilterPane + Focus**
  - Pane now conditionally handles top offset: under TopBar normally, full-height background in focus mode (no top-right gap), with content still visually below TopBar.
  - Added global `focusModeOpen` state in `useDashboardStore` (non-persisted).
- **Tooltips + card polish**
  - Removed clipping by avoiding `overflow-hidden` on shared KPI/chart cards.
  - Removed KPI corner decoration circles.
  - Dark mode filter option hover contrast fixed (`hover:text-primary`, `dark:hover:text-blue-300`).
- **Sales (Basic)**
  - Payment focus chart uses donut in focus mode.
  - "Volume by Category" derives from row-level data so missing categories (e.g. Small Chops) are not dropped.
  - Content filters (`category`, `product`, `payment`) now affect KPIs, charts, and table consistently.
  - Period filters (Year/Month/Day) now affect charts + KPIs consistently (not KPIs-only).
- **Customers**
  - Intermediate customers page now re-derives KPIs/charts/table from filtered rows.
  - Advanced customers shows amber notice when period filters are active (full-dataset limitation).
- **Expenses**
  - Intermediate + Advanced now apply period filters where data has date/month dimension.
  - Tables take filtered rows via props instead of fetching unfiltered rows internally.
- **Staff**
  - Added amber notice when period filters are active (payload has no date dimension, so filter not applicable).
- **EditableGreeting**
  - Escape now cancels edit without saving; blur-save is skipped after Escape.

## Shipped (session 2 — forecast + expenses fixes)
- **Expenses — KPI cleanup**
  - Removed 3 redundant KPIs from Int + Adv expenses: Net Profit, Expense to Sales, YTD Expenses.
  - Types (`IntExpenseKpis`) and page render updated. Python `net_profit` variable kept (still needed for `net_margin`).
- **Forecast — confidence bands**
  - `analyze_retail_intermediate.py` and `analyze_retail_advanced.py` now output `upper_band` / `lower_band` on every forecast point (computed as `forecast ± std_dev(daily_hist)`). Adv divides by `1_000_000`.
  - `ForecastLineChart` already rendered them; only Python scripts were missing the values.
  - **Action needed:** re-run both Python scripts and replace `intermediate_analysis_output.json` + `advanced_analysis_output.json` in `app/mock/` for bands to appear in browser.
- **Forecast — insufficient data gate**
  - `ForecastMeta` interface added to `intermediateAnalysis.ts`; used by both Int and Adv types.
  - `InsufficientDataGate` component added to `forecast/page.tsx` — renders when `sufficient_data = false` (threshold: 3 months). Shows plain-English message, days remaining, progress bar.
- **Forecast — tooltip order**
  - `DashTooltip` now accepts `payloadOrder?: string[]` to reorder tooltip rows independently of SVG render order.
  - Forecast chart passes `["historical", "upper", "forecast", "lower"]` so tooltip reads top-to-bottom matching the chart visually.

## Shipped (session 3 — logos + Sales focus freeze + focus mode rollout)

### Branding / logos
- SVG logo files copied to `public/`: `InViewLogo.svg`, `InViewLogoFull.svg`, `InViewLogoWhite.svg`, `InViewLogoWhiteFull.svg`.
- **Brand rule:** InView = product-facing copy; MagByte = legal/copyright only.
- Updated: `app/layout.tsx` (title/description), `app/page.tsx` (login page hero + mobile logo), `app/components/ui/dashboard/layout/TopBar.tsx` (removed PNG + filter hack → SVG), `app/dashboard/user/update/page.tsx`, `public/site.webmanifest`.

### Sales page — focus mode freeze (`app/dashboard/sales/page.tsx`)
- Background (KPIs, table, charts, filter badges, amber notice, header date range) is fully static while a chart is in focus.
- Only the focused chart reacts to filter changes during focus mode.
- On exit, all filters applied during focus mode are discarded; page returns to pre-focus state.
- Pattern: synchronous ref capture at the render where `focusModeOpen` flips `false → true`; `BasicDetailTable` receives `overrideRows` prop; `SalesOverviewPage` gates `FilterNotice` behind `!focusModeOpen`.

### Focus mode rollout — all non-Cockpit, non-Forecast pages

**Products Basic** (`app/dashboard/products/page.tsx`)
- `focusable` + `focusContent` (height=500) on both ChartCards: "Top 10 by Revenue" and "Category Sales".
- Freeze pattern added (same as Sales): `frozenTopDataRef`, `frozenCatDataRef`, `frozenProductsRef`, `frozenKpisRef`.
- **Filter-restore on exit:** `frozenCategoryFiltersRef`, `frozenPaymentFiltersRef`, `frozenProductFiltersRef` captured at focus-open; `useEffect` restores them when focus closes — prevents filtered bars from bleeding into background on exit.

**Expenses Int + Adv** (`app/dashboard/expenses/page.tsx`)
- Extracted `WaterfallBars` helper component to avoid JSX duplication.
- `OperatingProfitWaterfall` now `focusable`; accepts `liveWaterfall` prop for focus chart.
- `IntContent` + `AdvContent` now accept `data` (frozen bg) + `liveData` (live focus) props.
- All 3 Int charts + all 4 Adv charts are `focusable`.
- `ExpensesPage` adds freeze refs; filter notice hidden while focus is open.

**Staff** (`app/dashboard/staff/page.tsx`)
- Both charts (`branch_performance`, `staff_sales`) are `focusable` with `focusContent` at height=500.
- No freeze needed — Staff data is static (no content filters, no date filtering applied).

**Customers Int + Adv** (`app/dashboard/customers/page.tsx`)
- `IntContent` + `AdvContent` accept `data` + `liveData` props (same pattern as Expenses).
- 5 chart-based ChartCards are `focusable`; the "Customer Ranking" text list is intentionally excluded (no zoom benefit).
- `CustomersPage` adds freeze refs; type casts added for `AdvancedAnalysisResult["page_3"]` union narrowing.
- Amber filter notice hidden while focus is open.

## Still pending (frontend polish)
- **Regenerate mock JSON** — run Int + Adv Python scripts to get confidence bands in browser.
- Fix filter-restore on focus exit for **Sales page** (same `focusSessionRef` + `useEffect` pattern as Products — sales has category/payment/product local filters too).
- Fix filter-restore on focus exit for **Expenses + Customers** (currently only data is frozen; filters applied inside focus persist on exit).
- Chart-as-filter completion: Products Basic category bar, Products Int, Customers, Expenses charts.
- Staff true period filtering requires date-bearing staff payload fields (backend/data-shape).
- Signal `chart_refs` — Int + Adv signals still need `chart_refs` populated.
- **Intermediate layout/chart fixes** — bring Int-tier chart layouts and visual quality up to Basic tier standard.

---

## Backend / API integration (session 4)

### Architecture — confirmed from magbyte-micro code + meeting transcript

```
Frontend → Django API (mag-byte-api.vercel.app/api)
               └→ [Django proxies OR frontend calls directly]
                       └→ FastAPI micro (magbyte-micro on Vercel)
                               └→ n8n webhook → analysis script → exec script
                                       └→ { n8n_extract, analysis_result,
                                            executive_summary_result, forecast_log }
```

- **n8n**: yearly plan now active — pipeline is live and ready to use.
- **magbyte-micro** (`/Users/macbook/Desktop/MagByte/magbyte-micro`): built, deployed on Vercel.
  - Single endpoint: `POST /upload?GEX=<token>` — accepts `file` (multipart) or `link` (query param).
  - GEX token for Retail Basic: `"#%RTB"` (not `"#%RT"` — earlier docs were wrong).
  - Processing is **synchronous** — 5–7 s (file) / 3.5 s (link). No polling needed.
  - Response shape: `{ n8n_extract, analysis_result, executive_summary_result, forecast_log }`.
  - `analysis_result` matches mock JSON exactly (`page_1`, `page_2`, `page_3`, `metadata`).
  - `executive_summary_result` matches `ExecutiveSummaryResult` type.
  - CORS in `main.py` allows `magbyte-app-v2.vercel.app` — suggests **frontend calls micro directly**, not through Django.
- **Database**: Supabase (PostgreSQL). Django models: User, Analyzed Data, Executive Summary Data, Forecast Log.
- **Django backend** (`mag-byte-api.vercel.app/api`) — existing endpoints wired in frontend:
  - `GET  /auth/google/login/`
  - `GET  /auth/google/oauth-callback/`
  - `GET  /auth/validate/`
  - `GET  /user/get`
  - `PATCH /user/update`

### Industry → GEX mapping (from magbyte-micro)
| Industry | Basic | Intermediate | Advanced |
|---|---|---|---|
| Retail & Provisions | `#%RTB` | `#%RTBI` (not yet built) | `#%RTBO` (not yet built) |
| Others | TBD | TBD | TBD |

### Confirmed architecture (session 5)
- **magbyte-micro URL**: `https://magbyte-micro.vercel.app` (confirmed live).
- **Direct call**: frontend calls micro directly — CORS in `main.py` confirms this.
- **No separate analysis endpoint**: all data (`analyzed_data`, `executive_summary`, `forecast_logs`) is stored on `api_userprofile` as JSONB columns. `GET /user/get` returns profile + analysis. No `GET /analysis/get` needed.
- **No `tier` field**: infer from `business_industry`. Tier is set by n8n from sheet count.
- **Micro does NOT save to Django** — it returns results; frontend must `PATCH /user/update` with the data.

### Supabase schema (`api_userprofile` — the only app table)
| Column | Type | Notes |
|---|---|---|
| `analyzed_data` | jsonb | keys: `page_1`, `page_2`, `page_3`, `metadata`, `anomalies` |
| `executive_summary` | jsonb | keys: `plays`, `charts`, `signals`, `ai_brief`, `metadata`, `comparison`, `vital_signs`, `data_quality`, `health_score`, `period_filter`, `forecast_insight` |
| `forecast_logs` | jsonb array | |
| `data` | jsonb array | raw transaction rows from upload |
| `business_industry` | varchar | used to infer tier |

`executive_summary` has two extra keys vs our type: `data_quality` + `period_filter` — not causing errors (extra keys are ignored).

### Implemented onboarding flow
```
Login (Google OAuth) → JWT → localStorage
  └─ new_user = true  → /dashboard/user/update (onboarding)
       Step 1: business name + phone
       Step 2: industry
       Step 3: file or Google Sheets link
                └→ PATCH /user/update  (save profile)
                └→ POST magbyte-micro/upload?GEX=#%RTB
                └→ "Analysing your data…" (5–7 s wait)
                └→ PATCH /user/update  (save analysis_result, executive_summary, forecast_log)
                └→ redirect /dashboard
  └─ new_user = false → /dashboard
       └─ analyzed_data present → real data via useGetProfile
       └─ analyzed_data null    → "No data yet" holding page → link back to onboarding
```

### What is still blocked / pending
1. **Django OAuth redirect** — after Google login, Django redirects to `magbyte-app.vercel.app` (old app). Must update Django `ALLOWED_REDIRECT_URIS` to the new Vercel domain before real users can log in on the new app.
2. **`NEXT_PUBLIC_DEV_BYPASS_AUTH=false`** in Vercel — must set before any real user testing.
3. **Confirm `GET /user/get` response shape** — we know the DB columns; need to verify Django serialiser actually returns `analyzed_data` + `executive_summary` in the response. First real login will confirm this.
4. **Int/Adv upload** — GEX tokens `#%RTBI` / `#%RTBO` not yet built in magbyte-micro. Intermediate/Advanced data still uses mock.

## Quick verify checklist (session 5 additions — `http://localhost:3302`)
- Onboarding Step 3: select file → "Upload & analyse →" button becomes active. Clicking it shows "Analysing your data…" disabled state.
- Onboarding: if micro call fails, error message appears; Back button is disabled during upload.
- Cockpit (`NEXT_PUBLIC_DEV_BYPASS_AUTH=false`): visiting `/dashboard` without uploaded data shows "No data yet" holding page with link to onboarding.
- Cockpit (with bypass on): dashboard loads normally from mock data as before.

## Quick verify checklist (prior sessions — `http://localhost:3302`)
- Sales Basic: period + content filters update KPIs/charts/table together.
- FilterPane dark mode: hover text remains readable.
- Focus mode: pane no longer leaves top-right gap.
- EditableGreeting: type text, press Escape, confirm no save to localStorage.
- Forecast Basic: hover forecast section → tooltip shows Actual → Upper → Forecast → Lower.
- Forecast: switch tier to Int or Adv with `< 3 months` mock data → gate renders instead of charts.
- Products: open focus → apply filter → minimize → background charts should show pre-focus state.
- Expenses (Int/Adv): all charts show Focus button; opening focus shows taller chart in modal.
- Staff: both charts show Focus button.
- Customers (Int/Adv): chart-based cards show Focus button; Customer Ranking list does not.
