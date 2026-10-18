import {Game} from './game.mjs';
import {RULES,WINDS,name,waits} from './rules.mjs';
const $=id=>document.getElementById(id);
let game=new Game(),selected=null,timer=null,epoch=0;
const label=p=>p===0?'你':`電腦${p}`;
const signed=n=>n>0?`+${n}`:`${n}`;
const tile=(t,{mini=false,button=false,selected=false,drawn=false,disabled=false}={})=>{
  const el=document.createElement(button?'button':'span');
  el.className=`tile ${t<9?'wan':t<18?'tong':t<27?'suo':t<34?'honor':'flower'}${mini?' mini':''}${selected?' selected':''}${drawn?' drawn':''}`;
  el.setAttribute('aria-label',name(t));el.title=name(t);
  if(button){el.type='button';el.disabled=disabled;el.setAttribute('aria-pressed',String(selected));}
  el.append(document.createTextNode(t<27?String(t%9+1):name(t)));
  if(t<27){const small=document.createElement('small');small.textContent=['萬','筒','索'][Math.floor(t/9)];el.append(small);}return el;
};
function renderMelds(target,melds){target.replaceChildren();for(const m of melds){const wrap=document.createElement('span');wrap.className='meld';wrap.setAttribute('aria-label',m.open?'明露面子':'暗槓');m.tiles.forEach(t=>wrap.append(tile(t,{mini:true})));if(!m.open){const s=document.createElement('small');s.textContent='暗';wrap.append(s);}target.append(wrap);}}
function button(text,action,classes=''){const b=document.createElement('button');b.textContent=text;b.className=classes;b.addEventListener('click',()=>play(action));return b;}
function play(action){clearTimeout(timer);if(game.act(action)){selected=null;render();schedule();}}
function schedule(){
  clearTimeout(timer);const currentEpoch=epoch;
  if(game.phase!=='over'&&game.actor!==0)timer=setTimeout(()=>{if(currentEpoch!==epoch)return;game.stepAI();selected=null;render();schedule();},550);
}
function render(){
  $('roundBar').textContent=`${WINDS[game.round]}風圈 · 第 ${game.handNo%4+1} 局　｜　莊家：${label(game.dealer)} · 連 ${game.streak}　｜　底 100／台 20`;
  const opponents=$('opponents');opponents.replaceChildren();
  for(const p of [3,2,1]){
    const x=game.players[p],box=document.createElement('div');box.className=`opponent${game.phase!=='over'&&game.actor===p?' active':''}`;
    const head=document.createElement('div');head.className='seat-head';head.innerHTML=`<strong>${label(p)} · ${WINDS[game.seat(p)]}${p===game.dealer?' 莊':''}</strong><span>${signed(game.scores[p])} 分</span>`;
    box.append(head);
    const count=document.createElement('p');count.textContent=`${p===3?'上家':p===2?'對家':'下家'} · 手牌 ${x.hand.length} 張`;box.append(count);
    const backs=document.createElement('div');backs.className='backs';backs.setAttribute('aria-label',`${x.hand.length} 張暗牌`);for(let i=0;i<x.hand.length;i++){const b=document.createElement('span');b.className='back';backs.append(b);}box.append(backs);
    const melds=document.createElement('div');melds.className='melds';renderMelds(melds,x.melds);box.append(melds);
    const flowers=document.createElement('div');flowers.className='flowers';flowers.textContent=x.flowers.length?`花：${x.flowers.map(name).join(' ')}`:'花：—';box.append(flowers);opponents.append(box);
  }
  $('lastTile').replaceChildren();if(game.last){$('lastTile').append(tile(game.last.tile));const s=document.createElement('small');s.style.cssText='display:block;font-size:10px;margin-top:5px;opacity:.6';s.textContent=`${label(game.last.player)}${game.last.rob?'加槓':game.last.claimed?' · 已被取走':''}`;$('lastTile').append(s);}else $('lastTile').innerHTML='<div class="empty-tile">—</div>';
  $('wall').textContent=`可摸 ${game.remaining} 張 · 保留 16 張`;
  const status=game.phase==='over'?game.result.draw?'本局流局':`${label(game.result.winner)}${game.result.selfDraw?'自摸':'胡牌'}！`:game.actor===0?game.phase==='reaction'?`可回應 ${label(game.last.player)} 的${game.last.rob?'加槓':'捨牌'}`:'輪到你出牌':`${label(game.actor)} 思考中…`;
  $('status').textContent=status;
  const rivers=$('rivers');rivers.replaceChildren();
  for(let p=0;p<4;p++){
    const section=document.createElement('div'),l=document.createElement('span');l.className='river-label';l.textContent=`${label(p)} · ${WINDS[game.seat(p)]}`;section.append(l);const tiles=document.createElement('div');tiles.className='river-tiles';game.players[p].river.forEach(t=>tiles.append(tile(t,{mini:true})));section.append(tiles);rivers.append(section);
  }
  const me=game.players[0],canDiscard=game.phase==='turn'&&game.turn===0;
  $('ownMeta').textContent=`你 · ${WINDS[game.seat(0)]}${game.dealer===0?' 莊家':''}　${signed(game.scores[0])} 分　｜　花：${me.flowers.length?me.flowers.map(name).join(' '):'—'}`;
  renderMelds($('ownMelds'),me.melds);
  const hand=$('hand');hand.replaceChildren();
  // 只標出實際摸入的一張，避免同牌全部被標記。
  let drawMarked=false;
  me.hand.forEach((t,i)=>{const drawn=!drawMarked&&game.drawInfo?.player===0&&game.drawInfo.tile===t;if(drawn)drawMarked=true;const b=tile(t,{button:true,selected:selected===i,drawn,disabled:!canDiscard});b.addEventListener('click',()=>{selected=i;render();});hand.append(b);});
  const actions=$('actions');actions.replaceChildren();let hint='';
  if(game.phase==='over'){
    hint='台數明細在下方，可繼續下一局。';const b=document.createElement('button');b.className='primary';b.textContent='下一局';b.addEventListener('click',()=>{epoch++;game.nextRound();selected=null;render();schedule();});actions.append(b);
  }else if(game.actor!==0)hint='電腦正在打牌，輪到你時會停下來等你。';
  else {
    for(const a of game.actions()){
      if(a.type==='discard')continue;
      const txt={win:game.phase==='turn'?'自摸！':'胡牌！',pass:'過',pong:'碰',kong:'明槓',concealedKong:`暗槓 ${name(a.tile)}`,addedKong:`加槓 ${name(a.tile)}`,chow:a.need?`吃 ${a.need.map(name).join('・')}`:''}[a.type];
      actions.append(button(txt,a,a.type==='win'?'gold':''));
    }
    if(canDiscard){const chosen=selected!==null?me.hand[selected]:null,b=button(chosen!==null?`出牌：${name(chosen)}`:'先點選一張牌',{type:'discard',tile:chosen},'primary');b.disabled=chosen===null;actions.append(b);hint='點選手牌，再按出牌。金框是選取牌，細綠框是剛摸的牌。';}
    else hint='可選吃、碰、槓或胡；按「過」繼續牌局。';
  }
  if(me.hand.length===16-3*me.melds.length){const w=waits(me.hand,me.melds);if(w.length)hint+=` 聽牌：${w.map(name).join('、')}。`;}
  $('hint').textContent=hint;
  $('history').replaceChildren();game.history.forEach(s=>{const li=document.createElement('li');li.textContent=s;$('history').append(li);});
  renderResult();
}
function renderResult(){
  const el=$('result');el.hidden=game.phase!=='over';if(el.hidden)return;el.replaceChildren();
  const r=game.result,h=document.createElement('h2');
  if(r.draw){h.textContent='流局';el.append(h);const p=document.createElement('p');p.textContent='可摸牌已用盡，無積分收付。莊家留莊，連莊次數維持。';el.append(p);return;}
  h.innerHTML=`${label(r.winner)}${r.selfDraw?'自摸':'胡牌'} <span>牌型 ${r.scoring.tai} 台</span>`;el.append(h);
  const p=document.createElement('p');p.textContent=`${r.special|| (r.rob?'搶槓':r.selfDraw?'自摸':`${label(r.source)}放槍`)} · 門風 ${WINDS[game.seat(r.winner)]}／圈風 ${WINDS[game.round]}。莊連台按每筆收付另列，見下方。`;el.append(p);
  const tiles=document.createElement('div');tiles.className='winning-hand';
  if(r.scoring.pair!==null){
    for(const g of r.scoring.groups){const group=document.createElement('span');group.className='meld';g.tiles.forEach(t=>group.append(tile(t,{mini:true})));tiles.append(group);}
    const pair=document.createElement('span');pair.className='meld';pair.append(tile(r.scoring.pair,{mini:true}),tile(r.scoring.pair,{mini:true}));tiles.append(pair);
  }else r.hand.filter(t=>Number.isInteger(t)).forEach(t=>tiles.append(tile(t,{mini:true})));
  const flowers=game.players[r.winner].flowers;flowers.forEach(t=>tiles.append(tile(t,{mini:true})));el.append(tiles);
  const table=document.createElement('table');table.innerHTML='<thead><tr><th>計台項目</th><th>台</th><th>依據</th></tr></thead><tbody></tbody>';
  for(const item of r.scoring.items){const tr=document.createElement('tr');for(const value of [item.label,item.tai,item.reason]){const td=document.createElement('td');td.textContent=value;tr.append(td);}table.tBodies[0].append(tr);}
  if(!r.scoring.items.length)table.tBodies[0].innerHTML='<tr><td>無加台牌型</td><td>0</td><td>本桌允許零台胡牌</td></tr>';
  const total=document.createElement('tr');total.className='total';total.innerHTML=`<td>牌型合計</td><td>${r.scoring.tai}</td><td>各項相加，不重複計已被取代項目</td>`;table.tBodies[0].append(total);el.append(table);
  const pay=document.createElement('div');pay.className='payments';
  for(const row of r.pay){const line=document.createElement('div');line.innerHTML=`${label(row.from)} → ${label(row.to)}：牌型 ${r.scoring.tai} ＋莊家 ${row.dealerTai} ＋連莊 ${row.chainTai} ＝ <strong>${row.tai} 台</strong><br>100 ＋ 20 × ${row.tai} ＝ <strong>${row.amount} 分</strong>`;line.style.marginBottom='10px';pay.append(line);}
  const sum=document.createElement('strong');sum.textContent=`${label(r.winner)}本局共獲得 ${r.pay.reduce((s,p)=>s+p.amount,0)} 分`;pay.append(sum);el.append(pay);
}
$('ruleRows').replaceChildren();for(const row of RULES){const tr=document.createElement('tr');row.forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});$('ruleRows').append(tr);}
$('rulesButton').addEventListener('click',()=>$('rulesDialog').showModal());$('closeRules').addEventListener('click',()=>$('rulesDialog').close());
$('restart').addEventListener('click',()=>{if(!confirm('重新開桌會清除目前牌局與累積積分，確定重開？'))return;clearTimeout(timer);epoch++;game=new Game();selected=null;render();schedule();});
render();schedule();
