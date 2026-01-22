-- ===========================================
-- FASE 2: MÓDULOS ESSENCIAIS DO ROADMAP
-- ===========================================

-- 1. TABELA DE VENDAS DE PRODUTOS (PDV)
CREATE TABLE public.product_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  commission_percentage NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  cash_register_id UUID, -- Será referenciado após criar a tabela
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para product_sales
CREATE INDEX idx_product_sales_organization ON public.product_sales(organization_id);
CREATE INDEX idx_product_sales_barber ON public.product_sales(barber_id);
CREATE INDEX idx_product_sales_created_at ON public.product_sales(created_at);

-- RLS para product_sales
ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sales in their organization"
ON public.product_sales FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create sales in their organization"
ON public.product_sales FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage sales"
ON public.product_sales FOR ALL
USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- 2. TABELA DE CAIXA DIÁRIO
CREATE TABLE public.cash_registers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  closing_amount NUMERIC,
  expected_amount NUMERIC,
  difference NUMERIC,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

-- Índices para cash_registers
CREATE INDEX idx_cash_registers_organization ON public.cash_registers(organization_id);
CREATE INDEX idx_cash_registers_status ON public.cash_registers(status);
CREATE INDEX idx_cash_registers_opened_at ON public.cash_registers(opened_at);

-- RLS para cash_registers
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cash registers in their organization"
ON public.cash_registers FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage cash registers"
ON public.cash_registers FOR ALL
USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- 3. TABELA DE MOVIMENTAÇÕES DE CAIXA
CREATE TABLE public.cash_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'withdrawal', 'deposit', 'adjustment')),
  category TEXT,
  amount NUMERIC NOT NULL,
  description TEXT,
  reference_type TEXT, -- 'appointment', 'product_sale', 'expense', 'manual'
  reference_id UUID,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para cash_movements
CREATE INDEX idx_cash_movements_register ON public.cash_movements(cash_register_id);
CREATE INDEX idx_cash_movements_type ON public.cash_movements(type);
CREATE INDEX idx_cash_movements_created_at ON public.cash_movements(created_at);

-- RLS para cash_movements
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view movements in their organization"
ON public.cash_movements FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create movements in their organization"
ON public.cash_movements FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage movements"
ON public.cash_movements FOR ALL
USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- 4. TABELA DE PAGAMENTOS DE COMISSÕES
CREATE TABLE public.commission_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_services NUMERIC DEFAULT 0,
  total_products NUMERIC DEFAULT 0,
  total_commission NUMERIC NOT NULL,
  appointments_count INTEGER DEFAULT 0,
  products_count INTEGER DEFAULT 0,
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para commission_payments
CREATE INDEX idx_commission_payments_organization ON public.commission_payments(organization_id);
CREATE INDEX idx_commission_payments_barber ON public.commission_payments(barber_id);
CREATE INDEX idx_commission_payments_status ON public.commission_payments(status);
CREATE INDEX idx_commission_payments_period ON public.commission_payments(period_start, period_end);

-- RLS para commission_payments
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own commission payments"
ON public.commission_payments FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()) AND (barber_id = auth.uid() OR is_admin(auth.uid())));

CREATE POLICY "Admins can manage commission payments"
ON public.commission_payments FOR ALL
USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- 5. Adicionar FK de cash_register_id na product_sales
ALTER TABLE public.product_sales 
ADD CONSTRAINT product_sales_cash_register_id_fkey 
FOREIGN KEY (cash_register_id) REFERENCES public.cash_registers(id) ON DELETE SET NULL;

-- 6. Adicionar comissão de produtos nos profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS product_commission_percentage NUMERIC DEFAULT 0;