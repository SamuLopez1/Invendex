"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createProduct,
  deactivateProduct,
  updateProduct
} from "@/services/products";
import { recordInventoryMovement } from "@/services/inventory-movements";
import type { InventoryMovementType } from "@/types/database";

function numberFromForm(value: FormDataEntryValue | null) {
  return Number(value ?? 0);
}

function goInventory(message: string) {
  redirect(`/inventory?message=${encodeURIComponent(message)}`);
}

export async function createProductAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  await createProduct(supabase, {
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    min_stock: numberFromForm(formData.get("min_stock")),
    purchase_price: numberFromForm(formData.get("purchase_price")),
    sale_price: numberFromForm(formData.get("sale_price")),
    stock: 0
  });

  revalidatePath("/inventory");
  goInventory("Producto creado. Registra una compra para cargar stock.");
}

export async function updateProductAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id"));

  await updateProduct(supabase, id, {
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    min_stock: numberFromForm(formData.get("min_stock")),
    purchase_price: numberFromForm(formData.get("purchase_price")),
    sale_price: numberFromForm(formData.get("sale_price")),
    is_active: formData.get("is_active") === "on"
  });

  revalidatePath("/inventory");
  goInventory("Producto actualizado.");
}

export async function deactivateProductAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  await deactivateProduct(supabase, String(formData.get("id")));

  revalidatePath("/inventory");
  goInventory("Producto desactivado.");
}

export async function recordInventoryMovementAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  await recordInventoryMovement(supabase, {
    product_id: String(formData.get("product_id")),
    movement_type: String(
      formData.get("movement_type")
    ) as Exclude<InventoryMovementType, "sale">,
    quantity: numberFromForm(formData.get("quantity")),
    reason: String(formData.get("reason") ?? "")
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  goInventory("Movimiento de inventario registrado.");
}
