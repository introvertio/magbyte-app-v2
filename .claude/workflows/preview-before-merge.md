---
description: Preview UI or code changes on a branch before merging to main
---

## Branch-First Change Workflow

Any significant change to the codebase — especially UI/styling changes, new features, or
refactors — MUST follow this workflow. Never commit significant changes directly to `main`.

### Step 1 — Create a feature branch
Before making any changes, create a branch named after the feature:
```bash
git checkout main
git pull origin main
git checkout -b feature/<short-description>
```
Examples: `feature/notion-theme`, `feature/date-filter-ui`, `fix/hydration-error`

### Step 2 — Make the changes
Apply code changes on the branch as normal.
The dev server (`pnpm dev` at localhost:3302) will hot-reload changes automatically.

### Step 3 — Tell the user to preview
After changes are applied, always tell the user:
> "Changes are ready on branch `feature/<name>`. Preview them at http://localhost:3302 — let me know if you're happy and I'll merge to main, or tell me what to adjust."

### Step 4 — Merge or discard based on user feedback
**If the user approves:**
```bash
git checkout main
git merge feature/<short-description>
git push origin main
git branch -d feature/<short-description>
```

**If the user wants to discard:**
```bash
git checkout main
git branch -D feature/<short-description>
```

**If the user wants adjustments:**
Stay on the branch and iterate until approved.

---

## Rules
- NEVER commit directly to `main` for UI/styling changes, new features, or refactors.
- Small, isolated bug fixes (e.g. fixing a typo) may be committed directly to `main` with user agreement.
- Always state the branch name and preview URL after applying changes.
- Do NOT merge until the user explicitly says they're happy.
