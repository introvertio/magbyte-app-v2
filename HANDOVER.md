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

## Still pending
- Focus mode rollout to non-Sales pages (exclude Cockpit).
- Chart-as-filter completion for remaining pages listed in `CLAUDE.md`.
- Staff true period filtering requires date-bearing staff payload fields (backend/data-shape).

## Quick verify checklist (`http://localhost:3302`)
- Sales Basic: period + content filters update KPIs/charts/table together.
- FilterPane dark mode: hover text remains readable.
- Focus mode: pane no longer leaves top-right gap.
- EditableGreeting: type text, press Escape, confirm no save to localStorage.

