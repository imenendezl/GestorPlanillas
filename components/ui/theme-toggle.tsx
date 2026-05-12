"use client";

import { Laptop, Moon, Smartphone, Sun } from "lucide-react";
import { useAppTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Cambiar tema"
          className="border-0 bg-black/8 text-foreground hover:bg-black/12 hover:text-foreground dark:bg-white/12 dark:text-white dark:hover:bg-white/22 dark:hover:text-white"
          size="icon"
          type="button"
          variant="outline"
        >
          {theme === "system" ? (
            <>
              <Smartphone className="h-4 w-4 sm:hidden" />
              <Laptop className="hidden h-4 w-4 sm:block" />
            </>
          ) : isDark ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setTheme("system")}>
          <Smartphone className="mr-2 h-4 w-4 sm:hidden" />
          <Laptop className="mr-2 hidden h-4 w-4 sm:block" />
          Sistema
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Oscuro
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
