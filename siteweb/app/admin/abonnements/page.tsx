"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Invoice, Membership, PublicClient } from "@/lib/salon-types";
import { formatFcfa, type PaymentMethod } from "@/lib/money";
import { hasSnPhone, whatsAppHref } from "@/lib/phone";
import AdminClientPicker, { type PickedClient } from "@/components/admin/AdminClientPicker";

type Plan = {
  id: string;
  slug: string;
  name: string;
  price: number;
  period: string;
  visits: number;
  boutiquePercent: number;
  active?: boolean;
};

const FILTERS = [
  { id: "actifs", label: "Membres" },
  { id: "echeance", label: "À échéance" },
  { id: "expires", label: "Expirés" },
  { id: "attente", label: "À encaisser" },
  { id: "tous", label: "Tous" },
] as const;

const PAY: { id: "" | PaymentMethod; label: string }[] = [
  { id: "", label: "Plus tard" },
  { id: "especes", label: "Espèces" },
  { id: "wave", label: "Wave" },
  { id: "orange", label: "Orange Money" },
  { id: "free", label: "Free Money" },
];

function daysUntil(iso: string) {
  const end = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

function isDueSoon(item: Membership) {
  if (item.status !== "actif") return false;
  const visitsLeft = Math.max(0, item.visitsTotal - item.visitsUsed);
  return daysUntil(item.expiresAt) <= 5 || visitsLeft <= 1;
}

export default function AdminMembershipsPage() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [clients, setClients] = useState<PublicClient[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("actifs");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [client, setClient] = useState<PickedClient | null>(null);
  const [planId, setPlanId] = useState("");
  const [payNow, setPayNow] = useState<"" | PaymentMethod>("");

  const load = useCallback(async () => {
    const [salonRes, plansRes] = await Promise.all([
      fetch("/api/admin/salon", { cache: "no-store" }),
      fetch("/api/admin/plans", { cache: "no-store" }),
    ]);
    if (salonRes.status === 401 || plansRes.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const salon = (await salonRes.json()) as {
      memberships?: Membership[];
      clients?: PublicClient[];
      invoices?: Invoice[];
      error?: string;
    };
    if (!salonRes.ok) {
      setError(salon.error || "Chargement impossible.");
      return;
    }
    setMemberships(salon.memberships || []);
    setClients(salon.clients || []);
    setInvoices((salon.invoices || []).filter((item) => item.kind === "abonnement"));
    const plansJson = (await plansRes.json()) as { plans?: Plan[]; error?: string };
    const list = (plansJson.plans || []).filter((item) => item.active !== false);
    setPlans(list);
    setPlanId((current) => current || list[0]?.slug || list[0]?.id || "");
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const clientsById = useMemo(() => new Map(clients.map((item) => [item.id, item])), [clients]);
  const actifs = memberships.filter((item) => item.status === "actif");
  const echeance = actifs.filter(isDueSoon);
  const expires = memberships.filter((item) => item.status === "expire");
  const pending = invoices.filter((item) => item.status === "envoyee" || item.status === "brouillon");

  const visible = useMemo(() => {
    if (filter === "actifs") return actifs;
    if (filter === "echeance") return echeance;
    if (filter === "expires") return expires;
    if (filter === "tous") return memberships;
    return [];
  }, [filter, actifs, echeance, expires, memberships]);

  function openCreate() {
    setClient(null);
    setPayNow("");
    setError("");
    if (plans[0]) setPlanId(plans[0].slug || plans[0].id);
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!client) {
      setError("Choisis ou crée un client.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: client.name,
          clientPhone: client.phone,
          clientEmail: client.email,
          clientId: client.id,
          planId,
          paymentMethod: payNow || undefined,
        }),
      });
      const json = (await res.json()) as { membership?: Membership; invoice?: Invoice; error?: string; message?: string };
      if (!res.ok) {
        setError(json.error || json.message || "Création impossible.");
        return;
      }
      setOpen(false);
      if (json.invoice && !json.membership) {
        router.push(`/admin/factures/${json.invoice.id}`);
        return;
      }
      await load();
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MEMBRES</p>
          <h1 className="font-bebas mt-1 text-5xl text-black">Abonnements</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">Membres actifs, échéances et ventes au salon.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-gold h-10 cursor-pointer rounded-lg px-4 text-sm font-medium">
          Nouvel abonnement
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "Membres actifs", v: String(actifs.length) },
          { k: "À échéance", v: String(echeance.length) },
          { k: "Expirés", v: String(expires.length) },
          { k: "À encaisser", v: String(pending.length) },
        ].map((item) => (
          <div key={item.k} className="rounded-2xl bg-gray-950 px-4 py-5 stroke-gradient [--stroke-opacity:0.15]">
            <p className="text-xs text-gray-500">{item.k}</p>
            <p className="font-bebas mt-1 text-3xl text-black">{item.v}</p>
          </div>
        ))}
      </div>

      {plans.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-bebas text-2xl text-black">Formules</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {plans.map((plan) => {
              const count = actifs.filter((item) => item.planId === plan.slug || item.planId === plan.id).length;
              return (
                <li key={plan.id} className="rounded-2xl bg-gray-950 px-4 py-4 stroke-gradient [--stroke-opacity:0.15]">
                  <p className="text-sm text-gray-500">{plan.period}</p>
                  <p className="font-bebas mt-1 text-3xl text-black">{plan.name}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    {formatFcfa(plan.price)} · {plan.visits} visites · {plan.boutiquePercent}% boutique
                  </p>
                  <p className="mt-3 text-sm text-black">{count} membre{count > 1 ? "s" : ""}</p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
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

      {error && !open ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      {filter === "attente" ? (
        <ul className="mt-6 space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun abonnement en attente de paiement.</p>
          ) : (
            pending.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/factures/${item.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-950 p-5 stroke-gradient [--stroke-opacity:0.15]"
                >
                  <div>
                    <p className="text-black">
                      {item.number} <span className="text-gray-500">· {item.clientName}</span>
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{item.items.map((line) => line.name).join(", ")}</p>
                  </div>
                  <p className="font-bebas text-3xl text-black">{formatFcfa(item.amount)}</p>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun abonnement pour ce filtre.</p>
          ) : (
            visible.map((item) => {
              const client = clientsById.get(item.clientId);
              const visitsLeft = Math.max(0, item.visitsTotal - item.visitsUsed);
              const days = daysUntil(item.expiresAt);
              const wa = client && hasSnPhone(client.phone) ? whatsAppHref(client.phone) : "";
              return (
                <li key={item.id} className="rounded-2xl bg-gray-950 p-5 stroke-gradient [--stroke-opacity:0.15]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bebas text-3xl text-black">{client?.name || "Client"}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.planName}
                        {client?.phone ? ` · ${client.phone}` : ""}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className={item.status === "actif" ? "text-emerald-600" : "text-gray-500"}>
                        {item.status === "actif" ? "Actif" : item.status === "expire" ? "Expiré" : "Annulé"}
                      </p>
                      {isDueSoon(item) ? <p className="mt-1 text-[#e0b12c]">Échéance proche</p> : null}
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-gray-500">Visites</dt>
                      <dd className="mt-1 text-black">
                        {visitsLeft} / {item.visitsTotal}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Fin</dt>
                      <dd className="mt-1 text-black">{new Date(item.expiresAt).toLocaleDateString("fr-FR")}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Jours restants</dt>
                      <dd className="mt-1 text-black">{item.status === "actif" ? Math.max(0, days) : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Boutique</dt>
                      <dd className="mt-1 text-black">{item.boutiquePercent}%</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    {wa ? (
                      <a href={wa} target="_blank" rel="noreferrer" className="text-[#e0b12c] hover:text-black">
                        WhatsApp
                      </a>
                    ) : null}
                    {item.invoiceId ? (
                      <Link href={`/admin/factures/${item.invoiceId}`} className="text-gray-500 hover:text-black">
                        Facture
                      </Link>
                    ) : null}
                    {client ? (
                      <Link href="/admin/clients" className="text-gray-500 hover:text-black">
                        Fiche client
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <form
            onSubmit={(e) => void onSubmit(e)}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.18em] text-[#e0b12c]">SALON</p>
                <h2 className="font-bebas mt-1 text-3xl text-black">Nouvel abonnement</h2>
                <p className="mt-1 text-sm text-gray-500">Pour un client qui passe au salon.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:bg-black/5 hover:text-black">
                Fermer
              </button>
            </div>
            <div className="mt-5">
              <AdminClientPicker value={client} onChange={setClient} />
            </div>
            <label className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
              Formule
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                required
                className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.slug || plan.id}>
                    {plan.name} · {formatFcfa(plan.price)} · {plan.visits} visites
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
              Paiement
              <select
                value={payNow}
                onChange={(e) => setPayNow(e.target.value as "" | PaymentMethod)}
                className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10"
              >
                {PAY.map((item) => (
                  <option key={item.id || "later"} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
            <button type="submit" disabled={sending || plans.length === 0} className="btn-gold mt-5 h-11 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70">
              {sending ? "Enregistrement…" : "Créer l’abonnement"}
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
