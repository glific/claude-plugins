#!/usr/bin/env node
/**
 * Pull flow-webhook incidents from the AppSignal GraphQL API.
 *
 *   node fetch-incidents.mjs verify              # is the token a readable one?
 *   node fetch-incidents.mjs introspect          # dump the schema (fix the query with this)
 *   node fetch-incidents.mjs fetch [--since ISO] # incidents from both namespaces
 *
 * Env:
 *   APPSIGNAL_API_KEY   AppSignal **Personal API token** (required)
 *   APPSIGNAL_APP_ID    app id; defaults to Glific prod
 *
 * IMPORTANT — the token must be a Personal API token, from your *user* settings.
 * A push API key (what the Glific app uses to *send* errors, APPSIGNAL_PUSH_API_KEY)
 * is write-only and will 401 here. `verify` tells you which one you have.
 *
 * NOTE — the `fetch` query below is written against AppSignal's documented schema but
 * has NOT been run against a live token yet. If it errors on field names, run
 * `introspect` and correct QUERY; the shape of the output contract is what matters.
 */

import { createHash } from 'node:crypto';

const TOKEN = process.env.APPSIGNAL_API_KEY;
const APP_ID = process.env.APPSIGNAL_APP_ID || '5f480c425ac13f7330101f30'; // Glific/prod
const ENDPOINT = 'https://appsignal.com/graphql';

const NAMESPACES = ['flow_webhooks', 'flow_webhook_config_errors'];
const SAMPLES_PER_INCIDENT = 200;

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

async function gql(query, variables = {}) {
  if (!TOKEN) die('APPSIGNAL_API_KEY is not set — add it to ~/.zshrc and restart your shell');

  const res = await fetch(`${ENDPOINT}?token=${encodeURIComponent(TOKEN)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    die(`non-JSON response (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }

  if (res.status === 401 || body.errors?.some((e) => /authenticat/i.test(e.message || ''))) {
    // Report what AppSignal said; do not guess WHY. An earlier version asserted
    // "this is probably a push key", which was a hunch dressed as a diagnosis and
    // sent people hunting for the wrong problem.
    const said = body.errors?.[0]?.message || `HTTP ${res.status}`;
    die(
      `AppSignal rejected the token: ${said}\n` +
        '\n  Things worth checking, in order:\n' +
        '  1. Is APPSIGNAL_API_KEY a *Personal API token* from https://appsignal.com/users/edit ?\n' +
        '     A push API key (app settings, used by the app to SEND errors) cannot read.\n' +
        '  2. Does that account have access to the app you are querying?\n' +
        '  3. Did the value survive the copy? Compare `echo ${#APPSIGNAL_API_KEY}` in your\n' +
        '     shell against the token on the page — a truncated paste looks exactly like this.\n' +
        '  4. Has the token been regenerated since you copied it?'
    );
  }
  if (body.errors) die(`GraphQL: ${JSON.stringify(body.errors).slice(0, 500)}`);
  return body.data;
}

async function verify() {
  const data = await gql('query { viewer { id email organizations { slug name } } }');
  const v = data?.viewer;
  if (!v) die('no viewer returned — token is not a Personal API token');
  const email = v.email || '';
  const masked = email.includes('@') ? `${email.slice(0, 2)}***@${email.split('@').pop()}` : '(unknown)';
  console.log(`token OK — authenticated as ${masked}`);
  for (const o of v.organizations || []) console.log(`  org: ${o.slug} (${o.name})`);
}

/** Dump the fields available on the incident types, so the query can be corrected. */
async function introspect() {
  const data = await gql(`
    query {
      a: __type(name: "ExceptionIncident") { fields { name type { name kind ofType { name } } } }
      b: __type(name: "App") { fields { name args { name type { name kind } } } }
    }
  `);
  for (const [key, label] of [['a', 'ExceptionIncident'], ['b', 'App']]) {
    const t = data[key];
    if (!t) {
      console.log(`${label}: not found (name may differ in this schema)`);
      continue;
    }
    console.log(`\n${label} fields:`);
    for (const f of t.fields || []) {
      const args = (f.args || []).map((a) => a.name).join(', ');
      console.log(`  ${f.name}${args ? `(${args})` : ''}`);
    }
  }
}

// Verified against the live schema on 2026-07-17 via `introspect`. Things that are not
// guessable, each of which cost a round trip:
//   - the argument is `namespaces` (plural) and takes [String], not String
//   - exceptionIncidents has NO time filter; `samples(start:, end:)` does
//   - tags (webhook_name, error_type, reason, …) are not fields — they are key/value
//     pairs under sample.overview
//
// WHY WE GROUP BY SIGNATURE RATHER THAN BY INCIDENT
// ------------------------------------------------
// AppSignal groups incidents by exception CLASS, and this subsystem deliberately uses
// low-cardinality classes (the webhook name lives in the message, not the class). So one
// incident is a grab-bag: #511 "SystemError" held samples from text_to_speech,
// filesearch-gpt, voice-filesearch-gpt AND speech_to_text — 8958 occurrences spanning
// unrelated root causes. A row per incident would be precise-looking and useless.
//
// So the unit of triage is a SIGNATURE mined from the samples:
//   (namespace, exception_class, webhook_name, error_type, reason_shape)
// and the incident number is demoted to a link.
const QUERY = `
  query ($appId: String!, $namespaces: [String], $limit: Int, $start: DateTime, $end: DateTime, $sampleLimit: Int) {
    app(id: $appId) {
      exceptionIncidents(namespaces: $namespaces, limit: $limit, state: OPEN) {
        number
        count
        namespace
        exceptionName
        exceptionMessage
        lastOccurredAt
        createdAt
        samples(start: $start, end: $end, limit: $sampleLimit) {
          id
          time
          overview {
            key
            value
          }
        }
      }
    }
  }
`;

/** sample.overview is [{key, value}] — flatten to a plain tag object. */
function tagsOf(sample) {
  const out = {};
  for (const { key, value } of sample.overview || []) out[key] = value;
  return out;
}

/**
 * Collapse a reason string to its shape, so that the same failure with different ids
 * groups together: "6367551 does not have any active flows awaiting results."
 * -> "<N> does not have any active flows awaiting results."
 */
export function reasonShape(reason) {
  if (!reason) return '';
  return reason
    .replace(/\b\d[\d.,]*\b/g, '<N>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{20,}\b/gi, '<UUID>')
    .replace(/https?:\/\/\S+/g, '<URL>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function signatureKey(parts) {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 12);
}

/**
 * Group every sample across every incident into signature rows.
 *
 * Counts are SAMPLE counts, not true occurrence counts — AppSignal returns a capped
 * subset of samples per incident. `incident_count` is the parent incident's real total
 * (across ALL its signatures), kept for context. Do not present sample_count as the
 * number of times something happened; it is evidence of proportion, not volume.
 */
function toSignatureRows(incidents) {
  const groups = new Map();

  for (const inc of incidents) {
    for (const s of inc.samples || []) {
      const t = tagsOf(s);
      const shape = reasonShape(t.reason);
      const parts = [
        inc.namespace,
        inc.exceptionName,
        t.webhook_name || '',
        t.error_type || '',
        shape,
      ];
      const key = signatureKey(parts);

      if (!groups.has(key)) {
        groups.set(key, {
          signature_key: key,
          namespace: inc.namespace,
          exception_class: inc.exceptionName,
          webhook_name: t.webhook_name || '',
          error_type: t.error_type || '',
          kaapi_error_type: t.kaapi_error_type || '',
          http_status: t.http_status || '',
          reason_shape: shape,
          reason: t.reason || '',
          incident_number: String(inc.number),
          incident_count: inc.count,
          sample_count: 0,
          _orgs: new Set(),
          _flows: new Set(),
          first_seen: s.time,
          last_seen: s.time,
          appsignal_url: `https://appsignal.com/project-tech4dev/sites/${APP_ID}/exceptions/incidents/${inc.number}`,
        });
      }

      const g = groups.get(key);
      g.sample_count += 1;
      if (t.organization_id) g._orgs.add(t.organization_id);
      if (t.flow_id) g._flows.add(t.flow_id);
      if (s.time < g.first_seen) g.first_seen = s.time;
      if (s.time > g.last_seen) {
        g.last_seen = s.time;
        g.reason = t.reason || g.reason; // representative = most recent
      }
    }
  }

  return [...groups.values()]
    .map(({ _orgs, _flows, ...g }) => ({
      ...g,
      // Distinct orgs is THE product-defect signal: one org repeating is a support
      // conversation; many orgs hitting one config error is something to fix at source.
      org_count: _orgs.size,
      org_ids: [..._orgs].sort().slice(0, 10).join(','),
      flow_ids: [..._flows].sort().slice(0, 10).join(','),
    }))
    .sort((a, b) => b.sample_count - a.sample_count);
}

async function fetchIncidents() {
  const sinceArg = process.argv.indexOf('--since');
  const since = sinceArg > -1 ? process.argv[sinceArg + 1] : null;
  if (since && Number.isNaN(Date.parse(since))) die(`--since is not a parseable date: ${since}`);
  const start = since ? new Date(since).toISOString() : null;

  const data = await gql(QUERY, {
    appId: APP_ID,
    namespaces: NAMESPACES,
    limit: 100,
    start,
    end: null,
    sampleLimit: SAMPLES_PER_INCIDENT,
  });

  const incidents = (data?.app?.exceptionIncidents || []).filter((i) => (i.samples || []).length);
  const rows = toSignatureRows(incidents);

  const totalSamples = incidents.reduce((n, i) => n + i.samples.length, 0);
  console.error(
    `${incidents.length} incident(s) with samples${since ? ` since ${since}` : ''} → ` +
      `${totalSamples} samples → ${rows.length} signature(s)`
  );
  for (const ns of NAMESPACES) {
    console.error(`  ${ns}: ${rows.filter((r) => r.namespace === ns).length} signature(s)`);
  }
  const capped = incidents.filter((i) => i.samples.length >= SAMPLES_PER_INCIDENT);
  if (capped.length) {
    console.error(
      `  NOTE: ${capped.length} incident(s) hit the ${SAMPLES_PER_INCIDENT}-sample cap ` +
        `(#${capped.map((i) => i.number).join(', #')}) — proportions are from a subset, ` +
        `and a rare signature may be missing entirely.`
    );
  }

  console.log(JSON.stringify(rows, null, 2));
}

const cmd = process.argv[2];
if (cmd === 'verify') await verify();
else if (cmd === 'introspect') await introspect();
else if (cmd === 'fetch') await fetchIncidents();
else die('usage: fetch-incidents.mjs <verify|introspect|fetch [--since ISO]>');
