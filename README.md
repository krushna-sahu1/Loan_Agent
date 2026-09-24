# VoiceLoan

Voice-first loan applications: a customer logs in, talks to a Deepgram voice agent in the browser, and we store only the useful fields in Supabase. Jev (TypeSafe) scores risk for admins. Recordings and transcripts are not saved.

## What gets stored

- Loan product (`bike`, `vehicle`, or `mobile`)
- Amount, monthly income, job type, existing EMI
- Jev risk level (`low` / `medium` / `high`) plus the selected option's probability
- Admin approve / reject

Audio and conversation text stay in the live browser session only.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `DEEPGRAM_API_KEY` (server only)
   - `TYPESAFE_API_KEY` (server only, from [TypeSafe](https://docs.typesafe.ai/introduction/quickstart.md))
3. In the Supabase dashboard, turn off **Confirm email** under Auth while you are testing, or complete the confirmation link.
4. Create a customer account in the app, then promote an admin:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

5. Run `npm install` and `npm run dev`.

The remote Supabase project for this workspace is `loan-agent` (`fmpwojpwrdmqsfpsyhns`). Schema is in `supabase/migrations`.

## How it works

- `/apply` uses `@deepgram/agents` with a short-lived token from `/api/deepgram-token`.
- The agent calls `save_loan_application` with structured fields only.
- `/admin` lists every application, sorted high → medium → low risk.
- **Assess everyone** runs Jev via `@typesafe-ai/sdk` (`client.systemOne`) using questions in `lib/jev/loan-risk.ts`.
- Approve and reject are human decisions; Jev never auto-decides.

Jev usage follows `.cursor/skills/jev/SKILL.md` and TypeSafe's official docs.
