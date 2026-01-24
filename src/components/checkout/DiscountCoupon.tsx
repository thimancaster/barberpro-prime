import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Tag, 
  Percent, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Discount, Promotion } from '@/types/phases';
import { toast } from 'sonner';

interface DiscountCouponProps {
  organizationId: string;
  clientId?: string;
  subtotal: number;
  onApplyDiscount: (discount: { type: 'percentage' | 'fixed'; value: number; name: string; code?: string }) => void;
  onRemoveDiscount: () => void;
  appliedDiscount?: { name: string; code?: string } | null;
}

export function DiscountCoupon({
  organizationId,
  clientId,
  subtotal,
  onApplyDiscount,
  onRemoveDiscount,
  appliedDiscount,
}: DiscountCouponProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    fetchActivePromotions();
  }, [organizationId]);

  const fetchActivePromotions = async () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    const { data } = await supabase
      .from('promotions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or(`valid_until.is.null,valid_until.gte.${now.toISOString()}`);

    if (data) {
      // Filtrar promoções válidas para o momento atual
      const validPromotions = data.filter(promo => {
        // Verificar dia da semana
        if (promo.days_of_week && !promo.days_of_week.includes(currentDay)) {
          return false;
        }
        // Verificar horário
        if (promo.start_time && currentTime < promo.start_time) {
          return false;
        }
        if (promo.end_time && currentTime > promo.end_time) {
          return false;
        }
        // Verificar valor mínimo
        if (promo.min_purchase && subtotal < promo.min_purchase) {
          return false;
        }
        return true;
      });

      setAvailablePromotions(validPromotions as Promotion[]);
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    setIsValidating(true);

    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error('Cupom inválido ou expirado');
        return;
      }

      const discount = data as Discount;

      // Verificar validade
      const now = new Date();
      if (discount.valid_from && new Date(discount.valid_from) > now) {
        toast.error('Este cupom ainda não está válido');
        return;
      }
      if (discount.valid_until && new Date(discount.valid_until) < now) {
        toast.error('Este cupom expirou');
        return;
      }

      // Verificar limite de uso
      if (discount.usage_limit && discount.times_used >= discount.usage_limit) {
        toast.error('Este cupom atingiu o limite de uso');
        return;
      }

      // Verificar valor mínimo
      if (discount.min_purchase && subtotal < discount.min_purchase) {
        toast.error(`Valor mínimo: R$ ${discount.min_purchase.toFixed(2)}`);
        return;
      }

      onApplyDiscount({
        type: discount.type,
        value: discount.value,
        name: discount.name,
        code: discount.code,
      });

      toast.success('Cupom aplicado!');
      setCouponCode('');
    } catch (error) {
      toast.error('Erro ao validar cupom');
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyPromotion = (promo: Promotion) => {
    onApplyDiscount({
      type: promo.type,
      value: promo.value,
      name: promo.name,
    });
    toast.success('Promoção aplicada!');
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Desconto</Label>

      {appliedDiscount ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="font-medium text-sm">{appliedDiscount.name}</span>
            {appliedDiscount.code && (
              <Badge variant="secondary" className="text-xs">
                {appliedDiscount.code}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveDiscount}
            className="text-destructive hover:text-destructive h-8"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <>
          {/* Campo de cupom */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Código do cupom"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
              />
            </div>
            <Button
              onClick={handleValidateCoupon}
              disabled={isValidating || !couponCode.trim()}
              variant="secondary"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Aplicar'
              )}
            </Button>
          </div>

          {/* Promoções disponíveis */}
          {availablePromotions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                Promoções Disponíveis
              </div>
              <div className="space-y-2">
                {availablePromotions.map((promo) => (
                  <button
                    key={promo.id}
                    onClick={() => handleApplyPromotion(promo)}
                    className="w-full p-3 rounded-lg border border-border bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{promo.name}</span>
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        <Percent className="w-3 h-3 mr-1" />
                        {promo.type === 'percentage'
                          ? `${promo.value}%`
                          : `R$ ${promo.value.toFixed(2)}`}
                      </Badge>
                    </div>
                    {promo.description && (
                      <p className="text-xs text-muted-foreground mt-1">{promo.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
