"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

const ThemeContext = createContext(null);

// The <html> class is the source of truth (set pre-paint by the inline script).
const listeners = new Set();
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const getServerSnapshot = () => "light";

export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {}
    listeners.forEach((l) => l());
  }, []);

  const toggle = useCallback(() => setTheme(getSnapshot() === "dark" ? "light" : "dark"), [setTheme]);
  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
