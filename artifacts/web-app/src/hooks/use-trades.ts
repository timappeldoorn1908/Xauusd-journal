import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Trade } from "@/components/weekly-summary";

const QUERY_KEY = ["trades"];
const BUCKET = "screenshots";

interface DbTrade {
  id: number;
  created_at?: string;
  date: string;
  type: string;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  pips: number;
  pnl: number;
  reason: string;
  emotion: string;
  rating: number;
  before_screenshot_url?: string | null;
  after_screenshot_url?: string | null;
}

function toTrade(row: DbTrade): Trade {
  return {
    id: String(row.id),
    date: row.date.slice(0, 10),
    type: row.type as "long" | "short",
    entryPrice: row.entry_price,
    exitPrice: row.exit_price,
    lotSize: row.lot_size,
    pips: row.pips,
    pnl: row.pnl,
    reason: row.reason,
    emotion: row.emotion,
    rating: row.rating,
    beforeScreenshotUrl: row.before_screenshot_url ?? null,
    afterScreenshotUrl: row.after_screenshot_url ?? null,
  };
}

function toDbRow(trade: Trade): Omit<DbTrade, "id" | "created_at"> {
  return {
    date: trade.date,
    type: trade.type,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    lot_size: trade.lotSize,
    pips: trade.pips,
    pnl: trade.pnl,
    reason: trade.reason,
    emotion: trade.emotion,
    rating: trade.rating,
  };
}

async function uploadScreenshot(tradeId: number, file: File, slot: "before" | "after"): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${tradeId}/${slot}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) { console.error("Screenshot upload failed:", error.message); return null; }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function useTrades() {
  return useQuery<Trade[], Error>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw new Error(error.message);
      return (data as DbTrade[]).map(toTrade);
    },
  });
}

export function useInsertTrade() {
  const qc = useQueryClient();
  return useMutation<void, Error, { trade: Trade; beforeFile?: File | null; afterFile?: File | null }>({
    mutationFn: async ({ trade, beforeFile, afterFile }) => {
      const { data, error } = await supabase
        .from("trades")
        .insert(toDbRow(trade))
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      const tradeId = (data as { id: number }).id;
      const updates: Partial<Pick<DbTrade, "before_screenshot_url" | "after_screenshot_url">> = {};

      if (beforeFile) {
        const url = await uploadScreenshot(tradeId, beforeFile, "before");
        if (url) updates.before_screenshot_url = url;
      }
      if (afterFile) {
        const url = await uploadScreenshot(tradeId, afterFile, "after");
        if (url) updates.after_screenshot_url = url;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("trades").update(updates).eq("id", tradeId);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateTrade() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; trade: Trade; beforeFile?: File | null; afterFile?: File | null }>({
    mutationFn: async ({ id, trade, beforeFile, afterFile }) => {
      const updates: Partial<DbTrade> = { ...toDbRow(trade) };

      if (beforeFile) {
        const url = await uploadScreenshot(Number(id), beforeFile, "before");
        if (url) updates.before_screenshot_url = url;
      }
      if (afterFile) {
        const url = await uploadScreenshot(Number(id), afterFile, "after");
        if (url) updates.after_screenshot_url = url;
      }

      const { error } = await supabase.from("trades").update(updates).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteTrade() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { data: files } = await supabase.storage.from(BUCKET).list(id);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${id}/${f.name}`);
        await supabase.storage.from(BUCKET).remove(paths);
      }
      const { error } = await supabase.from("trades").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
