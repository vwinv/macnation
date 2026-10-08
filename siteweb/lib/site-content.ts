import { assets, people, photos } from "@/lib/assets";

export type SiteReview = {
  author: string;
  quote: string;
  rating: string;
  city: string;
};

export type SiteCtaItem = {
  href: string;
  kicker: string;
  title: string;
  dark: boolean;
};

export type SiteBrandValue = {
  title: string;
  body: string;
};

export type SiteHistoryItem = {
  year: string;
  title: string;
  body: string;
};

export type SiteImages = {
  hero: string;
  brandMosaic: string[];
  brandPlace: string;
  brandOffer: string;
  salonBanner: string;
  salonGallery: string[];
  boutique: string;
  plans: string;
  cta: string;
};

export type ImageCropSpec = {
  aspect: number;
  width: number;
  height: number;
  ratio: string;
};

export const SITE_IMAGE_CROPS = {
  hero: { aspect: 16 / 9, width: 1920, height: 1080, ratio: "16:9" },
  brandMosaic: { aspect: 4 / 5, width: 800, height: 1000, ratio: "4:5" },
  brandCard: { aspect: 16 / 10, width: 1400, height: 875, ratio: "16:10" },
  salonBanner: { aspect: 16 / 8, width: 1920, height: 960, ratio: "2:1" },
  salonGallery: { aspect: 4 / 3, width: 1200, height: 900, ratio: "4:3" },
  offer: { aspect: 16 / 10, width: 1400, height: 875, ratio: "16:10" },
  cta: { aspect: 16 / 9, width: 1920, height: 1080, ratio: "16:9" },
} as const satisfies Record<string, ImageCropSpec>;

export const DEFAULT_SITE_IMAGES: SiteImages = {
  hero: assets.hero,
  brandMosaic: [people.reception, photos.stations, people.waiting, photos.boutiqueDesk],
  brandPlace: people.cut,
  brandOffer: people.boutique,
  salonBanner: assets.salon,
  salonGallery: [...assets.gallery],
  boutique: people.boutique,
  plans: people.waiting,
  cta: people.waiting,
};

export type SiteContent = {
  heroTitle: string;
  heroCta: string;
  heroSecondaryCta: string;
  reviewsTitle: string;
  reviewsSubtitle: string;
  boutiqueTitle: string;
  boutiqueText: string;
  boutiqueCta: string;
  plansTitle: string;
  plansText: string;
  plansCta: string;
  joinKicker: string;
  joinTitle: string;
  joinText: string;
  ctaTitle: string;
  ctaItems: SiteCtaItem[];
  brandKicker: string;
  brandTitle: string;
  brandHighlight: string;
  brandText: string;
  brandValuesTitle: string;
  brandValuesText: string;
  brandValues: SiteBrandValue[];
  brandPlaceTitle: string;
  brandPlaceText: string;
  brandOfferTitle: string;
  brandOfferText: string;
  brandHistoryTitle: string;
  brandHistory: SiteHistoryItem[];
  salonName: string;
  salonKicker: string;
  salonTitle: string;
  salonSubtitle: string;
  salonText: string;
  salonCta: string;
  salonGalleryTitle: string;
  salonAddress: string;
  salonCity: string;
  salonCountry: string;
  salonHours: string;
  salonPhone: string;
  reviews: SiteReview[];
  images: SiteImages;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroTitle: "Un lieu. Une nation. Une expérience.",
  heroCta: "Prendre rendez-vous",
  heroSecondaryCta: "Faire un abonnement",
  reviewsTitle: "Une expérience saluée par nos clients",
  reviewsSubtitle: "Les premiers retours",
  boutiqueTitle: "Boutique capillaire",
  boutiqueText: "Payer par Wave, Orange Money ou Free. Retrait au salon Nord Foire.",
  boutiqueCta: "Payer un produit",
  plansTitle: "Abonnements",
  plansText: "Payer l'abonnement en ligne. Wave, Orange Money ou Free Money.",
  plansCta: "Payer un abonnement",
  joinKicker: "MAC NATION",
  joinTitle: "Rejoindre notre équipe",
  joinText: "Barber, accueil ou candidature spontanée. Envoie ton CV : on lit chaque dossier à Nord Foire.",
  ctaTitle: "L'histoire s'écrit à Dakar",
  ctaItems: [
    { href: "/rendez-vous", kicker: "En tant que client", title: "Prendre rendez-vous", dark: false },
    { href: "/abonnements", kicker: "En tant que membre", title: "Prendre un abonnement", dark: true },
  ],
  brandKicker: "LA MARQUE",
  brandTitle: "Une vision dakaroise du grooming",
  brandHighlight: "moderne.",
  brandText: "Plus qu'une coupe, une nation. Un salon, une boutique, des abonnements. Tout au même endroit.",
  brandValuesTitle: "Des valeurs",
  brandValuesText:
    "MAC NATION est plus qu'un salon : c'est une vision. La diversité forge le geste. Chaque culture, chaque génération contribue. Un espace où l'effort est valorisé, à Dakar.",
  brandValues: [
    {
      title: "Marbre et or",
      body: "Le lieu dicte le geste. Marbre noir, moulures blanches, touches d'or : un salon pensé pour durer, lisible de Nord Foire jusqu'au reste de Dakar.",
    },
    {
      title: "Un savoir-faire",
      body: "Accueil, diagnostic, geste. Un parcours client clair, du premier regard jusqu'au produit emporté.",
    },
    {
      title: "Un savoir-être",
      body: "Chacun se sent à sa place. L'équipe incarne la diversité dakaroise et ouvre le salon à toutes les textures.",
    },
  ],
  brandPlaceTitle: "Un lieu unique",
  brandPlaceText:
    "Pour le moment, un seul salon : Nord Foire, en face du service d'hygiène. Toute l'attention sur une adresse, une équipe, un standard.",
  brandOfferTitle: "Salon, boutique, abonnement",
  brandOfferText:
    "La chaise, les produits, le rythme mensuel. On ne sépare pas la coupe de l'entretien. C'est le même univers, du rendez-vous jusqu'au kit emporté.",
  brandHistoryTitle: "Notre histoire",
  brandHistory: [
    {
      year: "2025",
      title: "L'idée",
      body: "MAC NATION naît à Dakar d'une envie simple : un salon où la coupe, la barbe et les produits vivent sous le même toit, sans distinction de texture.",
    },
    {
      year: "2026",
      title: "Nord Foire",
      body: "Ouverture du premier salon, en face du service d'hygiène. Un lieu unique, pensé comme un second espace de vie pour l'homme dakarois.",
    },
  ],
  salonName: "MAC NATION",
  salonKicker: "LE SALON",
  salonTitle: "MAC NATION Nord Foire",
  salonSubtitle: "Le premier salon. Le seul, pour le moment. Dakar, en face du service d'hygiène.",
  salonText:
    "Marbre noir, moulures blanches, or sur les consoles. Nos barbers maîtrisent fades, barbe et coupes pour tous les types de cheveux. Lavabo, soins, boutique capillaire sur place. Abonnements pour ceux qui veulent un rythme, pas une surprise.",
  salonCta: "Réserver",
  salonGalleryTitle: "Quelques images",
  salonAddress: "Nord Foire, en face du service d'hygiène",
  salonCity: "Dakar",
  salonCountry: "Sénégal",
  salonHours: "Lun–Sam 10h–21h · Dim 12h–20h",
  salonPhone: "+221 77 000 00 00",
  reviews: [
    { author: "Cheikh Diop", quote: "Première visite à Nord Foire, coupe nette et accueil au top. Je reviens.", rating: "5/5", city: "Nord Foire, Dakar" },
    { author: "Moussa Ndiaye", quote: "Le fade est propre, l'ambiance est calme. On se sent bien dès l'entrée.", rating: "5/5", city: "Nord Foire, Dakar" },
    { author: "Ibrahima Sarr", quote: "Barbe et coupe dans le même geste. Diagnostic clair, résultat nickel.", rating: "5/5", city: "Nord Foire, Dakar" },
    { author: "Omar Ba", quote: "Enfin un salon à Dakar qui prend tous les types de cheveux au sérieux.", rating: "5/5", city: "Nord Foire, Dakar" },
    { author: "Awa Fall", quote: "J'y ai emmené mon fils. Écoute, patience, coupe nickel. Merci à l'équipe.", rating: "5/5", city: "Nord Foire, Dakar" },
    { author: "Mamadou Kane", quote: "L'abonnement Signature me simplifie la vie. Je ne cherche plus de créneau à la dernière minute.", rating: "5/5", city: "Nord Foire, Dakar" },
    { author: "Pape Sow", quote: "Boutique bien fournie. J'ai pris l'huile barbe, ça sent propre sans être trop fort.", rating: "5/5", city: "Nord Foire, Dakar" },
    { author: "Abdoulaye Faye", quote: "Nord Foire, en face du service d'hygiène, facile à trouver. Service premium sans chichi.", rating: "5/5", city: "Nord Foire, Dakar" },
  ],
  images: DEFAULT_SITE_IMAGES,
};

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function isCareerLink(href: string) {
  return /equipe|career/i.test(href);
}

function heroSecondaryLabel(value: string) {
  return value === "Candidater" ? DEFAULT_SITE_CONTENT.heroSecondaryCta : value;
}

export function resolveSiteImage(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function imageUrl(value: unknown, fallback: string) {
  return resolveSiteImage(value, fallback);
}

function imageList(value: unknown, fallback: string[]) {
  const list = Array.isArray(value) ? value : [];
  return fallback.map((item, index) => imageUrl(list[index], item));
}

export function mergeSiteImages(raw: unknown): SiteImages {
  const payload = (raw || {}) as Record<string, unknown>;
  return {
    hero: imageUrl(payload.hero, DEFAULT_SITE_IMAGES.hero),
    brandMosaic: imageList(payload.brandMosaic, DEFAULT_SITE_IMAGES.brandMosaic),
    brandPlace: imageUrl(payload.brandPlace, DEFAULT_SITE_IMAGES.brandPlace),
    brandOffer: imageUrl(payload.brandOffer, DEFAULT_SITE_IMAGES.brandOffer),
    salonBanner: imageUrl(payload.salonBanner, DEFAULT_SITE_IMAGES.salonBanner),
    salonGallery: imageList(payload.salonGallery, DEFAULT_SITE_IMAGES.salonGallery),
    boutique: imageUrl(payload.boutique, DEFAULT_SITE_IMAGES.boutique),
    plans: imageUrl(payload.plans, DEFAULT_SITE_IMAGES.plans),
    cta: imageUrl(payload.cta, DEFAULT_SITE_IMAGES.cta),
  };
}

export function mergeSiteContent(raw: unknown): SiteContent {
  const payload = (raw || {}) as Record<string, unknown>;
  const reviews = Array.isArray(payload.reviews)
    ? payload.reviews
        .map((item) => {
          const row = (item || {}) as Record<string, unknown>;
          const author = text(row.author, "");
          const quote = text(row.quote, "");
          if (!author || !quote) return null;
          return {
            author,
            quote,
            rating: text(row.rating, "5/5"),
            city: text(row.city, "Nord Foire, Dakar"),
          };
        })
        .filter((item): item is SiteReview => Boolean(item))
    : [];
  const ctaItems = (
    Array.isArray(payload.ctaItems) && payload.ctaItems.length
      ? payload.ctaItems.slice(0, 3).map((item, index) => {
          const row = (item || {}) as Record<string, unknown>;
          const fallback = DEFAULT_SITE_CONTENT.ctaItems[index] || DEFAULT_SITE_CONTENT.ctaItems[0];
          return {
            href: text(row.href, fallback.href),
            kicker: text(row.kicker, fallback.kicker),
            title: text(row.title, fallback.title),
            dark: row.dark === undefined ? fallback.dark : row.dark === true,
          };
        })
      : DEFAULT_SITE_CONTENT.ctaItems
  ).filter((item) => !isCareerLink(item.href));
  const brandValues = DEFAULT_SITE_CONTENT.brandValues.map((fallback, index) => {
    const row = (Array.isArray(payload.brandValues) ? payload.brandValues[index] : {}) as Record<string, unknown>;
    return {
      title: text(row?.title, fallback.title),
      body: text(row?.body, fallback.body),
    };
  });
  const brandHistory = DEFAULT_SITE_CONTENT.brandHistory.map((fallback, index) => {
    const row = (Array.isArray(payload.brandHistory) ? payload.brandHistory[index] : {}) as Record<string, unknown>;
    return {
      year: text(row?.year, fallback.year),
      title: text(row?.title, fallback.title),
      body: text(row?.body, fallback.body),
    };
  });
  return {
    heroTitle: text(payload.heroTitle, DEFAULT_SITE_CONTENT.heroTitle),
    heroCta: text(payload.heroCta, DEFAULT_SITE_CONTENT.heroCta),
    heroSecondaryCta: heroSecondaryLabel(
      text(payload.heroSecondaryCta, DEFAULT_SITE_CONTENT.heroSecondaryCta),
    ),
    reviewsTitle: text(payload.reviewsTitle, DEFAULT_SITE_CONTENT.reviewsTitle),
    reviewsSubtitle: text(payload.reviewsSubtitle, DEFAULT_SITE_CONTENT.reviewsSubtitle),
    boutiqueTitle: text(payload.boutiqueTitle, DEFAULT_SITE_CONTENT.boutiqueTitle),
    boutiqueText: text(payload.boutiqueText, DEFAULT_SITE_CONTENT.boutiqueText),
    boutiqueCta: text(payload.boutiqueCta, DEFAULT_SITE_CONTENT.boutiqueCta),
    plansTitle: text(payload.plansTitle, DEFAULT_SITE_CONTENT.plansTitle),
    plansText: text(payload.plansText, DEFAULT_SITE_CONTENT.plansText),
    plansCta: text(payload.plansCta, DEFAULT_SITE_CONTENT.plansCta),
    joinKicker: text(payload.joinKicker, DEFAULT_SITE_CONTENT.joinKicker),
    joinTitle: text(payload.joinTitle, DEFAULT_SITE_CONTENT.joinTitle),
    joinText: text(payload.joinText, DEFAULT_SITE_CONTENT.joinText),
    ctaTitle: text(payload.ctaTitle, DEFAULT_SITE_CONTENT.ctaTitle),
    ctaItems: ctaItems.length ? ctaItems : DEFAULT_SITE_CONTENT.ctaItems,
    brandKicker: text(payload.brandKicker, DEFAULT_SITE_CONTENT.brandKicker),
    brandTitle: text(payload.brandTitle, DEFAULT_SITE_CONTENT.brandTitle),
    brandHighlight: text(payload.brandHighlight, DEFAULT_SITE_CONTENT.brandHighlight),
    brandText: text(payload.brandText, DEFAULT_SITE_CONTENT.brandText),
    brandValuesTitle: text(payload.brandValuesTitle, DEFAULT_SITE_CONTENT.brandValuesTitle),
    brandValuesText: text(payload.brandValuesText, DEFAULT_SITE_CONTENT.brandValuesText),
    brandValues,
    brandPlaceTitle: text(payload.brandPlaceTitle, DEFAULT_SITE_CONTENT.brandPlaceTitle),
    brandPlaceText: text(payload.brandPlaceText, DEFAULT_SITE_CONTENT.brandPlaceText),
    brandOfferTitle: text(payload.brandOfferTitle, DEFAULT_SITE_CONTENT.brandOfferTitle),
    brandOfferText: text(payload.brandOfferText, DEFAULT_SITE_CONTENT.brandOfferText),
    brandHistoryTitle: text(payload.brandHistoryTitle, DEFAULT_SITE_CONTENT.brandHistoryTitle),
    brandHistory,
    salonName: text(payload.salonName, DEFAULT_SITE_CONTENT.salonName),
    salonKicker: text(payload.salonKicker, DEFAULT_SITE_CONTENT.salonKicker),
    salonTitle: text(payload.salonTitle, DEFAULT_SITE_CONTENT.salonTitle),
    salonSubtitle: text(payload.salonSubtitle, DEFAULT_SITE_CONTENT.salonSubtitle),
    salonText: text(payload.salonText, DEFAULT_SITE_CONTENT.salonText),
    salonCta: text(payload.salonCta, DEFAULT_SITE_CONTENT.salonCta),
    salonGalleryTitle: text(payload.salonGalleryTitle, DEFAULT_SITE_CONTENT.salonGalleryTitle),
    salonAddress: text(payload.salonAddress, DEFAULT_SITE_CONTENT.salonAddress),
    salonCity: text(payload.salonCity, DEFAULT_SITE_CONTENT.salonCity),
    salonCountry: text(payload.salonCountry, DEFAULT_SITE_CONTENT.salonCountry),
    salonHours: text(payload.salonHours, DEFAULT_SITE_CONTENT.salonHours),
    salonPhone: text(payload.salonPhone, DEFAULT_SITE_CONTENT.salonPhone),
    reviews: Array.isArray(payload.reviews) ? reviews : DEFAULT_SITE_CONTENT.reviews,
    images: mergeSiteImages(payload.images),
  };
}
