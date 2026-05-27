import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface Trade {
  id: string;
  date: string;
  type: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  pips: number;
  pnl: number;
  reason: string;
  emotion: string;
  rating: number;
  beforeScreenshotUrl?: string | null;
  afterScreenshotUrl?: string | null;
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

interface WeeklySummaryProps {
  trades: Trade[];
}

export function WeeklySummary({ trades }: WeeklySummaryProps) {
  const { monday, sunday } = getWeekRange();

  const weekTrades = trades.filter((t) => {
    const d = new Date(t.date + "T00:00:00");
    return d >= monday && d <= sunday;
  });

  const wins = weekTrades.filter((t) => t.pnl > 0);
  const losses = weekTrades.filter((t) => t.pnl < 0);
  const totalPnl = weekTrades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = weekTrades.length > 0 ? (wins.length / weekTrades.length) * 100 : 0;

  const avgRR =
    weekTrades.length > 0
      ? weekTrades.reduce((sum, t) => {
          const diff = Math.abs(t.exitPrice - t.entryPrice);
          return sum + (diff > 0 ? diff / t.entryPrice : 0);
        }, 0) / weekTrades.length
      : 0;

  const hasData = weekTrades.length > 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Weekly Summary</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –{" "}
            {sunday.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <span className="text-xs text-zinc-600 bg-zinc-800 px-2.5 py-1 rounded-full">
          {weekTrades.length} trade{weekTrades.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/40 p-3.5">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Win Rate</p>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums",
              !hasData && "text-zinc-600",
              hasData && winRate >= 50 && "text-emerald-400",
              hasData && winRate < 50 && "text-red-400"
            )}
          >
            {hasData ? `${winRate.toFixed(0)}%` : "—"}
          </p>
          {hasData && (
            <p className="text-xs text-zinc-500 mt-1">
              {wins.length}W / {losses.length}L
            </p>
          )}
        </div>

        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/40 p-3.5">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Avg RR</p>
          <p className={cn("text-2xl font-bold tabular-nums", !hasData ? "text-zinc-600" : "text-amber-400")}>
            {hasData ? `1:${(avgRR * 100).toFixed(1)}` : "—"}
          </p>
          {hasData && <p className="text-xs text-zinc-500 mt-1">Risk / Reward</p>}
        </div>

        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/40 p-3.5 min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">Total P&amp;L</p>
          <div className="flex items-center gap-1 min-w-0">
            {hasData && totalPnl > 0 && <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 hidden sm:block" />}
            {hasData && totalPnl < 0 && <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0 hidden sm:block" />}
            {hasData && totalPnl === 0 && <Minus className="w-3.5 h-3.5 text-zinc-400 shrink-0 hidden sm:block" />}
            <p
              className={cn(
                "text-sm sm:text-2xl font-bold tabular-nums truncate",
                !hasData && "text-zinc-600",
                hasData && totalPnl > 0 && "text-emerald-400",
                hasData && totalPnl < 0 && "text-red-400",
                hasData && totalPnl === 0 && "text-zinc-400"
              )}
            >
              {hasData
                ? (totalPnl >= 0 ? "+$" : "-$") + Math.abs(totalPnl).toFixed(2)
                : "—"}
            </p>
          </div>
          {hasData && <p className="text-xs text-zinc-500 mt-1">USD</p>}
        </div>
      </div>
    </div>
  );
}
