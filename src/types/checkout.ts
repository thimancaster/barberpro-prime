// Types for the Unified Checkout System

export type PaymentMethodType = 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'voucher' | 'mixed';

export interface PaymentSplit {
  method: PaymentMethodType;
  amount: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  commissionPercentage: number;
}

export interface CheckoutState {
  appointmentId: string;
  serviceTotal: number;
  serviceCommission: number;
  productsTotal: number;
  productsCommission: number;
  discountAmount: number;
  discountPercentage: number;
  discountReason: string;
  tipAmount: number;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethodType;
  paymentSplits: PaymentSplit[];
  cartItems: CartItem[];
}

export interface Payment {
  id: string;
  organization_id: string;
  appointment_id: string | null;
  client_id: string | null;
  barber_id: string | null;
  cash_register_id: string | null;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  discount_reason: string | null;
  tip_amount: number;
  total_amount: number;
  payment_method: PaymentMethodType;
  payment_details: PaymentSplit[];
  service_commission: number;
  product_commission: number;
  total_commission: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentItem {
  id: string;
  payment_id: string;
  organization_id: string;
  product_id: string | null;
  item_type: 'product' | 'service';
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  commission_percentage: number;
  commission_amount: number;
  created_at: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  voucher: 'Vale/Voucher',
  mixed: 'Dividido',
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethodType, string> = {
  cash: 'Banknote',
  pix: 'QrCode',
  credit_card: 'CreditCard',
  debit_card: 'CreditCard',
  voucher: 'Ticket',
  mixed: 'Split',
};
