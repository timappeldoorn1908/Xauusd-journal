import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PnlDisplay } from "@/components/pnl-display";
import { StarRating } from "@/components/star-rating";
import { Trade } from "@/components/weekly-summary";
import { Camera, ImagePlus, TrendingDown, TrendingUp, Loader2, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const REASONS = [
  "Break of Structure",
  "Order Block",
  "Fair Value Gap",
  "Liquidity Sweep",
  "Support / Resistance",
  "Trendline Bounce",
  "News / Fundamental",
  "SMC Setup",
  "Price Action Signal",
  "Elliott Wave",
  "Other",
];

const EMOTIONS = [
  "Calm & Focused",
  "Confident",
  "Hesitant",
  "Impatient",
  "Fearful",
  "Greedy",
  "Revengeful",
  "FOMO",
  "Disciplined",
  "Anxious",
];

interface NewTradeFormProps {
  initialTrade?: Trade;
  onSave: (trade: Trade, beforeFile?: File | null, afterFile?: File | null) => void | Promise<void>;
  saving?: boolean;
}

function resolveReason(trade?: Trade): { reason: string; customReason: string } {
  if (!trade) return { reason: "", customReason: "" };
  if (REASONS.includes(trade.reason)) return { reason: trade.reason, customReason: "" };
  return { reason: "Other", customReason: trade.reason };
}

export function NewTradeForm({ initialTrade, onSave, saving = false }: NewTradeFormProps) {
  const { toast } = useToast();
  const isEditing = !!initialTrade;
  const today = new Date().toISOString().slice(0, 10);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const { reason: initReason, customReason: initCustomReason } = resolveReason(initialTrade);

  const [date, setDate] = useState(initialTrade?.date ?? today);
  const [type, setType] = useState<"long" | "short">(initialTrade?.type ?? "long");
  const [entryPrice, setEntryPrice] = useState(initialTrade ? String(initialTrade.entryPrice) : "");
  const [exitPrice, setExitPrice] = useState(initialTrade ? String(initialTrade.exitPrice) : "");
  const [lotSize, setLotSize] = useState(initialTrade ? String(initialTrade.lotSize) : "");
  const [reason, setReason] = useState(initReason);
  const [customReason, setCustomReason] = useState(initCustomReason);
  const [emotion, setEmotion] = useState(initialTrade?.emotion ?? "");
  const [rating, setRating] = useState(initialTrade?.rating ?? 0);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);

  const entry = parseFloat(entryPrice) || 0;
  const exit = parseFloat(exitPrice) || 0;
  const lots = parseFloat(lotSize) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (!date || !entryPrice || !exitPrice || !lotSize || !finalReason || !emotion) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    const raw = exit - entry;
    const mult = type === "long" ? 1 : -1;
    const pips = Math.round(raw * mult * 10 * 100) / 100;
    const pnl = Math.round(raw * mult * lots * 100 * 100) / 100;

    const trade: Trade = {
      id: initialTrade?.id ?? crypto.randomUUID(),
      date,
      type,
      entryPrice: entry,
      exitPrice: exit,
      lotSize: lots,
      pips,
      pnl,
      reason: finalReason,
      emotion,
      rating,
      beforeScreenshotUrl: initialTrade?.beforeScreenshotUrl,
      afterScreenshotUrl: initialTrade?.afterScreenshotUrl,
    };

    await onSave(trade, beforeFile, afterFile);
    toast({
      title: isEditing ? "Trade updated" : "Trade saved",
      description: isEditing ? "Your changes have been saved." : "Your trade has been added to the journal.",
    });

    if (!isEditing) {
      setEntryPrice("");
      setExitPrice("");
      setLotSize("");
      setReason("");
      setCustomReason("");
      setEmotion("");
      setRating(0);
      setBeforeFile(null);
      setAfterFile(null);
      setDate(today);
      setType("long");
      if (beforeInputRef.current) beforeInputRef.current.value = "";
      if (afterInputRef.current) afterInputRef.current.value = "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-zinc-800/50 border-zinc-700 text-white focus:border-amber-500/50 focus:ring-amber-500/20 [color-scheme:dark]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Direction</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("long")}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                  type === "long"
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    : "bg-zinc-800/40 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                )}
              >
                <TrendingUp className="w-4 h-4" />
                Long
              </button>
              <button
                type="button"
                onClick={() => setType("short")}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                  type === "short"
                    ? "bg-red-500/15 border-red-500/40 text-red-400"
                    : "bg-zinc-800/40 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                )}
              >
                <TrendingDown className="w-4 h-4" />
                Short
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Entry</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="2650.00"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Exit</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="2680.00"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Lots</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.10"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Result</Label>
            <PnlDisplay type={type} entryPrice={entry} exitPrice={exit} lotSize={lots} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Reason for Trade</Label>
            <Select value={reason} onValueChange={(v) => { setReason(v); if (v !== "Other") setCustomReason(""); }}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white focus:border-amber-500/50 focus:ring-amber-500/20 data-[placeholder]:text-zinc-600">
                <SelectValue placeholder="Select a reason…" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r} className="text-zinc-200 focus:bg-zinc-800 focus:text-white">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reason === "Other" && (
              <Input
                autoFocus
                placeholder="Describe your reason…"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20 mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Emotion / Psychology</Label>
            <Select value={emotion} onValueChange={setEmotion}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white focus:border-amber-500/50 focus:ring-amber-500/20 data-[placeholder]:text-zinc-600">
                <SelectValue placeholder="How were you feeling?" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {EMOTIONS.map((e) => (
                  <SelectItem key={e} value={e} className="text-zinc-200 focus:bg-zinc-800 focus:text-white">
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Setup Rating</Label>
            <div className="pt-1">
              <StarRating value={rating} onChange={setRating} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Screenshots</Label>
            <input
              ref={beforeInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
            />
            <input
              ref={afterInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
            />
            <div className="grid grid-cols-2 gap-3">
              {/* Before Entry */}
              <div className="space-y-1.5">
                {initialTrade?.beforeScreenshotUrl && !beforeFile && (
                  <div className="relative rounded-lg overflow-hidden border border-zinc-700/40 aspect-video">
                    <img src={initialTrade.beforeScreenshotUrl} alt="Current before" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-[10px] text-zinc-300 py-0.5">Current</div>
                  </div>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => beforeInputRef.current?.click()}
                    className={cn(
                      "w-full flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed transition-all text-xs font-medium",
                      beforeFile
                        ? "border-amber-500/40 bg-amber-500/5 text-amber-400"
                        : initialTrade?.beforeScreenshotUrl
                        ? "border-zinc-600/50 bg-zinc-800/20 text-zinc-500 hover:border-zinc-500 hover:text-zinc-400"
                        : "border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/30"
                    )}
                  >
                    {beforeFile ? (
                      <>
                        <Camera className="w-4 h-4 shrink-0" />
                        <span className="px-2 truncate w-full text-center">{beforeFile.name}</span>
                      </>
                    ) : initialTrade?.beforeScreenshotUrl ? (
                      <>
                        <RefreshCw className="w-4 h-4 shrink-0" />
                        <span>Replace Before</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 shrink-0" />
                        <span>Before Entry</span>
                      </>
                    )}
                  </button>
                  {beforeFile && (
                    <button
                      type="button"
                      onClick={() => { setBeforeFile(null); if (beforeInputRef.current) beforeInputRef.current.value = ""; }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-700 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* After Exit */}
              <div className="space-y-1.5">
                {initialTrade?.afterScreenshotUrl && !afterFile && (
                  <div className="relative rounded-lg overflow-hidden border border-zinc-700/40 aspect-video">
                    <img src={initialTrade.afterScreenshotUrl} alt="Current after" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-[10px] text-zinc-300 py-0.5">Current</div>
                  </div>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => afterInputRef.current?.click()}
                    className={cn(
                      "w-full flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed transition-all text-xs font-medium",
                      afterFile
                        ? "border-amber-500/40 bg-amber-500/5 text-amber-400"
                        : initialTrade?.afterScreenshotUrl
                        ? "border-zinc-600/50 bg-zinc-800/20 text-zinc-500 hover:border-zinc-500 hover:text-zinc-400"
                        : "border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/30"
                    )}
                  >
                    {afterFile ? (
                      <>
                        <ImagePlus className="w-4 h-4 shrink-0" />
                        <span className="px-2 truncate w-full text-center">{afterFile.name}</span>
                      </>
                    ) : initialTrade?.afterScreenshotUrl ? (
                      <>
                        <RefreshCw className="w-4 h-4 shrink-0" />
                        <span>Replace After</span>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5 shrink-0" />
                        <span>After Exit</span>
                      </>
                    )}
                  </button>
                  {afterFile && (
                    <button
                      type="button"
                      onClick={() => { setAfterFile(null); if (afterInputRef.current) afterInputRef.current.value = ""; }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-700 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? (isEditing ? "Saving…" : "Saving…") : isEditing ? "Save Changes" : "Save Trade"}
        </Button>
      </div>
    </form>
  );
}
