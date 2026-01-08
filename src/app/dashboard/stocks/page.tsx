"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  DollarSign,
  Loader2,
  Gift,
  BarChart3,
  History,
  X,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatsCard";

type Stock = {
  id: string;
  symbol: string;
  company_name: string;
  total_shares: number;
  avg_buy_price: number;
  total_invested: number;
  current_price: number;
  current_value: number;
  profit_loss: number;
};

type PSXStock = {
  symbol: string;
  company_name: string;
  sector: string;
  current_price: number;
};

type Dividend = {
  id: string;
  symbol: string;
  company_name: string;
  amount: number;
  dividend_date: string;
  description: string;
};

type StockTransaction = {
  id: string;
  symbol: string;
  company_name: string;
  transaction_type: string;
  shares: string;
  price_per_share: string;
  total_amount: string;
  profit_loss: string;
  transaction_date: string;
  created_at: string;
};

type CashAccount = {
  balance: number;
};

type TradingFee = {
  id: string;
  fee_type: string;
  amount: string;
  description: string | null;
  fee_date: string;
};

type FeesSummary = {
  broker_charges: number;
  cgt: number;
  other_fees: number;
  total_fees: number;
};

export default function StocksPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [psxStocks, setPsxStocks] = useState<PSXStock[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [fees, setFees] = useState<TradingFee[]>([]);
  const [feesSummary, setFeesSummary] = useState<FeesSummary>({
    broker_charges: 0,
    cgt: 0,
    other_fees: 0,
    total_fees: 0,
  });
  const [cashAccount, setCashAccount] = useState<CashAccount>({ balance: 0 });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"portfolio" | "dividends" | "history" | "fees" | "psx-symbols">("portfolio");
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [showSellForm, setShowSellForm] = useState(false);
  const [showDividendForm, setShowDividendForm] = useState(false);
  const [showCashForm, setShowCashForm] = useState(false);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [showPSXSymbolForm, setShowPSXSymbolForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  
  // Validation error states
  const [buyError, setBuyError] = useState("");
  const [sellError, setSellError] = useState("");
  const [dividendError, setDividendError] = useState("");
  const [cashError, setCashError] = useState("");
  const [feeError, setFeeError] = useState("");

  const [buyForm, setBuyForm] = useState({
    symbol: "",
    shares: "",
    price_per_share: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const [sellForm, setSellForm] = useState({
    symbol: "",
    shares: "",
    price_per_share: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const [dividendForm, setDividendForm] = useState({
    symbol: "",
    amount: "",
    dividend_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [cashForm, setCashForm] = useState({
    amount: "",
    type: "deposit" as "deposit" | "withdraw",
  });

  const [feeForm, setFeeForm] = useState({
    fee_type: "broker_charge" as "broker_charge" | "cgt" | "other",
    amount: "",
    description: "",
    fee_date: new Date().toISOString().split("T")[0],
  });

  const [psxSymbolForm, setPsxSymbolForm] = useState({
    symbol: "",
    company_name: "",
    sector: "",
    current_price: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stocksRes, psxRes, dividendsRes, transactionsRes, feesRes, cashRes] = await Promise.all([
        fetch("/api/stocks"),
        fetch("/api/psx-stocks"),
        fetch("/api/dividends"),
        fetch("/api/stock-transactions"),
        fetch("/api/trading-fees"),
        fetch("/api/cash-account"),
      ]);

      const [stocksData, psxData, dividendsData, transactionsData, feesData, cashData] = await Promise.all([
        stocksRes.json(),
        psxRes.json(),
        dividendsRes.json(),
        transactionsRes.json(),
        feesRes.json(),
        cashRes.json(),
      ]);

      setStocks(stocksData.stocks || []);
      setPsxStocks(psxData.stocks || []);
      setDividends(dividendsData.dividends || []);
      setTransactions(transactionsData.transactions || []);
      setFees(feesData.fees || []);
      setFeesSummary(feesData.summary || { broker_charges: 0, cgt: 0, other_fees: 0, total_fees: 0 });
      setCashAccount(cashData.cashAccount || { balance: 0 });
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateBuyForm = () => {
    if (!buyForm.symbol) {
      setBuyError("Please select a stock symbol");
      return false;
    }
    if (!buyForm.shares || parseFloat(buyForm.shares) <= 0) {
      setBuyError("Please enter a valid number of shares");
      return false;
    }
    if (!buyForm.price_per_share || parseFloat(buyForm.price_per_share) <= 0) {
      setBuyError("Please enter a valid price per share");
      return false;
    }
    
    const totalCost = parseFloat(buyForm.shares) * parseFloat(buyForm.price_per_share);
    if (cashAccount.balance < totalCost) {
      setBuyError(`Insufficient balance. You need Rs. ${totalCost.toFixed(2)} but have Rs. ${cashAccount.balance.toFixed(2)}`);
      return false;
    }
    
    setBuyError("");
    return true;
  };

  const validateSellForm = () => {
   
    if (!sellForm.price_per_share || parseFloat(sellForm.price_per_share) <= 0) {
      setSellError("Please enter a valid price per share");
      return false;
    }
    
    const stock = stocks.find(s => s.symbol === sellForm.symbol);
    if (!stock || stock.total_shares < parseFloat(sellForm.shares)) {
      const available = stock ? stock.total_shares : 0;
      setSellError(`You only have ${available} shares available, but trying to sell ${sellForm.shares}`);
      return false;
    }
    
    setSellError("");
    return true;
  };

  const validateDividendForm = () => {
    if (!dividendForm.symbol) {
      setDividendError("Please select a stock symbol");
      return false;
    }
    if (!dividendForm.amount || parseFloat(dividendForm.amount) <= 0) {
      setDividendError("Please enter a valid dividend amount");
      return false;
    }
    
    setDividendError("");
    return true;
  };

  const validateCashForm = () => {
    if (!cashForm.amount || parseFloat(cashForm.amount) <= 0) {
      setCashError("Please enter a valid amount");
      return false;
    }
    
    if (cashForm.type === "withdraw" && cashAccount.balance < parseFloat(cashForm.amount)) {
      setCashError(`Insufficient balance. You have Rs. ${cashAccount.balance.toFixed(2)}`);
      return false;
    }
    
    setCashError("");
    return true;
  };

  const validateFeeForm = () => {
    if (!feeForm.amount || parseFloat(feeForm.amount) <= 0) {
      setFeeError("Please enter a valid fee amount");
      return false;
    }
    
    setFeeError("");
    return true;
  };

  const handleBuyStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateBuyForm()) {
      return;
    }
    
    setSubmitting(true);

    try {
      const response = await fetch("/api/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: buyForm.symbol,
          shares: parseFloat(buyForm.shares),
          price_per_share: parseFloat(buyForm.price_per_share),
          transaction_date: buyForm.transaction_date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to buy stock");
      }

      setBuyForm({
        symbol: "",
        shares: "",
        price_per_share: "",
        transaction_date: new Date().toISOString().split("T")[0],
      });
      setBuyError("");
      setShowBuyForm(false);
      await loadData();
      setModalMessage("Stock purchased successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : "Failed to buy stock");
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSellStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSellForm()) {
      return;
    }
    
    setSubmitting(true);

    try {
      const response = await fetch("/api/stocks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: sellForm.symbol,
          shares: parseFloat(sellForm.shares),
          price_per_share: parseFloat(sellForm.price_per_share),
          transaction_date: sellForm.transaction_date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sell stock");
      }

      setModalMessage(`Sold successfully! Profit/Loss: Rs. ${data.profit_loss?.toFixed(2)}`);
      setShowSuccessModal(true);
      
      setSellForm({
        symbol: "",
        shares: "",
        price_per_share: "",
        transaction_date: new Date().toISOString().split("T")[0],
      });
      setSellError("");
      setShowSellForm(false);
      await loadData();
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : "Failed to sell stock");
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDividend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDividendForm()) {
      return;
    }
    
    setSubmitting(true);

    try {
      const response = await fetch("/api/dividends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: dividendForm.symbol,
          amount: parseFloat(dividendForm.amount),
          dividend_date: dividendForm.dividend_date,
          description: dividendForm.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add dividend");
      }

      setDividendForm({
        symbol: "",
        amount: "",
        dividend_date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setDividendError("");
      setShowDividendForm(false);
      await loadData();
      setModalMessage("Dividend added successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : "Failed to add dividend");
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCashOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCashForm()) {
      return;
    }
    
    setSubmitting(true);

    try {
      const response = await fetch("/api/cash-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(cashForm.amount),
          type: cashForm.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update cash account");
      }

      setCashForm({ amount: "", type: "deposit" });
      setCashError("");
      setShowCashForm(false);
      await loadData();
      setModalMessage(`Cash ${cashForm.type} successful!`);
      setShowSuccessModal(true);
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : "Failed to update cash account");
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateFeeForm()) {
      return;
    }
    
    setSubmitting(true);

    try {
      const response = await fetch("/api/trading-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fee_type: feeForm.fee_type,
          amount: parseFloat(feeForm.amount),
          description: feeForm.description || null,
          fee_date: feeForm.fee_date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add fee");
      }

      setFeeForm({
        fee_type: "broker_charge",
        amount: "",
        description: "",
        fee_date: new Date().toISOString().split("T")[0],
      });
      setFeeError("");
      setShowFeeForm(false);
      await loadData();
      setModalMessage("Trading fee added successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : "Failed to add fee");
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPSXSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/psx-stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: psxSymbolForm.symbol.toUpperCase(),
          company_name: psxSymbolForm.company_name,
          sector: psxSymbolForm.sector || null,
          current_price: psxSymbolForm.current_price ? parseFloat(psxSymbolForm.current_price) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add PSX symbol");
      }

      setModalMessage(`Successfully added ${psxSymbolForm.symbol.toUpperCase()} to PSX symbols!`);
      setShowSuccessModal(true);
      setPsxSymbolForm({
        symbol: "",
        company_name: "",
        sector: "",
        current_price: "",
      });
      setShowPSXSymbolForm(false);
      await loadData();
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : "Failed to add PSX symbol");
      setShowErrorModal(true);
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

  const totalInvested = stocks.reduce((sum, s) => sum + parseFloat(s.total_invested.toString()), 0);
  const currentValue = stocks.reduce((sum, s) => sum + s.current_value, 0);
  const totalProfitLoss = currentValue - totalInvested;
  const totalDividends = dividends.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);
  const realizedProfitLoss = transactions
    .filter(t => t.transaction_type === "sell")
    .reduce((sum, t) => sum + parseFloat(t.profit_loss), 0);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Cash Balance"
            value={`Rs. ${cashAccount.balance.toFixed(2)}`}
            icon={<Wallet className="w-5 h-5" />}
            tone="neutral"
          />

          <StatCard
            label="Total Invested"
            value={`Rs. ${totalInvested.toFixed(2)}`}
            icon={<BarChart3 className="w-5 h-5" />}
            tone="neutral"
          />

          <StatCard
            label="Current Value"
            value={`Rs. ${currentValue.toFixed(2)}`}
            icon={<DollarSign className="w-5 h-5" />}
            tone="neutral"
          />

          <StatCard
            label="Unrealized P&L"
            value={`Rs. ${totalProfitLoss.toFixed(2)}`}
            delta={totalInvested > 0 ? `${((totalProfitLoss / totalInvested) * 100).toFixed(2)}%` : "0%"}
            icon={totalProfitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            tone={totalProfitLoss >= 0 ? "up" : "down"}
          />

          <StatCard
            label="Realized P&L"
            value={`Rs. ${realizedProfitLoss.toFixed(2)}`}
            delta={`From ${transactions.filter(t => t.transaction_type === "sell").length} sales`}
            icon={realizedProfitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            tone={realizedProfitLoss >= 0 ? "up" : "down"}
          />

          <StatCard
            label="Trading Fees"
            value={`Rs. ${feesSummary.total_fees.toFixed(2)}`}
            delta={`CGT: Rs. ${feesSummary.cgt.toFixed(0)} | Broker: Rs. ${feesSummary.broker_charges.toFixed(0)}`}
            icon={<DollarSign className="w-5 h-5" />}
            tone="down"
          />

          <StatCard
            label="Total Dividends"
            value={`Rs. ${totalDividends.toFixed(2)}`}
            delta={`From ${dividends.length} payments`}
            icon={<Gift className="w-5 h-5" />}
            tone="up"
          />

          <StatCard
            label="Portfolio Count"
            value={`${stocks.length} Stocks`}
            delta={`${psxStocks.length} PSX Symbols`}
            icon={<BarChart3 className="w-5 h-5" />}
            tone="neutral"
          />
        </div>

        {/* Decorative Separator */}
        <div className="flex items-center justify-center my-8">
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-blue-600 to-transparent"></div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8 p-6 rounded-xl border border-slate-700/50 bg-linear-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Quick Actions</h2>
              <p className="text-sm text-slate-400">Manage your stock portfolio and dividends</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowBuyForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200 text-white font-medium text-sm shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Buy Stock
              </button>
              <button
                onClick={() => setShowSellForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 text-white font-medium text-sm shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105"
              >
                <TrendingDown className="w-4 h-4" />
                Sell Stock
              </button>
              <button
                onClick={() => setShowCashForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 text-white font-medium text-sm shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 hover:scale-105"
              >
                <Wallet className="w-4 h-4" />
                Manage Cash
              </button>
              <button
                onClick={() => setShowFeeForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all duration-200 text-white font-medium text-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105"
              >
                <DollarSign className="w-4 h-4" />
                Add Fee
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
          <div className="flex gap-2 min-w-max md:min-w-0 md:flex-wrap">
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === "portfolio"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab("dividends")}
              className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === "dividends"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Dividends
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === "history"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Transaction History
            </button>
            <button
              onClick={() => setActiveTab("fees")}
              className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === "fees"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Trading Fees
            </button>
            {
              session?.user?.email==="moiz20920@gmail.com" && (
                <button
                  onClick={() => setActiveTab("psx-symbols")}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    activeTab === "psx-symbols"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  PSX Symbols
                </button>
              )
            }
          </div>
        </div>

        {/* Portfolio Tab */}
        {activeTab === "portfolio" && (
          <>
            {/* Buy Form Modal */}
            {showBuyForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="relative w-full max-w-lg mx-4 p-6 rounded-2xl border border-green-500/50 bg-linear-to-br from-slate-900 via-slate-900/95 to-slate-950 shadow-2xl">
                <button
                  onClick={() => setShowBuyForm(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold mb-4 text-white">Buy Stock</h2>
                
                {buyError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                    <p className="text-sm text-red-400">{buyError}</p>
                  </div>
                )}
                
                <form onSubmit={handleBuyStock} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Symbol</label>
                      <select
                        required
                        value={buyForm.symbol}
                        onChange={(e) => {
                          const stock = psxStocks.find((s) => s.symbol === e.target.value);
                          setBuyForm({
                            ...buyForm,
                            symbol: e.target.value,
                            price_per_share: stock?.current_price?.toString() || ""
                          });
                          setTimeout(() => validateBuyForm(), 0);
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                      >
                        <option value="">Select stock</option>
                        {psxStocks.map((stock) => (
                          <option key={stock.symbol} value={stock.symbol}>
                            {stock.symbol} - {stock.company_name} (Rs. {stock.current_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Shares</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={buyForm.shares}
                        onChange={(e) => {
                          setBuyForm({ ...buyForm, shares: e.target.value });
                          setTimeout(() => validateBuyForm(), 0);
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                        placeholder="Number of shares"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Price per Share (Rs.)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={buyForm.price_per_share}
                        onChange={(e) => {
                          setBuyForm({ ...buyForm, price_per_share: e.target.value });
                          setTimeout(() => validateBuyForm(), 0);
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                        placeholder="Enter price in Rs."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                      <input
                        type="date"
                        required
                        value={buyForm.transaction_date}
                        onChange={(e) => setBuyForm({ ...buyForm, transaction_date: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>

                  {buyForm.shares && buyForm.price_per_share && (
                    <p className="text-slate-300">
                      Total Cost: <span className="font-bold text-white">
                        Rs. {(parseFloat(buyForm.shares) * parseFloat(buyForm.price_per_share)).toFixed(2)}
                      </span>
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 px-4 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-medium transition"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Buy Stock"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBuyForm(false)}
                      className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
            )}

            {/* Sell Form Modal */}
            {showSellForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="relative w-full max-w-lg mx-4 p-6 rounded-2xl border border-red-500/50 bg-linear-to-br from-slate-900 via-slate-900/95 to-slate-950 shadow-2xl">
                <button
                  onClick={() => setShowSellForm(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold mb-4 text-white">Sell Stock</h2>
                
                {sellError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                    <p className="text-sm text-red-400">{sellError}</p>
                  </div>
                )}
                
                <form onSubmit={handleSellStock} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Symbol</label>
                      <select
                        required
                        value={sellForm.symbol}
                        onChange={(e) => {
                          const stock = stocks.find(s => s.symbol === e.target.value);
                          setSellForm({ 
                            ...sellForm, 
                            symbol: e.target.value,
                            price_per_share: stock?.current_price?.toString() || ""
                          });
                          setTimeout(() => validateSellForm(), 0);
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="">Select stock</option>
                        {stocks.map((stock) => (
                          <option key={stock.symbol} value={stock.symbol}>
                            {stock.symbol} - {stock.total_shares} shares @ Rs. {stock.current_price}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Shares</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={sellForm.shares}
                        onChange={(e) => {
                          setSellForm({ ...sellForm, shares: e.target.value });
                          setTimeout(() => validateSellForm(), 0);
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500"
                        placeholder="Number of shares"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Price per Share (Rs.)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={sellForm.price_per_share}
                        onChange={(e) => {
                          setSellForm({ ...sellForm, price_per_share: e.target.value });
                          setTimeout(() => validateSellForm(), 0);
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500"
                        placeholder="Enter price in Rs."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                      <input
                        type="date"
                        required
                        value={sellForm.transaction_date}
                        onChange={(e) => setSellForm({ ...sellForm, transaction_date: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {sellForm.shares && sellForm.price_per_share && (
                    <p className="text-slate-300">
                      Total Revenue: <span className="font-bold text-white">
                        Rs. {(parseFloat(sellForm.shares) * parseFloat(sellForm.price_per_share)).toFixed(2)}
                      </span>
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium transition"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Sell Stock"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSellForm(false)}
                      className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
              </div>
            )}

            {/* Stocks List */}
            <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-4 text-white">Your Portfolio</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : stocks.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No stocks yet. Buy your first stock!</p>
              ) : (
                <div className="space-y-3">
                  {stocks.map((stock) => (
                    <div
                      key={stock.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-white text-lg">{stock.symbol}</h3>
                          <span className="text-slate-400 text-sm">{stock.company_name}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-slate-500">Shares</p>
                            <p className="text-white font-semibold">{stock.total_shares}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Avg Buy Price</p>
                            <p className="text-white font-semibold">Rs. {stock.avg_buy_price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Current Price</p>
                            <p className="text-white font-semibold">Rs. {stock.current_price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Invested</p>
                            <p className="text-white font-semibold">Rs. {parseFloat(stock.total_invested.toString()).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-slate-400 mb-1">Current Value</p>
                        <p className="text-2xl font-bold text-white mb-2">
                          Rs. {stock.current_value.toFixed(2)}
                        </p>
                        <p className={`text-lg font-bold ${stock.profit_loss >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {stock.profit_loss >= 0 ? "+" : ""}Rs. {stock.profit_loss.toFixed(2)}
                        </p>
                        <p className={`text-sm ${stock.profit_loss >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {stock.profit_loss >= 0 ? "+" : ""}
                          {((stock.profit_loss / parseFloat(stock.total_invested.toString())) * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Dividends Tab */}
        {activeTab === "dividends" && (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="p-4 rounded-lg border border-green-500/30 bg-green-900/20">
                <p className="text-sm text-slate-400">Total Dividends Received</p>
                <p className="text-2xl font-bold text-green-400">Rs. {totalDividends.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setShowDividendForm(!showDividendForm)}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition flex items-center gap-2 justify-center sm:justify-start"
              >
                <Gift className="w-5 h-5" />
                Add Dividend
              </button>
            </div>

            {/* Dividend Form Modal */}
            {showDividendForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="relative w-full max-w-lg mx-4 p-6 rounded-2xl border border-cyan-500/50 bg-linear-to-br from-slate-900 via-slate-900/95 to-slate-950 shadow-2xl">
                <button
                  onClick={() => setShowDividendForm(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold mb-4 text-white">Record Dividend</h2>
                
                {dividendError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                    <p className="text-sm text-red-400">{dividendError}</p>
                  </div>
                )}
                
                <form onSubmit={handleAddDividend} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Symbol</label>
                      <select
                        required
                        value={dividendForm.symbol}
                        onChange={(e) => {
                          setDividendForm({ ...dividendForm, symbol: e.target.value });
                          setTimeout(() => validateDividendForm(), 0);
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                      >
                        <option value="">Select stock</option>
                        {psxStocks.map((stock) => (
                          <option key={stock.symbol} value={stock.symbol}>
                            {stock.symbol} - {stock.company_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Amount (Rs.)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={dividendForm.amount}
                        onChange={(e) => {
                          setDividendForm({ ...dividendForm, amount: e.target.value });
                          setTimeout(() => validateDividendForm(), 0);
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                        placeholder="Enter dividend amount in Rs."
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                      <input
                        type="date"
                        required
                        value={dividendForm.dividend_date}
                        onChange={(e) => setDividendForm({ ...dividendForm, dividend_date: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                      <input
                        type="text"
                        value={dividendForm.description}
                        onChange={(e) => setDividendForm({ ...dividendForm, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-green-500"
                        placeholder="e.g., Q4 2025"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 px-4 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-medium transition"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Add Dividend"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDividendForm(false)}
                      className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
              </div>
            )}

            {/* Dividends List */}
            <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-4 text-white">Dividend History</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : dividends.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No dividends recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {dividends.map((dividend) => (
                    <div
                      key={dividend.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <Gift className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="font-bold text-white">{dividend.symbol}</p>
                            <p className="text-sm text-slate-400">{dividend.company_name}</p>
                            {dividend.description && (
                              <p className="text-xs text-slate-500 mt-1">{dividend.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">Rs. {parseFloat(dividend.amount.toString()).toFixed(2)}</p>
                        <p className="text-sm text-slate-400 mt-1">
                          {new Date(dividend.dividend_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
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
        {activeTab === "history" && (
          <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <History className="w-6 h-6 text-blue-400" />
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
                 {/* Summary Footer */}
                <div className="mt-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total Buy Transactions</p>
                      <p className="text-lg font-bold text-green-400">
                        {transactions.filter(t => t.transaction_type === "buy").length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total Sell Transactions</p>
                      <p className="text-lg font-bold text-red-400">
                        {transactions.filter(t => t.transaction_type === "sell").length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total Realized Profit/Loss</p>
                      <p className={`text-lg font-bold ${
                        transactions
                          .filter(t => t.transaction_type === "sell")
                          .reduce((sum, t) => sum + parseFloat(t.profit_loss), 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}>
                        {transactions
                          .filter(t => t.transaction_type === "sell")
                          .reduce((sum, t) => sum + parseFloat(t.profit_loss), 0) >= 0
                          ? "+"
                          : ""}
                        Rs. {transactions
                          .filter(t => t.transaction_type === "sell")
                          .reduce((sum, t) => sum + parseFloat(t.profit_loss), 0)
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                      </p>
                    </div>
                  </div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Symbol</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Company</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Shares</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Price</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Total</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Profit/Loss</th>
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
                              txn.transaction_type === "buy"
                                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                : "bg-red-500/20 text-red-400 border border-red-500/50"
                            }`}
                          >
                            {txn.transaction_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white font-semibold">{txn.symbol}</td>
                        <td className="py-3 px-4 text-slate-300 text-sm">{txn.company_name}</td>
                        <td className="py-3 px-4 text-right text-white">
                          {parseFloat(txn.shares).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-white">
                          Rs. {parseFloat(txn.price_per_share).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-white font-semibold">
                          Rs. {parseFloat(txn.total_amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {txn.transaction_type === "sell" ? (
                            <span
                              className={`font-bold ${
                                parseFloat(txn.profit_loss) >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {parseFloat(txn.profit_loss) >= 0 ? "+" : ""}
                              Rs. {parseFloat(txn.profit_loss).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

               
              </div>
            )}
          </div>
        )}

        {/* Trading Fees Tab */}
        {activeTab === "fees" && (
          <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Trading Fees & Charges</h2>
                <p className="text-sm text-slate-400 mt-1">Track broker charges, CGT, and other trading costs</p>
              </div>
              <button
                onClick={() => setShowFeeForm(true)}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
              >
                + Add Fee
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30">
                <p className="text-sm text-slate-400">Total Fees</p>
                <p className="text-2xl font-bold text-red-400">Rs. {feesSummary.total_fees.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-lg bg-orange-900/20 border border-orange-500/30">
                <p className="text-sm text-slate-400">Broker Charges</p>
                <p className="text-2xl font-bold text-orange-400">Rs. {feesSummary.broker_charges.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                <p className="text-sm text-slate-400">Capital Gains Tax</p>
                <p className="text-2xl font-bold text-yellow-400">Rs. {feesSummary.cgt.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-600">
                <p className="text-sm text-slate-400">Other Fees</p>
                <p className="text-2xl font-bold text-slate-300">Rs. {feesSummary.other_fees.toFixed(2)}</p>
              </div>
            </div>

            {/* Fees List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : fees.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No fees recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Description</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Amount</th>
                      <th className="text-center py-3 px-4 text-slate-300 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee) => (
                      <tr key={fee.id} className="border-b border-slate-700/50 hover:bg-slate-900/30 transition">
                        <td className="py-3 px-4 text-slate-300 text-sm">
                          {new Date(fee.fee_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              fee.fee_type === "broker_charge"
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/50"
                                : fee.fee_type === "cgt"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                                : "bg-slate-500/20 text-slate-400 border border-slate-500/50"
                            }`}
                          >
                            {fee.fee_type === "broker_charge" ? "BROKER" : fee.fee_type === "cgt" ? "CGT" : "OTHER"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-sm">{fee.description || "-"}</td>
                        <td className="py-3 px-4 text-right text-red-400 font-semibold">
                          Rs. {parseFloat(fee.amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm("Delete this fee?")) {
                                fetch(`/api/trading-fees?id=${fee.id}`, { method: "DELETE" })
                                  .then(() => loadData());
                              }
                            }}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Cash Form Modal */}
        {showCashForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4 text-white">Manage Cash Account</h2>
              
              {cashError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                  <p className="text-sm text-red-400">{cashError}</p>
                </div>
              )}
              
              <form onSubmit={handleCashOperation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Operation</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCashForm({ ...cashForm, type: "deposit" })}
                      className={`flex-1 py-2 px-4 rounded-lg border transition ${
                        cashForm.type === "deposit"
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashForm({ ...cashForm, type: "withdraw" })}
                      className={`flex-1 py-2 px-4 rounded-lg border transition ${
                        cashForm.type === "withdraw"
                          ? "bg-red-500 border-red-500 text-white"
                          : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Withdraw
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={cashForm.amount}
                    onChange={(e) => {
                      setCashForm({ ...cashForm, amount: e.target.value });
                      setTimeout(() => validateCashForm(), 0);
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Amount"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium transition"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCashForm(false)}
                    className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Fee Form Modal */}
        {showFeeForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4 text-white">Add Trading Fee</h2>
              
              {feeError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                  <p className="text-sm text-red-400">{feeError}</p>
                </div>
              )}
              
              <form onSubmit={handleAddFee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fee Type</label>
                  <select
                    value={feeForm.fee_type}
                    onChange={(e) => {
                      setFeeForm({ ...feeForm, fee_type: e.target.value as "broker_charge" | "cgt" | "other" });
                      setTimeout(() => validateFeeForm(), 0);
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="broker_charge">Broker Charge / Commission</option>
                    <option value="cgt">Capital Gains Tax (CGT)</option>
                    <option value="other">Other Fee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Amount (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={feeForm.amount}
                    onChange={(e) => {
                      setFeeForm({ ...feeForm, amount: e.target.value });
                      setTimeout(() => validateFeeForm(), 0);
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter amount in Rs."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                  <textarea
                    value={feeForm.description}
                    onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="e.g., Broker charges for HBL transaction"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={feeForm.fee_date}
                    onChange={(e) => setFeeForm({ ...feeForm, fee_date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium transition"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Add Fee"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeeForm(false)}
                    className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PSX Symbols Tab */}
        {activeTab === "psx-symbols" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-900/20">
                <p className="text-sm text-slate-400">Total PSX Symbols</p>
                <p className="text-2xl font-bold text-blue-400">{psxStocks.length}</p>
              </div>
              <button
                onClick={() => setShowPSXSymbolForm(!showPSXSymbolForm)}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add PSX Symbol
              </button>
            </div>

            {/* Add PSX Symbol Form */}
            {showPSXSymbolForm && (
              <div className="mb-6 p-6 rounded-lg border border-blue-500/50 bg-slate-800/50 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 text-white">Add New PSX Symbol</h2>
                <form onSubmit={handleAddPSXSymbol} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Symbol *</label>
                      <input
                        type="text"
                        required
                        value={psxSymbolForm.symbol}
                        onChange={(e) => setPsxSymbolForm({ ...psxSymbolForm, symbol: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500 uppercase"
                        placeholder="e.g., ABCD"
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={psxSymbolForm.company_name}
                        onChange={(e) => setPsxSymbolForm({ ...psxSymbolForm, company_name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g., ABC Limited"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Sector</label>
                      <input
                        type="text"
                        value={psxSymbolForm.sector}
                        onChange={(e) => setPsxSymbolForm({ ...psxSymbolForm, sector: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g., Banking, Technology, Oil & Gas"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Current Price (Rs.)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={psxSymbolForm.current_price}
                        onChange={(e) => setPsxSymbolForm({ ...psxSymbolForm, current_price: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Enter price in Rs."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium transition"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Add Symbol"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPSXSymbolForm(false)}
                      className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PSX Symbols List */}
            <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-4 text-white">Available PSX Symbols</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : psxStocks.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No PSX symbols available.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {psxStocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg">{stock.symbol}</h3>
                          <p className="text-slate-400 text-sm mt-1">{stock.company_name}</p>
                          {stock.sector && (
                            <p className="text-slate-500 text-xs mt-2 inline-block px-2 py-1 rounded bg-slate-800">
                              {stock.sector}
                            </p>
                          )}
                        </div>
                        {stock.current_price && (
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Price</p>
                            <p className="text-white font-semibold">Rs. {stock.current_price.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 p-6 rounded-2xl border border-green-500/50 bg-linear-to-br from-slate-900 via-slate-900/95 to-slate-950 shadow-2xl shadow-green-500/20">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-green-500/20 border border-green-500/50">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Success!</h3>
            </div>
            <p className="text-slate-300 mb-6">{modalMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 rounded-lg bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium transition-all duration-200 shadow-lg shadow-green-500/30"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 p-6 rounded-2xl border border-red-500/50 bg-linear-to-br from-slate-900 via-slate-900/95 to-slate-950 shadow-2xl shadow-red-500/20">
            <button
              onClick={() => setShowErrorModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-500/20 border border-red-500/50">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Error</h3>
            </div>
            <p className="text-slate-300 mb-6">{modalMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full py-2.5 rounded-lg bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all duration-200 shadow-lg shadow-red-500/30"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cash Account Modal */}
      {showCashForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4 p-6 rounded-2xl border border-slate-700/50 bg-linear-to-br from-slate-900 via-slate-900/95 to-slate-950 shadow-2xl">
            <button
              onClick={() => setShowCashForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Manage Cash Account</h2>
            <form onSubmit={handleCashOperation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Operation Type</label>
                <select
                  value={cashForm.type}
                  onChange={(e) => setCashForm({ ...cashForm, type: e.target.value as "deposit" | "withdraw" })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdraw">Withdraw</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={cashForm.amount}
                  onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Enter amount"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-linear-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 text-white font-medium transition-all duration-200 shadow-lg shadow-yellow-500/30"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCashForm(false)}
                  className="px-6 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
