// 規則版本：115/9/1。依使用者附件 2.6.1–2.6.3；表二獨立判讀；其他個別規定不作給付判定。
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
  const cad=checked('cad')||checked('mi1y')||checked('mi2')||checked('multivessel')||checked('acs')||checked('revasc');
  const pad=checked('pad')||checked('padClinical');
  const extreme = (cad && (checked('mi1y')||checked('mi2')||checked('multivessel')||(checked('acs')&&dm)||pad||checked('carotid'))) || (pad && (cad||checked('carotid')));
  const veryHigh = checked('acs')||checked('mi1y')||checked('mi2')||checked('revasc')||checked('stroke')||checked('padClinical')||checked('plaque50');
  const high = dm || (checked('ckd') && v.dialysis==='no') || (ldl>=190 || v.baseline>=190) || checked('cac400');
  const ageRF = age!==null && ((sex==='M'&&age>=45)||(sex==='F'&&age>=55));
  const lowHdl = hdl!==null && ((sex==='M'&&hdl<40)||(sex==='F'&&hdl<50));
  const met = ['metWaist','metBp','metGlu','metTg'].filter(checked).length + ((hdl===null?checked('metHdl'):lowHdl)?1:0)>=3;
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
 for(const [id,label,max] of [['age','年齡',120],['ldl','LDL-C',2000],['hdl','HDL-C',500],['tc','總膽固醇',3000],['baseline','治療前 LDL-C',2000],['monoLdl','statin 單藥後 LDL-C',2000]]){
  const n=v[id];
  if(n!==null && n!==undefined && (!Number.isFinite(n)||n<0||n>max||(id==='age'&&!Number.isInteger(n)))) return `請確認${label}，必須是 0–${max} 範圍內的有效${id==='age'?'整數':'數值'}。`;
 }
 if(v.ldl===null||v.ldl===undefined) return '請填寫目前 LDL-C。';
 if(v.mode!=='quick'&&(v.age==null||v.hdl==null)) return '請填寫年齡與 HDL-C，以免低估風險。';
 if(v.tc!==null&&v.tc!==undefined&&v.hdl>v.tc) return 'HDL-C 不可高於總膽固醇。';
 if(v.mode!=='quick'&&!['M','F'].includes(v.sex)) return '請確認性別。';
 if(v.mode==='quick'&&!riskLevels[v.quickRisk]) return '請選擇已確認的風險層級，或使用自動分級。';
 if(v.mode==='quick'&&Number(v.quickRisk)>100&&(v.ldl>=190||v.baseline>=190)) return '目前或治療前 LDL-C ≥190，至少屬高風險，請調整風險層級。';
 if(v.purpose&&v.purpose!=='start'&&!v.currentDrug) return '請選擇目前藥品；院外藥可選其他／未收錄。';
 return '';
}
function drugRule(d){
 if(!d) return 'other';
 if(table2Only.some(x=>x[1]===d.code)) return 'table2';
 if(d.kind==='ez') return ez3mCodes.has(d.code)?'ez3':'ez6';
 if(d.kind==='combo') return combo3mCodes.has(d.code)?'combo3':'combo6';
 if(['BC22886100','BC22889100','AC58813100','AC58822100','AB49143100','AA57372100','AC58639100','AC57216100'].includes(d.code)) return 'table1';
 return 'other';
}
const ruleLabels={table2:'表二｜舊制門檻',table1:'表一｜新制門檻',ez3:'單方加藥｜statin 須滿 3 個月',ez6:'單方加藥｜statin 須用 6–8 週',combo3:'複方｜statin 須滿 3 個月',combo6:'複方｜statin 須用 6–8 週',other:'另有規定｜待確認'};

const riskLevels={55:'極高風險',70:'非常高風險',100:'高風險',115:'中風險',130:'低風險',160:'0 項風險因子'};
function riskFor(v){
 if(v.mode!=='quick') return classify(v);
 const goal=Number(v.quickRisk);
 return {ldl:v.ldl,goal,threshold:goal,nonHdl:goal===160?null:goal+30,risk:riskLevels[goal],high:goal===100,veryHigh:goal===70,extreme:goal===55,rfList:[],basis:['醫師手動確認最高風險層級'],n:null};
}
const legacyLevels={acs:{ldl:70,tc:null,label:'ACS 病史／冠狀動脈粥狀硬化曾 PCI 或 CABG'},cvd:{ldl:100,tc:160,label:'表二心血管疾病或糖尿病'},two:{ldl:130,tc:200,label:'至少 2 個表二危險因子'},one:{ldl:160,tc:240,label:'1 個表二危險因子'},zero:{ldl:190,tc:null,label:'0 個表二危險因子'}};
function classifyLegacy(v){
 if(v.legacyGroup&&v.legacyGroup!=='auto') return legacyLevels[v.legacyGroup]?{...legacyLevels[v.legacyGroup],key:v.legacyGroup,manual:true}:null;
 if(v.mode==='quick') return null;
 const n=[v.htn,(v.sex==='M'&&v.age>=45)||(v.sex==='F'&&(v.age>=55||v.menopause)),v.fhx,v.hdl<40,v.smoke].filter(Boolean).length;
 const key=v.acs||v.mi1y||v.mi2||v.revasc?'acs':v.dm||v.legacyCvd?'cvd':n>=2?'two':n===1?'one':'zero';
 return {...legacyLevels[key],key,n,withoutSmoke:n-(v.smoke?1:0)};
}
function passesLegacy(l,ldl,tc){return l&&(ldl!=null&&ldl>=l.ldl||l.tc!=null&&tc!=null&&tc>=l.tc);}
function assessDrug(d,v,r){
 const rule=drugRule(d), out=(status,text,tone='warn')=>({status,text,tone});
 const purpose=v.purpose||(v.statinStatus==='none'?'start':'adjust');
 if(d.kind==='combo'&&v.gem==='yes') return out('不得併用','此複方不得與 gemfibrozil 併用。','bad');
 if(rule==='other') return out('依個別規定核對','本工具未實作此品項的個別給付條件；短碼及 X 不視為完整健保碼。');
 if(d.kind!=='ez'&&v.statinStatus==='intolerant') return out('需評估 statin 耐受性','請核對不耐受紀錄及替代治療；不能僅因 LDL 未達標便認定適合使用含 statin 藥品。');
 if(d.kind!=='ez'&&v.gem==='yes') return out('先核對交互作用','目前使用 gemfibrozil，請核對 statin 及複方各成分仿單。');
 if(purpose==='continue'){
  if(v.currentDrug!==d.id) return out('不是本次續用品項','若要更換或新增此藥，請改選「調整／加藥」。');
  return out('續用需核對原始紀錄',`目前 LDL ${r.ldl<r.goal?'已達':'未達'}表一目標。已達標不代表須停藥；確認原始給付資格、療程與耐受性後維持或調整。`,'purple');
 }
 if(rule==='table2'){
  const l=classifyLegacy(v);
  if(!l) return out('請補表二分類','展開表二條件，依表二的疾病與危險因子獨立分類。');
  const threshold=`LDL ≥${l.ldl}${l.tc?' 或 TC ≥'+l.tc:''} mg/dL`;
  if(purpose!=='start') return out('表二治療中：核對原資格',`${l.label}：起始 ${threshold}。目前數值不能取代治療前紀錄；表一目標仍顯示於上方，換藥請分別核對。`,'purple');
  if(!passesLegacy(l,v.ldl,v.tc)) return out(l.tc&&v.tc==null?'請補 TC 或核對門檻':'未達表二起始門檻',`${l.label}：需 ${threshold}。`);
  if(!['acs','cvd'].includes(l.key)){
   if(v.lifestyle!=='yes') return out('先完成非藥物治療','表二一般族群須先完成 3–6 個月非藥物治療。');
   if(l.manual&&v.legacySmoking==='yes') return out('吸菸條件：應自費','因吸菸才達表二起始準則，尚未戒菸而要求藥物治療，依表二應自費。','bad');
   if(l.manual&&v.legacySmoking!=='no') return out('請確認吸菸附帶條件','若因吸菸才符合起始門檻，且尚未戒菸而要求藥物治療，表二規定應自費。請確認並選擇對應項目。');
   if(!l.manual&&v.smoke){
    const noSmoke=legacyLevels[l.withoutSmoke>=2?'two':l.withoutSmoke===1?'one':'zero'];
    if(!passesLegacy(noSmoke,v.ldl,v.tc)) return out('吸菸條件：應自費','此個案因吸菸才達表二起始準則；未戒菸而要求藥物治療，依表二應自費。','bad');
   }
  }
  return out('符合表二起始血脂條件',`${l.label}；${threshold}。仍須核對本品適應症，複方各成分須有使用理由。`,'ok');
 }
 if(rule==='table1'){
  if(purpose!=='start') return out(r.ldl<r.goal?'已達標，可評估維持':'未達標，可評估強化','此品項適用表一。請確認原始給付資格、實際每日劑量、依從性及耐受度；改品牌本身不等於強化降脂。','purple');
  if(r.ldl<r.threshold) return out('未達表一起始 LDL 門檻',`需 LDL ≥${r.threshold} mg/dL。`);
  if(r.goal>100&&v.lifestyle!=='yes') return out('先完成生活型態治療','須先完成 3–6 個月生活型態改變仍未達標。');
  return out('符合表一起始血脂條件','仍須確認個別適應症、劑量、禁忌與交互作用；複方各成分須有使用理由。','ok');
 }
 const combo=d.kind==='combo';
 if(!(combo?['primary','hofh']:['primary','hofh','sitosterol']).includes(v.ezDx)) return out('請確認血脂診斷',combo?'須原發性高膽固醇血症或同型接合子家族性高膽固醇血症。':'須原發性高膽固醇血症、同型接合子家族性高膽固醇血症或同型接合子植物脂醇血症。');
 if(!combo&&v.statinStatus==='intolerant') return out('符合單方不耐受途徑','須有 statin 無法耐受的不良反應紀錄；本途徑不要求先滿 3 個月。','ok');
 if(r.goal>100&&v.baseline==null&&v.mode!=='quick') return out('請補治療前 LDL','避免遺漏治療前 LDL ≥190 的高風險身分。');
 if(v.currentCombined&&v.monoLdl==null) return out('請補單藥後 LDL','目前已使用合併或其他治療，不能以目前數值代替 statin 單藥未達標的證據。');
 const responseLdl=v.currentCombined?v.monoLdl:r.ldl;
 if(responseLdl<r.goal) return out('已達表一目標','目前數值不符合「statin 單藥未達標」新增途徑；續用請選續藥模式。','purple');
 const three=rule.endsWith('3'),enough=three?v.statinStatus==='ge3m':['6to8','8to12','ge3m'].includes(v.statinStatus);
 if(!enough) return out('statin 單藥療程未符合',`此品項需 statin 單一治療${three?'滿 3 個月':'6–8 週'}仍未達表一目標；不能以複方期間替代。`);
 return out('符合加藥條件',`符合限定診斷，statin 單藥${three?'滿 3 個月':'6–8 週'}且單藥後 LDL ${responseLdl} 未達表一 <${r.goal}。先前 statin 屬表二並不自動排除此途徑，請保留療程紀錄。`,'ok');
}
function compareDrugs(current,next){
 if(!current||!next||!current.statin||!next.statin) return '';
 const a=current.statin,b=next.statin;
 if(a.molecule===b.molecule&&a.mg===b.mg) return `兩品項的 statin 均為 ${a.molecule} ${a.mg} mg／單位。相同每日用量下，換品牌不等於增加 statin 強度${next.kind==='combo'&&current.kind!=='combo'?'；本次另外加入 ezetimibe':''}。`;
 return `目前品項：${a.molecule} ${a.mg} mg（${a.intensity}）；預計品項：${b.molecule} ${b.mg} mg（${b.intensity}）。這是每錠／膠囊的 statin 強度，需核對實際每日用量及複方其他成分。`;
}
if(typeof module!=='undefined') module.exports={classify,validate,drugRule,assessDrug,table2Only,ez3mCodes,combo3mCodes,riskFor,classifyLegacy,passesLegacy,compareDrugs};
