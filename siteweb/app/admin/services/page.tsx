"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatFcfa } from "@/lib/money";

type AdminService = {
  id: string;
  slug: string;
  name: string;
  duration: string;
  description: string;
  category: string;
  image: string;
  price: number | null;
  priceLabel: string | null;
  active: boolean;
  sortOrder: number;
};

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  image: string;
  price: number;
  active: boolean;
  sortOrder: number;
};

const SERVICE_CATEGORIES = ["Signature", "Soins", "Enfants", "Domicile", "Autre"];
const PRODUCT_CATEGORIES = ["Coiffage", "Barbe", "Soin", "Coffret", "Autre"];

const EMPTY_SERVICE = {
  name: "",
  duration: "30 min",
  category: "Signature",
  price: "",
  description: "",
};

const EMPTY_PRODUCT = {
  name: "",
  category: "Coiffage",
  price: "",
  description: "",
};

type AdminPlan = {
  id: string;
  slug: string;
  name: string;
  price: number;
  period: string;
  featured: boolean;
  perks: string[];
  visits: number;
  boutiquePercent: number;
  active: boolean;
  sortOrder: number;
};

const EMPTY_PLAN = {
  name: "",
  price: "",
  visits: "4",
  boutiquePercent: "10",
  period: "par mois",
  featured: false,
  perks: "",
};

function servicePrice(item: AdminService) {
  if (item.priceLabel) return item.priceLabel;
  if (item.price == null) return "Sur devis";
  return formatFcfa(item.price);
}

export default function AdminServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<AdminService[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const [tab, setTab] = useState<"prestations" | "produits" | "abonnements">("prestations");

  const load = useCallback(async () => {
    try {
      const [servicesRes, productsRes, plansRes] = await Promise.all([
        fetch("/api/admin/services", { cache: "no-store" }),
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/plans", { cache: "no-store" }),
      ]);
      if (servicesRes.status === 401 || productsRes.status === 401 || plansRes.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const servicesJson = (await servicesRes.json()) as { services?: AdminService[]; error?: string };
      const productsJson = (await productsRes.json()) as { products?: AdminProduct[]; error?: string };
      const plansJson = (await plansRes.json()) as { plans?: AdminPlan[]; error?: string };
      if (!servicesRes.ok) {
        setError(servicesJson.error || "Chargement impossible.");
        return;
      }
      if (!productsRes.ok) {
        setError(productsJson.error || "Chargement des produits impossible.");
        return;
      }
      if (!plansRes.ok) {
        setError(plansJson.error || "Chargement des abonnements impossible.");
        return;
      }
      setServices(servicesJson.services || []);
      setProducts(productsJson.products || []);
      setPlans(plansJson.plans || []);
    } catch {
      setError("Chargement impossible.");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  function openNewService() {
    setEditingService(null);
    setServiceForm(EMPTY_SERVICE);
    setPhotoFile(null);
    setPhotoPreview("");
    setError("");
    setServiceOpen(true);
  }

  function openEditService(item: AdminService) {
    setEditingService(item);
    setServiceForm({
      name: item.name,
      duration: item.duration,
      category: item.category,
      price: item.price == null ? "" : String(item.price),
      description: item.description,
    });
    setPhotoFile(null);
    setPhotoPreview(item.image);
    setError("");
    setServiceOpen(true);
  }

  function openNewProduct() {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setPhotoFile(null);
    setPhotoPreview("");
    setError("");
    setProductOpen(true);
  }

  function openEditProduct(item: AdminProduct) {
    setEditingProduct(item);
    setProductForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      description: item.description,
    });
    setPhotoFile(null);
    setPhotoPreview(item.image);
    setError("");
    setProductOpen(true);
  }

  function onPhotoChange(file: File | null) {
    if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(editingService?.image || editingProduct?.image || "");
      return;
    }
    if (file.size > 5_000_000) {
      setError("Photo trop lourde. Maximum 5 Mo.");
      return;
    }
    setError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function saveService(e: FormEvent) {
    e.preventDefault();
    setBusy("service");
    setError("");
    try {
      const payload = new FormData();
      payload.append("name", serviceForm.name);
      payload.append("duration", serviceForm.duration);
      payload.append("category", serviceForm.category);
      payload.append("description", serviceForm.description);
      payload.append("price", serviceForm.price.trim());
      if (photoFile) payload.append("photo", photoFile);
      const res = await fetch(editingService ? `/api/admin/services/${editingService.id}` : "/api/admin/services", {
        method: editingService ? "PATCH" : "POST",
        body: payload,
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Enregistrement impossible.");
        return;
      }
      if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
      setServiceOpen(false);
      await load();
    } finally {
      setBusy("");
    }
  }

  async function saveProduct(e: FormEvent) {
    e.preventDefault();
    setBusy("product");
    setError("");
    try {
      const payload = new FormData();
      payload.append("name", productForm.name);
      payload.append("category", productForm.category);
      payload.append("description", productForm.description);
      payload.append("price", productForm.price);
      if (photoFile) payload.append("photo", photoFile);
      const res = await fetch(editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products", {
        method: editingProduct ? "PATCH" : "POST",
        body: payload,
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Enregistrement impossible.");
        return;
      }
      if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
      setProductOpen(false);
      await load();
    } finally {
      setBusy("");
    }
  }

  function openNewPlan() {
    setEditingPlan(null);
    setPlanForm(EMPTY_PLAN);
    setError("");
    setPlanOpen(true);
  }

  function openEditPlan(item: AdminPlan) {
    setEditingPlan(item);
    setPlanForm({
      name: item.name,
      price: String(item.price),
      visits: String(item.visits),
      boutiquePercent: String(item.boutiquePercent),
      period: item.period,
      featured: item.featured,
      perks: item.perks.join("\n"),
    });
    setError("");
    setPlanOpen(true);
  }

  async function savePlan(e: FormEvent) {
    e.preventDefault();
    setBusy("plan");
    setError("");
    try {
      const res = await fetch(editingPlan ? `/api/admin/plans/${editingPlan.id}` : "/api/admin/plans", {
        method: editingPlan ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planForm.name,
          price: Number(planForm.price),
          visits: Number(planForm.visits),
          boutiquePercent: Number(planForm.boutiquePercent),
          period: planForm.period,
          featured: planForm.featured,
          perks: planForm.perks,
        }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Enregistrement impossible.");
        return;
      }
      setPlanOpen(false);
      await load();
    } finally {
      setBusy("");
    }
  }

  async function setServiceActive(item: AdminService, active: boolean) {
    setBusy(item.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/services/${item.id}`, {
        method: active ? "PATCH" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: active ? JSON.stringify({ active: true }) : undefined,
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error || "Mise à jour impossible.");
        return;
      }
      await load();
    } finally {
      setBusy("");
    }
  }

  async function setPlanActive(item: AdminPlan, active: boolean) {
    setBusy(item.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/plans/${item.id}`, {
        method: active ? "PATCH" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: active ? JSON.stringify({ active: true }) : undefined,
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error || "Mise à jour impossible.");
        return;
      }
      await load();
    } finally {
      setBusy("");
    }
  }

  async function setProductActive(item: AdminProduct, active: boolean) {
    setBusy(item.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${item.id}`, {
        method: active ? "PATCH" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: active ? JSON.stringify({ active: true }) : undefined,
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error || "Mise à jour impossible.");
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
          <h1 className="font-bebas mt-2 text-5xl text-black">Catalogue</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Prestations, produits et abonnements. Retirer un élément le cache du site et de l’app, sans effacer les commandes, RDV ou formules déjà souscrites.
          </p>
        </div>
        {tab === "prestations" ? (
          <button type="button" onClick={openNewService} className="btn-gold h-10 cursor-pointer rounded-lg px-4 text-sm font-medium">
            Ajouter une prestation
          </button>
        ) : tab === "produits" ? (
          <button type="button" onClick={openNewProduct} className="btn-gold h-10 cursor-pointer rounded-lg px-4 text-sm font-medium">
            Ajouter un produit
          </button>
        ) : (
          <button type="button" onClick={openNewPlan} className="btn-gold h-10 cursor-pointer rounded-lg px-4 text-sm font-medium">
            Ajouter un abonnement
          </button>
        )}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("prestations")}
          className={`h-9 cursor-pointer rounded-full px-4 text-sm ${
            tab === "prestations" ? "btn-gold" : "bg-gray-900 text-gray-400 ring-1 ring-black/10 hover:text-black"
          }`}
        >
          Prestations
        </button>
        <button
          type="button"
          onClick={() => setTab("produits")}
          className={`h-9 cursor-pointer rounded-full px-4 text-sm ${
            tab === "produits" ? "btn-gold" : "bg-gray-900 text-gray-400 ring-1 ring-black/10 hover:text-black"
          }`}
        >
          Produits
        </button>
        <button
          type="button"
          onClick={() => setTab("abonnements")}
          className={`h-9 cursor-pointer rounded-full px-4 text-sm ${
            tab === "abonnements" ? "btn-gold" : "bg-gray-900 text-gray-400 ring-1 ring-black/10 hover:text-black"
          }`}
        >
          Abonnements
        </button>
      </div>
      {error ? <p className="mt-6 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}

      {tab === "prestations" ? (
      <section className="mt-6">
        <ul className="space-y-3">
          {services.map((item) => (
            <li key={item.id} className={`rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 ${item.active ? "" : "opacity-60"}`}>
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
                  <p className="font-bebas mt-1 text-3xl text-black">{item.name}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    {item.duration} · {servicePrice(item)}
                    {item.active ? "" : " · retiré du catalogue"}
                  </p>
                  {item.description ? <p className="mt-2 max-w-2xl text-sm text-gray-500">{item.description}</p> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={Boolean(busy)} onClick={() => openEditService(item)} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-800">
                    Modifier
                  </button>
                  {item.active ? (
                    <button type="button" disabled={busy === item.id} onClick={() => void setServiceActive(item, false)} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-red-300 hover:bg-red-500/10">
                      Retirer
                    </button>
                  ) : (
                    <button type="button" disabled={busy === item.id} onClick={() => void setServiceActive(item, true)} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-800">
                      Réactiver
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      ) : tab === "produits" ? (
      <section className="mt-6">
        <ul className="space-y-3">
          {products.length === 0 ? (
            <li className="text-sm text-gray-500">Aucun produit pour le moment.</li>
          ) : (
            products.map((item) => (
              <li key={item.id} className={`rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 ${item.active ? "" : "opacity-60"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-black/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs tracking-wide text-[#e0b12c]">{item.category}</p>
                      <p className="font-bebas mt-1 text-3xl text-black">{item.name}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {formatFcfa(item.price)}
                        {item.active ? "" : " · retiré de la boutique"}
                      </p>
                      {item.description ? <p className="mt-2 max-w-2xl text-sm text-gray-500">{item.description}</p> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={Boolean(busy)} onClick={() => openEditProduct(item)} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-800">
                      Modifier
                    </button>
                    {item.active ? (
                      <button type="button" disabled={busy === item.id} onClick={() => void setProductActive(item, false)} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-red-300 hover:bg-red-500/10">
                        Retirer
                      </button>
                    ) : (
                      <button type="button" disabled={busy === item.id} onClick={() => void setProductActive(item, true)} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-800">
                        Réactiver
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
      ) : (
      <section className="mt-6">
        <ul className="space-y-3">
          {plans.length === 0 ? (
            <li className="text-sm text-gray-500">Aucun abonnement pour le moment.</li>
          ) : (
            plans.map((item) => (
              <li key={item.id} className={`rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 ${item.active ? "" : "opacity-60"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-wide text-[#e0b12c]">
                      {item.featured ? "Le plus choisi · " : ""}
                      {`${item.visits} visite${item.visits > 1 ? "s" : ""} · ${item.boutiquePercent}% boutique`}
                    </p>
                    <p className="font-bebas mt-1 text-3xl text-black">{item.name}</p>
                    <p className="mt-1 text-sm text-gray-400">
                      {formatFcfa(item.price)} {item.period}
                      {item.active ? "" : " · retiré du site"}
                    </p>
                    {item.perks.length ? (
                      <ul className="mt-2 space-y-1 text-sm text-gray-500">
                        {item.perks.map((perk) => (
                          <li key={perk}>· {perk}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={Boolean(busy)} onClick={() => openEditPlan(item)} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-800">
                      Modifier
                    </button>
                    {item.active ? (
                      <button type="button" disabled={busy === item.id} onClick={() => void setPlanActive(item, false)} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-red-300 hover:bg-red-500/10">
                        Retirer
                      </button>
                    ) : (
                      <button type="button" disabled={busy === item.id} onClick={() => void setPlanActive(item, true)} className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-800">
                        Réactiver
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
      )}

      {serviceOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setServiceOpen(false)}>
          <form
            onSubmit={(e) => void saveService(e)}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.18em] text-[#e0b12c]">PRESTATION</p>
                <h2 className="font-bebas mt-1 text-3xl text-black">{editingService ? "Modifier" : "Ajouter"}</h2>
              </div>
              <button type="button" onClick={() => setServiceOpen(false)} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:bg-black/5 hover:text-black">
                Fermer
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-black sm:col-span-2">
                Nom *
                <input value={serviceForm.name} onChange={(e) => setServiceForm((current) => ({ ...current, name: e.target.value }))} required className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Durée
                <input value={serviceForm.duration} onChange={(e) => setServiceForm((current) => ({ ...current, duration: e.target.value }))} placeholder="30 min" className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Catégorie
                <select value={serviceForm.category} onChange={(e) => setServiceForm((current) => ({ ...current, category: e.target.value }))} className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50">
                  {SERVICE_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-black sm:col-span-2">
                Prix (F CFA)
                <input value={serviceForm.price} onChange={(e) => setServiceForm((current) => ({ ...current, price: e.target.value }))} inputMode="numeric" placeholder="Vide = sur devis" className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
              </label>
            </div>
            <label className="mt-3 flex flex-col gap-2 text-sm text-black">
              Photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-black file:mr-3 file:rounded-md file:border-0 file:bg-[#e0b12c] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black"
              />
              <span className="text-xs text-gray-500">JPG, PNG ou WEBP · 5 Mo max. Envoyée sur Cloudinary.</span>
            </label>
            {photoPreview ? (
              <div className="relative mt-3 aspect-square w-32 overflow-hidden rounded-xl bg-black ring-1 ring-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <label className="mt-3 flex flex-col gap-2 text-sm text-black">
              Description
              <textarea value={serviceForm.description} onChange={(e) => setServiceForm((current) => ({ ...current, description: e.target.value }))} rows={3} className="rounded-lg bg-gray-900 px-3 py-2 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
            </label>
            <button type="submit" disabled={busy === "service"} className="btn-gold mt-5 h-11 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-50">
              {editingService ? "Enregistrer" : "Ajouter"}
            </button>
          </form>
        </div>
      ) : null}

      {productOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setProductOpen(false)}>
          <form
            onSubmit={(e) => void saveProduct(e)}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.18em] text-[#e0b12c]">PRODUIT</p>
                <h2 className="font-bebas mt-1 text-3xl text-black">{editingProduct ? "Modifier" : "Ajouter"}</h2>
              </div>
              <button type="button" onClick={() => setProductOpen(false)} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:bg-black/5 hover:text-black">
                Fermer
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-black sm:col-span-2">
                Nom *
                <input value={productForm.name} onChange={(e) => setProductForm((current) => ({ ...current, name: e.target.value }))} required className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Catégorie
                <select value={productForm.category} onChange={(e) => setProductForm((current) => ({ ...current, category: e.target.value }))} className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50">
                  {PRODUCT_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Prix (F CFA) *
                <input value={productForm.price} onChange={(e) => setProductForm((current) => ({ ...current, price: e.target.value }))} required inputMode="numeric" className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
              </label>
            </div>
            <label className="mt-3 flex flex-col gap-2 text-sm text-black">
              Photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#e0b12c] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black"
              />
              <span className="text-xs text-gray-500">JPG, PNG ou WEBP · 5 Mo max.</span>
            </label>
            {photoPreview ? (
              <div className="relative mt-3 aspect-square w-32 overflow-hidden rounded-xl bg-black ring-1 ring-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <label className="mt-3 flex flex-col gap-2 text-sm text-black">
              Description
              <textarea value={productForm.description} onChange={(e) => setProductForm((current) => ({ ...current, description: e.target.value }))} rows={3} className="rounded-lg bg-gray-900 px-3 py-2 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
            </label>
            <button type="submit" disabled={busy === "product"} className="btn-gold mt-5 h-11 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-50">
              {editingProduct ? "Enregistrer" : "Ajouter"}
            </button>
          </form>
        </div>
      ) : null}

      {planOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setPlanOpen(false)}>
          <form
            onSubmit={(e) => void savePlan(e)}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.18em] text-[#e0b12c]">ABONNEMENT</p>
                <h2 className="font-bebas mt-1 text-3xl text-black">{editingPlan ? "Modifier" : "Ajouter"}</h2>
              </div>
              <button type="button" onClick={() => setPlanOpen(false)} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:bg-black/5 hover:text-black">
                Fermer
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-black sm:col-span-2">
                Nom *
                <input value={planForm.name} onChange={(e) => setPlanForm((current) => ({ ...current, name: e.target.value }))} required className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Prix (F CFA) *
                <input value={planForm.price} onChange={(e) => setPlanForm((current) => ({ ...current, price: e.target.value }))} required inputMode="numeric" className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Visites / mois *
                <input value={planForm.visits} onChange={(e) => setPlanForm((current) => ({ ...current, visits: e.target.value }))} required inputMode="numeric" className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Réduction boutique (%)
                <input value={planForm.boutiquePercent} onChange={(e) => setPlanForm((current) => ({ ...current, boutiquePercent: e.target.value }))} inputMode="numeric" className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Période
                <input value={planForm.period} onChange={(e) => setPlanForm((current) => ({ ...current, period: e.target.value }))} className="h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
              </label>
            </div>
            <label className="mt-3 flex items-center gap-3 text-sm text-black">
              <input type="checkbox" checked={planForm.featured} onChange={(e) => setPlanForm((current) => ({ ...current, featured: e.target.checked }))} className="h-4 w-4 accent-[#e0b12c]" />
              Mettre en avant (Le plus choisi)
            </label>
            <label className="mt-3 flex flex-col gap-2 text-sm text-black">
              Avantages (un par ligne)
              <textarea value={planForm.perks} onChange={(e) => setPlanForm((current) => ({ ...current, perks: e.target.value }))} rows={5} placeholder={"4 visites coupe + barbe\n15% sur la boutique"} className="rounded-lg bg-gray-900 px-3 py-2 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50" />
            </label>
            <button type="submit" disabled={busy === "plan"} className="btn-gold mt-5 h-11 w-full cursor-pointer rounded-lg text-sm font-medium disabled:opacity-50">
              {editingPlan ? "Enregistrer" : "Ajouter"}
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
