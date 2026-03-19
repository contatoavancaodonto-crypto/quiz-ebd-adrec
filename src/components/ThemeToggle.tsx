import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { isDark, toggle } = useThemeStore();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      className="fixed top-4 right-4 z-50 p-2.5 rounded-xl glass-card glow-border cursor-pointer"
      aria-label="Alternar tema"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-primary" />
      ) : (
        <Moon className="w-5 h-5 text-primary" />
      )}
    </motion.button>
  );
}
