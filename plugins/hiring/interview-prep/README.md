## How to use the hiring skill

### Install it (one-time)

1. Download `SKILL.md` from the repo (or from the file Claude generated)
2. In Claude, go to **Settings → Capabilities → Skills**
3. Click **Upload skill** and select the file
4. Done — it's active across all your chats

If you don't see a Skills section in settings, your plan may not have it enabled yet. As a workaround, paste the SKILL.md content into a project's knowledge — works similarly.

---

### When the skill triggers

It activates automatically when you:

- Upload a JD, resume, or candidate assignment
- Say "I have an interview to prep for"
- Paste a Granola transcript
- Mention "this candidate," "help me prep," or ask for interview questions

No need to say "use the hiring skill" — just talk normally about the candidate or interview.

---

### Three things you can do with it

#### 1. Prep for an interview

Drop the JD into the chat. The skill will ask:

- Which round is this?
- What do you want to cover?
- What materials should I work with (resume, assignment, GitHub link)?

Answer those, and it'll give you questions tailored to the round with what to listen for in each answer.

**Example:**

> _"I'm interviewing someone for backend engineer tomorrow. Round 1. Want to cover system design and concurrency."_

#### 2. Get help during an interview

If the candidate just wrote code or gave an answer you want to push on, paste it in and ask. The skill gives you 1–3 focused follow-ups.

**Example:**

> _"She just wrote this rate limiter, what should I push on?" [paste code]_

#### 3. Summarize after the interview

After the round, tell the skill the interview is done. It'll ask:

- Should I pull the Granola transcript, or do you want to paste it?
- What's your gut on the candidate?

Then it writes an ERP-ready summary with: candidate solution (if coding), Q&A notes, your verdict, and open questions for the next round.

**Example:**

> _"Just finished interviewing Priyanka. Pull the transcript from Granola and write up the notes."_

---

### Connecting Granola (optional but recommended)

To let the skill pull transcripts automatically:

1. In Claude: **Settings → Connectors → search Granola**
2. Connect, authenticate via OAuth, toggle it on

Once connected, you can say _"summarize my interview with [name]"_ and the skill fetches the transcript itself.

If you skip this step, paste the transcript manually when the skill asks — works the same way, just one extra step.

---

### Tips

- **Always start with the JD.** The skill is designed to refuse generic questions without one — that's intentional.
- **Tell it what you want, not what topics to avoid.** "Coding and concurrency only" beats "no behavioral stuff."
- **If you disagree with its read, push back.** The skill respects your hiring decision; flag your gut and it'll write the summary your way.
- **For complex rounds, run it twice.** Once for prep, again after the interview. The skill works best when each session focuses on one thing.

---

### Updating the skill

If you find it doing something annoying — taking the lead too much, adding sections you didn't ask for, framing things wrong — that's a sign to update the SKILL.md. Open it, edit the relevant section, and re-upload. Skills aren't static; tighten them as you learn what works.
