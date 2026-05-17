import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/actions";
import { TopNav } from "./top-nav";
import { SideNav } from "./side-nav";
import { MobileTabNav } from "./mobile-tab-nav";
import type { Shift, SwapRequest, UserProfile, WorkRequest } from "@/types/domain";

export async function AppShell({
  children,
  allowedRoles,
  mobileFullWidth = false,
  profile: providedProfile,
  shifts,
  swapRequests,
  workRequests,
  signatureRequests
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  mobileFullWidth?: boolean;
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
      <div className="hidden lg:block">
        <TopNav
          profile={profile}
          shifts={shifts}
          signatureRequests={signatureRequests}
          swapRequests={swapRequests}
          workRequests={workRequests}
        />
      </div>
      <div className={`mx-auto flex w-full max-w-6xl gap-5 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:px-4 sm:py-5 lg:pb-5 ${mobileFullWidth ? "px-1.5 sm:px-4" : "px-3"}`}>
        <SideNav profile={profile} />
        <main className="min-w-0 flex-1" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      <MobileTabNav
        profile={profile}
        shifts={shifts}
        signatureRequests={signatureRequests}
        swapRequests={swapRequests}
        workRequests={workRequests}
      />
    </>
  );
}
