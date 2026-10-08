import type { Metadata } from "next";
import Link from "next/link";
import LegalArticle from "@/components/LegalArticle";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <LegalArticle title="Politique de confidentialité" subtitle="Comment MAC NATION utilise tes informations.">
      <p>
        MAC NATION traite les données nécessaires pour une réservation, une commande boutique, un abonnement, un paiement
        ou une candidature. En utilisant le site, tu acceptes cette politique.
      </p>
      <h2>Données collectées</h2>
      <p>
        Nom, téléphone, email, adresse (prestation à domicile), créneau de rendez-vous, détails de commande, informations
        de paiement transmises à PayTech, et, pour les candidatures, CV et lettre de motivation.
      </p>
      <h2>Utilisation</h2>
      <p>
        Confirmer un RDV, préparer une commande, encaisser un paiement, répondre à une candidature, t&apos;envoyer un SMS,
        un WhatsApp ou un email de confirmation, et tenir la caisse du salon.
      </p>
      <h2>Partage</h2>
      <p>
        Tes données ne sont pas vendues. Elles peuvent être transmises à PayTech pour le paiement, à Twilio pour le SMS /
        WhatsApp, et à notre hébergeur. Les dossiers de candidature sont consultables dans le backoffice du salon.
      </p>
      <h2>Durée et droits</h2>
      <p>
        Les données de rendez-vous et de caisse sont conservées le temps de la relation commerciale et des obligations
        comptables. Pour accéder, corriger ou supprimer tes informations, écris-nous via la{" "}
        <Link href="/contact">page Contact</Link> ou au salon Nord Foire.
      </p>
      <h2>Cookies</h2>
      <p>
        Le site utilise un cookie de session pour l&apos;espace client et un cookie pour
        l&apos;accès au backoffice. Aucune publicité tierce n&apos;est déposée par MAC
        NATION.
      </p>
      <h2>Connexion Google et Apple</h2>
      <p>
        Tu peux te connecter avec Google ou Apple. Seuls l&apos;identifiant du compte, l&apos;email
        (s&apos;il est fourni) et le nom sont utilisés pour créer ou retrouver ton espace client.
      </p>
    </LegalArticle>
  );
}
