import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const faqs = [
  {
    question: 'Como funciona o período de teste grátis?',
    answer: 'Você tem 7 dias para testar todas as funcionalidades do BarberPro Prime sem pagar nada. Não pedimos cartão de crédito para começar. Ao final do período, você pode escolher assinar ou seus dados serão mantidos por mais 30 dias caso queira voltar.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim! Não há contratos de fidelidade. Você pode cancelar sua assinatura a qualquer momento diretamente pelo sistema. Seu acesso continua até o final do período pago.',
  },
  {
    question: 'Preciso instalar algum programa?',
    answer: 'Não! O BarberPro Prime funciona 100% na nuvem, direto do navegador. Funciona no computador, tablet ou celular. Seus dados estão sempre sincronizados e seguros.',
  },
  {
    question: 'Como meus clientes agendam online?',
    answer: 'Você recebe um link exclusivo da sua barbearia (ex: barberproprime.app/sua-barbearia) que pode compartilhar no Instagram, WhatsApp ou onde quiser. Seus clientes escolhem o serviço, profissional e horário disponível.',
  },
  {
    question: 'Posso adicionar minha equipe?',
    answer: 'Sim! No plano Premium você pode adicionar quantos profissionais precisar. Cada um tem seu login, agenda própria e você acompanha as comissões automaticamente.',
  },
  {
    question: 'Como funcionam as notificações por WhatsApp?',
    answer: 'O sistema envia lembretes automáticos para seus clientes: confirmação do agendamento, lembrete 24h antes e pesquisa de satisfação após o atendimento. Tudo configurável conforme sua preferência.',
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Absolutamente! Usamos criptografia de ponta a ponta, servidores seguros e fazemos backups automáticos. Seus dados são seus e nunca compartilhamos com terceiros.',
  },
  {
    question: 'Vocês oferecem suporte?',
    answer: 'Sim! Todos os planos incluem suporte por email. Assinantes Premium têm suporte prioritário e acesso ao onboarding dedicado para configurar tudo da melhor forma.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tire suas dúvidas antes de começar
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
