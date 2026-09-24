"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Invoice } from "@/lib/salon-types";
import { formatFcfa, type PaymentMethod } from "@/lib/money";
import AdminClientPicker, { type PickedClient } from "@/components/admin/AdminClientPicker";

type Product = { id: string; name: string; price: number; active?: boolean };
type Line = { id: string; name: string; qty: number; unitPrice: number };

const PAY_NOW: { id: "" | PaymentMethod; label: string }[] = [
  { id: "", label: "Plus tard" },
  { id: "especes", label: "Espèces" },
  { id: "wave", label: "Wave" },
  { id: "orange", label: "Orange Money" },
  { id: "free", label: "Free Money" },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [client, setClient] = useState<PickedClient | null>(null);
  const [pickId, setPickId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [payNow, setPayNow] = useState<"" | PaymentMethod>("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/products", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = (await res.json()) as { products?: Product[]; error?: string };
    if (!res.ok) {
      setError(json.error || "Catalogue introuvable.");
      return;
    }
    const list = (json.products || []).filter((item) => item.active !== false && item.price > 0);
    setProducts(list);
    if (list[0]) setPickId(list[0].id);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(() => lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0), [lines]);

  function addLine() {
    const product = products.find((item) => item.id === pickId);
    if (!product) return;
    setLines((current) => {
      const existing = current.find((line) => line.id === product.id);
      if (existing) {
        return current.map((line) => (line.id === product.id ? { ...line, qty: line.qty + 1 } : line));
      }
      return [...current, { id: product.id, name: product.name, qty: 1, unitPrice: product.price }];
    });
  }

  function setQty(id: string, qty: number) {
    setLines((current) =>
      current
        .map((line) => (line.id === id ? { ...line, qty: Math.max(0, Math.trunc(qty) || 0) } : line))
        .filter((line) => line.qty > 0),
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!client) {
      setError("Choisis ou crée un client.");
      return;
    }
    if (!lines.length) {
      setError("Ajoute au moins un produit.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: client.name,
          clientPhone: client.phone,
          clientEmail: client.email,
          clientId: client.id,
          kind: "boutique",
          note: "Boutique · vente au salon Nord Foire",
          items: lines.map((line) => ({ name: line.name, qty: line.qty, unitPrice: line.unitPrice })),
        }),
      });
      const json = (await res.json()) as { invoice?: Invoice; error?: string };
      if (!res.ok || !json.invoice) {
        setError(json.error || "Création impossible.");
        return;
      }
      if (payNow) {
        const payRes = await fetch("/api/admin/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId: json.invoice.id, method: payNow }),
        });
        if (!payRes.ok) {
          const payJson = (await payRes.json()) as { error?: string };
          setError(payJson.error || "Commande créée, mais le paiement n’a pas été enregistré.");
          router.push(`/admin/commandes/${json.invoice.id}`);
          return;
        }
      }
      router.push(`/admin/commandes/${json.invoice.id}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <Link href="/admin/commandes" className="text-sm text-gray-500 hover:text-black">
        ← Commandes
      </Link>
      <p className="mt-6 text-xs tracking-[0.22em] text-[#e0b12c]">BOUTIQUE</p>
      <h1 className="font-bebas mt-1 text-5xl text-black">Nouvelle commande</h1>
      <p className="mt-2 text-sm text-gray-500">Pour un client qui passe en boutique.</p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-5">
        <AdminClientPicker value={client} onChange={setClient} />

        <div className="rounded-2xl bg-gray-950 p-5 stroke-gradient [--stroke-opacity:0.15]">
          <p className="text-sm text-gray-800">Produits</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={pickId}
              onChange={(e) => setPickId(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-lg bg-gray-900 px-3 text-sm text-black outline-none ring-1 ring-black/10"
            >
              {products.length === 0 ? <option value="">Aucun produit</option> : null}
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {formatFcfa(item.price)}
                </option>
              ))}
            </select>
            <button type="button" onClick={addLine} disabled={!products.length} className="h-11 cursor-pointer rounded-lg bg-black px-4 text-sm text-white disabled:opacity-50">
              Ajouter
            </button>
          </div>
          {lines.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Aucun produit ajouté.</p>
          ) : (
            <ul className="mt-4 divide-y divide-black/5">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-black">{line.name}</p>
                    <p className="text-gray-500">{formatFcfa(line.unitPrice)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={(e) => setQty(line.id, Number(e.target.value))}
                      className="h-10 w-16 rounded-lg bg-gray-900 px-2 text-center text-black outline-none ring-1 ring-black/10"
                    />
                    <span className="w-20 text-right text-black">{formatFcfa(line.qty * line.unitPrice)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-right font-bebas text-3xl text-black">{formatFcfa(total)}</p>
        </div>

        <label className="flex flex-col gap-2 text-sm text-gray-800">
          Paiement
          <select
            value={payNow}
            onChange={(e) => setPayNow(e.target.value as "" | PaymentMethod)}
            className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10"
          >
            {PAY_NOW.map((item) => (
              <option key={item.id || "later"} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button type="submit" disabled={sending} className="btn-gold h-12 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70">
          {sending ? "Enregistrement…" : "Créer la commande"}
        </button>
      </form>
    </main>
  );
}
