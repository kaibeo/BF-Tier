// ═══════════════════════════════════════════════════════════
//  LEADERBOARD
// ═══════════════════════════════════════════════════════════
function initModeButtons(){
  const wrap=$id('modeButtons');
  wrap.innerHTML=MODES.map(m=>`<button class="pill-btn${m===lbMode?' active':''}" onclick="setLbMode('${m}')">${m}</button>`).join('');
}
function setLbMode(m){lbMode=m;initModeButtons();renderLeaderboard()}

function podiumAvatarHTML(robloxId,username,size,ringClass){
  const initials=username.slice(0,2).toUpperCase();
  return`<div class="podium-avatar ${ringClass}" style="width:${size}px;height:${size}px">
    <img src="https://corsproxy.io/?https://www.roblox.com/headshot-thumbnail/image?userId=${robloxId}&width=150&height=150&format=Png" alt="${username}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="podium-avatar-fallback" style="font-size:${Math.round(size*.34)}px;background:linear-gradient(135deg,#FFD700,#B8860B)">${initials}</div>
  </div>`;
}

function renderLeaderboard(){
  const search=($id('lbSearch')||{value:''}).value.toLowerCase();
  const region=($id('lbRegion')||{value:'Global'}).value;
  let players=[...PLAYERS];
  if(region!=='Global') players=players.filter(p=>p.region===region);
  if(search) players=players.filter(p=>p.username.toLowerCase().includes(search));
  const modeKeyMap={"Overall":"overall","Solo":"1v1","Dual":"2v2","Speed Run":"speedrun"};
  const modeKey=modeKeyMap[lbMode]||'overall';
  players.sort((a,b)=>rankSortValue(b.rank)-rankSortValue(a.rank)||(b.scores[modeKey]||0)-(a.scores[modeKey]||0));

  // stats bar
  const stats=$id('lbStats');
  stats.innerHTML=[['Total Players',PLAYERS.length],['Region',region],['Mode',lbMode],['Season','7']].map(([l,v])=>
    `<div class="card stat-card"><div class="stat-label">${l}</div><div class="stat-val">${v}</div></div>`
  ).join('');

  const podiumEl=$id('lbPodium');
  const body=$id('lbBody');
  const restCard=$id('lbRestCard');

  if(players.length===0){
    podiumEl.innerHTML='';
    body.innerHTML=`<div style="padding:48px;text-align:center;color:rgba(255,255,255,0.3)"><div style="font-size:32px;margin-bottom:8px">🔍</div>No players found</div>`;
    return;
  }

  // ── PODIUM (top 3 or fewer) ──
  const top3=players.slice(0,Math.min(3,players.length));
  const rest=players.slice(3);

  // Reorder for podium: 2nd left, 1st center, 3rd right
  const podiumOrder=top3.length===3
    ?[top3[1],top3[0],top3[2]]
    :top3.length===2?[top3[1],top3[0]]:top3;

  const ringClass=['podium-ring-2','podium-ring-1','podium-ring-3'];
  const colClass=['podium-col-2','podium-col-1','podium-col-3'];
  const placeNum=[2,1,3];
  const placeLabel=['2nd','1st','3rd'];
  const numBg=['#C0C0C0','#FFD700','#CD7F32'];

  // map display index back to actual place
  const actualPlaceOf=player=>top3.indexOf(player)+1;

  // top3 header
  const top3Header=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
    <div style="flex:1;height:1px;background:linear-gradient(90deg,rgba(255,215,0,0.3),transparent)"></div>
    <span style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,215,0,0.45);white-space:nowrap">🏆 Season 7 · Top Players</span>
    <div style="flex:1;height:1px;background:linear-gradient(270deg,rgba(255,215,0,0.3),transparent)"></div>
  </div>`;

  podiumEl.innerHTML=top3Header+top3.map((p,i)=>{
    const place=i+1;
    const ds=calcDS(p.scores);
    const init=p.username.slice(0,2).toUpperCase();
    const medal=place===1?'👑':place===2?'🥈':'🥉';
    return`<div class="lb-card lb-card-${place}" onclick="navigate('player',PLAYERS.find(x=>x.id===${p.id}))">
      <div class="lb-accent"></div>
      <div class="lb-rank-block">
        <div class="lb-medal">${medal}</div>
        <div class="lb-rank-num">${place}</div>
      </div>
      <div class="lb-av-wrap">
        <div class="lb-av">
          <img src="https://corsproxy.io/?https://www.roblox.com/headshot-thumbnail/image?userId=${p.robloxId}&width=150&height=150&format=Png" alt="${p.username}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="lb-av-fb">${init}</div>
        </div>
      </div>
      <div class="lb-info">
        <div class="lb-name">${p.username}${verificationBadges(p.username)}</div>
        <div class="lb-sub">${rankBadgeHTML(p.rank,true,true)}<span class="lb-reg">${p.region}</span><span class="lb-wr">${p.winRate}% WR</span></div>
      </div>
      <div class="lb-score-block">
        <div class="lb-score-lbl">DS Score</div>
        <div class="lb-score">${ds.toLocaleString()}</div>
        <div class="lb-score-unit">points</div>
      </div>
    </div>`;
  }).join('');

  // ── REST (4th onwards) ──
  if(rest.length===0){restCard.style.display='none';return;}
  restCard.style.display='block';
  body.innerHTML=`<div class="card" style="overflow:hidden">`+rest.map((p,i)=>{
    const ds=calcDS(p.scores);
    const place=i+4;
    const init=p.username.slice(0,2).toUpperCase();
    return`<div class="lb-card lb-card-rest" style="animation-delay:${(i*0.035).toFixed(3)}s" onclick="navigate('player',PLAYERS.find(x=>x.id===${p.id}))">
      <div class="lb-accent"></div>
      <div class="lb-rank-block">
        <div class="lb-rank-num">${place}</div>
      </div>
      <div class="lb-av-wrap">
        <div class="lb-av">
          <img src="https://corsproxy.io/?https://www.roblox.com/headshot-thumbnail/image?userId=${p.robloxId}&width=150&height=150&format=Png" alt="${p.username}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="lb-av-fb">${init}</div>
        </div>
      </div>
      <div class="lb-info">
        <div class="lb-name">${p.username}${verificationBadges(p.username)}</div>
        <div class="lb-sub">${rankBadgeHTML(p.rank,true,false)}<span class="lb-reg">${p.region}</span><span class="lb-wr">${p.winRate}% WR</span></div>
      </div>
      <div class="lb-score-block">
        <div class="lb-score-lbl">DS Score</div>
        <div class="lb-score">${ds.toLocaleString()}</div>
        <div class="lb-score-unit">points</div>
      </div>
    </div>`;
  }).join('')+`</div>`;
  // Apply scroll reveal to newly rendered rows
  setTimeout(()=>{ if(window.applyScrollReveal) applyScrollReveal(document.getElementById('page-home')); },30);
}

// ═══════════════════════════════════════════════════════════
//  DS RANKINGS
// ═══════════════════════════════════════════════════════════
function initDSRegionBtns(){
  const wrap=$id('dsRegionBtns');
  const regs=["Global","Vietnam","Thailand","Indonesia","Philippines"];
  wrap.innerHTML=regs.map(r=>`<button class="tag-btn${r===dsRegion?' active':''}" onclick="setDSRegion('${r}')">${r}</button>`).join('');
}
function setDSRegion(r){dsRegion=r;initDSRegionBtns();renderDS()}

function renderDS(){
  initDSRegionBtns();
  let players=[...PLAYERS];
  if(dsRegion!=='Global') players=players.filter(p=>p.region===dsRegion);
  players.sort((a,b)=>rankSortValue(b.rank)-rankSortValue(a.rank)||calcDS(b.scores)-calcDS(a.scores));

  const dsTop3=players.slice(0,Math.min(3,players.length));
  const dsRest=players.slice(3);

  // ── DS TOP 3 PODIUM CARDS ──
  const dsTop3Header=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
    <div style="flex:1;height:1px;background:linear-gradient(90deg,rgba(236,72,153,0.3),transparent)"></div>
    <span style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(236,72,153,0.55);white-space:nowrap">🏆 DS Rankings · Top Scorers</span>
    <div style="flex:1;height:1px;background:linear-gradient(270deg,rgba(236,72,153,0.3),transparent)"></div>
  </div>`;

  const dsPodiumHTML=dsTop3.map((p,i)=>{
    const place=i+1;
    const ds=calcDS(p.scores);
    const init=p.username.slice(0,2).toUpperCase();
    const medal=place===1?'👑':place===2?'🥈':'🥉';
    // Find tier for this player in Overall mode
    const tierLabel=Object.entries(TIER_LIST_DATA.Overall).find(([,names])=>names.includes(p.username))?.[0]||null;
    return`<div class="lb-card lb-card-${place}" onclick="navigate('player',PLAYERS.find(x=>x.id===${p.id}))">
      <div class="lb-accent" style="${place===1?'background:linear-gradient(180deg,#ec4899,#9d174d,#ec4899)':place===2?'background:linear-gradient(180deg,#C0C0C0,#999,#C0C0C0)':'background:linear-gradient(180deg,#CD7F32,#8B5513,#CD7F32)'}"></div>
      <div class="lb-rank-block">
        <div class="lb-medal">${medal}</div>
        <div class="lb-rank-num">${place}</div>
      </div>
      <div class="lb-av-wrap">
        <div class="lb-av">
          <img src="https://corsproxy.io/?https://www.roblox.com/headshot-thumbnail/image?userId=${p.robloxId}&width=150&height=150&format=Png" alt="${p.username}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="lb-av-fb">${init}</div>
        </div>
      </div>
      <div class="lb-info">
        <div class="lb-name">${p.username}${verificationBadges(p.username)}</div>
        <div class="lb-sub">
          ${rankBadgeHTML(p.rank,true,true)}
          <span class="lb-reg">${p.region}</span>
          ${tierLabel?`<span style="background:rgba(255,165,0,0.12);border:1px solid rgba(255,165,0,0.3);border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;color:#FFA500">Tier ${tierLabel}</span>`:''}
        </div>
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
          <span style="font-size:10px;color:rgba(255,255,255,0.3);font-family:monospace">Solo:${p.scores['1v1']||0}</span>
          <span style="font-size:10px;color:rgba(255,255,255,0.2)">·</span>
          <span style="font-size:10px;color:rgba(255,255,255,0.3);font-family:monospace">1v2:${p.scores['1v2']||0}</span>
          <span style="font-size:10px;color:rgba(255,255,255,0.2)">·</span>
          <span style="font-size:10px;color:rgba(255,255,255,0.3);font-family:monospace">Dual:${p.scores['2v2']||0}</span>
          <span style="font-size:10px;color:rgba(255,255,255,0.2)">·</span>
          <span style="font-size:10px;color:rgba(255,255,255,0.3);font-family:monospace">SR:${p.scores.speedrun||0}</span>
        </div>
      </div>
      <div class="lb-score-block">
        <div class="lb-score-lbl">DS Score</div>
        <div class="lb-score" style="${place===1?'color:#ec4899;text-shadow:0 0 14px rgba(236,72,153,0.5)':place===2?'color:#C0C0C0':'color:#CD7F32'}">${ds.toLocaleString()}</div>
        <div class="lb-score-unit">points</div>
      </div>
    </div>`;
  }).join('');

  // ── DS REST CARDS ──
  const dsRestHTML=dsRest.length===0?'':
    `<div class="card" style="overflow:hidden;margin-top:0">`+dsRest.map((p,i)=>{
      const ds=calcDS(p.scores);
      const place=i+4;
      const init=p.username.slice(0,2).toUpperCase();
      const tierLabel=Object.entries(TIER_LIST_DATA.Overall).find(([,names])=>names.includes(p.username))?.[0]||null;
      return`<div class="lb-card lb-card-rest" style="animation-delay:${(i*0.035).toFixed(3)}s" onclick="navigate('player',PLAYERS.find(x=>x.id===${p.id}))">
        <div class="lb-accent"></div>
        <div class="lb-rank-block">
          <div class="lb-rank-num">${place}</div>
        </div>
        <div class="lb-av-wrap">
          <div class="lb-av">
            <img src="https://corsproxy.io/?https://www.roblox.com/headshot-thumbnail/image?userId=${p.robloxId}&width=150&height=150&format=Png" alt="${p.username}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="lb-av-fb">${init}</div>
          </div>
        </div>
        <div class="lb-info">
          <div class="lb-name">${p.username}${verificationBadges(p.username)}</div>
          <div class="lb-sub">
            ${rankBadgeHTML(p.rank,true,false)}
            <span class="lb-reg">${p.region}</span>
            ${tierLabel?`<span style="background:rgba(255,165,0,0.08);border:1px solid rgba(255,165,0,0.2);border-radius:3px;padding:1px 5px;font-size:9px;font-weight:700;color:rgba(255,165,0,0.7)">Tier ${tierLabel}</span>`:''}
            <span class="lb-wr" style="font-family:monospace;font-size:10px">S:${p.scores['1v1']||0} · 1v2:${p.scores['1v2']||0} · D:${p.scores['2v2']||0}</span>
          </div>
        </div>
        <div class="lb-score-block">
          <div class="lb-score-lbl">DS Score</div>
          <div class="lb-score">${ds.toLocaleString()}</div>
          <div class="lb-score-unit">points</div>
        </div>
      </div>`;
    }).join('')+`</div>`;

  const dsBodyEl=$id('dsBody');
  dsBodyEl.innerHTML=dsTop3Header+dsPodiumHTML+dsRestHTML;
}

// ═══════════════════════════════════════════════════════════
//  TIER LIST
// ═══════════════════════════════════════════════════════════
// Generate TIER_META_STYLE for all 40 tiers dynamically
const TIER_META_STYLE=(()=>{
  const styles={};
  for(let n=1;n<=10;n++){
    // OT — gold glow, most prominent
    styles['OT'+n]={
      bg:`rgba(255,215,0,${0.10-n*0.007})`,
      border:`rgba(255,215,0,${0.45-n*0.03})`,
      label:"#FFD700",
      tag:`rgba(255,215,0,${0.18-n*0.01})`,
      glow:true
    };
    // HT — silver/platinum
    styles['HT'+n]={
      bg:`rgba(192,192,192,${0.07-n*0.005})`,
      border:`rgba(192,192,192,${0.35-n*0.025})`,
      label:"#C0C0C0",
      tag:`rgba(192,192,192,${0.12-n*0.008})`,
      glow:false
    };
    // MT — white/neutral
    styles['MT'+n]={
      bg:`rgba(255,255,255,${0.04-n*0.003})`,
      border:`rgba(255,255,255,${0.22-n*0.015})`,
      label:"rgba(255,255,255,0.75)",
      tag:`rgba(255,255,255,${0.07-n*0.004})`,
      glow:false
    };
    // LT — muted grey
    styles['LT'+n]={
      bg:`rgba(100,100,110,${0.04-n*0.002})`,
      border:`rgba(120,120,130,${0.18-n*0.012})`,
      label:"#6B7280",
      tag:`rgba(100,100,110,${0.06-n*0.003})`,
      glow:false
    };
  }
  return styles;
})();

function initTierModeBtns(){
  $id('tierModeBtns').innerHTML=MODES.map(m=>`<button class="tag-btn${m===tierMode?' active':''}" onclick="setTierMode('${m}')">${m}</button>`).join('');
}
function setTierMode(m){tierMode=m;initTierModeBtns();renderTierList()}

function renderTierList(){
  initTierModeBtns();
  const data=TIER_LIST_DATA[tierMode]||TIER_LIST_DATA.Overall;
  // Group by bậc number, render OT1..LT1, OT2..LT2, etc.
  // Only render tiers that exist in TIERS array
  const activeTiers=TIERS.filter(tier=>data[tier]&&data[tier].length>0);
  // Get unique bậc numbers present
  const bacs=[...new Set(activeTiers.map(t=>t.replace(/^[A-Z]+/,'')))];
  
  $id('tierBody').innerHTML=bacs.map(bac=>{
    const tiersInBac=['OT','HT','MT','LT'].map(p=>p+bac);
    const hasAny=tiersInBac.some(t=>data[t]&&data[t].length>0);
    if(!hasAny) return'';
    return`<div style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,0.2)">Bậc ${bac}</span>
        <div style="flex:1;height:1px;background:rgba(255,255,255,0.05)"></div>
      </div>
      ${tiersInBac.map(tier=>{
        const tm=TIER_META_STYLE[tier];
        if(!tm) return'';
        const players=data[tier]||[];
        const isOT=tier.startsWith('OT');
        const playerBtns=players.map(name=>{
          const p=PLAYERS.find(x=>x.username===name);
          return`<button class="tier-player-btn" style="border-color:${tm.border};${isOT?`box-shadow:0 0 8px ${tm.border}`:''}"
            onclick="if(${p?'true':'false'}){navigate('player',PLAYERS.find(x=>x.username==='${name}'))}"
            onmouseover="this.style.background='${tm.tag}'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
            ${p?avatarHTML(p.robloxId,p.username,28):''}
            <span style="color:${tm.label}">${name}</span>
            ${p?rankBadgeHTML(p.rank,true):''}
          </button>`;
        }).join('');
        return`<div class="tier-row" style="border:1px solid ${tm.border};background:${tm.bg};${isOT?`box-shadow:0 0 16px ${tm.border}40`:''}">
          <div class="tier-label-cell" style="background:${tm.tag};border-right:1px solid ${tm.border};${isOT?`box-shadow:inset -2px 0 8px ${tm.border}30`:''}">
            <span style="color:${tm.label};${isOT?'text-shadow:0 0 10px rgba(255,215,0,0.7);font-size:20px':''}">${tier}</span>
          </div>
          <div class="tier-players-cell">${playerBtns||`<span style="color:rgba(255,255,255,0.15);font-size:13px">Empty</span>`}</div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
  setTimeout(()=>{ if(window.applyScrollReveal) applyScrollReveal(document.getElementById('page-tierlist')); },30);
}

// ═══════════════════════════════════════════════════════════
//  PLAYERS
// ═══════════════════════════════════════════════════════════
function renderPlayers(){
  const search=($id('playerSearch')||{value:''}).value.toLowerCase();
  const filter=($id('playerRankFilter')||{value:'All'}).value;
  let players=[...PLAYERS];
  if(search) players=players.filter(p=>p.username.toLowerCase().includes(search));
  if(filter!=='All') players=players.filter(p=>p.rank.startsWith(filter));
  const grid=$id('playerGrid');
  grid.innerHTML=players.map(p=>{
    const ds=calcDS(p.scores);
    const t=getRankTier(p.rank);
    const col=RANK_COLORS[t];
    return`<div class="card card-hover" style="padding:16px" onclick="navigate('player',PLAYERS.find(x=>x.id===${p.id}))">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        ${avatarHTML(p.robloxId,p.username,48)}
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.username}${verificationBadges(p.username)}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:4px">${p.region}</div>
          ${rankBadgeHTML(p.rank)}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:rgba(255,215,0,0.06);border-radius:8px;padding:8px 10px">
          <div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.08em">DS Score</div>
          <div style="font-size:18px;font-weight:800;color:#FFD700;font-family:monospace">${ds.toLocaleString()}</div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px 10px">
          <div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.08em">Win Rate</div>
          <div style="font-size:18px;font-weight:800;color:#fff;font-family:monospace">${p.winRate}%</div>
        </div>
      </div>
    </div>`
  }).join('');
  setTimeout(()=>{ if(window.applyScrollReveal) applyScrollReveal(document.getElementById('page-players')); },30);
}

// ═══════════════════════════════════════════════════════════
//  META
// ═══════════════════════════════════════════════════════════
const META_TYPES={
  buff:{color:"#22c55e",bg:"rgba(34,197,94,0.1)",border:"rgba(34,197,94,0.25)",label:"BUFF"},
  nerf:{color:"#ef4444",bg:"rgba(239,68,68,0.1)",border:"rgba(239,68,68,0.25)",label:"NERF"},
  rank:{color:"#FFD700",bg:"rgba(255,215,0,0.1)",border:"rgba(255,215,0,0.25)",label:"RANK"},
  season:{color:"#a855f7",bg:"rgba(168,85,247,0.1)",border:"rgba(168,85,247,0.25)",label:"SEASON"},
};

function initMetaFilter(){
  $id('metaFilter').innerHTML=[["all","All"],["buff","Buffs"],["nerf","Nerfs"],["rank","Ranking"],["season","Season"]].map(([v,l])=>
    `<button class="tag-btn${v===metaFilter?' active':''}" onclick="setMetaFilter('${v}')">${l}</button>`
  ).join('');
}
function setMetaFilter(f){metaFilter=f;initMetaFilter();renderMeta()}

function renderMeta(){
  initMetaFilter();
  const filtered=metaFilter==='all'?META_UPDATES:META_UPDATES.filter(x=>x.type===metaFilter);
  $id('metaBody').innerHTML=`<div style="display:flex;flex-direction:column;gap:10px">`+filtered.map(u=>{
    const tm=META_TYPES[u.type];
    return`<div class="card" style="padding:16px">
      <div style="display:flex;gap:14px;align-items:flex-start">
        <div style="width:40px;height:40px;border-radius:10px;background:${tm.bg};border:1px solid ${tm.border};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${u.icon}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
            <span style="background:${tm.bg};border:1px solid ${tm.border};border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;color:${tm.color};letter-spacing:.08em">${tm.label}</span>
            <h3 style="margin:0;font-size:15px;font-weight:700">${u.title}</h3>
            <span style="margin-left:auto;font-size:11px;color:rgba(255,255,255,0.3)">${u.date}</span>
          </div>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5">${u.desc}</p>
        </div>
      </div>
    </div>`
  }).join('')+'</div>';
}

// ═══════════════════════════════════════════════════════════
//  RADAR CHART SVG
// ═══════════════════════════════════════════════════════════
function radarSVG(scores,size=200){
  const cx=size/2,cy=size/2,r=size*.36;
  const labels=["Solo","Dual","Speed Run","SD","1v2","Overall"];
  const vals=[scores["1v1"]||0,scores["1v2"]||0,scores["2v2"]||0,scores.sd||0,scores.speedrun||0,scores.overall||0];
  const max=10000,n=labels.length;
  const ang=i=>(Math.PI*2*i)/n-Math.PI/2;
  const webPts=ratio=>labels.map((_,i)=>[cx+Math.cos(ang(i))*r*ratio,cy+Math.sin(ang(i))*r*ratio]);
  const gridLevels=[.25,.5,.75,1];
  const dataPts=vals.map((v,i)=>{const a=ang(i),rt=v/max;return[cx+Math.cos(a)*r*rt,cy+Math.sin(a)*r*rt]});
  const toPath=pts=>pts.map((p,i)=>`${i===0?'M':'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')+' Z';
  return`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible">
    <defs><radialGradient id="rg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFD700" stop-opacity=".25"/><stop offset="100%" stop-color="#FFD700" stop-opacity=".05"/></radialGradient></defs>
    ${gridLevels.map(lvl=>`<polygon points="${webPts(lvl).map(p=>p.join(',')).join(' ')}" fill="none" stroke="${lvl===1?'rgba(255,215,0,0.15)':'rgba(255,255,255,0.06)'}" stroke-width="${lvl===1?1.5:1}"/>`).join('')}
    ${labels.map((_,i)=>{const[x,y]=webPts(1)[i];return`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>`}).join('')}
    <path d="${toPath(dataPts)}" fill="url(#rg)" stroke="#FFD700" stroke-width="2" stroke-linejoin="round"/>
    ${dataPts.map(([x,y])=>`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.5" fill="#FFD700" stroke="#000" stroke-width="1.5"/>`).join('')}
    ${labels.map((lbl,i)=>{const a=ang(i),lx=cx+Math.cos(a)*(r+22),ly=cy+Math.sin(a)*(r+22),pct=Math.round((vals[i]/max)*100);
      return`<g><text x="${lx.toFixed(1)}" y="${(ly-5).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="rgba(255,255,255,0.55)" font-size="9" font-weight="600" font-family="system-ui">${lbl}</text>
      <text x="${lx.toFixed(1)}" y="${(ly+8).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="#FFD700" font-size="9" font-weight="700" font-family="monospace">${pct}%</text></g>`}).join('')}
  </svg>`;
}

function winRateSVG(rate,size=80){
  const r=(size-10)/2,circ=2*Math.PI*r,dash=(rate/100)*circ;
  return`<svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="7"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#FFD700" stroke-width="7" stroke-dasharray="${dash.toFixed(2)} ${circ.toFixed(2)}" stroke-linecap="round"/>
  </svg>`;
}

// ═══════════════════════════════════════════════════════════
//  PLAYER PROFILE
// ═══════════════════════════════════════════════════════════
function renderProfile(){
  const p=selectedPlayer;
  if(!p){$id('playerProfileContent').innerHTML=`<div style="padding:48px;text-align:center"><button class="btn-gold" onclick="navigate('home')">← Back</button></div>`;return}
  const ds=calcDS(p.scores);
  const t=getRankTier(p.rank);
  const rc=RANK_COLORS[t];
  const wins=Math.round((p.winRate/100)*p.matches);
  const losses=p.matches-wins;
  const tierPlacement=Object.entries(TIER_LIST_DATA.Overall).find(([,names])=>names.includes(p.username))?.[0]||null;
  // Tier placements per mode — computed once, shown always on profile
  const tierAllModes=MODES.map(mode=>{
    const data=TIER_LIST_DATA[mode]||{};
    const tier=Object.entries(data).find(([,names])=>names.includes(p.username))?.[0]||null;
    return{mode,tier};
  });
  reportType='';reportSent=false;profileTab='overview';

  // Find global rank
  const sorted=[...PLAYERS].sort((a,b)=>rankSortValue(b.rank)-rankSortValue(a.rank)||calcDS(b.scores)-calcDS(a.scores));
  const globalRank=sorted.findIndex(x=>x.id===p.id)+1;
  const isTop3=globalRank>=1&&globalRank<=3;
  const medalColors=['','#FFD700','#C0C0C0','#CD7F32'];
  const medalGlows=['','rgba(255,215,0,0.6)','rgba(192,192,192,0.4)','rgba(205,127,50,0.4)'];
  const medalLabels=['','🥇 #1 Overall','🥈 #2 Overall','🥉 #3 Overall'];
  const bannerAccent=isTop3?medalColors[globalRank]:rc.text;
  const bannerGlow=isTop3?medalGlows[globalRank]:`${rc.text}33`;
  const avatarRing=isTop3
    ?`0 0 0 3px ${medalColors[globalRank]}, 0 0 28px ${medalGlows[globalRank]}, 0 0 56px ${medalColors[globalRank]}33`
    :`0 0 0 3px ${rc.border}, 0 0 24px ${rc.text}22`;

  // Build ban indicators if player is banned:
  //  - banMiniBadgeHTML: small "Banned" tag shown up top next to the username
  //  - avatarBanFilter:  dims/desaturates the avatar photo itself
  //  - banStampHTML:     faded diagonal "BANNED" ribbon stamped across the avatar (middle of profile)
  //  - banDetailCardHTML: quiet, low-key card with reason/admin/date/unban time, placed mid-page
  let banMiniBadgeHTML = '';
  let avatarBanFilter = '';
  let banStampHTML = '';
  let banDetailCardHTML = '';
  if (p.banned) {
    const now = new Date();
    const unbanDate = p.banUntil ? new Date(p.banUntil) : null;
    const isPerm = !p.banUntil;
    const expired = unbanDate && unbanDate <= now;
    let timeLeftStr = '';
    if (!isPerm && !expired && unbanDate) {
      const diff = unbanDate - now;
      const d = Math.floor(diff/86400000);
      const h = Math.floor((diff%86400000)/3600000);
      const m2 = Math.floor((diff%3600000)/60000);
      timeLeftStr = d>0?`${d} ngày ${h}h còn lại`:h>0?`${h}h ${m2}m còn lại`:`${m2} phút còn lại`;
    }
    const unbanStr = isPerm
      ? '<span style="color:#ef4444;font-weight:800">VĨNH VIỄN</span>'
      : expired
        ? '<span style="color:#22c55e;font-weight:800">Lệnh ban đã hết hạn</span>'
        : `<span style="color:#FFA500;font-weight:700">${unbanDate.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span> &nbsp;<span style="color:rgba(255,165,0,0.7);font-size:12px">(${timeLeftStr})</span>`;

    // Store ban info globally so the modal / full overlay can read it
    window._currentBanData = {
      reason: p.banReason||'Không có lí do',
      by: p.bannedBy||'Admin',
      at: p.bannedAt||null,
      unbanStr: unbanStr,
      isPerm: isPerm,
      expired: expired
    };
    banMiniBadgeHTML = `<button onclick="showBanModal()" style="background:rgba(239,68,68,0.14);border:1px solid rgba(239,68,68,0.4);color:#ff7575;font-weight:800;font-size:10px;letter-spacing:.07em;text-transform:uppercase;border-radius:5px;padding:3px 8px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-family:inherit;transition:background .15s" onmouseover="this.style.background='rgba(239,68,68,0.25)'" onmouseout="this.style.background='rgba(239,68,68,0.14)'">⛔ Banned</button>`;

    avatarBanFilter = 'filter:grayscale(85%) brightness(.5) contrast(1.05);';

    banStampHTML = `
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.2);pointer-events:none"></div>
      <div style="position:absolute;top:50%;left:50%;width:160%;transform:translate(-50%,-50%) rotate(-30deg);background:rgba(239,68,68,0.5);text-align:center;padding:3px 0;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,0.4)">
        <span style="color:rgba(255,255,255,0.85);font-weight:900;font-size:10px;letter-spacing:.18em">BANNED</span>
      </div>`;

    banDetailCardHTML = `
    <div style="margin:18px 20px 0;padding:14px 16px;background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.16);border-radius:10px;text-align:center">
      <div style="font-size:11px;color:rgba(255,120,120,0.55);font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px">⛔ Tài khoản đang bị hạn chế</div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;font-size:12px;margin-bottom:8px;color:rgba(255,255,255,0.3)">
        <span>Lí do: <span style="color:rgba(255,170,170,0.8);font-weight:600">${p.banReason||'Không có lí do'}</span></span>
        <span style="color:rgba(255,255,255,0.12)">·</span>
        <span>Bởi: <span style="color:rgba(255,215,0,0.55);font-weight:600">${p.bannedBy||'Admin'}</span></span>
        ${p.bannedAt?`<span style="color:rgba(255,255,255,0.12)">·</span><span>Ngày: <span style="color:rgba(255,255,255,0.45)">${p.bannedAt}</span></span>`:''}
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.3)">Mở ban: ${unbanStr}</div>
    </div>`;

    showProfileBanOverlay(window._currentBanData);
  } else {
    hideProfileBanOverlay();
  }

  $id('playerProfileContent').innerHTML=`
  <!-- Banner -->
  <div class="profile-banner" style="height:200px;border-bottom:1px solid ${bannerAccent}33;background:linear-gradient(135deg,#060606 0%,${bannerAccent}0f 50%,#060606 100%)">
    <div class="profile-banner-grid"></div>
    <!-- big rank watermark -->
    <div style="position:absolute;right:20px;top:50%;transform:translateY(-50%);font-size:clamp(80px,14vw,130px);font-weight:900;color:${bannerAccent};opacity:.07;font-family:monospace;user-select:none;line-height:1;letter-spacing:-.05em">${p.rank}</div>
    <!-- Roblox avatar large in banner -->
    <div style="position:absolute;right:clamp(60px,12vw,140px);bottom:0;width:clamp(90px,14vw,150px);height:clamp(90px,14vw,150px);overflow:hidden;mask-image:linear-gradient(to top,transparent 0%,#000 30%);-webkit-mask-image:linear-gradient(to top,transparent 0%,#000 30%)">
      <img src="https://corsproxy.io/?https://www.roblox.com/headshot-thumbnail/image?userId=${p.robloxId}&width=420&height=420&format=Png"
        alt="${p.username}" style="width:100%;height:100%;object-fit:cover;opacity:.55;filter:grayscale(15%)"
        onerror="this.style.display='none'">
    </div>
    <button onclick="navigate('home')" style="position:absolute;top:16px;left:16px;display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.65);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:rgba(255,255,255,0.7);padding:7px 14px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:500;transition:border-color .15s" onmouseover="this.style.borderColor='rgba(255,255,255,0.3)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.12)'">← Rankings</button>
    ${isTop3?`<div style="position:absolute;top:16px;right:16px;background:${bannerAccent}22;backdrop-filter:blur(10px);border:1px solid ${bannerAccent}55;border-radius:8px;padding:5px 14px;font-size:12px;color:${bannerAccent};font-weight:800;letter-spacing:.04em;display:flex;align-items:center;gap:6px"><span style="font-size:16px">${globalRank===1?'🥇':globalRank===2?'🥈':'🥉'}</span>${medalLabels[globalRank]}</div>`
    :`<div style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);border:1px solid ${rc.border};border-radius:8px;padding:5px 12px;font-size:11px;color:${rc.text};font-weight:700;letter-spacing:.06em">SEASON 7</div>`}
  </div>

  <!-- Identity -->
  <div style="padding:0 20px">
    <div class="profile-avatar-wrap">
      <div class="profile-avatar-inner" style="width:92px;height:92px;border-radius:20px;box-shadow:${avatarRing}">
        ${p.discordAvatar
          ? `<img src="${p.discordAvatar}" alt="${p.discordName||p.username}" style="width:100%;height:100%;object-fit:cover;border-radius:18px;display:block;${avatarBanFilter}" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : `<img src="https://corsproxy.io/?https://www.roblox.com/headshot-thumbnail/image?userId=${p.robloxId}&width=150&height=150&format=Png" alt="${p.username}" style="width:100%;height:100%;object-fit:cover;border-radius:18px;display:block;${avatarBanFilter}" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">`
        }
        <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:linear-gradient(135deg,#FFD700,#B8860B);border-radius:18px;font-size:30px;font-weight:900;color:#000;${avatarBanFilter}">${(p.discordName||p.username).slice(0,2).toUpperCase()}</div>
        ${banStampHTML}
      </div>
      ${p.discordAvatar
        ? `<div title="Discord linked" style="position:absolute;bottom:-4px;right:-4px;width:22px;height:22px;background:#5865F2;border-radius:50%;border:2px solid #060606;display:flex;align-items:center;justify-content:center"><svg width='12' height='12' viewBox='0 0 127.14 96.36' fill='white'><path d='M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z'/></svg></div>`
        : (isTop3?`<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:20px;filter:drop-shadow(0 0 6px ${bannerAccent})">${globalRank===1?'👑':globalRank===2?'🥈':'🥉'}</div>`:'<div class="online-dot"></div>')
      }
    </div>
  </div>

  <div style="padding:10px 20px 0;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap">
        <h1 style="margin:0;font-size:clamp(22px,4vw,30px);font-weight:900;letter-spacing:-.03em;color:${isTop3?bannerAccent:'#fff'}">
          ${p.discordName||p.username}<span style="font-size:0.7em">${verificationBadges(p.username)}</span>
        </h1>
        ${p.discordName && p.discordName!==p.username
          ? `<span style="font-size:13px;color:rgba(255,255,255,0.35);font-weight:500">@${p.username}</span>`
          : ''
        }
        ${rankBadgeHTML(p.rank)}
        ${banMiniBadgeHTML}
        ${tierAllModes.some(x=>x.tier)?tierAllModes.filter(x=>x.tier).map(({mode,tier})=>{
          const tc=tierColor(tier);
          const modeShort=mode==='Overall'?'OVR':mode==='Solo'?'SOLO':mode==='Dual'?'DUAL':'SR';
          const isOT=tier.startsWith('OT');
          return`<span style="background:${tc}14;border:1px solid ${tc}40;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:700;color:${tc};display:inline-flex;align-items:center;gap:3px;${isOT?`box-shadow:0 0 6px ${tc}44`:''}"><span style="opacity:.6;font-size:9px">${modeShort}</span>${tier}</span>`;
        }).join(''):''}
        ${isTop3?`<span style="background:${bannerAccent}18;border:1px solid ${bannerAccent}44;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:800;color:${bannerAccent}">${medalLabels[globalRank]}</span>`:`<span style="font-size:12px;color:rgba(255,255,255,0.25)">Rank #${globalRank}</span>`}
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:rgba(255,255,255,0.4)">
        <span>🌍 ${p.region}</span><span style="color:rgba(255,255,255,0.15)">·</span>
        <span>🎮 ${p.matches.toLocaleString()} matches</span><span style="color:rgba(255,255,255,0.15)">·</span>
        <span>⚔ ID: ${p.robloxId}</span>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-gold">⭐ Follow</button>
      <button class="btn-ghost" onclick="switchProfileTab('report')">⚑ Report</button>
      ${p.discordId
        ? `<button class="btn-ghost" style="color:#5865F2;border-color:rgba(88,101,242,0.4);font-size:12px;display:flex;align-items:center;gap:5px" onclick="unlinkDiscord(${p.id})"><svg width='12' height='12' viewBox='0 0 127.14 96.36' fill='currentColor'><path d='M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z'/></svg> Discord: ${p.discordName}</button>`
        : `<button class="btn-ghost" style="color:#5865F2;border-color:rgba(88,101,242,0.4);font-size:12px;display:flex;align-items:center;gap:5px" onclick="openOAuth(${p.id})"><svg width='12' height='12' viewBox='0 0 127.14 96.36' fill='currentColor'><path d='M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z'/></svg> Liên kết Discord</button>`
      }
    </div>
  </div>

  <!-- Tabs -->
  <div class="profile-tabs" style="margin-top:16px">
    <button class="profile-tab-btn active" data-ptab="overview" onclick="switchProfileTab('overview')">Overview</button>
    <button class="profile-tab-btn" data-ptab="matches" onclick="switchProfileTab('matches')">Match History</button>
    <button class="profile-tab-btn" data-ptab="report" onclick="switchProfileTab('report')">Report</button>
  </div>

  <!-- Overview -->
  <div class="profile-tab-content active" id="ptab-overview">
    <div class="stat-trio">
      <div class="stat-box" style="background:linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,215,0,0.03));border:1px solid ${rc.border}">
        <div style="font-size:11px;color:rgba(255,215,0,0.6);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">DS Score</div>
        <div style="font-size:clamp(28px,5vw,42px);font-weight:900;color:#FFD700;font-family:monospace;line-height:1">${ds.toLocaleString()}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px">Solo×40% · 1v2×25% · Dual×20% · SR×15%</div>
      </div>
      <div class="stat-box" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:16px">
        <div class="wr-ring-wrap">
          ${winRateSVG(p.winRate,72)}
          <div class="wr-ring-val" style="font-size:13px">${p.winRate}%</div>
        </div>
        <div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Win Rate</div>
          <div style="font-size:13px;color:rgba(34,197,94,0.8);font-weight:600">${wins.toLocaleString()}W</div>
          <div style="font-size:13px;color:rgba(239,68,68,0.7);font-weight:600">${losses.toLocaleString()}L</div>
        </div>
      </div>
      <div class="stat-box" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08)">
        <div style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Current Rank</div>
        <div style="font-size:clamp(20px,4vw,32px);font-weight:900;font-family:monospace;color:${rc.text};margin-bottom:6px">${p.rank}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.25)">${t==='OT'?'Over Tier':t==='HT'?'High Tier':t==='MT'?'Mid Tier':'Low Tier'}</div>
        <div style="margin-top:12px">
          <div class="prog-track-sm"><div class="prog-fill-sm" style="width:${Math.max(5,(ds/10000)*100)}%;background:linear-gradient(90deg,${rc.border},${rc.text})"></div></div>
          <div style="font-size:10px;color:rgba(255,255,255,0.2);margin-top:4px">${ds.toLocaleString()} / 10,000 DS · Next: ${getNextRank(p.rank)||'🏆 Max Rank'}</div>
        </div>
      </div>
    </div>

    <div class="radar-mode-grid">
      <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:20px;display:flex;flex-direction:column;align-items:center">
        <div style="font-size:11px;color:rgba(255,255,255,0.35);font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;align-self:flex-start">Stat Radar</div>
        ${radarSVG(p.scores,200)}
      </div>
      <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.35);font-weight:600;text-transform:uppercase;letter-spacing:.08em">Mode Ratings</div>
        ${[
          {mode:"Overall",key:"overall",color:"#FFD700",icon:"🏆",weight:"—"},
          {mode:"Solo",key:"1v1",color:"#FFA500",icon:"⚔",weight:"40%"},
          {mode:"Dual",key:"2v2",color:"#C0C0C0",icon:"🤝",weight:"20%"},
          {mode:"Speed Run",key:"speedrun",color:"#6366f1",icon:"⚡",weight:"15%"},
          {mode:"1v2",key:"1v2",color:"#9CA3AF",icon:"🥊",weight:"25%"},
          {mode:"SD",key:"sd",color:"#ec4899",icon:"🎯",weight:"—"},
        ].map(({mode,key,color,icon,weight})=>{
          const val=p.scores[key]||0,pct=(val/10000)*100;
          return`<div style="padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.04);display:grid;grid-template-columns:24px 80px 1fr 70px 36px;align-items:center;gap:10px">
            <span style="font-size:14px">${icon}</span>
            <span style="font-size:13px;color:rgba(255,255,255,0.7);font-weight:500">${mode}</span>
            <div class="prog-track"><div class="prog-fill" style="width:${pct}%;background:${color}"></div></div>
            <span style="text-align:right;font-family:monospace;font-weight:700;font-size:13px;color:${color}">${val.toLocaleString()}</span>
            <span style="text-align:right;font-size:10px;color:rgba(255,255,255,0.2)">${weight}</span>
          </div>`
        }).join('')}
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden">
      <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px;color:rgba(255,255,255,0.35);font-weight:600;text-transform:uppercase;letter-spacing:.08em">DS Formula Breakdown</span>
        <span style="font-size:12px;font-weight:800;color:#FFD700;font-family:monospace">= ${ds.toLocaleString()} total</span>
      </div>
      <div class="ds-breakdown-grid" style="padding:16px 20px">
        ${[{label:"Solo",val:p.scores["1v1"],weight:.40,color:"#FFD700"},{label:"1v2",val:p.scores["1v2"],weight:.25,color:"#FFA500"},{label:"Dual",val:p.scores["2v2"],weight:.20,color:"#C0C0C0"},{label:"Speed Run",val:p.scores.speedrun,weight:.15,color:"#6366f1"}].map(({label,val,weight,color})=>{
          const contrib=Math.round(val*weight);return`<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:14px 16px;border:1px solid rgba(255,255,255,0.06)">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:12px;color:rgba(255,255,255,0.5);font-weight:600">${label}</span>
              <span style="font-size:10px;color:${color};font-weight:700;background:${color}18;padding:2px 6px;border-radius:4px">${Math.round(weight*100)}%</span>
            </div>
            <div style="font-size:20px;font-weight:800;font-family:monospace;margin-bottom:6px">${val.toLocaleString()}</div>
            <div class="prog-track-sm" style="margin-bottom:6px"><div class="prog-fill-sm" style="width:${(val/10000)*100}%;background:${color}"></div></div>
            <div style="font-size:10px;color:rgba(255,255,255,0.25)">+${contrib.toLocaleString()} pts to DS</div>
          </div>`
        }).join('')}
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;margin-top:16px">
      <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px;color:rgba(255,255,255,0.35);font-weight:600;text-transform:uppercase;letter-spacing:.08em">🏅 Tier Placements · All Modes</span>
        <span style="font-size:11px;color:rgba(255,255,255,0.2)">Season 7</span>
      </div>
      ${tierAllModes.map(({mode,tier},idx)=>{
        const tc=tier?tierColor(tier):'rgba(255,255,255,0.12)';
        const modeIcon=mode==='Overall'?'🏆':mode==='Solo'?'⚔':mode==='Dual'?'🤝':'⚡';
        // Progress: rankSortValue max = OT1 = 994, min ~= LT10 = 1
        const pct=tier?Math.min(100,Math.round(rankSortValue(tier)/994*100)):0;
        const isOT=tier&&tier.startsWith('OT');
        return`<div style="display:flex;align-items:center;gap:16px;padding:13px 20px;${idx<tierAllModes.length-1?'border-bottom:1px solid rgba(255,255,255,0.04)':''}">
          <span style="font-size:15px;width:20px;text-align:center;flex-shrink:0">${modeIcon}</span>
          <span style="font-size:13px;color:rgba(255,255,255,0.55);font-weight:600;width:80px;flex-shrink:0">${mode}</span>
          <div style="flex:1;height:4px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${tc};border-radius:2px;transition:width .9s ease;${isOT?`box-shadow:0 0 6px ${tc}`:''}"></div>
          </div>
          ${tier
            ?`<span style="font-size:13px;font-weight:800;color:${tc};background:${tc}18;border:1px solid ${tc}44;border-radius:6px;padding:3px 12px;font-family:monospace;flex-shrink:0;min-width:52px;text-align:center;${isOT?`box-shadow:0 0 8px ${tc}55`:''}">${tier}</span>`
            :`<span style="font-size:12px;color:rgba(255,255,255,0.15);flex-shrink:0;min-width:52px;text-align:center">—</span>`}
        </div>`;
      }).join('')}
    </div>
  </div>
  <div class="profile-tab-content" id="ptab-matches">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
      ${[{label:"Total",val:p.matches.toLocaleString(),color:"#fff"},{label:"Wins",val:wins.toLocaleString(),color:"#22c55e"},{label:"Losses",val:losses.toLocaleString(),color:"#ef4444"}].map(({label,val,color})=>`
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 16px;text-align:center">
        <div style="font-size:10px;color:rgba(255,255,255,0.35);font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">${label}</div>
        <div style="font-size:22px;font-weight:800;color:${color};font-family:monospace">${val}</div>
      </div>`).join('')}
    </div>
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden">
      <div class="table-header match-cols" style="font-size:10px;border-bottom:1px solid rgba(255,255,255,0.06)">
        <span>R</span><span>Mode</span><span>Opponent</span><span>Score</span>
      </div>
      ${MATCH_HISTORY.map(m=>`
      <div class="table-row match-cols" style="padding:14px 20px">
        <div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${m.result==='W'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)'};border:1px solid ${m.result==='W'?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'};font-weight:800;font-size:12px;color:${m.result==='W'?'#22c55e':'#ef4444'}">${m.result}</div>
        <span style="background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.15);border-radius:6px;padding:3px 8px;color:#FFD700;font-weight:700;font-size:11px">${m.mode}</span>
        <div style="font-size:13px;color:rgba(255,255,255,0.8)">vs ${m.opponent}</div>
        <span style="font-family:monospace;font-weight:700;font-size:14px;color:${m.result==='W'?'#22c55e':'#ef4444'}">${m.score}</span>
      </div>`).join('')}
    </div>
  </div>

  <!-- Report -->
  <div class="profile-tab-content" id="ptab-report">
    <div style="max-width:560px">
      <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:16px;padding:20px;margin-bottom:16px">
        <div style="font-size:13px;color:rgba(239,68,68,0.8);font-weight:700;margin-bottom:4px">⚑ Report Incorrect Information</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6">Thấy thông tin sai? Chọn loại báo cáo bên dưới. Admin sẽ xem xét trong vòng 24h.</div>
      </div>
      <div id="reportForm">
        ${["Wrong Rank","Wrong DS Score","Wrong Region","Wrong Tier Placement"].map(t=>`
        <button class="report-option" onclick="selectReport('${t}')">
          <div class="report-radio"><div class="report-dot"></div></div>${t}
        </button>`).join('')}
        <button id="reportSubmitBtn" disabled onclick="submitReport()" style="margin-top:8px;padding:13px;border-radius:12px;width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.2);font-size:13px;font-weight:700;font-family:inherit;cursor:not-allowed;transition:all .15s">Select a report type</button>
      </div>
      <div id="reportSuccess" style="display:none;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:16px;padding:24px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">✅</div>
        <div style="font-size:15px;font-weight:700;color:#22c55e;margin-bottom:4px">Report Submitted</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.4)">Admins will review shortly. Thank you!</div>
      </div>
    </div>
  </div>
  `;
}

function switchProfileTab(tab){
  profileTab=tab;
  document.querySelectorAll('.profile-tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.ptab===tab));
  document.querySelectorAll('.profile-tab-content').forEach(c=>c.classList.toggle('active',c.id===`ptab-${tab}`));
}

function selectReport(t){
  reportType=t;
  document.querySelectorAll('.report-option').forEach(b=>{
    const selected=b.textContent.trim()===t;
    b.classList.toggle('selected',selected);
  });
  const btn=$id('reportSubmitBtn');
  if(btn){btn.disabled=false;btn.style.background='rgba(239,68,68,0.12)';btn.style.borderColor='rgba(239,68,68,0.35)';btn.style.color='#ef4444';btn.style.cursor='pointer';btn.textContent=`Submit: "${t}"`}
}

function submitReport(){
  $id('reportForm').style.display='none';
  $id('reportSuccess').style.display='block';
}

function showBanModal(){
  const d = window._currentBanData;
  if(!d) return;
  $id('banModalReason').textContent = d.reason;
  $id('banModalBy').textContent = d.by;
  const atRow = $id('banModalAtRow');
  if(d.at){
    $id('banModalAt').textContent = d.at;
    atRow.style.display = 'flex';
  } else {
    atRow.style.display = 'none';
  }
  $id('banModalUnban').innerHTML = d.unbanStr;
  const overlay = $id('banModalOverlay');
  overlay.style.display = 'flex';
  requestAnimationFrame(()=>overlay.classList.add('active'));
}

function closeBanModal(){
  const overlay = $id('banModalOverlay');
  overlay.classList.remove('active');
  setTimeout(()=>{ overlay.style.display='none'; }, 200);
}

// ═══════════════════════════════════════════════════════════
//  FULL-PAGE PROFILE BAN WARNING
//  Shown automatically when opening a banned player's profile:
//  blurs the whole profile and surfaces reason / admin / dates.
// ═══════════════════════════════════════════════════════════
function showProfileBanOverlay(d){
  if(!d) return;
  $id('pBanReason').textContent = d.reason;
  $id('pBanBy').textContent = d.by;
  const atRow = $id('pBanAtRow');
  if(d.at){
    $id('pBanAt').textContent = d.at;
    atRow.style.display = '';
  } else {
    atRow.style.display = 'none';
  }
  $id('pBanUnban').innerHTML = d.unbanStr;
  $id('pBanSubtitle').textContent = d.isPerm
    ? 'Hồ sơ này đã bị hạn chế truy cập vĩnh viễn'
    : d.expired
      ? 'Lệnh ban đã hết hạn nhưng chưa được gỡ'
      : 'Hồ sơ này đang bị hạn chế truy cập tạm thời';

  const content = $id('playerProfileContent');
  content.classList.add('profile-is-banned');

  const peekBtn = $id('pBanPeekBtn');
  if(peekBtn) peekBtn.textContent = '👁 Xem hồ sơ';

  const overlay = $id('profileBanOverlay');
  overlay.style.display = 'flex';
  requestAnimationFrame(()=>overlay.classList.add('active'));
}

function hideProfileBanOverlay(){
  const overlay = $id('profileBanOverlay');
  if(!overlay) return;
  overlay.classList.remove('active');
  setTimeout(()=>{ overlay.style.display='none'; }, 200);
  const content = $id('playerProfileContent');
  if(content) content.classList.remove('profile-is-banned');
}

// Lets a visitor temporarily peek at a banned profile without fully
// dismissing the warning (re-shown next time the profile is opened).
function togglePeekBannedProfile(){
  const overlay = $id('profileBanOverlay');
  const content = $id('playerProfileContent');
  const peekBtn = $id('pBanPeekBtn');
  const isPeeking = overlay.classList.contains('active') === false;
  if(isPeeking){
    overlay.style.display = 'flex';
    requestAnimationFrame(()=>overlay.classList.add('active'));
    content.classList.add('profile-is-banned');
    if(peekBtn) peekBtn.textContent = '👁 Xem hồ sơ';
  } else {
    overlay.classList.remove('active');
    setTimeout(()=>{ overlay.style.display='none'; }, 200);
    content.classList.remove('profile-is-banned');
    if(peekBtn) peekBtn.textContent = '⛔ Ẩn hồ sơ';
  }
}
