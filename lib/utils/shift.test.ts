import { describe, expect, it } from "vitest";
import { canGrantSupervisor, canSeeSwapRequest, isValidShiftCombination, normalizeShiftCodes, parseBulkShiftSequence, shiftDefinitions } from "./shift";

describe("shift utilities", () => {
  it("parses single and double shifts", () => {
    expect(normalizeShiftCodes("M")).toEqual(["M"]);
    expect(normalizeShiftCodes("M+T")).toEqual(["M", "T"]);
    expect(normalizeShiftCodes("")).toEqual(["L"]);
  });

  it("rejects invalid double shifts", () => {
    expect(normalizeShiftCodes("N+M")).toEqual(["M", "N"]);
    expect(() => normalizeShiftCodes("L+M")).toThrow("Turno no válido");
    expect(() => normalizeShiftCodes("M+T+N")).toThrow("Turno no válido");
  });

  it("parses bulk sequences", () => {
    expect(parseBulkShiftSequence("M,T,N,-,L,M+N")).toEqual([["M"], ["T"], ["N"], ["-"], ["L"], ["M", "N"]]);
  });

  it("exposes labels and colors from the shift catalog", () => {
    expect(shiftDefinitions.map((definition) => definition.label)).toContain("Mañana");
    expect(shiftDefinitions.every((definition) => definition.colorClassName.length > 0)).toBe(true);
  });

  it("validates wizard multi-select combinations", () => {
    expect(isValidShiftCombination(["M", "T"])).toBe(true);
    expect(isValidShiftCombination(["T", "N"])).toBe(true);
    expect(isValidShiftCombination(["M", "T", "N"])).toBe(false);
    expect(isValidShiftCombination(["L", "M"])).toBe(false);
  });

  it("restricts swap visibility to same unit and position", () => {
    expect(canSeeSwapRequest({ unit: "UCI", position: "Nurse" }, { unit: "UCI", position: "Nurse" })).toBe(true);
    expect(canSeeSwapRequest({ unit: "UCI", position: "Nurse" }, { unit: "UCI", position: "TMSCAE" })).toBe(false);
  });

  it("allows only managers to grant supervisor role", () => {
    expect(canGrantSupervisor("Admin")).toBe(true);
    expect(canGrantSupervisor("Supervisor")).toBe(true);
    expect(canGrantSupervisor("Employee")).toBe(false);
  });
});
