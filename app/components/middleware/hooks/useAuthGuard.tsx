"use client";
import { validateAuth } from "@/lib/api/auth/validate";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTokenStore } from "../../stores/auth/useTokenStore";

export function useAuthGuard(redirectTo?: string) {
  const router = useRouter();
  const { token, setToken } = useTokenStore();

  useEffect(() => {
    // Dev bypass: skip token validation but still respect login state.
    // Only redirect to dashboard if a token exists — allows logout to work.
    if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
      if (redirectTo && token) router.replace(redirectTo);
      return;
    }

    const validateToken = async () => {
      if (typeof window === "undefined") return;

      if (!token) {
        router.replace("/");
        return;
      }

      const isValid = await validateAuth(token);
      if (!isValid) {
        setToken(null);
        router.replace("/");
      } else {
        if (redirectTo) {
          router.replace(redirectTo);
        }
      }
      // Valid users stay on the current page - no redirect needed
    };

    // Initial validation
    validateToken();
  }, [token, redirectTo, router, setToken]);
}
