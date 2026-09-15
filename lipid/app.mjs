import {hospitalDrugs} from './config/drugs.mjs';
import {riskTiers,riskParameters,inputLimits} from './config/targets.mjs';
import {ruleLabels,formOptions} from './config/nhi.mjs';
import {drugRule} from './modules/drugPolicy.mjs';
import {classify,validate} from './modules/riskAssessment.mjs';
import {treatmentStatus} from './modules/treatmentStatus.mjs';
import {recommendDrugs} from './modules/drugRecommendation.mjs';
import {renderResults,renderCatalog} from './modules/resultPresenter.mjs';

const $=id=>document.getElementById(id);
Object.entries(formOptions).forEach(([id,options])=>{$(id).innerHTML=options.map(o=>`<option value="${o.value}">${o.label}</option>`).join('');});
const num=id=>{const v=parseFloat($(id).value);return Number.isFinite(v)?v:null};

function metUpdate(){
  const low=num('hdl')!==null && num('hdl')<riskParameters.lowHdl[$('sex').value];
  $('metHdl').disabled=true; $('metHdl').checked=low;
  const n=[...document.querySelectorAll('.met')].filter(x=>x.checked).length;
  $('metCount').textContent=`目前 ${n} / 5 項 → ${n>=riskParameters.metabolicCount?'符合代謝症候群（算 1 個風險因子）':'尚不符合代謝症候群'}`;
}

function calculate(){
  const v=readInputs(); const err=validate(v); $('error').textContent=err; $('results').style.display='none'; if(err){return;} const r=classify(v);
  renderResults(v,r,treatmentStatus(v,r),recommendDrugs(v,r,$('hospitalDrug').value));
}

function codeLookup(){renderCatalog();}
function readInputs(){
 const v={}; document.querySelectorAll('input,select').forEach(el=>{v[el.id]=el.type==='checkbox'?el.checked:el.type==='number'?(el.value.trim()===''?null:Number(el.value)):el.value;}); return v;
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
  metUpdate(); modeUpdate();
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
    $('jsStatus').textContent='⚠️ 互動功能載入失敗：'+e.message+'。請重新整理網站，或用 Safari 開啟網站連結。';
  }
}

$('hospitalDrug').innerHTML='<option value="">全部院內 statin / ezetimibe 品項</option>'+hospitalDrugs.map(d=>`<option value="${d.id}">${d.name}｜${ruleLabels[drugRule(d)]}</option>`).join('');
['hdl','sex'].forEach(id=>$(id).addEventListener('input',()=>{ $('metHdl').checked=false; metUpdate(); }));
document.querySelectorAll('.field').forEach(f=>{const label=f.querySelector('label'),input=f.querySelector('input,select');if(label&&input) label.htmlFor=input.id;});
document.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>{$('results').style.display='none';$('error').textContent='';}));
$('jsStatus').hidden=true;

function modeUpdate(){
 const quick=$('mode').value==='quick';
 $('ldl').closest('.card').querySelector('.sub').textContent=quick?'填寫目前 LDL-C；治療前數值為選填。':'填寫目前血脂與年齡；未勾選的診斷視為沒有，請確認後分析。';
 $('tierField').hidden=!quick;
 $('riskDefinitions').hidden=!quick;
 $('riskDefinitions').open=false;
 ['sex','age','hdl','tc','dialysis'].forEach(id=>{$(id).closest('.field').hidden=quick;});
 ['cad','dm','htn'].forEach(id=>{$(id).closest('.card').hidden=quick;});
 $('dialysisNote').style.display=!quick&&$('dialysis').value==='yes'?'block':'none';
 $('results').style.display='none';
}
$('mode').addEventListener('change',modeUpdate);
modeUpdate();

$('calc').addEventListener('click',calculate);
$('reset').addEventListener('click',resetAll);
$('codeBtn').addEventListener('click',codeLookup);
$('riskTier').innerHTML='<option value="">請選擇</option>'+Object.entries(riskTiers).map(([key,t])=>`<option value="${key}">${t.optionLabel} · LDL &lt;${t.goal}</option>`).join('');
$('ruleSummary').innerHTML=Object.values(riskTiers).map(t=>`<li>${t.shortLabel}：LDL ≥${t.threshold} → 目標 &lt;${t.goal}${t.nonHdl?`（non-HDL &lt;${t.nonHdl}）`:''}</li>`).join('');
inputLimits.forEach(([id,,max])=>{$(id).max=max;});
