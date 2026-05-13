import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/actions";
import { TopNav } from "./top-nav";
import { SideNav } from "./side-nav";
import type { Shift, SwapRequest, UserProfile, WorkRequest } from "@/types/domain";

export async function AppShell({
  children,
  allowedRoles,
  profile: providedProfile,
  shifts,
  swapRequests,
  workRequests,
  signatureRequests
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  profile?: UserProfile | null;
  shifts?: Shift[];
  swapRequests?: SwapRequest[];
  workRequests?: WorkRequest[];
  signatureRequests?: SwapRequest[];
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
      <TopNav
        profile={profile}
        shifts={shifts}
        signatureRequests={signatureRequests}
        swapRequests={swapRequests}
        workRequests={workRequests}
      />
      <div className="mx-auto flex w-full max-w-6xl gap-5 px-4 py-4 sm:py-5">
        <SideNav profile={profile} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
