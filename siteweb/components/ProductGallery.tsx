"use client";

import { useState } from "react";
import CatalogImage from "@/components/CatalogImage";

export default function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const unique = images.filter(Boolean).slice(0, 4);
  const cover = unique[0] || "";
  const single = unique.length <= 1;
  const thumbs = Array.from({ length: 4 }, (_, i) => (single ? cover : unique[i] || ""));
  const [selected, setSelected] = useState(0);
  const main = unique[Math.min(selected, Math.max(unique.length - 1, 0))] || cover;

  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 sm:grid-cols-[5rem_minmax(0,1fr)]">
      <div className="grid grid-rows-4 gap-2">
        {thumbs.map((src, index) => {
          const real = !single && Boolean(unique[index]);
          const active = real && selected === index;
          return (
            <button
              key={`${src}-${index}`}
              type="button"
              disabled={!real}
              onClick={() => setSelected(index)}
              className={`relative min-h-0 overflow-hidden rounded-lg bg-black ring-1 ${
                active ? "ring-[#e0b12c]" : "ring-black/10"
              } ${real ? "cursor-pointer" : "cursor-default grayscale"} ${
                single || !src ? "opacity-40" : ""
              }`}
            >
              {src ? <CatalogImage src={src} alt="" sizes="80px" /> : null}
            </button>
          );
        })}
      </div>
      <div className="relative aspect-square min-w-0 overflow-hidden rounded-2xl bg-black">
        {main ? <CatalogImage src={main} alt={name} sizes="(min-width: 1024px) 50vw, 100vw" /> : null}
      </div>
    </div>
  );
}
