"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  House,
  Megaphone,
  ShoppingBag,
  Ticket,
} from "@phosphor-icons/react";
import SiteImageField from "@/components/admin/SiteImageField";
import SalonGallery from "@/components/home/SalonGallery";
import {
  DEFAULT_SITE_CONTENT,
  DEFAULT_SITE_IMAGES,
  SITE_IMAGE_CROPS,
  mergeSiteContent,
  type SiteContent,
  type SiteImages,
} from "@/lib/site-content";

const TABS = [
  { id: "hero", label: "Accueil", hint: "Hero, bloc La marque et bloc Le salon", Icon: House },
  { id: "shop", label: "Boutique", hint: "Carte boutique de l’accueil et page Boutique", Icon: ShoppingBag },
  { id: "plans", label: "Abonnements", hint: "Carte abonnements de l’accueil et page Abonnements", Icon: Ticket },
  { id: "cta", label: "Bandeau", hint: "Blocs de fin d’accueil", Icon: Megaphone },
] as const;

type TabId = (typeof TABS)[number]["id"];

const field = "h-11 rounded-lg bg-gray-900 px-3 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50";
const area = "rounded-lg bg-gray-900 px-3 py-2 text-black outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50";
const ghost =
  "w-full rounded-md bg-transparent px-1.5 py-1 outline-none ring-1 ring-black/10 focus:ring-[#e0b12c]/50";
const ghostOnDark =
  "min-w-0 w-full rounded-md bg-white/10 px-1.5 py-1 text-white outline-none ring-1 ring-white/20 focus:ring-[#e0b12c]/60";
const hint = "text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400";
const hintOnDark = "text-[11px] font-medium uppercase tracking-[0.16em] text-white/45";

export default function AdminContenuPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("hero");
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const contentRef = useRef(content);
  contentRef.current = content;
  const current = TABS.find((item) => item.id === tab) ?? TABS[0];

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/site-content", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const json = (await res.json()) as { content?: unknown; error?: string };
      if (!res.ok) {
        setError(json.error || "Chargement impossible.");
        return;
      }
      setContent(mergeSiteContent(json.content));
    } catch {
      setError("Chargement impossible.");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  function patch<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((currentContent) => ({ ...currentContent, [key]: value }));
    setSaved("");
  }

  async function persistImages(images: SiteImages) {
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      const json = (await res.json().catch(() => null)) as { content?: unknown; error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Photo non enregistrée.");
        return;
      }
      setSaved("Photo enregistrée.");
    } catch {
      setError("Photo non enregistrée.");
    }
  }

  function patchImages(next: Partial<SiteImages>) {
    const images = { ...contentRef.current.images, ...next };
    const updated = { ...contentRef.current, images };
    contentRef.current = updated;
    setContent(updated);
    setSaved("");
    void persistImages(images);
  }

  function patchCta(index: number, key: "kicker" | "title", value: string) {
    setContent((currentContent) => ({
      ...currentContent,
      ctaItems: currentContent.ctaItems.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
    setSaved("");
  }

  function patchBrandValue(index: number, key: "title" | "body", value: string) {
    setContent((currentContent) => ({
      ...currentContent,
      brandValues: currentContent.brandValues.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
    setSaved("");
  }

  function patchHistory(index: number, key: "year" | "title" | "body", value: string) {
    setContent((currentContent) => ({
      ...currentContent,
      brandHistory: currentContent.brandHistory.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
    setSaved("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentRef.current }),
      });
      const json = (await res.json().catch(() => null)) as { content?: unknown; error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Enregistrement impossible.");
        return;
      }
      setContent(mergeSiteContent(json?.content));
      setSaved("Contenu enregistré.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1200px] flex-col px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs tracking-[0.22em] text-[#e0b12c]">MAC NATION</p>
        <h1 className="font-bebas mt-2 text-5xl text-black">Contenu du site</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Textes et photos des pages du site : accueil, boutique, abonnements. Une photo est publiée dès qu’elle est envoyée sur Cloudinary.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Parties du site"
        className="mt-8 grid grid-cols-2 gap-1 rounded-2xl bg-gray-950 p-1.5 ring-1 ring-black/10 sm:grid-cols-4"
      >
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              id={`contenu-tab-${item.id}`}
              aria-controls={`contenu-panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-12 w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${active ? "bg-[#e0b12c] text-black" : "text-gray-500 hover:bg-black/5 hover:text-black"
                }`}
            >
              <item.Icon size={18} weight={active ? "fill" : "regular"} />
              {item.label}
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-6 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p> : null}
      {saved ? <p className="mt-6 rounded-lg bg-emerald-500/15 px-4 py-3 text-sm text-emerald-700">{saved}</p> : null}

      <form onSubmit={(e) => void save(e)} className="mt-6 flex flex-1 flex-col">
        <section
          role="tabpanel"
          id={`contenu-panel-${current.id}`}
          aria-labelledby={`contenu-tab-${current.id}`}
          className="rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 sm:p-6"
        >
          <h2 className="font-bebas text-3xl text-black">{current.label}</h2>
          <p className="mt-1 text-sm text-gray-400">{current.hint}</p>

          {tab === "hero" ? (
            <div className="mt-5 grid gap-8">
              <div className="grid gap-5">
                <h3 className="font-bebas text-2xl text-black">Hero</h3>
                <label className="flex flex-col gap-2 text-sm text-black">
                  Titre
                  <input value={content.heroTitle} onChange={(e) => patch("heroTitle", e.target.value)} className={field} />
                </label>
                <label className="flex flex-col gap-2 text-sm text-black">
                  Bouton principal
                  <input value={content.heroCta} onChange={(e) => patch("heroCta", e.target.value)} className={field} />
                </label>
                <label className="flex flex-col gap-2 text-sm text-black">
                  Bouton secondaire
                  <input
                    value={content.heroSecondaryCta}
                    onChange={(e) => patch("heroSecondaryCta", e.target.value)}
                    className={field}
                  />
                </label>
                <SiteImageField
                  label="Photo du hero"
                  src={content.images.hero}
                  fallback={DEFAULT_SITE_IMAGES.hero}
                  spec={SITE_IMAGE_CROPS.hero}
                  onChange={(url) => patchImages({ hero: url })}
                />
              </div>

              <div className="grid gap-5 border-t border-black/10 pt-8">
                <div>
                  <h3 className="font-bebas text-2xl text-black">Bloc La marque</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Même mise en page que l’accueil. Clique une photo pour la changer, et modifie les textes directement.
                  </p>
                </div>
                <header className="mx-auto grid w-full max-w-[40rem] gap-2 text-center">
                  <p className={hint}>Sur-titre</p>
                  <input
                    value={content.brandKicker}
                    onChange={(e) => patch("brandKicker", e.target.value)}
                    className={`${ghost} text-center text-xs tracking-[0.22em] text-[#e0b12c]`}
                  />
                  <p className={`${hint} mt-3`}>Titre</p>
                  <input
                    value={content.brandTitle}
                    onChange={(e) => patch("brandTitle", e.target.value)}
                    className={`${ghost} title1 text-center text-4xl sm:text-5xl`}
                  />
                  <input
                    value={content.brandHighlight}
                    onChange={(e) => patch("brandHighlight", e.target.value)}
                    className={`${ghost} title1 text-center text-4xl text-[#e0b12c] sm:text-5xl`}
                  />
                  <p className={`${hint} mt-4`}>Sous-titre</p>
                  <textarea
                    value={content.brandText}
                    onChange={(e) => patch("brandText", e.target.value)}
                    rows={3}
                    className={`${ghost} mx-auto max-w-[60ch] text-center text-sm leading-relaxed text-gray-400 md:text-base`}
                  />
                </header>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {content.images.brandMosaic.map((src, index) => (
                    <SiteImageField
                      key={`mosaic-${index}`}
                      label={`Photo ${index + 1}`}
                      src={src}
                      fallback={DEFAULT_SITE_IMAGES.brandMosaic[index]}
                      spec={SITE_IMAGE_CROPS.brandMosaic}
                      layout="mosaic"
                      onChange={(url) =>
                        patchImages({
                          brandMosaic: contentRef.current.images.brandMosaic.map((item, i) =>
                            i === index ? url : item,
                          ),
                        })
                      }
                    />
                  ))}
                </div>
                <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-3">
                  {content.brandValues.map((item, index) => (
                    <div key={`value-${index}`} className="flex min-w-0 w-full flex-col rounded-2xl bg-black p-6 sm:p-8">
                      <p className={hintOnDark}>Titre</p>
                      <input
                        value={item.title}
                        onChange={(e) => patchBrandValue(index, "title", e.target.value)}
                        className={`${ghostOnDark} mt-1 font-bebas text-3xl`}
                      />
                      <p className={`${hintOnDark} mt-4`}>Sous-titre</p>
                      <textarea
                        value={item.body}
                        onChange={(e) => patchBrandValue(index, "body", e.target.value)}
                        rows={5}
                        className={`${ghostOnDark} mt-1 min-h-[7rem] flex-1 text-sm leading-relaxed text-white/70`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mx-auto grid w-full max-w-[800px] gap-2 py-4 text-center">
                  <p className={hint}>Titre</p>
                  <input
                    value={content.brandValuesTitle}
                    onChange={(e) => patch("brandValuesTitle", e.target.value)}
                    className={`${ghost} title1 text-center text-5xl`}
                  />
                  <p className={`${hint} mt-4`}>Sous-titre</p>
                  <textarea
                    value={content.brandValuesText}
                    onChange={(e) => patch("brandValuesText", e.target.value)}
                    rows={4}
                    className={`${ghost} text-center text-sm leading-relaxed text-gray-400`}
                  />
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {[
                    {
                      key: "place" as const,
                      src: content.images.brandPlace,
                      fallback: DEFAULT_SITE_IMAGES.brandPlace,
                      title: content.brandPlaceTitle,
                      body: content.brandPlaceText,
                      titleKey: "brandPlaceTitle" as const,
                      bodyKey: "brandPlaceText" as const,
                      label: "Carte lieu",
                    },
                    {
                      key: "offer" as const,
                      src: content.images.brandOffer,
                      fallback: DEFAULT_SITE_IMAGES.brandOffer,
                      title: content.brandOfferTitle,
                      body: content.brandOfferText,
                      titleKey: "brandOfferTitle" as const,
                      bodyKey: "brandOfferText" as const,
                      label: "Carte offre",
                    },
                  ].map((card) => (
                    <div key={card.key} className="relative min-h-[280px] overflow-hidden rounded-2xl bg-black">
                      <SiteImageField
                        label={card.label}
                        src={card.src}
                        fallback={card.fallback}
                        spec={SITE_IMAGE_CROPS.brandCard}
                        layout="tile"
                        clickToChange={false}
                        onChange={(url) =>
                          patchImages(card.key === "place" ? { brandPlace: url } : { brandOffer: url })
                        }
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 z-30 p-8">
                        <p className={hintOnDark}>Titre</p>
                        <input
                          value={card.title}
                          onChange={(e) => patch(card.titleKey, e.target.value)}
                          className={`${ghostOnDark} mt-1 font-bebas text-4xl`}
                        />
                        <p className={`${hintOnDark} mt-3`}>Sous-titre</p>
                        <textarea
                          value={card.body}
                          onChange={(e) => patch(card.bodyKey, e.target.value)}
                          rows={3}
                          className={`${ghostOnDark} mt-1 max-w-[48ch] text-sm leading-relaxed text-white/80`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mx-auto w-full max-w-[900px] py-6">
                  <p className={`${hint} text-center`}>Titre</p>
                  <input
                    value={content.brandHistoryTitle}
                    onChange={(e) => patch("brandHistoryTitle", e.target.value)}
                    className={`${ghost} title1 mt-2 text-center text-5xl`}
                  />
                  <ol className="relative mt-10 space-y-10 border-l border-[#e0b12c]/30 pl-8">
                    {content.brandHistory.map((item, index) => (
                      <li key={`history-${index}`}>
                        <span className="absolute -left-[7px] mt-1.5 size-3 rounded-full bg-[#e0b12c]" />
                        <p className={hint}>Année</p>
                        <input
                          value={item.year}
                          onChange={(e) => patchHistory(index, "year", e.target.value)}
                          className={`${ghost} font-bebas text-2xl text-black`}
                        />
                        <p className={`${hint} mt-3`}>Titre</p>
                        <input
                          value={item.title}
                          onChange={(e) => patchHistory(index, "title", e.target.value)}
                          className={`${ghost} text-lg font-semibold`}
                        />
                        <p className={`${hint} mt-3`}>Sous-titre</p>
                        <textarea
                          value={item.body}
                          onChange={(e) => patchHistory(index, "body", e.target.value)}
                          rows={3}
                          className={`${ghost} max-w-[65ch] text-sm leading-relaxed text-gray-400`}
                        />
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="grid gap-5 border-t border-black/10 pt-8">
                <div>
                  <h3 className="font-bebas text-2xl text-black">Bloc Le salon</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Section sur la page d’accueil. Les coordonnées apparaissent aussi dans le pied de page.
                  </p>
                </div>
                <header className="mx-auto grid w-full max-w-[40rem] gap-2 text-center">
                  <p className={hint}>Sur-titre</p>
                  <input
                    value={content.salonKicker}
                    onChange={(e) => patch("salonKicker", e.target.value)}
                    className={`${ghost} text-center text-xs tracking-[0.22em] text-[#e0b12c]`}
                  />
                  <p className={`${hint} mt-3`}>Titre</p>
                  <input
                    value={content.salonTitle}
                    onChange={(e) => patch("salonTitle", e.target.value)}
                    className={`${ghost} title1 text-center text-4xl sm:text-5xl`}
                  />
                  <p className={`${hint} mt-3`}>Sous-titre</p>
                  <textarea
                    value={content.salonSubtitle}
                    onChange={(e) => patch("salonSubtitle", e.target.value)}
                    rows={2}
                    className={`${ghost} text-center text-sm leading-relaxed text-gray-400 md:text-base`}
                  />
                </header>
                <SiteImageField
                  label="Grande photo du salon"
                  src={content.images.salonBanner}
                  fallback={DEFAULT_SITE_IMAGES.salonBanner}
                  spec={SITE_IMAGE_CROPS.salonBanner}
                  onChange={(url) => patchImages({ salonBanner: url })}
                />
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_0.8fr]">
                  <div>
                    <textarea
                      value={content.salonText}
                      onChange={(e) => patch("salonText", e.target.value)}
                      rows={5}
                      className={`${ghost} max-w-[65ch] text-sm leading-relaxed text-gray-400`}
                    />
                    <input
                      value={content.salonCta}
                      onChange={(e) => patch("salonCta", e.target.value)}
                      className="btn-gold mt-8 inline-flex h-11 w-auto min-w-[10rem] rounded-lg px-8 text-sm"
                    />
                  </div>
                  <aside className="grid gap-3 rounded-2xl bg-black p-6">
                    <label className="flex flex-col gap-1 text-xs text-white/50">
                      Nom (footer / fiche)
                      <input value={content.salonName} onChange={(e) => patch("salonName", e.target.value)} className={ghostOnDark} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-white/50">
                      Adresse
                      <input value={content.salonAddress} onChange={(e) => patch("salonAddress", e.target.value)} className={ghostOnDark} />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1 text-xs text-white/50">
                        Ville
                        <input value={content.salonCity} onChange={(e) => patch("salonCity", e.target.value)} className={ghostOnDark} />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-white/50">
                        Pays
                        <input value={content.salonCountry} onChange={(e) => patch("salonCountry", e.target.value)} className={ghostOnDark} />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1 text-xs text-white/50">
                      Horaires
                      <input value={content.salonHours} onChange={(e) => patch("salonHours", e.target.value)} className={ghostOnDark} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-white/50">
                      Téléphone
                      <input value={content.salonPhone} onChange={(e) => patch("salonPhone", e.target.value)} className={ghostOnDark} />
                    </label>
                  </aside>
                </div>
                <div className="pb-2 pt-4">
                  <p className={hint}>Titre</p>
                  <input
                    value={content.salonGalleryTitle}
                    onChange={(e) => patch("salonGalleryTitle", e.target.value)}
                    className={`${ghost} font-bebas text-4xl text-black`}
                  />
                  <p className="mt-1 text-sm text-gray-400">Aperçu identique au site. Clique une photo pour la changer.</p>
                  <div className="mt-6">
                    <SalonGallery
                      images={content.images.salonGallery}
                      renderTile={(src, index) => (
                        <SiteImageField
                          label={`Photo ${index + 1}`}
                          src={src}
                          fallback={DEFAULT_SITE_IMAGES.salonGallery[index]}
                          spec={SITE_IMAGE_CROPS.salonGallery}
                          layout="tile"
                          onChange={(url) =>
                            patchImages({
                              salonGallery: contentRef.current.images.salonGallery.map((item, i) =>
                                i === index ? url : item,
                              ),
                            })
                          }
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "shop" ? (
            <div className="mt-5 grid gap-5">
              <label className="flex flex-col gap-2 text-sm text-black">
                Titre boutique
                <input value={content.boutiqueTitle} onChange={(e) => patch("boutiqueTitle", e.target.value)} className={field} />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Texte boutique
                <textarea
                  value={content.boutiqueText}
                  onChange={(e) => patch("boutiqueText", e.target.value)}
                  rows={3}
                  className={area}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Bouton boutique
                <input value={content.boutiqueCta} onChange={(e) => patch("boutiqueCta", e.target.value)} className={field} />
              </label>
              <SiteImageField
                label="Photo boutique"
                src={content.images.boutique}
                fallback={DEFAULT_SITE_IMAGES.boutique}
                spec={SITE_IMAGE_CROPS.offer}
                onChange={(url) => patchImages({ boutique: url })}
              />
            </div>
          ) : null}

          {tab === "plans" ? (
            <div className="mt-5 grid gap-5">
              <label className="flex flex-col gap-2 text-sm text-black">
                Titre abonnements
                <input value={content.plansTitle} onChange={(e) => patch("plansTitle", e.target.value)} className={field} />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Texte abonnements
                <textarea
                  value={content.plansText}
                  onChange={(e) => patch("plansText", e.target.value)}
                  rows={3}
                  className={area}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-black">
                Bouton abonnements
                <input value={content.plansCta} onChange={(e) => patch("plansCta", e.target.value)} className={field} />
              </label>
              <SiteImageField
                label="Photo abonnements"
                src={content.images.plans}
                fallback={DEFAULT_SITE_IMAGES.plans}
                spec={SITE_IMAGE_CROPS.offer}
                onChange={(url) => patchImages({ plans: url })}
              />
            </div>
          ) : null}

          {tab === "cta" ? (
            <div className="mt-5 grid gap-5">
              <label className="flex flex-col gap-2 text-sm text-black">
                Titre
                <input value={content.ctaTitle} onChange={(e) => patch("ctaTitle", e.target.value)} className={field} />
              </label>
              {content.ctaItems.map((item, index) => (
                <div key={item.href} className="grid gap-3 rounded-xl bg-gray-900 p-4 ring-1 ring-black/10 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-black">
                    Sur-titre {index + 1}
                    <input value={item.kicker} onChange={(e) => patchCta(index, "kicker", e.target.value)} className={field} />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-black">
                    Titre {index + 1}
                    <input value={item.title} onChange={(e) => patchCta(index, "title", e.target.value)} className={field} />
                  </label>
                </div>
              ))}
              <SiteImageField
                label="Fond du bandeau"
                src={content.images.cta}
                fallback={DEFAULT_SITE_IMAGES.cta}
                spec={SITE_IMAGE_CROPS.cta}
                onChange={(url) => patchImages({ cta: url })}
              />
            </div>
          ) : null}
        </section>

        <div className="sticky bottom-0 mt-auto flex items-center justify-between gap-3 bg-background py-5">
          <p className="text-xs text-gray-400">
            {saved || "Les photos sont publiées tout de suite. Enregistre pour les textes."}
          </p>
          <button type="submit" disabled={busy} className="btn-gold h-11 cursor-pointer rounded-lg px-6 text-sm font-medium disabled:opacity-50">
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </main>
  );
}
