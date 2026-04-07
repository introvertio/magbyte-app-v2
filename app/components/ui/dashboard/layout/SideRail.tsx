"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/app/stores/dashboard/useDashboardStore";
import type { DashboardTier } from "@/app/stores/dashboard/useDashboardStore";
import { cn } from "@/lib/utils";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

// ── Industry + tier dev toggle ─────────────────────────────────────────────
// Shows industry label with tier picker — only rendered in dev mode.
// One industry now (retail); add more to INDUSTRIES array as they are built.

const INDUSTRIES: { id: string; label: string }[] = [
  { id: "retail", label: "Retail & Provisions" },
];

const TIER_OPTIONS: { tier: DashboardTier; label: string; short: string }[] = [
  { tier: "basic",        label: "Basic",        short: "B" },
  { tier: "intermediate", label: "Int",           short: "I" },
  { tier: "advanced",     label: "Adv",           short: "A" },
];

function DevToggle({ expanded }: { expanded: boolean }): React.ReactElement {
  const { devTier, setDevTier, devIndustry } = useDashboardStore();
  const router = useRouter();
  const industryLabel = INDUSTRIES.find((i) => i.id === devIndustry)?.label ?? devIndustry;

  if (!expanded) {
    // Collapsed: stacked single-letter tier buttons
    return (
      <div className="mx-2 mb-2 rounded-xl border border-white/10 bg-white/5 p-1.5 flex flex-col items-center gap-1">
        {TIER_OPTIONS.map(({ tier, short }) => (
          <button
            key={tier}
            onClick={() => { setDevTier(tier); router.push("/dashboard"); }}
            title={tier}
            className={cn(
              "w-8 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
              devTier === tier
                ? "bg-white text-primary"
                : "text-white/40 hover:text-white hover:bg-white/10",
            )}
          >
            {short}
          </button>
        ))}
      </div>
    );
  }

  // Expanded: industry label + tier pill row
  return (
    <div className="mx-2 mb-2 rounded-xl border border-white/10 bg-white/5 p-2 flex flex-col gap-2">
      {/* Industry label */}
      <div>
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-0.5 px-0.5">Industry</p>
        <p className="text-[11px] font-semibold text-white/60 px-0.5 leading-tight">{industryLabel}</p>
      </div>
      {/* Tier toggle row */}
      <div>
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1 px-0.5">Tier</p>
        <div className="flex gap-1">
          {TIER_OPTIONS.map(({ tier, label }) => (
            <button
              key={tier}
              onClick={() => { setDevTier(tier); router.push("/dashboard"); }}
              className={cn(
                "flex-1 py-1 rounded-lg text-[11px] font-bold transition-all",
                devTier === tier
                  ? "bg-white text-primary"
                  : "text-white/40 hover:text-white hover:bg-white/10",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SideRail(): React.ReactElement {
  const { sideRailExpanded } = useDashboardStore();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 h-full bg-primary-dark border-r border-white/10",
        "transition-all duration-200 ease-in-out overflow-hidden",
        sideRailExpanded ? "w-52" : "w-14"
      )}
    >
      {/* Spacer — pushes content to bottom */}
      <div className="flex-1" />

      {/* Bottom section */}
      <div className="flex flex-col pb-2">
        {/* Dev tier toggle — only in dev mode */}
        {isDevMode && (
          <DevToggle expanded={sideRailExpanded} />
        )}

        {/* Upload (coming soon) */}
        <div className="px-2 pb-2">
          <div
            title={!sideRailExpanded ? "Upload Data" : undefined}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-white/25 cursor-not-allowed"
          >
            <ArrowUpTrayIcon className="size-5 shrink-0" />
            {sideRailExpanded && (
              <span className="text-sm font-medium whitespace-nowrap">Upload Data</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
