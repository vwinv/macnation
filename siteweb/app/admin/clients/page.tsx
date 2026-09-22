"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Membership, PublicClient } from "@/lib/salon-types";
import { formatFcfa } from "@/lib/money";
import { hasSnPhone, whatsAppHref } from "@/lib/phone";

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<PublicClient[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/salon", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = (await res.json()) as {
      clients?: PublicClient[];
      memberships?: Membership[];
      error?: string;
    };
    if (!res.ok) {
      setError(json.error || "Chargement impossible.");
      return;
    }
    setClients(json.clients || []);
    setMemberships(json.memberships || []);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeByClient = useMemo(() => {
    const map = new Map<string, Membership>();
    for (const item of memberships) {
      if (item.status !== "actif") continue;
      if (!map.has(item.clientId)) map.set(item.clientId, item);
    }
    return map;
  }, [memberships]);

  async function adjust(id: string, patch: { pointsDelta?: number; creditDelta?: number }) {
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patch,
          note: patch.pointsDelta
            ? patch.pointsDelta > 0
              ? "Ajustement salon +"
              : "Ajustement salon −"
            : patch.creditDelta && patch.creditDelta > 0
              ? "Crédit salon +"
              : "Crédit salon −",
        }),
      });
      const json = (await res.json().catch(() => null)) as { client?: PublicClient; error?: string } | null;
      if (!res.ok || !json?.client) {
        setError(json?.error || "Ajustement impossible.");
        return;
      }
      setClients((current) => current.map((item) => (item.id === id ? json.client! : item)));
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
      <h1 className="font-bebas mt-2 text-5xl text-black">Clients</h1>
      <p className="mt-2 text-sm text-gray-400">
        {clients.length} compte{clients.length > 1 ? "s" : ""} · points, crédit salon, abonnements
      </p>
      {error ? <p className="mt-6 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
      {clients.length === 0 && !error ? <p className="mt-10 text-sm text-gray-500">Aucun compte client pour le moment.</p> : null}
      <ul className="mt-8 space-y-3">
        {clients.map((client) => {
          const abo = activeByClient.get(client.id);
          const wa = hasSnPhone(client.phone) ? whatsAppHref(client.phone) : "";
          return (
            <li key={client.id} className="rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bebas text-3xl text-black">{client.name}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    {client.phone || "Pas de numéro"}
                    {client.email ? ` · ${client.email}` : ""}
                  </p>
                </div>
                {wa ? (
                  <a href={wa} target="_blank" rel="noreferrer" className="text-sm text-[#e0b12c] hover:text-black">
                    WhatsApp
                  </a>
                ) : null}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-gray-500">Points</dt>
                  <dd className="mt-1 text-black">{client.points}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Crédit</dt>
                  <dd className="mt-1 text-black">{formatFcfa(client.creditFcfa)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Abonnement</dt>
                  <dd className="mt-1 text-black">
                    {abo
                      ? `${abo.planName} · ${Math.max(0, abo.visitsTotal - abo.visitsUsed)} visites`
                      : "Aucun"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Fin</dt>
                  <dd className="mt-1 text-black">
                    {abo ? new Date(abo.expiresAt).toLocaleDateString("fr-FR") : "—"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === client.id}
                  onClick={() => void adjust(client.id, { pointsDelta: 10 })}
                  className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-xs text-black ring-1 ring-black/10 hover:bg-gray-800 disabled:opacity-50"
                >
                  +10 pts
                </button>
                <button
                  type="button"
                  disabled={busy === client.id || client.points < 10}
                  onClick={() => void adjust(client.id, { pointsDelta: -10 })}
                  className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-xs text-black ring-1 ring-black/10 hover:bg-gray-800 disabled:opacity-50"
                >
                  −10 pts
                </button>
                <button
                  type="button"
                  disabled={busy === client.id}
                  onClick={() => void adjust(client.id, { creditDelta: 1000 })}
                  className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-xs text-black ring-1 ring-black/10 hover:bg-gray-800 disabled:opacity-50"
                >
                  +1 000 F
                </button>
                <button
                  type="button"
                  disabled={busy === client.id || client.creditFcfa < 1000}
                  onClick={() => void adjust(client.id, { creditDelta: -1000 })}
                  className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-xs text-black ring-1 ring-black/10 hover:bg-gray-800 disabled:opacity-50"
                >
                  −1 000 F
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
