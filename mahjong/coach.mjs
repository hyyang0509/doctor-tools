import {counts,name} from './rules.mjs';

// 只保存出牌當下玩家看得到的資訊；不讀對手暗牌或牌牆順序。
export function publicSnapshot(game,discard){
  const me=game.players[0];
  const known=[...me.hand,...game.players.flatMap(p=>[...p.river,...p.melds.filter(m=>m.open).flatMap(m=>m.tiles)]),...me.melds.filter(m=>!m.open).flatMap(m=>m.tiles)];
  return {hand:[...me.hand],melds:me.melds.map(m=>({...m,tiles:[...m.tiles]})),visible:counts(known),discard,remaining:game.remaining,declinedWin:game.actions().some(a=>a.type==='win')};
}

// 分門列舉面子、搭子與將眼，再合併為台灣五面子制的向聽數。
// 同一分析內共用快取，避免每個候選出牌重算整棵拆牌樹。
function calculator(){
  const memo=new Map();
  function profiles(c,honor=false){
    const key=(honor?'h':'s')+c.join('');if(memo.has(key))return memo.get(key);
    const i=c.findIndex(n=>n>0);if(i<0)return [[0,0,0]];
    const results=new Map();
    function branch(tiles,add){
      for(const t of tiles)c[t]--;
      for(const q of profiles(c,honor)){
        const m=q[0]+add[0],p=q[2]+add[2];if(m>5||p>1)continue;
        const t=Math.min(5-m,q[1]+add[1]);const r=[m,t,p];results.set(r.join(),r);
      }
      for(const t of tiles)c[t]++;
    }
    branch([i],[0,0,0]);
    if(c[i]>=3)branch([i,i,i],[1,0,0]);
    if(c[i]>=2){branch([i,i],[0,0,1]);branch([i,i],[0,1,0]);}
    if(!honor){
      if(i<=6&&c[i+1]&&c[i+2])branch([i,i+1,i+2],[1,0,0]);
      if(i<=7&&c[i+1])branch([i,i+1],[0,1,0]);
      if(i<=6&&c[i+2])branch([i,i+2],[0,1,0]);
    }
    const out=[...results.values()];memo.set(key,out);return out;
  }
  return function distance(c,exposed){
    let combined=[[exposed,0,0]];
    for(let suit=0;suit<4;suit++){
      const group=profiles(c.slice(suit*9,suit===3?34:suit*9+9),suit===3),next=new Map();
      for(const a of combined)for(const b of group){const m=a[0]+b[0],p=a[2]+b[2];if(m>5||p>1)continue;const t=Math.min(5-m,a[1]+b[1]);const v=[m,t,p];next.set(v.join(),v);}
      combined=[...next.values()];
    }
    return Math.min(...combined.map(([m,t,p])=>10-2*m-t-p));
  };
}
export function shanten(hand,meldCount=0){
  const c=counts(hand);if(!c||!Number.isInteger(meldCount)||meldCount<0||meldCount>5)throw Error('無法分析此手牌');
  return calculator()(c,meldCount);
}

export function analyzeDiscard(snapshot){
  const {hand,melds,visible,discard}=snapshot,c=counts(hand);
  if(!c||!c[discard]||hand.length!==17-3*melds.length||!visible||visible.length!==34||visible.some((n,t)=>!Number.isInteger(n)||n<c[t]||n>4))throw Error('出牌快照不完整');
  const distance=calculator(),options=[];
  for(const t of new Set(hand)){
    c[t]--;const steps=distance(c,melds.length),improving=[];
    for(let draw=0;draw<34;draw++){
      const unseen=4-visible[draw];if(unseen<=0)continue;
      c[draw]++;if(distance(c,melds.length)<steps)improving.push({tile:draw,unseen});c[draw]--;
    }
    c[t]++;options.push({tile:t,steps,improving,ukeire:improving.reduce((s,x)=>s+x.unseen,0)});
  }
  options.sort((a,b)=>a.steps-b.steps||b.ukeire-a.ukeire||a.tile-b.tile);
  const actual=options.find(o=>o.tile===discard),first=options[0];
  const best=options.filter(o=>o.steps===first.steps&&o.ukeire===first.ukeire);
  const good=best.some(o=>o.tile===discard),recommended=good?actual:first;
  let reason;
  if(good)reason='這張符合目前最快接近胡牌的牌效選擇；同等選項之間可以再考慮安全性與想做的台數。';
  else if(actual.steps>recommended.steps)reason=`改打 ${name(recommended.tile)} 可少 ${actual.steps-recommended.steps} 步進入聽牌，較能保留完整面子與搭子。`;
  else reason=`兩種打法距離聽牌相同，但改打 ${name(recommended.tile)}，可改善手牌的未見牌多 ${recommended.ukeire-actual.ukeire} 張，後續較有彈性。`;
  if(recommended.tile>=27&&c[recommended.tile]===1)reason+=' 這張是單張字牌，不能與相鄰字牌組順子。';
  if(snapshot.declinedWin)reason='當時已有自摸選項，可直接胡牌。以下比較的是選擇繼續打時的牌效。';
  return {actual,recommended,best,good,reason,options,priority:(actual.steps-first.steps)*1000+(first.ukeire-actual.ukeire)};
}
