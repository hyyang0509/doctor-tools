import test from 'node:test';
import assert from 'node:assert/strict';
import { TAGS, taipeiDefaults, validDate, validEndpoint, validateRecord, upload, readState, writeState } from './model.mjs';

const record = () => ({ ...taipeiDefaults(new Date('2026-10-19T23:00:00Z')), id: '12345678-1234-4123-8123-123456789abc', createdAt: '2026-10-19T23:00:00Z', tags: ['水煮蛋'] });
const settings = { endpoint: 'https://script.google.com/macros/s/abc-123/exec', key: 'test-key' };
test('Taiwan date, midnight, meal boundaries and year/leap rollover', () => {
  assert.equal(taipeiDefaults(new Date('2026-12-31T16:00:00Z')).date, '2027-01-01');
  assert.equal(taipeiDefaults(new Date('2024-02-28T16:00:00Z')).date, '2024-02-29');
  for (const [hour, meal] of [[0,'點心'],[4,'點心'],[5,'早餐'],[10,'早餐'],[11,'午餐'],[14,'午餐'],[15,'點心'],[16,'點心'],[17,'晚餐'],[20,'晚餐'],[21,'點心']]) {
    assert.equal(taipeiDefaults(new Date(`2026-10-20T${String(hour).padStart(2,'0')}:00:00+08:00`)).meal, meal);
  }
});
test('dates are real calendar dates', () => {
  for (const date of ['2024-02-29','2026-01-31','2026-12-31']) assert.ok(validDate(date));
  for (const date of ['',null,'2026-02-29','2026-04-31','2026-13-01','2026-00-12','0000-01-01']) assert.equal(validDate(date),false);
});
test('14 unique labels; tags-only or text-only work, empty/invalid/oversized inputs fail', () => {
  assert.equal(TAGS.length,14); assert.equal(new Set(TAGS.map(t=>t[1])).size,14);
  assert.doesNotThrow(()=>validateRecord(record()));
  assert.doesNotThrow(()=>validateRecord({...record(), tags:[], content:'飯半碗'}));
  for (const patch of [{tags:[],content:' '},{tags:['假標籤']},{tags:['水煮蛋','水煮蛋']},{meal:'宵夜'},{content:'a'.repeat(1001)},{date:'2026-02-30'}]) {
    assert.throws(()=>validateRecord({...record(),...patch}));
  }
});
test('only official /exec endpoints are accepted', () => {
  assert.ok(validEndpoint(settings.endpoint));
  for (const endpoint of ['http://script.google.com/macros/s/a/exec','https://evil.test/exec','https://script.google.com.evil.test/macros/s/a/exec','https://script.google.com/macros/s/a/dev','https://script.google.com/macros/s/a/exec?key=x']) assert.equal(validEndpoint(endpoint),false);
});
test('upload uses simple POST, matching confirmation required including duplicate acknowledgement', async () => {
  const r = record();
  await upload(r,settings,async (url,options) => {
    assert.equal(url,settings.endpoint); assert.equal(options.method,'POST');
    assert.equal(options.credentials,'omit'); assert.equal(options.mode,undefined);
    assert.equal(JSON.parse(options.body).record.id,r.id);
    assert.equal(options.headers['Content-Type'],'text/plain;charset=utf-8');
    return {ok:true,json:async()=>({ok:true,id:r.id,duplicate:true})};
  });
});
test('server errors, opaque responses, mismatched IDs, bad JSON and network failures never acknowledge', async () => {
  for (const response of [{ok:false},{ok:true,type:'opaque'},{ok:true,json:async()=>({ok:false,error:'UNAUTHORIZED'})},{ok:true,json:async()=>({ok:true,id:'different'})},{ok:true,json:async()=>{throw new Error('bad json');}}]) {
    await assert.rejects(upload(record(),settings,async()=>response));
  }
  await assert.rejects(upload(record(),settings,async()=>{throw new TypeError('network');}));
  await assert.rejects(upload(record(),{endpoint:'',key:''},async()=>assert.fail('must not fetch')));
});
test('timeout fails without discarding the record', async () => {
  const r=record();
  await assert.rejects(upload(r,settings,async(url,options)=>new Promise((resolve,reject)=>{
    options.signal.addEventListener('abort',()=>{const e=new Error('abort'); e.name='AbortError'; reject(e);});
  }),5));
  assert.equal(r.id,record().id);
});
test('draft and immutable pending IDs survive reload; corrupt/quota storage fails loudly', () => {
  const map = new Map(); const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  const r=record(); const state={draft:r,pending:[r]};writeState(state,storage);
  assert.deepEqual(readState(storage),state);
  assert.throws(()=>writeState(state,{setItem(){throw new Error('quota');}}));
  assert.throws(()=>readState({getItem:()=>'{bad'}));
});
