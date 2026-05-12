import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/actions";
import { TopNav } from "./top-nav";

export async function AppShell({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    redirect("/dashboard");
  }

  return (
    <>
      <TopNav profile={profile} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </>
  );
}
