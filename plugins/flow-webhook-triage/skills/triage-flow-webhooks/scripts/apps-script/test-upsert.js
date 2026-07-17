// Simulates Apps Script's SpreadsheetApp so Code.gs's upsert logic can be exercised locally.
const fs = require('fs');
const path = require('path').join(__dirname, 'Code.gs');
const src = fs.readFileSync(path, 'utf8');

let grid = []; // grid[r][c], 0-indexed; row 0 = header

const fakeSheet = {
  getLastRow: () => grid.length,
  appendRow: (row) => grid.push([...row]),
  setFrozenRows: () => {},
  getRange: (r, c, nr = 1, nc = 1) => ({
    getValues: () => {
      const out = [];
      for (let i = 0; i < nr; i++) {
        const row = grid[r - 1 + i] || [];
        out.push(Array.from({ length: nc }, (_, j) => (row[c - 1 + j] ?? '')));
      }
      return out;
    },
    getValue: () => (grid[r - 1] || [])[c - 1] ?? '',
    setValue: (v) => {
      while (grid.length < r) grid.push([]);
      grid[r - 1][c - 1] = v;
    },
    setValues: (vals) => {
      vals.forEach((row, i) => {
        while (grid.length < r + i) grid.push([]);
        grid[r - 1 + i] = [...row];
      });
    },
  }),
};

global.SpreadsheetApp = {
  getActiveSpreadsheet: () => ({ getSheetByName: () => fakeSheet, insertSheet: () => fakeSheet }),
};
global.PropertiesService = { getScriptProperties: () => ({ getProperty: () => 'secret-token' }) };
global.LockService = { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) };
global.ContentService = {
  MimeType: { JSON: 'json' },
  createTextOutput: (t) => ({ setMimeType: () => JSON.parse(t) }),
};

eval(src + '\n; global.COLUMNS = COLUMNS; global.doPost = doPost; global.doGet = doGet;');

const post = (rows, token = 'secret-token') =>
  doPost({ postData: { contents: JSON.stringify({ token, rows }) } });

let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? '  ok  ' : ' FAIL '} ${name}${cond ? '' : ' -- ' + detail}`);
  if (!cond) failures++;
};

console.log('\n-- run 1: two new incidents');
let r = post([
  { incident_id: '511', error_type: 'unknown', reason: 'GEMINI 500', occurrences: 12, root_cause: 'missing 5xx branch' },
  { incident_id: '526', error_type: 'invalid_media_url', reason: '404', occurrences: 3 },
]);
check('inserts 2', r.inserted === 2 && r.updated === 0, JSON.stringify(r));

console.log('\n-- run 2: SAME incidents again (the duplication worry)');
r = post([
  { incident_id: '511', error_type: 'unknown', reason: 'GEMINI 500', occurrences: 40 },
  { incident_id: '526', error_type: 'invalid_media_url', reason: '404', occurrences: 5 },
]);
check('inserts 0, updates 2', r.inserted === 0 && r.updated === 2, JSON.stringify(r));
check('total stays 2', r.total === 2, `total=${r.total}`);

const idIdx = COLUMNS.indexOf('incident_id');
const seenIdx = COLUMNS.indexOf('times_seen');
const occIdx = COLUMNS.indexOf('occurrences');
const rcIdx = COLUMNS.indexOf('root_cause');
const row511 = grid.find((x) => String(x[idIdx]) === '511');

check('times_seen bumped to 2', row511[seenIdx] === 2, `got ${row511[seenIdx]}`);
check('occurrences refreshed to 40', row511[occIdx] === 40, `got ${row511[occIdx]}`);
check('diagnosis preserved on recurrence', row511[rcIdx] === 'missing 5xx branch', `got "${row511[rcIdx]}"`);

console.log('\n-- run 3: one recurring + one new');
r = post([
  { incident_id: '511', occurrences: 55 },
  { incident_id: '519', error_type: 'exception', reason: 'timeout' },
]);
check('inserts 1, updates 1', r.inserted === 1 && r.updated === 1, JSON.stringify(r));
check('times_seen now 3', grid.find((x) => String(x[idIdx]) === '511')[seenIdx] === 3);

console.log('\n-- duplicate id WITHIN one batch');
r = post([{ incident_id: '777', reason: 'a' }, { incident_id: '777', reason: 'b' }]);
check('only 1 row for dupe-in-batch', r.inserted === 1, JSON.stringify(r));
check('no duplicate 777 rows', grid.filter((x) => String(x[idIdx]) === '777').length === 1);

console.log('\n-- auth + validation');
check('bad token rejected', post([{ incident_id: 'x' }], 'wrong').error === 'unauthorized');
check('rows must be array', post('nope').error === 'rows must be an array');
check('blank incident_id skipped', post([{ incident_id: '  ' }]).inserted === 0);

console.log('\n-- watermark');
post([{ incident_id: '900', last_seen: '2026-07-16T10:00:00Z' }, { incident_id: '901', last_seen: '2026-07-17T09:00:00Z' }]);
const wm = doGet({ parameter: { action: 'watermark' } });
check('lastSeen = newest', wm.lastSeen === '2026-07-17T09:00:00Z', wm.lastSeen);
check('incidentIds complete', ['511', '526', '519', '777', '900', '901'].every((i) => wm.incidentIds.includes(i)), JSON.stringify(wm.incidentIds));
check('header not counted', wm.rowCount === grid.length - 1, `rowCount=${wm.rowCount} grid=${grid.length}`);
check('unknown action errors', doGet({ parameter: { action: 'zzz' } }).error !== undefined);

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'} — ${grid.length - 1} data rows\n`);
process.exit(failures ? 1 : 0);
