import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users, Calendar, Package, CreditCard, Tag, Star } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted))'];

interface MonthlyData {
  month: string;
  receita: number;
  despesas: number;
  lucro: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface DailyData {
  date: string;
  atendimentos: number;
  receita: number;
}

interface ServiceRanking {
  name: string;
  count: number;
  revenue: number;
}

interface ProductSalesData {
  name: string;
  quantity: number;
  revenue: number;
}

export default function Relatorios() {
  const { organization } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('6');
  
  // Finance data
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  // Appointments data
  const [dailyAppointments, setDailyAppointments] = useState<DailyData[]>([]);
  const [serviceRanking, setServiceRanking] = useState<ServiceRanking[]>([]);
  const [clientGrowth, setClientGrowth] = useState<{ month: string; novos: number; total: number }[]>([]);
  
  // Products data
  const [lowStockProducts, setLowStockProducts] = useState<ProductSalesData[]>([]);

  // Advanced reports data (Fase 7)
  const [paymentMethods, setPaymentMethods] = useState<CategoryData[]>([]);
  const [discountUsage, setDiscountUsage] = useState<{ name: string; count: number; totalDiscount: number }[]>([]);
  const [loyaltyStats, setLoyaltyStats] = useState<{
    totalPoints: number;
    totalRedeemed: number;
    activeMembers: number;
    pointsPerMonth: { month: string; earned: number; redeemed: number }[];
  }>({ totalPoints: 0, totalRedeemed: 0, activeMembers: 0, pointsPerMonth: [] });

  useEffect(() => {
    if (organization?.id) {
      fetchAllData();
    }
  }, [organization?.id, period]);

  const fetchAllData = async () => {
    if (!organization?.id) return;
    setIsLoading(true);

    try {
      const months = parseInt(period);
      const startDate = startOfMonth(subMonths(new Date(), months - 1));
      const endDate = endOfMonth(new Date());

      await Promise.all([
        fetchFinanceData(startDate, endDate, months),
        fetchAppointmentsData(startDate, endDate),
        fetchClientsData(startDate, months),
        fetchProductsData(),
        fetchAdvancedData(startDate, endDate, months),
      ]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching report data:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFinanceData = async (startDate: Date, endDate: Date, months: number) => {
    // Fetch completed appointments (revenue)
    const { data: appointments } = await supabase
      .from('appointments')
      .select('price, start_time')
      .eq('organization_id', organization!.id)
      .eq('status', 'completed')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    // Fetch expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, category, due_date, status')
      .eq('organization_id', organization!.id)
      .gte('due_date', format(startDate, 'yyyy-MM-dd'))
      .lte('due_date', format(endDate, 'yyyy-MM-dd'));

    // Calculate monthly data
    const monthlyMap = new Map<string, { receita: number; despesas: number }>();
    
    for (let i = 0; i < months; i++) {
      const month = format(subMonths(new Date(), months - 1 - i), 'MMM/yy', { locale: ptBR });
      monthlyMap.set(month, { receita: 0, despesas: 0 });
    }

    appointments?.forEach((apt) => {
      const month = format(new Date(apt.start_time), 'MMM/yy', { locale: ptBR });
      const current = monthlyMap.get(month);
      if (current) {
        current.receita += Number(apt.price);
      }
    });

    expenses?.forEach((exp) => {
      if (exp.due_date) {
        const month = format(new Date(exp.due_date), 'MMM/yy', { locale: ptBR });
        const current = monthlyMap.get(month);
        if (current) {
          current.despesas += Number(exp.amount);
        }
      }
    });

    const monthly: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      receita: data.receita,
      despesas: data.despesas,
      lucro: data.receita - data.despesas,
    }));

    setMonthlyData(monthly);
    setTotalRevenue(monthly.reduce((sum, m) => sum + m.receita, 0));
    setTotalExpenses(monthly.reduce((sum, m) => sum + m.despesas, 0));

    // Calculate expenses by category
    const categoryMap = new Map<string, number>();
    expenses?.forEach((exp) => {
      const category = exp.category || 'Outros';
      categoryMap.set(category, (categoryMap.get(category) || 0) + Number(exp.amount));
    });

    setExpensesByCategory(
      Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    );
  };

  const fetchAppointmentsData = async (startDate: Date, endDate: Date) => {
    // Fetch all appointments in period
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, price, start_time, status, service_id, services(name)')
      .eq('organization_id', organization!.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    // Daily appointments for last 30 days
    const last30Days = eachDayOfInterval({
      start: subMonths(new Date(), 1),
      end: new Date(),
    });

    const dailyMap = new Map<string, { atendimentos: number; receita: number }>();
    last30Days.forEach((day) => {
      dailyMap.set(format(day, 'dd/MM'), { atendimentos: 0, receita: 0 });
    });

    appointments?.forEach((apt) => {
      const date = format(new Date(apt.start_time), 'dd/MM');
      const current = dailyMap.get(date);
      if (current && apt.status === 'completed') {
        current.atendimentos += 1;
        current.receita += Number(apt.price);
      }
    });

    setDailyAppointments(
      Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        atendimentos: data.atendimentos,
        receita: data.receita,
      }))
    );

    // Service ranking
    const serviceMap = new Map<string, { count: number; revenue: number }>();
    appointments?.forEach((apt) => {
      if (apt.status === 'completed' && apt.services) {
        const serviceName = (apt.services as any).name || 'Sem serviço';
        const current = serviceMap.get(serviceName) || { count: 0, revenue: 0 };
        current.count += 1;
        current.revenue += Number(apt.price);
        serviceMap.set(serviceName, current);
      }
    });

    setServiceRanking(
      Array.from(serviceMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    );
  };

  const fetchClientsData = async (startDate: Date, months: number) => {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, created_at')
      .eq('organization_id', organization!.id);

    // Client growth per month
    const growthMap = new Map<string, { novos: number; total: number }>();
    let runningTotal = 0;

    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(new Date(), months - 1 - i);
      const month = format(monthDate, 'MMM/yy', { locale: ptBR });
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const newClients = clients?.filter((c) => {
        const createdAt = new Date(c.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length || 0;

      runningTotal += newClients;
      growthMap.set(month, { novos: newClients, total: runningTotal });
    }

    setClientGrowth(
      Array.from(growthMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      }))
    );
  };

  const fetchProductsData = async () => {
    const { data: products } = await supabase
      .from('products')
      .select('name, quantity, min_quantity, sale_price')
      .eq('organization_id', organization!.id)
      .eq('is_active', true);

    // Products with low stock
    const lowStock = products
      ?.filter((p) => p.quantity <= p.min_quantity)
      .map((p) => ({
        name: p.name,
        quantity: p.quantity,
        revenue: Number(p.sale_price),
      }))
      .slice(0, 5) || [];

    setLowStockProducts(lowStock);
  };

  const fetchAdvancedData = async (startDate: Date, endDate: Date, months: number) => {
    // Fetch payment methods distribution
    const { data: payments } = await supabase
      .from('payments')
      .select('payment_method, total_amount, discount_amount, discount_reason')
      .eq('organization_id', organization!.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Payment methods breakdown
    const methodMap = new Map<string, number>();
    const PAYMENT_LABELS: Record<string, string> = {
      cash: 'Dinheiro',
      pix: 'PIX',
      credit_card: 'Crédito',
      debit_card: 'Débito',
      voucher: 'Voucher',
      mixed: 'Dividido',
    };
    
    payments?.forEach((p) => {
      const label = PAYMENT_LABELS[p.payment_method] || p.payment_method;
      methodMap.set(label, (methodMap.get(label) || 0) + Number(p.total_amount));
    });

    setPaymentMethods(
      Array.from(methodMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    );

    // Discount usage
    const discountMap = new Map<string, { count: number; totalDiscount: number }>();
    payments?.forEach((p) => {
      if (p.discount_amount > 0 && p.discount_reason) {
        const reason = p.discount_reason.length > 30 ? p.discount_reason.slice(0, 30) + '...' : p.discount_reason;
        const current = discountMap.get(reason) || { count: 0, totalDiscount: 0 };
        current.count += 1;
        current.totalDiscount += Number(p.discount_amount);
        discountMap.set(reason, current);
      }
    });

    setDiscountUsage(
      Array.from(discountMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.totalDiscount - a.totalDiscount)
        .slice(0, 10)
    );

    // Loyalty statistics
    const { data: loyaltyPoints } = await supabase
      .from('loyalty_points')
      .select('points_balance, total_points_earned, total_points_redeemed')
      .eq('organization_id', organization!.id);

    const { data: loyaltyTransactions } = await supabase
      .from('loyalty_transactions')
      .select('type, points, created_at')
      .eq('organization_id', organization!.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalPoints = loyaltyPoints?.reduce((sum, p) => sum + (p.total_points_earned || 0), 0) || 0;
    const totalRedeemed = loyaltyPoints?.reduce((sum, p) => sum + (p.total_points_redeemed || 0), 0) || 0;
    const activeMembers = loyaltyPoints?.filter((p) => (p.points_balance || 0) > 0).length || 0;

    // Points per month
    const pointsMonthMap = new Map<string, { earned: number; redeemed: number }>();
    for (let i = 0; i < months; i++) {
      const month = format(subMonths(new Date(), months - 1 - i), 'MMM/yy', { locale: ptBR });
      pointsMonthMap.set(month, { earned: 0, redeemed: 0 });
    }

    loyaltyTransactions?.forEach((t) => {
      const month = format(new Date(t.created_at), 'MMM/yy', { locale: ptBR });
      const current = pointsMonthMap.get(month);
      if (current) {
        if (t.type === 'earned' || t.type === 'bonus') {
          current.earned += t.points;
        } else if (t.type === 'redeemed') {
          current.redeemed += Math.abs(t.points);
        }
      }
    });

    setLoyaltyStats({
      totalPoints,
      totalRedeemed,
      activeMembers,
      pointsPerMonth: Array.from(pointsMonthMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      })),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const profit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise financeira e de desempenho</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas Total</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(profit)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${profit >= 0 ? 'text-success' : 'text-destructive'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <TrendingUp className={`w-8 h-8 ${profit >= 0 ? 'text-success' : 'text-destructive'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="finance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="finance" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="w-4 h-4" />
            Atendimentos
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Star className="w-4 h-4" />
            Avançado
          </TabsTrigger>
        </TabsList>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Expenses */}
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display">Receita vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar dataKey="receita" name="Receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expenses by Category */}
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display">Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {expensesByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Profit Evolution */}
            <Card className="card-gradient border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-display">Evolução do Lucro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="lucro"
                        name="Lucro"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorLucro)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Appointments */}
            <Card className="card-gradient border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-display">Atendimentos (últimos 30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyAppointments}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="atendimentos"
                        name="Atendimentos"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display">Serviços Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceRanking} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" tickFormatter={(v) => `R$${v}`} />
                      <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : value,
                          name === 'revenue' ? 'Receita' : 'Quantidade',
                        ]}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Products */}
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Package className="w-5 h-5 text-warning" />
                  Produtos com Estoque Baixo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    Nenhum produto com estoque baixo
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStockProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Estoque: <span className="text-warning font-medium">{product.quantity}</span>
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(product.revenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Client Growth */}
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display">Crescimento de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={clientGrowth}>
                      <defs>
                        <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Total de Clientes"
                        stroke="hsl(var(--chart-2))"
                        fillOpacity={1}
                        fill="url(#colorClientes)"
                      />
                      <Bar dataKey="novos" name="Novos Clientes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Tab - Fase 7 */}
        <TabsContent value="advanced" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-gradient border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Membros Fidelidade</p>
                    <p className="text-2xl font-bold text-primary">{loyaltyStats.activeMembers}</p>
                  </div>
                  <Star className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pontos Distribuídos</p>
                    <p className="text-2xl font-bold text-success">{loyaltyStats.totalPoints.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pontos Resgatados</p>
                    <p className="text-2xl font-bold text-chart-2">{loyaltyStats.totalRedeemed.toLocaleString()}</p>
                  </div>
                  <Tag className="w-8 h-8 text-chart-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Methods */}
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Formas de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {paymentMethods.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Discount Usage */}
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Uso de Descontos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {discountUsage.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum desconto utilizado no período
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={discountUsage} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tickFormatter={(v) => `R$${v}`} className="text-xs" />
                        <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === 'totalDiscount' ? formatCurrency(value) : value,
                            name === 'totalDiscount' ? 'Total Descontado' : 'Usos'
                          ]}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Bar dataKey="totalDiscount" name="Total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loyalty Points Evolution */}
            <Card className="card-gradient border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Evolução do Programa de Fidelidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loyaltyStats.pointsPerMonth.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma atividade de fidelidade no período
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={loyaltyStats.pointsPerMonth}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Bar dataKey="earned" name="Pontos Ganhos" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="redeemed" name="Pontos Resgatados" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
