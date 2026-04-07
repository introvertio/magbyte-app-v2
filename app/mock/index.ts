// Mock data exports — typed wrappers around the generated JSON outputs.
// TODO: Replace these with React Query hooks hitting GET /api/analysis/:id
//       once n8n is active and the API is populated.

import basicData from "./basic_analysis_output.json";
import execSummaryData from "./executive_summary_output_all.json";
import execSummaryIntermediateData from "./executive_summary_intermediate.json";
import execSummaryAdvancedData from "./executive_summary_advanced.json";
import intermediateData from "./intermediate_dashboard_data.json";
import advancedData from "./advanced_analysis_output.json";
import type { BasicAnalysisResult } from "@/app/types/basicAnalysis";
import type { ExecutiveSummaryResult } from "@/app/types/executiveSummary";
import type { IntermediateAnalysisResult } from "@/app/types/intermediateAnalysis";
import type { AdvancedAnalysisResult } from "@/app/types/advancedAnalysis";

export const mockBasicAnalysis = basicData as unknown as BasicAnalysisResult;
export const mockExecutiveSummary = execSummaryData as unknown as ExecutiveSummaryResult;
export const mockIntermediateExecutiveSummary = execSummaryIntermediateData as unknown as ExecutiveSummaryResult;
export const mockAdvancedExecutiveSummary = execSummaryAdvancedData as unknown as ExecutiveSummaryResult;
export const mockIntermediateAnalysis = intermediateData as unknown as IntermediateAnalysisResult;
export const mockAdvancedAnalysis = advancedData as unknown as AdvancedAnalysisResult;
