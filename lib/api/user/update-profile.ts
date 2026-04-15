import axios from "axios";
import { API_BASE_URL } from "../api-url";
import { USER_ENDPOINTS } from "./user-urls";
import type { BasicAnalysisResult } from "@/app/types/basicAnalysis";
import type { ExecutiveSummaryResult } from "@/app/types/executiveSummary";

export interface UpdateUserProfileBody {
  pfp?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  business_name?: string;
  business_industry?: string;
  // Analysis data saved back to Django after a successful upload
  analyzed_data?: BasicAnalysisResult;
  executive_summary?: ExecutiveSummaryResult;
  forecast_logs?: unknown[];
  data?: unknown[];
}
export interface UpdateUserProfileSuccess {
  message: string; // "User profile updated successfully"
}
export interface UpdateUserProfileAuthError {
  detail: string;
  code: string;
}
export interface UpdateUserProfileNotFoundError {
  error: string; // "User profile not found"
}
export interface UpdateUserProfileServerError {
  error: string;
}

export async function updateUserProfile(
  token: string,
  data: UpdateUserProfileBody
): Promise<UpdateUserProfileSuccess> {
  try {
    const response = await axios.patch<UpdateUserProfileSuccess>(
      `${API_BASE_URL}${USER_ENDPOINTS.UPDATE_PROFILE}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.status === 401 && err.response.data) {
      throw err.response.data as UpdateUserProfileAuthError;
    }
    if (err.response && err.response.status === 404 && err.response.data) {
      throw err.response.data as UpdateUserProfileNotFoundError;
    }
    if (err.response && err.response.status === 500 && err.response.data) {
      throw err.response.data as UpdateUserProfileServerError;
    }
    throw new Error(err.message || "An unexpected error occurred");
  }
}
