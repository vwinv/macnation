import { people, photos, salonInfo } from "./assets";

export const salon = {
  ...salonInfo,
  image: photos.reception,
};

export type Article = {
  slug: string;
  title: string;
  category: "Nos actus" | "Guides et Conseils" | "Tendance" | "Lifestyle";
  date: string;
  dateIso: string;
  excerpt: string;
  image: string;
};

export const articles: Article[] = [
  {
    slug: "ouverture-mac-nation-nord-foire",
    title: "MAC NATION ouvre à Nord Foire",
    category: "Nos actus",
    date: "12 août 2026",
    dateIso: "2026-08-12",
    excerpt:
      "Le premier salon MAC NATION est ouvert à Dakar, Nord Foire, en face du service d'hygiène. Un lieu, une coupe, une nation.",
    image: people.reception,
  },
  {
    slug: "fade-dakar-ce-qui-marche-en-2026",
    title: "Le fade à Dakar : ce qui marche en 2026",
    category: "Tendance",
    date: "4 août 2026",
    dateIso: "2026-08-04",
    excerpt:
      "Dégradé bas, texture sur le dessus, ligne nette. Nos barbers décryptent les coupes qui tiennent dans la chaleur dakaroise.",
    image: people.cut,
  },
  {
    slug: "routine-capillaire-homme-dakar",
    title: "Routine capillaire homme à Dakar",
    category: "Guides et Conseils",
    date: "28 juillet 2026",
    dateIso: "2026-07-28",
    excerpt:
      "Soleil, poussière, humidité. Comment laver, hydrater et fixer sans alourdir, avec les produits de la boutique MAC NATION.",
    image: people.boutique,
  },
  {
    slug: "abonnements-pourquoi-ca-change-tout",
    title: "Pourquoi un abonnement change votre rythme",
    category: "Lifestyle",
    date: "18 juillet 2026",
    dateIso: "2026-07-18",
    excerpt:
      "Deux ou quatre visites par mois, sans négocier le créneau. L'abonnement MAC NATION est pensé pour ceux qui ne laissent plus la coupe au hasard.",
    image: people.waiting,
  },
];

export const reviews = [
  { name: "Cheikh Diop", flag: "🇸🇳", text: "Première visite à Nord Foire, coupe nette et accueil au top. Je reviens." },
  { name: "Moussa Ndiaye", flag: "🇸🇳", text: "Le fade est propre, l'ambiance est calme. On se sent bien dès l'entrée." },
  { name: "Ibrahima Sarr", flag: "🇸🇳", text: "Barbe et coupe dans le même geste. Diagnostic clair, résultat nickel." },
  { name: "Omar Ba", flag: "🇸🇳", text: "Enfin un salon à Dakar qui prend tous les types de cheveux au sérieux." },
  { name: "Awa Fall", flag: "🇸🇳", text: "J'y ai emmené mon fils. Écoute, patience, coupe nickel. Merci à l'équipe." },
  { name: "Mamadou Kane", flag: "🇸🇳", text: "L'abonnement Signature me simplifie la vie. Je ne cherche plus de créneau à la dernière minute." },
  { name: "Pape Sow", flag: "🇸🇳", text: "Boutique bien fournie. J'ai pris l'huile barbe, ça sent propre sans être trop fort." },
  { name: "Abdoulaye Faye", flag: "🇸🇳", text: "Nord Foire, en face du service d'hygiène, facile à trouver. Service premium sans chichi." },
];

export const services = [
  {
    id: "coupe",
    name: "Coupe",
    duration: "30 min",
    price: "5 000 F",
    description: "Diagnostic, coupe adaptée à votre morphologie et à votre texture. Fades, dégradés, coupes longues.",
    image: people.cut,
  },
  {
    id: "barbe",
    name: "Barbe",
    duration: "20 min",
    price: "3 000 F",
    description: "Taille, contour et finitions. Une barbe structurée, alignée avec votre coupe.",
    image: people.station,
  },
  {
    id: "combo",
    name: "Coupe + Barbe",
    duration: "45 min",
    price: "7 000 F",
    description: "Le rituel MAC NATION. Un look cohérent, de la coupe jusqu'au dernier poil.",
    image: people.client,
  },
  {
    id: "soin",
    name: "Soin capillaire",
    duration: "25 min",
    price: "4 000 F",
    description: "Hydratation et réparation pensées pour le climat de Dakar. Diagnostic sur place.",
    image: people.shampoo,
  },
  {
    id: "coloration",
    name: "Coloration",
    duration: "45 min",
    price: "8 000 F",
    description: "Couverture, nuances et teintures maîtrisées, cheveux et barbe.",
    image: people.barber,
  },
  {
    id: "locks",
    name: "Locks",
    duration: "60 min",
    price: "Sur devis",
    description: "Départ de locks ou reprises au crochet. Patience, précision, savoir-faire dédié.",
    image: people.station,
  },
  {
    id: "coupe-enfant",
    name: "Coupe enfant",
    duration: "20 min",
    price: "3 500 F",
    tag: "Enfants",
    description: "Moins de 12 ans. Fade, dégradé ou coupe simple, avec patience. Le premier regard compte autant que le geste.",
    image: people.enfant,
  },
  {
    id: "coupe-ado",
    name: "Coupe ado",
    duration: "25 min",
    price: "4 000 F",
    tag: "Enfants",
    description: "12 à 16 ans. La coupe qu'il a vue, adaptée à sa texture et à sa tête. Même exigence qu'en chaise adulte.",
    image: people.enfant,
  },
  {
    id: "domicile",
    name: "Coiffure à domicile",
    duration: "45–60 min",
    price: "à partir de 8 000 F",
    tag: "Domicile",
    description:
      "Le barber vient chez vous, à Dakar. Coupe, barbe ou combo. Déplacement 2 000 F. Créneau à confirmer.",
    image: people.cut,
  },
];

export const products = [
  {
    id: "pommade",
    name: "Pommade Hold",
    price: "5 000 F",
    tag: "Coiffage",
    description: "Tenue mate, flexible. Pour fades et textures courtes qui doivent tenir toute la journée.",
    image: "/images/product-pomade.png",
  },
  {
    id: "huile-barbe",
    name: "Huile barbe",
    price: "6 500 F",
    tag: "Barbe",
    description: "Nourrit sans graisser. Parfum discret, pensé pour le climat chaud.",
    image: "/images/product-beard-oil.png",
  },
  {
    id: "shampoing",
    name: "Shampoing daily",
    price: "7 000 F",
    tag: "Soin",
    description: "Lavage fréquent sans assécher. Convient aux cheveux afro, bouclés et lisses.",
    image: "/images/product-shampoo.png",
  },
  {
    id: "spray",
    name: "Spray texture",
    price: "4 500 F",
    tag: "Coiffage",
    description: "Volume et grip léger. À vaporiser avant de sculpter.",
    image: "/images/product-spray.png",
  },
  {
    id: "kit",
    name: "Kit Nation",
    price: "18 000 F",
    tag: "Coffret",
    description: "Shampoing, pommade et huile barbe. Le trio pour tenir un mois entre deux visites.",
    image: "/images/product-kit.png",
  },
];

export const plans = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: "15 000 F",
    period: "par mois",
    highlight: false,
    points: ["2 coupes par mois", "Priorité sur les créneaux du soir", "10% sur la boutique"],
    visits: 2,
    boutiquePercent: 10,
  },
  {
    id: "signature",
    name: "Signature",
    price: "28 000 F",
    period: "par mois",
    highlight: true,
    points: ["4 visites coupe + barbe", "Diagnostic à chaque passage", "15% sur la boutique", "Rappel WhatsApp J-1"],
    visits: 4,
    boutiquePercent: 15,
  },
  {
    id: "nation",
    name: "Nation",
    price: "45 000 F",
    period: "par mois",
    highlight: false,
    points: [
      "4 visites coupe + barbe + soin",
      "Barber attitré selon disponibilités",
      "20% sur la boutique",
      "Invité : 1 coupe offerte par trimestre",
    ],
    visits: 4,
    boutiquePercent: 20,
  },
];

export const timeline = [
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
];

export const jobs = [
  {
    id: "barber",
    track: "Barber",
    title: "Barber / Coiffeur barbier",
    location: "Nord Foire, Dakar",
    type: "CDI",
    blurb: "Maîtrise de tous types de cheveux, culture du diagnostic, exigence du geste. On forme, on exige, on avance ensemble.",
  },
  {
    id: "barber-senior",
    track: "Barber",
    title: "Barber senior",
    location: "Nord Foire, Dakar",
    type: "CDI",
    blurb: "Prendre le lead sur le plateau, transmettre les standards, garder le niveau à chaque chaise.",
  },
  {
    id: "accueil",
    track: "Accueil",
    title: "Hôte / Hôtesse d'accueil",
    location: "Nord Foire, Dakar",
    type: "CDI",
    blurb: "Premier regard, premier mot. Gérer le flux, la boutique et les abonnements avec calme.",
  },
  {
    id: "spontanee",
    track: "Accueil",
    title: "Candidature spontanée",
    location: "Nord Foire, Dakar",
    type: "Ouvert",
    blurb: "Tu ne vois pas le poste exact : envoie ton CV. On te recontacte si le profil correspond.",
  },
];
