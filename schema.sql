-- Schema for Dairy Milk Procurement System

-- 1. Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  milk_type TEXT NOT NULL CHECK (milk_type IN ('Cow', 'Buffalo')),
  quantity_litres NUMERIC NOT NULL,
  price_per_litre NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  created_by UUID,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc', now());
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_modtime
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 3. Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for Stage 1 (Anonymous Read/Insert)
-- Customers policies
CREATE POLICY "Allow anonymous select on customers" 
  ON customers FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert on customers" 
  ON customers FOR INSERT WITH CHECK (true);

-- Transactions policies
CREATE POLICY "Allow anonymous select on transactions" 
  ON transactions FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert on transactions" 
  ON transactions FOR INSERT WITH CHECK (true);
