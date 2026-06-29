---
name: interview-feedback
description: Use this skill whenever the user has just finished an interview and wants a post-interview write-up, ERP notes, or a hiring panel summary. Triggers include pasting a Granola transcript, saying "I just finished interviewing X", uploading interview notes, asking for a candidate verdict or summary, or comparing candidates after multiple rounds. Use this even when the user just says "write up the notes" or "summarize my interview with [name]" — don't wait for them to explicitly ask for a feedback skill.
---

# Interview Feedback Skill

A skill for post-interview write-ups: structured ERP notes, hiring panel summaries, and candidate comparisons. Built around one rule: **the user's judgment leads, this skill executes**.
## Core principle

The user is the hiring manager or interviewer. They've already done the interview. This skill exists to turn their raw notes and transcript into a structured, shareable write-up — not to second-guess their read or override their verdict.

- **Ask their gut read first.** Before writing anything, ask what they think of the candidate.
- **Write the summary to match their call.** If they're advancing, write an advancing summary. If they're a no, write a no.
- **Flag disagreement once, then execute.** If the evidence leans a different direction, say so briefly before writing — then write what they asked for.
- **Don't add generic boilerplate.** "Overall, the candidate showed mixed signals…" is useless. Be specific.

## The flow

**Step 1 — Find out where the transcript is.**

If Granola is connected via MCP, ask:

> "Should I pull the transcript from Granola, or do you want to paste the summary?"

If Granola isn't connected, ask them to either paste it or run a structured prompt in Granola first (see the Granola section below).

**Step 2 — Ask their initial read.** Before writing anything:

> "What's your gut on the candidate — lean hire, lean no, on the fence? Anything you want me to specifically weigh in on?"

This matters. The write-up should reflect their judgment, not override it.

**Step 3 — Ask which format they need.** Unless they've already said:

> "Do you want the full ERP-ready notes, or a shorter two-paragraph summary for the hiring panel?"

**Step 4 — Write the summary.**

---

## Output formats

### Format A: ERP-ready interview notes (structured)

Use this when the user mentions ERP, hiring notes, formal write-up, or sharing with the hiring panel.

```markdown
**CANDIDATE SOLUTION** (if applicable — coding rounds)

[Paste the final code the candidate wrote. If they iterated, show versions.
Include known issues left unaddressed.]

---

**RAW NOTES — QUESTIONS & ANSWERS**

Group by section. For each Q&A:

- **Q:** [question, one line]
- **A:** [their answer, 2–4 lines, substance only]
- **Signal:** Strong / Partial / Weak / Concerning
- **Note:** [anything specific worth flagging]

---

**[OPTIONAL] INTERVIEWER OBSERVATIONS**

[Anything the transcript doesn't capture — body language, audio cues,
suspected AI assistance, confidence patterns. Flag for next interviewer.]

---

**VERDICT**

[2–4 sentences. Hire / no-hire / advance with caveats.
Be specific about why. Include any flags the next interviewer should watch for.]

---

**OPEN QUESTIONS / FOLLOW-UP**

[What didn't get resolved, what the next round should probe.]
```

### Format B: Two-paragraph hiring panel summary (softer)

Use when the user wants something to share with the broader team — friendlier tone, less granular:

- **Paragraph 1:** Background + strengths. What's actually working about this candidate.
- **Paragraph 2:** Concerns + recommendation. Soft framing — "the fit doesn't feel quite there" rather than "she failed."

Avoid these phrases by default unless the user specifies:

- "Reapply" (sounds dismissive)
- "Not at the right level" without context
- Generic boilerplate like "great culture fit"

---

## When the user has a strong opinion, respect it

If the user says "I'm going to advance her" or "she's a no," don't argue. Write the summary in a way that reflects their call. You can include nuance in the body, but the verdict should match their judgment.

If you genuinely disagree, flag it once before writing:

> "Quick honest read before I draft: the evidence in the transcript leans the other way. Want me to write your version anyway, or talk through the disagreement first?"

Then write what they asked for.

---

## Granola integration

If Granola MCP is connected (look for it in the available tools — described as a Granola-related connector), use it to:

- Fetch the latest interview transcript when the user asks for a summary
- Search past interviews when comparing candidates ("how did Priyanka's debugging answer compare to Ilyas's?")
- Pull notes from earlier rounds when prepping for a later one

If Granola is **not** connected, give the user a structured prompt they can paste into Granola directly:

```
Summarize this interview transcript for hiring notes. Candidate: [name].
Role: [role]. Round: [round number/type]. Topics covered: [topics].

Structure as:
1. Question-by-question recap (Q, A, signal: strong/partial/weak/concerning, note)
2. Strongest moments (with direct quotes if useful)
3. Weakest moments / concerns (with direct quotes)
4. [Any specific signals the user wants probed — e.g., AI assistance suspicion, leadership signals, project depth]
5. Verdict-relevant evidence

Keep it factual. Don't editorialize. Quote directly where useful.
```

---

## Comparison and calibration

When the user has interviewed multiple candidates for the same role and asks you to compare them:

- Anchor on the JD requirements
- Score each candidate on the same dimensions (experience, technical depth, project ownership, communication, leadership signals)
- Don't manufacture a tie when there isn't one — make a clear recommendation
- Note what would change the recommendation (e.g., "if you can flex on the years requirement, X becomes the top candidate")

---

## Default context (use unless overridden by JD)

The user often hires for these contexts. If the JD confirms or aligns with these, lean into the framing. If the JD says otherwise, the JD wins.

- **Mission-driven / nonprofit / NGO-facing software** — candidates should care about the mission, not just the tech
- **Open source** — comfort with public code, collaboration norms, async work
- **Small to mid-sized team** — generalist instincts, less specialization, ability to own things end-to-end
- **Glific is the most frequent context** — WhatsApp-based programs for NGOs; if the JD is for Glific specifically, anchor observations to that domain (messaging at scale, third-party API rate limits, multi-tenant NGO data, chatbot/RAG work)

These aren't hardcoded — they're priors. If a JD comes in for an enterprise SaaS company, drop the NGO framing entirely.

---

## Tone & format

- **Concise.** The user is busy. Don't repeat context they already have.
- **Specific.** "She missed the race condition in the wallet snippet" beats "her concurrency understanding seems weak."
- **Honest but kind.** Especially in candidate-facing summaries.
- **Use markdown.** Headers, bullets, tables when comparing. Don't write walls of prose for documents the user will scan.

## What NOT to do

- Don't write the summary before asking their gut read.
- Don't argue with the user's hiring decision after they've made it. Flag once, then execute.
- Don't pad write-ups with boilerplate ("Overall, the candidate showed mixed signals…"). Be specific.
- Don't claim a candidate is "great" or "weak" without evidence from the transcript or materials.
- Don't add an "encourage them to reapply" line by default — many users find it patronizing. Only include if the user asks for it.
