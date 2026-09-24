import { AdminBoard } from "@/app/admin/admin-board";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/apply");
  }

  const { data: rows } = await supabase
    .from("loan_applications")
    .select(
      "id, user_id, loan_type, amount, monthly_income, job_type, existing_emi, status, risk_level, risk_probability, jev_confidence, jev_model, assessed_at, decided_at, created_at, updated_at, profiles(email, full_name)",
    )
    .order("created_at", { ascending: false });

  return <AdminBoard rows={rows ?? []} />;
}
