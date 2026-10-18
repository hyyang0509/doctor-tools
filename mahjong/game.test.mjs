import test from 'node:test';
import assert from 'node:assert/strict';
import {counts,decompositions,waits,chowChoices,score,payments} from './rules.mjs';
import {Game,chooseDiscard} from './game.mjs';
const seq=(s)=>[s,s+1,s+2],pung=t=>[t,t,t],pair=t=>[t,t];
const mixed=[...seq(0),...seq(3),...seq(9),...seq(18),...seq(21),...pair(7)];
const context=(winTile,extra={})=>({winTile,seat:1,round:0,...extra});
const labels=s=>s.items.map(x=>x.label);
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function invariant(g){
  const all=[...g.wall,...g.players.flatMap(p=>[...p.hand,...p.flowers,...p.river,...p.melds.flatMap(m=>m.tiles)])];
  assert.equal(all.length,144);for(let t=0;t<42;t++)assert.equal(all.filter(x=>x===t).length,t<34?4:1,`牌 ${t} 守恆`);
  if(g.phase!=='over')g.players.forEach((p,i)=>assert.equal(p.hand.length,16-3*p.melds.length+(g.phase==='turn'&&g.turn===i?1:0),`玩家 ${i} 張數`));
  assert.equal(g.scores.reduce((a,b)=>a+b,0),0);
}
test('16 張制只接受五面子一將；拒絕四面子、第五張與非法牌',()=>{
  assert.ok(decompositions(mixed).length);assert.equal(decompositions(mixed.slice(0,14)).length,0);
  assert.equal(decompositions(Array(17).fill(0)).length,0);assert.equal(counts([34]),null);
  assert.equal(counts([0,0,0,0,0]),null);
  assert.equal(decompositions([NaN,...mixed.slice(1)]).length,0);
});
test('吃牌只在同門連續三張，邊界不能跨九一',()=>{
  assert.deepEqual(chowChoices([7,9,10],8),[]);assert.deepEqual(chowChoices([0,1,3,4],2),[[0,1],[1,3],[3,4]]);
  assert.deepEqual(chowChoices([27,28],29),[]);
});
test('聽牌會排除第五張，並只接受少一張的牌形',()=>{
  const before=mixed.slice();before.splice(before.indexOf(0),1);assert.ok(waits(before).includes(0));
  assert.deepEqual(waits(mixed),[]);
  const h=[0,0,0,0,1,2,...seq(9),...seq(12),...seq(18),6];assert.ok(!waits(h).includes(0));
});
test('門清自摸三台替代門清與自摸；平胡需真正兩面',()=>{
  const s=score(mixed,[],[],context(0,{selfDraw:true}));assert.ok(labels(s).includes('門清自摸'));assert.ok(!labels(s).includes('自摸'));
  assert.ok(labels(score(mixed,[],[],context(0))).includes('平胡'));
  assert.ok(!labels(score(mixed,[],[],context(2))).includes('平胡'),'一二聽三是邊張');
  assert.ok(!labels(score(mixed,[],[35],context(0))).includes('平胡'));
});
test('同形多種拆法取最高台，而非第一個找到的拆法',()=>{
  const h=[...pung(0),...pung(1),...pung(2),...pung(3),...pung(4),...pair(5)];
  assert.ok(decompositions(h).length>1);const s=score(h,[],[],context(5,{selfDraw:true}));
  assert.ok(labels(s).includes('五暗刻'));assert.ok(labels(s).includes('碰碰胡'));assert.ok(labels(s).includes('清一色'));
  assert.equal(s.tai,s.items.reduce((a,b)=>a+b.tai,0));
});
test('放槍湊成刻子不計暗刻，胡將仍保留暗刻',()=>{
  const h=[...pung(0),...pung(9),...pung(18),...pung(27),...pung(31),...pair(7)];
  assert.ok(labels(score(h,[],[],context(31))).includes('四暗刻'));
  assert.ok(!labels(score(h,[],[],context(31))).includes('五暗刻'));
  assert.ok(labels(score(h,[],[],context(7))).includes('五暗刻'));
});
test('三元、四喜、字一色及花槓避免重複',()=>{
  const h=[...pung(31),...pung(32),...pung(33),...seq(0),...seq(9),...pair(27)];
  const s=score(h,[],[34,35,36,37],context(27,{seat:0}));
  assert.ok(labels(s).includes('大三元'));assert.ok(!labels(s).includes('中'));assert.ok(labels(s).includes('四季花槓'));assert.ok(!labels(s).some(x=>x.startsWith('正花')));
  const all=[...pung(27),...pung(28),...pung(29),...pung(30),...pung(31),...pair(32)];
  const a=labels(score(all,[],[],context(32,{seat:0})));assert.ok(a.includes('大四喜'));assert.ok(a.includes('字一色'));assert.ok(!a.includes('門風'));assert.ok(!a.includes('圈風'));assert.ok(!a.includes('碰碰胡'));
});
test('大小三元不另加三元台，混一色與清一色互斥',()=>{
  const h=[...pung(31),...pung(32),...seq(0),...seq(3),...seq(6),...pair(33)];
  const l=labels(score(h,[],[],context(33)));assert.ok(l.includes('小三元'));assert.ok(l.includes('混一色'));assert.ok(!l.includes('清一色'));assert.ok(!l.includes('中'));assert.ok(!l.includes('發'));
});
test('全求人不加獨聽；暗槓仍算門清',()=>{
  const melds=[0,9,18,27,31].map(t=>({kind:'pung',tiles:pung(t),open:true}));
  const l=labels(score(pair(7),melds,[],context(7)));assert.ok(l.includes('全求人'));assert.ok(!l.includes('獨聽'));assert.ok(!l.includes('門清'));
  const h=[...seq(3),...seq(9),...seq(18),...seq(21),...pair(7)];
  const s=score(h,[{kind:'kong',tiles:[0,0,0,0],open:false}],[],context(7,{selfDraw:true}));assert.ok(labels(s).includes('門清自摸'));
});
test('莊連台按收付分開，自摸分攤與積分公式正確',()=>{
  const pay=payments(1,1,true,3,0,2);assert.deepEqual(pay.map(p=>p.tai),[8,3,3]);assert.deepEqual(pay.map(p=>p.amount),[260,160,160]);
  assert.deepEqual(payments(0,2,false,0,0,1).map(p=>p.tai),[3]);
});
test('特殊胡牌固定台，零台也可胡',()=>{
  assert.equal(score([],[],[],{special:'天胡'}).tai,16);assert.equal(score([],[],[],{special:'七搶一'}).tai,8);
  const m={kind:'chow',tiles:seq(0),open:true};const s=score(mixed.slice(3),[m],[34],context(18));assert.equal(s.tai,0);
});
function fixture(){const g=new Game({random:rng(1)});g.players.forEach(p=>{p.hand=[];p.melds=[];p.flowers=[];p.river=[];p.passed=false;});g.phase='turn';g.turn=0;g.calls=1;g.discards=5;g.drawInfo={player:0,tile:8,kong:false,last:false};return g;}
test('胡牌先於碰吃，放過胡牌後直到下次摸牌才解鎖',()=>{
  const g=fixture(),before=mixed.slice();before.splice(before.indexOf(0),1);g.players[0].hand=[0];g.players[1].hand=before;
  g.act({type:'discard',tile:0});assert.equal(g.actor,1);assert.equal(g.actions()[0].type,'win');
  g.act({type:'pass'});assert.equal(g.players[1].passed,true);assert.equal(g.canWin(1,0),false);
  while(g.phase==='reaction')g.act({type:'pass'});assert.equal(g.turn,1);assert.equal(g.players[1].passed,false);
});
test('吃碰後少三張且不摸牌，明槓補一張',()=>{
  const g=fixture();g.players[0].hand=[8];g.players[2].hand=[8,8,8,0,1,2,3,4,5,9,10,11,18,19,20,27];
  g.act({type:'discard',tile:8});assert.equal(g.actor,2);g.act({type:'kong'});
  assert.equal(g.turn,2);assert.equal(g.players[2].melds[0].tiles.length,4);assert.equal(g.players[2].hand.length,14);assert.equal(g.drawInfo.kong,true);
});
test('加槓可被搶，完成搶槓前不先補牌；胡牌者得搶槓台',()=>{
  const g=fixture(),before=mixed.slice();before.splice(before.indexOf(0),1);g.players[0].hand=[0];g.players[0].melds=[{kind:'pung',tiles:[0,0,0],open:true}];g.players[1].hand=before;g.drawInfo.tile=0;
  const n=g.wall.length;g.act({type:'addedKong',tile:0,meld:0});assert.equal(g.wall.length,n);assert.equal(g.actor,1);g.act({type:'win'});assert.equal(g.result.rob,true);assert.ok(labels(g.result.scoring).includes('搶槓'));assert.equal(g.wall.length,n);
});
test('不合法出牌不更動狀態，留牌牆底時流局',()=>{
  const g=new Game({random:rng(7)}),before=JSON.stringify(g);assert.equal(g.act({type:'discard',tile:99}),false);assert.equal(JSON.stringify(g),before);
  g.wall=g.wall.slice(0,16);g.draw(g.turn);assert.equal(g.result.draw,true);
});
test('八花／七搶一自動結算，流局及換莊延續正確',()=>{
  const g=fixture();g.players[0].flowers=[34,35,36,37,38,39,40,41];g.checkFlowers();assert.equal(g.result.special,'八仙過海');g.nextRound();assert.equal(g.streak,1);
  g.endDraw();g.nextRound();assert.equal(g.streak,1);assert.equal(g.dealer,0);
  const h=fixture();h.players[1].flowers=[34,35,36,37,38,39,40];h.players[2].flowers=[41];h.checkFlowers();assert.equal(h.result.special,'七搶一');assert.equal(h.result.source,2);h.nextRound();assert.equal(h.dealer,1);assert.equal(h.streak,0);
});
test('150 個隨機完整牌局：牌張守恆、手牌張數、合法動作與零和積分',()=>{
  let wins=0,draws=0;
  for(let seed=1;seed<=150;seed++){
    const g=new Game({random:rng(seed)});let steps=0;
    while(g.phase!=='over'&&steps++<1000){
      invariant(g);const actions=g.actions();assert.ok(actions.length);
      if(g.actor!==0)assert.equal(g.stepAI(),true);
      else {let a=actions.find(a=>a.type==='win')||actions.find(a=>a.type==='concealedKong'||a.type==='addedKong');if(!a&&g.phase==='reaction')a=actions[0];if(!a)a=actions.find(a=>a.type==='discard'&&a.tile===chooseDiscard(g.players[0].hand));assert.equal(g.act(a),true);}
    }
    assert.ok(steps<1000);invariant(g);g.result.draw?draws++:wins++;
    if(!g.result.draw)assert.equal(g.result.scoring.tai,g.result.scoring.items.reduce((s,i)=>s+i.tai,0));
  }
  assert.ok(wins>0);assert.ok(draws>0);
});
