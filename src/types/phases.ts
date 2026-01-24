// Types for all phases - Discounts, Loyalty, Notifications, Reviews

// ============================================
// FASE 3: Descontos e Promoções
// ============================================

export type DiscountType = 'percentage' | 'fixed';
export type DiscountAppliesTo = 'services' | 'products' | 'all';

export interface Discount {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  type: DiscountType;
  value: number;
  min_purchase: number;
  max_discount?: number;
  applies_to: DiscountAppliesTo;
  valid_from?: string;
  valid_until?: string;
  usage_limit?: number;
  times_used: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  applies_to: DiscountAppliesTo;
  days_of_week: number[];
  start_time?: string;
  end_time?: string;
  for_new_clients_only: boolean;
  min_purchase: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// FASE 4: Programa de Fidelidade
// ============================================

export type LoyaltyTransactionType = 'earned' | 'redeemed' | 'expired' | 'bonus' | 'adjustment';

export interface LoyaltyPoints {
  id: string;
  client_id: string;
  organization_id: string;
  points_balance: number;
  total_points_earned: number;
  total_points_redeemed: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  loyalty_points_id: string;
  organization_id: string;
  type: LoyaltyTransactionType;
  points: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface LoyaltyReward {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  points_cost: number;
  reward_type: string;
  reward_value?: number;
  service_id?: string;
  product_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltySettings {
  id: string;
  organization_id: string;
  points_per_currency: number;
  currency_per_point: number;
  points_expiry_days?: number;
  min_points_redeem: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// FASE 5: Notificações WhatsApp
// ============================================

export type NotificationTrigger = 
  | 'appointment_created'
  | 'appointment_confirmed'
  | 'appointment_reminder_1h'
  | 'appointment_reminder_24h'
  | 'appointment_completed'
  | 'review_request'
  | 'loyalty_points_earned'
  | 'birthday';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

export interface NotificationTemplate {
  id: string;
  organization_id: string;
  trigger: NotificationTrigger;
  name: string;
  message_template: string;
  is_active: boolean;
  send_via_whatsapp: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  organization_id: string;
  template_id?: string;
  client_id?: string;
  appointment_id?: string;
  trigger: NotificationTrigger;
  message_content: string;
  phone_number?: string;
  status: NotificationStatus;
  external_id?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

export const NOTIFICATION_TRIGGER_LABELS: Record<NotificationTrigger, string> = {
  appointment_created: 'Agendamento Criado',
  appointment_confirmed: 'Agendamento Confirmado',
  appointment_reminder_1h: 'Lembrete 1h Antes',
  appointment_reminder_24h: 'Lembrete 24h Antes',
  appointment_completed: 'Atendimento Concluído',
  review_request: 'Solicitação de Avaliação',
  loyalty_points_earned: 'Pontos de Fidelidade',
  birthday: 'Aniversário',
};

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  pending: 'Pendente',
  sent: 'Enviado',
  delivered: 'Entregue',
  failed: 'Falhou',
  read: 'Lido',
};

// ============================================
// FASE 6: Avaliações e NPS
// ============================================

export interface Review {
  id: string;
  organization_id: string;
  appointment_id?: string;
  client_id?: string;
  barber_id?: string;
  rating: number;
  nps_score?: number;
  comment?: string;
  response?: string;
  response_at?: string;
  response_by?: string;
  token: string;
  is_public: boolean;
  created_at: string;
  // Joined relations
  client?: { name: string };
  barber?: { full_name: string };
  appointment?: { start_time: string; service?: { name: string } };
}

export const NPS_CATEGORIES = {
  detractor: { min: 0, max: 6, label: 'Detrator', color: 'text-destructive' },
  passive: { min: 7, max: 8, label: 'Neutro', color: 'text-warning' },
  promoter: { min: 9, max: 10, label: 'Promotor', color: 'text-success' },
} as const;

export function getNPSCategory(score: number): 'detractor' | 'passive' | 'promoter' {
  if (score <= 6) return 'detractor';
  if (score <= 8) return 'passive';
  return 'promoter';
}

export function calculateNPS(scores: number[]): number {
  if (scores.length === 0) return 0;
  const promoters = scores.filter(s => s >= 9).length;
  const detractors = scores.filter(s => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}
