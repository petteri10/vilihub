let users = new Map();
let games = new Map();
let packages = [
  {id:'starter', name:'Starter Pack', price:0, items:['Blue Spark','Classic']},
  {id:'neon', name:'Neon Pack', price:100, items:['Neon','Purple Pulse']},
  {id:'legend', name:'Legend Pack', price:300, items:['Gold Crown','Legend']}
];
const questions = [
  {q:'Mikä on Suomen pääkaupunki?',a:['Turku','Helsinki','Tampere','Oulu'],c:1},
  {q:'Kuinka monta päivää normaalissa vuodessa on?',a:['360','365','366','364'],c:1},
  {q:'Mikä planeetta tunnetaan punaisena planeettana?',a:['Mars','Venus','Jupiter','Merkurius'],c:0},
  {q:'Mikä on 9 × 7?',a:['56','63','72','69'],c:1},
  {q:'Mikä eläin tunnetaan ihmisen parhaana ystävänä?',a:['Kissa','Koira','Hevonen','Kani'],c:1},
  {q:'Mikä näistä on ohjelmointikieli?',a:['HTML','Python','JPEG','WiFi'],c:1},
  {q:'Kuinka monta mannerta maapallolla yleensä lasketaan?',a:['5','6','7','8'],c:2},
  {q:'Mikä on veden kemiallinen kaava?',a:['CO2','O2','H2O','NaCl'],c:2}
];
function json(res, data, status=200){res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));}
function body(req){return new Promise(resolve=>{let s='';req.on('data',x=>s+=x);req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch{resolve({})}})});}
function cleanUser(u){return {username:u.username,coins:u.coins,xp:u.xp,level:u.level,inventory:u.inventory,skin:u.skin,stats:u.stats};}
function code(){let x;do{x=String(Math.floor(100000+Math.random()*900000))}while(games.has(x));return x;}
module.exports=async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const path=url.pathname;
  if(req.method==='GET' && path==='/api/health') return json(res,{ok:true,service:'ViliQuiz API',version:'3.0'});
  if(req.method==='GET' && path==='/api/questions') return json(res,{questions});
  if(req.method==='GET' && path==='/api/packages') return json(res,{packages});
  const b=await body(req);
  if(req.method==='POST' && path==='/api/register'){
    const username=String(b.username||'').trim(); const password=String(b.password||'');
    if(username.length<3||password.length<4)return json(res,{error:'Käyttäjänimen pitää olla vähintään 3 merkkiä ja salasanan 4.'},400);
    if(users.has(username.toLowerCase()))return json(res,{error:'Käyttäjänimi on jo käytössä.'},409);
    const u={username,password,coins:100,xp:0,level:1,inventory:['Classic'],skin:'Classic',stats:{games:0,wins:0,correct:0}}; users.set(username.toLowerCase(),u); return json(res,{ok:true,user:cleanUser(u)});
  }
  if(req.method==='POST' && path==='/api/login'){
    const u=users.get(String(b.username||'').toLowerCase()); if(!u||u.password!==String(b.password||''))return json(res,{error:'Väärä käyttäjänimi tai salasana.'},401); return json(res,{ok:true,user:cleanUser(u)});
  }
  if(req.method==='POST' && path==='/api/create'){
    const username=String(b.username||''); if(!users.has(username.toLowerCase()))return json(res,{error:'Kirjaudu ensin.'},401);
    const g={code:code(),host:username,players:[username],mode:['Classic','Speed','Battle','Survival','Treasure'].includes(b.mode)?b.mode:'Classic',count:Math.min(8,Math.max(5,Number(b.count)||8)),started:false,index:0,answers:{},scores:{[username]:0},finished:false}; games.set(g.code,g); return json(res,{ok:true,game:g});
  }
  if(req.method==='POST' && path==='/api/join'){
    const username=String(b.username||''); const g=games.get(String(b.code||'')); if(!users.has(username.toLowerCase()))return json(res,{error:'Kirjaudu ensin.'},401); if(!g)return json(res,{error:'Peliä ei löytynyt.'},404); if(g.started)return json(res,{error:'Peli on jo alkanut.'},409); if(!g.players.includes(username))g.players.push(username); g.scores[username]=g.scores[username]||0; return json(res,{ok:true,game:g});
  }
  if(req.method==='GET' && path==='/api/game'){
    const g=games.get(url.searchParams.get('code')); if(!g)return json(res,{error:'Peliä ei löytynyt.'},404); return json(res,{ok:true,game:g,questions:questions.slice(0,g.count)});
  }
  if(req.method==='POST' && path==='/api/start'){
    const g=games.get(String(b.code||'')); if(!g)return json(res,{error:'Peliä ei löytynyt.'},404); if(g.host!==b.username && b.admin!==true)return json(res,{error:'Vain host tai admin voi aloittaa.'},403); g.started=true; g.index=0; return json(res,{ok:true,game:g,question:questions[0]});
  }
  if(req.method==='POST' && path==='/api/answer'){
    const g=games.get(String(b.code||'')); if(!g||!g.started)return json(res,{error:'Peli ei ole käynnissä.'},400); const i=Number(b.index); if(i!==g.index)return json(res,{error:'Tämä kysymys ei ole enää aktiivinen.'},409); const u=users.get(String(b.username||'').toLowerCase()); const correct=Number(b.answer)===questions[i].c; if(correct){g.scores[b.username]=(g.scores[b.username]||0)+100; if(u){u.coins+=10;u.xp+=20;u.stats.correct++;u.level=1+Math.floor(u.xp/100)}} g.answers[b.username]=i; const done=Object.keys(g.answers).length>=g.players.length; if(done){g.index++;g.answers={};if(g.index>=g.count){g.finished=true;g.started=false;for(const p of g.players){const pu=users.get(p.toLowerCase());if(pu){pu.stats.games++;}}} } return json(res,{ok:true,correct,game:g,nextQuestion:g.finished?null:questions[g.index]});
  }
  if(req.method==='POST' && path==='/api/buy'){
    const u=users.get(String(b.username||'').toLowerCase()); const p=packages.find(x=>x.id===b.id); if(!u||!p)return json(res,{error:'Tietoja ei löytynyt.'},404); if(u.coins<p.price)return json(res,{error:'Kolikoita ei ole tarpeeksi.'},400); u.coins-=p.price; for(const item of p.items)if(!u.inventory.includes(item))u.inventory.push(item); return json(res,{ok:true,user:cleanUser(u),package:p});
  }
  if(req.method==='POST' && path==='/api/equip'){
    const u=users.get(String(b.username||'').toLowerCase()); if(!u||!u.inventory.includes(b.item))return json(res,{error:'Esinettä ei löytynyt.'},404); u.skin=b.item; return json(res,{ok:true,user:cleanUser(u)});
  }
  if(req.method==='POST' && path==='/api/admin'){
    if(String(b.password||'')!=='blooket123')return json(res,{error:'Väärä admin-salasana.'},403);
    if(b.action==='addPackage'){const p={id:'pkg_'+Date.now(),name:String(b.name||'Uusi paketti'),price:Math.max(0,Number(b.price)||0),items:String(b.items||'').split(',').map(x=>x.trim()).filter(Boolean)};packages.push(p);return json(res,{ok:true,packages});}
    if(b.action==='giveCoins'){const u=users.get(String(b.username||'').toLowerCase());if(!u)return json(res,{error:'Käyttäjää ei löytynyt.'},404);u.coins+=Number(b.amount)||0;return json(res,{ok:true,user:cleanUser(u)});}
    if(b.action==='list'){return json(res,{ok:true,online:[],users:[...users.values()].map(cleanUser),games:[...games.values()],packages});}
    if(b.action==='kick'){games.forEach(g=>g.players=g.players.filter(p=>p.toLowerCase()!==String(b.username||'').toLowerCase()));return json(res,{ok:true});}
  }
  if(path==='/'||path==='/index.html')return res.end('ViliQuiz');
  return json(res,{error:'Not Found'},404);
};
