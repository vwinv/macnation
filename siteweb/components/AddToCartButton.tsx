"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import { useCart } from "@/components/CartProvider";
import type { CartProduct } from "@/lib/cart";

export default function AddToCartButton({ product }: { product: CartProduct }) {
  const { add } = useCart();

  return (
    <button
      type="button"
      onClick={() => add(product)}
      aria-label={`Ajouter ${product.name} au panier`}
      className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-black text-white transition-all hover:bg-[#e0b12c] hover:text-black active:scale-[0.98]"
    >
      <ShoppingCart size={18} weight="bold" />
    </button>
  );
}
