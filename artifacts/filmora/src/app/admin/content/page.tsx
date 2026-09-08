"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { Filter, Save } from "lucide-react";

export default function ContentFilterPage() {
  const router = useRouter();
  const [indexedOnly, setIndexedOnly] = useState(false);
  const [savedIndexedOnly, setSavedIndexedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    async function load() {
      const session = await fetch("/api/admin/session");
      if (!session.ok) { router.push("/admin"); return; }
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const settings = await res.json();
        const val = settings["show_indexed_only"] === "1";
        setIndexedOnly(val);
        setSavedIndexedOnly(val);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ key: "show_indexed_only", value: indexedOnly ? "1" : "0" }]),
    });
    setSaving(false);
    if (res.ok) {
      setSavedIndexedOnly(indexedOnly);
      setSaveMsg("Content filter saved.");
    } else {
      setSaveMsg("Save failed.");
    }
    setTimeout(() => setSaveMsg(""), 4000);
  }

  const isDirty = indexedOnly !== savedIndexedOnly;

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)" }}>Loading...</main>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", maxWidth: 800 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Content Filters</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
            Control which movies are shown on the website and bot
          </p>
        </div>

        <div style={{
          background: "rgba(15,20,40,0.6)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 14,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Filter size={16} style={{ color: "#3b82f6" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Show Indexed Movies Only</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: indexedOnly ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)",
                  color: indexedOnly ? "#34d399" : "rgba(255,255,255,0.35)",
                  border: `1px solid ${indexedOnly ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.1)"}`,
                  letterSpacing: "0.05em",
                }}>
                  {indexedOnly ? "ON" : "OFF"}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>
                When enabled, only movies with a valid Telegram <code style={{ fontSize: 12, color: "rgba(99,179,237,0.8)", background: "rgba(59,130,246,0.08)", padding: "1px 6px", borderRadius: 4 }}>file_id</code> will appear on the website and in bot search results.
                Movies without a file (incomplete entries) will be hidden automatically.
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: "8px 0 0", lineHeight: 1.5 }}>
                TMDB metadata (poster, rating, genres) is fetched automatically at index time — all shown movies will have full details.
              </p>
            </div>

            <button
              onClick={() => setIndexedOnly((v) => !v)}
              style={{
                flexShrink: 0,
                width: 52,
                height: 28,
                borderRadius: 14,
                background: indexedOnly ? "linear-gradient(135deg, #1d4ed8, #3b82f6)" : "rgba(255,255,255,0.08)",
                border: `1px solid ${indexedOnly ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.12)"}`,
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s ease",
                padding: 0,
              }}
              title={indexedOnly ? "Click to disable" : "Click to enable"}
            >
              <span style={{
                position: "absolute",
                top: 3,
                left: indexedOnly ? "calc(100% - 25px)" : 3,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: indexedOnly ? "#fff" : "rgba(255,255,255,0.4)",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }} />
            </button>
          </div>

          {indexedOnly && (
            <div style={{
              marginTop: 20,
              padding: "12px 16px",
              background: "rgba(52,211,153,0.05)",
              border: "1px solid rgba(52,211,153,0.12)",
              borderRadius: 8,
              fontSize: 12,
              color: "rgba(52,211,153,0.7)",
              lineHeight: 1.6,
            }}>
              Active — only movies with a Telegram file ID will be shown. Settings are applied within 30 seconds (cached).
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24 }}>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: isDirty ? "linear-gradient(135deg, #1d4ed8, #3b82f6)" : "rgba(59,130,246,0.15)",
              color: isDirty ? "#fff" : "rgba(255,255,255,0.3)",
              fontSize: 14,
              fontWeight: 700,
              cursor: isDirty ? "pointer" : "not-allowed",
              boxShadow: isDirty ? "0 4px 16px rgba(59,130,246,0.25)" : "none",
            }}
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save Filter"}
          </button>
          {saveMsg && (
            <span style={{ fontSize: 13, color: saveMsg.includes("failed") ? "#f87171" : "#34d399" }}>{saveMsg}</span>
          )}
        </div>
      </main>
    </div>
  );
}
