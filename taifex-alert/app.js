(function(){
  'use strict';
  var $=function(id){return document.getElementById(id)};
  var form=$('riskForm'),product=$('product'),result=$('result'),error=$('error');
  var fmt=new Intl.NumberFormat('zh-TW',{maximumFractionDigits:0});

  function money(n){return (n<0?'-':'')+'NT$ '+fmt.format(Math.abs(Math.round(n)))}
  function points(n){return n>0?fmt.format(Math.round(n)):'0'}
  function pct(n){return (n*100).toFixed(1)+'%'}
  function updateMarginNote(){
    var p=TaifexRisk.PRODUCTS[product.value];
    $('marginNote').textContent='每口乘數 '+p.pointValue+' 元／點；交易所原始／維持保證金 '+fmt.format(p.initialMargin)+'／'+fmt.format(p.maintenanceMargin)+' 元。';
  }
  function statusCopy(status){
    if(status==='safe')return {label:'綠燈｜緩衝充足',detail:'依目前權益數，距維持保證金警戒仍有至少 30% 的跌幅空間。'};
    if(status==='warning')return {label:'黃燈｜請留意',detail:'距維持保證金警戒約 20–30%，或權益低於原始保證金需求。'};
    return {label:'紅燈｜高風險',detail:'已低於維持保證金，或不足以承受 20% 下跌。請優先降槓桿或補足資金。'};
  }
  function render(r){
    var s=statusCopy(r.status);
    $('statusCard').className='status '+r.status;
    $('statusTitle').textContent=s.label;
    $('statusDetail').textContent=s.detail;
    $('leverage').textContent=r.leverage.toFixed(2)+' 倍';
    $('notional').textContent=money(r.notional);
    $('unrealized').textContent=money(r.unrealized);
    $('currentTopUp').textContent=r.currentTopUp?money(r.currentTopUp):'目前不需補錢';

    if(r.warningPoint<=0){
      $('warningPoint').textContent='指數跌至 0 前不會觸及';
      $('warningDrop').textContent='跌幅緩衝超過 100%';
    }else if(r.warningPoint>=r.market){
      $('warningPoint').textContent=points(r.warningPoint)+' 點';
      $('warningDrop').textContent='目前已進入警戒區';
    }else{
      $('warningPoint').textContent=points(r.warningPoint)+' 點';
      $('warningDrop').textContent='較市價下跌 '+pct((r.market-r.warningPoint)/r.market);
    }
    $('zeroPoint').textContent=r.equityZeroPoint>0?points(r.equityZeroPoint)+' 點':'低於 0 點';
    $('scenarioBody').innerHTML=r.scenarios.map(function(x){
      return '<tr><td><strong>-'+x.percent+'%</strong><span>'+points(x.market)+' 點</span></td>'+
        '<td class="'+(x.safe?'safe-text':'danger-text')+'">'+(x.safe?'● 安全':'● 不安全')+'</td>'+
        '<td><strong>'+money(x.equity)+'</strong><span>'+(x.topUp?'需補 '+money(x.topUp):'不需補錢')+'</span></td></tr>';
    }).join('');
    result.hidden=false;
    result.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function submit(e){
    e.preventDefault();
    try{
      var r=TaifexRisk.analyze({product:product.value,contracts:$('contracts').value,entry:$('entry').value,market:$('market').value,equity:$('equity').value});
      error.hidden=true;render(r);
    }catch(err){error.textContent=err.message;error.hidden=false;result.hidden=true;}
  }
  product.addEventListener('change',updateMarginNote);
  form.addEventListener('submit',submit);
  updateMarginNote();
})();
