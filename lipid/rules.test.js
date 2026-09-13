const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classify,validate,drugRule,assessDrug}=require('./rules');
const drugs=require('./formulary');
const base={age:30,sex:'M',hdl:50,ldl:160,tc:null,baseline:null,dialysis:'no',statinStatus:'none',ezDx:'primary',gem:'no',lifestyle:'yes',originalEligible:'yes'};
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
test('unknown individual rules, intolerance and missing history remain distinguishable',()=>{
 for(const id of ['07175','07177','21227','07152']) assert.notEqual(assess(id,{dm:true}).tone,'ok');
 assert.notEqual(assess('07109',{dm:true,statinStatus:'intolerant'}).tone,'ok');
 assert.notEqual(assess('07162',{statinStatus:'ge3m'}).tone,'ok');
 assert.equal(assess('07109',{ldl:160}).tone,'ok');
 assert.equal(assess('07109',{ldl:159.9}).tone,'warn');
 assert.equal(assess('07109',{lifestyle:'no'}).tone,'warn');
});

const {riskFor,classifyLegacy,compareDrugs}=require('./rules');
test('quick mode requires deliberate risk selection and rejects underestimated severe LDL',()=>{
 assert.equal(validate(v({mode:'quick',quickRisk:'70',age:null,hdl:null})), '');
 for(const x of [{quickRisk:''},{quickRisk:'115',ldl:190},{quickRisk:'160',baseline:190},{purpose:'adjust',currentDrug:''}]) assert.ok(validate(v({mode:'quick',quickRisk:'70',...x})));
 for(const goal of [55,70,100,115,130,160]) assert.equal(riskFor(v({mode:'quick',quickRisk:String(goal)})).goal,goal);
});
test('PCI implies CAD for PAD combination; normal HDL overrides contradictory checkbox',()=>{
 assert.equal(classify(v({revasc:true,pad:true})).goal,55);
 assert.equal(classify(v({hdl:55,metHdl:true,metWaist:true,metBp:true})).met,false);
});
test('Linicor uses table one; unknown codes are not inferred eligible',()=>{
 assert.equal(drugRule(drugs.find(d=>d.id==='07137')),'table1');
 assert.equal(drugRule({kind:'statin',code:'AC99999100'}),'other');
});
test('table two preserves ACS, menopause, HDL threshold and no metabolic factor',()=>{
 assert.equal(classifyLegacy(v({acs:true})).ldl,70);
 assert.equal(classifyLegacy(v({dm:true})).tc,160);
 assert.equal(classifyLegacy(v({age:40,sex:'F',menopause:true,hdl:45})).key,'one');
 assert.equal(classifyLegacy(v({age:40,sex:'F',hdl:45,metWaist:true,metBp:true,metTg:true})).key,'zero');
 assert.equal(classifyLegacy(v({mode:'quick'})),null);
});
test('table two LDL/TC boundaries and smoking dependent eligibility',()=>{
 const x={purpose:'start',mode:'quick',legacyGroup:'two',legacySmoking:'no',ldl:120};
 assert.equal(assess('07135',{...x,tc:200}).tone,'ok');
 assert.notEqual(assess('07135',{...x,tc:199.9}).tone,'ok');
 assert.notEqual(assess('07135',{...x,tc:null}).tone,'ok');
 assert.equal(assess('07135',{...x,tc:200,legacySmoking:'yes'}).tone,'bad');
 assert.equal(assess('07135',{age:45,smoke:true,ldl:130}).tone,'bad');
 assert.equal(assess('07135',{age:45,smoke:true,ldl:160}).tone,'ok');
 assert.equal(assess('07135',{age:30,ldl:190}).tone,'ok');
 assert.notEqual(assess('07135',{age:30,ldl:189.9}).tone,'ok');
 assert.equal(assess('07135',{acs:true,ldl:70}).tone,'ok');
 assert.notEqual(assess('07135',{acs:true,ldl:69.9}).tone,'ok');
});
test('three month exceptions follow table one regardless of prior table two statin',()=>{
 const x={purpose:'adjust',currentDrug:'07157',mi1y:true,ldl:62,statinStatus:'ge3m'};
 assert.equal(assess('07168',x).tone,'ok');
 assert.equal(assess('07178',x).tone,'ok');
 assert.notEqual(assess('07168',{...x,statinStatus:'8to12'}).tone,'ok');
 assert.equal(assess('07168',{...x,originalEligible:'no'}).tone,'ok');
});
test('continuation does not rerun initiation; amended ez rules do not add old eligibility gate',()=>{
 assert.equal(assess('07168',{purpose:'continue',currentDrug:'07168',mi1y:true,ldl:40}).tone,'purple');
 assert.notEqual(assess('07168',{purpose:'continue',currentDrug:'07109'}).tone,'ok');
 assert.equal(assess('07178',{dm:true,statinStatus:'intolerant',originalEligible:'no'}).tone,'ok');
});
test('same dose warning and all statin metadata',()=>{
 const find=id=>drugs.find(d=>d.id===id);
 assert.match(compareDrugs(find('07135'),find('07109')),/換品牌不等於/);
 assert.match(compareDrugs(find('07146'),find('07168')),/另外加入 ezetimibe/);
 for(const d of drugs.filter(d=>['statin','mixed','combo'].includes(d.kind))) assert.ok(d.statin);
});

test('combined-treatment LDL cannot stand in for statin-only response',()=>{
 const x={purpose:'adjust',dm:true,currentDrug:'07168',currentCombined:true,statinStatus:'ge3m',ldl:110};
 assert.notEqual(assess('07162',x).tone,'ok');
 assert.notEqual(assess('07162',{...x,monoLdl:90}).tone,'ok');
 assert.equal(assess('07162',{...x,monoLdl:110}).tone,'ok');
 assert.ok(validate(v({monoLdl:-1})));
});
