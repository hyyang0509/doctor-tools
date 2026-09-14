// 115/9/1；例外加藥採表一目標，僅療程維持 3 個月（使用者確認解讀）。
(function(){
const {drugRule,drugPolicy,table2Only,ez3mCodes,combo3mCodes}=typeof module!=='undefined'?require('./drug-policy'):window.LipidDrugPolicy;
const riskTiers={extreme:['極高風險',55,85],veryHigh:['非常高風險',70,100],high:['高風險',100,130],moderate:['中風險',115,145],low:['低風險',130,160],none:['0 項心血管風險因子',160,null]};
function classify(v){
 if(v.mode==='quick'){
  const [risk,goal,nonHdl]=riskTiers[v.riskTier]||[];
  return {ldl:v.ldl,age:null,hdl:null,sex:null,dm:false,risk,threshold:goal,goal,nonHdl,
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
  const high = dm || (checked('ckd') && v.dialysis==='no') || (ldl>=190 || v.baseline>=190) || checked('cac400');
  const ageRF = age!==null && ((sex==='M'&&age>=45)||(sex==='F'&&age>=55));
  const lowHdl = hdl!==null && ((sex==='M'&&hdl<40)||(sex==='F'&&hdl<50));
  const met = ['metWaist','metBp','metGlu','metTg'].filter(checked).length + (lowHdl?1:0)>=3;
  const rfList=[];
  if(checked('htn')) rfList.push('高血壓');
  if(ageRF) rfList.push(sex==='M'?'男性 ≥45歲':'女性 ≥55歲');
  if(checked('fhx')) rfList.push('早發性冠心病家族史');
  if(lowHdl) rfList.push('低 HDL-C');
  if(checked('smoke')) rfList.push('抽菸');
  if(met) rfList.push('代謝症候群');
  const n=rfList.length;
  let risk, threshold, goal, nonHdl, basis=[];
  if(extreme){risk='極高風險';threshold=55;goal=55;nonHdl=85;basis.push('符合極高風險組合條件')}
  else if(veryHigh){risk='非常高風險';threshold=70;goal=70;nonHdl=100;basis.push('已符合臨床 ASCVD / 血管再通術 / 顯著斑塊等非常高風險條件')}
  else if(high){risk='高風險';threshold=100;goal=100;nonHdl=130;if(dm)basis.push('糖尿病');if(checked('ckd')&&v.dialysis==='no')basis.push('公告定義 CKD');if(ldl>=190 || v.baseline>=190)basis.push('LDL-C ≥190');if(checked('cac400'))basis.push('CAC ≥400')}
  else if(n>=2){risk='中風險';threshold=115;goal=115;nonHdl=145;basis.push(`${n} 項一般心血管風險因子`) }
  else if(n===1){risk='低風險';threshold=130;goal=130;nonHdl=160;basis.push('1 項一般心血管風險因子')}
  else {risk='0 項心血管風險因子';threshold=160;goal=160;nonHdl=null;basis.push('未計入一般心血管風險因子')}
  return {ldl,age,hdl,sex,dm,extreme,veryHigh,high,ageRF,lowHdl,met,rfList,n,risk,threshold,goal,nonHdl,basis};
}

function validate(v){
 for(const [id,label,max] of [['age','年齡',120],['ldl','LDL-C',2000],['hdl','HDL-C',500],['tc','總膽固醇',3000],['baseline','治療前 LDL-C',2000]]){
  if(v.mode==='quick'&&['age','hdl','tc'].includes(id)) continue;
  const n=v[id];
  if(n!==null && n!==undefined && (!Number.isFinite(n)||n<0||n>max||(id==='age'&&!Number.isInteger(n)))) return `請確認${label}，必須是 0–${max} 範圍內的有效${id==='age'?'整數':'數值'}。`;
 }
 if(v.ldl===null||v.ldl===undefined) return '請填寫目前 LDL-C。';
 if(v.mode==='quick'){
  if(!riskTiers[v.riskTier]) return '請選擇風險分級。';
  if(Math.max(v.ldl,v.baseline??0)>=190&&['moderate','low','none'].includes(v.riskTier)) return '目前或治療前 LDL-C ≥190，請至少選擇高風險。';
  return '';
 }
 if(!['M','F'].includes(v.sex)) return '請確認性別。';
 if(v.age==null||v.hdl==null) return '請填寫年齡與 HDL-C，以免低估風險。';
 if(v.tc!==null&&v.tc!==undefined&&v.hdl>v.tc) return 'HDL-C 不可高於總膽固醇。';
 return '';
}
const ruleLabels={table2:'另一套給付規定（表二）',table1:'適用上方門檻（表一）',ez3:'單方加藥｜statin 須滿 3 個月',ez6:'單方加藥｜statin 須用 6–8 週',combo3:'複方｜statin 須滿 3 個月',combo6:'複方｜statin 須用 6–8 週',other:'另有規定｜待確認'};
function documentedTable1Entry(v,r){
 const observed=Math.max(r.ldl,v.baseline??-Infinity);
 if(observed<r.threshold) return false;
 if(r.high||r.veryHigh||r.extreme) return true;
 return v.lifestyle==='yes';
}
function assessDrug(d,v,r){
 const rule=drugRule(d), result=(status,text,tone='warn',therapyStatus='')=>({status,text,tone,therapyStatus});
 const therapy=`${r.ldl<r.goal?'✅ LDL 已達標':'⬆️ LDL 尚未達標'}：目前 ${r.ldl} mg/dL，目標 <${r.goal} mg/dL`;
 if(d.kind==='combo'&&v.gem==='yes') return result('不可併用','含 ezetimibe + statin 複方不得與 gemfibrozil 併用（2.6.3）。','bad',therapy);
 if(rule==='table2') return result('本工具未判定：適用表二','此品項適用另一套給付規定（表二），不能套用上方表一 LDL 門檻；請另查健保署表二規定。','warn',therapy);
 if(rule==='other') return result('本工具未涵蓋此藥給付規定','已納入院內清單，但目前資料不足以判定此品項的個別給付、適應症或申請條件。截圖短碼及 X 不視為完整健保碼。','warn',therapy);
 if(rule==='table1'){
  if(v.statinStatus==='intolerant') return result('需評估 statin 耐受性','已勾選 statin 無法耐受；請依不良反應與替代治療路徑評估，不直接視為可開始此 statin。','warn',therapy);
  if(v.gem==='yes') return result('先核對交互作用','目前使用 gemfibrozil，請先核對此 statin 的仿單與交互作用。','warn',therapy);
  if(v.statinStatus!=='none'){
   if(r.ldl<r.goal) return result('可維持既有 statin 治療','目前 LDL 已達標；達標本身不是停用 statin 的理由，請依臨床狀況維持適當強度。','ok',therapy);
   return result('可持續既有 statin 治療','目前 LDL 尚未達標；可續用 statin，並依臨床需要考慮調高強度或在符合條件時加用其他降脂治療。','ok',therapy);
  }
  if(r.ldl<r.threshold) return result('目前不符合健保新開 statin 條件',`目前 LDL-C ${r.ldl} mg/dL；此風險層級的起始治療門檻為 ≥${r.threshold} mg/dL。`,'bad',therapy);
  if(!r.high&&!r.veryHigh&&!r.extreme&&v.lifestyle!=='yes') return result('需先完成生活型態治療','此風險層級須先完成 3–6 個月生活型態改變，若仍未達標再評估開始 statin。','warn',therapy);
  return result('符合健保 statin 起始條件','依輸入條件符合表一起始治療門檻；仍須確認個別適應症、劑量、禁忌與交互作用。','ok',therapy);
 }
 const combo=d.kind==='combo';
 if(!(combo?['primary','hofh']:['primary','hofh','sitosterol']).includes(v.ezDx)) return result('缺少符合的診斷條件',combo?'請在「診斷類型」選擇原發性高膽固醇血症或同型接合子家族性高膽固醇血症；若不屬於這兩類，不能依本項判定給付。':'請在「診斷類型」選擇原發性高膽固醇血症、同型接合子家族性高膽固醇血症或同型接合子植物脂醇血症；若不屬於這三類，不能依本項判定給付。','warn',therapy);
 if(!combo&&v.statinStatus==='intolerant'){
  if(documentedTable1Entry(v,r)) return result('符合 ezetimibe 不耐受途徑給付條件','已符合降血脂藥物表一給付條件，且有 statin 無法耐受紀錄；可依 ezetimibe 單方的不耐受途徑判斷，此途徑不要求先完成 3 個月療程。','ok',therapy);
  return result('需確認原始降血脂給付資格','已符合 statin 無法耐受情境，但目前輸入不足以確認原先符合降血脂藥物給付規定；請核對治療前 LDL-C、風險分級及必要的生活型態治療紀錄。','warn',therapy);
 }
 if(v.statinStatus!=='none'&&v.mode!=='quick'&&v.baseline==null&&!r.high&&!r.veryHigh&&!r.extreme) return result('需補治療前 LDL-C','目前未達高風險以上，請補治療前 LDL-C，以確認是否曾 ≥190 mg/dL 並避免低估風險。','warn',therapy);
 if(r.ldl<r.goal) return result('目前無新增／換用條件','LDL 已達治療目標；若尚未使用本藥，目前不符合「statin 治療後仍未達標」的加藥／換藥條件。若本藥已是既有療程，達標本身不是停藥理由。','warn',therapy);
 const three=rule.endsWith('3');
 if(v.records!=='yes') return result('缺少完整療程／抽血紀錄','請確認有完整 statin 單藥用藥時間與療程後抽血紀錄；先前表一或表二品項皆可採計。','warn',therapy);
 const enough=three?v.statinStatus==='ge3m':['6to8','8to12','ge3m'].includes(v.statinStatus);
 if(!enough) return result('statin 單方療程尚未符合',`此品項需 statin 單一治療${three?'滿 3 個月':'6–8 週'}仍未達標；複方治療時間不能當成單方。`,'warn',therapy);
 return result('符合健保加藥／換藥條件',`診斷、statin 單方${three?'3 個月':'6–8 週'}及 LDL 尚未降至治療目標的條件符合；採表一 LDL 目標 <${r.goal} mg/dL；先前表一或表二 statin 單藥療程均可採計，須有完整用藥與抽血紀錄。請核對個別用藥適切性。`,'ok',therapy);
}
if(typeof module!=='undefined') module.exports={classify,validate,drugRule,assessDrug,documentedTable1Entry,table2Only,ez3mCodes,combo3mCodes};
else Object.assign(window,{classify,validate,assessDrug,ruleLabels});
})();
