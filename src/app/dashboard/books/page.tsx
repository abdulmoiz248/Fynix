"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { BookOpen, FileText, TrendingUp, DollarSign, Calendar, Loader2, Download } from "lucide-react"

type DateFilter = "this_month" | "previous_month" | "previous_6_months" | "custom"

type AccountingReport = {
  type: "balance_sheet" | "income_statement" | "cash_flow" | "ledger" | "journal" | "trial_balance"
  title: string
  description: string
  icon: React.ReactNode
}

type JournalEntry = {
  id: string
  date: string
  description: string
  debit_account: string
  credit_account: string
  amount: number
}

type LedgerAccount = {
  account: string
  debits: number
  credits: number
  balance: number
}

type TrialBalanceEntry = {
  account: string
  debit: number
  credit: number
}

type BalanceSheetData = {
  assets: {
    current_assets: {
      cash: number
      accounts_receivable: number
      inventory: number
      total: number
    }
    non_current_assets: {
      investments: number
      total: number
    }
    total_assets: number
  }
  liabilities: {
    current_liabilities: {
      accounts_payable: number
      total: number
    }
    total_liabilities: number
  }
  equity: {
    retained_earnings: number
    total_equity: number
  }
}

type IncomeStatementData = {
  revenue: {
    sales: number
    dividends: number
    total_revenue: number
  }
  expenses: {
    operating_expenses: number
    trading_fees: number
    cgt: number
    total_expenses: number
  }
  net_income: number
}

type CashFlowData = {
  operating_activities: {
    cash_from_operations: number
    total: number
  }
  investing_activities: {
    investments_purchased: number
    investments_sold: number
    total: number
  }
  financing_activities: {
    total: number
  }
  net_cash_flow: number
  beginning_cash: number
  ending_cash: number
}

const reports: AccountingReport[] = [
  {
    type: "balance_sheet",
    title: "Balance Sheet",
    description: "View your company's assets, liabilities, and equity.",
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    type: "income_statement",
    title: "Income Statement",
    description: "Analyze your company's revenues and expenses.",
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    type: "cash_flow",
    title: "Cash Flow Statement",
    description: "Track your company's cash inflows and outflows.",
    icon: <DollarSign className="w-6 h-6" />,
  },
  {
    type: "ledger",
    title: "General Ledger",
    description: "Detailed account of all financial transactions.",
    icon: <FileText className="w-6 h-6" />,
  },
  {
    type: "journal",
    title: "Journal Entries",
    description: "List of all journal entries for your financial records.",
    icon: <FileText className="w-6 h-6" />,
  },
  {
    type: "trial_balance",
    title: "Trial Balance",
    description: "Check the equality of debits and credits in your accounts.",
    icon: <FileText className="w-6 h-6" />,
  },
]

export default function BooksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<DateFilter>("this_month")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (dateFilter) {
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case "previous_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case "previous_6_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        endDate = now
        break
      case "custom":
        if (!customStartDate || !customEndDate) return null
        startDate = new Date(customStartDate)
        endDate = new Date(customEndDate)
        break
      default:
        return null
    }

    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    }
  }

  const fetchReportData = async (reportType: string) => {
    setLoading(true)
    setSelectedReport(reportType)
    setReportData(null)

    const dateRange = getDateRange()
    if (!dateRange) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/books/${reportType}?startDate=${dateRange.start}&endDate=${dateRange.end}`)
      const data = await response.json()
      if (response.ok) {
        setReportData(data)
      } else {
        console.error("Error fetching report:", data.error)
      }
    } catch (error) {
      console.error("Error fetching report:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAccount = (account: string) => {
    const newExpanded = new Set(expandedAccounts)
    if (newExpanded.has(account)) {
      newExpanded.delete(account)
    } else {
      newExpanded.add(account)
    }
    setExpandedAccounts(newExpanded)
  }

  const formatCurrency = (amount: number) => {
   return "Rs." +( amount || 0).toFixed(2);
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const applyColorFallbacks = (doc: Document) => {
    const root = doc.documentElement
    const fallbackVars: Record<string, string> = {
      "--color-white": "rgb(255 255 255)",
      "--color-black": "rgb(0 0 0)",
      "--color-gray-50": "rgb(249 250 251)",
      "--color-gray-100": "rgb(243 244 246)",
      "--color-gray-200": "rgb(229 231 235)",
      "--color-gray-300": "rgb(209 213 219)",
      "--color-gray-400": "rgb(156 163 175)",
      "--color-gray-500": "rgb(107 114 128)",
      "--color-gray-600": "rgb(75 85 99)",
      "--color-gray-700": "rgb(55 65 81)",
      "--color-gray-800": "rgb(31 41 55)",
      "--color-gray-900": "rgb(17 24 39)",
      "--color-gray-950": "rgb(3 7 18)",
      "--color-slate-50": "rgb(248 250 252)",
      "--color-slate-100": "rgb(241 245 249)",
      "--color-slate-200": "rgb(226 232 240)",
      "--color-slate-300": "rgb(203 213 225)",
      "--color-slate-400": "rgb(148 163 184)",
      "--color-slate-500": "rgb(100 116 139)",
      "--color-slate-600": "rgb(71 85 105)",
      "--color-slate-700": "rgb(51 65 85)",
      "--color-slate-800": "rgb(30 41 59)",
      "--color-slate-900": "rgb(15 23 42)",
      "--color-slate-950": "rgb(2 6 23)",
      "--color-green-400": "rgb(74 222 128)",
      "--color-green-500": "rgb(34 197 94)",
      "--color-red-500": "rgb(239 68 68)",
      "--color-blue-500": "rgb(59 130 246)",
      "--color-yellow-500": "rgb(234 179 8)",
    }

    Object.entries(fallbackVars).forEach(([name, value]) => {
      root.style.setProperty(name, value)
    })
  }

  // html2canvas chokes on CSS Color 4 lab() values; strip them from style tags in the cloned document
  const sanitizeLabColors = (doc: Document) => {
    // Handle style tags
    doc.querySelectorAll("style").forEach((style) => {
      if (style.textContent?.includes("lab(")) {
        style.textContent = style.textContent.replace(/lab\([^)]*\)/gi, "rgb(0,0,0)")
      }
    })

    // Handle inline styles on elements
    doc.querySelectorAll("*").forEach((element) => {
      const htmlElement = element as HTMLElement
      const style = htmlElement.style
      
      // Check and replace inline styles
      for (let i = style.length - 1; i >= 0; i--) {
        const prop = style.item(i)
        const value = style.getPropertyValue(prop)
        if (value && value.includes("lab(")) {
          const priority = style.getPropertyPriority(prop)
          const newValue = value.replace(/lab\([^)]*\)/gi, "rgb(0,0,0)")
          style.setProperty(prop, newValue, priority)
        }
      }
      
      // Also check computed styles and force override if needed
      if (htmlElement.hasAttribute("style")) {
        const styleAttr = htmlElement.getAttribute("style")
        if (styleAttr && styleAttr.includes("lab(")) {
          htmlElement.setAttribute("style", styleAttr.replace(/lab\([^)]*\)/gi, "rgb(0,0,0)"))
        }
      }
    })

    // Some styles may live in CSSStyleSheet objects; ignore cross-origin sheets safely
    Array.from(doc.styleSheets).forEach((sheet) => {
      try {
        const rules = sheet.cssRules
        if (!rules) return
        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i]
          if (rule instanceof CSSStyleRule) {
            const style = rule.style
            for (let j = 0; j < style.length; j++) {
              const prop = style.item(j)
              const value = style.getPropertyValue(prop)
              if (value && value.includes("lab(")) {
                const priority = style.getPropertyPriority(prop)
                style.setProperty(prop, value.replace(/lab\([^)]*\)/gi, "rgb(0,0,0)"), priority)
              }
            }
          }
        }
      } catch (err) {
        // ignore CORS-protected stylesheets
      }
    })
  }

  const renderBalanceSheet = (data: BalanceSheetData) => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">Balance Sheet</h3>
        <p className="text-gray-400">As of {getDateRange()?.end}</p>
      </div>

      {/* Assets */}
      <div
        style={{ backgroundColor: "rgb(20, 20, 20)" }}
        className="rounded-lg p-6 shadow-lg border border-gray-800 backdrop-blur-md"
      >
        <h4 className="text-xl font-bold text-white mb-4">Assets</h4>

        <div className="space-y-3">
          <div className="pl-4">
            <h5 className="font-semibold text-gray-200 mb-2">Current Assets</h5>
            <div className="pl-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Cash & Cash Equivalents</span>
                <span className="font-mono text-white">{formatCurrency(data.assets.current_assets.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Accounts Receivable</span>
                <span className="font-mono text-white">
                  {formatCurrency(data.assets.current_assets.accounts_receivable)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Inventory</span>
                <span className="font-mono text-white">{formatCurrency(data.assets.current_assets.inventory)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-1 font-semibold">
                <span className="text-gray-200">Total Current Assets</span>
                <span className="font-mono text-white">{formatCurrency(data.assets.current_assets.total)}</span>
              </div>
            </div>
          </div>

          <div className="pl-4">
            <h5 className="font-semibold text-gray-200 mb-2">Non-Current Assets</h5>
            <div className="pl-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Investments</span>
                <span className="font-mono text-white">
                  {formatCurrency(data.assets.non_current_assets.investments)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-1 font-semibold">
                <span className="text-gray-200">Total Non-Current Assets</span>
                <span className="font-mono text-white">{formatCurrency(data.assets.non_current_assets.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between border-t-2 border-gray-600 pt-2 font-bold text-lg text-white">
            <span>Total Assets</span>
            <span className="font-mono">{formatCurrency(data.assets.total_assets)}</span>
          </div>
        </div>
      </div>

      {/* Liabilities */}
      <div
        style={{ backgroundColor: "rgb(20, 20, 20)" }}
        className="rounded-lg p-6 shadow-lg border border-gray-800 backdrop-blur-md"
      >
        <h4 className="text-xl font-bold text-white mb-4">Liabilities</h4>

        <div className="space-y-3">
          <div className="pl-4">
            <h5 className="font-semibold text-gray-200 mb-2">Current Liabilities</h5>
            <div className="pl-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Accounts Payable</span>
                <span className="font-mono text-white">
                  {formatCurrency(data.liabilities.current_liabilities.accounts_payable)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-1 font-semibold">
                <span className="text-gray-200">Total Current Liabilities</span>
                <span className="font-mono text-white">
                  {formatCurrency(data.liabilities.current_liabilities.total)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between border-t-2 border-gray-600 pt-2 font-bold text-lg text-white">
            <span>Total Liabilities</span>
            <span className="font-mono">{formatCurrency(data.liabilities.total_liabilities)}</span>
          </div>
        </div>
      </div>

      {/* Equity */}
      <div
        style={{ backgroundColor: "rgb(20, 20, 20)" }}
        className="rounded-lg p-6 shadow-lg border border-gray-800 backdrop-blur-md"
      >
        <h4 className="text-xl font-bold text-white mb-4">Equity</h4>

        <div className="space-y-3">
          <div className="pl-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Retained Earnings</span>
              <span className="font-mono text-white">{formatCurrency(data.equity.retained_earnings)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-1 font-bold text-lg text-white">
              <span>Total Equity</span>
              <span className="font-mono">{formatCurrency(data.equity.total_equity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Liabilities & Equity */}
      <div
        style={{ backgroundColor: "rgb(30, 30, 30)" }}
        className="rounded-lg p-6 border-2 border-gray-700 backdrop-blur-md"
      >
        <div className="flex justify-between items-center font-bold text-xl">
          <span className="text-white">Total Liabilities & Equity</span>
          <span className="font-mono text-white">
            {formatCurrency(data.liabilities.total_liabilities + data.equity.total_equity)}
          </span>
        </div>
      </div>
    </div>
  )

  const renderIncomeStatement = (data: IncomeStatementData) => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">Income Statement</h3>
        <p className="text-gray-400">
          Period: {getDateRange()?.start} to {getDateRange()?.end}
        </p>
      </div>

      {/* Revenue */}
      <div
        style={{ backgroundColor: "rgb(20, 20, 20)" }}
        className="rounded-lg p-6 shadow-lg border border-gray-800 backdrop-blur-md"
      >
        <h4 className="text-xl font-bold text-green-400 mb-4">Revenue</h4>
        <div className="space-y-2 pl-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Sales Revenue</span>
            <span className="font-mono text-white">{formatCurrency(data.revenue.sales)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Dividend Income</span>
            <span className="font-mono text-white">{formatCurrency(data.revenue.dividends)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-2 font-bold text-lg">
            <span className="text-gray-200">Total Revenue</span>
            <span className="font-mono text-green-400">{formatCurrency(data.revenue.total_revenue)}</span>
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div
        style={{ backgroundColor: "rgb(20, 20, 20)" }}
        className="rounded-lg p-6 shadow-lg border border-gray-800 backdrop-blur-md"
      >
        <h4 className="text-xl font-bold text-red-400 mb-4">Expenses</h4>
        <div className="space-y-2 pl-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Operating Expenses</span>
            <span className="font-mono text-white">{formatCurrency(data.expenses.operating_expenses)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Trading Fees</span>
            <span className="font-mono text-white">{formatCurrency(data.expenses.trading_fees)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Capital Gains Tax</span>
            <span className="font-mono text-white">{formatCurrency(data.expenses.cgt)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-2 font-bold text-lg">
            <span className="text-gray-200">Total Expenses</span>
            <span className="font-mono text-red-400">{formatCurrency(data.expenses.total_expenses)}</span>
          </div>
        </div>
      </div>

      {/* Net Income */}
      <div
        style={{ backgroundColor: data.net_income >= 0 ? "rgb(30, 40, 30)" : "rgb(40, 30, 30)" }}
        className={`rounded-lg p-6 border-2 backdrop-blur-md ${data.net_income >= 0 ? "border-green-700" : "border-red-700"}`}
      >
        <div className="flex justify-between items-center font-bold text-xl">
          <span className="text-white">Net Income</span>
          <span className={`font-mono ${data.net_income >= 0 ? "text-green-400" : "text-red-400"}`}>
            {formatCurrency(data.net_income)}
          </span>
        </div>
      </div>
    </div>
  )

  const renderCashFlow = (data: CashFlowData) => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">Cash Flow Statement</h3>
        <p className="text-gray-400">
          Period: {getDateRange()?.start} to {getDateRange()?.end}
        </p>
      </div>

      {/* Operating Activities */}
      <div
        style={{ backgroundColor: "rgb(20, 20, 20)" }}
        className="rounded-lg p-6 shadow-lg border border-gray-800 backdrop-blur-md"
      >
        <h4 className="text-xl font-bold text-white mb-4">Operating Activities</h4>
        <div className="space-y-2 pl-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Cash from Operations</span>
            <span className="font-mono text-white">
              {formatCurrency(data.operating_activities.cash_from_operations)}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-2 font-semibold">
            <span className="text-gray-200">Net Cash from Operating Activities</span>
            <span className="font-mono text-white">{formatCurrency(data.operating_activities.total)}</span>
          </div>
        </div>
      </div>

      {/* Investing Activities */}
      <div
        style={{ backgroundColor: "rgb(20, 20, 20)" }}
        className="rounded-lg p-6 shadow-lg border border-gray-800 backdrop-blur-md"
      >
        <h4 className="text-xl font-bold text-white mb-4">Investing Activities</h4>
        <div className="space-y-2 pl-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Purchase of Investments</span>
            <span className="font-mono text-red-400">
              ({formatCurrency(Math.abs(data.investing_activities.investments_purchased))})
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Proceeds from Sale of Investments</span>
            <span className="font-mono text-green-400">
              {formatCurrency(data.investing_activities.investments_sold)}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-2 font-semibold">
            <span className="text-gray-200">Net Cash from Investing Activities</span>
            <span className="font-mono text-white">{formatCurrency(data.investing_activities.total)}</span>
          </div>
        </div>
      </div>

      {/* Financing Activities */}
      <div
        style={{ backgroundColor: "rgb(20, 20, 20)" }}
        className="rounded-lg p-6 shadow-lg border border-gray-800 backdrop-blur-md"
      >
        <h4 className="text-xl font-bold text-white mb-4">Financing Activities</h4>
        <div className="space-y-2 pl-4">
          <div className="flex justify-between border-t border-gray-700 pt-2 font-semibold">
            <span className="text-gray-200">Net Cash from Financing Activities</span>
            <span className="font-mono text-white">{formatCurrency(data.financing_activities.total)}</span>
          </div>
        </div>
      </div>

      {/* Net Cash Flow */}
      <div
        style={{ backgroundColor: "rgb(30, 30, 30)" }}
        className="rounded-lg p-6 border-2 border-gray-700 backdrop-blur-md"
      >
        <div className="space-y-2">
          <div className="flex justify-between font-semibold text-lg">
            <span className="text-white">Net Increase/(Decrease) in Cash</span>
            <span className="font-mono text-white">{formatCurrency(data.net_cash_flow)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Cash at Beginning of Period</span>
            <span className="font-mono text-white">{formatCurrency(data.beginning_cash)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-gray-600 pt-2 font-bold text-xl">
            <span className="text-white">Cash at End of Period</span>
            <span className="font-mono text-white">{formatCurrency(data.ending_cash)}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLedger = (data: LedgerAccount[]) => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">General Ledger</h3>
        <p className="text-gray-400">
          Period: {getDateRange()?.start} to {getDateRange()?.end}
        </p>
      </div>

      <div
        style={{ backgroundColor: "rgb(20, 20, 20)" }}
        className="rounded-lg shadow-lg border border-gray-800 overflow-hidden backdrop-blur-md"
      >
        <table className="min-w-full divide-y divide-gray-800">
          <thead style={{ backgroundColor: "rgb(30, 30, 30)" }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Debits
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Balance
              </th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: "rgb(20, 20, 20)" }} className="divide-y divide-gray-800">
            {data.map((account, index) => (
              <tr key={index} style={{ backgroundColor: "rgb(20, 20, 20)" }} className="hover:bg-gray-900">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{account.account}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-white">
                  {formatCurrency(account.debits)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-white">
                  {formatCurrency(account.credits)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-white">
                  {formatCurrency(account.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderJournal = (data: JournalEntry[]) => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">Journal Entries</h3>
        <p className="text-gray-400">
          Period: {getDateRange()?.start} to {getDateRange()?.end}
        </p>
      </div>

      <div className="space-y-4">
        {data.map((entry, index) => (
          <div
            key={index}
            style={{ backgroundColor: "rgb(20, 20, 20)" }}
            className="rounded-lg p-4 border border-gray-800 backdrop-blur-md"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-white font-semibold">{entry.description}</p>
                <p className="text-gray-400 text-sm">{formatDate(entry.date)}</p>
              </div>
              <p className="text-white font-mono">{formatCurrency(entry.amount)}</p>
            </div>
            <div className="space-y-1 pl-4 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Debit: {entry.debit_account}</span>
                <span className="font-mono text-white">{formatCurrency(entry.amount)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Credit: {entry.credit_account}</span>
                <span className="font-mono text-white">{formatCurrency(entry.amount)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderTrialBalance = (data: TrialBalanceEntry[]) => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">Trial Balance</h3>
        <p className="text-gray-400">As of {getDateRange()?.end}</p>
      </div>

      <div
        style={{ backgroundColor: "rgb(20, 20, 20)" }}
        className="rounded-lg shadow-lg border border-gray-800 overflow-hidden backdrop-blur-md"
      >
        <table className="min-w-full divide-y divide-gray-800">
          <thead style={{ backgroundColor: "rgb(30, 30, 30)" }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Debit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Credit
              </th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: "rgb(20, 20, 20)" }} className="divide-y divide-gray-800">
            {data.map((entry, index) => (
              <tr key={index} style={{ backgroundColor: "rgb(20, 20, 20)" }} className="hover:bg-gray-900">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{entry.account}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-white">
                  {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-white">
                  {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const downloadPDF = async () => {
    if (!reportRef.current || !selectedReport) return

    setDownloadingPdf(true)
    try {
      const { default: html2canvas } = await import("html2canvas")
      const { default: jsPDF } = await import("jspdf")

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "rgb(10, 10, 10)",
        scale: 2,
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          return false
        },
        // html2canvas does not understand CSS Color 4 lab() values; provide rgb fallbacks before rendering
        onclone: (clonedDoc) => {
          applyColorFallbacks(clonedDoc)
          sanitizeLabColors(clonedDoc)
          // Force a second pass to catch any remaining lab() values
          sanitizeLabColors(clonedDoc)
        },
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 10

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 30

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight - 30
      }

      pdf.save(`${selectedReport}-${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (status === "loading")
    return <div className="flex items-center justify-center h-screen text-white">Loading...</div>
  if (status === "unauthenticated") {
    router.push("/")
    return null
  }

  return (
    <div style={{ backgroundColor: "rgb(10, 10, 10)" }} className="min-h-screen">
    

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
           <div className="mb-8 p-6 rounded-xl border border-slate-700/50 bg-linear-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-sm">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div>
                     <h2 className="text-lg font-bold text-white mb-1">Quick Actions</h2>
                     <p className="text-sm text-slate-400">Change and manage your time period</p>
                   </div>
                   <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                style={{ backgroundColor: "rgb(30, 30, 30)" }}
                className="text-white border border-gray-700 rounded px-3 py-2 text-sm"
              >
                <option value="this_month">This Month</option>
                <option value="previous_month">Previous Month</option>
                <option value="previous_6_months">Last 6 Months</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {dateFilter === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ backgroundColor: "rgb(30, 30, 30)" }}
                  className="text-white border border-gray-700 rounded px-3 py-2 text-sm"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ backgroundColor: "rgb(30, 30, 30)" }}
                  className="text-white border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
                   </div>
                 </div>
               </div>

        {/* Report Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {reports.map((report) => (
            <button
              key={report.type}
              onClick={() => fetchReportData(report.type)}
              style={{
                backgroundColor: selectedReport === report.type ? "rgb(30, 30, 30)" : "rgb(20, 20, 20)",
                borderColor: selectedReport === report.type ? "rgb(60, 60, 60)" : "rgb(40, 40, 40)",
              }}
              className="p-4 rounded-lg border-2 transition-all duration-200 hover:border-gray-600 text-left group backdrop-blur-md"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="text-white group-hover:scale-110 transition-transform">{report.icon}</div>
                <h3 className="font-semibold text-white">{report.title}</h3>
              </div>
              <p className="text-sm text-gray-400">{report.description}</p>
            </button>
          ))}
        </div>

       

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Report Display */}
        {reportData && !loading && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Report Preview</h3>
              <button
                onClick={downloadPDF}
                disabled={downloadingPdf}
                style={{
                  backgroundColor: "rgb(0, 0, 0)",
                  borderColor: "rgb(80, 80, 80)",
                }}
                className="flex items-center gap-2 px-4 py-2 rounded border text-white font-medium hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download PDF
                  </>
                )}
              </button>
            </div>

            <div
              ref={reportRef}
              style={{ backgroundColor: "rgb(10, 10, 10)" }}
              className="rounded-lg p-8 border border-gray-800"
            >
              <div className="mb-8 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <img src="/logo.png" alt="Fynix" className="w-8 h-8 rounded" />
                  <span className="text-white font-bold">Fynix</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Generated on{" "}
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {selectedReport === "balance_sheet" && renderBalanceSheet(reportData)}
              {selectedReport === "income_statement" && renderIncomeStatement(reportData)}
              {selectedReport === "cash_flow" && renderCashFlow(reportData)}
              {selectedReport === "ledger" && renderLedger(reportData)}
              {selectedReport === "journal" && renderJournal(reportData)}
              {selectedReport === "trial_balance" && renderTrialBalance(reportData)}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
