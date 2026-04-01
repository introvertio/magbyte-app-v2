"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useCustomersPageData, useTierMetadata } from "@/app/hooks/useDashboardData";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import { getGreeting, formatNaira, cn } from "@/lib/utils";
import {
  DashTooltip, GradDefs, GRAD, SectionHeader, ChartCard, KpiCard, TICK, GRID_STROKE,
} from "@/app/components/ui/dashboard/ChartUtils";
import type { IntermediateAnalysisResult } from "@/app/types/intermediateAnalysis";
import type { AdvancedAnalysisResult } from "@/app/types/advancedAnalysis";

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
            <tr key={i} className={cn("border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors", i%2===0?"bg-white dark:bg-slate-900":"bg-gray-50/40 dark:bg-slate-800/30")}>
              <td className="px-4 py-2.5 text-gray-800 dark:text-slate-200 font-medium">{row.customer_name}</td>
              <td className="px-4 py-2.5 text-gray-500 dark:text-slate-500 font-mono text-[11px]">{row.customer_phone}</td>
              <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{formatNaira(row.total_spent)}</td>
              <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300 tabular-nums">{row.total_visits}</td>
              <td className="px-4 py-2.5 text-gray-400 dark:text-slate-500">{String(row.last_visit_date).slice(0, 10)}</td>
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
            <button disabled={page===totalPages-1} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white disabled:opacity-40 hover:opacity-90 font-medium">Next</button>
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
              <tr key={i} className={cn("border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors", i%2===0?"bg-white dark:bg-slate-900":"bg-gray-50/40 dark:bg-slate-800/30")}>
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
                <td className="px-4 py-2.5 text-gray-400 dark:text-slate-500">{String(row.last_visit).slice(0, 10)}</td>
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
            <button disabled={page===totalPages-1} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white disabled:opacity-40 hover:opacity-90 font-medium">Next</button>
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
          <ChartCard title="How many customers shopped each month?" subtitle="Monthly Active Customers">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts.monthly_active} margin={{top:4,right:8,left:0,bottom:0}}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<DashTooltip />} />
                <Area type="monotone" dataKey="active_customers" name="Active Customers" stroke="#001BB7" strokeWidth={2.5} fill={`url(#${GRAD.blueArea})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Frequency distribution */}
        {charts.frequency_distribution.length > 0 && (
          <ChartCard title="How often do customers buy from you?" subtitle="Purchase Frequency">
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
          <ChartCard title="Who are your top spenders?" subtitle="Customer Leaderboard">
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
          <ChartCard title="How many customers shopped each month?" subtitle="Monthly Active Customers">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts.monthly_active} margin={{top:4,right:8,left:0,bottom:0}}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<DashTooltip />} />
                <Area type="monotone" dataKey="active_customers" name="Active Customers" stroke="#001BB7" strokeWidth={2.5} fill={`url(#${GRAD.blueArea})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Spending distribution */}
        {charts.spending_distribution.length > 0 && (
          <ChartCard title="How much do your customers typically spend?" subtitle="Spending Distribution">
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
          <ChartCard title="Who are your top spenders?" subtitle="Customer Ranking">
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

  const greeting = getGreeting();
  const userName = user?.first_name ? `, ${user.first_name}` : "";

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{greeting}{userName}</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
          {metadata.date_range.start} – {metadata.date_range.end} · {metadata.record_count} transactions
        </p>
      </div>

      <SectionHeader title="Key Numbers" />
      {tierData.tier === "intermediate" && <IntContent data={tierData.data} />}
      {tierData.tier === "advanced"     && <AdvContent data={tierData.data} />}

      <SectionHeader title="Customer Directory" />
      {tierData.tier === "intermediate" && <IntCustomerTable rows={tierData.data.customer_detail_table} />}
      {tierData.tier === "advanced"     && <AdvCustomerTable rows={tierData.data.clv_leaderboard} />}
    </div>
  );
}
