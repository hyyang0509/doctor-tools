import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classify,validate} from './modules/riskAssessment.mjs';
import {assessDrug} from './modules/nhiEligibility.mjs';
import drugs from './config/drugs.mjs';
// Frozen pre-refactor baseline; only reads these two tracked files, never changes checkout.
const baseline='b977f64e1466fcaabd93d06b0473caa8bdaff73f';
function loadOriginal(name){
 const code=execFileSync('git',['show',`${baseline}:lipid/${name}.js`],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
 const module={exports:{}};
 vm.runInThisContext(`(function(module,require){${code}\n})`)(module,()=>loadOriginal('drug-policy'));
 return module.exports;
}
const old=loadOriginal('rules');
test('pre-refactor parity: 17,780 patients and 640,080 drug assessments',()=>{
const base={age:30,sex:'M',hdl:50,ldl:160,tc:null,baseline:null,dialysis:'no',statinStatus:'none',ezDx:'primary',gem:'no',lifestyle:'yes',records:'yes'};
let patients=0, assessments=0;
for(const tier of ['extreme','veryHigh','high','moderate','low','none']) for(const ldl of [54.9,55,69.9,70,99.9,100,114.9,115,129.9,130,159.9,160,190]) for(const statinStatus of ['none','lt6','6to8','8to12','ge3m','other','intolerant']) for(const ezDx of ['none','primary','hofh','sitosterol']) for(const records of ['yes','no']) for(const gem of ['yes','no']) for(const lifestyle of ['yes','no']){
 const v={...base,mode:'quick',riskTier:tier,ldl,statinStatus,ezDx,records,gem,lifestyle};
 assert.deepEqual(validate(v),old.validate(v)); const a=classify(v),b=old.classify(v);assert.deepEqual(a,b);patients++;
 for(const d of drugs){assert.deepEqual(assessDrug(d,v,a),old.assessDrug(d,v,b),JSON.stringify({v,drug:d.id}));assessments++;}
}
for(const patch of [{},{cad:true},{revasc:true,pad:true},{dm:true},{ckd:true},{ckd:true,dialysis:'yes'},{htn:true},{htn:true,smoke:true},{hdl:39,metWaist:true,metBp:true},{sex:'F',age:55,hdl:49.9},{baseline:190}]) for(const ldl of [55,70,99.9,100,130,160,190]) for(const statinStatus of ['none','ge3m','other','intolerant']){
 const v={...base,...patch,ldl,statinStatus};const a=classify(v),b=old.classify(v);assert.deepEqual(a,b);patients++;
 for(const d of drugs){assert.deepEqual(assessDrug(d,v,a),old.assessDrug(d,v,b));assessments++;}
}
assert.equal(patients,17780); assert.equal(assessments,640080);
});
