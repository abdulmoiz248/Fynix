-- Create fees and charges table for broker fees, CGT, and other trading costs

CREATE TABLE IF NOT EXISTS trading_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('broker_charge', 'cgt', 'other')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  fee_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_trading_fees_user_id ON trading_fees(user_id);
CREATE INDEX idx_trading_fees_date ON trading_fees(fee_date DESC);
CREATE INDEX idx_trading_fees_type ON trading_fees(fee_type);

-- Enable RLS
ALTER TABLE trading_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all trading fees"
  ON trading_fees FOR ALL USING (true) WITH CHECK (true);

-- Add comment
COMMENT ON TABLE trading_fees IS 'Stores all trading related fees including broker charges, capital gains tax, and other trading costs';
COMMENT ON COLUMN trading_fees.fee_type IS 'Type of fee: broker_charge (commission/brokerage), cgt (Capital Gains Tax), other (misc fees)';
