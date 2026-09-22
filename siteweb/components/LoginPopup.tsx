"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import SocialLogin from "@/components/SocialLogin";

type Props = {
  open: boolean;
  phone?: string;
  accountCreated?: boolean;
  onClose: () => void;
  onLoggedIn: () => void;
};

export default function LoginPopup({ open, phone, accountCreated, onClose, onLoggedIn }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setMode("login");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nextPhone = String(data.get("phone") || "").trim();
    const password = String(data.get("password") || "").trim();
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    setError("");
    setSending(true);
    try {
      const res = await fetch(mode === "register" ? "/api/compte/register" : "/api/compte/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register" ? { name, phone: nextPhone, email, password } : { phone: nextPhone, password }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Connexion impossible.");
        return;
      }
      onLoggedIn();
    } catch {
      setError("Connexion interrompue. Réessaie.");
    } finally {
      setSending(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/55 p-4 pt-28 sm:items-center sm:pt-8" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-popup-title"
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
            <h2 id="login-popup-title" className="font-bebas mt-2 text-4xl text-black">
              {mode === "login" ? "Connexion" : "Créer un compte"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-gray-900 text-black hover:bg-gray-800"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {accountCreated
            ? "Ton compte est créé. Le mot de passe arrive par SMS et email. Connecte-toi pour payer."
            : "Connecte-toi pour payer. Sans compte reconnu, le paiement ne peut pas continuer."}
        </p>
        <SocialLogin onError={setError} onBusy={setSending} onSuccess={onLoggedIn} />
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-black/10" />
          <span className="text-[11px] tracking-[0.18em] text-gray-500">OU AVEC TON TÉLÉPHONE</span>
          <span className="h-px flex-1 bg-black/10" />
        </div>
        <form onSubmit={onSubmit}>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`h-10 cursor-pointer rounded-lg text-sm ${
                mode === "login" ? "btn-black font-medium" : "bg-gray-900 text-gray-600 ring-1 ring-black/10"
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
                mode === "register" ? "btn-black font-medium" : "bg-gray-900 text-gray-600 ring-1 ring-black/10"
              }`}
            >
              Nouveau
            </button>
          </div>
          {mode === "register" ? (
            <>
              <label className="mt-6 flex flex-col gap-2 text-sm font-medium text-black">
                Nom complet *
                <input
                  name="name"
                  autoComplete="name"
                  required
                  className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
                />
              </label>
              <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-black">
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
                />
              </label>
            </>
          ) : null}
          <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-black">
            Téléphone *
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              defaultValue={phone || ""}
              key={phone || "phone"}
              placeholder="77 123 45 67"
              className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 placeholder:text-gray-500 focus:ring-[#e0b12c]/50"
            />
          </label>
          <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-black">
            Mot de passe *
            <input
              name="password"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              minLength={mode === "register" ? 8 : 1}
              className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
            />
            {mode === "register" ? (
              <span className="text-xs font-normal text-gray-500">Au moins 8 caractères.</span>
            ) : accountCreated ? (
              <span className="text-xs font-normal text-gray-500">Celui reçu par SMS et email.</span>
            ) : null}
          </label>
          <button
            type="submit"
            disabled={sending}
            className="btn-black mt-6 h-12 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70"
          >
            {sending ? "Un instant…" : mode === "login" ? "Confirmer" : "Créer mon compte"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
