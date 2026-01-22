import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Calendar, Users, Scissors, BarChart3, Clock, Bell, Shield, Smartphone, Check, Star, ArrowRight, Sparkles, Crown } from "lucide-react";
import { motion } from "framer-motion";
const fadeInUp = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0
  },
  transition: {
    duration: 0.5
  }
};
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
const features = [{
  icon: Calendar,
  title: "Agenda Inteligente",
  description: "Gerencie agendamentos com drag & drop e visualização em tempo real"
}, {
  icon: Users,
  title: "Gestão de Clientes",
  description: "Histórico completo, preferências e fidelização automática"
}, {
  icon: Scissors,
  title: "Catálogo de Serviços",
  description: "Organize serviços por categoria com preços e durações"
}, {
  icon: BarChart3,
  title: "Dashboard Analytics",
  description: "KPIs em tempo real, faturamento e performance da equipe"
}, {
  icon: Clock,
  title: "Horários Flexíveis",
  description: "Configure horários individuais para cada profissional"
}, {
  icon: Bell,
  title: "Notificações Real-time",
  description: "Alertas instantâneos de novos agendamentos e lembretes"
}, {
  icon: Shield,
  title: "Multi-tenant Seguro",
  description: "Dados isolados por barbearia com controle de acesso"
}, {
  icon: Smartphone,
  title: "100% Responsivo",
  description: "Acesse de qualquer dispositivo, em qualquer lugar"
}];
const Index = () => {
  return <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <span className="font-serif text-xl font-bold text-gold-gradient">BarberPro</span>
            <Badge variant="outline" className="border-primary/50 text-primary text-xs">
              PRIME
            </Badge>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Preços
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button size="sm" className="gold-glow" asChild>
              <Link to="/login">
                Começar Grátis
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div className="max-w-4xl mx-auto text-center" initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            <motion.div initial={{
            opacity: 0,
            scale: 0.9
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.2
          }}>
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                7 dias grátis • Sem cartão de crédito
              </Badge>
            </motion.div>

            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              A Plataforma Completa para{" "}
              <span className="text-gold-gradient">Barbearias Premium</span>
            </h1>
            
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-destructive-foreground">
              Gerencie agendamentos, clientes, equipe e finanças em um só lugar. 
              Eleve sua barbearia ao próximo nível com tecnologia de ponta.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gold-glow text-lg px-8" asChild>
                <Link to="/login">
                  <Crown className="w-5 h-5 mr-2" />
                  Começar Teste Grátis
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <a href="#features">
                  Ver Recursos
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
            </div>

            {/* Social Proof */}
            <motion.div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 0.5
          }}>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>)}
                </div>
                <span>+500 barbearias</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-primary text-primary" />)}
                <span className="ml-1">4.9/5 avaliação</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
              Recursos
            </Badge>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Tudo que sua barbearia precisa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais para gestão completa do seu negócio
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerContainer} initial="initial" whileInView="animate" viewport={{
          once: true
        }}>
            {features.map((feature, index) => <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-serif">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
              Preços
            </Badge>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comece grátis por 7 dias e escolha o plano ideal para seu negócio
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Trial */}
            <motion.div initial={{
            opacity: 0,
            x: -20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <Card className="h-full bg-card border-border">
                <CardHeader className="pb-4">
                  <Badge variant="outline" className="w-fit mb-4">
                    Teste Grátis
                  </Badge>
                  <CardTitle className="font-serif text-2xl">Freemium</CardTitle>
                  <CardDescription>
                    Experimente todas as funcionalidades
                  </CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">R$ 0</span>
                    <span className="text-muted-foreground">/7 dias</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {["Acesso completo por 7 dias", "Agenda ilimitada", "Cadastro de clientes", "Gestão de serviços", "Dashboard básico", "1 usuário incluso"].map((item, index) => <li key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        {item}
                      </li>)}
                  </ul>
                  <Button variant="outline" className="w-full mt-6" size="lg" asChild>
                    <Link to="/login">
                      Começar Grátis
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium */}
            <motion.div initial={{
            opacity: 0,
            x: 20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <Card className="h-full bg-card border-primary/50 relative overflow-hidden">
                {/* Premium Badge */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground">
                    <Crown className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>

                {/* Glow Effect */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

                <CardHeader className="pb-4 relative">
                  <Badge variant="outline" className="w-fit mb-4 border-primary/50 text-primary">
                    Plano Completo
                  </Badge>
                  <CardTitle className="font-serif text-2xl text-gold-gradient">Premium</CardTitle>
                  <CardDescription>
                    Tudo que você precisa para crescer
                  </CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold text-gold-gradient">R$ 89,90</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 relative">
                  <ul className="space-y-3">
                    {["Tudo do plano gratuito", "Usuários ilimitados", "Dashboard avançado com KPIs", "Gestão de equipe completa", "Controle de estoque", "Gestão financeira", "Relatórios detalhados", "Notificações em tempo real", "Integração WhatsApp (n8n)", "Suporte prioritário"].map((item, index) => <li key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        {item}
                      </li>)}
                  </ul>
                  <Button className="w-full mt-6 gold-glow" size="lg" asChild>
                    <Link to="/login">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Começar 7 Dias Grátis
                    </Link>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Cancele a qualquer momento. Sem compromisso.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-3xl mx-auto text-center" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
              Pronto para transformar sua{" "}
              <span className="text-gold-gradient">barbearia</span>?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Junte-se a centenas de barbearias que já usam o BarberPro Prime 
              para gerenciar seus negócios de forma profissional.
            </p>
            <Button size="lg" className="gold-glow text-lg px-8" asChild>
              <Link to="/login">
                <Crown className="w-5 h-5 mr-2" />
                Começar Agora - 7 Dias Grátis
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scissors className="w-4 h-4 text-primary" />
              </div>
              <span className="font-serif font-bold text-gold-gradient">BarberPro Prime</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 BarberPro Prime. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Termos</a>
              <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
              <a href="#" className="hover:text-primary transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;