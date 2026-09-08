"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { Search, Trash2, ChevronLeft, ChevronRight, Film, RefreshCw } from "lucide-react";
import Image from "next/image";

interface Movie {
  id: string;
  title: string;
  year: number | null;
  language: string | null;
  quality: string | null;
  rating: number | null;
  poster: string | null;
  genre: string[];
  addedAt: string;
}

interface MoviesResponse {
  items: Movie[];
  total: number;
  page: number;
  pages: number;
}

export default function MoviesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<MoviesResponse | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Movie | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const fetchMovies = useCallback(async (q: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/movies?${params}`);
    if (!res.ok) { setLoading(false); return; }
    setMovies(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/admin/session").then((r) => { if (!r.ok) router.push("/admin"); });
  }, [router]);

  useEffect(() => {
    fetchMovies(query, page);
  }, [query, page, fetchMovies]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(searchInput);
    setPage(1);
  }

  async function handleDelete(movie: Movie) {
    setDeletingId(movie.id);
    setConfirmDelete(null);
    const res = await fetch(`/api/admin/movies/${movie.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setMovies((prev) => prev ? {
        ...prev,
        items: prev.items.filter((m) => m.id !== movie.id),
        total: prev.total - 1,
      } : null);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Movies</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
              {movies ? `${movies.total.toLocaleString()} total movies` : "Loading..."}
            </p>
          </div>
          <button
            onClick={() => fetchMovies(query, page)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search movies..."
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(59,130,246,0.15)",
                borderRadius: 8,
                padding: "10px 14px 10px 36px",
                fontSize: 13,
                color: "#e2e8f0",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button type="submit" style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "rgba(59,130,246,0.2)", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Search
          </button>
        </form>

        {/* Table */}
        <div style={{ background: "#0f1625", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 12, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 80px 80px 80px 80px 80px", gap: 0, padding: "10px 16px", background: "rgba(59,130,246,0.05)", borderBottom: "1px solid rgba(59,130,246,0.08)" }}>
            {["", "Title", "Year", "Lang", "Quality", "Rating", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Loading movies...</div>
          ) : movies?.items.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,0.25)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Film size={32} style={{ opacity: 0.3 }} />
              No movies found
            </div>
          ) : (
            movies?.items.map((movie, idx) => (
              <div
                key={movie.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr 80px 80px 80px 80px 80px",
                  gap: 0,
                  padding: "10px 16px",
                  borderBottom: idx < (movies.items.length - 1) ? "1px solid rgba(255,255,255,0.04)" : "none",
                  alignItems: "center",
                  background: deletingId === movie.id ? "rgba(239,68,68,0.06)" : "transparent",
                }}
              >
                {/* Poster */}
                <div style={{ width: 32, height: 44, borderRadius: 4, overflow: "hidden", background: "rgba(255,255,255,0.06)", flexShrink: 0 }}>
                  {movie.poster ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${movie.poster}`}
                      alt={movie.title}
                      width={32}
                      height={44}
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      unoptimized
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Film size={12} style={{ opacity: 0.3 }} />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div style={{ paddingLeft: 10, overflow: "hidden" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{movie.title}</div>
                  {movie.genre.length > 0 && (
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{movie.genre.slice(0, 2).join(", ")}</div>
                  )}
                </div>

                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{movie.year ?? "—"}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{movie.language ?? "—"}</div>
                <div style={{ fontSize: 11 }}>
                  {movie.quality && (
                    <span style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                      {movie.quality}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: movie.rating ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>
                  {movie.rating ? `★ ${movie.rating.toFixed(1)}` : "—"}
                </div>

                {/* Delete */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setConfirmDelete(movie)}
                    disabled={deletingId === movie.id}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "1px solid rgba(239,68,68,0.2)",
                      background: "rgba(239,68,68,0.06)",
                      color: "rgba(239,68,68,0.6)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {movies && movies.pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              Page {movies.page} of {movies.pages}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={movies.page === 1}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(59,130,246,0.15)", background: "rgba(59,130,246,0.06)", color: movies.page === 1 ? "rgba(255,255,255,0.2)" : "#3b82f6", fontSize: 12, fontWeight: 600, cursor: movies.page === 1 ? "not-allowed" : "pointer" }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(movies.pages, p + 1))}
                disabled={movies.page === movies.pages}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(59,130,246,0.15)", background: "rgba(59,130,246,0.06)", color: movies.page === movies.pages ? "rgba(255,255,255,0.2)" : "#3b82f6", fontSize: 12, fontWeight: 600, cursor: movies.page === movies.pages ? "not-allowed" : "pointer" }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#0f1625", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 14, padding: "28px 32px", maxWidth: 380, width: "90%" }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>Delete Movie?</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 20px" }}>
              This will permanently delete <strong style={{ color: "#e2e8f0" }}>{confirmDelete.title}</strong> from the database. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
