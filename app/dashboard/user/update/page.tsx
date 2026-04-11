"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUpdateProfile } from "@/app/components/hooks/user/useUpdateProfile";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import { cn } from "@/lib/utils";
import { CheckCircleIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon, LinkIcon } from "@heroicons/react/24/outline";

// ── Industries ───────────────────────────────────────────────────────────────

const INDUSTRIES = [
  { id: "Retail & Provision Stores",     label: "Retail & Provisions",   emoji: "🛍️", live: true  },
  { id: "Food & Restaurants",            label: "Food & Restaurants",    emoji: "🍽️", live: false },
  { id: "Agriculture & Agro-Processing", label: "Agriculture",           emoji: "🌾", live: false },
  { id: "Fashion & Tailoring",           label: "Fashion & Tailoring",   emoji: "👗", live: false },
  { id: "Beauty, Salon & Barber",        label: "Beauty & Salon",        emoji: "✂️", live: false },
  { id: "Transport & Logistics",         label: "Transport & Logistics", emoji: "🚚", live: false },
  { id: "Education",                     label: "Education",             emoji: "📚", live: false },
  { id: "Construction & Artisan",        label: "Construction",          emoji: "🏗️", live: false },
  { id: "Health & Pharmacy",             label: "Health & Pharmacy",     emoji: "💊", live: false },
  { id: "Manufacturing & Production",    label: "Manufacturing",         emoji: "🏭", live: false },
  { id: "Events & Entertainment",        label: "Events",                emoji: "🎉", live: false },
  { id: "Digital & Tech Services",       label: "Digital & Tech",        emoji: "💻", live: false },
] as const;

// ── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Your Business",  sub: "Name & contact"     },
  { n: 2, label: "Your Industry",  sub: "Select your sector"  },
  { n: 3, label: "Your Data",      sub: "Upload your records" },
] as const;

type StepNum = 1 | 2 | 3;

// ── Left panel — vertical step list ─────────────────────────────────────────

function LeftPanel({ current, bizName }: { current: StepNum; bizName: string }): React.ReactElement {
  return (
    <div className="flex flex-col justify-between h-full px-8 py-10">
      <div>
        <div className="mb-10">
          <Link href="/">
            <img
              src="/InViewLogoWhite.svg"
              alt="InView by MagByte"
              className="h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>

        <div className="flex flex-col gap-0">
          {STEPS.map((step, i) => {
            const done   = step.n < current;
            const active = step.n === current;
            return (
              <div key={step.n} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300",
                    done   && "bg-white text-primary",
                    active && "bg-white text-primary ring-4 ring-white/20",
                    !done && !active && "bg-white/10 text-white/30",
                  )}>
                    {done ? <CheckCircleIcon className="size-4" /> : step.n}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      "w-px flex-1 my-1 min-h-[32px] transition-all duration-500",
                      done ? "bg-white/50" : "bg-white/15",
                    )} />
                  )}
                </div>

                <div className="pb-8">
                  <p className={cn(
                    "text-sm font-semibold leading-tight transition-colors duration-200",
                    active ? "text-white" : done ? "text-white/70" : "text-white/30",
                  )}>
                    {step.label}
                  </p>
                  <p className={cn(
                    "text-xs mt-0.5 transition-colors duration-200",
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

      <p className="text-xs text-white/25 leading-relaxed">
        {bizName
          ? `Setting up ${bizName}`
          : "Your data stays private and is never shared."}
      </p>
    </div>
  );
}

// ── Upload step ──────────────────────────────────────────────────────────────

interface UploadStepProps {
  industry: string;
  onBack: () => void;
  onComplete: () => void;
  isPending: boolean;
  isError: boolean;
}

type UploadMode = "file" | "sheets";

function isValidSheetsUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return (
      parsed.hostname === "docs.google.com" &&
      parsed.pathname.startsWith("/spreadsheets/")
    );
  } catch {
    return false;
  }
}

function UploadStep({ industry, onBack, onComplete, isPending, isError }: UploadStepProps): React.ReactElement {
  const [mode, setMode]           = useState<UploadMode>("file");
  const [file, setFile]           = useState<File | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sheetsValid = isValidSheetsUrl(sheetsUrl);
  const sheetsTyped = sheetsUrl.trim().length > 0;

  const canSubmit =
    (mode === "file" && file !== null) ||
    (mode === "sheets" && sheetsValid);

  const handleFile = useCallback((f: File) => {
    const allowed = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "application/vnd.ms-excel"];
    if (allowed.includes(f.type) || f.name.endsWith(".xlsx") || f.name.endsWith(".csv")) {
      setFile(f);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  return (
    <div className="flex flex-col gap-5 flex-1">
      <div>
        <p className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed">
          Upload your sales records for{" "}
          <span className="font-semibold text-gray-700 dark:text-slate-300">{industry}</span>.
          {" "}Use the MagByte Excel template or paste a Google Sheets link.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-slate-800">
        {(["file", "sheets"] as UploadMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150",
              mode === m
                ? "bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 shadow-sm"
                : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300",
            )}
          >
            {m === "file"
              ? <><CloudArrowUpIcon className="size-3.5" /> Upload file</>
              : <><LinkIcon className="size-3.5" /> Google Sheets</>
            }
          </button>
        ))}
      </div>

      {/* File drop zone */}
      {mode === "file" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 py-10",
            dragging
              ? "border-primary bg-blue-50/60 dark:bg-blue-950/40 scale-[1.01]"
              : file
                ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20"
                : "border-gray-200 dark:border-slate-700 hover:border-primary/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {file ? (
            <>
              <DocumentIcon className="size-8 text-emerald-500" />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{file.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {(file.size / 1024).toFixed(0)} KB · ready to upload
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors"
              >
                <XMarkIcon className="size-3.5" /> Remove
              </button>
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="size-9 text-gray-300 dark:text-slate-600" />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                  Drop your file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  Supports .xlsx and .csv
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Google Sheets URL input */}
      {mode === "sheets" && (
        <div className="flex flex-col gap-3">
          <div className={cn(
            "flex items-center gap-3 rounded-2xl border-2 px-4 py-4 transition-all duration-200",
            sheetsValid
              ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20"
              : "border-gray-200 dark:border-slate-700 focus-within:border-primary/50",
          )}>
            <LinkIcon className={cn(
              "size-5 shrink-0 transition-colors",
              sheetsValid ? "text-emerald-500" : "text-gray-300 dark:text-slate-600",
            )} />
            <input
              type="url"
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-slate-100 placeholder:text-gray-300 dark:placeholder:text-slate-600 focus:outline-none"
              autoFocus
            />
            {sheetsValid && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                Valid ✓
              </span>
            )}
          </div>

          {sheetsTyped && !sheetsValid && (
            <p className="text-xs text-red-500 font-medium px-1">
              That doesn't look like a Google Sheets link. Make sure it starts with docs.google.com/spreadsheets/
            </p>
          )}

          {!sheetsTyped && (
            <p className="text-xs text-gray-400 dark:text-slate-500 px-1">
              Make sure the sheet is set to <span className="font-semibold">Anyone with the link can view</span> before submitting.
            </p>
          )}
        </div>
      )}

      {isError && (
        <p className="text-xs text-red-500 font-medium">
          Something went wrong — please try again.
        </p>
      )}

      <div className="flex gap-3 mt-auto pt-2">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onComplete}
          disabled={!canSubmit || isPending}
          className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending
            ? "Analysing your data…"
            : mode === "sheets"
              ? "Connect & analyse →"
              : "Upload & analyse →"
          }
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function UpdateUserPage(): React.ReactElement {
  const router = useRouter();
  const { data: user }                 = useGetProfile();
  const { mutate, isPending, isError } = useUpdateProfile();

  const [step, setStep]         = useState<StepNum>(1);
  const [bizName, setBizName]   = useState("");
  const [phone, setPhone]       = useState("");
  const [industry, setIndustry] = useState<string>("");

  function handleStep1(): void {
    if (!bizName.trim()) return;
    setStep(2);
  }

  function handleStep2(): void {
    if (!industry) return;
    setStep(3);
  }

  function handleSubmit(): void {
    if (isPending) return;
    mutate(
      { business_name: bizName.trim(), phone: phone.trim(), business_industry: industry },
      { onSuccess: () => router.replace("/dashboard") },
    );
  }

  const stepLabel = `Step ${step} of 3`;

  const headings: Record<StepNum, string> = {
    1: user?.first_name ? `Hey ${user.first_name}, tell us about your business` : "Tell us about your business",
    2: "What industry are you in?",
    3: "Upload your data",
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">

        <div className="flex rounded-3xl overflow-hidden shadow-2xl min-h-[540px]">

          {/* ── Left — midnight blue ── */}
          <div className="w-64 shrink-0 bg-[#00022D]">
            <LeftPanel current={step} bizName={bizName} />
          </div>

          {/* ── Right — form ── */}
          <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col justify-between px-10 py-10">

            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                {stepLabel}
              </p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {headings[step]}
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
                    className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
                    const locked   = !ind.live;
                    return (
                      <button
                        key={ind.id}
                        onClick={() => { if (!locked) setIndustry(ind.id); }}
                        disabled={locked}
                        className={cn(
                          "relative flex flex-col items-center gap-1.5 px-2 py-4 rounded-2xl border text-center transition-all duration-150",
                          selected  && "bg-primary border-primary shadow-lg shadow-primary/20 scale-[1.03]",
                          !selected && !locked && "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-primary/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 hover:scale-[1.02] active:scale-[0.98]",
                          locked    && "bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800 opacity-50 cursor-not-allowed",
                        )}
                      >
                        {selected && !locked && (
                          <CheckCircleIcon className="absolute top-2 right-2 size-3.5 text-white" />
                        )}
                        {locked && (
                          <LockClosedIcon className="absolute top-2 right-2 size-3 text-gray-400 dark:text-slate-600" />
                        )}
                        <span className="text-2xl leading-none">{ind.emoji}</span>
                        <span className={cn(
                          "text-[10px] font-semibold leading-tight",
                          selected ? "text-white" : "text-gray-600 dark:text-slate-300",
                        )}>
                          {ind.label}
                        </span>
                        {locked && (
                          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">Coming soon</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3 mt-auto pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleStep2}
                    disabled={!industry}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Upload ── */}
            {step === 3 && (
              <UploadStep
                industry={industry}
                onBack={() => setStep(2)}
                onComplete={handleSubmit}
                isPending={isPending}
                isError={isError}
              />
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
