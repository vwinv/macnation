"use client";

import { FormEvent, useState } from "react";
import { jobs } from "@/lib/data";

type Job = (typeof jobs)[number];

export default function ApplyForm({ job, onDone }: { job?: Job; onDone?: () => void }) {
  const [jobId, setJobId] = useState(job?.id || jobs[0]?.id || "");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const selected = job || jobs.find((item) => item.id === jobId) || jobs[0];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("jobId", selected.id);
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/career", { method: "POST", body: data });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Envoi impossible.");
        return;
      }
      setSent(true);
      form.reset();
    } catch {
      setError("Connexion interrompue. Réessaie.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-xl bg-white/10 px-5 py-4">
        <p className="text-sm text-white">Candidature envoyée.</p>
        <p className="mt-1 text-sm text-white/60">On te recontacte si le profil correspond.</p>
        {onDone ? (
          <button type="button" onClick={onDone} className="mt-4 text-sm text-[#e0b12c] hover:text-white">
            Fermer
          </button>
        ) : (
          <button type="button" onClick={() => setSent(false)} className="mt-4 text-sm text-[#e0b12c] hover:text-white">
            Envoyer une autre candidature
          </button>
        )}
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4">
      {job ? (
        <p className="text-sm text-white/60">CV et lettre de motivation pour {job.title}.</p>
      ) : (
        <label className="flex flex-col gap-2 text-sm text-white/80">
          Poste *
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="h-12 rounded-lg bg-white/10 px-4 text-white outline-none ring-1 ring-white/15 focus:ring-[#e0b12c]/50"
          >
            {jobs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-2 text-sm text-white/80">
        Nom complet *
        <input name="name" autoComplete="name" required className="h-12 rounded-lg bg-white/10 px-4 text-white outline-none ring-1 ring-white/15 focus:ring-[#e0b12c]/50" />
      </label>
      <label className="flex flex-col gap-2 text-sm text-white/80">
        Téléphone *
        <input name="phone" type="tel" autoComplete="tel" required className="h-12 rounded-lg bg-white/10 px-4 text-white outline-none ring-1 ring-white/15 focus:ring-[#e0b12c]/50" />
      </label>
      <label className="flex flex-col gap-2 text-sm text-white/80">
        Email *
        <input name="email" type="email" autoComplete="email" required className="h-12 rounded-lg bg-white/10 px-4 text-white outline-none ring-1 ring-white/15 focus:ring-[#e0b12c]/50" />
      </label>
      <label className="flex flex-col gap-2 text-sm text-white/80">
        CV * <span className="text-xs text-white/45">PDF, Word ou image · 1,2 Mo max</span>
        <input name="cv" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf" required className="text-sm text-white/70 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#e0b12c] file:px-3 file:py-2 file:text-sm file:font-medium file:text-black" />
      </label>
      <label className="flex flex-col gap-2 text-sm text-white/80">
        Lettre de motivation *
        <textarea name="letter" rows={6} required placeholder="Pourquoi MAC NATION, ton parcours, ta dispo…" className="rounded-lg bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/15 placeholder:text-white/35 focus:ring-[#e0b12c]/50" />
      </label>
      <label className="flex flex-col gap-2 text-sm text-white/80">
        Lettre en fichier <span className="text-xs text-white/45">Optionnel</span>
        <input name="letterFile" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf" className="text-sm text-white/70 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white/15 file:px-3 file:py-2 file:text-sm file:text-white" />
      </label>
      {error ? <p className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={sending} className="btn-gold h-12 cursor-pointer rounded-lg px-6 text-sm font-medium disabled:opacity-70">
          {sending ? "Envoi…" : "Envoyer la candidature"}
        </button>
        {onDone ? (
          <button type="button" onClick={onDone} className="btn-black h-12 cursor-pointer rounded-lg px-5 text-sm font-medium">
            Annuler
          </button>
        ) : null}
      </div>
    </form>
  );
}
