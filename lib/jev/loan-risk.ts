import { TypeSafeClient, choice, noul } from "@typesafe-ai/sdk";
import type { RiskLevel } from "@/lib/database.types";

/** Pin after calibrating thresholds. `jev-latest` currently tracks the newest stable Jev. */
export const JEV_MODEL = "jev-latest";

/**
 * Reviewable Jev questions for loan risk.
 * IDs are for code only; complete meaning lives in instructions (TypeSafe docs).
 */
export const LOAN_RISK_QUESTIONS = {
  risk_level: choice(
    "What is the credit risk of this consumer loan application given `loan_type`, `amount`, `monthly_income`, `job_type`, and `existing_emi`? Judge affordability of `amount` plus `existing_emi` versus `monthly_income`, and how stable `job_type` looks.",
    {
      low: "The requested amount and existing EMI look affordable versus monthly income, and job type looks reasonably stable.",
      medium: "There is some stretch: the loan or existing EMI is noticeable versus income, or employment is only moderately stable, but repayment still looks plausible.",
      high: "The amount or existing EMI is large versus monthly income, income looks thin for this product, or job type looks unstable or unverifiable.",
    },
  ),
  stretched_vs_income: noul(
    "Is `amount` plus `existing_emi` large relative to `monthly_income` for this `loan_type`?",
    {
      true: "Debt service looks heavy versus stated monthly income.",
      false: "Debt service looks comfortable versus stated monthly income.",
    },
  ),
};

export type LoanRiskState = {
  loan_type: string;
  amount: number;
  monthly_income: number;
  job_type: string;
  existing_emi: number;
};

export type LoanRiskAssessment = {
  riskLevel: RiskLevel;
  probability: number;
  confidence: number;
  model: string;
};

function getClient() {
  return new TypeSafeClient({
    apiKey: process.env.TYPESAFE_API_KEY,
    defaultModel: JEV_MODEL,
    timeout: 30_000,
  });
}

export async function assessLoanRisk(
  state: LoanRiskState,
): Promise<LoanRiskAssessment> {
  const client = getClient();
  const result = await client.systemOne({
    model: JEV_MODEL,
    state,
    questions: LOAN_RISK_QUESTIONS,
  });

  const answer = result.answers.risk_level;
  const riskLevel = answer.choice;
  const probability = answer.probabilities[riskLevel] ?? 0;

  return {
    riskLevel,
    probability,
    confidence: answer.confidence,
    model: result.model,
  };
}
