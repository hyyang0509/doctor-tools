(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.TaifexRisk=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';

  var PRODUCTS={
    TX:{name:'大台',pointValue:200,initialMargin:701000,maintenanceMargin:538000},
    MTX:{name:'小台',pointValue:50,initialMargin:175250,maintenanceMargin:134500},
    TMF:{name:'微台',pointValue:10,initialMargin:35050,maintenanceMargin:26900}
  };

  function finitePositive(value){
    var n=Number(value);
    return Number.isFinite(n)&&n>0?n:NaN;
  }

  function analyze(input){
    var product=PRODUCTS[input.product];
    var contracts=finitePositive(input.contracts);
    var entry=finitePositive(input.entry);
    var market=finitePositive(input.market);
    var equity=finitePositive(input.equity);
    if(!product)throw new Error('請選擇有效商品。');
    if(!Number.isInteger(contracts))throw new Error('口數須為大於 0 的整數。');
    if(!Number.isFinite(entry)||!Number.isFinite(market)||!Number.isFinite(equity))throw new Error('請完整輸入大於 0 的成交均價、市價與權益數。');

    var multiplier=product.pointValue*contracts;
    var notional=market*multiplier;
    var maintenanceRequired=product.maintenanceMargin*contracts;
    var initialRequired=product.initialMargin*contracts;
    var unrealized=(market-entry)*multiplier;
    var leverage=notional/equity;
    var declineToMaintenance=(equity-maintenanceRequired)/notional;
    var warningPoint=market-(equity-maintenanceRequired)/multiplier;
    var equityZeroPoint=market-equity/multiplier;
    var currentTopUp=equity<maintenanceRequired?Math.max(0,initialRequired-equity):0;
    var status;
    if(equity<maintenanceRequired||declineToMaintenance<0.20)status='danger';
    else if(equity<initialRequired||declineToMaintenance<0.30)status='warning';
    else status='safe';

    var scenarios=[10,20,30,40,50].map(function(percent){
      var projectedMarket=market*(1-percent/100);
      var projectedEquity=equity-(market-projectedMarket)*multiplier;
      var isSafe=projectedEquity>=maintenanceRequired;
      return {
        percent:percent,
        market:projectedMarket,
        equity:projectedEquity,
        safe:isSafe,
        topUp:isSafe?0:Math.max(0,initialRequired-projectedEquity)
      };
    });

    return {
      product:product,contracts:contracts,entry:entry,market:market,equity:equity,
      notional:notional,leverage:leverage,unrealized:unrealized,
      maintenanceRequired:maintenanceRequired,initialRequired:initialRequired,
      declineToMaintenance:declineToMaintenance,warningPoint:warningPoint,
      equityZeroPoint:equityZeroPoint,currentTopUp:currentTopUp,status:status,
      scenarios:scenarios
    };
  }

  return {PRODUCTS:PRODUCTS,analyze:analyze};
});
