import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Trade } from "@/components/weekly-summary";

const QUERY_KEY = ["trades"];

interface DbTrade {
  id: string;
  date: string;
  direction: string;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  reason: string;
  emotion: string;
  rating: number;
  created_at?: string;
}

function toTrade(row: DbTrade): Trade {
  return {
    id: row.id,
    date: row.date,
    direction: row.direction as "long" | "short",
    entryPrice: row.entry_price,
    exitPrice: row.exit_price,
    lotSize: row.lot_size,
    reason: row.reason,
    emotion: row.emotion,
    rating: row.rating,
  };
}

function toDbTrade(trade: Trade): Omit<DbTrade, "created_at"> {
  return {
    id: trade.id,
    date: trade.date,
    direction: trade.direction,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    lot_size: trade.lotSize,
    reason: trade.reason,
    emotion: trade.emotion,
    rating: trade.rating,
  };
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
  return useMutation<void, Error, Trade>({
    mutationFn: async (trade) => {
      const { error } = await supabase.from("trades").insert(toDbTrade(trade));
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteTrade() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from("trades").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
