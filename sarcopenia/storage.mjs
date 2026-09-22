const RECORDS_KEY = 'hy-sarcopenia-records-v1';
const EVENT_KEY = 'hy-sarcopenia-current-event-v1';

function getStore(store) {
  return store || window.localStorage;
}

export function loadRecords(store) {
  try {
    const parsed = JSON.parse(getStore(store).getItem(RECORDS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecords(records, store) {
  getStore(store).setItem(RECORDS_KEY, JSON.stringify(records));
}

export function addPendingRecord(record, store) {
  const records = loadRecords(store);
  records.push({ ...record, sync_status: 'pending' });
  saveRecords(records, store);
  return records;
}

export function markRecordSent(recordId, store) {
  const records = loadRecords(store).map(record => record.record_id === recordId
    ? { ...record, sync_status: 'sent', sent_at: new Date().toISOString() }
    : record);
  saveRecords(records, store);
  return records;
}

export function isDuplicate(eventId, participantNo, store) {
  const normalized = String(participantNo).trim();
  return loadRecords(store).some(record => record.event_id === eventId && record.participant_no === normalized);
}

export function getPendingRecords(store) {
  return loadRecords(store).filter(record => record.sync_status === 'pending');
}

export function loadCurrentEvent(store) {
  return getStore(store).getItem(EVENT_KEY) || '';
}

export function saveCurrentEvent(eventId, store) {
  getStore(store).setItem(EVENT_KEY, eventId);
}

export function clearAll(store) {
  const target = getStore(store);
  target.removeItem(RECORDS_KEY);
  target.removeItem(EVENT_KEY);
}

export function createRecordId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `rec-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const storageKeys = { RECORDS_KEY, EVENT_KEY };
