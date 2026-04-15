import axios from "axios";
import { API_BASE_URL } from "../api-url";
import { USER_ENDPOINTS } from "./user-urls";
import type { BasicAnalysisResult } from "@/app/types/basicAnalysis";
import type { ExecutiveSummaryResult } from "@/app/types/executiveSummary";

export interface UserProfileResponse {
  first_name: string;
  last_name: string;
  email: string;
  google_user: boolean;
  pfp: string;
  phone: string;
  business_name: string;
  business_industry: string;
  // Analysis data — null until the user has uploaded their data
  analyzed_data: BasicAnalysisResult | null;
  executive_summary: ExecutiveSummaryResult | null;
  forecast_logs: unknown[] | null;
  data: unknown[] | null;
}
export interface UserProfileNotFoundError {
  error: string;
}
export interface UserProfileAuthError {
  detail: string;
  code: string;
}

export type GetUserProfileResponse = UserProfileResponse;

export async function getUserProfile(
  token: string
): Promise<GetUserProfileResponse> {
  try {
    const response = await axios.get<UserProfileResponse>(
      `${API_BASE_URL}${USER_ENDPOINTS.GET_PROFILE}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.status === 401 && err.response.data) {
      throw err.response.data as UserProfileAuthError;
    }
    if (err.response && err.response.status === 404 && err.response.data) {
      throw err.response.data as UserProfileNotFoundError;
    }
    throw new Error(err.message || "An unexpected error occurred");
  }
}
