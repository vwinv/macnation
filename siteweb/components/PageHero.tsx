import Image from "next/image";
import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";

export default function PageHero({
  kicker,
  title,
  subtitle,
  image,
  plain = false,
  overlay = "default",
}: {
  kicker?: string;
  title?: ReactNode;
  subtitle?: string;
  image?: string;
  plain?: boolean;
  overlay?: "default" | "black-white" | "photo";
}) {
  const showImage = Boolean(image) && !plain && overlay !== "black-white";
  const blackWhite = overlay === "black-white";
  const photo = overlay === "photo";
  return (
    <header
      className={`relative flex w-full flex-col items-center overflow-hidden px-6 pt-32 text-center ${
        plain
          ? "justify-center bg-white pb-12"
          : blackWhite
            ? "hero-fade-black-white min-h-[70dvh] justify-end pb-20 sm:min-h-[76dvh]"
            : photo
              ? "min-h-[48dvh] justify-end bg-white pb-5 sm:min-h-[54dvh] sm:pb-6"
              : "min-h-[48dvh] justify-end bg-white pb-12 sm:min-h-[54dvh]"
      }`}
    >
      {showImage && image ? (
        <>
          <Image src={image} alt="" fill priority className="object-cover object-[50%_42%]" sizes="100vw" />
          {photo ? null : (
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-black/35" />
          )}
        </>
      ) : null}
      {kicker || title || subtitle ? (
        <div
          className={`z-10 flex flex-col items-center ${
            photo ? "absolute inset-x-0 bottom-0 px-6 pb-5 sm:pb-6" : "relative"
          }`}
        >
          {kicker ? (
            <span className="mb-5 rounded-[14px] border-[0.5px] border-[#e0b12c]/40 px-4 py-2 text-sm font-medium text-black">
              {kicker}
            </span>
          ) : null}
          {title ? (
            <Reveal>
              <h1
                className={`title1 max-w-4xl text-5xl sm:text-6xl md:text-7xl ${
                  blackWhite || photo ? "!text-white" : ""
                }`}
              >
                {title}
              </h1>
            </Reveal>
          ) : null}
          {subtitle ? (
            <Reveal delay={0.08}>
              <p className="mt-6 max-w-[60ch] text-sm leading-relaxed text-gray-600 md:text-base">{subtitle}</p>
            </Reveal>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
