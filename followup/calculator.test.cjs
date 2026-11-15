const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function setup(){
  const elements={};
  function element(id){return elements[id]??={value:'',textContent:'',classList:{add(){},remove(){}},focus(){},scrollIntoView(){},addEventListener(){}};}
  const context={document:{getElementById:element},window:{}};
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
  return {api:context.window.followupCalculator,elements};
}
test('all interval options use seven-day weeks and 28-day months through the UI',()=>{
  const {api,elements}=setup();
  elements.startDate.value='2026-11-15';
  for(const [,code,label] of html.matchAll(/<option value="([wm]\d+)">([^<]+)<\/option>/g)){
    elements.interval.value=code;
    elements.interval.selectedIndex=0;
    elements.interval.options=[{text:label}];
    api.calculate();
    const days=Number(code.slice(1))*(code[0]==='w'?7:28);
    const expected=new Date(Date.UTC(2026,10,15+days));
    assert.equal(elements.resultDate.textContent,`${expected.getUTCFullYear()} 年 ${expected.getUTCMonth()+1} 月 ${expected.getUTCDate()} 日`);
  }
});
test('month-end, leap day, year boundary and date range',()=>{
  const {api}=setup();
  for(const [start,months,expected] of [
    ['2026-01-31',1,'2026-02-28'],
    ['2024-01-31',1,'2024-02-28'],
    ['2024-02-29',1,'2024-03-28'],
    ['2026-12-15',1,'2027-01-12'],
    ['2026-11-15',3,'2027-02-07'],
    ['2026-11-15',12,'2027-10-17'],
    ['0001-01-01',1,'1-01-29']
  ]) assert.equal(api.toIso(api.addMonths(api.parseIso(start),months)),expected);
  for(const value of ['', '2026-02-29','2024-02-30','2026-13-01','0000-01-01','hello']) assert.equal(api.parseIso(value),null);
  assert.ok(api.parseIso('2024-02-29'));
});
test('invalid or overflowing dates show an error',()=>{
  const {api,elements}=setup();
  elements.startDate.value='';
  api.calculate();
  assert.match(elements.error.textContent,/有效/);
  elements.startDate.value='9999-12-31';
  elements.interval.value='m1';
  elements.interval.options=[{text:'1 個月（28 天）'}];
  elements.interval.selectedIndex=0;
  api.calculate();
  assert.match(elements.error.textContent,/超出/);
});
