"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { shiftDefinitionsByCode } from "@/lib/utils/shift";
import type { ShiftCode } from "@/types/domain";

export function ShiftOptionButton({
  code,
  selected,
  disabled,
  onToggle
}: {
  code: ShiftCode;
  selected: boolean;
  disabled?: boolean;
  onToggle: (code: ShiftCode) => void;
}) {
  const definition = shiftDefinitionsByCode.get(code)!;

  return (
    <button
      className={cn(
        "flex min-h-14 w-full items-center justify-between rounded-apple border px-4 py-3 text-left transition active:scale-[0.98]",
        definition.mutedColorClassName,
        selected && definition.colorClassName,
        disabled && "cursor-not-allowed opacity-45"
      )}
      disabled={disabled}
      onClick={() => onToggle(code)}
      type="button"
    >
      <span className="text-sm font-semibold uppercase tracking-normal">{definition.label}</span>
      {selected && <Check className="h-4 w-4" />}
    </button>
  );
}
