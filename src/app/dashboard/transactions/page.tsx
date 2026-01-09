"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  TrendingDown,
  TrendingUp,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Loader2,
  X,
  Repeat,
  Trash2,
  CheckCircle,
  Wallet,
  Search,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatsCard";
import { useQuery } from "@tanstack/react-query";
import { dashboardQueries } from "@/lib/queries/dashboard";

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
};

type CustomCategory = {
  id: string;
  category_name: string;
  description: string | null;
  created_at: string;
};

const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Gift", "Other Income"];
const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Other Expense",
];

type RecurringPayment = {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: string;
  next_payment_date: string;
  status: string;
  notes?: string;
};

export default function TransactionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    id: string | null;
    entity: "transaction" | "recurring" | null;
  }>({ open: false, id: null, entity: null });
  const [confirming, setConfirming] = useState(false);
  const [banner, setBanner] = useState<null | { type: "success" | "error"; message: string }>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const [recurringSubmitting, setRecurringSubmitting] = useState(false);

   const recurringQuery = useQuery({
    queryKey: ["recurring"],
    queryFn: dashboardQueries.recurring,
  });

   const recurringPayments = recurringQuery.data?.recurringPayments || [];

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: dashboardQueries.transactions,
  });
  const transactions = transactionsQuery.data?.transactions || [];

  function computeNextPaymentDate(frequency: string, baseDate = new Date()): string {
    const d = new Date(baseDate);
    switch (frequency) {
      case "daily":
        d.setDate(d.getDate() + 1);
        break;
      case "weekly":
        d.setDate(d.getDate() + 7);
        break;
      case "monthly":
        d.setMonth(d.getMonth() + 1);
        break;
      case "quarterly":
        d.setMonth(d.getMonth() + 3);
        break;
      case "yearly":
        d.setFullYear(d.getFullYear() + 1);
        break;
      default:
        d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().split("T")[0];
  }


  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
   const [formData1, setFormData1] = useState({
    name: "",
    category: "",
    amount: "",
    frequency: "monthly",
    next_payment_date: computeNextPaymentDate("monthly"),
    notes: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      loadCustomCategories();
    }
  }, [status]);



  const loadCustomCategories = async () => {
    try {
      const response = await fetch("/api/budgets");
      const data = await response.json();

      if (response.ok && data.customCategories) {
        setCustomCategories(data.customCategories);
      }
    } catch (err) {
      console.error("Failed to load custom categories:", err);
    }
  };


 

  const handleDeleteTransaction = async (id: string) => {
    try {
      setDeleting(id);
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }
      transactionsQuery.refetch();
      setBanner({ type: "success", message: "Transaction deleted successfully" });
    } catch (err) {
      setBanner({ type: "error", message: err instanceof Error ? err.message : "Failed to delete transaction" });
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
        }),
      });

      const data = (await response.json()) as { transaction?: Transaction; error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to create transaction");
      }

      setFormData({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
      transactionsQuery.refetch();
      setBanner({ type: "success", message: "Transaction added successfully" });
    } catch (err) {
      setBanner({ type: "error", message: err instanceof Error ? err.message : "Failed to add transaction" });
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

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const allExpenseCategories = [
    ...EXPENSE_CATEGORIES,
    ...customCategories.map((c) => c.category_name),
  ];
  const categories = formData.type === "income" ? INCOME_CATEGORIES : allExpenseCategories;

  
  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRecurringSubmitting(true);
      const response = await fetch("/api/recurring-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData1,
          amount: parseFloat(formData1.amount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        recurringQuery.refetch();
        setShowAddModal(false);
        setFormData1({
          name: "",
          category: "",
          amount: "",
          frequency: "monthly",
          next_payment_date: computeNextPaymentDate("monthly"),
          notes: "",
        });
        setBanner({ type: "success", message: "Recurring payment added" });
      } else {
        const err = await response.json().catch(() => ({}));
        setBanner({ type: "error", message: err?.error || "Failed to add recurring payment" });
      }
    } catch (error) {
      console.error("Error adding recurring payment:", error);
      setBanner({ type: "error", message: "Failed to add recurring payment" });
    } finally {
      setRecurringSubmitting(false);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    try {
      const response = await fetch(`/api/recurring-payments?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        recurringQuery.refetch();
        setBanner({ type: "success", message: "Recurring payment deleted" });
      }
    } catch (error) {
      console.error("Error deleting recurring payment:", error);
      setBanner({ type: "error", message: "Failed to delete recurring payment" });
    }
  };

  const handleConvertToTransaction = async (id: string) => {
    try {
      setConverting(id);
      const response = await fetch("/api/recurring-payments/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurring_payment_id: id }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the recurring payment with new next_payment_date
        
        recurringQuery.refetch();
        
        transactionsQuery.refetch();
        setBanner({ type: "success", message: "Transaction created from subscription" });
      } else {
        const err = await response.json().catch(() => ({}));
        setBanner({ type: "error", message: err?.error || "Failed to create transaction" });
      }
    } catch (error) {
      console.error("Error converting to transaction:", error);
      setBanner({ type: "error", message: "Failed to create transaction" });
    } finally {
      setConverting(null);
    }
  };

  const formatCurrency = (amount: number) => {
   return "Rs." + amount.toFixed(2);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-black">
    

      <main className="max-w-5xl mx-auto px-6 py-8">
        {banner && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm flex items-start justify-between gap-3 ${
              banner.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <span>{banner.message}</span>
            <button onClick={() => setBanner(null)} className="opacity-75 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Total Income"
            value={`Rs.${totalIncome.toFixed(2)}`}
            delta={`${transactions.filter(t => t.type === 'income').length} transactions`}
            tone="up"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          
          <StatCard
            label="Total Expenses"
            value={`Rs.${totalExpense.toFixed(2)}`}
            delta={`${transactions.filter(t => t.type === 'expense').length} transactions`}
            tone="down"
            icon={<TrendingDown className="w-5 h-5" />}
          />
          
          <StatCard
            label="Balance"
            value={`Rs.${balance.toFixed(2)}`}
            delta={balance >= 0 ? "Positive balance" : "Negative balance"}
            tone={balance >= 0 ? "up" : "down"}
            icon={<Wallet className="w-5 h-5" />}
          />
        </div>

        {/* Decorative Separator */}
        <div className="flex items-center justify-center my-8">
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-cyan-600 to-transparent"></div>
        </div>

   {/* Recurring Payments & Subscriptions */}
       <div className="mb-8 p-6 rounded-2xl border border-slate-700/30 bg-slate-800/40 backdrop-blur-md shadow-lg">
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <Repeat className="w-6 h-6 text-purple-400" />
      <h3 className="text-2xl font-bold text-slate-100">Recurring Payments & Subscriptions</h3>
    </div>
    <button
      onClick={() => setShowAddModal(true)}
      className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-purple-500/25 hover:bg-purple-500/40 border border-purple-500/50 transition text-purple-200 font-medium"
    >
      <Plus className="w-5 h-5" />
      Add Subscription
    </button>
  </div>

  {recurringQuery.isLoading ? (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
    </div>
  ) : recurringPayments.length === 0 ? (
    <div className="text-center py-12 text-slate-400">
      <Repeat className="w-14 h-14 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium">No recurring payments yet</p>
      <p className="text-sm text-slate-500 mt-2">
        Add subscriptions like Netflix, Spotify, gym memberships, etc.
      </p>
    </div>
  ) : (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recurringPayments.map((payment) => (
        <div
          key={payment.id}
          className="group relative p-5 rounded-2xl border border-slate-700/40 bg-slate-900/50 hover:bg-slate-900/70 transition shadow-md hover:shadow-xl transform hover:-translate-y-1 duration-300"
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-violet-500/5 via-purple-500/10 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-semibold text-slate-100 text-lg">{payment.name}</h4>
              <p className="text-sm text-slate-400">{payment.category}</p>
            </div>
            <button
              onClick={() => setConfirmModal({ open: true, id: payment.id, entity: "recurring" })}
              className="text-red-400 hover:text-red-300 transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 mb-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Amount:</span>
              <span className="font-semibold text-slate-100">{formatCurrency(payment.amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Frequency:</span>
              <span className="text-slate-300 capitalize">{payment.frequency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Next Payment:</span>
              <span className="text-slate-300 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                {formatDate(payment.next_payment_date)}
              </span>
            </div>
          </div>

         

          <button
            onClick={() => handleConvertToTransaction(payment.id)}
            disabled={converting === payment.id}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-green-500/25 hover:bg-green-500/40 border border-green-500/50 text-green-200 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {converting === payment.id ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Add as Transaction
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  )}
</div>


  {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="relative w-full max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/40 p-6 shadow-2xl">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-2xl font-bold text-white">Add Recurring Payment</h3>
        <p className="text-sm text-slate-400">Create or track a subscription</p>
      </div>
      <button
        onClick={() => setShowAddModal(false)}
        className="text-slate-400 hover:text-slate-200 transition"
      >
        <X className="w-6 h-6" />
      </button>
    </div>

    <form onSubmit={handleAddRecurring} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
        <input
          type="text"
          required
          value={formData1.name}
          onChange={(e) => setFormData1({ ...formData1, name: e.target.value })}
          placeholder="e.g., Netflix, Spotify, Gym"
          className="w-full h-12 px-4 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className=" text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
            <Tag className="w-4 h-4 text-slate-400" /> Category
          </label>
          <select
            required
            value={formData1.category}
            onChange={(e) => setFormData1({ ...formData1, category: e.target.value })}
            className="w-full h-12 px-4 rounded-xl bg-slate-900/70 border border-slate-600 text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Amount *</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData1.amount}
            onChange={(e) => setFormData1({ ...formData1, amount: e.target.value })}
            placeholder="0.00"
            className="w-full h-12 px-4 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Frequency *</label>
          <select
            required
            value={formData1.frequency}
            onChange={(e) => setFormData1({
              ...formData1,
              frequency: e.target.value,
              next_payment_date: computeNextPaymentDate(e.target.value)
            })}
            className="w-full h-12 px-4 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Next Payment Date *</label>
          
         
            <input
              type="date"
              required
              value={formData1.next_payment_date}
              onChange={(e) => setFormData1({ ...formData1, next_payment_date: e.target.value })}
              min={computeNextPaymentDate("daily")}
              className="w-full h-12 pl-10 pr-4 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
            />
            <p className="mt-1 text-xs text-slate-500">
              {new Date(formData1.next_payment_date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
            </p>
         
        </div>
      </div>

      <div className="flex gap-3 pt-3">
        <button
          type="button"
          onClick={() => setShowAddModal(false)}
          className="flex-1 h-12 rounded-xl bg-slate-700/70 hover:bg-slate-700 transition text-slate-200 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={recurringSubmitting}
          className="flex-1 h-12 rounded-xl bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 transition text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {recurringSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Payment"
          )}
        </button>
      </div>
    </form>
  </div>
</div>

        )}
        
        {/* Add Transaction Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Add New Transaction</h2>
                  <p className="text-xs text-slate-400">Quickly record income or expenses</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "expense", category: "" })}
                        className={`flex-1 h-11 px-4 rounded-lg border transition ${
                          formData.type === "expense"
                            ? "bg-red-500 border-red-500 text-white"
                            : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "income", category: "" })}
                        className={`flex-1 h-11 px-4 rounded-lg border transition ${
                          formData.type === "income"
                            ? "bg-green-500 border-green-500 text-white"
                            : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        Income
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2"><DollarSign className="w-4 h-4 inline mr-1" />Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg bg-slate-900/70 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4 inline mr-1" />Category</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg bg-slate-900/70 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2"><Calendar className="w-4 h-4 inline mr-1" />Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full h-11 pl-9 pr-3 rounded-lg bg-slate-900/70 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2"><FileText className="w-4 h-4 inline mr-1" />Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/70 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                    rows={2}
                    placeholder="Add a note..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-11 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500/50 text-white font-medium transition flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Transaction"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="h-11 px-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start lg:items-center">
              <div className="lg:col-span-8">
                <h2 className="text-2xl font-bold text-white mb-1">Transaction History</h2>
                <p className="text-sm text-slate-400">Manage and track all your transactions</p>
              </div>
              
              <div className="lg:col-span-4 flex lg:justify-end">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 h-12 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Transaction</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 flex flex-col lg:flex-row gap-3 items-stretch overflow-x-auto">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-60">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by category, description, or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-700 transition"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
              
              {/* Type Filter */}
              <div className="flex gap-2 p-1 rounded-xl bg-slate-900/50 border border-slate-600/50 h-12">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`flex-1 px-4 h-full rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                    typeFilter === "all"
                      ? "bg-slate-700 text-white shadow-lg"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTypeFilter("income")}
                  className={`flex-1 px-4 h-full rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                    typeFilter === "income"
                      ? "bg-linear-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "text-slate-300 hover:text-emerald-300 hover:bg-slate-800/50"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Income</span>
                </button>
                <button
                  onClick={() => setTypeFilter("expense")}
                  className={`flex-1 px-4 h-full rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                    typeFilter === "expense"
                      ? "bg-linear-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-500/30"
                      : "text-slate-300 hover:text-rose-300 hover:bg-slate-800/50"
                  }`}
                >
                  <TrendingDown className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Expense</span>
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative min-w-50">
                <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="newest">📅 Newest First</option>
                  <option value="oldest">📅 Oldest First</option>
                  <option value="highest">💰 Highest Amount</option>
                  <option value="lowest">💰 Lowest Amount</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || typeFilter !== "all") && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery("")} className="hover:text-blue-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {typeFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs capitalize">
                    Type: {typeFilter}
                    <button onClick={() => setTypeFilter("all")} className="hover:text-purple-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                  }}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {transactionsQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
                <p className="text-slate-400">Loading transactions...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-red-400 text-center">{error}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-400 text-center mb-2">No transactions yet</p>
                <p className="text-sm text-slate-500 mb-6">Start tracking your finances by adding your first transaction</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium transition-all duration-300 shadow-lg shadow-blue-500/30"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Transaction
                </button>
              </div>
            ) : (() => {
              // Filter by search and type
              let filtered = transactions.filter(t => {
                const matchesSearch = searchQuery === "" || 
                  t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.amount.toString().includes(searchQuery);
                
                const matchesType = typeFilter === "all" || t.type === typeFilter;
                
                return matchesSearch && matchesType;
              });

              // Sort transactions
              filtered.sort((a, b) => {
                switch (sortOrder) {
                  case "newest":
                    return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
                  case "oldest":
                    return new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime();
                  case "highest":
                    return b.amount - a.amount;
                  case "lowest":
                    return a.amount - b.amount;
                  default:
                    return 0;
                }
              });

              // Group by month
              const grouped = filtered.reduce((acc, transaction) => {
                const date = new Date(transaction.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!acc[monthKey]) acc[monthKey] = [];
                //@ts-ignore
                acc[monthKey].push(transaction);
                return acc;
              }, {} as Record<string, Transaction[]>);

              const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

              if (filtered.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-400 text-center mb-2">No transactions found</p>
                    <p className="text-sm text-slate-500">Try adjusting your filters or search query</p>
                  </div>
                );
              }

              return (
                <div className="space-y-8">
                  {sortedMonths.map((monthKey) => {
                    const [year, month] = monthKey.split('-');
                    const monthDate = new Date(parseInt(year), parseInt(month) - 1);
                    const isCurrentMonth = monthKey === new Date().toISOString().slice(0, 7);
                    const monthTotal = grouped[monthKey].reduce((sum, t) => {
                      return sum + (t.type === 'income' ? t.amount : -t.amount);
                    }, 0);
                    
                    return (
                      <div key={monthKey} className="space-y-4">
                        {/* Month Header with Summary */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 h-px bg-linear-to-r from-transparent via-slate-600 to-transparent w-8 sm:w-12" />
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50">
                              {isCurrentMonth && (
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              )}
                              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                                {isCurrentMonth ? "Current Month" : monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </h3>
                            </div>
                            <div className="hidden sm:block flex-1 h-px bg-linear-to-r from-slate-600 to-transparent" />
                          </div>
                          
                          <div className="flex items-center gap-3 ml-11 sm:ml-0">
                            <div className="text-right">
                              <p className="text-xs text-slate-500 mb-1">{grouped[monthKey].length} transactions</p>
                              <p className={`text-sm font-bold ${
                                monthTotal >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}>
                                {monthTotal >= 0 ? "+" : "-"}Rs.{Math.abs(monthTotal).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Transaction Cards */}
                        <div className="grid gap-3">
                          {grouped[monthKey].map((transaction) => (
                            <div
                              key={transaction.id}
                              className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-linear-to-br from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50 hover:shadow-xl hover:shadow-slate-900/50 hover:-translate-y-1"
                            >
                              {/* Gradient overlay */}
                              <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-violet-500/0 via-violet-500/5 to-cyan-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                              
                              <div className="relative p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                  {/* Left section */}
                                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                    {/* Icon */}
                                        <div
                                      className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                                        transaction.type === "income"
                                          ? "bg-linear-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 group-hover:from-emerald-500/30 group-hover:to-emerald-600/30"
                                          : "bg-linear-to-br from-rose-500/20 to-rose-600/20 text-rose-400 group-hover:from-rose-500/30 group-hover:to-rose-600/30"
                                      }`}
                                    >
                                      {transaction.type === "income" ? (
                                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                                      ) : (
                                        <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
                                      )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-white text-base sm:text-lg truncate">{transaction.category}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                                          transaction.type === "income" 
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        }`}>
                                          {transaction.type}
                                        </span>
                                      </div>
                                      {transaction.description && (
                                        <p className="text-sm text-slate-400 mb-1 truncate">{transaction.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(transaction.date).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right section - Amount and Actions */}
                                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 ml-14 sm:ml-0">
                                    <div className="text-left sm:text-right">
                                      <p
                                        className={`text-xl sm:text-2xl font-bold transition-colors ${
                                          transaction.type === "income" ? "text-emerald-400" : "text-rose-400"
                                        }`}
                                      >
                                        {transaction.type === "income" ? "+" : "-"}Rs.{transaction.amount.toFixed(2)}
                                      </p>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => setConfirmModal({ open: true, id: transaction.id, entity: "transaction" })}
                                      disabled={deleting === transaction.id}
                                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Delete transaction"
                                    >
                                      {deleting === transaction.id ? (
                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Bottom glow effect */}
                              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5 transition-all duration-300 group-hover:ring-white/10" />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </main>
      {/* Confirm Delete Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !confirming && setConfirmModal({ open: false, id: null, entity: null })}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-9 w-9 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white mb-1">Delete {confirmModal.entity === 'recurring' ? 'Recurring Payment' : 'Transaction'}?</h4>
                <p className="text-sm text-slate-400">This action cannot be undone. The {confirmModal.entity === 'recurring' ? 'subscription' : 'transaction'} will be permanently removed.</p>
              </div>
              <button
                className="text-slate-400 hover:text-slate-200"
                onClick={() => !confirming && setConfirmModal({ open: false, id: null, entity: null })}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 h-11 rounded-lg border border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700 transition"
                onClick={() => setConfirmModal({ open: false, id: null, entity: null })}
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                className="flex-1 h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-60"
                onClick={async () => {
                  if (!confirmModal.id || !confirmModal.entity) return;
                  try {
                    setConfirming(true);
                    if (confirmModal.entity === 'transaction') {
                      await handleDeleteTransaction(confirmModal.id);
                    } else {
                      await handleDeleteRecurring(confirmModal.id);
                    }
                  } finally {
                    setConfirming(false);
                    setConfirmModal({ open: false, id: null, entity: null });
                  }
                }}
                disabled={confirming}
              >
                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {confirming ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
