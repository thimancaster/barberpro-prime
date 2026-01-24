import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Gift, 
  ArrowRight, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoyaltyPoints, LoyaltyReward, LoyaltySettings } from '@/types/phases';
import { toast } from 'sonner';

interface LoyaltyWidgetProps {
  clientId: string;
  organizationId: string;
  subtotal: number;
  onRedeemReward: (reward: LoyaltyReward) => void;
}

export function LoyaltyWidget({
  clientId,
  organizationId,
  subtotal,
  onRedeemReward,
}: LoyaltyWidgetProps) {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyPoints | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);

  useEffect(() => {
    fetchLoyaltyData();
  }, [clientId, organizationId]);

  const fetchLoyaltyData = async () => {
    try {
      // Buscar configurações
      const { data: settingsData } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (!settingsData?.is_active) {
        setIsLoading(false);
        return;
      }

      setSettings(settingsData as LoyaltySettings);

      // Buscar pontos do cliente
      const { data: pointsData } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      setLoyaltyData(pointsData as LoyaltyPoints);

      // Buscar recompensas disponíveis
      const { data: rewardsData } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      setRewards(rewardsData as LoyaltyReward[] || []);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemReward = async (reward: LoyaltyReward) => {
    if (!loyaltyData || loyaltyData.points_balance < reward.points_cost) {
      toast.error('Pontos insuficientes');
      return;
    }

    setIsRedeeming(reward.id);

    try {
      // Atualizar pontos
      const newBalance = loyaltyData.points_balance - reward.points_cost;

      await supabase
        .from('loyalty_points')
        .update({
          points_balance: newBalance,
          total_points_redeemed: loyaltyData.total_points_redeemed + reward.points_cost,
        })
        .eq('id', loyaltyData.id);

      // Registrar transação
      await supabase.from('loyalty_transactions').insert({
        loyalty_points_id: loyaltyData.id,
        organization_id: organizationId,
        type: 'redeemed',
        points: -reward.points_cost,
        balance_after: newBalance,
        description: `Resgate: ${reward.name}`,
      });

      setLoyaltyData({
        ...loyaltyData,
        points_balance: newBalance,
        total_points_redeemed: loyaltyData.total_points_redeemed + reward.points_cost,
      });

      onRedeemReward(reward);
      toast.success(`Recompensa resgatada: ${reward.name}`);
    } catch (error) {
      toast.error('Erro ao resgatar recompensa');
    } finally {
      setIsRedeeming(null);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!settings?.is_active) {
    return null;
  }

  const pointsToEarn = Math.floor(subtotal * (settings?.points_per_currency || 1));
  const currentBalance = loyaltyData?.points_balance || 0;
  const availableRewards = rewards.filter(r => r.points_cost <= currentBalance);
  const nextReward = rewards.find(r => r.points_cost > currentBalance);

  return (
    <Card className="card-gradient border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          Programa de Fidelidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Saldo e pontos a ganhar */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary">{currentBalance}</div>
            <div className="text-xs text-muted-foreground">pontos disponíveis</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-success">
              <Sparkles className="w-4 h-4" />
              <span className="font-bold">+{pointsToEarn}</span>
            </div>
            <div className="text-xs text-muted-foreground">pontos nesta compra</div>
          </div>
        </div>

        {/* Próxima recompensa */}
        {nextReward && currentBalance < nextReward.points_cost && (
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Próxima recompensa:</span>
              <span className="font-medium">{nextReward.name}</span>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{currentBalance} pts</span>
                <span>{nextReward.points_cost} pts</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(currentBalance / nextReward.points_cost) * 100}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-center">
                Faltam {nextReward.points_cost - currentBalance} pontos
              </div>
            </div>
          </div>
        )}

        {/* Recompensas disponíveis */}
        {availableRewards.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Gift className="w-3 h-3" />
              Resgatar Agora
            </div>
            <div className="space-y-2">
              {availableRewards.slice(0, 3).map((reward) => (
                <button
                  key={reward.id}
                  onClick={() => handleRedeemReward(reward)}
                  disabled={isRedeeming === reward.id}
                  className="w-full p-3 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{reward.name}</span>
                      {reward.description && (
                        <p className="text-xs text-muted-foreground">{reward.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        {reward.points_cost} pts
                      </Badge>
                      {isRedeeming === reward.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
