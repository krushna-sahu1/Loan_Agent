import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile: profile as Profile | null };
}

export async function requireAdmin() {
  const result = await requireUser();
  if (!result.user || result.profile?.role !== "admin") {
    return { ...result, admin: false as const };
  }
  return { ...result, admin: true as const };
}
