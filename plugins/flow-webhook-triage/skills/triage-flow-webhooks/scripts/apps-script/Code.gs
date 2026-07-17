/**
 * Glific flow-webhook triage — sheet Web App.
 *
 * Bound to the triage sheet, deployed with "Execute as: Me" + "Who has access: Anyone".
 * The sheet owner's own Google identity does every write, so no credentials are
 * ever shared with the people running the skill — they only need the URL.
 *
 * Two endpoints:
 *   GET  ?action=watermark  -> { lastSeen, incidentIds, rowCount }
 *   POST { token, rows: [] } -> upsert; returns { inserted, updated }
 *
 * Upsert, not append: a recurring incident updates its existing row and bumps
 * times_seen. That is what makes repeat offenders sortable, and it is why two
 * people running the triage on the same day cannot double-write.
 */

const SHEET_NAME = 'triage';

// Column order. Changing this means migrating the sheet — add to the end instead.
const COLUMNS = [
  'incident_id',      // dedup key — stable across runs
  'first_seen',       // when we first recorded it
  'last_seen',        // latest occurrence seen in AppSignal
  'last_run_date',    // when the triage last touched this row
  'times_seen',       // runs this incident has appeared in — the repeat signal
  'namespace',
  'exception_class',
  'webhook_name',     // internal name, e.g. unified-llm-call
  'action_url',       // what the flow author sees, e.g. filesearch-gpt
  'error_type',
  'kaapi_error_type',
  'http_status',
  'occurrences',      // AppSignal's count for this incident
  'org_id',
  'flow_id',
  'reason',
  'category',         // missing-classification | novel-failure | contract-violation | correct
  'root_cause',
  'repro_steps',
  'impact',
  'action_item',
  'owner',            // on-call | support | eng | none
  'code_refs',
  'appsignal_url',
];

/** Shared secret, set in Script Properties. Absent = open, which is fine for a private URL. */
function expectedToken_() {
  return PropertiesService.getScriptProperties().getProperty('TRIAGE_TOKEN');
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLUMNS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Map incident_id -> row number (1-indexed, including header). */
function indexRows_(sh) {
  const last = sh.getLastRow();
  const index = {};
  if (last < 2) return index;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    const id = String(ids[i][0]).trim();
    if (id) index[id] = i + 2;
  }
  return index;
}

/**
 * Watermark: the resume point. Returns the newest last_seen plus every known
 * incident id, so the caller can both narrow its AppSignal query and skip rows
 * it already has without a second round trip.
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'watermark';
  if (action !== 'watermark') {
    return json_({ error: 'unknown action: ' + action });
  }

  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) {
    return json_({ lastSeen: null, incidentIds: [], rowCount: 0 });
  }

  const values = sh.getRange(2, 1, last - 1, COLUMNS.length).getValues();
  const lastSeenCol = COLUMNS.indexOf('last_seen');
  let lastSeen = null;
  const incidentIds = [];

  for (const row of values) {
    const id = String(row[0]).trim();
    if (id) incidentIds.push(id);
    const seen = row[lastSeenCol];
    if (seen) {
      const iso = seen instanceof Date ? seen.toISOString() : String(seen);
      if (!lastSeen || iso > lastSeen) lastSeen = iso;
    }
  }

  return json_({ lastSeen: lastSeen, incidentIds: incidentIds, rowCount: values.length });
}

function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ error: 'invalid JSON body' });
  }

  const token = expectedToken_();
  if (token && payload.token !== token) {
    return json_({ error: 'unauthorized' });
  }

  const rows = payload.rows;
  if (!Array.isArray(rows)) {
    return json_({ error: 'rows must be an array' });
  }

  // Serialize concurrent runs — two people triaging at once must not interleave
  // a read-modify-write on the same row.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return json_({ error: 'busy — another run holds the lock' });
  }

  try {
    const sh = sheet_();
    const index = indexRows_(sh);
    const today = new Date().toISOString().slice(0, 10);
    const timesSeenCol = COLUMNS.indexOf('times_seen') + 1;
    let inserted = 0;
    let updated = 0;
    const pending = [];
    const pendingIds = {}; // ids queued for insert in THIS batch, but not yet in `index`

    for (const row of rows) {
      const id = String(row.incident_id || '').trim();
      if (!id) continue;

      // Same id twice in one batch: the first wins. Must be checked before the
      // `index` lookup — a queued row has no row number to update yet.
      if (pendingIds[id]) continue;

      const existing = index[id];
      if (existing) {
        // Recurrence: keep first_seen and the human diagnosis, refresh the volatile
        // fields, bump the counter. The diagnosis is not re-litigated on every run.
        const prev = Number(sh.getRange(existing, timesSeenCol).getValue()) || 1;
        const patch = {
          last_seen: row.last_seen || '',
          last_run_date: today,
          times_seen: prev + 1,
          occurrences: row.occurrences || '',
          http_status: row.http_status || '',
        };
        for (const key of Object.keys(patch)) {
          const col = COLUMNS.indexOf(key);
          if (col >= 0) sh.getRange(existing, col + 1).setValue(patch[key]);
        }
        updated++;
      } else {
        const values = COLUMNS.map((c) => {
          if (c === 'first_seen') return row.first_seen || row.last_seen || today;
          if (c === 'last_run_date') return today;
          if (c === 'times_seen') return 1;
          return row[c] !== undefined && row[c] !== null ? row[c] : '';
        });
        pending.push(values);
        pendingIds[id] = true;
        inserted++;
      }
    }

    if (pending.length) {
      sh.getRange(sh.getLastRow() + 1, 1, pending.length, COLUMNS.length).setValues(pending);
    }

    return json_({ inserted: inserted, updated: updated, total: sh.getLastRow() - 1 });
  } finally {
    lock.releaseLock();
  }
}
