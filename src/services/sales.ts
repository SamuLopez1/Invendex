import type { RegisterSaleInput } from "@/types/forms";
import { todayBogota } from "@/lib/format";
import type { AppSupabaseClient } from "@/types/supabase";
import type { Json } from "@/types/database";
import { throwIfSupabaseError } from "./supabase-error";

export async function registerSale(
  supabase: AppSupabaseClient,
  input: RegisterSaleInput
) {
  const { data, error } = await supabase.rpc("register_sale", {
    p_payment_method: input.payment_method,
    p_items: input.items as unknown as Json
  });

  throwIfSupabaseError(error);
  return data;
}

export async function listRecentSales(
  supabase: AppSupabaseClient,
  limit = 10
) {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  throwIfSupabaseError(error);
  return data ?? [];
}

export async function listTodaySales(supabase: AppSupabaseClient) {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("sale_date", todayBogota())
    .order("created_at", { ascending: false });

  throwIfSupabaseError(error);
  return data ?? [];
}

export async function listBestSellingProductsToday(
  supabase: AppSupabaseClient,
  limit = 5
) {
  const { data, error } = await supabase
    .from("sale_items")
    .select("quantity, subtotal, product:products(name, category), sale:sales!inner(sale_date)")
    .eq("sale.sale_date", todayBogota());

  throwIfSupabaseError(error);

  const totals = new Map<
    string,
    { name: string; category: string; quantity: number; subtotal: number }
  >();

  for (const item of data ?? []) {
    const product = Array.isArray(item.product) ? item.product[0] : item.product;
    const name = product?.name ?? "Producto";
    const category = product?.category ?? "Sin categoria";
    const key = `${category}:${name}`;
    const current = totals.get(key) ?? {
      name,
      category,
      quantity: 0,
      subtotal: 0
    };

    current.quantity += item.quantity;
    current.subtotal += item.subtotal;
    totals.set(key, current);
  }

  return Array.from(totals.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}
