import {RESERVE,sort,counts,decompositions,chowChoices,score,payments} from './rules.mjs';

export function chooseDiscard(hand){
  const c=counts(hand);let best=Infinity,chosen=hand[0];
  for(const t of new Set(hand)){
    let keep=c[t]>=3?12:c[t]===2?7:0;
    if(t<27){for(const delta of [-2,-1,1,2]){const n=t+delta;if(n>=0&&n<27&&Math.floor(n/9)===Math.floor(t/9)&&c[n])keep+=Math.abs(delta)===1?3:1;}
      keep+=(4-Math.abs(4-t%9))*.12;
    }
    if(keep<best){best=keep;chosen=t;}
  }return chosen;
}
const makePlayer=()=>({hand:[],melds:[],flowers:[],river:[],draws:0,passed:false});
export class Game {
  constructor({random=Math.random,base=100,unit=20}={}){
    this.random=random;this.base=base;this.unit=unit;this.dealer=0;this.round=0;this.handNo=0;this.streak=0;this.scores=[0,0,0,0];this.start();
  }
  get actor(){return this.phase==='reaction'?this.offer.player:this.turn;}
  get remaining(){return Math.max(0,this.wall.length-RESERVE);}
  seat(p){return (p-this.dealer+4)%4;}
  log(message){this.history.unshift(message);this.history=this.history.slice(0,80);}
  start(){
    this.players=Array.from({length:4},makePlayer);this.wall=[];this.history=[];this.calls=0;this.discards=0;this.result=null;this.last=null;this.queue=[];this.offer=null;this.drawInfo=null;
    for(let t=0;t<34;t++)for(let n=0;n<4;n++)this.wall.push(t);
    for(let t=34;t<42;t++)this.wall.push(t);
    for(let i=this.wall.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.wall[i],this.wall[j]]=[this.wall[j],this.wall[i]];}
    this.phase='dealing';
    for(let n=0;n<16;n++)for(let i=0;i<4;i++)this.draw((this.dealer+i)%4,false,true);
    for(const p of this.players)sort(p.hand);
    this.turn=this.dealer;this.phase='turn';this.draw(this.dealer,false,true);
    this.checkFlowers();this.log('開局，自動補花完成。莊家先出牌。');
  }
  draw(p,supplement=false,initial=false){
    if(this.wall.length<=RESERVE){this.endDraw();return;}
    const player=this.players[p];player.passed=false;
    if(!initial)player.draws++;
    const kong=supplement;let t;
    do {
      if(this.wall.length<=RESERVE){this.endDraw();return;}
      t=supplement?this.wall.pop():this.wall.shift();
      if(t>=34){player.flowers.push(t);sort(player.flowers);supplement=true;if(!initial)this.log(`${this.label(p)}補花：${this.tileName(t)}`);}
    }while(t>=34);
    player.hand.push(t);sort(player.hand);
    this.drawInfo={player:p,tile:t,kong,last:this.wall.length===RESERVE};
    if(!initial)this.checkFlowers();
  }
  tileName(t){return t<27?`${t%9+1}${['萬','筒','索'][Math.floor(t/9)]}`:['東','南','西','北','中','發','白','春','夏','秋','冬','梅','蘭','菊','竹'][t-27];}
  label(p){return p===0?'你':`電腦${p}`;}
  checkFlowers(){
    if(this.phase==='over')return;
    for(let p=0;p<4;p++){
      if(this.players[p].flowers.length===8){this.finish(p,p,true,'八仙過海');return;}
      if(this.players[p].flowers.length===7){const source=this.players.findIndex((x,i)=>i!==p&&x.flowers.length===1);if(source>=0){this.finish(p,source,false,'七搶一');return;}}
    }
  }
  endDraw(){this.phase='over';this.result={draw:true};this.log('保留十六張，流局。');}
  canWin(p,t,selfDraw=false){const x=this.players[p];return !x.passed&&decompositions(selfDraw?x.hand:[...x.hand,t],x.melds).length>0;}
  actions(){
    if(this.phase==='reaction')return this.offer.actions;
    if(this.phase!=='turn')return [];
    const p=this.turn,x=this.players[p],out=[];
    if(this.drawInfo?.player===p&&this.canWin(p,this.drawInfo.tile,true))out.push({type:'win'});
    if(this.remaining&&this.drawInfo?.player===p){
      const c=counts(x.hand);
      for(let t=0;t<34;t++)if(c[t]===4)out.push({type:'concealedKong',tile:t});
      x.melds.forEach((m,i)=>{if(m.kind==='pung'&&x.hand.includes(m.tiles[0]))out.push({type:'addedKong',tile:m.tiles[0],meld:i});});
    }
    for(const t of new Set(x.hand))out.push({type:'discard',tile:t});return out;
  }
  act(action){
    if(!this.actions().some(a=>JSON.stringify(a)===JSON.stringify(action)))return false;
    const p=this.actor,x=this.players[p];
    if(action.type==='win'){
      const selfDraw=this.phase==='turn';const special=selfDraw&&this.discards===0&&p===this.dealer?'天胡':selfDraw&&p!==this.dealer&&x.draws===1&&!this.calls?'地胡':null;
      this.finish(p,selfDraw?p:this.last.player,selfDraw,special);return true;
    }
    if(action.type==='pass'){
      if(this.offer.actions.some(a=>a.type==='win'))x.passed=true;
      this.nextOffer();return true;
    }
    if(action.type==='discard'){
      this.remove(p,[action.tile]);x.river.push(action.tile);this.last={player:p,tile:action.tile,claimed:false,last:!!this.drawInfo?.last,rob:false};this.discards++;
      this.log(`${this.label(p)}打出 ${this.tileName(action.tile)}`);this.drawInfo=null;this.reactions();return true;
    }
    if(action.type==='concealedKong'){
      this.remove(p,Array(4).fill(action.tile));x.melds.push({kind:'kong',tiles:Array(4).fill(action.tile),open:false});this.calls++;this.log(`${this.label(p)}暗槓`);this.draw(p,true);return true;
    }
    if(action.type==='addedKong'){
      this.last={player:p,tile:action.tile,rob:true,last:false};this.upgrade=action;this.queue=this.winOffers(p,action.tile);this.afterOffers='upgrade';this.nextOffer();return true;
    }
    const t=this.last.tile,from=this.last.player;
    this.last.claimed=true;this.players[from].river.pop();this.turn=p;this.phase='turn';this.calls++;this.queue=[];this.drawInfo=null;
    if(action.type==='chow'){
      this.remove(p,action.need);x.melds.push({kind:'chow',tiles:sort([...action.need,t]),open:true,from});
    }else{
      const n=action.type==='kong'?3:2;this.remove(p,Array(n).fill(t));x.melds.push({kind:action.type==='kong'?'kong':'pung',tiles:Array(n+1).fill(t),open:true,from});
    }
    this.log(`${this.label(p)}${{chow:'吃',pong:'碰',kong:'槓'}[action.type]} ${this.tileName(t)}`);
    if(action.type==='kong')this.draw(p,true);return true;
  }
  remove(p,tiles){for(const t of tiles){const i=this.players[p].hand.indexOf(t);if(i<0)throw Error('手牌不足');this.players[p].hand.splice(i,1);}}
  winOffers(source,t){return [1,2,3].map(i=>(source+i)%4).filter(p=>this.canWin(p,t)).map(player=>({player,actions:[{type:'win'},{type:'pass'}]}));}
  reactions(){
    const {player:source,tile:t}=this.last;this.queue=this.winOffers(source,t);
    for(let n=1;n<4;n++){
      const p=(source+n)%4,c=counts(this.players[p].hand),actions=[];
      if(c[t]>=3&&this.remaining)actions.push({type:'kong'});
      if(c[t]>=2)actions.push({type:'pong'});
      if(actions.length)this.queue.push({player:p,actions:[...actions,{type:'pass'}]});
    }
    const next=(source+1)%4,choices=chowChoices(this.players[next].hand,t);
    if(choices.length)this.queue.push({player:next,actions:[...choices.map(need=>({type:'chow',need})),{type:'pass'}]});
    this.afterOffers='draw';this.nextOffer();
  }
  nextOffer(){
    if(this.queue.length){this.offer=this.queue.shift();this.phase='reaction';return;}
    if(this.afterOffers==='upgrade'){
      const p=this.last.player,x=this.players[p],a=this.upgrade;this.remove(p,[a.tile]);x.melds[a.meld]={...x.melds[a.meld],kind:'kong',tiles:Array(4).fill(a.tile)};this.calls++;this.turn=p;this.phase='turn';this.drawInfo=null;this.log(`${this.label(p)}加槓 ${this.tileName(a.tile)}`);this.draw(p,true);
    }else{this.turn=(this.last.player+1)%4;this.phase='turn';this.drawInfo=null;this.draw(this.turn);}
  }
  stepAI(){
    if(this.phase==='over'||this.actor===0)return false;
    const actions=this.actions();let a=actions.find(a=>a.type==='win');
    if(!a&&this.phase==='reaction')a=actions[0];
    if(!a)a=actions.find(a=>a.type==='concealedKong'||a.type==='addedKong');
    if(!a){const t=chooseDiscard(this.players[this.turn].hand);a=actions.find(a=>a.type==='discard'&&a.tile===t);}
    return this.act(a);
  }
  finish(winner,source,selfDraw,special=null){
    const x=this.players[winner],rob=!selfDraw&&!!this.last?.rob;
    const tile=selfDraw?this.drawInfo?.tile:this.last?.tile;
    const flowerWin=special==='八仙過海'||special==='七搶一';
    const hand=selfDraw||flowerWin?[...x.hand]:[...x.hand,tile];
    const scoring=score(hand,x.melds,x.flowers,{winTile:tile,selfDraw,seat:this.seat(winner),round:this.round,kong:selfDraw&&this.drawInfo?.kong,rob,last:selfDraw?this.drawInfo?.last:this.last?.last,special});
    if(!scoring)throw Error('無效胡牌');
    const pay=payments(winner,source,selfDraw,scoring.tai,this.dealer,this.streak,this.base,this.unit);
    pay.forEach(r=>{this.scores[r.from]-=r.amount;this.scores[r.to]+=r.amount;});
    this.phase='over';this.result={winner,source,selfDraw,special,hand,tile,scoring,pay,rob};this.log(`${this.label(winner)}${selfDraw?'自摸':'胡牌'}，牌型 ${scoring.tai} 台。`);
  }
  nextRound(){
    if(this.phase!=='over')return false;
    if(!this.result.draw){if(this.result.winner===this.dealer)this.streak++;else{this.dealer=(this.dealer+1)%4;this.streak=0;this.handNo++;if(this.handNo%4===0)this.round=(this.round+1)%4;}}
    this.start();return true;
  }
}
