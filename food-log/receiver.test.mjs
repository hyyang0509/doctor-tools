import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('./google-apps-script/Code.gs',import.meta.url),'utf8');
const headers=['紀錄編號','日期','餐別','飲食內容','飲食標籤','工作內容','備註','建立時間（台灣）','寫入時間（台灣）'];
function receiver() {
  const rows=[headers.slice()]; let flushes=0, locked=false;
  const sheet={getLastRow:()=>rows.length,getRange:(row,col,count,width)=>({
    getDisplayValues:()=>[rows[row-1].slice(col-1,col-1+width)],
    setNumberFormat(){return this;},setValues(values){rows[row-1]=Array.from(values[0]);return this;},
    createTextFinder(id){return {matchEntireCell(){return this;},useRegularExpression(){return this;},findNext(){return rows.slice(1).some(r=>r[0]===id);}};}
  })};
  const context=vm.createContext({
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='FOOD_ACCESS_KEY'?'secret':'sheet-id'})},
    LockService:{getScriptLock:()=>({waitLock(){locked=true;},hasLock:()=>locked,releaseLock(){locked=false;}})},
    SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush(){flushes++;}},
    Utilities:{formatDate:(date)=>date.toISOString()},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})}
  });
  vm.runInContext(source,context);
  return {context,rows,post:(body)=>context.doPost({postData:{contents:JSON.stringify(body)}}),get flushes(){return flushes;},get locked(){return locked;}};
}
const record=()=>({id:'12345678-1234-4123-8123-123456789abc',date:'2026-10-20',meal:'早餐',content:'',tags:['水煮蛋','拿鐵'],work:'門診',notes:'',createdAt:'2026-10-19T23:00:00Z'});
const body=r=>({action:'append',key:'secret',record:r||record()});
test('receiver appends nine columns, flushes before ack, and deduplicates retries',()=>{
  const server=receiver();const r=record();
  assert.equal(server.post(body()).ok,true);assert.equal(server.rows.length,2);assert.equal(server.rows[1].length,9);
  assert.equal(server.rows[1][4],'水煮蛋、拿鐵');assert.equal(server.flushes,1);assert.equal(server.locked,false);
  const duplicate=server.post(body());assert.equal(duplicate.duplicate,true);assert.equal(duplicate.id,r.id);assert.equal(server.rows.length,2);
  r.id='22345678-1234-4123-8123-123456789abc';assert.equal(server.post(body(r)).ok,true);assert.equal(server.rows.length,3);
});
test('wrong key, malformed payload, invalid fields and header mismatch do not write',()=>{
  const server=receiver(); assert.equal(server.post({...body(),key:'wrong'}).error,'UNAUTHORIZED');
  for(const patch of [{date:'2026-02-30'},{meal:'宵夜'},{tags:['未知']},{tags:[],content:' '},{tags:['拿鐵','拿鐵']},{content:'x'.repeat(1001)},{createdAt:'invalid'},{id:'bad'}]) assert.equal(server.post(body({...record(),...patch})).ok,false);
  assert.equal(server.context.doPost({postData:{contents:'bad'}}).ok,false);
  server.rows[0][1]='被更名'; assert.equal(server.post(body()).ok,false);assert.equal(server.rows.length,1);assert.equal(server.locked,false);
});
test('formula-like free text is literal; public GET never returns records',()=>{
  const server=receiver(); const r={...record(),content:'=HYPERLINK("https://example.test")',work:' +1',notes:'@hello'};
  assert.equal(server.post(body(r)).ok,true);assert.ok(server.rows[1][3].startsWith("'="));assert.ok(server.rows[1][5].startsWith("'+"));assert.ok(server.rows[1][6].startsWith("'@"));
  assert.equal(server.context.doGet().service,'hy-food-log'); assert.equal(server.context.doGet().record,undefined);
});
