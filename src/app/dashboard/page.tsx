"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { BadgeDollarSign, Gauge, Repeat, Sparkles, Wallet } from "lucide-react";
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
  PieChart,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { dashboardQueries } from "@/lib/queries/dashboard";
import { useDashboardStore } from "@/store/dashboardStore";
import TextType from "@/components/TextType";
import StatCard from "@/components/dashboard/StatsCard";

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
      <div className="h-55">{children}</div>
    </div>
  );
}



const formatCurrency = (value: number, currency: string) =>
  {return "Rs." + value.toFixed(2);}

const monthsBetween = (months: number) => {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - months + 1);
  return past.toISOString().split("T")[0];
};

export default function DashboardPage() {
  const { status, data: session } = useSession();
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
        .filter((t) => Number(t.amount) > 0)
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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome Section */}
    <div className="glass-panel rounded-2xl p-8 border border-slate-800/60 bg-linear-to-br from-slate-900/60 to-slate-800/30">
  <div className="flex items-center justify-center gap-4 mb-6">
    <div className="text-center">
      <TextType
        text={[
          `Welcome back, ${session?.user?.name || session?.user?.email?.split("@")[0] || "there"}! 👋`,
          "This is your personal financial command center.",
          "Every smart decision compounds over time.",
          "Small, consistent investments today build massive wealth tomorrow.",
          "Compounding rewards patience more than perfection.",
          "Stay invested. Stay consistent. Let time do the heavy lifting.",
          `Net worth: ${formatCurrency(netWorth, currency)} • Tracking ${transactions.length} transactions`
        ]}
        className="text-lg md:text-xl font-medium text-slate-100 leading-relaxed"
        typingSpeed={45}
        pauseDuration={1800}
        showCursor={true}
        cursorCharacter="|"
      />
    </div>
  </div>

  <div className="flex flex-col items-center justify-center gap-2">
    <p className="text-slate-400 text-sm">
      {new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      })}
    </p>

    <p className="text-slate-500 text-xs tracking-wide">
      Long-term vision • Compounded growth • Financial clarity
    </p>
  </div>
</div>



        {loading ? (
          <div className="card-surface rounded-2xl p-12 text-center">
            <div className="animate-pulse text-slate-500">Building 30+ insights…</div>
          </div>
        ) : (
          <>
          
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

              </section>
         



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

                </div>
         
              <section className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
               

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

                </div>
              </section>
          

           
           

            
            

            
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

                </div>
              </section>
            

        
            

          
              <section className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                 
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
                </div>
              </section>
          
          
          
          </>
        )}
    </div>
  );
}
