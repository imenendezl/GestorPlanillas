import { cn } from "@/lib/utils/cn";
import { shiftDefinitionsByCode, sortShiftCodes } from "@/lib/utils/shift";
import type { ShiftCode } from "@/types/domain";

type ShiftCellProps = {
  day: number;
  codes?: ShiftCode[];
  currentMonth?: boolean;
  selected?: boolean;
  warning?: boolean;
  className?: string;
};

function getCellStyle(codes?: ShiftCode[]) {
  const sortedCodes = sortShiftCodes(codes ?? []);

  if (sortedCodes.length === 0) {
    return undefined;
  }

  const firstDefinition = shiftDefinitionsByCode.get(sortedCodes[0]);
  const secondDefinition = sortedCodes[1] ? shiftDefinitionsByCode.get(sortedCodes[1]) : undefined;

  if (!firstDefinition) {
    return undefined;
  }

  if (secondDefinition) {
    return {
      background: `linear-gradient(135deg, ${firstDefinition.backgroundColor} 0 49.5%, rgba(255,255,255,0.7) 49.5% 50.5%, ${secondDefinition.backgroundColor} 50.5% 100%)`,
      color: "#ffffff"
    };
  }

  return {
    backgroundColor: firstDefinition.backgroundColor,
    color: firstDefinition.foregroundColor
  };
}

export function ShiftCell({ day, codes, currentMonth = true, selected = false, warning = false, className }: ShiftCellProps) {
  const sortedCodes = sortShiftCodes(codes ?? []);
  const hasShift = sortedCodes.length > 0;
  const label = sortedCodes.map((code) => shiftDefinitionsByCode.get(code)?.shortLabel ?? code).join("");

  return (
    <span
      className={cn(
        "relative flex h-full min-h-14 w-full min-w-0 items-center justify-center overflow-hidden rounded-lg border p-1.5 transition sm:min-h-16 sm:p-2 lg:min-h-[4.5rem]",
        hasShift ? "border-transparent shadow-sm" : "border-border bg-background",
        !currentMonth && "opacity-55",
        className
      )}
      style={getCellStyle(sortedCodes)}
    >
      {selected && <span aria-hidden="true" className="absolute inset-0 z-10 bg-emerald-500/25" />}
      {warning && (
        <span
          aria-hidden="true"
          className="absolute inset-0 z-10 bg-[repeating-linear-gradient(135deg,rgba(239,68,68,0.42)_0,rgba(239,68,68,0.42)_4px,transparent_4px,transparent_9px)]"
        />
      )}
      <span className={cn("absolute right-1.5 top-1 z-20 text-xs font-semibold sm:right-2 sm:top-1.5 sm:text-sm", hasShift && "drop-shadow-sm")}>
        {day}
      </span>
      {hasShift && <span className="z-20 text-base font-bold leading-none tracking-normal sm:text-lg">{label}</span>}
    </span>
  );
}
