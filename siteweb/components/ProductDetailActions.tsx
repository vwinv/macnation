"use client";

import { useState } from "react";
import { Minus, Plus } from "@phosphor-icons/react";
import { useCart } from "@/components/CartProvider";
import { CART_MAX_QTY, type CartProduct } from "@/lib/cart";

export default function ProductDetailActions({ product }: { product: CartProduct }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-black">Quantité</p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          aria-label="Diminuer"
          onClick={() => setQty((n) => Math.max(1, n - 1))}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg ring-1 ring-black/10"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-base font-medium text-black">{qty}</span>
        <button
          type="button"
          aria-label="Augmenter"
          onClick={() => setQty((n) => Math.min(CART_MAX_QTY, n + 1))}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg ring-1 ring-black/10"
        >
          <Plus size={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => add(product, qty)}
        className="btn-gold mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-lg text-sm font-medium sm:w-auto sm:px-8"
      >
        Ajouter au panier
      </button>
    </div>
  );
}
