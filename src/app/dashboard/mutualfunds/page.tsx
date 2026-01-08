"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Plus,
  DollarSign,
  Loader2,
  History,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  LineChart,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatsCard";

type MutualFund = {
  id: string;
  fund_name: string;
  fund_type: string | null;
  total_invested: number;
  current_value: number;
  units: number | null;
  nav: number | null;
  profit_loss: number;
  created_at: string;
  updated_at: string;
};

type MutualFundTransaction = {
  id: string;
  fund_name: string;
  transaction_type: "invest" | "withdraw";
  amount: number;
  units: number | null;
  nav: number | null;
  profit_loss: number;
  transaction_date: string;
  description: string | null;
  created_at: string;
};

type ValueHistory = {
  id: string;
  fund_name: string;
  previous_value: number;
  new_value: number;
  value_change: number;
  value_change_percentage: number;
  total_invested: number;
  profit_loss: number;
  update_date: string;
  notes: string | null;
  created_at: string;
};

export default function MutualFundsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [funds, setFunds] = useState<MutualFund[]>([]);
  const [transactions, setTransactions] = useState<MutualFundTransaction[]>([]);
  const [valueHistory, setValueHistory] = useState<ValueHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"portfolio" | "transactions" | "value-history">("portfolio");
  const [showInvestForm, setShowInvestForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showUpdateValueForm, setShowUpdateValueForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    tone?: "success" | "error";
  }>({ open: false, title: "", message: "", tone: "success" });

  const [investForm, setInvestForm] = useState({
    fund_name: "",
    fund_type: "",
    amount: "",
    units: "",
    nav: "",
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [withdrawForm, setWithdrawForm] = useState({
    fund_id: "",
    amount: "",
    units: "",
    nav: "",
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [updateValueForm, setUpdateValueForm] = useState({
    fund_id: "",
    new_value: "",
    nav: "",
    update_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fundsRes, transactionsRes, historyRes] = await Promise.all([
        fetch("/api/mutual-funds"),
        fetch("/api/mutual-fund-transactions"),
        fetch("/api/mutual-fund-value-history"),
      ]);

      const [fundsData, transactionsData, historyData] = await Promise.all([
        fundsRes.json(),
        transactionsRes.json(),
        historyRes.json(),
      ]);

      setFunds(fundsData.funds || []);
      setTransactions(transactionsData.transactions || []);
      setValueHistory(historyData.history || []);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/mutual-funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fund_name: investForm.fund_name,
          fund_type: investForm.fund_type || null,
          amount: parseFloat(investForm.amount),
          units: investForm.units ? parseFloat(investForm.units) : null,
          nav: investForm.nav ? parseFloat(investForm.nav) : null,
          transaction_date: investForm.transaction_date,
          description: investForm.description || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record investment");
      }

      setFeedbackModal({
        open: true,
        title: "Investment Recorded",
        message: "Your mutual fund investment was saved successfully.",
        tone: "success",
      });
      setInvestForm({
        fund_name: "",
        fund_type: "",
        amount: "",
        units: "",
        nav: "",
        transaction_date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setShowInvestForm(false);
      await loadData();
    } catch (err) {
      setFeedbackModal({
        open: true,
        title: "Investment Failed",
        message: err instanceof Error ? err.message : "Failed to record investment",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/mutual-funds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fund_id: withdrawForm.fund_id,
          amount: parseFloat(withdrawForm.amount),
          units: withdrawForm.units ? parseFloat(withdrawForm.units) : null,
          nav: withdrawForm.nav ? parseFloat(withdrawForm.nav) : null,
          transaction_date: withdrawForm.transaction_date,
          description: withdrawForm.description || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record withdrawal");
      }

      setFeedbackModal({
        open: true,
        title: "Withdrawal Successful",
        message: `P&L realized: Rs. ${data.profit_loss?.toFixed(2)}`,
        tone: "success",
      });
      setWithdrawForm({
        fund_id: "",
        amount: "",
        units: "",
        nav: "",
        transaction_date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setShowWithdrawForm(false);
      await loadData();
    } catch (err) {
      setFeedbackModal({
        open: true,
        title: "Withdrawal Failed",
        message: err instanceof Error ? err.message : "Failed to record withdrawal",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/mutual-funds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fund_id: updateValueForm.fund_id,
          new_value: parseFloat(updateValueForm.new_value),
          nav: updateValueForm.nav ? parseFloat(updateValueForm.nav) : null,
          update_date: updateValueForm.update_date,
          notes: updateValueForm.notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update value");
      }

      setFeedbackModal({
        open: true,
        title: "Value Updated",
        message: `Change: Rs. ${data.value_change?.toFixed(2)} (${data.value_change_percentage?.toFixed(2)}%) • P&L: Rs. ${data.profit_loss?.toFixed(2)}`,
        tone: "success",
      });
      setUpdateValueForm({
        fund_id: "",
        new_value: "",
        nav: "",
        update_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setShowUpdateValueForm(false);
      await loadData();
    } catch (err) {
      setFeedbackModal({
        open: true,
        title: "Update Failed",
        message: err instanceof Error ? err.message : "Failed to update value",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/signup");
  }

  const totalInvested = funds.reduce((sum, f) => sum + parseFloat(f.total_invested.toString()), 0);
  const currentValue = funds.reduce((sum, f) => sum + parseFloat(f.current_value.toString()), 0);
  const totalProfitLoss = funds.reduce((sum, f) => sum + parseFloat(f.profit_loss.toString()), 0);
  const totalInvestments = transactions.filter((t) => t.transaction_type === "invest").length;
  const totalWithdrawals = transactions.filter((t) => t.transaction_type === "withdraw").length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
     

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards using shared StatCard */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Invested"
            value={`Rs. ${totalInvested.toFixed(2)}`}
            icon={<PieChart className="w-5 h-5" />}
            delta={`${funds.length} funds`}
            tone="neutral"
          />
          <StatCard
            label="Current Value"
            value={`Rs. ${currentValue.toFixed(2)}`}
            icon={<LineChart className="w-5 h-5" />}
            delta={`${totalInvestments} invests`}
            tone="neutral"
          />
          <StatCard
            label="Total P&L"
            value={`${totalProfitLoss >= 0 ? "+" : ""}Rs. ${totalProfitLoss.toFixed(2)}`}
            icon={totalProfitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            delta={
              totalInvested > 0 ? `${((totalProfitLoss / totalInvested) * 100).toFixed(2)}%` : "0%"
            }
            tone={totalProfitLoss >= 0 ? "up" : "down"}
          />
          <StatCard
            label="Activity"
            value={`${funds.length} funds`}
            icon={<History className="w-5 h-5" />}
            delta={`${totalInvestments} invest • ${totalWithdrawals} withdraw`}
            tone="neutral"
          />
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8 p-6 rounded-xl border border-slate-700/50 bg-linear-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Quick Actions</h2>
              <p className="text-sm text-slate-400">Manage your mutual fund portfolio</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowInvestForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-white font-medium text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105"
              >
                <ArrowUpRight className="w-4 h-4" />
                Invest
              </button>
              <button
                onClick={() => setShowWithdrawForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 transition-all duration-200 text-white font-medium text-sm shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105"
              >
                <ArrowDownLeft className="w-4 h-4" />
                Withdraw
              </button>
              <button
                onClick={() => setShowUpdateValueForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-white font-medium text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
              >
                <RefreshCw className="w-4 h-4" />
                Update Value
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Separator */}
        <div className="flex items-center justify-center my-8">
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-purple-600 to-transparent"></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "portfolio"
                ? "bg-purple-500 text-white"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "transactions"
                ? "bg-purple-500 text-white"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Transaction History
          </button>
          <button
            onClick={() => setActiveTab("value-history")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "value-history"
                ? "bg-purple-500 text-white"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Value History
          </button>
        </div>

        {/* Portfolio Tab */}
        {activeTab === "portfolio" && (
          <>
            {/* Inline actions kept above in Quick Actions */}

            {/* Invest Form */}
            {showInvestForm && (
              <div className="mb-6 p-6 rounded-lg border border-green-500/50 bg-slate-800/50 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 text-white">Invest in Mutual Fund</h2>
                <form onSubmit={handleInvest} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fund Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={investForm.fund_name}
                        onChange={(e) => setInvestForm({ ...investForm, fund_name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                        placeholder="e.g., ABC Islamic Fund"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Fund Type</label>
                      <select
                        value={investForm.fund_type}
                        onChange={(e) => setInvestForm({ ...investForm, fund_type: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                      >
                        <option value="">Select type</option>
                        <option value="Equity">Equity</option>
                        <option value="Debt">Debt</option>
                        <option value="Balanced">Balanced</option>
                        <option value="Money Market">Money Market</option>
                        <option value="Islamic">Islamic</option>
                        <option value="Index">Index</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={investForm.amount}
                        onChange={(e) => setInvestForm({ ...investForm, amount: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                        placeholder="Investment amount"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Units</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={investForm.units}
                        onChange={(e) => setInvestForm({ ...investForm, units: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                        placeholder="Number of units"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">NAV</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={investForm.nav}
                        onChange={(e) => setInvestForm({ ...investForm, nav: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                        placeholder="NAV per unit"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                      <input
                        type="date"
                        required
                        value={investForm.transaction_date}
                        onChange={(e) =>
                          setInvestForm({ ...investForm, transaction_date: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                      <input
                        type="text"
                        value={investForm.description}
                        onChange={(e) =>
                          setInvestForm({ ...investForm, description: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 px-4 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-medium transition"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Invest"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInvestForm(false)}
                      className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Withdraw Form */}
            {showWithdrawForm && (
              <div className="mb-6 p-6 rounded-lg border border-red-500/50 bg-slate-800/50 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 text-white">Withdraw from Mutual Fund</h2>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Select Fund *</label>
                    <select
                      required
                      value={withdrawForm.fund_id}
                      onChange={(e) => {
                        const fund = funds.find((f) => f.id === e.target.value);
                        setWithdrawForm({
                          ...withdrawForm,
                          fund_id: e.target.value,
                          nav: fund?.nav?.toString() || "",
                        });
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">Select fund</option>
                      {funds.map((fund) => (
                        <option key={fund.id} value={fund.id}>
                          {fund.fund_name} - Current Value: Rs. {parseFloat(fund.current_value.toString()).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={withdrawForm.amount}
                        onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500"
                        placeholder="Withdrawal amount"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Units</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={withdrawForm.units}
                        onChange={(e) => setWithdrawForm({ ...withdrawForm, units: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500"
                        placeholder="Number of units"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">NAV</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={withdrawForm.nav}
                        onChange={(e) => setWithdrawForm({ ...withdrawForm, nav: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500"
                        placeholder="NAV per unit"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                      <input
                        type="date"
                        required
                        value={withdrawForm.transaction_date}
                        onChange={(e) =>
                          setWithdrawForm({ ...withdrawForm, transaction_date: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                      <input
                        type="text"
                        value={withdrawForm.description}
                        onChange={(e) =>
                          setWithdrawForm({ ...withdrawForm, description: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500"
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium transition"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Withdraw"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWithdrawForm(false)}
                      className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Update Value Form */}
            {showUpdateValueForm && (
              <div className="mb-6 p-6 rounded-lg border border-blue-500/50 bg-slate-800/50 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 text-white">Update Fund Value</h2>
                <form onSubmit={handleUpdateValue} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Select Fund *</label>
                    <select
                      required
                      value={updateValueForm.fund_id}
                      onChange={(e) => {
                        const fund = funds.find((f) => f.id === e.target.value);
                        setUpdateValueForm({
                          ...updateValueForm,
                          fund_id: e.target.value,
                          nav: fund?.nav?.toString() || "",
                        });
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select fund</option>
                      {funds.map((fund) => (
                        <option key={fund.id} value={fund.id}>
                          {fund.fund_name} - Current: Rs. {parseFloat(fund.current_value.toString()).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">New Value *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={updateValueForm.new_value}
                        onChange={(e) =>
                          setUpdateValueForm({ ...updateValueForm, new_value: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Updated value"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">NAV</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={updateValueForm.nav}
                        onChange={(e) =>
                          setUpdateValueForm({ ...updateValueForm, nav: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Current NAV"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                      <input
                        type="date"
                        required
                        value={updateValueForm.update_date}
                        onChange={(e) =>
                          setUpdateValueForm({ ...updateValueForm, update_date: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                      <input
                        type="text"
                        value={updateValueForm.notes}
                        onChange={(e) =>
                          setUpdateValueForm({ ...updateValueForm, notes: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium transition"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Update Value"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUpdateValueForm(false)}
                      className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Funds List */}
            <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-4 text-white">Your Mutual Funds</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : funds.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No mutual funds yet. Start investing!</p>
              ) : (
                <div className="space-y-3">
                  {funds.map((fund) => (
                    <div
                      key={fund.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-white text-lg">{fund.fund_name}</h3>
                          {fund.fund_type && (
                            <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/50">
                              {fund.fund_type}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-slate-500">Invested</p>
                            <p className="text-white font-semibold">
                              Rs. {parseFloat(fund.total_invested.toString()).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Current Value</p>
                            <p className="text-white font-semibold">
                              Rs. {parseFloat(fund.current_value.toString()).toFixed(2)}
                            </p>
                          </div>
                          {fund.units && (
                            <div>
                              <p className="text-slate-500">Units</p>
                              <p className="text-white font-semibold">
                                {parseFloat(fund.units.toString()).toFixed(4)}
                              </p>
                            </div>
                          )}
                          {fund.nav && (
                            <div>
                              <p className="text-slate-500">NAV</p>
                              <p className="text-white font-semibold">
                                Rs. {parseFloat(fund.nav.toString()).toFixed(4)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-slate-400 mb-1">Profit/Loss</p>
                        <p
                          className={`text-2xl font-bold ${
                            parseFloat(fund.profit_loss.toString()) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {parseFloat(fund.profit_loss.toString()) >= 0 ? "+" : ""}
                          Rs. {parseFloat(fund.profit_loss.toString()).toFixed(2)}
                        </p>
                        <p
                          className={`text-sm ${
                            parseFloat(fund.profit_loss.toString()) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {parseFloat(fund.profit_loss.toString()) >= 0 ? "+" : ""}
                          {(
                            (parseFloat(fund.profit_loss.toString()) /
                              parseFloat(fund.total_invested.toString())) *
                            100
                          ).toFixed(2)}
                          %
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Transaction History Tab */}
        {activeTab === "transactions" && (
          <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <History className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Transaction History</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Fund Name</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Amount</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Units</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">NAV</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">P&L</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b border-slate-700/50 hover:bg-slate-900/30 transition"
                      >
                        <td className="py-3 px-4 text-slate-300 text-sm">
                          {new Date(txn.transaction_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              txn.transaction_type === "invest"
                                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                : "bg-red-500/20 text-red-400 border border-red-500/50"
                            }`}
                          >
                            {txn.transaction_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white font-semibold">{txn.fund_name}</td>
                        <td className="py-3 px-4 text-right text-white font-semibold">
                          Rs. {parseFloat(txn.amount.toString()).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {txn.units ? parseFloat(txn.units.toString()).toFixed(4) : "-"}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {txn.nav ? `Rs. ${parseFloat(txn.nav.toString()).toFixed(4)}` : "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {txn.transaction_type === "withdraw" ? (
                            <span
                              className={`font-bold ${
                                parseFloat(txn.profit_loss.toString()) >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {parseFloat(txn.profit_loss.toString()) >= 0 ? "+" : ""}
                              Rs. {parseFloat(txn.profit_loss.toString()).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-sm">
                          {txn.description || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="mt-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total Investments</p>
                      <p className="text-lg font-bold text-green-400">
                        Rs.{" "}
                        {transactions
                          .filter((t) => t.transaction_type === "invest")
                          .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
                          .toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total Withdrawals</p>
                      <p className="text-lg font-bold text-red-400">
                        Rs.{" "}
                        {transactions
                          .filter((t) => t.transaction_type === "withdraw")
                          .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
                          .toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Realized P&L from Withdrawals</p>
                      <p
                        className={`text-lg font-bold ${
                          transactions
                            .filter((t) => t.transaction_type === "withdraw")
                            .reduce((sum, t) => sum + parseFloat(t.profit_loss.toString()), 0) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {transactions
                          .filter((t) => t.transaction_type === "withdraw")
                          .reduce((sum, t) => sum + parseFloat(t.profit_loss.toString()), 0) >= 0
                          ? "+"
                          : ""}
                        Rs.{" "}
                        {transactions
                          .filter((t) => t.transaction_type === "withdraw")
                          .reduce((sum, t) => sum + parseFloat(t.profit_loss.toString()), 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Value History Tab */}
        {activeTab === "value-history" && (
          <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <LineChart className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Value Update History</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : valueHistory.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No value updates yet.</p>
            ) : (
              <div className="space-y-4">
                {valueHistory.map((history) => (
                  <div
                    key={history.id}
                    className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white text-lg">{history.fund_name}</h3>
                        <p className="text-sm text-slate-400">
                          {new Date(history.update_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            parseFloat(history.value_change.toString()) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {parseFloat(history.value_change.toString()) >= 0 ? "+" : ""}
                          Rs. {parseFloat(history.value_change.toString()).toFixed(2)}
                        </p>
                        <p
                          className={`text-sm ${
                            parseFloat(history.value_change_percentage.toString()) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {parseFloat(history.value_change_percentage.toString()) >= 0 ? "+" : ""}
                          {parseFloat(history.value_change_percentage.toString()).toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Previous Value</p>
                        <p className="text-white font-semibold">
                          Rs. {parseFloat(history.previous_value.toString()).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">New Value</p>
                        <p className="text-white font-semibold">
                          Rs. {parseFloat(history.new_value.toString()).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Total Invested</p>
                        <p className="text-white font-semibold">
                          Rs. {parseFloat(history.total_invested.toString()).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Total P&L</p>
                        <p
                          className={`font-semibold ${
                            parseFloat(history.profit_loss.toString()) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {parseFloat(history.profit_loss.toString()) >= 0 ? "+" : ""}
                          Rs. {parseFloat(history.profit_loss.toString()).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {history.notes && (
                      <p className="mt-3 text-sm text-slate-400 italic border-t border-slate-700 pt-3">
                        {history.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      {/* Feedback Modal */}
      {feedbackModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-linear-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    feedbackModal.tone === "success"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {feedbackModal.tone === "success" ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{feedbackModal.title}</h3>
                  <p className="text-slate-400 text-sm">{feedbackModal.message}</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setFeedbackModal({ ...feedbackModal, open: false })}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
