#!/usr/bin/env node
/**
 * Tests for the redaction boundary in append-to-sheet.mjs.
 *
 *   node test-redact.mjs
 *
 * Cases are modelled on real Glific webhook failure text: WhatsApp numbers, echoed
 * credentials, provider blobs. The "cannot catch" block at the end is deliberate —
 * it documents what regexes will never get, so nobody mistakes this for a guarantee.
 */

import { redact, redactRow } from './append-to-sheet.mjs';

let fails = 0;
const t = (name, input, mustNotContain, mustContain) => {
  const out = redact(input);
  const leaked = [].concat(mustNotContain).filter((s) => out.includes(s));
  const missing = [].concat(mustContain || []).filter((s) => !out.includes(s));
  const ok = !leaked.length && !missing.length;
  if (!ok) fails++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}`);
  if (!ok) {
    console.log(`        in:  ${input}`);
    console.log(`        out: ${out}`);
    if (leaked.length) console.log(`        LEAKED: ${leaked.join(', ')}`);
    if (missing.length) console.log(`        missing marker: ${missing.join(', ')}`);
  }
};

console.log('\n-- credentials');
t('bearer token', 'request failed: Authorization: Bearer sk-abc123XYZdef456ghi789', 'sk-abc123XYZdef456ghi789');
t('api key kv', 'invalid api_key=AIzaSyD-1234567890abcdefghijklmnop', 'AIzaSyD-1234567890abcdefghijklmnop');
t('push key uuid', 'bad key 38cd362c-7e77-4df6-b0af-fe2d3fdbad84 rejected', '38cd362c-7e77-4df6-b0af-fe2d3fdbad84', '[UUID]');
t('password kv', 'auth failed password: hunter2swordfish', 'hunter2swordfish');
t('jwt', 'token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K', 'eyJzdWIiOiIxMjM0NTY3ODkwIn0');

console.log('\n-- contact data (WhatsApp platform — the real risk)');
t('e164 number', 'failed to send to +919876543210: invalid recipient', '+919876543210', '[PHONE]');
t('bare 10-digit', 'contact 9876543210 not reachable', '9876543210', '[PHONE]');
t('spaced number', 'number +91 98765 43210 opted out', ['98765 43210', '9876543210'], '[PHONE]');
t('email', 'notify amisha@projecttech4dev.org failed', 'amisha@projecttech4dev.org', '[EMAIL]');

console.log('\n-- opaque blobs');
t('hex digest', 'checksum d41d8cd98f00b204e9800998ecf8427e mismatch', 'd41d8cd98f00b204e9800998ecf8427e', '[HASH]');
t('base64 blob', 'payload YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkw failed', 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkw', '[TOKEN]');

console.log('\n-- must NOT over-redact (diagnosis has to stay readable)');
t('gemini 500 survives', '[GEMINI] Server error (code: 500 INTERNAL): An internal error has occurred. This is typically transient', ['[PHONE]', '[TOKEN]', '[HASH]'], ['GEMINI', '500', 'transient']);
t('status codes kept', 'HTTP 429 rate limited after 3 retries', ['[PHONE]'], ['429', '3 retries']);
t('module path kept', 'MatchError in Glific.Flows.Webhooks.Kaapi.classify/1', ['[TOKEN]'], 'Glific.Flows.Webhooks.Kaapi');
t('org/flow ids kept', 'org 190 flow 32116 failed', ['[PHONE]'], ['190', '32116']);

console.log('\n-- truncation');
// Realistic long prose — a single 900-char word would be eaten by the base64 rule first.
const long = 'the flow failed at node 12 because the provider returned an unexpected shape. '.repeat(12);
const out = redact(long);
const okTrunc = out.length < 600 && out.includes('[truncated]');
console.log(`${okTrunc ? '  ok  ' : ' FAIL '} caps at 500 chars (got ${out.length} from ${long.length})`);
if (!okTrunc) fails++;

console.log('\n-- redactRow covers every free-text field');
const row = redactRow({
  incident_id: '511',
  reason: 'send to +919876543210 failed',
  root_cause: 'key api_key=AIzaSyD-1234567890abcdefghijk leaked in log',
  repro_steps: 'message contact 9876543210',
  impact: 'contact amisha@projecttech4dev.org saw nothing',
  action_item: 'guard nil',
  org_id: 190,
});
const rowLeaks = ['+919876543210', 'AIzaSyD-1234567890abcdefghijk', '9876543210', 'amisha@projecttech4dev.org']
  .filter((s) => JSON.stringify(row).includes(s));
console.log(`${rowLeaks.length ? ' FAIL ' : '  ok  '} all text fields scrubbed${rowLeaks.length ? ' — LEAKED: ' + rowLeaks.join(', ') : ''}`);
if (rowLeaks.length) fails++;
const kept = row.incident_id === '511' && row.org_id === 190;
console.log(`${kept ? '  ok  ' : ' FAIL '} non-text fields untouched`);
if (!kept) fails++;

console.log('\n-- KNOWN LIMITS (documented, not asserted)');
for (const [what, sample] of [
  ['a name in prose', 'user Priya Sharma reported the flow broke'],
  ['message content', 'LLM input was: "my son is sick and I need help"'],
]) {
  console.log(`  ~  ${what}: regex cannot catch this`);
  console.log(`     -> ${redact(sample)}`);
}
console.log('     This is why diagnoses must paraphrase, and why sheet sharing stays tight.');

console.log(`\n${fails === 0 ? 'ALL PASS' : fails + ' FAILURE(S)'}\n`);
process.exit(fails ? 1 : 0);
