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
          className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
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
