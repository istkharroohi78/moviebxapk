"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { Save, Info } from "lucide-react";

const SITE_FIELDS = [
  { key: "NEXT_PUBLIC_SITE_NAME", label: "Site Name", placeholder: "MOVIE BOX", note: "Requires rebuild to apply" },
  { key: "NEXT_PUBLIC_SITE_URL", label: "Site URL", placeholder: "https://moviebox.com", note: "Requires rebuild to apply" },
  { key: "NEXT_PUBLIC_CONTACT_EMAIL", label: "Contact Email", placeholder: "contact@moviebox.com", note: "" },
  { key: "NEXT_PUBLIC_TWITTER_HANDLE", label: "Twitter Handle", placeholder: "@moviebox", note: "" },
  { key: "NEXT_PUBLIC_BOT_USERNAME", label: "Telegram Bot Username", placeholder: "MOVIE BOXBot", note: "Controls download link" },
  { key: "NEXT_PUBLIC_TAGLINE", label: "Tagline", placeholder: "Stream Unlimited Movies & TV Shows", note: "" },
  { key: "NEXT_PUBLIC_SITE_DESCRIPTION", label: "Site Description", placeholder: "Unlimited movies for free.", note: "" },
  { key: "NEXT_PUBLIC_GA_ID", label: "Google Analytics ID", placeholder: "G-XXXXXXXXXX", note: "Leave blank to disable" },
  { key: "NEXT_PUBLIC_OLD_DOMAIN", label: "Old Domain (redirect)", placeholder: "old.moviebox.com", note: "Leave blank to disable" },
  { key: "NEXT_PUBLIC_DOWNLOAD_PROXY_URL", label: "Download Proxy URL", placeholder: "", note: "Leave blank if not used" },
];

export default function SiteSettingsPage() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
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
      for (const f of SITE_FIELDS) {
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
      setSaveMsg("Settings saved to database.");
    } else {
      setSaveMsg("Save failed. Check API connection.");
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Site Settings</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
            Saved values override environment variables at runtime
          </p>
        </div>

        <div style={{
          background: "rgba(59,130,246,0.06)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          marginBottom: 24,
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
        }}>
          <Info size={14} style={{ color: "#3b82f6", marginTop: 1, flexShrink: 0 }} />
          Fields marked with "Requires rebuild" are NEXT_PUBLIC_ variables baked at build time. Save here for reference — apply by updating your deployment environment variables and redeploying.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {SITE_FIELDS.map((f) => (
            <div key={f.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  {f.label}
                </label>
                {f.note && (
                  <span style={{ fontSize: 10, color: "rgba(251,191,36,0.7)", background: "rgba(251,191,36,0.08)", padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>
                    {f.note}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginBottom: 4, fontFamily: "monospace" }}>{f.key}</div>
              <input
                type="text"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  borderRadius: 8,
                  padding: "11px 14px",
                  fontSize: 13,
                  color: "#e2e8f0",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.15)")}
              />
            </div>
          ))}
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
              boxShadow: isDirty ? "0 4px 16px rgba(59,130,246,0.25)" : "none",
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
