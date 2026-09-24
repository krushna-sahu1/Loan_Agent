import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram is not configured." },
      { status: 503 },
    );
  }

  const grant = await fetch("https://api.deepgram.com/v1/auth/grant", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ttl_seconds: 300 }),
  });

  if (!grant.ok) {
    const detail = await grant.text();
    return NextResponse.json(
      { error: "Could not mint a Deepgram token.", detail },
      { status: 502 },
    );
  }

  const payload = (await grant.json()) as { access_token?: string };
  if (!payload.access_token) {
    return NextResponse.json(
      { error: "Deepgram grant response was missing a token." },
      { status: 502 },
    );
  }

  return new NextResponse(payload.access_token, {
    headers: { "Content-Type": "text/plain" },
  });
}
