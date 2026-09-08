"use client";

import React, { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, Film } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push(redirect);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed. Check credentials.");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 14,
    color: "#e2e8f0",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(29,78,216,0.15) 0%, #060810 60%)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(11,14,26,0.95)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 18,
          padding: "40px 36px",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 0 30px rgba(59,130,246,0.3)",
            }}
          >
            <Film size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Admin Panel</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "6px 0 0" }}>MOVIE BOX Control Center</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@moviebox.com"
              required
              style={{ ...inputStyle, marginTop: 6 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.2)")}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Password
            </label>
            <div style={{ position: "relative", marginTop: 6 }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.2)")}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#f87171",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "13px 24px",
              borderRadius: 10,
              border: "none",
              background: loading ? "rgba(59,130,246,0.4)" : "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4,
              boxShadow: "0 4px 20px rgba(59,130,246,0.25)",
              transition: "all 0.2s",
            }}
          >
            <LogIn size={16} />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 24 }}>
          Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables to configure access
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
