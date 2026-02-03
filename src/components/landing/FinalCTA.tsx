import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-amber-500/10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Zap className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Não perca mais clientes para a concorrência
          </h2>

          <p className="text-lg text-muted-foreground mb-8">
            Enquanto você espera, outras barbearias já estão automatizando seus processos 
            e conquistando mais clientes. Comece agora e veja a diferença em 7 dias.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/login?tab=signup')}
              className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 shadow-xl shadow-primary/25"
            >
              Começar Meu Teste Grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            ✓ Setup em 5 minutos &nbsp; ✓ Sem cartão de crédito &nbsp; ✓ Suporte incluso
          </p>
        </motion.div>
      </div>
    </section>
  );
}
