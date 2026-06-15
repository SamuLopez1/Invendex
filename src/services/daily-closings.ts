import { todayBogota } from "@/lib/format";
import type { AppSupabaseClient } from "@/types/supabase";
import { throwIfSupabaseError } from "./supabase-error";

export async function getDailySummary(
  supabase: AppSupabaseClient,
  date = todayBogota()
) {
  const { data, error } = await supabase.rpc("daily_sales_summary", {
    p_summary_date: date
  });

  throwIfSupabaseError(error);
  return data?.[0] ?? null;
}

export async function closeDay(
  supabase: AppSupabaseClient,
  date = todayBogota()
) {
  const { data, error } = await supabase.rpc("close_day", {
    p_closing_date: date
  });

  throwIfSupabaseError(error);
  return data;
}

export async function listDailyClosings(
  supabase: AppSupabaseClient,
  limit = 20
) {
  const { data, error } = await supabase
    .from("daily_closings")
    .select("*")
    .order("closing_date", { ascending: false })
    .limit(limit);

  throwIfSupabaseError(error);
  return data ?? [];
}
