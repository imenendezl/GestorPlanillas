import { cn } from "@/lib/utils/cn";
import { shiftDefinitionsByCode, sortShiftCodes } from "@/lib/utils/shift";
import type { CalendarSwapAnnotation } from "@/lib/calendar/swap-annotations";
import type { ShiftCode } from "@/types/domain";

type ShiftCellProps = {
  day: number;
  codes?: ShiftCode[];
  currentMonth?: boolean;
  selected?: boolean;
  today?: boolean;
  warning?: boolean;
  annotations?: CalendarSwapAnnotation[];
  ownRequest?: boolean;
  visibleRequest?: boolean;
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
      background: `linear-gradient(135deg, ${firstDefinition.backgroundColor} 0 50%, ${secondDefinition.backgroundColor} 50% 100%)`,
      color: "#ffffff"
    };
  }

  return {
    backgroundColor: firstDefinition.backgroundColor,
    color: firstDefinition.foregroundColor
  };
}

export function ShiftCell({
  day,
  codes,
  currentMonth = true,
  selected = false,
  today = false,
  warning = false,
  annotations = [],
  ownRequest = false,
  visibleRequest = false,
  className
}: ShiftCellProps) {
  const sortedCodes = sortShiftCodes(codes ?? []);
  const hasShift = sortedCodes.length > 0;
  const label = sortedCodes.map((code) => shiftDefinitionsByCode.get(code)?.shortLabel ?? code).join("");

  return (
    <span
      className={cn(
        "relative flex h-full min-h-[3.4rem] w-full min-w-0 items-center justify-center overflow-hidden rounded-apple border p-1.5 transition sm:min-h-14 sm:p-1.5 lg:min-h-[4.25rem]",
        hasShift
          ? "border-black/10 shadow-[0_2px_8px_rgba(15,23,42,0.16)] dark:border-white/15 dark:shadow-[0_2px_10px_rgba(0,0,0,0.34)]"
          : "border-slate-300 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_1px_4px_rgba(15,23,42,0.08)] dark:border-zinc-600 dark:bg-zinc-800 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_8px_rgba(0,0,0,0.22)]",
        !currentMonth && "opacity-55",
        today && !selected && "ring-2 ring-destructive ring-offset-0",
        selected && "ring-2 ring-emerald-600 ring-offset-0",
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
      <span className={cn("absolute right-1.5 top-1 z-20 text-xs font-semibold sm:right-1.5 sm:top-1 lg:text-[11px]", hasShift && "drop-shadow-sm")}>
        {day}
      </span>
      {visibleRequest && (
        <span aria-hidden="true" className="absolute left-1.5 top-1.5 z-20 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500 ring-1 ring-white/70" />
        </span>
      )}
      {hasShift && (
        <span className="z-20 text-base font-bold leading-none tracking-normal [text-shadow:0_1px_2px_rgba(0,0,0,0.45)] lg:text-sm">
          {label}
        </span>
      )}
      {ownRequest && annotations.length === 0 && (
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 z-20 h-2 bg-amber-500" />
      )}
      {annotations.length > 0 && (
        <span className="absolute inset-x-1 bottom-1 z-20 flex min-w-0 justify-center">
          <span
            className={cn(
              "inline-flex max-w-full items-center gap-1 truncate rounded-full px-1.5 py-0.5 text-[0.56rem] font-bold leading-none shadow-sm sm:text-[0.62rem]",
              annotations.length > 1
                ? "bg-violet-950/85 text-white"
                : annotations[0].direction === "coveredByMe"
                  ? "bg-rose-50 text-rose-900 ring-1 ring-rose-600/35 dark:bg-rose-200 dark:text-rose-950"
                  : "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600/35 dark:bg-emerald-200 dark:text-emerald-950"
            )}
          >
            {annotations.length > 1 ? `${annotations.length} cambios` : annotations[0].personName}
          </span>
        </span>
      )}
    </span>
  );
}
