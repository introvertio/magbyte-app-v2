"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Account from "./header/Account";
import { useDashboardStore } from "@/app/stores/dashboard/useDashboardStore";
import { useExecutiveSummaryData, useTierMetadata } from "@/app/hooks/useDashboardData";
import { cn } from "@/lib/utils";
import { Bars3Icon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import type { DashboardTier } from "@/app/stores/dashboard/useDashboardStore";

// ── Page navigation per tier ──────────────────────────────────────────────────

interface NavItem { label: string; href: string; exact: boolean; }

const FORECAST_NAV: NavItem = { label: "Forecast Insights", href: "/dashboard/forecast", exact: false };

const NAV_BY_TIER: Record<DashboardTier, NavItem[]> = {
  basic: [
    { label: "Cockpit",             href: "/dashboard",          exact: true  },
    { label: "Sales Overview",      href: "/dashboard/sales",    exact: false },
    { label: "Product Performance", href: "/dashboard/products", exact: false },
    FORECAST_NAV,
  ],
  intermediate: [
    { label: "Cockpit",             href: "/dashboard",           exact: true  },
    { label: "Sales Overview",      href: "/dashboard/sales",     exact: false },
    { label: "Product Performance", href: "/dashboard/products",  exact: false },
    { label: "Customers",           href: "/dashboard/customers", exact: false },
    { label: "Expenses",            href: "/dashboard/expenses",  exact: false },
    FORECAST_NAV,
  ],
  advanced: [
    { label: "Cockpit",             href: "/dashboard",           exact: true  },
    { label: "Sales Overview",      href: "/dashboard/sales",     exact: false },
    { label: "Product Performance", href: "/dashboard/products",  exact: false },
    { label: "Customers",           href: "/dashboard/customers", exact: false },
    { label: "Expenses",            href: "/dashboard/expenses",  exact: false },
    { label: "Staff Performance",   href: "/dashboard/staff",     exact: false },
    FORECAST_NAV,
  ],
};

// ── Filter constants ──────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Mon-first order. Values map to JS getDay() (0=Sun, 1=Mon … 6=Sat)
const DAYS: { label: string; value: number }[] = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

/** Returns all calendar years from dataset start to end (inclusive). */
function getAvailableYears(start: string, end: string): number[] {
  const s = new Date(start).getFullYear();
  const e = new Date(end).getFullYear();
  const years: number[] = [];
  for (let y = s; y <= e; y++) years.push(y);
  return years;
}

// ── Health score helpers ──────────────────────────────────────────────────────

function scoreColour(colour: string): string {
  if (colour === "green") return "text-emerald-400";
  if (colour === "red")   return "text-red-400";
  return "text-amber-400";
}

function HealthMiniWidget({ score, colour }: { score: number; colour: string }): React.ReactElement {
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (score / 100);
  const gap = circumference - filled;
  const ringColour = colour === "green" ? "#34d399" : colour === "red" ? "#f87171" : "#fbbf24";

  return (
    <Link href="/dashboard" title={`Business Health: ${score}/100`} className="flex items-center gap-1.5 group">
      <svg width="32" height="32" viewBox="0 0 32 32" className="-rotate-90">
        <circle cx="16" cy="16" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
        <circle
          cx="16" cy="16" r={radius}
          fill="none" stroke={ringColour} strokeWidth="3"
          strokeDasharray={`${filled} ${gap}`} strokeLinecap="round"
        />
      </svg>
      <span className={cn("text-xs font-bold tabular-nums", scoreColour(colour))}>{score}</span>
    </Link>
  );
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return "";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

// ── Date filter dropdowns ─────────────────────────────────────────────────────

const SELECT_CLS =
  "bg-white/10 border border-white/20 rounded-lg text-white text-[11px] font-medium px-2 py-1 focus:outline-none focus:border-white/40 [color-scheme:dark] cursor-pointer";

function DateFilterBar(): React.ReactElement {
  const {
    filterYear, filterMonth, filterDayOfWeek,
    setFilterYear, setFilterMonth, setFilterDayOfWeek,
  } = useDashboardStore();

  const metadata = useTierMetadata();
  const years = getAvailableYears(metadata.date_range.start, metadata.date_range.end);

  const isFiltered = filterYear !== null || filterMonth !== null || filterDayOfWeek !== null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Year */}
      <select
        value={filterYear ?? ""}
        onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : null)}
        className={SELECT_CLS}
        aria-label="Filter by year"
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* Month */}
      <select
        value={filterMonth ?? ""}
        onChange={(e) => setFilterMonth(e.target.value !== "" ? Number(e.target.value) : null)}
        className={SELECT_CLS}
        aria-label="Filter by month"
      >
        <option value="">Month</option>
        {MONTHS.map((m, i) => (
          <option key={i} value={i}>{m}</option>
        ))}
      </select>

      {/* Day of week */}
      <select
        value={filterDayOfWeek ?? ""}
        onChange={(e) => setFilterDayOfWeek(e.target.value !== "" ? Number(e.target.value) : null)}
        className={SELECT_CLS}
        aria-label="Filter by day of week"
      >
        <option value="">Day</option>
        {DAYS.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>

      {/* Clear button — only shown when a filter is active */}
      {isFiltered && (
        <button
          onClick={() => {
            setFilterYear(null);
            setFilterMonth(null);
            setFilterDayOfWeek(null);
          }}
          className="text-[10px] font-semibold text-white/40 hover:text-white/80 transition-colors px-1.5 py-1 rounded border border-white/10 hover:border-white/30"
          aria-label="Clear all filters"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

export default function TopBar(): React.ReactElement {
  const pathname = usePathname();
  const { toggleSideRail, devTier, theme, toggleTheme } = useDashboardStore();
  const summary = useExecutiveSummaryData();

  const navItems = NAV_BY_TIER[devTier];

  const dateRange = formatDateRange(
    summary.metadata?.period?.start,
    summary.metadata?.period?.end
  );
  const { score, colour } = summary.health_score;

  return (
    <header className="sticky top-0 z-50 w-full bg-primary-dark border-b border-white/10 shadow-sm">
      {/* Main row */}
      <div className="h-16 flex items-center px-4 md:px-6 gap-4">

        {/* ── Left: hamburger + logo ── */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleSideRail}
            aria-label="Toggle navigation"
            className="hidden md:flex p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bars3Icon className="size-5" />
          </button>
          <Link href="/dashboard" className="active:scale-95 transition-transform">
            <img
              src="/MagByteLogo.png"
              alt="MagByte"
              className="h-7 w-auto object-contain brightness-0 invert"
            />
          </Link>
        </div>

        {/* ── Center: page nav pills (desktop only) ── */}
        <nav className="hidden lg:flex items-center gap-1 mx-auto">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 select-none",
                  isActive
                    ? "bg-white text-primary-dark font-semibold"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Right cluster ── */}
        <div className="flex items-center gap-3 ml-auto shrink-0">

          {/* Date range badge (desktop) */}
          {dateRange && (
            <span className="hidden md:block text-white/40 text-xs font-medium tracking-wide whitespace-nowrap border border-white/10 px-2.5 py-1 rounded-full">
              {dateRange}
            </span>
          )}

          {/* Health mini-widget */}
          <HealthMiniWidget score={score} colour={colour} />

          {/* Date filter dropdowns (desktop) */}
          <div className="hidden md:block">
            <DateFilterBar />
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            {theme === "dark" ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
          </button>

          {/* Account avatar */}
          <Account />
        </div>
      </div>
    </header>
  );
}
