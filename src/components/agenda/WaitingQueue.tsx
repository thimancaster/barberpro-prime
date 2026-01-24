import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  User, 
  Scissors, 
  CheckCircle2, 
  XCircle, 
  PlayCircle,
  AlertTriangle 
} from 'lucide-react';
import { format, differenceInMinutes, isPast, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment, Client, Service, Profile, AppointmentStatus } from '@/types/database';
import { ServiceTimer } from './ServiceTimer';

interface AppointmentWithRelations extends Appointment {
  client: Client | null;
  service: Service | null;
  barber: Profile | null;
}

interface WaitingQueueProps {
  appointments: AppointmentWithRelations[];
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onCheckout: (id: string) => void;
}

export function WaitingQueue({ appointments, onUpdateStatus, onCheckout }: WaitingQueueProps) {
  const now = new Date();
  
  // Filtrar e ordenar: in_progress primeiro, depois próximos do dia
  const queueAppointments = appointments
    .filter(apt => ['scheduled', 'confirmed', 'in_progress'].includes(apt.status))
    .sort((a, b) => {
      // Em andamento sempre primeiro
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
      // Depois por horário
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    })
    .slice(0, 5);

  const getQueueStatus = (apt: AppointmentWithRelations) => {
    const startTime = new Date(apt.start_time);
    const minutesUntil = differenceInMinutes(startTime, now);
    
    if (apt.status === 'in_progress') {
      return { label: 'Em atendimento', variant: 'default' as const, icon: PlayCircle };
    }
    
    if (isPast(startTime) && apt.status !== 'completed') {
      return { label: 'Atrasado', variant: 'destructive' as const, icon: AlertTriangle };
    }
    
    if (minutesUntil <= 15) {
      return { label: 'Próximo', variant: 'secondary' as const, icon: Clock };
    }
    
    if (apt.status === 'confirmed') {
      return { label: 'Confirmado', variant: 'outline' as const, icon: CheckCircle2 };
    }
    
    return { label: 'Aguardando', variant: 'outline' as const, icon: Clock };
  };

  if (queueAppointments.length === 0) {
    return (
      <Card className="card-gradient border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Fila de Espera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nenhum atendimento na fila
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-gradient border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Fila de Espera
          <Badge variant="secondary" className="ml-auto">
            {queueAppointments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {queueAppointments.map((apt, index) => {
          const status = getQueueStatus(apt);
          const StatusIcon = status.icon;

          return (
            <div
              key={apt.id}
              className={`p-3 rounded-lg border transition-colors ${
                apt.status === 'in_progress'
                  ? 'bg-primary/10 border-primary/30'
                  : status.label === 'Atrasado'
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-secondary/30 border-border/50 hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/20">
                    {apt.client?.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {apt.client?.name || 'Cliente'}
                    </span>
                    <Badge variant={status.variant} className="text-xs shrink-0">
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Scissors className="w-3 h-3" />
                      {apt.service?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(apt.start_time), 'HH:mm')}
                    </span>
                  </div>

                  {apt.status === 'in_progress' && apt.service && (
                    <ServiceTimer
                      startTime={apt.start_time}
                      expectedDurationMinutes={apt.service.duration_minutes}
                      className="mb-2"
                    />
                  )}

                  <div className="flex gap-1.5">
                    {apt.status === 'scheduled' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => onUpdateStatus(apt.id, 'confirmed')}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    {apt.status === 'confirmed' && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onUpdateStatus(apt.id, 'in_progress')}
                      >
                        <PlayCircle className="w-3 h-3 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    {apt.status === 'in_progress' && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onCheckout(apt.id)}
                      >
                        Finalizar e Cobrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
