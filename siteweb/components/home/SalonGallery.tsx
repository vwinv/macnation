import CatalogImage from "@/components/CatalogImage";
import type { ReactNode } from "react";

export const SALON_GALLERY_TILES = [
  "col-span-12 min-h-[220px] sm:min-h-[280px] md:col-span-8 md:min-h-[380px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[380px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[280px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[280px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[280px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-5 md:min-h-[320px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-7 md:min-h-[320px]",
  "col-span-12 min-h-[200px] sm:min-h-[240px] md:col-span-6 md:min-h-[300px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-6 md:min-h-[300px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[260px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[260px]",
  "col-span-6 min-h-[180px] sm:min-h-[220px] md:col-span-4 md:min-h-[260px]",
];

export default function SalonGallery({
  images,
  renderTile,
}: {
  images: readonly string[];
  renderTile?: (src: string, index: number) => ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 gap-2">
      {images.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={`${SALON_GALLERY_TILES[i] ?? "col-span-6 min-h-[220px] md:col-span-4"} h-full`}
        >
          <div className="relative h-full min-h-[inherit] overflow-hidden rounded-xl bg-black">
            {renderTile ? (
              renderTile(src, i)
            ) : (
              <CatalogImage
                src={src}
                alt={`MAC NATION Nord Foire, vue ${i + 1}`}
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
