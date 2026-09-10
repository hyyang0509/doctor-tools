
const $=id=>document.getElementById(id);
const checked=id=>$(id).checked;
const num=id=>{const v=parseFloat($(id).value);return Number.isFinite(v)?v:null};

function metUpdate(){
  const low=num('hdl')!==null && num('hdl')<($('sex').value==='M'?40:50);
  $('metHdl').disabled=low; if(low) $('metHdl').checked=true;
  const n=[...document.querySelectorAll('.met')].filter(x=>x.checked).length;
  $('metCount').textContent=`目前 ${n} / 5 項 → ${n>=3?'符合代謝症候群（算 1 個風險因子）':'尚不符合代謝症候群'}`;
}
document.querySelectorAll('.met').forEach(x=>x.addEventListener('change',metUpdate));
$('dialysis').addEventListener('change',()=>{$('dialysisNote').style.display=$('dialysis').value==='yes'?'block':'none'});

function calculate(){
  const v=readInputs(); const err=validate(v); $('error').textContent=err; $('results').style.display='none'; if(err){return;} const r=classify(v);
  if(r.ldl===null){alert('請先填 LDL-C');$('ldl').focus();return}
  $('results').style.display='block';
  $('riskpill').textContent=r.risk;
  $('headline').textContent=`LDL-C ${r.ldl} mg/dL · ${r.ldl<r.goal?'已達':'未達'}表一治療目標`;
  $('reason').textContent='判定依據：'+r.basis.join('、')+(r.rfList.length?`；一般 RF：${r.rfList.join('、')}`:'');
  $('startThreshold').textContent=`≥ ${r.threshold}`;
  $('ldlGoal').textContent=`< ${r.goal}`;
  $('nonHdlGoal').textContent=r.nonHdl?`< ${r.nonHdl}`:'未列';
  const tc=num('tc');
  const hdl=num('hdl');
  let extra='';
  if(tc!==null&&hdl!==null){const nh=Math.round((tc-hdl)*10)/10;extra=`目前 non-HDL-C 約 ${nh} mg/dL${r.nonHdl?`（次要目標 <${r.nonHdl}）`:''}。`}
  const highPlus=['極高風險','非常高風險','高風險'].includes(r.risk);
  $('eligibility').innerHTML=`<div class="notice purple">表一風險目標僅供對照；實際品項給付請看下方結果。${extra}</div>`;
  if(v.statinStatus!=='none' && v.baseline===null) $('eligibility').innerHTML+='<div class="notice warn">治療前 LDL-C 未填：若原本 ≥190 mg/dL，風險可能被低估。請補原始數值再核對加藥條件。</div>';
  if(v.dialysis==='yes') $('eligibility').innerHTML+='<div class="notice warn">已透析不能單憑 CKD 歸入表一高風險；請核對個別治療與給付條件。</div>';
  renderHospital(v,r);
  const status=$('statinStatus').value;
  let fu='';
  if(highPlus){fu='<ul class="timeline"><li>起始治療後 <b>6–8 週</b>追蹤血脂。</li><li>若更動治療，<b>1–3 個月</b>內再追蹤是否達標。</li><li>達標後原則每 <b>6 個月</b>追蹤。</li></ul>'}
  else{fu='<ul class="timeline"><li>先生活型態改變 <b>3–6 個月</b>後檢測。</li><li>開始中強度 statin 後 <b>6–8 週</b>追蹤。</li><li>達標後原則每 <b>6–12 個月</b>追蹤。</li></ul>'}
  $('followup').innerHTML=fu;
  $('debug').innerHTML=`最高風險優先順序：極高 → 非常高 → 高 → 一般 RF 計數。<br>一般 RF 共 ${r.n} 項：${r.rfList.length?r.rfList.join('、'):'無'}。<br>代謝症候群：${r.met?'是':'否'}。年齡 RF：${r.ageRF?'是':'否'}。低 HDL RF：${r.lowHdl?'是':'否'}。`;
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
}

function codeLookup(){renderCatalog();}
function readInputs(){
 const v={}; document.querySelectorAll('input,select').forEach(el=>{v[el.id]=el.type==='checkbox'?el.checked:el.type==='number'?(el.value.trim()===''?null:Number(el.value)):el.value;}); return v;
}
function drugHTML(d,a){return `<div class="drugrow"><div class="drugtitle"><b>${d.name}</b><span class="status ${a.tone}">${a.status}</span></div><div class="why">${d.ingredient}<br>院內碼 ${d.id} · 健保欄 ${d.code}<br>${a.text}</div></div>`;}
function renderHospital(v,r){
 const selected=$('hospitalDrug').value;
 const ds=selected?hospitalDrugs.filter(d=>d.id===selected):hospitalDrugs.filter(d=>['statin','ez','combo'].includes(d.kind));
 const main=ds.filter(d=>drugRule(d)!=='table2'), old=ds.filter(d=>drugRule(d)==='table2');
 $('drugAdvice').innerHTML=main.map(d=>drugHTML(d,assessDrug(d,v,r))).join('')+(old.length?`<details ${selected?'open':''}><summary>表二品項（${old.length} 項，需另核對）</summary>${old.map(d=>drugHTML(d,assessDrug(d,v,r))).join('')}</details>`:'');
}
function renderCatalog(){
 const q=$('codeSearch').value.trim().toLowerCase();
 const ds=hospitalDrugs.filter(d=>Object.values(d).join(' ').toLowerCase().includes(q));
 $('codeResult').innerHTML=ds.length?ds.map(d=>drugHTML(d,{status:ruleLabels[drugRule(d)],tone:drugRule(d)==='table1'?'purple':'warn',text:'品項規則標示，不代表病人已符合給付。'})).join(''):'<div class="notice warn">查無院內品項；未命中不代表符合表一或健保給付。</div>';
 const exclusions=q?table2Only.filter(d=>d.join(' ').toLowerCase().includes(q)):[];
 if(exclusions.length) $('codeResult').innerHTML+='<details><summary>附件表二例外清單命中 '+exclusions.length+' 項</summary>'+exclusions.map(d=>`<p>${d[1]} · ${d[2]}：僅適用表二</p>`).join('')+'</details>';
}
function resetAll(){
  var inputs=document.querySelectorAll('input');
  for(var i=0;i<inputs.length;i++){
    if(inputs[i].type==='checkbox') inputs[i].checked=false;
    else inputs[i].value='';
  }
  var selects=document.querySelectorAll('select');
  for(var j=0;j<selects.length;j++) selects[j].selectedIndex=0;
  $('results').style.display='none';
  $('codeResult').innerHTML=''; $('error').textContent='';
  $('dialysisNote').style.display='none';
  metUpdate();
  try{ window.scrollTo(0,0); }catch(e){}
}

try{
  var mets=document.querySelectorAll('.met');
  for(var k=0;k<mets.length;k++){
    mets[k].onchange=metUpdate;
  }
  $('dialysis').onchange=function(){
    $('dialysisNote').style.display=$('dialysis').value==='yes'?'block':'none';
  };
  $('codeSearch').onkeydown=function(e){
    e=e||window.event;
    if((e.key&&e.key==='Enter')||e.keyCode===13){
      codeLookup();
      if(e.preventDefault)e.preventDefault();
      return false;
    }
  };
  metUpdate();
  if($('jsStatus')){
    $('jsStatus').textContent='✅ 互動功能已載入，可直接按「判斷健保條件」。';
  }
}catch(e){
  if($('jsStatus')){
    $('jsStatus').textContent='⚠️ 互動功能載入失敗：'+e.message+'。請用 Safari 開啟此 HTML 檔案。';
  }
}

$('hospitalDrug').innerHTML='<option value="">全部院內 statin / ezetimibe 品項</option>'+hospitalDrugs.map(d=>`<option value="${d.id}">${d.name}｜${ruleLabels[drugRule(d)]}</option>`).join('');
['hdl','sex'].forEach(id=>$(id).addEventListener('input',()=>{ $('metHdl').checked=false; metUpdate(); }));
document.querySelectorAll('.field').forEach(f=>{const label=f.querySelector('label'),input=f.querySelector('input,select');if(label&&input) label.htmlFor=input.id;});
document.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>{$('results').style.display='none';$('error').textContent='';}));
$('jsStatus').hidden=true;
