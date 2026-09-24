import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { supabase, admin } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    id?: number;
    decision?: string;
  } | null;

  if (!body?.id || (body.decision !== "approved" && body.decision !== "rejected")) {
    return NextResponse.json({ error: "Need id and approve/reject." }, { status: 400 });
  }

  const { error } = await supabase
    .from("loan_applications")
    .update({
      status: body.decision,
      decided_at: new Date().toISOString(),
    })
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
