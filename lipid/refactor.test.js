const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classify,validate,assessDrug}=require('./rules');
const {drugPolicy}=require('./drug-policy');
const drugs=require('./formulary');
const base={mode:'detailed',age:30,sex:'M',hdl:50,ldl:80,dialysis:'no',statinStatus:'ge3m',ezDx:'primary',lifestyle:'yes',records:'yes'};
test('CAD and coronary revascularization imply very high risk and combine with PAD/carotid',()=>{
 for(const x of [{cad:true},{revasc:true}]) {
  assert.equal(classify({...base,...x}).goal,70);
  assert.equal(classify({...base,...x,pad:true}).goal,55);
  assert.equal(classify({...base,...x,carotid:true}).goal,55);
 }
});
test('measured HDL overrides contradictory checkbox and respects sex boundaries',()=>{
 assert.equal(classify({...base,metHdl:true,metWaist:true,metBp:true}).met,false);
 assert.equal(classify({...base,hdl:39.9,metWaist:true,metBp:true}).met,true);
 assert.equal(classify({...base,sex:'F',hdl:49.9,metWaist:true,metBp:true}).met,true);
 assert.equal(classify({...base,sex:'F',hdl:50,metWaist:true,metBp:true}).met,false);
});
test('quick mode uses only selected tier; detailed inputs never change it',()=>{
 for(const [riskTier,goal] of [['extreme',55],['veryHigh',70],['high',100],['moderate',115],['low',130],['none',160]]){
  const v={...base,mode:'quick',riskTier,age:null,hdl:null,cad:true,dm:true};
  assert.equal(validate(v),''); assert.equal(classify(v).goal,goal);
 }
 assert.ok(validate({...base,mode:'quick',riskTier:''}));
 assert.ok(validate({...base,mode:'quick',riskTier:'low',baseline:190}));
 assert.ok(validate({...base,mode:'detailed',age:null}));
});
test('exception target table remains table one for each tier and prior table-two statin',()=>{
 for(const id of ['07168','07169','07155','07178','07165']){
  const d=drugs.find(d=>d.id===id);
  assert.deepEqual(drugPolicy(d),{rule:d.kind==='ez'?'ez3':'combo3',table:1,targetTable:1,minimumMonotherapy:'3months'});
  for(const [riskTier,ldl] of [['extreme',55],['veryHigh',70],['high',100],['moderate',115],['low',130],['none',160]]){
   const v={...base,mode:'quick',riskTier,ldl,priorStatinCode:'AC55272100'};
   assert.equal(assessDrug(d,v,classify(v)).tone,'ok');
   assert.equal(assessDrug(d,{...v,statinStatus:'8to12'},classify(v)).tone,'warn');
   assert.equal(assessDrug(d,{...v,ldl:ldl-0.1},classify({...v,ldl:ldl-0.1})).tone,'purple');
  }
 }
 assert.equal(drugPolicy(drugs.find(d=>d.id==='07135')).table,2);
 assert.equal(drugPolicy(drugs.find(d=>d.id==='07162')).minimumMonotherapy,'6weeks');
});
test('add-on therapy requires complete records but intolerance keeps separate pathway',()=>{
 const v={...base,mode:'quick',riskTier:'veryHigh',records:'no'};
 for(const id of ['07168','07178','07162']){
  const d=drugs.find(d=>d.id===id);
  assert.equal(assessDrug(d,v,classify(v)).tone,'warn');
 }
 const d=drugs.find(d=>d.id==='07178');
 assert.equal(assessDrug(d,{...v,statinStatus:'intolerant'},classify(v)).tone,'ok');
});
