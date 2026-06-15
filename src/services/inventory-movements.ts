import type { InventoryMovementInput } from "@/types/forms";
import type { AppSupabaseClient } from "@/types/supabase";
import { throwIfSupabaseError } from "./supabase-error";

export async function recordInventoryMovement(
  supabase: AppSupabaseClient,
  input: InventoryMovementInput
) {
  const { data, error } = await supabase.rpc("record_inventory_movement", {
    p_product_id: input.product_id,
    p_movement_type: input.movement_type,
    p_quantity: input.quantity,
    p_reason: input.reason.trim()
  });

  throwIfSupabaseError(error);
  return data;
}

export async function listInventoryMovements(
  supabase: AppSupabaseClient,
  limit = 50
) {
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("*, products(name, category)")
    .order("created_at", { ascending: false })
    .limit(limit);

  throwIfSupabaseError(error);
  return data ?? [];
}
