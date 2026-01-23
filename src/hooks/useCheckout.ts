import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { CartItem, PaymentMethodType, PaymentSplit, CheckoutState } from '@/types/checkout';
import type { Product, Appointment, Service, Client, Profile } from '@/types/database';

interface AppointmentWithRelations extends Appointment {
  client: Client | null;
  service: Service | null;
  barber: Profile | null;
}

interface UseCheckoutProps {
  appointment: AppointmentWithRelations | null;
}

export function useCheckout({ appointment }: UseCheckoutProps) {
  const { organization, user } = useAuth();
  const { toast } = useToast();

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Discount state
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountReason, setDiscountReason] = useState('');
  
  // Tip state
  const [tipAmount, setTipAmount] = useState(0);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  
  // Loading state
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');

  // Calculations
  const serviceTotal = appointment?.price || 0;
  const serviceCommission = appointment?.commission_amount || 0;
  
  const productsTotal = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.totalPrice, 0), 
    [cartItems]
  );
  
  const productsCommission = useMemo(() => 
    cartItems.reduce((sum, item) => sum + (item.totalPrice * item.commissionPercentage / 100), 0), 
    [cartItems]
  );
  
  const subtotal = serviceTotal + productsTotal;
  
  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percentage') {
      return (subtotal * discountPercentage) / 100;
    }
    return discountAmount;
  }, [subtotal, discountType, discountAmount, discountPercentage]);
  
  const total = Math.max(0, subtotal - calculatedDiscount + tipAmount);
  const totalCommission = serviceCommission + productsCommission;

  // Cart actions
  const addToCart = useCallback((product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast({
            title: 'Estoque insuficiente',
            description: `Apenas ${product.quantity} unidades disponíveis`,
            variant: 'destructive',
          });
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice 
              }
            : item
        );
      }
      
      if (product.quantity < 1) {
        toast({
          title: 'Produto sem estoque',
          description: 'Este produto está esgotado',
          variant: 'destructive',
        });
        return prev;
      }
      
      return [...prev, {
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.sale_price,
        totalPrice: product.sale_price,
        commissionPercentage: 0, // Will be calculated based on barber
      }];
    });
  }, [toast]);

  const updateCartItemQuantity = useCallback((itemId: string, delta: number, maxStock: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id !== itemId) return item;
        
        const newQuantity = item.quantity + delta;
        if (newQuantity < 1) return item;
        if (newQuantity > maxStock) {
          toast({
            title: 'Estoque insuficiente',
            description: `Apenas ${maxStock} unidades disponíveis`,
            variant: 'destructive',
          });
          return item;
        }
        
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: newQuantity * item.unitPrice,
        };
      });
    });
  }, [toast]);

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Payment split actions
  const addPaymentSplit = useCallback(() => {
    setPaymentSplits(prev => [...prev, { method: 'cash', amount: 0 }]);
  }, []);

  const updatePaymentSplit = useCallback((index: number, updates: Partial<PaymentSplit>) => {
    setPaymentSplits(prev => 
      prev.map((split, i) => i === index ? { ...split, ...updates } : split)
    );
  }, []);

  const removePaymentSplit = useCallback((index: number) => {
    setPaymentSplits(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Process checkout
  const processCheckout = useCallback(async () => {
    if (!appointment || !organization) {
      toast({
        title: 'Erro',
        description: 'Dados do agendamento não encontrados',
        variant: 'destructive',
      });
      return false;
    }

    setIsProcessing(true);

    try {
      // Check for open cash register
      const { data: openRegister, error: registerError } = await supabase
        .from('cash_registers')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('status', 'open')
        .maybeSingle();

      if (registerError) throw registerError;

      if (!openRegister) {
        toast({
          title: 'Caixa fechado',
          description: 'Abra o caixa antes de processar pagamentos',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return false;
      }

      // Create payment record
      const paymentData = {
        organization_id: organization.id,
        appointment_id: appointment.id,
        client_id: appointment.client_id,
        barber_id: appointment.barber_id,
        cash_register_id: openRegister.id,
        subtotal,
        discount_amount: calculatedDiscount,
        discount_percentage: discountType === 'percentage' ? discountPercentage : 0,
        discount_reason: discountReason || null,
        tip_amount: tipAmount,
        total_amount: total,
        payment_method: (isSplitPayment ? 'mixed' : paymentMethod) as 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'voucher' | 'mixed',
        payment_details: isSplitPayment ? JSON.stringify(paymentSplits) : '[]',
        service_commission: serviceCommission,
        product_commission: productsCommission,
        total_commission: totalCommission,
        notes: notes || null,
        created_by: user?.id,
      };

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select('id')
        .single();

      if (paymentError) throw paymentError;

      // Create payment items for service
      if (appointment.service) {
        await supabase.from('payment_items').insert({
          payment_id: payment.id,
          organization_id: organization.id,
          item_type: 'service',
          item_name: appointment.service.name,
          quantity: 1,
          unit_price: serviceTotal,
          total_price: serviceTotal,
          commission_percentage: appointment.service.commission_percentage,
          commission_amount: serviceCommission,
        });
      }

      // Create payment items for products
      for (const item of cartItems) {
        await supabase.from('payment_items').insert({
          payment_id: payment.id,
          organization_id: organization.id,
          product_id: item.productId,
          item_type: 'product',
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          commission_percentage: item.commissionPercentage,
          commission_amount: item.totalPrice * item.commissionPercentage / 100,
        });

        // Create stock movement for each product
        const { data: product } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.productId)
          .single();

        if (product) {
          await supabase.from('stock_movements').insert({
            product_id: item.productId,
            organization_id: organization.id,
            type: 'sale',
            quantity: item.quantity,
            previous_quantity: product.quantity,
            new_quantity: product.quantity - item.quantity,
            reason: `Venda no checkout - Pagamento ${payment.id}`,
            created_by: user?.id,
          });
        }
      }

      // Create cash movements
      // Main income from service + products
      const incomeDescription = appointment.service 
        ? `${appointment.service.name}${cartItems.length > 0 ? ` + ${cartItems.length} produto(s)` : ''}`
        : `Venda de ${cartItems.length} produto(s)`;

      await supabase.from('cash_movements').insert({
        organization_id: organization.id,
        cash_register_id: openRegister.id,
        type: 'income',
        category: 'service',
        amount: total - tipAmount,
        description: incomeDescription,
        reference_type: 'appointment',
        reference_id: appointment.id,
        created_by: user?.id,
      });

      // Tip as separate movement if exists
      if (tipAmount > 0) {
        await supabase.from('cash_movements').insert({
          organization_id: organization.id,
          cash_register_id: openRegister.id,
          type: 'income',
          category: 'other',
          amount: tipAmount,
          description: `Gorjeta - ${appointment.client?.name || 'Cliente'}`,
          reference_type: 'appointment',
          reference_id: appointment.id,
          created_by: user?.id,
        });
      }

      // Update appointment status to completed and link payment
      await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          payment_method: isSplitPayment ? 'mixed' : paymentMethod,
          payment_id: payment.id,
        })
        .eq('id', appointment.id);

      toast({
        title: 'Pagamento processado!',
        description: `Total: R$ ${total.toFixed(2)}`,
      });

      return true;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [
    appointment, organization, user, cartItems, 
    subtotal, calculatedDiscount, discountType, discountPercentage, discountReason,
    tipAmount, total, paymentMethod, isSplitPayment, paymentSplits,
    serviceCommission, productsCommission, totalCommission, notes, toast
  ]);

  return {
    // State
    cartItems,
    discountAmount,
    discountPercentage,
    discountType,
    discountReason,
    tipAmount,
    paymentMethod,
    paymentSplits,
    isSplitPayment,
    isProcessing,
    notes,
    
    // Calculated values
    serviceTotal,
    serviceCommission,
    productsTotal,
    productsCommission,
    subtotal,
    calculatedDiscount,
    total,
    totalCommission,
    
    // Actions
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    setDiscountAmount,
    setDiscountPercentage,
    setDiscountType,
    setDiscountReason,
    setTipAmount,
    setPaymentMethod,
    setIsSplitPayment,
    addPaymentSplit,
    updatePaymentSplit,
    removePaymentSplit,
    setNotes,
    processCheckout,
  };
}
