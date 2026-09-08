"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Sparkles, ArrowRight, Download, Zap } from "lucide-react";
import { siteConfig } from "@/lib/config";

const STORAGE_KEY = "mb-update-popup-shown";
const UPDATE_LINK = siteConfig.telegram;

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" fill="none" className={className}>
      <circle cx="120" cy="120" r="120" fill="url(#tg-grad)" />
      <path
        d="M175.2 67.8L152.4 175.1c-1.7 7.5-6.2 9.4-12.6 5.8l-34.8-25.6-16.8 16.2c-1.9 1.9-3.4 3.4-6.9 3.4l2.5-35.1 63.7-57.6c2.8-2.5-.6-3.8-4.3-1.3L76.6 140.9 43.4 130.3c-7.3-2.3-7.4-7.3 1.5-10.8l121.8-47c6.1-2.2 11.4 1.5 8.5 15.3z"
        fill="white"
      />
      <defs>
        <linearGradient id="tg-grad" x1="120" y1="0" x2="120" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#37AEE2" />
          <stop offset="1" stopColor="#1E96C8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FloatParticle({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: "#FF8A00", opacity: 0 }}
      animate={{ opacity: [0, 0.6, 0], y: [0, -28, -56], scale: [0.5, 1.1, 0.4] }}
      transition={{ duration: 2.8, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

export default function TelegramJoinModal() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    const timer = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setVisible(false);
    setDismissed(true);
  };

  const handleUpdate = () => {
    window.open(UPDATE_LINK, "_blank", "noopener,noreferrer");
    close();
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="mb-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-[6px]"
            onClick={close}
          />

          <motion.div
            key="mb-modal"
            initial={{ opacity: 0, scale: 0.86, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.8 }}
            className="fixed inset-0 z-[9991] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-sm pointer-events-auto overflow-hidden rounded-3xl border"
              style={{
                background: "var(--modal-bg)",
                borderColor: "var(--modal-border)",
                boxShadow: "0 32px 72px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset",
              }}
            >
              <FloatParticle delay={0} x="12%" y="70%" size={5} />
              <FloatParticle delay={0.7} x="80%" y="60%" size={4} />
              <FloatParticle delay={1.4} x="55%" y="80%" size={3} />
              <FloatParticle delay={2.1} x="28%" y="50%" size={4} />

              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(255,138,0,0.45) 0%, transparent 70%)" }}
              />

              <button
                onClick={close}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ background: "var(--hover-overlay)", border: "1px solid var(--modal-border)", color: "var(--muted)" }}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 p-7 pt-8">
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: "2px solid #FF8A00", opacity: 0.4 }}
                      animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div
                      className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #FF3D3D 0%, #FFC93C 100%)",
                        boxShadow: "0 8px 24px rgba(255,138,0,0.4)",
                      }}
                    >
                      <Download className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-3">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                    style={{ background: "rgba(255,138,0,0.14)", border: "1px solid rgba(255,138,0,0.35)", color: "#FFB020" }}
                  >
                    <Sparkles className="w-3 h-3" />
                    New Update Available
                  </div>
                </div>

                <h2
                  className="text-center text-[22px] font-black tracking-tight mb-2 leading-tight"
                  style={{ color: "var(--card-panel-text)" }}
                >
                  MOVIE BOX Update
                </h2>

                <p className="text-center text-[13px] leading-relaxed mb-5" style={{ color: "var(--card-panel-muted)" }}>
                  Latest MOVIE BOX update is out — faster downloads, 4K + Dolby Atmos player and daily new movies,
                  web series &amp; cartoons. Get it from Beta Bot Hub.
                </p>

                <div className="flex items-center justify-center gap-2 mb-6">
                  {[Zap, Bell, Sparkles].map((Icon, i) => (
                    <motion.div
                      key={i}
                      animate={{ rotate: [-10, 10, -10], y: [0, -3, 0] }}
                      transition={{ duration: 1.4, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "#FFB020", opacity: 0.85 }} />
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={handleUpdate}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-black text-white transition-transform duration-200 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #FF3D3D 0%, #FF8A00 100%)",
                    boxShadow: "0 10px 28px rgba(255,61,61,0.35)",
                  }}
                >
                  <TelegramIcon className="w-5 h-5" />
                  Update Now
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={close}
                  className="w-full mt-3 text-[12px] font-semibold"
                  style={{ color: "var(--card-panel-muted)" }}
                >
                  Maybe later
                </button>

                <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: "var(--card-panel-muted)" }}>
                  {siteConfig.brandBy}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
