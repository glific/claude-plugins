# Glific platform monitoring — weekly report

**Week:** Jun 17 – Jun 24, 2026 · **App:** `Glific/prod`

**Headline:**
- **25** open exception incidents (code-level bugs)
- **3** autofix PRs opened this run (2 ready, 1 draft) — [#5282](https://github.com/glific/glific/pull/5282), [#5281](https://github.com/glific/glific/pull/5281), [#5283](https://github.com/glific/glific/pull/5283)
- **8** third-party / external items needing attention
- Highest-volume actor this week: `GcsWorker` Oban failures (**1,638** recent occurrences)

Classification follows recent-activity-over-total: a large total with few recent
hits is treated as quieted down. Tiers: 1 = mechanical bug (autofix), 2 = resilience
hardening (autofix draft), 3 = external/config (no PR, remediation note), 4 = needs a human.

## Autofix PRs opened

Three PRs opened against `glific/glific`, all labeled `autofix`. **None merged — human review is the gate.**

| # | PR | Tier | Recent | Status | Fix |
|---|----|------|--------|--------|-----|
| #139 | [#5283](https://github.com/glific/glific/pull/5283) | 2 | 1,638 | **draft** · tests green | `GcsWorker.perform/1` now `{:snooze, 60}` on a timeout with attempts left and `{:discard, reason}` on the final attempt, instead of returning `{:error, _}` and re-raising `Oban.PerformError`. No retry added to the side-effecting upload (idempotency preserved). |
| #4 | [#5282](https://github.com/glific/glific/pull/5282) | 1 | 52 | ready · tests green | `Periodic.init_common_flow/3` now handles `{:error, %Cachex.ExecutionError{}}` (flow with no published revision) by logging + skipping instead of a bare `{:ok, flow} =` MatchError. +1 regression test. |
| #22 | [#5281](https://github.com/glific/glific/pull/5281) | 1 | 23 | ready · tests green | `Router.update_context_results/4` routes list values through a `stringify_value/1` helper (`Jason.encode!` for maps) before `Enum.join`, fixing `String.Chars`-not-implemented-for-Map on WhatsApp media payloads. +1 regression test. |

Deferred this run (over the 3-PR cap, lower recent count) — noted for next week:
- #515 / #516 Ecto.MultipleResultsError — `duplicate_inbound?/1` at `wa_group_message.ex:182` (18 + 3 recent). `Repo.one` on a non-unique query; fix with `limit 1` / dedupe.
- #3 UndefinedFunctionError — `send_interactive_msg` unsupported for WA group, `action.ex:758` (1 recent).
- #86 KeyError — `:id` not found in `nil`, `state/flow.ex:107` `get_user_name/2` (1 recent).
- #7 ArgumentError — nil given for `:wa_group_id` (1 recent).

## Code bugs needing review

These need cross-file reasoning or have an ambiguous root cause — no PR opened.

| # | Exception | Recent / Total | Where | Note |
|---|-----------|----------------|-------|------|
| #518 | Postgrex.Error `undefined_table` | 1 / 1 | `KaapiController#prompt_generation_callback` | Relation `prompt_generation_requests` does not exist — **missing migration**, needs human. |
| #513 | Ecto.MultipleResultsError | 4 / 8 | web (no location) | Got 2 where 1 expected; needs the query identified. |
| #510 | Glific.Partners.CredentialError | 10 / 20 | partners | "Credential save blocked" — looks like an intentional guard firing; confirm whether expected. |
| #17 | Ecto.NoResultsError | 37 / 4,908 | background (no location) | High recent but no code location — needs trace inspection. |
| #410 | `:exit` GenServer.call `{:reset_flows, 47}` | 1 / 2 | `flows.ex:662` | `Glific.State` 5s timeout on publish; State server contention. |
| #388 | `:exit` GenServer.call `:get_flow` | 1 / 21 | `resolvers/flows.ex:155` | Same `Glific.State` timeout family. |
| #384 | Postgrex.Error `program_limit_exceeded` | 1 / 4 | maytapi image controller | btree index row size exceeds limit — schema/index design issue. |
| #105 | Ecto.MultipleResultsError | 1 / 76 | `wa_group_message.ex:439` | Quieted; same family as #515/#516. |
| #69 | ArgumentError | 1 / 64 | web | Quieted. |
| #8 | DBConnection.ConnectionError | 4 / 32,866 | background | SSL recv closed by pool — infra/pool tuning, not a code bug. |
| #196 | Ecto.Query.CastError `"English Reading"` | 3 / 246,595 | `action.ex:1136` | Mostly quieted; org flow data casting a label into an integer field. |

## Third-party — needs attention

Grouped by provider. No PRs — recommendations per the remediation playbook.

### Bhashini / TTS (Glific.Flows.Webhook)
- **#495** `SystemError from nmt_tts_with_bhasini` — **307 recent / 1,186 total**. 5xx/system class → **circuit breaker + backoff** (highest value: a vendor outage is backing the flow_webhooks queue), **raise timeout and make async** (Bhashini is a slow gov endpoint), consider a **fallback TTS provider**. If the crash bubbles up and kills the worker, the wrapper is a Tier-2 code fix.
- **#497** `TimeoutError from text_to_speech` — **31 recent / 145 total**. Timeout class → **raise timeout, make the call async**, retry only if idempotent, fall back to alternate TTS.

### Gupshup (WhatsApp / forms)
- **#417** `PartnerAPI.Error — Partner token fetch failed` — **61 recent / 174 total**. Auth/token → **refresh Gupshup partner credentials**; if widespread, treat as a credential-rotation ops task.
- **Anomaly #514** `400` on `partner/app/.../flows` — bad request, not transient → **fix/validate the request payload** if it originates in Glific, else **route the offending flow/org to support** (URL in tag).

### Kaapi (AI assistant)
- **#468** `Failed to upload evaluation dataset` — **4 recent / 497 total** (mostly quieted). 5xx/timeout → **backoff + circuit breaker**; treat `409 already exists` as success; validate refs for `404/422`.

### AskGlific (AI)
- **#512** `AskGlific bot failed to respond` — **12 recent / 15 total**. External AI failure → **graceful user-facing degradation** (continue the flow with a sensible default rather than erroring mid-conversation); confirm whether upstream is Kaapi/OpenAI.

### Google Sheets
- **Anomaly #508** `403` on a specific spreadsheet — per-org permission problem → **route to support** with the org + sheet URL (`.../spreadsheets/1tVn4sJeuO3uGrf5JkgwfrmHXfJQVM3-qujjOh3FJaFA`) to re-share / refresh credentials. No code fix.

### Infra / ops anomalies (FYI)
- **Anomaly #509** `contact_import` queue — 304 scheduled, org unknown → check for a stuck/backed-up import.
- **Anomaly #436 / #437** oban_job exception rate/count triggers — aggregate signal consistent with the GcsWorker (#139) and Bhashini (#495) volume above.

## Manual SOP checklist

- [ ] Cloud SQL [system insights](https://console.cloud.google.com/sql/instances/glific-tides/system-insights?project=tides-saas-309509) & [alert policies](https://console.cloud.google.com/monitoring/alerting/policies?project=tides-saas-309509)
- [ ] Gigalixir [deployment activity](https://console.gigalixir.com/#/apps/glific/activity)
- [ ] Phoenix LiveDashboard [home](https://api.prod.glific.com/dashboard/home), [Postgres diagnose](https://api.prod.glific.com/dashboard/ecto_stats?nav=diagnose) (watch for status FALSE), [OS data](https://api.prod.glific.com/dashboard/os_mon)
- [ ] Unsynced media email (last 2 weeks) + Oban web
- [ ] **First Friday of the month only:** review `ready_to_delete` orgs
- [ ] Log findings in the [weekly monitoring doc](https://docs.google.com/document/d/1z1aE4vp6mkioD6bic9rThFIHiZzN6HIbrZBzhyfgAeE/edit)
