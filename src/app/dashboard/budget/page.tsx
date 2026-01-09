"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
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
import StatCard from "@/components/dashboard/StatsCard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardQueries } from "@/lib/queries/dashboard";

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
  const { status } = useSession();
  const queryClient = useQueryClient();

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{id: string, amount: number} | null>(null);
  
  // Modal states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'budget' | 'category', id: string} | null>(null);
  const [modalMessage, setModalMessage] = useState("");

  const budgetsQuery = useQuery({
    queryKey: ["budgets"],
    queryFn: dashboardQueries.budgets,
    enabled: status === "authenticated",
  });

  const budgets = budgetsQuery.data?.budgets || [];
  const customCategories = budgetsQuery.data?.customCategories || [];
  const spendingByCategory = budgetsQuery.data?.spendingByCategory || {};
  const dataError = (budgetsQuery.error as Error) || null;
  const loading = budgetsQuery.isLoading || budgetsQuery.isFetching;

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
  const addBudgetMutation = useMutation({
    mutationFn: async () => {
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
      return data;
    },
    onSuccess: () => {
      setBudgetForm({
        category: "",
        budget_amount: "",
        period: "monthly",
        is_custom_category: false,
      });
      setShowBudgetForm(false);
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (err) => {
      setModalMessage(err instanceof Error ? err.message : "Failed to add budget");
      setShowErrorModal(true);
    },
    onSettled: () => setSubmitting(false),
  });

  const addCategoryMutation = useMutation({
    mutationFn: async () => {
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
      return data;
    },
    onSuccess: () => {
      setCategoryForm({
        category_name: "",
        description: "",
      });
      setShowCategoryForm(false);
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (err) => {
      setModalMessage(err instanceof Error ? err.message : "Failed to add category");
      setShowErrorModal(true);
    },
    onSettled: () => setSubmitting(false),
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async (payload: { id: string; amount: number }) => {
      const response = await fetch("/api/budgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payload.id,
          budget_amount: payload.amount,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to update budget");
      }
      return data;
    },
    onSuccess: () => {
      setEditingBudget(null);
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (err) => {
      setModalMessage(err instanceof Error ? err.message : "Failed to update budget");
      setShowErrorModal(true);
    },
    onSettled: () => setSubmitting(false),
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const response = await fetch(`/api/budgets?id=${budgetId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to delete budget");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (err) => {
      setModalMessage(err instanceof Error ? err.message : "Failed to delete budget");
      setShowErrorModal(true);
    },
    onSettled: () => {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setSubmitting(false);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/custom-categories?id=${categoryId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to delete category");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (err) => {
      setModalMessage(err instanceof Error ? err.message : "Failed to delete category");
      setShowErrorModal(true);
    },
    onSettled: () => {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setSubmitting(false);
    },
  });

  const deletePending = deleteBudgetMutation.isPending || deleteCategoryMutation.isPending;

  const handleSubmitBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    addBudgetMutation.mutate();
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    addCategoryMutation.mutate();
  };

  const handleUpdateBudget = async () => {
    if (!editingBudget) return;
    setSubmitting(true);
    updateBudgetMutation.mutate({ id: editingBudget.id, amount: editingBudget.amount });
  };

  const handleDeleteBudget = async (budgetId: string) => {
    setDeleteTarget({ type: 'budget', id: budgetId });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);

    if (deleteTarget.type === 'budget') {
      deleteBudgetMutation.mutate(deleteTarget.id);
    } else {
      deleteCategoryMutation.mutate(deleteTarget.id);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setDeleteTarget({ type: 'category', id: categoryId });
    setShowDeleteConfirm(true);
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
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
    

      <main className="max-w-6xl mx-auto px-6 py-8">

  {/* Action Buttons Section */}
        <div className="mb-8 p-6 rounded-xl border border-slate-700/50 bg-linear-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Quick Actions</h2>
              <p className="text-sm text-slate-400">Manage your budget categories and limits</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCategoryForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all duration-200 text-white font-medium text-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
              <button
                onClick={() => setShowBudgetForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-white font-medium text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Add Budget
              </button>
            </div>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <StatCard
            label="Total Budget"
            value={`Rs. ${totalBudget.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Target className="w-5 h-5" />}
            delta="Monthly limit"
            tone="neutral"
          />

          <StatCard
            label="Total Spent"
            value={`Rs. ${totalSpent.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<TrendingDown className="w-5 h-5" />}
            delta={totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% of budget` : "No budget set"}
            tone={totalSpent > totalBudget ? "down" : "neutral"}
          />

          <StatCard
            label="Remaining"
            value={`Rs. ${totalRemaining.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="w-5 h-5" />}
            delta={totalRemaining >= 0 ? "Under budget" : "Over budget"}
            tone={totalRemaining >= 0 ? "up" : "down"}
          />
        </div>

      

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
          ) : dataError ? (
            <p className="text-red-400 text-center py-8">{dataError.message}</p>
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
                //@ts-ignore
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
                        <button
                          onClick={() => setEditingBudget({ id: budget.id, amount: budget.budget_amount })}
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
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Spent: <span className="text-red-400 font-semibold">Rs. {spent.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </span>
                        <span className="text-slate-400">
                          Budget: <span className="text-blue-400 font-semibold">Rs. {budget.budget_amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                          {remaining >= 0 ? `Rs. ${remaining.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} left` : `Rs. ${Math.abs(remaining).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} over`}
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

      {/* Add Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Add Custom Category</h3>
              <button
                onClick={() => setShowCategoryForm(false)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitCategory} className="space-y-4">
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
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  className="flex-1 py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition"
                >
                  Cancel
                </button>
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {showBudgetForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Add Budget</h3>
              <button
                onClick={() => setShowBudgetForm(false)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitBudget} className="space-y-4">
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
                  Budget Amount (Rs.)
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
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetForm(false)}
                  className="flex-1 py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition"
                >
                  Cancel
                </button>
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Budget</h3>
              <button
                onClick={() => setEditingBudget(null)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Budget Amount (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editingBudget.amount}
                  onChange={(e) => setEditingBudget({ ...editingBudget, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="flex-1 py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateBudget}
                  disabled={submitting}
                  className="flex-1 py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Budget"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl border border-red-500/30 shadow-2xl shadow-red-500/20 max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Error</h3>
            </div>
            <p className="text-slate-300 mb-6">{modalMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full py-3 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl border border-yellow-500/30 shadow-2xl shadow-yellow-500/20 max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-3 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletePending}
                className="flex-1 py-3 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30"
              >
                {deletePending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
