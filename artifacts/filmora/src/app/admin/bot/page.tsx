"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { Save, Eye, EyeOff } from "lucide-react";

const BOT_FIELDS = [
  { key: "TELEGRAM_BOT_TOKEN", label: "Bot Token", sensitive: true, placeholder: "1234567890:AAF..." },
  { key: "API_ID", label: "Telegram API ID", sensitive: true, placeholder: "1234567" },
  { key: "API_HASH", label: "Telegram API Hash", sensitive: true, placeholder: "abc123..." },
  { key: "MONGODB_URI", label: "MongoDB URI", sensitive: true, placeholder: "mongodb+srv://..." },
  { key: "TMDB_API_KEY", label: "TMDB API Key", sensitive: true, placeholder: "abc123..." },
  { key: "INDEX_CHANNELS", label: "Index Channels (comma-separated)", sensitive: false, placeholder: "-1001234567890,-1009876543210" },
  { key: "ADMINS", label: "Admin User IDs (comma-separated)", sensitive: false, placeholder: "123456789,987654321" },
  { key: "BOT_NAME", label: "Bot Display Name", sensitive: false, placeholder: "MOVIE BOXBot" },
  { key: "WEBSITE_URL", label: "Website URL", sensitive: false, placeholder: "https://moviebox.com" },
  { key: "FORCE_SUB_CHANNEL", label: "Force Subscribe Channel", sensitive: false, placeholder: "my_channel (leave blank to disable)" },
  { key: "AUTO_FILTER", label: "Auto Filter (True/False)", sensitive: false, placeholder: "True" },
  { key: "MAX_RESULTS", label: "Max Search Results", sensitive: false, placeholder: "10" },
  { key: "SPELL_CHECK", label: "Spell Check (True/False)", sensitive: false, placeholder: "True" },
  { key: "CUSTOM_CAPTION", label: "Custom Caption", sensitive: false, placeholder: "Powered by MOVIE BOX" },
];

export default function BotConfigPage() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    async function load() {
      const session = await fetch("/api/admin/session");
      if (!session.ok) { router.push("/admin"); return; }
      const [settingsRes, envRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/env"),
      ]);
      const settings = settingsRes.ok ? await settingsRes.json() : {};
      const env = envRes.ok ? await envRes.json() : {};
      const merged: Record<string, string> = {};
      for (const f of BOT_FIELDS) {
        merged[f.key] = settings[f.key] ?? env[f.key] ?? "";
      }
      setValues(merged);
      setSaved(merged);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    const entries = Object.entries(values).map(([key, value]) => ({ key, value }));
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entries),
    });
    setSaving(false);
    if (res.ok) {
      setSaved({ ...values });
      setSaveMsg("Bot config saved.");
    } else {
      setSaveMsg("Save failed.");
    }
    setTimeout(() => setSaveMsg(""), 4000);
  }

  const isDirty = JSON.stringify(values) !== JSON.stringify(saved);

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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Bot Configuration</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
            Telegram bot settings — restart bot after changes
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {BOT_FIELDS.map((f) => {
            const isRevealed = revealed[f.key];
            return (
              <div key={f.key}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                    {f.label}
                  </label>
                  {f.sensitive && (
                    <span style={{ fontSize: 10, color: "rgba(239,68,68,0.7)", background: "rgba(239,68,68,0.08)", padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>
                      Sensitive
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginBottom: 5, fontFamily: "monospace" }}>{f.key}</div>
                <div style={{ position: "relative" }}>
                  <input
                    type={f.sensitive && !isRevealed ? "password" : "text"}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: f.sensitive ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(59,130,246,0.15)",
                      borderRadius: 8,
                      padding: "11px 14px",
                      paddingRight: f.sensitive ? 44 : 14,
                      fontSize: 13,
                      color: "#e2e8f0",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: f.sensitive ? "monospace" : "inherit",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = f.sensitive ? "rgba(239,68,68,0.4)" : "rgba(59,130,246,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = f.sensitive ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)")}
                  />
                  {f.sensitive && (
                    <button
                      type="button"
                      onClick={() => setRevealed((r) => ({ ...r, [f.key]: !r[f.key] }))}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex" }}
                    >
                      {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 28 }}>
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
            }}
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save Config"}
          </button>
          {saveMsg && <span style={{ fontSize: 13, color: saveMsg.includes("failed") ? "#f87171" : "#34d399" }}>{saveMsg}</span>}
        </div>

        <div style={{
          marginTop: 28,
          background: "rgba(251,191,36,0.05)",
          border: "1px solid rgba(251,191,36,0.12)",
          borderRadius: 10,
          padding: "14px 18px",
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          lineHeight: 1.7,
        }}>
          <strong style={{ color: "rgba(251,191,36,0.8)" }}>Note:</strong> Sensitive fields are masked. The bot reads from environment variables at startup — restart the bot for changes to take effect. For deployed environments, update secrets via your deployment platform.
        </div>
      </main>
    </div>
  );
}
