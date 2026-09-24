import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SavedApplicationFields } from "@/lib/voice/agent-config";

const LOAN_TYPES = new Set(["bike", "vehicle", "mobile"]);

function parseFields(body: unknown): SavedApplicationFields | null {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, unknown>;
  const loanType = String(data.loan_type ?? "").toLowerCase();
  const amount = Number(data.amount);
  const monthlyIncome = Number(data.monthly_income);
  const jobType = String(data.job_type ?? "").trim();
  const existingEmi = Number(data.existing_emi ?? 0);

  if (!LOAN_TYPES.has(loanType)) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) return null;
  if (!jobType) return null;
  if (!Number.isFinite(existingEmi) || existingEmi < 0) return null;

  return {
    loan_type: loanType as SavedApplicationFields["loan_type"],
    amount,
    monthly_income: monthlyIncome,
    job_type: jobType.slice(0, 120),
    existing_emi: existingEmi,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("loan_applications")
    .select(
      "id, loan_type, amount, monthly_income, job_type, existing_emi, status, risk_level, risk_probability, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ application: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fields = parseFields(await request.json().catch(() => null));
  if (!fields) {
    return NextResponse.json(
      { error: "Need loan type, amount, income, job type, and existing EMI." },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("loan_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("loan_applications")
      .update(fields)
      .eq("id", existing.id)
      .select(
        "id, loan_type, amount, monthly_income, job_type, existing_emi, status",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ application: data, updated: true });
  }

  const { data, error } = await supabase
    .from("loan_applications")
    .insert({
      user_id: user.id,
      ...fields,
      status: "pending",
    })
    .select(
      "id, loan_type, amount, monthly_income, job_type, existing_emi, status",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ application: data, updated: false });
}
