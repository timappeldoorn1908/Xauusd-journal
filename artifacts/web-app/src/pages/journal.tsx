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
                                <p className="text-[11px] text-zinc-50
