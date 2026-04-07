"use client";
import { validateAuth } from "@/lib/api/auth/validate";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTokenStore } from "../../stores/auth/useTokenStore";

interface AuthGuardState {
  sessionExpired: boolean;
}

export function useAuthGuard(redirectTo?: string): AuthGuardState {
  const router = useRouter();
  const { token, setToken } = useTokenStore();
  // true while we're showing the "session expired" message before redirect
  const [sessionExpired, setSessionExpired] = useState(false);

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

      try {
        await validateAuth(token);
        // Token is valid — redirect if a destination was requested
        if (redirectTo) router.replace(redirectTo);
      } catch {
        // Token is invalid or expired: clear it, show the message, then redirect
        setToken(null);
        setSessionExpired(true);
        setTimeout(() => router.replace("/"), 2500);
      }
    };

    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { sessionExpired };
}
