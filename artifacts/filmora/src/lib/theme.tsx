"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "beta" | "rcb" | "neon-galaxy" | "ocean-pulse" | "sunset-cinema" | "emerald-night";
export type UIMode = "beta" | "shiv";

export const VALID_THEMES: Theme[] = ["beta", "rcb", "neon-galaxy", "ocean-pulse", "sunset-cinema", "emerald-night"];
export const VALID_MODES: UIMode[] = ["beta", "shiv"];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  mode: UIMode;
  setMode: (m: UIMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "beta",
  setTheme: () => {},
  mode: "beta",
  setMode: () => {},
});

function applyMode(m: UIMode) {
  document.documentElement.setAttribute("data-mode", m);
  try { localStorage.setItem("fw-ui-mode", m); } catch {}
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("fw-theme", t); } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("beta");
  const [mode, setModeState] = useState<UIMode>("beta");

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("fw-theme") as Theme | null;
      const storedMode = localStorage.getItem("fw-ui-mode") as UIMode | null;

      const fromAttr = document.documentElement.getAttribute("data-theme") as Theme | null;
      const fromModeAttr = document.documentElement.getAttribute("data-mode") as UIMode | null;

      const resolvedTheme: Theme =
        storedTheme && VALID_THEMES.includes(storedTheme)
          ? storedTheme
          : fromAttr && VALID_THEMES.includes(fromAttr)
          ? fromAttr
          : "beta";

      const resolvedMode: UIMode =
        storedMode && VALID_MODES.includes(storedMode)
          ? storedMode
          : fromModeAttr && VALID_MODES.includes(fromModeAttr)
          ? fromModeAttr
          : "beta";

      setThemeState(resolvedTheme);
      setModeState(resolvedMode);
      applyTheme(resolvedTheme);
      applyMode(resolvedMode);
    } catch {
      applyTheme("beta");
      applyMode("beta");
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  };

  const setMode = (m: UIMode) => {
    setModeState(m);
    applyMode(m);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
