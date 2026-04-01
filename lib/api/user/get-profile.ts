import axios from "axios";
import { API_BASE_URL } from "../api-url";
import { USER_ENDPOINTS } from "./user-urls";

export interface UserProfileResponse {
  first_name: string;
  last_name: string;
  email: string;
  google_user: boolean;
  pfp: string;
  phone: string;
  business_name: string;
  business_industry: string;
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
