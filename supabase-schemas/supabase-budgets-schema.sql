-- Budgets table to store monthly/yearly budget limits per category
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    budget_amount DECIMAL(15, 2) NOT NULL CHECK (budget_amount >= 0),
    period VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
    is_custom_category BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, period)
);

-- Custom expense categories table
CREATE TABLE custom_expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_name)
);

-- Indexes for better query performance
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category ON budgets(category);
CREATE INDEX idx_budgets_period ON budgets(period);
CREATE INDEX idx_custom_categories_user_id ON custom_expense_categories(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_expense_categories ENABLE ROW LEVEL SECURITY;

-- Policies for budgets table
-- Note: Disable RLS or create policies based on your authentication method
-- If using service role key in API routes, RLS can be disabled
-- Otherwise, adjust policies to match your auth implementation

-- Example policies (adjust based on your auth):
-- CREATE POLICY "Users can view their own budgets"
--     ON budgets FOR SELECT
--     USING (true);

-- CREATE POLICY "Users can insert their own budgets"
--     ON budgets FOR INSERT
--     WITH CHECK (true);

-- CREATE POLICY "Users can update their own budgets"
--     ON budgets FOR UPDATE
--     USING (true);

-- CREATE POLICY "Users can delete their own budgets"
--     ON budgets FOR DELETE
--     USING (true);

-- Policies for custom_expense_categories table
-- CREATE POLICY "Users can view their own custom categories"
--     ON custom_expense_categories FOR SELECT
--     USING (true);

-- CREATE POLICY "Users can insert their own custom categories"
--     ON custom_expense_categories FOR INSERT
--     WITH CHECK (true);

-- CREATE POLICY "Users can update their own custom categories"
--     ON custom_expense_categories FOR UPDATE
--     USING (true);

-- CREATE POLICY "Users can delete their own custom categories"
--     ON custom_expense_categories FOR DELETE
--     USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
