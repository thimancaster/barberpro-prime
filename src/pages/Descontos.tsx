import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { 
  Plus, 
  Tag, 
  Percent, 
  DollarSign, 
  Calendar,
  Trash2,
  Loader2,
  Edit,
  Copy
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Discount, DiscountType, DiscountAppliesTo } from '@/types/phases';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Descontos() {
  const { organization } = useAuth();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage' as DiscountType,
    value: '',
    min_purchase: '',
    max_discount: '',
    applies_to: 'all' as DiscountAppliesTo,
    valid_from: format(new Date(), 'yyyy-MM-dd'),
    valid_until: '',
    usage_limit: '',
    is_active: true,
  });

  useEffect(() => {
    if (organization?.id) {
      fetchDiscounts();
    }
  }, [organization?.id]);

  const fetchDiscounts = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscounts(data as Discount[] || []);
    } catch (error) {
      toast.error('Erro ao carregar cupons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!organization?.id || !formData.name || !formData.code || !formData.value) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSaving(true);

    try {
      const discountData = {
        organization_id: organization.id,
        name: formData.name,
        code: formData.code.toUpperCase().trim(),
        type: formData.type,
        value: parseFloat(formData.value),
        min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : 0,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        applies_to: formData.applies_to,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        is_active: formData.is_active,
      };

      if (editingDiscount) {
        const { error } = await supabase
          .from('discounts')
          .update(discountData)
          .eq('id', editingDiscount.id);
        if (error) throw error;
        toast.success('Cupom atualizado!');
      } else {
        const { error } = await supabase
          .from('discounts')
          .insert(discountData);
        if (error) throw error;
        toast.success('Cupom criado!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchDiscounts();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Este código já existe');
      } else {
        toast.error('Erro ao salvar cupom');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este cupom?')) return;

    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Cupom excluído');
      fetchDiscounts();
    } catch (error) {
      toast.error('Erro ao excluir cupom');
    }
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      code: discount.code,
      type: discount.type,
      value: discount.value.toString(),
      min_purchase: discount.min_purchase?.toString() || '',
      max_discount: discount.max_discount?.toString() || '',
      applies_to: discount.applies_to,
      valid_from: discount.valid_from ? format(new Date(discount.valid_from), 'yyyy-MM-dd') : '',
      valid_until: discount.valid_until ? format(new Date(discount.valid_until), 'yyyy-MM-dd') : '',
      usage_limit: discount.usage_limit?.toString() || '',
      is_active: discount.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingDiscount(null);
    setFormData({
      name: '',
      code: '',
      type: 'percentage',
      value: '',
      min_purchase: '',
      max_discount: '',
      applies_to: 'all',
      valid_from: format(new Date(), 'yyyy-MM-dd'),
      valid_until: '',
      usage_limit: '',
      is_active: true,
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  const getStatusBadge = (discount: Discount) => {
    const now = new Date();
    if (!discount.is_active) {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    if (discount.valid_until && new Date(discount.valid_until) < now) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (discount.usage_limit && discount.times_used >= discount.usage_limit) {
      return <Badge variant="destructive">Esgotado</Badge>;
    }
    return <Badge className="bg-success/20 text-success border-success/30">Ativo</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground">Gerencie cupons e códigos promocionais</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDiscount ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle>
              <DialogDescription>
                Configure os detalhes do cupom de desconto
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Ex: Desconto de Natal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    placeholder="Ex: NATAL20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: DiscountType) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor *</Label>
                  <div className="relative">
                    {formData.type === 'percentage' ? (
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    )}
                    <Input
                      type="number"
                      placeholder={formData.type === 'percentage' ? '10' : '15.00'}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Aplica-se a</Label>
                <Select
                  value={formData.applies_to}
                  onValueChange={(v: DiscountAppliesTo) => setFormData({ ...formData, applies_to: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tudo</SelectItem>
                    <SelectItem value="services">Apenas Serviços</SelectItem>
                    <SelectItem value="products">Apenas Produtos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Compra Mínima (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desconto Máximo (R$)</Label>
                  <Input
                    type="number"
                    placeholder="Sem limite"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Válido a partir de</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Válido até</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Limite de Usos</Label>
                  <Input
                    type="number"
                    placeholder="Ilimitado"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label>Ativo</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingDiscount ? 'Salvar' : 'Criar Cupom'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-gradient border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum cupom criado ainda</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-secondary px-2 py-1 rounded text-sm font-mono">
                          {discount.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyCode(discount.code)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{discount.name}</TableCell>
                    <TableCell>
                      {discount.type === 'percentage'
                        ? `${discount.value}%`
                        : `R$ ${Number(discount.value).toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {discount.times_used}
                      {discount.usage_limit && ` / ${discount.usage_limit}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {discount.valid_until
                        ? format(new Date(discount.valid_until), 'dd/MM/yyyy')
                        : 'Sem validade'}
                    </TableCell>
                    <TableCell>{getStatusBadge(discount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(discount)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(discount.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
