import Hero from "@/components/home/Hero";
import News from "@/components/home/News";
import BrandExperience from "@/components/home/BrandExperience";
import AllBlackSalon from "@/components/home/AllBlackSalon";
import Reviews from "@/components/home/Reviews";
import OfferStrip from "@/components/home/OfferStrip";
import JoinCTA from "@/components/home/JoinCTA";
import JoinTeam from "@/components/home/JoinTeam";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Hero />
      <News />
      <BrandExperience />
      <AllBlackSalon />
      <Reviews />
      <OfferStrip />
      <JoinTeam />
      <JoinCTA />
    </main>
  );
}
