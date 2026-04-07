"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LabelList, Legend,
} from "recharts";
import { useFilteredData, filterMonthlyTrend } from "@/app/hooks/useFilteredData";
import { useSalesPageData, useTierMetadata } from "@/app/hooks/useDashboardData";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import { useDashboardStore } from "@/app/stores/dashboard/useDashboardStore";
import { getGreeting, formatNaira, cn, fmtTableDate } from "@/lib/utils";
import { CalendarIcon } from "@heroicons/react/24/outline";
import {
  DashTooltip, GradDefs, GRAD, DONUT_COLOURS, CHART_COLOURS,
  SectionHeader, ChartCard, KpiCard, TICK, GRID_STROKE, CHART_PRIMARY_VAR,
} from "@/app/components/ui/dashboard/ChartUtils";
import { EditableGreeting } from "@/app/components/ui/dashboard/EditableGreeting";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useRegisterPageFilters } from "@/app/hooks/useRegisterPageFilters";
import type { IntermediateAnalysisResult } from "@/app/types/intermediateAnalysis";
import type { AdvancedAnalysisResult } from "@/app/types/advancedAnalysis";
import type { BasicAnalysisResult } from "@/app/types/basicAnalysis";

// ── Profit/Operating waterfall types ─────────────────────────────────────────

interface WaterfallStep {
  label: string;
  value: number;
  type: "start" | "decrease" | "end";
}

// ── Aggregate daily trend data into monthly totals ───────────────────────────
// Groups ALL data by month-of-year (Jan…Dec), summing across years.
// e.g. Jan 2025 + Jan 2026 → one "Jan" data point.
// Max 12 output points; only months with data are included.

const MONTH_LABELS      = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL_NAMES  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface MonthlyPoint {
  label: string;
  tooltipLabel: string;
  [key: string]: string | number;
}

function aggregateDailyToMonthly<T extends { date: string }>(
  data: T[],
  valueKey: keyof T & string,
): MonthlyPoint[] {
  if (data.length === 0) return [];

  // Sum by month-of-year index (0=Jan…11=Dec), collapsing all years into one
  const totals = new Array<number>(12).fill(0);
  const hasData = new Array<boolean>(12).fill(false);
  data.forEach((p) => {
    const i = new Date(String(p.date)).getMonth(); // 0–11
    totals[i] += Number(p[valueKey]);
    hasData[i] = true;
  });

  // Return calendar-ordered months that have at least one data point
  return MONTH_LABELS
    .map((label, i) => ({ label, tooltipLabel: MONTH_FULL_NAMES[i], [valueKey]: totals[i] }))
    .filter((_, i) => hasData[i]);
}

// ── Chart-as-filter active badge ──────────────────────────────────────────────

interface ActiveFilter { label: string; value: string; onClear: () => void }

function ChartFilterBadges({ filters, onClearAll }: { filters: ActiveFilter[]; onClearAll: () => void }): React.ReactElement | null {
  if (filters.length === 0) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap py-1">
      <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">Chart filter:</span>
      {filters.map((f) => (
        <button
          key={f.label}
          onClick={f.onClear}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 dark:bg-blue-900/40 text-primary dark:text-blue-300 text-xs font-semibold border border-primary/20 dark:border-blue-800/50 hover:bg-primary/20 transition-colors"
        >
          {f.label}: {f.value}
          <XMarkIcon className="size-3" />
        </button>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors underline underline-offset-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// ── Basic: transaction log (uses filtered hook for period-filter support) ─────

interface BasicDetailTableProps {
  categoryFilters: string[];
  paymentFilters: string[];
  productFilters: string[];
}

function BasicDetailTable({ categoryFilters, paymentFilters, productFilters }: BasicDetailTableProps): React.ReactElement {
  const { page_1 } = useFilteredData();
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  // Sort rows by date descending; then apply chart-level + FilterPane filters
  const rows = useMemo(() => {
    let r = [...page_1.detail_table].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (categoryFilters.length > 0) r = r.filter((row) => categoryFilters.includes(row.category));
    if (paymentFilters.length > 0)  r = r.filter((row) => paymentFilters.includes(row.payment_method));
    if (productFilters.length > 0)  r = r.filter((row) => productFilters.includes(row.product));
    return r;
  }, [page_1.detail_table, categoryFilters, paymentFilters, productFilters]);
  // Reset to page 0 whenever filters change
  React.useEffect(() => { setPage(0); }, [categoryFilters, paymentFilters, productFilters]);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Transaction Log</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
          {rows.length} rows
          {(categoryFilters.length > 0 || paymentFilters.length > 0 || productFilters.length > 0) ? " · filtered" : " · all transactions"}
        </p>
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
              <tr key={i} className={cn("relative border-b border-gray-50 dark:border-slate-800 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 hover:scale-[1.01] hover:z-10 transition-all duration-150", i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/40 dark:bg-slate-800/30")}>
                <td className="px-4 py-2.5 text-gray-400 dark:text-slate-500 whitespace-nowrap tabular-nums">{fmtTableDate(row.date)}</td>
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
            <button disabled={page === totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white disabled:opacity-40 hover:opacity-90 active:scale-[0.97] transition-all font-medium">Next</button>
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
  const { page_1 } = useFilteredData();

  // ── Chart-as-filter state — multi-select arrays (chart click + FilterPane both drive these) ────
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [paymentFilters,  setPaymentFilters]  = useState<string[]>([]);
  const [productFilters,  setProductFilters]  = useState<string[]>([]);

  const toggleCategory = (cat: string): void =>
    setCategoryFilters((prev) => prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat]);
  const togglePayment = (method: string): void =>
    setPaymentFilters((prev) => prev.includes(method) ? prev.filter((x) => x !== method) : [...prev, method]);
  const toggleProduct = (v: string): void =>
    setProductFilters((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  // Distinct options derived from (date-filtered) transaction rows
  const productOptions = useMemo(
    () => [...new Set(page_1.detail_table.map((r) => r.product))].sort(),
    [page_1.detail_table]
  );
  const categoryOptions = useMemo(
    () => [...new Set(page_1.detail_table.map((r) => r.category))].sort(),
    [page_1.detail_table]
  );
  const paymentOptions = useMemo(
    () => [...new Set(page_1.detail_table.map((r) => r.payment_method))].filter(Boolean).sort(),
    [page_1.detail_table]
  );

  // Register all three filters with the global FilterPane
  useRegisterPageFilters([
    {
      id: "product",
      label: "Product",
      options: productOptions,
      selected: productFilters,
      onToggle: toggleProduct,
      onClearAll: () => setProductFilters([]),
    },
    {
      id: "category",
      label: "Category",
      options: categoryOptions,
      selected: categoryFilters,
      onToggle: toggleCategory,
      onClearAll: () => setCategoryFilters([]),
    },
    {
      id: "payment",
      label: "Payment Method",
      options: paymentOptions,
      selected: paymentFilters,
      onToggle: togglePayment,
      onClearAll: () => setPaymentFilters([]),
    },
  ]);

  const clearAll = (): void => {
    setCategoryFilters([]);
    setPaymentFilters([]);
    setProductFilters([]);
  };

  // Each selected item gets its own badge in the chart-filter strip
  const activeFilters: ActiveFilter[] = [
    ...categoryFilters.map((cat) => ({ label: "Category", value: cat, onClear: () => setCategoryFilters((p) => p.filter((x) => x !== cat)) })),
    ...paymentFilters.map((pm)  => ({ label: "Payment",  value: pm,  onClear: () => setPaymentFilters((p) => p.filter((x) => x !== pm))  })),
  ];

  // ── Apply content filters to the (already date-filtered) transaction rows ──
  // filteredRows drives ALL four charts when any filter is active.
  const filteredRows = useMemo(() => {
    let r = page_1.detail_table;
    if (categoryFilters.length > 0) r = r.filter((row) => categoryFilters.includes(row.category));
    if (paymentFilters.length > 0)  r = r.filter((row) => paymentFilters.includes(row.payment_method));
    if (productFilters.length > 0)  r = r.filter((row) => productFilters.includes(row.product));
    return r;
  }, [page_1.detail_table, categoryFilters, paymentFilters, productFilters]);

  const hasContentFilter = categoryFilters.length > 0 || paymentFilters.length > 0 || productFilters.length > 0;

  const displayKpis = useMemo(() => {
    if (!hasContentFilter) return kpis;
    const totalSales = filteredRows.reduce((sum, row) => sum + row.total_sales_auto, 0);
    const totalProfit = filteredRows.reduce((sum, row) => sum + row.profit_auto, 0);
    const unitsSold = filteredRows.reduce((sum, row) => sum + row.quantity, 0);
    const totalTransactions = filteredRows.length;
    const transferCount = filteredRows.filter((row) =>
      row.payment_method.toLowerCase().includes("transfer"),
    ).length;
    return {
      total_sales: totalSales,
      total_profit: totalProfit,
      total_cost: totalSales - totalProfit,
      units_sold: unitsSold,
      average_selling_price: unitsSold > 0 ? totalSales / unitsSold : 0,
      total_transactions: totalTransactions,
      transfer_rate: totalTransactions > 0 ? transferCount / totalTransactions : 0,
    };
  }, [filteredRows, hasContentFilter, kpis]);

  // ── Monthly sales trend — always derive from already date-filtered rows ─
  const monthlySales = useMemo(() => {
    return aggregateDailyToMonthly(filteredRows.map((r) => ({ date: r.date, sales: r.total_sales_auto })), "sales");
  }, [filteredRows]);

  // ── Monthly profit trend — always derive from already date-filtered rows ─
  const monthlyProfit = useMemo(() => {
    return aggregateDailyToMonthly(filteredRows.map((r) => ({ date: r.date, profit: r.profit_auto })), "profit");
  }, [filteredRows]);

  // ── Category quantity chart — re-aggregate from filteredRows when filter active ─
  const quantityByCategory = useMemo(() => {
    // Always derive from row-level data so categories present in transactions
    // (e.g. "Small Chops") are never dropped by stale pre-aggregated payloads.
    const sourceRows = hasContentFilter ? filteredRows : page_1.detail_table;
    const totals: Record<string, number> = {};
    sourceRows.forEach((r) => { totals[r.category] = (totals[r.category] ?? 0) + r.quantity; });
    return Object.entries(totals)
      .map(([category, quantity]) => ({ category, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredRows, hasContentFilter, page_1.detail_table]);

  // ── Payment distribution — always derive from already date-filtered rows ─
  const paymentDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRows.forEach((r) => { counts[r.payment_method] = (counts[r.payment_method] ?? 0) + 1; });
    return Object.entries(counts)
      .map(([payment_method, transactions]) => ({ payment_method, transactions }))
      .sort((a, b) => b.transactions - a.transactions);
  }, [filteredRows]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <KpiCard label="Total Sales"   value={formatNaira(displayKpis.total_sales)}               tooltip="Total money brought in from all sales." accent="blue" />
        <KpiCard label="Total Profit"  value={formatNaira(displayKpis.total_profit)}              tooltip="What you kept after paying for stock." accent="blue" />
        <KpiCard label="Total Cost"    value={formatNaira(displayKpis.total_cost)}                tooltip="How much you spent buying the goods you sold." />
        <KpiCard label="Units Sold"    value={displayKpis.units_sold.toLocaleString()}            tooltip="Total number of individual items sold." />
        <KpiCard label="Avg. Price"    value={formatNaira(displayKpis.average_selling_price)}     tooltip="On average, how much each unit sold for." />
        <KpiCard label="Transactions"  value={displayKpis.total_transactions.toLocaleString()}    tooltip="How many separate sales were made." />
        <KpiCard label="Transfer Rate" value={`${(displayKpis.transfer_rate * 100).toFixed(0)}%`} tooltip="Share of customers who paid by bank transfer." />
      </div>

      <ChartFilterBadges filters={activeFilters} onClearAll={clearAll} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        {/* Sales trend — aggregated monthly totals */}
        <ChartCard
          title="How did your sales grow?"
          subtitle="Sales Trend"
          tooltip="Shows total money brought in each month. Peaks mean you had a strong month. A rising trend overall is what you want."
          focusable
          focusContent={
            <ResponsiveContainer width="100%" height={500}>
              <AreaChart data={monthlySales} margin={{ top: 28, right: 16, left: 0, bottom: 0 }}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatNaira} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} width={62} />
                <Tooltip
                  content={<DashTooltip valueFormatter={formatNaira} />}
                  labelFormatter={(_, payload) => (payload?.[0]?.payload as MonthlyPoint | undefined)?.tooltipLabel ?? ""}
                />
                <Area type="monotone" dataKey="sales" stroke={CHART_PRIMARY_VAR} strokeWidth={2.5} fill={`url(#${GRAD.blueArea})`} dot={{ r: 4, fill: CHART_PRIMARY_VAR, strokeWidth: 0 }} name="Sales">
                  <LabelList dataKey="sales" position="top" formatter={(v: unknown) => formatNaira(Number(v))} style={{ fontSize: 9, fontWeight: 600 }} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          }
        >
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlySales} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} width={62} />
              <Tooltip
                content={<DashTooltip valueFormatter={formatNaira} />}
                labelFormatter={(_, payload) => (payload?.[0]?.payload as MonthlyPoint | undefined)?.tooltipLabel ?? ""}
              />
              <Area type="monotone" dataKey="sales" stroke={CHART_PRIMARY_VAR} strokeWidth={2.5} fill={`url(#${GRAD.blueArea})`} dot={false} name="Sales" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Profit trend — aggregated monthly totals */}
        <ChartCard
          title="How did profit move over time?"
          subtitle="Profit Trend"
          tooltip="Profit is what you keep after paying for your stock. A rising line here means your business is becoming more efficient."
          focusable
          focusContent={
            <ResponsiveContainer width="100%" height={500}>
              <AreaChart data={monthlyProfit} margin={{ top: 28, right: 16, left: 0, bottom: 0 }}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatNaira} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} width={62} />
                <Tooltip
                  content={<DashTooltip valueFormatter={formatNaira} />}
                  labelFormatter={(_, payload) => (payload?.[0]?.payload as MonthlyPoint | undefined)?.tooltipLabel ?? ""}
                />
                <Area type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={2.5} fill={`url(#${GRAD.greenArea})`} dot={{ r: 4, fill: "#34d399", strokeWidth: 0 }} name="Profit" activeDot={{ r: 5, fill: "#34d399", stroke: "#fff", strokeWidth: 2 }}>
                  <LabelList dataKey="profit" position="top" formatter={(v: unknown) => formatNaira(Number(v))} style={{ fontSize: 9, fontWeight: 600 }} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          }
        >
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyProfit} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} width={62} />
              <Tooltip
                content={<DashTooltip valueFormatter={formatNaira} />}
                labelFormatter={(_, payload) => (payload?.[0]?.payload as MonthlyPoint | undefined)?.tooltipLabel ?? ""}
              />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fill={`url(#${GRAD.greenArea})`} dot={false} name="Profit" activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category bar — CLICKABLE: also acts as filter (updates quantityByCategory via filteredRows) */}
        <ChartCard
          title="Which categories moved the most units?"
          subtitle="Volume by Category"
          tooltip="Click a bar to filter all charts and the transaction log. Longer bar = more units sold in that category."
          focusable
          focusContent={
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={quantityByCategory} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }}>
                <GradDefs />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<DashTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="quantity" radius={[0, 6, 6, 0]} name="Units">
                  {quantityByCategory.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLOURS.primaryMid}
                      opacity={categoryFilters.length === 0 || categoryFilters.includes(entry.category) ? 1 : 0.3}
                    />
                  ))}
                  <LabelList dataKey="quantity" position="right" style={{ fontSize: 10, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          }
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={quantityByCategory} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <GradDefs />
              <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={TICK} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<DashTooltip />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="quantity" radius={[0, 6, 6, 0]} name="Units" cursor="pointer">
                {quantityByCategory.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLOURS.primaryMid}
                    opacity={categoryFilters.length === 0 || categoryFilters.includes(entry.category) ? 1 : 0.2}
                    stroke={categoryFilters.includes(entry.category) ? CHART_COLOURS.primary : "none"}
                    strokeWidth={categoryFilters.includes(entry.category) ? 2 : 0}
                    onClick={() => entry.category ? toggleCategory(entry.category) : undefined}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {categoryFilters.length > 0 && (
            <p className="text-[10px] text-primary dark:text-blue-400 font-semibold mt-1 px-1">
              Showing: {categoryFilters.join(", ")} · <button onClick={() => setCategoryFilters([])} className="underline underline-offset-1">clear</button>
            </p>
          )}
        </ChartCard>

        {/* Payment method pie — CLICKABLE: also filters all charts via filteredRows */}
        <ChartCard
          title="How do your customers prefer to pay?"
          subtitle="Payment Method Breakdown"
          tooltip="Click a segment to filter all charts and the transaction log by payment method."
          focusable
          focusContent={
            <div className="flex flex-col items-center gap-6 py-4">
              {/* Big centred pie with inline percentage + count labels */}
              <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                  <Pie
                    data={paymentDist}
                    dataKey="transactions"
                    nameKey="payment_method"
                    cx="50%"
                    cy="50%"
                    innerRadius={88}
                    outerRadius={140}
                    paddingAngle={3}
                    label={({ name, value, percent }: { name?: string; value?: number; percent?: number }) =>
                      `${name ?? ""}: ${((percent ?? 0) * 100).toFixed(0)}% (${value ?? 0})`
                    }
                    labelLine={{ stroke: "rgba(255,255,255,0.3)", strokeWidth: 1 }}
                  >
                    {paymentDist.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLOURS[i % DONUT_COLOURS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DashTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          }
        >
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={paymentDist}
                  dataKey="transactions"
                  nameKey="payment_method"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={3}
                  cursor="pointer"
                >
                  {paymentDist.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={DONUT_COLOURS[i % DONUT_COLOURS.length]}
                      opacity={paymentFilters.length === 0 || paymentFilters.includes(entry.payment_method) ? 1 : 0.2}
                      stroke={paymentFilters.includes(entry.payment_method) ? "#001BB7" : "none"}
                      strokeWidth={paymentFilters.includes(entry.payment_method) ? 3 : 0}
                      onClick={() => entry.payment_method ? togglePayment(entry.payment_method) : undefined}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DashTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2.5">
              {paymentDist.map((item, i) => (
                <button
                  key={item.payment_method}
                  onClick={() => togglePayment(item.payment_method)}
                  className={cn(
                    "flex items-center gap-2 text-xs w-full text-left rounded-lg px-1.5 py-1 transition-all",
                    paymentFilters.includes(item.payment_method)
                      ? "bg-primary/10 dark:bg-blue-900/40"
                      : "hover:bg-gray-50 dark:hover:bg-slate-800",
                    paymentFilters.length > 0 && !paymentFilters.includes(item.payment_method) && "opacity-30",
                  )}
                >
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLOURS[i % DONUT_COLOURS.length] }} />
                  <span className="text-gray-600 dark:text-slate-300 capitalize">{item.payment_method}</span>
                  <span className="ml-auto font-bold text-gray-800 dark:text-slate-200 tabular-nums">{item.transactions}</span>
                </button>
              ))}
            </div>
          </div>
          {paymentFilters.length > 0 && (
            <p className="text-[10px] text-primary dark:text-blue-400 font-semibold mt-1 px-1">
              Showing: {paymentFilters.join(", ")} · <button onClick={() => setPaymentFilters([])} className="underline underline-offset-1">clear</button>
            </p>
          )}
        </ChartCard>
      </div>
      <BasicDetailTable categoryFilters={categoryFilters} paymentFilters={paymentFilters} productFilters={productFilters} />
    </>
  );
}

function IntContent({ data }: { data: IntermediateAnalysisResult["page_1"] }): React.ReactElement {
  const { kpis, charts } = data;
  const { filterYears, filterMonths } = useDashboardStore();

  // ── Date filter (global) — applied to monthly trend arrays ───────────────
  const salesTrend  = filterMonthlyTrend(charts.sales_trend,  filterYears, filterMonths);
  const profitTrend = filterMonthlyTrend(charts.profit_trend, filterYears, filterMonths);

  // ── Content filters (page-local multi-select) ────────────────────────────
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [staffFilters,    setStaffFilters]    = useState<string[]>([]);
  const [paymentFilters,  setPaymentFilters]  = useState<string[]>([]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (v: string) => setter((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const clearAll = (): void => {
    setCategoryFilters([]);
    setStaffFilters([]);
    setPaymentFilters([]);
  };

  // Filter chart arrays: empty selection = show all; selection = show only matching
  const visibleCategories = categoryFilters.length > 0
    ? charts.revenue_by_category.filter((d) => categoryFilters.includes(d.category))
    : charts.revenue_by_category;

  const visibleStaff = staffFilters.length > 0
    ? charts.staff_performance.filter((d) => staffFilters.includes(d.name))
    : charts.staff_performance;

  const visiblePayments = paymentFilters.length > 0
    ? charts.payment_method_distribution.filter((d) => paymentFilters.includes(d.method))
    : charts.payment_method_distribution;

  // Options for the filter dropdowns (derived from chart data)
  const categoryOptions = charts.revenue_by_category.map((d) => d.category);
  const staffOptions    = charts.staff_performance.map((d) => d.name);
  const paymentOptions  = charts.payment_method_distribution.map((d) => d.method);

  // Register content filters with the global FilterPane
  useRegisterPageFilters([
    {
      id: "category",
      label: "Category",
      options: categoryOptions,
      selected: categoryFilters,
      onToggle: toggle(setCategoryFilters),
      onClearAll: () => setCategoryFilters([]),
    },
    {
      id: "staff",
      label: "Staff",
      options: staffOptions,
      selected: staffFilters,
      onToggle: toggle(setStaffFilters),
      onClearAll: () => setStaffFilters([]),
    },
    {
      id: "payment",
      label: "Payment Method",
      options: paymentOptions,
      selected: paymentFilters,
      onToggle: toggle(setPaymentFilters),
      onClearAll: () => setPaymentFilters([]),
    },
  ]);

  // Active filter badges — one per selected value, shown below KPIs
  const activeFilters: ActiveFilter[] = [
    ...categoryFilters.map((cat) => ({ label: "Category", value: cat, onClear: () => setCategoryFilters((p) => p.filter((x) => x !== cat)) })),
    ...paymentFilters.map((pm)  => ({ label: "Payment",  value: pm,  onClear: () => setPaymentFilters((p) => p.filter((x) => x !== pm))  })),
    ...staffFilters.map((s)     => ({ label: "Staff",    value: s,   onClear: () => setStaffFilters((p) => p.filter((x) => x !== s))    })),
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Sales"     value={formatNaira(kpis.total_sales)}     tooltip="Total money brought in from all sales." accent="blue" />
        <KpiCard label="Gross Profit"    value={formatNaira(kpis.gross_profit)}    tooltip="Sales minus cost of goods." accent={kpis.gross_profit > 0 ? "blue" : "red"} />
        <KpiCard label="Profit Margin"   value={`${kpis.profit_margin}%`}          tooltip="What percentage of sales you keep as profit." accent={kpis.profit_margin > 15 ? "green" : "amber"} />
        <KpiCard label="Order Count"     value={kpis.order_count.toLocaleString()} tooltip="Number of orders placed in this period." />
        <KpiCard label="Avg Order Value" value={formatNaira(kpis.aov)}             tooltip="Average revenue per order." />
      </div>

      <ChartFilterBadges filters={activeFilters} onClearAll={clearAll} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        <ChartCard title="How did your sales grow month by month?" subtitle="Sales Trend" tooltip="Shows how much money came in from sales each month. A rising trend overall is what you want.">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={salesTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} width={62} />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              <Area type="monotone" dataKey="sales" stroke={CHART_PRIMARY_VAR} strokeWidth={2.5} fill={`url(#${GRAD.blueArea})`} dot={false} name="Sales" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="How did profit move each month?" subtitle="Profit Trend" tooltip="Profit is what you keep after paying for stock. A rising line means your business is becoming more efficient month on month.">
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

        {/* Category bar — CLICKABLE: click a bar to highlight/filter, others dim to 20% */}
        <ChartCard
          title="Revenue by category"
          subtitle="Category Breakdown"
          tooltip="Click a bar to highlight that category and dim the rest. Click again to deselect."
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.revenue_by_category} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <GradDefs />
              <XAxis type="number" tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={TICK} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]} name="Revenue" cursor="pointer">
                {charts.revenue_by_category.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={`url(#${GRAD.blueH})`}
                    opacity={categoryFilters.length === 0 || categoryFilters.includes(entry.category) ? 1 : 0.2}
                    stroke={categoryFilters.includes(entry.category) ? CHART_COLOURS.primary : "none"}
                    strokeWidth={categoryFilters.includes(entry.category) ? 2 : 0}
                    onClick={() => toggle(setCategoryFilters)(entry.category)}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {categoryFilters.length > 0 && (
            <p className="text-[11px] text-primary dark:text-blue-400 font-semibold mt-1 px-1">
              Showing: {categoryFilters.join(", ")} · <button onClick={() => setCategoryFilters([])} className="underline underline-offset-1">clear</button>
            </p>
          )}
        </ChartCard>

        {/* Payment pie — CLICKABLE: click segment or legend row to filter */}
        <ChartCard
          title="How do customers prefer to pay?"
          subtitle="Payment Methods"
          tooltip="Click a segment or a row in the legend to filter by payment method. Click again to deselect."
        >
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={charts.payment_method_distribution}
                  dataKey="revenue"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={3}
                  cursor="pointer"
                >
                  {charts.payment_method_distribution.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={DONUT_COLOURS[i % DONUT_COLOURS.length]}
                      opacity={paymentFilters.length === 0 || paymentFilters.includes(entry.method) ? 1 : 0.2}
                      stroke={paymentFilters.includes(entry.method) ? "#001BB7" : "none"}
                      strokeWidth={paymentFilters.includes(entry.method) ? 3 : 0}
                      onClick={() => toggle(setPaymentFilters)(entry.method)}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2.5">
              {charts.payment_method_distribution.map((item, i) => (
                <button
                  key={item.method}
                  onClick={() => toggle(setPaymentFilters)(item.method)}
                  className={cn(
                    "flex items-center gap-2 text-xs w-full text-left rounded-lg px-1.5 py-1 transition-all",
                    paymentFilters.includes(item.method)
                      ? "bg-primary/10 dark:bg-blue-900/40"
                      : "hover:bg-gray-50 dark:hover:bg-slate-800",
                    paymentFilters.length > 0 && !paymentFilters.includes(item.method) && "opacity-30",
                  )}
                >
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLOURS[i % DONUT_COLOURS.length] }} />
                  <span className="text-gray-600 dark:text-slate-300 capitalize">{item.method}</span>
                  <span className="ml-auto font-bold text-gray-800 dark:text-slate-200 tabular-nums">{formatNaira(item.revenue)}</span>
                </button>
              ))}
            </div>
          </div>
          {paymentFilters.length > 0 && (
            <p className="text-[11px] text-primary dark:text-blue-400 font-semibold mt-1 px-1">
              Showing: {paymentFilters.join(", ")} · <button onClick={() => setPaymentFilters([])} className="underline underline-offset-1">clear</button>
            </p>
          )}
        </ChartCard>

        {/* Staff bar — CLICKABLE: click a bar to highlight that staff member */}
        <ChartCard
          title="Which staff brought in the most revenue?"
          subtitle="Staff Performance"
          tooltip="Click a bar to highlight that staff member and dim the rest. Click again to deselect."
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.staff_performance} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatNaira} tick={TICK} axisLine={false} tickLine={false} width={62} />
              <Tooltip content={<DashTooltip valueFormatter={formatNaira} />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} name="Revenue" cursor="pointer">
                {charts.staff_performance.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={`url(#${GRAD.blueV})`}
                    opacity={staffFilters.length === 0 || staffFilters.includes(entry.name) ? 1 : 0.2}
                    stroke={staffFilters.includes(entry.name) ? CHART_COLOURS.primary : "none"}
                    strokeWidth={staffFilters.includes(entry.name) ? 2 : 0}
                    onClick={() => toggle(setStaffFilters)(entry.name)}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {staffFilters.length > 0 && (
            <p className="text-[11px] text-primary dark:text-blue-400 font-semibold mt-1 px-1">
              Showing: {staffFilters.join(", ")} · <button onClick={() => setStaffFilters([])} className="underline underline-offset-1">clear</button>
            </p>
          )}
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
        <ChartCard title="Monthly revenue trend" subtitle="Revenue Trend" tooltip="Shows how your total revenue moved month by month. A rising curve means the business is growing.">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <GradDefs />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month_short" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fromM} tick={TICK} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<DashTooltip valueFormatter={fromM} />} />
              <Area type="monotone" dataKey="revenue" stroke={CHART_PRIMARY_VAR} strokeWidth={2.5} fill={`url(#${GRAD.blueArea})`} dot={false} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="How did profit move each month?" subtitle="Profit Trend" tooltip="Profit is what you keep after paying for stock and expenses. Rising line = the business is becoming more efficient.">
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
        <ChartCard title="Revenue by category" subtitle="Category Breakdown" tooltip="How much money each product group earned. Longer bar = more revenue from that category.">
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
        <ChartCard title="How do customers prefer to pay?" subtitle="Payment Methods" tooltip="Shows how customers are paying — cash, transfer, or card. Use this to plan how you handle money.">
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
          <ChartCard title="Where did the profit go?" subtitle="Profit Waterfall" tooltip="Starts from your gross profit and subtracts each expense. The final bar is your net profit — what the business truly kept." className="col-span-full lg:col-span-2">
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
        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Sales</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{greeting}, <EditableGreeting fallbackName={firstName} /></h1>
        <div className="flex items-center gap-2 mt-1">
          <CalendarIcon className="size-3.5 text-gray-400 dark:text-slate-500" />
          <p className="text-sm text-gray-400 dark:text-slate-500">
            {fmtDate(filteredData.metadata.date_range.start)} – {fmtDate(filteredData.metadata.date_range.end)}
            {" · "}{filteredData.metadata.record_count} transactions
          </p>
        </div>
      </div>

      {isFiltered && tierData.tier === "basic" && <FilterNotice count={filteredCount} />}

      <SectionHeader title="Key Numbers" />
      {tierData.tier === "basic"        && <BasicContent data={filteredData.page_1} />}
      {tierData.tier === "intermediate" && <IntContent   data={tierData.data} />}
      {tierData.tier === "advanced"     && <AdvContent   data={tierData.data} />}
    </div>
  );
}
