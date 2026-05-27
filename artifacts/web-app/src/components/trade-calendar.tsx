import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Trade } from "./weekly-summary";

function computePnl(trade: Trade): number {
  const raw = trade.exitPrice - trade.entryPrice;
  const multiplier = trade.direction === "long" ? 1 : -1;
  return Math.round(raw * multiplier * trade.lotSize * 100 * 100) / 100;
}

interface TradeCalendarProps {
  trades: Trade[];
  selectedDate: string | null;
  onDayClick: (dateKey: string | null) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function TradeCalendar({ trades, selectedDate, onDayClick }: TradeCalendarProps) {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const pnlByDate: Record<string, number> = {};
  for (const trade of trades) {
    const key = trade.date.slice(0, 10);
    pnlByDate[key] = (pnlByDate[key] ?? 0) + computePnl(trade);
  }

  const firstDay = new Date(current.year, current.month, 1);
  const lastDay = new Date(current.year, current.month + 1, 0);

  let startDow = firstDay.getDay();
  if (startDow === 0) startDow = 7;
  const blanks = startDow - 1;

  const days: (number | null)[] = [
    ...Array(blanks).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
  ];

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  function prev() {
    setCurrent((c) => {
      const m = c.month === 0 ? 11 : c.month - 1;
      const y = c.month === 0 ? c.year - 1 : c.year;
      return { year: y, month: m };
    });
  }

  function next() {
    setCurrent((c) => {
      const m = c.month === 11 ? 0 : c.month + 1;
      const y = c.month === 11 ? c.year + 1 : c.year;
      return { year: y, month: m };
    });
  }

  function handleDayClick(key: string, hasTrade: boolean) {
    if (!hasTrade) return;
    onDayClick(selectedDate === key ? null : key);
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">
          {MONTHS[current.month]} {current.year}
        </h3>
        <div className="flex items-center gap-2">
          {selectedDate && (
            <button
              onClick={() => onDayClick(null)}
              className="text-[11px] font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2.5 py-1 rounded-lg transition-colors"
            >
              Show All
            </button>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-zinc-600 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (day === null) return <div key={di} />;
              const key = `${current.year}-${pad(current.month + 1)}-${pad(day)}`;
              const pnl = pnlByDate[key];
              const isToday = key === todayKey;
              const hasTrade = pnl !== undefined;
              const isProfit = hasTrade && pnl > 0;
              const isLoss = hasTrade && pnl < 0;
              const isBreakeven = hasTrade && pnl === 0;
              const isSelected = selectedDate === key;

              return (
                <button
                  key={di}
                  type="button"
                  onClick={() => handleDayClick(key, hasTrade)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg aspect-square text-xs font-medium transition-all focus:outline-none",
                    !hasTrade && "text-zinc-500 cursor-default",
                    hasTrade && "cursor-pointer",
                    !isSelected && isProfit && "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/30",
                    !isSelected && isLoss && "bg-red-500/15 text-red-300 border border-red-500/20 hover:bg-red-500/30",
                    !isSelected && isBreakeven && "bg-zinc-700/40 text-zinc-400 border border-zinc-600/30",
                    !isSelected && isToday && !hasTrade && "ring-1 ring-amber-500/60 text-amber-400",
                    isSelected && "ring-2 ring-amber-400 ring-offset-1 ring-offset-zinc-900 scale-105 z-10",
                    isSelected && isProfit && "bg-emerald-500/25 text-emerald-200 border border-emerald-400/40",
                    isSelected && isLoss && "bg-red-500/25 text-red-200 border border-red-400/40",
                  )}
                >
                  <span>{day}</span>
                  {hasTrade && (
                    <span className={cn(
                      "text-[9px] font-semibold leading-none mt-0.5",
                      isProfit && "text-emerald-400",
                      isLoss && "text-red-400",
                      isBreakeven && "text-zinc-500"
                    )}>
                      {isProfit ? "+" : pnl < 0 ? "-" : ""}${Math.abs(pnl).toFixed(0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/50 border border-emerald-500/30" />
          <span className="text-[11px] text-zinc-500">Profit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500/50 border border-red-500/30" />
          <span className="text-[11px] text-zinc-500">Loss</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-zinc-600/50 border border-zinc-600/30" />
          <span className="text-[11px] text-zinc-500">Breakeven</span>
        </div>
        {hasTrades(pnlByDate) && (
          <span className="text-[11px] text-zinc-600 ml-auto">Click a day to filter</span>
        )}
      </div>
    </div>
  );
}

function hasTrades(pnlByDate: Record<string, number>) {
  return Object.keys(pnlByDate).length > 0;
}
