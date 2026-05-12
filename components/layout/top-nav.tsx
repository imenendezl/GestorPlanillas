import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types/domain";

export function TopNav({ profile }: { profile: UserProfile | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black text-white">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-xs tracking-[-0.01em]">
          <CalendarDays className="h-4 w-4" />
          Planillas
        </Link>
        <nav className="flex items-center gap-4 text-xs">
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
      </div>
    </header>
  );
}
