'use strict';
var assert=require('assert');
var risk=require('./calculator.js');

var base=risk.analyze({product:'TMF',contracts:3,entry:47000,market:48000,equity:520000});
assert.strictEqual(base.notional,1440000);
assert.strictEqual(base.leverage,1440000/520000);
assert.strictEqual(base.unrealized,30000);
assert.strictEqual(base.maintenanceRequired,80700);
assert.strictEqual(Math.round(base.warningPoint),33357);
assert.strictEqual(base.scenarios[2].percent,30);
assert.strictEqual(base.scenarios[2].equity,88000);
assert.strictEqual(base.scenarios[2].safe,true);
assert.strictEqual(base.scenarios[3].safe,false);
assert.strictEqual(base.scenarios[3].topUp,161150);

var marginCall=risk.analyze({product:'TX',contracts:1,entry:48000,market:47000,equity:500000});
assert.strictEqual(marginCall.status,'danger');
assert.strictEqual(marginCall.currentTopUp,201000);
assert.throws(function(){risk.analyze({product:'TMF',contracts:1.5,entry:1,market:1,equity:1})},/整數/);
assert.throws(function(){risk.analyze({product:'BAD',contracts:1,entry:1,market:1,equity:1})},/有效商品/);
assert.throws(function(){risk.analyze({product:'TMF',contracts:1,entry:0,market:1,equity:1})},/完整輸入/);
console.log('taifex calculator tests: ok');
