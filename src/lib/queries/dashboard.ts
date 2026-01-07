type JsonResponse<T> = Promise<T>;

async function fetcher<T>(url: string): JsonResponse<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Failed request: ${url}`);
  }
  return res.json();
}

export type Transaction = {
  id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string;
  date: string;
  created_at?: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category: string;
  budget_amount: number;
  period: string;
  is_custom_category: boolean;
};

export type RecurringPayment = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  next_payment_date: string;
  last_payment_date?: string | null;
  status: "active" | "paused" | "cancelled";
};

export type Invoice = {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  invoice_date: string;
  due_date: string;
  status: string;
  type: "income" | "expense";
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  invoice_items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
};

export type Stock = {
  id: string;
  user_id: string;
  symbol: string;
  company_name: string;
  total_shares: number;
  avg_buy_price: number;
  total_invested: number;
  current_price?: number;
  current_value?: number;
  profit_loss?: number;
  updated_at?: string;
};

export type StockTransaction = {
  id: string;
  user_id: string;
  stock_id?: string;
  symbol: string;
  company_name: string;
  transaction_type: "buy" | "sell";
  shares: number;
  price_per_share: number;
  total_amount: number;
  profit_loss?: number | null;
  transaction_date: string;
};

export type Dividend = {
  id: string;
  user_id: string;
  stock_id?: string | null;
  symbol: string;
  company_name: string;
  amount: number;
  dividend_date: string;
};

export type MutualFund = {
  id: string;
  user_id: string;
  fund_name: string;
  fund_type?: string | null;
  total_invested: number;
  current_value: number;
  units?: number | null;
  nav?: number | null;
  profit_loss: number;
};

export type MutualFundTransaction = {
  id: string;
  user_id: string;
  mutual_fund_id?: string | null;
  fund_name: string;
  transaction_type: "invest" | "withdraw";
  amount: number;
  units?: number | null;
  nav?: number | null;
  profit_loss?: number | null;
  transaction_date: string;
};

export type MutualFundValueHistory = {
  id: string;
  user_id: string;
  mutual_fund_id: string;
  fund_name: string;
  previous_value: number;
  new_value: number;
  value_change: number;
  value_change_percentage: number;
  total_invested: number;
  profit_loss: number;
  update_date: string;
};

export type TradingFee = {
  id: string;
  user_id: string;
  fee_type: "broker_charge" | "cgt" | "other";
  amount: number;
  description?: string | null;
  fee_date: string;
};

export type CashAccount = {
  id: string;
  user_id: string;
  balance: number;
};

export type PsxStock = {
  id: string;
  symbol: string;
  company_name: string;
  sector?: string | null;
  current_price?: number | null;
};

export const dashboardQueries = {
  transactions: () =>
    fetcher<{ transactions: Transaction[] }>("/api/transactions"),
  budgets: () =>
    fetcher<{
      budgets: Budget[];
      customCategories: { id: string; category_name: string }[];
      spendingByCategory: Record<string, number>;
    }>("/api/budgets"),
  recurring: () =>
    fetcher<{ recurringPayments: RecurringPayment[] }>("/api/recurring-payments"),
  invoices: () => fetcher<{ invoices: Invoice[] }>("/api/invoices"),
  stocks: () => fetcher<{ stocks: Stock[] }>("/api/stocks"),
  stockTransactions: () =>
    fetcher<{ transactions: StockTransaction[] }>("/api/stock-transactions"),
  dividends: () => fetcher<{ dividends: Dividend[] }>("/api/dividends"),
  mutualFunds: () => fetcher<{ funds: MutualFund[] }>("/api/mutual-funds"),
  mutualFundTransactions: () =>
    fetcher<{ transactions: MutualFundTransaction[] }>(
      "/api/mutual-fund-transactions"
    ),
  mutualFundHistory: () =>
    fetcher<{ history: MutualFundValueHistory[] }>(
      "/api/mutual-fund-value-history"
    ),
  tradingFees: () =>
    fetcher<{ fees: TradingFee[]; summary: Record<string, number> }>(
      "/api/trading-fees"
    ),
  cashAccount: () => fetcher<{ cashAccount: CashAccount }>("/api/cash-account"),
  psxStocks: () => fetcher<{ stocks: PsxStock[] }>("/api/psx-stocks"),
};

