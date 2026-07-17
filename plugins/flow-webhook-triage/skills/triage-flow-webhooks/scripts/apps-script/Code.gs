/**
 * Glific flow-webhook triage — sheet Web App.
 *
 * Bound to the triage sheet, deployed with "Execute as: Me" + "Who has access: Anyone".
 * The sheet owner's own Google identity does every write, so no credentials are
 * ever shared with the people running the skill — they only need the URL.
 *
 * Two endpoints:
 *   GET  ?action=watermark&token=… -> { lastSeen, signatureKeys, rowCount }
 *   POST { token, rows: [] } -> upsert; returns { inserted, updated }
 *
 * Upsert, not append: a recurring signature updates its existing row and bumps
 * times_seen. That is what makes repeat offenders sortable, and it is why two
 * people running the triage on the same day cannot double-write.
 */

const SHEET_NAME = 'triage';

// Column order. Changing this means migrating the sheet — add to the end instead.
//
// The dedup key is signature_key, NOT the AppSignal incident number. AppSignal groups by
// exception class, and this subsystem uses deliberately low-cardinality classes, so one
// incident bundles unrelated failures (#511 "SystemError" spanned four different webhooks).
// A signature is (namespace, exception_class, webhook_name, error_type, reason_shape) —
// the actual unit a human can diagnose and fix.
const COLUMNS = [
  'signature_key',    // dedup key — hash of the signature tuple, stable across runs
  'first_seen',       // earliest sample seen for this signature
  'last_seen',        // latest sample seen for this signature
  'last_run_date',    // when the triage last touched this row
  'times_seen',       // runs this signature has appeared in — the repeat signal
  'namespace',
  'exception_class',
  'webhook_name',     // internal name, e.g. unified-llm-call
  'action_url',       // what the flow author sees, e.g. filesearch-gpt
  'error_type',
  'kaapi_error_type',
  'http_status',
  'sample_count',     // samples matching this signature — proportion, NOT true volume
  'incident_count',   // parent incident's total, across ALL its signatures (context only)
  'incident_number',  // link back to AppSignal
  'org_count',        // distinct orgs hit — many orgs on one config error = product defect
  'org_ids',
  'flow_ids',
  'reason',           // representative (most recent), redacted client-side
  'reason_shape',     // normalised form the signature groups on
  'category',         // missing-classification | novel-failure | contract-violation | correct
  'root_cause',
  'repro_steps',
  'impact',
  'action_item',
  'owner',            // on-call | support | eng | none
  'code_refs',
  'appsignal_url',
];

/** The dedup key column. */
const KEY = 'signature_key';

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
    sh.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    sh.setFrozenRows(1);
    return sh;
  }

  // The header is NOT write-once. Rows are written positionally against COLUMNS, so a
  // header left over from an older deployment silently mislabels every column — the data
  // is right and every name is wrong, which reads fine and is therefore worse than an
  // error. (This happened for real: a 24-column header survived a change to 28 columns,
  // leaving `occurrences` above sample_count and `org_id` above incident_count.)
  const header = sh.getRange(1, 1, 1, COLUMNS.length).getValues()[0];
  if (COLUMNS.some((c, i) => header[i] !== c)) {
    sh.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Map signature_key -> row number (1-indexed, including header). */
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
 * signature key, so the caller can both narrow its AppSignal query and skip
 * re-diagnosing signatures it already has, without a second round trip.
 */
function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = params.action || 'watermark';
  if (action !== 'watermark') {
    return json_({ error: 'unknown action: ' + action });
  }

  // Reads need the token too. "Who has access: Anyone" is what lets an unauthenticated
  // client call this at all, so without a check here the watermark — and every incident
  // id in the sheet — is readable by anyone who obtains the URL.
  const token = expectedToken_();
  if (token && params.token !== token) {
    return json_({ error: 'unauthorized' });
  }

  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) {
    return json_({ lastSeen: null, signatureKeys: [], rowCount: 0 });
  }

  const values = sh.getRange(2, 1, last - 1, COLUMNS.length).getValues();
  const lastSeenCol = COLUMNS.indexOf('last_seen');
  let lastSeen = null;
  const signatureKeys = [];

  for (const row of values) {
    const id = String(row[0]).trim();
    if (id) signatureKeys.push(id);
    const seen = row[lastSeenCol];
    if (seen) {
      const iso = seen instanceof Date ? seen.toISOString() : String(seen);
      if (!lastSeen || iso > lastSeen) lastSeen = iso;
    }
  }

  return json_({ lastSeen: lastSeen, signatureKeys: signatureKeys, rowCount: values.length });
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
      const id = String(row[KEY] || '').trim();
      if (!id) continue;

      // Same signature twice in one batch: the first wins. Must be checked before the
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
          sample_count: row.sample_count || '',
          incident_count: row.incident_count || '',
          org_count: row.org_count || '',
          org_ids: row.org_ids || '',
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
