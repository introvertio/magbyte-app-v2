"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  ComposedChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
  Cell,
} from "recharts";
import { useIntermediateAnalysis, useAdvancedAnalysis } from "@/app/hooks/useDashboardData";
import { useDashboardStore } from "@/app/stores/dashboard/useDashboardStore";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import { getGreeting, formatNaira, cn } from "@/lib/utils";
import {
  DashTooltip, GradDefs, GRAD,
  SectionHeader, ChartCard, KpiCard,
  TICK, GRID_STROKE,
} from "@/app/components/ui/dashboard/ChartUtils";
import type { IntermediateAnalysisResult } from "@/app/types/intermediateAnalysis";
import type { AdvancedAnalysisResult } from "@/app/types/advancedAnalysis";

// ── Shared waterfall step types ───────────────────────────────────────────────

interface WaterfallStep {
  label: string;
  value: number;
  type: "start" | "decrease" | "end";
}
interface WaterfallObj { steps?: WaterfallStep[] }

// ── Shared waterfall chart component ─────────────────────────────────────────
// Renders the Operating Profit waterfall (Gross Profit → expenses → Op. Profit)

function OperatingProfitWaterfall({
  waterfall,
  valueFmt,
}: {
  waterfall: WaterfallObj | unknown;
  valueFmt: (v: number) => string;
}): React.ReactElement | null {
  const steps = (waterfall as WaterfallObj)?.steps;
  if (!steps || steps.length === 0) return null;

  const data = steps.map((s) => ({
    label:      s.label,
    value:      Math.abs(s.value),
    isNegative: s.value < 0,
    type:       s.type,
    raw:        s.value,
  }));

  return (
    <ChartCard title="Where did gross profit go?" subtitle="Operating Profit Waterfall" className="col-span-full lg:col-span-2">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <GradDefs />
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={valueFmt} tick={TICK} axisLine={false} tickLine={false} width={70} />
          <Tooltip formatter={(v) => typeof v === "number" ? valueFmt(v) : String(v)} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
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
  );
}

// ── Expense detail table — Intermediate ──────────────────────────────────────

function IntExpenseTable(): React.ReactElement {
  const { page_4 } = useIntermediateAnalysis();
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const rows = page_4.expense_detail_table;
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Expense Log</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
          All recorded expense transactions · {rows.length} total rows
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
              {["Date", "Amount", "Paid To", "Notes"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i} className={cn("border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors", i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/40 dark:bg-slate-800/30")}>
                <td className="px-4 py-2.5 text-gray-400 dark:text-slate-500 whitespace-nowrap tabular-nums">{String(row.date).slice(0, 10)}</td>
                <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{formatNaira(row.amount)}</td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300">{row.paid_to}</td>
                <td className="px-4 py-2.5 text-gray-400 dark:text-slate-500 max-w-[200px] truncate">{row.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-400 dark:text-slate-500">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">← Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="px-3 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Expense detail table — Advanced ──────────────────────────────────────────

function AdvExpenseTable(): React.ReactElement {
  const { page_5 } = useAdvancedAnalysis();
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const rows = page_5.expense_detail_table;
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Expense Log</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">All recorded expense transactions · {rows.length} total rows</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
              {["Date", "Branch", "Type", "Amount", "Paid To", "Receipt", "Approved By"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i} className={cn("border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors", i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/40 dark:bg-slate-800/30")}>
                <td className="px-4 py-2.5 text-gray-400 dark:text-slate-500 whitespace-nowrap">{row.date}</td>
                <td className="px-4 py-2.5 text-gray-600 dark:text-slate-400">{row.branch}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50">{row.expense_type}</span>
                </td>
                <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{row.amount}</td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300">{row.paid_to}</td>
                <td className="px-4 py-2.5 text-gray-400 dark:text-slate-500 font-mono text-[10px]">{row.receipt_no}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">{row.approved_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-400 dark:text-slate-500">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">← Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="px-3 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tier content sections ─────────────────────────────────────────────────────

function IntContent({ data }: { data: IntermediateAnalysisResult["page_4"] }): React.ReactElement {
  const { kpis, charts } = data;
  // Note: "Net Profit" and "Operating Profit" are the same value in this tier — only one is shown.
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <KpiCard label="Total Expenses"   value={formatNaira(kpis.total_expenses)}      tooltip="All money spent running your business in this period." />
        <KpiCard label="Operating Profit" value={formatNaira(kpis.operating_profit)}    tooltip="Gross profit minus all operating expenses." accent={kpis.operating_profit < 0 ? "red" : "green"} />
        <KpiCard label="Expense Share"    value={`${kpis.expense_share}%`}              tooltip="What percentage of your revenue went to expenses." />
        <KpiCard label="Expense to Sales" value={`${kpis.expense_to_sales_ratio}%`}     tooltip="For every ₦100 of sales, this is how much went to expenses." />
        <KpiCard label="Monthly Average"  value={formatNaira(kpis.monthly_avg_expense)} tooltip="Average spend per month across the period." />
        <KpiCard label="YTD Expenses"     value={formatNaira(kpis.ytd_expenses)}        tooltip="Total expenses recorded so far this year." />
        <KpiCard label="Profit Margin"    value={`${kpis.net_profit_margin}%`}          tooltip="Operating profit as a percentage of total revenue." accent={kpis.net_profit_margin < 0 ? "red" : "green"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {charts.expense_trend.length > 0 && (
          <ChartCard title="How your spending changed over time" subtitle="Expense Trend">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts.expense_trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="date_str"
                  tick={TICK} tickLine={false} axisLine={false}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return isNaN(d.getTime()) ? String(v).slice(0, 6) : d.toLocaleDateString("en", { month: "short", day: "numeric" });
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatNaira(v)} width={70} />
                <Tooltip content={<DashTooltip valueFormatter={(v) => formatNaira(v)} />} />
                <Area type="monotone" dataKey="expenses" fill={`url(#${GRAD.amberV})`} stroke="#d97706" strokeWidth={2} dot={false} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {charts.expense_vs_sales.length > 0 && (
          <ChartCard title="Are your expenses eating into your sales?" subtitle="Expenses vs Sales">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={charts.expense_vs_sales} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatNaira(v)} width={70} />
                <Tooltip content={<DashTooltip valueFormatter={(v) => formatNaira(v)} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="expenses" name="Expenses" fill={`url(#${GRAD.amberV})`} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="sales" name="Sales" stroke="#001BB7" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Operating profit waterfall */}
        <OperatingProfitWaterfall waterfall={charts.operating_profit_waterfall} valueFmt={formatNaira} />
      </div>
    </>
  );
}

function AdvContent({ data }: { data: AdvancedAnalysisResult["page_5"] }): React.ReactElement {
  const { kpis, charts } = data;
  // Advanced tier expense values are in millions (float)
  const fromM = (v: number): string => formatNaira(v * 1_000_000);

  // Donut data for expense by category
  const DONUT_COLOURS = ["#001BB7","#2563eb","#60a5fa","#f59e0b","#ef4444","#10b981","#8b5cf6","#f97316"];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <KpiCard label="Total Expenses"   value={kpis.total_expenses}           tooltip="All money spent running your business in this period." />
        <KpiCard label="Operating Profit" value={kpis.operating_profit}         tooltip="Gross profit minus all operating expenses." accent={kpis.operating_profit.startsWith("₦-") ? "red" : "green"} />
        <KpiCard label="Expense Share"    value={kpis.expense_share}            tooltip="What percentage of your revenue went to expenses." />
        <KpiCard label="Largest Category" value={kpis.largest_expense_category} tooltip="The type of expense that cost you the most." />
        <KpiCard label="Monthly Average"  value={kpis.monthly_avg_expense}      tooltip="Average spend per month across the period." />
        <KpiCard label="YTD Expenses"     value={kpis.ytd_expenses}             tooltip="Total expenses recorded so far this year." />
        <KpiCard label="Transactions"     value={String(kpis.expense_transactions)} tooltip="Number of individual expense entries recorded." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {charts.expense_trend.length > 0 && (
          <ChartCard title="How your spending changed over time" subtitle="Expense Trend">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts.expense_trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="date_str"
                  tick={TICK} tickLine={false} axisLine={false}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return isNaN(d.getTime()) ? String(v).slice(0, 6) : d.toLocaleDateString("en", { month: "short", day: "numeric" });
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => fromM(v)} width={70} />
                <Tooltip content={<DashTooltip valueFormatter={(v) => fromM(v)} />} />
                <Area type="monotone" dataKey="expenses" fill={`url(#${GRAD.amberV})`} stroke="#d97706" strokeWidth={2} dot={false} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {charts.expense_vs_sales.length > 0 && (
          <ChartCard title="Are your expenses eating into your sales?" subtitle="Expenses vs Sales">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={charts.expense_vs_sales} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => fromM(v)} width={70} />
                <Tooltip content={<DashTooltip valueFormatter={(v) => fromM(v)} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="expenses" name="Expenses" fill={`url(#${GRAD.amberV})`} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="sales" name="Sales" stroke="#001BB7" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Expense by category donut */}
        {(charts.expense_by_category as Array<{ category: string; amount: number }>).length > 0 && (
          <ChartCard title="Where is most of your money going?" subtitle="Expense by Category">
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <BarChart
                  data={(charts.expense_by_category as Array<{ category: string; amount: number }>).slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <GradDefs />
                  <XAxis type="number" tickFormatter={fromM} tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="category" tick={TICK} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<DashTooltip valueFormatter={fromM} />} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {(charts.expense_by_category as Array<{ category: string; amount: number }>).slice(0, 6).map((_e, i) => (
                      <Cell key={i} fill={DONUT_COLOURS[i % DONUT_COLOURS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {(charts.expense_by_category as Array<{ category: string; amount: number }>).slice(0, 6).map((item, i) => (
                  <div key={item.category} className="flex items-center gap-2 text-xs">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLOURS[i % DONUT_COLOURS.length] }} />
                    <span className="text-gray-600 dark:text-slate-300 truncate max-w-[120px]">{item.category}</span>
                    <span className="ml-auto font-bold text-gray-800 dark:text-slate-200 tabular-nums">{fromM(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        )}

        {/* Operating profit waterfall */}
        <OperatingProfitWaterfall waterfall={charts.operating_profit_waterfall} valueFmt={fromM} />
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExpensesPage(): React.ReactElement {
  const { data: user } = useGetProfile();
  const { devTier } = useDashboardStore();

  const intData = useIntermediateAnalysis();
  const advData = useAdvancedAnalysis();

  const greeting = getGreeting();
  const userName = user?.first_name ? `, ${user.first_name}` : "";

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div>
        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Expenses</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{greeting}{userName}</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Here is a full breakdown of your operating costs.</p>
      </div>

      <SectionHeader title="Key Numbers" />
      {devTier === "intermediate" && <IntContent data={intData.page_4} />}
      {devTier === "advanced"     && <AdvContent data={advData.page_5} />}

      <div>
        <SectionHeader title="Expense Records" />
        {devTier === "advanced" ? <AdvExpenseTable /> : <IntExpenseTable />}
      </div>
    </div>
  );
}
