import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Receipt, Loader2, CheckCircle2 } from 'lucide-react';
import type { PaymentMethodType, PaymentSplit, CartItem } from '@/types/checkout';
import { PAYMENT_METHOD_LABELS } from '@/types/checkout';

interface CheckoutTotalProps {
  serviceTotal: number;
  productsTotal: number;
  subtotal: number;
  calculatedDiscount: number;
  tipAmount: number;
  total: number;
  totalCommission: number;
  paymentMethod: PaymentMethodType;
  isSplitPayment: boolean;
  paymentSplits: PaymentSplit[];
  cartItems: CartItem[];
  isProcessing: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
  onProcessCheckout: () => void;
}

export function CheckoutTotal({
  serviceTotal,
  productsTotal,
  subtotal,
  calculatedDiscount,
  tipAmount,
  total,
  totalCommission,
  paymentMethod,
  isSplitPayment,
  paymentSplits,
  cartItems,
  isProcessing,
  notes,
  onNotesChange,
  onProcessCheckout,
}: CheckoutTotalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const splitsTotal = paymentSplits.reduce((sum, split) => sum + split.amount, 0);
  const isSplitComplete = !isSplitPayment || Math.abs(splitsTotal - total) < 0.01;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Resumo do Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Line Items */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Serviço</span>
            <span>{formatCurrency(serviceTotal)}</span>
          </div>
          
          {cartItems.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produtos ({cartItems.length})</span>
              <span>{formatCurrency(productsTotal)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-medium">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          {calculatedDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Desconto</span>
              <span>-{formatCurrency(calculatedDiscount)}</span>
            </div>
          )}
          
          {tipAmount > 0 && (
            <div className="flex justify-between text-pink-600">
              <span>Gorjeta</span>
              <span>+{formatCurrency(tipAmount)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">TOTAL</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
        </div>

        {/* Payment Method Info */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Forma de pagamento:</span>
            <span className="font-medium">
              {isSplitPayment ? 'Dividido' : PAYMENT_METHOD_LABELS[paymentMethod]}
            </span>
          </div>
          {isSplitPayment && paymentSplits.length > 0 && (
            <div className="mt-2 space-y-1">
              {paymentSplits.map((split, index) => (
                <div key={index} className="flex justify-between text-xs text-muted-foreground">
                  <span>{PAYMENT_METHOD_LABELS[split.method]}</span>
                  <span>{formatCurrency(split.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commission Info */}
        <div className="text-xs text-muted-foreground">
          Comissão estimada: {formatCurrency(totalCommission)}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="checkout-notes" className="text-sm">Observações (opcional)</Label>
          <Textarea
            id="checkout-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Anotações sobre o atendimento..."
            rows={2}
          />
        </div>

        {/* Confirm Button */}
        <Button
          onClick={onProcessCheckout}
          disabled={isProcessing || !isSplitComplete || total <= 0}
          className="w-full h-12 text-lg font-bold"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Confirmar Pagamento
            </>
          )}
        </Button>

        {!isSplitComplete && (
          <p className="text-xs text-center text-yellow-600">
            O valor dividido precisa ser igual ao total
          </p>
        )}
      </CardContent>
    </Card>
  );
}
