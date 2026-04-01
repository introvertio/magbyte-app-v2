"use client";
// Data access hooks for the dashboard.
// Currently returns mock data directly.
// TODO: Replace with useQuery calls once n8n + API is active:
//   useQuery<BasicAnalysisResult>({ queryKey: ['analysis', id], queryFn: () => getAnalysis(id) })

import {
  mockBasicAnalysis,
  mockExecutiveSummary,
  mockIntermediateExecutiveSummary,
  mockAdvancedExecutiveSummary,
  mockIntermediateAnalysis,
  mockAdvancedAnalysis,
} from "@/app/mock";
import { useDashboardStore } from "@/app/stores/dashboard/useDashboardStore";
import type { BasicAnalysisResult } from "@/app/types/basicAnalysis";
import type { ExecutiveSummaryResult } from "@/app/types/executiveSummary";
import type { IntermediateAnalysisResult } from "@/app/types/intermediateAnalysis";
import type { AdvancedAnalysisResult } from "@/app/types/advancedAnalysis";

export function useBasicAnalysis(): BasicAnalysisResult {
  return mockBasicAnalysis;
}

export function useExecutiveSummary(): ExecutiveSummaryResult {
  return mockExecutiveSummary;
}

/** Returns the executive summary for the active tier. */
export function useExecutiveSummaryData(): ExecutiveSummaryResult {
  const { devTier } = useDashboardStore();
  if (devTier === "intermediate") return mockIntermediateExecutiveSummary;
  if (devTier === "advanced")     return mockAdvancedExecutiveSummary;
  return mockExecutiveSummary;
}

export function useIntermediateAnalysis(): IntermediateAnalysisResult {
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
  if (devTier === "intermediate") return { tier: "intermediate", data: mockIntermediateAnalysis.page_5 };
  if (devTier === "advanced")     return { tier: "advanced",     data: mockAdvancedAnalysis.page_6 };
  return { tier: "basic", data: mockBasicAnalysis.page_3 };
}

/** Returns metadata for the active tier. */
export function useTierMetadata(): { date_range: { start: string; end: string }; record_count: number } {
  const { devTier } = useDashboardStore();
  if (devTier === "intermediate") return mockIntermediateAnalysis.metadata;
  if (devTier === "advanced")     return mockAdvancedAnalysis.metadata as { date_range: { start: string; end: string }; record_count: number };
  return mockBasicAnalysis.metadata as { date_range: { start: string; end: string }; record_count: number };
}
