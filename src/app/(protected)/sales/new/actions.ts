"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registerSale } from "@/services/sales";
import type { PaymentMethod } from "@/types/database";
import type { SaleCartItemInput } from "@/types/forms";

export async function registerSaleAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const rawItems = String(formData.get("items") ?? "[]");
  const items = JSON.parse(rawItems) as SaleCartItemInput[];

  await registerSale(supabase, {
    payment_method: String(formData.get("payment_method")) as PaymentMethod,
    items
  });

  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/sales/new");
  redirect("/sales/new?message=Venta registrada");
}
