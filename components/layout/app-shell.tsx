import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/actions";
import { TopNav } from "./top-nav";
import type { Shift, UserProfile } from "@/types/domain";

export async function AppShell({
  children,
  allowedRoles,
  profile: providedProfile,
  shifts
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  profile?: UserProfile | null;
  shifts?: Shift[];
}) {
  const profile = providedProfile === undefined ? await getCurrentProfile() : providedProfile;

  if (!profile) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    redirect("/dashboard");
  }

  return (
    <>
      <TopNav profile={profile} shifts={shifts} />
      <main className="mx-auto w-full max-w-6xl px-4 py-4 sm:py-5">{children}</main>
    </>
  );
}
