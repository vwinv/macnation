"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Invoice } from "@/lib/salon-types";
import { formatFcfa } from "@/lib/money";

const FILTERS = [
  { id: "toutes", label: "Toutes" },
  { id: "envoyee", label: "À encaisser" },
  { id: "payee", label: "Payées" },
  { id: "a-livrer", label: "À livrer" },
  { id: "livree", label: "Livrées" },
] as const;

function statusLabel(item: Invoice) {
  if (item.status === "annulee") return "Annulée";
  if (item.status === "payee") return "Payée";
  if (item.status === "brouillon") return "Brouillon";
  return "À encaisser";
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("toutes");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/salon", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = (await res.json()) as { invoices?: Invoice[]; error?: string };
    if (!res.ok) {
      setError(json.error || "Chargement impossible.");
      return;
    }
    setInvoices((json.invoices || []).filter((item) => item.kind === "boutique"));
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      invoices.filter((item) => {
        if (filter === "toutes") return true;
        if (filter === "a-livrer") return !item.deliveredAt && item.status !== "annulee";
        if (filter === "livree") return Boolean(item.deliveredAt);
        return item.status === filter;
      }),
    [invoices, filter],
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.22em] text-[#e0b12c]">BOUTIQUE</p>
          <h1 className="font-bebas mt-1 text-5xl text-black">Commandes</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Commandes en ligne et ventes au salon. Encaisser, livrer, imprimer le reçu.
          </p>
        </div>
        <Link href="/admin/commandes/nouvelle" className="btn-gold inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium">
          Nouvelle commande
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`h-9 cursor-pointer rounded-full px-4 text-sm ${
              filter === item.id ? "bg-black text-white" : "bg-gray-900 text-gray-400 ring-1 ring-black/10 hover:text-black"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      <ul className="mt-6 space-y-3">
        {visible.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune commande pour ce filtre.</p>
        ) : (
          visible.map((item) => (
            <li key={item.id}>
              <Link
                href={`/admin/commandes/${item.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-950 p-5 stroke-gradient [--stroke-opacity:0.15]"
              >
                <div>
                  <p className="text-black">
                    {item.number} <span className="text-gray-500">· {item.clientName}</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{item.items.map((line) => `${line.name}${line.qty > 1 ? ` ×${line.qty}` : ""}`).join(", ")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bebas text-3xl text-black">{formatFcfa(item.amount)}</p>
                  <p className="text-xs text-gray-500">
                    <span className={item.status === "payee" ? "text-emerald-600" : ""}>{statusLabel(item)}</span>
                    {" · "}
                    <span className={item.deliveredAt ? "text-emerald-600" : ""}>{item.deliveredAt ? "Livrée" : "À livrer"}</span>
                  </p>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
