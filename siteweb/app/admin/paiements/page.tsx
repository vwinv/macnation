"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Invoice, Payment } from "@/lib/salon-types";
import { formatFcfa, methodLabel, PAYMENT_METHODS } from "@/lib/money";
import {
  CATALOG_TABS,
  kindTab,
  tabEmptyPayment,
  tabKind,
  tabNote,
  tabNoun,
  tabPayButton,
  tabPickError,
  type AdminCatalogTab,
} from "@/lib/admin-catalog";

const STATUS_FILTERS = [
  { id: "tous", label: "Tous" },
  { id: "completed", label: "Réussis" },
  { id: "pending", label: "En attente" },
  { id: "failed", label: "Échoués" },
] as const;

const KIND: Record<NonNullable<Invoice["kind"]>, string> = {
  rdv: "RDV",
  boutique: "Boutique",
  abonnement: "Abonnement",
  caisse: "Caisse",
};

type CatalogItem = { id: string; name: string; price: string };

function asCatalog(items: { id?: string; name?: string; price?: number | null }[] | null, fallback: string) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: item.id || item.name || fallback,
    name: item.name || fallback,
    price: String(item.price ?? 0),
  }));
}

export default function PaiementsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tab, setTab] = useState<AdminCatalogTab>("prestations");
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>("tous");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [lineId, setLineId] = useState("");
  const [lineName, setLineName] = useState("");
  const [linePrice, setLinePrice] = useState("");
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]["id"]>("especes");
  const [services, setServices] = useState<CatalogItem[]>([]);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [plans, setPlans] = useState<CatalogItem[]>([]);

  const catalog = tab === "produits" ? products : tab === "abonnements" ? plans : services;
  const noun = tabNoun(tab);
  const byInvoice = useMemo(() => new Map(invoices.map((item) => [item.id, item])), [invoices]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/salon", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = (await res.json()) as { payments?: Payment[]; invoices?: Invoice[]; error?: string };
    if (!res.ok) {
      setError(json.error || "Chargement impossible.");
      return;
    }
    setPayments(json.payments || []);
    setInvoices(json.invoices || []);
    const [servicesRes, productsRes, plansRes] = await Promise.all([
      fetch("/api/catalog/services", { cache: "no-store" }),
      fetch("/api/catalog/products", { cache: "no-store" }),
      fetch("/api/catalog/plans", { cache: "no-store" }),
    ]);
    const servicesJson = (await servicesRes.json().catch(() => null)) as
      | { id?: string; name?: string; price?: number | null }[]
      | null;
    const productsJson = (await productsRes.json().catch(() => null)) as
      | { id?: string; name?: string; price?: number | null }[]
      | null;
    const plansJson = (await plansRes.json().catch(() => null)) as
      | { id?: string; name?: string; price?: number | null }[]
      | { plans?: { id?: string; name?: string; price?: number | null }[] }
      | null;
    setServices(asCatalog(servicesJson, "Prestation"));
    setProducts(asCatalog(productsJson, "Produit"));
    setPlans(asCatalog(Array.isArray(plansJson) ? plansJson : plansJson?.plans || null, "Abonnement"));
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      payments.filter((item) => {
        const invoice = item.invoiceId ? byInvoice.get(item.invoiceId) : undefined;
        if (kindTab(invoice?.kind) !== tab) return false;
        return filter === "tous" ? true : item.status === filter;
      }),
    [payments, byInvoice, tab, filter],
  );

  function selectLine(item: CatalogItem) {
    setLineId(item.id);
    setLineName(item.name);
    setLinePrice(item.price);
  }

  function openCreate() {
    const first = catalog[0];
    setClientName("");
    setClientPhone("");
    setMethod("especes");
    if (first) selectLine(first);
    else {
      setLineId("");
      setLineName("");
      setLinePrice("");
    }
    setError("");
    setOpen(true);
  }

  function changeTab(next: AdminCatalogTab) {
    setTab(next);
    setOpen(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!lineName.trim()) {
      setError(tabPickError(tab));
      return;
    }
    const amount = Number(linePrice) || 0;
    const res = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        clientPhone,
        method,
        amount,
        kind: tabKind(tab),
        planId: tab === "abonnements" ? lineId : undefined,
        note: tabNote(tab),
        items: [{ name: lineName, qty: 1, unitPrice: amount }],
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error || "Enregistrement impossible.");
      return;
    }
    setOpen(false);
    await load();
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.22em] text-[#e0b12c]">ENCAISSEMENTS</p>
          <h1 className="font-bebas mt-1 text-5xl text-black">Paiements</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Encaissements des prestations, des produits et des abonnements.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-gold h-10 cursor-pointer rounded-lg px-4 text-sm font-medium">
          {tabPayButton(tab)}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATALOG_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => changeTab(item.id)}
            className={`h-9 cursor-pointer rounded-full px-4 text-sm ${
              tab === item.id ? "btn-gold" : "bg-gray-900 text-gray-400 ring-1 ring-black/10 hover:text-black"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`h-9 cursor-pointer rounded-full px-4 text-sm ${
              filter === item.id ? "bg-white text-black" : "bg-gray-900 text-gray-400 ring-1 ring-black/10 hover:text-black"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      <ul className="mt-6 space-y-3">
        {visible.length === 0 ? (
          <p className="text-sm text-gray-500">{tabEmptyPayment(tab)}</p>
        ) : (
          visible.map((item) => {
            const invoice = item.invoiceId ? byInvoice.get(item.invoiceId) : undefined;
            return (
              <li key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-950 p-5 stroke-gradient [--stroke-opacity:0.15]">
                  <div>
                    <p className="text-black">
                      {methodLabel(item.method)}
                      {invoice ? <span className="text-gray-500"> · {invoice.clientName}</span> : null}
                      <span className="ml-2 text-xs text-[#e0b12c]">{KIND[invoice?.kind || "caisse"]}</span>
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleString("fr-FR")}
                      {invoice ? ` · ${invoice.items.map((line) => line.name).join(", ")}` : item.note ? ` · ${item.note}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bebas text-3xl text-black">{formatFcfa(item.amount)}</p>
                    {invoice ? (
                      <Link href={`/admin/factures/${invoice.id}`} className="text-xs text-[#e0b12c] hover:underline">
                        Voir la facture
                      </Link>
                    ) : (
                      <p className="text-xs text-gray-500">{item.status === "completed" ? "Réussi" : item.status === "failed" ? "Échoué" : "En attente"}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <form
            onSubmit={(e) => void onSubmit(e)}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.18em] text-[#e0b12c]">{noun.toUpperCase()}</p>
                <h2 className="font-bebas mt-1 text-3xl text-black">Encaisser</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:bg-black/5 hover:text-black">
                Fermer
              </button>
            </div>
            <label className="mt-5 flex flex-col gap-2 text-sm text-gray-800">
              Client *
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
              />
            </label>
            <label className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
              Téléphone
              <input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
              />
            </label>
            <label className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
              {noun.charAt(0).toUpperCase() + noun.slice(1)}
              <select
                value={lineId}
                onChange={(e) => {
                  const item = catalog.find((row) => row.id === e.target.value);
                  if (item) selectLine(item);
                }}
                required
                className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
              >
                {catalog.length === 0 ? <option value="">Aucun élément</option> : null}
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
              Montant (F CFA)
              <input
                value={linePrice}
                onChange={(e) => setLinePrice(e.target.value)}
                required
                inputMode="numeric"
                className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
              />
            </label>
            <label className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
              Mode de paiement
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
                className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
              >
                {PAYMENT_METHODS.filter((item) => item.id !== "paydunya").map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={catalog.length === 0} className="btn-gold mt-5 h-11 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-50">
              Encaisser
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
