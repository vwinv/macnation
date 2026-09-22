"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Mot de passe incorrect.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Connexion impossible.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-gray-950 p-8 stroke-gradient [--stroke-opacity:0.2]"
      >
        <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
        <h1 className="font-bebas mt-3 text-4xl text-black">Backoffice</h1>
        <p className="mt-2 text-sm text-gray-500">Nord Foire · agenda, factures, caisse</p>
        <label className="mt-8 flex flex-col gap-2 text-sm text-gray-800">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-lg bg-gray-900 px-4 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
            autoFocus
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={sending}
          className="btn-gold mt-6 h-12 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-70"
        >
          {sending ? "Entrée…" : "Entrer"}
        </button>
      </form>
    </main>
  );
}
