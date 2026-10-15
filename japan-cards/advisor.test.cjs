const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const source=html.match(/<script>([\s\S]*)<\/script>/)[1];
function app(saved){
 const elements=new Map();
 for(const m of html.matchAll(/<(input|select|div|p|button|tbody)[^>]*\bid="([^"]+)"[^>]*>/g)){
  const attrs=m[0],events={};let value=attrs.match(/\bvalue="([^"]*)"/)?.[1]||'';
  const el={checked:false,innerHTML:'',textContent:'',dataset:{},events,addEventListener:(name,fn)=>events[name]=fn,click(){this.onclick?.()},get value(){return value},set value(v){value=String(v)}};
  elements.set(m[2],el);
 }
 elements.get('merchant').value='general';
 let stored=saved?JSON.stringify(saved):null;
 const alerts=[];
 const ctx=vm.createContext({document:{getElementById:id=>{assert.ok(elements.has(id),id);return elements.get(id)}},localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v},alert:m=>alerts.push(m),confirm:()=>true,Date,Math,Blob,URL,setTimeout});
 vm.runInContext(source,ctx);
 return {run:s=>vm.runInContext(s,ctx),el:id=>elements.get(id),saved:()=>JSON.parse(stored),alerts};
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} ~= ${b}`);
test('all defaults, UP monthly spend budget, migration and persisted user overrides',()=>{
 const a=app();for(const k of ['uniLinked','jEligible','cubeEligible'])assert.equal(a.el(k).checked,true);
 assert.equal(a.el('yuPlan').value,'up');assert.equal(a.el('yuUpCap').value,'5000');assert.equal(a.el('yuUpSpendCap').value,'140000');
 const old={transactions:[{id:'keep',date:'2026-10-01',card:'uniopen',extra:80}],settings:{uniLinked:false,yuPlan:'none',yuUpCap:1000}};
 const b=app(old);assert.equal(b.run('data.transactions[0].id'),'keep');assert.equal(b.run('data.settings.yuPlan'),'up');
 b.el('jEligible').checked=false;b.el('saveSettings').click();const c=app(b.saved());assert.equal(c.el('jEligible').checked,false);
});
test('uniopen monthly 500-point cap, partial/exhausted rewards and month reset',()=>{
 const a=app();near(a.run('calc("uniopen",6250,"2026-10-16","general").extra'),500);
 a.run('data.transactions=[{date:"2026-10-01",card:"uniopen",extra:490}]');
 near(a.run('calc("uniopen",1000,"2026-10-16","general").extra'),10);
 a.run('data.transactions[0].extra=500');near(a.run('calc("uniopen",1000,"2026-10-16","general").rate'),.03);
 near(a.run('calc("uniopen",1000,"2026-11-16","general").rate'),.11);
});
test('J minimum NT1000, quarterly cap, registration reminder and fallback',()=>{
 const a=app();near(a.run('calc("j",999.99,"2026-10-16","general").extra'),0);
 near(a.run('calc("j",1000,"2026-10-16","general").extra'),30);
 assert.match(a.run('calc("j",1000,"2026-10-16","general").detail'),/10\/20 16:00/);
 a.run('data.transactions=[{date:"2026-10-01",card:"j",extra:990}]');
 near(a.run('calc("j",1000,"2026-11-16","general").extra'),10);
 a.run('data.transactions[0].extra=1000');near(a.run('calc("j",1000,"2026-12-16","general").rate'),.03);
 a.run('data.settings.jEligible=false');near(a.run('calc("j",1000,"2026-10-16","general").rate'),.03);
});
test('UP user budget and official cap both apply, base stays uncapped',()=>{
 const a=app();near(a.run('calc("unicard",140000,"2026-10-16","general").gross'),6300);
 near(a.run('calc("unicard",150000,"2026-10-16","general").extra'),4900);
 a.run('data.settings.yuUpSpendCap=200000');near(a.run('calc("unicard",200000,"2026-10-16","general").extra'),5000);
 a.run('data.transactions=[{date:"2026-10-01",card:"unicard",extra:5000}]');near(a.run('calc("unicard",1000,"2026-10-16","general").rate'),.01);
 near(a.run('calc("unicard",1000,"2026-11-16","general").rate'),.045);
});
test('merchant aliases, restricted branches, explicit selection and stale-match reset',()=>{
 const a=app();for(const q of ['uniqlo','優衣庫','ユニクロ','ABC MART','3coin','pokemon','Pokémon','三麗鷗','原宿'])assert.ok(a.run(`searchStores(${JSON.stringify(q)}).length`),q);
 assert.equal(a.run('searchStores("唐吉訶德").length'),0);assert.equal(a.run('searchStores("3coins")[0].branches.length'),15);
 assert.equal(a.run('searchStores("寶可夢")[0].branches.length'),5);
 a.el('store').value='UNIQLO';a.el('store').events.input();assert.equal(a.el('merchant').value,'general');
 a.run('selectStore({target:{closest:()=>({dataset:{store:"5",branch:"3"}})}})');assert.equal(a.el('merchant').value,'cube5');assert.match(a.el('store').value,/澀谷/);
 a.el('store').value='unknown';a.el('store').events.input();assert.equal(a.el('merchant').value,'general');assert.match(a.el('storeResults').innerHTML,/查無/);
 near(a.run('calc("cube",1000,"2026-11-30","cube5").rate'),.05);near(a.run('calc("cube",1000,"2026-12-01","cube5").rate'),.003);
});
test('invalid inputs/settings, ranking after caps, safe notes, record and reload',()=>{
 const a=app();a.el('date').value='2026-10-16';a.el('fx').value='1';a.el('jpy').value='1000';assert.equal(a.run('rank()[0].card'),'uniopen');
 a.run('data.transactions=[{date:"2026-10-01",card:"uniopen",extra:500},{date:"2026-10-01",card:"j",extra:1000}]');assert.equal(a.run('rank()[0].card'),'unicard');
 a.el('merchant').value='cube5';assert.equal(a.run('rank()[0].card'),'cube');
 a.el('store').value='<img src=x onerror=alert(1)>';a.run('record("cube")');assert.ok(!a.el('ledger').innerHTML.includes('<img'));assert.equal(a.el('jpy').value,'');assert.equal(a.run('rank().length'),0);
 assert.equal(app(a.saved()).run('data.transactions.length'),3);
 for(const value of ['0','-1','Infinity','NaN']){a.el('jpy').value=value;assert.equal(a.run('rank().length'),0)}
 assert.equal(a.run('validDate("2026-02-30")'),false);assert.equal(a.run('validDate("2024-02-29")'),true);
 a.el('yuUpSpendCap').value='-1';a.el('saveSettings').click();assert.equal(a.alerts.length,1);
});
test('v1 JSON import preserves ledger, upgrades defaults and exports v2',async()=>{
 const a=app();const backup={transactions:[{id:'imported',date:'2026-10-16',card:'uniopen',amount:1000,extra:80}],settings:{yuPlan:'none',uniLinked:false}};
 await a.el('importFile').onchange({target:{files:[{text:async()=>JSON.stringify(backup)}],value:'backup.json'}});
 assert.equal(a.run('data.transactions[0].id'),'imported');assert.equal(a.el('yuPlan').value,'up');assert.equal(a.saved().version,2);
});
