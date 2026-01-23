import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

interface CheckoutTipProps {
  tipAmount: number;
  total: number;
  onTipChange: (value: number) => void;
}

export function CheckoutTip({
  tipAmount,
  total,
  onTipChange,
}: CheckoutTipProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate tip percentages based on subtotal (total without tip)
  const subtotalWithoutTip = total - tipAmount;
  const quickTips = [
    { label: '5%', value: subtotalWithoutTip * 0.05 },
    { label: '10%', value: subtotalWithoutTip * 0.10 },
    { label: '15%', value: subtotalWithoutTip * 0.15 },
    { label: 'R$ 5', value: 5 },
    { label: 'R$ 10', value: 10 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          Gorjeta (opcional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Tip Buttons */}
        <div className="flex flex-wrap gap-2">
          {quickTips.map((tip, index) => (
            <Button
              key={index}
              type="button"
              variant={Math.abs(tipAmount - tip.value) < 0.01 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTipChange(Math.round(tip.value * 100) / 100)}
            >
              {tip.label}
            </Button>
          ))}
          <Button
            type="button"
            variant={tipAmount === 0 ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onTipChange(0)}
          >
            Sem gorjeta
          </Button>
        </div>

        {/* Custom Tip Input */}
        <div className="space-y-2">
          <Label htmlFor="tip-amount">Valor personalizado</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
            <Input
              id="tip-amount"
              type="number"
              min="0"
              step="0.01"
              value={tipAmount || ''}
              onChange={(e) => onTipChange(parseFloat(e.target.value) || 0)}
              className="pl-10"
              placeholder="0,00"
            />
          </div>
        </div>

        {tipAmount > 0 && (
          <div className="p-3 bg-pink-50 dark:bg-pink-950 border border-pink-200 dark:border-pink-800 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-pink-700 dark:text-pink-300">Gorjeta adicionada:</span>
              <span className="font-bold text-pink-700 dark:text-pink-300">
                +{formatCurrency(tipAmount)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
