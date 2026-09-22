"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Application, ApplicationStatus } from "@/lib/salon-types";
import { hasSnPhone, whatsAppHref } from "@/lib/phone";

const STATUS: Record<ApplicationStatus, string> = {
  nouvelle: "Nouvelle",
  vue: "Vue",
  retenue: "Retenue",
  refusee: "Refusée",
};

function fileHref(item: Application, kind: "cv" | "lettre") {
  const path = kind === "cv" ? item.cvPath : item.letterPath;
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `/api/admin/applications/${item.id}/file?kind=${kind}`;
}

function isImageFile(name?: string, path?: string) {
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(name || "") || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(path || "");
}

export default function CandidaturesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Application[]>([]);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState("");
  const [viewer, setViewer] = useState<{ title: string; url: string; image: boolean } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/salon", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = (await res.json()) as { applications?: Application[]; error?: string };
    if (!res.ok) {
      setError(json.error || "Chargement impossible.");
      return;
    }
    setItems(json.applications || []);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: ApplicationStatus) {
    setError("");
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json().catch(() => null)) as { application?: Application; error?: string } | null;
    if (!res.ok || !json?.application) {
      setError(json?.error || "Mise à jour impossible.");
      return;
    }
    setItems((current) => current.map((item) => (item.id === id ? json.application! : item)));
  }

  function openFile(item: Application, kind: "cv" | "lettre") {
    const url = fileHref(item, kind);
    if (!url) return;
    const name = kind === "cv" ? item.cvName : item.letterName;
    const path = kind === "cv" ? item.cvPath : item.letterPath;
    setViewer({
      title: `${kind === "cv" ? "CV" : "Lettre"} · ${item.name}`,
      url,
      image: isImageFile(name, path),
    });
  }

  const unread = items.filter((item) => item.status === "nouvelle").length;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
          <h1 className="font-bebas mt-2 text-5xl text-black">Candidatures</h1>
          <p className="mt-2 text-sm text-gray-400">
            {items.length} dossier{items.length > 1 ? "s" : ""}
            {unread ? ` · ${unread} nouveau${unread > 1 ? "x" : ""}` : ""}
          </p>
        </div>
      </div>
      {error ? <p className="mt-6 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
      {items.length === 0 && !error ? <p className="mt-10 text-sm text-gray-500">Aucune candidature pour le moment.</p> : null}
      <ul className="mt-8 space-y-4">
        {items.map((item) => {
          const open = openId === item.id;
          return (
            <li key={item.id} className="rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button type="button" onClick={() => setOpenId(open ? "" : item.id)} className="cursor-pointer text-left">
                  <p className="font-bebas text-3xl text-black">{item.name}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    {item.jobTitle} · {new Date(item.createdAt).toLocaleString("fr-FR")}
                  </p>
                </button>
                <span className={`rounded-full px-3 py-1 text-xs ${item.status === "nouvelle" ? "bg-[#e0b12c] text-black" : "bg-gray-900 text-gray-600"}`}>
                  {STATUS[item.status]}
                </span>
              </div>
              {open ? (
                <div className="mt-5 border-t border-black/10 pt-5">
                  <p className="text-sm text-gray-600">
                    {item.phone} · {item.email}
                  </p>
                  {item.letter ? <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{item.letter}</p> : null}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {item.cvPath ? (
                      <button type="button" onClick={() => openFile(item, "cv")} className="btn-gold inline-flex h-10 cursor-pointer items-center rounded-lg px-4 text-sm font-medium">
                        Voir le CV
                      </button>
                    ) : null}
                    {item.letterPath ? (
                      <button type="button" onClick={() => openFile(item, "lettre")} className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-gray-900 px-4 text-sm text-black ring-1 ring-black/10">
                        Voir la lettre
                      </button>
                    ) : null}
                    {hasSnPhone(item.phone) ? (
                      <a href={whatsAppHref(item.phone)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg bg-gray-900 px-4 text-sm text-black ring-1 ring-black/10">
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(["vue", "retenue", "refusee"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => void setStatus(item.id, status)}
                        className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-xs text-gray-600 ring-1 ring-black/10 hover:text-black"
                      >
                        {STATUS[status]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {viewer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setViewer(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-gray-950 ring-1 ring-black/10"
          >
            <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
              <p className="truncate text-sm text-black">{viewer.title}</p>
              <button type="button" onClick={() => setViewer(null)} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:bg-black/5 hover:text-black">
                Fermer
              </button>
            </div>
            <div className="min-h-[60vh] bg-black">
              {viewer.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewer.url} alt="" className="mx-auto max-h-[80vh] w-auto max-w-full object-contain" />
              ) : (
                <iframe title={viewer.title} src={viewer.url} className="h-[80vh] w-full border-0 bg-white" />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
