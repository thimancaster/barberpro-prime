import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, Client, Service, Profile } from '@/types/database';
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Scissors,
  Percent,
  ShoppingBag,
  Plus,
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PaywallBanner } from '@/components/subscription/PaywallBanner';
import { toast } from 'sonner';

interface DashboardStats {
  todayRevenue: number;
  monthRevenue: number;
  todayAppointments: number;
  totalClients: number;
  lowStockProducts: number;
  pendingCommissions: number;
}

interface UpcomingAppointment extends Appointment {
  client: Client | null;
  service: Service | null;
  barber: Profile | null;
}

function StatCardSkeleton() {
  return (
    <div className="glass-panel p-6">
      <div className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-8 w-32 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export default function Dashboard() {
  const { profile, organization, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    monthRevenue: 0,
    todayAppointments: 0,
    totalClients: 0,
    lowStockProducts: 0,
    pendingCommissions: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check for upgrade success or upgrade prompt
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      toast.success('Assinatura ativada com sucesso!', {
        description: 'Agora você tem acesso a todas as funcionalidades Premium.',
      });
      window.history.replaceState({}, '', '/dashboard');
    }
    if (searchParams.get('upgrade') === 'true') {
      toast.info('Funcionalidade Premium', {
        description: 'Faça upgrade do seu plano para acessar esta funcionalidade.',
      });
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    if (organization?.id) {
      fetchDashboardData();
    }
  }, [organization?.id]);

  const fetchDashboardData = async () => {
    if (!organization?.id) return;

    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();
    const monthStart = startOfMonth(today).toISOString();
    const monthEnd = endOfMonth(today).toISOString();

    try {
      // Fetch today's completed appointments for revenue
      const { data: todayAppointments } = await supabase
        .from('appointments')
        .select('price, status')
        .eq('organization_id', organization.id)
        .gte('start_time', todayStart)
        .lte('start_time', todayEnd);

      const todayServiceRevenue = todayAppointments
        ?.filter((a) => a.status === 'completed')
        .reduce((sum, a) => sum + Number(a.price), 0) || 0;

      // Fetch today's product sales
      const { data: todayProductSales } = await supabase
        .from('product_sales')
        .select('total_price')
        .eq('organization_id', organization.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      const todayProductRevenue = todayProductSales?.reduce(
        (sum, s) => sum + Number(s.total_price), 0
      ) || 0;

      const todayRevenue = todayServiceRevenue + todayProductRevenue;
      const todayCount = todayAppointments?.length || 0;

      // Fetch month revenue (services)
      const { data: monthAppointments } = await supabase
        .from('appointments')
        .select('price')
        .eq('organization_id', organization.id)
        .eq('status', 'completed')
        .gte('start_time', monthStart)
        .lte('start_time', monthEnd);

      const monthServiceRevenue = monthAppointments?.reduce((sum, a) => sum + Number(a.price), 0) || 0;

      // Fetch month revenue (products)
      const { data: monthProductSales } = await supabase
        .from('product_sales')
        .select('total_price')
        .eq('organization_id', organization.id)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      const monthProductRevenue = monthProductSales?.reduce(
        (sum, s) => sum + Number(s.total_price), 0
      ) || 0;

      const monthRevenue = monthServiceRevenue + monthProductRevenue;

      // Fetch total clients
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      // Fetch low stock products (admin only)
      let lowStockCount = 0;
      if (isAdmin) {
        const { data: lowStockProducts } = await supabase
          .from('products')
          .select('id, quantity, min_quantity')
          .eq('organization_id', organization.id)
          .eq('is_active', true);

        lowStockCount = lowStockProducts?.filter(
          (p) => (p.quantity ?? 0) <= (p.min_quantity ?? 0)
        ).length || 0;
      }

      // Fetch pending commissions
      let pendingCommissions = 0;
      if (isAdmin) {
        const { data: commissionData } = await supabase
          .from('appointments')
          .select('commission_amount')
          .eq('organization_id', organization.id)
          .eq('status', 'completed')
          .gte('start_time', monthStart)
          .lte('start_time', monthEnd);

        const totalServiceCommissions = commissionData?.reduce(
          (sum, a) => sum + Number(a.commission_amount || 0), 0
        ) || 0;

        const { data: productCommissions } = await supabase
          .from('product_sales')
          .select('commission_amount')
          .eq('organization_id', organization.id)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);

        const totalProductCommissions = productCommissions?.reduce(
          (sum, s) => sum + Number(s.commission_amount || 0), 0
        ) || 0;

        const { data: paidCommissions } = await supabase
          .from('commission_payments')
          .select('total_commission')
          .eq('organization_id', organization.id)
          .eq('status', 'paid')
          .gte('period_start', format(startOfMonth(today), 'yyyy-MM-dd'))
          .lte('period_end', format(endOfMonth(today), 'yyyy-MM-dd'));

        const totalPaid = paidCommissions?.reduce(
          (sum, p) => sum + Number(p.total_commission || 0), 0
        ) || 0;

        pendingCommissions = totalServiceCommissions + totalProductCommissions - totalPaid;
      } else if (user?.id) {
        const { data: myCommissions } = await supabase
          .from('appointments')
          .select('commission_amount')
          .eq('organization_id', organization.id)
          .eq('barber_id', user.id)
          .eq('status', 'completed')
          .gte('start_time', monthStart)
          .lte('start_time', monthEnd);

        const myServiceCommissions = myCommissions?.reduce(
          (sum, a) => sum + Number(a.commission_amount || 0), 0
        ) || 0;

        const { data: myProductCommissions } = await supabase
          .from('product_sales')
          .select('commission_amount')
          .eq('organization_id', organization.id)
          .eq('barber_id', user.id)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);

        const myProductTotal = myProductCommissions?.reduce(
          (sum, s) => sum + Number(s.commission_amount || 0), 0
        ) || 0;

        pendingCommissions = myServiceCommissions + myProductTotal;
      }

      setStats({
        todayRevenue,
        monthRevenue,
        todayAppointments: todayCount,
        totalClients: clientCount || 0,
        lowStockProducts: lowStockCount,
        pendingCommissions: Math.max(0, pendingCommissions),
      });

      // Fetch upcoming appointments
      const { data: upcoming } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          service:services(*),
          barber:profiles(*)
        `)
        .eq('organization_id', organization.id)
        .gte('start_time', new Date().toISOString())
        .in('status', ['scheduled', 'confirmed'])
        .order('start_time', { ascending: true })
        .limit(5);

      setUpcomingAppointments((upcoming as UpcomingAppointment[]) || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching dashboard data:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: { label: 'Agendado', className: 'status-scheduled' },
      confirmed: { label: 'Confirmado', className: 'status-confirmed' },
      in_progress: { label: 'Em Andamento', className: 'status-in-progress' },
      completed: { label: 'Concluído', className: 'status-completed' },
      cancelled: { label: 'Cancelado', className: 'status-cancelled' },
      no_show: { label: 'Não Compareceu', className: 'status-no-show' },
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-6">
      <PaywallBanner showAlways />
      
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-semibold">
              {greeting()}, <span className="text-gold-gradient">{profile?.full_name?.split(' ')[0]}</span>!
            </h2>
            <p className="text-muted-foreground">
              Veja o resumo da sua barbearia hoje
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/vendas')} className="gap-2 btn-neo">
              <ShoppingBag className="w-4 h-4" />
              Registrar Venda
            </Button>
            <Button onClick={() => navigate('/agenda')} className="gap-2 btn-neo btn-gold-glass">
              <Calendar className="w-4 h-4" />
              Ver Agenda
            </Button>
          </div>
        </div>

        {/* Bento Grid Stats */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-min">
          {isLoading ? (
            <>
              <div className="glass-panel p-6 lg:col-span-2 lg:row-span-2"><Skeleton className="h-8 w-32 mb-4" /><Skeleton className="h-12 w-48" /></div>
              <div className="glass-panel p-6"><Skeleton className="h-8 w-32 mb-4" /><Skeleton className="h-10 w-40" /></div>
              <div className="glass-panel p-6"><Skeleton className="h-8 w-32 mb-4" /><Skeleton className="h-10 w-40" /></div>
              <div className="glass-panel p-6 lg:col-span-3"><Skeleton className="h-8 w-48" /></div>
            </>
          ) : (
            <>
              {/* HERO: Faturamento Hoje */}
              <div
                className="glass-panel p-6 lg:col-span-2 lg:row-span-2 flex flex-col justify-between relative"
                style={{ animationDelay: '0ms' }}
              >
                {/* Animated glow */}
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/5 blur-3xl animate-float pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Faturamento Hoje</span>
                </div>
                <div>
                  <div className="text-4xl lg:text-5xl font-bold text-gold-gradient mb-2">
                    {formatCurrency(stats.todayRevenue)}
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span>{stats.todayAppointments} atendimentos realizados</span>
                  </div>
                </div>
              </div>

              {/* Faturamento Mensal */}
              <div
                className="glass-panel p-6 flex flex-col justify-between"
                style={{ animationDelay: '100ms' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Mensal</span>
                  <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-success" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(stats.monthRevenue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Comissões */}
              <div
                className="glass-panel p-6 flex flex-col justify-between cursor-pointer"
                onClick={() => navigate('/comissoes')}
                style={{ animationDelay: '200ms' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {isAdmin ? 'Comissões Pend.' : 'Minhas Comissões'}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
                    <Percent className="w-4 h-4 text-info" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-info">{formatCurrency(stats.pendingCommissions)}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    Ver detalhes <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              </div>

              {/* Bottom bar: Estoque ou Clientes */}
              {isAdmin ? (
                <div
                  className={`glass-panel p-5 lg:col-span-3 ${stats.lowStockProducts > 0 ? 'border-warning/30' : ''}`}
                  style={{ animationDelay: '300ms' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.lowStockProducts > 0 ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status do Estoque</p>
                        <p className="text-xs text-muted-foreground">
                          <span className={`font-bold ${stats.lowStockProducts > 0 ? 'text-warning' : ''}`}>
                            {stats.lowStockProducts}
                          </span>{' '}
                          produtos precisam de reposição
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/produtos')} className="btn-neo">
                      Gerenciar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-5 lg:col-span-3" style={{ animationDelay: '300ms' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total de Clientes</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-bold">{stats.totalClients}</span> clientes cadastrados
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/clientes')} className="btn-neo">
                      Ver todos
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Actions for Admin */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/produtos')} className="btn-neo">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Produto
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/servicos')} className="btn-neo">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Serviço
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/clientes')} className="btn-neo">
              <Plus className="w-4 h-4 mr-1" />
              Cadastrar Cliente
            </Button>
          </div>
        )}
        {/* Upcoming Appointments */}
        <div className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display">Próximos Atendimentos</CardTitle>
              <CardDescription>Agenda de hoje e próximos dias</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/agenda')}>
              Ver todos
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum agendamento próximo</p>
                <Button
                  variant="link"
                  className="mt-2 text-primary"
                  onClick={() => navigate('/agenda')}
                >
                  Criar novo agendamento
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Scissors className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {appointment.client?.name || 'Cliente não informado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.service?.name} • {appointment.barber?.full_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {format(new Date(appointment.start_time), 'HH:mm')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appointment.start_time), "dd 'de' MMM", { locale: ptBR })}
                        </p>
                      </div>
                      {getStatusBadge(appointment.status || 'scheduled')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </div>
  );
}
