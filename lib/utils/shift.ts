import type { ShiftCode } from "@/types/domain";

export type ShiftDefinition = {
  code: ShiftCode;
  label: string;
  shortLabel: string;
  backgroundColor: string;
  foregroundColor: string;
  colorClassName: string;
  mutedColorClassName: string;
  order: number;
};

export const shiftDefinitions: ShiftDefinition[] = [
  {
    code: "M",
    label: "Mañana",
    shortLabel: "M",
    backgroundColor: "#0284c7",
    foregroundColor: "#ffffff",
    colorClassName: "bg-sky-600 text-white border-sky-600",
    mutedColorClassName: "bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-800",
    order: 10
  },
  {
    code: "T",
    label: "Tarde",
    shortLabel: "T",
    backgroundColor: "#f59e0b",
    foregroundColor: "#ffffff",
    colorClassName: "bg-amber-500 text-white border-amber-500",
    mutedColorClassName: "bg-amber-50 text-amber-950 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800",
    order: 20
  },
  {
    code: "N",
    label: "Noche",
    shortLabel: "N",
    backgroundColor: "#4338ca",
    foregroundColor: "#ffffff",
    colorClassName: "bg-indigo-700 text-white border-indigo-700",
    mutedColorClassName: "bg-indigo-50 text-indigo-950 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-100 dark:border-indigo-800",
    order: 30
  },
  {
    code: "-",
    label: "Saliente",
    shortLabel: "−",
    backgroundColor: "#71717a",
    foregroundColor: "#ffffff",
    colorClassName: "bg-zinc-500 text-white border-zinc-500",
    mutedColorClassName: "bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600",
    order: 40
  },
  {
    code: "L",
    label: "Libre",
    shortLabel: "L",
    backgroundColor: "#e4e4e7",
    foregroundColor: "#18181b",
    colorClassName: "bg-zinc-200 text-zinc-950 border-zinc-200 dark:bg-zinc-700 dark:text-white dark:border-zinc-700",
    mutedColorClassName: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700",
    order: 50
  }
];

export const shiftDefinitionsByCode = new Map(shiftDefinitions.map((definition) => [definition.code, definition]));

export const shiftLabels: Record<ShiftCode, string> = Object.fromEntries(
  shiftDefinitions.map((definition) => [definition.code, definition.label])
) as Record<ShiftCode, string>;

const validSingleCodes = new Set(shiftDefinitions.map((definition) => definition.code));
const validDoubleCodes = new Set(["M+T", "M+N", "T+N"]);

export function sortShiftCodes(codes: ShiftCode[]) {
  return [...codes].sort((first, second) => {
    return (shiftDefinitionsByCode.get(first)?.order ?? 999) - (shiftDefinitionsByCode.get(second)?.order ?? 999);
  });
}

export function isValidShiftCombination(codes: ShiftCode[]) {
  const uniqueCodes = Array.from(new Set(codes));

  if (uniqueCodes.length === 0) {
    return true;
  }

  if (uniqueCodes.length === 1) {
    return validSingleCodes.has(uniqueCodes[0]);
  }

  if (uniqueCodes.includes("L") || uniqueCodes.includes("-")) {
    return false;
  }

  return validDoubleCodes.has(sortShiftCodes(uniqueCodes).join("+"));
}

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

  const codes = sortShiftCodes(Array.from(new Set(rawCodes.map((code) => (code === "" ? "L" : code)) as ShiftCode[])));

  if (isValidShiftCombination(codes)) {
    return codes.length === 0 ? (["L"] as ShiftCode[]) : codes;
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
  return sortShiftCodes(codes).map((code) => shiftLabels[code]).join(" + ");
}

export function getShiftColorClassName(codes: ShiftCode[], tone: "solid" | "muted" = "solid") {
  const primaryCode = sortShiftCodes(codes)[0] ?? "L";
  const definition = shiftDefinitionsByCode.get(primaryCode) ?? shiftDefinitionsByCode.get("L")!;
  return tone === "solid" ? definition.colorClassName : definition.mutedColorClassName;
}

export function canSeeSwapRequest(viewer: { unit: string; position: string }, requester: { unit: string; position: string }) {
  return viewer.unit === requester.unit && viewer.position === requester.position;
}

export function canGrantSupervisor(role: string) {
  return role === "Admin" || role === "Supervisor";
}
