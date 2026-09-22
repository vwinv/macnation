import Image from "next/image";
import Reveal from "@/components/Reveal";
import { people, photos } from "@/lib/assets";

const mosaic = [
  {
    src: people.cut,
    alt: "Coupe en station chez MAC NATION",
    className: "col-span-12 min-h-[280px] sm:min-h-[340px] md:col-span-7 md:min-h-[420px]",
  },
  {
    src: photos.stations,
    alt: "Postes de coupe, marbre et or",
    className: "col-span-6 min-h-[200px] sm:min-h-[240px] md:col-span-5 md:min-h-[420px]",
  },
  {
    src: people.client,
    alt: "Client au salon Nord Foire",
    className: "col-span-6 min-h-[200px] sm:min-h-[240px] md:col-span-4 md:min-h-[320px]",
  },
  {
    src: people.waiting,
    alt: "Espace d'attente MAC NATION",
    className: "col-span-12 min-h-[220px] sm:min-h-[260px] md:col-span-8 md:min-h-[320px]",
  },
] as const;

export default function AllBlackSalon() {
  return (
    <section className="w-full px-4 py-10 sm:px-8 lg:py-12">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <header className="mx-auto mb-10 max-w-[38rem] text-center md:mb-14">
            <h2 className="title1 text-5xl md:text-6xl lg:text-7xl">
              MAC NATION
              <span className="mt-2 block text-[0.72em] font-normal tracking-wide text-[#e0b12c]">
                Marbre, or, lumière
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-[46ch] text-sm leading-relaxed text-gray-400 md:text-base">
              Marbre noir, moulures blanches, touches d&apos;or. Un second lieu de vie dédié à l&apos;homme, en face
              du service d&apos;hygiène, au cœur de Nord Foire.
            </p>
          </header>
        </Reveal>

        <div className="grid grid-cols-12 gap-2.5 sm:gap-3">
          {mosaic.map((shot, i) => (
            <Reveal key={shot.src} delay={i * 0.06} className={`${shot.className} h-full`}>
              <div className="relative h-full w-full overflow-hidden rounded-xl">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  sizes="(max-width:768px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mx-auto my-16 h-px w-24 bg-[#e0b12c]/70 md:my-20" />

        <Reveal>
          <h3 className="title1 text-center text-4xl md:text-5xl">
            Un salon pour <span className="text-[#e0b12c]">Tous</span>
          </h3>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <article>
              <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-xl">
                <Image
                  src={people.barber}
                  alt="Barber MAC NATION, tous types de cheveux"
                  fill
                  sizes="(max-width:1024px) 100vw, 50vw"
                  className="object-cover object-top"
                />
              </div>
              <h4 className="text-xl font-semibold text-black">Tous types de cheveux</h4>
              <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-gray-400">
                Afro, bouclés, lisses, locks. Aucune distinction de texture. Le diagnostic d&apos;abord, le geste
                ensuite.
              </p>
            </article>
          </Reveal>
          <Reveal delay={0.08}>
            <article>
              <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-xl">
                <Image
                  src={photos.fullSalon}
                  alt="Plateau MAC NATION, Nord Foire"
                  fill
                  sizes="(max-width:1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <h4 className="text-xl font-semibold text-black">Un plateau pensé pour le confort</h4>
              <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-gray-400">
                Accueil, chaises, lavabo, soins. Chaque station a été dessinée pour le geste, la lumière et le
                calme.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
