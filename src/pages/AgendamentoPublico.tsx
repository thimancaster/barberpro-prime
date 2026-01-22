import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Scissors, 
  CalendarIcon, 
  Clock, 
  User,
  Phone,
  Mail,
  CheckCircle,
  MapPin
} from 'lucide-react';
import { format, addMinutes, isBefore, isAfter, setHours, setMinutes, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Organization {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
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

export default function AgendamentoPublico() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Booking state
  const [step, setStep] = useState(1);
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

  const fetchOrganization = async () => {
    setLoading(true);
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();

      if (orgError || !orgData) {
        setNotFound(true);
        return;
      }

      setOrganization(orgData);

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, description, price, duration_minutes, category')
        .eq('organization_id', orgData.id)
        .eq('is_active', true)
        .order('category, name');

      if (servicesData) setServices(servicesData);

      // Fetch barbers
      const { data: barbersData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('organization_id', orgData.id)
        .eq('is_active', true)
        .order('full_name');

      if (barbersData) setBarbers(barbersData);
    } catch (error) {
      console.error('Error fetching organization:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTimes = async () => {
    if (!organization || !selectedDate || !selectedBarber || !selectedService) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Get existing appointments for the barber on this date
      const { data: appointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('barber_id', selectedBarber.id)
        .gte('start_time', `${dateStr}T00:00:00`)
        .lte('start_time', `${dateStr}T23:59:59`)
        .not('status', 'in', '("cancelled","no_show")');

      // Get barber's working hours for this day
      const dayOfWeek = selectedDate.getDay();
      const { data: workingHours } = await supabase
        .from('working_hours')
        .select('start_time, end_time, is_working')
        .eq('profile_id', selectedBarber.id)
        .eq('day_of_week', dayOfWeek)
        .single();

      const openingTime = workingHours?.start_time || organization.opening_time || '09:00';
      const closingTime = workingHours?.end_time || organization.closing_time || '19:00';
      const isWorking = workingHours?.is_working !== false;

      if (!isWorking) {
        setAvailableTimes([]);
        return;
      }

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
        const hasConflict = appointments?.some(apt => {
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
      console.error('Error fetching available times:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create or find client
      let clientId: string;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('organization_id', organization!.id)
        .eq('phone', clientPhone)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            organization_id: organization!.id,
            name: clientName,
            phone: clientPhone,
            email: clientEmail || null,
            notes: clientNotes || null,
          })
          .select('id')
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // Create appointment
      const [hour, min] = selectedTime.split(':').map(Number);
      const startTime = setMinutes(setHours(selectedDate, hour), min);
      const endTime = addMinutes(startTime, selectedService.duration_minutes);

      const { error: aptError } = await supabase
        .from('appointments')
        .insert({
          organization_id: organization!.id,
          client_id: clientId,
          barber_id: selectedBarber.id,
          service_id: selectedService.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          price: selectedService.price,
          status: 'scheduled',
          notes: clientNotes || null,
        });

      if (aptError) throw aptError;

      setBookingComplete(true);
      toast({ title: 'Agendamento realizado com sucesso!' });
    } catch (error: any) {
      console.error('Error submitting booking:', error);
      toast({
        title: 'Erro ao agendar',
        description: error.message,
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <Scissors className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Barbearia não encontrada</h1>
            <p className="text-muted-foreground">
              O link que você acessou não corresponde a nenhuma barbearia cadastrada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone *</Label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>E-mail (opcional)</Label>
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Observações (opcional)</Label>
                    <Textarea
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Alguma observação sobre o atendimento..."
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">Resumo do Agendamento</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Serviço:</span>
                    <span>{selectedService?.name}</span>
                    <span className="text-muted-foreground">Profissional:</span>
                    <span>{selectedBarber?.full_name}</span>
                    <span className="text-muted-foreground">Data:</span>
                    <span>{format(selectedDate!, 'dd/MM/yyyy', { locale: ptBR })}</span>
                    <span className="text-muted-foreground">Horário:</span>
                    <span>{selectedTime}</span>
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-semibold text-primary">{formatCurrency(selectedService!.price)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !clientName || !clientPhone}
                >
                  {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
