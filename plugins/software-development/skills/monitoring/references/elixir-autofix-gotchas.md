# Elixir / Oban autofix gotchas

Framework knowledge the autofix agent must have before touching a worker or a flow.
These are the traps that produce a green-tested PR that is still wrong. Read this
before implementing a Tier 1/2 fix; cite the relevant rule in the PR description.

---

## Oban worker return values — this is where resilience fixes go wrong

A worker's `perform/1` return tuple decides what Oban does next. Getting it wrong
either keeps the AppSignal flood or replaces it with a silent zombie loop.

| Return | Oban behavior | AppSignal | Use when |
|---|---|---|---|
| `:ok` | job done | none | success |
| `{:error, reason}` | **raises `Oban.PerformError`**, retries until `max_attempts` | **one error event per attempt** | almost never in autofix — this IS the usual flood source |
| `{:discard, reason}` | job stops, moved to `discarded`, **no raise** | none | terminal, non-retryable failure (or "let the cron re-queue it next sweep") |
| `{:snooze, seconds}` | reschedule after `seconds` | none | transient backpressure that **self-resolves** (rate limit, lock) |
| `{:cancel, reason}` | job cancelled, no retry | none | deliberate abort |

### Trap 1 — `{:snooze, n}` increments `max_attempts`

From Oban's source (`snooze_job`): `inc: [max_attempts: 1]`. Every snooze pushes
`max_attempts` one ahead of `attempt`. Therefore:

```elixir
# BROKEN: this never terminates. Each snooze bumps max_attempts, so the guard stays true forever.
if attempt < max_attempts, do: {:snooze, 60}, else: {:discard, reason}
```

A job that keeps hitting the snooze branch snoozes **indefinitely** — a zombie that
reschedules every `n` seconds and never discards. Snooze is for conditions that
**resolve on their own** (a rate-limit window, a held lock), not for bounding retries
of a failing operation. To bound snoozes you must track a counter in `job.meta`, not
compare `attempt` to `max_attempts`.

### Trap 2 — `{:error, _}` is the flood, not the fix

If an incident is "`Oban.PerformError` spamming AppSignal," the cause is almost always
a branch returning `{:error, _}`. The fix is usually to return `{:discard, _}` (or
`:ok` with a logged reason) so the exception is not raised. Before inventing a
mechanism, **check the sibling branches in the same `case`** — one of them likely
already returns `{:discard, _}` for the same error class. Match it. The minimal fix is
often a one-word change, not a new attempt-counting scheme.

### Trap 3 — cron re-queue outlives the job

Many Glific workers are fed by a periodic sweep (`perform_periodic` → a query for
rows still needing work, e.g. `is_nil(gcs_url)`). Discarding a job does **not** stop
the next sweep from re-queuing the same row. So per-job retry logic is often
redundant — the cron already provides the retry loop. If a row keeps failing, it will
be re-picked every sweep for the whole TTL window. If that needs to stop, mark the row
(a distinctive marker the sweep query filters out), mirroring how permanent failures
are already handled — don't try to solve it with in-job snoozing.

### Testing workers — drive the executor, not `perform/1`

Calling `MyWorker.perform(%Oban.Job{attempt: 1, max_attempts: 2})` directly bypasses
everything Oban does *around* the call: the `max_attempts` increment on snooze, state
transitions, retry scheduling. A direct-call test of the snooze bug above passes
while the job loops forever in production. Use `Oban.Testing` (`perform_job/2`,
`drain_queue/1`) so the assertion reflects real behavior. Always confirm the test
**fails without the fix**.

---

## Protocol / coercion crashes (Tier 1 `Protocol.UndefinedError`)

- `String.Chars` is not implemented for `Map`, tuple, PID, function, etc.
  `Enum.join(list, ", ")`, `to_string(x)`, and `"#{x}"` all raise when `x` is one of
  these. `Jason.encode!/1` handles maps/lists but **raises** on non-encodable terms
  (tuples, PIDs) — it is not a universal fallback.
- **Blast radius:** the same shape usually flows to more than one sink. If a list can
  contain maps at one `Enum.join`, grep for every place that field is stringified
  (flow results, Google-Sheet row builders, logs). Fix all of them.
- **Symptom check:** stringifying a media/attachment map into a JSON blob stops the
  crash but stores something no flow author can use. That signals a *missing feature*
  (handle the media), not a coercion bug — downgrade to Tier 4, human.

---

## Multi-tenancy (any fix that queries or writes)

`Repo` auto-injects `organization_id` from the process dictionary. In an Oban worker
the job runs in a fresh process — call `Repo.put_process_state(org_id)` at the top of
`perform/1` or the query silently sees no org / the wrong org. A "fix" that adds a
query without restoring tenant context works in dev and leaks/empties in prod. See
`lib/glific/CLAUDE.md`.

---

## Logging in error branches

- Log exceptions with `Glific.log_exception/1`; recoverable errors with
  `Glific.log_error/2`. Never call `Appsignal.send_error` directly, and don't add a
  redundant `Logger` next to a `log_*` call.
- Never `inspect/1` a `%Tesla.Env{}` (or a term that may hold one) into a log/error
  string — it leaks `Authorization: Bearer …`. Use `Glific.SafeLog.safe_inspect/1`.
  BSP/provider error paths carry raw `{:ok|:error, Tesla.Env}` tuples — this is the
  common offender.
