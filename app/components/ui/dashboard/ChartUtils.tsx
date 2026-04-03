"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

// ── Brand colour palette ────────────────────────────────────────────────────

export const CHART_COLOURS = {
  primary: "#001BB7",
  primaryMid: "#2563eb",
  primaryLight: "#60a5fa",
  green: "#059669",
  greenLight: "#34d399",
  amber: "#d97706",
  red: "#dc2626",
  slate: "#64748b",
  purple: "#7c3aed",
};

export const DONUT_COLOURS = [
  "#001BB7", "#2563eb", "#60a5fa", "#93c5fd",
  "#6366f1", "#a5b4fc", "#34d399", "#fbbf24",
  "#f87171", "#c4b5fd",
];

// ── Gradient IDs ────────────────────────────────────────────────────────────

export const GRAD = {
  blueH:    "g-blue-h",     // horizontal bar — left-to-right blue
  greenH:   "g-green-h",    // horizontal bar — left-to-right green
  blueV:    "g-blue-v",     // vertical bar — top-to-bottom blue
  greenV:   "g-green-v",    // vertical bar — top-to-bottom green
  amberV:   "g-amber-v",    // vertical bar — top-to-bottom amber
  blueArea: "g-blue-area",  // area fill — blue fade
  greenArea:"g-green-area", // area fill — green fade
  bandArea: "g-band-area",  // forecast confidence band
};

/**
 * Drop this inside any Recharts chart as a direct child.
 * Recharts renders unknown SVG children as-is within the SVG element.
 */
export function GradDefs(): React.ReactElement {
  return (
    <defs>
      {/* Horizontal bars */}
      <linearGradient id={GRAD.blueH} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor={CHART_COLOURS.primary}   stopOpacity={0.95} />
        <stop offset="100%" stopColor={CHART_COLOURS.primaryMid} stopOpacity={0.70} />
      </linearGradient>
      <linearGradient id={GRAD.greenH} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor={CHART_COLOURS.green}      stopOpacity={0.95} />
        <stop offset="100%" stopColor={CHART_COLOURS.greenLight}  stopOpacity={0.70} />
      </linearGradient>
      {/* Vertical bars */}
      <linearGradient id={GRAD.blueV} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={CHART_COLOURS.primaryMid} stopOpacity={0.95} />
        <stop offset="100%" stopColor={CHART_COLOURS.primary}    stopOpacity={0.75} />
      </linearGradient>
      <linearGradient id={GRAD.greenV} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={CHART_COLOURS.greenLight}  stopOpacity={0.95} />
        <stop offset="100%" stopColor={CHART_COLOURS.green}       stopOpacity={0.75} />
      </linearGradient>
      <linearGradient id={GRAD.amberV} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#fbbf24" stopOpacity={0.95} />
        <stop offset="100%" stopColor="#d97706" stopOpacity={0.75} />
      </linearGradient>
      {/* Area fills (under line charts) */}
      <linearGradient id={GRAD.blueArea} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={CHART_COLOURS.primary} stopOpacity={0.25} />
        <stop offset="100%" stopColor={CHART_COLOURS.primary} stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id={GRAD.greenArea} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={CHART_COLOURS.green} stopOpacity={0.25} />
        <stop offset="100%" stopColor={CHART_COLOURS.green} stopOpacity={0.02} />
      </linearGradient>
      {/* Forecast confidence band */}
      <linearGradient id={GRAD.bandArea} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#93c5fd" stopOpacity={0.30} />
        <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.05} />
      </linearGradient>
    </defs>
  );
}

// ── Custom dark tooltip ─────────────────────────────────────────────────────

// Recharts passes these props to a custom tooltip component at runtime
interface DashTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string | number;
  valueFormatter?: (v: number) => string;
}

export function DashTooltip({ active, payload, label, valueFormatter }: DashTooltipProps): React.ReactElement | null {
  if (!active || !payload?.length) return null;
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString());

  return (
    <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2.5 shadow-lg border border-gray-200 dark:border-slate-700 min-w-[130px] max-w-[220px] pointer-events-none">
      {label !== undefined && label !== null && String(label) !== "" && (
        <p className="text-gray-500 dark:text-slate-400 text-[10px] font-medium border-b border-gray-100 dark:border-slate-700 pb-1.5 mb-2 truncate">{String(label)}</p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 min-w-0">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color ?? CHART_COLOURS.primary }}
              />
              <span className="text-gray-600 dark:text-slate-300 capitalize truncate">{String(entry.name ?? "")}</span>
            </span>
            <span className="font-bold tabular-nums text-gray-900 dark:text-slate-100 shrink-0">
              {fmt(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section header with left-accent bar ────────────────────────────────────

export function SectionHeader({ title }: { title: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="w-[3px] h-4 rounded-full bg-primary shrink-0" />
      <h2 className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{title}</h2>
    </div>
  );
}

// ── Chart wrapper card ──────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function ChartCard({ title, subtitle, children, className, fullWidth }: ChartCardProps): React.ReactElement {
  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm",
      fullWidth && "col-span-full",
      className,
    )}>
      <div className="px-5 py-3.5 border-b border-gray-100 dark:border-slate-800 flex items-start justify-between">
        <div>
          {subtitle && (
            <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{subtitle}</p>
          )}
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-snug">{title}</p>
        </div>
      </div>
      <div className="p-5 pt-4">{children}</div>
    </div>
  );
}

// ── KPI Card (shared base — used on Sales, Products, Forecast) ──────────────

interface KpiCardProps {
  label: string;
  value: string;
  tooltip: string;
  sub?: string;
  alert?: boolean;
  accent?: "blue" | "green" | "amber" | "red" | "none";
}

const ACCENT_STYLES: Record<string, { card: string; value: string; dot: string }> = {
  blue:  { card: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900",       value: "text-blue-700 dark:text-blue-400",     dot: "bg-blue-500" },
  green: { card: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900", value: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  amber: { card: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900",   value: "text-amber-700 dark:text-amber-400",   dot: "bg-amber-500" },
  red:   { card: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",           value: "text-red-600 dark:text-red-400",       dot: "bg-red-500" },
  none:  { card: "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800",          value: "text-gray-900 dark:text-slate-100",    dot: "bg-gray-300 dark:bg-slate-500" },
};

export function KpiCard({ label, value, tooltip, sub, alert = false, accent = "none" }: KpiCardProps): React.ReactElement {
  const [showTip, setShowTip] = useState(false);
  const style = alert ? ACCENT_STYLES.red : ACCENT_STYLES[accent];

  return (
    <div className={cn("relative rounded-2xl p-4 border transition-shadow hover:shadow-md", style.card)}>
      {/* Corner decoration */}
      <span className="pointer-events-none absolute -right-5 -top-5 size-16 rounded-full bg-black/[0.035]" />
      <span className="pointer-events-none absolute -right-1.5 -top-1.5 size-7 rounded-full bg-black/[0.03]" />

      <div className="relative flex items-start justify-between gap-1 mb-2">
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 leading-snug">{label}</p>
        <button
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onFocus={() => setShowTip(true)}
          onBlur={() => setShowTip(false)}
          className="text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors shrink-0"
          aria-label={`Info: ${label}`}
        >
          <InformationCircleIcon className="size-3.5" />
        </button>
        {showTip && (
          <div className="absolute top-5 right-0 z-20 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2 w-52 shadow-lg leading-relaxed border border-gray-200 dark:border-slate-700">
            {tooltip}
          </div>
        )}
      </div>

      <p className={cn("text-[26px] font-bold leading-tight tabular-nums", style.value)}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 leading-snug">{sub}</p>}

      {alert && (
        <div className="flex items-center gap-1 mt-1.5">
          <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
          <p className="text-[10px] text-red-600 font-semibold">Needs attention</p>
        </div>
      )}
    </div>
  );
}

// ── Shared axis props ───────────────────────────────────────────────────────

export const TICK = { fontSize: 11, fill: "#94a3b8" } as const;
export const GRID_STROKE = "transparent";
