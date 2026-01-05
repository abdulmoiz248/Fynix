"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  DollarSign,
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2,
  Tag,
  Edit2,
  Trash2,
  Save,
  X,
} from "lucide-react";

type Budget = {
  id: string;
  category: string;
  budget_amount: number;
  period: string;
  is_custom_category: boolean;
  created_at: string;
  updated_at: string;
};

type CustomCategory = {
  id: string;
  category_name: string;
  description: string | null;
  created_at: string;
};

const DEFAULT_EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Other Expense",
];

export default function BudgetPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [spendingByCategory, setSpendingByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const [budgetForm, setBudgetForm] = useState({
    category: "",
    budget_amount: "",
    period: "monthly",
    is_custom_category: false,
  });

  const [categoryForm, setCategoryForm] = useState({
    category_name: "",
    description: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/budgets");
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to load budgets");
      }

      setBudgets(data.budgets || []);
      setCustomCategories(data.customCategories || []);
      setSpendingByCategory(data.spendingByCategory || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: budgetForm.category,
          budget_amount: parseFloat(budgetForm.budget_amount),
          period: budgetForm.period,
          is_custom_category: budgetForm.is_custom_category,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to create budget");
      }

      setBudgetForm({
        category: "",
        budget_amount: "",
        period: "monthly",
        is_custom_category: false,
      });
      setShowBudgetForm(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add budget");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/custom-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_name: categoryForm.category_name,
          description: categoryForm.description,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to create category");
      }

      setCategoryForm({
        category_name: "",
        description: "",
      });
      setShowCategoryForm(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBudget = async (budgetId: string) => {
    setSubmitting(true);

    try {
      const response = await fetch("/api/budgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: budgetId,
          budget_amount: parseFloat(editAmount),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to update budget");
      }

      setEditingBudget(null);
      setEditAmount("");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update budget");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    try {
      const response = await fetch(`/api/budgets?id=${budgetId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to delete budget");
      }

      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete budget");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this custom category?")) return;

    try {
      const response = await fetch(`/api/custom-categories?id=${categoryId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to delete category");
      }

      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category");
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

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget_amount, 0);
  const totalSpent = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);
  const totalRemaining = totalBudget - totalSpent;

  const allCategories = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...customCategories.map((c) => c.category_name),
  ];

  const availableCategories = allCategories.filter(
    (cat) => !budgets.some((b) => b.category === cat && b.period === budgetForm.period)
  );

  const getBudgetStatus = (budget: Budget) => {
    const spent = spendingByCategory[budget.category] || 0;
    const remaining = budget.budget_amount - spent;
    const percentage = (spent / budget.budget_amount) * 100;

    if (percentage >= 100) return { status: "over", color: "red", icon: AlertCircle };
    if (percentage >= 80) return { status: "warning", color: "yellow", icon: AlertCircle };
    return { status: "good", color: "green", icon: CheckCircle };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50 bg-slate-900/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Budget Manager
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition text-white font-medium"
            >
              <Plus className="w-5 h-5" />
              Category
            </button>
            <button
              onClick={() => setShowBudgetForm(!showBudgetForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition text-white font-medium"
            >
              <Plus className="w-5 h-5" />
              Budget
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-lg border border-blue-500/30 bg-blue-900/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300">Total Budget</h3>
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">${totalBudget.toFixed(2)}</p>
            <p className="text-sm text-slate-400 mt-1">Monthly limit</p>
          </div>

          <div className="p-6 rounded-lg border border-red-500/30 bg-red-900/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300">Total Spent</h3>
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-red-400">${totalSpent.toFixed(2)}</p>
            <p className="text-sm text-slate-400 mt-1">
              {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% of budget` : "No budget set"}
            </p>
          </div>

          <div className="p-6 rounded-lg border border-green-500/30 bg-green-900/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300">Remaining</h3>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className={`text-3xl font-bold ${totalRemaining >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${totalRemaining.toFixed(2)}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {totalRemaining >= 0 ? "Under budget" : "Over budget"}
            </p>
          </div>
        </div>

        {/* Add Custom Category Form */}
        {showCategoryForm && (
          <div className="mb-8 p-6 rounded-lg border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 text-white">Add Custom Category</h2>
            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.category_name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g., Pet Care, Subscriptions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-purple-500"
                    placeholder="Brief description"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 px-4 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-medium transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Category"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Budget Form */}
        {showBudgetForm && (
          <div className="mb-8 p-6 rounded-lg border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 text-white">Add Budget</h2>
            <form onSubmit={handleSubmitBudget} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Category
                  </label>
                  <select
                    required
                    value={budgetForm.category}
                    onChange={(e) => {
                      const isCustom = customCategories.some((c) => c.category_name === e.target.value);
                      setBudgetForm({
                        ...budgetForm,
                        category: e.target.value,
                        is_custom_category: isCustom,
                      });
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Budget Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={budgetForm.budget_amount}
                    onChange={(e) => setBudgetForm({ ...budgetForm, budget_amount: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Period</label>
                  <select
                    value={budgetForm.period}
                    onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
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
                    "Add Budget"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBudgetForm(false)}
                  className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Custom Categories List */}
        {customCategories.length > 0 && (
          <div className="mb-8 p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 text-white">Custom Categories</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {customCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
                >
                  <div>
                    <p className="font-semibold text-white">{category.category_name}</p>
                    {category.description && <p className="text-sm text-slate-400">{category.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budgets List */}
        <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-white">Budget Overview</h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <p className="text-red-400 text-center py-8">{error}</p>
          ) : budgets.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No budgets yet. Add your first budget to start tracking!
            </p>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const spent = spendingByCategory[budget.category] || 0;
                const remaining = budget.budget_amount - spent;
                const percentage = Math.min((spent / budget.budget_amount) * 100, 100);
                const { status, color, icon: Icon } = getBudgetStatus(budget);

                return (
                  <div
                    key={budget.id}
                    className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70 transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            color === "green"
                              ? "bg-green-500/20 text-green-400"
                              : color === "yellow"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{budget.category}</p>
                          <p className="text-xs text-slate-400 capitalize">{budget.period} budget</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {editingBudget === budget.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button
                              onClick={() => handleUpdateBudget(budget.id)}
                              disabled={submitting}
                              className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingBudget(null);
                                setEditAmount("");
                              }}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingBudget(budget.id);
                                setEditAmount(budget.budget_amount.toString());
                              }}
                              className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBudget(budget.id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Spent: <span className="text-red-400 font-semibold">${spent.toFixed(2)}</span>
                        </span>
                        <span className="text-slate-400">
                          Budget: <span className="text-blue-400 font-semibold">${budget.budget_amount.toFixed(2)}</span>
                        </span>
                      </div>

                      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            color === "green"
                              ? "bg-green-500"
                              : color === "yellow"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-sm">
                        <span
                          className={`font-semibold ${
                            remaining >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {remaining >= 0 ? `$${remaining.toFixed(2)} left` : `$${Math.abs(remaining).toFixed(2)} over`}
                        </span>
                        <span className="text-slate-400">{percentage.toFixed(1)}% used</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
