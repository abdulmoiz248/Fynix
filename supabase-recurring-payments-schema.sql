-- Create recurring_payments table for subscriptions and recurring expenses
CREATE TABLE IF NOT EXISTS recurring_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  next_payment_date DATE NOT NULL,
  last_payment_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_recurring_payments_user_id ON recurring_payments(user_id);
CREATE INDEX idx_recurring_payments_status ON recurring_payments(status);
CREATE INDEX idx_recurring_payments_next_payment_date ON recurring_payments(next_payment_date);
CREATE INDEX idx_recurring_payments_category ON recurring_payments(category);

-- Enable Row Level Security
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage all recurring payments"
  ON recurring_payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE recurring_payments IS 'Stores recurring payment subscriptions like Netflix, Spotify, SaaS services, gym memberships, etc.';
COMMENT ON COLUMN recurring_payments.frequency IS 'Payment frequency: daily, weekly, monthly, quarterly, or yearly';
COMMENT ON COLUMN recurring_payments.status IS 'Payment status: active (currently running), paused (temporarily stopped), or cancelled (permanently stopped)';
COMMENT ON COLUMN recurring_payments.next_payment_date IS 'The date when the next payment is due';
COMMENT ON COLUMN recurring_payments.last_payment_date IS 'The date when the last payment was processed or converted to a transaction';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recurring_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_recurring_payments_timestamp
  BEFORE UPDATE ON recurring_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_payments_updated_at();
