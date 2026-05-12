import type { ShiftCode } from "@/types/domain";

export const shiftLabels: Record<ShiftCode, string> = {
  M: "Mañana",
  T: "Tarde",
  N: "Noche",
  "-": "Saliente",
  L: "Libre"
};

const validSingleCodes = new Set<ShiftCode>(["M", "T", "N", "-", "L"]);
const validDoubleCodes = new Set(["M+T", "M+N", "T+N"]);

export function normalizeShiftCodes(value: string | ShiftCode[]) {
  const rawCodes = Array.isArray(value)
    ? value
    : value
        .split(/[,+\s]+/)
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean);

  if (rawCodes.length === 0) {
    return ["L"] as ShiftCode[];
  }

  const codes = rawCodes.map((code) => (code === "" ? "L" : code)) as ShiftCode[];
  const key = codes.join("+");

  if (codes.length === 1 && validSingleCodes.has(codes[0])) {
    return codes;
  }

  if (codes.length === 2 && validDoubleCodes.has(key)) {
    return codes;
  }

  throw new Error("Turno no válido. Usa M, T, N, -, L o M+T, M+N, T+N.");
}

export function parseBulkShiftSequence(value: string) {
  return value
    .split(",")
    .map((entry) => normalizeShiftCodes(entry.trim()))
    .filter((codes) => codes.length > 0);
}

export function formatShiftCodes(codes: ShiftCode[]) {
  return codes.map((code) => shiftLabels[code]).join(" + ");
}

export function canSeeSwapRequest(viewer: { unit: string; position: string }, requester: { unit: string; position: string }) {
  return viewer.unit === requester.unit && viewer.position === requester.position;
}

export function canGrantSupervisor(role: string) {
  return role === "Admin" || role === "Supervisor";
}
