export type SocialProvider = "google" | "apple";

export function detectDeviceAuth(): { primary: SocialProvider; order: SocialProvider[]; hint: string } {
  if (typeof navigator === "undefined") {
    return {
      primary: "google",
      order: ["google", "apple"],
      hint: "Connecte-toi avec le compte de ton appareil.",
    };
  }

  const ua = navigator.userAgent || "";
  const android = /Android/i.test(ua);
  const iPhone = /iPhone|iPod/i.test(ua);
  const iPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const mac = /Macintosh/i.test(ua) && navigator.maxTouchPoints <= 1;
  const appleDevice = iPhone || iPad || mac;

  if (appleDevice) {
    return {
      primary: "apple",
      order: ["apple", "google"],
      hint: iPhone || iPad
        ? "Ton iPhone peut te connecter avec Apple."
        : "Ton Mac peut te connecter avec Apple.",
    };
  }
  if (android) {
    return {
      primary: "google",
      order: ["google", "apple"],
      hint: "Ton Android peut te connecter avec Google.",
    };
  }
  return {
    primary: "google",
    order: ["google", "apple"],
    hint: "Ton navigateur peut te connecter avec Google.",
  };
}

export function oauthPublicConfig() {
  const google = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
  const apple = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || process.env.APPLE_CLIENT_ID || "";
  return {
    google: google || "",
    apple: apple || "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
  };
}
