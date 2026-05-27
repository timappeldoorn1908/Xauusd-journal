import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PnlDisplayProps {
  type: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
}

function calculate(type: "long" | "short", entry: number, exit: number, lots: number) {
  const raw = exit - entry;
  const multiplier = type === "long" ? 1 : -1;
  const priceDiff = raw * multiplier;
  const pips = Math.round(priceDiff * 10 * 100) / 100;
  const pnl = Math.round(priceDiff * lots * 100 * 100) / 100;
  return { pips, pnl };
}

export function PnlDisplay({ type, entryPrice, exitPrice, lotSize }: PnlDisplayProps) {
  const valid = entryPrice > 0 && exitPrice > 0 && lotSize > 0;
  const { pips, pnl } = valid
    ? calculate(type, entryPrice, exitPrice, lotSize)
    : { pips: 0, pnl: 0 };

  const isProfit = pnl > 0;
  const isLoss = pnl < 0;

  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      <div
        className={cn(
          "rounded-xl border p-4 flex flex-col gap-1 transition-colors",
          !valid && "border-zinc-800 bg-zinc-900/40",
          valid && isProfit && "border-emerald-500/30 bg-emerald-500/5",
          valid && isLoss && "border-red-500/30 bg-red-500/5",
          valid && !isProfit && !isLoss && "border-zinc-700 bg-zinc-900/40"
        )}
      >
        <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">Pips</span>
        <div className="flex items-center gap-1.5">
          {valid && isProfit && <TrendingUp className="w-4 h-4 text-emerald-400" />}
          {valid && isLoss && <TrendingDown className="w-4 h-4 text-red-400" />}
          <span
            className={cn(
              "text-2xl font-semibold tabular-nums",
              !valid && "text-zinc-600",
              valid && isProfit && "text-emerald-400",
              valid && isLoss && "text-red-400",
              valid && !isProfit && !isLoss && "text-zinc-400"
            )}
          >
            {valid ? (pips >= 0 ? "+" : "") + pips.toFixed(1) : "—"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "rounded-xl border p-4 flex flex-col gap-1 transition-colors",
          !valid && "border-zinc-800 bg-zinc-900/40",
          valid && isProfit && "border-emerald-500/30 bg-emerald-500/5",
          valid && isLoss && "border-red-500/30 bg-red-500/5",
          valid && !isProfit && !isLoss && "border-zinc-700 bg-zinc-900/40"
        )}
      >
        <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">P&amp;L (USD)</span>
        <div className="flex items-center gap-1.5">
          {valid && isProfit && <TrendingUp className="w-4 h-4 text-emerald-400" />}
          {valid && isLoss && <TrendingDown className="w-4 h-4 text-red-400" />}
          <span
            className={cn(
              "text-2xl font-semibold tabular-nums",
              !valid && "text-zinc-600",
              valid && isProfit && "text-emerald-400",
              valid && isLoss && "text-red-400",
              valid && !isProfit && !isLoss && "text-zinc-400"
            )}
          >
            {valid ? (pnl >= 0 ? "+$" : "-$") + Math.abs(pnl).toFixed(2) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
