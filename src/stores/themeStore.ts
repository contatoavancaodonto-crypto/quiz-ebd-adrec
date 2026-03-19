import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true,
  toggle: () => {
    const next = !get().isDark;
    document.documentElement.classList.toggle("dark", next);
    set({ isDark: next });
  },
}));
