import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const source=readFileSync(new URL('./google-apps-script/Code.gs',import.meta.url),'utf8');
const headers=['紀錄編號','日期','餐別','飲食內容','飲食標籤','工作內容','備註','建立時間（台灣）','寫入時間（台灣）'];
const row=(date='2024-03-01',text='飯半碗、雞肉、青菜')=>['private-id',date,'午餐',text,'一般便當','private-work','吃得很趕','private-created','private-written'];
function server(options={}) {
  const props={FOOD_ACCESS_KEY:'secret',FOOD_SPREADSHEET_ID:'private-sheet',OPENAI_API_KEY:'provider-secret',...options.props};
  let locked=false, calls=0;
  const requests=[], logs=[], sheets={};
  function sheet(rows){return {rows,getLastRow:()=>rows.length,setFrozenRows(){},getRange:(r,c,n,w)=>({
    getValues:()=>rows.slice(r-1,r-1+n).map(x=>x.slice(c-1,c-1+w)),
    getDisplayValues:()=>rows.slice(r-1,r-1+n).map(x=>x.slice(c-1,c-1+w).map(v=>v instanceof Date?'2024/3/1':String(v))),
    setNumberFormat(){return this;},setValues(values){values.forEach((v,i)=>{rows[r-1+i]=Array.from(v);});return this;},
    createTextFinder(id){return {matchEntireCell(){return this;},useRegularExpression(){return this;},findNext:()=>rows.slice(1).some(r=>r[0]===id)};}
  })};}
  sheets['飲食紀錄']=sheet([headers.slice(),...(options.rows||[row()])]);
  const ss={getSheetByName:name=>sheets[name],insertSheet:name=>(sheets[name]=sheet([]))};
  const propertyStore={getProperty:k=>props[k]??null,setProperties:v=>Object.assign(props,v),deleteProperty:k=>delete props[k]};
  const context=vm.createContext({
    Date, Set, JSON, Object, Array, String, Number, isNaN,
    PropertiesService:{getScriptProperties:()=>propertyStore},
    LockService:{getScriptLock:()=>{let owned=false;return {
      tryLock(){if(locked)return false;locked=true;owned=true;return true;},
      waitLock(){if(locked)throw new Error('lock busy');locked=true;owned=true;},hasLock:()=>owned,
      releaseLock(){if(owned){locked=false;owned=false;}}
    };}},
    SpreadsheetApp:{openById:()=>ss,flush(){if(options.flushError)throw new Error('failure with private data');}},
    Utilities:{formatDate:(d,_tz,pattern)=>pattern==='yyyy-MM-dd'?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(d):d.toISOString(),
      getUuid:()=> 'reservation-id',DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},
      computeDigest:(_a,text)=>createHash('sha256').update(text).digest(),base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url')},
    UrlFetchApp:{fetch:(url,request)=>{
      calls++;assert.equal(locked,false,'API must not hold upload lock');requests.push({url,...request});
      options.onFetch?.(context);
      if(options.networkError)throw new Error('provider-secret');
      return {getResponseCode:()=>options.status||200,getContentText:()=>options.invalidJSON?'bad':JSON.stringify(options.response||{
        status:'completed',output:[{type:'reasoning'},{type:'message',role:'assistant',content:[{type:'output_text',text:'👍 值得保持\n有記錄蔬菜，值得保持。\n🎯 下一步\n明天午餐再加一份青菜。'}]}]
      })};
    }},
    console:{error:x=>logs.push(x),log:x=>logs.push(x)},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})}
  });
  vm.runInContext(source,context);
  return {context,props,sheets,requests,logs,get calls(){return calls;},get locked(){return locked;},
    post:(patch={})=>context.doPost({postData:{contents:JSON.stringify({action:'analyze',key:'secret',period:'week',endDate:'2024-03-01',...patch})}})};
}
test('authenticated analysis reads selected sheet rows only, minimizes data and saves reusable feedback',()=>{
  const s=server({rows:[row('2024-02-23'),row('2024-02-24'),row(),row('2024-03-02')]});
  const result=s.post();assert.equal(result.ok,true);assert.equal(result.analysis.recordCount,2);assert.equal(result.analysis.recordedDays,2);
  assert.equal(result.analysis.startDate,'2024-02-24');assert.equal(s.calls,1);assert.equal(s.locked,false);
  const request=s.requests[0];assert.equal(request.url,'https://api.openai.com/v1/responses');
  const payload=JSON.parse(request.payload);assert.equal(payload.store,false);assert.equal(payload.max_output_tokens,1800);
  assert.equal(payload.model,'gpt-4.1-mini');assert.equal(JSON.parse(payload.input).records.length,2);
  for(const text of ['private-id','private-work','private-sheet','provider-secret','private-created','private-written'])assert.ok(!request.payload.includes(text));
  assert.match(payload.instructions,/未記錄不等於沒吃/);assert.match(payload.instructions,/不可信的資料/);
  assert.equal(s.sheets['飲食回饋'].rows.length,2);
  const cached=s.post();assert.equal(cached.analysis.cached,true);assert.equal(cached.analysis.text,result.analysis.text);assert.equal(s.calls,1);
  s.sheets['飲食紀錄'].rows[2][3]='雞肉和兩份青菜';assert.equal(s.post().analysis.cached,false);assert.equal(s.calls,2);
  s.props.FOOD_AI_MODEL='custom-model';assert.equal(s.post().ok,true);assert.equal(s.calls,3);
});
test('same date single-day records and native date cells use Taiwan calendar days',()=>{
  const s=server({rows:[row(new Date('2024-02-29T16:10:00Z')),row('2024-02-29')]});
  const r=s.post({period:'day'});assert.equal(r.ok,true);assert.equal(r.analysis.recordCount,1);assert.equal(r.analysis.startDate,'2024-03-01');
});
test('authorization, no records, invalid ranges, missing key, too much data never call AI',()=>{
  const s=server();assert.equal(s.post({key:'wrong'}).error,'UNAUTHORIZED');assert.equal(s.calls,0);
  assert.equal(s.context.doGet().version,3);assert.equal(s.context.doGet().analysis,undefined);
  for(const patch of [{period:'bad'},{endDate:'2024-02-30'},{endDate:'9999-12-31'},{endDate:null}]) assert.equal(s.post(patch).error,'INVALID_PERIOD');
  assert.equal(server({rows:[]}).post().error,'EMPTY_PERIOD');
  const missing=server({props:{OPENAI_API_KEY:''}});assert.equal(missing.post().error,'AI_NOT_CONFIGURED');assert.equal(missing.calls,0);
  const big=server({rows:Array.from({length:101},()=>row())});assert.equal(big.post().error,'PERIOD_TOO_LARGE');assert.equal(big.calls,0);
  const mismatch=server();mismatch.sheets['飲食紀錄'].rows[0][0]='x';assert.equal(mismatch.post().error,'HEADER_MISMATCH');assert.equal(mismatch.calls,0);
});
test('quota, in-progress reservation, daily rollover and stale reservation recovery',()=>{
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const s=server({props:{FOOD_AI_USAGE_DATE:today,FOOD_AI_USAGE_COUNT:'9'}});
  assert.equal(s.post().ok,true);assert.equal(s.props.FOOD_AI_USAGE_COUNT,'10');
  assert.equal(s.post().analysis.cached,true);assert.equal(s.calls,1);
  s.sheets['飲食紀錄'].rows.push(row('2024-02-28'));assert.equal(s.post().error,'AI_DAILY_LIMIT');assert.equal(s.calls,1);
  const busy=server({props:{FOOD_AI_BUSY_UNTIL:String(Date.now()+300000)}});assert.equal(busy.post().error,'AI_BUSY');assert.equal(busy.calls,0);
  const expired=server({props:{FOOD_AI_BUSY_UNTIL:'1',FOOD_AI_USAGE_DATE:'2000-01-01',FOOD_AI_USAGE_COUNT:'10'}});assert.equal(expired.post().ok,true);assert.equal(expired.props.FOOD_AI_USAGE_COUNT,'1');
});
test('external AI call releases lock so a normal upload can succeed concurrently',()=>{
  const s=server({onFetch:context=>{
    const r={id:'12345678-1234-4123-8123-123456789abc',date:'2024-03-01',meal:'早餐',content:'蛋',tags:[],work:'',notes:'',createdAt:'2024-03-01T00:00:00Z'};
    const ack=context.doPost({postData:{contents:JSON.stringify({action:'append',key:'secret',record:r})}});assert.equal(ack.ok,true);
    // A second analyze sees the active reservation and does not call provider.
    const second=context.doPost({postData:{contents:JSON.stringify({action:'analyze',key:'secret',period:'day',endDate:'2024-03-01'})}});assert.equal(second.error,'AI_BUSY');
  }});
  assert.equal(s.post().ok,true);assert.equal(s.sheets['飲食紀錄'].rows.length,3);assert.equal(s.locked,false);
});
test('provider errors and truncated/refused responses fail safely, release reservation and never save partial feedback',()=>{
  for(const [opts,code] of [[{status:401},'AI_KEY_INVALID'],[{status:403},'AI_KEY_INVALID'],[{status:429},'AI_RATE_LIMIT'],[{status:404},'AI_MODEL_UNAVAILABLE'],[{status:500},'AI_UNAVAILABLE'],[{networkError:true},'AI_UNAVAILABLE'],[{invalidJSON:true},'AI_RESPONSE_INVALID'],[{response:{status:'incomplete',output:[]}},'AI_RESPONSE_INVALID'],[{response:{status:'completed',output:[{type:'message',role:'assistant',content:[{type:'refusal',refusal:'no'}]}]}},'AI_RESPONSE_INVALID'],[{flushError:true},'ANALYSIS_FAILED']]){
    const s=server(opts);const result=s.post();assert.equal(result.error,code);assert.equal(s.locked,false);assert.equal(s.props.FOOD_AI_RESERVATION,undefined);
    assert.ok(!JSON.stringify(result).includes('provider-secret'));assert.ok(!s.logs.join().includes('private'));
    if(!opts.flushError)assert.equal(s.sheets['飲食回饋'].rows.length,1);
  }
});
