"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  dateIso: string;
  date: string;
  excerpt: string;
  body: string;
  image: string;
  active: boolean;
};

const CATEGORIES = ["Nos actus", "Guides et Conseils", "Tendance", "Lifestyle"];

const EMPTY = {
  title: "",
  category: "Nos actus",
  dateIso: "",
  excerpt: "",
  body: "",
};

function todayIso() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [editing, setEditing] = useState<AdminArticle | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/articles", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const json = (await res.json()) as { articles?: AdminArticle[]; error?: string };
      if (!res.ok) {
        setError(json.error || "Chargement impossible.");
        return;
      }
      setArticles(json.articles || []);
    } catch {
      setError("Chargement impossible.");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY, dateIso: todayIso() });
    setPhotoFile(null);
    setPhotoPreview("");
    setError("");
    setOpen(true);
  }

  function openEdit(item: AdminArticle) {
    setEditing(item);
    setForm({
      title: item.title,
      category: item.category,
      dateIso: item.dateIso,
      excerpt: item.excerpt,
      body: item.body,
    });
    setPhotoFile(null);
    setPhotoPreview(item.image || "");
    setError("");
    setOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy("save");
    setError("");
    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("category", form.category);
      payload.append("dateIso", form.dateIso);
      payload.append("excerpt", form.excerpt);
      payload.append("body", form.body);
      if (photoFile) payload.append("photo", photoFile);
      const res = await fetch(editing ? `/api/admin/articles/${editing.id}` : "/api/admin/articles", {
        method: editing ? "PATCH" : "POST",
        body: payload,
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Enregistrement impossible.");
        return;
      }
      setOpen(false);
      await load();
    } finally {
      setBusy("");
    }
  }

  async function remove(item: AdminArticle) {
    if (!window.confirm(`Supprimer « ${item.title} » ? Cette action est définitive.`)) return;
    setBusy(item.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/articles/${item.id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Suppression impossible.");
        return;
      }
      await load();
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
          <h1 className="font-bebas mt-2 text-5xl text-black">Blog</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Ajouter, modifier ou supprimer les articles du journal. Ils apparaissent dans l’application.
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-gold h-10 cursor-pointer rounded-lg px-4 text-sm font-medium">
          Ajouter un article
        </button>
      </div>
      {error ? <p className="mt-6 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
      <ul className="mt-6 space-y-3">
        {articles.length === 0 ? (
          <li className="text-sm text-gray-500">Aucun article pour le moment.</li>
        ) : (
          articles.map((item) => (
            <li key={item.id} className="rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 gap-4">
                  {item.image ? (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-black/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div>
                    <p className="text-xs tracking-wide text-[#e0b12c]">{item.category}</p>
                    <p className="font-bebas mt-1 text-3xl text-black">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-400">{item.date}</p>
                    {item.excerpt ? <p className="mt-2 max-w-2xl text-sm text-gray-500">{item.excerpt}</p> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => openEdit(item)}
                    className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-200"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    disabled={busy === item.id}
                    onClick={() => void remove(item)}
                    className="h-9 cursor-pointer rounded-lg px-3 text-sm text-red-300 hover:bg-red-500/10"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <form
            onSubmit={(e) => void save(e)}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.18em] text-[#e0b12c]">ARTICLE</p>
                <h2 className="font-bebas mt-1 text-3xl text-black">{editing ? "Modifier" : "Ajouter"}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:bg-black/5 hover:text-black">
                Fermer
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-black sm:col-span-2">
                Titre *
                <input
                  value={form.title}
                  onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                  required
                  className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Catégorie
                <select
                  value={form.category}
                  onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
                  className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
                >
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Date
                <input
                  type="date"
                  value={form.dateIso}
                  onChange={(e) => setForm((current) => ({ ...current, dateIso: e.target.value }))}
                  className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
                />
              </label>
            </div>
            <label className="mt-3 flex flex-col gap-2 text-sm text-black">
              Photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPhotoFile(file);
                  setPhotoPreview(file ? URL.createObjectURL(file) : editing?.image || "");
                  e.target.value = "";
                }}
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#e0b12c] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black"
              />
            </label>
            {photoPreview ? (
              <div className="mt-3 relative aspect-[16/9] overflow-hidden rounded-xl bg-black ring-1 ring-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <label className="mt-3 flex flex-col gap-2 text-sm text-black">
              Accroche
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((current) => ({ ...current, excerpt: e.target.value }))}
                rows={3}
                className="rounded-lg bg-gray-900 px-3 py-2 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
              />
            </label>
            <label className="mt-3 flex flex-col gap-2 text-sm text-black">
              Article
              <textarea
                value={form.body}
                onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))}
                rows={8}
                className="rounded-lg bg-gray-900 px-3 py-2 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
              />
            </label>
            <button type="submit" disabled={busy === "save"} className="btn-gold mt-5 h-11 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-50">
              {editing ? "Enregistrer" : "Ajouter"}
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
