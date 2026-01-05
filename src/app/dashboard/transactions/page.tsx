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
} from "lucide-react";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
 const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
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
    next_payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      loadTransactions();
      loadCustomCategories();
    }
  }, [status]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/transactions");
      const data = (await response.json()) as { transactions?: Transaction[]; error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to load transactions");
      }

      setTransactions(data.transactions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

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


    useEffect(() => {
      if (status !== "authenticated") return;
  
     
  
      const loadRecurringPayments = async () => {
        try {
          setRecurringLoading(true);
          const response = await fetch("/api/recurring-payments");
          const data = await response.json();
          if (response.ok) {
            setRecurringPayments(data.recurringPayments || []);
          }
        } catch (error) {
          console.error("Error loading recurring payments:", error);
        } finally {
          setRecurringLoading(false);
        }
      };
  
  
      loadRecurringPayments();
    }, [status]);

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
      await loadTransactions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add transaction");
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
      const response = await fetch("/api/recurring-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecurringPayments([...recurringPayments, data.recurringPayment]);
        setShowAddModal(false);
        setFormData1({
          name: "",
          category: "",
          amount: "",
          frequency: "monthly",
          next_payment_date: new Date().toISOString().split("T")[0],
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error adding recurring payment:", error);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recurring payment?")) return;

    try {
      const response = await fetch(`/api/recurring-payments?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRecurringPayments(recurringPayments.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting recurring payment:", error);
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
        setRecurringPayments(
          recurringPayments.map((p) =>
            p.id === id
              ? { ...p, next_payment_date: data.next_payment_date }
              : p
          )
        );
        alert("Transaction created successfully!");
      }
    } catch (error) {
      console.error("Error converting to transaction:", error);
      alert("Failed to create transaction");
    } finally {
      setConverting(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50 bg-slate-900/80">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Transactions
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition text-white font-medium"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-lg border border-green-500/30 bg-green-900/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300">Total Income</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">${totalIncome.toFixed(2)}</p>
          </div>

          <div className="p-6 rounded-lg border border-red-500/30 bg-red-900/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300">Total Expenses</h3>
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-red-400">${totalExpense.toFixed(2)}</p>
          </div>

          <div className="p-6 rounded-lg border border-blue-500/30 bg-blue-900/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300">Balance</h3>
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <p className={`text-3xl font-bold ${balance >= 0 ? "text-blue-400" : "text-orange-400"}`}>
              ${balance.toFixed(2)}
            </p>
          </div>
        </div>

   {/* Recurring Payments & Subscriptions */}
        <div className="mb-8 p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-purple-300" />
              <h3 className="text-xl font-bold">Recurring Payments & Subscriptions</h3>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 transition text-purple-300"
            >
              <Plus className="w-4 h-4" />
              Add Subscription
            </button>
          </div>

          {recurringLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : recurringPayments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Repeat className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recurring payments yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Add subscriptions like Netflix, Spotify, gym memberships, etc.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recurringPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-100">{payment.name}</h4>
                      <p className="text-xs text-slate-400">{payment.category}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteRecurring(payment.id)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Amount:</span>
                      <span className="font-semibold text-slate-100">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Frequency:</span>
                      <span className="text-slate-300 capitalize">{payment.frequency}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Next Payment:</span>
                      <span className="text-slate-300">
                        {formatDate(payment.next_payment_date)}
                      </span>
                    </div>
                  </div>

                  {payment.notes && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{payment.notes}</p>
                  )}

                  <button
                    onClick={() => handleConvertToTransaction(payment.id)}
                    disabled={converting === payment.id}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {converting === payment.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg border border-slate-700/50 p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Add Recurring Payment</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddRecurring} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData1.name}
                    onChange={(e) => setFormData1({ ...formData1, name: e.target.value })}
                    placeholder="e.g., Netflix, Spotify, Gym"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData1.category}
                    onChange={(e) => setFormData1({ ...formData1, category: e.target.value })}
                    placeholder="e.g., Entertainment, Fitness, Software"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData1.amount}
                    onChange={(e) => setFormData1({ ...formData1, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Frequency *
                  </label>
                  <select
                    required
                    value={formData1.frequency}
                    onChange={(e) => setFormData1({ ...formData1, frequency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Next Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData1.next_payment_date}
                    onChange={(e) =>
                      setFormData1({ ...formData1, next_payment_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData1.notes}
                    onChange={(e) => setFormData1({ ...formData1, notes: e.target.value })}
                    placeholder="Add any additional details..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition text-white font-medium"
                  >
                    Add Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Add Transaction Form */}
        {showForm && (
          <div className="mb-8 p-6 rounded-lg border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 text-white">Add New Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "expense", category: "" })}
                      className={`flex-1 py-2 px-4 rounded-lg border transition ${
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
                      className={`flex-1 py-2 px-4 rounded-lg border transition ${
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Category
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                  rows={2}
                  placeholder="Add a note..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium transition flex items-center justify-center gap-2"
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
                  className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions List */}
        <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-white">Transaction History</h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <p className="text-red-400 text-center py-8">{error}</p>
          ) : transactions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No transactions yet. Add your first transaction!</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70 transition"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        transaction.type === "income"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{transaction.category}</p>
                      {transaction.description && (
                        <p className="text-sm text-slate-400">{transaction.description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(transaction.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      transaction.type === "income" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
