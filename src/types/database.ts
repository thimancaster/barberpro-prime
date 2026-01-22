// Database types for BarberPro Prime

export type AppRole = 'admin' | 'barber';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type ServiceCategory = 'cabelo' | 'barba' | 'combo' | 'outros';
export type ExpenseStatus = 'pending' | 'paid';
export type RecurrenceType = 'none' | 'monthly' | 'weekly' | 'yearly';
export type StockMovementType = 'entry' | 'exit' | 'sale' | 'adjustment';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  opening_time?: string;
  closing_time?: string;
  working_days?: number[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id?: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  commission_percentage: number;
  product_commission_percentage?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  organization_id: string;
  role: AppRole;
  created_at: string;
}

export interface WorkingHours {
  id: string;
  profile_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  commission_percentage: number;
  category: ServiceCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  total_spent: number;
  total_visits: number;
  last_visit_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  organization_id: string;
  client_id?: string;
  barber_id?: string;
  service_id?: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  price: number;
  commission_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined relations
  client?: Client;
  barber?: Profile;
  service?: Service;
}

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  sale_price: number;
  cost_price: number;
  quantity: number;
  min_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  organization_id: string;
  type: StockMovementType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason?: string;
  created_by?: string;
  created_at: string;
  // Joined relations
  product?: Product;
  creator?: Profile;
}

export interface Expense {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  amount: number;
  category?: string;
  due_date?: string;
  paid_at?: string;
  status: ExpenseStatus;
  is_recurring: boolean;
  recurrence_type?: RecurrenceType;
  recurrence_day?: number;
  parent_expense_id?: string;
  created_at: string;
  updated_at: string;
}

export interface N8nIntegration {
  id: string;
  organization_id: string;
  webhook_url?: string;
  whatsapp_instance_id?: string;
  is_active: boolean;
  last_test_at?: string;
  last_test_success?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invite {
  id: string;
  organization_id: string;
  email?: string;
  role: AppRole;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_by?: string;
  created_at: string;
}
