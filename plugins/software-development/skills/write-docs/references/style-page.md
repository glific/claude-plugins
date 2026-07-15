# Style: Page Structure

Different sections use different templates. Match the template to the section type.

---

## Template 1: Product Feature page (`4. Product Features/`)

```markdown
###**{N} minute read &nbsp; {padding} &nbsp; `{Level}`**

---

**{One-sentence summary of what this feature does.}**

{1–2 sentences of context: when you'd use this, how it fits into Glific.}

## {First capability or action}

{Step-by-step instructions or explanation.}

![{alt text}](/img/{feature}/{filename}.png)

## {Second capability or action}

{Continue as needed.}

---

You can read more about related features here:
- [{Related feature}]({../path/page.md})
```

**Rules:**
- H2 headings are task-focused: "Creating a Flow", "Editing a Template", "Viewing Reports"
- One screenshot per major action, placed after the step it shows
- End with cross-links to related Product Feature pages

---

## Template 2: Integration page (`5. Integrations/`)

```markdown
###**{N} minute read &nbsp; {padding} &nbsp; `{Level}`**

---

**{What this integration does and why you'd use it.}**

## Prerequisites

- {List what the user needs before starting: API keys, accounts, etc.}

## Setup

1. ...
2. ...

## Using {Integration Name} in Glific

{How to use the integration once it's set up.}

:::note
{Any important limitations or caveats.}
:::
```

---

## Template 3: FAQ page (`8. FAQ/`)

```markdown
###**{N} minute read &nbsp; {padding} &nbsp; `{Level}`**

---

**{Restate the question as a one-sentence answer.}**

## Steps

1. ...
2. ...

{Screenshot if helpful.}
```

FAQ pages are short. If the answer needs more than 5 steps or 2 screenshots, it belongs in Product Features instead.

---

## Template 4: Use Case page (`7. Use Cases/`)

```markdown
###**{N} minute read &nbsp; {padding} &nbsp; `{Level}`**

---

**{The problem this use case solves, in one sentence.}**

## The situation

{1–2 sentences describing the real-world scenario.}

## Solution

{Walk through the solution. Reference existing Product Feature pages rather than re-explaining how each feature works.}

## Steps

1. ...
2. ...
```

---

## Template 5: Pre Onboarding guide (`2. Pre Onboarding/`)

```markdown
###**{N} minute read &nbsp; {padding} &nbsp; `{Level}`**

---

**{What this guide helps the user accomplish.}**

## Prerequisites

- {External account or info needed before starting.}

## Steps

1. ...

:::note
{Common issues or things to watch out for.}
:::
```

---

## Read-time estimation

Count images × 10 seconds + word count ÷ 200 wpm. Round to nearest minute. Minimum: 1 minute.
