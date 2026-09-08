"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, type Theme, type UIMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const betaThemes: {
  value: Theme;
  label: string;
  icon: string;
  description: string;
  gradient: string;
  dot: string;
}[] = [
  { value: "beta",           label: "Beta",           icon: "β",  description: "Classic cinematic black",  gradient: "from-amber-500/20 to-orange-600/20",   dot: "#ff9f1c" },
  { value: "rcb",            label: "RCB",            icon: "🏏", description: "Red · Black · Gold",       gradient: "from-red-800/30 to-yellow-700/20",     dot: "#cc2200" },
  { value: "neon-galaxy",    label: "Neon Galaxy",    icon: "🌌", description: "Purple · Blue · Pink glow",gradient: "from-purple-700/30 to-fuchsia-600/20", dot: "#d946ef" },
  { value: "ocean-pulse",    label: "Ocean Pulse",    icon: "🌊", description: "Navy · Cyan · Teal",       gradient: "from-cyan-600/30 to-teal-600/20",      dot: "#06b6d4" },
  { value: "sunset-cinema",  label: "Sunset Cinema",  icon: "🌅", description: "Orange · Pink · Red",      gradient: "from-orange-500/30 to-pink-600/20",    dot: "#f97316" },
  { value: "emerald-night",  label: "Emerald Night",  icon: "🌿", description: "Dark Green · Lime glow",   gradient: "from-emerald-700/30 to-green-600/20",  dot: "#10b981" },
];

const ftmThemes: {
  value: Theme;
  label: string;
  icon: string;
  description: string;
  dot: string;
  border: string;
  bg: string;
}[] = [
  { value: "beta",           label: "Champagne",     icon: "✦",  description: "Gold · Cream marble",      dot: "#b8860b", border: "rgba(184,134,11,0.45)", bg: "rgba(255,248,220,0.80)" },
  { value: "rcb",            label: "Crimson",       icon: "🏏", description: "Red veins in cream",       dot: "#cc2200", border: "rgba(204,34,0,0.40)",   bg: "rgba(255,242,238,0.80)" },
  { value: "neon-galaxy",    label: "Violet",        icon: "🌌", description: "Purple mist marble",       dot: "#9333ea", border: "rgba(147,51,234,0.38)", bg: "rgba(250,242,255,0.80)" },
  { value: "ocean-pulse",    label: "Aqua",          icon: "🌊", description: "Cyan tinted parchment",    dot: "#06b6d4", border: "rgba(6,182,212,0.38)",  bg: "rgba(238,252,255,0.80)" },
  { value: "sunset-cinema",  label: "Ember",         icon: "🌅", description: "Warm orange haze",         dot: "#f97316", border: "rgba(249,115,22,0.38)", bg: "rgba(255,247,237,0.80)" },
  { value: "emerald-night",  label: "Fern",          icon: "🌿", description: "Green mist parchment",     dot: "#10b981", border: "rgba(16,185,129,0.38)", bg: "rgba(240,255,248,0.80)" },
];

const modes: { value: UIMode; label: string; icon: string; desc: string }[] = [
  { value: "beta", label: "Beta", icon: "β", desc: "Dark cinematic themes" },
  { value: "shiv",  label: "Shiv",  icon: "✦", desc: "Luxury cream marble"  },
];

export default function ThemeToggle() {
  const { theme, setTheme, mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isShiv = mode === "shiv";
  const currentBetaTheme  = betaThemes.find((t) => t.value === theme) ?? betaThemes[0];
  const currentFtmTheme   = ftmThemes.find((t)  => t.value === theme) ?? ftmThemes[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleModeSwitch = (m: UIMode) => {
    setMode(m);
    if (m === "beta") setTheme(theme);
  };

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* ── Trigger ── */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-300",
          isShiv
            ? "border border-[rgba(184,134,11,0.35)] bg-[rgba(255,253,246,0.70)] text-[#1c1108] hover:bg-[rgba(255,253,246,0.90)]"
            : "border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300"
        )}
        title="Switch UI mode / theme"
        aria-label="Switch UI mode or colour theme"
      >
        {isShiv ? (
          <>
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: currentFtmTheme.dot, boxShadow: `0 0 6px ${currentFtmTheme.dot}80` }}
            />
            <span className="hidden sm:inline leading-none">FTM</span>
            {theme !== "beta" && (
              <span className="hidden sm:inline leading-none text-[10px] opacity-70">· {currentFtmTheme.label}</span>
            )}
          </>
        ) : (
          <>
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: currentBetaTheme.dot, boxShadow: `0 0 6px ${currentBetaTheme.dot}` }}
            />
            <span className="hidden sm:inline leading-none">{currentBetaTheme.label}</span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={cn(
              "absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl shadow-2xl z-[9999] overflow-hidden border",
              isShiv
                ? "bg-[rgba(255,253,246,0.98)] border-[rgba(184,134,11,0.22)]"
                : "bg-black/90 backdrop-blur-2xl border-white/10"
            )}
          >
            {/* ── UI Mode picker ── */}
            <div className="px-3 pt-3 pb-1">
              <p className={cn(
                "text-[10px] uppercase tracking-widest font-semibold mb-2 px-1",
                isShiv ? "text-[#7a6545]" : "text-gray-500"
              )}>
                UI Mode
              </p>
              <div className="grid grid-cols-2 gap-1.5 mb-1">
                {modes.map((m) => {
                  const isActive = mode === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => handleModeSwitch(m.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-center transition-all duration-200 border",
                        isActive
                          ? m.value === "shiv"
                            ? "bg-gradient-to-br from-amber-50 to-yellow-100 border-[rgba(184,134,11,0.45)] shadow-sm"
                            : "bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-white/15"
                          : isShiv
                            ? "hover:bg-[rgba(184,134,11,0.06)] border-transparent"
                            : "hover:bg-white/5 border-transparent"
                      )}
                    >
                      <span className="text-[22px] leading-none">{m.icon}</span>
                      <span className={cn(
                        "text-[11px] font-bold leading-none",
                        isActive ? (m.value === "shiv" ? "text-[#b8860b]" : "text-white") : (isShiv ? "text-[#1c1108]" : "text-gray-300")
                      )}>
                        {m.label}
                      </span>
                      <span className={cn("text-[9px] leading-tight", isShiv ? "text-[#7a6545]" : "text-gray-500")}>
                        {m.desc}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="modeCheck"
                          className={cn("text-[11px] font-bold", m.value === "shiv" ? "text-[#b8860b]" : "text-white/80")}
                        >✓</motion.span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Divider ── */}
            <div
              className="h-px w-full mx-0 my-1"
              style={{
                background: isShiv
                  ? "linear-gradient(to right, transparent, rgba(184,134,11,0.30), transparent)"
                  : "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)",
              }}
            />

            {/* ── Beta themes ── */}
            <AnimatePresence>
              {mode === "beta" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pt-1 pb-0.5">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1.5 px-1">
                      Beta Themes
                    </p>
                  </div>
                  <div className="px-2 pb-2 space-y-0.5">
                    {betaThemes.map((t) => {
                      const isActive = theme === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => { setTheme(t.value); setOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                            isActive
                              ? `bg-gradient-to-r ${t.gradient} border border-white/10`
                              : "hover:bg-white/5 border border-transparent"
                          )}
                        >
                          <span className="text-[18px] leading-none w-6 text-center">{t.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className={cn("text-[13px] font-semibold truncate", isActive ? "text-white" : "text-gray-300")}>
                              {t.label}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate">{t.description}</div>
                          </div>
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: t.dot, boxShadow: isActive ? `0 0 8px ${t.dot}` : "none" }}
                          />
                          {isActive && (
                            <motion.span layoutId="themeCheck" className="text-[14px] text-white/80 flex-shrink-0">✓</motion.span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className="h-0.5 w-full"
                    style={{ background: "linear-gradient(to right, #ff9f1c, #d4a017, #d946ef, #06b6d4, #f97316, #10b981)", opacity: 0.5 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── FTM marble themes ── */}
            <AnimatePresence>
              {mode === "shiv" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pt-1 pb-0.5">
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5 px-1" style={{ color: "#7a6545" }}>
                      Marble Palette
                    </p>
                  </div>
                  <div className="px-2 pb-3 grid grid-cols-2 gap-1.5">
                    {ftmThemes.map((t) => {
                      const isActive = theme === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => { setTheme(t.value); setOpen(false); }}
                          className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl text-center transition-all duration-200 border"
                          style={{
                            background: isActive ? t.bg : "transparent",
                            borderColor: isActive ? t.border : "transparent",
                            boxShadow: isActive ? `0 0 12px ${t.dot}20` : "none",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              (e.currentTarget as HTMLButtonElement).style.background = "rgba(184,134,11,0.05)";
                              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(184,134,11,0.20)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                              (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
                            }
                          }}
                        >
                          <span className="text-[20px] leading-none">{t.icon}</span>
                          <div className="space-y-0.5">
                            <div
                              className="text-[11px] font-bold leading-none"
                              style={{ color: isActive ? t.dot : "#1c1108" }}
                            >
                              {t.label}
                            </div>
                            <div className="text-[9px] leading-tight" style={{ color: "#7a6545" }}>
                              {t.description}
                            </div>
                          </div>
                          {isActive && (
                            <motion.span
                              layoutId="ftmThemeCheck"
                              className="text-[11px] font-bold"
                              style={{ color: t.dot }}
                            >✓</motion.span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className="h-0.5 w-full"
                    style={{ background: `linear-gradient(to right, #b8860b, #cc2200, #9333ea, #06b6d4, #f97316, #10b981)`, opacity: 0.40 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
