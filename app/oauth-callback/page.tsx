"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTokenStore } from "../components/stores/auth/useTokenStore";
import { useGoogleOAuthCallback } from "../components/hooks/auth/useGoogleOAuthCallback";
import Spinner from "../components/ui/loaders/Spinner";
import { handleGoogleOAuthCallback } from "@/lib/api/auth/google-oauth-callback";

function OAuth2Callback() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const router = useRouter();
  const { setToken } = useTokenStore();

  useEffect(() => {
    if (code) {
      handleGoogleOAuthCallback(code)
        .then(({ access_token, new_user }) => {
          setToken(access_token);
          if (new_user !== undefined && new_user) {
            router.push("/dashboard/user/update");
          } else {
            router.push("/dashboard");
          }
        })
        .catch((error) => {
          console.error("Error during OAuth callback process", error);
        });
    } else {
      // If there is no code, route user to home page
      router.push("/");
    }
  }, [code, router, setToken]);

  return (
    <main className="flex flex-col min-h-svh min-w-screen items-center justify-center">
      <p className="font-semibold text-xl underline text-primary decoration-secondary-green decoration-2 animate-pulse">
        Logging in via Google....
      </p>
    </main>
  );
}

export default function OAuth2CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center w-svw h-svh">
          <Spinner className="text-primary" />
        </div>
      }
    >
      <OAuth2Callback />
    </Suspense>
  );
}
