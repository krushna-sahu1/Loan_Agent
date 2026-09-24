---
name: jev
description: >-
  Use Jev, TypeSafe's System One model, for typed judgments with probabilities
  instead of LLM prompt-and-parse. Apply before writing any Jev, TypeSafe, or
  risk-scoring code: loan risk levels, routing, ranking, verification, or
  composing choice/score/noul questions. Read live TypeSafe docs as the source
  of truth.
---

# Use Jev (TypeSafe System One)

Jev is TypeSafe's flagship System One model. Send **state** plus typed **questions**; get **answers** your code can branch on. It does not generate prose. Do not invent request or response fields.

**Live docs are the source of truth.** Before writing or changing Jev code, read the current pages:

- Index: [https://docs.typesafe.ai/llms.txt](https://docs.typesafe.ai/llms.txt)
- Programming model: [System One](https://docs.typesafe.ai/concepts/system-one.md), [how to build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md)
- Inputs: [State](https://docs.typesafe.ai/concepts/state.md), [Primitives](https://docs.typesafe.ai/primitives.md)
- Uncertainty: [Confidence](https://docs.typesafe.ai/confidence.md)
- HTTP: [API](https://docs.typesafe.ai/api.md) — `POST https://api.typesafe.ai/v1/systemone`
- JS SDK: [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript.md), [TypeSafeClient](https://docs.typesafe.ai/sdk/javascript/api/classes/TypeSafeClient.md)

Append `.md` to Mintlify paths. Official skill source: [typesafe-ai/skills SKILL.md](https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md).

## Auth and client (this repo)

- Install `@typesafe-ai/sdk`. Use `TypeSafeClient` + `choice` / `score` / `noul` helpers.
- Server only. Read `TYPESAFE_API_KEY`. Never put the key in the browser.
- Default model: `jev-latest` (pin `jev-1.13.0` in production once thresholds are tuned).
- Keep **questions and numeric thresholds in one module** so humans can review them.

```ts
import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();
const result = await client.systemOne({
  model: "jev-latest",
  state: { /* structured facts only */ },
  questions: {
    risk_level: choice("What is the credit risk of this loan application?", {
      low: "Affordable relative to income, stable employment, existing EMI is manageable",
      medium: "Some stretch on income or EMI; repayment is plausible but not comfortable",
      high: "Amount or existing EMI is large versus income, or employment is weak/unstable",
    }),
  },
});

const level = result.answers.risk_level.choice; // "low" | "medium" | "high"
const probability = result.answers.risk_level.probabilities[level];
const confidence = result.answers.risk_level.confidence;
```

HTTP equivalent:

```http
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <TYPESAFE_API_KEY>
Content-Type: application/json
```

## Question types

| Type | When | Returns |
| --- | --- | --- |
| **choice** | One of a named set | `choice`, `probabilities`, `confidence` |
| **score** | Ordered rubric (2–10 levels, low→high) | `score`, `legend`, `probabilities`, `confidence` |
| **noul** | Yes/no | `noul` (0–1). No separate confidence |

- Question IDs are for code only; put the full judgment in `instructions`.
- One narrow judgment per question. Batch independent questions in **one** `systemOne` call (they run in parallel).
- A second request only if the next state or options depend on a prior answer.
- Reference structured fields with backticked paths: `` `monthly_income` ``.
- Choice/Score `confidence` is how peaked the distribution is, not permission to act. Noul ≈ 0.5 is uncertainty, not “medium intensity.”
- Typed output guarantees the **interface**, not truth. Compose weights and policies in **code**.

## Loan risk in this product

- State = only stored application fields (loan type, amount, income, job type, existing EMI). Never send recordings or transcripts.
- Prefer a **choice** of `low` | `medium` | `high` so the dashboard can sort and display a named level.
- Persist `choice`, the **selected option's probability**, confidence, and resolved `model`. Do not auto-approve; admins decide.
- Do not call Jev from the browser.

## Anti-patterns

- Do not parse LLM JSON for these decisions.
- Do not one-question-per-HTTP-call when questions share state.
- Do not expose API keys or log full credentials.
- Do not invent fields such as `risk_label` on the Jev response; map `choice` / `noul` / `score` in application code.
