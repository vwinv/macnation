"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GroupedBars, HorizontalBars, VerticalBars } from "@/components/admin/AdminCharts";
import type { Application, Booking, Invoice, Membership, Payment, PublicClient } from "@/lib/salon-types";
import { PAYMENT_METHODS, formatFcfa, monthKey, todayIso } from "@/lib/money";

const DAY_LABELS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTH_LABELS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function shiftIso(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, (d || 1) + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function lastDays(count: number) {
  const today = todayIso();
  return Array.from({ length: count }, (_, i) => shiftIso(today, -(count - 1 - i)));
}

function lastMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function weekdayLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return DAY_LABELS[new Date(y, (m || 1) - 1, d || 1).getDay()];
}

function monthLabel(key: string) {
  const month = Number(key.slice(5, 7)) - 1;
  return MONTH_LABELS[month] || key;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<PublicClient[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [expenses, setExpenses] = useState<{ dateIso: string; amount: number }[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/salon", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = (await res.json()) as {
      bookings?: Booking[];
      invoices?: Invoice[];
      payments?: Payment[];
      expenses?: { dateIso: string; amount: number }[];
      clients?: PublicClient[];
      memberships?: Membership[];
      applications?: Application[];
      error?: string;
    };
    if (!res.ok) {
      setError(json.error || "Chargement impossible.");
      return;
    }
    setBookings(json.bookings || []);
    setInvoices(json.invoices || []);
    setPayments(json.payments || []);
    setClients(json.clients || []);
    setMemberships(json.memberships || []);
    setApplications(json.applications || []);
    setExpenses(json.expenses || []);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = todayIso();
  const month = today.slice(0, 7);
  const weekEnd = shiftIso(today, 6);

  const paid = useMemo(() => payments.filter((item) => item.status === "completed"), [payments]);
  const liveBookings = useMemo(() => bookings.filter((item) => item.status !== "annule"), [bookings]);

  const caJour = paid.filter((item) => item.createdAt.slice(0, 10) === today).reduce((sum, item) => sum + item.amount, 0);
  const caMois = paid.filter((item) => monthKey(item.createdAt) === month).reduce((sum, item) => sum + item.amount, 0);
  const rdvToday = liveBookings.filter((item) => item.dateIso === today).length;
  const rdvNouveaux = bookings.filter((item) => item.status === "nouveau").length;
  const unpaidInvoices = invoices.filter((item) => item.status === "envoyee" || item.status === "brouillon");
  const impayes = unpaidInvoices.reduce((sum, item) => sum + item.amount, 0);
  const abos = memberships.filter((item) => item.status === "actif").length;
  const candidatures = applications.filter((item) => item.status === "nouvelle").length;

  const days7 = lastDays(7);
  const ca7 = days7.map((iso) => ({
    label: weekdayLabel(iso),
    value: paid.filter((item) => item.createdAt.slice(0, 10) === iso).reduce((sum, item) => sum + item.amount, 0),
  }));
  const rdv14 = Array.from({ length: 14 }, (_, i) => shiftIso(today, i - 6)).map((iso) => ({
    label: iso.slice(8),
    value: liveBookings.filter((item) => item.dateIso === iso).length,
  }));
  const months6 = lastMonths(6);
  const caCharges = months6.map((key) => ({
    label: monthLabel(key),
    a: paid.filter((item) => monthKey(item.createdAt) === key).reduce((sum, item) => sum + item.amount, 0),
    b: expenses.filter((item) => monthKey(item.dateIso) === key).reduce((sum, item) => sum + item.amount, 0),
  }));
  const methods = PAYMENT_METHODS.map((method) => ({
    label: method.label,
    value: paid.filter((item) => item.method === method.id).reduce((sum, item) => sum + item.amount, 0),
  })).filter((item) => item.value > 0);

  const upcoming = liveBookings
    .filter((item) => item.dateIso >= today && item.dateIso <= weekEnd)
    .sort((a, b) => `${a.dateIso}${a.time}`.localeCompare(`${b.dateIso}${b.time}`))
    .slice(0, 6);

  const kpis = [
    { k: "CA du jour", v: formatFcfa(caJour), href: "/admin/compta" },
    { k: "CA du mois", v: formatFcfa(caMois), href: "/admin/compta" },
    { k: "RDV aujourd'hui", v: String(rdvToday), href: "/admin/agenda" },
    { k: "Impayés", v: formatFcfa(impayes), href: "/admin/factures" },
    { k: "Nouveaux RDV", v: String(rdvNouveaux), href: "/admin/agenda" },
    { k: "Abonnements", v: String(abos), href: "/admin/clients" },
    { k: "Clients", v: String(clients.length), href: "/admin/clients" },
    { k: "Candidatures", v: String(candidatures), href: "/admin/candidatures" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <p className="text-xs tracking-[0.22em] text-[#e0b12c]">NORD FOIRE</p>
      <h1 className="font-bebas mt-1 text-5xl text-black">Tableau de bord</h1>
      <p className="mt-2 text-sm text-gray-500">Résumé de l’activité du salon.</p>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((item) => (
          <Link
            key={item.k}
            href={item.href}
            className="rounded-2xl bg-gray-950 px-4 py-5 stroke-gradient [--stroke-opacity:0.15] hover:bg-black/[0.02]"
          >
            <p className="text-xs text-gray-500">{item.k}</p>
            <p className="font-bebas mt-1 text-3xl text-black">{item.v}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-gray-950 px-5 py-5 stroke-gradient [--stroke-opacity:0.15]">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 className="font-bebas text-2xl text-black">Recettes · 7 jours</h2>
            <p className="text-xs text-gray-500">{formatFcfa(ca7.reduce((sum, item) => sum + item.value, 0))}</p>
          </div>
          <VerticalBars items={ca7} formatTip={formatFcfa} />
        </section>

        <section className="rounded-2xl bg-gray-950 px-5 py-5 stroke-gradient [--stroke-opacity:0.15]">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 className="font-bebas text-2xl text-black">RDV · 14 jours</h2>
            <p className="text-xs text-gray-500">{rdv14.reduce((sum, item) => sum + item.value, 0)} passages</p>
          </div>
          <VerticalBars items={rdv14} />
        </section>

        <section className="rounded-2xl bg-gray-950 px-5 py-5 stroke-gradient [--stroke-opacity:0.15]">
          <div className="mb-2 flex items-end justify-between gap-3">
            <h2 className="font-bebas text-2xl text-black">Recettes / charges</h2>
            <p className="text-xs text-gray-500">6 mois</p>
          </div>
          <p className="mb-5 flex gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-black" /> Recettes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[#e0b12c]" /> Charges
            </span>
          </p>
          <GroupedBars items={caCharges} formatTip={(n, kind) => `${kind === "a" ? "Recettes" : "Charges"} · ${formatFcfa(n)}`} />
        </section>

        <section className="rounded-2xl bg-gray-950 px-5 py-5 stroke-gradient [--stroke-opacity:0.15]">
          <h2 className="font-bebas mb-5 text-2xl text-black">Moyens de paiement</h2>
          {methods.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun encaissement pour le moment.</p>
          ) : (
            <HorizontalBars items={methods} formatValue={formatFcfa} />
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-gray-950 px-5 py-5 stroke-gradient [--stroke-opacity:0.15]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-bebas text-2xl text-black">Prochaine semaine</h2>
            <Link href="/admin/agenda" className="text-sm text-gray-500 hover:text-black">
              Agenda
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun rendez-vous à venir.</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {upcoming.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-black">{item.name}</p>
                    <p className="text-gray-500">
                      {item.dateIso === today ? "Aujourd’hui" : item.dateLabel} · {item.time} · {item.serviceName}
                    </p>
                  </div>
                  <span className="shrink-0 text-gray-500">{formatFcfa(item.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-gray-950 px-5 py-5 stroke-gradient [--stroke-opacity:0.15]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-bebas text-2xl text-black">À encaisser</h2>
            <Link href="/admin/factures" className="text-sm text-gray-500 hover:text-black">
              Factures
            </Link>
          </div>
          {unpaidInvoices.length === 0 ? (
            <p className="text-sm text-gray-500">Rien en attente.</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {unpaidInvoices.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <Link href={`/admin/factures/${item.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-black">
                    <div className="min-w-0">
                      <p className="truncate text-black">
                        {item.number} · {item.clientName}
                      </p>
                      <p className="text-gray-500">{item.items.map((line) => line.name).join(", ") || "Facture"}</p>
                    </div>
                    <span className="shrink-0 text-[#e0b12c]">{formatFcfa(item.amount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
