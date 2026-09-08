"use client";

/**
 * OTT-style "new release" spotlight that sits at the very top of the home page.
 * Shows the newest titles with a glossy mirror reflection underneath, like
 * Netflix / Prime Video new-arrival shelves.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Sparkles } from "lucide-react";

export interface SpotlightItem {
  id: number;
  title: string;
  mediaType: "movie" | "tv";
  poster: string;
  backdrop: string;
  year?: string;
  rating?: number;
  overview?: string;
}

const ROTATE_MS = 6000;

export default function NewReleaseSpotlight({ items }: { items: SpotlightItem[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items || items.length === 0) return null;
  const active = items[index];

  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-10 pt-4 pb-2">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <h2 className="text-[13px] font-black uppercase tracking-[0.22em] text-amber-400">
          New Releases
        </h2>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl border border-white/10"
        style={{ background: "linear-gradient(180deg, rgba(20,20,24,0.9), rgba(8,8,10,0.95))" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {active.backdrop && (
              <Image
                src={active.backdrop}
                alt={active.title}
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-45"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 flex items-center gap-5 p-5 sm:p-7">
          {/* Poster with mirror reflection */}
          <div className="flex-shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45 }}
                className="relative"
              >
                <div className="relative w-[104px] sm:w-[132px] aspect-[2/3] rounded-2xl overflow-hidden ring-1 ring-white/15 shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
                  {active.poster && (
                    <Image src={active.poster} alt={active.title} fill sizes="140px" className="object-cover" />
                  )}
                </div>
                {/* reflection */}
                <div
                  className="relative w-[104px] sm:w-[132px] h-10 mt-[2px] rounded-b-2xl overflow-hidden pointer-events-none"
                  style={{
                    transform: "scaleY(-1)",
                    WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 85%)",
                    maskImage: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 85%)",
                  }}
                >
                  {active.poster && (
                    <Image src={active.poster} alt="" fill sizes="140px" className="object-cover object-top" />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.45 }}
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2.5 py-[3px] text-[10px] font-black uppercase tracking-widest text-white">
                  Just Added
                </span>
                <h3 className="mt-2 truncate text-xl sm:text-3xl font-black tracking-tight text-white">
                  {active.title}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-[12px] font-semibold text-gray-300">
                  {active.rating ? <span className="text-amber-400">★ {active.rating.toFixed(1)}</span> : null}
                  {active.year ? <span>{active.year}</span> : null}
                  <span className="uppercase">{active.mediaType === "tv" ? "Series" : "Movie"}</span>
                </div>
                {active.overview && (
                  <p className="mt-2 hidden sm:line-clamp-2 sm:block max-w-xl text-[13px] leading-relaxed text-gray-400">
                    {active.overview}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/watch/${active.mediaType}/${active.id}`}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-black text-white transition-transform hover:scale-105"
                    style={{ background: "linear-gradient(135deg,#FF3D3D,#FF8A00)" }}
                  >
                    <Play className="w-4 h-4 fill-white" /> Play
                  </Link>
                  <Link
                    href={`/${active.mediaType === "tv" ? "tv" : "movies"}/${active.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
                  >
                    <Info className="w-4 h-4" /> Info
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* progress dots */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 pb-4">
          {items.map((it, i) => (
            <button
              key={it.id}
              onClick={() => setIndex(i)}
              aria-label={`Show ${it.title}`}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 26 : 6,
                background: i === index ? "linear-gradient(90deg,#FF3D3D,#FFC93C)" : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
