import test from 'node:test';
import assert from 'node:assert/strict';
import {shanten,publicSnapshot,analyzeDiscard} from './coach.mjs';
import {Game} from './game.mjs';
import {counts,waits,FLOWER_EMOJI,flowerLabel} from './rules.mjs';
const complete=[0,1,2,3,4,5,9,10,11,18,19,20,21,22,23,27,27];
const hand=[0,1,2,3,4,5,9,10,11,18,19,20,27,27,6,7,31];
const snapshot=(h,discard,extra={})=>({hand:[...h],melds:[],visible:counts(h),discard,remaining:40,declinedWin:false,...extra});
test('五面子制：胡牌為 -1，聽牌為 0，副露亦採五面子',()=>{
  assert.equal(shanten(complete),-1);assert.equal(shanten(complete.slice(0,-1)),0);
  assert.equal(shanten([27],5),0);assert.equal(shanten([27,27],5),-1);
  assert.equal(shanten([0,1,2,3,4,5,9,10,11,18,19,20,27,27,6,31]),1);
  assert.throws(()=>shanten([34]));assert.throws(()=>shanten([0],6));
});
test('保留面子與搭子，先打孤張字牌可維持聽牌；不更動原始快照',()=>{
  const s=snapshot(hand,0),before=JSON.stringify(s),a=analyzeDiscard(s);
  assert.equal(a.recommended.tile,31);assert.equal(a.recommended.steps,0);assert.ok(a.actual.steps>=a.recommended.steps);
  assert.equal(JSON.stringify(s),before);assert.ok(a.reason.includes('改打'));
  const good=analyzeDiscard(snapshot(hand,31));assert.equal(good.good,true);
});
test('已聽牌的改善牌種與實際胡牌判斷一致，已見四張不可算進張',()=>{
  const s=snapshot(hand,31),a=analyzeDiscard(s),after=hand.filter(t=>t!==31);
  assert.deepEqual(a.actual.improving.map(x=>x.tile),waits(after));
  const one=a.actual.improving[0].tile;s.visible[one]=4;
  const b=analyzeDiscard(s);assert.ok(!b.actual.improving.some(x=>x.tile===one));
  assert.equal(b.actual.ukeire,b.actual.improving.reduce((sum,x)=>sum+x.unseen,0));
});
test('同等選擇皆算合理；不會因排序將其中一張說成錯誤',()=>{
  const h=[0,2,4,6,8,9,11,13,15,17,18,20,22,24,26,27,28];
  const a=analyzeDiscard(snapshot(h,27));assert.ok(a.best.length>1);
  for(const option of a.best)assert.equal(analyzeDiscard(snapshot(h,option.tile)).good,true);
});
test('可自摸時先提醒，沒有公開資料的快照拒絕分析',()=>{
  assert.match(analyzeDiscard(snapshot(complete,0,{declinedWin:true})).reason,/自摸/);
  assert.throws(()=>analyzeDiscard(snapshot(hand,33)));assert.throws(()=>analyzeDiscard(snapshot(hand,0,{visible:null})));
});
test('快照不含對手手牌、暗槓種類與牌序；事後改動不影響評語',()=>{
  const g=new Game(),t=g.players[0].hand[0],s=publicSnapshot(g,t),before=JSON.stringify(s),a=analyzeDiscard(s);
  for(let i=1;i<4;i++){g.players[i].hand=[33,33,33];g.players[i].melds.push({kind:'kong',open:false,tiles:[32,32,32,32]});}
  g.wall.reverse();const after=publicSnapshot(g,t);assert.deepEqual(after,s);
  g.players[0].hand.reverse();g.players[0].hand.pop();assert.equal(JSON.stringify(s),before);assert.deepEqual(analyzeDiscard(s),a);
  assert.ok(!('players' in s));assert.ok(!('wall' in s));
});
test('四君子 emoji 保留花名與原始編號，計台資料不受影響',()=>{
  assert.deepEqual([38,39,40,41].map(t=>FLOWER_EMOJI[t]),['🌸','🌺','🌼','🎋']);
  assert.equal(flowerLabel(38),'🌸梅');assert.equal(flowerLabel(39),'🌺蘭');assert.equal(flowerLabel(40),'🌼菊');assert.equal(flowerLabel(41),'🎋竹');assert.equal(flowerLabel(34),'春');
});

// 獨立的整手遞迴作為交叉驗證，不共用正式程式的分門合併法。
function oracle(hand,open=0){
  const c=counts(hand);let best=10;
  function walk(m,t,p){
    const i=c.findIndex(n=>n>0);if(i<0){best=Math.min(best,10-2*(m+open)-Math.min(t,5-m-open)-p);return;}
    const take=(tiles,dm,dt,dp)=>{for(const x of tiles)c[x]--;walk(m+dm,t+dt,p+dp);for(const x of tiles)c[x]++;};
    take([i],0,0,0);
    if(m+open<5){if(c[i]>=3)take([i,i,i],1,0,0);if(i<27&&i%9<=6&&c[i+1]&&c[i+2])take([i,i+1,i+2],1,0,0);}
    if(c[i]>=2){if(!p)take([i,i],0,0,1);take([i,i],0,1,0);}
    if(i<27){if(i%9<=7&&c[i+1])take([i,i+1],0,1,0);if(i%9<=6&&c[i+2])take([i,i+2],0,1,0);}
  }walk(0,0,0);return best;
}
test('分門演算法與獨立遞迴比對 100 組手牌，包含 0–5 組副露',()=>{
  let seed=123;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let n=0;n<100;n++){
    const open=n%6,wall=Array.from({length:136},(_,i)=>Math.floor(i/4)),h=[];
    while(h.length<16-3*open){const i=Math.floor(random()*wall.length);h.push(wall.splice(i,1)[0]);}
    assert.equal(shanten(h,open),oracle(h,open),JSON.stringify({h,open}));
  }
});
