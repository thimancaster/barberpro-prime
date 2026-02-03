import { 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart3, 
  Bell, 
  Gift, 
  Smartphone, 
  Shield 
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Calendar,
    title: 'Agenda Inteligente',
    description: 'Organize seus horários com drag & drop. Seus clientes agendam online 24/7.',
    highlight: 'Reduz 80% do tempo no telefone',
  },
  {
    icon: Users,
    title: 'Gestão de Clientes',
    description: 'Histórico completo, preferências e lembretes automáticos para cada cliente.',
    highlight: 'Aumente a recorrência',
  },
  {
    icon: DollarSign,
    title: 'Controle Financeiro',
    description: 'Caixa, comissões, despesas e vendas de produtos em um só lugar.',
    highlight: 'Saiba exatamente quanto lucra',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Completos',
    description: 'Dashboard com métricas de faturamento, clientes e desempenho da equipe.',
    highlight: 'Decisões baseadas em dados',
  },
  {
    icon: Bell,
    title: 'Notificações Automáticas',
    description: 'WhatsApp e SMS para confirmar, lembrar e reconquistar clientes.',
    highlight: 'Zero no-show',
  },
  {
    icon: Gift,
    title: 'Programa de Fidelidade',
    description: 'Pontos, recompensas e cupons para transformar clientes em fãs.',
    highlight: 'Clientes voltam mais',
  },
  {
    icon: Smartphone,
    title: 'Link de Agendamento',
    description: 'Página própria para clientes agendarem. Perfeito para Instagram e WhatsApp.',
    highlight: 'Profissional e moderno',
  },
  {
    icon: Shield,
    title: 'Seguro e Confiável',
    description: 'Dados criptografados, backups automáticos e suporte dedicado.',
    highlight: 'Seus dados protegidos',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Tudo que sua barbearia precisa
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ferramentas profissionais que antes só grandes redes tinham acesso. 
            Agora disponíveis para você.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm mb-3">
                {feature.description}
              </p>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                {feature.highlight}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
