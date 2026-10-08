export type CatalogArticle = {
  id: string;
  title: string;
  category: string;
  date: string;
  dateIso: string;
  excerpt: string;
  body: string;
  image: string;
};

export type CatalogReview = {
  author: string;
  quote: string;
  rating: string;
  city: string;
};

export type CatalogJob = {
  id: string;
  track: string;
  title: string;
  location: string;
  type: string;
  blurb: string;
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

export type SiteImagesPayload = {
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

export type SiteContentPayload = {
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
  reviews: CatalogReview[];
  images: SiteImagesPayload;
};

export const SALON = {
  name: 'MAC NATION',
  slug: 'nord-foire',
  address: "Nord Foire, en face du service d'hygiène\nDakar, Sénégal",
  city: 'Dakar',
  country: 'Sénégal',
  hours: 'Lun–Sam 10h–21h · Dim 12h–20h',
  phone: '+221 77 000 00 00',
  image: '/photos/reception-mac-nation.jpg',
};

export const SERVICE_ALIASES: Record<string, string> = {
  'coupe-barbe': 'combo',
  enfant: 'coupe-enfant',
  ado: 'coupe-ado',
};

export const PRODUCT_ALIASES: Record<string, string> = {
  'pommade-hold': 'pommade',
  'shampoing-daily': 'shampoing',
  'spray-texture': 'spray',
  'kit-nation': 'kit',
};

export const ARTICLES: CatalogArticle[] = [
  {
    id: 'ouverture-mac-nation-nord-foire',
    title: 'MAC NATION ouvre à Nord Foire',
    category: 'Nos actus',
    date: '12 août 2026',
    dateIso: '2026-08-12',
    excerpt:
      "Le premier salon MAC NATION est ouvert à Dakar, Nord Foire, en face du service d'hygiène. Un lieu, une coupe, une nation.",
    body: "Le premier salon MAC NATION est ouvert à Dakar, Nord Foire, en face du service d'hygiène. Un lieu, une coupe, une nation.\n\nChez MAC NATION, chaque geste s'inscrit dans une culture commune : accueil, diagnostic, exigence. Nos barbers sont formés pour tous les types de cheveux, sans distinction, dans un salon pensé comme un second lieu de vie.\n\nNord Foire, en face du service d'hygiène. Un seul lieu pour le moment, pour que le standard reste le même à chaque chaise, chaque produit, chaque abonnement.",
    image: '/photos/people/people-reception-match.jpg',
  },
  {
    id: 'fade-dakar-ce-qui-marche-en-2026',
    title: 'Le fade à Dakar : ce qui marche en 2026',
    category: 'Tendance',
    date: '4 août 2026',
    dateIso: '2026-08-04',
    excerpt:
      'Dégradé bas, texture sur le dessus, ligne nette. Nos barbers décryptent les coupes qui tiennent dans la chaleur dakaroise.',
    body: "Le fade reste la coupe de référence à Dakar. En 2026, ce qui marche n'est pas le plus court, c'est le plus net : un dégradé lisible, un contour propre, une texture qui tient dans la chaleur.\n\nMid fade et drop fade dominent. Le skin fade se réserve aux têtes qui le portent vraiment. Le diagnostic vient avant la tondeuse : morphologie, densité, habitudes.\n\nAu salon, on sculpte d'abord, on affine ensuite. Le produit (pommade mate ou spray texture) n'est pas un extra : c'est ce qui fait tenir le geste jusqu'au soir.",
    image: '/photos/people/people-cut.jpg',
  },
  {
    id: 'routine-capillaire-homme-dakar',
    title: 'Routine capillaire homme à Dakar',
    category: 'Guides et Conseils',
    date: '28 juillet 2026',
    dateIso: '2026-07-28',
    excerpt:
      'Soleil, poussière, humidité. Comment laver, hydrater et fixer sans alourdir, avec les produits de la boutique MAC NATION.',
    body: 'À Dakar, le climat sèche et le lavage trop fréquent casse la fibre. La routine MAC NATION est courte : laver sans agresser, hydrater, sculpter.\n\nShampoing daily pour les lavages fréquents. Huile barbe sans graisser. Pommade Hold pour les fades qui doivent tenir.\n\nLe diagnostic en chaise reste le point de départ. Tous types de cheveux, même exigence. Entre deux visites, le Kit Nation couvre le mois.',
    image: '/photos/people/people-boutique-casual.jpg',
  },
  {
    id: 'abonnements-pourquoi-ca-change-tout',
    title: 'Pourquoi un abonnement change votre rythme',
    category: 'Lifestyle',
    date: '18 juillet 2026',
    dateIso: '2026-07-18',
    excerpt:
      "Deux ou quatre visites par mois, sans négocier le créneau. L'abonnement MAC NATION est pensé pour ceux qui ne laissent plus la coupe au hasard.",
    body: "L'abonnement n'est pas un gadget. C'est un rythme : 2 ou 4 visites par mois, priorité sur les soirs, rappel WhatsApp la veille.\n\nSignature est le plus choisi : coupe + barbe, diagnostic à chaque passage, 15 % boutique. Nation ajoute le soin et un barber attitré.\n\nLes visites non utilisées ne se reportent pas. L'idée est simple : venir, pas accumuler.",
    image: '/photos/people/people-waiting-casual.jpg',
  },
];

export const REVIEWS: CatalogReview[] = [
  {
    author: 'Cheikh Diop',
    quote:
      'Première visite à Nord Foire, coupe nette et accueil au top. Je reviens.',
    rating: '5/5',
    city: 'Nord Foire, Dakar',
  },
  {
    author: 'Moussa Ndiaye',
    quote:
      "Le fade est propre, l'ambiance est calme. On se sent bien dès l'entrée.",
    rating: '5/5',
    city: 'Nord Foire, Dakar',
  },
  {
    author: 'Ibrahima Sarr',
    quote:
      'Barbe et coupe dans le même geste. Diagnostic clair, résultat nickel.',
    rating: '5/5',
    city: 'Nord Foire, Dakar',
  },
  {
    author: 'Omar Ba',
    quote:
      'Enfin un salon à Dakar qui prend tous les types de cheveux au sérieux.',
    rating: '5/5',
    city: 'Nord Foire, Dakar',
  },
  {
    author: 'Awa Fall',
    quote:
      "J'y ai emmené mon fils. Écoute, patience, coupe nickel. Merci à l'équipe.",
    rating: '5/5',
    city: 'Nord Foire, Dakar',
  },
  {
    author: 'Mamadou Kane',
    quote:
      "L'abonnement Signature me simplifie la vie. Je ne cherche plus de créneau à la dernière minute.",
    rating: '5/5',
    city: 'Nord Foire, Dakar',
  },
  {
    author: 'Pape Sow',
    quote:
      "Boutique bien fournie. J'ai pris l'huile barbe, ça sent propre sans être trop fort.",
    rating: '5/5',
    city: 'Nord Foire, Dakar',
  },
  {
    author: 'Abdoulaye Faye',
    quote:
      "Nord Foire, en face du service d'hygiène, facile à trouver. Service premium sans chichi.",
    rating: '5/5',
    city: 'Nord Foire, Dakar',
  },
];

export const JOBS: CatalogJob[] = [
  {
    id: 'barber',
    track: 'Barber',
    title: 'Barber / Coiffeur barbier',
    location: 'Nord Foire, Dakar',
    type: 'CDI',
    blurb:
      'Maîtrise de tous types de cheveux, culture du diagnostic, exigence du geste. On forme, on exige, on avance ensemble.',
  },
  {
    id: 'barber-senior',
    track: 'Barber',
    title: 'Barber senior',
    location: 'Nord Foire, Dakar',
    type: 'CDI',
    blurb:
      'Prendre le lead sur le plateau, transmettre les standards, garder le niveau à chaque chaise.',
  },
  {
    id: 'accueil',
    track: 'Accueil',
    title: "Hôte / Hôtesse d'accueil",
    location: 'Nord Foire, Dakar',
    type: 'CDI',
    blurb:
      'Premier regard, premier mot. Gérer le flux, la boutique et les abonnements avec calme.',
  },
  {
    id: 'spontanee',
    track: 'Accueil',
    title: 'Candidature spontanée',
    location: 'Nord Foire, Dakar',
    type: 'Ouvert',
    blurb:
      'Tu ne vois pas le poste exact : envoie ton CV. On te recontacte si le profil correspond.',
  },
];

export function resolveServiceId(id: string) {
  return SERVICE_ALIASES[id] || id;
}

export function resolveProductId(id: string) {
  return PRODUCT_ALIASES[id] || id;
}

export function findArticle(id: string) {
  return ARTICLES.find((item) => item.id === id);
}

export const DEFAULT_SITE_IMAGES: SiteImagesPayload = {
  hero: '/photos/people/people-hero-casual.jpg',
  brandMosaic: [
    '/photos/people/people-reception-match.jpg',
    '/photos/04.jpg',
    '/photos/people/people-waiting-casual.jpg',
    '/photos/14.jpg',
  ],
  brandPlace: '/photos/people/people-cut.jpg',
  brandOffer: '/photos/people/people-boutique-casual.jpg',
  salonBanner: '/photos/reception-mac-nation.jpg',
  salonGallery: [
    '/photos/people/people-hero-casual.jpg',
    '/photos/reception-mac-nation.jpg',
    '/photos/people/people-waiting-casual.jpg',
    '/photos/18.jpg',
    '/photos/people/people-cut.jpg',
    '/photos/03.jpg',
    '/photos/people/people-shampoo-casual.jpg',
    '/photos/15.jpg',
    '/photos/people/people-station.jpg',
    '/photos/17.jpg',
    '/photos/people/people-barber.jpg',
    '/photos/23.jpg',
  ],
  boutique: '/photos/people/people-boutique-casual.jpg',
  plans: '/photos/people/people-waiting-casual.jpg',
  cta: '/photos/people/people-waiting-casual.jpg',
};

export const DEFAULT_SITE_CONTENT: SiteContentPayload = {
  heroTitle: 'Un lieu. Une nation. Une expérience.',
  heroCta: 'Prendre rendez-vous',
  heroSecondaryCta: 'Faire un abonnement',
  reviewsTitle: 'Une expérience saluée par nos clients',
  reviewsSubtitle: 'Les premiers retours',
  boutiqueTitle: 'Boutique capillaire',
  boutiqueText:
    'Payer par Wave, Orange Money ou Free. Retrait au salon Nord Foire.',
  boutiqueCta: 'Payer un produit',
  plansTitle: 'Abonnements',
  plansText: "Payer l'abonnement en ligne. Wave, Orange Money ou Free Money.",
  plansCta: 'Payer un abonnement',
  joinKicker: 'MAC NATION',
  joinTitle: 'Rejoindre notre équipe',
  joinText:
    'Barber, accueil ou candidature spontanée. Envoie ton CV : on lit chaque dossier à Nord Foire.',
  ctaTitle: "L'histoire s'écrit à Dakar",
  ctaItems: [
    {
      href: '/rendez-vous',
      kicker: 'En tant que client',
      title: 'Prendre rendez-vous',
      dark: false,
    },
    {
      href: '/abonnements',
      kicker: 'En tant que membre',
      title: 'Prendre un abonnement',
      dark: true,
    },
  ],
  brandKicker: 'LA MARQUE',
  brandTitle: 'Une vision dakaroise du grooming',
  brandHighlight: 'moderne.',
  brandText:
    "Plus qu'une coupe, une nation. Un salon, une boutique, des abonnements. Tout au même endroit.",
  brandValuesTitle: 'Des valeurs',
  brandValuesText:
    "MAC NATION est plus qu'un salon : c'est une vision. La diversité forge le geste. Chaque culture, chaque génération contribue. Un espace où l'effort est valorisé, à Dakar.",
  brandValues: [
    {
      title: 'Marbre et or',
      body: "Le lieu dicte le geste. Marbre noir, moulures blanches, touches d'or : un salon pensé pour durer, lisible de Nord Foire jusqu'au reste de Dakar.",
    },
    {
      title: 'Un savoir-faire',
      body: 'Accueil, diagnostic, geste. Un parcours client clair, du premier regard jusqu’au produit emporté.',
    },
    {
      title: 'Un savoir-être',
      body: "Chacun se sent à sa place. L'équipe incarne la diversité dakaroise et ouvre le salon à toutes les textures.",
    },
  ],
  brandPlaceTitle: 'Un lieu unique',
  brandPlaceText:
    "Pour le moment, un seul salon : Nord Foire, en face du service d'hygiène. Toute l'attention sur une adresse, une équipe, un standard.",
  brandOfferTitle: 'Salon, boutique, abonnement',
  brandOfferText:
    "La chaise, les produits, le rythme mensuel. On ne sépare pas la coupe de l'entretien. C'est le même univers, du rendez-vous jusqu'au kit emporté.",
  brandHistoryTitle: 'Notre histoire',
  brandHistory: [
    {
      year: '2025',
      title: "L'idée",
      body: "MAC NATION naît à Dakar d'une envie simple : un salon où la coupe, la barbe et les produits vivent sous le même toit, sans distinction de texture.",
    },
    {
      year: '2026',
      title: 'Nord Foire',
      body: "Ouverture du premier salon, en face du service d'hygiène. Un lieu unique, pensé comme un second espace de vie pour l'homme dakarois.",
    },
  ],
  salonName: 'MAC NATION',
  salonKicker: 'LE SALON',
  salonTitle: 'MAC NATION Nord Foire',
  salonSubtitle:
    "Le premier salon. Le seul, pour le moment. Dakar, en face du service d'hygiène.",
  salonText:
    'Marbre noir, moulures blanches, or sur les consoles. Nos barbers maîtrisent fades, barbe et coupes pour tous les types de cheveux. Lavabo, soins, boutique capillaire sur place. Abonnements pour ceux qui veulent un rythme, pas une surprise.',
  salonCta: 'Réserver',
  salonGalleryTitle: 'Quelques images',
  salonAddress: "Nord Foire, en face du service d'hygiène",
  salonCity: 'Dakar',
  salonCountry: 'Sénégal',
  salonHours: 'Lun–Sam 10h–21h · Dim 12h–20h',
  salonPhone: '+221 77 000 00 00',
  reviews: REVIEWS,
  images: DEFAULT_SITE_IMAGES,
};

export function findJob(id: string) {
  return JOBS.find((item) => item.id === id);
}
