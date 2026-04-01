"use client";

import { useQuery } from "@tanstack/react-query";
import { validateAuth, ValidateAuthResponse } from "@/lib/api/auth/validate";
import { useTokenStore } from "@/app/components/stores/auth/useTokenStore";

export function useValidateAuth() {
  const token = useTokenStore((state) => state.token);

  return useQuery<ValidateAuthResponse, Error>({
    queryKey: ["validate-auth", token],
    queryFn: () => {
      if (!token) {
        throw new Error("Token is required");
      }
      return validateAuth(token);
    },
    enabled: !!token, // Only fetch when token is available
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes (600000 ms)
  });
}

