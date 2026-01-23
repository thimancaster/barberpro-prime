-- Create enum for payment methods
CREATE TYPE payment_method AS ENUM ('cash', 'pix', 'credit_card', 'debit_card', 'voucher', 'mixed');

-- Create payments table to track all payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL,
  
  -- Amounts
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  discount_reason TEXT,
  tip_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  
  -- Payment info
  payment_method payment_method NOT NULL DEFAULT 'cash',
  
  -- For split payments (JSON array of {method, amount})
  payment_details JSONB DEFAULT '[]',
  
  -- Commission
  service_commission NUMERIC DEFAULT 0,
  product_commission NUMERIC DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for products included in a payment (checkout products)
CREATE TABLE public.payment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Item can be a product
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  
  -- Item details
  item_type TEXT NOT NULL DEFAULT 'product', -- 'product' or 'service'
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  
  -- Commission
  commission_percentage NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add payment_method to appointments for quick reference
ALTER TABLE public.appointments 
ADD COLUMN payment_method payment_method,
ADD COLUMN payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view payments in their organization"
ON public.payments FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create payments in their organization"
ON public.payments FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage payments"
ON public.payments FOR ALL
USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- RLS Policies for payment_items
CREATE POLICY "Users can view payment items in their organization"
ON public.payment_items FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create payment items in their organization"
ON public.payment_items FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage payment items"
ON public.payment_items FOR ALL
USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_payments_organization ON public.payments(organization_id);
CREATE INDEX idx_payments_appointment ON public.payments(appointment_id);
CREATE INDEX idx_payments_client ON public.payments(client_id);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX idx_payment_items_payment ON public.payment_items(payment_id);

-- Trigger to update updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();