"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle({
  variant = "icon",
  tone = "onDark",
  className = "",
}: {
  variant?: "icon" | "pills" | "menu";
  tone?: "onDark" | "onSurface";
  className?: string;
}) {
  const { dark, setTheme, toggleTheme } = useTheme();

  if (variant === "pills") {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <div>
          <p className="text-sm font-semibold text-black">Apparence</p>
          <p className="mt-0.5 text-xs text-gray-500">{dark ? "Mode sombre" : "Mode clair"}</p>
        </div>
        <div className="flex rounded-xl bg-gray-100 p-1 ring-1 ring-black/10">
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              dark ? "bg-black text-white" : "text-gray-500 hover:text-black"
            }`}
          >
            Sombre
          </button>
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              !dark ? "bg-black text-white" : "text-gray-500 hover:text-black"
            }`}
          >
            Clair
          </button>
        </div>
      </div>
    );
  }

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm text-white transition-colors hover:bg-white/10 ${className}`}
      >
        <span>{dark ? "Mode clair" : "Mode sombre"}</span>
        {dark ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      onClick={toggleTheme}
      className={`relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full ring-1 transition-all ${
        tone === "onSurface"
          ? "text-black ring-black/15 hover:text-[#e0b12c]"
          : "text-white ring-white/20 hover:text-[#e0b12c]"
      } ${className}`}
    >
      {dark ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
    </button>
  );
}
