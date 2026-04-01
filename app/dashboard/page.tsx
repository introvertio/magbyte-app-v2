"use client";

import React from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
} from "recharts";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import { useExecutiveSummaryData } from "@/app/hooks/useDashboardData";
import { useDashboardStore } from "@/app/stores/dashboard/useDashboardStore";
import { getGreeting, formatNaira, cn } from "@/lib/utils";
import type {
  Play,
  Signal,
  ChartData,
  ParetoBarItem,
  CategoryDonutItem,
  RevenueTrendItem,
  ExpenseVsSalesItem,
  RepeatVsNewItem,
  WaterfallItem,
  BranchBarItem,
} from "@/app/types/executiveSummary";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  BoltIcon,
  CalendarIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  DashTooltip,
  GradDefs,
  GRAD,
  DONUT_COLOURS,
  SectionHeader,
  ChartCard,
  TICK,
  GRID_STROKE,
} from "@/app/components/ui/dashboard/ChartUtils";

// ── Colour helpers ──────────────────────────────────────────────────────────

const SENTIMENT_RING: Record<string, string> = {
  green: "bg-emerald-50/80 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-800/50",
  red:   "bg-red-50/80 border-red-200/80 dark:bg-red-950/40 dark:border-red-800/50",
  amber: "bg-amber-50/80 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-800/50",
};

const SENTIMENT_TEXT: Record<string, string> = {
  green: "text-emerald-600",
  red:   "text-red-600",
  amber: "text-amber-600",
};

const GAUGE_COLOUR: Record<string, string> = {
  green: "#10b981",
  amber: "#f59e0b",
  red:   "#ef4444",
};

const PRIORITY_CONFIG: Record<string, { dot: string; label: string; bg: string; border: string; text: string }> = {
  urgent:       { dot: "bg-red-500",     label: "Urgent",       bg: "bg-red-50 dark:bg-red-950/30",         border: "border-l-4 border-l-red-400 border border-red-100 dark:border-red-900/50",         text: "text-red-600 dark:text-red-400" },
  this_week:    { dot: "bg-amber-400",   label: "This Week",    bg: "bg-amber-50 dark:bg-amber-950/30",     border: "border-l-4 border-l-amber-400 border border-amber-100 dark:border-amber-900/50",   text: "text-amber-700 dark:text-amber-400" },
  when_you_can: { dot: "bg-emerald-400", label: "When You Can", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-l-4 border-l-emerald-400 border border-emerald-100 dark:border-emerald-900/50", text: "text-emerald-700 dark:text-emerald-400" },
};

const SIGNAL_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; colour: string; bg: string; border: string }> = {
  alert:    { icon: ExclamationTriangleIcon, colour: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/30",         border: "border-l-4 border-l-red-400 border border-red-100 dark:border-red-900/50" },
  warning:  { icon: ExclamationCircleIcon,   colour: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30",     border: "border-l-4 border-l-amber-400 border border-amber-100 dark:border-amber-900/50" },
  positive: { icon: CheckCircleIcon,          colour: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-l-4 border-l-emerald-400 border border-emerald-100 dark:border-emerald-900/50" },
};

// Maps signal linked_page values to actual routes
const PAGE_ROUTE: Record<string, string> = {
  "Product Performance":               "/dashboard/products",
  "Sales Overview":                    "/dashboard/sales",
  "Forecast Insights":                 "/dashboard/forecast",
  "Expenses Summary":                  "/dashboard/expenses",
  "Customer Insights":                 "/dashboard/customers",
  "Staff Performance":                 "/dashboard/staff",
  "Financial Control & Expense Summary": "/dashboard/expenses",
  "Forecast & Scenario Insights":      "/dashboard/forecast",
};

// ── Health Gauge ────────────────────────────────────────────────────────────

function HealthGauge({ score, label, colour, deltaLabel, basedOn, badge }: {
  score: number;
  label: string;
  colour: string;
  deltaLabel: string;
  basedOn: string;
  badge: string;
}): React.ReactElement {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (score / 100);
  const ringColour = GAUGE_COLOUR[colour] ?? "#f59e0b";
  const glowColour = colour === "green" ? "#10b981" : colour === "red" ? "#ef4444" : "#f59e0b";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="196" height="196" viewBox="0 0 196 196" className="-rotate-90">
          <circle cx="98" cy="98" r={radius} fill="none" strokeWidth="14" className="stroke-slate-200 dark:stroke-slate-700" />
          <circle
            cx="98" cy="98" r={radius}
            fill="none"
            stroke={glowColour}
            strokeWidth="18"
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeLinecap="round"
            opacity={0.15}
          />
          <circle
            cx="98" cy="98" r={radius}
            fill="none"
            stroke={ringColour}
            strokeWidth="14"
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[42px] font-black text-gray-900 dark:text-slate-100 leading-none tabular-nums">{score}</span>
          <span className="text-sm text-gray-400 dark:text-slate-500 font-medium">/100</span>
          <span className={cn("text-xs font-bold mt-1 px-2 py-0.5 rounded-full",
            colour === "green" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" :
            colour === "red"   ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" :
                                 "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
          )}>{label}</span>
        </div>
      </div>
      <div className="text-center space-y-0.5">
        <p className={cn("text-sm font-bold", SENTIMENT_TEXT[colour])}>{deltaLabel}</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500">{basedOn}</p>
        {badge && <p className="text-[10px] text-gray-400 dark:text-slate-500 italic">{badge}</p>}
      </div>
    </div>
  );
}

// ── Health Components breakdown ─────────────────────────────────────────────

function HealthComponents({ components }: {
  components: Array<{ name: string; pts: number; max_pts: number; colour: string; detail: string; weight: string }>;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-4 flex-1 min-w-0">
      {components.map((c) => {
        const pct = Math.round((c.pts / c.max_pts) * 100);
        const barColour = GAUGE_COLOUR[c.colour] ?? "#f59e0b";
        return (
          <div key={c.name}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-gray-700 dark:text-slate-300">{c.name}</span>
              <span className={cn("font-bold tabular-nums text-[11px]", SENTIMENT_TEXT[c.colour])}>
                {c.pts.toFixed(0)}<span className="font-normal text-gray-400 dark:text-slate-500">/{c.max_pts.toFixed(0)} pts</span>
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: barColour }}
              />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 leading-snug">{c.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Vital Sign Card ─────────────────────────────────────────────────────────

function VitalCard({ label, value, sub, delta, sentiment }: {
  label: string; value: string; sub: string; delta: string; sentiment: string;
}): React.ReactElement {
  const ringStyle = SENTIMENT_RING[sentiment] ?? "bg-white border-gray-200";
  const textStyle = SENTIMENT_TEXT[sentiment] ?? "text-gray-500";
  const barColour = sentiment === "green" ? "bg-emerald-400" : sentiment === "red" ? "bg-red-400" : "bg-amber-400";

  return (
    <div className={cn("rounded-2xl border overflow-hidden", ringStyle)}>
      <div className={cn("h-1 w-full", barColour)} />
      <div className="p-4">
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 leading-snug">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-slate-100 leading-tight tabular-nums">{value}</p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 leading-snug">{sub}</p>
        <p className={cn("text-xs font-bold mt-1.5", textStyle)}>{delta}</p>
      </div>
    </div>
  );
}

// ── Signal Card ─────────────────────────────────────────────────────────────

function SignalCard({ signal }: { signal: Signal }): React.ReactElement {
  const cfg = SIGNAL_CONFIG[signal.type] ?? SIGNAL_CONFIG.warning;
  const Icon = cfg.icon;
  const targetRoute = PAGE_ROUTE[signal.linked_page];

  return (
    <div className={cn("rounded-2xl p-4 flex gap-3", cfg.bg, cfg.border)}>
      <div className={cn("size-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
        signal.type === "alert" ? "bg-red-100 dark:bg-red-900/40" : signal.type === "positive" ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"
      )}>
        <Icon className={cn("size-4", cfg.colour)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 leading-snug">{signal.headline}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{signal.body}</p>
        {targetRoute && (
          <Link href={targetRoute} className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2 hover:underline">
            See more <ArrowRightIcon className="size-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Play Item ───────────────────────────────────────────────────────────────

function PlayItem({ play }: { play: Play }): React.ReactElement {
  const cfg = PRIORITY_CONFIG[play.priority] ?? PRIORITY_CONFIG.when_you_can;
  return (
    <div className={cn("rounded-2xl p-4 flex gap-3", cfg.bg, cfg.border)}>
      <div className="flex-1 min-w-0">
        <span className={cn("text-[10px] font-black uppercase tracking-widest", cfg.text)}>{cfg.label}</span>
        <p className="text-sm text-gray-800 dark:text-slate-200 mt-0.5 leading-relaxed">{play.text}</p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{play.metric}</p>
      </div>
    </div>
  );
}

// ── Chart components ────────────────────────────────────────────────────────

function ParetoBarChart({ chart }: { chart: ChartData }): React.ReactElement {
  const data = (chart.data as ParetoBarItem[]).filter((d) => d.name !== "All Others");
  return (
    <ChartCard subtitle={chart.subtitle} title={chart.dynamic_title}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <GradDefs />
          <XAxis type="number" tickFormatter={(v) => formatNaira(v)} tick={TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={TICK} axisLine={false} tickLine={false} width={90} />
          <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
          <Bar dataKey="revenue" fill={`url(#${GRAD.blueH})`} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function CategoryDonutChart({ chart }: { chart: ChartData }): React.ReactElement {
  const data = (chart.data as CategoryDonutItem[]).filter((d) => d.revenue > 0);
  return (
    <ChartCard subtitle={chart.subtitle} title={chart.dynamic_title}>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={data} dataKey="revenue" nameKey="category" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
              {data.map((_entry, i) => (
                <Cell key={i} fill={DONUT_COLOURS[i % DONUT_COLOURS.length]} />
              ))}
            </Pie>
            <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {data.slice(0, 5).map((d, i) => (
            <div key={d.category} className="flex items-center gap-2 text-xs">
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLOURS[i % DONUT_COLOURS.length] }} />
              <span className="truncate text-gray-600 dark:text-slate-400">{d.category}</span>
              <span className="ml-auto font-bold text-gray-800 dark:text-slate-200 tabular-nums shrink-0">{d.pct_of_total.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function RevenueTrendChart({ chart }: { chart: ChartData }): React.ReactElement {
  const data = chart.data as RevenueTrendItem[];
  return (
    <ChartCard subtitle={chart.subtitle} title={chart.dynamic_title} fullWidth>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <GradDefs />
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tickFormatter={(v) => formatNaira(v)} tick={TICK} axisLine={false} tickLine={false} width={62} />
          <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#001BB7"
            strokeWidth={2.5}
            fill={`url(#${GRAD.blueArea})`}
            dot={false}
            activeDot={{ r: 5, fill: "#001BB7", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Intermediate: expense vs sales combo — bars for expenses, line for sales
function ExpenseVsSalesChart({ chart }: { chart: ChartData }): React.ReactElement {
  const data = chart.data as ExpenseVsSalesItem[];
  return (
    <ChartCard subtitle={chart.subtitle} title={chart.dynamic_title} fullWidth>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <GradDefs />
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => formatNaira(v)} tick={TICK} axisLine={false} tickLine={false} width={62} />
          <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
          <Bar dataKey="expenses" fill={`url(#${GRAD.blueH})`} radius={[4, 4, 0, 0]} name="Expenses" />
          <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2.5} dot={false} name="Sales" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Intermediate + Advanced: repeat vs new customer donut
function RepeatVsNewChart({ chart }: { chart: ChartData }): React.ReactElement {
  const data = chart.data as RepeatVsNewItem[];
  const COLOURS = ["#001BB7", "#10b981", "#f59e0b"];
  return (
    <ChartCard subtitle={chart.subtitle} title={chart.dynamic_title}>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="segment" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3}>
              {data.map((_entry, i) => (
                <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => typeof v === "number" ? v.toLocaleString() : String(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {data.map((d, i) => (
            <div key={d.segment} className="flex items-center gap-2 text-xs">
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: COLOURS[i % COLOURS.length] }} />
              <span className="truncate text-gray-600 dark:text-slate-400">{d.segment}</span>
              <span className="ml-auto font-bold text-gray-800 dark:text-slate-200 tabular-nums shrink-0">{d.pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

// Advanced: gross profit → expenses → net profit waterfall
function WaterfallChart({ chart }: { chart: ChartData }): React.ReactElement {
  const raw = chart.data as WaterfallItem[];
  // Build running total for stacked bar
  const data = raw.map((item) => ({
    label: item.label,
    value: Math.abs(item.value),
    isNegative: item.value < 0,
    type: item.type,
    formatted: formatNaira(Math.abs(item.value)),
  }));
  return (
    <ChartCard subtitle={chart.subtitle} title={chart.dynamic_title}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => formatNaira(v)} tick={TICK} axisLine={false} tickLine={false} width={62} />
          <Tooltip formatter={(v) => typeof v === "number" ? formatNaira(v) : String(v)} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isNegative ? "#ef4444" : entry.type === "end" ? "#10b981" : "#001BB7"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Advanced: revenue by branch
function BranchBarChart({ chart }: { chart: ChartData }): React.ReactElement {
  const data = chart.data as BranchBarItem[];
  return (
    <ChartCard subtitle={chart.subtitle} title={chart.dynamic_title}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <GradDefs />
          <XAxis type="number" tickFormatter={(v) => formatNaira(v)} tick={TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="branch" tick={TICK} axisLine={false} tickLine={false} width={80} />
          <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
          <Bar dataKey="revenue" fill={`url(#${GRAD.blueH})`} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Dispatcher — routes each chart to its component
function CockpitChart({ chart }: { chart: ChartData }): React.ReactElement | null {
  switch (chart.chart_type) {
    case "pareto_bar":             return <ParetoBarChart chart={chart} />;
    case "category_donut":         return <CategoryDonutChart chart={chart} />;
    case "revenue_trend_line":     return <RevenueTrendChart chart={chart} />;
    case "expense_vs_sales_combo": return <ExpenseVsSalesChart chart={chart} />;
    case "repeat_vs_new_donut":    return <RepeatVsNewChart chart={chart} />;
    case "waterfall":              return <WaterfallChart chart={chart} />;
    case "branch_bar":             return <BranchBarChart chart={chart} />;
    default:                       return null;
  }
}

// ── Forecast Insight Card ───────────────────────────────────────────────────

function ForecastInsightCard({ daysUntilStockout }: { daysUntilStockout?: number | null }): React.ReactElement | null {
  const summary = useExecutiveSummaryData();
  const fi = summary.forecast_insight;
  if (!fi) return null;

  const cm = fi.current_month;
  const nf = fi.next_forecast;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="size-4 text-primary" />
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Forecast Insight</p>
        </div>
        <Link href="/dashboard/forecast" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
          Full forecast <ArrowRightIcon className="size-3" />
        </Link>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Current month */}
        {cm ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{cm.month} — this month</span>
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                cm.status_colour === "green" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
              )}>{cm.status_label}</span>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">{cm.actual_fmt}</span>
              <span className="text-sm text-gray-400 dark:text-slate-500 mb-0.5">of {cm.forecast_fmt}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
              <div
                className={cn("h-full rounded-full transition-all duration-700",
                  cm.status_colour === "green" ? "bg-emerald-500" : cm.status_colour === "red" ? "bg-red-500" : "bg-amber-400"
                )}
                style={{ width: `${Math.min(cm.pct_to_target, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">{cm.pct_to_target}% of target · {cm.days_remaining} days left</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">{cm.narrative}</p>
          </div>
        ) : (
          <div className="flex items-center justify-center text-xs text-gray-400 dark:text-slate-500">
            No current month data yet
          </div>
        )}

        {/* Next month */}
        {nf && (
          <div className={cm ? "border-l border-gray-100 dark:border-slate-700 pl-5" : ""}>
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{nf.month} — next month</span>
            <div className="flex items-center gap-2 mt-1 mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">{nf.forecast_fmt}</span>
              <span className={cn("text-sm font-bold", nf.direction === "up" ? "text-emerald-600" : "text-red-500")}>
                {nf.direction === "up" ? "↑" : "↓"} {nf.growth_pct}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{nf.narrative}</p>
          </div>
        )}
      </div>

      {/* Stockout warning — Advanced tier only */}
      {daysUntilStockout != null && daysUntilStockout <= 90 && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl">
            <ExclamationTriangleIcon className="size-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Stock warning:</span> estimated stockout in {daysUntilStockout} days based on current sales rate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Data Quality Banner ─────────────────────────────────────────────────────

function DataQualityBanner({ pctClean, issueCount }: { pctClean: number; issueCount: number }): React.ReactElement | null {
  if (issueCount === 0) return null;
  return (
    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3">
      <ExclamationTriangleIcon className="size-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700 dark:text-amber-400">
        <span className="font-semibold">{issueCount} data issue{issueCount > 1 ? "s" : ""} found</span>
        {" · "}Score based on {pctClean}% of your data. Go to <strong>Product Performance</strong> to see details.
      </p>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function CockpitPage(): React.ReactElement {
  const { data: user } = useGetProfile();
  const summary = useExecutiveSummaryData();
  const { period } = useDashboardStore();

  const firstName = user?.first_name ?? "there";
  const greeting = getGreeting();
  const { health_score, vital_signs, signals, charts, plays, data_quality, forecast_insight } = summary;

  const dateStart = summary.metadata?.period?.start;
  const dateEnd   = summary.metadata?.period?.end;
  const fmtDate = (iso: string | null | undefined): string =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

  // Vital signs are an object — render all values in whatever order they come
  const vitalCards = Object.values(vital_signs);

  // Separate full-width charts from the inline grid charts
  const fullWidthChartTypes = ["revenue_trend_line", "expense_vs_sales_combo"];
  const inlineCharts = charts.filter((c) => !fullWidthChartTypes.includes(c.chart_type));
  const fullWidthCharts = charts.filter((c) => fullWidthChartTypes.includes(c.chart_type));

  const daysUntilStockout = forecast_insight?.days_until_stockout;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Cockpit</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{greeting}, {firstName} 👋</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <CalendarIcon className="size-3.5 text-gray-400 dark:text-slate-500" />
            <p className="text-sm text-gray-400 dark:text-slate-500">
              {fmtDate(dateStart)} – {fmtDate(dateEnd)}
              {" · "}{summary.metadata?.record_count ?? 0} transactions
            </p>
          </div>
        </div>
        <span className={cn(
          "text-xs font-bold px-3 py-1.5 rounded-full self-start sm:self-auto",
          health_score.colour === "green" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" :
          health_score.colour === "red"   ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" :
                                            "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
        )}>
          {health_score.label}
        </span>
      </div>

      {/* ── Period note (Cockpit always shows full dataset) ── */}
      {period !== "all" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-400 font-medium">
          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
          This summary covers your full dataset. Visit Sales or Products to see period-filtered data.
        </div>
      )}

      {/* ── Data quality banner ── */}
      <DataQualityBanner pctClean={data_quality.pct_clean} issueCount={data_quality.issue_count} />

      {/* ── Health Score ── */}
      <SectionHeader title="Business Health Score" />
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <BoltIcon className="size-5 text-primary" />
          <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100">Overall Score</h2>
        </div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <HealthGauge
            score={health_score.score}
            label={health_score.label}
            colour={health_score.colour}
            deltaLabel={health_score.delta_label}
            basedOn={health_score.based_on}
            badge={health_score.data_completeness?.badge ?? ""}
          />
          <HealthComponents components={health_score.components} />
        </div>
      </div>

      {/* ── Vital Signs ── */}
      <SectionHeader title="Vital Signs" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {vitalCards.map((card) => (
          <VitalCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── What Happened + Inline Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SectionHeader title="What Happened" />
          <div className="flex flex-col gap-3">
            {signals.length > 0
              ? signals.map((signal, i) => <SignalCard key={i} signal={signal} />)
              : <p className="text-sm text-gray-400">No signals detected for this period.</p>
            }
          </div>
        </div>
        {inlineCharts.length > 0 && (
          <div>
            <SectionHeader title="Key Visuals" />
            <div className="flex flex-col gap-4">
              {inlineCharts.map((chart, i) => (
                <CockpitChart key={i} chart={chart} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Full-width charts (revenue trend, expense vs sales) ── */}
      {fullWidthCharts.map((chart, i) => (
        <div key={i}>
          <SectionHeader title={chart.chart_type === "expense_vs_sales_combo" ? "Expenses vs Sales" : "Revenue Trend"} />
          <CockpitChart chart={chart} />
        </div>
      ))}

      {/* ── Plays ── */}
      <SectionHeader title="Your Plays — What To Do" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {plays.map((play, i) => (
          <PlayItem key={i} play={play} />
        ))}
      </div>

      {/* ── Forecast Insight ── */}
      <SectionHeader title="Forecast" />
      <ForecastInsightCard daysUntilStockout={daysUntilStockout} />

    </div>
  );
}
