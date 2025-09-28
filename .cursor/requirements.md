# Test Task: SaaS Generator of Product Ideas from Reddit

## Goal

Using Cursor, develop a minimally viable SaaS that helps a first-time founder come up with a product idea. The service tracks new popular subreddits where users discuss their problems and, based on the insights it finds, generates product ideas with an attractiveness score.

---

## How it should work (MVP flow)

1. **Source collection:** the service periodically finds/receives a list of “popular subreddits” where people share problems.
2. **Signal extraction:** from fresh posts/comments it extracts problem statements, pain triggers, frequency/engagement.
3. **Idea generation:** an LLM produces short product ideas (name, elevator pitch, target audience, the “pain” it solves).
4. **Attractiveness scoring:** an LLM (or a simple formula) gives a numeric or textual score (e.g., pain severity, willingness to pay, competition, TAM — simplified).
5. **Delivery of results:** the user sees a feed of fresh recommendations, can subscribe to e-mail notifications (with topic filters) and unsubscribe.

⚠ **Data collection from Reddit** may require tokens/limits. Allowed:

- connect the official Reddit API, **or**
- use a small prepared mock/snapshot (JSON).

---

## Functional requirements (MVP)

- **Landing page (single page)** describing the product. Take inspiration from Tosnos SaaS Landing (Dribbble)—don’t copy; make a simple, neat layout (Hero block, value proposition, CTA “Get started”).
- **Authentication:** sign up, log in, log out (Supabase Auth).
- **Recommendations feed:** a list of fresh product ideas with a topic filter (e.g., devtools, health, education, etc.). Fields:
  - idea name
  - short pitch (1–2 sentences)
  - key pain/insight
  - sources (subreddit/link)
  - score (0–100)
  - “new” badge

- **E-mail subscriptions:** a subscription form and topic-based filter settings (e.g., devtools, health, education, etc.).
- **E-mail integration:** connect any popular e-mail SaaS (e.g., Resend, Mailgun, SendGrid, Postmark). You don’t have to test real sending, but the API client and integration code must be correct (keys/env vars via .env).
- **Unsubscribe:** proper e-mail unsubscribe via link in the message or from the profile.
- **Idea generation and scoring via LLM:** use a popular LLM (OpenAI/Gemini/etc.). Extract prompts and settings into config; keep response typing strict.

---

## Technologies

- GitHub (repository with commit history)
- React + Node.js + TypeScript (Next.js is welcome but not required)
- Supabase (Auth + Postgres; Supabase Hosted is fine)
- LLM (any popular provider)
- E-mail SaaS (any popular one; integrate via SDK/API)
- Cursor (required; working in AI mode is part of the task)

---

## Required artifacts (for evaluation)

- GitHub repository (public or link-accessible).
- `.cursor/` folder with:
  - **rules.md** — your rules/constraints for the AI (architecture, style, commit conventions).
  - **PROMPTS.md** — key prompts (5–10 items) with brief context and outcome.
  - full interaction history with Cursor: export using external tools.

- **README.md** containing:
  - how to run locally

---

## Prioritization hint

Your task is to deliver the maximum useful functionality within up to 8 hours. Prioritization of features is entirely up to you and is part of the evaluation.

---

## What to send back

- Link to the GitHub repository.
- Export/screenshots of the Cursor history + the `.cursor/` folder.
- README.md.

---

**Contents (quick navigation):**

- Test Task: SaaS Generator of Product Ideas from Reddit
- Goal
- How it should work (MVP flow)
- Functional requirements (MVP)
- Technologies
- Required artifacts (for evaluation)
- Prioritization hint
- What to send back
