import Image from "next/image";

export default function Logo({
  className = "h-10 w-10",
  title = "MAC NATION",
  priority = false,
  onDark = false,
  onLight = false,
}: {
  className?: string;
  title?: string;
  priority?: boolean;
  onDark?: boolean;
  onLight?: boolean;
}) {
  return (
    <Image
      src="/logo.png?v=gold"
      alt={title || ""}
      width={236}
      height={111}
      sizes="160px"
      unoptimized
      className={`object-contain ${
        onDark ? "brightness-0 invert" : onLight ? "brightness-0" : ""
      } ${className}`}
      priority={priority}
    />
  );
}
