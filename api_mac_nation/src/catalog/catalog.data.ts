export type CatalogService = {
  id: string;
  name: string;
  duration: string;
  description: string;
  category: string;
  image: string;
  price: number | null;
  priceLabel: string | null;
};

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
};

export type CatalogPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  featured: boolean;
  perks: string[];
  visits: number;
  boutiquePercent: number;
};

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

export const SERVICES: CatalogService[] = [
  {
    id: 'coupe',
    name: 'Coupe',
    duration: '30 min',
    description:
      'Diagnostic, coupe adaptée à votre morphologie et à votre texture. Fades, dégradés, coupes longues.',
    category: 'Signature',
    image: '/photos/people/people-cut.jpg',
    price: 5000,
    priceLabel: null,
  },
  {
    id: 'barbe',
    name: 'Barbe',
    duration: '20 min',
    description:
      'Taille, contour et finitions. Une barbe structurée, alignée avec votre coupe.',
    category: 'Signature',
    image: '/photos/people/people-station.jpg',
    price: 3000,
    priceLabel: null,
  },
  {
    id: 'combo',
    name: 'Coupe + Barbe',
    duration: '45 min',
    description:
      'Le rituel MAC NATION. Un look cohérent, de la coupe jusqu’au dernier poil.',
    category: 'Signature',
    image: '/photos/people/people-client-casual.jpg',
    price: 7000,
    priceLabel: null,
  },
  {
    id: 'soin',
    name: 'Soin capillaire',
    duration: '25 min',
    description:
      'Hydratation et réparation pensées pour le climat de Dakar. Diagnostic sur place.',
    category: 'Soins',
    image: '/photos/people/people-shampoo-casual.jpg',
    price: 4000,
    priceLabel: null,
  },
  {
    id: 'coloration',
    name: 'Coloration',
    duration: '45 min',
    description:
      'Couverture, nuances et teintures maîtrisées, cheveux et barbe.',
    category: 'Soins',
    image: '/photos/people/people-barber.jpg',
    price: 8000,
    priceLabel: null,
  },
  {
    id: 'locks',
    name: 'Locks',
    duration: '60 min',
    description:
      'Départ de locks ou reprises au crochet. Patience, précision, savoir-faire dédié.',
    category: 'Soins',
    image: '/photos/people/people-station.jpg',
    price: null,
    priceLabel: 'Sur devis',
  },
  {
    id: 'coupe-enfant',
    name: 'Coupe enfant',
    duration: '20 min',
    description:
      'Moins de 12 ans. Fade, dégradé ou coupe simple, avec patience. Le premier regard compte autant que le geste.',
    category: 'Enfants',
    image: '/photos/people/people-enfant.jpg',
    price: 3500,
    priceLabel: null,
  },
  {
    id: 'coupe-ado',
    name: 'Coupe ado',
    duration: '25 min',
    description:
      '12 à 16 ans. La coupe qu’il a vue, adaptée à sa texture et à sa tête. Même exigence qu’en chaise adulte.',
    category: 'Enfants',
    image: '/photos/people/people-enfant.jpg',
    price: 4000,
    priceLabel: null,
  },
  {
    id: 'domicile',
    name: 'Coiffure à domicile',
    duration: '45–60 min',
    description:
      'Le barber vient chez vous, à Dakar. Coupe, barbe ou combo. Déplacement 2 000 F. Créneau à confirmer.',
    category: 'Domicile',
    image: '/photos/people/people-domicile.jpg',
    price: 8000,
    priceLabel: 'à partir de 8 000 F',
  },
];

export const PRODUCTS: CatalogProduct[] = [
  {
    id: 'pommade',
    name: 'Pommade Hold',
    category: 'Coiffage',
    description:
      'Tenue mate, flexible. Pour fades et textures courtes qui doivent tenir toute la journée.',
    price: 5000,
    image: '/images/product-pomade.png',
  },
  {
    id: 'huile-barbe',
    name: 'Huile barbe',
    category: 'Barbe',
    description:
      'Nourrit sans graisser. Parfum discret, pensé pour le climat chaud.',
    price: 6500,
    image: '/images/product-beard-oil.png',
  },
  {
    id: 'shampoing',
    name: 'Shampoing daily',
    category: 'Soin',
    description:
      'Lavage fréquent sans assécher. Convient aux cheveux afro, bouclés et lisses.',
    price: 7000,
    image: '/images/product-shampoo.png',
  },
  {
    id: 'spray',
    name: 'Spray texture',
    category: 'Coiffage',
    description: 'Volume et grip léger. À vaporiser avant de sculpter.',
    price: 4500,
    image: '/images/product-spray.png',
  },
  {
    id: 'kit',
    name: 'Kit Nation',
    category: 'Coffret',
    description:
      'Shampoing, pommade et huile barbe. Le trio pour tenir un mois entre deux visites.',
    price: 18000,
    image: '/images/product-kit.png',
  },
];

export const PLANS: CatalogPlan[] = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    price: 15000,
    period: 'par mois',
    featured: false,
    perks: [
      '2 coupes par mois',
      'Priorité sur les créneaux du soir',
      '10% sur la boutique',
    ],
    visits: 2,
    boutiquePercent: 10,
  },
  {
    id: 'signature',
    name: 'Signature',
    price: 28000,
    period: 'par mois',
    featured: true,
    perks: [
      '4 visites coupe + barbe',
      'Diagnostic à chaque passage',
      '15% sur la boutique',
      'Rappel WhatsApp J-1',
    ],
    visits: 4,
    boutiquePercent: 15,
  },
  {
    id: 'nation',
    name: 'Nation',
    price: 45000,
    period: 'par mois',
    featured: false,
    perks: [
      '4 visites coupe + barbe + soin',
      'Barber attitré selon disponibilités',
      '20% sur la boutique',
      'Invité : 1 coupe offerte par trimestre',
    ],
    visits: 4,
    boutiquePercent: 20,
  },
];

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

export function findService(id: string) {
  const resolved = resolveServiceId(id);
  return SERVICES.find((item) => item.id === resolved);
}

export function findProduct(id: string) {
  const resolved = resolveProductId(id);
  return PRODUCTS.find((item) => item.id === resolved);
}

export function findPlan(id: string) {
  return PLANS.find((item) => item.id === id);
}

export function findArticle(id: string) {
  return ARTICLES.find((item) => item.id === id);
}

export function findJob(id: string) {
  return JOBS.find((item) => item.id === id);
}
