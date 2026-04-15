"use client";
// Data access hooks for the dashboard.
// Returns real data from the user's profile when available, mock data otherwise.
// The `useGetProfile` hook fetches the profile (including analyzed_data +
// executive_summary) from Django and caches it via React Query.

import {
  mockBasicAnalysis,
  mockExecutiveSummary,
  mockIntermediateExecutiveSummary,
  mockAdvancedExecutiveSummary,
  mockIntermediateAnalysis,
  mockAdvancedAnalysis,
} from "@/app/mock";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import { useDashboardStore } from "@/app/stores/dashboard/useDashboardStore";
import type { BasicAnalysisResult } from "@/app/types/basicAnalysis";
import type { ExecutiveSummaryResult } from "@/app/types/executiveSummary";
import type { IntermediateAnalysisResult } from "@/app/types/intermediateAnalysis";
import type { AdvancedAnalysisResult } from "@/app/types/advancedAnalysis";

// Returns true when running in dev bypass mode (mock data always shown).
// In production NEXT_PUBLIC_DEV_BYPASS_AUTH is not set, so this is false.
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

export function useBasicAnalysis(): BasicAnalysisResult {
  const { data: profile } = useGetProfile();
  if (!DEV_BYPASS && profile?.analyzed_data) {
    // Real data from Django — cast to BasicAnalysisResult
    return profile.analyzed_data as BasicAnalysisResult;
  }
  return mockBasicAnalysis;
}

export function useExecutiveSummary(): ExecutiveSummaryResult {
  const { data: profile } = useGetProfile();
  if (!DEV_BYPASS && profile?.executive_summary) {
    return profile.executive_summary as ExecutiveSummaryResult;
  }
  return mockExecutiveSummary;
}

/** Returns the executive summary for the active tier. */
export function useExecutiveSummaryData(): ExecutiveSummaryResult {
  const { devTier } = useDashboardStore();
  const { data: profile } = useGetProfile();

  // In dev bypass mode, follow the tier switcher
  if (DEV_BYPASS) {
    if (devTier === "intermediate") return mockIntermediateExecutiveSummary;
    if (devTier === "advanced")     return mockAdvancedExecutiveSummary;
    return mockExecutiveSummary;
  }

  if (profile?.executive_summary) {
    return profile.executive_summary as ExecutiveSummaryResult;
  }
  return mockExecutiveSummary;
}

export function useIntermediateAnalysis(): IntermediateAnalysisResult {
  // Intermediate + Advanced data not yet wired to real API (same analyzed_data
  // column, but Int/Adv scripts are not yet built on magbyte-micro).
  // TODO: update when Int/Adv GEX tokens are live.
  return mockIntermediateAnalysis;
}

export function useAdvancedAnalysis(): AdvancedAnalysisResult {
  return mockAdvancedAnalysis;
}

// ── Tier-aware page hooks ──────────────────────────────────────────────────
// Sales, Products, Customers, Forecast pages call these to get the right data.

/** Returns page_1 (Sales) data tagged with the active tier. */
export function useSalesPageData():
  | { tier: "basic";        data: BasicAnalysisResult["page_1"] }
  | { tier: "intermediate"; data: IntermediateAnalysisResult["page_1"] }
  | { tier: "advanced";     data: AdvancedAnalysisResult["page_1"] } {
  const { devTier } = useDashboardStore();
  const { data: profile } = useGetProfile();

  if (!DEV_BYPASS && profile?.analyzed_data) {
    return { tier: "basic", data: (profile.analyzed_data as BasicAnalysisResult).page_1 };
  }
  if (devTier === "intermediate") return { tier: "intermediate", data: mockIntermediateAnalysis.page_1 };
  if (devTier === "advanced")     return { tier: "advanced",     data: mockAdvancedAnalysis.page_1 };
  return { tier: "basic", data: mockBasicAnalysis.page_1 };
}

/** Returns page_2 (Products) data tagged with the active tier. */
export function useProductsPageData():
  | { tier: "basic";        data: BasicAnalysisResult["page_2"] }
  | { tier: "intermediate"; data: IntermediateAnalysisResult["page_2"] }
  | { tier: "advanced";     data: AdvancedAnalysisResult["page_2"] } {
  const { devTier } = useDashboardStore();
  const { data: profile } = useGetProfile();

  if (!DEV_BYPASS && profile?.analyzed_data) {
    return { tier: "basic", data: (profile.analyzed_data as BasicAnalysisResult).page_2 };
  }
  if (devTier === "intermediate") return { tier: "intermediate", data: mockIntermediateAnalysis.page_2 };
  if (devTier === "advanced")     return { tier: "advanced",     data: mockAdvancedAnalysis.page_2 };
  return { tier: "basic", data: mockBasicAnalysis.page_2 };
}

/** Returns Customers page data — only available on intermediate/advanced. Returns null for basic. */
export function useCustomersPageData():
  | { tier: "intermediate"; data: IntermediateAnalysisResult["page_3"] }
  | { tier: "advanced";     data: AdvancedAnalysisResult["page_3"] }
  | null {
  const { devTier } = useDashboardStore();
  if (devTier === "intermediate") return { tier: "intermediate", data: mockIntermediateAnalysis.page_3 };
  if (devTier === "advanced")     return { tier: "advanced",     data: mockAdvancedAnalysis.page_3 };
  return null;
}

/** Returns Forecast data for the active tier.
 *  Basic → page_3 · Intermediate → page_5 · Advanced → page_6 */
export function useForecastPageData():
  | { tier: "basic";        data: BasicAnalysisResult["page_3"] }
  | { tier: "intermediate"; data: IntermediateAnalysisResult["page_5"] }
  | { tier: "advanced";     data: AdvancedAnalysisResult["page_6"] } {
  const { devTier } = useDashboardStore();
  const { data: profile } = useGetProfile();

  if (!DEV_BYPASS && profile?.analyzed_data) {
    return { tier: "basic", data: (profile.analyzed_data as BasicAnalysisResult).page_3 };
  }
  if (devTier === "intermediate") return { tier: "intermediate", data: mockIntermediateAnalysis.page_5 };
  if (devTier === "advanced")     return { tier: "advanced",     data: mockAdvancedAnalysis.page_6 };
  return { tier: "basic", data: mockBasicAnalysis.page_3 };
}

/** Returns metadata for the active tier. */
export function useTierMetadata(): { date_range: { start: string; end: string }; record_count: number } {
  const { devTier } = useDashboardStore();
  const { data: profile } = useGetProfile();

  if (!DEV_BYPASS && profile?.analyzed_data) {
    return (profile.analyzed_data as BasicAnalysisResult).metadata as { date_range: { start: string; end: string }; record_count: number };
  }
  if (devTier === "intermediate") return mockIntermediateAnalysis.metadata;
  if (devTier === "advanced")     return mockAdvancedAnalysis.metadata as { date_range: { start: string; end: string }; record_count: number };
  return mockBasicAnalysis.metadata as { date_range: { start: string; end: string }; record_count: number };
}

/** Returns true if the user has uploaded data, false if not yet.
 *  Used by the cockpit to decide whether to show the dashboard or the holding page. */
export function useHasAnalysisData(): boolean {
  const { data: profile } = useGetProfile();
  if (DEV_BYPASS) return true;
  return !!profile?.analyzed_data;
}
