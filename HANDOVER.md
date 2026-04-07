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

## Still pending
- **Regenerate mock JSON** — run Int + Adv Python scripts to get confidence bands in browser.
- Focus mode rollout to non-Sales pages (exclude Cockpit).
- Chart-as-filter completion for remaining pages listed in `CLAUDE.md`.
- Staff true period filtering requires date-bearing staff payload fields (backend/data-shape).
- Delete `app/components/ui/dashboard/PageFilterBar.tsx` (unused, never committed).

## Quick verify checklist (`http://localhost:3302`)
- Sales Basic: period + content filters update KPIs/charts/table together.
- FilterPane dark mode: hover text remains readable.
- Focus mode: pane no longer leaves top-right gap.
- EditableGreeting: type text, press Escape, confirm no save to localStorage.
- Forecast Basic: hover forecast section → tooltip shows Actual → Upper → Forecast → Lower.
- Forecast: switch tier to Int or Adv with `< 3 months` mock data → gate renders instead of charts.

