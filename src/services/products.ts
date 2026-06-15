import type { CreateProductInput, ProductFormInput } from "@/types/forms";
import type { Product } from "@/types/database";
import type { AppSupabaseClient } from "@/types/supabase";
import { throwIfSupabaseError } from "./supabase-error";

export interface ProductFilters {
  search?: string;
  category?: string;
  includeInactive?: boolean;
}

export async function listProducts(
  supabase: AppSupabaseClient,
  filters: ProductFilters = {}
) {
  let query = supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (!filters.includeInactive) {
    query = query.eq("is_active", true);
  }

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error);
  return data ?? [];
}

export async function listCategories(supabase: AppSupabaseClient) {
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .eq("is_active", true)
    .order("category", { ascending: true });

  throwIfSupabaseError(error);
  return Array.from(new Set((data ?? []).map((item) => item.category)));
}

export async function listLowStockProducts(
  supabase: AppSupabaseClient,
  limit = 10
) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("stock", { ascending: true });

  throwIfSupabaseError(error);
  return (data ?? [])
    .filter((product) => product.stock <= product.min_stock)
    .slice(0, limit);
}

export async function createProduct(
  supabase: AppSupabaseClient,
  input: CreateProductInput
) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name.trim(),
      category: input.category.trim(),
      stock: input.stock ?? 0,
      min_stock: input.min_stock,
      purchase_price: input.purchase_price,
      sale_price: input.sale_price,
      is_active: input.is_active ?? true
    })
    .select()
    .single();

  throwIfSupabaseError(error);
  return data as Product;
}

export async function updateProduct(
  supabase: AppSupabaseClient,
  id: string,
  input: ProductFormInput
) {
  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name.trim(),
      category: input.category.trim(),
      min_stock: input.min_stock,
      purchase_price: input.purchase_price,
      sale_price: input.sale_price,
      is_active: input.is_active ?? true
    })
    .eq("id", id)
    .select()
    .single();

  throwIfSupabaseError(error);
  return data as Product;
}

export async function deactivateProduct(
  supabase: AppSupabaseClient,
  id: string
) {
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  throwIfSupabaseError(error);
}
