"use client";

import { useEffect, useRef, useState } from "react";
import { detectDeviceAuth, type SocialProvider } from "@/lib/device-auth";

type Config = {
  google: string;
  apple: string;
  appleRedirect?: string;
  facebook: string;
  siteUrl: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: () => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void;
        signIn: () => Promise<{
          authorization?: { id_token?: string };
          user?: { email?: string; name?: { firstName?: string; lastName?: string } };
        }>;
      };
    };
    FB?: {
      init: (config: Record<string, unknown>) => void;
      login: (
        cb: (res: { authResponse?: { accessToken?: string } }) => void,
        opts: Record<string, unknown>,
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error("SCRIPT"));
    document.head.appendChild(script);
  });
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M16.7 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-1-3-1c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 3 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.2c1.1-1.2 1.5-2.4 1.5-2.5-.1 0-2.9-1.1-2.9-4.8zM14.6 6.3c.6-.8 1.1-1.9.9-3-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.3-.5 3-1.4z"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7C21.7 18.4 23 15.6 23 12.3z" />
      <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.4 1.1-3.9 1.1-3 0-5.6-2-6.5-4.8H1.7v2.9C3.6 21.3 7.5 24 12 24z" />
      <path fill="#FBBC05" d="M5.5 14.7c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7.4H1.7C.9 8.9.5 10.4.5 12.5s.4 3.6 1.2 5.1l3.8-2.9z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.3 15.1.2 12 .2 7.5.2 3.6 2.9 1.7 7.4l3.8 2.9C6.4 6.8 9 4.8 12 4.8z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M14.5 22v-8.2h2.8l.4-3.3h-3.2V8.4c0-1 .3-1.6 1.7-1.6H18V3.9c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.2H9v3.3h2.9V22h2.6z"
      />
    </svg>
  );
}

export default function SocialLogin({
  onError,
  onBusy,
  onSuccess,
  next = "/compte",
}: {
  onError: (message: string) => void;
  onBusy: (busy: boolean) => void;
  onSuccess?: () => void;
  next?: string;
}) {
  const [device, setDevice] = useState({
    primary: "google" as SocialProvider,
    order: ["google", "apple", "facebook"] as SocialProvider[],
    hint: "Connecte-toi avec le compte de ton appareil.",
  });
  const [config, setConfig] = useState<Config | null>(null);
  const googleBox = useRef<HTMLDivElement>(null);
  const appleNonce = useRef("");
  const send = useRef<(provider: SocialProvider, credential: string, nonce?: string, name?: string) => Promise<void>>(
    async () => undefined,
  );

  send.current = async (provider, credential, nonce, name) => {
    onBusy(true);
    onError("");
    try {
      const res = await fetch("/api/compte/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, credential, nonce, name }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        onError(json?.error || "Connexion impossible.");
        return;
      }
      if (onSuccess) {
        onSuccess();
        return;
      }
      window.location.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/compte");
    } catch {
      onError("Connexion interrompue. Réessaie.");
    } finally {
      onBusy(false);
    }
  };

  useEffect(() => {
    let live = true;
    fetch("/api/compte/oauth/config", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: Config) => {
        if (live) setConfig(json);
      })
      .catch(() => {
        if (live) setConfig({ google: "", apple: "", facebook: "", siteUrl: "" });
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    setDevice(detectDeviceAuth());
  }, []);

  useEffect(() => {
    if (!config) return;
    const cfg = config;
    let cancelled = false;

    async function setup() {
      if (cfg.google) {
        await loadScript("https://accounts.google.com/gsi/client", "mn-google-gsi");
        if (cancelled || !window.google || !googleBox.current) return;
        const nonce = crypto.randomUUID();
        window.google.accounts.id.initialize({
          client_id: cfg.google,
          nonce,
          auto_select: device.primary === "google",
          cancel_on_tap_outside: true,
          context: "signin",
          ux_mode: "popup",
          use_fedcm_for_prompt: true,
          callback: (res: { credential?: string }) => {
            if (res.credential) void send.current("google", res.credential, nonce);
          },
        });
        googleBox.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBox.current, {
          theme: "filled_black",
          size: "large",
          shape: "rectangular",
          text: "continue_with",
          locale: "fr",
          width: Math.max(280, Math.min(360, googleBox.current.clientWidth || 320)),
          logo_alignment: "left",
        });
        if (device.primary === "google") window.google.accounts.id.prompt();
      }

      if (cfg.apple) {
        await loadScript(
          "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/fr_FR/appleid.auth.js",
          "mn-apple-id",
        );
        if (cancelled || !window.AppleID) return;
        appleNonce.current = crypto.randomUUID();
        window.AppleID.auth.init({
          clientId: cfg.apple,
          scope: "name email",
          redirectURI: `${window.location.origin}/compte/login`,
          usePopup: true,
          nonce: appleNonce.current,
        });
      }

      if (cfg.facebook) {
        window.fbAsyncInit = () => {
          window.FB?.init({ appId: cfg.facebook, cookie: true, xfbml: false, version: "v21.0" });
        };
        await loadScript("https://connect.facebook.net/fr_FR/sdk.js", "mn-facebook-sdk");
      }
    }

    void setup();
    return () => {
      cancelled = true;
    };
  }, [config, device.primary]);

  async function start(provider: Exclude<SocialProvider, "google">) {
    onError("");
    if (!config) return;
    if (provider === "apple") {
      if (!config.apple || !window.AppleID) {
        onError("Connexion Apple pas encore activée.");
        return;
      }
      try {
        onBusy(true);
        const result = await window.AppleID.auth.signIn();
        const token = result.authorization?.id_token;
        if (!token) {
          onError("Connexion Apple annulée.");
          return;
        }
        const fullName = [result.user?.name?.firstName, result.user?.name?.lastName].filter(Boolean).join(" ");
        await send.current("apple", token, appleNonce.current, fullName);
      } catch {
        onError("Connexion Apple annulée.");
      } finally {
        onBusy(false);
      }
      return;
    }
    if (!config.facebook || !window.FB) {
      onError("Connexion Facebook pas encore activée.");
      return;
    }
    window.FB.login(
      (res) => {
        if (!res.authResponse?.accessToken) {
          onError("Connexion Facebook annulée.");
          return;
        }
        void send.current("facebook", res.authResponse.accessToken);
      },
      { scope: "email,public_profile" },
    );
  }

  function googleFallback() {
    if (!config?.google || !window.google) {
      onError("Connexion Google pas encore activée.");
      return;
    }
    window.google.accounts.id.prompt();
  }

  const others = device.order.filter((item) => item !== device.primary);

  function button(provider: SocialProvider, primary: boolean) {
    if (provider === "google") {
      return (
        <div key="google" className={primary ? "w-full" : ""}>
          <div
            ref={googleBox}
            className={`flex w-full justify-center overflow-hidden rounded-lg ${
              config && !config.google ? "hidden" : primary ? "min-h-12" : "min-h-11"
            }`}
          />
          {config && !config.google ? (
            <button
              type="button"
              onClick={googleFallback}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-gray-900 text-sm font-medium text-black ring-1 ring-black/10"
            >
              <GoogleMark />
              {primary ? "Continuer avec Google" : "Google"}
            </button>
          ) : null}
        </div>
      );
    }
    const className = primary
      ? `flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-lg text-sm font-medium ${
          provider === "apple" ? "bg-white text-black" : "bg-[#1877F2] text-black"
        }`
      : `flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-sm ${
          provider === "apple" ? "bg-white text-black" : "bg-[#1877F2] text-black"
        }`;
    return (
      <button key={provider} type="button" onClick={() => void start(provider)} className={className}>
        {provider === "apple" ? <AppleMark /> : <FacebookMark />}
        {primary ? (provider === "apple" ? "Continuer avec Apple" : "Continuer avec Facebook") : provider === "apple" ? "Apple" : "Facebook"}
      </button>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-gray-400">{device.hint}</p>
      <div className="mt-4">{button(device.primary, true)}</div>
      <p className="mt-4 text-center text-[11px] tracking-[0.18em] text-gray-600">AUTRES COMPTES</p>
      <div className="mt-3 grid grid-cols-2 gap-2">{others.map((provider) => button(provider, false))}</div>
    </div>
  );
}
