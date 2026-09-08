"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Film, Filter, X, Loader2, Star, Play,
  ChevronLeft, ChevronRight, Tv, Calendar,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface IndexedMovie {
  id: string;
  title: string;
  year: number | null;
  quality: string | null;
  language: string | null;
  fileSize: number | null;
  fileId: string | null;
  caption: string | null;
  poster: string | null;
  backdrop: string | null;
  rating: number | null;
  genre: string[];
  overview: string | null;
}
interface FeaturedData { latest: IndexedMovie[]; trending: IndexedMovie[]; topRated: IndexedMovie[] }

/* ─── TMDB image cache ───────────────────────────────────────────────── */
const tmdbCache = new Map<string, { poster: string | null; backdrop: string | null; overview?: string }>();

async function fetchTmdb(title: string) {
  if (tmdbCache.has(title)) return tmdbCache.get(title)!;
  try {
    const r = await fetch(`/api/tmdb/search?q=${encodeURIComponent(title)}`);
    if (!r.ok) { tmdbCache.set(title, { poster: null, backdrop: null }); return { poster: null, backdrop: null }; }
    const d = await r.json();
    const result = {
      poster:   d.poster_path   ? `https://image.tmdb.org/t/p/w342${d.poster_path}`   : null,
      backdrop: d.backdrop_path ? `https://image.tmdb.org/t/p/w1280${d.backdrop_path}` : null,
      overview: d.overview ?? undefined,
    };
    tmdbCache.set(title, result);
    return result;
  } catch { tmdbCache.set(title, { poster: null, backdrop: null }); return { poster: null, backdrop: null }; }
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const _SE_RE = /\bS(\d{1,2})E(\d{1,2})\b/i;

function isTVEpisode(title: string) { return _SE_RE.test(title); }

function getShowName(title: string) {
  const m = title.match(_SE_RE);
  if (!m) return title;
  return title.slice(0, title.search(_SE_RE)).replace(/[-_\s]+$/, "").trim();
}

function getSeasonEp(title: string): { season: number; ep: number } | null {
  const m = title.match(_SE_RE);
  return m ? { season: parseInt(m[1]), ep: parseInt(m[2]) } : null;
}

function normalizeTitle(t: string): string {
  if (isTVEpisode(t)) return getShowName(t).toLowerCase().replace(/[^a-z0-9]/g, "");
  return t.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

/** Remove duplicate titles from a list, keeping the first (best) occurrence. */
function dedupeByTitle(movies: IndexedMovie[]): IndexedMovie[] {
  const seen = new Set<string>();
  return movies.filter((m) => {
    const key = normalizeTitle(m.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function posterGradient(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = title.charCodeAt(i) + ((h << 5) - h);
  h = Math.abs(h) % 360;
  return `linear-gradient(135deg, hsl(${h},45%,14%) 0%, hsl(${(h + 40) % 360},30%,10%) 100%)`;
}

const QUALITY_COLORS: Record<string, string> = {
  "4k": "bg-yellow-500/25 text-yellow-300 border-yellow-500/40",
  "2160p": "bg-yellow-500/25 text-yellow-300 border-yellow-500/40",
  "1080p": "bg-blue-500/25 text-blue-300 border-blue-500/40",
  "720p": "bg-green-500/25 text-green-300 border-green-500/40",
  "480p": "bg-gray-500/20 text-gray-300 border-gray-500/30",
  "hdrip": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bluray": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "webrip": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "hevc": "bg-pink-500/20 text-pink-300 border-pink-500/30",
};
function qualityColor(q: string | null) {
  if (!q) return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  return QUALITY_COLORS[q.toLowerCase()] ?? "bg-purple-500/20 text-purple-300 border-purple-500/30";
}

/* ─── Movie grouping (dedup + TV show merge) ─────────────────────────── */
interface MovieGroup {
  key: string;
  primary: IndexedMovie;
  variants: IndexedMovie[];
  isTV: boolean;
  seasons: number;
  episodes: number;
}

function groupMovies(movies: IndexedMovie[]): MovieGroup[] {
  const map = new Map<string, MovieGroup>();
  for (const m of movies) {
    const key = normalizeTitle(m.title);
    if (!key || m.title === "Untitled") continue;
    const tv = isTVEpisode(m.title);
    if (!map.has(key)) {
      const se = getSeasonEp(m.title);
      map.set(key, {
        key,
        primary: m,
        variants: [m],
        isTV: tv,
        seasons: se ? se.season : 0,
        episodes: 1,
      });
    } else {
      const g = map.get(key)!;
      g.variants.push(m);
      g.episodes = g.variants.length;
      const se = getSeasonEp(m.title);
      if (se && se.season > g.seasons) g.seasons = se.season;
      if (!g.primary.poster && m.poster) g.primary = m;
    }
  }
  return Array.from(map.values());
}

const PAGE_SIZE = 50;

/* ─── TMDB navigation helper ─────────────────────────────────────────── */
async function navigateToTmdb(title: string, router: ReturnType<typeof useRouter>) {
  try {
    const r = await fetch(`/api/tmdb/search?q=${encodeURIComponent(title)}`);
    if (r.ok) {
      const d = await r.json();
      router.push(`/watch/${d.type}/${d.id}`);
      return;
    }
  } catch {}
  router.push(`/search?q=${encodeURIComponent(title)}`);
}

/* ═══════════════════════════════════════════════════════════════════════
   HERO CAROUSEL  — 9 movies, auto-rotates every 6 s
════════════════════════════════════════════════════════════════════════ */
function HeroCarousel({ movies }: { movies: IndexedMovie[] }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [backdrops, setBackdrops] = useState<Record<number, { backdrop: string | null; poster: string | null; overview?: string }>>({});
  const [navigating, setNavigating] = useState(false);
  const [direction, setDirection] = useState(1); // +1 forward, -1 backward

  const heroes = movies.slice(0, 9);

  /* auto-rotate */
  useEffect(() => {
    if (!heroes.length) return;
    const t = setInterval(() => {
      setDirection(1);
      setIdx((p) => (p + 1) % heroes.length);
    }, 6000);
    return () => clearInterval(t);
  }, [heroes.length]);

  /* Eagerly fetch ALL hero backdrops as soon as the list is known */
  useEffect(() => {
    if (!heroes.length) return;
    heroes.forEach((m, i) => {
      // If MongoDB already has the paths, use them directly
      const cachedPoster = m.poster
        ? (m.poster.startsWith("/") ? `https://image.tmdb.org/t/p/w342${m.poster}` : m.poster)
        : null;
      const cachedBackdrop = m.backdrop
        ? (m.backdrop.startsWith("/") ? `https://image.tmdb.org/t/p/w1280${m.backdrop}` : m.backdrop)
        : null;

      if (cachedBackdrop || cachedPoster) {
        setBackdrops((prev) =>
          i in prev ? prev : { ...prev, [i]: { backdrop: cachedBackdrop, poster: cachedPoster, overview: m.overview ?? undefined } }
        );
      } else {
        // Stagger requests slightly so we don't hammer TMDB all at once
        setTimeout(() => {
          fetchTmdb(isTVEpisode(m.title) ? getShowName(m.title) : m.title).then((d) => {
            setBackdrops((prev) => ({ ...prev, [i]: d }));
          });
        }, i * 120);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroes.map((h) => h.id).join(",")]); // stable dep: only re-run when movie list changes

  const go = (newIdx: number, dir: number) => {
    setDirection(dir);
    setIdx(newIdx);
  };

  const prev = () => go((idx - 1 + heroes.length) % heroes.length, -1);
  const next = () => go((idx + 1) % heroes.length, 1);

  const handleWatch = async () => {
    setNavigating(true);
    await navigateToTmdb(heroes[idx].title, router);
    setNavigating(false);
  };

  const m = heroes[idx];
  if (!m) return null;
  const bd = backdrops[idx];

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center:               { opacity: 1, x: 0 },
    exit:  (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height: "clamp(340px,58vw,620px)" }}>
      {/* Backdrop */}
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={`bg-${idx}`}
          custom={direction}
          variants={{ enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {bd?.backdrop ? (
            <img src={bd.backdrop} alt="" className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full" style={{ background: posterGradient(m.title) }} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

      {/* Thumbnail strip (right side, stacked 3 upcoming) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2">
        {[1, 2, 3].map((offset) => {
          const ni = (idx + offset) % heroes.length;
          const nm = heroes[ni];
          const nb = backdrops[ni];
          return (
            <motion.button
              key={ni}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: offset * 0.05 }}
              onClick={() => go(ni, 1)}
              className="relative w-24 rounded-lg overflow-hidden border border-white/10 hover:border-white/40 transition-all"
              style={{ aspectRatio: "16/9" }}
            >
              {nb?.backdrop ? (
                <img src={nb.backdrop.replace("w1280", "w300")} alt={nm.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-white/30 p-1 text-center" style={{ background: posterGradient(nm.title) }}>
                  {nm.title.slice(0, 20)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/30" />
            </motion.button>
          );
        })}
      </div>

      {/* Main content — slides in/out */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={`content-${idx}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 flex items-end pb-12 px-5 sm:px-10 lg:px-14"
        >
          <div className="flex items-end gap-5 max-w-xl">
            {bd?.poster && (
              <img
                src={bd.poster}
                alt={m.title}
                className="hidden sm:block rounded-xl shadow-2xl border border-white/10 flex-none"
                style={{ width: 100, aspectRatio: "2/3", objectFit: "cover" }}
              />
            )}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                {m.rating && (
                  <span className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" />{m.rating.toFixed(1)}
                  </span>
                )}
                {m.year && <span className="text-gray-300 text-sm">{m.year}</span>}
                {m.quality && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${qualityColor(m.quality)}`}>
                    {m.quality.toUpperCase()}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-xl">
                {m.title}
              </h1>
              {(bd?.overview ?? m.overview) && (
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 max-w-lg">
                  {bd?.overview ?? m.overview}
                </p>
              )}
              <button
                onClick={handleWatch}
                disabled={navigating}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-white/90 active:scale-95 transition-all text-sm shadow-xl disabled:opacity-60"
              >
                {navigating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-black" />}
                Watch Now
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Left / Right arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center hover:bg-black/80 transition-all backdrop-blur-sm z-10"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 lg:right-32 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center hover:bg-black/80 transition-all backdrop-blur-sm z-10"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {heroes.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i, i > idx ? 1 : -1)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === idx ? 20 : 6,
              height: 6,
              background: i === idx ? "#fff" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HORIZONTAL ROW CAROUSEL
════════════════════════════════════════════════════════════════════════ */
function MovieRow({ title, movies }: { title: string; movies: IndexedMovie[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 380 : -380, behavior: "smooth" });
  };
  if (!movies.length) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-4 sm:px-6 lg:px-8">
        <h2 className="text-white font-bold text-base sm:text-lg">{title}</h2>
        <div className="flex gap-1">
          {(["left", "right"] as const).map((d) => (
            <button key={d} onClick={() => scroll(d)} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              {d === "left" ? <ChevronLeft className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-2" style={{ scrollbarWidth: "none" }}>
        {movies.map((m, i) => (
          <RowCard key={m.id} movie={m} index={i} />
        ))}
      </div>
    </div>
  );
}

function RowCard({ movie, index }: { movie: IndexedMovie; index: number }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);
  const [poster, setPoster] = useState<string | null>(
    movie.poster ? (movie.poster.startsWith("/") ? `https://image.tmdb.org/t/p/w342${movie.poster}` : movie.poster) : null
  );
  const [imgErr, setImgErr] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (poster || fetched.current) return;
    const obs = new IntersectionObserver((e) => {
      if (e[0].isIntersecting && !fetched.current) {
        fetched.current = true;
        setLoading(true);
        fetchTmdb(movie.title).then((d) => { setPoster(d.poster); setLoading(false); });
      }
    }, { rootMargin: "200px" });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const handleClick = async () => {
    await navigateToTmdb(isTVEpisode(movie.title) ? getShowName(movie.title) : movie.title, router);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.35 }}
      onClick={handleClick}
      className="group cursor-pointer flex-none w-32 sm:w-36 md:w-40"
    >
      <div className="relative w-full overflow-hidden rounded-xl border border-white/[0.07] group-hover:border-white/30 transition-all duration-300" style={{ aspectRatio: "2/3", background: posterGradient(movie.title) }}>
        {loading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white/30 animate-spin" /></div>}
        {poster && !imgErr ? (
          <img src={poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={() => setImgErr(true)} loading="lazy" />
        ) : !loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 gap-1.5">
            {isTVEpisode(movie.title) ? <Tv className="w-6 h-6 text-white/20" /> : <Film className="w-6 h-6 text-white/20" />}
            <span className="text-white/35 text-[9px] text-center leading-tight line-clamp-3">{movie.title}</span>
          </div>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        {movie.rating && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-black/70 rounded px-1 py-0.5">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
            <span className="text-[9px] font-bold text-yellow-300">{movie.rating.toFixed(1)}</span>
          </div>
        )}
        {movie.quality && (
          <div className={`absolute top-1.5 right-1.5 px-1 py-0.5 rounded text-[8px] font-bold border ${qualityColor(movie.quality)}`}>{movie.quality.toUpperCase()}</div>
        )}
        <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <Play className="w-4 h-4 text-black fill-black ml-0.5" />
          </div>
        </div>
      </div>
      <div className="mt-1.5 px-0.5">
        <h3 className="text-white text-[11px] font-semibold leading-tight line-clamp-2">{isTVEpisode(movie.title) ? getShowName(movie.title) : movie.title}</h3>
        {movie.year && <span className="text-gray-500 text-[9px]">{movie.year}</span>}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   GRID CARD (search/filter section)
════════════════════════════════════════════════════════════════════════ */
function GridCard({ group, index }: { group: MovieGroup; index: number }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);
  const { primary, variants, isTV, seasons, episodes } = group;
  const allQualities = Array.from(new Set(variants.map((v) => v.quality).filter(Boolean) as string[]));
  const [poster, setPoster] = useState<string | null>(
    primary.poster ? (primary.poster.startsWith("/") ? `https://image.tmdb.org/t/p/w342${primary.poster}` : primary.poster) : null
  );
  const [imgErr, setImgErr] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (poster || fetched.current) return;
    const obs = new IntersectionObserver((e) => {
      if (e[0].isIntersecting && !fetched.current) {
        fetched.current = true;
        fetchTmdb(isTV ? getShowName(primary.title) : primary.title).then((d) => {
          if (d.poster) setPoster(d.poster);
        });
      }
    }, { rootMargin: "300px" });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const handleClick = async () => {
    setNavigating(true);
    await navigateToTmdb(isTV ? getShowName(primary.title) : primary.title, router);
    setNavigating(false);
  };

  const displayTitle = isTV ? getShowName(primary.title) : primary.title;
  const size = formatSize(primary.fileSize);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.45), duration: 0.35, ease: "easeOut" }}
      className="group rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all duration-300 flex flex-col cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative overflow-hidden" style={{ background: posterGradient(primary.title), aspectRatio: "2/3" }}>
        {poster && !imgErr ? (
          <img src={poster} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={() => setImgErr(true)} loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-2">
            {isTV ? <Tv className="w-7 h-7 text-white/20" /> : <Film className="w-7 h-7 text-white/20" />}
            <span className="text-white/35 text-xs text-center font-medium leading-tight line-clamp-3">{displayTitle}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        {primary.rating && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm border border-white/10 rounded px-1.5 py-0.5">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-bold text-yellow-300">{primary.rating.toFixed(1)}</span>
          </div>
        )}
        {/* TV badge */}
        {isTV && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-blue-500/80 backdrop-blur-sm rounded px-1.5 py-0.5">
            <Tv className="w-2.5 h-2.5 text-white" />
            <span className="text-[9px] font-bold text-white">{seasons > 0 ? `S${seasons}` : "TV"}</span>
          </div>
        )}
        {!isTV && primary.quality && (
          <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold border ${qualityColor(primary.quality)}`}>
            {primary.quality.toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 p-4">
          {navigating ? (
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200">
                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              </div>
              <div className="text-white text-xs font-semibold text-center leading-tight line-clamp-2">{displayTitle}</div>
            </>
          )}
        </div>
        {/* Multiple files badge */}
        {variants.length > 1 && !isTV && (
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm border border-white/10 rounded px-1.5 py-0.5">
            <span className="text-[9px] font-bold text-white/70">{variants.length} versions</span>
          </div>
        )}
        {isTV && episodes > 1 && (
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm border border-white/10 rounded px-1.5 py-0.5">
            <span className="text-[9px] font-bold text-white/70">{episodes} eps</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-2.5 gap-1">
        <h3 className="text-white text-xs font-semibold leading-tight line-clamp-2">{displayTitle}</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {primary.year && <span className="text-gray-500 text-[10px]">{primary.year}</span>}
          {isTV && seasons > 0 && (
            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Calendar className="w-2.5 h-2.5" />{seasons} {seasons === 1 ? "Season" : "Seasons"}
            </span>
          )}
          {!isTV && primary.language && (
            <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{primary.language}</span>
          )}
          {size && !isTV && <span className="text-[10px] text-gray-600 ml-auto">{size}</span>}
        </div>
        {!isTV && allQualities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {allQualities.slice(0, 4).map((q) => (
              <span key={q} className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${qualityColor(q)}`}>{q.toUpperCase()}</span>
            ))}
            {allQualities.length > 4 && <span className="text-[9px] text-gray-500 self-center">+{allQualities.length - 4}</span>}
          </div>
        )}
        {isTV && seasons > 0 && (
          <div className="text-[9px] text-gray-600 mt-auto">{episodes} episode{episodes !== 1 ? "s" : ""} indexed</div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════ */
export default function IndexedMoviesPage({ botUsername }: { botUsername: string }) {
  const [featured, setFeatured] = useState<FeaturedData | null>(null);
  const [movies, setMovies] = useState<IndexedMovie[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [gridLoading, setGridLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [qualityFilter, setQualityFilter] = useState("All");
  const [langFilter, setLangFilter] = useState("All");
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* Featured movies for hero + rows */
  useEffect(() => {
    fetch("/api/movies/featured")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setFeatured(d))
      .catch(() => {});
  }, []);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMovies = useCallback(async (pageNum: number, replace: boolean) => {
    if (replace) setGridLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(pageNum) });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (qualityFilter !== "All") params.set("quality", qualityFilter);
      if (langFilter !== "All") params.set("language", langFilter);
      const r = await fetch(`/api/movies?${params}`);
      const data = await r.json();
      const items: IndexedMovie[] = data.items ?? [];
      setTotal(data.total ?? 0);
      setMovies((prev) => replace ? items : [...prev, ...items]);
    } finally {
      setGridLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, qualityFilter, langFilter]);

  useEffect(() => {
    setPage(1);
    fetchMovies(1, true);
  }, [debouncedSearch, qualityFilter, langFilter, fetchMovies]);

  const loadMore = useCallback(() => {
    if (loadingMore) return;
    const next = page + 1;
    setPage(next);
    fetchMovies(next, false);
  }, [page, loadingMore, fetchMovies]);

  const hasMore = movies.length < total;

  /* Infinite scroll sentinel */
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const obs = new IntersectionObserver((e) => { if (e[0].isIntersecting) loadMore(); }, { rootMargin: "500px" });
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const groups = groupMovies(movies);
  const isFiltering = !!(debouncedSearch || qualityFilter !== "All" || langFilter !== "All");

  const heroMovies = useMemo(() => {
    const combined = [
      ...(featured?.trending ?? []),
      ...(featured?.latest ?? []),
    ];
    return dedupeByTitle(combined).slice(0, 9);
  }, [featured]);

  const qualities = ["All", "1080p", "720p", "480p", "4K", "HEVC", "HDRip", "BluRay"];
  const languages = ["All", "Hindi", "English", "Tamil", "Telugu", "Malayalam", "Bengali"];

  return (
    <main className="min-h-screen pb-24">
      {/* ── Hero Carousel (hidden while filtering) ── */}
      <AnimatePresence>
        {!isFiltering && heroMovies.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <HeroCarousel movies={heroMovies} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Carousels (hidden while filtering) ── */}
      {!isFiltering && featured && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-6 space-y-1"
        >
          <MovieRow title="Latest Added" movies={dedupeByTitle(featured.latest)} />
          {featured.trending.length > 0 && <MovieRow title="Trending" movies={dedupeByTitle(featured.trending)} />}
          {featured.topRated.length > 0 && <MovieRow title="Top Rated" movies={dedupeByTitle(featured.topRated)} />}
        </motion.div>
      )}

      {/* ── Grid section ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {!isFiltering && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg sm:text-xl">All Movies</h2>
            <span className="text-gray-500 text-sm">{total.toLocaleString()} titles</span>
          </div>
        )}

        {/* Search + Filters */}
        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search movies and TV shows…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-white/25 transition-all text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            {qualities.map((q) => (
              <button key={q} onClick={() => setQualityFilter(q)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${qualityFilter === q ? "bg-red-500/20 border-red-500/50 text-red-300" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}>
                {q}
              </button>
            ))}
            <span className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />
            {languages.map((l) => (
              <button key={l} onClick={() => setLangFilter(l)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${langFilter === l ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {gridLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-white/5 animate-pulse">
                <div className="bg-white/5" style={{ aspectRatio: "2/3" }} />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-2.5 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 text-gray-500">
            <Film className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No movies found</p>
            {search && <p className="text-sm mt-1">Try a different search term</p>}
          </motion.div>
        ) : (
          <>
            {isFiltering && (
              <p className="text-gray-500 text-sm mb-4">
                {groups.length} result{groups.length !== 1 ? "s" : ""}{total > movies.length ? ` (showing ${movies.length} of ${total})` : ""}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {groups.map((g, i) => (
                <GridCard key={g.key} group={g} index={i} />
              ))}
            </div>

            {/* Infinite scroll sentinel + manual button */}
            {hasMore && (
              <div ref={sentinelRef} className="mt-10 flex flex-col items-center gap-3">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white font-medium transition-all disabled:opacity-50 text-sm"
                >
                  {loadingMore
                    ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading…</span>
                    : `Load More (${total - movies.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
