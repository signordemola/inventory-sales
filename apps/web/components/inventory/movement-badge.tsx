import { cn } from "@/lib/utils";
import { StockMovementType } from "@/hooks/use-inventory";

export function MovementBadge({ type }: { type: StockMovementType }) {
  const styles: Record<StockMovementType, string> = {
    IN: "bg-emerald-50 text-emerald-700 border-emerald-200",
    OUT: "bg-red-50 text-red-700 border-red-200",
    ADJUSTMENT: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border tracking-wider",
        styles[type],
      )}
    >
      {type}
    </span>
  );
}
