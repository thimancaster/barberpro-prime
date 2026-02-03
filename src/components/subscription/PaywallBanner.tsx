import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Clock, Zap, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaywallBannerProps {
  feature?: string;
  showAlways?: boolean;
}

export function PaywallBanner({ feature, showAlways = false }: PaywallBannerProps) {
  const { isTrialing, isPremium, isExpired, daysRemaining, isLoading } = useSubscription();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const handleUpgrade = async () => {
    setIsCreatingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          price_id: 'premium_monthly', // Will be replaced with actual Stripe price ID
          success_url: `${window.location.origin}/dashboard?upgraded=true`,
          cancel_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  if (isLoading) return null;

  // Don't show if premium and not forcing display
  if (isPremium && !showAlways && !isTrialing) return null;

  // Expired state - urgent
  if (isExpired) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-destructive/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h4 className="font-semibold text-destructive">
                  Seu período de teste expirou
                </h4>
                <p className="text-sm text-muted-foreground">
                  {feature 
                    ? `Para acessar ${feature}, assine o plano Premium.`
                    : 'Assine o plano Premium para continuar usando todas as funcionalidades.'}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleUpgrade} 
              disabled={isCreatingCheckout}
              className="gap-2 bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90"
            >
              <Crown className="w-4 h-4" />
              {isCreatingCheckout ? 'Processando...' : 'Assinar Premium'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trialing state - show days remaining
  if (isTrialing) {
    const urgency = daysRemaining <= 2;
    return (
      <Card className={`border-primary/30 ${urgency ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-primary/5'}`}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${urgency ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/10'}`}>
                <Clock className={`w-5 h-5 ${urgency ? 'text-amber-600' : 'text-primary'}`} />
              </div>
              <div>
                <h4 className="font-semibold">
                  {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes no trial
                </h4>
                <p className="text-sm text-muted-foreground">
                  Aproveite todas as funcionalidades Premium gratuitamente.
                </p>
              </div>
            </div>
            <Button 
              onClick={handleUpgrade} 
              disabled={isCreatingCheckout}
              variant={urgency ? 'default' : 'outline'}
              className={urgency ? 'gap-2 bg-gradient-to-r from-primary to-amber-500' : 'gap-2'}
            >
              <Zap className="w-4 h-4" />
              {isCreatingCheckout ? 'Processando...' : 'Assinar Agora'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
