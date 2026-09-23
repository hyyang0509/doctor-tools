/** @OnlyCurrentDoc */

const SHEET_NAME = '工作表1';

const HEADERS = Object.freeze([
  'record_id',
  'event_id',
  'event_label',
  'participant_no',
  'age_input_method',
  'age',
  'roc_birth_year',
  'sex',
  'grip_strength_kg',
  'grip_special_cause',
  'calf_circumference_cm',
  'grip_low',
  'calf_low',
  'screening_result',
  'trigger_reason',
  'measured_at',
  'app_version',
  'duplicate_override'
]);

const NUMBER_FIELDS = new Set([
  'age', 'roc_birth_year', 'grip_strength_kg', 'calf_circumference_cm'
]);

const BOOLEAN_FIELDS = new Set([
  'grip_special_cause', 'grip_low', 'calf_low', 'duplicate_override'
]);

function doGet() {
  return jsonResponse_({ ok: true, service: 'sarcopenia-screening-upload' });
}

function doPost(e) {
  const data = e && e.parameter ? e.parameter : {};
  if (!data.record_id || !data.event_id) {
    return jsonResponse_({ ok: false, error: 'MISSING_REQUIRED_FIELDS' });
  }

  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];
    ensureHeaders_(sheet);

    if (recordExists_(sheet, data.record_id)) {
      return jsonResponse_({ ok: true, duplicate: true });
    }

    sheet.appendRow(HEADERS.map(key => normalizeValue_(key, data[key])));
    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, error: String(error.message || error) });
  } finally {
    lock.releaseLock();
  }
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }

  const current = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
  if (!HEADERS.every((header, index) => current[index] === header)) {
    throw new Error('HEADER_MISMATCH');
  }
}

function recordExists_(sheet, recordId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  return Boolean(
    sheet.getRange(2, 1, lastRow - 1, 1)
      .createTextFinder(String(recordId))
      .matchEntireCell(true)
      .findNext()
  );
}

function normalizeValue_(key, rawValue) {
  if (rawValue == null || rawValue === '') return '';
  if (NUMBER_FIELDS.has(key)) {
    const value = Number(rawValue);
    return Number.isFinite(value) ? value : '';
  }
  if (BOOLEAN_FIELDS.has(key)) return String(rawValue) === 'true';

  const value = String(rawValue);
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
