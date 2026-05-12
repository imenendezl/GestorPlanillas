import Link from "next/link";
import { CalendarDays, Menu } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { UserProfile } from "@/types/domain";

export function TopNav({ profile }: { profile: UserProfile | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-black text-white">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-xs tracking-[-0.01em]">
          <CalendarDays className="h-4 w-4" />
          Planillas
        </Link>
        <nav className="hidden items-center gap-4 text-xs sm:flex">
          {profile?.role === "Admin" && <Link href="/admin">Admin</Link>}
          {(profile?.role === "Admin" || profile?.role === "Supervisor") && <Link href="/supervisor">Supervisor</Link>}
          <ThemeToggle />
          {profile && (
            <form action={signOutAction}>
              <Button className="h-8 px-3 text-xs" type="submit" variant="utility">
                Salir
              </Button>
            </form>
          )}
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Abrir menú"
                className="border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                size="icon"
                type="button"
                variant="outline"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Mi planilla</Link>
              </DropdownMenuItem>
              {profile?.role === "Admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">Admin</Link>
                </DropdownMenuItem>
              )}
              {(profile?.role === "Admin" || profile?.role === "Supervisor") && (
                <DropdownMenuItem asChild>
                  <Link href="/supervisor">Supervisor</Link>
                </DropdownMenuItem>
              )}
              {profile && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={signOutAction} className="w-full">
                      <button className="w-full text-left" type="submit">
                        Salir
                      </button>
                    </form>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
