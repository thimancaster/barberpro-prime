-- ============================================
-- FASE 3: Sistema de Descontos e Promoções
-- ============================================

-- Tipo de desconto
CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');

-- Tipo de aplicação do desconto
CREATE TYPE public.discount_applies_to AS ENUM ('services', 'products', 'all');

-- Tabela de cupons de desconto
CREATE TABLE public.discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type discount_type NOT NULL DEFAULT 'percentage',
  value NUMERIC NOT NULL,
  min_purchase NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  applies_to discount_applies_to NOT NULL DEFAULT 'all',
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- Tabela de promoções automáticas
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type discount_type NOT NULL DEFAULT 'percentage',
  value NUMERIC NOT NULL,
  applies_to discount_applies_to NOT NULL DEFAULT 'all',
  -- Condições
  days_of_week INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  start_time TIME,
  end_time TIME,
  for_new_clients_only BOOLEAN DEFAULT false,
  min_purchase NUMERIC DEFAULT 0,
  -- Validade
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- FASE 4: Programa de Fidelidade
-- ============================================

-- Saldo de pontos por cliente
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, organization_id)
);

-- Tipo de transação de fidelidade
CREATE TYPE public.loyalty_transaction_type AS ENUM ('earned', 'redeemed', 'expired', 'bonus', 'adjustment');

-- Histórico de transações de pontos
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loyalty_points_id UUID NOT NULL REFERENCES public.loyalty_points(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type loyalty_transaction_type NOT NULL,
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recompensas disponíveis
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'discount',
  reward_value NUMERIC,
  service_id UUID REFERENCES public.services(id),
  product_id UUID REFERENCES public.products(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configurações de fidelidade por organização
CREATE TABLE public.loyalty_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  points_per_currency NUMERIC DEFAULT 1,
  currency_per_point NUMERIC DEFAULT 1,
  points_expiry_days INTEGER,
  min_points_redeem INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- FASE 5: Notificações WhatsApp
-- ============================================

-- Tipo de template de notificação
CREATE TYPE public.notification_trigger AS ENUM (
  'appointment_created', 
  'appointment_confirmed', 
  'appointment_reminder_1h', 
  'appointment_reminder_24h',
  'appointment_completed',
  'review_request',
  'loyalty_points_earned',
  'birthday'
);

-- Templates de notificação
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trigger notification_trigger NOT NULL,
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  send_via_whatsapp BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, trigger)
);

-- Status de notificação
CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');

-- Histórico de notificações enviadas
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.notification_templates(id),
  client_id UUID REFERENCES public.clients(id),
  appointment_id UUID REFERENCES public.appointments(id),
  trigger notification_trigger NOT NULL,
  message_content TEXT NOT NULL,
  phone_number TEXT,
  status notification_status NOT NULL DEFAULT 'pending',
  external_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- FASE 6: Avaliações e NPS
-- ============================================

-- Tabela de avaliações
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  client_id UUID REFERENCES public.clients(id),
  barber_id UUID REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  comment TEXT,
  response TEXT,
  response_at TIMESTAMP WITH TIME ZONE,
  response_by UUID REFERENCES public.profiles(id),
  token TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- RLS Policies
-- ============================================

-- Discounts RLS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view discounts in their organization"
  ON public.discounts FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage discounts"
  ON public.discounts FOR ALL
  USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- Promotions RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view promotions in their organization"
  ON public.promotions FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage promotions"
  ON public.promotions FOR ALL
  USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- Loyalty Points RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loyalty points in their organization"
  ON public.loyalty_points FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can manage loyalty points in their organization"
  ON public.loyalty_points FOR ALL
  USING (organization_id = get_user_organization_id(auth.uid()));

-- Loyalty Transactions RLS
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loyalty transactions in their organization"
  ON public.loyalty_transactions FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create loyalty transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Loyalty Rewards RLS
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loyalty rewards in their organization"
  ON public.loyalty_rewards FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage loyalty rewards"
  ON public.loyalty_rewards FOR ALL
  USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- Loyalty Settings RLS
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loyalty settings in their organization"
  ON public.loyalty_settings FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage loyalty settings"
  ON public.loyalty_settings FOR ALL
  USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- Notification Templates RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notification templates in their organization"
  ON public.notification_templates FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage notification templates"
  ON public.notification_templates FOR ALL
  USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- Notification Logs RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notification logs in their organization"
  ON public.notification_logs FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create notification logs"
  ON public.notification_logs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Reviews RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews in their organization"
  ON public.reviews FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Anyone can create reviews with valid token"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage reviews"
  ON public.reviews FOR UPDATE
  USING (organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid()));

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX idx_discounts_org_code ON public.discounts(organization_id, code);
CREATE INDEX idx_discounts_valid ON public.discounts(organization_id, is_active, valid_from, valid_until);
CREATE INDEX idx_promotions_org_active ON public.promotions(organization_id, is_active);
CREATE INDEX idx_loyalty_points_client ON public.loyalty_points(client_id);
CREATE INDEX idx_loyalty_transactions_loyalty ON public.loyalty_transactions(loyalty_points_id);
CREATE INDEX idx_loyalty_rewards_org ON public.loyalty_rewards(organization_id, is_active);
CREATE INDEX idx_notification_templates_org ON public.notification_templates(organization_id, trigger);
CREATE INDEX idx_notification_logs_org ON public.notification_logs(organization_id, created_at);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status, created_at);
CREATE INDEX idx_reviews_org ON public.reviews(organization_id, created_at);
CREATE INDEX idx_reviews_barber ON public.reviews(barber_id, rating);
CREATE INDEX idx_reviews_token ON public.reviews(token);

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE TRIGGER update_discounts_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_rewards_updated_at
  BEFORE UPDATE ON public.loyalty_rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_settings_updated_at
  BEFORE UPDATE ON public.loyalty_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();