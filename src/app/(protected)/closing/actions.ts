"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { closeDay } from "@/services/daily-closings";

export async function closeDayAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const date = String(formData.get("closing_date"));

  await closeDay(supabase, date);

  revalidatePath("/closing");
  revalidatePath("/dashboard");
  redirect("/closing?message=Dia cerrado correctamente");
}
