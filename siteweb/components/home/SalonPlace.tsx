import CatalogImage from "@/components/CatalogImage";
import SalonGallery from "@/components/home/SalonGallery";
import Link from "next/link";
import { ArrowSquareOut, Clock, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import { salonInfo } from "@/lib/assets";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content";

function mapsUrls(query: string) {
  const q = encodeURIComponent(query);
  return {
    open: `https://www.google.com/maps/search/?api=1&query=${q}`,
    embed: `https://maps.google.com/maps?q=${q}&z=16&output=embed`,
  };
}

export default function SalonPlace({
  kicker = DEFAULT_SITE_CONTENT.salonKicker,
  title = DEFAULT_SITE_CONTENT.salonTitle,
  subtitle = DEFAULT_SITE_CONTENT.salonSubtitle,
  text = DEFAULT_SITE_CONTENT.salonText,
  cta = DEFAULT_SITE_CONTENT.salonCta,
  galleryTitle = DEFAULT_SITE_CONTENT.salonGalleryTitle,
  address = salonInfo.address,
  city = salonInfo.city,
  country = salonInfo.country,
  hours = salonInfo.hours,
  phone = DEFAULT_SITE_CONTENT.salonPhone,
  banner = DEFAULT_SITE_CONTENT.images.salonBanner,
  gallery = DEFAULT_SITE_CONTENT.images.salonGallery,
}: {
  kicker?: string;
  title?: string;
  subtitle?: string;
  text?: string;
  cta?: string;
  galleryTitle?: string;
  address?: string;
  city?: string;
  country?: string;
  hours?: string;
  phone?: string;
  banner?: string;
  gallery?: readonly string[] | string[];
}) {
  const maps = mapsUrls(`${address}, ${city}, ${country}`);

  return (
    <section id="salon" className="w-full scroll-mt-28 px-6 pb-4">
      <div className="mx-auto max-w-[1200px]">
        <header className="mx-auto mb-10 max-w-[40rem] text-center">
          <p className="text-xs tracking-[0.22em] text-[#e0b12c]">{kicker}</p>
          <h2 className="title1 mt-3 text-4xl sm:text-5xl md:text-6xl">{title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-400 md:text-base">{subtitle}</p>
        </header>

        <div className="relative aspect-[16/10] w-full min-w-0 overflow-hidden rounded-2xl sm:aspect-[16/9] md:aspect-[16/8]">
          <CatalogImage src={banner} alt={title} sizes="100vw" />
        </div>

        <div className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <p className="max-w-[65ch] text-sm leading-relaxed text-gray-400">{text}</p>
            <Link
              href="/rendez-vous"
              className="btn-gold mt-8 inline-flex h-11 cursor-pointer items-center rounded-lg px-8 text-sm transition-all"
            >
              {cta}
            </Link>
          </div>
          <aside className="rounded-2xl bg-black p-6">
            <p className="flex items-start gap-2 text-sm text-white/80">
              <MapPin size={18} className="mt-0.5 shrink-0" />
              <span>
                {address}
                <br />
                {city}, {country}
              </span>
            </p>
            <p className="mt-4 flex items-start gap-2 text-sm text-white/60">
              <Clock size={18} className="mt-0.5 shrink-0" />
              {hours}
            </p>
            {phone ? (
              <p className="mt-4 flex items-start gap-2 text-sm text-white/80">
                <Phone size={18} className="mt-0.5 shrink-0" />
                <a className="hover:text-[#e0b12c]" href={`tel:${phone.replace(/\s/g, "")}`}>
                  {phone}
                </a>
              </p>
            ) : null}
          </aside>
        </div>

        <div className="overflow-hidden rounded-2xl bg-black ring-1 ring-black/10">
          <iframe
            title={`Carte ${title}`}
            src={maps.embed}
            className="h-72 w-full border-0 sm:h-96"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <p className="text-sm text-white">
              {address}, {city}
            </p>
            <a
              href={maps.open}
              target="_blank"
              rel="noreferrer"
              className="btn-gold inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium"
            >
              Ouvrir dans Google Maps
              <ArrowSquareOut size={16} />
            </a>
          </div>
        </div>

        <div className="pb-8 pt-16">
          <h3 className="font-bebas text-4xl text-black">{galleryTitle}</h3>
          <div className="mt-6">
            <SalonGallery images={gallery} />
          </div>
        </div>
      </div>
    </section>
  );
}
