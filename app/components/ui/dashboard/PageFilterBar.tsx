"use client";

/**
 * PageFilterBar — light-mode multi-select filter row for use inside page content.
 *
 * Distinct from the TopBar's date filters (Year/Month/Day) which are global.
 * These are page-local content filters: Product, Category, Staff, Supplier, etc.
 *
 * Usage:
 *   const [staffFilters, setStaffFilters] = useState<string[]>([]);
 *   const toggleStaff = (v: string) =>
 *     setStaffFilters(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
 *
 *   <PageFilterBar
 *     filters={[{ id: "staff", label: "Staff", options: staffNames, selected: staffFilters, onToggle: toggleStaff }]}
 *     onClearAll={() => setStaffFilters([])}
 *   />
 */

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";

export interface PageFilterDef {
  id: string;
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

interface PageFilterBarProps {
  filters: PageFilterDef[];
  onClearAll: () => void;
  className?: string;
}

// ── Individual pill + dropdown ────────────────────────────────────────────────

function FilterPill({ def }: { def: PageFilterDef }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = def.selected.length;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors select-none",
          count > 0
            ? "bg-primary/10 border-primary/30 text-primary dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300"
            : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 hover:text-gray-800 dark:hover:text-slate-300"
        )}
      >
        {def.label}
        {count > 0 && (
          <span className="inline-flex items-center justify-center min-w-[16px] h-4 rounded-full bg-primary text-white text-[10px] font-bold px-1">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-40 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg min-w-[160px] max-h-52 overflow-y-auto py-1">
          {def.options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer select-none transition-colors"
            >
              <input
                type="checkbox"
                checked={def.selected.includes(opt)}
                onChange={() => def.onToggle(opt)}
                className="accent-primary size-3 shrink-0"
              />
              <span className="truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main bar ──────────────────────────────────────────────────────────────────

export function PageFilterBar({ filters, onClearAll, className }: PageFilterBarProps): React.ReactElement | null {
  // Only render if at least one filter has options to show
  if (filters.every((f) => f.options.length === 0)) return null;

  const hasActive = filters.some((f) => f.selected.length > 0);
  const activeChips = filters.flatMap((f) =>
    f.selected.map((val) => ({ filterId: f.id, filterLabel: f.label, value: val, onClear: () => f.onToggle(val) }))
  );

  return (
    <div className={cn("space-y-2", className)}>
      {/* Pill row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 font-medium shrink-0">
          <FunnelIcon className="size-3.5" />
          <span>Filter</span>
        </div>
        {filters.filter((f) => f.options.length > 0).map((f) => (
          <FilterPill key={f.id} def={f} />
        ))}
        {hasActive && (
          <button
            onClick={onClearAll}
            className="text-[11px] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors border border-gray-200 dark:border-slate-700 rounded-full px-2.5 py-1 hover:border-gray-300 dark:hover:border-slate-600"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips — shows what is currently selected */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {activeChips.map(({ filterId, filterLabel, value, onClear }) => (
            <span
              key={`${filterId}-${value}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 dark:bg-blue-900/40 text-primary dark:text-blue-300 text-[11px] font-medium border border-primary/20 dark:border-blue-800/50"
            >
              {filterLabel}: {value}
              <button onClick={onClear} className="hover:opacity-70 transition-opacity" aria-label={`Remove ${filterLabel} filter: ${value}`}>
                <XMarkIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
