export type CartProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export type CartItem = CartProduct & { qty: number };

export const CART_MAX_QTY = 10;
export const CART_STORAGE_KEY = "mac-nation-cart";

export function clampCartQty(value: number) {
  const qty = Math.trunc(Number(value));
  if (!Number.isFinite(qty) || qty < 1) return 1;
  return Math.min(CART_MAX_QTY, qty);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const item = row as Partial<CartItem>;
        if (!item.id || !item.name || !Number.isFinite(Number(item.price))) return null;
        return {
          id: String(item.id),
          name: String(item.name),
          price: Math.round(Number(item.price)),
          image: String(item.image || ""),
          qty: clampCartQty(Number(item.qty)),
        };
      })
      .filter((item): item is CartItem => Boolean(item));
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}
