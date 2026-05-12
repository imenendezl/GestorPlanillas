import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatShiftCodes, getShiftColorClassName } from "@/lib/utils/shift";
import type { ShiftCode } from "@/types/domain";

export function ShiftBadge({ codes, compact = false, className }: { codes: ShiftCode[]; compact?: boolean; className?: string }) {
  return (
    <Badge className={cn("justify-center border", getShiftColorClassName(codes, "solid"), compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1", className)}>
      {compact ? codes.join("+") : formatShiftCodes(codes)}
    </Badge>
  );
}
