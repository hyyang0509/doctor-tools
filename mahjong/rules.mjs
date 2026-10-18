// 本桌固定台規；UI 與計分共用，修改數字不需改畫面。
export const RULES = [
  ['門清',1,'沒有吃、碰或明槓；暗槓仍算門清。'],
  ['自摸',1,'自己摸進胡牌張。'],
  ['門清自摸',3,'合計三台，取代門清及自摸。'],
  ['獨聽',1,'胡牌前僅有一種合法可胡的牌；全求人不重複加。'],
  ['三元牌',1,'中、發、白，每組刻子／槓各一台；大小三元不再另加。'],
  ['門風／圈風',1,'符合風位的刻子／槓各一台，同為東風可累加。'],
  ['正花',1,'東南西北對應花牌編號一二三四，每張一台。'],
  ['花槓',2,'同組四季或四君子齊全，每組二台，取代該組正花。'],
  ['平胡',2,'五順一對、無字無花、非自摸，胡在兩面順子，且至少兩種聽牌。'],
  ['全求人',2,'五組皆明露，胡他家捨牌；不再加獨聽。'],
  ['半求人',1,'五組皆明露，最後自摸；可另加自摸與獨聽。'],
  ['碰碰胡',4,'五組刻子／槓及一對將。'],
  ['三／四／五暗刻','2／5／8','僅取最高一項；放槍補成的刻子不算暗刻。五暗刻可加碰碰胡。'],
  ['混一色',4,'一種數牌加字牌。'],
  ['清一色',8,'只有一種數牌。'],
  ['字一色',16,'全為字牌，取代碰碰胡。'],
  ['小／大三元','4／8','兩組三元刻子加三元將／三組三元刻子。'],
  ['小／大四喜','8／16','三組風刻加風將／四組風刻；取代門風、圈風。'],
  ['槓上開花',1,'槓後補牌自摸；補花不加這一台。'],
  ['搶槓',1,'搶他家加槓的第四張；暗槓不能搶。'],
  ['海底／河底',1,'最後可摸的一張自摸／胡最後捨牌；與搶槓不重複。'],
  ['天胡／地胡',16,'莊家起手胡／無吃碰槓時閒家首次摸牌自摸。只計十六台，再加適用莊連台。'],
  ['八仙過海／七搶一',8,'八花視為自摸；七花加另一家一花，由持一花者付。只計八台，再加適用莊連台。'],
  ['莊家',1,'該筆收付任一方為莊家，加一台。'],
  ['連莊',2,'連莊次數乘二台，僅加在涉及莊家的收付。流局留莊但不增加連莊次數。']
];
export const WINDS=['東','南','西','北'];
export const FLOWERS=['春','夏','秋','冬','梅','蘭','菊','竹'];
export const FLOWER_EMOJI={38:'🌸',39:'🌺',40:'🌼',41:'🎋'};
export const flowerLabel=t=>FLOWER_EMOJI[t]?`${FLOWER_EMOJI[t]}${name(t)}`:name(t);
export const RESERVE=16;
export const name=t=>t<27?`${t%9+1}${['萬','筒','索'][Math.floor(t/9)]}`:t<34?['東','南','西','北','中','發','白'][t-27]:FLOWERS[t-34];
export const sort=h=>h.sort((a,b)=>a-b);
export function counts(hand){const c=Array(34).fill(0); for(const t of hand){if(!Number.isInteger(t)||t<0||t>33)return null;c[t]++;if(c[t]>4)return null;}return c;}

// 枚舉所有五面子一雀頭的拆法，不能用第一個拆法直接計台。
export function decompositions(hand,melds=[]){
  if(melds.length>5||hand.length!==17-3*melds.length)return [];
  const c=counts(hand);if(!c)return [];
  const total=[...hand,...melds.flatMap(m=>m.tiles)];if(!counts(total))return [];
  const out=[];
  function groups(left,acc,pair){
    const t=c.findIndex(n=>n>0);if(t<0){if(!left)out.push({pair,groups:acc});return;}
    if(left===0)return;
    if(c[t]>=3){c[t]-=3;groups(left-1,[...acc,{kind:'pung',tiles:[t,t,t],open:false}],pair);c[t]+=3;}
    if(t<27&&t%9<=6&&c[t+1]&&c[t+2]){c[t]--;c[t+1]--;c[t+2]--;groups(left-1,[...acc,{kind:'chow',tiles:[t,t+1,t+2],open:false}],pair);c[t]++;c[t+1]++;c[t+2]++;}
  }
  for(let p=0;p<34;p++)if(c[p]>=2){c[p]-=2;groups(5-melds.length,[],p);c[p]+=2;}
  return out;
}
export function waits(hand,melds=[]){
  if(hand.length!==16-3*melds.length)return [];
  const c=counts([...hand,...melds.flatMap(m=>m.tiles)]);if(!c)return [];
  return c.flatMap((n,t)=>n<4&&decompositions([...hand,t],melds).length?[t]:[]);
}
export function chowChoices(hand,t){
  if(t>=27)return [];
  const c=counts(hand),out=[];if(!c)return out;
  for(let start=t-2;start<=t;start++)if(start>=0&&start%9<=6&&Math.floor(start/9)===Math.floor(t/9)){
    const need=[start,start+1,start+2];need.splice(need.indexOf(t),1);if(need.every(x=>c[x]))out.push(need);
  }return out;
}
export function score(hand,melds=[],flowers=[],ctx={}){
  const {selfDraw=false,winTile,seat=0,round=0,kong=false,rob=false,last=false,special=null}=ctx;
  if(special){const tai=special==='天胡'||special==='地胡'?16:8;return {tai,items:[{label:special,tai,reason:'特殊胡牌依本桌規則單獨計台'}],groups:[],pair:null};}
  const ds=decompositions(hand,melds);if(!ds.length)return null;
  const before=[...hand];const wi=before.indexOf(winTile);if(wi<0)return null;before.splice(wi,1);
  const listening=waits(before,melds),closed=melds.every(m=>!m.open);
  const all=[...hand,...melds.flatMap(m=>m.tiles)],suits=new Set(all.filter(t=>t<27).map(t=>Math.floor(t/9))),honors=all.some(t=>t>=27);
  let best=null;
  for(const d of ds){
    // 胡牌張可落在不同面子；逐一判斷暗刻及兩面，取合法最高台。
    const positions=[...(d.pair===winTile?[-1]:[]),...d.groups.flatMap((g,i)=>g.tiles.includes(winTile)?[i]:[])];
    for(const pos of positions){
      const items=[],add=(label,tai,reason)=>items.push({label,tai,reason});
      const gs=[...d.groups,...melds],trip=gs.filter(g=>g.kind!=='chow').map(g=>g.tiles[0]);
      const dragons=trip.filter(t=>t>=31).length,wind=trip.filter(t=>t>=27&&t<=30).length;
      if(closed&&selfDraw)add('門清自摸',3,'門清 1 ＋自摸 1 ＋不求人 1，合計不重複');
      else {if(closed)add('門清',1,'只有暗手與暗槓');if(selfDraw)add('自摸',1,'自己摸進胡牌張');}
      const full=melds.length===5&&melds.every(m=>m.open);
      if(full)add(selfDraw?'半求人':'全求人',selfDraw?1:2,'五組面子皆已明露');
      if(listening.length===1&&!(full&&!selfDraw))add('獨聽',1,`只聽 ${name(winTile)}（按牌種判定）`);
      if(dragons===3)add('大三元',8,'中、發、白皆為刻子或槓');
      else if(dragons===2&&d.pair>=31)add('小三元',4,'兩組三元刻子及三元將');
      else for(const t of trip.filter(t=>t>=31))add(name(t),1,`${name(t)}刻子／槓`);
      if(wind===4)add('大四喜',16,'四種風刻子／槓');
      else if(wind===3&&d.pair>=27&&d.pair<=30)add('小四喜',8,'三種風刻及另一風將');
      else {if(trip.includes(27+seat))add('門風',1,`${WINDS[seat]}風刻子／槓`);if(trip.includes(27+round))add('圈風',1,`${WINDS[round]}風刻子／槓`);}
      if(!suits.size)add('字一色',16,'全為字牌，不再加碰碰胡');
      else {if(suits.size===1)add(honors?'混一色':'清一色',honors?4:8,honors?'一種數牌加字牌':'只有一種數牌');if(gs.every(g=>g.kind!=='chow'))add('碰碰胡',4,'五組刻子／槓');}
      const concealed=gs.filter((g,i)=>g.kind!=='chow'&&!g.open&&(selfDraw||i!==pos)).length;
      if(concealed>=3)add(`${['','','','三','四','五'][concealed]}暗刻`,[0,0,0,2,5,8][concealed],'只計最高暗刻階；放槍湊成刻子不算暗刻');
      const winning=pos>=0?d.groups[pos]:null;
      const twoSided=winning?.kind==='chow'&&((winTile===winning.tiles[0]&&winTile%9<=5)||(winTile===winning.tiles[2]&&winTile%9>=3));
      if(!selfDraw&&!flowers.length&&!honors&&gs.every(g=>g.kind==='chow')&&twoSided&&listening.length>=2)add('平胡',2,'五順一對、無字花、兩面聽且非自摸');
      for(let family=0;family<2;family++){
        const f=flowers.filter(t=>Math.floor((t-34)/4)===family);
        if(f.length===4)add(family?'四君子花槓':'四季花槓',2,'同組四花齊，不再重複計正花');
        else for(const t of f)if((t-34)%4===seat)add(`正花・${name(t)}`,1,`${WINDS[seat]}位對應第 ${seat+1} 花`);
      }
      if(kong&&selfDraw)add('槓上開花',1,'槓後補牌胡牌');
      if(rob)add('搶槓',1,'胡他家加槓張');
      else if(last)add(selfDraw?'海底撈月':'河底撈魚',1,'最後可摸牌的胡牌');
      const tai=items.reduce((s,x)=>s+x.tai,0);
      if(!best||tai>best.tai)best={tai,items,groups:gs,pair:d.pair,waits:listening};
    }
  }return best;
}

export function payments(winner,source,selfDraw,tai,dealer,streak,base=100,unit=20){
  return [0,1,2,3].filter(p=>p!==winner&&(selfDraw||p===source)).map(p=>{
    const dealerTai=p===dealer||winner===dealer?1:0,chainTai=dealerTai?streak*2:0;
    const totalTai=tai+dealerTai+chainTai;
    return {from:p,to:winner,tai:totalTai,dealerTai,chainTai,amount:base+unit*totalTai};
  });
}
