"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import type { PublicClient } from "@/lib/salon-types";

type Props = {
  open: boolean;
  client: PublicClient;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

export default function ProfilePopup({ open, client, onClose, onSaved }: Props) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"" | "profile" | "password">("");
  const needPassword = client.hasPassword === false;

  useEffect(() => {
    if (!open) return;
    setError("");
    setMessage("");
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

  async function patch(body: Record<string, string>) {
    const res = await fetch("/api/compte/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) throw new Error(json?.error || "Enregistrement impossible.");
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError("");
    setMessage("");
    setBusy("profile");
    try {
      await patch({
        name: String(data.get("name") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        email: String(data.get("email") || "").trim(),
      });
      setMessage("Profil enregistré.");
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setBusy("");
    }
  }

  async function savePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") || "").trim();
    setError("");
    setMessage("");
    setBusy("password");
    try {
      await patch({
        name: client.name,
        phone: client.phone,
        email: client.email,
        password,
      });
      e.currentTarget.reset();
      setMessage("Mot de passe mis à jour.");
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de changer le mot de passe.");
    } finally {
      setBusy("");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/55 p-4 pt-28 sm:items-center sm:pt-8"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-popup-title"
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
            <h2 id="profile-popup-title" className="font-bebas mt-2 text-4xl text-black">
              Profil
            </h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-gray-900 text-black hover:bg-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        {error ? <p className="mt-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-[#e0b12c]">{message}</p> : null}

        <form onSubmit={saveProfile} className="mt-6 space-y-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-black">
            Nom complet *
            <input
              name="name"
              autoComplete="name"
              defaultValue={client.name}
              key={`name-${client.name}`}
              required
              className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-black">
            Téléphone *
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={client.phone}
              key={`phone-${client.phone}`}
              required
              placeholder="77 123 45 67"
              className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 placeholder:text-gray-500 focus:ring-[#e0b12c]/50"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-black">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={client.email}
              key={`email-${client.email}`}
              className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
            />
          </label>
          <button
            type="submit"
            disabled={busy !== ""}
            className="btn-gold h-12 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70"
          >
            {busy === "profile" ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>

        <form onSubmit={savePassword} className="mt-8 border-t border-black/10 pt-6">
          <label className="flex flex-col gap-2 text-sm font-medium text-black">
            {needPassword ? "Mot de passe *" : "Nouveau mot de passe"}
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="8 caractères minimum"
              className="h-12 rounded-lg bg-gray-900 px-4 font-normal text-black outline-none ring-1 ring-black/10 placeholder:text-gray-500 focus:ring-[#e0b12c]/50"
            />
          </label>
          <button
            type="submit"
            disabled={busy !== ""}
            className="btn-black mt-5 h-12 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70"
          >
            {busy === "password" ? "Enregistrement…" : "Changer mon mot de passe"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
