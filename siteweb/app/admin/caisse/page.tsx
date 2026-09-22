"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Expense, Payment } from "@/lib/salon-types";
import { EXPENSE_CATEGORIES, formatFcfa, todayIso } from "@/lib/money";

export default function CaissePage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<(typeof EXPENSE_CATEGORIES)[number]["id"]>("divers");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [dateIso, setDateIso] = useState(todayIso());

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/salon", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = (await res.json()) as { expenses?: Expense[]; payments?: Payment[]; error?: string };
    if (!res.ok) {
      setError(json.error || "Chargement impossible.");
      return;
    }
    setExpenses(json.expenses || []);
    setPayments(json.payments || []);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = todayIso();
  const recetteJour = useMemo(
    () => payments.filter((item) => item.status === "completed" && item.createdAt.slice(0, 10) === today).reduce((sum, item) => sum + item.amount, 0),
    [payments, today],
  );
  const sortieJour = useMemo(
    () => expenses.filter((item) => item.dateIso === today).reduce((sum, item) => sum + item.amount, 0),
    [expenses, today],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, amount: Number(amount), note, dateIso }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error || "Enregistrement impossible.");
      return;
    }
    setAmount("");
    setNote("");
    await load();
  }

  async function remove(id: string) {
    setError("");
    const res = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setError(json?.error || "Suppression impossible.");
      return;
    }
    await load();
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MÉNAGE · SORTIES</p>
      <h1 className="font-bebas mt-1 text-5xl text-black">Caisse</h1>

      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { k: "Recettes du jour", v: formatFcfa(recetteJour) },
          { k: "Sorties du jour", v: formatFcfa(sortieJour) },
          { k: "Solde du jour", v: formatFcfa(recetteJour - sortieJour) },
        ].map((item) => (
          <div key={item.k} className="rounded-2xl bg-gray-950 px-4 py-5 stroke-gradient [--stroke-opacity:0.15]">
            <p className="text-xs text-gray-500">{item.k}</p>
            <p className="font-bebas mt-1 text-3xl text-black sm:text-4xl">{item.v}</p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-8 grid gap-3 rounded-2xl bg-gray-950 p-5 stroke-gradient [--stroke-opacity:0.15] sm:grid-cols-5">
        <input type="date" value={dateIso} onChange={(e) => setDateIso(e.target.value)} className="h-11 rounded-lg bg-gray-900 px-3 text-sm text-black outline-none ring-1 ring-black/10" />
        <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="h-11 rounded-lg bg-gray-900 px-3 text-sm text-black outline-none ring-1 ring-black/10">
          {EXPENSE_CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="Montant" required className="h-11 rounded-lg bg-gray-900 px-3 text-sm text-black outline-none ring-1 ring-black/10" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Libellé (loyer, shampoing…)" className="h-11 rounded-lg bg-gray-900 px-3 text-sm text-black outline-none ring-1 ring-black/10" />
        <button type="submit" className="btn-gold h-11 cursor-pointer rounded-lg text-sm font-medium">
          Sortie
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      <ul className="mt-8 space-y-3">
        {expenses.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune sortie enregistrée.</p>
        ) : (
          expenses.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-950 p-5 stroke-gradient [--stroke-opacity:0.15]">
              <div>
                <p className="text-black">{EXPENSE_CATEGORIES.find((cat) => cat.id === item.category)?.label}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {item.dateIso}
                  {item.note ? ` · ${item.note}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bebas text-3xl text-black">{formatFcfa(item.amount)}</p>
                <button type="button" onClick={() => void remove(item.id)} className="cursor-pointer text-xs text-red-300 hover:underline">
                  Supprimer
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
