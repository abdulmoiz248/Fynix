"use client";

import { useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BadgeDollarSign, Gauge, LayoutGrid, LogOut, Repeat, Sparkles, Wallet, TrendingUp, FileText, Target, PieChart, Receipt } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart as RechartsLine,
  Pie,
 
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { dashboardQueries } from "@/lib/queries/dashboard";
import { useDashboardStore } from "@/store/dashboardStore";
import type { DashboardTab } from "@/store/dashboardStore";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const chartPalette = [
  "#7c3aed",
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#f472b6",
  "#38bdf8",
  "#c084fc",
];

function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="card-surface rounded-2xl p-5 grid-fade">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">{title}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <Sparkles className="w-4 h-4 text-slate-500" />
      </div>
      <div className="h-[220px]">{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta?: string;
  tone?: "up" | "down" | "neutral";
}) {
  const toneClass =
    tone === "up" ? "text-emerald-400" : tone === "down" ? "text-rose-400" : "text-slate-400";
  return (
    <div className="card-surface rounded-2xl p-4 flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {delta && <p className={`text-xs ${toneClass}`}>{delta}</p>}
      </div>
      <div className="rounded-full bg-slate-800/60 p-3 text-slate-200">{icon}</div>
    </div>
  );
}

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

const monthsBetween = (months: number) => {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - months + 1);
  return past.toISOString().split("T")[0];
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const {
    activeTab,
    setActiveTab,
    timeRange,
    setTimeRange,
    currency,
    setCurrency,
    density,
    setDensity,
  } = useDashboardStore();

    const [showAppsMenu, setShowAppsMenu] = useState(false);

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: dashboardQueries.transactions,
  });
  const budgetsQuery = useQuery({ queryKey: ["budgets"], queryFn: dashboardQueries.budgets });
  const recurringQuery = useQuery({
    queryKey: ["recurring"],
    queryFn: dashboardQueries.recurring,
  });
  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: dashboardQueries.invoices,
  });
  const stocksQuery = useQuery({ queryKey: ["stocks"], queryFn: dashboardQueries.stocks });
  const stockTxQuery = useQuery({
    queryKey: ["stock-transactions"],
    queryFn: dashboardQueries.stockTransactions,
  });
  const dividendsQuery = useQuery({
    queryKey: ["dividends"],
    queryFn: dashboardQueries.dividends,
  });
  const mutualFundsQuery = useQuery({
    queryKey: ["mutual-funds"],
    queryFn: dashboardQueries.mutualFunds,
  });
  const mfTxQuery = useQuery({
    queryKey: ["mutual-fund-transactions"],
    queryFn: dashboardQueries.mutualFundTransactions,
  });
  const mfHistoryQuery = useQuery({
    queryKey: ["mutual-fund-history"],
    queryFn: dashboardQueries.mutualFundHistory,
  });
  const feesQuery = useQuery({
    queryKey: ["trading-fees"],
    queryFn: dashboardQueries.tradingFees,
  });
  const cashQuery = useQuery({
    queryKey: ["cash-account"],
    queryFn: dashboardQueries.cashAccount,
  });
  const psxQuery = useQuery({ queryKey: ["psx-stocks"], queryFn: dashboardQueries.psxStocks });

    const rangeStart = useMemo(() => {
    switch (timeRange) {
      case "1m":
        return monthsBetween(1);
      case "3m":
        return monthsBetween(3);
      case "6m":
        return monthsBetween(6);
      case "1y":
        return monthsBetween(12);
      default:
        return "1970-01-01";
    }
  }, [timeRange]);


  const loading =
    transactionsQuery.isLoading ||
    budgetsQuery.isLoading ||
    recurringQuery.isLoading ||
    invoicesQuery.isLoading ||
    stocksQuery.isLoading ||
    mutualFundsQuery.isLoading ||
    feesQuery.isLoading ||
    cashQuery.isLoading;

  const chartHeight =
    density === "compact" ? 180 : density === "cozy" ? 220 : density === "spacious" ? 260 : 220;

  const transactions = transactionsQuery.data?.transactions || [];
  const budgets = budgetsQuery.data?.budgets || [];
  const spendingByCategory = budgetsQuery.data?.spendingByCategory || {};
  const recurring = recurringQuery.data?.recurringPayments || [];
  const invoices = invoicesQuery.data?.invoices || [];
  const stocks = stocksQuery.data?.stocks || [];
  const stockTransactions = stockTxQuery.data?.transactions || [];
  const dividends = dividendsQuery.data?.dividends || [];
  const mutualFunds = mutualFundsQuery.data?.funds || [];
  const mfTransactions = mfTxQuery.data?.transactions || [];
  const mfHistory = mfHistoryQuery.data?.history || [];
  const fees = feesQuery.data?.fees || [];
  const cashBalance = cashQuery.data?.cashAccount?.balance || 0;
  const psxStocks = psxQuery.data?.stocks || [];


  const filteredByRange = <T extends { date?: string; invoice_date?: string; due_date?: string }>(
    rows: T[]
  ) => {
    const start = new Date(rangeStart).getTime();
    return rows.filter((row) => {
      const d = row.date || row.invoice_date || row.due_date;
      return d ? new Date(d).getTime() >= start : true;
    });
  };

  const monthlyIncomeExpense = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    filteredByRange(transactions).forEach((t) => {
      const key = t.date?.slice(0, 7) || "unknown";
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      if (t.type === "income") map[key].income += Number(t.amount);
      else map[key].expense += Number(t.amount);
    });
    return Object.entries(map)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, v]) => ({ month, ...v, savings: v.income - v.expense }));
  }, [transactions, rangeStart]);

  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    filteredByRange(transactions)
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [transactions, rangeStart]);

  const savingsRate = useMemo(() => {
    const income = monthlyIncomeExpense.reduce((s, m) => s + m.income, 0);
    const expense = monthlyIncomeExpense.reduce((s, m) => s + m.expense, 0);
    if (!income) return 0;
    return Math.max(0, ((income - expense) / income) * 100);
  }, [monthlyIncomeExpense]);

  const budgetVsActual = useMemo(() => {
    return budgets.map((b) => ({
      category: b.category,
      budget: Number(b.budget_amount),
      spend: Number(spendingByCategory[b.category] || 0),
    }));
  }, [budgets, spendingByCategory]);

  const recurringMonthly = useMemo(() => {
    const freqToMonth = {
      daily: 30,
      weekly: 4,
      monthly: 1,
      quarterly: 1 / 3,
      yearly: 1 / 12,
    } as const;
    return recurring.reduce((sum, r) => {
      const factor = freqToMonth[r.frequency] ?? 1;
      return sum + Number(r.amount) * factor;
    }, 0);
  }, [recurring]);

  const invoiceStatusMix = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((inv) => {
      map[inv.status] = (map[inv.status] || 0) + Number(inv.total_amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [invoices]);

  const arAging = useMemo(() => {
    const buckets = [
      { name: "Current", range: [-9999, -1] },
      { name: "0-30", range: [0, 30] },
      { name: "31-60", range: [31, 60] },
      { name: "61-90", range: [61, 90] },
      { name: "90+", range: [91, 9999] },
    ];
    const today = new Date();
    const totals: Record<string, number> = {};
    invoices.forEach((inv) => {
      const due = new Date(inv.due_date);
      const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const bucket = buckets.find((b) => diff >= b.range[0] && diff <= b.range[1]);
      const key = bucket?.name || "Current";
      totals[key] = (totals[key] || 0) + Number(inv.total_amount);
    });
    return buckets.map((b) => ({ name: b.name, value: totals[b.name] || 0 }));
  }, [invoices]);

  const recurringStatus = useMemo(() => {
    const map: Record<string, number> = {};
    recurring.forEach((r) => {
      map[r.status] = (map[r.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [recurring]);

  const stockAllocation = useMemo(() => {
    const total = stocks.reduce((s, st) => s + Number(st.current_value || 0), 0);
    return stocks.map((s) => ({
      name: s.symbol,
      value: Number(s.current_value || 0),
      weight: total ? ((s.current_value || 0) / total) * 100 : 0,
    }));
  }, [stocks]);

  const sectorExposure = useMemo(() => {
    const sectorMap: Record<string, number> = {};
    stocks.forEach((s) => {
      const psx = psxStocks.find((p) => p.symbol === s.symbol);
      const sector = psx?.sector || "Other";
      sectorMap[sector] = (sectorMap[sector] || 0) + Number(s.current_value || 0);
    });
    return Object.entries(sectorMap).map(([name, value]) => ({ name, value }));
  }, [stocks, psxStocks]);

  const plTimeline = useMemo(() => {
    const sorted = [...stockTransactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );
    let cumulative = 0;
    return sorted.map((tx) => {
      const profit = Number(tx.profit_loss || 0);
      cumulative += profit;
      return {
        date: tx.transaction_date,
        profit: profit,
        cumulative,
      };
    });
  }, [stockTransactions]);

  const dividendsTimeline = useMemo(
    () =>
      dividends
        .slice()
        .sort((a, b) => new Date(a.dividend_date).getTime() - new Date(b.dividend_date).getTime())
        .map((d) => ({
          date: d.dividend_date,
          amount: Number(d.amount),
          symbol: d.symbol,
        })),
    [dividends]
  );

  const mfMix = useMemo(
    () =>
      mutualFunds.map((f) => ({
        name: f.fund_name,
        value: Number(f.current_value),
        invested: Number(f.total_invested),
        pl: Number(f.profit_loss),
      })),
    [mutualFunds]
  );

  const mfTypeMix = useMemo(() => {
    const map: Record<string, number> = {};
    mutualFunds.forEach((f) => {
      const key = f.fund_type || "Unspecified";
      map[key] = (map[key] || 0) + Number(f.current_value);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [mutualFunds]);

  const mfFlow = useMemo(() => {
    const map: Record<string, { invest: number; withdraw: number }> = {};
    mfTransactions.forEach((tx) => {
      const key = tx.transaction_date.slice(0, 7);
      if (!map[key]) map[key] = { invest: 0, withdraw: 0 };
      if (tx.transaction_type === "invest") map[key].invest += Number(tx.amount);
      else map[key].withdraw += Number(tx.amount);
    });
    return Object.entries(map)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, v]) => ({ month, ...v }));
  }, [mfTransactions]);

  const mfHistorySeries = useMemo(() => {
    return mfHistory
      .slice()
      .sort((a, b) => new Date(a.update_date).getTime() - new Date(b.update_date).getTime())
      .map((h) => ({
        date: h.update_date,
        value: Number(h.new_value),
        profit: Number(h.profit_loss),
        fund: h.fund_name,
      }));
  }, [mfHistory]);

  const feesTrend = useMemo(() => {
    const map: Record<string, { total: number; broker: number; cgt: number; other: number }> = {};
    fees.forEach((f) => {
      const key = f.fee_date.slice(0, 7);
      if (!map[key]) map[key] = { total: 0, broker: 0, cgt: 0, other: 0 };
      const amt = Number(f.amount);
      map[key].total += amt;
      if (f.fee_type === "broker_charge") map[key].broker += amt;
      else if (f.fee_type === "cgt") map[key].cgt += amt;
      else map[key].other += amt;
    });
    return Object.entries(map)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, v]) => ({ month, ...v }));
  }, [fees]);

  const feeBreakdown = useMemo(() => {
    return [
      { name: "Broker", value: feesTrend.reduce((s, m) => s + m.broker, 0) },
      { name: "CGT", value: feesTrend.reduce((s, m) => s + m.cgt, 0) },
      { name: "Other", value: feesTrend.reduce((s, m) => s + m.other, 0) },
    ];
  }, [feesTrend]);

  const cashVsInvestments = useMemo(() => {
    const invested =
      stocks.reduce((s, st) => s + Number(st.current_value || 0), 0) +
      mutualFunds.reduce((s, f) => s + Number(f.current_value || 0), 0);
    return [
      { name: "Cash", value: cashBalance },
      { name: "Investments", value: invested },
    ];
  }, [cashBalance, stocks, mutualFunds]);

  const netWorth = useMemo(
    () =>
      cashVsInvestments.reduce((s, row) => s + row.value, 0) -
      fees.reduce((s, f) => s + Number(f.amount), 0),
    [cashVsInvestments, fees]
  );

  const recurringByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    recurring.forEach((r) => {
      map[r.category] = (map[r.category] || 0) + Number(r.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [recurring]);

  const recurringByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    recurring.forEach((r) => {
      const key = r.next_payment_date.slice(0, 7);
      map[key] = (map[key] || 0) + Number(r.amount);
    });
    return Object.entries(map)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, value]) => ({ month, value }));
  }, [recurring]);

  const invoiceByMonth = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    invoices.forEach((inv) => {
      const key = inv.invoice_date.slice(0, 7);
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      map[key][inv.type === "income" ? "income" : "expense"] += Number(inv.total_amount);
    });
    return Object.entries(map)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, v]) => ({ month, ...v }));
  }, [invoices]);

  const topClients = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((inv) => {
      map[inv.client_name] = (map[inv.client_name] || 0) + Number(inv.total_amount);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [invoices]);

  const transactionTreemap = useMemo(
    () =>
      categorySpend.map((c) => ({
        name: c.name,
        size: c.value,
      })),
    [categorySpend]
  );

  const largestTransactions = useMemo(
    () =>
      transactions
        .slice()
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 12)
        .map((t) => ({ name: `${t.category}`, value: Number(t.amount), type: t.type })),
    [transactions]
  );

  const invoiceDiscountEffect = useMemo(() => {
    return invoices.map((inv) => ({
      invoice: inv.invoice_number,
      subtotal: Number(inv.subtotal),
      discount: Number(inv.discount_amount),
      tax: Number(inv.tax_amount),
    }));
  }, [invoices]);

  const commonTabs: Array<{ id: DashboardTab; label: string }> = [
    { id: "overview", label: "Common Overview" },
    { id: "cash", label: "Cash & Budgets" },
    { id: "recurring", label: "Recurring" },
    { id: "invoices", label: "Invoices" },
    { id: "stocks", label: "Stocks & PSX" },
    { id: "mutual", label: "Mutual Funds" },
    { id: "fees", label: "Fees" },
    { id: "transactions", label: "Transactions" },
  ];

  const moneyFormatter = (value: unknown) =>
    formatCurrency(Number(typeof value === "number" ? value : value ?? 0), currency);
  const tooltipFmt = (value: unknown) => moneyFormatter(value);


   if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Syncing your financial data…</p>
        </div>
      </div>
    );
  }


  if (status === "unauthenticated") {
    redirect("/signup");
  }
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-black/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fynix AI</p>
            <h1 className="text-3xl font-semibold flex items-center gap-2">
              <span className="bg-linear-to-r from-indigo-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                Intelligence Hub
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Connected as {session?.user?.email ?? "Anonymous"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowAppsMenu(!showAppsMenu)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:border-indigo-500/60 flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                All Apps
              </button>
              {showAppsMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowAppsMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2">
                      <Link
                        href="/dashboard/transactions"
                        onClick={() => setShowAppsMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                      >
                        <Receipt className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="font-medium">Transactions</p>
                          <p className="text-xs text-slate-400">Income & Expenses</p>
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/budget"
                        onClick={() => setShowAppsMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                      >
                        <Target className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="font-medium">Budget</p>
                          <p className="text-xs text-slate-400">Track spending</p>
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/invoices"
                        onClick={() => setShowAppsMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                      >
                        <BadgeDollarSign className="w-5 h-5 text-orange-400" />
                        <div>
                          <p className="font-medium">Invoices</p>
                          <p className="text-xs text-slate-400">Billing management</p>
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/stocks"
                        onClick={() => setShowAppsMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                      >
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="font-medium">Stocks</p>
                          <p className="text-xs text-slate-400">Portfolio & PSX</p>
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/mutualfunds"
                        onClick={() => setShowAppsMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                      >
                        <PieChart className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="font-medium">Mutual Funds</p>
                          <p className="text-xs text-slate-400">Investments</p>
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/books"
                        onClick={() => setShowAppsMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                      >
                        <FileText className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="font-medium">Books</p>
                          <p className="text-xs text-slate-400">Accounting reports</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-400/60 text-slate-200 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="glass-panel rounded-2xl p-6 border border-slate-800/60">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div>
              <p className="text-sm text-slate-400">Control Center</p>
              <h2 className="text-xl font-semibold">Analytics Filters</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                <option value="1m">Last 1m</option>
                <option value="3m">Last 3m</option>
                <option value="6m">Last 6m</option>
                <option value="1y">Last 1y</option>
                <option value="all">All</option>
              </select>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
              </select>
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                <option value="compact">Compact</option>
                <option value="cozy">Cozy</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {commonTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-sm border transition ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-white bg-indigo-500/10"
                    : "border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="card-surface rounded-2xl p-12 text-center">
            <div className="animate-pulse text-slate-500">Building 30+ insights…</div>
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <section className="space-y-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <StatCard
                    label="Net Worth"
                    value={formatCurrency(netWorth, currency)}
                    delta={`Cash ${formatCurrency(cashBalance, currency)}`}
                    icon={<Wallet className="w-5 h-5" />}
                  />
                  <StatCard
                    label="Monthly Recurring"
                    value={formatCurrency(recurringMonthly, currency)}
                    delta="Approx monthly burn"
                    tone="down"
                    icon={<Repeat className="w-5 h-5" />}
                  />
                  <StatCard
                    label="Savings Rate"
                    value={`${savingsRate.toFixed(1)}%`}
                    delta="Income vs expense"
                    tone={savingsRate >= 20 ? "up" : "down"}
                    icon={<Gauge className="w-5 h-5" />}
                  />
                  <StatCard
                    label="Invoice Open"
                    value={formatCurrency(
                      invoices.reduce(
                        (s, inv) => (inv.status !== "paid" ? s + Number(inv.total_amount) : s),
                        0
                      ),
                      currency
                    )}
                    delta={`${invoiceStatusMix.length} statuses`}
                    icon={<BadgeDollarSign className="w-5 h-5" />}
                  />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                  <ChartCard title="Net Worth Composition">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <PieChart>
                        <Pie data={cashVsInvestments} dataKey="value" nameKey="name" outerRadius="80%">
                          {cashVsInvestments.map((_, idx) => (
                            <Cell key={idx} fill={chartPalette[idx % chartPalette.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={tooltipFmt} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Income vs Expense Trend">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <ComposedChart data={monthlyIncomeExpense}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Legend />
                        <Bar dataKey="income" fill="#22c55e" />
                        <Bar dataKey="expense" fill="#ef4444" />
                        <Line type="monotone" dataKey="savings" stroke="#0ea5e9" strokeWidth={2} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Category Spend">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <Treemap
                        data={transactionTreemap}
                        dataKey="size"
                        nameKey="name"
                        stroke="#0b0b0b"
                        fill="#7c3aed"
                      />
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Savings Gauge">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <RadialBarChart
                        innerRadius="40%"
                        outerRadius="90%"
                        data={[
                          { name: "Savings", value: Math.min(100, savingsRate), fill: "#22c55e" },
                          { name: "Gap", value: Math.max(0, 100 - savingsRate), fill: "#1f2937" },
                        ]}
                        startAngle={180}
                        endAngle={0}
                      >
                        <RadialBar dataKey="value" />
                        <Legend />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Invoice Status Mix">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <PieChart>
                        <Pie dataKey="value" data={invoiceStatusMix} outerRadius="80%" label>
                          {invoiceStatusMix.map((_, idx) => (
                            <Cell key={idx} fill={chartPalette[idx % chartPalette.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={tooltipFmt} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Recurring Burn Down">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <AreaChart data={recurringByMonth}>
                        <defs>
                          <linearGradient id="burn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Area type="monotone" dataKey="value" stroke="#ef4444" fillOpacity={1} fill="url(#burn)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Portfolio Allocation">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={stockAllocation}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Bar dataKey="value" fill="#7c3aed">
                          {stockAllocation.map((_, idx) => (
                            <Cell key={idx} fill={chartPalette[idx % chartPalette.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Cash vs Investments">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <ComposedChart data={cashVsInvestments}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Bar dataKey="value" fill="#0ea5e9" />
                        <Line dataKey="value" stroke="#22c55e" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </section>
            )}

            {activeTab === "cash" && (
              <section className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                  <ChartCard title="Budget vs Actual">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={budgetVsActual}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Legend />
                        <Bar dataKey="budget" fill="#0ea5e9" />
                        <Bar dataKey="spend" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Monthly Burn Rate (Expenses)">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <AreaChart data={monthlyIncomeExpense}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Over-Budget Categories">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart
                        data={budgetVsActual.filter((b) => b.spend > b.budget)}
                        layout="vertical"
                        margin={{ left: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis type="number" />
                        <YAxis dataKey="category" type="category" />
                        <Tooltip formatter={tooltipFmt} />
                        <Bar dataKey="spend" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Cash Runway vs Recurring">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart
                        data={[
                          {
                            label: "Runway (months)",
                            value: recurringMonthly ? cashBalance / recurringMonthly : 0,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Category Heatmap (Spend)">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="value" name="Spend" />
                        <YAxis dataKey="name" name="Category" type="category" />
                        <Tooltip formatter={tooltipFmt} />
                        <Scatter data={categorySpend} fill="#7c3aed" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </section>
            )}

            {activeTab === "recurring" && (
              <section className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                  <ChartCard title="Recurring Timeline">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <AreaChart data={recurringByMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Status Breakdown">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <PieChart>
                        <Pie dataKey="value" data={recurringStatus} outerRadius="80%" label>
                          {recurringStatus.map((_, idx) => (
                            <Cell key={idx} fill={chartPalette[idx % chartPalette.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Category Share">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={recurringByCategory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Bar dataKey="value" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Next Payment Countdown">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart
                        data={recurring.map((r) => ({
                          name: r.name,
                          days: Math.max(
                            0,
                            Math.floor(
                              (new Date(r.next_payment_date).getTime() - new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          ),
                        }))}
                        layout="vertical"
                        margin={{ left: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="days" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </section>
            )}

            {activeTab === "invoices" && (
              <section className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                  <ChartCard title="AR / AP Aging">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={arAging}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Bar dataKey="value" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Invoice Over Time">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <ComposedChart data={invoiceByMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Legend />
                        <Area type="monotone" dataKey="income" fill="#22c55e" stroke="#22c55e" />
                        <Area type="monotone" dataKey="expense" fill="#ef4444" stroke="#ef4444" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Top Clients">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={topClients} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip formatter={tooltipFmt} />
                        <Bar dataKey="value" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Tax / Discount Impact">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <ComposedChart data={invoiceDiscountEffect}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="invoice" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Legend />
                        <Bar dataKey="discount" fill="#f472b6" />
                        <Bar dataKey="tax" fill="#22c55e" />
                        <Line dataKey="subtotal" stroke="#7c3aed" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </section>
            )}

            {activeTab === "stocks" && (
              <section className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                  <ChartCard title="Holdings Allocation">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <PieChart>
                        <Pie data={stockAllocation} dataKey="value" outerRadius="80%" label>
                          {stockAllocation.map((_, idx) => (
                            <Cell key={idx} fill={chartPalette[idx % chartPalette.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={tooltipFmt} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="P/L Timeline (Realized)">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <AreaChart data={plTimeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Area type="monotone" dataKey="cumulative" stroke="#22c55e" fillOpacity={0.2} fill="#22c55e" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Dividend Timeline">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={dividendsTimeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Bar dataKey="amount" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Sector Exposure">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={sectorExposure} layout="vertical" margin={{ left: 100 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip formatter={tooltipFmt} />
                        <Bar dataKey="value" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Realized vs Unrealized">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <ComposedChart
                        data={[
                          {
                            type: "Realized",
                            value: plTimeline.reduce((s, p) => s + p.profit, 0),
                          },
                          {
                            type: "Unrealized",
                            value: stockAllocation.reduce((s, s1) => s + s1.value, 0),
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Bar dataKey="value" fill="#7c3aed" />
                        <Line dataKey="value" stroke="#22c55e" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </section>
            )}

            {activeTab === "mutual" && (
              <section className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                  <ChartCard title="Fund Value History">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <RechartsLine data={mfHistorySeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Legend />
                        <Line dataKey="value" stroke="#0ea5e9" />
                        <Line dataKey="profit" stroke="#22c55e" />
                      </RechartsLine>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Profit / Loss by Fund">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={mfMix}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Bar dataKey="pl" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Fund Type Mix">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <PieChart>
                        <Pie data={mfTypeMix} dataKey="value" outerRadius="80%" label>
                          {mfTypeMix.map((_, idx) => (
                            <Cell key={idx} fill={chartPalette[idx % chartPalette.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={tooltipFmt} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Inflow vs Outflow">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <ComposedChart data={mfFlow}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Legend />
                        <Bar dataKey="invest" fill="#0ea5e9" />
                        <Bar dataKey="withdraw" fill="#ef4444" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </section>
            )}

            {activeTab === "fees" && (
              <section className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <ChartCard title="Fees Over Time">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <AreaChart data={feesTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Area type="monotone" dataKey="total" stroke="#ef4444" fillOpacity={0.2} fill="#ef4444" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Fee Type Breakdown">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <PieChart>
                        <Pie data={feeBreakdown} dataKey="value" outerRadius="80%" label>
                          {feeBreakdown.map((_, idx) => (
                            <Cell key={idx} fill={chartPalette[idx % chartPalette.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={tooltipFmt} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </section>
            )}

            {activeTab === "transactions" && (
              <section className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                  <ChartCard title="Income vs Expense Heat">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="income" name="Income" />
                        <YAxis dataKey="expense" name="Expense" />
                        <Tooltip formatter={tooltipFmt} />
                        <Scatter
                          data={monthlyIncomeExpense.map((m) => ({
                            income: m.income,
                            expense: m.expense,
                            month: m.month,
                          }))}
                          fill="#0ea5e9"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Category Treemap">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <Treemap
                        data={transactionTreemap}
                        dataKey="size"
                        nameKey="name"
                        stroke="#0b0b0b"
                        fill="#7c3aed"
                      />
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Largest Transactions">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={largestTransactions} layout="vertical" margin={{ left: 100 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip formatter={tooltipFmt} />
                        <Bar dataKey="value" fill="#22c55e">
                          {largestTransactions.map((t, idx) => (
                            <Cell key={idx} fill={t.type === "income" ? "#22c55e" : "#ef4444"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Cumulative Cashflow">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <AreaChart
                        data={monthlyIncomeExpense.map((m, idx) => ({
                          month: m.month,
                          cash:
                            monthlyIncomeExpense
                              .slice(0, idx + 1)
                              .reduce((s, r) => s + (r.income - r.expense), 0) + cashBalance,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={tooltipFmt} />
                        <Area type="monotone" dataKey="cash" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
