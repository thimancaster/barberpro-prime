
# Plano Completo: Finalizacao do Sistema + Stripe + Landing Page de Vendas

## Resumo Executivo

Este plano aborda 4 grandes areas:
1. **Varredura e correcoes** do sistema atual
2. **Landing Page otimizada para vendas** (trafego pago)
3. **Sistema de autenticacao com auto-cadastro** (sem depender de convites)
4. **Integracao Stripe para pagamentos** e controle de acesso por plano

---

## PARTE 1: Estado Atual do Sistema

### O que ja esta implementado:

| Modulo | Status | Observacoes |
|--------|--------|-------------|
| Agenda/Agendamentos | OK | Drag & drop, realtime |
| Clientes | OK | CRUD, historico |
| Servicos | OK | Categorias, precos |
| Equipe/Profiles | OK | Convite + cadastro manual |
| Produtos/Estoque | OK | PDV, movimentacoes |
| Caixa | OK | Abertura/fechamento |
| Comissoes | OK | Calculo automatico |
| Checkout Unificado | OK | Pagamentos + produtos |
| Notificacoes | OK | Templates, n8n webhook |
| Hierarquia Admin/Barber | OK | Rotas protegidas |
| Agendamento Publico | OK | Link por slug |
| Avaliacoes/Reviews | OK | NPS, feedback |
| Fidelidade | OK | Pontos, recompensas |
| Descontos/Cupons | OK | Codigos promocionais |
| Despesas | OK | CRUD, recorrentes |
| Relatorios | OK | Dashboards basicos |

### O que falta implementar:

| Item | Prioridade | Descricao |
|------|-----------|-----------|
| Self-signup | ALTA | Cadastro publico sem convite |
| Integracao Stripe | ALTA | Pagamentos de assinatura |
| Trial de 7 dias | ALTA | Periodo de teste |
| Controle por plano | ALTA | Bloquear funcoes por plano |
| Landing Page Vendas | ALTA | Otimizada para conversao |
| Tabela subscriptions | ALTA | Armazenar status da assinatura |

---

## PARTE 2: Landing Page Otimizada para Vendas

### Problemas da Landing Page Atual:
1. **Generica** - Nao e focada em conversao para trafego pago
2. **Sem urgencia** - Falta escassez/urgencia
3. **CTAs fracos** - Redirecionam apenas para /login
4. **Sem prova social real** - Numeros ficticios sem credibilidade
5. **Sem FAQ** - Duvidas nao respondidas
6. **Sem garantia** - Falta seguranca para o comprador

### Nova Estrutura da Landing Page:

```text
+------------------------------------------+
|  HEADER FIXO (simplificado)              |
|  Logo | CTA: "Teste Gratis 7 Dias"       |
+------------------------------------------+

+------------------------------------------+
|  HERO SECTION                            |
|  - Headline focada em DOR do cliente     |
|  - Subheadline com solucao               |
|  - CTA primario: "Comece Agora - Gratis" |
|  - Video/GIF mostrando o sistema         |
|  - Badge urgencia: "Oferta por tempo     |
|    limitado"                             |
+------------------------------------------+

+------------------------------------------+
|  SOCIAL PROOF (barra de logos/numeros)   |
|  - "500+ barbearias confiam"             |
|  - Estrelas 4.9/5                        |
|  - "R$ 2M+ gerenciados"                  |
+------------------------------------------+

+------------------------------------------+
|  PROBLEMA/AGITACAO                       |
|  - Lista de dores do barbeiro            |
|  - "Voce ainda faz isso manualmente?"    |
+------------------------------------------+

+------------------------------------------+
|  SOLUCAO (Features com beneficios)       |
|  - 8 cards com icones                    |
|  - Foco em RESULTADOS nao funcoes        |
+------------------------------------------+

+------------------------------------------+
|  COMO FUNCIONA (3 passos)                |
|  1. Cadastre-se gratis                   |
|  2. Configure em 5 minutos               |
|  3. Comece a faturar mais                |
+------------------------------------------+

+------------------------------------------+
|  COMPARATIVO (Antes x Depois)            |
|  - Tabela visual                         |
+------------------------------------------+

+------------------------------------------+
|  PRECOS (2 planos)                       |
|  - Gratis 7 dias (todas funcoes)         |
|  - Premium R$89,90/mes                   |
|  - CTA com Stripe Checkout               |
+------------------------------------------+

+------------------------------------------+
|  FAQ (Acordeao)                          |
|  - 6-8 perguntas comuns                  |
+------------------------------------------+

+------------------------------------------+
|  GARANTIA                                |
|  - 7 dias gratis + cancele quando quiser |
+------------------------------------------+

+------------------------------------------+
|  CTA FINAL                               |
|  - "Nao perca mais clientes"             |
|  - Botao grande                          |
+------------------------------------------+

+------------------------------------------+
|  FOOTER (simplificado)                   |
|  - Termos | Privacidade | Suporte        |
+------------------------------------------+
```

### Arquivos a Criar/Modificar:

| Arquivo | Acao |
|---------|------|
| `src/pages/Index.tsx` | Refatorar completamente |
| `src/components/landing/Hero.tsx` | Criar |
| `src/components/landing/Features.tsx` | Criar |
| `src/components/landing/Pricing.tsx` | Criar |
| `src/components/landing/FAQ.tsx` | Criar |
| `src/components/landing/Testimonials.tsx` | Criar |
| `src/components/landing/HowItWorks.tsx` | Criar |

---

## PARTE 3: Sistema de Autenticacao com Self-Signup

### Fluxo Atual (problema):
```text
Usuario -> Landing -> Login -> BLOQUEADO (precisa convite)
```

### Novo Fluxo:
```text
Usuario -> Landing -> Cadastro -> Trial 7 dias -> Onboarding -> Dashboard
                             |
                             v
                      (apos 7 dias)
                             |
                             v
                      Stripe Checkout -> Premium
```

### Modificacoes no Login:

1. **Adicionar aba de Cadastro** na pagina de login
2. **Signup publico** - qualquer pessoa pode criar conta
3. **Apos signup** -> redirecionar para Onboarding
4. **Trial automatico** de 7 dias

### Nova Estrutura da Pagina de Login:

```text
+------------------------------------------+
|  CARD DE AUTENTICACAO                    |
|                                          |
|  [Entrar]  [Criar Conta]   <- Tabs       |
|                                          |
|  -- Aba Entrar --                        |
|  Email: [___________]                    |
|  Senha: [___________]                    |
|  [Entrar]                                |
|  [Esqueci a senha]                       |
|                                          |
|  -- Aba Criar Conta --                   |
|  Nome: [___________]                     |
|  Email: [___________]                    |
|  Senha: [___________]                    |
|  Confirmar: [___________]                |
|  [Comecar 7 Dias Gratis]                 |
+------------------------------------------+
```

### Arquivos a Modificar:

| Arquivo | Modificacoes |
|---------|-------------|
| `src/pages/Login.tsx` | Adicionar tabs + signup |
| `src/contexts/AuthContext.tsx` | Adicionar trial_ends_at no profile |

---

## PARTE 4: Integracao Stripe

### Estrutura de Planos:

| Plano | Preco | Periodo | Stripe Price ID |
|-------|-------|---------|-----------------|
| Trial | R$ 0 | 7 dias | - |
| Premium Mensal | R$ 89,90 | mes | Criar no Stripe |
| Premium Anual | R$ 719,00 | ano | Criar no Stripe |

### Tabelas de Banco de Dados Necessarias:

```sql
-- Nova tabela: subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'trialing', -- trialing, active, past_due, canceled, expired
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org subscription"
ON subscriptions FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Only system can insert/update subscriptions"
ON subscriptions FOR ALL
USING (false); -- Apenas Edge Functions com service role
```

### Edge Functions Necessarias:

1. **`create-checkout-session`**
   - Cria sessao Stripe Checkout
   - Redireciona usuario para pagamento

2. **`stripe-webhook`**
   - Recebe eventos do Stripe
   - Atualiza status da subscription
   - Eventos: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`

3. **`create-portal-session`**
   - Permite usuario gerenciar assinatura
   - Cancelar, trocar cartao, ver faturas

### Fluxo de Pagamento:

```text
1. Usuario clica "Assinar Premium"
         |
         v
2. Frontend chama Edge Function create-checkout-session
         |
         v
3. Edge Function cria sessao no Stripe
         |
         v
4. Usuario e redirecionado para Stripe Checkout
         |
         v
5. Stripe processa pagamento
         |
         v
6. Webhook stripe-webhook recebe evento
         |
         v
7. Edge Function atualiza tabela subscriptions
         |
         v
8. Usuario ve status Premium no dashboard
```

### Controle de Acesso por Plano:

```text
Funcoes por Plano:

| Funcao                  | Trial | Premium |
|------------------------|-------|---------|
| Agenda                 | SIM   | SIM     |
| Clientes               | SIM   | SIM     |
| Servicos               | SIM   | SIM     |
| 1 Usuario              | SIM   | SIM     |
| Usuarios Ilimitados    | NAO   | SIM     |
| Dashboard Avancado     | NAO   | SIM     |
| Relatorios             | NAO   | SIM     |
| Notificacoes WhatsApp  | NAO   | SIM     |
| Fidelidade             | NAO   | SIM     |
| Descontos              | NAO   | SIM     |
| Integracoes            | NAO   | SIM     |
| Suporte Prioritario    | NAO   | SIM     |
```

### Componente de Paywall:

Criar componente que exibe:
- Trial restante (X dias)
- Botao para upgrade
- Bloqueio de funcoes premium

---

## PARTE 5: Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/Index.tsx` | Landing page refatorada |
| `src/components/landing/Hero.tsx` | Secao hero |
| `src/components/landing/Features.tsx` | Grid de features |
| `src/components/landing/Pricing.tsx` | Cards de precos com Stripe |
| `src/components/landing/FAQ.tsx` | Acordeao de perguntas |
| `src/components/landing/HowItWorks.tsx` | 3 passos |
| `src/components/landing/Testimonials.tsx` | Depoimentos |
| `src/components/landing/Guarantee.tsx` | Garantia |
| `src/components/subscription/PaywallBanner.tsx` | Banner de upgrade |
| `src/components/subscription/TrialBadge.tsx` | Badge de trial |
| `src/hooks/useSubscription.ts` | Hook para status da assinatura |
| `src/types/subscription.ts` | Tipos de subscription |
| `supabase/functions/create-checkout-session/index.ts` | Criar sessao Stripe |
| `supabase/functions/stripe-webhook/index.ts` | Webhook do Stripe |
| `supabase/functions/create-portal-session/index.ts` | Portal do cliente |

## PARTE 6: Arquivos a Modificar

| Arquivo | Modificacoes |
|---------|-------------|
| `src/pages/Login.tsx` | Tabs + signup |
| `src/contexts/AuthContext.tsx` | Adicionar subscription state |
| `src/components/ProtectedRoute.tsx` | Verificar subscription |
| `src/components/layout/AppSidebar.tsx` | Mostrar status do plano |
| `supabase/config.toml` | Novas Edge Functions |
| `.env` | Adicionar STRIPE_PUBLISHABLE_KEY |

## PARTE 7: Migracoes SQL

```sql
-- 1. Tabela de subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (...);

-- 2. Atualizar funcao create_organization para criar trial
-- Adicionar trial_ends_at automaticamente

-- 3. RLS policies para subscriptions
```

---

## Ordem de Implementacao

### Fase 1: Infraestrutura (Stripe + Database)
1. Habilitar Stripe no Lovable
2. Criar produtos/precos no Stripe
3. Criar tabela `subscriptions`
4. Criar Edge Functions do Stripe
5. Configurar webhook do Stripe

### Fase 2: Autenticacao
1. Modificar Login.tsx com tabs
2. Implementar signup publico
3. Modificar create_organization para trial
4. Criar hook useSubscription

### Fase 3: Controle de Acesso
1. Atualizar ProtectedRoute com verificacao de plano
2. Criar PaywallBanner
3. Criar TrialBadge
4. Integrar no Sidebar/Dashboard

### Fase 4: Landing Page
1. Criar componentes de landing
2. Refatorar Index.tsx
3. Conectar CTAs com Stripe Checkout
4. Testar fluxo completo

### Fase 5: Testes e Polimento
1. Testar trial -> expiracao
2. Testar pagamento -> ativacao
3. Testar cancelamento
4. Ajustar copy para conversao

---

## Secao Tecnica

### Configuracao do Stripe:

1. **Criar Produtos no Stripe Dashboard:**
   - Produto: "BarberPro Prime Premium"
   - Preco Mensal: R$ 89,90 (BRL)
   - Preco Anual: R$ 719,00 (BRL)

2. **Webhook URL:**
   - `https://{project-id}.supabase.co/functions/v1/stripe-webhook`
   - Eventos: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`

3. **Secrets Necessarios:**
   - `STRIPE_SECRET_KEY` - Chave secreta do Stripe
   - `STRIPE_WEBHOOK_SECRET` - Secret do webhook

### Edge Function create-checkout-session:

```typescript
// Parametros esperados:
{
  price_id: string; // ID do preco no Stripe
  success_url: string;
  cancel_url: string;
}

// Retorno:
{
  checkout_url: string;
}
```

### Edge Function stripe-webhook:

```typescript
// Eventos tratados:
// checkout.session.completed -> Cria subscription com status 'active'
// invoice.paid -> Atualiza current_period_end
// customer.subscription.updated -> Atualiza status
// customer.subscription.deleted -> Marca como 'canceled'
```

### Hook useSubscription:

```typescript
interface SubscriptionState {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  plan: 'trial' | 'premium';
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  isLoading: boolean;
  isPremium: boolean;
  daysRemaining: number;
}
```

---

## Resultado Final

Apos implementacao:

1. **Usuario visita landing** -> Ve pagina otimizada para vendas
2. **Clica em "Comecar Gratis"** -> Tela de cadastro
3. **Cria conta** -> Automaticamente tem 7 dias de trial
4. **Completa onboarding** -> Acessa todas funcoes
5. **Trial expira** -> Ve banner de upgrade
6. **Clica em "Assinar"** -> Stripe Checkout
7. **Paga** -> Acesso Premium liberado
8. **Gerencia assinatura** -> Portal do Stripe

