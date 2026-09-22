import type { Metadata } from "next";
import Link from "next/link";
import LegalArticle from "@/components/LegalArticle";

export const metadata: Metadata = { title: "Politique d'envois" };

export default function EnvoisPage() {
  return (
    <LegalArticle title="Politique d'envois" subtitle="Retrait au salon, à domicile, et commandes boutique.">
      <h2>Boutique : retrait au salon</h2>
      <p>
        Les commandes boutique se retirent à MAC NATION, Nord Foire, en face du service d&apos;hygiène, Dakar. Après
        paiement, le produit est mis de côté. Présente-toi avec le nom utilisé à la commande ou la preuve de paiement.
      </p>
      <p>Délai habituel : immédiat si le produit est en stock, ou sous 48 heures si une préparation est nécessaire.</p>
      <h2>Pas de livraison colis</h2>
      <p>
        MAC NATION n&apos;expédie pas de colis pour le moment. Pas de frais de port : tu récupères au salon pendant les
        horaires d&apos;ouverture (lun-sam 10h-21h, dim 12h-20h).
      </p>
      <h2>Prestation à domicile</h2>
      <p>
        La coiffure à domicile est disponible à Dakar uniquement, avec un déplacement de 2 000 F. L&apos;adresse est demandée
        à la réservation. Le prestataire se déplace au créneau choisi. Ce n&apos;est pas un envoi de marchandise.
      </p>
      <h2>Indisponibilité</h2>
      <p>
        Si un produit n&apos;est plus en stock après paiement, nous te proposons un échange, un avoir ou un remboursement.
        Voir aussi <Link href="/retours">Retours & remboursements</Link>.
      </p>
    </LegalArticle>
  );
}
