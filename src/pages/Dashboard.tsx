import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, Client, Service, Profile, Product } from '@/types/database';
import {
  DollarSign,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Scissors,
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  todayRevenue: number;
  monthRevenue: number;
  todayAppointments: number;
  totalClients: number;
  lowStockProducts: number;
}

interface UpcomingAppointment extends Appointment {
  client: Client | null;
  service: Service | null;
  barber: Profile | null;
}

export default function Dashboard() {
  const { profile, organization, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    monthRevenue: 0,
    todayAppointments: 0,
    totalClients: 0,
    lowStockProducts: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      const todayRevenue = todayAppointments
        ?.filter((a) => a.status === 'completed')
        .reduce((sum, a) => sum + Number(a.price), 0) || 0;

      const todayCount = todayAppointments?.length || 0;

      // Fetch month revenue
      const { data: monthAppointments } = await supabase
        .from('appointments')
        .select('price')
        .eq('organization_id', organization.id)
        .eq('status', 'completed')
        .gte('start_time', monthStart)
        .lte('start_time', monthEnd);

      const monthRevenue = monthAppointments?.reduce((sum, a) => sum + Number(a.price), 0) || 0;

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
          (p) => p.quantity <= p.min_quantity
        ).length || 0;
      }

      setStats({
        todayRevenue,
        monthRevenue,
        todayAppointments: todayCount,
        totalClients: clientCount || 0,
        lowStockProducts: lowStockCount,
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
      console.error('Error fetching dashboard data:', error);
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
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-semibold">
              {greeting()}, {profile?.full_name?.split(' ')[0]}!
            </h2>
            <p className="text-muted-foreground">
              Veja o resumo da sua barbearia hoje
            </p>
          </div>
          <Button onClick={() => navigate('/agenda')} className="gap-2">
            <Calendar className="w-4 h-4" />
            Ver Agenda
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturamento Hoje
              </CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold-gradient">
                {formatCurrency(stats.todayRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.todayAppointments} atendimentos hoje
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturamento Mensal
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.monthRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Clientes
              </CardTitle>
              <Users className="w-4 h-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground mt-1">
                clientes cadastrados
              </p>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className={`card-gradient border-border/50 ${stats.lowStockProducts > 0 ? 'border-warning/50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Estoque Baixo
                </CardTitle>
                <AlertTriangle className={`w-4 h-4 ${stats.lowStockProducts > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.lowStockProducts > 0 ? 'text-warning' : ''}`}>
                  {stats.lowStockProducts}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  produtos precisam reposição
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Appointments */}
        <Card className="card-gradient border-border/50">
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
            {upcomingAppointments.length === 0 ? (
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
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
