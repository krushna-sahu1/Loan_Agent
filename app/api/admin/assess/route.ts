import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assessLoanRisk } from "@/lib/jev/loan-risk";

export async function POST() {
  const { supabase, admin } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.TYPESAFE_API_KEY) {
    return NextResponse.json(
      { error: "Jev is not configured. Set TYPESAFE_API_KEY." },
      { status: 503 },
    );
  }

  const { data: applications, error } = await supabase
    .from("loan_applications")
    .select(
      "id, loan_type, amount, monthly_income, job_type, existing_emi",
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{ id: number; risk_level: string; ok: boolean }> = [];

  for (const application of applications ?? []) {
    try {
      const assessment = await assessLoanRisk({
        loan_type: application.loan_type,
        amount: Number(application.amount),
        monthly_income: Number(application.monthly_income),
        job_type: application.job_type,
        existing_emi: Number(application.existing_emi),
      });

      const { error: updateError } = await supabase
        .from("loan_applications")
        .update({
          risk_level: assessment.riskLevel,
          risk_probability: assessment.probability,
          jev_confidence: assessment.confidence,
          jev_model: assessment.model,
          assessed_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      results.push({
        id: application.id,
        risk_level: assessment.riskLevel,
        ok: !updateError,
      });
    } catch {
      results.push({ id: application.id, risk_level: "unknown", ok: false });
    }
  }

  return NextResponse.json({ assessed: results.length, results });
}
