"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import type { Invoice } from "@/lib/salon-types";
import { formatFcfa } from "@/lib/money";

function dateFr(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function OrdersPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [orders, setOrders] = useState<Invoice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/compte/me", { cache: "no-store", credentials: "include" });
      const json = (await res.json().catch(() => null)) as { invoices?: Invoice[]; error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Chargement impossible.");
        return;
      }
      setOrders(
        (json?.invoices || []).filter((item) => item.kind === "boutique" && item.status !== "annulee"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, load]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/55 p-4 pt-24 sm:items-center sm:pt-8"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-popup-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
            <h2 id="orders-popup-title" className="font-bebas mt-2 text-4xl text-black">
              Mes commandes
            </h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-gray-900 text-black hover:bg-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        {error ? <p className="mt-5 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
        {loading && !orders.length ? <p className="mt-6 text-sm text-gray-500">Chargement…</p> : null}
        {!loading && orders.length === 0 && !error ? (
          <p className="mt-6 text-sm text-gray-500">Aucune commande pour le moment.</p>
        ) : null}
        <ul className="mt-6 space-y-3">
          {orders.map((item) => (
            <li key={item.id} className="rounded-xl bg-gray-950 px-4 py-4 ring-1 ring-black/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-black">
                    {item.items[0]?.name || item.number}
                    {item.items.length > 1 ? ` + ${item.items.length - 1}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.number} · {dateFr(item.paidAt || item.createdAt)}
                    {item.status === "payee" ? "" : " · En attente"}
                  </p>
                  {item.items.length > 1 ? (
                    <ul className="mt-2 space-y-1 text-xs text-gray-500">
                      {item.items.map((line, index) => (
                        <li key={`${line.name}-${index}`}>
                          {line.name}
                          {line.qty > 1 ? ` × ${line.qty}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <p className="text-sm font-medium text-black">{formatFcfa(item.amount)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
