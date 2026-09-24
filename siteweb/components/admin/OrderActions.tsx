"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Invoice } from "@/lib/salon-types";
import type { PaymentMethod } from "@/lib/money";

const PAY_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "especes", label: "Espèces" },
  { id: "wave", label: "Wave" },
  { id: "orange", label: "Orange" },
  { id: "free", label: "Free" },
];

export default function OrderActions({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const delivered = Boolean(invoice.deliveredAt);
  const paid = invoice.status === "payee";

  async function pay(method: PaymentMethod) {
    setBusy(method);
    setError("");
    const res = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoice.id, method }),
    });
    const json = (await res.json()) as { error?: string };
    setBusy("");
    if (!res.ok) {
      setError(json.error || "Encaissement impossible.");
      return;
    }
    router.refresh();
  }

  async function setDelivered(next: boolean) {
    setBusy(next ? "livrer" : "remettre");
    setError("");
    const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delivered: next }),
    });
    setBusy("");
    if (!res.ok) {
      setError("Mise à jour de la livraison impossible.");
      return;
    }
    router.refresh();
  }

  async function paytech() {
    setBusy("paytech");
    setError("");
    const res = await fetch(`/api/admin/invoices/${invoice.id}/paytech`, { method: "POST" });
    const json = (await res.json()) as { url?: string; error?: string };
    setBusy("");
    if (!res.ok || !json.url) {
      setError(json.error || "Lien PayTech indisponible.");
      return;
    }
    window.open(json.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!paid && invoice.status !== "annulee" ? (
        <>
          {PAY_METHODS.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void pay(item.id)}
              className="h-10 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 disabled:opacity-50"
            >
              {item.label} reçu
            </button>
          ))}
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void paytech()}
            className="h-10 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 disabled:opacity-50"
          >
            Lien PayTech
          </button>
        </>
      ) : null}
      {invoice.status !== "annulee" ? (
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void setDelivered(!delivered)}
          className={`h-10 cursor-pointer rounded-lg px-3 text-sm disabled:opacity-50 ${
            delivered ? "bg-gray-900 text-black ring-1 ring-black/10" : "btn-gold font-medium"
          }`}
        >
          {delivered ? "Marquer non livrée" : "Marquer livrée"}
        </button>
      ) : null}
      {paid ? (
        <button type="button" onClick={() => window.print()} className="btn-gold h-10 cursor-pointer rounded-lg px-4 text-sm font-medium">
          Générer le reçu
        </button>
      ) : null}
      {error ? <p className="w-full text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
