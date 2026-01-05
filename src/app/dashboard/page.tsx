"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, LogOut, Mail, Receipt, PieChart, BookOpen, Repeat, Plus, X, Calendar, DollarSign, Loader2, Trash2, CheckCircle } from "lucide-react";

type EmailMessage = {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
};

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    amount: "",
    frequency: "monthly",
    next_payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (status !== "authenticated") return;

    const loadEmails = async () => {
      try {
        setEmailsLoading(true);
        setEmailError(null);

        const response = await fetch("/api/gmail/recent", { cache: "no-store" });
        const payload = (await response.json()) as { messages?: EmailMessage[]; error?: string };

        if (!response.ok || payload.error) {
          throw new Error(payload.error || "Unable to load inbox");
        }

        setEmails(payload.messages ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        setEmailError(message);
      } finally {
        setEmailsLoading(false);
      }
    };

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

    loadEmails();
    loadRecurringPayments();
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/signup");
  }

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
        setFormData({
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Fynix Dashboard
            </h1>
            <p className="text-sm text-slate-400">Welcome, {session?.user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/transactions"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 transition text-blue-300"
            >
              <Receipt className="w-4 h-4" />
              Transactions
            </Link>
            <Link
              href="/dashboard/invoices"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 transition text-orange-300"
            >
              <Receipt className="w-4 h-4" />
              Invoices
            </Link>
            <Link
              href="/dashboard/stocks"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 transition text-green-300"
            >
              <TrendingUp className="w-4 h-4" />
              Stocks
            </Link>
            <Link
              href="/dashboard/mutualfunds"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 transition text-purple-300"
            >
              <PieChart className="w-4 h-4" />
              Mutual Funds
            </Link>
            <Link
              href="/dashboard/books"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 transition text-cyan-300"
            >
              <BookOpen className="w-4 h-4" />
              Books
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition text-slate-300"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-2">Welcome to Fynix!</h2>
          <p className="text-slate-400">
            Your AI-powered finance assistant is ready to help you manage your finances smarter. 
            {session?.user?.email && ` Connected with ${session.user.email}`}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400">Total Balance</h3>
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold">$0.00</p>
            <p className="text-sm text-slate-500 mt-2">Connect your accounts to see data</p>
          </div>

          <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400">Monthly Income</h3>
              <ArrowDownLeft className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">$0.00</p>
            <p className="text-sm text-slate-500 mt-2">Track from Gmail emails</p>
          </div>

          <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400">Monthly Expenses</h3>
              <ArrowUpRight className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold">$0.00</p>
            <p className="text-sm text-slate-500 mt-2">Analyzed from transactions</p>
          </div>

          <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400">Savings Rate</h3>
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold">0%</p>
            <p className="text-sm text-slate-500 mt-2">Your financial health</p>
          </div>
        </div>

        {/* Recent Inbox */}
        <div className="mb-8 p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-300" />
              <h3 className="text-xl font-bold">Recent Gmail Inbox</h3>
            </div>
            {session?.user?.email && <p className="text-sm text-slate-400">Connected as {session.user.email}</p>}
          </div>

          {emailError && <p className="text-sm text-red-400 mb-3">{emailError}</p>}

          <div className="space-y-3">
            {emailsLoading && (
              <div className="space-y-2">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="h-14 rounded-md bg-slate-900/50 border border-slate-800/70 animate-pulse"
                  ></div>
                ))}
              </div>
            )}

            {!emailsLoading && !emailError && emails.length === 0 && (
              <p className="text-sm text-slate-400">No recent emails found.</p>
            )}

            {!emailsLoading && emails.length > 0 && (
              <ul className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-md bg-slate-900/40">
                {emails.map((email) => (
                  <li key={email.id} className="p-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-semibold text-slate-100 line-clamp-1">{email.subject}</p>
                        <p className="text-sm text-slate-400 line-clamp-2">{email.snippet}</p>
                        <p className="text-xs text-slate-500 mt-1">From: {email.from || "Unknown"}</p>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">{email.date}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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

        {/* Add Modal */}
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
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
                    value={formData.next_payment_date}
                    onChange={(e) =>
                      setFormData({ ...formData, next_payment_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

        {/* Features Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4">Connected Services</h3>
            <div className="space-y-3">
              <div className="p-3 rounded bg-slate-900/50 border border-slate-700/30">
                <p className="font-semibold text-green-400">✓ Gmail</p>
                <p className="text-sm text-slate-400">Connected</p>
              </div>
              <div className="p-3 rounded bg-slate-900/50 border border-slate-700/30">
                <p className="font-semibold text-slate-400">○ Bank Accounts</p>
                <p className="text-sm text-slate-500">Coming soon</p>
              </div>
              <div className="p-3 rounded bg-slate-900/50 border border-slate-700/30">
                <p className="font-semibold text-slate-400">○ Investments</p>
                <p className="text-sm text-slate-500">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4">AI Insights</h3>
            <div className="space-y-3 text-slate-400">
              <div className="p-3 rounded bg-slate-900/50 border border-slate-700/30">
                <p className="text-sm">📊 Spending patterns will be analyzed from your emails</p>
              </div>
              <div className="p-3 rounded bg-slate-900/50 border border-slate-700/30">
                <p className="text-sm">💡 Smart recommendations based on your financial behavior</p>
              </div>
              <div className="p-3 rounded bg-slate-900/50 border border-slate-700/30">
                <p className="text-sm">🎯 Personalized budgeting tips and savings opportunities</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
