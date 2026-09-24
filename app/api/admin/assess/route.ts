import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assessLoanRisk } from "@/lib/jev/loan-risk";

export const runtime = "nodejs";

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Assessment failed";
}

export async function POST() {
  const { supabase, admin } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.TYPESAFE_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "Jev is not configured. Set TYPESAFE_API_KEY and restart the app." },
      { status: 503 },
    );
  }

  const { data: applications, error } = await supabase
    .from("loan_applications")
    .select("id, loan_type, amount, monthly_income, job_type, existing_emi");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    id: number;
    risk_level: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const application of applications ?? []) {
    try {
      const assessment = await assessLoanRisk({
        loan_type: application.loan_type,
        amount: Number(application.amount),
        monthly_income: Number(application.monthly_income),
        job_type: application.job_type,
        existing_emi: Number(application.existing_emi),
      });

      const { data: saved, error: saveError } = await supabase.rpc(
        "save_loan_assessment",
        {
          p_id: application.id,
          p_risk_level: assessment.riskLevel,
          p_risk_probability: assessment.probability,
          p_jev_confidence: assessment.confidence,
          p_jev_model: assessment.model,
        },
      );

      if (saveError || !saved) {
        results.push({
          id: application.id,
          risk_level: assessment.riskLevel,
          ok: false,
          error: saveError?.message ?? "Risk score was not saved",
        });
        continue;
      }

      results.push({
        id: application.id,
        risk_level: assessment.riskLevel,
        ok: true,
      });
    } catch (error) {
      results.push({
        id: application.id,
        risk_level: "unknown",
        ok: false,
        error: errorMessage(error),
      });
    }
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    return NextResponse.json(
      {
        error:
          failed[0]?.error ??
          "Jev scored some files but the risk was not saved.",
        assessed: results.length,
        failed: failed.length,
        results,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ assessed: results.length, failed: 0, results });
}
