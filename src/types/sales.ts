// Types for PDV, Cash Register, and Commissions

export interface ProductSale {
  id: string;
  organization_id: string;
  product_id: string;
  barber_id: string | null;
  client_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  commission_percentage: number;
  commission_amount: number;
  cash_register_id: string | null;
  notes: string | null;
  created_at: string;
  // Joined fields
  product?: {
    name: string;
    sale_price: number;
  };
  barber?: {
    full_name: string;
  };
  client?: {
    name: string;
  };
}

export interface CashRegister {
  id: string;
  organization_id: string;
  opened_by: string;
  closed_by: string | null;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
  status: 'open' | 'closed';
  // Joined fields
  opener?: {
    full_name: string;
  };
  closer?: {
    full_name: string;
  };
}

export interface CashMovement {
  id: string;
  organization_id: string;
  cash_register_id: string;
  type: 'income' | 'expense' | 'withdrawal' | 'deposit' | 'adjustment';
  category: string | null;
  amount: number;
  description: string | null;
  reference_type: 'appointment' | 'product_sale' | 'expense' | 'manual' | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
  // Joined fields
  creator?: {
    full_name: string;
  };
}

export interface CommissionPayment {
  id: string;
  organization_id: string;
  barber_id: string;
  period_start: string;
  period_end: string;
  total_services: number;
  total_products: number;
  total_commission: number;
  appointments_count: number;
  products_count: number;
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  status: 'pending' | 'paid';
  created_at: string;
  // Joined fields
  barber?: {
    full_name: string;
    avatar_url: string | null;
  };
  payer?: {
    full_name: string;
  };
}

export type MovementType = CashMovement['type'];
export type MovementCategory = 'service' | 'product' | 'withdrawal' | 'deposit' | 'expense' | 'other';
