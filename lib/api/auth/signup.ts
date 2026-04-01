import axios from "axios";
import { API_BASE_URL } from "../api-url";
import { AUTH_ENDPOINTS } from "./auth-urls";

export interface SignupBody {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}
export interface SignupSuccessResponse {
  message: "User signed up successfully";
  access_token: string;
  new_user: true;
}
export interface SignupErrorResponse {
  error: string;
  details?: any;
}
/**
 * Sign up new user
 * @param body Signup body object
 * @returns {Promise<SignupSuccessResponse>} User signup status and JWT
 * @throws {Error} Handles all documented error scenarios
 */
export async function signupUser(
  body: SignupBody
): Promise<SignupSuccessResponse> {
  try {
    const response = await axios.post<SignupSuccessResponse>(
      `${API_BASE_URL}${AUTH_ENDPOINTS.SIGNUP}`,
      body
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
