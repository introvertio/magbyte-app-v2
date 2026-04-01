"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Tier controls which nav items and mock data are used.
export type DashboardTier = "basic" | "intermediate" | "advanced";

// Industry key — one entry per supported industry.
export type DevIndustry = "retail";

interface DashboardState {
  // ── Date filters ──────────────────────────────────────────────────────────
  filterYear:         number | null; // e.g. 2025, null = all years
  filterMonth:        number | null; // 0=Jan … 11=Dec, null = all months
  filterDayOfWeek:    number | null; // 0=Sun … 6=Sat, null = all days
  setFilterYear:      (year: number | null) => void;
  setFilterMonth:     (month: number | null) => void;
  setFilterDayOfWeek: (day: number | null) => void;

  // ── Layout ─────────────────────────────────────────────────────────────────
  sideRailExpanded: boolean;
  toggleSideRail: () => void;
  setSideRailExpanded: (expanded: boolean) => void;

  // ── Dev-mode tier switcher ─────────────────────────────────────────────────
  devTier: DashboardTier;
  setDevTier: (tier: DashboardTier) => void;

  devIndustry: DevIndustry;
  setDevIndustry: (industry: DevIndustry) => void;

  // ── UI theme ───────────────────────────────────────────────────────────────
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      filterYear:         null,
      filterMonth:        null,
      filterDayOfWeek:    null,
      setFilterYear:      (filterYear)      => set({ filterYear }),
      setFilterMonth:     (filterMonth)     => set({ filterMonth }),
      setFilterDayOfWeek: (filterDayOfWeek) => set({ filterDayOfWeek }),

      sideRailExpanded: true,
      toggleSideRail: () =>
        set((state) => ({ sideRailExpanded: !state.sideRailExpanded })),
      setSideRailExpanded: (expanded) => set({ sideRailExpanded: expanded }),

      devTier: "basic",
      setDevTier: (devTier) => set({ devTier }),

      devIndustry: "retail",
      setDevIndustry: (devIndustry) => set({ devIndustry }),

      theme: "light",
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
    }),
    {
      name: "dashboard-prefs",
    }
  )
);
