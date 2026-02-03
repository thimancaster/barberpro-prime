import { motion } from 'framer-motion';
import { UserPlus, Settings, Rocket } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Cadastre-se Grátis',
    description: 'Crie sua conta em segundos. Sem cartão de crédito, sem compromisso.',
  },
  {
    icon: Settings,
    step: '02',
    title: 'Configure em 5 Minutos',
    description: 'Adicione seus serviços, equipe e horários. Interface super intuitiva.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Comece a Faturar Mais',
    description: 'Compartilhe seu link de agendamento e veja os clientes chegando.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Simples de Começar
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Em menos de 10 minutos sua barbearia estará funcionando no piloto automático
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative text-center"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}

              {/* Step Number */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <span className="absolute -top-2 -right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  {step.step}
                </span>
              </div>

              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
