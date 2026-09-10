const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classify,validate,drugRule,assessDrug}=require('./rules');
const drugs=require('./formulary');
const base={age:30,sex:'M',hdl:50,ldl:160,tc:null,baseline:null,dialysis:'no',statinStatus:'none',ezDx:'primary',gem:'no',lifestyle:'yes'};
const v=x=>({...base,...x});
const assess=(id,x)=>{const a=v(x);return assessDrug(drugs.find(d=>d.id===id),a,classify(a));};
test('six tiers and exact boundaries',()=>{
 for(const [x,t] of [[{},160],[{htn:true},130],[{htn:true,smoke:true},115],[{dm:true},100],[{padClinical:true},70],[{cad:true,pad:true},55]]) assert.equal(classify(v(x)).goal,t);
 for(const [age,sex,hdl,n] of [[44,'M',40,0],[45,'M',40,1],[54,'F',50,0],[55,'F',50,1],[30,'M',39.9,1],[30,'F',49.9,1]]) assert.equal(classify(v({age,sex,hdl})).n,n);
 assert.equal(classify(v({ldl:190})).goal,100);assert.equal(classify(v({ldl:189.9})).goal,160);
 assert.equal(classify(v({baseline:210,ldl:90})).goal,100);
});
test('PAD / CAD combinations, MI and dialysis',()=>{
 assert.equal(classify(v({pad:true})).goal,160);
 assert.equal(classify(v({pad:true,carotid:true})).goal,55);
 assert.equal(classify(v({carotid:true})).goal,160);
 assert.equal(classify(v({padClinical:true})).goal,70);
 assert.equal(classify(v({mi1y:true})).goal,55);
 assert.equal(classify(v({acs:true,dm:true})).goal,55);
 assert.equal(classify(v({ckd:true})).goal,100);
 assert.equal(classify(v({ckd:true,dialysis:'yes'})).goal,160);
});
test('metabolic syndrome HDL auto-counts once',()=>{
 assert.equal(classify(v({hdl:39,metWaist:true,metBp:true})).met,true);
 assert.equal(classify(v({hdl:39,metWaist:true,metHdl:true})).met,false);
});
test('invalid, missing and inconsistent input',()=>{
 assert.equal(validate(base),'');
 for(const x of [{ldl:null},{ldl:-1},{ldl:Infinity},{age:45.5},{age:null},{hdl:null},{hdl:70,tc:60},{baseline:-1}]) assert.ok(validate(v(x)));
 assert.equal(validate(v({ldl:650})),'');
});
test('all 36 hospital identities are unique and exact-code exceptions',()=>{
 assert.equal(drugs.length,36);assert.equal(new Set(drugs.map(d=>d.id)).size,36);
 for(const id of ['07135','07159','07136','07113','07157','07167','07145','07084','07146']) assert.equal(drugRule(drugs.find(d=>d.id===id)),'table2');
 for(const id of ['07109','07114','07161','07171','07163','07142','07149']) assert.equal(drugRule(drugs.find(d=>d.id===id)),'table1');
 for(const id of ['07178','07165']) assert.equal(drugRule(drugs.find(d=>d.id===id)),'ez3');
 for(const id of ['07168','07169','07155']) assert.equal(drugRule(drugs.find(d=>d.id===id)),'combo3');
 for(const id of ['07162','07176']) assert.equal(drugRule(drugs.find(d=>d.id===id)),'combo6');
});
test('6–8 weeks vs three months, diagnosis, goal equality and contraindication',()=>{
 const x={dm:true,ldl:100,statinStatus:'6to8'};
 assert.equal(assess('07162',x).tone,'ok');
 assert.equal(assess('07168',x).tone,'warn');
 assert.equal(assess('07178',x).tone,'warn');
 assert.equal(assess('07168',{...x,statinStatus:'ge3m'}).tone,'ok');
 assert.equal(assess('07178',{...x,statinStatus:'ge3m'}).tone,'ok');
 assert.equal(assess('07162',{...x,ldl:99.9}).tone,'purple');
 assert.equal(assess('07162',{...x,gem:'yes'}).tone,'bad');
 assert.equal(assess('07162',{...x,ezDx:'sitosterol'}).tone,'warn');
 assert.equal(assess('07178',{...x,statinStatus:'intolerant'}).tone,'ok');
 assert.equal(assess('07162',{...x,statinStatus:'intolerant'}).tone,'warn');
 assert.equal(assess('07162',{...x,statinStatus:'other'}).tone,'warn');
});
test('never grants table two, unknown individual rules, intolerance or missing history',()=>{
 for(const id of ['07135','07175','07177','21227','07152']) assert.notEqual(assess(id,{dm:true}).tone,'ok');
 assert.notEqual(assess('07109',{dm:true,statinStatus:'intolerant'}).tone,'ok');
 assert.notEqual(assess('07162',{statinStatus:'ge3m'}).tone,'ok');
 assert.equal(assess('07109',{ldl:160}).tone,'ok');
 assert.equal(assess('07109',{ldl:159.9}).tone,'warn');
 assert.equal(assess('07109',{lifestyle:'no'}).tone,'warn');
});
