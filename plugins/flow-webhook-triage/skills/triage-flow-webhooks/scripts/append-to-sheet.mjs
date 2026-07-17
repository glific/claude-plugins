#!/usr/bin/env node
/**
 * Client for the triage sheet Web App.
 *
 *   node append-to-sheet.mjs watermark          # -> { lastSeen, signatureKeys, rowCount }
 *   node append-to-sheet.mjs upsert < rows.json # rows.json = [{ signature_key, ... }]
 *
 * Env:
 *   GLIFIC_TRIAGE_WEBAPP_URL   Apps Script Web App /exec URL   (required)
 *   GLIFIC_TRIAGE_TOKEN       shared secret, if the script sets one
 *
 * With no URL set, `upsert` does a dry run and prints what it would send — useful
 * for a first pass before the sheet exists.
 */

const URL_ = process.env.GLIFIC_TRIAGE_WEBAPP_URL;
const TOKEN = process.env.GLIFIC_TRIAGE_TOKEN;

/** Free-text fields that can carry provider output, and therefore user data. */
const TEXT_FIELDS = ['reason', 'root_cause', 'repro_steps', 'impact', 'action_item'];
const MAX_TEXT = 500;

/**
 * Scrub obvious secrets and personal data out of free text before it leaves for the sheet.
 *
 * Glific is a WhatsApp platform: a provider error string can quote a contact's phone
 * number or their message, and a credential error can echo the credential. AppSignal's
 * access controls do not follow that text into a spreadsheet, so it gets scrubbed here —
 * at the boundary, once, rather than trusting every caller to remember.
 *
 * This is defence in depth, NOT a guarantee. Regexes cannot recognise a name or a
 * sentence a contact typed. The real controls are: keep the sheet's Google sharing
 * tight, and write diagnoses that paraphrase rather than quote. See SKILL.md.
 */
export function redact(text) {
  if (typeof text !== 'string' || !text) return text;

  let out = text
    // Credentials first, before the generic blob rules can half-eat them.
    // The `(?:bearer\s+)?` is load-bearing: without it, "Authorization: Bearer sk-xxx"
    // consumes "Bearer" as the value and leaves the actual secret in the string —
    // output that looks redacted but is not. See test-redact.mjs.
    .replace(
      /\b(authorization|bearer|token|api[_-]?key|apikey|secret|password|passwd|pwd)\b\s*[:=]?\s*(?:bearer\s+)?\S+/gi,
      '$1=[REDACTED]'
    )
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[UUID]')
    // contact details
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '[EMAIL]')
    .replace(/(?<![\w.])\+?\d[\d\s().-]{8,17}\d(?![\w.])/g, '[PHONE]')
    // Opaque blobs. Hex before base64 — hex is a subset of the base64 charset, so the
    // generic rule would otherwise swallow every digest and mislabel it.
    .replace(/\beyJ[\w-]{10,}\.[\w-]+\.[\w-]+/g, '[JWT]')
    .replace(/\b[0-9a-f]{32,}\b/gi, '[HASH]')
    .replace(/\b[A-Za-z0-9+/]{32,}={0,2}\b/g, '[TOKEN]');

  if (out.length > MAX_TEXT) out = `${out.slice(0, MAX_TEXT)}… [truncated]`;
  return out;
}

/** Apply redaction to every free-text field on a row. */
export function redactRow(row) {
  const clean = { ...row };
  for (const f of TEXT_FIELDS) {
    if (clean[f] != null) clean[f] = redact(String(clean[f]));
  }
  return clean;
}

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

async function readStdin() {
  if (process.stdin.isTTY) die('expected JSON rows on stdin');
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) die('empty stdin');
  try {
    return JSON.parse(raw);
  } catch (err) {
    die(`stdin is not valid JSON: ${err.message}`);
  }
}

/** Apps Script 302s to script.googleusercontent.com; fetch follows it by default. */
async function call(url, init) {
  const res = await fetch(url, { redirect: 'follow', ...init });
  const text = await res.text();
  if (!res.ok) die(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  try {
    return JSON.parse(text);
  } catch {
    // A login page instead of JSON is the classic symptom of a bad deployment.
    die(
      'response was not JSON — this is usually a Google login page, meaning the Web App\n' +
        '  deployment has "Who has access" set to something other than "Anyone".\n' +
        '  Any other setting requires the caller to be signed into Google; this script is not.\n' +
        `  First 200 chars: ${text.slice(0, 200)}`
    );
  }
}

async function watermark() {
  if (!URL_) {
    console.log(JSON.stringify({ lastSeen: null, signatureKeys: [], rowCount: 0, dryRun: true }));
    return;
  }
  const q = new URLSearchParams({ action: 'watermark', ...(TOKEN ? { token: TOKEN } : {}) });
  const out = await call(`${URL_}?${q}`, { method: 'GET' });
  if (out.error) die(out.error);
  console.log(JSON.stringify(out));
}

async function upsert() {
  const input = await readStdin();
  if (!Array.isArray(input)) die('stdin must be a JSON array of row objects');

  const missing = input.filter((r) => !r.signature_key);
  if (missing.length)
    die(`${missing.length} row(s) missing signature_key — that is the dedup key`);

  const rows = input.map(redactRow);

  if (!URL_) {
    console.log(`[dry run] GLIFIC_TRIAGE_WEBAPP_URL unset — would upsert ${rows.length} row(s):`);
    for (const r of rows) {
      console.log(
        `  ${r.signature_key}  ${(r.webhook_name || '-').padEnd(22)} ${(r.error_type || '-').padEnd(10)} ${(r.reason || '').slice(0, 50)}`
      );
    }
    const scrubbed = rows.filter((r, i) => r.reason !== input[i].reason).length;
    if (scrubbed) console.log(`(redacted free text in ${scrubbed} row(s) before send)`);
    return;
  }

  const out = await call(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: TOKEN, rows }),
  });
  if (out.error) die(out.error);
  console.log(`inserted ${out.inserted}, updated ${out.updated}, total ${out.total}`);
}

// Importable for tests; only runs the CLI when invoked directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2];
  if (cmd === 'watermark') await watermark();
  else if (cmd === 'upsert') await upsert();
  else if (cmd === 'redact-test') {
    const sample = await readStdin();
    console.log(JSON.stringify(sample.map(redactRow), null, 2));
  } else die(`usage: append-to-sheet.mjs <watermark|upsert>`);
}
