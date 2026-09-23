import test from 'node:test';
import assert from 'node:assert/strict';
import { isEventConfigured } from './config.mjs';
import { submitToCloud } from './formSync.mjs';

const event = {
  endpointUrl: 'https://script.google.com/macros/s/example-deployment-id/exec'
};

test('僅接受正式 Apps Script Web App 網址', () => {
  assert.equal(isEventConfigured(event), true);
  assert.equal(isEventConfigured({ endpointUrl: 'https://example.com/collect' }), false);
  assert.equal(isEventConfigured({ endpointUrl: 'https://script.google.com/macros/s/id/dev' }), false);
});

test('送出時保留欄位名稱與布林值', async () => {
  let request;
  await submitToCloud(
    { record_id: 'r1', participant_no: 'A01', grip_low: true, age: 65 },
    event,
    {
      online: true,
      fetchImpl: async (url, options) => { request = { url, options }; }
    }
  );

  assert.equal(request.url, event.endpointUrl);
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.mode, 'no-cors');
  assert.equal(request.options.body.get('record_id'), 'r1');
  assert.equal(request.options.body.get('grip_low'), 'true');
  assert.equal(request.options.body.get('age'), '65');
});

test('離線時保留為待送，不呼叫接收端', async () => {
  await assert.rejects(
    submitToCloud({}, event, { online: false, fetchImpl: async () => {} }),
    /OFFLINE/
  );
});
