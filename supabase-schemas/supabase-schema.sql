-- Create users table in Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by email
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security (RLS) for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Note: Since NextAuth handles authentication and all API calls use service role,
-- we create permissive policies that allow service role to manage all data.
-- The actual authorization is enforced in the API routes via NextAuth session checks.

-- Allow service role to perform all operations (API routes will enforce user permissions)
CREATE POLICY "Service role can manage all users"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create transactions table in Supabase
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Create index for date-based queries
CREATE INDEX idx_transactions_date ON transactions(date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Note: Since NextAuth handles authentication and all API calls use service role,
-- we create permissive policies that allow service role to manage all data.
-- The actual authorization is enforced in the API routes via NextAuth session checks.

-- Allow service role to perform all operations (API routes will enforce user permissions)
CREATE POLICY "Service role can manage all transactions"
  ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);
