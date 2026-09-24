"use client";

import { AgentMicrophone, AgentPlayer, AgentSession } from "@deepgram/agents";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildVoiceAgentSettings, type SavedApplicationFields } from "@/lib/voice/agent-config";

type Status = "idle" | "connecting" | "listening" | "speaking" | "error" | "saved";

type FunctionCall = {
  id: string;
  name: string;
  arguments: string;
};

export function VoiceAgent() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Tap start, allow the microphone, and tell us what you need.");
  const [fields, setFields] = useState<Partial<SavedApplicationFields>>({});
  const sessionRef = useRef<AgentSession | null>(null);
  const micRef = useRef<AgentMicrophone | null>(null);
  const playerRef = useRef<AgentPlayer | null>(null);

  const stop = useCallback(() => {
    micRef.current?.stop();
    sessionRef.current?.disconnect();
    playerRef.current?.dispose();
    micRef.current = null;
    sessionRef.current = null;
    playerRef.current = null;
    setStatus("idle");
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = async () => {
    setStatus("connecting");
    setMessage("Connecting your voice advisor…");

    try {
      const session = new AgentSession({
        auth: {
          tokenFactory: async () => {
            const res = await fetch("/api/deepgram-token", { method: "POST" });
            if (!res.ok) {
              throw new Error(await res.text());
            }
            return res.text();
          },
        },
        agent: buildVoiceAgentSettings(),
        audio: {
          input: { encoding: "linear16", sampleRate: 16_000 },
          output: { encoding: "linear16", sampleRate: 24_000 },
        },
      });

      const player = new AgentPlayer({ sampleRate: 24_000 });
      const mic = new AgentMicrophone((data) => session.sendAudio(data), {
        sampleRate: 16_000,
      });

      session.on("audio", (chunk) => player.queue(chunk));
      session.on("user-started-speaking", () => player.interrupt());
      session.on("agent-started-speaking", () => setStatus("speaking"));
      session.on("agent-audio-done", () => setStatus("listening"));
      session.on("settings-applied", () => {
        setStatus("listening");
        setMessage("Listening. Say bike, vehicle, or mobile to begin.");
      });
      session.on("error", (err) => {
        setStatus("error");
        setMessage(typeof err === "string" ? err : "The voice session hit an error.");
      });
      session.on("sdk-error", (err) => {
        setStatus("error");
        setMessage(err.message);
      });
      session.on("function-call-request", async (msg: { functions: FunctionCall[] }) => {
        for (const fn of msg.functions) {
          if (fn.name !== "save_loan_application") {
            session.sendFunctionCallResponse(
              fn.id,
              fn.name,
              JSON.stringify({ error: "Unknown function" }),
            );
            continue;
          }

          const parsed = JSON.parse(fn.arguments) as SavedApplicationFields;
          setFields(parsed);
          const res = await fetch("/api/applications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed),
          });
          const payload = await res.json();
          session.sendFunctionCallResponse(fn.id, fn.name, JSON.stringify(payload));
          if (res.ok) {
            setStatus("saved");
            setMessage("Application saved. We stored only the loan fields — not this call.");
          }
        }
      });

      sessionRef.current = session;
      playerRef.current = player;
      micRef.current = mic;

      await session.connect();
      await mic.start();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not start the microphone session.",
      );
    }
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-3xl border border-emerald-900/20 bg-gradient-to-b from-emerald-950 to-slate-950 p-8 text-emerald-50 shadow-xl">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
          Voice application
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Talk through your loan
        </h1>
        <p className="mt-3 max-w-lg text-emerald-100/80">
          The advisor collects amount, income, job type, and existing EMI. Audio
          and transcripts stay in the live session only.
        </p>
        <div className="mt-8 flex items-center gap-4">
          {status === "idle" || status === "error" || status === "saved" ? (
            <button
              type="button"
              onClick={start}
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-300"
            >
              Start talking
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="rounded-full border border-emerald-200/30 px-6 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-900/60"
            >
              End call
            </button>
          )}
          <span className="text-sm text-emerald-200/90">{statusLabel(status)}</span>
        </div>
        <p className="mt-6 text-sm leading-6 text-emerald-100/90">{message}</p>
      </div>
      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Saved fields
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Product" value={fields.loan_type} />
          <Row label="Amount" value={fields.amount?.toLocaleString()} />
          <Row label="Monthly income" value={fields.monthly_income?.toLocaleString()} />
          <Row label="Job type" value={fields.job_type} />
          <Row label="Existing EMI" value={fields.existing_emi?.toLocaleString()} />
        </dl>
      </aside>
    </section>
  );
}

function statusLabel(status: Status) {
  switch (status) {
    case "connecting":
      return "Connecting";
    case "listening":
      return "Listening";
    case "speaking":
      return "Advisor speaking";
    case "saved":
      return "Saved";
    case "error":
      return "Needs attention";
    default:
      return "Ready";
  }
}

function Row({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value ?? "—"}</dd>
    </div>
  );
}
