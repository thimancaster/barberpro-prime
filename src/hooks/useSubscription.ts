import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Subscription, SubscriptionState, SubscriptionStatus, PlanId } from '@/types/subscription';

export function useSubscription(): SubscriptionState {
  const { organization, isMasterAccount } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!organization?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', organization.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
      }

      setSubscription(data as Subscription | null);
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Calculate derived state - super admin checked via DB, not hardcoded email
  const status: SubscriptionStatus = isMasterAccount ? 'active' : (subscription?.status as SubscriptionStatus || 'expired');
  const plan: PlanId = isMasterAccount ? 'premium_yearly' : ((subscription?.plan_id as PlanId) || 'trial');
  const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const currentPeriodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;

  const isTrialExpired = !isMasterAccount && status === 'trialing' && trialEndsAt && trialEndsAt < new Date();
  const isExpired = !isMasterAccount && (status === 'expired' || status === 'canceled' || isTrialExpired);
  const isPremium = isMasterAccount || status === 'active' || (status === 'trialing' && !isTrialExpired);
  const isTrialing = !isMasterAccount && status === 'trialing' && !isTrialExpired;

  let daysRemaining = isMasterAccount ? 9999 : 0;
  if (!isMasterAccount) {
    if (isTrialing && trialEndsAt) {
      daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    } else if (status === 'active' && currentPeriodEnd) {
      daysRemaining = Math.max(0, Math.ceil((currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }
  }

  return {
    subscription,
    status: isTrialExpired ? 'expired' : status,
    plan,
    trialEndsAt,
    currentPeriodEnd,
    isLoading,
    isPremium,
    isTrialing,
    isExpired,
    daysRemaining,
    refetch: fetchSubscription,
  };
}
