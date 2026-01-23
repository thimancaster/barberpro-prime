import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Expense, ExpenseStatus, RecurrenceType } from '@/types/database';
import { Plus, Search, Edit, Trash2, Loader2, Receipt, CheckCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const expenseCategories = [
  'Aluguel',
  'Energia',
  'Água',
  'Internet',
  'Telefone',
  'Fornecedores',
  'Salários',
  'Marketing',
  'Manutenção',
  'Outros',
];

const recurrenceLabels: Record<RecurrenceType, string> = {
  none: 'Não recorrente',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

export default function Despesas() {
  const { organization, isAdmin } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: '',
    due_date: '',
    status: 'pending' as ExpenseStatus,
    is_recurring: false,
    recurrence_type: 'none' as RecurrenceType,
    recurrence_day: '',
  });

  useEffect(() => {
    if (organization?.id) {
      fetchExpenses();
    }
  }, [organization?.id]);

  const fetchExpenses = async () => {
    if (!organization?.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', organization.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      // Cast the recurrence_type to the proper type
      const typedData = (data || []).map(expense => ({
        ...expense,
        recurrence_type: expense.recurrence_type as 'none' | 'monthly' | 'weekly' | 'yearly'
      }));
      setExpenses(typedData);
    } catch (error) {
      // Log errors only in development to prevent information leakage
      if (import.meta.env.DEV) {
        console.error('Error fetching expenses:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization?.id || !formData.name.trim() || !formData.amount) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);

    try {
      const expenseData = {
        name: formData.name,
        description: formData.description || null,
        amount: parseFloat(formData.amount),
        category: formData.category || null,
        due_date: formData.due_date || null,
        status: formData.status,
        paid_at: formData.status === 'paid' ? new Date().toISOString() : null,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.is_recurring ? formData.recurrence_type : 'none',
        recurrence_day: formData.recurrence_day ? parseInt(formData.recurrence_day) : null,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        toast.success('Despesa atualizada!');
      } else {
        const { error } = await supabase.from('expenses').insert({
          ...expenseData,
          organization_id: organization.id,
        });

        if (error) throw error;
        toast.success('Despesa cadastrada!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchExpenses();
    } catch (error: any) {
      toast.error('Erro ao salvar despesa', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsPaid = async (expense: Expense) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', expense.id);

      if (error) throw error;
      toast.success('Despesa marcada como paga!');
      fetchExpenses();
    } catch (error: any) {
      toast.error('Erro ao atualizar despesa', { description: error.message });
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (!confirm(`Deseja realmente excluir a despesa "${expense.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id);

      if (error) throw error;
      toast.success('Despesa excluída!');
      fetchExpenses();
    } catch (error: any) {
      toast.error('Erro ao excluir despesa', { description: error.message });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      description: expense.description || '',
      amount: expense.amount.toString(),
      category: expense.category || '',
      due_date: expense.due_date || '',
      status: expense.status,
      is_recurring: expense.is_recurring || false,
      recurrence_type: expense.recurrence_type || 'none',
      recurrence_day: expense.recurrence_day?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData({
      name: '',
      description: '',
      amount: '',
      category: '',
      due_date: '',
      status: 'pending',
      is_recurring: false,
      recurrence_type: 'none',
      recurrence_day: '',
    });
  };

  const filteredExpenses = expenses.filter((expense) =>
    expense.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalPending = expenses
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Summary */}
        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pendente</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(totalPending)}</p>
              </div>
              <Receipt className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar despesas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingExpense ? 'Atualize os dados da despesa' : 'Preencha os dados para cadastrar uma nova despesa'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Conta de Energia"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detalhes da despesa..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Vencimento</Label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v: ExpenseStatus) => setFormData({ ...formData, status: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  </div>

                  {/* Recurring expense toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Despesa Recorrente</Label>
                      <p className="text-sm text-muted-foreground">
                        Ativar para despesas fixas mensais
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_recurring}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                    />
                  </div>

                  {formData.is_recurring && (
                    <div className="grid grid-cols-2 gap-4 animate-fade-in">
                      <div className="space-y-2">
                        <Label>Frequência</Label>
                        <Select
                          value={formData.recurrence_type}
                          onValueChange={(v: RecurrenceType) => setFormData({ ...formData, recurrence_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="yearly">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Dia do Vencimento</Label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={formData.recurrence_day}
                          onChange={(e) => setFormData({ ...formData, recurrence_day: e.target.value })}
                          placeholder="Ex: 10"
                        />
                      </div>
                    </div>
                  )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Expenses Table */}
        <Card className="card-gradient border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-20">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'Nenhuma despesa encontrada' : 'Nenhuma despesa cadastrada'}
                </p>
                {!searchQuery && isAdmin && (
                  <Button
                    variant="link"
                    className="mt-2 text-primary"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    Cadastrar primeira despesa
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Despesa</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    {isAdmin && <TableHead className="w-[120px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{expense.name}</span>
                          {expense.is_recurring && expense.recurrence_type && expense.recurrence_type !== 'none' && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <RefreshCw className="w-3 h-3" />
                              {recurrenceLabels[expense.recurrence_type]}
                            </Badge>
                          )}
                        </div>
                        {expense.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {expense.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.category && (
                          <Badge variant="outline">{expense.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(expense.amount))}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {expense.due_date
                          ? format(new Date(expense.due_date), "dd/MM/yyyy", { locale: ptBR })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={expense.status === 'paid' ? 'default' : 'destructive'}>
                          {expense.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {expense.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-success"
                                onClick={() => handleMarkAsPaid(expense)}
                                title="Marcar como pago"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(expense)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDelete(expense)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
