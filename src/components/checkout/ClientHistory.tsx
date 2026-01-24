import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  DollarSign, 
  Star, 
  Scissors,
  TrendingUp,
  Crown,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientHistoryProps {
  clientId: string;
  organizationId: string;
}

interface HistoryData {
  client: {
    name: string;
    phone?: string;
    total_spent: number;
    total_visits: number;
    last_visit_at?: string;
  };
  recentAppointments: Array<{
    id: string;
    start_time: string;
    price: number;
    service?: { name: string };
    barber?: { full_name: string };
  }>;
  favoriteServices: Array<{
    name: string;
    count: number;
  }>;
  loyaltyPoints?: number;
  isVIP: boolean;
}

export function ClientHistory({ clientId, organizationId }: ClientHistoryProps) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClientHistory();
  }, [clientId]);

  const fetchClientHistory = async () => {
    try {
      // Buscar dados do cliente
      const { data: client } = await supabase
        .from('clients')
        .select('name, phone, total_spent, total_visits, last_visit_at')
        .eq('id', clientId)
        .single();

      if (!client) return;

      // Buscar últimos agendamentos
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          price,
          service:services(name),
          barber:profiles(full_name)
        `)
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .order('start_time', { ascending: false })
        .limit(5);

      // Buscar serviços favoritos (agrupando)
      const { data: allAppointments } = await supabase
        .from('appointments')
        .select('service:services(name)')
        .eq('client_id', clientId)
        .eq('status', 'completed');

      const serviceCounts: Record<string, number> = {};
      allAppointments?.forEach((apt: any) => {
        const name = apt.service?.name;
        if (name) {
          serviceCounts[name] = (serviceCounts[name] || 0) + 1;
        }
      });

      const favoriteServices = Object.entries(serviceCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Buscar pontos de fidelidade
      const { data: loyalty } = await supabase
        .from('loyalty_points')
        .select('points_balance')
        .eq('client_id', clientId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      setData({
        client,
        recentAppointments: appointments || [],
        favoriteServices,
        loyaltyPoints: loyalty?.points_balance,
        isVIP: (client.total_spent || 0) > 1000 || (client.total_visits || 0) > 10,
      });
    } catch (error) {
      console.error('Error fetching client history:', error);
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

  if (isLoading) {
    return (
      <Card className="card-gradient border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando histórico...
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="card-gradient border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Histórico do Cliente
          {data.isVIP && (
            <Badge variant="default" className="ml-auto bg-amber-500/20 text-amber-500 border-amber-500/30">
              <Crown className="w-3 h-3 mr-1" />
              VIP
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              Visitas
            </div>
            <div className="text-lg font-semibold">{data.client.total_visits || 0}</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              Total Gasto
            </div>
            <div className="text-lg font-semibold text-primary">
              {formatCurrency(data.client.total_spent || 0)}
            </div>
          </div>
        </div>

        {/* Pontos de Fidelidade */}
        {data.loyaltyPoints !== undefined && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Pontos de Fidelidade</span>
              </div>
              <span className="text-lg font-bold text-primary">{data.loyaltyPoints}</span>
            </div>
          </div>
        )}

        {/* Serviços Favoritos */}
        {data.favoriteServices.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Scissors className="w-3 h-3" />
                Serviços Favoritos
              </div>
              <div className="flex flex-wrap gap-2">
                {data.favoriteServices.map((svc) => (
                  <Badge key={svc.name} variant="secondary" className="text-xs">
                    {svc.name} ({svc.count}x)
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Últimas Visitas */}
        {data.recentAppointments.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Clock className="w-3 h-3" />
                Últimas Visitas
              </div>
              <div className="space-y-2">
                {data.recentAppointments.slice(0, 3).map((apt: any) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between text-xs p-2 rounded bg-secondary/20"
                  >
                    <div>
                      <span className="font-medium">{apt.service?.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {format(new Date(apt.start_time), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </div>
                    <span className="text-primary font-medium">
                      {formatCurrency(Number(apt.price))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
