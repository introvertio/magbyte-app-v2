# HANDOVER 2 — Backend / API Integration

_Covers the backend architecture discussions and frontend-API wiring plan.  
Frontend mock-data work is documented in `HANDOVER.md`._

---

## Current state (frontend)

- All dashboard pages render **mock JSON** from `app/mock/`
- The swap point is `app/hooks/useDashboardData.ts` — every hook returns mock data directly
- Auth flow is fully wired: Google OAuth → `/oauth-callback` → JWT → localStorage
- New users (`new_user: true` in OAuth callback response) are routed to `/dashboard/user/update`
- Returning users go straight to `/dashboard`
- `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` is active in dev — must be disabled before prod

---

## New backend architecture (FastAPI mini server)

A separate FastAPI server (not the existing Django backend at `mag-byte-api.vercel.app`) handles analysis.

### Endpoints

#### `POST /upload`
Accepts a file or link + a regex routing token. Sends to n8n, returns analysis result.
```json
{
  "rgx": "#%RT",
  "file": <file>
}
// or
{
  "rgx": "#%RT",
  "link": "https://..."
}
```

#### `POST /run`
Accepts JSON + regex. Runs the analysis script, then the exec script.
Returns analysis JSON + exec JSON + logs (all in one large dictionary).
```json
{
  "rgx": "#%RT",
  "json": { ... }
}
```

### Regex routing
- Each industry has a fixed regex token (e.g. Retail & Provisions = `#%RT`)
- The **backend** appends the correct regex based on `user.business_industry` from their profile — frontend never needs to know it
- On request: server gets all analysis scripts → tests regex → first match runs → repeats for exec scripts
- Clean, no if-statements; adding a new industry = drop a new script in the folder with its `Rgx` variable set

### Industry regex list
Fixed in the Django backend from the start. Grows by adding scripts, not by changing backend code.

---

## Frontend questions still open

Before `useDashboardData.ts` can be wired to real API:

| # | Question | Why it matters |
|---|---|---|
| 1 | **FastAPI server URL** | Goes into `lib/api/api-url.ts` (or a second URL constant) |
| 2 | **How does the dashboard fetch stored analysis?** | Is there a `GET /analysis` endpoint, or does `/upload` return it directly and it's stored client-side? |
| 3 | **Does `GET /user/get` return `tier`?** | Frontend needs `user.tier` to unlock the right pages (Basic/Int/Adv) |
| 4 | **Analysis JSON shape** | Is it identical to the mock structure (`page_1`, `page_2`, `metadata`, etc.) or wrapped? |
| 5 | **Pending/not-ready state** | Agreed: show "Analyzing…" UI. But what does the API return when data isn't ready yet — 404, `{ status: "pending" }`, or something else? |

---

## Agreed frontend behaviour (once API is ready)

```
User logs in
  └─ new_user = true  → /dashboard/user/update (onboarding: biz name, industry, upload)
  └─ new_user = false → /dashboard
       └─ analysis data exists  → show dashboard (real data, tier from profile)
       └─ analysis not ready    → show "Analyzing…" holding page
```

- `useDashboardData.ts` will be replaced with `useQuery` calls (TanStack React Query v5)
- Loading / error / no-data states needed on every data-dependent component (already enforced by CLAUDE.md)
- `devTier` in Zustand stays for local dev; production reads `user.tier` from API

---

## What to build once questions are answered

1. Add FastAPI base URL constant to `lib/api/`
2. Add `tier` to `UserProfileResponse` type in `lib/api/user/get-profile.ts`
3. Create `lib/api/analysis/get-analysis.ts` — typed fetch function
4. Rewrite `useDashboardData.ts` hooks to use `useQuery` with real endpoint
5. Add "Analyzing…" holding page / state for pending analysis
6. Disable `NEXT_PUBLIC_DEV_BYPASS_AUTH` and test full auth → onboarding → dashboard flow
