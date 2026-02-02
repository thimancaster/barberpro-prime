import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, Client, Service, Profile, AppointmentStatus } from '@/types/database';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Scissors,
  User,
  Loader2,
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addMinutes,
  parseISO,
  setHours,
  setMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useRealtimeAppointments } from '@/hooks/useRealtimeAppointments';
import { useNotifications } from '@/hooks/useNotifications';
import { WaitingQueue } from '@/components/agenda/WaitingQueue';

interface AppointmentWithRelations extends Appointment {
  client: Client | null;
  service: Service | null;
  barber: Profile | null;
}

export default function Agenda() {
  const navigate = useNavigate();
  const { organization, profile, isAdmin } = useAuth();
  const { sendNotification } = useNotifications();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    barber_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const timeSlots = useMemo(() => {
    const slots = [];
    const openingHour = organization?.opening_time ? parseInt(organization.opening_time.split(':')[0]) : 9;
    const closingHour = organization?.closing_time ? parseInt(organization.closing_time.split(':')[0]) : 19;
    
    for (let hour = openingHour; hour < closingHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, [organization]);

  // Realtime subscription for appointments
  const handleRealtimeUpdate = useCallback(() => {
    fetchData();
  }, [organization?.id, selectedDate, viewMode]);

  useRealtimeAppointments({
    organizationId: organization?.id,
    onInsert: handleRealtimeUpdate,
    onUpdate: handleRealtimeUpdate,
    onDelete: handleRealtimeUpdate,
    showToasts: true,
  });

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id, selectedDate, viewMode]);

  const fetchData = async () => {
    if (!organization?.id) return;
    setIsLoading(true);

    try {
      // Fetch appointments for the selected period
      const startDate = viewMode === 'week' 
        ? startOfWeek(selectedDate, { weekStartsOn: 1 })
        : selectedDate;
      const endDate = viewMode === 'week'
        ? endOfWeek(selectedDate, { weekStartsOn: 1 })
        : selectedDate;

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          service:services(*),
          barber:profiles(*)
        `)
        .eq('organization_id', organization.id)
        .gte('start_time', format(startDate, 'yyyy-MM-dd'))
        .lte('start_time', format(addDays(endDate, 1), 'yyyy-MM-dd'))
        .order('start_time', { ascending: true });

      setAppointments((appointmentsData as AppointmentWithRelations[]) || []);

      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name');

      setClients(clientsData || []);

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('name');

      setServices(servicesData || []);

      // Fetch barbers
      const { data: barbersData } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('full_name');

      setBarbers(barbersData || []);
    } catch (error) {
      // Log errors only in development to prevent information leakage
      if (import.meta.env.DEV) {
        console.error('Error fetching data:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!organization?.id || !formData.client_id || !formData.service_id || !formData.barber_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);

    try {
      const service = services.find((s) => s.id === formData.service_id);
      if (!service) throw new Error('Serviço não encontrado');

      const [hours, minutes] = formData.time.split(':').map(Number);
      const startTime = setMinutes(setHours(parseISO(formData.date), hours), minutes);
      const endTime = addMinutes(startTime, service.duration_minutes);

      const commissionAmount = (service.price * service.commission_percentage) / 100;

      const { data: newAppointment, error } = await supabase.from('appointments').insert({
        organization_id: organization.id,
        client_id: formData.client_id,
        service_id: formData.service_id,
        barber_id: formData.barber_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        price: service.price,
        commission_amount: commissionAmount,
        notes: formData.notes || null,
        status: 'scheduled',
      }).select().single();

      if (error) throw error;

      // Send notification for new appointment
      if (newAppointment) {
        sendNotification({
          trigger: 'appointment_created',
          appointmentId: newAppointment.id,
        });
      }

      toast.success('Agendamento criado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao criar agendamento', { description: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      // Send notification based on new status
      if (newStatus === 'confirmed') {
        sendNotification({
          trigger: 'appointment_confirmed',
          appointmentId,
        });
      } else if (newStatus === 'completed') {
        sendNotification({
          trigger: 'appointment_completed',
          appointmentId,
        });
        // Also send review request after completion
        sendNotification({
          trigger: 'review_request',
          appointmentId,
        });
      }

      toast.success('Status atualizado!');
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar status', { description: errorMessage });
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      service_id: '',
      barber_id: profile?.id || '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: '09:00',
      notes: '',
    });
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const config: Record<AppointmentStatus, { label: string; className: string }> = {
      scheduled: { label: 'Agendado', className: 'status-scheduled' },
      confirmed: { label: 'Confirmado', className: 'status-confirmed' },
      in_progress: { label: 'Em Andamento', className: 'status-in-progress' },
      completed: { label: 'Concluído', className: 'status-completed' },
      cancelled: { label: 'Cancelado', className: 'status-cancelled' },
      no_show: { label: 'Não Compareceu', className: 'status-no-show' },
    };
    return <Badge className={config[status].className}>{config[status].label}</Badge>;
  };

  const getAppointmentsForTimeSlot = (date: Date, time: string) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.start_time);
      const aptTime = format(aptDate, 'HH:mm');
      return isSameDay(aptDate, date) && aptTime === time;
    });
  };

  const handleCheckout = (id: string) => {
    navigate(`/checkout/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Waiting Queue - sempre visível */}
      <WaitingQueue
        appointments={appointments}
        onUpdateStatus={handleUpdateStatus}
        onCheckout={handleCheckout}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(viewMode === 'week' ? subDays(selectedDate, 7) : subDays(selectedDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(viewMode === 'week' ? addDays(selectedDate, 7) : addDays(selectedDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-display font-semibold ml-2">
              {viewMode === 'week'
                ? `${format(weekDays[0], "d 'de' MMM", { locale: ptBR })} - ${format(weekDays[6], "d 'de' MMM", { locale: ptBR })}`
                : format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(v: 'day' | 'week') => setViewMode(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date())}
            >
              Hoje
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={resetForm}>
                  <Plus className="w-4 h-4" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Novo Agendamento</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar um novo agendamento
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Cliente *</Label>
                    <Select
                      value={formData.client_id}
                      onValueChange={(v) => setFormData({ ...formData, client_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Serviço *</Label>
                    <Select
                      value={formData.service_id}
                      onValueChange={(v) => setFormData({ ...formData, service_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - R$ {Number(service.price).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Barbeiro *</Label>
                    <Select
                      value={formData.barber_id}
                      onValueChange={(v) => setFormData({ ...formData, barber_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um barbeiro" />
                      </SelectTrigger>
                      <SelectContent>
                        {barbers.map((barber) => (
                          <SelectItem key={barber.id} value={barber.id}>
                            {barber.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horário *</Label>
                      <Select
                        value={formData.time}
                        onValueChange={(v) => setFormData({ ...formData, time: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      placeholder="Notas adicionais..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateAppointment} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Criar Agendamento'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="card-gradient border-border/50 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : viewMode === 'day' ? (
              /* Day View */
              <div className="divide-y divide-border">
                {timeSlots.map((slot) => {
                  const slotAppointments = getAppointmentsForTimeSlot(selectedDate, slot);
                  return (
                    <div key={slot} className="flex min-h-[80px]">
                      <div className="w-20 flex-shrink-0 p-3 text-sm text-muted-foreground border-r border-border bg-secondary/20">
                        {slot}
                      </div>
                      <div className="flex-1 p-2">
                        <div className="flex flex-wrap gap-2">
                          {slotAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              className="flex-1 min-w-[200px] p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors cursor-pointer"
                              onClick={() => setSelectedAppointment(apt)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">
                                  {apt.client?.name || 'Cliente'}
                                </span>
                                {getStatusBadge(apt.status)}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Scissors className="w-3 h-3" />
                                  {apt.service?.name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {apt.barber?.full_name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {apt.service?.duration_minutes}min
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Week View */
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header */}
                  <div className="flex border-b border-border bg-secondary/20">
                    <div className="w-20 flex-shrink-0 p-3" />
                    {weekDays.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={`flex-1 p-3 text-center border-l border-border ${
                          isSameDay(day, new Date()) ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="text-xs text-muted-foreground uppercase">
                          {format(day, 'EEE', { locale: ptBR })}
                        </div>
                        <div className={`text-lg font-semibold ${
                          isSameDay(day, new Date()) ? 'text-primary' : ''
                        }`}>
                          {format(day, 'd')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time Slots */}
                  {timeSlots.map((slot) => (
                    <div key={slot} className="flex border-b border-border">
                      <div className="w-20 flex-shrink-0 p-2 text-xs text-muted-foreground border-r border-border bg-secondary/20">
                        {slot}
                      </div>
                      {weekDays.map((day) => {
                        const slotAppointments = getAppointmentsForTimeSlot(day, slot);
                        return (
                          <div
                            key={day.toISOString()}
                            className="flex-1 min-h-[60px] p-1 border-l border-border"
                          >
                            {slotAppointments.map((apt) => (
                              <div
                                key={apt.id}
                                className="p-1 rounded text-xs bg-primary/20 border border-primary/30 mb-1 cursor-pointer hover:bg-primary/30 transition-colors"
                                onClick={() => setSelectedAppointment(apt)}
                              >
                                <div className="font-medium truncate">{apt.client?.name}</div>
                                <div className="text-muted-foreground truncate">{apt.service?.name}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Details Dialog */}
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Detalhes do Agendamento</DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span>{selectedAppointment.client?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Serviço</span>
                  <span>{selectedAppointment.service?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Barbeiro</span>
                  <span>{selectedAppointment.barber?.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Horário</span>
                  <span>
                    {format(new Date(selectedAppointment.start_time), "dd/MM 'às' HH:mm")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="text-primary font-semibold">
                    R$ {Number(selectedAppointment.price).toFixed(2)}
                  </span>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Observações</span>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  {selectedAppointment.status === 'scheduled' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          handleUpdateStatus(selectedAppointment.id, 'confirmed');
                          setSelectedAppointment(null);
                        }}
                      >
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          handleUpdateStatus(selectedAppointment.id, 'cancelled');
                          setSelectedAppointment(null);
                        }}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                  {selectedAppointment.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        handleUpdateStatus(selectedAppointment.id, 'in_progress');
                        setSelectedAppointment(null);
                      }}
                    >
                      Iniciar Atendimento
                    </Button>
                  )}
                  {selectedAppointment.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        navigate(`/checkout/${selectedAppointment.id}`);
                        setSelectedAppointment(null);
                      }}
                    >
                      Finalizar e Cobrar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
