export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "https://mac-nation.vercel.app";
}
