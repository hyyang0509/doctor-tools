import test from 'node:test';
import assert from 'node:assert/strict';
import { feedbackRange, requestFeedback } from './feedback.mjs';
const settings = {endpoint:'https://script.google.com/macros/s/test-food/exec',key:'device-key'};
const analysis = {startDate:'2024-02-24',endDate:'2024-03-01',recordCount:3,recordedDays:2,text:'👍 持續記錄值得保持',generatedAt:'2024-03-01T10:00:00Z',cached:false};
const respond = body => async () => ({ok:true,json:async()=>body});
test('feedback dates include seven days across leap days, months and years',()=>{
  assert.equal(feedbackRange('week','2024-03-01').startDate,'2024-02-24');
  assert.equal(feedbackRange('week','2025-01-03').startDate,'2024-12-28');
  assert.equal(feedbackRange('day','2024-02-29').startDate,'2024-02-29');
  for (const [period,date] of [['month','2024-01-01'],['week','2023-02-29'],['day','9999-12-31'],['week','1900-01-01']]) assert.throws(()=>feedbackRange(period,date));
});
test('analysis sends only authenticated action and selected range; verifies matching complete response',async()=>{
  let sent;
  const actual=await requestFeedback('week','2024-03-01',settings,async(url,options)=>{
    assert.equal(url,settings.endpoint);assert.equal(options.headers['Content-Type'],'text/plain;charset=utf-8');
    assert.equal(options.credentials,'omit');sent=JSON.parse(options.body);
    return {ok:true,json:async()=>({ok:true,analysis})};
  });
  assert.deepEqual(sent,{action:'analyze',key:'device-key',period:'week',endDate:'2024-03-01'});
  assert.deepEqual(actual,analysis);
  for(const patch of [{startDate:'2024-02-23'},{recordCount:0},{recordedDays:8},{text:''},{cached:'false'},{generatedAt:'bad'}]) {
    await assert.rejects(requestFeedback('week','2024-03-01',settings,respond({ok:true,analysis:{...analysis,...patch}})),/完整回饋/);
  }
});
test('old receiver, missing AI key, empty data, quota, bad JSON and offline have useful errors',async()=>{
  for(const [code,hint] of [['INVALID_ACTION',/部署新版本/],['AI_NOT_CONFIGURED',/OPENAI_API_KEY/],['EMPTY_PERIOD',/還沒有/],['AI_DAILY_LIMIT',/10 次/],['AI_BUSY',/正在進行/],['AI_KEY_INVALID',/金鑰/],['AI_RESPONSE_INVALID',/完整回饋/]]) {
    await assert.rejects(requestFeedback('week','2024-03-01',settings,respond({ok:false,error:code})),hint);
  }
  await assert.rejects(requestFeedback('week','2024-03-01',{},respond({})),/試算表連線/);
  await assert.rejects(requestFeedback('week','2024-03-01',settings,async()=>{throw new TypeError('fetch');}),/連線中斷/);
  await assert.rejects(requestFeedback('week','2024-03-01',settings,async()=>({ok:true,json:async()=>{throw new Error();}})),/格式不正確/);
  await assert.rejects(requestFeedback('week','2024-03-01',settings,async(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(new Error(),{name:'AbortError'})))),5),/分析較久/);
});
