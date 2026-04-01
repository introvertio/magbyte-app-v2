"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { useForecastPageData, useExecutiveSummaryData, useTierMetadata } from "@/app/hooks/useDashboardData";
import { useDashboardStore } from "@/app/stores/dashboard/useDashboardStore";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import { getGreeting, formatNaira, cn } from "@/lib/utils";
import { CalendarIcon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { BasicAnalysisResult } from "@/app/types/basicAnalysis";
import type { IntermediateAnalysisResult } from "@/app/types/intermediateAnalysis";
import type { AdvancedAnalysisResult } from "@/app/types/advancedAnalysis";
import type { IntForecastLinePoint, IntCategoryPrediction, IntTopItemForecast, IntSeasonalityPattern } from "@/app/types/intermediateAnalysis";
import type { AdvForecastLinePoint, AdvCategoryPrediction, AdvSeasonalityPattern } from "@/app/types/advancedAnalysis";
import {
  DashTooltip,
  GradDefs,
  GRAD,
  SectionHeader,
  ChartCard,
  KpiCard,
  TICK,
  GRID_STROKE,
} from "@/app/components/ui/dashboard/ChartUtils";

// Advanced float-million values → full number for chart display
const fromM = (v: number): number => v * 1_000_000;

// ── Month progress + next month cards ──────────────────────────────────────

function MonthProgressCard(): React.ReactElement | null {
  const summary = useExecutiveSummaryData();
  const fi = summary.forecast_insight;
  if (!fi?.current_month) return null;
  const cm = fi.current_month;
  const progressPct = Math.min(cm.pct_to_target, 100);
  const isOnTrack = cm.on_track;

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden",
      isOnTrack ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200",
    )}>
      <div className={cn("h-1 w-full", isOnTrack ? "bg-emerald-400" : "bg-amber-400")} />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          {isOnTrack
            ? <CheckCircleIcon className="size-5 text-emerald-500" />
            : <ExclamationCircleIcon className="size-5 text-amber-500" />
          }
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">{cm.month} — Current Month</p>
            <p className={cn("text-xs font-bold", isOnTrack ? "text-emerald-600" : "text-amber-600")}>{cm.status_label}</p>
          </div>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">{cm.actual_fmt}</span>
          <span className="text-sm text-gray-400 dark:text-slate-500 mb-0.5">of {cm.forecast_fmt} target</span>
        </div>
        <div className="h-2 bg-white/60 dark:bg-slate-700/60 rounded-full overflow-hidden mb-1.5">
          <div
            className={cn("h-full rounded-full transition-all duration-700", isOnTrack ? "bg-emerald-500" : "bg-amber-400")}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-2">{cm.pct_to_target}% of target · {cm.days_remaining} of {cm.total_days} days remaining</p>
        <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">{cm.narrative}</p>
      </div>
    </div>
  );
}

function NextMonthCard(): React.ReactElement | null {
  const summary = useExecutiveSummaryData();
  const nf = summary.forecast_insight?.next_forecast;
  if (!nf) return null;
  const isUp = nf.direction === "up";
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="h-1 w-full bg-primary/20" />
      <div className="p-5">
        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">{nf.month} — Next Month</p>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl font-black text-gray-900 dark:text-slate-100 tabular-nums">{nf.forecast_fmt}</span>
          <span className={cn(
            "text-sm font-bold px-2.5 py-1 rounded-full",
            isUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600",
          )}>
            {isUp ? "↑" : "↓"} {nf.growth_pct}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{nf.narrative}</p>
      </div>
    </div>
  );
}

// ── Shared: forecast line chart ─────────────────────────────────────────────

type RawForecastPoint = {
  date: string;
  sales: number;
  type: string;
  upper_band?: number | null;
  lower_band?: number | null;
};

function ForecastLineChart({ points, scale = 1 }: {
  points: RawForecastPoint[];
  scale?: number;
}): React.ReactElement {
  const historical = points.filter((p) => p.type === "historical");
  const forecastPts = points.filter((p) => p.type === "forecast");
  const lastHistoricalDate = historical[historical.length - 1]?.date;

  const combined = [
    ...historical.map((p) => ({ date: p.date, historical: p.sales * scale, forecast: null as number | null, upper: null as number | null, lower: null as number | null })),
    ...forecastPts.map((p) => ({
      date: p.date,
      historical: null as number | null,
      forecast: p.sales * scale,
      upper: p.upper_band != null ? p.upper_band * scale : null,
      lower: p.lower_band != null ? p.lower_band * scale : null,
    })),
  ];

  return (
    <ChartCard title="Sales forecast — next 30 days vs history" subtitle="Forecast Line">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={combined} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <GradDefs />
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tickFormatter={(v) => formatNaira(v)} tick={TICK} axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
          <Legend iconType="line" iconSize={10} wrapperStyle={{ fontSize: 10, color: "#6b7280" }} />
          {lastHistoricalDate && (
            <ReferenceLine
              x={lastHistoricalDate}
              stroke="#cbd5e1"
              strokeDasharray="4 2"
              label={{ value: "Today", fontSize: 9, fill: "#94a3b8", position: "top" }}
            />
          )}
          <Area type="monotone" dataKey="upper" fill={`url(#${GRAD.bandArea})`} stroke="transparent" legendType="none" />
          <Area type="monotone" dataKey="lower" fill="#ffffff" stroke="transparent" legendType="none" />
          <Line type="monotone" dataKey="historical" stroke="#001BB7" strokeWidth={2.5} dot={false} name="Actual" connectNulls={false} activeDot={{ r: 5, fill: "#001BB7", stroke: "#fff", strokeWidth: 2 }} />
          <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Forecast" connectNulls={false} activeDot={{ r: 4, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Shared: seasonality (same structure across all tiers) ───────────────────

function SeasonalitySection({ seasonality }: {
  seasonality: IntSeasonalityPattern | AdvSeasonalityPattern;
}): React.ReactElement {
  return (
    <ChartCard title="When do you sell the most?" subtitle="Best days & months">
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">By day of week</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={seasonality.sales_by_day_of_week} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <GradDefs />
              <XAxis dataKey="day_short" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              <Bar dataKey="avg_sales" fill={`url(#${GRAD.blueV})`} radius={[4, 4, 0, 0]} name="Avg sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {seasonality.weekday_vs_weekend.map((item) => (
            <div key={item.type} className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3 text-center border border-gray-100 dark:border-slate-700">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{item.type}</p>
              <p className="text-sm font-bold text-gray-800 dark:text-slate-200 mt-1 tabular-nums">{formatNaira(item.avg_sales)}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">avg per day</p>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function MonthlySeasonalityChart({ seasonality }: { seasonality: IntSeasonalityPattern | AdvSeasonalityPattern }): React.ReactElement {
  return (
    <ChartCard title="Which months bring the most sales?" subtitle="Monthly Seasonality">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={seasonality.sales_by_month} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <GradDefs />
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => formatNaira(v)} tick={TICK} axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
          <Bar dataKey="avg_sales" fill={`url(#${GRAD.blueV})`} radius={[4, 4, 0, 0]} name="Avg monthly sales" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Basic tier section ──────────────────────────────────────────────────────

function BasicForecastContent({ data }: { data: BasicAnalysisResult["page_3"] }): React.ReactElement {
  const { kpis, charts, forecast_meta } = data;
  const meta = forecast_meta as { confidence_note?: string };
  return (
    <>
      <SectionHeader title="Key Numbers" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Forecasted Sales (30d)"  value={formatNaira(kpis.forecasted_sales)}            tooltip="Expected revenue in the next 30 days." />
        <KpiCard label="Forecasted Profit (30d)" value={formatNaira(kpis.forecasted_profit)}           tooltip="Expected profit from that forecasted revenue." />
        <KpiCard label="Sales Growth Rate"       value={`${kpis.sales_growth_rate.toFixed(1)}%`}       tooltip="How fast monthly sales are growing." />
        <KpiCard label="Forecast Confidence"     value={`${kpis.forecast_confidence.toFixed(0)}%`}     tooltip="How reliable the forecast is." sub={meta?.confidence_note ?? ""} />
        <KpiCard label="Profit Margin"           value={`${(kpis.profit_margin * 100).toFixed(1)}%`}   tooltip="Out of every ₦100 in sales, how much you keep." />
      </div>

      <SectionHeader title="Month Tracking" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MonthProgressCard />
        <NextMonthCard />
      </div>

      <SectionHeader title="Sales Forecast" />
      <ForecastLineChart points={charts.forecast_line} />

      <SectionHeader title="Category & Seasonality" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {charts.category_forecast_bars.length > 0 && (
          <ChartCard title="Which categories will grow next quarter?" subtitle="Category Forecast">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={charts.category_forecast_bars} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <GradDefs />
                <XAxis type="number" tickFormatter={(v) => formatNaira(v)} tick={TICK} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={TICK} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
                <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 10, color: "#6b7280" }} />
                <Bar dataKey="current_3m"  name="Last 3 months"     fill={`url(#${GRAD.blueH})`}  radius={[0, 4, 4, 0]} />
                <Bar dataKey="forecast_3m" name="Forecast 3 months" fill={`url(#${GRAD.greenH})`} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        <SeasonalitySection seasonality={charts.seasonality_pattern} />
      </div>

      <MonthlySeasonalityChart seasonality={charts.seasonality_pattern} />

      <SectionHeader title="Product Forecasts" />
      <BasicProductForecastTable rows={charts.top_item_forecast_table.slice(0, 20)} />
    </>
  );
}

// ── Intermediate tier section ───────────────────────────────────────────────

function IntermediateForecastContent({ data }: { data: IntermediateAnalysisResult["page_5"] }): React.ReactElement {
  const { kpis, charts } = data;
  return (
    <>
      <SectionHeader title="Key Numbers" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Forecasted Sales (30d)"  value={formatNaira(kpis.total_forecasted_sales)}        tooltip="Expected revenue in the next 30 days." />
        <KpiCard label="Forecasted Profit (30d)" value={formatNaira(kpis.total_forecasted_profit)}       tooltip="Expected profit from that forecasted revenue." />
        <KpiCard label="Sales Growth Rate"       value={`${kpis.sales_growth_rate.toFixed(1)}%`}        tooltip="How fast monthly sales are growing." />
        <KpiCard label="Forecast Confidence"     value={`${kpis.forecast_confidence.toFixed(0)}%`}      tooltip="How reliable the forecast is." />
        <KpiCard label="Profit Margin"           value={`${kpis.historical_profit_margin.toFixed(1)}%`} tooltip="Historical average gross margin." />
      </div>

      <SectionHeader title="Month Tracking" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MonthProgressCard />
        <NextMonthCard />
      </div>

      <SectionHeader title="Sales Forecast" />
      <ForecastLineChart points={charts.forecast_line as RawForecastPoint[]} />

      <SectionHeader title="Category & Seasonality" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IntCategoryPredictionChart rows={charts.category_prediction} />
        <SeasonalitySection seasonality={charts.seasonality_pattern} />
      </div>

      <MonthlySeasonalityChart seasonality={charts.seasonality_pattern} />

      <SectionHeader title="Product Forecasts" />
      <IntProductForecastTable rows={charts.top_item_forecast_table} />
    </>
  );
}

// ── Advanced tier section ───────────────────────────────────────────────────

function AdvancedForecastContent({ data }: { data: AdvancedAnalysisResult["page_6"] }): React.ReactElement {
  const { kpis, charts } = data;
  return (
    <>
      <SectionHeader title="Key Numbers" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Forecasted Sales (30d)"  value={kpis.forecasted_sales}         tooltip="Expected revenue in the next 30 days." />
        <KpiCard label="Forecasted Profit (30d)" value={kpis.forecasted_profit}        tooltip="Expected profit from that forecasted revenue." />
        <KpiCard label="Sales Growth Rate"       value={kpis.sales_growth_rate}        tooltip="How fast monthly sales are growing." />
        <KpiCard label="Forecast Confidence"     value={kpis.forecast_confidence}      tooltip="How reliable the forecast is." />
        <KpiCard label="Profit Margin"           value={kpis.historical_profit_margin} tooltip="Historical average gross margin." />
      </div>

      {kpis.days_until_stockout <= 90 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl">
          <ExclamationTriangleIcon className="size-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Stock warning:</span> estimated stockout in{" "}
            <span className="font-bold">{kpis.days_until_stockout} days</span>. Review your reorder points.
          </p>
        </div>
      )}

      <SectionHeader title="Month Tracking" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MonthProgressCard />
        <NextMonthCard />
      </div>

      <SectionHeader title="Sales Forecast" />
      <ForecastLineChart points={charts.forecast_line as RawForecastPoint[]} scale={1_000_000} />

      <SectionHeader title="Category & Seasonality" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdvCategoryPredictionChart rows={charts.category_prediction} />
        <SeasonalitySection seasonality={charts.seasonality_pattern} />
      </div>

      <MonthlySeasonalityChart seasonality={charts.seasonality_pattern} />
    </>
  );
}

// ── Chart sub-components ────────────────────────────────────────────────────

function BasicProductForecastTable({ rows }: { rows: BasicAnalysisResult["page_3"]["charts"]["top_item_forecast_table"] }): React.ReactElement {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Product Forecasts (30 days)</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">30-day forecast per product based on recent sales rate</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
              {["Product", "Category", "Forecast (30d)", "Total Sales", "Margin", "Trend"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={cn("border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors", i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/40 dark:bg-slate-800/30")}>
                <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-slate-200 max-w-[160px] truncate">{row.product}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-slate-500">{row.category}</td>
                <td className="px-4 py-2.5 font-bold text-primary tabular-nums">{formatNaira(row.forecast_30d)}</td>
                <td className="px-4 py-2.5 text-gray-600 dark:text-slate-400 tabular-nums">{formatNaira(row.total_sales)}</td>
                <td className="px-4 py-2.5 tabular-nums">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                    row.margin > 0.3 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    row.margin > 0   ? "bg-amber-50 text-amber-700 border-amber-200" :
                                       "bg-red-50 text-red-600 border-red-200",
                  )}>
                    {(row.margin * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn("font-bold text-sm", row.growth.startsWith("+") ? "text-emerald-600" : "text-red-500")}>
                    {row.growth}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IntProductForecastTable({ rows }: { rows: IntTopItemForecast[] }): React.ReactElement {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Product Forecasts (30 days)</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Top products by expected 30-day revenue</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
              {["Rank", "Product", "30d Forecast", "Target Sales", "Historical Sales"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={cn("border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors", i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/40 dark:bg-slate-800/30")}>
                <td className="px-4 py-2.5">
                  <span className={cn(
                    "inline-flex items-center justify-center size-6 rounded-full text-[10px] font-bold",
                    row.rank === 1 ? "bg-amber-100 text-amber-700" : row.rank === 2 ? "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300" : row.rank === 3 ? "bg-orange-50 text-orange-600" : "bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500"
                  )}>{row.rank}</span>
                </td>
                <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-slate-200 max-w-[160px] truncate">{row.product}</td>
                <td className="px-4 py-2.5 font-bold text-primary tabular-nums">{formatNaira(row.day_30_forecast)}</td>
                <td className="px-4 py-2.5 text-gray-600 dark:text-slate-400 tabular-nums">{formatNaira(row.target_sales)}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-slate-500 tabular-nums">{formatNaira(row.total_sales)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IntCategoryPredictionChart({ rows }: { rows: IntCategoryPrediction[] }): React.ReactElement {
  return (
    <ChartCard title="Which categories will grow next month?" subtitle="Category Prediction">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <GradDefs />
          <XAxis type="number" tickFormatter={(v) => formatNaira(v)} tick={TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="category" tick={TICK} axisLine={false} tickLine={false} width={100} />
          <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
          <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 10, color: "#6b7280" }} />
          <Bar dataKey="current_sales"   name="Current sales" fill={`url(#${GRAD.blueH})`}  radius={[0, 4, 4, 0]} />
          <Bar dataKey="forecasted_sales" name="Forecasted"   fill={`url(#${GRAD.greenH})`} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function AdvCategoryPredictionChart({ rows }: { rows: AdvCategoryPrediction[] }): React.ReactElement {
  const data = rows.map((r) => ({
    category: r.category,
    current:  fromM(r.current),
    forecast: fromM(r.forecast),
    growth:   r.growth,
  }));
  return (
    <ChartCard title="Which categories will grow next month?" subtitle="Category Prediction">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <GradDefs />
          <XAxis type="number" tickFormatter={(v) => formatNaira(v)} tick={TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="category" tick={TICK} axisLine={false} tickLine={false} width={100} />
          <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
          <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 10, color: "#6b7280" }} />
          <Bar dataKey="current"  name="Current sales" fill={`url(#${GRAD.blueH})`}  radius={[0, 4, 4, 0]} />
          <Bar dataKey="forecast" name="Forecasted"    fill={`url(#${GRAD.greenH})`} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function ForecastInsightsPage(): React.ReactElement {
  const { data: user } = useGetProfile();
  const tierData = useForecastPageData();
  const metadata = useTierMetadata();
  const { period } = useDashboardStore();

  const firstName = user?.first_name ?? "there";
  const greeting = getGreeting();

  const fmtDate = (iso: string | null): string =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      <div>
        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Forecast</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{greeting}, {firstName}</h1>
        <div className="flex items-center gap-2 mt-1">
          <CalendarIcon className="size-3.5 text-gray-400 dark:text-slate-500" />
          <p className="text-sm text-gray-400 dark:text-slate-500">
            {fmtDate(metadata.date_range.start)} – {fmtDate(metadata.date_range.end)}
            {" · "}{metadata.record_count} transactions
          </p>
        </div>
      </div>

      {period !== "all" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-300 font-medium">
          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
          Forecasts are always calculated from the full dataset — the period filter does not apply here.
        </div>
      )}

      {tierData.tier === "basic"        && <BasicForecastContent        data={tierData.data} />}
      {tierData.tier === "intermediate" && <IntermediateForecastContent data={tierData.data} />}
      {tierData.tier === "advanced"     && <AdvancedForecastContent     data={tierData.data} />}

    </div>
  );
}
