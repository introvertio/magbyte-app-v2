"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import { useFilteredData, filterMonthlyTrend } from "@/app/hooks/useFilteredData";
import { useSalesPageData, useTierMetadata } from "@/app/hooks/useDashboardData";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import { useDashboardStore } from "@/app/stores/dashboard/useDashboardStore";
import { getGreeting, formatNaira, cn } from "@/lib/utils";
import { CalendarIcon } from "@heroicons/react/24/outline";
import {
  DashTooltip, GradDefs, GRAD, DONUT_COLOURS,
  SectionHeader, ChartCard, KpiCard, TICK, GRID_STROKE,
} from "@/app/components/ui/dashboard/ChartUtils";
import type { IntermediateAnalysisResult } from "@/app/types/intermediateAnalysis";
import type { AdvancedAnalysisResult } from "@/app/types/advancedAnalysis";
import type { BasicAnalysisResult } from "@/app/types/basicAnalysis";

// ── Profit/Operating waterfall types ─────────────────────────────────────────

interface WaterfallStep {
  label: string;
  value: number;
  type: "start" | "decrease" | "end";
}

// ── Compute deduplicated monthly x-axis ticks from daily sales data ───────────
// Daily data like "2025-01-04" repeats the same month label many times.
// This returns one tick per month (the first date of each month in the dataset).

function useMonthlyTicks(data: Array<{ date: string }>): string[] {
  return useMemo(() => {
    const seen = new Set<string>();
    return data
      .filter((p) => {
        const key = p.date.slice(0, 7); // "YYYY-MM"
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((p) => p.date);
  }, [data]);
}

// Formats a monthly tick — always show short month name;
// append 2-digit year only when data spans multiple years.
function monthTickFormatter(dateStr: string, multiYear: boolean): string {
  const d = new Date(dateStr.length === 7 ? `${dateStr}-01` : dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(0, 7);
  const month = d.toLocaleDateString("en", { month: "short" });
  if (multiYear) {
    const yr = d.toLocaleDateString("en", { year: "2-digit" });
    return `${month} '${yr}`;
  }
  return month;
}

// ── Basic: transaction log (uses filtered hook for period-filter support) ─────

function BasicDetailTable(): React.ReactElement {
  const { page_1 } = useFilteredData();
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  // Sort rows by date descending so most recent transactions appear first
  const rows = useMemo(
    () => [...page_1.detail_table].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [page_1.detail_table],
  );
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Transaction Log</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Day-by-day record of every sale · {rows.length} total rows</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
              {["Date","Product","Category","Qty","Price","Payment","Revenue","Profit"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i} className={cn("border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors", i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/40 dark:bg-slate-800/30")}>
                <td className="px-4 py-2.5 text-gray-400 dark:text-slate-500 whitespace-nowrap tabular-nums">{String(row.date).slice(0, 10)}</td>
                <td className="px-4 py-2.5 text-gray-800 dark:text-slate-200 font-medium max-w-[140px] truncate">{row.product}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">{row.category}</td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300 tabular-nums">{row.quantity}</td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300 tabular-nums">{formatNaira(row.selling_price)}</td>
                <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">{row.payment_method}</span></td>
                <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{formatNaira(row.total_sales_auto)}</td>
                <td className={cn("px-4 py-2.5 font-bold tabular-nums", row.profit_auto > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>{formatNaira(row.profit_auto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-400 dark:text-slate-500">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium">Previous</button>
            <button disabled={page === totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white disabled:opacity-40 hover:opacity-90 transition-opacity font-medium">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tier content sections ─────────────────────────────────────────────────────

function BasicContent({ data }: { data: BasicAnalysisResult["page_1"] }): React.ReactElement {
  const { kpis, charts } = data;
  const metadata = useTierMetadata();

  // One tick per month — fixes repeated month labels on the x-axis
  const salesTicks  = useMonthlyTicks(charts.sales_trend);
  const profitTicks = useMonthlyTicks(charts.profit_trend);

  // Show year suffix when data spans multiple calendar years
  const startYear = new Date(metadata.date_range.start).getFullYear();
  const endYear   = new Date(metadata.date_range.end).getFullYear();
  const multiYear = startYear !== endYear;
  const tickFmt   = (v: string) => monthTickFormatter(v, multiYear);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <KpiCard label="Total Sales"   value={formatNaira(kpis.total_sales)}               tooltip="Total money brought in from all sales." />
        <KpiCard label="Total Cost"    value={formatNaira(kpis.total_cost)}                tooltip="How much you spent buying the goods you sold." />
        <KpiCard label="Total Profit"  value={formatNaira(kpis.total_profit)}              tooltip="What you kept after paying for stock." />
        <KpiCard label="Units Sold"    value={kpis.units_sold.toLocaleString()}            tooltip="Total number of individual items sold." />
        <KpiCard label="Avg. Price"    value={formatNaira(kpis.average_selling_price)}     tooltip="On average, how much each unit sold for." />
        <KpiCard label="Transactions"  value={kpis.total_transactions.toLocaleString()}    tooltip="How many separate sales were made." />
        <KpiCard label="Transfer Rate" value={`${(kpis.transfer_rate * 100).toFixed(0)}%`} tooltip="Share of customers who paid by bank transfer." />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ChartCard title="How did your sales grow?" subtitle="Sales Trend">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.sales_trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="date" ticks={salesTicks} tickFormatter={tickFmt} tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} width={62} />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              <Area type="monotone" dataKey="sales" stroke="#001BB7" strokeWidth={2.5} fill={`url(#${GRAD.blueArea})`} dot={false} name="Sales" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="How did profit move over time?" subtitle="Profit Trend">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={charts.profit_trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="date" ticks={profitTicks} tickFormatter={tickFmt} tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} width={62} />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={false} name="Profit" activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Which categories moved the most units?" subtitle="Volume by Category">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.quantity_by_category} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <GradDefs />
              <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={TICK} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<DashTooltip />} />
              <Bar dataKey="quantity" fill={`url(#${GRAD.blueH})`} radius={[0, 6, 6, 0]} name="Units" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="How do your customers prefer to pay?" subtitle="Payment Method Breakdown">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={charts.payment_method_distribution} dataKey="transactions" nameKey="payment_method" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
                  {charts.payment_method_distribution.map((_e, i) => <Cell key={i} fill={DONUT_COLOURS[i % DONUT_COLOURS.length]} />)}
                </Pie>
                <Tooltip content={<DashTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2.5">
              {charts.payment_method_distribution.map((item, i) => (
                <div key={item.payment_method} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLOURS[i % DONUT_COLOURS.length] }} />
                  <span className="text-gray-600 dark:text-slate-300 capitalize">{item.payment_method}</span>
                  <span className="ml-auto font-bold text-gray-800 dark:text-slate-200 tabular-nums">{item.transactions}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>
      <BasicDetailTable />
    </>
  );
}

function IntContent({ data }: { data: IntermediateAnalysisResult["page_1"] }): React.ReactElement {
  const { kpis, charts } = data;
  const { filterYears, filterMonths } = useDashboardStore();

  // Filter monthly trend arrays to the active year/month selection
  const salesTrend  = filterMonthlyTrend(charts.sales_trend,  filterYears, filterMonths);
  const profitTrend = filterMonthlyTrend(charts.profit_trend, filterYears, filterMonths);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Sales"     value={formatNaira(kpis.total_sales)}     tooltip="Total money brought in from all sales." />
        <KpiCard label="Gross Profit"    value={formatNaira(kpis.gross_profit)}    tooltip="Sales minus cost of goods." accent={kpis.gross_profit > 0 ? "green" : "red"} />
        <KpiCard label="Order Count"     value={kpis.order_count.toLocaleString()} tooltip="Number of orders placed in this period." />
        <KpiCard label="Avg Order Value" value={formatNaira(kpis.aov)}             tooltip="Average revenue per order." />
        <KpiCard label="Profit Margin"   value={`${kpis.profit_margin}%`}          tooltip="What percentage of sales you keep as profit." accent={kpis.profit_margin > 15 ? "green" : "amber"} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ChartCard title="How did your sales grow month by month?" subtitle="Sales Trend">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={salesTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} width={62} />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              <Area type="monotone" dataKey="sales" stroke="#001BB7" strokeWidth={2.5} fill={`url(#${GRAD.blueArea})`} dot={false} name="Sales" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="How did profit move each month?" subtitle="Profit Trend">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={profitTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} width={62} />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Revenue by category" subtitle="Category Breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.revenue_by_category} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <GradDefs />
              <XAxis type="number" tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={TICK} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              <Bar dataKey="revenue" fill={`url(#${GRAD.blueH})`} radius={[0, 6, 6, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="How do customers prefer to pay?" subtitle="Payment Methods">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={charts.payment_method_distribution} dataKey="revenue" nameKey="method" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
                  {charts.payment_method_distribution.map((_e, i) => <Cell key={i} fill={DONUT_COLOURS[i % DONUT_COLOURS.length]} />)}
                </Pie>
                <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2.5">
              {charts.payment_method_distribution.map((item, i) => (
                <div key={item.method} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLOURS[i % DONUT_COLOURS.length] }} />
                  <span className="text-gray-600 dark:text-slate-300 capitalize">{item.method}</span>
                  <span className="ml-auto font-bold text-gray-800 dark:text-slate-200 tabular-nums">{formatNaira(item.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
        <ChartCard title="Which staff brought in the most revenue?" subtitle="Staff Performance">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.staff_performance} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} width={62} />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              <Bar dataKey="revenue" fill={`url(#${GRAD.blueV})`} radius={[6, 6, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}

function AdvContent({ data }: { data: AdvancedAnalysisResult["page_1"] }): React.ReactElement {
  const { kpis, charts } = data;
  const { filterYears, filterMonths } = useDashboardStore();
  // Advanced tier revenue/profit values are in millions (float)
  const fromM = (v: number): string => formatNaira(v * 1_000_000);

  const revenueTrend = filterMonthlyTrend(
    charts.revenue_trend as Array<{ month: string; month_short: string; revenue: number }>,
    filterYears, filterMonths,
  );
  const profitTrend = filterMonthlyTrend(
    charts.profit_trend as Array<{ month: string; month_short: string; profit: number }>,
    filterYears, filterMonths,
  );

  // Waterfall chart data
  const waterfallSteps = (charts.profit_waterfall as { steps?: WaterfallStep[] } | null)?.steps ?? [];
  const waterfallData = waterfallSteps.map((s) => ({
    label:      s.label,
    value:      Math.abs(s.value),
    isNegative: s.value < 0,
    type:       s.type,
    raw:        s.value,
  }));

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Gross Revenue" value={kpis.gross_revenue}   tooltip="Total money earned from all sales before deductions." />
        <KpiCard label="Gross Profit"  value={kpis.gross_profit}    tooltip="Revenue minus cost of goods sold." />
        <KpiCard label="Net Profit"    value={kpis.net_profit}      tooltip="Profit after all operating expenses." accent={kpis.net_profit.startsWith("₦-") ? "red" : "green"} />
        <KpiCard label="Profit Margin" value={kpis.profit_margin}   tooltip="Percentage of revenue kept as net profit." accent={kpis.profit_margin.startsWith("-") ? "red" : "green"} />
        <KpiCard label="Orders"        value={kpis.order_count.toLocaleString()} tooltip="Total number of orders placed." />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ChartCard title="Monthly revenue trend" subtitle="Revenue Trend">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fromM} tick={TICK} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<DashTooltip valueFormatter={fromM} />} />
              <Area type="monotone" dataKey="revenue" stroke="#001BB7" strokeWidth={2.5} fill={`url(#${GRAD.blueArea})`} dot={false} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="How did profit move each month?" subtitle="Profit Trend">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={profitTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fromM} tick={TICK} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<DashTooltip valueFormatter={fromM} />} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Revenue by category" subtitle="Category Breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.revenue_by_category} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <GradDefs />
              <XAxis type="number" tickFormatter={fromM} tick={TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={TICK} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<DashTooltip valueFormatter={fromM} />} />
              <Bar dataKey="revenue" fill={`url(#${GRAD.blueH})`} radius={[0, 6, 6, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="How do customers prefer to pay?" subtitle="Payment Methods">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={charts.payment_method_distribution} dataKey="revenue" nameKey="method" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
                  {charts.payment_method_distribution.map((_e, i) => <Cell key={i} fill={DONUT_COLOURS[i % DONUT_COLOURS.length]} />)}
                </Pie>
                <Tooltip content={<DashTooltip valueFormatter={fromM} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2.5">
              {charts.payment_method_distribution.map((item, i) => (
                <div key={item.method} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLOURS[i % DONUT_COLOURS.length] }} />
                  <span className="text-gray-600 dark:text-slate-300 capitalize">{item.method}</span>
                  <span className="ml-auto font-bold text-gray-800 dark:text-slate-200 tabular-nums">{fromM(item.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
        {/* Profit waterfall — Gross Profit → expenses breakdown → Net Profit */}
        {waterfallData.length > 0 && (
          <ChartCard title="Where did the profit go?" subtitle="Profit Waterfall" className="col-span-full lg:col-span-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={waterfallData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fromM} tick={TICK} axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={(v) => typeof v === "number" ? fromM(v) : String(v)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.type === "start" ? "#001BB7" :
                        entry.type === "end"   ? (entry.raw < 0 ? "#ef4444" : "#10b981") :
                        "#ef4444"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </>
  );
}

// ── Filter active notice ──────────────────────────────────────────────────────

function FilterNotice({ count }: { count: number }): React.ReactElement {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 text-xs text-blue-700 dark:text-blue-300 font-medium">
      <span className="size-1.5 rounded-full bg-blue-500 shrink-0" />
      Showing filtered data · {count} matching records
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SalesOverviewPage(): React.ReactElement {
  const { data: user } = useGetProfile();
  const tierData = useSalesPageData();
  const metadata = useTierMetadata();
  const filteredData = useFilteredData();
  const { filteredCount, isFiltered } = filteredData;

  const greeting = getGreeting();
  const firstName = user?.first_name ?? "there";
  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{greeting}, {firstName}</h1>
        <div className="flex items-center gap-2 mt-1">
          <CalendarIcon className="size-3.5 text-gray-400 dark:text-slate-500" />
          <p className="text-sm text-gray-400 dark:text-slate-500">
            {fmtDate(metadata.date_range.start)} – {fmtDate(metadata.date_range.end)}
            {" · "}{metadata.record_count} transactions
          </p>
        </div>
        <h2 className="text-lg font-semibold text-primary mt-3">Sales Overview</h2>
      </div>

      {isFiltered && tierData.tier === "basic" && <FilterNotice count={filteredCount} />}

      <SectionHeader title="Key Numbers" />
      {tierData.tier === "basic"        && <BasicContent data={filteredData.page_1} />}
      {tierData.tier === "intermediate" && <IntContent   data={tierData.data} />}
      {tierData.tier === "advanced"     && <AdvContent   data={tierData.data} />}
    </div>
  );
}
