import Image from "next/image";

export default function CatalogImage({
  src,
  alt,
  sizes = "360px",
}: {
  src: string;
  alt: string;
  sizes?: string;
}) {
  const remoteApi = src.startsWith("/api/");
  if (remoteApi) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
    );
  }
  return <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} />;
}
