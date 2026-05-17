import { describe, expect, it } from "vitest";
import {
  createSwapRequestSchema,
  dateKeySchema,
  emailSchema,
  registrationSchema,
  saveShiftSchema
} from "./schemas";

describe("validation schemas", () => {
  it("normalizes emails and registration service codes", () => {
    const result = registrationSchema.parse({
      email: " USER@Example.COM ",
      firstName: " Ana ",
      lastName: " López ",
      serviceCode: " urg 123 "
    });

    expect(result).toEqual({
      email: "user@example.com",
      firstName: "Ana",
      lastName: "López",
      serviceCode: "URG123"
    });
  });

  it("rejects invalid emails and impossible date keys", () => {
    expect(() => emailSchema.parse("not-an-email")).toThrow();
    expect(() => dateKeySchema.parse("2026-02-31")).toThrow();
  });

  it("accepts only known shift codes", () => {
    expect(saveShiftSchema.parse({ shiftDate: "2026-05-17", shiftCodes: ["M", "T"] }).shiftCodes).toEqual(["M", "T"]);
    expect(() => saveShiftSchema.parse({ shiftDate: "2026-05-17", shiftCodes: ["X"] })).toThrow();
  });

  it("validates swap request ids, modes, dates and offered shift codes", () => {
    const validRequest = {
      shiftId: "22222222-2222-4222-8222-222222222222",
      mode: "Exchange",
      offeredShiftCodes: ["N"],
      proposedDates: ["2026-05-18"]
    };

    expect(createSwapRequestSchema.parse(validRequest)).toEqual(validRequest);
    expect(() => createSwapRequestSchema.parse({ ...validRequest, proposedDates: ["18/05/2026"] })).toThrow();
  });
});
