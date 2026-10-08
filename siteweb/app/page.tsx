import Hero from "@/components/home/Hero";
import BrandStory from "@/components/home/BrandStory";
import SalonPlace from "@/components/home/SalonPlace";
import OfferStrip from "@/components/home/OfferStrip";
import JoinCTA from "@/components/home/JoinCTA";
import { getSiteContent } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getSiteContent();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Hero
        title={content.heroTitle}
        cta={content.heroCta}
        secondaryCta={content.heroSecondaryCta}
        image={content.images.hero}
      />
      <BrandStory
        mosaic={[
          { src: content.images.brandMosaic[0], alt: "Accueil MAC NATION" },
          { src: content.images.brandMosaic[1], alt: "Postes de coupe" },
          { src: content.images.brandMosaic[2], alt: "Clients en attente" },
          { src: content.images.brandMosaic[3], alt: "Boutique et accueil" },
        ]}
        placeImage={content.images.brandPlace}
        offerImage={content.images.brandOffer}
        kicker={content.brandKicker}
        title={content.brandTitle}
        highlight={content.brandHighlight}
        text={content.brandText}
        values={content.brandValues}
        valuesTitle={content.brandValuesTitle}
        valuesText={content.brandValuesText}
        placeTitle={content.brandPlaceTitle}
        placeText={content.brandPlaceText}
        offerTitle={content.brandOfferTitle}
        offerText={content.brandOfferText}
        historyTitle={content.brandHistoryTitle}
        history={content.brandHistory}
      />
      <SalonPlace
        kicker={content.salonKicker}
        title={content.salonTitle}
        subtitle={content.salonSubtitle}
        text={content.salonText}
        cta={content.salonCta}
        galleryTitle={content.salonGalleryTitle}
        address={content.salonAddress}
        city={content.salonCity}
        country={content.salonCountry}
        hours={content.salonHours}
        phone={content.salonPhone}
        banner={content.images.salonBanner}
        gallery={content.images.salonGallery}
      />
      <OfferStrip
        boutiqueTitle={content.boutiqueTitle}
        boutiqueText={content.boutiqueText}
        boutiqueCta={content.boutiqueCta}
        plansTitle={content.plansTitle}
        plansText={content.plansText}
        plansCta={content.plansCta}
        boutiqueImage={content.images.boutique}
        plansImage={content.images.plans}
      />
      <JoinCTA title={content.ctaTitle} items={content.ctaItems} image={content.images.cta} />
    </main>
  );
}
