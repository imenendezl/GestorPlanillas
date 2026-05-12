import { describe, expect, it } from "vitest";
import { validateShift } from "./shift-rules";

describe("shift validation rules", () => {
  it("rejects a morning immediately after a night", () => {
    const result = validateShift({
      date: "2026-05-13",
      shiftCodes: ["M"],
      existingShifts: [{ shiftDate: "2026-05-12", shiftCodes: ["N"] }]
    });

    expect(result.valid).toBe(false);
    expect(result.message).toContain("mañana");
  });

  it("rejects a night immediately before an existing morning", () => {
    const result = validateShift({
      date: "2026-05-12",
      shiftCodes: ["N"],
      existingShifts: [{ shiftDate: "2026-05-13", shiftCodes: ["M"] }]
    });

    expect(result.valid).toBe(false);
  });

  it("allows unrelated adjacent shifts", () => {
    const result = validateShift({
      date: "2026-05-13",
      shiftCodes: ["T"],
      existingShifts: [{ shiftDate: "2026-05-12", shiftCodes: ["N"] }]
    });

    expect(result.valid).toBe(true);
  });
});
