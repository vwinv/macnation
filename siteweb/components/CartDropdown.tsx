"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash } from "@phosphor-icons/react";
import { useCart } from "@/components/CartProvider";
import { formatFcfa } from "@/lib/money";

export default function CartDropdown() {
  const { items, count, total, open, setOpen, setQty, remove } = useCart();
  const box = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    if (!open) {
      setShift(0);
      return;
    }
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let next = 0;
    if (rect.left < 16) next = 16 - rect.left;
    else if (rect.right > window.innerWidth - 16) next = window.innerWidth - 16 - rect.right;
    setShift(next);
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label="Panier"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white ring-1 ring-white/20 transition-all hover:text-[#e0b12c]"
      >
        <ShoppingCart size={20} weight="bold" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#e0b12c] px-1 text-center text-[10px] font-bold leading-4 text-black">
            {count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          ref={panelRef}
          className="absolute left-1/2 top-full z-[60] mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white text-black shadow-xl ring-1 ring-black/10"
          style={{ transform: `translateX(calc(-50% + ${shift}px))` }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-medium">Panier</p>
            <span className="text-xs text-gray-500">{count} article{count > 1 ? "s" : ""}</span>
          </div>
          {items.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-gray-500">Votre panier est vide.</p>
          ) : (
            <>
              <ul className="max-h-72 space-y-3 overflow-y-auto px-4 pb-3">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatFcfa(item.price)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Diminuer"
                          onClick={() => (item.qty <= 1 ? remove(item.id) : setQty(item.id, item.qty - 1))}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md ring-1 ring-black/10"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-sm">{item.qty}</span>
                        <button
                          type="button"
                          aria-label="Augmenter"
                          onClick={() => setQty(item.id, item.qty + 1)}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md ring-1 ring-black/10"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          type="button"
                          aria-label="Retirer"
                          onClick={() => remove(item.id)}
                          className="ml-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:text-black"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-medium">{formatFcfa(item.price * item.qty)}</p>
                  </li>
                ))}
              </ul>
              <div className="border-t border-black/10 px-4 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Total</span>
                  <span className="font-medium">{formatFcfa(total)}</span>
                </div>
                <Link
                  href="/boutique/commander"
                  onClick={() => setOpen(false)}
                  className="btn-gold mt-3 flex h-10 items-center justify-center rounded-lg text-sm font-medium"
                >
                  Commander
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
