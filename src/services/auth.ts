import type { AppSupabaseClient } from "@/types/supabase";
import { throwIfSupabaseError } from "./supabase-error";

export async function getCurrentProfile(supabase: AppSupabaseClient) {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  throwIfSupabaseError(error);
  return data;
}
