import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/apply");

  return (
    <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-800">
          Voice-first lending
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Apply for a bike, vehicle, or mobile loan by talking.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
          Log in, speak with an AI advisor in the browser, and share only the
          details that matter. We store amount, income, job type, and existing
          EMI — never recordings or transcripts.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-white"
          >
            Log in
          </Link>
        </div>
      </div>
      <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <h2 className="font-semibold text-slate-900">What we keep</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>Loan product and requested amount</li>
          <li>Monthly income and job type</li>
          <li>Existing EMI</li>
        </ul>
        <h2 className="mt-8 font-semibold text-slate-900">What we never store</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>Call recordings</li>
          <li>Conversation transcripts</li>
        </ul>
      </div>
    </section>
  );
}
