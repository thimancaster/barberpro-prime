export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
export type PlanId = 'trial' | 'premium_monthly' | 'premium_yearly';

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: PlanId;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionState {
  subscription: Subscription | null;
  status: SubscriptionStatus;
  plan: PlanId;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  isLoading: boolean;
  isPremium: boolean;
  isTrialing: boolean;
  isExpired: boolean;
  daysRemaining: number;
  refetch: () => Promise<void>;
}

// Features available per plan
export const PLAN_FEATURES = {
  trial: {
    agenda: true,
    clientes: true,
    servicos: true,
    produtos: true,
    vendas: true,
    caixa: true,
    maxUsers: 1,
    relatorios: false,
    notificacoes: false,
    fidelidade: false,
    descontos: false,
    integracoes: false,
    suportePrioritario: false,
  },
  premium_monthly: {
    agenda: true,
    clientes: true,
    servicos: true,
    produtos: true,
    vendas: true,
    caixa: true,
    maxUsers: Infinity,
    relatorios: true,
    notificacoes: true,
    fidelidade: true,
    descontos: true,
    integracoes: true,
    suportePrioritario: true,
  },
  premium_yearly: {
    agenda: true,
    clientes: true,
    servicos: true,
    produtos: true,
    vendas: true,
    caixa: true,
    maxUsers: Infinity,
    relatorios: true,
    notificacoes: true,
    fidelidade: true,
    descontos: true,
    integracoes: true,
    suportePrioritario: true,
  },
} as const;

export type FeatureKey = Exclude<keyof typeof PLAN_FEATURES.trial, 'maxUsers'>;

export function hasFeatureAccess(plan: PlanId, feature: FeatureKey): boolean {
  const value = PLAN_FEATURES[plan]?.[feature];
  return typeof value === 'boolean' ? value : false;
}
