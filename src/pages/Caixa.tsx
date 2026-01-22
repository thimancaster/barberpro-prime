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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  DoorOpen, 
  DoorClosed, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CashRegister, CashMovement } from '@/types/sales';

export default function Caixa() {
  const { organization, user, profile, isAdmin } = useAuth();
  const { toast } = useToast();

  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);

  // Open register state
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');

  // Close register state
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [closingAmount, setClosingAmount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  // Movement state
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<'withdrawal' | 'deposit'>('withdrawal');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check for open register
      const { data: openRegister } = await supabase
        .from('cash_registers')
        .select(`
          *,
          opener:profiles!cash_registers_opened_by_fkey(full_name)
        `)
        .eq('organization_id', organization!.id)
        .eq('status', 'open')
        .single();

      if (openRegister) {
        setCurrentRegister(openRegister as CashRegister);
        
        // Fetch movements for this register
        const { data: movementsData } = await supabase
          .from('cash_movements')
          .select(`
            *,
            creator:profiles!cash_movements_created_by_fkey(full_name)
          `)
          .eq('cash_register_id', openRegister.id)
          .order('created_at', { ascending: false });

        if (movementsData) setMovements(movementsData as CashMovement[]);
      } else {
        setCurrentRegister(null);
        setMovements([]);
      }

      // Fetch recent registers history
      const { data: registersData } = await supabase
        .from('cash_registers')
        .select(`
          *,
          opener:profiles!cash_registers_opened_by_fkey(full_name),
          closer:profiles!cash_registers_closed_by_fkey(full_name)
        `)
        .eq('organization_id', organization!.id)
        .order('opened_at', { ascending: false })
        .limit(30);

      if (registersData) setRegisters(registersData as CashRegister[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegister = async () => {
    if (!openingAmount) {
      toast({ title: 'Informe o valor de abertura', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cash_registers')
        .insert({
          organization_id: organization!.id,
          opened_by: user!.id,
          opening_amount: parseFloat(openingAmount),
          status: 'open',
        });

      if (error) throw error;

      toast({ title: 'Caixa aberto com sucesso!' });
      setIsOpenDialogOpen(false);
      setOpeningAmount('');
      fetchData();
    } catch (error: any) {
      console.error('Error opening register:', error);
      toast({
        title: 'Erro ao abrir caixa',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateExpectedAmount = () => {
    if (!currentRegister) return 0;
    const total = movements.reduce((sum, m) => {
      if (m.type === 'income' || m.type === 'deposit') {
        return sum + Number(m.amount);
      } else if (m.type === 'expense' || m.type === 'withdrawal') {
        return sum - Number(m.amount);
      }
      return sum;
    }, currentRegister.opening_amount);
    return total;
  };

  const handleCloseRegister = async () => {
    if (!closingAmount) {
      toast({ title: 'Informe o valor de fechamento', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const expectedAmount = calculateExpectedAmount();
      const closingValue = parseFloat(closingAmount);
      const difference = closingValue - expectedAmount;

      const { error } = await supabase
        .from('cash_registers')
        .update({
          closed_by: user!.id,
          closing_amount: closingValue,
          expected_amount: expectedAmount,
          difference: difference,
          closed_at: new Date().toISOString(),
          notes: closingNotes || null,
          status: 'closed',
        })
        .eq('id', currentRegister!.id);

      if (error) throw error;

      toast({ title: 'Caixa fechado com sucesso!' });
      setIsCloseDialogOpen(false);
      setClosingAmount('');
      setClosingNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error closing register:', error);
      toast({
        title: 'Erro ao fechar caixa',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMovement = async () => {
    if (!movementAmount || !movementDescription) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cash_movements')
        .insert({
          organization_id: organization!.id,
          cash_register_id: currentRegister!.id,
          type: movementType,
          amount: parseFloat(movementAmount),
          description: movementDescription,
          reference_type: 'manual',
          created_by: user!.id,
        });

      if (error) throw error;

      toast({ title: 'Movimentação registrada!' });
      setIsMovementDialogOpen(false);
      setMovementAmount('');
      setMovementDescription('');
      fetchData();
    } catch (error: any) {
      console.error('Error adding movement:', error);
      toast({
        title: 'Erro ao registrar movimentação',
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

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
      case 'expense':
      case 'withdrawal':
        return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      case 'deposit':
        return <ArrowUpCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getMovementLabel = (type: string) => {
    const labels: Record<string, string> = {
      income: 'Entrada',
      expense: 'Despesa',
      withdrawal: 'Sangria',
      deposit: 'Reforço',
      adjustment: 'Ajuste',
    };
    return labels[type] || type;
  };

  const expectedAmount = calculateExpectedAmount();
  const totalIncome = movements.filter(m => m.type === 'income' || m.type === 'deposit').reduce((sum, m) => sum + Number(m.amount), 0);
  const totalExpense = movements.filter(m => m.type === 'expense' || m.type === 'withdrawal').reduce((sum, m) => sum + Number(m.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Controle de Caixa
          </h1>
          <p className="text-muted-foreground">
            Gerencie abertura, fechamento e movimentações
          </p>
        </div>

        {isAdmin && !currentRegister && (
          <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <DoorOpen className="w-4 h-4 mr-2" />
                Abrir Caixa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Abrir Caixa</DialogTitle>
                <DialogDescription>
                  Informe o valor em dinheiro para iniciar o dia
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Valor de Abertura (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpenDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleOpenRegister} disabled={isSaving}>
                  {isSaving ? 'Abrindo...' : 'Confirmar Abertura'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current Register Status */}
      {currentRegister ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Abertura</p>
                    <p className="text-2xl font-bold">{formatCurrency(currentRegister.opening_amount)}</p>
                  </div>
                  <DoorOpen className="w-8 h-8 text-primary opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Entradas</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saídas</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Esperado</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(expectedAmount)}</p>
                  </div>
                  <Wallet className="w-8 h-8 text-primary opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setMovementType('withdrawal')}>
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  Sangria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{movementType === 'withdrawal' ? 'Sangria' : 'Reforço'}</DialogTitle>
                  <DialogDescription>
                    {movementType === 'withdrawal' 
                      ? 'Registre uma retirada de dinheiro do caixa'
                      : 'Registre uma entrada de dinheiro no caixa'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={movementType === 'withdrawal' ? 'default' : 'outline'}
                      onClick={() => setMovementType('withdrawal')}
                      className="flex-1"
                    >
                      Sangria
                    </Button>
                    <Button
                      variant={movementType === 'deposit' ? 'default' : 'outline'}
                      onClick={() => setMovementType('deposit')}
                      className="flex-1"
                    >
                      Reforço
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={movementAmount}
                      onChange={(e) => setMovementAmount(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={movementDescription}
                      onChange={(e) => setMovementDescription(e.target.value)}
                      placeholder="Motivo da movimentação..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddMovement} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Confirmar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => {
              setMovementType('deposit');
              setIsMovementDialogOpen(true);
            }}>
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Reforço
            </Button>

            {isAdmin && (
              <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <DoorClosed className="w-4 h-4 mr-2" />
                    Fechar Caixa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Fechar Caixa</DialogTitle>
                    <DialogDescription>
                      Saldo esperado: {formatCurrency(expectedAmount)}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Valor Conferido (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={closingAmount}
                        onChange={(e) => setClosingAmount(e.target.value)}
                        placeholder="0,00"
                      />
                      {closingAmount && (
                        <p className={`text-sm ${parseFloat(closingAmount) - expectedAmount !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                          Diferença: {formatCurrency(parseFloat(closingAmount) - expectedAmount)}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                        placeholder="Observações do fechamento..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleCloseRegister} disabled={isSaving}>
                      {isSaving ? 'Fechando...' : 'Confirmar Fechamento'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Movements Table */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações do Dia</CardTitle>
              <CardDescription>
                Aberto por {currentRegister.opener?.full_name} em {format(new Date(currentRegister.opened_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map(movement => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {format(new Date(movement.created_at), "HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.type)}
                          <Badge variant={movement.type === 'income' || movement.type === 'deposit' ? 'default' : 'destructive'}>
                            {getMovementLabel(movement.type)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{movement.description || '-'}</TableCell>
                      <TableCell>{movement.creator?.full_name || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${movement.type === 'income' || movement.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.type === 'income' || movement.type === 'deposit' ? '+' : '-'}
                        {formatCurrency(movement.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {movements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhuma movimentação registrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Caixa Fechado</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin 
                ? 'Abra o caixa para iniciar as operações do dia.'
                : 'Aguarde um administrador abrir o caixa.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Caixas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Aberto por</TableHead>
                <TableHead>Fechado por</TableHead>
                <TableHead className="text-right">Abertura</TableHead>
                <TableHead className="text-right">Fechamento</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registers.slice(0, 10).map(register => (
                <TableRow key={register.id}>
                  <TableCell>
                    {format(new Date(register.opened_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{register.opener?.full_name || '-'}</TableCell>
                  <TableCell>{register.closer?.full_name || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(register.opening_amount)}</TableCell>
                  <TableCell className="text-right">
                    {register.closing_amount ? formatCurrency(register.closing_amount) : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${register.difference && register.difference !== 0 ? 'text-destructive' : ''}`}>
                    {register.difference !== null ? formatCurrency(register.difference) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={register.status === 'open' ? 'default' : 'secondary'}>
                      {register.status === 'open' ? 'Aberto' : 'Fechado'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
