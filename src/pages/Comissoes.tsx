import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DollarSign, 
  Users, 
  CalendarIcon,
  TrendingUp,
  CheckCircle,
  Clock,
  Calculator
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Profile } from '@/types/database';
import type { CommissionPayment } from '@/types/sales';

interface BarberCommission {
  barber: Profile;
  servicesTotal: number;
  productsTotal: number;
  appointmentsCount: number;
  productsCount: number;
  totalCommission: number;
}

export default function Comissoes() {
  const { organization, user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [barbers, setBarbers] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [commissions, setCommissions] = useState<BarberCommission[]>([]);
  const [loading, setLoading] = useState(true);

  // Period selection
  const [periodStart, setPeriodStart] = useState<Date>(startOfMonth(new Date()));
  const [periodEnd, setPeriodEnd] = useState<Date>(endOfMonth(new Date()));

  // Payment dialog
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<BarberCommission | null>(null);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id, periodStart, periodEnd]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch barbers
      const { data: barbersData } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organization!.id)
        .eq('is_active', true)
        .order('full_name');

      if (barbersData) setBarbers(barbersData);

      // Fetch appointments for the period
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('barber_id, price, commission_amount, status')
        .eq('organization_id', organization!.id)
        .eq('status', 'completed')
        .gte('start_time', periodStart.toISOString())
        .lte('start_time', periodEnd.toISOString());

      // Fetch product sales for the period
      const { data: salesData } = await supabase
        .from('product_sales')
        .select('barber_id, total_price, commission_amount')
        .eq('organization_id', organization!.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      // Calculate commissions per barber
      const commissionsMap = new Map<string, BarberCommission>();

      barbersData?.forEach(barber => {
        commissionsMap.set(barber.id, {
          barber,
          servicesTotal: 0,
          productsTotal: 0,
          appointmentsCount: 0,
          productsCount: 0,
          totalCommission: 0,
        });
      });

      appointmentsData?.forEach(apt => {
        if (apt.barber_id && commissionsMap.has(apt.barber_id)) {
          const entry = commissionsMap.get(apt.barber_id)!;
          entry.servicesTotal += Number(apt.commission_amount || 0);
          entry.appointmentsCount += 1;
          entry.totalCommission += Number(apt.commission_amount || 0);
        }
      });

      salesData?.forEach(sale => {
        if (sale.barber_id && commissionsMap.has(sale.barber_id)) {
          const entry = commissionsMap.get(sale.barber_id)!;
          entry.productsTotal += Number(sale.commission_amount || 0);
          entry.productsCount += 1;
          entry.totalCommission += Number(sale.commission_amount || 0);
        }
      });

      setCommissions(Array.from(commissionsMap.values()).filter(c => c.totalCommission > 0));

      // Fetch payment history
      const { data: paymentsData } = await supabase
        .from('commission_payments')
        .select(`
          *,
          barber:profiles!commission_payments_barber_id_fkey(full_name, avatar_url),
          payer:profiles!commission_payments_paid_by_fkey(full_name)
        `)
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (paymentsData) setPayments(paymentsData as CommissionPayment[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayCommission = async () => {
    if (!selectedBarber) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('commission_payments')
        .insert({
          organization_id: organization!.id,
          barber_id: selectedBarber.barber.id,
          period_start: format(periodStart, 'yyyy-MM-dd'),
          period_end: format(periodEnd, 'yyyy-MM-dd'),
          total_services: selectedBarber.servicesTotal,
          total_products: selectedBarber.productsTotal,
          total_commission: selectedBarber.totalCommission,
          appointments_count: selectedBarber.appointmentsCount,
          products_count: selectedBarber.productsCount,
          paid_at: new Date().toISOString(),
          paid_by: user!.id,
          notes: paymentNotes || null,
          status: 'paid',
        });

      if (error) throw error;

      toast({ title: 'Comissão paga com sucesso!' });
      setIsPayDialogOpen(false);
      setSelectedBarber(null);
      setPaymentNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error paying commission:', error);
      toast({
        title: 'Erro ao registrar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const totalCommissions = commissions.reduce((sum, c) => sum + c.totalCommission, 0);
  const totalServices = commissions.reduce((sum, c) => sum + c.servicesTotal, 0);
  const totalProducts = commissions.reduce((sum, c) => sum + c.productsTotal, 0);

  const setQuickPeriod = (months: number) => {
    const start = startOfMonth(subMonths(new Date(), months));
    const end = months === 0 ? endOfMonth(new Date()) : endOfMonth(subMonths(new Date(), months));
    setPeriodStart(start);
    setPeriodEnd(end);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Gestão de Comissões
          </h1>
          <p className="text-muted-foreground">
            Controle e pagamento de comissões da equipe
          </p>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickPeriod(0)}
              >
                Este mês
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickPeriod(1)}
              >
                Mês passado
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    {format(periodStart, 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={periodStart}
                    onSelect={(date) => date && setPeriodStart(date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    {format(periodEnd, 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={periodEnd}
                    onSelect={(date) => date && setPeriodEnd(date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Comissões</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalCommissions)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Serviços</p>
                <p className="text-2xl font-bold">{formatCurrency(totalServices)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produtos</p>
                <p className="text-2xl font-bold">{formatCurrency(totalProducts)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profissionais</p>
                <p className="text-2xl font-bold">{commissions.length}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões do Período</CardTitle>
          <CardDescription>
            {format(periodStart, "dd 'de' MMMM", { locale: ptBR })} a {format(periodEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead className="text-right">Atendimentos</TableHead>
                <TableHead className="text-right">Comissão Serviços</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Comissão Produtos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {isAdmin && <TableHead className="text-right">Ação</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map(commission => (
                <TableRow key={commission.barber.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={commission.barber.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(commission.barber.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{commission.barber.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {commission.barber.commission_percentage}% serviços
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{commission.appointmentsCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(commission.servicesTotal)}</TableCell>
                  <TableCell className="text-right">{commission.productsCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(commission.productsTotal)}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(commission.totalCommission)}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedBarber(commission);
                          setIsPayDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Pagar
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {commissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">
                    Nenhuma comissão no período selecionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Serviços</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {payment.paid_at 
                      ? format(new Date(payment.paid_at), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={payment.barber?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {payment.barber?.full_name ? getInitials(payment.barber.full_name) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      {payment.barber?.full_name || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.period_start), 'dd/MM', { locale: ptBR })} - {format(new Date(payment.period_end), 'dd/MM', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(payment.total_services)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(payment.total_products)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(payment.total_commission)}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                      {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum pagamento registrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Comissão</DialogTitle>
            <DialogDescription>
              Confirmar pagamento para {selectedBarber?.barber.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedBarber && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Serviços ({selectedBarber.appointmentsCount})</span>
                  <span>{formatCurrency(selectedBarber.servicesTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Produtos ({selectedBarber.productsCount})</span>
                  <span>{formatCurrency(selectedBarber.productsTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedBarber.totalCommission)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Observações do pagamento..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePayCommission} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
