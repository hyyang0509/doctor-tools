import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addPendingRecord, getPendingRecords, isDuplicate, loadRecords,
  markRecordSent, saveCurrentEvent, loadCurrentEvent
} from './storage.mjs';

function memoryStore() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

test('先存 pending，再以相同 record_id 標記 sent', () => {
  const store = memoryStore();
  const record = { record_id: 'stable-id', event_id: 'event-1', participant_no: 'A01' };
  addPendingRecord(record, store);
  assert.equal(getPendingRecords(store)[0].record_id, 'stable-id');
  markRecordSent('stable-id', store);
  assert.equal(getPendingRecords(store).length, 0);
  assert.equal(loadRecords(store)[0].record_id, 'stable-id');
  assert.equal(loadRecords(store)[0].sync_status, 'sent');
});

test('重複鍵為場次加去除前後空白的編號', () => {
  const store = memoryStore();
  addPendingRecord({ record_id: '1', event_id: 'event-1', participant_no: 'A01' }, store);
  assert.equal(isDuplicate('event-1', ' A01 ', store), true);
  assert.equal(isDuplicate('event-2', 'A01', store), false);
});

test('記住目前場次', () => {
  const store = memoryStore();
  saveCurrentEvent('event-3', store);
  assert.equal(loadCurrentEvent(store), 'event-3');
});
