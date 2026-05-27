import { useState } from "react";
import { NewTradeForm } from "@/components/new-trade-form";
import { TradeCalendar } from "@/components/trade-calendar";
import { WeeklySummary, Trade } from "@/components/weekly-summary";
import { cn } from "@/lib/utils";
import { BarChart2, PlusCircle, Trash2, X } from "lucide-react";

const SAMPLE_TRADES: Trade[] = [
  {
    id: "1",
    date: "2026-05-05",
    direction: "long",
    entryPrice: 2620.5,
    exitPrice: 2648.2,
    lotSize: 0.5,
    reason: "Order Block",
    emotion: "Calm & Focused",
    rating: 5,
  },
  {
    id: "2",
    date: "2026-05-07",
    direction: "short",
    entryPrice: 2655.0,
    exitPrice: 2638.5,
    lotSize: 0.3,
    reason: "Fair Value Gap",
    emotion: "Confident",
    rating: 4,
  },
  {
    id: "3",
    date: "2026-05-12",
    direction: "long",
    entryPrice: 2641.0,
    exitPrice: 2629.5,
    lotSize: 0.4,
    reason: "Trendline Bounce",
    emotion: "Impatient",
    rating: 2,
  },
  {
    id: "4",
    date: "2026-05-14",
    direction: "short",
    entryPrice: 2668.0,
    exitPrice: 2645.0,
    lotSize: 0.5,
    reason: "Liquidity Sweep",
    emotion: "Disciplined",
    rating: 5,
  },
  {
    id: "5",
    date: "2026-05-19",
    direction: "long",
    entryPrice: 2630.0,
    exitPrice: 2622.5,
    lotSize: 0.2,
    reason: "Support / Resistance",
    emotion: "Fearful",
    rating: 2,
  },
  {
    id: "6",
    date: "2026-05-21",
    direction: "long",
    entryPrice: 2615.0,
    exitPrice: 2644.0,
    lotSize: 0.6,
    reason: "Break of Structure",
    emotion: "Calm & Focused",
    rating: 5,
  },
  {
    id: "7",
    date: "2026-05-26",
    direction: "short",
    entryPrice: 2658.0,
    exitPrice: 2641.0,
    lotSize: 0.4,
    reason: "Order Block",
    emotion: "Confident",
    rating: 4,
  },
];

type Tab = "new-trade" | "overview";

function tradePnl(trade: Trade) {
  const raw = trade.exitPrice - trade.entryPrice;
  const mult = trade.direction === "long" ? 1 : -1;
  return Math.round(raw * mult * trade.lotSize * 100 * 100) / 100;
}

function tradePips(trade: Trade) {
  const raw = trade.exitPrice - trade.entryPrice;
  const mult = trade.direction === "long" ? 1 : -1;
  return Math.round(raw * mult * 10 * 100) / 100;
}

export default function Journal() {
  const [activeTab, setActiveTab] = useState<Tab>("new-trade");
  const [trades, setTrades] = useState<Trade[]>(SAMPLE_TRADES);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function handleSave(trade: Trade) {
    setTrades((prev) => [...prev, trade]);
    setSelectedDate(null);
    setActiveTab("overview");
  }

  function handleDelete(id: string) {
    setTrades((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (selectedDate) {
        const stillHasDay = next.some((t) => t.date.slice(0, 10) === selectedDate);
        if (!stillHasDay) setSelectedDate(null);
      }
      return next;
    });
  }

  const sortedTrades = [...trades].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredTrades = selectedDate
    ? sortedTrades.filter((t) => t.date.slice(0, 10) === selectedDate)
    : sortedTrades;

  const selectedDateLabel = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <header className="py-8 flex items-center justify-between border-b border-zinc-800/60">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 text-xs font-bold">Au</span>
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-white">XAUUSD Journal</h1>
            </div>
            <p className="text-xs text-zinc-600 pl-8 -mt-0.5">Gold Trading — Personal Record</p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("new-trade")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === "new-trade"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <PlusCircle className="w-4 h-4" />
              New Trade
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === "overview"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <BarChart2 className="w-4 h-4" />
              Overview
            </button>
          </div>
        </header>

        <main className="mt-8">
          {activeTab === "new-trade" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-white">Log a Trade</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Record your XAUUSD trade with full context and analysis.</p>
              </div>
              <NewTradeForm onSave={handleSave} />
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Overview</h2>
                <p className="text-xs text-zinc-500">
                  {trades.length} trade{trades.length !== 1 ? "s" : ""} recorded
                </p>
              </div>

              <WeeklySummary trades={trades} />

              <TradeCalendar
                trades={trades}
                selectedDate={selectedDate}
                onDayClick={setSelectedDate}
              />

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="flex items-center justify-between mb-4">
                  {selectedDate ? (
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-semibold text-white">{selectedDateLabel}</h3>
                      <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                        {filteredTrades.length} trade{filteredTrades.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ) : (
                    <h3 className="text-sm font-semibold text-white">
                      All Trades
                      <span className="ml-2 text-[11px] font-normal text-zinc-500">
                        ({trades.length})
                      </span>
                    </h3>
                  )}

                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Show All
                    </button>
                  )}
                </div>

                {filteredTrades.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-sm">
                    No trades recorded
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTrades.map((trade) => {
                      const pnl = tradePnl(trade);
                      const pips = tradePips(trade);
                      const isProfit = pnl > 0;

                      return (
                        <div
                          key={trade.id}
                          className="group flex items-center justify-between py-3 px-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30 hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-1.5 h-8 rounded-full shrink-0",
                                isProfit ? "bg-emerald-400" : "bg-red-400"
                              )}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-white">
                                  {new Date(trade.date + "T00:00:00").toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                <span
                                  className={cn(
                                    "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                                    trade.direction === "long"
                                      ? "bg-emerald-500/15 text-emerald-400"
                                      : "bg-red-500/15 text-red-400"
                                  )}
                                >
                                  {trade.direction}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5">{trade.reason}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 text-right">
                            <div>
                              <p className="text-[11px] text-zinc-600 mb-0.5">Pips</p>
                              <p className={cn("text-sm font-semibold tabular-nums", isProfit ? "text-emerald-400" : "text-red-400")}>
                                {pips >= 0 ? "+" : ""}{pips.toFixed(1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-zinc-600 mb-0.5">P&amp;L</p>
                              <p className={cn("text-sm font-semibold tabular-nums", isProfit ? "text-emerald-400" : "text-red-400")}>
                                {pnl >= 0 ? "+$" : "-$"}{Math.abs(pnl).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <svg
                                  key={i}
                                  className={cn("w-3 h-3", i < trade.rating ? "text-amber-400" : "text-zinc-700")}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <button
                              onClick={() => handleDelete(trade.id)}
                              className="ml-1 p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete trade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
