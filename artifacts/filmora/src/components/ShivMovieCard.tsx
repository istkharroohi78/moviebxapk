"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Plus, Check, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Movie, TMDB_CONFIG } from "@/lib/tmdb";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "@/lib/storage";

interface ShivMovieCardProps {
  movie: Movie;
  index?: number;
}

export default function ShivMovieCard({ movie, index = 0 }: ShivMovieCardProps) {
  const router = useRouter();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setInWatchlist(isInWatchlist(movie.id.toString(), movie.media_type || "movie"));
    const handler = () =>
      setInWatchlist(isInWatchlist(movie.id.toString(), movie.media_type || "movie"));
    window.addEventListener("watchlistUpdated", handler);
    return () => window.removeEventListener("watchlistUpdated", handler);
  }, [movie.id, movie.media_type]);

  // FTM mode always shows portrait poster cards — prefer poster_path, fall back to backdrop
  const posterUrl = movie.poster_path
    ? `${TMDB_CONFIG.posterSizes.medium}${movie.poster_path}`
    : movie.backdrop_path
    ? `${TMDB_CONFIG.backdropSizes.medium}${movie.backdrop_path}`
    : null;

  const year =
    movie.release_date?.split("-")[0] ||
    movie.first_air_date?.split("-")[0] ||
    null;

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const title = movie.title || movie.name || "Unknown";
  const watchUrl = `/watch/${movie.media_type || "movie"}/${movie.id}`;

  const navigate = (url: string) => {
    if (typeof document !== "undefined" && (document as any).startViewTransition) {
      try { (document as any).startViewTransition(() => router.push(url)); }
      catch { router.push(url); }
    } else {
      router.push(url);
    }
  };

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(movie.id.toString(), movie.media_type || "movie");
      setInWatchlist(false);
    } else {
      addToWatchlist({
        id: movie.id.toString(),
        type: (movie.media_type as "movie" | "tv") || "movie",
        title,
        overview: movie.overview,
        poster_path: movie.poster_path || "",
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        first_air_date: movie.first_air_date,
        last_played: Date.now(),
      });
      setInWatchlist(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.5), ease: "easeOut" }}
      className="group cursor-pointer flex flex-col gap-1.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(watchUrl)}
    >
      {/* ── Poster Image ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "2/3",
          borderRadius: "10px",
          boxShadow: hovered
            ? "0 12px 36px rgba(0,0,0,0.22), 0 0 0 2px var(--accent)"
            : "0 3px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.07)",
          transform: hovered ? "translateY(-3px) scale(1.015)" : "none",
          transition: "box-shadow 0.25s ease, transform 0.25s ease",
        }}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover"
            style={{
              transform: hovered ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.45s ease",
              viewTransitionName: `media-${movie.id}`,
            }}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xs text-center p-3"
            style={{ background: "rgba(0,0,0,0.06)" }}
          >
            {title}
          </div>
        )}

        {/* Dark scrim — always visible at bottom for rating */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.1) 35%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        {/* Rating badge — top left */}
        {rating && (
          <div
            className="absolute top-2 left-2 flex items-center gap-0.5"
            style={{
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "6px",
              padding: "2px 6px",
              color: "var(--accent)",
              fontSize: "10px",
              fontWeight: 900,
              lineHeight: 1.4,
            }}
          >
            <Star
              style={{ width: 9, height: 9, fill: "currentColor", marginRight: 2 }}
            />
            {rating}
          </div>
        )}

        {/* Watchlist — top right, shown on hover */}
        <div
          className="absolute top-2 right-2"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? "scale(1)" : "scale(0.8)",
            transition: "opacity 0.2s, transform 0.2s",
          }}
          onClick={handleWatchlist}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: inWatchlist ? "var(--accent)" : "rgba(0,0,0,0.72)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: inWatchlist ? "#000" : "#fff",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {inWatchlist
              ? <Check style={{ width: 13, height: 13 }} />
              : <Plus style={{ width: 13, height: 13 }} />}
          </div>
        </div>

        {/* Play button — centre on hover */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        >
          <div
            onClick={(e) => { e.stopPropagation(); navigate(`${watchUrl}?resume=true`); }}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--accent)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
              transform: hovered ? "scale(1)" : "scale(0.8)",
              transition: "transform 0.2s ease",
              cursor: "pointer",
            }}
          >
            <Play style={{ width: 18, height: 18, fill: "#000", color: "#000", marginLeft: 2 }} />
          </div>
        </div>

        {/* Type badge — bottom right inside image */}
        <div
          className="absolute bottom-2 right-2"
          style={{
            background: "var(--accent)",
            color: "#000",
            fontSize: "9px",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          {movie.media_type === "tv" ? "Series" : "Film"}
        </div>
      </div>

      {/* ── Title & Meta — BELOW the poster, uses FTM dark text naturally ── */}
      <div className="flex flex-col gap-0.5 px-0.5">
        <h3
          className="font-black leading-tight line-clamp-2"
          style={{
            fontSize: "12px",
            color: "var(--foreground, #1a1a1a)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        {year && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--muted, #888)",
              letterSpacing: "0.06em",
            }}
          >
            {year}
          </span>
        )}
      </div>
    </motion.div>
  );
}
