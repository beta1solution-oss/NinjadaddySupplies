import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product, ProductVariant } from '@/types';
import { generateCartKey } from '@/lib/utils';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant | null, quantity?: number) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = 'ninjadaddy_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, variant: ProductVariant | null, quantity = 1) => {
    const cartKey = generateCartKey(product.id, variant?.id);
    setItems(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) {
        return prev.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { product, variant, quantity, cartKey }];
    });
    setIsOpen(true);
  };

  const removeItem = (cartKey: string) => {
    setItems(prev => prev.filter(i => i.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey: string, quantity: number) => {
    if (quantity <= 0) { removeItem(cartKey); return; }
    setItems(prev => prev.map(i => i.cartKey === cartKey ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product.base_price;
    return sum + price * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, subtotal, itemCount, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
