"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      setBusy(false);
      if (signError) {
        setError(signError.message);
        return;
      }
      setInfo("Account created. If email confirmation is on, check your inbox; otherwise log in.");
      router.refresh();
      return;
    }

    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.push("/apply");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm"
    >
      <h1 className="text-2xl font-semibold text-slate-900">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {mode === "login"
          ? "Log in to talk with the loan advisor."
          : "Then apply by voice. We only save the useful loan fields."}
      </p>
      {mode === "signup" ? (
        <label className="mt-6 block text-sm font-medium text-slate-700">
          Full name
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-slate-900"
          />
        </label>
      ) : null}
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-slate-900"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Password
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-slate-900"
        />
      </label>
      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
      {info ? <p className="mt-4 text-sm text-emerald-800">{info}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
      </button>
      <p className="mt-4 text-center text-sm text-slate-600">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link className="font-medium text-slate-900" href="/signup">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link className="font-medium text-slate-900" href="/login">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
