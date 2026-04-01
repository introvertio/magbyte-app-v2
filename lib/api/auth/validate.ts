import axios from "axios";
import { API_BASE_URL } from "../api-url";
import { AUTH_ENDPOINTS } from "./auth-urls";

export interface ValidateAuthResponse {
  message: string; // "User is valid and authenticated."
}
export interface ValidateAuthError {
  error?: string;
  detail?: string;
}

/**
 * Validate user authentication
 * @param token JWT token for authentication
 * @returns {Promise<ValidateAuthResponse>} Validation status message
 * @throws {Error} When API returns an error or user is not authenticated
 */
export async function validateAuth(
  token: string
): Promise<ValidateAuthResponse> {
  try {
    const response = await axios.get<ValidateAuthResponse>(
      `${API_BASE_URL}${AUTH_ENDPOINTS.VALIDATE}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.status === 401) {
      throw new Error("User is not authenticated");
    }
    if (err.response && err.response.data) {
      const errorData = err.response.data as ValidateAuthError;
      throw new Error(
        errorData.error ||
          errorData.detail ||
          "Authentication validation failed"
      );
    }
    throw new Error(err.message || "An unexpected error occurred");
  }
}
