"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Expense, Invoice, Payment } from "@/lib/salon-types";
import { EXPENSE_CATEGORIES, formatFcfa, monthKey, todayIso } from "@/lib/money";

export default function ComptaPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/salon", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = (await res.json()) as { payments?: Payment[]; expenses?: Expense[]; invoices?: Invoice[]; error?: string };
    if (!res.ok) {
      setError(json.error || "Chargement impossible.");
      return;
    }
    setPayments(json.payments || []);
    setExpenses(json.expenses || []);
    setInvoices(json.invoices || []);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = todayIso();
  const month = today.slice(0, 7);
  const paid = payments.filter((item) => item.status === "completed");
  const recettesJour = paid.filter((item) => item.createdAt.slice(0, 10) === today).reduce((sum, item) => sum + item.amount, 0);
  const recettesMois = paid.filter((item) => monthKey(item.createdAt) === month).reduce((sum, item) => sum + item.amount, 0);
  const chargesMois = expenses.filter((item) => monthKey(item.dateIso) === month).reduce((sum, item) => sum + item.amount, 0);
  const impayes = invoices.filter((item) => item.status === "envoyee" || item.status === "brouillon").reduce((sum, item) => sum + item.amount, 0);

  const months = useMemo(() => {
    const keys = new Set<string>();
    for (const item of paid) keys.add(monthKey(item.createdAt));
    for (const item of expenses) keys.add(monthKey(item.dateIso));
    return [...keys].sort().reverse().slice(0, 12);
  }, [paid, expenses]);

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((item) => item.category === cat.id && monthKey(item.dateIso) === month).reduce((sum, item) => sum + item.amount, 0),
  }));

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <p className="text-xs tracking-[0.22em] text-[#e0b12c]">COMPTABILITÉ</p>
      <h1 className="font-bebas mt-1 text-5xl text-black">Compta</h1>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "CA du jour", v: formatFcfa(recettesJour) },
          { k: "CA du mois", v: formatFcfa(recettesMois) },
          { k: "Charges du mois", v: formatFcfa(chargesMois) },
          { k: "Solde du mois", v: formatFcfa(recettesMois - chargesMois) },
        ].map((item) => (
          <div key={item.k} className="rounded-2xl bg-gray-950 px-4 py-5 stroke-gradient [--stroke-opacity:0.15]">
            <p className="text-xs text-gray-500">{item.k}</p>
            <p className="font-bebas mt-1 text-3xl text-black">{item.v}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-gray-500">Impayés en cours : {formatFcfa(impayes)}</p>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      <section className="mt-10">
        <h2 className="font-bebas text-2xl text-[#e0b12c]">Mois</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="pb-3 font-medium">Période</th>
                <th className="pb-3 text-right font-medium">Recettes</th>
                <th className="pb-3 text-right font-medium">Charges</th>
                <th className="pb-3 text-right font-medium">Solde</th>
              </tr>
            </thead>
            <tbody>
              {months.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-gray-500">
                    Pas encore de mouvement.
                  </td>
                </tr>
              ) : (
                months.map((key) => {
                  const rec = paid.filter((item) => monthKey(item.createdAt) === key).reduce((sum, item) => sum + item.amount, 0);
                  const ch = expenses.filter((item) => monthKey(item.dateIso) === key).reduce((sum, item) => sum + item.amount, 0);
                  return (
                    <tr key={key} className="border-t border-black/10">
                      <td className="py-3 text-black">{key}</td>
                      <td className="py-3 text-right">{formatFcfa(rec)}</td>
                      <td className="py-3 text-right">{formatFcfa(ch)}</td>
                      <td className="py-3 text-right text-[#e0b12c]">{formatFcfa(rec - ch)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-bebas text-2xl text-[#e0b12c]">Charges ce mois</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {byCategory.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-2xl bg-gray-950 px-4 py-4 stroke-gradient [--stroke-opacity:0.15]">
              <span className="text-sm text-gray-400">{item.label}</span>
              <span className="font-bebas text-2xl text-black">{formatFcfa(item.total)}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
