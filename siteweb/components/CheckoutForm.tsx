"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { formatFcfa } from "@/lib/money";
import { goToPaytech, openPaytechWindow } from "@/lib/paytech-tab";
import LoginPopup from "@/components/LoginPopup";

type CheckoutLine = { itemId: string; qty: number };

type Props = {
  kind: "boutique" | "abonnement";
  itemId?: string;
  items?: CheckoutLine[];
  title: string;
  amount: number;
  showQty?: boolean;
  hint: string;
};

type Prefill = { name: string; phone: string; email: string };

type PaySession = {
  invoiceId?: string;
  pendingId?: string;
  name: string;
  phone: string;
  email: string;
  accountCreated?: boolean;
};

export default function CheckoutForm({ kind, itemId, items, title, amount, showQty, hint }: Props) {
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [prefill, setPrefill] = useState<Prefill>({ name: "", phone: "", email: "" });
  const [payUrl, setPayUrl] = useState("");
  const payRef = useRef<PaySession | null>(null);
  const total = amount * (showQty ? qty : 1);

  useEffect(() => {
    fetch("/api/compte/session", { cache: "no-store", credentials: "include" })
      .then((res) => res.json())
      .then((json: Partial<Prefill>) => {
        const next = { name: json.name || "", phone: json.phone || "", email: json.email || "" };
        setLoggedIn(Boolean(next.name || next.phone));
        if (next.name || next.phone) setPrefill(next);
      })
      .catch(() => undefined);
  }, []);

  async function openPaytech(session: PaySession, tab?: Window | null) {
    const res = await fetch("/api/paytech/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        invoiceId: session.invoiceId || undefined,
        pendingId: session.pendingId || undefined,
        phone: session.phone,
        name: session.name,
        email: session.email || "",
        source: "site",
      }),
    });
    const json = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res.ok || !json?.url) {
      tab?.close();
      throw new Error(json?.error || "Impossible d’ouvrir PayTech.");
    }
    setPayUrl(json.url);
    if (!goToPaytech(json.url, tab)) {
      throw new Error("Autorise la fenêtre de paiement, puis clique Continuer.");
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    setError("");
    setSending(true);
    const tab = loggedIn ? openPaytechWindow() : null;
    try {
      let session = payRef.current;
      if (!session) {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(
            items?.length
              ? { kind, items, name, phone, email }
              : { kind, itemId, qty: showQty ? qty : 1, name, phone, email },
          ),
        });
        const json = (await res.json().catch(() => null)) as {
          invoiceId?: string;
          pendingId?: string;
          accountCreated?: boolean;
          loginRequired?: boolean;
          error?: string;
        } | null;
        if (!res.ok || (!json?.invoiceId && !json?.pendingId)) {
          setError(json?.error || "Paiement indisponible.");
          return;
        }
        session = {
          invoiceId: json.invoiceId || undefined,
          pendingId: json.pendingId || undefined,
          name,
          phone,
          email,
          accountCreated: json.accountCreated,
        };
        payRef.current = session;
        if (json.loginRequired || !loggedIn) {
          tab?.close();
          setLoginOpen(true);
          return;
        }
      } else if (!loggedIn) {
        tab?.close();
        setLoginOpen(true);
        return;
      }
      await openPaytech(session, tab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion interrompue. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  async function onLoggedIn() {
    setLoginOpen(false);
    setLoggedIn(true);
    const session = payRef.current;
    if (!session) return;
    setSending(true);
    setError("");
    try {
      await openPaytech(session, openPaytechWindow());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’ouvrir PayTech.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl bg-gray-950 p-6 stroke-gradient [--stroke-opacity:0.2] sm:p-8">
      <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION · NORD FOIRE</p>
      <h1 className="font-bebas mt-3 text-5xl text-black">{title}</h1>
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
          Email{loggedIn ? "" : " *"}
          <input
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={prefill.email}
            key={`email-${prefill.email}`}
            required={!loggedIn}
            className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
          />
        </label>
        {error ? <p className="mt-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
        {payUrl ? (
          <a
            href={payUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-gold mt-6 flex h-12 items-center justify-center rounded-lg text-sm font-medium"
          >
            Continuer le paiement
          </a>
        ) : null}
        <button type="submit" disabled={sending} className="btn-black mt-6 h-12 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70">
          {sending ? "Préparation…" : payUrl ? "Relancer le paiement" : "Payer"}
        </button>
        <p className="mt-3 text-center text-xs text-gray-500">
          {loggedIn
            ? "Le paiement s’ouvre dans un autre onglet."
            : "Si tu as déjà un compte, connecte-toi. Sinon on le crée et on t’envoie tes accès par email."}
        </p>
      </form>
      <LoginPopup
        open={loginOpen}
        phone={payRef.current?.phone || prefill.phone}
        accountCreated={payRef.current?.accountCreated}
        onClose={() => setLoginOpen(false)}
        onLoggedIn={() => void onLoggedIn()}
      />
    </div>
  );
}
