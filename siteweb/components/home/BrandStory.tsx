import CatalogImage from "@/components/CatalogImage";
import Reveal from "@/components/Reveal";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content";

export default function BrandStory({
  mosaic = DEFAULT_SITE_CONTENT.images.brandMosaic.map((src, i) => ({
    src,
    alt: ["Accueil MAC NATION", "Postes de coupe", "Clients en attente", "Boutique et accueil"][i] || "MAC NATION",
  })),
  placeImage = DEFAULT_SITE_CONTENT.images.brandPlace,
  offerImage = DEFAULT_SITE_CONTENT.images.brandOffer,
  kicker = DEFAULT_SITE_CONTENT.brandKicker,
  title = DEFAULT_SITE_CONTENT.brandTitle,
  highlight = DEFAULT_SITE_CONTENT.brandHighlight,
  text = DEFAULT_SITE_CONTENT.brandText,
  values = DEFAULT_SITE_CONTENT.brandValues,
  valuesTitle = DEFAULT_SITE_CONTENT.brandValuesTitle,
  valuesText = DEFAULT_SITE_CONTENT.brandValuesText,
  placeTitle = DEFAULT_SITE_CONTENT.brandPlaceTitle,
  placeText = DEFAULT_SITE_CONTENT.brandPlaceText,
  offerTitle = DEFAULT_SITE_CONTENT.brandOfferTitle,
  offerText = DEFAULT_SITE_CONTENT.brandOfferText,
  historyTitle = DEFAULT_SITE_CONTENT.brandHistoryTitle,
  history = DEFAULT_SITE_CONTENT.brandHistory,
}: {
  mosaic?: { src: string; alt: string }[];
  placeImage?: string;
  offerImage?: string;
  kicker?: string;
  title?: string;
  highlight?: string;
  text?: string;
  values?: { title: string; body: string }[];
  valuesTitle?: string;
  valuesText?: string;
  placeTitle?: string;
  placeText?: string;
  offerTitle?: string;
  offerText?: string;
  historyTitle?: string;
  history?: { year: string; title: string; body: string }[];
}) {
  return (
    <section id="marque" className="w-full scroll-mt-28">
      <div className="mx-auto max-w-[1200px] px-6 pt-8 sm:pt-12">
        <Reveal>
          <header className="mx-auto max-w-[40rem] text-center">
            <p className="text-xs tracking-[0.22em] text-[#e0b12c]">{kicker}</p>
            <h2 className="title1 mt-3 text-4xl sm:text-5xl md:text-6xl">
              {title}
              {highlight ? (
                <>
                  {" "}
                  <span className="text-[#e0b12c]">{highlight}</span>
                </>
              ) : null}
            </h2>
            <p className="mx-auto mt-6 max-w-[60ch] text-sm leading-relaxed text-gray-400 md:text-base">{text}</p>
          </header>
        </Reveal>
      </div>

      <section className="mx-auto grid max-w-[1200px] grid-cols-2 gap-3 px-6 py-10 md:grid-cols-4">
        {mosaic.map((shot, i) => (
          <Reveal key={`${shot.src}-${i}`} delay={i * 0.05}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
              <CatalogImage src={shot.src} alt={shot.alt} sizes="25vw" />
            </div>
          </Reveal>
        ))}
      </section>

      <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-6 py-8 md:grid-cols-3">
        {values.map((item, i) => (
          <Reveal key={`${item.title}-${i}`} delay={i * 0.08} className="rounded-2xl bg-black p-8">
            <h3 className="font-bebas text-3xl text-white">{item.title}</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">{item.body}</p>
          </Reveal>
        ))}
      </section>

      <section className="mx-auto max-w-[800px] px-6 py-10 text-center">
        <Reveal>
          <h3 className="title1 text-5xl">{valuesTitle}</h3>
          <p className="mt-6 text-sm leading-relaxed text-gray-400">{valuesText}</p>
        </Reveal>
      </section>

      <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-6 py-10 md:grid-cols-2">
        <Reveal className="relative min-h-[280px] overflow-hidden rounded-2xl">
          <CatalogImage src={placeImage} alt={placeTitle} sizes="50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute right-0 bottom-0 left-0 p-8">
            <h3 className="font-bebas text-4xl text-white">{placeTitle}</h3>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-white/80">{placeText}</p>
          </div>
        </Reveal>
        <Reveal delay={0.08} className="relative min-h-[280px] overflow-hidden rounded-2xl">
          <CatalogImage src={offerImage} alt={offerTitle} sizes="50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute right-0 bottom-0 left-0 p-8">
            <h3 className="font-bebas text-4xl text-white">{offerTitle}</h3>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-white/80">{offerText}</p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[900px] px-6 py-10">
        <Reveal>
          <h3 className="title1 mb-10 text-center text-5xl">{historyTitle}</h3>
        </Reveal>
        <ol className="relative space-y-10 border-l border-[#e0b12c]/30 pl-8">
          {history.map((item, i) => (
            <Reveal key={`${item.year}-${i}`} delay={i * 0.05}>
              <li>
                <span className="absolute -left-[7px] mt-1.5 size-3 rounded-full bg-[#e0b12c]" />
                <p className="font-bebas text-2xl text-black">{item.year}</p>
                <h4 className="mt-1 text-lg font-semibold">{item.title}</h4>
                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-gray-400">{item.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>
    </section>
  );
}
