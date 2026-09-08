"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { Film, Globe, Tag, Languages, TrendingUp, RefreshCw } from "lucide-react";

interface Stats {
  total: number;
  genres: { name: string; count: number }[];
  languages: { name: string; count: number }[];
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: "#0f1625",
      border: "1px solid rgba(59,130,246,0.1)",
      borderRadius: 14,
      padding: "22px 24px",
      display: "flex",
      alignItems: "center",
      gap: 16,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: `${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchStats() {
    setLoading(true);
    setError("");
    const session = await fetch("/api/admin/session");
    if (!session.ok) { router.push("/admin"); return; }
    const res = await fetch("/api/admin/stats");
    if (!res.ok) { setError("Failed to load stats"); setLoading(false); return; }
    setStats(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchStats(); }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>Overview of your platform</p>
          </div>
          <button
            onClick={fetchStats}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 80, color: "rgba(255,255,255,0.3)" }}>Loading stats...</div>
        )}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "14px 18px", color: "#f87171", marginBottom: 24 }}>
            {error}
          </div>
        )}

        {stats && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
              <StatCard icon={Film} label="Total Movies" value={stats.total.toLocaleString()} color="#3b82f6" />
              <StatCard icon={Tag} label="Genres" value={stats.genres.length} color="#8b5cf6" />
              <StatCard icon={Languages} label="Languages" value={stats.languages.length} color="#10b981" />
              <StatCard icon={Globe} label="Platform" value="Live" color="#f59e0b" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Top Genres */}
              <div style={{ background: "#0f1625", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 14, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <TrendingUp size={16} color="#8b5cf6" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Top Genres</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {stats.genres.slice(0, 10).map((g) => (
                    <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{g.name}</div>
                      <div style={{ width: 120, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min((g.count / (stats.genres[0]?.count || 1)) * 100, 100)}%`,
                          background: "linear-gradient(90deg, #8b5cf6, #6d28d9)",
                          borderRadius: 3,
                        }} />
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", width: 36, textAlign: "right" }}>{g.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Languages */}
              <div style={{ background: "#0f1625", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 14, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <Languages size={16} color="#10b981" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Top Languages</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {stats.languages.slice(0, 10).map((l) => (
                    <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{l.name}</div>
                      <div style={{ width: 120, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min((l.count / (stats.languages[0]?.count || 1)) * 100, 100)}%`,
                          background: "linear-gradient(90deg, #10b981, #059669)",
                          borderRadius: 3,
                        }} />
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", width: 36, textAlign: "right" }}>{l.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
