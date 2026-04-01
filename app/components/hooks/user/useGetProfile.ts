"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserProfile, GetUserProfileResponse } from "@/lib/api/user/get-profile";
import { useTokenStore } from "@/app/components/stores/auth/useTokenStore";

export function useGetProfile() {
  const token = useTokenStore((state) => state.token);

  return useQuery<GetUserProfileResponse, Error>({
    queryKey: ["user-profile", token],
    queryFn: () => {
      if (!token) {
        throw new Error("Token is required");
      }
      return getUserProfile(token);
    },
    enabled: !!token, // Only fetch when token is available
  });
}

