import { VoiceAgent } from "@/app/apply/voice-agent";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: application } = await supabase
    .from("loan_applications")
    .select(
      "id, loan_type, amount, monthly_income, job_type, existing_emi, status, risk_level, risk_probability",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <VoiceAgent />
      {application ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Latest application
          </h2>
          <p className="mt-2 text-slate-800">
            {application.loan_type} loan for{" "}
            {Number(application.amount).toLocaleString()} · status{" "}
            <span className="capitalize">{application.status}</span>
            {application.risk_level
              ? ` · Jev risk ${application.risk_level} (${Math.round((application.risk_probability ?? 0) * 100)}%)`
              : " · awaiting risk review"}
          </p>
        </section>
      ) : null}
    </div>
  );
}
