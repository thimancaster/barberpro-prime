import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Trial Grátis',
    price: 'R$ 0',
    period: '7 dias',
    description: 'Teste todas as funcionalidades sem compromisso',
    features: [
      'Agenda completa',
      'Gestão de clientes',
      'Controle de caixa',
      'Link de agendamento',
      '1 usuário',
    ],
    cta: 'Começar Grátis',
    popular: false,
    priceId: null,
  },
  {
    name: 'Premium',
    price: 'R$ 89,90',
    period: '/mês',
    description: 'Tudo que você precisa para crescer',
    features: [
      'Tudo do Trial +',
      'Usuários ilimitados',
      'Relatórios avançados',
      'Notificações WhatsApp',
      'Programa de fidelidade',
      'Cupons e descontos',
      'Integrações',
      'Suporte prioritário',
    ],
    cta: 'Assinar Premium',
    popular: true,
    priceId: 'premium_monthly',
  },
  {
    name: 'Premium Anual',
    price: 'R$ 719',
    period: '/ano',
    originalPrice: 'R$ 1.078,80',
    description: 'Economize 33% pagando anualmente',
    features: [
      'Tudo do Premium +',
      '4 meses grátis',
      'Onboarding dedicado',
      'Consultoria inicial',
    ],
    cta: 'Economizar 33%',
    popular: false,
    priceId: 'premium_yearly',
  },
];

export function Pricing() {
  const navigate = useNavigate();

  const handlePlanClick = (priceId: string | null) => {
    if (priceId) {
      navigate(`/login?tab=signup&plan=${priceId}`);
    } else {
      navigate('/login?tab=signup');
    }
  };

  return (
    <section id="pricing" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Preços Simples e Transparentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece grátis e faça upgrade quando estiver pronto. Cancele a qualquer momento.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`relative h-full ${
                  plan.popular 
                    ? 'border-primary shadow-xl shadow-primary/10 scale-105' 
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-amber-500 text-primary-foreground px-4 py-1">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="text-center mb-6">
                    {plan.originalPrice && (
                      <span className="text-muted-foreground line-through text-sm">
                        {plan.originalPrice}
                      </span>
                    )}
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={() => handlePlanClick(plan.priceId)}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90' 
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.popular && <Crown className="w-4 h-4 mr-2" />}
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground text-sm mt-8"
        >
          Todos os planos incluem suporte por email. Pagamento seguro via Stripe.
        </motion.p>
      </div>
    </section>
  );
}
