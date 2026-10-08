"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Logo from "@/components/Logo";

export default function Preloader() {
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => setMounted(true), []);
  const reduce = mounted && Boolean(prefersReduced);

  useEffect(() => {
    if (!mounted) return;
    if (reduce) {
      setVisible(false);
      return;
    }
    const fadeTimer = window.setTimeout(() => setFade(true), 1700);
    const hideTimer = window.setTimeout(() => setVisible(false), 2200);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [mounted, reduce]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black transition-opacity duration-500 ${
        fade ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="relative flex flex-col items-center" style={{ perspective: 1100 }}>
        <motion.div
          className="relative"
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateY: -220, scale: 0.45, opacity: 0 }}
          animate={{ rotateY: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="absolute -inset-8 rounded-full bg-[#e0b12c]/20 blur-2xl"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.9, 0.35], scale: [0.6, 1.15, 1] }}
            transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
          />
          <div className="relative drop-shadow-[0_0_28px_rgba(224,177,44,0.55)]">
            <Logo className="h-20 w-52" title="" priority onDark />
          </div>
        </motion.div>
        <motion.p
          className="mt-7 font-bebas text-3xl tracking-[0.22em] text-white"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          MAC NATION
        </motion.p>
      </div>
    </div>
  );
}
