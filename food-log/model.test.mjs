import test from 'node:test';
import assert from 'node:assert/strict';
import { TAGS, taipeiDefaults, taipeiQuickDates, validDate, validEndpoint, validateRecord, upload, readState, writeState } from './model.mjs';

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
test('Taiwan today and yesterday cross local midnight, year and leap day', () => {
  assert.deepEqual(taipeiQuickDates(new Date('2026-12-31T15:59:59Z')), {today:'2026-12-31',yesterday:'2026-12-30'});
  assert.deepEqual(taipeiQuickDates(new Date('2026-12-31T16:00:00Z')), {today:'2027-01-01',yesterday:'2026-12-31'});
  assert.deepEqual(taipeiQuickDates(new Date('2024-02-29T16:00:00Z')), {today:'2024-03-01',yesterday:'2024-02-29'});
});
test('unique labels; tags-only or text-only work, empty/invalid/oversized inputs fail', () => {
  assert.equal(new Set(TAGS.map(t=>t[1])).size,TAGS.length);
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
test('receiver diagnostics produce actionable hints rather than generic success/failure', async()=>{
  for(const [result,pattern] of [
    [{ok:false,error:'NOT_CONFIGURED'},/setup/],
    [{ok:false,error:'HEADER_MISMATCH'},/欄名/],
    [{ok:false,error:'SHEET_MISSING'},/工作表/],
    [{ok:false,error:'WRITE_FAILED',stage:'open_spreadsheet'},/重新授權/],
    [{ok:false,error:'WRITE_FAILED',stage:'write'},/保護/],
    [{ok:false,error:'WRITE_FAILED',stage:'lock'},/稍後/]
  ]) await assert.rejects(upload(record(),settings,async()=>({ok:true,json:async()=>result})),pattern);
});
test('draft and immutable pending IDs survive reload; corrupt/quota storage fails loudly', () => {
  const map = new Map(); const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  const r=record(); const state={draft:r,pending:[r]};writeState(state,storage);
  assert.deepEqual(readState(storage),state);
  assert.throws(()=>writeState(state,{setItem(){throw new Error('quota');}}));
  assert.throws(()=>readState({getItem:()=>'{bad'}));
});

test('new optional observations serialize without guessing or changing legacy fields', async () => {
  const { recordContent } = await import('./model.mjs');
  const r = {...record(), content:'飯半碗', drinks:[{type:'拿鐵',sugar:'無加糖'},{type:'茶',sugar:''}],
    nutrition:{vegetables:'約 1 拳',protein:'少量',fruit:'沒有',dairy:['無糖優格','起司']}};
  const text=recordContent(r);
  assert.match(text,/飯半碗\n【補充紀錄】/);
  assert.match(text,/飲料：拿鐵（無加糖）/); assert.match(text,/飲料：茶（加糖情況未記錄）/);
  assert.match(text,/蔬菜：約 1 拳/);assert.match(text,/蛋白質食物：少量/);assert.match(text,/水果：沒有/);assert.match(text,/乳品：無糖優格、起司/);
  assert.equal(recordContent({...record(),tags:['拿鐵']}),''); // no inferred dairy or sugar
  assert.equal(recordContent({...record(),drinks:[],nutrition:{}}),'');
  const snapshot=structuredClone(r);
  await upload(r,settings,async(url,options)=>{
    const wire=JSON.parse(options.body).record;
    assert.equal(wire.content,text);assert.deepEqual(wire.tags,['水煮蛋']);
    return {ok:true,json:async()=>({ok:true,id:r.id})};
  });
  assert.deepEqual(r,snapshot); // retries never append metadata twice
});

test('observations-only records work; invalid, conflicting or oversized observations fail', async () => {
  assert.doesNotThrow(()=>validateRecord({...record(),tags:[],nutrition:{vegetables:'約 1 拳'}}));
  assert.doesNotThrow(()=>validateRecord({...record(),tags:[],drinks:[{type:'茶',sugar:''}]}));
  for (const patch of [
    {drinks:[{type:'茶',sugar:'半糖'}]}, {drinks:[{type:'茶',sugar:''},{type:'茶',sugar:'有加糖'}]},
    {drinks:[{type:'未知',sugar:''}]}, {nutrition:{vegetables:'一噸'}},
    {nutrition:{dairy:['沒有','鮮奶']}}, {nutrition:{dairy:'鮮奶'}}, {nutrition:{dairy:['起司','起司']}},
    {nutrition:{unknown:'沒有'}}, {content:'a'.repeat(990),nutrition:{vegetables:'約 1 拳'}}
  ]) assert.throws(()=>validateRecord({...record(),...patch}));
});

test('water states distinguish missing/below/achieved, dedupe periods, and never invent meals or volume', async () => {
  const {daySummary,recordContent,hasFood}=await import('./model.mjs');
  const water={...record(),tags:[],hydration:{上午:'未達'}};
  assert.equal(hasFood(water),false);
  assert.match(recordContent(water),/^【喝水紀錄】/);
  assert.doesNotThrow(()=>validateRecord(water));
  const second={...water,createdAt:'2026-10-20T03:00:00Z',hydration:{上午:'達標'}};
  const summary=daySummary([second,water],water.date);
  assert.equal(summary.hydration.上午,'達標'); assert.equal(summary.hydration.下午,undefined);
  assert.equal(summary.meals.早餐,false);
  assert.equal(daySummary([water,record()],water.date).meals.早餐,true);
  for(const hydration of [null,[],{中午:'達標'},{上午:true},{上午:'500'}]) assert.throws(()=>validateRecord({...water,hydration}));
});
test('meal templates retain explicit food portions without copying water/date/work, and deep links validate', async () => {
  const {templateFromRecord,reminderDraft}=await import('./model.mjs');
  const r={...record(),nutrition:{starch:'半碗'},hydration:{上午:'達標'},work:'門診'};
  const template=templateFromRecord(r);template.tags.push('牛肉麵');
  assert.deepEqual(r.tags,['水煮蛋']);
  assert.equal(template.hydration,undefined);assert.equal(template.work,undefined);assert.equal(template.date,undefined);
  assert.equal(template.nutrition.starch,'半碗');
  assert.deepEqual(reminderDraft('?date=2026-11-18&meal=%E6%99%9A%E9%A4%90'),{date:'2026-11-18',meal:'晚餐'});
  assert.equal(reminderDraft('?date=2026-02-30&meal=午餐'),null);
  assert.equal(reminderDraft('?date=2026-11-18&meal=未知'),null);
});
test('edits require update acknowledgement and upload keeps structured observations separate', async () => {
  const r={...record(),action:'update',hydration:{下午:'未達'},nutrition:{starch:'半碗'}};
  await upload(r,settings,async(url,opts)=>{
    const body=JSON.parse(opts.body);assert.equal(body.action,'update');
    assert.deepEqual(body.record.observations.hydration,{下午:'未達'});
    assert.equal(body.record.observations.nutrition.starch,'半碗');
    return {ok:true,json:async()=>({ok:true,id:r.id,updated:true})};
  });
  await assert.rejects(upload(r,settings,async()=>({ok:true,json:async()=>({ok:true,id:r.id})})));
});

test('editing sends structured observations, retains ID and requires explicit update acknowledgement', async () => {
  const r={...record(),action:'update',hydration:{下午:'達標'},nutrition:{starch:'半碗'}};
  await upload(r,settings,async(url,options)=>{
    const body=JSON.parse(options.body);
    assert.equal(body.action,'update');assert.equal(body.record.id,r.id);
    assert.equal(body.record.observations.hydration.下午,'達標');
    assert.equal(body.record.observations.nutrition.starch,'半碗');
    return {ok:true,json:async()=>({ok:true,id:r.id,updated:true})};
  });
  await assert.rejects(upload(r,settings,async()=>({ok:true,json:async()=>({ok:true,id:r.id})})));
  await assert.rejects(upload(r,settings,async()=>({ok:true,json:async()=>({ok:false,error:'NOT_FOUND'})})),/找不到原紀錄/);
});
