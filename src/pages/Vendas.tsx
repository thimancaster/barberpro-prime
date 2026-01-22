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
import { ShoppingCart, Plus, Minus, Search, Package, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Product, Profile, Client } from '@/types/database';
import type { ProductSale } from '@/types/sales';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Vendas() {
  const { organization, user } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [barbers, setBarbers] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Stats
  const [todaySales, setTodaySales] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [productsRes, barbersRes, clientsRes, salesRes, todaySalesRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('organization_id', organization!.id)
          .eq('is_active', true)
          .gt('quantity', 0)
          .order('name'),
        supabase
          .from('profiles')
          .select('*')
          .eq('organization_id', organization!.id)
          .eq('is_active', true)
          .order('full_name'),
        supabase
          .from('clients')
          .select('*')
          .eq('organization_id', organization!.id)
          .order('name'),
        supabase
          .from('product_sales')
          .select(`
            *,
            product:products(name, sale_price),
            barber:profiles!product_sales_barber_id_fkey(full_name),
            client:clients(name)
          `)
          .eq('organization_id', organization!.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('product_sales')
          .select('total_price')
          .eq('organization_id', organization!.id)
          .gte('created_at', today.toISOString())
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (barbersRes.data) setBarbers(barbersRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (salesRes.data) setSales(salesRes.data as ProductSale[]);
      
      if (todaySalesRes.data) {
        setTodaySales(todaySalesRes.data.length);
        setTodayRevenue(todaySalesRes.data.reduce((sum, s) => sum + Number(s.total_price), 0));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= (product.quantity || 0)) {
          toast({
            title: 'Estoque insuficiente',
            description: `Apenas ${product.quantity} unidades disponíveis.`,
            variant: 'destructive',
          });
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > (item.product.quantity || 0)) {
            toast({
              title: 'Estoque insuficiente',
              variant: 'destructive',
            });
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      toast({ title: 'Carrinho vazio', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const barber = barbers.find(b => b.id === selectedBarber);
      const commissionPct = barber?.product_commission_percentage || barber?.commission_percentage || 0;

      for (const item of cart) {
        const totalPrice = item.product.sale_price * item.quantity;
        const commissionAmount = (totalPrice * commissionPct) / 100;

        // Register sale
        const { error: saleError } = await supabase
          .from('product_sales')
          .insert({
            organization_id: organization!.id,
            product_id: item.product.id,
            barber_id: selectedBarber || null,
            client_id: selectedClient || null,
            quantity: item.quantity,
            unit_price: item.product.sale_price,
            total_price: totalPrice,
            commission_percentage: commissionPct,
            commission_amount: commissionAmount,
            notes: notes || null,
          });

        if (saleError) throw saleError;

        // Update stock
        const newQuantity = (item.product.quantity || 0) - item.quantity;
        const { error: stockError } = await supabase
          .from('stock_movements')
          .insert({
            organization_id: organization!.id,
            product_id: item.product.id,
            type: 'sale',
            quantity: item.quantity,
            previous_quantity: item.product.quantity || 0,
            new_quantity: newQuantity,
            reason: `Venda PDV${selectedClient ? ' - Cliente' : ''}`,
            created_by: user?.id,
          });

        if (stockError) throw stockError;
      }

      toast({ title: 'Venda registrada com sucesso!' });
      setCart([]);
      setSelectedBarber('');
      setSelectedClient('');
      setNotes('');
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error finalizing sale:', error);
      toast({
        title: 'Erro ao registrar venda',
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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Ponto de Venda
          </h1>
          <p className="text-muted-foreground">
            Registre vendas de produtos
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Hoje</p>
                <p className="text-2xl font-bold">{todaySales}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Hoje</p>
                <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Carrinho</p>
                <p className="text-2xl font-bold">{formatCurrency(cartTotal)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <Package className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                    <p className="text-primary font-bold">{formatCurrency(product.sale_price)}</p>
                    <Badge variant="secondary" className="mt-1">
                      Estoque: {product.quantity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        <Card className="h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrinho
            </CardTitle>
            <CardDescription>{cart.length} item(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Carrinho vazio
              </p>
            ) : (
              <>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.product.sale_price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateCartQuantity(item.product.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateCartQuantity(item.product.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg" disabled={cart.length === 0}>
                      Finalizar Venda
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Finalizar Venda</DialogTitle>
                      <DialogDescription>
                        Total: {formatCurrency(cartTotal)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Vendedor (opcional)</Label>
                        <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {barbers.map(barber => (
                              <SelectItem key={barber.id} value={barber.id}>
                                {barber.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cliente (opcional)</Label>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Observações da venda..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleFinalizeSale} disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Confirmar Venda'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.slice(0, 10).map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {format(new Date(sale.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{sale.product?.name || '-'}</TableCell>
                  <TableCell>{sale.barber?.full_name || '-'}</TableCell>
                  <TableCell>{sale.client?.name || '-'}</TableCell>
                  <TableCell className="text-right">{sale.quantity}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(sale.total_price)}
                  </TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma venda registrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
