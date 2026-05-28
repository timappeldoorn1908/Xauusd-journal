import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PnlDisplay } from "@/components/pnl-display";
import { StarRating } from "@/components/star-rating";
import { Trade } from "@/components/weekly-summary";
import { Camera, ImagePlus, TrendingDown, TrendingUp, Loader2, X, RefreshCw, Plus, Trash2 } from "lucide-react";
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
  
  // Nieuwe state voor partials (meerdere exits)
  const [partials, setPartials] = useState<{ price: string; lots: string }[]>(
    // @ts-ignore - we laden de partials in als ze bestaan, anders de standaard exit/lots
    (initialTrade as any)?.partials?.length > 0 
      ? (initialTrade as any).partials.map((p: any) => ({ price: String(p.price), lots: String(p.lots) }))
      : [{ price: initialTrade ? String(initialTrade.exitPrice) : "", lots: initialTrade ? String(initialTrade.lotSize) : "" }]
  );

  const [reason, setReason] = useState(initReason);
  const [customReason, setCustomReason] = useState(initCustomReason);
  const [emotion, setEmotion] = useState(initialTrade?.emotion ?? "");
  const [rating, setRating] = useState(initialTrade?.rating ?? 0);
  const [notes, setNotes] = useState(initialTrade?.notes ?? "");
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);

  // Preview berekeningen voor live weergave van de winst/verlies
  const previewEntry = parseFloat(entryPrice) || 0;
  const previewMult = type === "long" ? 1 : -1;
  let previewLots = 0;
  let previewWeightedExit = 0;
  
  partials.forEach(p => {
    const pr = parseFloat(p.price) || 0;
    const l = parseFloat(p.lots) || 0;
    if (pr > 0 && l > 0) {
      previewLots += l;
      previewWeightedExit += (pr * l);
    }
  });
  const previewExit = previewLots > 0 ? previewWeightedExit / previewLots : 0;

  // Functies om partials toe te voegen, aan te passen of te verwijderen
  const addPartial = () => setPartials([...partials, { price: "", lots: "" }]);
  const removePartial = (index: number) => setPartials(partials.filter((_, i) => i !== index));
  const updatePartial = (index: number, field: "price" | "lots", value: string) => {
    const newPartials = [...partials];
    newPartials[index][field] = value;
    setPartials(newPartials);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    
    // Controleer of alle velden, inclusief alle partials, zijn ingevuld
    if (!date || !entryPrice || !finalReason || !emotion || partials.some(p => !p.price || !p.lots)) {
      toast({ title: "Missing fields", description: "Please fill in all required fields and exit levels.", variant: "destructive" });
      return;
    }

    const entry = parseFloat(entryPrice) || 0;
    const mult = type === "long" ? 1 : -1;
    
    let totalLots = 0;
    let totalPnl = 0;
    let weightedExitSum = 0;
    const validPartials: {price: number, lots: number}[] = [];

    // Bereken de exacte winst per afgesloten partial
    partials.forEach(p => {
      const pr = parseFloat(p.price) || 0;
      const l = parseFloat(p.lots) || 0;
      if (pr > 0 && l > 0) {
        totalLots += l;
        const raw = pr - entry;
        totalPnl += raw * mult * l * 100; // PnL per partial
        weightedExitSum += (pr * l);
        validPartials.push({ price: pr, lots: l });
      }
    });

    const avgExit = totalLots > 0 ? weightedExitSum / totalLots : 0;
    const avgRaw = avgExit - entry;
    const pips = Math.round(avgRaw * mult * 10 * 100) / 100;
    const pnl = Math.round(totalPnl * 100) / 100;

    const tradeBase = {
      id: initialTrade?.id ?? crypto.randomUUID(),
      date,
      type,
      entryPrice: entry,
      exitPrice: Math.round(avgExit * 100) / 100,
      lotSize: Math.round(totalLots * 100) / 100,
      pips,
      pnl,
      reason: finalReason,
      emotion,
      rating,
      notes: notes.trim() || null,
      beforeScreenshotUrl: initialTrade?.beforeScreenshotUrl,
      afterScreenshotUrl: initialTrade?.afterScreenshotUrl,
    };

    const trade = tradeBase as Trade;
    // We verstoppen de partials in het trade object zodat we ze later kunnen laten zien
    (trade as any).partials = validPartials;

    await onSave(trade, beforeFile, afterFile);
    toast({
      title: isEditing ? "Trade updated" : "Trade saved",
      description: isEditing ? "Your changes have been saved." : "Your trade has been added to the journal.",
    });

    if (!isEditing) {
      setEntryPrice("");
      setPartials([{ price: "", lots: "" }]);
      setReason("");
      setCustomReason("");
      setEmotion("");
      setRating(0);
      setNotes("");
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

          <div className="space-y-4 bg-zinc-800/20 p-4 rounded-xl border border-zinc-700/50">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Entry Price</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="2650.00"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Exits & Partials</Label>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={addPartial}
                  className="h-7 text-[10px] uppercase font-bold tracking-wider text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 px-3 rounded-lg"
                >
                  <Plus className="w-3 h-3 mr-1.5" /> Add Partial
                </Button>
              </div>
              
              <div className="space-y-2">
                {partials.map((partial, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Exit Price"
                        value={partial.price}
                        onChange={(e) => updatePartial(index, 'price', e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Lots (e.g. 0.05)"
                        value={partial.lots}
                        onChange={(e) => updatePartial(index, 'lots', e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20"
                      />
                    </div>
                    {partials.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removePartial(index)}
                        className="h-10 w-10 shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Total Result Preview</Label>
            <PnlDisplay type={type} entryPrice={previewEntry} exitPrice={previewExit} lotSize={previewLots} />
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

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-widest text-zinc-400">Notes</Label>
        <Textarea
          placeholder="Market conditions, observations, lessons learned…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20 resize-none"
        />
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
