import type { Metadata } from "next";
import Link from "next/link";
import LegalArticle from "@/components/LegalArticle";

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };

export default function CguPage() {
  return (
    <LegalArticle title="CGU" subtitle="Conditions générales d'utilisation du site MAC NATION.">
      <h2>Objet</h2>
      <p>
        Les CGU encadrent l&apos;accès au site MAC NATION (consultation, réservation, paiement, candidature). L&apos;achat de
        prestations et de produits est aussi soumis aux <Link href="/cgv">CGV</Link>.
      </p>
      <h2>Accès</h2>
      <p>
        Le site est accessible 24h/24, sauf maintenance. MAC NATION peut modifier, suspendre ou arrêter une fonction sans
        préavis. L&apos;usage est réservé à un usage personnel et non frauduleux.
      </p>
      <h2>Compte et backoffice</h2>
      <p>
        L&apos;espace /admin est réservé à l&apos;équipe du salon. Toute tentative d&apos;accès non autorisé est interdite.
      </p>
      <h2>Contenu</h2>
      <p>
        Tu t&apos;engages à fournir des informations exactes (identité, téléphone, adresse). Les candidatures doivent
        correspondre à la personne qui postule. MAC NATION peut refuser une réservation ou une commande en cas
        d&apos;information fausse ou d&apos;usage abusif.
      </p>
      <h2>Paiement en ligne</h2>
      <p>
        Le paiement Mobile Money est opéré par PayTech. MAC NATION ne stocke pas tes codes secrets Wave, Orange Money ou
        Free Money.
      </p>
      <h2>Données</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{" "}
        <Link href="/privacy">politique de confidentialité</Link>.
      </p>
      <h2>Loi</h2>
      <p>Les CGU sont régies par le droit sénégalais.</p>
    </LegalArticle>
  );
}
