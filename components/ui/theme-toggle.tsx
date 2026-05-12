"use client";

import { Moon, Sun } from "lucide-react";
import { useAppTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useAppTheme();
  const isDark = theme === "dark";

  return (
    <button
      aria-label="Cambiar tema"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-ink transition hover:border-action active:scale-95 dark:border-white/15 dark:text-white"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
