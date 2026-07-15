# Style: Writing

Read at least two existing pages in the same section before writing a new one — match their tone and density.

## Audience

Primary: **NGO program managers and field workers** using Glific daily. Non-technical. Need to know *what* to do, not *why* the code works.

Secondary: **Implementation partners** setting up Glific for NGOs. More technical, but still prefer step-by-step clarity.

**Plain language rules:**
- High-school reading level.
- One idea per sentence.
- Explain what things do, not how they work internally.
- If a technical term is unavoidable ("flow", "template", "collection"), explain it in context on first use or link to another doc.
- Use "you" and "your". Active voice, present tense.

## Voice

| Don't | Do instead |
|---|---|
| "Click the button" | "Select **Create Flow**" |
| "The user should navigate to" | "Open **Flows** from the left menu" |
| "It is possible to" | "You can" |
| "In order to" | "To" |
| Passive voice | Active, second-person, present tense |
| "Please note that" | Just say it |

## Page header format

Every page starts with a read-time and difficulty badge, matching the existing Glific style:

```markdown
###**{N} minute read &nbsp; ... &nbsp; `{Level}`**
```

Use these levels:
- `Beginner` — anyone can follow with no prior Glific knowledge
- `Intermediate` — assumes familiarity with basic Glific features
- `Advanced` — requires understanding of flows, APIs, or technical setup

Example (copy the spacing exactly — the `&nbsp;` padding pushes the badge to the right):
```markdown
###**3 minute read &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; `Beginner`**
```

## Instructions format

Numbered steps for sequential actions. Each step = one action.

**Rules:**
1. **Bold every UI element** the user interacts with: button labels, menu items, tab names, field labels.
2. Place a screenshot *after* the step it illustrates, not before.
3. Keep steps atomic — one click or one fill per step.
4. Use "Select" not "Click" (works for touchscreens too).
5. Use quotes for exact text the user types; bold for UI labels they select.

**Example:**
```markdown
1. Open **Flows** from the left menu.

![Flows list](/img/flows/flows_list.png)

2. Select **+ Create Flow**.
3. Enter a name for your flow and select **Save**.
```

## Section intro pattern

After the header badge, start with a **bold one-liner** that tells the reader exactly what this feature does:

```markdown
**Flows let you build automated conversation sequences that run without staff involvement.**
```

Then 1–2 sentences of context if needed. Then jump straight into steps or sub-sections.

## Anti-patterns

| Don't | Why |
|---|---|
| GitHub CDN image URLs in new pages | Images can break; use `static/img/` instead |
| `<img>` tags with GitHub asset URLs for new screenshots | Use standard markdown `![alt](/img/...)` |
| Long intros before the first action | Badge → bold one-liner → steps |
| Duplicating WhatsApp/Meta documentation | Link to official docs instead |
| Explaining GraphQL, Apollo, or internal architecture | Audience doesn't need this |
| `Note:` in plain text | Use `:::note` admonition |
