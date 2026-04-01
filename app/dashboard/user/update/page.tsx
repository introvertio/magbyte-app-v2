"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateProfile } from "@/app/components/hooks/user/useUpdateProfile";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import { cn } from "@/lib/utils";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

// ── Industries ───────────────────────────────────────────────────────────────

const INDUSTRIES = [
  { id: "Retail & Provision Stores",     label: "Retail & Provisions",   emoji: "🛍️" },
  { id: "Food & Restaurants",            label: "Food & Restaurants",     emoji: "🍽️" },
  { id: "Agriculture & Agro-Processing", label: "Agriculture",            emoji: "🌾" },
  { id: "Fashion & Tailoring",           label: "Fashion & Tailoring",    emoji: "👗" },
  { id: "Beauty, Salon & Barber",        label: "Beauty, Salon & Barber", emoji: "✂️" },
  { id: "Transport & Logistics",         label: "Transport & Logistics",  emoji: "🚚" },
  { id: "Education",                     label: "Education",              emoji: "📚" },
  { id: "Construction & Artisan",        label: "Construction & Artisan", emoji: "🏗️" },
  { id: "Health & Pharmacy",             label: "Health & Pharmacy",      emoji: "💊" },
  { id: "Manufacturing & Production",    label: "Manufacturing",          emoji: "🏭" },
  { id: "Events & Entertainment",        label: "Events & Entertainment", emoji: "🎉" },
  { id: "Digital & Tech Services",       label: "Digital & Tech",         emoji: "💻" },
] as const;

// ── Left panel — vertical step list ─────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Your Business",  sub: "Name & contact"    },
  { n: 2, label: "Your Industry",  sub: "Select your sector" },
] as const;

function LeftPanel({ current, bizName }: { current: 1 | 2; bizName: string }): React.ReactElement {
  return (
    <div className="flex flex-col justify-between h-full px-8 py-10">

      {/* Brand */}
      <div>
        <div className="mb-10">
          <img
            src="/MagByteLogo.png"
            alt="MagByte"
            className="h-8 w-auto object-contain brightness-0 invert"
          />
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-0">
          {STEPS.map((step, i) => {
            const done   = step.n < current;
            const active = step.n === current;
            return (
              <div key={step.n} className="flex gap-4">
                {/* Line + dot column */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                    done   && "bg-white text-primary",
                    active && "bg-white text-primary ring-4 ring-white/20",
                    !done && !active && "bg-white/10 text-white/30",
                  )}>
                    {done ? <CheckCircleIcon className="size-4" /> : step.n}
                  </div>
                  {/* Connector line — only between steps */}
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      "w-px flex-1 my-1 min-h-[32px]",
                      done ? "bg-white/50" : "bg-white/15",
                    )} />
                  )}
                </div>

                {/* Label */}
                <div className="pb-8">
                  <p className={cn(
                    "text-sm font-semibold leading-tight",
                    active ? "text-white" : done ? "text-white/70" : "text-white/30",
                  )}>
                    {step.label}
                  </p>
                  <p className={cn(
                    "text-xs mt-0.5",
                    active ? "text-white/60" : done ? "text-white/40" : "text-white/20",
                  )}>
                    {step.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-white/25 leading-relaxed">
        {bizName
          ? `Setting up ${bizName}`
          : "Your data stays private and is never shared."}
      </p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function UpdateUserPage(): React.ReactElement {
  const router = useRouter();
  const { data: user }                 = useGetProfile();
  const { mutate, isPending, isError } = useUpdateProfile();

  const [step, setStep]         = useState<1 | 2>(1);
  const [bizName, setBizName]   = useState("");
  const [phone, setPhone]       = useState("");
  const [industry, setIndustry] = useState<string>("");

  function handleStep1(): void {
    if (!bizName.trim()) return;
    setStep(2);
  }

  function handleSubmit(): void {
    if (!industry || isPending) return;
    mutate(
      { business_name: bizName.trim(), phone: phone.trim(), business_industry: industry },
      { onSuccess: () => router.replace("/dashboard") },
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">

        {/* Split card */}
        <div className="flex rounded-3xl overflow-hidden shadow-2xl min-h-[520px]">

          {/* ── Left panel — midnight blue, full height ── */}
          <div className="w-64 shrink-0 bg-[#00022D]">
            <LeftPanel current={step} bizName={bizName} />
          </div>

          {/* ── Right panel — white form area ── */}
          <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col justify-between px-10 py-10">

            {/* Greeting */}
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
              </p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {step === 1
                  ? user?.first_name
                    ? `Hey ${user.first_name}, tell us about your business`
                    : "Tell us about your business"
                  : "What industry are you in?"}
              </h1>
              {step === 2 && (
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                  Pick the one that best describes{" "}
                  <span className="font-semibold text-gray-700 dark:text-slate-300">{bizName}</span>.
                </p>
              )}
            </div>

            {/* ── Step 1: Business details ── */}
            {step === 1 && (
              <div className="flex flex-col gap-5 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Business name <span className="text-red-400 normal-case font-normal">*</span>
                  </label>
                  <input
                    type="text"
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Rida's Provisions, Mama Nkechi Foods…"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-100 placeholder:text-gray-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Phone number <span className="text-gray-300 dark:text-slate-600 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-100 placeholder:text-gray-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                  />
                </div>

                <div className="mt-auto pt-4">
                  <button
                    onClick={handleStep1}
                    disabled={!bizName.trim()}
                    className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Industry grid ── */}
            {step === 2 && (
              <div className="flex flex-col gap-4 flex-1">
                <div className="grid grid-cols-3 gap-2 flex-1">
                  {INDUSTRIES.map((ind) => {
                    const selected = industry === ind.id;
                    return (
                      <button
                        key={ind.id}
                        onClick={() => setIndustry(ind.id)}
                        className={cn(
                          "relative flex flex-col items-center gap-1.5 px-2 py-4 rounded-2xl border text-center transition-all",
                          selected
                            ? "bg-primary border-primary shadow-lg shadow-primary/20"
                            : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-primary/30 hover:bg-blue-50/30 dark:hover:bg-blue-950/30",
                        )}
                      >
                        {selected && (
                          <CheckCircleIcon className="absolute top-2 right-2 size-3.5 text-white" />
                        )}
                        <span className="text-2xl leading-none">{ind.emoji}</span>
                        <span className={cn(
                          "text-[10px] font-semibold leading-tight",
                          selected ? "text-white" : "text-gray-600 dark:text-slate-300",
                        )}>
                          {ind.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {isError && (
                  <p className="text-xs text-red-500 font-medium">
                    Something went wrong — please try again.
                  </p>
                )}

                <div className="flex gap-3 mt-auto pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!industry || isPending}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isPending ? "Setting up your dashboard…" : "Get started →"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-4">
          You can update these details any time from your profile settings.
        </p>
      </div>
    </div>
  );
}
