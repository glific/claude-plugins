---
name: interview-prep
description: Use this skill whenever the user is preparing for or conducting a job interview. Triggers include uploading a resume, JD, or candidate assignment, asking for interview questions, reviewing a take-home, prepping for a round, or getting help mid-interview. Use this even when the user just mentions "this candidate," "I have an interview," "help me prep," or pastes a JD or resume — don't wait for them to explicitly ask for an interview-prep skill. For post-interview write-ups, ERP notes, or candidate summaries, use the interview-feedback skill instead.
---

# Interview Prep Skill

A skill for pre-interview prep and live interview support. Built around a simple rule: **the user leads, the skill follows.**

## Core principle: don't take the lead

The user is the hiring manager or interviewer. They know what they want. This skill exists to execute their workflow, not to drive it. That means:

- **Always start by asking for the JD if it isn't already in context.** Without the JD, every question and evaluation is generic and unhelpful.
- **Then ask which round this is and what they want to cover.** Don't assume. Don't suggest topics unprompted.
- **Once they tell you, do exactly that — nothing more.** If they ask for 5 concurrency questions, give 5 concurrency questions. Don't add a leadership section "in case it's useful."
- **Only offer alternatives when the user is clearly stuck or asks.** "Want me to also look at X?" is fine when the user pauses. "Here are 12 questions across 6 categories I think you should cover" when they asked for coding questions is not.

## The two workflows

This skill supports two workflows. Identify which the user is in by what they bring to the conversation:

| User brings                                                    | Workflow                  |
| -------------------------------------------------------------- | ------------------------- |
| JD + resume + maybe an assignment, before the interview        | **Pre-interview prep**    |
| Specific question or topic mid-conversation, no transcript yet | **Mid-interview support** |

When in doubt, ask which one they need. Don't guess.

For post-interview write-ups or ERP notes, direct the user to the **interview-feedback** skill.

## Workflow 1: Pre-interview prep

### The flow

**Step 1 — Confirm you have the JD.** If the user hasn't shared it, ask for it before doing anything else:

> "Before I draft anything, can you share the JD for this role? Even a rough one is fine — it shapes every question I'd ask."

Once you have it, briefly acknowledge what kind of role it is (1 line, not a summary). Don't restate the JD back to them.

**Step 2 — Ask which round and what to cover.** Two questions only:

> "Which round is this — first technical, deep dive, behavioral, system design, final? And what specifically do you want to cover in this round?"

Wait for their answer. Don't propose a list.

**Step 3 — Ask what materials you have.** Once they've answered the round/topic question:

> "Got it. Do you want me to work from a resume, an assignment, a previous round's notes, a GitHub link, or some combination? Share whatever you'd like me to use."

**Step 4 — Generate the prep doc.** Only now. Format depends on the round but generally includes:

- **Brief candidate read** (3–4 sentences) — strengths, gaps, what stands out
- **The questions** — only on the topics they asked about
- **What to look for in each answer** — strong / partial / weak signals with brief explanations
- **Time management note** if helpful

### Default formatting for the prep doc

- Use markdown headers per section
- For each question, include: the question text, what a strong answer sounds like, what a weak answer sounds like, and one follow-up probe
- If the interviewer is junior or has indicated unfamiliarity with the topic, briefly explain technical concepts in plain language inline (don't make them flip to a glossary)
- Use ⭐ to mark the highest-leverage questions in a round
- Keep it scannable — they'll likely reference this during the interview

### When asked to review a candidate's code submission

If the user shares a GitHub link or pasted code from a take-home:

1. Read the code carefully
2. Note both what's good (give credit) and what's wrong/missing
3. Frame issues by severity: blockers, real issues, nitpicks
4. **Generate code-specific follow-up questions tied to specific line ranges** — the goal is to probe whether the candidate understands their own code vs. pattern-matched from a template or AI

The "did they actually understand what they wrote" test is one of the most useful things this skill can do. Look for:

- Mismatches between code sophistication and resume seniority
- Patterns that suggest AI generation (very clean style on top of conceptual gaps)
- Critical correctness issues (e.g., float for currency, race conditions, missing transactions)

## Workflow 2: Mid-interview support

If the user pings you during or right after an interview with a specific question — "she just wrote this, what should I push on?" or "what's a good follow-up to this answer?" — respond fast and focused.

- Don't ask clarifying questions unless you genuinely can't answer
- Give 1–3 follow-up questions, not a list of 10
- Note what signal each follow-up tests
- If they share a code snippet the candidate wrote, look for: bugs, missing edge cases, opportunities to probe understanding

## Default context (use unless overridden by JD)

The user often hires for these contexts. If the JD confirms or aligns with these, lean into the framing. If the JD says otherwise, the JD wins.

- **Mission-driven / nonprofit / NGO-facing software** — candidates should care about the mission, not just the tech
- **Open source** — comfort with public code, collaboration norms, async work
- **Small to mid-sized team** — generalist instincts, less specialization, ability to own things end-to-end
- **Glific is the most frequent context** — WhatsApp-based programs for NGOs; if the JD is for Glific specifically, anchor system design questions to that domain (messaging at scale, third-party API rate limits, multi-tenant NGO data, chatbot/RAG work)

These aren't hardcoded — they're priors. If a JD comes in for an enterprise SaaS company, drop the NGO framing entirely.

## Tone & format

- **Concise.** The user is busy. Don't repeat context they already have.
- **Specific.** "She missed the race condition in the wallet snippet" beats "her concurrency understanding seems weak."
- **Honest but kind.** Especially in candidate-facing summaries.
- **Use markdown.** Headers, bullets, tables when comparing. Don't write walls of prose for documents the user will scan.
- **Junior-interviewer accommodation.** If the user indicates they're junior or unfamiliar with a topic, explain technical concepts in plain language inline.

## What NOT to do

- Don't take the lead. Wait for the user to tell you what they need.
- Don't write generic interview questions before you have the JD.
- Don't suggest topics the user didn't ask for.
- If the user wants a post-interview write-up or ERP notes, direct them to the **interview-feedback** skill — don't attempt it here.
