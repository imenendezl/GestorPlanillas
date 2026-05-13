import { describe, expect, it } from "vitest";
import { createLocalShift, mergeShiftsWithOverlay } from "./store-core";
import type { Shift } from "@/types/domain";

describe("offline store core", () => {
  it("creates a local shift using the current persisted identity when present", () => {
    const currentShift: Shift = {
      id: "shift-1",
      userId: "user-1",
      shiftDate: "2026-05-13",
      shiftCodes: ["M"]
    };

    expect(createLocalShift("2026-05-13", ["T"], currentShift)).toEqual({
      id: "shift-1",
      userId: "user-1",
      shiftDate: "2026-05-13",
      shiftCodes: ["T"]
    });
  });

  it("merges local offline overlays and deletions by date", () => {
    const shifts: Shift[] = [
      { id: "shift-1", userId: "user-1", shiftDate: "2026-05-13", shiftCodes: ["M"] },
      { id: "shift-2", userId: "user-1", shiftDate: "2026-05-14", shiftCodes: ["N"] }
    ];

    expect(
      mergeShiftsWithOverlay(shifts, {
        "2026-05-13": { id: "local-1", userId: "user-1", shiftDate: "2026-05-13", shiftCodes: ["T"] },
        "2026-05-14": null,
        "2026-05-15": { id: "local-2", userId: "user-1", shiftDate: "2026-05-15", shiftCodes: ["L"] }
      })
    ).toEqual([
      { id: "local-1", userId: "user-1", shiftDate: "2026-05-13", shiftCodes: ["T"] },
      { id: "local-2", userId: "user-1", shiftDate: "2026-05-15", shiftCodes: ["L"] }
    ]);
  });
});
