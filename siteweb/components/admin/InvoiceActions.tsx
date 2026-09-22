"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Invoice } from "@/lib/salon-types";

export default function InvoiceActions({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [amount, setAmount] = useState(String(invoice.amount || ""));

  async function saveAmount() {
    setBusy("amount");
    setError("");
    const value = Number(amount) || 0;
    const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: value }),
    });
    setBusy("");
    if (!res.ok) {
      setError("Impossible de mettre à jour le montant.");
      return;
    }
    router.refresh();
  }

  async function pay(method: "especes" | "wave" | "orange" | "free") {
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

  async function mobile() {
    window.open(`/payer/${invoice.id}`, "_blank", "noopener,noreferrer");
  }

  if (invoice.status === "payee") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="numeric"
        className="h-10 w-28 rounded-lg bg-gray-900 px-3 text-sm text-black outline-none ring-1 ring-black/10"
      />
      <button type="button" disabled={Boolean(busy)} onClick={() => void saveAmount()} className="h-10 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 disabled:opacity-50">
        Maj
      </button>
      <button type="button" disabled={Boolean(busy)} onClick={() => void pay("especes")} className="h-10 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 disabled:opacity-50">
        Espèces
      </button>
      <button type="button" disabled={Boolean(busy)} onClick={() => void pay("wave")} className="h-10 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 disabled:opacity-50">
        Wave
      </button>
      <button type="button" disabled={Boolean(busy)} onClick={() => void pay("orange")} className="h-10 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 disabled:opacity-50">
        Orange
      </button>
      <button type="button" disabled={Boolean(busy)} onClick={() => void pay("free")} className="h-10 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 disabled:opacity-50">
        Free
      </button>
      <button type="button" disabled={Boolean(busy)} onClick={() => void mobile()} className="h-10 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 disabled:opacity-50">
        Wave / Orange / Free
      </button>
      {error ? <p className="w-full text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
