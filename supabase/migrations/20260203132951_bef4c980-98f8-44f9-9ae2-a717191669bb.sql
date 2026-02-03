-- Tabela de subscriptions para controle de assinaturas Stripe
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- Adicionar comentário na tabela
COMMENT ON TABLE public.subscriptions IS 'Armazena informações de assinatura Stripe por organização';

-- Criar índices para performance
CREATE INDEX idx_subscriptions_org_id ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Habilitar RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver a subscription da própria organização
CREATE POLICY "Users can view own org subscription"
ON public.subscriptions
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar subscription de trial ao criar organização
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (
    organization_id,
    plan_id,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    'trial',
    'trialing',
    now() + interval '7 days',
    now(),
    now() + interval '7 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar subscription ao criar organização
CREATE TRIGGER create_subscription_on_org_create
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.create_trial_subscription();

-- Função para verificar se organização tem acesso premium
CREATE OR REPLACE FUNCTION public.has_premium_access(_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  sub_status TEXT;
  trial_end TIMESTAMPTZ;
BEGIN
  SELECT status, trial_ends_at INTO sub_status, trial_end
  FROM public.subscriptions
  WHERE organization_id = _org_id;
  
  IF sub_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Premium ativo
  IF sub_status = 'active' THEN
    RETURN true;
  END IF;
  
  -- Trial ainda válido
  IF sub_status = 'trialing' AND trial_end > now() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;