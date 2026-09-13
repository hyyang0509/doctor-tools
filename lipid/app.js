const $=id=>document.getElementById(id);
const drug=id=>hospitalDrugs.find(d=>d.id===id);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readInputs(){
 const v={};document.querySelectorAll('input,select').forEach(el=>{if(el.id)v[el.id]=el.type==='checkbox'?el.checked:el.type==='number'?(el.value.trim()===''?null:Number(el.value)):el.value;});
 v.quickRisk=document.querySelector('[name="quickRisk"]:checked')?.value;
 if(v.purpose==='start')v.currentDrug='';
 if(v.purpose==='continue')v.hospitalDrug=v.currentDrug;
 v.currentCombined=!!v.currentDrug&&drug(v.currentDrug)?.kind!=='statin'&&v.currentDrug!=='07084';
 if(v.currentDrug==='07103')v.gem='yes';
 return v;
}
function metUpdate(){
 const h=$('hdl').value,low=h!==''&&Number(h)<($('sex').value==='M'?40:50);
 $('metHdl').checked=low;$('metHdl').disabled=true;
 const n=[...document.querySelectorAll('.met')].filter(x=>x.checked).length;
 $('metCount').textContent=`${n} / 5 項：${n>=3?'符合代謝症候群（整體 1 項風險因子）':'尚未符合'}；HDL 由檢驗值判斷。`;
}
function syncFields(){
 const v=readInputs(),d=drug(v.hospitalDrug),all=!v.hospitalDrug;
 const ez=all||['ez','combo'].includes(d?.kind);
 $('quickPanel').hidden=v.mode!=='quick';$('autoPanel').hidden=v.mode==='quick';
 $('currentField').hidden=v.purpose==='start';$('hospitalDrug').disabled=v.purpose==='continue';
 if(v.purpose==='continue')$('hospitalDrug').value=v.currentDrug==='other'?'':v.currentDrug;
 document.querySelectorAll('[data-ez]').forEach(el=>el.hidden=!ez||v.purpose==='continue');
 $('statinStatus').closest('.field').hidden=v.purpose==='continue';
 $('legacyPanel').hidden=!(all||drugRule(d)==='table2');
 $('lifestyleField').hidden=v.purpose!=='start';
 $('drugRuleHint').textContent=d?ruleLabels[drugRule(d)]:'可核對全部院內品項，或先選定這次要開的藥。';
 $('dialysisNote').style.display=v.dialysis==='yes'?'block':'none';metUpdate();
}
function drugHTML(d,a){const m=d.statin;return `<article class="drugrow"><div class="drugtitle"><b>${escapeHTML(d.name)}</b><span class="status ${a.tone}">${escapeHTML(a.status)}</span></div><div class="why">${escapeHTML(d.ingredient)}${m?` · ${m.intensity} statin`:''}<br>院內碼 ${d.id} · 健保欄 ${d.code} · ${ruleLabels[drugRule(d)]}<br>${escapeHTML(a.text)}</div></article>`;}
function calculate(event){
 event?.preventDefault();const v=readInputs(),err=validate(v);$('error').textContent=err;$('results').hidden=true;if(err){$('error').scrollIntoView({block:'center'});return;}
 const r=riskFor(v),atGoal=r.ldl<r.goal;
 $('riskpill').textContent=r.risk;$('headline').textContent=atGoal?'LDL 已達表一治療目標':'LDL 尚未達表一治療目標';
 $('reason').textContent=r.basis.join('；');$('currentLdl').textContent=r.ldl;$('ldlGoal').textContent='<'+r.goal;
 $('gap').textContent=atGoal?'—':r.ldl===0?'—':'>'+((r.ldl-r.goal)/r.ldl*100).toFixed(1)+'%';
 $('clinicalAdvice').textContent=atGoal?'目前治療若有效且耐受，達標通常應維持；起始或續用的給付資格請另看下方。':v.purpose==='start'?`表一起始 LDL 門檻為 ≥${r.threshold} mg/dL。${r.goal>100?'先完成 3–6 個月生活型態改變。':'生活型態改變可與藥物治療並行。'}選用品項仍須符合自己的給付條件。`:'先確認服藥情況與實際每日劑量，再評估增加強度、最大耐受劑量或合併治療。';
 const comparison=compareDrugs(drug(v.currentDrug),drug(v.hospitalDrug));$('comparison').textContent=comparison;$('comparison').className=comparison?'notice warn':'';
 let ds=v.hospitalDrug?[drug(v.hospitalDrug)].filter(Boolean):hospitalDrugs;
 if(v.purpose==='continue'&&v.currentDrug==='other')ds=[];
 const rows=items=>items.map(d=>drugHTML(d,assessDrug(d,v,r))).join('');
 $('drugAdvice').innerHTML=!ds.length?'<p class="notice warn">目前品項未收錄，請以完整健保碼核對原始給付規定。</p>':v.hospitalDrug?rows(ds):['table1','ez','table2','other'].map(group=>{const items=ds.filter(d=>{const rule=drugRule(d);return group==='ez'?rule.startsWith('ez')||rule.startsWith('combo'):rule===group;});return `<details ${group==='table1'?'open':''}><summary>${({table1:'表一品項',ez:'Ezetimibe 單方／複方',table2:'表二品項',other:'其他個別規定'})[group]} · ${items.length} 項</summary>${rows(items)}</details>`;}).join('');
 $('followup').textContent='表一：開始 statin 後 6–8 週追蹤；調整後 1–3 個月。達標後高風險以上每 6 個月，中低風險每 6–12 個月。表二：第一年每 3–6 個月，其後至少每 6–12 個月。';
 $('debug').textContent=`${v.mode==='quick'?'手動確認分級':'自動分級：'+(r.rfList.join('、')||'無一般風險因子')}。${r.nonHdl?'表一次要 non-HDL 目標 <'+r.nonHdl+'。':''}${v.tc!=null&&v.hdl!=null?'目前 non-HDL '+(v.tc-v.hdl).toFixed(1)+'。':''}${v.purpose!=='start'&&v.baseline==null?'尚未填治療前 LDL，請確認是否曾 ≥190 及原始給付紀錄。':''}`;
 $('results').hidden=false;$('results').focus({preventScroll:true});$('results').scrollIntoView({block:'start',behavior:'smooth'});
}
function renderCatalog(){const q=$('codeSearch').value.trim().toLowerCase();const ds=hospitalDrugs.filter(d=>[d.id,d.code,d.name,d.ingredient].join(' ').toLowerCase().includes(q));$('codeResult').innerHTML=ds.length?ds.map(d=>drugHTML(d,{status:ruleLabels[drugRule(d)],tone:'purple',text:'僅標示品項規則，不代表病人已符合給付。'})).join(''):'<p>查無院內品項；未命中不代表適用表一。</p>';}
const options=hospitalDrugs.map(d=>`<option value="${d.id}">${escapeHTML(d.name)}</option>`).join('');
$('currentDrug').innerHTML='<option value="">請選擇目前藥品</option>'+options+'<option value="other">院外藥／其他未收錄品項</option>';
$('hospitalDrug').innerHTML='<option value="">全部院內品項</option>'+options;
$('clinicalForm').addEventListener('submit',calculate);
$('clinicalForm').addEventListener('reset',()=>{setTimeout(()=>{$('results').hidden=true;$('error').textContent='';syncFields();},0);});
$('clinicalForm').addEventListener('input',()=>{$('results').hidden=true;$('error').textContent='';syncFields();});
$('clinicalForm').addEventListener('change',()=>{$('results').hidden=true;syncFields();});
$('codeSearch').addEventListener('input',renderCatalog);
// 舊表單的標籤保留原文並補上可點選的欄位關聯。
document.querySelectorAll('.field').forEach(f=>{const l=f.querySelector('label'),i=f.querySelector('input,select');if(l&&i)l.htmlFor=i.id;});
syncFields();renderCatalog();
if('serviceWorker' in navigator)navigator.serviceWorker.register('../sw.js').catch(()=>{});
