"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ImageCropSpec } from "@/lib/site-content";

type CropN = { x: number; y: number; w: number; h: number };
type Handle = "move" | "nw" | "ne" | "sw" | "se";

function maxCrop(imageAspect: number, targetAspect: number): CropN {
  if (imageAspect > targetAspect) {
    const w = targetAspect / imageAspect;
    return { x: (1 - w) / 2, y: 0, w, h: 1 };
  }
  const h = imageAspect / targetAspect;
  return { x: 0, y: (1 - h) / 2, w: 1, h };
}

function heightFromWidth(w: number, imageAspect: number, targetAspect: number) {
  return (w * imageAspect) / targetAspect;
}

function clampCrop(crop: CropN, imageAspect: number, targetAspect: number): CropN {
  let { x, y, w } = crop;
  const minW = targetAspect < 1 ? 0.22 : 0.16;
  w = Math.max(minW, Math.min(1, w));
  let h = heightFromWidth(w, imageAspect, targetAspect);
  if (h > 1) {
    h = 1;
    w = (h * targetAspect) / imageAspect;
  }
  x = Math.min(Math.max(0, x), 1 - w);
  y = Math.min(Math.max(0, y), 1 - h);
  return { x, y, w, h };
}

function displayedImage(naturalW: number, naturalH: number, stageW: number, stageH: number) {
  if (!stageW || !stageH) return { x: 0, y: 0, w: 0, h: 0 };
  const imageAspect = naturalW / naturalH;
  const stageAspect = stageW / stageH;
  if (imageAspect > stageAspect) {
    const w = stageW;
    const h = w / imageAspect;
    return { x: 0, y: (stageH - h) / 2, w, h };
  }
  const h = stageH;
  const w = h * imageAspect;
  return { x: (stageW - w) / 2, y: 0, w, h };
}

const HANDLE_CLASS: Record<Exclude<Handle, "move">, string> = {
  nw: "-left-2 -top-2 cursor-nwse-resize",
  ne: "-right-2 -top-2 cursor-nesw-resize",
  sw: "-bottom-2 -left-2 cursor-nesw-resize",
  se: "-bottom-2 -right-2 cursor-nwse-resize",
};

export default function ImageCropDialog({
  src,
  spec,
  title,
  busy = false,
  onCancel,
  onConfirm,
}: {
  src: string;
  spec: ImageCropSpec;
  title: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState<CropN>({ x: 0, y: 0, w: 1, h: 1 });

  const imageAspect = natural.w / natural.h;
  const fit = useCallback(
    (next: CropN) => clampCrop(next, imageAspect, spec.aspect),
    [imageAspect, spec.aspect],
  );

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => {
      const w = image.naturalWidth || 1;
      const h = image.naturalHeight || 1;
      setNatural({ w, h });
      setCrop(maxCrop(w / h, spec.aspect));
      setReady(true);
    };
    image.src = src;
  }, [src, spec.aspect]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const apply = () => {
      const box = el.getBoundingClientRect();
      if (box.width && box.height) setStageSize({ w: box.width, h: box.height });
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ready]);

  const disp = displayedImage(natural.w, natural.h, stageSize.w, stageSize.h);
  const box = {
    left: disp.x + crop.x * disp.w,
    top: disp.y + crop.y * disp.h,
    width: crop.w * disp.w,
    height: crop.h * disp.h,
  };

  function onPointerDown(handle: Handle, event: React.PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    const start = crop;
    const originX = event.clientX;
    const originY = event.clientY;
    const dispW = disp.w;
    const dispH = disp.h;
    if (!dispW || !dispH) return;

    const move = (next: PointerEvent) => {
      const dx = (next.clientX - originX) / dispW;
      const dy = (next.clientY - originY) / dispH;
      if (handle === "move") {
        setCrop(fit({ ...start, x: start.x + dx, y: start.y + dy }));
        return;
      }
      let w = start.w;
      let x = start.x;
      let y = start.y;
      if (handle === "se") w = start.w + dx;
      else if (handle === "ne") {
        w = start.w + dx;
        y = start.y + start.h - heightFromWidth(w, imageAspect, spec.aspect);
      } else if (handle === "sw") {
        w = start.w - dx;
        x = start.x + start.w - w;
      } else {
        w = start.w - dx;
        x = start.x + start.w - w;
        y = start.y + start.h - heightFromWidth(w, imageAspect, spec.aspect);
      }
      setCrop(fit({ x, y, w, h: heightFromWidth(w, imageAspect, spec.aspect) }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function confirm() {
    const image = imageRef.current;
    if (!image || !ready) return;
    const sx = crop.x * natural.w;
    const sy = crop.y * natural.h;
    const sw = crop.w * natural.w;
    const sh = crop.h * natural.h;
    const canvas = document.createElement("canvas");
    canvas.width = spec.width;
    canvas.height = spec.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, spec.width, spec.height);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" onClick={onCancel}>
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-gray-950 p-5 ring-1 ring-black/10 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.18em] text-[#e0b12c]">RECADRAGE</p>
            <h2 className="font-bebas mt-1 text-3xl text-black">{title}</h2>
            <p className="mt-1 text-sm text-gray-400">
              Le cadre est calé sur le bloc {spec.ratio} ({spec.width} × {spec.height} px).
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="h-9 cursor-pointer rounded-lg px-3 text-sm text-gray-400 hover:bg-black/5 hover:text-black"
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-start">
          <div ref={stageRef} className="relative h-[min(42vh,340px)] touch-none overflow-hidden rounded-xl bg-black">
            {ready ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imageRef}
                src={src}
                alt=""
                draggable={false}
                className="absolute max-w-none select-none"
                style={{ left: disp.x, top: disp.y, width: disp.w, height: disp.h }}
              />
            ) : (
              <p className="absolute inset-0 grid place-items-center text-sm text-gray-400">Chargement…</p>
            )}
            {ready && disp.w ? (
              <div
                className="absolute cursor-grab overflow-visible active:cursor-grabbing"
                style={{
                  left: box.left,
                  top: box.top,
                  width: box.width,
                  height: box.height,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)",
                }}
                onPointerDown={(event) => onPointerDown("move", event)}
              >
                <div className="pointer-events-none absolute inset-0 ring-2 ring-[#e0b12c]">
                  <div className="absolute inset-y-0 left-1/3 w-px bg-white/35" />
                  <div className="absolute inset-y-0 left-2/3 w-px bg-white/35" />
                  <div className="absolute inset-x-0 top-1/3 h-px bg-white/35" />
                  <div className="absolute inset-x-0 top-2/3 h-px bg-white/35" />
                </div>
                <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#e0b12c] px-2.5 py-1 text-[11px] font-medium text-black shadow">
                  {spec.ratio} · {spec.width} × {spec.height}
                </div>
                {(["nw", "ne", "sw", "se"] as const).map((handle) => (
                  <div
                    key={handle}
                    role="presentation"
                    aria-hidden
                    className={`absolute z-10 h-4 w-4 rounded-[2px] bg-[#e0b12c] ring-2 ring-black ${HANDLE_CLASS[handle]}`}
                    onPointerDown={(event) => onPointerDown(handle, event)}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3">
            <p className="text-xs tracking-[0.16em] text-gray-400">APERÇU DU BLOC</p>
            <div
              className="relative overflow-hidden rounded-xl bg-black ring-1 ring-black/10"
              style={{ aspectRatio: `${spec.aspect}` }}
            >
              {ready ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="absolute max-w-none select-none"
                  style={{
                    width: `${100 / crop.w}%`,
                    height: `${100 / crop.h}%`,
                    left: `${(-crop.x / crop.w) * 100}%`,
                    top: `${(-crop.y / crop.h) * 100}%`,
                  }}
                />
              ) : null}
            </div>
            <p className="text-xs text-gray-400">Taille visible : {spec.ratio}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 cursor-pointer rounded-lg px-4 text-sm text-gray-400 hover:bg-black/5 hover:text-black"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!ready || busy}
            onClick={confirm}
            className="btn-gold h-11 cursor-pointer rounded-lg px-5 text-sm font-medium disabled:opacity-50"
          >
            {busy ? "Envoi…" : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
}
