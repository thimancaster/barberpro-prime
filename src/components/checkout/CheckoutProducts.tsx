import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Product } from '@/types/database';
import type { CartItem } from '@/types/checkout';

interface CheckoutProductsProps {
  cartItems: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (itemId: string, delta: number, maxStock: number) => void;
  onRemoveFromCart: (itemId: string) => void;
  productsTotal: number;
}

export function CheckoutProducts({
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  productsTotal,
}: CheckoutProductsProps) {
  const { organization } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      fetchProducts();
    }
  }, [organization?.id]);

  const fetchProducts = async () => {
    if (!organization) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('is_active', true)
      .gt('quantity', 0)
      .order('name');

    if (!error && data) {
      setProducts(data as Product[]);
    }
    setIsLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCartItemProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Adicionar Produtos
          </div>
          {cartItems.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              {cartItems.length} item(s)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Grid */}
        <ScrollArea className="h-[180px]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto em estoque'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredProducts.map(product => {
                const inCart = cartItems.find(item => item.productId === product.id);
                const remainingStock = product.quantity - (inCart?.quantity || 0);
                
                return (
                  <button
                    key={product.id}
                    onClick={() => onAddToCart(product)}
                    disabled={remainingStock < 1}
                    className="p-3 text-left border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(product.sale_price)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {remainingStock} un
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Cart Items */}
        {cartItems.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Carrinho</p>
            {cartItems.map(item => {
              const product = getCartItemProduct(item.productId);
              const maxStock = product?.quantity || 0;
              
              return (
                <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, -1, maxStock)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, 1, maxStock)}
                      disabled={item.quantity >= maxStock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onRemoveFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <span className="text-sm font-semibold min-w-[80px] text-right">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              );
            })}
            
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Total Produtos:</span>
              <span className="font-bold text-primary">{formatCurrency(productsTotal)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
