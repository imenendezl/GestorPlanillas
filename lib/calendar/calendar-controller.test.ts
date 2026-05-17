import { describe, expect, it } from "vitest";
import { DOUBLE_SHIFT_WINDOW_MS, getNextQuickShiftCodes } from "./calendar-controller";

describe("calendar controller", () => {
  it("creates a double shift when two compatible quick codes are tapped quickly", () => {
    expect(
      getNextQuickShiftCodes({
        code: "T",
        now: 2_000,
        selectedDate: "2026-05-17",
        lastSelection: {
          at: 2_000 - DOUBLE_SHIFT_WINDOW_MS + 1,
          dateKey: "2026-05-17",
          codes: ["M"]
        }
      })
    ).toEqual(["M", "T"]);
  });

  it("falls back to the latest quick code outside the double-shift window", () => {
    expect(
      getNextQuickShiftCodes({
        code: "T",
        now: 2_000,
        selectedDate: "2026-05-17",
        lastSelection: {
          at: 2_000 - DOUBLE_SHIFT_WINDOW_MS - 1,
          dateKey: "2026-05-17",
          codes: ["M"]
        }
      })
    ).toEqual(["T"]);
  });
});
