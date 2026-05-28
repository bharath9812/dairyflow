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
  updated_at TIMESTAMP WITH TIME ZONE,
  -- Stage 2: Loan Recovery System
  loan_deduction NUMERIC NOT NULL DEFAULT 0,
  net_payable NUMERIC NOT NULL GENERATED ALWAYS AS (total_price - loan_deduction) STORED,
  status TEXT NOT NULL DEFAULT 'NORMAL' CHECK (status IN ('NORMAL', 'LOAN_ADJUSTED', 'LOAN_CLEARED'))
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

-- 5. Create Settings/Pricing table
CREATE TABLE global_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cow_price NUMERIC NOT NULL DEFAULT 40.0,
  buffalo_price NUMERIC NOT NULL DEFAULT 50.0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_by UUID
);

-- Insert default pricing if empty
INSERT INTO global_pricing (cow_price, buffalo_price) 
SELECT 40.0, 50.0 
WHERE NOT EXISTS (SELECT 1 FROM global_pricing);

ALTER TABLE global_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select on global_pricing" 
  ON global_pricing FOR SELECT USING (true);

CREATE POLICY "Allow authenticated update on global_pricing" 
  ON global_pricing FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Create Customer Loans table
CREATE TABLE customer_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  recovered_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_balance NUMERIC NOT NULL GENERATED ALWAYS AS (amount - recovered_amount) STORED,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLEARED')),
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER update_customer_loans_modtime
BEFORE UPDATE ON customer_loans
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 7. Create Loan Recoveries table
CREATE TABLE loan_recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES customer_loans(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  amount_recovered NUMERIC NOT NULL CHECK (amount_recovered > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE customer_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_recoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select on customer_loans" ON customer_loans FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on customer_loans" ON customer_loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on customer_loans" ON customer_loans FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select on loan_recoveries" ON loan_recoveries FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on loan_recoveries" ON loan_recoveries FOR INSERT WITH CHECK (true);
