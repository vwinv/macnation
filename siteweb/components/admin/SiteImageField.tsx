"use client";

import { useRef, useState } from "react";
import ImageCropDialog from "@/components/admin/ImageCropDialog";
import type { ImageCropSpec } from "@/lib/site-content";

export default function SiteImageField({
  label,
  hint,
  src,
  fallback,
  spec,
  onChange,
  layout = "field",
  clickToChange = true,
}: {
  label: string;
  hint?: string;
  src: string;
  fallback: string;
  spec: ImageCropSpec;
  onChange: (url: string) => void;
  layout?: "field" | "mosaic" | "tile";
  clickToChange?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localSrc, setLocalSrc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(blob: Blob) {
    setBusy(true);
    setError("");
    try {
      const payload = new FormData();
      payload.append("photo", blob, "site.jpg");
      const res = await fetch("/api/admin/site-content/photo", { method: "POST", body: payload });
      const json = (await res.json().catch(() => null)) as { url?: string; error?: string; message?: string } | null;
      if (!res.ok || !json?.url) {
        setError(json?.error || json?.message || "Envoi Cloudinary impossible.");
        return;
      }
      onChange(json.url);
      setLocalSrc("");
    } catch {
      setError("Envoi Cloudinary impossible.");
    } finally {
      setBusy(false);
    }
  }

  const mosaic = layout === "mosaic";
  const tile = layout === "tile";
  const overlay = mosaic || tile;

  const overlayControls = (
    <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 bg-gradient-to-b from-black/75 to-transparent p-2.5">
      <p className="text-[11px] font-medium text-white">{label}</p>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-8 cursor-pointer rounded-lg bg-white/95 px-2.5 text-xs font-medium text-black"
        >
          {busy ? "Envoi…" : "Changer"}
        </button>
        {src !== fallback ? (
          <button
            type="button"
            onClick={() => onChange(fallback)}
            className="h-8 cursor-pointer rounded-lg bg-black/60 px-2.5 text-xs text-white"
          >
            Défaut
          </button>
        ) : null}
      </div>
    </div>
  );

  const fileAndDialog = (
    <>
      {error ? <p className={`text-sm text-red-300 ${tile ? "absolute bottom-2 left-2 z-10 rounded bg-black/70 px-2 py-1" : ""}`}>{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (file.size > 5_000_000) {
            setError("Photo trop lourde. Maximum 5 Mo.");
            return;
          }
          setError("");
          setLocalSrc(URL.createObjectURL(file));
        }}
      />
      {localSrc ? (
        <ImageCropDialog
          src={localSrc}
          spec={spec}
          title={label}
          busy={busy}
          onCancel={() => {
            URL.revokeObjectURL(localSrc);
            setLocalSrc("");
          }}
          onConfirm={(blob) => void upload(blob)}
        />
      ) : null}
    </>
  );

  if (tile) {
    return (
      <div className="group absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
        {clickToChange ? (
          <button
            type="button"
            aria-label={label}
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 z-10 cursor-pointer"
          />
        ) : null}
        {overlayControls}
        {fileAndDialog}
      </div>
    );
  }

  return (
    <div className={mosaic ? "grid gap-1" : "grid gap-2"}>
      {mosaic ? null : (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-black">{label}</p>
            <p className="text-xs text-gray-400">
              {hint ? `${hint} · ` : ""}
              Format {spec.ratio} · {spec.width} × {spec.height}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-9 cursor-pointer rounded-lg bg-gray-900 px-3 text-sm text-black ring-1 ring-black/10 hover:bg-gray-200"
            >
              Changer
            </button>
            {src !== fallback ? (
              <button
                type="button"
                onClick={() => onChange(fallback)}
                className="h-9 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:bg-black/5 hover:text-black"
              >
                Défaut
              </button>
            ) : null}
          </div>
        </div>
      )}
      <div
        className={`group relative overflow-hidden bg-black ${mosaic ? "rounded-xl" : "rounded-xl ring-1 ring-black/10"}`}
        style={{ aspectRatio: `${spec.aspect}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
        {overlay ? overlayControls : (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
            {spec.ratio} · {spec.width} × {spec.height}
          </span>
        )}
      </div>
      {fileAndDialog}
    </div>
  );
}
