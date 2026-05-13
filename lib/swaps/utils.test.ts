import { describe, expect, it } from "vitest";
import { filterOwnSwapRequests, getSignatureStatus, getSuggestedExchangeDates } from "./utils";
import type { Shift, SwapRequest } from "@/types/domain";

const baseRequest: SwapRequest = {
  id: "request-1",
  requesterId: "user-1",
  shiftId: "shift-1",
  status: "Open",
  mode: "Exchange",
  requestedDate: "2026-05-01",
  requestedShiftCodes: ["M"],
  offeredShiftCodes: ["M"],
  proposedDates: [],
  acceptedBy: null,
  accepterName: undefined,
  acceptedDate: null,
  accepterPreviousShiftCodes: [],
  requesterSignedAt: null,
  accepterSignedAt: null,
  signatureStatus: "Unsigned"
};

describe("swap request helpers", () => {
  it("derives signature status", () => {
    expect(getSignatureStatus({ requesterSignedAt: null, accepterSignedAt: null })).toBe("Unsigned");
    expect(getSignatureStatus({ requesterSignedAt: "2026-05-01T10:00:00Z", accepterSignedAt: null })).toBe("PartiallySigned");
    expect(getSignatureStatus({ requesterSignedAt: "2026-05-01T10:00:00Z", accepterSignedAt: "2026-05-01T10:05:00Z" })).toBe("Signed");
  });

  it("filters own requests by pending acceptance and pending signature", () => {
    const requests: SwapRequest[] = [
      baseRequest,
      { ...baseRequest, id: "request-2", status: "Accepted", signatureStatus: "PartiallySigned", acceptedBy: "user-2" },
      { ...baseRequest, id: "request-3", status: "Accepted", signatureStatus: "Signed", acceptedBy: "user-2", requesterSignedAt: "now", accepterSignedAt: "now" }
    ];

    expect(filterOwnSwapRequests(requests, "all")).toHaveLength(3);
    expect(filterOwnSwapRequests(requests, "pending").map((request) => request.id)).toEqual(["request-1"]);
    expect(filterOwnSwapRequests(requests, "signature").map((request) => request.id)).toEqual(["request-2"]);
  });

  it("suggests free days that do not break the night-before-morning rule", () => {
    const shifts: Shift[] = [
      { id: "morning", userId: "user-1", shiftDate: "2026-05-01", shiftCodes: ["M"] },
      { id: "night", userId: "user-1", shiftDate: "2026-05-02", shiftCodes: ["N"] },
      { id: "free-bad", userId: "user-1", shiftDate: "2026-05-03", shiftCodes: ["L"] },
      { id: "free-good", userId: "user-1", shiftDate: "2026-05-04", shiftCodes: ["L"] }
    ];

    expect(getSuggestedExchangeDates({ shifts, requestedDate: "2026-05-01", daysAhead: 3 })).toEqual(["2026-05-04"]);
  });
});
