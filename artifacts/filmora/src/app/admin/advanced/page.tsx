"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { Save, AlertTriangle } from "lucide-react";

const ADVANCED_FIELDS = [
  { key: "ADMIN_EMAIL", label: "Admin Email", sensitive: false, placeholder: "admin@moviebox.com", note: "Login email for this panel" },
  { key: "ADMIN_PASSWORD", label: "Admin Password", sensitive: true, placeholder: "••••••••", note: "Login password for this panel" },
  { key: "ADMIN_SECRET", label: "Admin Secret (HMAC key)", sensitive: true, placeholder: "random-secret-string", note: "Used to sign session tokens" },
  { key: "INTERNAL_API_URL", label: "Internal API URL", sensitive: false, placeholder: "http://localhost:80/api", note: "Next.js → Express API URL" },
  { key: "TMDB_API_KEY", label: "TMDB API Key", sensitive: true, placeholder: "••••••••", note: "" },
  { key: "NEXT_PUBLIC_LOGO_PATH", label: "Logo Path", sensitive: false, placeholder: "/fw-icon.svg", note: "Relative path to logo file" },
  { key: "NEXT_PUBLIC_GSC_VERIFICATION", label: "Google Search Console Verification", sensitive: false, placeholder: "abc123...", note: "" },
];

export default function AdvancedPage() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [revealAll, setRevealAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(true);

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
      for (const f of ADVANCED_FIELDS) {
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
      setSaveMsg("Advanced settings saved.");
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Advanced Settings</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>Admin credentials and system configuration</p>
        </div>

        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, marginBottom: 24, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
          <AlertTriangle size={14} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
          Changing admin credentials here saves them to the database. Apply to your deployment environment to take full effect. Changing the admin password will require a fresh login.
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => setRevealAll((r) => !r)}
            style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.06)", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {revealAll ? "Hide All Sensitive" : "Reveal All Sensitive"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {ADVANCED_FIELDS.map((f) => (
            <div key={f.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.07em", textTransform: "uppercase" }}>{f.label}</label>
                {f.note && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{f.note}</span>}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginBottom: 5, fontFamily: "monospace" }}>{f.key}</div>
              <input
                type={f.sensitive && !revealAll ? "password" : "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, padding: "11px 14px", fontSize: 13, color: "#e2e8f0", outline: "none", boxSizing: "border-box" }}
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
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, border: "none", background: isDirty ? "linear-gradient(135deg, #1d4ed8, #3b82f6)" : "rgba(59,130,246,0.15)", color: isDirty ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 700, cursor: isDirty ? "pointer" : "not-allowed" }}
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save Advanced"}
          </button>
          {saveMsg && <span style={{ fontSize: 13, color: saveMsg.includes("failed") ? "#f87171" : "#34d399" }}>{saveMsg}</span>}
        </div>
      </main>
    </div>
  );
}
