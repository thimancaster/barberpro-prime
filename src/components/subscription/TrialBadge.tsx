import { useSubscription } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import { Clock, Crown, AlertTriangle } from 'lucide-react';

export function TrialBadge() {
  const { isTrialing, isPremium, isExpired, daysRemaining, isLoading } = useSubscription();

  if (isLoading) return null;

  if (isExpired) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="w-3 h-3" />
        Expirado
      </Badge>
    );
  }

  if (isTrialing) {
    const urgency = daysRemaining <= 2 ? 'destructive' : daysRemaining <= 5 ? 'secondary' : 'outline';
    return (
      <Badge variant={urgency} className="gap-1">
        <Clock className="w-3 h-3" />
        {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} de trial
      </Badge>
    );
  }

  if (isPremium) {
    return (
      <Badge className="gap-1 bg-gradient-to-r from-primary to-amber-500 text-primary-foreground">
        <Crown className="w-3 h-3" />
        Premium
      </Badge>
    );
  }

  return null;
}
