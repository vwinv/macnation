"use client";

import Link from "next/link";
import CheckoutForm from "@/components/CheckoutForm";
import { useCart } from "@/components/CartProvider";
import { formatFcfa } from "@/lib/money";

export default function CartCheckout() {
  const { items, total } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-[720px] px-6 pb-24 pt-40 text-center">
        <h1 className="title1 text-4xl sm:text-5xl">Panier vide</h1>
        <p className="mt-4 text-sm text-gray-500">Ajoutez un produit depuis la boutique pour commander.</p>
        <Link href="/boutique" className="btn-gold mt-8 inline-flex h-11 items-center rounded-lg px-8 text-sm">
          Retour à la boutique
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-6 pb-24 pt-40 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <Link href="/boutique" className="text-sm text-gray-500 hover:text-black">
          ← Boutique
        </Link>
        <h1 className="title1 mt-5 text-4xl sm:text-5xl">Votre commande</h1>
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 border-b border-black/10 pb-4">
              <div>
                <p className="text-sm font-medium text-black">{item.name}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.qty} × {formatFcfa(item.price)}
                </p>
              </div>
              <p className="text-sm font-medium text-black">{formatFcfa(item.price * item.qty)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-gray-500">Retrait au salon, Nord Foire.</p>
      </div>
      <CheckoutForm
        kind="boutique"
        items={items.map((item) => ({ itemId: item.id, qty: item.qty }))}
        title="Payer la commande"
        amount={total}
        hint="Payer maintenant. On prépare les produits, tu les récupères au salon."
      />
    </main>
  );
}
