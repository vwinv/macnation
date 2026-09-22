"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatFcfa } from "@/lib/money";
import SoftPay from "@/components/SoftPay";

type Props = {
  kind: "boutique" | "abonnement";
  itemId: string;
  title: string;
  amount: number;
  showQty?: boolean;
  hint: string;
};

type Prefill = { name: string; phone: string; email: string };

export default function CheckoutForm({ kind, itemId, title, amount, showQty, hint }: Props) {
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [prefill, setPrefill] = useState<Prefill>({ name: "", phone: "", email: "" });
  const [pay, setPay] = useState<{
    invoiceId?: string;
    pendingId?: string;
    amount: number;
    name: string;
    phone: string;
    email: string;
    accountCreated?: boolean;
    loginRequired?: boolean;
  } | null>(null);
  const total = amount * (showQty ? qty : 1);

  useEffect(() => {
    fetch("/api/compte/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: Partial<Prefill>) => {
        if (json.name || json.phone) {
          setPrefill({ name: json.name || "", phone: json.phone || "", email: json.email || "" });
        }
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          itemId,
          qty: showQty ? qty : 1,
          name,
          phone,
          email,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        invoiceId?: string;
        pendingId?: string;
        amount?: number;
        accountCreated?: boolean;
        loginRequired?: boolean;
        error?: string;
      } | null;
      if (!res.ok || (!json?.invoiceId && !json?.pendingId)) {
        setError(json?.error || "Paiement indisponible.");
        return;
      }
      setPay({
        invoiceId: json.invoiceId,
        pendingId: json.pendingId,
        amount: json.amount || total,
        name,
        phone,
        email,
        accountCreated: json.accountCreated,
        loginRequired: json.loginRequired,
      });
    } catch {
      setError("Connexion interrompue. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl bg-gray-950 p-6 stroke-gradient [--stroke-opacity:0.2] sm:p-8">
      <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION · NORD FOIRE</p>
      <h1 className="font-bebas mt-3 text-5xl text-black">{title}</h1>
      {pay ? (
        <div className="mt-6 space-y-5">
          <SoftPay
            invoiceId={pay.invoiceId}
            pendingId={pay.pendingId}
            amount={pay.amount}
            name={pay.name}
            phone={pay.phone}
            email={pay.email}
            accountCreated={pay.accountCreated}
          />
        </div>
      ) : (
        <form noValidate onSubmit={onSubmit}>
          <p className="mt-2 text-sm text-gray-400">{hint}</p>
          <p className="font-bebas mt-6 text-4xl text-black">{formatFcfa(total)}</p>
          {showQty ? (
            <label className="mt-6 flex flex-col gap-2 text-sm text-black">
              Quantité
              <select
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="mt-5 flex flex-col gap-2 text-sm text-black">
            Nom complet *
            <input
              name="name"
              autoComplete="name"
              defaultValue={prefill.name}
              key={`name-${prefill.name}`}
              required
              className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
            />
          </label>
          <label className="mt-5 flex flex-col gap-2 text-sm text-black">
            Téléphone *
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={prefill.phone}
              key={`phone-${prefill.phone}`}
              required
              className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
            />
          </label>
          <label className="mt-5 flex flex-col gap-2 text-sm text-black">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={prefill.email}
              key={`email-${prefill.email}`}
              className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
            />
          </label>
          {error ? <p className="mt-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
          <button type="submit" disabled={sending} className="btn-gold mt-6 h-12 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70">
            {sending ? "Préparation du paiement…" : "Continuer vers Wave / Orange / Free"}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            {kind === "abonnement"
              ? "Si tu n’as pas encore de compte, on le crée. Tu te connecteras ensuite pour confirmer l’abonnement."
              : "Si tu n’as pas encore de compte, on le crée. Tu te connecteras ensuite pour confirmer la commande."}
          </p>
        </form>
      )}
    </div>
  );
}
