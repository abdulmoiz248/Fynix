"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, LogOut, Mail, Receipt, PieChart } from "lucide-react";

type EmailMessage = {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

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

    loadEmails();
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
