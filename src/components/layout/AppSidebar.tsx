import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCircle,
  Package,
  Receipt,
  Settings,
  Webhook,
  LogOut,
  BarChart3,
  Tag,
  Star,
  Bell,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TrialBadge } from '@/components/subscription/TrialBadge';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Agenda', url: '/agenda', icon: Calendar },
  { title: 'Clientes', url: '/clientes', icon: Users },
  { title: 'Serviços', url: '/servicos', icon: Scissors },
  { title: 'Equipe', url: '/equipe', icon: UserCircle },
];

const barberFinanceItems = [
  { title: 'Produtos', url: '/produtos', icon: Package },
  { title: 'Vendas (PDV)', url: '/vendas', icon: Package },
  { title: 'Comissões', url: '/comissoes', icon: Users },
];

const adminFinanceItems = [
  { title: 'Produtos', url: '/produtos', icon: Package },
  { title: 'Vendas (PDV)', url: '/vendas', icon: Package },
  { title: 'Caixa', url: '/caixa', icon: Receipt },
  { title: 'Comissões', url: '/comissoes', icon: Users },
  { title: 'Despesas', url: '/despesas', icon: Receipt },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
];

const marketingNavItems = [
  { title: 'Descontos', url: '/descontos', icon: Tag },
  { title: 'Fidelidade', url: '/fidelidade', icon: Star },
  { title: 'Notificações', url: '/notificacoes', icon: Bell },
  { title: 'Avaliações', url: '/avaliacoes', icon: MessageSquare },
];

const configNavItems = [
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
  { title: 'Assinatura', url: '/configuracoes?tab=subscription', icon: CreditCard },
  { title: 'Integrações', url: '/integracoes', icon: Webhook },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, organization, signOut, isAdmin } = useAuth();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path || location.pathname + location.search === path;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Scissors className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-display text-lg font-semibold text-primary truncate">
                BarberPro
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {organization?.name || 'Prime'}
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="mt-3">
            <TrialBadge />
          </div>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-primary"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(isAdmin ? adminFinanceItems : barberFinanceItems).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-primary"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Marketing</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {marketingNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3"
                        activeClassName="bg-sidebar-accent text-primary"
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {configNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3"
                        activeClassName="bg-sidebar-accent text-primary"
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-4">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-sm">
              {profile?.full_name ? getInitials(profile.full_name) : 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {isAdmin ? 'Administrador' : 'Barbeiro'}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="flex-shrink-0 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
