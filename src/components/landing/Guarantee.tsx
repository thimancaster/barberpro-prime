import { Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function Guarantee() {
  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
            Garantia Total de Satisfação
          </h2>

          <p className="text-lg text-muted-foreground mb-8">
            Teste o BarberPro Prime por 7 dias completamente grátis. 
            Se não gostar, é só não assinar. Sem burocracia, sem perguntas.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>7 dias grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>Cancele quando quiser</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>Suporte incluso</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
