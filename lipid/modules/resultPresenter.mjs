import {riskParameters} from '../config/targets.mjs';
import {hospitalDrugs} from '../config/drugs.mjs';
import {ruleLabels,table2Only} from '../config/nhi.mjs';
import {followup} from '../config/copy.mjs';
import {drugRule} from './drugPolicy.mjs';
const $=id=>document.getElementById(id);
export function renderResults(v,r,treatment,recommendations){
  $('results').style.display='block';
  $('riskpill').textContent=r.risk;
  $('headline').textContent=`LDL-C ${r.ldl} mg/dL · ${treatment.atGoal?'已達標':'尚未達標'}（目標 <${r.goal}）`;
  $('reason').textContent='判定依據：'+r.basis.join('、')+(r.rfList.length?`；一般風險因子：${r.rfList.join('、')}`:'');
  $('startThreshold').textContent=`≥ ${r.threshold}`;
  $('ldlGoal').textContent=`< ${r.goal}`;
  $('nonHdlGoal').textContent=r.nonHdl?`< ${r.nonHdl}`:'未列';
  const tc=v.mode==='quick'?null:v.tc;
  const hdl=v.mode==='quick'?null:v.hdl;
  let extra='';
  if(tc!==null&&hdl!==null){const nh=Math.round((tc-hdl)*10)/10;extra=`目前 non-HDL-C 約 ${nh} mg/dL${r.nonHdl?`（次要目標 <${r.nonHdl}）`:''}。`}
  const highPlus=r.high||r.veryHigh||r.extreme;
  $('eligibility').innerHTML=`<div class="notice purple"><b>此分級的 LDL-C 分界為 ${r.goal} mg/dL。</b><br>未接受治療時，LDL-C ≥${r.threshold} mg/dL 為起始治療門檻；已接受治療者則以 LDL-C &lt;${r.goal} mg/dL 判斷是否達標。<b>達標後維持適當治療，不代表應停藥。</b>${extra}</div>`;
  if(v.mode!=='quick' && v.statinStatus!=='none' && v.baseline===null) $('eligibility').innerHTML+=`<div class="notice warn">治療前 LDL-C 未填：若原本 ≥${riskParameters.highLdl} mg/dL，風險可能被低估。請補原始數值再核對需要原始資格的加藥路徑。</div>`;
  if(v.mode!=='quick' && v.dialysis==='yes') $('eligibility').innerHTML+='<div class="notice warn">已透析不能單憑 CKD 歸入表一高風險；請核對個別治療與給付條件。</div>';
  renderHospital(recommendations);
  $('followup').innerHTML=followup[highPlus?'high':'general'];
  $('debug').innerHTML=v.mode==='quick'?'使用醫師確認的風險分級；自動分級條件不參與本次判定。':`最高風險優先順序：極高 → 非常高 → 高 → 一般風險因子 計數。<br>一般風險因子 共 ${r.n} 項：${r.rfList.length?r.rfList.join('、'):'無'}。<br>代謝症候群：${r.met?'是':'否'}。年齡風險因子：${r.ageRF?'是':'否'}。低 HDL 風險因子：${r.lowHdl?'是':'否'}。`;
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
}
function drugHTML(d,a){
 const therapy=a.therapyStatus?`<div class="therapyStatus">${a.therapyStatus}</div>`:'';
 return `<div class="drugrow"><div class="drugtitle"><b>${d.name}</b><span class="status ${a.tone}">${a.status}</span></div><div class="why">${d.ingredient}<br>院內碼 ${d.id} · 健保欄 ${d.code}${therapy}<div class="adviceText">${a.text}</div></div></div>`;
}
function renderHospital({main,table2,selected}){
 const rows=entries=>entries.map(({drug,assessment})=>drugHTML(drug,assessment)).join('');
 $('drugAdvice').innerHTML=rows(main)+(table2.length?`<details ${selected?'open':''}><summary>需另查給付規定的品項（${table2.length} 項，適用表二）</summary>${rows(table2)}</details>`:'');
}
function renderCatalog(){
 const q=$('codeSearch').value.trim().toLowerCase();
 const ds=hospitalDrugs.filter(d=>Object.values(d).join(' ').toLowerCase().includes(q));
 $('codeResult').innerHTML=ds.length?ds.map(d=>drugHTML(d,{status:ruleLabels[drugRule(d)],tone:drugRule(d)==='table1'?'purple':'warn',text:'品項規則標示，不代表病人已符合給付。',therapyStatus:''})).join(''):'<div class="notice warn">查無院內品項；未命中不代表符合表一或健保給付。</div>';
 const exclusions=q?table2Only.filter(d=>d.join(' ').toLowerCase().includes(q)):[];
 if(exclusions.length) $('codeResult').innerHTML+='<details><summary>另一套給付規定（表二）查到 '+exclusions.length+' 項</summary>'+exclusions.map(d=>`<p>${d[1]} · ${d[2]}：適用另一套給付規定（表二），不能套用上方門檻</p>`).join('')+'</details>';
}
export {renderCatalog};
