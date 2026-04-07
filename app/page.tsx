"use client";
import { GoogleIcon } from "./components/icons/react-icons";
import { useGoogleLogin } from "./components/hooks/auth/useGoogleLogin";
import Spinner from "./components/ui/loaders/Spinner";
import { useAuthGuard } from "./components/middleware/hooks/useAuthGuard";
import Link from "next/link";
import {
  ChartBarIcon,
  BoltIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

const FEATURES = [
  {
    icon: BoltIcon,
    title: "Instant clarity",
    body: "Upload your sales data and get a full business dashboard in seconds.",
  },
  {
    icon: ChartBarIcon,
    title: "Decisions, not spreadsheets",
    body: "Every chart and KPI tells you what to do next — not just what happened.",
  },
  {
    icon: GlobeAltIcon,
    title: "Built for your industry",
    body: "12 industries supported — from retail and food to fashion and logistics.",
  },
];

export default function Home(): React.ReactElement {
  useAuthGuard("/dashboard");
  const googleMutation = useGoogleLogin();

  function handleGoogleLogin(): void {
    googleMutation.mutate(undefined, {
      onSuccess: ({ redirect_url }) => {
        if (redirect_url) {
          window.location.href = redirect_url;
        } else {
          throw new Error("Failed to get Google authentication URL");
        }
      },
      onError: () => {
        throw new Error("Error connecting to Google authentication service");
      },
    });
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — midnight brand hero (hidden on mobile) ── */}
      <div className="hidden lg:flex w-1/2 bg-[#00022D] flex-col justify-between px-12 py-12 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(0,27,183,0.35),transparent_60%)]" />

        {/* Logo */}
        <div>
          <img
            src="/MagByteLogo.png"
            alt="MagByte"
            className="h-9 w-auto object-contain brightness-0 invert"
          />
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Own your business<br />decision system.
          </h1>
          <p className="text-white/50 text-base leading-relaxed mb-10 max-w-sm">
            MagByte gives small business owners a powerful analytics dashboard
            — no analyst needed.
          </p>

          {/* Feature bullets */}
          <div className="flex flex-col gap-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 size-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon className="size-4 text-white/70" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90 leading-snug">{title}</p>
                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-white/20 relative z-10">
          © 2025 MagByte. Your data stays private and is never shared.
        </p>
      </div>

      {/* ── Right panel — sign in ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <img
              src="/MagByteLogo.png"
              alt="MagByte"
              className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
            Sign in to your MagByte dashboard.
          </p>

          <button
            disabled={googleMutation.isPending}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border-2 border-primary dark:border-blue-500 bg-white dark:bg-slate-900 text-primary dark:text-blue-400 text-sm font-semibold hover:bg-primary/5 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {googleMutation.isPending ? (
              <Spinner className="text-primary dark:text-blue-400" />
            ) : (
              <>
                <GoogleIcon className="text-xl shrink-0" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {googleMutation.isError && (
            <p className="text-red-500 dark:text-red-400 text-xs font-semibold mt-3 text-center">
              {googleMutation.error.message}
            </p>
          )}

          <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-6">
            By continuing, you agree to MagByte&apos;s terms and privacy policy.
          </p>

          {/* Dev shortcuts */}
          {process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true" && (
            <div className="flex flex-col items-center gap-1.5 mt-8 pt-6 border-t border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-600 mb-1">
                <span className="h-px w-12 bg-gray-200 dark:bg-slate-800" />
                <span>dev shortcuts</span>
                <span className="h-px w-12 bg-gray-200 dark:bg-slate-800" />
              </div>
              <Link
                href="/dashboard"
                className="text-sm text-primary dark:text-blue-400 underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                View Demo Dashboard
              </Link>
              <Link
                href="/dashboard/user/update"
                className="text-sm text-primary dark:text-blue-400 underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                Preview Onboarding Page
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
