"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useCustomersPageData, useTierMetadata } from "@/app/hooks/useDashboardData";
import { filterMonthlyTrend, toDate } from "@/app/hooks/useFilteredData";
import { useDashboardStore } from "@/app/stores/dashboard/useDashboardStore";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import { getGreeting, formatNaira, cn, fmtTableDate } from "@/lib/utils";
import {
  DashTooltip, GradDefs, GRAD, SectionHeader, ChartCard, KpiCard, TICK, GRID_STROKE, CHART_PRIMARY_VAR,
} from "@/app/components/ui/dashboard/ChartUtils";
import { EditableGreeting } from "@/app/components/ui/dashboard/EditableGreeting";
import type { IntermediateAnalysisResult } from "@/app/types/intermediateAnalysis";
import type { AdvancedAnalysisResult } from "@/app/types/advancedAnalysis";

function matchesDateFilters(
  dateStr: string,
  filterYears: number[],
  filterMonths: number[],
  filterDaysOfWeek: number[],
): boolean {
  const d = toDate(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  if (filterYears.length > 0 && !filterYears.includes(d.getFullYear())) return false;
  if (filterMonths.length > 0 && !filterMonths.includes(d.getMonth())) return false;
  if (filterDaysOfWeek.length > 0 && !filterDaysOfWeek.includes(d.getDay())) return false;
  return true;
}

function getVisitsBucket(visits: number): string {
  if (visits <= 1) return "1x";
  if (visits <= 3) return "2-3x";
  if (visits <= 5) return "4-5x";
  return "6x+";
}

// ── Intermediate customer table ───────────────────────────────────────────────

function IntCustomerTable({ rows }: { rows: IntermediateAnalysisResult["page_3"]["customer_detail_table"] }): React.ReactElement {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Customer Directory</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{rows.length} customers recorded</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
            {["Customer","Phone","Total Spent","Visits","Last Visit","CLV"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody>{slice.map((row, i) => (
            <tr key={i} className={cn("relative border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 hover:scale-[1.01] hover:z-10 transition-all duration-150", i%2===0?"bg-white dark:bg-slate-900":"bg-gray-50/40 dark:bg-slate-800/30")}>
              <td className="px-4 py-2.5 text-gray-800 dark:text-slate-200 font-medium">{row.customer_name}</td>
              <td className="px-4 py-2.5 text-gray-500 dark:text-slate-500 font-mono text-[11px]">{row.customer_phone}</td>
              <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{formatNaira(row.total_spent)}</td>
              <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300 tabular-nums">{row.total_visits}</td>
              <td className="px-4 py-2.5 text-gray-400 dark:text-slate-500">{fmtTableDate(row.last_visit_date)}</td>
              <td className="px-4 py-2.5 text-purple-600 dark:text-purple-400 font-semibold tabular-nums">{formatNaira(row.clv)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-400 dark:text-slate-500">Page {page+1} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-slate-700 font-medium">Previous</button>
            <button disabled={page===totalPages-1} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 text-xs rounded-lg bg-primary dark:bg-secondary text-white disabled:opacity-40 hover:opacity-90 dark:hover:bg-secondary/90 font-medium">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Advanced customer table ───────────────────────────────────────────────────

function AdvCustomerTable({ rows }: { rows: AdvancedAnalysisResult["page_3"]["clv_leaderboard"] }): React.ReactElement {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Customer Leaderboard</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Ranked by lifetime value · {rows.length} customers</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
            {["Rank","Customer","Phone","Total Spent","Visits","Last Visit"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody>{slice.map((row, i) => {
            const rank = page * PAGE_SIZE + i + 1;
            return (
              <tr key={i} className={cn("relative border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 hover:scale-[1.01] hover:z-10 transition-all duration-150", i%2===0?"bg-white dark:bg-slate-900":"bg-gray-50/40 dark:bg-slate-800/30")}>
                <td className="px-4 py-2.5">
                  <span className={cn("inline-flex items-center justify-center size-6 rounded-full text-[10px] font-bold",
                    rank===1?"bg-amber-100 text-amber-700":rank===2?"bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300":rank===3?"bg-orange-50 text-orange-600":"bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500")}>
                    {rank}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-slate-200">{row.customer}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-slate-500 font-mono text-[11px]">{row.phone}</td>
                <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{row.total_spent}</td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300 tabular-nums">{row.visits}</td>
                <td className="px-4 py-2.5 text-gray-400 dark:text-slate-500">{fmtTableDate(row.last_visit)}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-400 dark:text-slate-500">Page {page+1} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-slate-700 font-medium">Previous</button>
            <button disabled={page===totalPages-1} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 text-xs rounded-lg bg-primary dark:bg-secondary text-white disabled:opacity-40 hover:opacity-90 dark:hover:bg-secondary/90 font-medium">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tier content sections ─────────────────────────────────────────────────────

function IntContent({ data }: { data: IntermediateAnalysisResult["page_3"] }): React.ReactElement {
  const { kpis, charts, customer_detail_table } = data;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <KpiCard label="Unique Customers"   value={kpis.unique_customers.toString()}          tooltip="Total number of distinct customers." />
        <KpiCard label="Repeat Customers"   value={kpis.repeat_customers.toString()}          tooltip="Customers who bought more than once." accent="green" />
        <KpiCard label="Repeat Rate"        value={`${kpis.repeat_purchase_rate}%`}           tooltip="Percentage of customers who returned to buy again." accent={kpis.repeat_purchase_rate > 70 ? "green" : "amber"} />
        <KpiCard label="Avg Customer Value" value={formatNaira(kpis.avg_customer_value)}      tooltip="Average total spend per customer." />
        <KpiCard label="Avg Visits"         value={kpis.avg_visits_per_customer.toFixed(1)}   tooltip="How many times on average each customer visits." />
        <KpiCard label="Churned"            value={kpis.churned_customers.toString()}         tooltip="Customers who haven't returned in a long time." alert={kpis.churned_customers > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Monthly active customers */}
        {charts.monthly_active.length > 0 && (
          <ChartCard title="How many customers shopped each month?" subtitle="Monthly Active Customers" tooltip="Tracks how many unique people bought from you each month. A growing line means your customer base is expanding.">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts.monthly_active} margin={{top:4,right:8,left:0,bottom:0}}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<DashTooltip />} />
                <Area type="monotone" dataKey="active_customers" name="Active Customers" stroke={CHART_PRIMARY_VAR} strokeWidth={2.5} fill={`url(#${GRAD.blueArea})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Frequency distribution */}
        {charts.frequency_distribution.length > 0 && (
          <ChartCard title="How often do customers buy from you?" subtitle="Purchase Frequency" tooltip="Groups customers by how many times they've shopped. Most stores have many one-time buyers — converting them into regulars is the goal.">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.frequency_distribution} margin={{top:4,right:8,left:0,bottom:0}}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="bucket" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<DashTooltip />} />
                <Bar dataKey="customer_count" name="Customers" fill={`url(#${GRAD.blueV})`} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Top customers by spend */}
        {charts.customer_leaderboard.length > 0 && (
          <ChartCard title="Who are your top spenders?" subtitle="Customer Leaderboard" tooltip="The customers who've spent the most with you overall. Consider offering them loyalty perks to keep them coming back.">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.customer_leaderboard.slice(0,8)} layout="vertical" margin={{top:0,right:16,left:0,bottom:0}}>
                <GradDefs />
                <XAxis type="number" tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={TICK} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
                <Bar dataKey="total_spent" name="Total Spent" fill={`url(#${GRAD.blueH})`} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </>
  );
}

function AdvContent({ data }: { data: AdvancedAnalysisResult["page_3"] }): React.ReactElement {
  const { kpis, charts, clv_leaderboard } = data;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <KpiCard label="Unique Customers" value={kpis.unique_customers.toString()}  tooltip="Total distinct customers recorded." />
        <KpiCard label="Repeat Customers" value={kpis.repeat_customers.toString()}  tooltip="Customers who bought more than once." accent="green" />
        <KpiCard label="Repeat Rate"      value={kpis.repeat_rate}                  tooltip="Percentage of customers who returned." />
        <KpiCard label="Avg Spend"        value={kpis.avg_spend}                    tooltip="Average total spend per customer." />
        <KpiCard label="Lifetime Value"   value={kpis.customer_lifetime_value}      tooltip="Estimated total value a customer brings over their lifetime." />
        <KpiCard label="Retention Rate"   value={kpis.retention_rate}               tooltip="Percentage of customers who returned in the period." />
        <KpiCard label="Churned"          value={kpis.churned_customers.toString()} tooltip="Customers who have not returned." alert={kpis.churned_customers > 0} />
        <KpiCard label="New Customers"    value={kpis.new_customers.toString()}     tooltip="First-time buyers in this period." accent="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Monthly active customers */}
        {charts.monthly_active.length > 0 && (
          <ChartCard title="How many customers shopped each month?" subtitle="Monthly Active Customers" tooltip="Tracks how many unique people bought from you each month. A growing line means your customer base is expanding.">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts.monthly_active} margin={{top:4,right:8,left:0,bottom:0}}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<DashTooltip />} />
                <Area type="monotone" dataKey="active_customers" name="Active Customers" stroke={CHART_PRIMARY_VAR} strokeWidth={2.5} fill={`url(#${GRAD.blueArea})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Spending distribution */}
        {charts.spending_distribution.length > 0 && (
          <ChartCard title="How much do your customers typically spend?" subtitle="Spending Distribution" tooltip="Groups customers by how much they've spent in total. If most people are in the low bucket, there's room to grow your average order value.">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.spending_distribution} margin={{top:4,right:8,left:0,bottom:0}}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="bucket" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<DashTooltip />} />
                <Bar dataKey="count" name="Customers" fill={`url(#${GRAD.blueV})`} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Customer ranking — ranked list (values are pre-formatted strings) */}
        {charts.customer_ranking.length > 0 && (
          <ChartCard title="Who are your top spenders?" subtitle="Customer Ranking" tooltip="The customers who've spent the most with you overall. Consider offering them loyalty perks to keep them coming back.">
            <div className="flex flex-col gap-2 py-1">
              {charts.customer_ranking.slice(0, 8).map((row, i) => (
                <div key={row.customer} className="flex items-center gap-3 px-1">
                  <span className={cn(
                    "inline-flex items-center justify-center size-6 rounded-full text-[10px] font-bold shrink-0",
                    i===0?"bg-amber-100 text-amber-700":i===1?"bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300":i===2?"bg-orange-50 text-orange-600":"bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500"
                  )}>
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-700 dark:text-slate-300 flex-1 truncate">{row.customer}</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{row.total_spent}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CustomersPage(): React.ReactElement {
  const { data: user } = useGetProfile();
  const tierData = useCustomersPageData();
  const metadata = useTierMetadata();
  const { filterYears, filterMonths, filterDaysOfWeek } = useDashboardStore();
  const isFiltered = filterYears.length > 0 || filterMonths.length > 0 || filterDaysOfWeek.length > 0;

  const greeting = getGreeting();
  const firstName = user?.first_name ?? "there";

  const filteredIntermediateData = useMemo(() => {
    if (!tierData || tierData.tier !== "intermediate") return null;

    // Applies global date filters to customers page and re-derives dependent KPIs/charts.
    const filteredRows = tierData.data.customer_detail_table.filter((row) =>
      matchesDateFilters(row.last_visit_date, filterYears, filterMonths, filterDaysOfWeek),
    );

    const filteredMonthlyActiveMap: Record<string, Set<string>> = {};
    filteredRows.forEach((row) => {
      const d = toDate(row.last_visit_date);
      if (Number.isNaN(d.getTime())) return;
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthShort = d.toLocaleDateString("en-GB", { month: "short" });
      const key = `${month}|${monthShort}`;
      if (!filteredMonthlyActiveMap[key]) filteredMonthlyActiveMap[key] = new Set<string>();
      filteredMonthlyActiveMap[key].add(row.customer_name);
    });
    const filteredMonthlyActive = Object.entries(filteredMonthlyActiveMap)
      .map(([key, names]) => {
        const [month, month_short] = key.split("|");
        return { month, month_short, active_customers: names.size };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    const frequencyMap: Record<string, number> = {};
    filteredRows.forEach((row) => {
      const bucket = getVisitsBucket(row.total_visits);
      frequencyMap[bucket] = (frequencyMap[bucket] ?? 0) + 1;
    });
    const bucketOrder = ["1x", "2-3x", "4-5x", "6x+"];
    const filteredFrequencyDistribution = bucketOrder
      .filter((bucket) => frequencyMap[bucket] !== undefined)
      .map((bucket) => ({ bucket, customer_count: frequencyMap[bucket] }));

    const filteredLeaderboard = [...filteredRows]
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10)
      .map((row) => ({
        name: row.customer_name,
        customer_phone: row.customer_phone,
        total_spent: row.total_spent,
        visits: row.total_visits,
      }));

    const totalSpent = filteredRows.reduce((sum, row) => sum + row.total_spent, 0);
    const totalVisits = filteredRows.reduce((sum, row) => sum + row.total_visits, 0);
    const uniqueCustomers = filteredRows.length;
    const repeatCustomers = filteredRows.filter((row) => row.total_visits > 1).length;
    const latestVisit = filteredRows.reduce(
      (max, row) => (row.last_visit_date > max ? row.last_visit_date : max),
      filteredRows[0]?.last_visit_date ?? tierData.data.kpis.last_visit_date,
    );
    const avgCustomerValue = uniqueCustomers > 0 ? totalSpent / uniqueCustomers : 0;
    const avgVisits = uniqueCustomers > 0 ? totalVisits / uniqueCustomers : 0;
    const repeatRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;
    const churnedCustomers = filteredRows.filter((row) => row.total_visits <= 1).length;
    const clv = uniqueCustomers > 0 ? filteredRows.reduce((sum, row) => sum + row.clv, 0) / uniqueCustomers : 0;

    const fallbackMonthlyActive = filterMonthlyTrend(tierData.data.charts.monthly_active, filterYears, filterMonths);
    const nextMonthlyActive = filteredMonthlyActive.length > 0 ? filteredMonthlyActive : fallbackMonthlyActive;

    return {
      ...tierData.data,
      kpis: {
        ...tierData.data.kpis,
        unique_customers: uniqueCustomers,
        repeat_customers: repeatCustomers,
        repeat_purchase_rate: Number(repeatRate.toFixed(1)),
        clv,
        avg_customer_value: avgCustomerValue,
        total_spent_list: totalSpent,
        total_visits: totalVisits,
        avg_visits_per_customer: avgVisits,
        last_visit_date: latestVisit,
        customers_this_month: nextMonthlyActive[nextMonthlyActive.length - 1]?.active_customers ?? 0,
        churned_customers: churnedCustomers,
        customer_retention_rate: Number(repeatRate.toFixed(1)),
      },
      customer_detail_table: filteredRows,
      charts: {
        ...tierData.data.charts,
        monthly_active: nextMonthlyActive,
        frequency_distribution: filteredFrequencyDistribution,
        customer_leaderboard: filteredLeaderboard,
      },
    };
  }, [tierData, filterYears, filterMonths, filterDaysOfWeek]);

  const intermediateDateRange = useMemo(() => {
    if (!filteredIntermediateData || filteredIntermediateData.customer_detail_table.length === 0) return null;
    const dates = filteredIntermediateData.customer_detail_table.map((r) => r.last_visit_date).sort();
    return { start: dates[0], end: dates[dates.length - 1], count: filteredIntermediateData.customer_detail_table.length };
  }, [filteredIntermediateData]);

  if (!tierData) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-gray-400 dark:text-slate-500 text-sm">Customer data is available on Intermediate and Advanced tiers.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Customers</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{greeting}, <EditableGreeting fallbackName={firstName} /></h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
          {intermediateDateRange
            ? `${intermediateDateRange.start} – ${intermediateDateRange.end} · ${intermediateDateRange.count} customers`
            : `${metadata.date_range.start} – ${metadata.date_range.end} · ${metadata.record_count} transactions`}
        </p>
      </div>

      {isFiltered && tierData.tier === "advanced" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-400 font-medium">
          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
          Date filters currently apply fully on Intermediate customers data. Advanced customer metrics still use full dataset.
        </div>
      )}

      <SectionHeader title="Key Numbers" />
      {tierData.tier === "intermediate" && filteredIntermediateData && <IntContent data={filteredIntermediateData} />}
      {tierData.tier === "advanced"     && <AdvContent data={tierData.data} />}

      <SectionHeader title="Customer Directory" />
      {tierData.tier === "intermediate" && filteredIntermediateData && <IntCustomerTable rows={filteredIntermediateData.customer_detail_table} />}
      {tierData.tier === "advanced"     && <AdvCustomerTable rows={tierData.data.clv_leaderboard} />}
    </div>
  );
}
