import { describe, expect, it } from "vitest";
import { getCalendarSwapAnnotations } from "./swap-annotations";
import type { SwapRequest } from "@/types/domain";

const baseRequest: SwapRequest = {
  id: "swap-1",
  requesterId: "user-a",
  shiftId: "shift-1",
  status: "Accepted",
  mode: "Exchange",
  requestedDate: "2026-05-13",
  requestedShiftCodes: ["M"],
  offeredShiftCodes: ["M"],
  proposedDates: ["2026-05-15"],
  acceptedBy: "user-b",
  accepterName: "Bruno Diaz",
  acceptedDate: "2026-05-15",
  accepterPreviousShiftCodes: ["N"],
  requesterSignedAt: null,
  accepterSignedAt: null,
  signatureStatus: "Unsigned",
  requesterName: "Ana Soto"
};

describe("calendar swap annotations", () => {
  it("describes accepted exchanges from the requester perspective", () => {
    expect(getCalendarSwapAnnotations({ id: "user-a" }, [baseRequest])).toMatchObject([
      { date: "2026-05-13", direction: "coveredByOther", personName: "Bruno", relatedDate: "2026-05-15", exchangeKind: "dayExchange" },
      { date: "2026-05-15", direction: "coveredByMe", personName: "Bruno", relatedDate: "2026-05-13", exchangeKind: "dayExchange" }
    ]);
  });

  it("describes accepted exchanges from the accepter perspective", () => {
    expect(getCalendarSwapAnnotations({ id: "user-b" }, [baseRequest])).toMatchObject([
      { date: "2026-05-13", direction: "coveredByMe", personName: "Ana", relatedDate: "2026-05-15", exchangeKind: "dayExchange" },
      { date: "2026-05-15", direction: "coveredByOther", personName: "Ana", relatedDate: "2026-05-13", exchangeKind: "dayExchange" }
    ]);
  });

  it("marks accepted coverage without an exchanged date as an open change", () => {
    const coverageRequest: SwapRequest = {
      ...baseRequest,
      mode: "Coverage",
      proposedDates: [],
      acceptedDate: null,
      accepterPreviousShiftCodes: ["L"]
    };

    expect(getCalendarSwapAnnotations({ id: "user-a" }, [coverageRequest])).toMatchObject([
      { date: "2026-05-13", direction: "coveredByOther", personName: "Bruno", relatedDate: null, exchangeKind: "openChange" }
    ]);
  });
});
