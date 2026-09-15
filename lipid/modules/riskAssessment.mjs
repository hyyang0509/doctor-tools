import {riskTiers,riskParameters,inputLimits} from '../config/targets.mjs';
function classify(v){
 if(v.mode==='quick'){
  const {risk,threshold,goal,nonHdl}=riskTiers[v.riskTier]||{};
  return {ldl:v.ldl,age:null,hdl:null,sex:null,dm:false,risk,threshold,goal,nonHdl,
   extreme:v.riskTier==='extreme',veryHigh:v.riskTier==='veryHigh',high:v.riskTier==='high',
   ageRF:false,lowHdl:false,met:false,rfList:[],n:null,source:'manual',
   basis:['醫師直接選擇風險分級（未執行詳細自動判定）']};
 }
  const num=id=>v[id]??null, checked=id=>!!v[id];
  const ldl=num('ldl'), age=num('age'), hdl=num('hdl'), sex=v.sex;
  const dm=checked('dm');
  const cad=checked('cad')||checked('mi1y')||checked('mi2')||checked('multivessel')||checked('acs')||checked('revasc');
  const pad=checked('pad')||checked('padClinical');
  const extreme = (cad && (checked('mi1y')||checked('mi2')||checked('multivessel')||(checked('acs')&&dm)||pad||checked('carotid'))) || (pad && (cad||checked('carotid')));
  const veryHigh = cad||checked('acs')||checked('mi1y')||checked('mi2')||checked('revasc')||checked('stroke')||checked('padClinical')||checked('plaque50');
  const high = dm || (checked('ckd') && v.dialysis==='no') || (ldl>=riskParameters.highLdl || v.baseline>=riskParameters.highLdl) || checked('cac400');
  const ageRF = age!==null && ((sex==='M'&&age>=riskParameters.age.M)||(sex==='F'&&age>=riskParameters.age.F));
  const lowHdl = hdl!==null && ((sex==='M'&&hdl<riskParameters.lowHdl.M)||(sex==='F'&&hdl<riskParameters.lowHdl.F));
  const met = ['metWaist','metBp','metGlu','metTg'].filter(checked).length + (lowHdl?1:0)>=riskParameters.metabolicCount;
  const rfList=[];
  if(checked('htn')) rfList.push('高血壓');
  if(ageRF) rfList.push(sex==='M'?`男性 ≥${riskParameters.age.M}歲`:`女性 ≥${riskParameters.age.F}歲`);
  if(checked('fhx')) rfList.push('早發性冠心病家族史');
  if(lowHdl) rfList.push('低 HDL-C');
  if(checked('smoke')) rfList.push('抽菸');
  if(met) rfList.push('代謝症候群');
  const n=rfList.length;
  let risk, threshold, goal, nonHdl, basis=[];
  if(extreme){({risk,threshold,goal,nonHdl}=riskTiers.extreme);basis.push('符合極高風險組合條件')}
  else if(veryHigh){({risk,threshold,goal,nonHdl}=riskTiers.veryHigh);basis.push('已符合臨床 ASCVD / 血管再通術 / 顯著斑塊等非常高風險條件')}
  else if(high){({risk,threshold,goal,nonHdl}=riskTiers.high);if(dm)basis.push('糖尿病');if(checked('ckd')&&v.dialysis==='no')basis.push('公告定義 CKD');if(ldl>=riskParameters.highLdl || v.baseline>=riskParameters.highLdl)basis.push(`LDL-C ≥${riskParameters.highLdl}`);if(checked('cac400'))basis.push('CAC ≥400')}
  else if(n>=2){({risk,threshold,goal,nonHdl}=riskTiers.moderate);basis.push(`${n} 項一般心血管風險因子`) }
  else if(n===1){({risk,threshold,goal,nonHdl}=riskTiers.low);basis.push('1 項一般心血管風險因子')}
  else {({risk,threshold,goal,nonHdl}=riskTiers.none);basis.push('未計入一般心血管風險因子')}
  return {ldl,age,hdl,sex,dm,extreme,veryHigh,high,ageRF,lowHdl,met,rfList,n,risk,threshold,goal,nonHdl,basis};
}

function validate(v){
 for(const [id,label,max] of inputLimits){
  if(v.mode==='quick'&&['age','hdl','tc'].includes(id)) continue;
  const n=v[id];
  if(n!==null && n!==undefined && (!Number.isFinite(n)||n<0||n>max||(id==='age'&&!Number.isInteger(n)))) return `請確認${label}，必須是 0–${max} 範圍內的有效${id==='age'?'整數':'數值'}。`;
 }
 if(v.ldl===null||v.ldl===undefined) return '請填寫目前 LDL-C。';
 if(v.mode==='quick'){
  if(!riskTiers[v.riskTier]) return '請選擇風險分級。';
  if(Math.max(v.ldl,v.baseline??0)>=riskParameters.highLdl&&['moderate','low','none'].includes(v.riskTier)) return `目前或治療前 LDL-C ≥${riskParameters.highLdl}，請至少選擇高風險。`;
  return '';
 }
 if(!['M','F'].includes(v.sex)) return '請確認性別。';
 if(v.age==null||v.hdl==null) return '請填寫年齡與 HDL-C，以免低估風險。';
 if(v.tc!==null&&v.tc!==undefined&&v.hdl>v.tc) return 'HDL-C 不可高於總膽固醇。';
 return '';
}
export {classify,validate};
