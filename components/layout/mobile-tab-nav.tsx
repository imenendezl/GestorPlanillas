"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { UserProfile } from "@/types/domain";

const items = [
  { href: "/dashboard", label: "Planilla", icon: CalendarDays },
  { href: "/requests", label: "Solicitudes", icon: Repeat2 }
];

export function MobileTabNav({ profile }: { profile: UserProfile }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/96 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 text-card-foreground shadow-[0_-10px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden dark:shadow-[0_-10px_32px_rgba(0,0,0,0.28)]"
    >
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-xs font-semibold leading-tight text-muted-foreground transition hover:bg-accent hover:text-accent-foreground active:scale-95",
                active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <span className="sr-only">Usuario: {profile.firstName}</span>
    </nav>
  );
}
