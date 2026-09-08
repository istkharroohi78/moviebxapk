"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { Eye, EyeOff, Copy, Check, Search } from "lucide-react";

const SENSITIVE_PATTERNS = ["TOKEN", "SECRET", "KEY", "HASH", "PASSWORD", "URI", "MONGO", "API_ID"];

function isSensitive(key: string) {
  return SENSITIVE_PATTERNS.some((p) => key.toUpperCase().includes(p));
}

export default function EnvPage() {
  const router = useRouter();
  const [env, setEnv] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function load() {
      const session = await fetch("/api/admin/session");
      if (!session.ok) { router.push("/admin"); return; }
      const res = await fetch("/api/admin/env");
      if (res.ok) setEnv(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  function copyValue(key: string, val: string) {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const entries = Object.entries(env)
    .filter(([k]) => !filter || k.toLowerCase().includes(filter.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));

  const categories = {
    "NEXT_PUBLIC": entries.filter(([k]) => k.startsWith("NEXT_PUBLIC")),
    "TELEGRAM / BOT": entries.filter(([k]) => ["TELEGRAM", "API_ID", "API_HASH", "INDEX", "ADMIN", "BOT_"].some((p) => k.startsWith(p))),
    "DATABASE": entries.filter(([k]) => ["MONGO", "DATABASE", "DB_"].some((p) => k.includes(p))),
    "OTHER": entries.filter(([k]) =>
      !k.startsWith("NEXT_PUBLIC") &&
      !["TELEGRAM", "API_ID", "API_HASH", "INDEX", "ADMIN", "BOT_"].some((p) => k.startsWith(p)) &&
      !["MONGO", "DATABASE", "DB_"].some((p) => k.includes(p))
    ),
  };

  const renderRow = ([key, value]: [string, string]) => {
    const sensitive = isSensitive(key);
    const show = revealed[key];
    const isCopied = copied === key;
    return (
      <div
        key={key}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 28px 28px",
          gap: 8,
          alignItems: "center",
          padding: "8px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ fontFamily: "monospace", fontSize: 12, color: sensitive ? "rgba(239,68,68,0.7)" : "rgba(59,130,246,0.8)", wordBreak: "break-all" }}>
          {key}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.5)", wordBreak: "break-all" }}>
          {sensitive && !show ? "••••••••" : value || <span style={{ opacity: 0.3 }}>empty</span>}
        </div>
        {sensitive ? (
          <button
            onClick={() => setRevealed((r) => ({ ...r, [key]: !r[key] }))}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        ) : <div />}
        <button
          onClick={() => copyValue(key, value)}
          style={{ background: "none", border: "none", color: isCopied ? "#34d399" : "rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          {isCopied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Environment Variables</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
            Server-side variables — sensitive values are masked
          </p>
        </div>

        {/* Filter */}
        <div style={{ position: "relative", marginBottom: 20, maxWidth: 360 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by key name..."
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 8, padding: "9px 12px 9px 32px", fontSize: 13, color: "#e2e8f0", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Loading...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {Object.entries(categories).map(([cat, rows]) =>
              rows.length === 0 ? null : (
                <div key={cat} style={{ background: "#0f1625", border: "1px solid rgba(59,130,246,0.08)", borderRadius: 12, overflow: "hidden" }}>
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 28px 28px", gap: 8, padding: "8px 14px", background: "rgba(59,130,246,0.05)", borderBottom: "1px solid rgba(59,130,246,0.08)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{cat} ({rows.length})</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Value</div>
                    <div /><div />
                  </div>
                  {rows.map(renderRow)}
                </div>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
