"use client";

import { useEffect, useState } from "react";
import { mergeShiftsWithOfflineOverlay, OFFLINE_STORE_EVENT } from "./client-store";
import type { Shift } from "@/types/domain";

export function useOfflineShifts(shifts: Shift[]) {
  const [visibleShifts, setVisibleShifts] = useState(() => mergeShiftsWithOfflineOverlay(shifts));

  useEffect(() => {
    function syncVisibleShifts() {
      setVisibleShifts(mergeShiftsWithOfflineOverlay(shifts));
    }

    syncVisibleShifts();
    window.addEventListener(OFFLINE_STORE_EVENT, syncVisibleShifts);
    window.addEventListener("storage", syncVisibleShifts);

    return () => {
      window.removeEventListener(OFFLINE_STORE_EVENT, syncVisibleShifts);
      window.removeEventListener("storage", syncVisibleShifts);
    };
  }, [shifts]);

  return visibleShifts;
}
