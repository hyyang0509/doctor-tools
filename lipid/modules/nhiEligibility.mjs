import {drugPolicy} from './drugPolicy.mjs';
import {treatmentStatus} from './treatmentStatus.mjs';
import {monotherapy,diagnoses} from '../config/nhi.mjs';
import {policyCopy} from '../config/copy.mjs';
import {riskParameters} from '../config/targets.mjs';
const policyText=(key,values=[])=>policyCopy[key].replace(/\{(\d+)\}/g,(_,i)=>values[i]);
function documentedTable1Entry(v,r){
 const observed=Math.max(r.ldl,v.baseline??-Infinity);
 if(observed<r.threshold) return false;
 if(r.high||r.veryHigh||r.extreme) return true;
 return v.lifestyle==='yes';
}
function assessDrug(d,v,r){
 const policy=drugPolicy(d), rule=policy.rule, treatment=treatmentStatus(v,r), result=(status,text,tone='warn',therapyStatus='')=>({status,text,tone,therapyStatus});
 const therapy=policyText('therapy', [treatment.atGoal?'✅ LDL 已達標':'⬆️ LDL 尚未達標', r.ldl, r.goal]);
 if(d.kind==='combo'&&v.gem==='yes') return result(policyText('comboContraindicated'),policyText('comboContraindicatedDetail'),'bad',therapy);
 if(rule==='table2') return result(policyText('table2'),policyText('table2Detail'),'warn',therapy);
 if(rule==='other') return result(policyText('unsupported'),policyText('unsupportedDetail'),'warn',therapy);
 if(rule==='table1'){
  if(treatment.intolerant) return result(policyText('intolerantStatin'),policyText('intolerantStatinDetail'),'warn',therapy);
  if(v.gem==='yes') return result(policyText('interaction'),policyText('interactionDetail'),'warn',therapy);
  if(treatment.ongoing){
   if(treatment.atGoal) return result(policyText('maintainStatin'),policyText('maintainStatinDetail'),'ok',therapy);
   return result(policyText('continueStatin'),policyText('continueStatinDetail'),'ok',therapy);
  }
  if(r.ldl<r.threshold) return result(policyText('belowEntry'),policyText('belowEntryDetail', [r.ldl, r.threshold]),'bad',therapy);
  if(!r.high&&!r.veryHigh&&!r.extreme&&v.lifestyle!=='yes') return result(policyText('lifestyleRequired'),policyText('lifestyleRequiredDetail'),'warn',therapy);
  return result(policyText('statinEntry'),policyText('statinEntryDetail'),'ok',therapy);
 }
 const combo=d.kind==='combo';
 if(!diagnoses[combo?'combo':'ez'].includes(v.ezDx)) return result(policyText('diagnosisRequired'),combo?policyText('comboDiagnosisDetail'):policyText('ezDiagnosisDetail'),'warn',therapy);
 if(!combo&&treatment.intolerant){
  if(documentedTable1Entry(v,r)) return result(policyText('ezIntolerance'),policyText('ezIntoleranceDetail'),'ok',therapy);
  return result(policyText('originalEntryRequired'),policyText('originalEntryRequiredDetail'),'warn',therapy);
 }
 if(treatment.ongoing&&v.mode!=='quick'&&v.baseline==null&&!r.high&&!r.veryHigh&&!r.extreme) return result(policyText('baselineRequired'),policyText('baselineRequiredDetail',[riskParameters.highLdl]),'warn',therapy);
 if(treatment.atGoal) return result(policyText('noNewTherapy'),policyText('noNewTherapyDetail'),'warn',therapy);
 const course=monotherapy[policy.minimumMonotherapy];
 if(!treatment.completeRecords) return result(policyText('recordsRequired'),policyText('recordsRequiredDetail'),'warn',therapy);
 const enough=treatment.monotherapyEligible[policy.minimumMonotherapy];
 if(!enough) return result(policyText('courseRequired'),policyText('courseRequiredDetail', [course.requirement]),'warn',therapy);
 return result(policyText('addonEligible'),policyText('addonEligibleDetail', [course.duration, r.goal]),'ok',therapy);
}
export {assessDrug,documentedTable1Entry};
