"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Invoice } from "@/lib/salon-types";
import { formatFcfa } from "@/lib/money";

function dateFr(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function CompteCommandesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Invoice[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/compte/me", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/compte/login");
      return;
    }
    const json = (await res.json()) as { invoices?: Invoice[]; error?: string };
    if (!res.ok) {
      setError(json.error || "Chargement impossible.");
      return;
    }
    setPurchases((json.invoices || []).filter((item) => item.status === "payee" && item.kind === "boutique"));
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!purchases) {
    return (
      <main className="mx-auto max-w-5xl px-6 pt-32 pb-20">
        <p className="text-sm text-gray-500">{error || "Chargement…"}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 pt-32 pb-24">
      <Link href="/compte" className="text-sm text-gray-500 hover:text-black">
        ← Mon compte
      </Link>
      <h1 className="font-bebas mt-5 text-5xl text-black sm:text-6xl">Mes commandes</h1>
      {error ? <p className="mt-6 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
      {purchases.length === 0 ? <p className="mt-8 text-sm text-gray-500">Aucun paiement enregistré.</p> : null}
      <ul className="mt-8 space-y-3">
        {purchases.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 rounded-xl bg-gray-950 px-4 py-4 ring-1 ring-black/10">
            <div>
              <p className="text-sm text-black">{item.items[0]?.name || item.number}</p>
              <p className="mt-1 text-xs text-gray-500">
                {item.number} · {dateFr(item.paidAt || item.createdAt)}
              </p>
            </div>
            <p className="text-sm text-gray-800">{formatFcfa(item.amount)}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
