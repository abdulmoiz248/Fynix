-- Create mutual funds portfolio table
CREATE TABLE IF NOT EXISTS mutual_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fund_name TEXT NOT NULL,
  fund_type TEXT, -- e.g., Equity, Debt, Balanced, Money Market, etc.
  total_invested DECIMAL(15, 2) NOT NULL CHECK (total_invested >= 0),
  current_value DECIMAL(15, 2) NOT NULL CHECK (current_value >= 0),
  units DECIMAL(15, 4), -- Optional: number of units if tracked
  nav DECIMAL(10, 4), -- Net Asset Value per unit
  profit_loss DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for mutual funds
CREATE INDEX idx_mutual_funds_user_id ON mutual_funds(user_id);
CREATE INDEX idx_mutual_funds_fund_name ON mutual_funds(fund_name);

-- Enable RLS
ALTER TABLE mutual_funds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all mutual funds"
  ON mutual_funds FOR ALL USING (true) WITH CHECK (true);

-- Create mutual fund transactions history table
CREATE TABLE IF NOT EXISTS mutual_fund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mutual_fund_id UUID REFERENCES mutual_funds(id) ON DELETE SET NULL,
  fund_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('invest', 'withdraw')),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  units DECIMAL(15, 4), -- Units bought/sold (optional)
  nav DECIMAL(10, 4), -- NAV at time of transaction (optional)
  profit_loss DECIMAL(15, 2) DEFAULT 0, -- For withdrawals only
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for mutual fund transactions
CREATE INDEX idx_mutual_fund_transactions_user_id ON mutual_fund_transactions(user_id);
CREATE INDEX idx_mutual_fund_transactions_fund_id ON mutual_fund_transactions(mutual_fund_id);
CREATE INDEX idx_mutual_fund_transactions_date ON mutual_fund_transactions(transaction_date DESC);

-- Enable RLS
ALTER TABLE mutual_fund_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all mutual fund transactions"
  ON mutual_fund_transactions FOR ALL USING (true) WITH CHECK (true);

-- Create mutual fund value history table (for tracking value updates over time)
CREATE TABLE IF NOT EXISTS mutual_fund_value_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mutual_fund_id UUID NOT NULL REFERENCES mutual_funds(id) ON DELETE CASCADE,
  fund_name TEXT NOT NULL,
  previous_value DECIMAL(15, 2) NOT NULL,
  new_value DECIMAL(15, 2) NOT NULL,
  value_change DECIMAL(15, 2) NOT NULL,
  value_change_percentage DECIMAL(10, 4),
  total_invested DECIMAL(15, 2) NOT NULL,
  profit_loss DECIMAL(15, 2) NOT NULL,
  update_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for mutual fund value history
CREATE INDEX idx_mutual_fund_value_history_user_id ON mutual_fund_value_history(user_id);
CREATE INDEX idx_mutual_fund_value_history_fund_id ON mutual_fund_value_history(mutual_fund_id);
CREATE INDEX idx_mutual_fund_value_history_date ON mutual_fund_value_history(update_date DESC);

-- Enable RLS
ALTER TABLE mutual_fund_value_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all mutual fund value history"
  ON mutual_fund_value_history FOR ALL USING (true) WITH CHECK (true);
