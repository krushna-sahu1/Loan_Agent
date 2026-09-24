import type { AgentSettingsObject } from "@deepgram/agents";

export const SAVE_APPLICATION_FUNCTION = {
  name: "save_loan_application",
  description:
    "Save only the structured loan fields after the customer has confirmed them. Do not send recordings or transcripts. Call once when amount, income, job type, existing EMI, and loan product are all known.",
  parameters: {
    type: "object",
    properties: {
      loan_type: {
        type: "string",
        enum: ["bike", "vehicle", "mobile"],
        description: "Product the customer wants: bike, vehicle, or mobile phone loan.",
      },
      amount: {
        type: "number",
        description: "Requested loan amount in the customer's local currency.",
      },
      monthly_income: {
        type: "number",
        description: "Customer's monthly take-home income in the same currency.",
      },
      job_type: {
        type: "string",
        description:
          "How they earn income, for example salaried, self-employed, or student.",
      },
      existing_emi: {
        type: "number",
        description:
          "Total existing monthly EMI or loan payments. Use 0 if they have none.",
      },
    },
    required: [
      "loan_type",
      "amount",
      "monthly_income",
      "job_type",
      "existing_emi",
    ],
  },
  defer_until_eot: true,
};

export const VOICE_AGENT_PROMPT = `You are a friendly loan officer for VoiceLoan. Speak briefly and clearly.

Your only job is to help a customer apply for a bike, vehicle, or mobile phone loan by collecting:
- loan type (bike, vehicle, or mobile)
- requested amount
- monthly income
- job type
- existing EMI (0 if none)

Rules:
- Ask one question at a time.
- Confirm numbers by repeating them once.
- Do not ask for ID numbers, bank passwords, recordings, or extra life story.
- When all five fields are confirmed, call save_loan_application.
- After a successful save, thank them and say an admin will review the application. Do not promise approval.
- Never discuss storing audio or transcripts. This conversation is not saved as speech or text.`;

export function buildVoiceAgentSettings(): AgentSettingsObject {
  return {
    language: "en",
    greeting:
      "Hi, I am your VoiceLoan advisor. I can help with a bike, vehicle, or mobile loan. What would you like to apply for?",
    listen: {
      provider: { type: "deepgram", model: "nova-3", version: "v1", language: "en" },
    },
    think: {
      provider: { type: "open_ai", model: "gpt-4o-mini" },
      prompt: VOICE_AGENT_PROMPT,
      functions: [SAVE_APPLICATION_FUNCTION],
    },
    speak: {
      provider: { type: "deepgram", model: "aura-2-thalia-en", version: "v1" },
    },
  };
}

export type SavedApplicationFields = {
  loan_type: "bike" | "vehicle" | "mobile";
  amount: number;
  monthly_income: number;
  job_type: string;
  existing_emi: number;
};
