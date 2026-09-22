export const photos = {
  hero: "/photos/02.jpg",
  reception: "/photos/reception-mac-nation.jpg",
  receptionAlt: "/photos/reception-alt-mac-nation.jpg",
  aisle: "/photos/03.jpg",
  aisleWide: "/photos/07.jpg",
  waiting: "/photos/01.jpg",
  stations: "/photos/04.jpg",
  stationsClose: "/photos/13.jpg",
  stationsGold: "/photos/18.jpg",
  client: "/photos/12.jpg",
  clientChair: "/photos/19.jpg",
  brandWall: "/photos/10.jpg",
  fullSalon: "/photos/16.jpg",
  fullSalonAlt: "/photos/05.jpg",
  pedicure: "/photos/08.jpg",
  boutique: "/photos/15.jpg",
  boutiqueDesk: "/photos/14.jpg",
  wallDetail: "/photos/11.jpg",
  lounge: "/photos/17.jpg",
  line: "/photos/20.jpg",
  receptionGold: "/photos/reception-gold-mac-nation.jpg",
  corridor: "/photos/23.jpg",
  stationOne: "/photos/09.jpg",
} as const;

export const people = {
  hero: "/photos/people/people-hero-casual.jpg",
  cut: "/photos/people/people-cut.jpg",
  reception: "/photos/people/people-reception-match.jpg",
  waiting: "/photos/people/people-waiting-casual.jpg",
  boutique: "/photos/people/people-boutique-casual.jpg",
  client: "/photos/people/people-client-casual.jpg",
  station: "/photos/people/people-station.jpg",
  barber: "/photos/people/people-barber.jpg",
  shampoo: "/photos/people/people-shampoo-casual.jpg",
  enfant: "/photos/people/people-enfant.jpg",
  domicile: "/photos/people/people-domicile.jpg",
} as const;

export const assets = {
  hero: people.hero,
  reviewsCharacter: people.client,
  hairs: photos.brandWall,
  mood: photos.fullSalon,
  salon: photos.reception,
  boutique: people.boutique,
  gallery: [
    people.hero,
    photos.reception,
    people.waiting,
    photos.stationsGold,
    people.cut,
    photos.aisle,
    people.shampoo,
    photos.boutique,
    people.station,
    photos.lounge,
    people.barber,
    photos.corridor,
  ],
};

export const pageImages = {
  brand: people.reception,
  boutique: people.boutique,
  abonnements: people.waiting,
  services: people.cut,
  contact: people.reception,
  blog: people.hero,
  career: people.barber,
  salon: photos.fullSalon,
} as const;

export const navLinks = [
  { href: "/the-brand", label: "La marque" },
  { href: "/services", label: "Catalogue" },
  { href: "/salon", label: "Le salon" },
  { href: "/boutique", label: "Boutique" },
  { href: "/abonnements", label: "Abonnements" },
  { href: "/blog", label: "Blog" },
] as const;

export const salonInfo = {
  name: "MAC NATION Nord Foire",
  slug: "nord-foire",
  address: "Nord Foire, en face du service d'hygiène",
  city: "Dakar",
  country: "Sénégal",
  hours: "Lun-Sam 10h-21h · Dim 12h-20h",
};
