import { addDays, toDateKey } from "@/lib/utils/date";
import { validateShift } from "@/lib/validation/shift-rules";
import type { Shift, ShiftCode, SignatureStatus, SwapRequest } from "@/types/domain";

export function getSignatureStatus(request: Pick<SwapRequest, "requesterSignedAt" | "accepterSignedAt">): SignatureStatus {
  if (request.requesterSignedAt && request.accepterSignedAt) {
    return "Signed";
  }

  if (request.requesterSignedAt || request.accepterSignedAt) {
    return "PartiallySigned";
  }

  return "Unsigned";
}

export function filterOwnSwapRequests(
  requests: SwapRequest[],
  filter: "all" | "pending" | "signature"
) {
  if (filter === "pending") {
    return requests.filter((request) => request.status === "Open");
  }

  if (filter === "signature") {
    return requests.filter((request) => request.status === "Accepted" && request.signatureStatus !== "Signed");
  }

  return requests;
}

export function getSuggestedExchangeDates(input: {
  shifts: Array<Pick<Shift, "shiftDate" | "shiftCodes">>;
  requestedDate: string;
  daysAhead?: number;
}) {
  const { shifts, requestedDate, daysAhead = 45 } = input;
  const shiftsByDate = new Map(shifts.map((shift) => [shift.shiftDate, shift.shiftCodes]));
  const requestedCodes = shiftsByDate.get(requestedDate);

  if (!requestedCodes || requestedCodes.includes("L")) {
    return [];
  }

  const startDate = new Date(`${requestedDate}T00:00:00`);
  const suggestions: string[] = [];

  for (let offset = 1; offset <= daysAhead; offset += 1) {
    const candidateDate = toDateKey(addDays(startDate, offset));
    const candidateCodes = shiftsByDate.get(candidateDate) ?? (["L"] as ShiftCode[]);

    if (!candidateCodes.includes("L")) {
      continue;
    }

    const nextShifts = shifts.map((shift) => (
      shift.shiftDate === candidateDate ? { ...shift, shiftCodes: requestedCodes } : shift
    ));
    const result = validateShift({
      date: candidateDate,
      shiftCodes: requestedCodes,
      existingShifts: nextShifts
    });

    if (result.valid) {
      suggestions.push(candidateDate);
    }
  }

  return suggestions;
}
