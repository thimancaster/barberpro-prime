import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckout } from '@/hooks/useCheckout';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckoutSummary,
  CheckoutProducts,
  CheckoutDiscount,
  CheckoutTip,
  CheckoutPayment,
  CheckoutTotal,
} from '@/components/checkout';
import { DiscountCoupon } from '@/components/checkout/DiscountCoupon';
import { LoyaltyWidget } from '@/components/checkout/LoyaltyWidget';
import { ClientHistory } from '@/components/checkout/ClientHistory';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { Appointment, Client, Service, Profile } from '@/types/database';
import type { LoyaltyReward } from '@/types/phases';

interface AppointmentWithRelations extends Appointment {
  client: Client | null;
  service: Service | null;
  barber: Profile | null;
}

export default function Checkout() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { toast } = useToast();
  const { sendNotification } = useNotifications();
  
  const [appointment, setAppointment] = useState<AppointmentWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOpenRegister, setHasOpenRegister] = useState(false);

  const checkout = useCheckout({ appointment });
  const [appliedCoupon, setAppliedCoupon] = useState<{ name: string; code?: string } | null>(null);

  const handleApplyCouponDiscount = (discount: { type: 'percentage' | 'fixed'; value: number; name: string; code?: string }) => {
    if (discount.type === 'percentage') {
      checkout.setDiscountType('percentage');
      checkout.setDiscountPercentage(discount.value);
      checkout.setDiscountAmount(0);
    } else {
      checkout.setDiscountType('fixed');
      checkout.setDiscountAmount(discount.value);
      checkout.setDiscountPercentage(0);
    }
    checkout.setDiscountReason(discount.code ? `Cupom: ${discount.code}` : `Promoção: ${discount.name}`);
    setAppliedCoupon({ name: discount.name, code: discount.code });
  };

  const handleRemoveCouponDiscount = () => {
    checkout.setDiscountType('fixed');
    checkout.setDiscountAmount(0);
    checkout.setDiscountPercentage(0);
    checkout.setDiscountReason('');
    setAppliedCoupon(null);
  };

  const handleRedeemReward = (reward: LoyaltyReward) => {
    if (reward.reward_type === 'discount' && reward.reward_value) {
      checkout.setDiscountType('fixed');
      checkout.setDiscountAmount(reward.reward_value);
      checkout.setDiscountReason(`Resgate fidelidade: ${reward.name}`);
      setAppliedCoupon({ name: reward.name });
    }
  };

  useEffect(() => {
    if (appointmentId && organization?.id) {
      fetchAppointment();
      checkCashRegister();
    }
  }, [appointmentId, organization?.id]);

  const fetchAppointment = async () => {
    if (!appointmentId || !organization) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(*),
        service:services(*),
        barber:profiles(*)
      `)
      .eq('id', appointmentId)
      .eq('organization_id', organization.id)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      toast({
        title: 'Erro ao carregar agendamento',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/agenda');
      return;
    }

    if (data.status === 'completed') {
      toast({
        title: 'Agendamento já finalizado',
        description: 'Este atendimento já foi concluído',
        variant: 'destructive',
      });
      navigate('/agenda');
      return;
    }

    if (data.status === 'cancelled' || data.status === 'no_show') {
      toast({
        title: 'Agendamento não disponível',
        description: 'Este agendamento foi cancelado ou marcado como ausente',
        variant: 'destructive',
      });
      navigate('/agenda');
      return;
    }

    setAppointment(data as AppointmentWithRelations);
    setIsLoading(false);
  };

  const checkCashRegister = async () => {
    if (!organization) return;

    const { data } = await supabase
      .from('cash_registers')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('status', 'open')
      .maybeSingle();

    setHasOpenRegister(!!data);
  };

  const handleProcessCheckout = async () => {
    const success = await checkout.processCheckout();
    if (success && appointment) {
      // Send completion notification
      sendNotification({
        trigger: 'appointment_completed',
        appointmentId: appointment.id,
      });
      
      // Send review request
      sendNotification({
        trigger: 'review_request',
        appointmentId: appointment.id,
      });
      
      // Send loyalty points notification if client earned points
      if (appointment.client_id) {
        sendNotification({
          trigger: 'loyalty_points_earned',
          appointmentId: appointment.id,
          clientId: appointment.client_id,
        });
      }
      
      navigate('/agenda');
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Agendamento não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O agendamento solicitado não existe ou você não tem permissão para acessá-lo.
          </p>
          <Button onClick={() => navigate('/agenda')}>Voltar para Agenda</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/agenda')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">Finalize o atendimento e registre o pagamento</p>
        </div>
      </div>

      {/* Cash Register Warning */}
      {!hasOpenRegister && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">Caixa fechado</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Você precisa abrir o caixa antes de processar pagamentos.{' '}
              <Button variant="link" className="h-auto p-0 text-yellow-700 dark:text-yellow-300 underline" onClick={() => navigate('/caixa')}>
                Abrir caixa
              </Button>
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <CheckoutSummary appointment={appointment} />
          
          <CheckoutProducts
            cartItems={checkout.cartItems}
            onAddToCart={checkout.addToCart}
            onUpdateQuantity={checkout.updateCartItemQuantity}
            onRemoveFromCart={checkout.removeFromCart}
            productsTotal={checkout.productsTotal}
          />

          {/* Cupons e Fidelidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {organization?.id && (
              <DiscountCoupon
                organizationId={organization.id}
                clientId={appointment.client_id || undefined}
                subtotal={checkout.subtotal}
                onApplyDiscount={handleApplyCouponDiscount}
                onRemoveDiscount={handleRemoveCouponDiscount}
                appliedDiscount={appliedCoupon}
              />
            )}
            
            {organization?.id && appointment.client_id && (
              <LoyaltyWidget
                organizationId={organization.id}
                clientId={appointment.client_id}
                subtotal={checkout.subtotal}
                onRedeemReward={handleRedeemReward}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CheckoutDiscount
              discountType={checkout.discountType}
              discountAmount={checkout.discountAmount}
              discountPercentage={checkout.discountPercentage}
              discountReason={checkout.discountReason}
              calculatedDiscount={checkout.calculatedDiscount}
              subtotal={checkout.subtotal}
              onDiscountTypeChange={checkout.setDiscountType}
              onDiscountAmountChange={checkout.setDiscountAmount}
              onDiscountPercentageChange={checkout.setDiscountPercentage}
              onDiscountReasonChange={checkout.setDiscountReason}
            />
            
            <CheckoutTip
              tipAmount={checkout.tipAmount}
              total={checkout.total}
              onTipChange={checkout.setTipAmount}
            />
          </div>

          <CheckoutPayment
            paymentMethod={checkout.paymentMethod}
            isSplitPayment={checkout.isSplitPayment}
            paymentSplits={checkout.paymentSplits}
            total={checkout.total}
            onPaymentMethodChange={checkout.setPaymentMethod}
            onSplitPaymentChange={checkout.setIsSplitPayment}
            onAddSplit={checkout.addPaymentSplit}
            onUpdateSplit={checkout.updatePaymentSplit}
            onRemoveSplit={checkout.removePaymentSplit}
          />
        </div>

        {/* Right Column - Total + Client History */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            <CheckoutTotal
              serviceTotal={checkout.serviceTotal}
              productsTotal={checkout.productsTotal}
              subtotal={checkout.subtotal}
              calculatedDiscount={checkout.calculatedDiscount}
              tipAmount={checkout.tipAmount}
              total={checkout.total}
              totalCommission={checkout.totalCommission}
              paymentMethod={checkout.paymentMethod}
              isSplitPayment={checkout.isSplitPayment}
              paymentSplits={checkout.paymentSplits}
              cartItems={checkout.cartItems}
              isProcessing={checkout.isProcessing}
              notes={checkout.notes}
              onNotesChange={checkout.setNotes}
              onProcessCheckout={handleProcessCheckout}
            />
            
            {organization?.id && appointment.client_id && (
              <ClientHistory clientId={appointment.client_id} organizationId={organization.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
