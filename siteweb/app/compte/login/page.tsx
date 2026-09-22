"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SocialLogin from "@/components/SocialLogin";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/compte";
  }
  return value;
}

function CompteLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const from = search.get("from");
  const phonePrefill = search.get("phone") || "";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const phone = String(data.get("phone") || "").trim();
    const password = String(data.get("password") || "").trim();
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    setError("");
    setSending(true);
    try {
      const res = await fetch(mode === "register" ? "/api/compte/register" : "/api/compte/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register" ? { name, phone, email, password } : { phone, password }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Connexion impossible.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Connexion interrompue. Réessaie.");
    } finally {
      setSending(false);
    }
  }

  const intro =
    from === "rdv"
      ? "Connecte-toi pour confirmer ton rendez-vous. Tes RDV sont rattachés à ce numéro."
      : from === "commande"
        ? "Connecte-toi pour confirmer ta commande. Tes achats sont rattachés à ce numéro."
        : from === "abonnement"
          ? "Connecte-toi pour confirmer ton abonnement. Il est rattaché à ce numéro."
          : "Points de fidélité, abonnements, rendez-vous et achats au même endroit.";

  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-md items-center px-6 pt-32 pb-20">
      <form
        onSubmit={onSubmit}
        className="w-full rounded-2xl bg-gray-950 p-8 stroke-gradient [--stroke-opacity:0.2]"
      >
        <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
        <h1 className="font-bebas mt-3 text-5xl text-black">{mode === "login" ? "Connexion" : "Créer un compte"}</h1>
        <p className="mt-2 text-sm text-gray-500">{intro}</p>
        <SocialLogin onError={setError} onBusy={setSending} next={next} />
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] tracking-[0.18em] text-gray-600">OU AVEC TON TÉLÉPHONE</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`h-10 cursor-pointer rounded-lg text-sm ${
              mode === "login" ? "btn-gold font-medium" : "bg-gray-900 text-gray-600 ring-1 ring-black/10"
            }`}
          >
            J&apos;ai un compte
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`h-10 cursor-pointer rounded-lg text-sm ${
              mode === "register" ? "btn-gold font-medium" : "bg-gray-900 text-gray-600 ring-1 ring-black/10"
            }`}
          >
            Nouveau
          </button>
        </div>
        {mode === "register" ? (
          <>
            <label className="mt-6 flex flex-col gap-2 text-sm text-gray-800">
              Nom complet *
              <input
                name="name"
                autoComplete="name"
                required
                className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
              />
            </label>
            <label className="mt-5 flex flex-col gap-2 text-sm text-gray-800">
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
              />
            </label>
          </>
        ) : null}
        <label className="mt-5 flex flex-col gap-2 text-sm text-gray-800">
          Téléphone *
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            defaultValue={phonePrefill}
            placeholder="77 123 45 67"
            className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 placeholder:text-gray-600 focus:ring-[#e0b12c]/50"
          />
        </label>
        <label className="mt-5 flex flex-col gap-2 text-sm text-gray-800">
          Mot de passe *
          <input
            name="password"
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            required
            minLength={mode === "register" ? 8 : 1}
            className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
          />
          {mode === "register" ? (
            <span className="text-xs text-gray-500">Au moins 8 caractères.</span>
          ) : from ? (
            <span className="text-xs text-gray-500">Celui reçu par SMS et email si le compte vient d’être créé.</span>
          ) : null}
        </label>
        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={sending}
          className="btn-gold mt-6 h-12 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70"
        >
          {sending ? "Un instant…" : mode === "login" ? "Confirmer" : "Créer mon compte"}
        </button>
        <p className="mt-4 text-center text-xs text-gray-500">
          1 000 F payés = 1 point. 10 points = 1 000 F de crédit salon.
        </p>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/rendez-vous" className="hover:text-black">
            Prendre un rendez-vous
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function CompteLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-[80dvh]" />}>
      <CompteLoginForm />
    </Suspense>
  );
}
