"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LoanApplication, Profile } from "@/lib/database.types";

type ProfileInfo = Pick<Profile, "email" | "full_name">;
type Row = LoanApplication & { profiles: ProfileInfo | ProfileInfo[] | null };

const RISK_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function AdminBoard({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...rows].sort((a, b) => {
    const riskA = a.risk_level ? RISK_ORDER[a.risk_level] ?? 9 : 8;
    const riskB = b.risk_level ? RISK_ORDER[b.risk_level] ?? 9 : 8;
    if (riskA !== riskB) return riskA - riskB;
    return (b.risk_probability ?? 0) - (a.risk_probability ?? 0);
  });

  async function assessAll() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/assess", { method: "POST" });
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        failed?: number;
        assessed?: number;
      } | null;
      if (!res.ok) {
        setError(payload?.error ?? "Assessment failed");
        return;
      }
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Assessment failed");
    } finally {
      setBusy(false);
    }
  }

  async function decide(id: number, decision: "approved" | "rejected") {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    const payload = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(payload.error ?? "Decision failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Operations</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Risk queue</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Sorted high → low. Jev scores each file; you make the final call.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={assessAll}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {busy ? "Working…" : "Assess everyone"}
        </button>
      </div>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Loan</th>
              <th className="px-4 py-3">Income / EMI</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-slate-500" colSpan={6}>
                  No applications yet.
                </td>
              </tr>
            ) : (
              sorted.map((row) => {
                const profile = Array.isArray(row.profiles)
                  ? row.profiles[0]
                  : row.profiles;
                return (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {profile?.full_name || "Customer"}
                    </div>
                    <div className="text-xs text-slate-500">{profile?.email}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {row.loan_type}
                    <div className="text-xs text-slate-500">
                      {Number(row.amount).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {Number(row.monthly_income).toLocaleString()}
                    <div className="text-xs text-slate-500">
                      EMI {Number(row.existing_emi).toLocaleString()} · {row.job_type}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={row.risk_level} probability={row.risk_probability} />
                  </td>
                  <td className="px-4 py-3 capitalize">{row.status}</td>
                  <td className="px-4 py-3 text-right">
                    {row.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => decide(row.id, "approved")}
                          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => decide(row.id, "rejected")}
                          className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Decided</span>
                    )}
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskBadge({
  level,
  probability,
}: {
  level: string | null;
  probability: number | null;
}) {
  if (!level) {
    return <span className="text-slate-400">Not scored</span>;
  }
  const pct = probability != null ? `${Math.round(probability * 100)}%` : "";
  const tone =
    level === "high"
      ? "bg-rose-100 text-rose-800"
      : level === "medium"
        ? "bg-amber-100 text-amber-800"
        : "bg-emerald-100 text-emerald-800";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <span className="capitalize">{level}</span>
      {pct ? <span className="font-normal opacity-80">{pct}</span> : null}
    </span>
  );
}
