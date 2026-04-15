# MagByte InView — MVP Status
_Retail & Provisions · Updated 15 Apr 2026_

---

## What "MVP shipped" means

A real user can:
1. Sign in with Google
2. Complete onboarding (biz name → industry → upload file or Sheets link)
3. Wait ~5–7 s while their data is analysed
4. Land on a dashboard showing their real data — not mock data
5. Navigate Sales, Products, Forecast without errors
6. Return the next day and see their data still there

Everything else is post-launch.

---

## Status legend
`✅ Done` · `⚠️ Partial` · `🔲 Not built` · `🚫 Blocked`

---

## Feature checklist

### Auth & onboarding
| Feature | Status | Notes |
|---|---|---|
| Login page — Google OAuth | ✅ Done | InView branding, dark mode, feature bullets |
| OAuth callback → JWT | ✅ Done | `new_user` flag routes to onboarding or dashboard |
| Auth guard (all dashboard routes) | ✅ Done | Validates on load + every 10 min, redirects on failure |
| Onboarding — Step 1 (biz name + phone) | ✅ Done | |
| Onboarding — Step 2 (industry select) | ✅ Done | Retail live; other 11 locked with "Coming soon" |
| Onboarding — Step 3 (upload file / Sheets link) | ⚠️ Partial | UI done; **not wired to API** — file never leaves the component |
| Sample template download in onboarding | 🔲 Not built | **Whitney feedback** — users need to know what structure to use |
| Emotional hook copy on onboarding | 🔲 Not built | **Whitney feedback** — one-liner: "We'll show you where you're losing money" |
| "Analysing your data…" loading state | 🔲 Not built | Needed for the 5–7 s wait after upload |
| Demo dashboard (dev only) | ✅ Done | Behind `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` — invisible to real users |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH=false` in Vercel | 🔲 Not done | **Must do before any real user tests** |

### Real API wiring (blocks launch)
| Feature | Status | Notes |
|---|---|---|
| magbyte-micro Vercel URL added to `lib/api/` | ✅ Done | `https://magbyte-micro.vercel.app` in `MICRO_BASE_URL` |
| `lib/api/analysis/upload.ts` | ✅ Done | `uploadAndAnalyse()` — file or link, typed response |
| Upload wired in onboarding Step 3 | ✅ Done | 3-step async flow: save profile → micro → save analysis |
| Returning user — fetch stored analysis | ✅ Done | Lives in `GET /user/get` → `analyzed_data` on profile |
| `useDashboardData.ts` → real data | ✅ Done | Uses `useGetProfile` data; falls back to mock in dev bypass |
| `tier` on `UserProfileResponse` | ✅ Done | Inferred from `business_industry`; no DB column exists |
| "No data yet" holding page on `/dashboard` | ✅ Done | Shows when `analyzed_data === null` with link to onboarding |
| n8n pipeline | ✅ Active | Yearly plan purchased — ready to receive requests |
| Django OAuth redirect → new app domain | 🔲 Not done | **Blocks real user testing** — Django redirects to old app |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH=false` in Vercel | 🔲 Not done | **Must do before any real user tests** |
| Confirm `GET /user/get` returns analysis fields | 🚫 Blocked | Need first real login on new app to verify serialiser shape |

### Dashboard pages
| Page | Status | Notes |
|---|---|---|
| Cockpit (`/dashboard`) | ✅ Done | Health score · signal cards · key visuals · plays |
| Sales (`/dashboard/sales`) | ✅ Done | All 3 tiers · chart-as-filter on Basic + Int |
| Products (`/dashboard/products`) | ✅ Done | All 3 tiers · category filter drives charts + KPIs |
| Forecast (`/dashboard/forecast`) | ✅ Done | All 3 tiers · confidence bands · insufficient-data gate |
| Expenses (`/dashboard/expenses`) | ✅ Done | Int + Adv · waterfall chart · period filters |
| Staff (`/dashboard/staff`) | ✅ Done | Advanced only |
| Customers (`/dashboard/customers`) | ⚠️ Partial | Rendering but 2 charts missing; `formatNaira` legacy bug on line 41 |

### Dashboard shell & shared UI
| Feature | Status | Notes |
|---|---|---|
| TopBar (nav pills, back/forward) | ✅ Done | InView SVG logo |
| SideRail (tier switcher, dev only) | ✅ Done | 56 / 208 px |
| BottomNav (mobile) | ⚠️ Partial | Renders but tapping links is a dead-end for some routes |
| FilterPane (right slide-in) | ✅ Done | Date + content filters · `z-[350]` · page-local |
| Dark mode | ✅ Done | All pages · brand palette · class-based |
| Editable greeting | ✅ Done | All pages · persists to localStorage |
| KPI colour signals (🟢🟡🔴) | ✅ Done | Every KPI card across all pages |
| Chart focus mode | ✅ Done | Sales · Products · Expenses · Staff · Customers (Cockpit + Forecast excluded by design) |
| Chart-as-filter | ⚠️ Partial | Sales Basic + Int done · Products/Customers/Expenses pending |
| Signal deep-links (Cockpit → page) | ⚠️ Partial | Basic done · Int + Adv `chart_refs` not populated |
| Currency formatting (`formatCurrency`) | ✅ Done | Compact · multi-currency · no hardcoded ₦ |
| Tooltips (`?` on every chart + KPI) | ✅ Done | Plain-language ELI5 copy |

---

## Active priorities (in order)

### 1. 🔴 Fix Django OAuth redirect — this is now the launch blocker
The API wiring is built. The only thing stopping real user testing is Django redirecting to the old app after Google login.

**Two actions needed (backend):**
1. Update Django `ALLOWED_REDIRECT_URIS` / `FRONTEND_URL` to the new Vercel domain
2. Set `NEXT_PUBLIC_DEV_BYPASS_AUTH=false` in Vercel env vars

**Then verify (first real login):**
- Does `GET /user/get` return `analyzed_data` + `executive_summary` in the response? (We know it's on the DB model; need to confirm the Django serialiser includes it)
- If not, the serialiser needs to be updated to include those fields

### 2. 🟡 Onboarding UX — Whitney + Woko feedback
- **Sample template download** (Whitney): add a "Download template" link in Step 3. Users need to know what Excel structure to use. This is a real friction point for non-data-literate users.
- **Emotional hook** (Whitney): add a one-liner value statement before the upload step — something like "We'll analyse your sales and show you exactly where you're losing money."
- These are small additions that can be done alongside the API wiring.

### 3. 🟡 Cockpit layout — Woko feedback
Woko's review: main view should be **overview score + key visuals only**. "What happened", "Your plays", and detailed insights should sit behind a **"View all"** / expand action.
- Simplifies the cockpit for first impression
- Users who want detail can drill in

### 4. 🟡 Sales page layout — Woko feedback
- **Volume by Category** → move up, next to Profit Trend
- **Sales Trend + Payment Method** → move below Transaction Log (lower priority, contextual)
- Rationale: what you can act on belongs above the fold; raw transaction detail belongs below

### 5. 🟢 Customers page — complete the build
- Two missing charts: repeat vs. new customer breakdown + CLV-by-category bar
- Fix `formatNaira` legacy bug (line 41 — replace with `formatCurrency`)

### 6. 🟢 BottomNav — fix dead-end links
- Mobile nav taps don't resolve for some routes
- Blocking mobile users from navigating properly

### 7. 🟢 Filter-restore on focus exit
- Sales + Expenses + Customers: filters applied inside focus persist on exit
- Pattern already done on Products — apply same `focusSessionRef` + `useEffect` pattern

---

## User feedback log

### Woko (business partner) — dashboard review
_From transcript, ~14 Apr 2026_

| Feedback | Action |
|---|---|
| Cockpit: overall score + key visuals only on main view; "what happened" + "plays" behind "view all" | Priority 3 above |
| Sales: volume by category should come up, payment method + sales trend go under transaction log | Priority 4 above |
| Focus mode working well — correctly scopes filters to focused chart only | ✅ No action needed |
| Intermediate + Advanced still need polish to match Basic quality | Noted — post-MVP polish sprint |

### Whitney (friend, UX reviewer) — onboarding + dashboard review
_From transcript, ~14 Apr 2026_

| Feedback | Action |
|---|---|
| Strong value prop, clean onboarding, good decision-making emphasis | ✅ Validated |
| Cognitively heavy — too many cards, colours, sections competing at once | Address via Cockpit restructure + colour discipline |
| Needs an emotional hook on onboarding — "why does this matter to me?" | Priority 2 above |
| Onboarding assumes users know what data to upload — needs sample template | Priority 2 above |
| Colour discipline needed — green = good, red = critical, yellow = warning, blue = neutral | Post-MVP — define in design system |
| Visual priority — use size + contrast to guide attention, not just colour | Post-MVP — systematic pass |
| Suggest "Today's Focus" section at top of dashboard | Post-MVP — worth exploring |
| Collapse less critical sections | Cockpit "view all" pattern addresses this |
| Compares well to Stripe, Notion, Linear | ✅ Validating positioning |

---

## Post-launch (confirmed, sequenced)

1. **Optimus AI panel** — Claude API + Python analysis → chat-style insight panel in dashboard
2. **Stock Movement page** — blocked on Python mock data script
3. **Debt Management / Enterprise Sales** — Advanced tier; blocked on Python scripts
4. **Period filter expansion** — Year → Quarter → Month → Week → Day dropdowns (include Quarter)
5. **POS integration** (Moniepoint-first) — deferred until n8n pipeline proven stable
6. **PDF / CSV export** — any page
7. **Security hardening** — disable dev bypass · httpOnly cookies · CSP headers
8. **Thumbs up / down on AI signal cards** — trains the model per business
9. **Signal deep-links Int + Adv** — populate `chart_refs` in mock data
10. **Intermediate tier polish** — charts + layout quality up to Basic standard
11. **Regenerate mock JSON** — re-run Int + Adv Python scripts for confidence bands

---

## Blocked (needs external input)

| Item | Blocked on |
|---|---|
| Full API wiring | magbyte-micro Vercel URL · Supabase `analyzed_data` table schema |
| Expenses waterfall (Int/Adv) | Python script needs ≥4 steps in mock data (currently only 2) |
| Staff period filtering | Date dimension not in staff payload — Python/data shape change needed |
| Stock Movement, Customers Int, Debt Management, Enterprise Sales | Python mock data scripts not yet written |

---

## Tech stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router · React 19 · TypeScript |
| Styling | Tailwind CSS v4 · tailwind-merge |
| Charts | Recharts v3 |
| Data fetching | TanStack React Query v5 · Axios · Zustand v5 |
| Package manager | pnpm |
| Auth | Google OAuth → Django JWT → localStorage |
| Analysis pipeline | n8n → magbyte-micro (FastAPI) → Python scripts |
| Database | Supabase (PostgreSQL) via Django ORM |
| Deploy | Vercel (frontend + Django + micro) |
