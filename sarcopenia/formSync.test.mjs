import test from 'node:test';
import assert from 'node:assert/strict';
import { isEventConfigured } from './config.mjs';
import { submitToCloud } from './formSync.mjs';

const reply = (payload, extra = {}) => ({
  ok: true, type: 'cors', json: async () => payload, ...extra
});

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
      fetchImpl: async (url, options) => { request = { url, options }; return reply({ ok: true }); }
    }
  );

  assert.equal(request.url, event.endpointUrl);
  assert.equal(request.options.method, 'POST');
  assert.notEqual(request.options.mode, 'no-cors');
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

test('接收端回覆 ok:true（含重複紀錄）才算送出成功', async () => {
  await submitToCloud({ record_id: 'r1' }, event, { online: true, fetchImpl: async () => reply({ ok: true }) });
  await submitToCloud({ record_id: 'r1' }, event, { online: true, fetchImpl: async () => reply({ ok: true, duplicate: true }) });
});

test('接收端拒收、無法讀取或格式錯誤時拋錯，紀錄保持待送', async () => {
  const cases = [
    [reply({ ok: false, error: 'HEADER_MISMATCH' }), /HEADER_MISMATCH/],
    [reply({ ok: false }), /REJECTED/],
    [reply({}, { type: 'opaque', ok: false }), /NO_CONFIRMATION/],
    [reply({}, { ok: false }), /NO_CONFIRMATION/],
    [{ ok: true, type: 'cors', json: async () => { throw new SyntaxError('html'); } }, /INVALID_RESPONSE/]
  ];
  for (const [response, pattern] of cases) {
    await assert.rejects(
      submitToCloud({ record_id: 'r1' }, event, { online: true, fetchImpl: async () => response }),
      pattern
    );
  }
});

test('網路錯誤時拋錯', async () => {
  await assert.rejects(
    submitToCloud({ record_id: 'r1' }, event, { online: true, fetchImpl: async () => { throw new TypeError('Failed to fetch'); } }),
    /Failed to fetch/
  );
});
