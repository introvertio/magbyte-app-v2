import axios from "axios";
import { API_BASE_URL } from "../api-url";
import { AUTH_ENDPOINTS } from "./auth-urls";

export interface GoogleOAuthCallbackExistingUserResponse {
  message: string; // "User signed in successfully"
  access_token: string;
  new_user?: false;
}
export interface GoogleOAuthCallbackNewUserResponse {
  message: string; // "User signed in successfully"
  access_token: string;
  new_user: true;
}
export type GoogleOAuthCallbackResponse =
  | GoogleOAuthCallbackExistingUserResponse
  | GoogleOAuthCallbackNewUserResponse;
export interface GoogleOAuthCallbackError {
  error: string;
  details?: any;
}

export async function handleGoogleOAuthCallback(
  code: string
): Promise<GoogleOAuthCallbackResponse> {
  if (!code) {
    throw new Error("Authorization code is missing");
  }
  try {
    const response = await axios.get<GoogleOAuthCallbackResponse>(
      `${API_BASE_URL}${AUTH_ENDPOINTS.GOOGLE_OAUTH_CALLBACK}`,
      { params: { code } }
    );
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data && err.response.data.error) {
      throw new Error(
        err.response.data.error +
          (err.response.data.details
            ? `: ${JSON.stringify(err.response.data.details)}`
            : "")
      );
    }
    throw new Error(err.message || "An unexpected error occurred");
  }
}
