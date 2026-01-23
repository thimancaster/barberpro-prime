import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Percent, DollarSign, Tag } from 'lucide-react';

interface CheckoutDiscountProps {
  discountType: 'fixed' | 'percentage';
  discountAmount: number;
  discountPercentage: number;
  discountReason: string;
  calculatedDiscount: number;
  subtotal: number;
  onDiscountTypeChange: (type: 'fixed' | 'percentage') => void;
  onDiscountAmountChange: (value: number) => void;
  onDiscountPercentageChange: (value: number) => void;
  onDiscountReasonChange: (value: string) => void;
}

export function CheckoutDiscount({
  discountType,
  discountAmount,
  discountPercentage,
  discountReason,
  calculatedDiscount,
  subtotal,
  onDiscountTypeChange,
  onDiscountAmountChange,
  onDiscountPercentageChange,
  onDiscountReasonChange,
}: CheckoutDiscountProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const quickPercentages = [5, 10, 15, 20];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Desconto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Discount Type Toggle */}
        <div className="space-y-2">
          <Label>Tipo de desconto</Label>
          <ToggleGroup 
            type="single" 
            value={discountType}
            onValueChange={(value) => value && onDiscountTypeChange(value as 'fixed' | 'percentage')}
            className="justify-start"
          >
            <ToggleGroupItem value="fixed" aria-label="Valor fixo" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Fixo
            </ToggleGroupItem>
            <ToggleGroupItem value="percentage" aria-label="Porcentagem" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Porcentagem
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Discount Value */}
        {discountType === 'fixed' ? (
          <div className="space-y-2">
            <Label htmlFor="discount-amount">Valor do desconto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="discount-amount"
                type="number"
                min="0"
                max={subtotal}
                step="0.01"
                value={discountAmount || ''}
                onChange={(e) => onDiscountAmountChange(parseFloat(e.target.value) || 0)}
                className="pl-10"
                placeholder="0,00"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Label>Porcentagem de desconto</Label>
            <div className="flex gap-2">
              {quickPercentages.map(pct => (
                <Button
                  key={pct}
                  type="button"
                  variant={discountPercentage === pct ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onDiscountPercentageChange(pct)}
                >
                  {pct}%
                </Button>
              ))}
            </div>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                value={discountPercentage || ''}
                onChange={(e) => onDiscountPercentageChange(parseFloat(e.target.value) || 0)}
                className="pr-8"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>
        )}

        {/* Discount Reason */}
        <div className="space-y-2">
          <Label htmlFor="discount-reason">Motivo (opcional)</Label>
          <Textarea
            id="discount-reason"
            value={discountReason}
            onChange={(e) => onDiscountReasonChange(e.target.value)}
            placeholder="Ex: Cliente fidelidade, promoção do dia..."
            rows={2}
          />
        </div>

        {/* Calculated Preview */}
        {calculatedDiscount > 0 && (
          <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700 dark:text-green-300">Desconto aplicado:</span>
              <span className="font-bold text-green-700 dark:text-green-300">
                -{formatCurrency(calculatedDiscount)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
