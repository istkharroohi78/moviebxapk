"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { Save, Radio, Send, Globe } from "lucide-react";

export default function StreamingSettingsPage() {
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
        const data = await res.json();
        const val = data["show_indexed_only"] === "1";
        setIndexedOnly(val);
        setSavedIndexedOnly(val);
      }
      setLoading(false);
    }
    load();
  }, []);

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
      setSaveMsg("Streaming settings saved.");
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Streaming Settings</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
            Control how content is streamed to users
          </p>
        </div>

        {/* Indexed-Only Mode Toggle */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 12,
          padding: "24px",
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Send size={18} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Indexed-Only Mode</span>
                {indexedOnly && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(245,158,11,0.3)" }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
                When enabled, the web player replaces all third-party streaming sources (Videasy, VidSrc, etc.) with
                Telegram bot deep links. Only movies indexed by your bot will be streamable — others show a
                "not available" state with a request link.
              </p>
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 20 }}>
                  🔒 No 3rd-party players
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 20 }}>
                  📱 Telegram bot delivery
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 20 }}>
                  ⚡ Instant deep link
                </span>
              </div>
            </div>
            <div>
              <button
                onClick={() => setIndexedOnly((v) => !v)}
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 14,
                  background: indexedOnly ? "#f59e0b" : "rgba(255,255,255,0.1)",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 3,
                  left: indexedOnly ? 26 : 3,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Bot Search Buttons info */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 12,
          padding: "24px",
          marginBottom: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Globe size={18} style={{ color: "#3b82f6" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Bot Search Buttons</span>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 12px", lineHeight: 1.6 }}>
            When <strong style={{ color: "#fff" }}>WEBSITE_URL</strong> is set (auto-detected from your Replit domain),
            bot search results automatically include <strong style={{ color: "#f59e0b" }}>🌐 Watch Online</strong> and{" "}
            <strong style={{ color: "#f59e0b" }}>ℹ️ Info</strong> buttons linking users to your website.
          </p>
          <div style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: 8,
            padding: "10px 14px",
            fontFamily: "monospace",
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
          }}>
            WEBSITE_URL = auto-detected from REPLIT_DOMAINS env var
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
              background: isDirty ? "linear-gradient(135deg, #92400e, #f59e0b)" : "rgba(245,158,11,0.12)",
              color: isDirty ? "#000" : "rgba(255,255,255,0.3)",
              fontSize: 14,
              fontWeight: 700,
              cursor: isDirty ? "pointer" : "not-allowed",
              boxShadow: isDirty ? "0 4px 16px rgba(245,158,11,0.25)" : "none",
            }}
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saveMsg && (
            <span style={{ fontSize: 13, color: saveMsg.includes("failed") ? "#f87171" : "#34d399" }}>{saveMsg}</span>
          )}
        </div>
      </main>
    </div>
  );
}
