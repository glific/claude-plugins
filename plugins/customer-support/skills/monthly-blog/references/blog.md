# Glific monthly blog — house style

This is the format, the filtering rules, and the voice for the monthly release
blog. Follow it closely; the published posts are consistent and the audience
(nonprofit program teams) reads them to learn what changed and why it helps.

## Output format

Produce Markdown in exactly this shape. Sections appear only if they have content.

```
# {Month} {Year} – Bug Fixes, Enhancements & Documentation Updates

**Bugs Fixed:**

**1) {Benefit-oriented theme title}:**
{2–3 sentence plain-language paragraph: what got better and why it matters to a team.}

**Highlights:**
- {short past-tense bullet, one per included issue}
- ...

**2) {Next theme}:**
...

**Enhancement Done:**

**1) {Theme title}:**
{paragraph}

**Highlights:**
- ...

**Documentation Update:**

**New Documentation Added:**

**1) {Doc title}:**
{1–2 sentences on what it helps a team do.}
```

Notes:
- Number themes within each section starting at 1.
- "Bugs Fixed" = reliability/correctness fixes. "Enhancement Done" = new or improved capability.
- Keep it curated and tight — a handful of themes, not a dump. The published posts are short.

## What to INCLUDE vs leave out

Include only what a Glific user would notice: new capabilities, usability and
reliability improvements, and fixes to things that affected what users
experienced.

Leave out internal engineering work, and list each left-out item separately for
the human to skim (number + one-word reason). Exclude:
- flaky/auto tests, test infrastructure (`[testing]`, "flaky test")
- tech-debt, refactors, deprecations, flag removals
- dependency / security bumps (Snyk, Dependabot)
- pure CI / ops / monitoring / logging / observability work
- tracking or `[Epic]` issues with no shipped user change
- doc PRs that are typo fixes, "last updated date" bumps, file moves/deletes,
  or internal sync workflows (e.g. "sync docs to Dify")

When genuinely unsure whether something is user-facing, leave it out and note it.
It is better to under-include and let the human add something back than to fill
the post with internal noise.

## Grouping

Cluster related issues into one theme with a benefit title. A theme's
"Highlights" bullets are the individual issues, each reworded into a short
past-tense phrase. Fold small one-off items into the nearest theme rather than
making a theme per issue.

## Voice

- Plain, warm, benefit-led. Say what a person can now do and why it helps.
- Past tense in highlights: "Fixed…", "Added…", "Improved…".
- Do NOT invent a feature, number, or capability that isn't in the issue/PR text.
  If a title is cryptic, summarise conservatively and flag the theme for review.
- Avoid hype words: seamless, robust, transformative, game-changing, cutting-edge,
  leverage (as a verb).
- Avoid "X, not Y" contrast framing — state the positive directly.

## Worked example (real May 2026 post)

From ~86 closed issues + 10 doc PRs, the published post kept only a handful of
themes. This is the target level of curation:

```
**Bugs Fixed:**

**1) Making AI Features More Reliable and Useful:**
This month, we focused on improving the reliability, visibility, and usability of
our AI-powered features. Users can now access imported OpenAI assistants without
errors, provide feedback on AI evaluation responses, and manage evaluations more
easily through a dedicated list view.

**Highlights:**
- Fixed issues with imported OpenAI assistants.
- Added user feedback on AI evaluation responses.
- Introduced a dedicated AI Evaluations list view.
- Improved evaluation performance for large datasets.

**2) A more stable voice AI experience:**
Several improvements reduced failures and improved reliability for voice-based AI,
with better error handling, logging, and backup processing during high demand.

**Highlights:**
- Added backup speech recognition support during high traffic.
- Improved handling of audio processing and file storage failures.
- Enhanced error tracking for voice AI and voice search.

**Enhancement Done:**

**1) Better WhatsApp form responses:**
We improved WhatsApp interactions so responses are captured correctly and
messaging works as expected, including better support for group conversations.

**Highlights:**
- Fixed multiple-choice response capture in WhatsApp Forms.
- Improved support for WhatsApp group memberships.
- Fixed dynamic links in secondary Call-to-Action buttons.

**Documentation Update:**

**New Documentation Added:**

**1) AI Evaluations:**
Explains how teams can measure how accurately their AI Assistants respond by
comparing answers against a trusted set of golden question-and-answer pairs.

**2) Speech-to-Text capabilities in Glific:**
Covers automatically transcribing voice notes and translating them into a common
language, making responses from different regional languages easier to collect.
```

Things to notice: dozens of `[testing]`, `tech-debt`, webhook-observability, and
Snyk issues were dropped; the docs section came from the AI Evaluations and
Speech-to-Text PRs, not from the typo/date-bump PRs.
