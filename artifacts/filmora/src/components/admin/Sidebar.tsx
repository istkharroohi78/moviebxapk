"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Film, Settings, Bot, KeyRound,
  LogOut, ChevronLeft, ChevronRight, Globe, Filter, Radio,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/site", label: "Site Settings", icon: Globe },
  { href: "/admin/content", label: "Content Filters", icon: Filter },
  { href: "/admin/streaming", label: "Streaming", icon: Radio },
  { href: "/admin/bot", label: "Bot Config", icon: Bot },
  { href: "/admin/movies", label: "Movies", icon: Film },
  { href: "/admin/env", label: "Environment", icon: KeyRound },
  { href: "/admin/advanced", label: "Advanced", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minHeight: "100vh",
        background: "#0b0e1a",
        borderRight: "1px solid rgba(59,130,246,0.12)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.22s ease",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid rgba(59,130,246,0.1)",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginLeft: collapsed ? "auto" : 0,
            marginRight: collapsed ? "auto" : 0,
          }}
        >
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>A</span>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", lineHeight: 1.2 }}>Admin Panel</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>MOVIE BOX</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 0" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                color: active ? "#fff" : "rgba(255,255,255,0.5)",
                background: active ? "rgba(59,130,246,0.18)" : "transparent",
                borderLeft: active ? "2px solid #3b82f6" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <Icon size={17} style={{ flexShrink: 0, color: active ? "#3b82f6" : "rgba(255,255,255,0.4)" }} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(59,130,246,0.1)" }}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? "Logout" : undefined}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
            padding: collapsed ? "10px 0" : "10px 12px",
            borderRadius: 8,
            background: "transparent",
            border: "none",
            color: "rgba(239,68,68,0.7)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {!collapsed && (loggingOut ? "Logging out..." : "Logout")}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          position: "absolute",
          top: 22,
          right: -12,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#1e293b",
          border: "1px solid rgba(59,130,246,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "rgba(255,255,255,0.5)",
          zIndex: 10,
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}
