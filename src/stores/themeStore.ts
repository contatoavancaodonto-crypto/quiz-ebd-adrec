import { create } from "zustand";

const getInitialTheme = (): boolean => {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

const initialDark = getInitialTheme();
if (typeof document !== "undefined") {
  document.documentElement.classList.toggle("dark", initialDark);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: initialDark,
  toggle: () => {
    const next = !get().isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    set({ isDark: next });
  },
}));
