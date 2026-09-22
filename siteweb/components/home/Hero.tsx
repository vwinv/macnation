"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { assets } from "@/lib/assets";

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduce) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.55,
      r: Math.random() * 1.4 + 0.3,
      s: Math.random() * 0.25 + 0.05,
      a: Math.random() * 0.5 + 0.15,
    }));

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      frame += 1;
      for (const p of particles) {
        p.y += p.s / 900;
        if (p.y > 0.58) p.y = 0;
        const px = p.x * width;
        const py = p.y * height;
        ctx.beginPath();
        ctx.fillStyle = `rgba(224,177,44,${p.a * (0.55 + Math.sin(frame * 0.02 + p.x * 8) * 0.35)})`;
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduce]);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}

export default function Hero() {
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = mounted && Boolean(prefersReduced);

  return (
    <div className="relative mb-2 flex min-h-[82dvh] w-full flex-col items-center justify-end overflow-hidden pb-4">
      <div className="pointer-events-none absolute top-0 left-0 z-0 h-[80vh] w-full md:h-[70vh]">
        <div className="absolute inset-0" style={{ clipPath: "polygon(0% 0%, 100% 0%, 50% 55%)" }}>
          <ParticleField />
        </div>
      </div>

      <motion.div
        className="absolute top-0 left-0 flex h-full w-full items-start justify-center overflow-hidden pt-0 sm:pt-[5%]"
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduce ? 0 : 1.4, ease: [0.16, 1, 0.3, 1], delay: reduce ? 0 : 0.35 }}
      >
        <div className="mask-radial-harsh absolute top-[28%] z-1 h-[62%] w-[92%] bg-background sm:top-[18%]" />
        <div className="relative z-2 h-[92%] w-full scale-[1.15] sm:h-[90%] sm:w-[92%] md:scale-[1.08]">
          <Image
            src={assets.hero}
            alt="Barbers et clients au salon MAC NATION, Nord Foire"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_38%]"
          />
        </div>
      </motion.div>

      <div className="relative z-10 flex max-w-full flex-col items-center justify-center pb-13 sm:pb-0">
        <motion.h1
          className="neon-text relative block max-w-full p-4 px-5 text-center text-[45px] leading-[normal] font-bebas font-bold text-white uppercase drop-shadow-[0_2px_16px_rgba(0,0,0,0.55)] sm:whitespace-pre sm:text-[55px]"
          initial={{ opacity: 0, scale: 1.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          Un lieu. Une nation. Une expérience.
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <div className="neon-card neon-card-borderOpacity1 flex w-auto flex-col items-center justify-center rounded-[16px] p-[.4rem] lg:p-[.6rem]">
              <Link
                href="/rendez-vous"
                className="bbx-shine-sweep btn-gold flex cursor-pointer items-center justify-center gap-x-3 rounded-[10px] px-3.5 py-3.5 text-md font-medium transition-all duration-300 active:scale-[0.98] sm:px-6 sm:text-lg"
              >
                Prendre rendez-vous
              </Link>
            </div>
            <Link
              href="#equipe"
              className="btn-black inline-flex h-[52px] items-center justify-center rounded-[10px] px-5 text-sm font-medium transition-all duration-300 active:scale-[0.98] sm:text-base"
            >
              Candidater
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
