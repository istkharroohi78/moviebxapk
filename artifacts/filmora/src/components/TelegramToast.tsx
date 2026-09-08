"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { shivCredits } from "@/lib/shivCredits";

const primaryChannel = shivCredits.updatesChannels[0];

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" fill="none" className={className}>
      <circle cx="120" cy="120" r="120" fill="url(#tg-toast-g)" />
      <path
        d="M175.2 67.8L152.4 175.1c-1.7 7.5-6.2 9.4-12.6 5.8l-34.8-25.6-16.8 16.2c-1.9 1.9-3.4 3.4-6.9 3.4l2.5-35.1 63.7-57.6c2.8-2.5-.6-3.8-4.3-1.3L76.6 140.9 43.4 130.3c-7.3-2.3-7.4-7.3 1.5-10.8l121.8-47c6.1-2.2 11.4 1.5 8.5 15.3z"
        fill="white"
      />
      <defs>
        <linearGradient id="tg-toast-g" x1="120" y1="0" x2="120" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#37AEE2" />
          <stop offset="1" stopColor="#1E96C8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function TelegramToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!primaryChannel) return;
    const show = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const hide = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(hide);
  }, [visible]);

  if (!primaryChannel) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="tg-toast"
          initial={{ opacity: 0, y: 40, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 280, damping: 22, mass: 0.8 }}
          className="fixed bottom-6 right-6 z-[9999] pointer-events-none"
          style={{ maxWidth: 380 }}
        >
          <div
            className="relative overflow-hidden rounded-2xl border cursor-pointer pointer-events-auto"
            style={{
              background: "linear-gradient(135deg, rgba(10,12,20,0.98) 0%, rgba(18,26,40,0.98) 100%)",
              borderColor: "rgba(55,174,226,0.45)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(55,174,226,0.12) inset, 0 4px 20px rgba(55,174,226,0.08)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              width: 360,
            }}
            onClick={() => {
              if (primaryChannel.link) window.open(primaryChannel.link, "_blank", "noopener,noreferrer");
              setVisible(false);
            }}
          >
            {/* Top accent stripe */}
            <div
              style={{
                height: 3,
                background: "linear-gradient(90deg, #37AEE2 0%, #1E96C8 50%, transparent 100%)",
              }}
            />

            <div className="flex items-center gap-4 px-5 py-4">
              {/* Telegram Icon */}
              <TelegramIcon className="w-14 h-14 flex-shrink-0" />

              {/* Text */}
              <div className="flex flex-col flex-1 min-w-0">
                <span
                  className="font-black uppercase tracking-[0.16em]"
                  style={{ color: "#37AEE2", fontSize: 11 }}
                >
                  Join us on Telegram
                </span>
                <span
                  className="font-black leading-tight mt-0.5 truncate"
                  style={{ color: "#ffffff", fontSize: 17 }}
                >
                  {primaryChannel.name}
                </span>
                <span
                  className="font-medium mt-1 truncate"
                  style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}
                >
                  {primaryChannel.link?.replace("https://", "")}
                </span>
              </div>

              {/* Join button */}
              <div
                className="flex items-center justify-center flex-shrink-0 font-black rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #37AEE2 0%, #1E96C8 100%)",
                  color: "#ffffff",
                  fontSize: 13,
                  padding: "10px 18px",
                  boxShadow: "0 4px 16px rgba(55,174,226,0.35)",
                  letterSpacing: "0.04em",
                }}
              >
                Join →
              </div>

              {/* Close */}
              <button
                onClick={(e) => { e.stopPropagation(); setVisible(false); }}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px]"
              style={{ background: "linear-gradient(to right, #37AEE2, #1E96C8)", originX: 0 }}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 6, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
