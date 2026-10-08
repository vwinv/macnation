import Image from "next/image";

export function isRemoteImage(src: string) {
  return /^https?:\/\//i.test(src) || src.startsWith("//") || src.startsWith("/api/");
}

export default function CatalogImage({
  src,
  alt,
  sizes = "360px",
  className = "object-cover",
  priority = false,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const url = src.trim();
  if (!url) return null;
  if (isRemoteImage(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={alt} className={`absolute inset-0 h-full w-full ${className}`} />
    );
  }
  return <Image src={url} alt={alt} fill priority={priority} className={className} sizes={sizes} />;
}
