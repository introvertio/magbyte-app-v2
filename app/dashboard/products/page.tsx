"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useFilteredData } from "@/app/hooks/useFilteredData";
import { useProductsPageData, useTierMetadata } from "@/app/hooks/useDashboardData";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import { getGreeting, formatNaira, cn } from "@/lib/utils";
import { CalendarIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import {
  DashTooltip, GradDefs, GRAD, SectionHeader, ChartCard, KpiCard, TICK, GRID_STROKE,
} from "@/app/components/ui/dashboard/ChartUtils";
import type { BasicAnalysisResult } from "@/app/types/basicAnalysis";
import type { IntermediateAnalysisResult } from "@/app/types/intermediateAnalysis";
import type { AdvancedAnalysisResult } from "@/app/types/advancedAnalysis";

// ── Basic product table ───────────────────────────────────────────────────────

function BasicProductTable(): React.ReactElement {
  const { page_2 } = useFilteredData();
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<"revenue" | "profit" | "units_sold">("revenue");
  const PAGE_SIZE = 15;
  const sorted = [...page_2.product_table].sort((a, b) => b[sortBy] - a[sortBy]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const slice = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const sortBtn = (key: typeof sortBy, label: string) => (
    <button onClick={() => { setSortBy(key); setPage(0); }}
      className={cn("px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
        sortBy === key ? "bg-primary text-white shadow-sm" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700")}>
      {label}
    </button>
  );
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div><p className="text-sm font-semibold text-gray-800 dark:text-slate-100">All Products</p><p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{page_2.product_table.length} products · sorted by</p></div>
        <div className="flex gap-1.5">{sortBtn("revenue","Revenue")}{sortBtn("profit","Profit")}{sortBtn("units_sold","Units")}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
            {["Product","Category","Units Sold","Revenue","Profit","Margin","Reorder?"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody>{slice.map((row, i) => (
            <tr key={i} className={cn("border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors", i%2===0?"bg-white dark:bg-slate-900":"bg-gray-50/40 dark:bg-slate-800/30")}>
              <td className="px-4 py-2.5 text-gray-800 dark:text-slate-200 font-medium max-w-[160px] truncate">{row.product}</td>
              <td className="px-4 py-2.5 text-gray-500 dark:text-slate-500">{row.category}</td>
              <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300 tabular-nums">{row.units_sold.toLocaleString()}</td>
              <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{formatNaira(row.revenue)}</td>
              <td className={cn("px-4 py-2.5 font-bold tabular-nums", row.profit>0?"text-emerald-600":"text-red-500")}>{formatNaira(row.profit)}</td>
              <td className="px-4 py-2.5 tabular-nums">
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold",
                  row.profit_margin>0.3?"bg-emerald-100 text-emerald-700 border border-emerald-200":
                  row.profit_margin>0?"bg-amber-100 text-amber-700 border border-amber-200":"bg-red-100 text-red-700 border border-red-200")}>
                  {(row.profit_margin*100).toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-2.5">
                {row.needs_reorder
                  ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200"><ExclamationTriangleIcon className="size-3"/>Reorder</span>
                  : <span className="text-gray-200 dark:text-slate-700">—</span>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {totalPages>1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-400 dark:text-slate-500">Page {page+1} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page===0} onClick={() => setPage((p)=>p-1)} className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium">Previous</button>
            <button disabled={page===totalPages-1} onClick={() => setPage((p)=>p+1)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white disabled:opacity-40 hover:opacity-90 transition-opacity font-medium">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tier content sections ─────────────────────────────────────────────────────

function BasicContent({ data }: { data: BasicAnalysisResult["page_2"] }): React.ReactElement {
  const { kpis, top_products, category_performance } = data;
  const topData = top_products.slice(0, 10).map((p) => ({
    name: p.product.length > 18 ? p.product.slice(0, 18) + "…" : p.product,
    revenue: p.revenue, profit: p.profit,
  }));
  const catData = Object.entries(category_performance).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([category,sales])=>({category,sales}));
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Units Sold"     value={kpis.units_sold.toLocaleString()}                    tooltip="Total number of items sold across all products." />
        <KpiCard label="Revenue"        value={formatNaira(kpis.product_revenue)}                   tooltip="Total money made from all product sales." />
        <KpiCard label="Total Profit"   value={formatNaira(kpis.product_profit)}                    tooltip="What you kept after paying for stock." />
        <KpiCard label="Profit Margin"  value={`${(kpis.current_profit_margin*100).toFixed(1)}%`}   tooltip="Out of every ₦100 you earn, how much you keep." />
        <KpiCard label="Reorder Alerts" value={kpis.reorder_alerts.toString()} alert={kpis.reorder_alerts>0} tooltip="Products at or below minimum stock." />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ChartCard title="Which products bring in the most revenue?" subtitle="Top 10 by Revenue">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topData} layout="vertical" margin={{top:0,right:16,left:0,bottom:0}}>
              <GradDefs />
              <XAxis type="number" tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={TICK} axisLine={false} tickLine={false} width={114} />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{fontSize:10}} />
              <Bar dataKey="revenue" name="Revenue" fill={`url(#${GRAD.blueH})`} radius={[0,4,4,0]} />
              <Bar dataKey="profit"  name="Profit"  fill={`url(#${GRAD.greenH})`} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="How do categories compare in total sales?" subtitle="Category Sales">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={catData} layout="vertical" margin={{top:0,right:16,left:0,bottom:0}}>
              <GradDefs />
              <XAxis type="number" tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={TICK} axisLine={false} tickLine={false} width={114} />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              <Bar dataKey="sales" name="Sales" fill={`url(#${GRAD.blueH})`} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <BasicProductTable />
    </>
  );
}

function IntContent({ data }: { data: IntermediateAnalysisResult["page_2"] }): React.ReactElement {
  const { kpis, charts, product_table } = data;
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const totalPages = Math.ceil(product_table.length / PAGE_SIZE);
  const slice = product_table.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <KpiCard label="Products"       value={kpis.total_products.toString()}              tooltip="Total distinct products tracked." />
        <KpiCard label="Units Sold"     value={kpis.units_sold.toLocaleString()}            tooltip="Total units sold this period." />
        <KpiCard label="Stock Balance"  value={kpis.current_stock_balance.toLocaleString()} tooltip="Units currently on hand." />
        <KpiCard label="Below Reorder"  value={kpis.products_below_reorder.toString()}      tooltip="Products with stock below reorder level." alert={kpis.products_below_reorder > 0} />
        <KpiCard label="Restock Cost"   value={formatNaira(kpis.restock_cost)}              tooltip="Total cost of stock added this period." />
        <KpiCard label="Stock Turnover" value={`${kpis.stock_turnover_rate.toFixed(0)}x`}   tooltip="How quickly you are selling through your stock." />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Top products by units sold */}
        <ChartCard title="Which products sell the most units?" subtitle="Top Products by Volume">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.top_products.slice(0, 10)} layout="vertical" margin={{top:0,right:16,left:0,bottom:0}}>
              <GradDefs />
              <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="product" tick={TICK} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<DashTooltip />} />
              <Bar dataKey="units_sold" name="Units Sold" fill={`url(#${GRAD.blueH})`} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        {/* Stock by category */}
        {charts.stock_by_category.length > 0 && (
          <ChartCard title="How much stock does each category hold?" subtitle="Stock by Category">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={charts.stock_by_category} margin={{top:4,right:8,left:0,bottom:0}}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="category" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<DashTooltip />} />
                <Bar dataKey="stock_level" name="Stock Level" fill={`url(#${GRAD.greenV})`} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {/* Supplier ranking */}
        {charts.supplier_ranking.length > 0 && (
          <ChartCard title="Which suppliers do you spend the most with?" subtitle="Supplier Ranking">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.supplier_ranking} layout="vertical" margin={{top:0,right:16,left:0,bottom:0}}>
                <GradDefs />
                <XAxis type="number" tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={TICK} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
                <Bar dataKey="total_spent" name="Total Spent" fill={`url(#${GRAD.blueH})`} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
      {/* Product table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Product Detail</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{product_table.length} products with stock data</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
              {["Product","Category","Units Sold","Revenue","Profit","Margin","Stock"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>{slice.map((row, i) => (
              <tr key={i} className={cn("border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors", i%2===0?"bg-white dark:bg-slate-900":"bg-gray-50/40 dark:bg-slate-800/30")}>
                <td className="px-4 py-2.5 text-gray-800 dark:text-slate-200 font-medium max-w-[160px] truncate">{row.product}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-slate-500">{row.category}</td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300 tabular-nums">{row.units_sold.toLocaleString()}</td>
                <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-slate-200 tabular-nums">{formatNaira(row.revenue)}</td>
                <td className={cn("px-4 py-2.5 font-bold tabular-nums", row.profit>0?"text-emerald-600":"text-red-500")}>{formatNaira(row.profit)}</td>
                <td className="px-4 py-2.5">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold",
                    row.profit_margin>15?"bg-emerald-100 text-emerald-700 border border-emerald-200":
                    row.profit_margin>0?"bg-amber-100 text-amber-700 border border-amber-200":"bg-red-100 text-red-700 border border-red-200")}>
                    {row.profit_margin}%
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300 tabular-nums">{row.stock_balance}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {totalPages>1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-800">
            <p className="text-xs text-gray-400 dark:text-slate-500">Page {page+1} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-slate-700 font-medium">Previous</button>
              <button disabled={page===totalPages-1} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white disabled:opacity-40 hover:opacity-90 font-medium">Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function AdvContent({ data }: { data: AdvancedAnalysisResult["page_2"] }): React.ReactElement {
  const { kpis, charts, product_health_table } = data;
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const alerts = product_health_table.filter(r => r.reorder_alert);
  const totalPages = Math.ceil(product_health_table.length / PAGE_SIZE);
  const slice = product_health_table.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Products"  value={kpis.total_products.toString()} tooltip="Distinct products in inventory." />
        <KpiCard label="Units Sold"      value={kpis.units_sold}               tooltip="Total units sold this period." />
        <KpiCard label="Stock Level"     value={kpis.current_stock_level}      tooltip="Total units currently on hand." />
        <KpiCard label="Inventory Value" value={kpis.inventory_value}          tooltip="Estimated value of current stock." />
        <KpiCard label="Restock Cost"    value={kpis.restock_cost}             tooltip="Total cost of restocking this period." />
        <KpiCard label="Reorder Alerts"  value={alerts.length.toString()} alert={alerts.length>0} tooltip="Products flagged for reordering." />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Inventory level over time */}
        {charts.inventory_level_trend.length > 0 && (
          <ChartCard title="How has your total stock changed over time?" subtitle="Inventory Trend">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts.inventory_level_trend} margin={{top:4,right:8,left:0,bottom:0}}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="date_str" tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<DashTooltip />} />
                <Area type="monotone" dataKey="total_stock" name="Total Stock" stroke="#10b981" strokeWidth={2.5} fill={`url(#${GRAD.greenArea})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {/* Stock by category */}
        {charts.stock_by_category.length > 0 && (
          <ChartCard title="How much stock does each category hold?" subtitle="Stock by Category">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.stock_by_category} margin={{top:4,right:8,left:0,bottom:0}}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="category" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<DashTooltip />} />
                <Bar dataKey="stock_level" name="Stock Level" fill={`url(#${GRAD.greenV})`} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {/* Top products by quantity */}
        {charts.top_products.length > 0 && (
          <ChartCard title="Which products sell the most units?" subtitle="Top Products by Volume">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.top_products.slice(0,10)} layout="vertical" margin={{top:0,right:16,left:0,bottom:0}}>
                <GradDefs />
                <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="product" tick={TICK} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<DashTooltip />} />
                <Bar dataKey="quantity" name="Units Sold" fill={`url(#${GRAD.blueH})`} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden mt-4">
        <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Product Health</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{product_health_table.length} products · {alerts.length} require restocking</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
              {["Product","Category","Current Stock","Min Stock","Days Cover","Reorder?"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>{slice.map((row, i) => (
              <tr key={i} className={cn("border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors", i%2===0?"bg-white dark:bg-slate-900":"bg-gray-50/40 dark:bg-slate-800/30")}>
                <td className="px-4 py-2.5 text-gray-800 dark:text-slate-200 font-medium max-w-[160px] truncate">{row.product}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-slate-500">{row.category}</td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300 tabular-nums">{row.current_stock}</td>
                <td className="px-4 py-2.5 text-gray-500 dark:text-slate-500 tabular-nums">{row.min_stock}</td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-slate-300 tabular-nums">{row.days_inventory}d</td>
                <td className="px-4 py-2.5">
                  {row.reorder_alert
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200"><ExclamationTriangleIcon className="size-3"/>Reorder</span>
                    : <span className="text-gray-200 dark:text-slate-700">—</span>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {totalPages>1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-800">
            <p className="text-xs text-gray-400 dark:text-slate-500">Page {page+1} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-slate-700 font-medium">Previous</button>
              <button disabled={page===totalPages-1} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white disabled:opacity-40 hover:opacity-90 font-medium">Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ProductPerformancePage(): React.ReactElement {
  const { data: user } = useGetProfile();
  const tierData = useProductsPageData();
  const metadata = useTierMetadata();
  const { isFiltered, filteredCount } = useFilteredData();

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
        <h2 className="text-lg font-semibold text-primary mt-3">Product Performance</h2>
      </div>

      {tierData.tier === "basic" && isFiltered && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 text-xs text-blue-700 dark:text-blue-300 font-medium">
          <span className="size-1.5 rounded-full bg-blue-500 shrink-0" />
          Showing filtered data · {filteredCount} matching records
        </div>
      )}

      <SectionHeader title="Key Numbers" />
      {tierData.tier === "basic"        && <BasicContent data={tierData.data} />}
      {tierData.tier === "intermediate" && <IntContent   data={tierData.data} />}
      {tierData.tier === "advanced"     && <AdvContent   data={tierData.data} />}
    </div>
  );
}
