import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NewTradeForm } from "@/components/new-trade-form";
import { TradeCalendar } from "@/components/trade-calendar";
import { WeeklySummary, Trade } from "@/components/weekly-summary";
import { useTrades, useInsertTrade, useUpdateTrade, useDeleteTrade } from "@/hooks/use-trades";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  PlusCircle,
  Trash2,
  X,
  ChevronDown,
  Camera,
  ImagePlus,
  Loader2,
  AlertCircle,
  Pencil,
} from "lucide-react";

type Tab = "new-trade" | "overview";

export default function Journal() {
  const [activeTab, setActiveTab] = useState<Tab>("new-trade");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const { data: trades = [], isLoading, isError, error } = useTrades();
  const insertTrade = useInsertTrade();
  const updateTrade = useUpdateTrade();
  const deleteTrade = useDeleteTrade();

  async function handleSave(trade: Trade, beforeFile?: File | null, afterFile?: File | null) {
    await insertTrade.mutateAsync({ trade, beforeFile, afterFile });
    setSelectedDate(null);
    setActiveTab("overview");
  }

  async function handleUpdate(trade: Trade, beforeFile?: File | null, afterFile?: File | null) {
    if (!editingTrade) return;
    await updateTrade.mutateAsync({ id: editingTrade.id, trade: { ...trade, id: editingTrade.id }, beforeFile, afterFile });
    setEditingTrade(null);
  }

  function handleDelete(id: string, date: string) {
    const remainingOnDay = trades.filter(
      (t) => t.id !== id && t.date.slice(0, 10) === date.slice(0, 10)
    );
    if (selectedDate && remainingOnDay.length === 0) setSelectedDate(null);
    if (expandedId === id) setExpandedId(null);
    deleteTrade.mutate(id);
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
              <NewTradeForm onSave={handleSave} saving={insertTrade.isPending} />
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white mb-1">Overview</h2>
                  <p className="text-xs text-zinc-500">
                    {isLoading ? "Loading…" : `${trades.length} trade${trades.length !== 1 ? "s" : ""} recorded`}
                  </p>
                </div>
                {isLoading && <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />}
              </div>

              {isError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-center gap-2.5 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{(error as Error)?.message ?? "Failed to load trades"}</span>
                </div>
              )}

              <WeeklySummary trades={trades} />
              <TradeCalendar trades={trades} selectedDate={selectedDate} onDayClick={setSelectedDate} />

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
                      <span className="ml-2 text-[11px] font-normal text-zinc-500">({trades.length})</span>
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

                {isLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-zinc-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading trades…</span>
                  </div>
                ) : filteredTrades.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-sm">
                    {trades.length === 0 ? "No trades yet — log your first trade." : "No trades on this day."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTrades.map((trade) => {
                      const isProfit = trade.pnl > 0;
                      const isExpanded = expandedId === trade.id;
                      const isDeleting = deleteTrade.isPending && deleteTrade.variables === trade.id;

                      return (
                        <div
                          key={trade.id}
                          className={cn(
                            "group rounded-xl border transition-colors overflow-hidden",
                            isDeleting && "opacity-50 pointer-events-none",
                            isExpanded
                              ? "bg-zinc-800/60 border-zinc-600/50"
                              : "bg-zinc-800/30 border-zinc-700/30 hover:bg-zinc-800/50"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                            className="w-full flex items-center justify-between py-3 px-4 text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn("w-1.5 h-8 rounded-full shrink-0", isProfit ? "bg-emerald-400" : "bg-red-400")} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-medium text-white">
                                    {new Date(trade.date + "T00:00:00").toLocaleDateString("en-GB", {
                                      day: "numeric", month: "short", year: "numeric",
                                    })}
                                  </span>
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                                    trade.type === "long" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                                  )}>
                                    {trade.type}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{trade.reason}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-4 text-right shrink-0 ml-2">
                              <div>
                                <p className="text-[11px] text-zinc-600 mb-0.5">Pips</p>
                                <p className={cn("text-sm font-semibold tabular-nums", isProfit ? "text-emerald-400" : "text-red-400")}>
                                  {trade.pips >= 0 ? "+" : ""}{trade.pips.toFixed(1)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] text-zinc-600 mb-0.5">P&amp;L</p>
                                <p className={cn("text-sm font-semibold tabular-nums", isProfit ? "text-emerald-400" : "text-red-400")}>
                                  {trade.pnl >= 0 ? "+$" : "-$"}{Math.abs(trade.pnl).toFixed(2)}
                                </p>
                              </div>
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-zinc-500"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </motion.div>
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                key="detail"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                style={{ overflow: "hidden" }}
                              >
                                <div className="px-4 pb-4 space-y-4 border-t border-zinc-700/40 pt-4">
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { label: "Entry", value: trade.entryPrice.toFixed(2) },
                                      { label: "Exit", value: trade.exitPrice.toFixed(2) },
                                      { label: "Lot Size", value: trade.lotSize.toFixed(2) },
                                    ].map(({ label, value }) => (
                                      <div key={label} className="rounded-lg bg-zinc-900/60 border border-zinc-700/30 px-3 py-2.5">
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-0.5">{label}</p>
                                        <p className="text-sm font-semibold text-white tabular-nums">{value}</p>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-lg bg-zinc-900/60 border border-zinc-700/30 px-3 py-2.5">
                                      <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Psychology</p>
                                      <p className="text-xs text-zinc-300 font-medium">{trade.emotion}</p>
                                    </div>
                                    <div className="rounded-lg bg-zinc-900/60 border border-zinc-700/30 px-3 py-2.5">
                                      <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Setup Rating</p>
                                      <div className="flex gap-0.5">
                                        {Array.from({ length: 5 }, (_, i) => (
                                          <svg key={i} className={cn("w-3.5 h-3.5", i < trade.rating ? "text-amber-400" : "text-zinc-700")} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {trade.notes && (
                                    <div className="rounded-lg bg-zinc-900/60 border border-zinc-700/30 px-3 py-2.5">
                                      <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1.5">Notes</p>
                                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
                                    </div>
                                  )}

                                  <div>
                                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Screenshots</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {trade.beforeScreenshotUrl ? (
                                        <div className="rounded-xl overflow-hidden border border-zinc-700/40 aspect-video">
                                          {trade.beforeScreenshotUrl ? (
  <div className="rounded-xl overflow-hidden border border-zinc-700/40 aspect-video">
    <img 
      src={trade.beforeScreenshotUrl} 
      alt="Before entry" 
      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => window.open(trade.beforeScreenshotUrl, '_blank')}
    />
  </div>
) : (
  <div className="rounded-xl border-2 border-dashed border-zinc-700/60 bg-zinc-900/40 aspect-video flex flex-col items-center justify-center gap-2 text-zinc-600">
    <Camera className="w-6 h-6" />
    <span className="text-[11px] font-medium">Before Entry</span>
    <span className="text-[10px] text-zinc-700">No screenshot attached</span>
  </div>
)}
{trade.afterScreenshotUrl ? (
  <div className="rounded-xl overflow-hidden border border-zinc-700/40 aspect-video">
    <img 
      src={trade.afterScreenshotUrl} 
      alt="After exit" 
      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => window.open(trade.afterScreenshotUrl, '_blank')}
    />
  </div>
) : (
  <div className="rounded-xl border-2 border-dashed border-zinc-700/60 bg-zinc-900/40 aspect-video flex flex-col items-center justify-center gap-2 text-zinc-600">
    <ImagePlus className="w-6 h-6" />
    <span className="text-[11px] font-medium">After Exit</span>
    <span className="text-[10px] text-zinc-700">No screenshot attached</span>
  </div>
)}
                                          
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-1 gap-2">
                                    <button
                                      onClick={() => setEditingTrade(trade)}
                                      className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 rounded-xl transition-colors active:bg-amber-500/20"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(trade.id, trade.date)}
                                      disabled={isDeleting}
                                      className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl transition-colors active:bg-red-500/20 disabled:opacity-50"
                                    >
                                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
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

      {/* Edit Trade Dialog */}
      <Dialog open={!!editingTrade} onOpenChange={(open) => { if (!open) setEditingTrade(null); }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-white text-base font-semibold">Edit Trade</DialogTitle>
            <p className="text-xs text-zinc-500 mt-0.5">Update the details of this trade. Screenshots can optionally be replaced.</p>
          </DialogHeader>
          {editingTrade && (
            <NewTradeForm
              initialTrade={editingTrade}
              onSave={handleUpdate}
              saving={updateTrade.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
