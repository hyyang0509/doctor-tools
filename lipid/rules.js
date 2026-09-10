// 規則版本：115/9/1。依使用者附件 2.6.1–2.6.3；表二與其他個別規定不作給付判定。
// 前 6 頁：不適用表一、僅適用表二的特定品項
const table2Only = [
['simvastatin','AC46402100','Simvatin film coating tablets 20mg'],['simvastatin','AB47348100','Vatatin F.C. tablets 20mg STANDARD'],['simvastatin','BC24339100','Simvahexal film-coated tablets 40mg'],['simvastatin','AC49672100','Simatin F.C. tablets 20mg'],['simvastatin','AC49841100','Simpotin F.C. tablets 20mg Weidar'],['simvastatin','AC47924100','Zostatin F.C. tablets 20mg S.C.'],['simvastatin','BC23970100','Simvahexal film-coated tablets 20mg'],['simvastatin','AC49360100','Bezostatin F.C. tablets 40mg S.C.'],['simvastatin','AC48813100','Simvatenin F.C. tablets 20mg'],['simvastatin','AC56804100','Simvastatin F.C. tablets 20mg CYH'],['simvastatin','AC49699100','Simatin F.C. tablets 10mg'],['simvastatin','AC47907100','Sinty F.C. tablets 20mg'],['simvastatin','AC48926100','Simva F.C. tablets 20mg'],['simvastatin','AC49190100','Sivasin film coated tablets 40mg'],['simvastatin','AC58207100','Simvatin film coating tablets 40mg'],['simvastatin','AC48608100','Simva F.C. tablets 20mg Union'],['simvastatin','AC49997100','Simatin F.C. tablets 40mg'],['simvastatin','A055967100','Simva F.C. tablets 40mg Union'],['simvastatin','AC56806100','Sinty F.C. tablets 40mg'],
['lovastatin','AC39403100','Lozutin tablets 20mg'],['lovastatin','AC39307100','Delipic tablets 20mg Standard'],['lovastatin','A042389100','Lovatin tablets 20mg PANBIOTIC'],
['pravastatin','BC23596100','Mevalotin protect 40mg tablets'],['pravastatin','AC52581100','Joinlo tablets 40mg EVEREST'],['pravastatin','AB49454100','Pratin tablets 40mg'],['pravastatin','AB48586100','Pavatin protect tablets 20mg Standard'],['pravastatin','AB48681100','U-Chu Pavadin tablets 20mg'],['pravastatin','AB46029100','Pratin tablets 10mg'],['pravastatin','AB48644100','Mechol tablets 20mg Yung Shin'],['pravastatin','AB49021100','Pratin tablets 20mg'],['pravastatin','BC23597100','Mevalotin protect 20mg tablets'],['pravastatin','AC57126100','Pavatin protect tablets 40mg Standard'],['pravastatin','AC48469100','Mechol tablets 10mg Yung Shin'],['pravastatin','AC57741100','Joinlo tablet 20mg EVEREST'],
['fluvastatin','BC23556100','Lescol XL film-coated tablets 80mg'],['fluvastatin','BC26147100','Fluvastatin XL film-coated tablets 80mg'],['fluvastatin','AC56629100','Lecitol XL film-coated Tablets 80mg'],
['atorvastatin','AC55272100','Atorva film-coated tablets 10mg Standard'],['atorvastatin','BA25337100','Tulip 20mg film coated tablets'],['atorvastatin','BA25200100','Tulip 10mg film coated tablets'],['atorvastatin','AC48879100','Anxolipo F.C. tablet 10mg'],['atorvastatin','AC57267100','Atotin F.C. tablets 10mg'],['atorvastatin','AC51598100','Atoty F.C. tablets 10mg'],['atorvastatin','AC58211100','Atotin F.C. tablets 20mg'],['atorvastatin','AC49226100','Anxolightor F.C. tablets 20mg'],['atorvastatin','AC58517100','Atoroty F.C. tablets 20mg'],['atorvastatin','AC57805100','Atorva F.C. tab. 20mg Standard'],['atorvastatin','AA49543100','Atorin F.C. tablet 10mg'],['atorvastatin','BA25201100','Tulip 40mg film coated tablets'],['atorvastatin','AA57774100','Atover F.C. Tab. 10mg P.L.'],['atorvastatin','AC52530100','Atorin F.C. tablets 20mg'],['atorvastatin','AC55583100','Atorcal F.C. tablets 20mg S.C.'],['atorvastatin','AC55895100','Atorcal F.C. tablets 10mg S.C.'],['atorvastatin','AA57950100','Atover F.C. tablets 20mg P.L.'],['atorvastatin','AC55268100','Atorva film-coated tablets 40mg Standard'],['atorvastatin','AC55952100','Atoty F.C. tablets 20mg'],['atorvastatin','AA56739100','Anxolipo F.C. tablets 20mg'],['atorvastatin','AC55956100','Lipiminus F.C. tablets 20mg'],['atorvastatin','AB54967100','Atover F.C. tablets 40mg P.L.'],['atorvastatin','AA49288100','Anxolipo F.C. tablets 40mg'],['atorvastatin','AC56319100','Lipiminus F.C. tablets 10mg'],['atorvastatin','AC57133100','Atotin F.C. tablets 40mg'],['atorvastatin','AC52301100','Lipiminus F.C tablets 40mg'],['atorvastatin','AC57930100','Atova F.C. tablets 10mg Yu Sheng'],['atorvastatin','AC56682100','Atoroty F.C. tablets 10mg'],['atorvastatin','AC50086100','Atorcal F.C. tablets 40mg S.C.'],['atorvastatin','AB57967100','Atorstin film coated tablets 10mg'],['atorvastatin','AC58041100','Atoty F.C. tablets 40mg'],['atorvastatin','AB57772100','Atorstin film coated tablets 40mg'],['atorvastatin','AB58049100','Atorstin film coated tablets 20mg'],['atorvastatin','AB51732100','Atorin F.C. tablets 40mg'],['atorvastatin','AC58262100','Atoroty F.C. tablets 40mg'],
['rosuvastatin','AA57802100','Roty F.C. tablets 10mg'],['rosuvastatin','AA57843100','Roty F.C. tablets 5mg'],['rosuvastatin','BC24597100','Crestor 5mg film-coated tablets'],['rosuvastatin','AC57803100','Roty F.C. tablets 20mg'],['rosuvastatin','BC24129100','Crestor 20mg film-coated tablets'],['rosuvastatin','AB57940100','Rosulator F.C. tablets 10mg S.C.'],['rosuvastatin','BC26543100','Alvostat film coated tablets 10mg'],['rosuvastatin','AC59266100','Rostatin F.C. tablets 5mg Standard'],['rosuvastatin','AC58282100','Rostatin F.C. tablets 10mg Standard'],['rosuvastatin','AC58384100','Rosu F.C. tablets 10mg'],['rosuvastatin','AC57130100','Rotlip film-coated tablets 10mg'],['rosuvastatin','AC59652100','Rosulator F.C. tablets 5mg S.C.'],['rosuvastatin','AC57809100','Rolipostatin 10mg F.C. tablets Macro'],['rosuvastatin','BC26900100','Zyrova 20'],['rosuvastatin','BC27782100','Zyrova 5'],['rosuvastatin','AC58969100','Aladdin F.C. tablets 10mg'],['rosuvastatin','BC27781100','Zyrova 10'],['rosuvastatin','AC58067100','Rosutor film-coated tablets 10mg'],['rosuvastatin','BC26544100','Alvostat film coated tablets 20mg'],['rosuvastatin','AC60114100','Rosutor film-coated tablets 5mg'],['rosuvastatin','AC59649100','Rosulip F.C. tablets 5mg C.H.'],['rosuvastatin','AC58270100','Crosuty F.C. tablets 10mg'],['rosuvastatin','AC58622100','Rotlip film-coated tablets 5mg'],['rosuvastatin','AC58098100','Crosuty F.C. tablets 5mg'],['rosuvastatin','AC60197100','Rosutor film-coated tablets 20mg'],
['pitavastatin','BC25350100','Livalo tablets 2mg'],['pitavastatin','AA58648100','Pitarty F.C. tablets 2mg'],['pitavastatin','BC27002100','Livalo OD tablets 2mg'],['pitavastatin','AC58526100','Pitastatin F.C. tablets 2mg'],['pitavastatin','AC58633100','Pitarty F.C. tablets 4mg'],['pitavastatin','AC58525100','Pitastatin F.C. tablets 4mg'],['pitavastatin','AC59398100','Pivas F.C. tablets 2mg'],['pitavastatin','AC59192100','Pitanxo F.C. tablets 4mg'],['pitavastatin','AC60561100','EVEREST Huiton F.C. tablets 2mg'],['pitavastatin','AC61795100','Pistatin F.C. tablets 2mg'],['pitavastatin','AC58078100','Pitavol F.C. tablets 2mg'],['pitavastatin','AC60174100','Pitavastatin F.C. tablets 2mg CYH'],['pitavastatin','AC59193100','Pitanxo F.C. tablets 2mg'],['pitavastatin','AC60290100','Lavitol film coated tablets 4mg'],
['pravastatin+fenofibrate','BC26169100','Pravafen 40mg/160mg hard capsules'],['atorvastatin+amlodipine','BC24392100','Caduet 5mg/20mg tablet'],['atorvastatin+amlodipine','BC24391100','Caduet 5mg/10mg tablet'],['atorvastatin+amlodipine','AC59887100','Dualpress F.C. tablets 5mg/10mg'],['atorvastatin+amlodipine','AC60836100','Dualpress F.C. tablets 5mg/20mg']
];

const ez3mCodes = new Set(['AC60610100','BC27311100','BC28252100','BC26552100']);
const combo3mCodes = new Set(['AC59251100','AC60402100','BC28502100','AC62052100','AC62053100','AC62140100','AC62139100','BC28181100','BC28182100','BC28884100']);

function classify(v){
  const num=id=>v[id]??null, checked=id=>!!v[id];
  const ldl=num('ldl'), age=num('age'), hdl=num('hdl'), sex=v.sex;
  const dm=checked('dm');
  const cad=checked('cad')||checked('mi1y')||checked('mi2')||checked('multivessel')||checked('acs');
  const pad=checked('pad')||checked('padClinical');
  const extreme = (cad && (checked('mi1y')||checked('mi2')||checked('multivessel')||(checked('acs')&&dm)||pad||checked('carotid'))) || (pad && (cad||checked('carotid')));
  const veryHigh = checked('acs')||checked('mi1y')||checked('mi2')||checked('revasc')||checked('stroke')||checked('padClinical')||checked('plaque50');
  const high = dm || (checked('ckd') && v.dialysis==='no') || (ldl>=190 || v.baseline>=190) || checked('cac400');
  const ageRF = age!==null && ((sex==='M'&&age>=45)||(sex==='F'&&age>=55));
  const lowHdl = hdl!==null && ((sex==='M'&&hdl<40)||(sex==='F'&&hdl<50));
  const met = ['metWaist','metBp','metGlu','metTg'].filter(checked).length + ((checked('metHdl') || lowHdl)?1:0)>=3;
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
  const n=v[id];
  if(n!==null && n!==undefined && (!Number.isFinite(n)||n<0||n>max||(id==='age'&&!Number.isInteger(n)))) return `請確認${label}，必須是 0–${max} 範圍內的有效${id==='age'?'整數':'數值'}。`;
 }
 if(v.ldl===null||v.ldl===undefined) return '請填寫目前 LDL-C。';
 if(v.age==null||v.hdl==null) return '請填寫年齡與 HDL-C，以免低估風險。';
 if(v.tc!==null&&v.tc!==undefined&&v.hdl>v.tc) return 'HDL-C 不可高於總膽固醇。';
 return '';
}
function drugRule(d){
 if(table2Only.some(x=>x[1]===d.code)) return 'table2';
 if(d.kind==='ez') return ez3mCodes.has(d.code)?'ez3':'ez6';
 if(d.kind==='combo') return combo3mCodes.has(d.code)?'combo3':'combo6';
 if(d.kind==='statin'&&/^[A-Z]{1,2}[0-9]{8,9}$/.test(d.code)) return 'table1';
 return 'other';
}
const ruleLabels={table2:'表二｜需另核對',table1:'表一',ez3:'2.6.2｜3 個月例外',ez6:'2.6.2｜6–8 週',combo3:'2.6.3｜3 個月例外',combo6:'2.6.3｜6–8 週',other:'另有規定｜待確認'};
function assessDrug(d,v,r){
 const rule=drugRule(d), result=(status,text,tone='warn')=>({status,text,tone});
 if(d.kind==='combo'&&v.gem==='yes') return result('不得併用','含 ezetimibe + statin 複方不得與 gemfibrozil 併用（2.6.3）。','bad');
 if(rule==='table2') return result('須核對表二','此健保碼僅適用表二；附件省略表二全文，不能用表一門檻認定給付。');
 if(rule==='other') return result('待確認個別規定','已納入院內清單；本附件不足以判定此品項的個別給付、適應症或申請條件。截圖短碼及 X 不視為完整健保碼。');
 if(rule==='table1'){
  if(v.statinStatus==='intolerant') return result('需評估耐受性','已勾選 statin 無法耐受，不能直接視為可開始 statin。');
  if(v.gem==='yes') return result('先核對交互作用','目前使用 gemfibrozil，請先核對此 statin 的仿單與交互作用。');
  if(v.statinStatus!=='none') return result(r.ldl<r.goal?'已達表一目標':'尚未達表一目標','目前為治療中數值；續用、調整與原始給付資格需核對用藥史，不重新判定起始資格。','purple');
  if(r.ldl<r.threshold) return result('未達起始門檻',`表一起始 LDL-C ≥${r.threshold} mg/dL。`);
  if(!r.high&&!r.veryHigh&&!r.extreme&&v.lifestyle!=='yes') return result('先生活型態治療','須先完成 3–6 個月生活型態改變仍未達標。');
  return result('符合表一起始條件','依輸入條件符合表一門檻；仍須確認個別適應症、劑量、禁忌與交互作用。','ok');
 }
 const combo=d.kind==='combo';
 if(!(combo?['primary','hofh']:['primary','hofh','sitosterol']).includes(v.ezDx)) return result('診斷條件未確認','請確認 2.6.2 / 2.6.3 限定診斷。');
 if(!combo&&v.statinStatus==='intolerant') return result('符合不耐受條件','2.6.2：statin 無法耐受不良反應途徑；不要求先完成 3 個月。','ok');
 if(v.statinStatus!=='none'&&v.baseline==null&&!r.high&&!r.veryHigh&&!r.extreme) return result('需補治療前 LDL-C','目前未達高風險以上，請補治療前 LDL-C，以確認是否曾 ≥190 mg/dL 再判斷目標。');
 if(r.ldl<r.goal) return result('目前已達表一目標','不能以目前數值認定新增／換用條件；若已在使用本藥，續方須回看原始治療紀錄。','purple');
 const three=rule.endsWith('3');
 const enough=three?v.statinStatus==='ge3m':['6to8','8to12','ge3m'].includes(v.statinStatus);
 if(!enough) return result('單方療程尚不足',`此品項需 statin 單一治療${three?'滿 3 個月':'6–8 週'}仍未達標；複方治療時間不能當成單方。`);
 return result('符合所列加藥條件',`診斷、statin 單方${three?'3 個月':'6–8 週'}及未達表一目標條件符合；請核對原始紀錄與個別用藥適切性。`,'ok');
}
if(typeof module!=='undefined') module.exports={classify,validate,drugRule,assessDrug,table2Only,ez3mCodes,combo3mCodes};
