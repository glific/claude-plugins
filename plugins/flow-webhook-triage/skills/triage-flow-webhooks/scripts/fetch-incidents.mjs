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

const TOKEN = process.env.APPSIGNAL_API_KEY;
const APP_ID = process.env.APPSIGNAL_APP_ID || '5f480c425ac13f7330101f30'; // Glific/prod
const ENDPOINT = 'https://appsignal.com/graphql';

const NAMESPACES = ['flow_webhooks', 'flow_webhook_config_errors'];

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
    die(
      'AppSignal rejected the token (401).\n' +
        '  This is almost always a PUSH key rather than a Personal API token.\n' +
        '  Push keys live on the app settings page and can only SEND data.\n' +
        '  Get a Personal API token from your AppSignal *user* settings, and put it\n' +
        '  in APPSIGNAL_API_KEY.'
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

const QUERY = `
  query ($appId: String!, $namespace: String, $limit: Int, $start: DateTime) {
    app(id: $appId) {
      exceptionIncidents(namespace: $namespace, limit: $limit, start: $start) {
        id
        number
        count
        namespace
        exceptionName
        lastOccurredAt
        firstBacktraceLine
        state
      }
    }
  }
`;

async function fetchIncidents() {
  const sinceArg = process.argv.indexOf('--since');
  const since = sinceArg > -1 ? process.argv[sinceArg + 1] : null;

  const out = [];
  for (const namespace of NAMESPACES) {
    const data = await gql(QUERY, { appId: APP_ID, namespace, limit: 100, start: since });
    const incidents = data?.app?.exceptionIncidents || [];
    for (const i of incidents) out.push({ ...i, namespace: i.namespace || namespace });
    console.error(`${namespace}: ${incidents.length} incident(s)`);
  }
  console.log(JSON.stringify(out, null, 2));
}

const cmd = process.argv[2];
if (cmd === 'verify') await verify();
else if (cmd === 'introspect') await introspect();
else if (cmd === 'fetch') await fetchIncidents();
else die('usage: fetch-incidents.mjs <verify|introspect|fetch [--since ISO]>');
