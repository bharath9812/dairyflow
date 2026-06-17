-- Schema for Dairy Milk Procurement Ledger System

-- ENUMS
CREATE TYPE milk_type_enum AS ENUM ('Cow', 'Buffalo');
CREATE TYPE allocation_type_enum AS ENUM ('AUTO', 'MANUAL', 'ADJUSTMENT');
CREATE TYPE loan_status_enum AS ENUM ('ACTIVE', 'CLOSED');
CREATE TYPE customer_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE event_type_enum AS ENUM ('CREATED', 'UPDATED_INCREASE', 'UPDATED_DECREASE', 'DELETED', 'RECOMPUTED');

-- 1. Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  status customer_status_enum NOT NULL DEFAULT 'ACTIVE',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Transactions (Milk Procurement Ledger)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  milk_type milk_type_enum NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  fat_percentage NUMERIC CHECK (fat_percentage >= 0),
  rate NUMERIC NOT NULL CHECK (rate >= 0),
  total_amount NUMERIC NOT NULL GENERATED ALWAYS AS (quantity * rate) STORED,
  loan_deducted_amount NUMERIC NOT NULL DEFAULT 0 CHECK (loan_deducted_amount >= 0),
  net_payable NUMERIC NOT NULL GENERATED ALWAYS AS ((quantity * rate) - loan_deducted_amount) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Indexes for Transactions
CREATE INDEX idx_transactions_customer_date ON transactions(customer_id, transaction_date DESC);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- 3. Loans
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  issued_amount NUMERIC NOT NULL CHECK (issued_amount > 0),
  recovered_amount NUMERIC NOT NULL DEFAULT 0 CHECK (recovered_amount >= 0),
  remaining_amount NUMERIC NOT NULL GENERATED ALWAYS AS (issued_amount - recovered_amount) STORED,
  status loan_status_enum NOT NULL DEFAULT 'ACTIVE',
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Index for Loans
CREATE INDEX idx_loans_customer_id ON loans(customer_id);

-- 4. Loan Allocations (The Critical Link Table)
CREATE TABLE loan_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  amount_allocated NUMERIC NOT NULL CHECK (amount_allocated > 0),
  allocation_type allocation_type_enum NOT NULL DEFAULT 'AUTO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Indexes for Loan Allocations
CREATE INDEX idx_allocations_loan_id ON loan_allocations(loan_id);
CREATE INDEX idx_allocations_transaction_id ON loan_allocations(transaction_id);
CREATE INDEX idx_allocations_customer_id ON loan_allocations(customer_id);

-- 5. Loan Events (Event Sourcing)
CREATE TABLE loan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  event_type event_type_enum NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX idx_loan_events_loan_id ON loan_events(loan_id, created_at ASC);

-- 6. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- e.g., 'customer', 'transaction', 'loan'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- e.g., 'INSERT', 'UPDATE', 'DELETE'
  before_state JSONB,
  after_state JSONB,
  performed_by UUID, -- Typically references auth.users(id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- TRIGGER FUNCTIONS
-- Auto-update `updated_at` column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc', now());
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_loans_modtime BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- RLS Configuration (Optional/Required for Supabase)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Update according to exact auth rules later)
CREATE POLICY "Allow anonymous select on customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on customers" ON customers FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select on transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on transactions" ON transactions FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select on loans" ON loans FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on loans" ON loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on loans" ON loans FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select on loan_allocations" ON loan_allocations FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on loan_allocations" ON loan_allocations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select on loan_events" ON loan_events FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on loan_events" ON loan_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select on audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);
