#!/usr/bin/env node
/**
 * Client for the triage sheet Web App.
 *
 *   node append-to-sheet.mjs watermark          # -> { lastSeen, incidentIds, rowCount }
 *   node append-to-sheet.mjs upsert < rows.json # rows.json = [{ incident_id, ... }]
 *
 * Env:
 *   GLIFIC_TRIAGE_SHEET_URL   Apps Script Web App /exec URL   (required)
 *   GLIFIC_TRIAGE_TOKEN       shared secret, if the script sets one
 *
 * With no URL set, `upsert` does a dry run and prints what it would send — useful
 * for a first pass before the sheet exists.
 */

const URL_ = process.env.GLIFIC_TRIAGE_SHEET_URL;
const TOKEN = process.env.GLIFIC_TRIAGE_TOKEN;

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
    console.log(JSON.stringify({ lastSeen: null, incidentIds: [], rowCount: 0, dryRun: true }));
    return;
  }
  const out = await call(`${URL_}?action=watermark`, { method: 'GET' });
  if (out.error) die(out.error);
  console.log(JSON.stringify(out));
}

async function upsert() {
  const rows = await readStdin();
  if (!Array.isArray(rows)) die('stdin must be a JSON array of row objects');

  const missing = rows.filter((r) => !r.incident_id);
  if (missing.length) die(`${missing.length} row(s) missing incident_id — that is the dedup key`);

  if (!URL_) {
    console.log(`[dry run] GLIFIC_TRIAGE_SHEET_URL unset — would upsert ${rows.length} row(s):`);
    for (const r of rows) {
      console.log(`  ${r.incident_id}  ${r.error_type || '?'}  ${(r.reason || '').slice(0, 60)}`);
    }
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

const cmd = process.argv[2];
if (cmd === 'watermark') await watermark();
else if (cmd === 'upsert') await upsert();
else die(`usage: append-to-sheet.mjs <watermark|upsert>`);
