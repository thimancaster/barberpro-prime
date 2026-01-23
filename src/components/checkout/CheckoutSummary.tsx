import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Clock, Scissors, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Appointment, Client, Service, Profile } from '@/types/database';

interface AppointmentWithRelations extends Appointment {
  client: Client | null;
  service: Service | null;
  barber: Profile | null;
}

interface CheckoutSummaryProps {
  appointment: AppointmentWithRelations;
}

export function CheckoutSummary({ appointment }: CheckoutSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" />
          Resumo do Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {appointment.client ? getInitials(appointment.client.name) : 'CL'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{appointment.client?.name || 'Cliente não identificado'}</p>
            <p className="text-sm text-muted-foreground">{appointment.client?.phone}</p>
          </div>
        </div>

        {/* Service */}
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{appointment.service?.name || 'Serviço'}</span>
            </div>
            <span className="font-semibold text-primary">
              {formatCurrency(appointment.price)}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{appointment.service?.duration_minutes || 30} min</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {appointment.service?.commission_percentage || 0}% comissão
            </Badge>
          </div>
        </div>

        {/* Barber */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <Avatar className="h-8 w-8">
            <AvatarImage src={appointment.barber?.avatar_url || ''} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {appointment.barber ? getInitials(appointment.barber.full_name) : 'BB'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{appointment.barber?.full_name || 'Barbeiro'}</p>
            <p className="text-xs text-muted-foreground">Profissional</p>
          </div>
        </div>

        {/* Date/Time */}
        <div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(appointment.start_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
