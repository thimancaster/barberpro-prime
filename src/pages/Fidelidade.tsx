import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Star, 
  Gift, 
  Settings, 
  Plus,
  Trash2,
  Edit,
  Loader2,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoyaltyReward, LoyaltySettings, LoyaltyPoints } from '@/types/phases';
import { toast } from 'sonner';

export default function Fidelidade() {
  const { organization } = useAuth();
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [topClients, setTopClients] = useState<Array<LoyaltyPoints & { client?: { name: string } }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);

  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    points_cost: '',
    reward_type: 'discount',
    reward_value: '',
    is_active: true,
  });

  const [settingsForm, setSettingsForm] = useState({
    points_per_currency: '1',
    currency_per_point: '0.10',
    points_expiry_days: '',
    min_points_redeem: '10',
    is_active: true,
  });

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id]);

  const fetchData = async () => {
    if (!organization?.id) return;

    try {
      // Buscar configurações
      const { data: settingsData } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();

      if (settingsData) {
        setSettings(settingsData as LoyaltySettings);
        setSettingsForm({
          points_per_currency: settingsData.points_per_currency?.toString() || '1',
          currency_per_point: settingsData.currency_per_point?.toString() || '0.10',
          points_expiry_days: settingsData.points_expiry_days?.toString() || '',
          min_points_redeem: settingsData.min_points_redeem?.toString() || '10',
          is_active: settingsData.is_active ?? true,
        });
      }

      // Buscar recompensas
      const { data: rewardsData } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('organization_id', organization.id)
        .order('points_cost');

      setRewards(rewardsData as LoyaltyReward[] || []);

      // Buscar top clientes
      const { data: topClientsData } = await supabase
        .from('loyalty_points')
        .select('*, client:clients(name)')
        .eq('organization_id', organization.id)
        .order('points_balance', { ascending: false })
        .limit(10);

      setTopClients(topClientsData as any[] || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!organization?.id) return;

    setIsSaving(true);

    try {
      const settingsData = {
        organization_id: organization.id,
        points_per_currency: parseFloat(settingsForm.points_per_currency) || 1,
        currency_per_point: parseFloat(settingsForm.currency_per_point) || 0.1,
        points_expiry_days: settingsForm.points_expiry_days ? parseInt(settingsForm.points_expiry_days) : null,
        min_points_redeem: parseInt(settingsForm.min_points_redeem) || 10,
        is_active: settingsForm.is_active,
      };

      if (settings) {
        const { error } = await supabase
          .from('loyalty_settings')
          .update(settingsData)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('loyalty_settings')
          .insert(settingsData);
        if (error) throw error;
      }

      toast.success('Configurações salvas!');
      setIsSettingsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReward = async () => {
    if (!organization?.id || !rewardForm.name || !rewardForm.points_cost) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSaving(true);

    try {
      const rewardData = {
        organization_id: organization.id,
        name: rewardForm.name,
        description: rewardForm.description || null,
        points_cost: parseInt(rewardForm.points_cost),
        reward_type: rewardForm.reward_type,
        reward_value: rewardForm.reward_value ? parseFloat(rewardForm.reward_value) : null,
        is_active: rewardForm.is_active,
      };

      if (editingReward) {
        const { error } = await supabase
          .from('loyalty_rewards')
          .update(rewardData)
          .eq('id', editingReward.id);
        if (error) throw error;
        toast.success('Recompensa atualizada!');
      } else {
        const { error } = await supabase
          .from('loyalty_rewards')
          .insert(rewardData);
        if (error) throw error;
        toast.success('Recompensa criada!');
      }

      setIsRewardDialogOpen(false);
      resetRewardForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar recompensa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm('Deseja excluir esta recompensa?')) return;

    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Recompensa excluída');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const handleEditReward = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name,
      description: reward.description || '',
      points_cost: reward.points_cost.toString(),
      reward_type: reward.reward_type,
      reward_value: reward.reward_value?.toString() || '',
      is_active: reward.is_active,
    });
    setIsRewardDialogOpen(true);
  };

  const resetRewardForm = () => {
    setEditingReward(null);
    setRewardForm({
      name: '',
      description: '',
      points_cost: '',
      reward_type: 'discount',
      reward_value: '',
      is_active: true,
    });
  };

  // Estatísticas
  const totalPoints = topClients.reduce((sum, c) => sum + (c.points_balance || 0), 0);
  const totalEarned = topClients.reduce((sum, c) => sum + (c.total_points_earned || 0), 0);
  const totalRedeemed = topClients.reduce((sum, c) => sum + (c.total_points_redeemed || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Programa de Fidelidade</h1>
          <p className="text-muted-foreground">Gerencie pontos e recompensas dos clientes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Configurações
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurações de Fidelidade</DialogTitle>
                <DialogDescription>
                  Configure as regras do programa de pontos
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Label>Programa Ativo</Label>
                  <Switch
                    checked={settingsForm.is_active}
                    onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, is_active: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pontos por R$ gasto</Label>
                  <Input
                    type="number"
                    value={settingsForm.points_per_currency}
                    onChange={(e) => setSettingsForm({ ...settingsForm, points_per_currency: e.target.value })}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Quantos pontos o cliente ganha a cada R$ 1,00 gasto
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Valor de cada ponto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settingsForm.currency_per_point}
                    onChange={(e) => setSettingsForm({ ...settingsForm, currency_per_point: e.target.value })}
                    placeholder="0.10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Quanto vale cada ponto em desconto
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Mínimo para resgate</Label>
                  <Input
                    type="number"
                    value={settingsForm.min_points_redeem}
                    onChange={(e) => setSettingsForm({ ...settingsForm, min_points_redeem: e.target.value })}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expiração (dias)</Label>
                  <Input
                    type="number"
                    value={settingsForm.points_expiry_days}
                    onChange={(e) => setSettingsForm({ ...settingsForm, points_expiry_days: e.target.value })}
                    placeholder="Sem expiração"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isRewardDialogOpen} onOpenChange={(open) => { setIsRewardDialogOpen(open); if (!open) resetRewardForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Recompensa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Ex: Corte Grátis"
                    value={rewardForm.name}
                    onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Descrição opcional"
                    value={rewardForm.description}
                    onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Custo em Pontos *</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={rewardForm.points_cost}
                      onChange={(e) => setRewardForm({ ...rewardForm, points_cost: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      placeholder="Valor do benefício"
                      value={rewardForm.reward_value}
                      onChange={(e) => setRewardForm({ ...rewardForm, reward_value: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch
                    checked={rewardForm.is_active}
                    onCheckedChange={(checked) => setRewardForm({ ...rewardForm, is_active: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsRewardDialogOpen(false); resetRewardForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveReward} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingReward ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Banner */}
      {!settings?.is_active && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-warning" />
                <span className="font-medium">Programa de Fidelidade Desativado</span>
              </div>
              <Button size="sm" onClick={() => setIsSettingsDialogOpen(true)}>
                Ativar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              Pontos em Circulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Pontos Emitidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEarned.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Pontos Resgatados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRedeemed.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clientes no Programa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topClients.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rewards">
        <TabsList>
          <TabsTrigger value="rewards" className="gap-2">
            <Gift className="w-4 h-4" />
            Recompensas
          </TabsTrigger>
          <TabsTrigger value="ranking" className="gap-2">
            <Award className="w-4 h-4" />
            Ranking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="mt-4">
          <Card className="card-gradient border-border/50">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : rewards.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma recompensa cadastrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recompensa</TableHead>
                      <TableHead>Custo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rewards.map((reward) => (
                      <TableRow key={reward.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{reward.name}</div>
                            {reward.description && (
                              <div className="text-sm text-muted-foreground">{reward.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-primary/20 text-primary">
                            <Star className="w-3 h-3 mr-1" />
                            {reward.points_cost} pts
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reward.reward_value
                            ? `R$ ${Number(reward.reward_value).toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                            {reward.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditReward(reward)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteReward(reward.id)}
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
        </TabsContent>

        <TabsContent value="ranking" className="mt-4">
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle>Top Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              {topClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum cliente com pontos ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topClients.map((client: any, index) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-amber-500/20 text-amber-500' :
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        index === 2 ? 'bg-amber-700/20 text-amber-700' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{client.client?.name || 'Cliente'}</div>
                        <div className="text-sm text-muted-foreground">
                          {client.total_points_earned?.toLocaleString()} pts ganhos
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        <Star className="w-3 h-3 mr-1" />
                        {client.points_balance?.toLocaleString()} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
