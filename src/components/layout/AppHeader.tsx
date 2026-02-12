import { Menu } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/agenda': 'Agenda',
  '/clientes': 'Clientes',
  '/servicos': 'Serviços',
  '/equipe': 'Equipe',
  '/produtos': 'Produtos',
  '/vendas': 'Vendas (PDV)',
  '/caixa': 'Caixa',
  '/comissoes': 'Comissões',
  '/relatorios': 'Relatórios',
  '/despesas': 'Despesas',
  '/descontos': 'Descontos',
  '/fidelidade': 'Fidelidade',
  '/notificacoes': 'Notificações',
  '/avaliacoes': 'Avaliações',
  '/configuracoes': 'Configurações',
  '/integracoes': 'Integrações',
};

export function AppHeader() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || '';

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden">
          <Menu className="w-5 h-5" />
        </SidebarTrigger>
        
        {title && (
          <h1 className="text-xl font-display font-semibold">{title}</h1>
        )}
      </div>
    </header>
  );
}
