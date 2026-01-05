-- Create cash account table
CREATE TABLE IF NOT EXISTS cash_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for cash account
CREATE INDEX idx_cash_account_user_id ON cash_account(user_id);

-- Enable RLS
ALTER TABLE cash_account ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all cash accounts"
  ON cash_account FOR ALL USING (true) WITH CHECK (true);

-- Create PSX stocks reference data table
CREATE TABLE IF NOT EXISTS psx_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  sector TEXT,
  current_price DECIMAL(10, 2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for PSX stocks
CREATE INDEX idx_psx_stocks_symbol ON psx_stocks(symbol);

-- Enable RLS
ALTER TABLE psx_stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all psx stocks"
  ON psx_stocks FOR ALL USING (true) WITH CHECK (true);

-- Create user stocks portfolio table
CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  company_name TEXT NOT NULL,
  total_shares DECIMAL(15, 4) NOT NULL CHECK (total_shares >= 0),
  avg_buy_price DECIMAL(10, 2) NOT NULL CHECK (avg_buy_price > 0),
  total_invested DECIMAL(15, 2) NOT NULL CHECK (total_invested >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Create indexes for stocks
CREATE INDEX idx_stocks_user_id ON stocks(user_id);
CREATE INDEX idx_stocks_symbol ON stocks(symbol);

-- Enable RLS
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all stocks"
  ON stocks FOR ALL USING (true) WITH CHECK (true);

-- Create stock transactions history table
CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_id UUID REFERENCES stocks(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  company_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  shares DECIMAL(15, 4) NOT NULL CHECK (shares > 0),
  price_per_share DECIMAL(10, 2) NOT NULL CHECK (price_per_share > 0),
  total_amount DECIMAL(15, 2) NOT NULL,
  profit_loss DECIMAL(15, 2) DEFAULT 0,
  avg_cost_basis DECIMAL(10, 2),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for stock transactions
CREATE INDEX idx_stock_transactions_user_id ON stock_transactions(user_id);
CREATE INDEX idx_stock_transactions_stock_id ON stock_transactions(stock_id);
CREATE INDEX idx_stock_transactions_date ON stock_transactions(transaction_date DESC);

-- Enable RLS
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all stock transactions"
  ON stock_transactions FOR ALL USING (true) WITH CHECK (true);

-- Create dividends table
CREATE TABLE IF NOT EXISTS dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_id UUID REFERENCES stocks(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  company_name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  dividend_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for dividends
CREATE INDEX idx_dividends_user_id ON dividends(user_id);
CREATE INDEX idx_dividends_stock_id ON dividends(stock_id);
CREATE INDEX idx_dividends_date ON dividends(dividend_date DESC);

-- Enable RLS
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all dividends"
  ON dividends FOR ALL USING (true) WITH CHECK (true);
