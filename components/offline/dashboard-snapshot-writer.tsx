"use client";

import { useEffect } from "react";
import { saveDashboardSnapshot } from "@/lib/offline/client-store";
import type { Shift, SwapRequest, UserProfile } from "@/types/domain";

export function DashboardSnapshotWriter({
  profile,
  shifts,
  swapRequests
}: {
  profile: UserProfile;
  shifts: Shift[];
  swapRequests: SwapRequest[];
}) {
  useEffect(() => {
    saveDashboardSnapshot({ profile, shifts, swapRequests });
  }, [profile, shifts, swapRequests]);

  return null;
}
