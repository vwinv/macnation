export type AdminCatalogTab = "prestations" | "produits" | "abonnements";

export function kindTab(kind?: string | null): AdminCatalogTab {
  if (kind === "boutique") return "produits";
  if (kind === "abonnement") return "abonnements";
  return "prestations";
}

export function tabKind(tab: AdminCatalogTab) {
  if (tab === "produits") return "boutique" as const;
  if (tab === "abonnements") return "abonnement" as const;
  return "caisse" as const;
}

export function tabNote(tab: AdminCatalogTab) {
  if (tab === "produits") return "Boutique · retrait au salon Nord Foire";
  if (tab === "abonnements") return "Abonnement · valable à Nord Foire";
  return "Prestation au salon";
}

export function tabNoun(tab: AdminCatalogTab) {
  if (tab === "produits") return "produit";
  if (tab === "abonnements") return "abonnement";
  return "prestation";
}

export const CATALOG_TABS: { id: AdminCatalogTab; label: string }[] = [
  { id: "prestations", label: "Prestations" },
  { id: "produits", label: "Produits" },
  { id: "abonnements", label: "Abonnements" },
];

export function tabPickError(tab: AdminCatalogTab) {
  if (tab === "produits") return "Choisis un produit.";
  if (tab === "abonnements") return "Choisis un abonnement.";
  return "Choisis une prestation.";
}

export function tabInvoiceButton(tab: AdminCatalogTab) {
  if (tab === "produits") return "Nouvelle facture produit";
  if (tab === "abonnements") return "Nouvelle facture abonnement";
  return "Nouvelle facture prestation";
}

export function tabPayButton(tab: AdminCatalogTab) {
  if (tab === "produits") return "Encaisser un produit";
  if (tab === "abonnements") return "Encaisser un abonnement";
  return "Encaisser une prestation";
}

export function tabEmptyInvoice(tab: AdminCatalogTab) {
  if (tab === "produits") return "Aucune facture produit.";
  if (tab === "abonnements") return "Aucune facture abonnement.";
  return "Aucune facture prestation.";
}

export function tabEmptyPayment(tab: AdminCatalogTab) {
  if (tab === "produits") return "Aucun paiement produit.";
  if (tab === "abonnements") return "Aucun paiement abonnement.";
  return "Aucun paiement prestation.";
}
