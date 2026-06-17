// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function calcDS(s){return Math.round((s["1v1"]||0)*.4+(s["1v2"]||0)*.25+(s["2v2"]||0)*.2+(s.speedrun||0)*.15)}
function getRankTier(rank){const m=rank.match(/^([A-Z]+)/);return m?m[1]:"LT"}
function rankSortValue(rank){
  // OT1 = highest, LT10 = lowest
  // Sort order within same bậc: OT > HT > MT > LT
  // Sort order across bậc: bậc 1 > bậc 2 > ... > bậc 10
  const tierOrder={OT:4,HT:3,MT:2,LT:1};
  const m=rank.match(/^([A-Z]+)(\d+)$/);
  if(!m)return 0;
  const tier=tierOrder[m[1]]||0;
  const num=parseInt(m[2])||99;
  return tier+(100-num)*10; // LT10=0+(-0)=1, OT1=4+990=994
}
function rankBadgeHTML(rank,sm=false,colored=false){const t=getRankTier(rank);const colorClass=colored?` rank-${t}`:'';return`<span class="rank-badge${colorClass}${sm?" sm":""}">${rank}</span>`}
function getNextRank(rank){
  // Returns the next rank above current in the 40-tier chain
  // Chain per bậc: LTn -> MTn -> HTn -> OTn -> LT(n-1) -> ...
  const m=rank.match(/^([A-Z]+)(\d+)$/);
  if(!m)return null;
  const t=m[1],n=parseInt(m[2]);
  if(t==='LT')return 'MT'+n;
  if(t==='MT')return 'HT'+n;
  if(t==='HT')return 'OT'+n;
  if(t==='OT'){if(n===1)return null;return 'LT'+(n-1);}
  return null;
}
function avatarHTML(userId,username,size){
  const initials=username.slice(0,2).toUpperCase();
  const fs=Math.round(size*.32);
  return`<div class="avatar" style="width:${size}px;height:${size}px" data-user="${userId}" data-init="${initials}" data-fs="${fs}">
    <img src="https://corsproxy.io/?https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=Png" alt="${username}" onerror="this.style.display='none';this.nextSibling.style.display='block'">
    <span style="font-size:${fs}px;display:none">${initials}</span>
  </div>`}
function tierColor(t){
  if(!t) return 'rgba(255,255,255,0.2)';
  const tier=getRankTier(t);
  return tier==='OT'?'#FFD700':tier==='HT'?'#C0C0C0':tier==='MT'?'rgba(255,255,255,0.75)':'#6B7280';
}
function $id(id){return document.getElementById(id)}

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════
let currentPage = "home";
let selectedPlayer = null;
let isAdmin = false;
let lbMode = "Overall";
let dsRegion = "Global";
let tierMode = "Overall";
let metaFilter = "all";
let adminTab = "players";
let profileTab = "overview";
let reportType = "";
let reportSent = false;

// ═══════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════
function navigate(page, player=null){
  if(page==='admin' && !isAdmin){
    openAdminLogin();
    return;
  }
  if(player) selectedPlayer=player;
  currentPage=page;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pageEl=$id('page-'+page);
  if(pageEl) pageEl.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.page===page);
  });
  document.querySelectorAll('.mobile-nav-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.mpage===page);
  });
  window.scrollTo(0,0);
  if(page==='home') renderLeaderboard();
  if(page==='ds') renderDS();
  if(page==='tierlist') renderTierList();
  if(page==='players') renderPlayers();
  if(page==='meta') renderMeta();
  if(page==='player') renderProfile();
  if(page==='admin') renderAdmin();
}

function toggleMobile(){$id('mobileMenu').classList.toggle('open')}
function closeMobile(){$id('mobileMenu').classList.remove('open')}

