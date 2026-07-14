# Third-party remediation playbook

When an incident is caused by an external service rather than a bug in Glific's
own code, autofix usually can't make the vendor return a 200. But "can't code-fix
it" is not "do nothing." Classify by **HTTP status class** and recommend the
specific action below. Put these recommendations in the Discord report's
"Third-party — needs attention" section, grouped by provider.

The golden rule that overrides everything here:

> **Never add a blind retry to a side-effecting call.** Retrying a WhatsApp send,
> a payment, or a sheet append can double the side effect. Retry is only safe for
> idempotent reads/operations. For side-effecting calls, prefer
> handle-and-log + dead-letter, or an idempotency key, not naive retry.

---

## By status class

### 5xx, timeout, connection closed  → transient → resilience
Examples seen in this app: Kaapi `503` / `checkout_timeout`, Gemini TTS `500` /
`timeout`, Bhashini `504`, OpenAI `closed`.

Recommend, in rough priority order:
1. **Retry with exponential backoff + jitter** — *only if the call is idempotent.*
2. **Circuit breaker** — after N consecutive failures, stop hammering the vendor
   and fail fast for a cooldown window. This is the single highest-value fix for
   the AppSignal symptom we saw: a vendor outage backing up the Oban queue.
3. **Timeout tuning** — TTS providers (Gemini, Bhashini) are genuinely slow;
   a too-tight timeout manufactures failures. Raise it, and make the call async.
4. **Fallback provider** — if a second TTS/LLM provider is configured, fail over.
5. **Queue + dead-letter** — let the job fail cleanly into a DLQ for replay rather
   than crashing the worker and retrying forever.
6. **Graceful user-facing degradation** — if the AI/TTS step fails, the flow
   should continue with a sensible default, not error out mid-conversation.

If the crash is in *Glific's* worker code (the call result isn't handled and the
exception bubbles up and kills the Oban job), that wrapper IS a code fix →
promote to a Tier-2 autofix candidate (see SKILL.md), opened as a **draft** PR.

### 400 Bad Request  → NOT transient → fix the request or the config
Example: Gupshup `400` on `/flows` or `/flows/.../publish`.

A 400 means the vendor rejected the payload. Retrying changes nothing.
- If the malformed request originates in Glific's code (wrong field, bad encoding)
  → this is a **code fix** (validate/correct the payload before sending) →
  promote to a Tier-2 autofix candidate.
- If it's a bad flow/config authored by an org → **route to support** with the
  org ID and the offending URL; not a code fix.

### 401 / 403  → auth / permission → route to a human
Example: Google Sheets `401` / `403` on a specific spreadsheet URL.

This is almost always a permission problem on one org's resource — the sheet was
unshared, or credentials for that integration expired. No code change fixes it.
- Report the **org and the exact resource URL** and route to support / the org
  admin to re-share the sheet or refresh credentials.
- If 401s are widespread (not one org), it's a credential rotation problem on
  Glific's side → flag as ops, not autofix.

### 404 / 409 / 422  → semantic → usually expected, sometimes a bug
Examples: Kaapi `404` (ingest of missing assistant), `409` (already exists),
`422` (validation).
- `409 already exists` is often **not an error at all** — the operation is
  idempotent and the resource is already there. Recommend treating 409 as success
  for that call. This can be a small, safe **code fix** (Tier-2 candidate).
- `404` / `422` usually mean Glific sent a reference the vendor doesn't recognize
  or a payload it rejected → validate before sending (code fix) or route to
  support if it's org data.

---

## By provider (quick reference for this app)

| Provider | Typical errors seen | Default recommendation |
|---|---|---|
| **Kaapi** (AI assistant) | 503, checkout_timeout, 409, 422, 404 | Circuit breaker + backoff for 5xx/timeouts; treat 409 as success; validate refs for 404/422 |
| **Gemini TTS** | 500, 502, timeout | Raise timeout, make async, retry idempotent, consider fallback TTS |
| **Bhashini TTS** | 504, 422, timeout | Same as Gemini; these are slow gov endpoints — timeout tuning matters most |
| **Gupshup** (WhatsApp forms) | 400, 401 | 400 → fix/validate request or route bad flow to support; 401 → credential refresh |
| **Google Sheets** | 401, 403 | Per-org permission issue → route to support with org + sheet URL |
| **OpenAI** | 400, closed | 400 → validate request; `closed` (connection) → retry idempotent + backoff |

These provider mappings are a starting point — tune them as you learn the failure
modes. The report should always show the provider, status, count, and the
recommended action so a human can override the default.
