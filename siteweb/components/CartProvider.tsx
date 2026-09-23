"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CART_MAX_QTY,
  type CartItem,
  type CartProduct,
  cartCount,
  cartTotal,
  clampCartQty,
  readCart,
  writeCart,
} from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (product: CartProduct, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (ready) writeCart(items);
  }, [items, ready]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      total: cartTotal(items),
      open,
      setOpen,
      add(product, qty = 1) {
        const extra = clampCartQty(qty);
        setItems((current) => {
          const found = current.find((item) => item.id === product.id);
          if (found) {
            return current.map((item) =>
              item.id === product.id ? { ...item, qty: clampCartQty(item.qty + extra) } : item,
            );
          }
          return [...current, { ...product, qty: extra }];
        });
        setOpen(true);
      },
      setQty(id, qty) {
        const next = clampCartQty(qty);
        setItems((current) => current.map((item) => (item.id === id ? { ...item, qty: next } : item)));
      },
      remove(id) {
        setItems((current) => current.filter((item) => item.id !== id));
      },
      clear() {
        setItems([]);
      },
    }),
    [items, open],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { CART_MAX_QTY };
