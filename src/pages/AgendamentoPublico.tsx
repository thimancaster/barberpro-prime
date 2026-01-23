import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Scissors, 
  Clock, 
  Phone,
  CheckCircle,
  MapPin
} from 'lucide-react';
import { format, addMinutes, isBefore, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Organization {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  working_days: number[] | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string | null;
}

interface Barber {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface WorkingHours {
  start_time: string;
  end_time: string;
  is_working: boolean;
}

interface AppointmentSlot {
  start_time: string;
  end_time: string;
}

export default function AgendamentoPublico() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Booking state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchOrganization();
    }
  }, [slug]);

  useEffect(() => {
    if (organization && selectedDate && selectedBarber && selectedService) {
      fetchAvailableTimes();
    }
  }, [organization, selectedDate, selectedBarber, selectedService]);

  // Use secure RPC function to fetch organization data
  const fetchOrganization = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_public_booking_info', {
        _org_slug: slug
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching booking info:', error);
        }
        setNotFound(true);
        return;
      }

      if (!data) {
        setNotFound(true);
        return;
      }

      // Parse the JSON response with proper type assertion
      const bookingData = data as unknown as {
        organization: Organization;
        services: Service[];
        barbers: Barber[];
      };

      setOrganization(bookingData.organization);
      setServices(bookingData.services || []);
      setBarbers(bookingData.barbers || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching organization:', error);
      }
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Use secure RPC function to fetch available times
  const fetchAvailableTimes = async () => {
    if (!organization || !selectedDate || !selectedBarber || !selectedService) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase.rpc('get_public_available_times', {
        _org_slug: slug!,
        _barber_id: selectedBarber.id,
        _date: dateStr,
        _duration_minutes: selectedService.duration_minutes
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching available times:', error);
        }
        setAvailableTimes([]);
        return;
      }

      if (!data) {
        setAvailableTimes([]);
        return;
      }

      const availabilityData = data as unknown as {
        working_hours: WorkingHours | null;
        appointments: AppointmentSlot[];
      };

      const workingHours = availabilityData.working_hours;
      const appointments = availabilityData.appointments || [];

      if (!workingHours || workingHours.is_working === false) {
        setAvailableTimes([]);
        return;
      }

      const openingTime = workingHours.start_time || organization.opening_time || '09:00';
      const closingTime = workingHours.end_time || organization.closing_time || '19:00';

      // Generate time slots
      const slots: string[] = [];
      const [openHour, openMin] = openingTime.split(':').map(Number);
      const [closeHour, closeMin] = closingTime.split(':').map(Number);
      
      let current = setMinutes(setHours(selectedDate, openHour), openMin);
      const close = setMinutes(setHours(selectedDate, closeHour), closeMin);

      while (isBefore(current, close)) {
        const timeStr = format(current, 'HH:mm');
        const slotEnd = addMinutes(current, selectedService.duration_minutes);

        // Check if slot conflicts with existing appointments
        const hasConflict = appointments.some(apt => {
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          return (current >= aptStart && current < aptEnd) || 
                 (slotEnd > aptStart && slotEnd <= aptEnd) ||
                 (current <= aptStart && slotEnd >= aptEnd);
        });

        // Check if slot is not in the past
        const isPast = isBefore(current, new Date());

        if (!hasConflict && !isPast && isBefore(slotEnd, close)) {
          slots.push(timeStr);
        }

        current = addMinutes(current, 30);
      }

      setAvailableTimes(slots);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching available times:', error);
      }
      setAvailableTimes([]);
    }
  };

  // Use secure RPC function to create booking
  const handleSubmit = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const [hour, min] = selectedTime.split(':').map(Number);
      const startTime = setMinutes(setHours(selectedDate, hour), min);
      const endTime = addMinutes(startTime, selectedService.duration_minutes);

      const { data, error } = await supabase.rpc('create_public_booking', {
        _org_slug: slug!,
        _service_id: selectedService.id,
        _barber_id: selectedBarber.id,
        _start_time: startTime.toISOString(),
        _end_time: endTime.toISOString(),
        _client_name: clientName.trim(),
        _client_phone: clientPhone.trim(),
        _client_email: clientEmail.trim() || null,
        _notes: clientNotes.trim() || null
      });

      if (error) {
        // Handle specific error codes with user-friendly messages
        const errorMessages: Record<string, string> = {
          'organization_not_found': 'Barbearia não encontrada',
          'service_not_found': 'Serviço não disponível',
          'barber_not_found': 'Profissional não disponível',
          'time_slot_unavailable': 'Este horário não está mais disponível',
          'invalid_client_name': 'Nome inválido',
          'invalid_client_phone': 'Telefone inválido'
        };
        
        const userMessage = errorMessages[error.message] || 'Erro ao realizar agendamento';
        throw new Error(userMessage);
      }

      setBookingComplete(true);
      toast({ title: 'Agendamento realizado com sucesso!' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      if (import.meta.env.DEV) {
        console.error('Error submitting booking:', error);
      }
      toast({
        title: 'Erro ao agendar',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isDateDisabled = (date: Date) => {
    if (!organization?.working_days) return false;
    const day = date.getDay();
    return !organization.working_days.includes(day) || isBefore(date, new Date());
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <Scissors className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Barbearia não encontrada</h1>
            <p className="text-muted-foreground">
              O link que você acessou não corresponde a nenhuma barbearia cadastrada.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (bookingComplete) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Agendamento Confirmado!</h1>
            <p className="text-muted-foreground mb-6">
              Seu horário foi reservado com sucesso.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-left mb-6">
              <p><strong>Serviço:</strong> {selectedService?.name}</p>
              <p><strong>Profissional:</strong> {selectedBarber?.full_name}</p>
              <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              <p><strong>Horário:</strong> {selectedTime}</p>
              <p><strong>Valor:</strong> {selectedService && formatCurrency(selectedService.price)}</p>
            </div>
            {organization?.phone && (
              <Button asChild className="w-full">
                <a href={`https://wa.me/55${organization.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                  <Phone className="w-4 h-4 mr-2" />
                  Confirmar via WhatsApp
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{organization?.name}</h1>
          {organization?.address && (
            <p className="text-primary-foreground/80 flex items-center justify-center gap-1">
              <MapPin className="w-4 h-4" />
              {organization.address}
            </p>
          )}
        </div>
      </div>

      {/* Booking Form */}
      <div className="max-w-2xl mx-auto p-4 -mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Agendar Horário</CardTitle>
            <CardDescription>
              Escolha o serviço, profissional e horário desejado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Service */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">1. Escolha o Serviço</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(service => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-colors ${selectedService?.id === service.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    onClick={() => setSelectedService(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.duration_minutes} min</p>
                        </div>
                        <Badge variant="secondary">{formatCurrency(service.price)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Step 2: Barber */}
            {selectedService && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">2. Escolha o Profissional</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {barbers.map(barber => (
                    <Card
                      key={barber.id}
                      className={`cursor-pointer transition-colors ${selectedBarber?.id === barber.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                      onClick={() => setSelectedBarber(barber)}
                    >
                      <CardContent className="p-4 text-center">
                        <Avatar className="w-12 h-12 mx-auto mb-2">
                          <AvatarImage src={barber.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(barber.full_name)}</AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-sm">{barber.full_name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Date & Time */}
            {selectedBarber && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">3. Escolha a Data e Horário</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={isDateDisabled}
                      locale={ptBR}
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    {selectedDate && availableTimes.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availableTimes.map(time => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    ) : selectedDate ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum horário disponível nesta data
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Selecione uma data
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Client Info */}
            {selectedTime && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">4. Seus Dados</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone *</Label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Alguma observação para o barbeiro?"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Summary & Submit */}
            {selectedTime && clientName && clientPhone && (
              <div className="space-y-4 pt-4 border-t">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold">Resumo do Agendamento</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-muted-foreground">Serviço:</p>
                    <p>{selectedService?.name}</p>
                    <p className="text-muted-foreground">Profissional:</p>
                    <p>{selectedBarber?.full_name}</p>
                    <p className="text-muted-foreground">Data:</p>
                    <p>{selectedDate && format(selectedDate, "dd/MM/yyyy")}</p>
                    <p className="text-muted-foreground">Horário:</p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedTime}
                    </p>
                    <p className="text-muted-foreground">Valor:</p>
                    <p className="font-semibold text-primary">{selectedService && formatCurrency(selectedService.price)}</p>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
