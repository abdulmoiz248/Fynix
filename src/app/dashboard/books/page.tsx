"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  FileText, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Download,
  Loader2,
  ChevronDown,
  ChevronRight
} from "lucide-react";

type DateFilter = "this_month" | "previous_month" | "previous_6_months" | "custom";

type AccountingReport = {
  type: "balance_sheet" | "income_statement" | "cash_flow" | "ledger" | "journal" | "trial_balance";
  title: string;
  description: string;
  icon: React.ReactNode;
};

type JournalEntry = {
  id: string;
  date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
};

type LedgerAccount = {
  account: string;
  debits: number;
  credits: number;
  balance: number;
};

type TrialBalanceEntry = {
  account: string;
  debit: number;
  credit: number;
};

type BalanceSheetData = {
  assets: {
    current_assets: {
      cash: number;
      accounts_receivable: number;
      inventory: number;
      total: number;
    };
    non_current_assets: {
      investments: number;
      total: number;
    };
    total_assets: number;
  };
  liabilities: {
    current_liabilities: {
      accounts_payable: number;
      total: number;
    };
    total_liabilities: number;
  };
  equity: {
    retained_earnings: number;
    total_equity: number;
  };
};

type IncomeStatementData = {
  revenue: {
    sales: number;
    dividends: number;
    total_revenue: number;
  };
  expenses: {
    operating_expenses: number;
    trading_fees: number;
    cgt: number;
    total_expenses: number;
  };
  net_income: number;
};

type CashFlowData = {
  operating_activities: {
    cash_from_operations: number;
    total: number;
  };
  investing_activities: {
    investments_purchased: number;
    investments_sold: number;
    total: number;
  };
  financing_activities: {
    total: number;
  };
  net_cash_flow: number;
  beginning_cash: number;
  ending_cash: number;
};

export default function BooksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const reports: AccountingReport[] = [
    {
      type: "balance_sheet",
      title: "Balance Sheet",
      description: "Assets, liabilities, and equity at a point in time",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      type: "income_statement",
      title: "Income Statement (P&L)",
      description: "Revenue, expenses, and net profit/loss over a period",
      icon: <TrendingUp className="w-6 h-6" />,
    },
    {
      type: "cash_flow",
      title: "Cash Flow Statement",
      description: "Cash inflows and outflows from operations, investing, and financing",
      icon: <DollarSign className="w-6 h-6" />,
    },
    {
      type: "ledger",
      title: "General Ledger",
      description: "Book of all accounts with debits and credits",
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      type: "journal",
      title: "Journal Entries",
      description: "Chronological record of all transactions",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      type: "trial_balance",
      title: "Trial Balance",
      description: "Totals of debits and credits from the ledger",
      icon: <FileText className="w-6 h-6" />,
    },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dateFilter) {
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "previous_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "previous_6_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        endDate = now;
        break;
      case "custom":
        if (!customStartDate || !customEndDate) return null;
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        break;
      default:
        return null;
    }

    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  };

  const fetchReportData = async (reportType: string) => {
    setLoading(true);
    setSelectedReport(reportType);
    setReportData(null);

    const dateRange = getDateRange();
    if (!dateRange) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/books/${reportType}?startDate=${dateRange.start}&endDate=${dateRange.end}`
      );
      const data = await response.json();
      if (response.ok) {
        setReportData(data);
      } else {
        console.error("Error fetching report:", data.error);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccount = (account: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(account)) {
      newExpanded.delete(account);
    } else {
      newExpanded.add(account);
    }
    setExpandedAccounts(newExpanded);
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

  const renderBalanceSheet = (data: BalanceSheetData) => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900">Balance Sheet</h3>
        <p className="text-gray-600">As of {getDateRange()?.end}</p>
      </div>

      {/* Assets */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h4 className="text-xl font-bold text-gray-900 mb-4">Assets</h4>
        
        <div className="space-y-3">
          <div className="pl-4">
            <h5 className="font-semibold text-gray-700 mb-2">Current Assets</h5>
            <div className="pl-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cash & Cash Equivalents</span>
                <span className="font-mono">{formatCurrency(data.assets.current_assets.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accounts Receivable</span>
                <span className="font-mono">{formatCurrency(data.assets.current_assets.accounts_receivable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inventory</span>
                <span className="font-mono">{formatCurrency(data.assets.current_assets.inventory)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Total Current Assets</span>
                <span className="font-mono">{formatCurrency(data.assets.current_assets.total)}</span>
              </div>
            </div>
          </div>

          <div className="pl-4">
            <h5 className="font-semibold text-gray-700 mb-2">Non-Current Assets</h5>
            <div className="pl-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Investments</span>
                <span className="font-mono">{formatCurrency(data.assets.non_current_assets.investments)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Total Non-Current Assets</span>
                <span className="font-mono">{formatCurrency(data.assets.non_current_assets.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between border-t-2 border-gray-800 pt-2 font-bold text-lg">
            <span>Total Assets</span>
            <span className="font-mono">{formatCurrency(data.assets.total_assets)}</span>
          </div>
        </div>
      </div>

      {/* Liabilities */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h4 className="text-xl font-bold text-gray-900 mb-4">Liabilities</h4>
        
        <div className="space-y-3">
          <div className="pl-4">
            <h5 className="font-semibold text-gray-700 mb-2">Current Liabilities</h5>
            <div className="pl-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Accounts Payable</span>
                <span className="font-mono">{formatCurrency(data.liabilities.current_liabilities.accounts_payable)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Total Current Liabilities</span>
                <span className="font-mono">{formatCurrency(data.liabilities.current_liabilities.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between border-t-2 border-gray-800 pt-2 font-bold text-lg">
            <span>Total Liabilities</span>
            <span className="font-mono">{formatCurrency(data.liabilities.total_liabilities)}</span>
          </div>
        </div>
      </div>

      {/* Equity */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h4 className="text-xl font-bold text-gray-900 mb-4">Equity</h4>
        
        <div className="space-y-3">
          <div className="pl-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Retained Earnings</span>
              <span className="font-mono">{formatCurrency(data.equity.retained_earnings)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-bold text-lg">
              <span>Total Equity</span>
              <span className="font-mono">{formatCurrency(data.equity.total_equity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Liabilities & Equity */}
      <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
        <div className="flex justify-between items-center font-bold text-xl">
          <span>Total Liabilities & Equity</span>
          <span className="font-mono text-blue-900">
            {formatCurrency(data.liabilities.total_liabilities + data.equity.total_equity)}
          </span>
        </div>
      </div>
    </div>
  );

  const renderIncomeStatement = (data: IncomeStatementData) => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900">Income Statement</h3>
        <p className="text-gray-600">
          Period: {getDateRange()?.start} to {getDateRange()?.end}
        </p>
      </div>

      {/* Revenue */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h4 className="text-xl font-bold text-green-700 mb-4">Revenue</h4>
        <div className="space-y-2 pl-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Sales Revenue</span>
            <span className="font-mono">{formatCurrency(data.revenue.sales)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Dividend Income</span>
            <span className="font-mono">{formatCurrency(data.revenue.dividends)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-lg">
            <span>Total Revenue</span>
            <span className="font-mono text-green-600">{formatCurrency(data.revenue.total_revenue)}</span>
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h4 className="text-xl font-bold text-red-700 mb-4">Expenses</h4>
        <div className="space-y-2 pl-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Operating Expenses</span>
            <span className="font-mono">{formatCurrency(data.expenses.operating_expenses)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Trading Fees</span>
            <span className="font-mono">{formatCurrency(data.expenses.trading_fees)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Capital Gains Tax</span>
            <span className="font-mono">{formatCurrency(data.expenses.cgt)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-lg">
            <span>Total Expenses</span>
            <span className="font-mono text-red-600">{formatCurrency(data.expenses.total_expenses)}</span>
          </div>
        </div>
      </div>

      {/* Net Income */}
      <div className={`rounded-lg p-6 border-2 ${data.net_income >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex justify-between items-center font-bold text-xl">
          <span>Net Income</span>
          <span className={`font-mono ${data.net_income >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(data.net_income)}
          </span>
        </div>
      </div>
    </div>
  );

  const renderCashFlow = (data: CashFlowData) => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900">Cash Flow Statement</h3>
        <p className="text-gray-600">
          Period: {getDateRange()?.start} to {getDateRange()?.end}
        </p>
      </div>

      {/* Operating Activities */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h4 className="text-xl font-bold text-gray-900 mb-4">Operating Activities</h4>
        <div className="space-y-2 pl-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cash from Operations</span>
            <span className="font-mono">{formatCurrency(data.operating_activities.cash_from_operations)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Net Cash from Operating Activities</span>
            <span className="font-mono">{formatCurrency(data.operating_activities.total)}</span>
          </div>
        </div>
      </div>

      {/* Investing Activities */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h4 className="text-xl font-bold text-gray-900 mb-4">Investing Activities</h4>
        <div className="space-y-2 pl-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Purchase of Investments</span>
            <span className="font-mono text-red-600">({formatCurrency(Math.abs(data.investing_activities.investments_purchased))})</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Proceeds from Sale of Investments</span>
            <span className="font-mono text-green-600">{formatCurrency(data.investing_activities.investments_sold)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Net Cash from Investing Activities</span>
            <span className="font-mono">{formatCurrency(data.investing_activities.total)}</span>
          </div>
        </div>
      </div>

      {/* Financing Activities */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h4 className="text-xl font-bold text-gray-900 mb-4">Financing Activities</h4>
        <div className="space-y-2 pl-4">
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Net Cash from Financing Activities</span>
            <span className="font-mono">{formatCurrency(data.financing_activities.total)}</span>
          </div>
        </div>
      </div>

      {/* Net Cash Flow */}
      <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
        <div className="space-y-2">
          <div className="flex justify-between font-semibold text-lg">
            <span>Net Increase/(Decrease) in Cash</span>
            <span className="font-mono">{formatCurrency(data.net_cash_flow)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cash at Beginning of Period</span>
            <span className="font-mono">{formatCurrency(data.beginning_cash)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-blue-300 pt-2 font-bold text-xl">
            <span>Cash at End of Period</span>
            <span className="font-mono text-blue-900">{formatCurrency(data.ending_cash)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLedger = (data: LedgerAccount[]) => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900">General Ledger</h3>
        <p className="text-gray-600">
          Period: {getDateRange()?.start} to {getDateRange()?.end}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Debits
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((account, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {account.account}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                  {formatCurrency(account.debits)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                  {formatCurrency(account.credits)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-semibold ${
                  account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(account.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderJournal = (data: JournalEntry[]) => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900">Journal Entries</h3>
        <p className="text-gray-600">
          Period: {getDateRange()?.start} to {getDateRange()?.end}
        </p>
      </div>

      <div className="space-y-4">
        {data.map((entry) => (
          <div key={entry.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs text-gray-500 uppercase">Journal Entry</span>
                <p className="text-sm font-medium text-gray-900">{entry.description}</p>
              </div>
              <span className="text-sm text-gray-500">{formatDate(entry.date)}</span>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Debit: {entry.debit_account}</span>
                <span className="font-mono font-semibold">{formatCurrency(entry.amount)}</span>
              </div>
              <div className="flex justify-between text-sm pl-8">
                <span className="text-gray-600">Credit: {entry.credit_account}</span>
                <span className="font-mono font-semibold">{formatCurrency(entry.amount)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTrialBalance = (data: TrialBalanceEntry[]) => {
    const totalDebits = data.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = data.reduce((sum, entry) => sum + entry.credit, 0);

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900">Trial Balance</h3>
          <p className="text-gray-600">As of {getDateRange()?.end}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.account}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                  {formatCurrency(totalDebits)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                  {formatCurrency(totalCredits)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {Math.abs(totalDebits - totalCredits) < 0.01 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-semibold">✓ Books are balanced!</p>
            <p className="text-sm text-green-600">Total Debits = Total Credits</p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800 font-semibold">⚠ Books are not balanced!</p>
            <p className="text-sm text-red-600">
              Difference: {formatCurrency(Math.abs(totalDebits - totalCredits))}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounting Books</h1>
        <p className="text-gray-600">Generate financial statements and accounting reports</p>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Select Period
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setDateFilter("this_month")}
            className={`px-4 py-3 rounded-lg border-2 transition-colors ${
              dateFilter === "this_month"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateFilter("previous_month")}
            className={`px-4 py-3 rounded-lg border-2 transition-colors ${
              dateFilter === "previous_month"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            Previous Month
          </button>
          <button
            onClick={() => setDateFilter("previous_6_months")}
            className={`px-4 py-3 rounded-lg border-2 transition-colors ${
              dateFilter === "previous_6_months"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            Previous 6 Months
          </button>
          <button
            onClick={() => setDateFilter("custom")}
            className={`px-4 py-3 rounded-lg border-2 transition-colors ${
              dateFilter === "custom"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            Custom Period
          </button>
        </div>

        {dateFilter === "custom" && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {reports.map((report) => (
          <button
            key={report.type}
            onClick={() => fetchReportData(report.type)}
            disabled={loading || (dateFilter === "custom" && (!customStartDate || !customEndDate))}
            className={`bg-white rounded-lg p-6 shadow-sm border-2 transition-all hover:shadow-md ${
              selectedReport === report.type
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                selectedReport === report.type ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
              }`}>
                {report.icon}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Report Display */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Generating report...</p>
        </div>
      )}

      {!loading && reportData && (
        <div className="bg-gray-50 rounded-lg shadow-sm p-8 border border-gray-200">
          {selectedReport === "balance_sheet" && renderBalanceSheet(reportData)}
          {selectedReport === "income_statement" && renderIncomeStatement(reportData)}
          {selectedReport === "cash_flow" && renderCashFlow(reportData)}
          {selectedReport === "ledger" && renderLedger(reportData)}
          {selectedReport === "journal" && renderJournal(reportData)}
          {selectedReport === "trial_balance" && renderTrialBalance(reportData)}
        </div>
      )}
    </div>
  );
}
