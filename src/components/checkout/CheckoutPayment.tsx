import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banknote, CreditCard, QrCode, Ticket, Split, Plus, Trash2 } from 'lucide-react';
import type { PaymentMethodType, PaymentSplit } from '@/types/checkout';
import { PAYMENT_METHOD_LABELS } from '@/types/checkout';

interface CheckoutPaymentProps {
  paymentMethod: PaymentMethodType;
  isSplitPayment: boolean;
  paymentSplits: PaymentSplit[];
  total: number;
  onPaymentMethodChange: (method: PaymentMethodType) => void;
  onSplitPaymentChange: (enabled: boolean) => void;
  onAddSplit: () => void;
  onUpdateSplit: (index: number, updates: Partial<PaymentSplit>) => void;
  onRemoveSplit: (index: number) => void;
}

const PAYMENT_METHODS: { value: PaymentMethodType; label: string; icon: React.ReactNode }[] = [
  { value: 'cash', label: 'Dinheiro', icon: <Banknote className="h-5 w-5" /> },
  { value: 'pix', label: 'PIX', icon: <QrCode className="h-5 w-5" /> },
  { value: 'credit_card', label: 'Crédito', icon: <CreditCard className="h-5 w-5" /> },
  { value: 'debit_card', label: 'Débito', icon: <CreditCard className="h-5 w-5" /> },
  { value: 'voucher', label: 'Voucher', icon: <Ticket className="h-5 w-5" /> },
];

export function CheckoutPayment({
  paymentMethod,
  isSplitPayment,
  paymentSplits,
  total,
  onPaymentMethodChange,
  onSplitPaymentChange,
  onAddSplit,
  onUpdateSplit,
  onRemoveSplit,
}: CheckoutPaymentProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const splitsTotal = paymentSplits.reduce((sum, split) => sum + split.amount, 0);
  const remaining = total - splitsTotal;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Forma de Pagamento
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="split-payment" className="text-sm">Dividir</Label>
            <Switch
              id="split-payment"
              checked={isSplitPayment}
              onCheckedChange={onSplitPaymentChange}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSplitPayment ? (
          /* Single Payment Method */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(method => (
              <button
                key={method.value}
                type="button"
                onClick={() => onPaymentMethodChange(method.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === method.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                {method.icon}
                <span className="text-sm font-medium">{method.label}</span>
              </button>
            ))}
          </div>
        ) : (
          /* Split Payment */
          <div className="space-y-4">
            {paymentSplits.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Adicione as formas de pagamento para dividir o total
              </p>
            )}

            {paymentSplits.map((split, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                <Select
                  value={split.method}
                  onValueChange={(value) => onUpdateSplit(index, { method: value as PaymentMethodType })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={split.amount || ''}
                    onChange={(e) => onUpdateSplit(index, { amount: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                    placeholder="0,00"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveSplit(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddSplit}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Forma de Pagamento
            </Button>

            {/* Split Summary */}
            {paymentSplits.length > 0 && (
              <div className={`p-3 rounded-lg border ${
                Math.abs(remaining) < 0.01 
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                  : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex justify-between text-sm">
                  <span>Total dividido:</span>
                  <span className="font-medium">{formatCurrency(splitsTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Restante:</span>
                  <span className={`font-medium ${
                    Math.abs(remaining) < 0.01 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
