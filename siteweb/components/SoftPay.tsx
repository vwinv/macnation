"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatFcfa } from "@/lib/money";
import LoginPopup from "@/components/LoginPopup";

type SoftPayMethod = "wave" | "orange" | "free";
type SoftPayResult = {
  method: SoftPayMethod;
  message: string;
  url?: string;
  qr?: string;
  omUrl?: string;
  maxitUrl?: string;
  error?: string;
};

type PayStatus = {
  paid?: boolean;
  kind?: string;
  booking?: { dateLabel: string; time: string; serviceName: string };
};

type Props = {
  invoiceId?: string;
  pendingId?: string;
  amount: number;
  name: string;
  phone: string;
  email?: string;
  hideAmount?: boolean;
  hideMethods?: boolean;
  accountCreated?: boolean;
  kind?: "booking" | "boutique" | "abonnement";
  onPaid?: () => void;
};

const METHODS: { id: SoftPayMethod; label: string; hint: string }[] = [
  { id: "wave", label: "Wave", hint: "Page PayTech · Wave" },
  { id: "orange", label: "Orange Money", hint: "Page PayTech · Orange Money" },
  { id: "free", label: "Free Money", hint: "Page PayTech · Free Money" },
];

function suggestedMethod(phone: string): SoftPayMethod {
  const digits = phone.replace(/\D/g, "").slice(-9);
  if (digits.startsWith("76")) return "free";
  if (digits.startsWith("77") || digits.startsWith("78")) return "orange";
  return "wave";
}

async function sessionExists() {
  try {
    const res = await fetch("/api/compte/session", { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as { name?: string; phone?: string } | null;
    return Boolean(json?.name || json?.phone);
  } catch {
    return false;
  }
}

export default function SoftPay({ invoiceId, pendingId, amount, name, phone, email, hideAmount, hideMethods, accountCreated, kind, onPaid }: Props) {
  const [method, setMethod] = useState<SoftPayMethod | undefined>(() =>
    hideMethods ? undefined : suggestedMethod(phone),
  );
  const [payerPhone, setPayerPhone] = useState(phone);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paidBooking, setPaidBooking] = useState<PayStatus["booking"]>();
  const [result, setResult] = useState<SoftPayResult | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (paid || (!pendingId && !invoiceId)) return;
    let stop = false;
    async function tick() {
      const query = pendingId
        ? `pending=${encodeURIComponent(pendingId)}`
        : `invoice=${encodeURIComponent(invoiceId || "")}`;
      const res = await fetch(`/api/paytech/status?${query}`, {
        cache: "no-store",
      });
      const json = (await res.json().catch(() => null)) as PayStatus | null;
      if (stop || !json?.paid) return;
      setPaidBooking(json.booking);
      setPaid(true);
      onPaid?.();
    }
    const id = window.setInterval(() => void tick(), 3000);
    void tick();
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [paid, invoiceId, pendingId, onPaid]);

  async function pay() {
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/paytech/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoiceId || undefined,
          pendingId: pendingId || undefined,
          method: method || undefined,
          phone: payerPhone,
          name,
          email: email || "",
          source: "site",
        }),
      });
      const json = (await res.json().catch(() => null)) as (SoftPayResult & { error?: string }) | null;
      if (!res.ok || !json || json.error) {
        setError(json?.error || "Paiement indisponible.");
        return;
      }
      setResult(json);
      setWaiting(true);
      if (json.url) {
        const opened = window.open(json.url, "_blank", "noopener,noreferrer");
        if (!opened) setError("Autorise la fenêtre de paiement, puis clique Continuer.");
      }
    } catch {
      setError("Connexion interrompue. Réessaie.");
    } finally {
      setSending(false);
    }
  }

  async function startPay() {
    setError("");
    setSending(true);
    const loggedIn = await sessionExists();
    if (!loggedIn) {
      setSending(false);
      setLoginOpen(true);
      return;
    }
    await pay();
  }

  function onLoggedIn() {
    setLoginOpen(false);
    void pay();
  }

  if (paid) {
    const bookingOk = kind === "booking" || Boolean(paidBooking);
    return (
      <div className="text-center">
        <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
        <h2 className="font-bebas mt-3 text-5xl text-black">
          {bookingOk ? "Rendez-vous pris" : "Payé"}
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          {bookingOk
            ? `Merci ${name}. Ton rendez-vous${
                paidBooking ? ` du ${paidBooking.dateLabel} à ${paidBooking.time}` : ""
              } est bien confirmé. On t’attend au salon.`
            : `${formatFcfa(amount)}. Merci, à tout à l’heure au salon.`}
        </p>
        <Link href="/compte" className="btn-gold mt-8 inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-medium">
          Voir mon compte
        </Link>
      </div>
    );
  }

  return (
    <div>
      {!hideAmount ? <p className="font-bebas text-3xl text-black">{formatFcfa(amount)}</p> : null}
      <p className={`text-sm text-gray-400 ${hideAmount ? "" : "mt-1"}`}>
        {hideMethods
          ? "Le paiement s’ouvre sur PayTech."
          : "Choisis ton moyen. PayTech ouvre Wave, Orange Money ou Free Money."}
      </p>

      {hideMethods ? null : (
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {METHODS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setMethod(item.id);
              setResult(null);
              setWaiting(false);
              setError("");
            }}
            className={`cursor-pointer rounded-xl px-4 py-3 text-left ${
              method === item.id ? "btn-gold" : "bg-gray-900 text-black ring-1 ring-black/10 hover:bg-gray-800"
            }`}
          >
            <span className="block text-sm font-medium">{item.label}</span>
            <span className={`mt-1 block text-xs ${method === item.id ? "text-black/70" : "text-gray-500"}`}>{item.hint}</span>
          </button>
        ))}
      </div>
      )}

      <label className="mt-5 flex flex-col gap-2 text-sm text-black">
        Numéro Mobile Money
        <input
          value={payerPhone}
          onChange={(e) => setPayerPhone(e.target.value)}
          type="tel"
          autoComplete="tel"
          className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
        />
      </label>

      {result?.qr || result?.omUrl || result?.maxitUrl ? (
        <div className="mt-5 rounded-xl bg-white p-4 text-center">
          {result.qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.qr} alt="QR Orange Money" className="mx-auto h-52 w-52" />
          ) : null}
          <p className="mt-3 text-sm text-black">{result.message}</p>
          <div className="mt-3 flex flex-col gap-2">
            {result.omUrl ? (
              <a href={result.omUrl} className="inline-flex h-11 items-center justify-center rounded-lg bg-[#ff7900] text-sm font-medium text-black">
                Ouvrir Orange Money
              </a>
            ) : null}
            {result.maxitUrl ? (
              <a href={result.maxitUrl} className="inline-flex h-11 items-center justify-center rounded-lg bg-gray-900 text-sm text-black">
                Ouvrir Maxit
              </a>
            ) : null}
          </div>
        </div>
      ) : result?.message && waiting ? (
        <p className="mt-5 rounded-xl bg-gray-900 px-4 py-3 text-sm text-black ring-1 ring-black/10">{result.message}</p>
      ) : null}

      {result?.url ? (
        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="btn-gold mt-5 flex h-12 items-center justify-center rounded-lg text-sm font-medium"
        >
          Continuer le paiement
        </a>
      ) : null}

      {waiting ? <p className="mt-4 text-sm text-[#e0b12c]">En attente de confirmation sur ton téléphone…</p> : null}
      {error ? <p className="mt-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}

      {!waiting ? (
        <button
          type="button"
          disabled={sending}
          onClick={() => void startPay()}
          className="btn-black mt-6 h-12 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70"
        >
          {sending ? "Préparation…" : "Payer"}
        </button>
      ) : (
        <button
          type="button"
          disabled={sending}
          onClick={() => void startPay()}
          className="btn-black mt-4 h-12 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70"
        >
          Relancer le paiement
        </button>
      )}

      <LoginPopup
        open={loginOpen}
        phone={phone || payerPhone}
        accountCreated={accountCreated}
        onClose={() => setLoginOpen(false)}
        onLoggedIn={onLoggedIn}
      />
    </div>
  );
}
