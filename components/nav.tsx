"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Nav() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      setIsAdmin(profile?.role === "admin");
    }

    void load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href={email ? "/apply" : "/"} className="text-lg font-semibold tracking-tight">
          VoiceLoan
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          {email ? (
            <>
              <Link href="/apply" className="hover:text-slate-900">
                Apply
              </Link>
              {isAdmin ? (
                <Link href="/admin" className="hover:text-slate-900">
                  Admin
                </Link>
              ) : null}
              <button
                type="button"
                className="hover:text-slate-900"
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  setEmail(null);
                  setIsAdmin(false);
                  router.push("/");
                  router.refresh();
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-slate-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
