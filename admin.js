// ═══════════════════════════════════════════════════════════
//  ADMIN — ENHANCED
// ═══════════════════════════════════════════════════════════

// Runtime copies so edits don't mutate originals between renders
let adminPlayers = null;
let adminTierData = null;
let adminReports = [
  {id:1,player:"Kaimc",type:"Wrong Rank",reporter:"user123",time:"3h ago",status:"pending"},
  {id:2,player:"Alpha",type:"Wrong Region",reporter:"bf_fan99",time:"8h ago",status:"pending"},
  {id:3,player:"Dragon",type:"Wrong DS Score",reporter:"anon_player",time:"2d ago",status:"pending"},
  {id:4,player:"ViperX",type:"Wrong Tier Placement",reporter:"xgamer22",time:"4d ago",status:"resolved"},
];
let adminAuditLogs = [...AUDIT_LOGS];
let adminBanLogs = [];

function getAdminPlayers(){if(!adminPlayers)adminPlayers=PLAYERS.map(p=>Object.assign({},p,{scores:Object.assign({},p.scores)}));return adminPlayers;}
function getAdminTierData(){if(!adminTierData)adminTierData=JSON.parse(JSON.stringify(TIER_LIST_DATA));return adminTierData;}

// current tier being edited
let editingTierKey = null;
let editingTierMode = 'Overall';
let tempTierPlayers = [];

// NOTE: renderAdmin() is defined in init.js (it extends this base with Discord, Database, Ban Logs
// and Accounts tabs). The old duplicate definition that used to live here contained a syntax error
// (a stray "else if" after a catch-all "else") which broke parsing of this entire file in the
// browser -- silently disabling login, the ban system, and account management. Removed as part of
// the login/admin-panel rebuild.

function setAdminTab(t){adminTab=t;renderAdmin()}

// ─── ACCOUNT MANAGEMENT (Admin only) ─────────────────────────────────────────
function openAddAccountModal(){
  if(window._currentRole!=='Admin'){showToast('⛔ Chỉ Admin mới có quyền!');return;}
  const overlay=document.createElement('div');
  overlay.id='addAccountOverlay';
  overlay.className='overlay active';
  overlay.innerHTML=`
    <div class="modal" style="max-width:380px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <span style="font-size:16px;font-weight:800;color:#FFD700">🔑 Tạo tài khoản Staff</span>
        <button onclick="closeAddAccountModal()" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:20px;cursor:pointer">×</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <input id="newAccUser" class="edit-input" type="text" placeholder="Username…" autocomplete="off">
        <input id="newAccPass" class="edit-input" type="password" placeholder="Mật khẩu…" autocomplete="new-password">
        <select id="newAccRole" class="edit-input" style="cursor:pointer">
          <option value="Mod">🛡 Moderator</option>
          <option value="Staff">⭐ Staff</option>
          <option value="Admin">🔐 Admin</option>
        </select>
        <div id="addAccErr" style="display:none;color:#ef4444;font-size:12px"></div>
        <button class="btn-gold" onclick="confirmAddAccount()" style="margin-top:4px">✅ Tạo tài khoản</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function closeAddAccountModal(){
  const el=document.getElementById('addAccountOverlay');
  if(el) el.remove();
}

function confirmAddAccount(){
  if(window._currentRole!=='Admin'){showToast('⛔ Chỉ Admin mới có quyền!');return;}
  const u=(document.getElementById('newAccUser').value||'').trim();
  const p=(document.getElementById('newAccPass').value||'').trim();
  const r=document.getElementById('newAccRole').value;
  const errEl=document.getElementById('addAccErr');
  if(!u||!p){errEl.style.display='block';errEl.textContent='Vui lòng nhập đầy đủ username và mật khẩu.';return;}
  if(STAFF_ACCOUNTS.find(a=>a.username.toLowerCase()===u.toLowerCase())){errEl.style.display='block';errEl.textContent='Username đã tồn tại!';return;}
  const ROLE_BADGES={Admin:'🔐 BF META HUB Admin',Mod:'🛡 Moderator · BF META HUB',Staff:'⭐ Staff · BF META HUB'};
  const ROLE_COLORS={Admin:'linear-gradient(135deg,#FFD700,#B8860B)',Mod:'linear-gradient(135deg,#22c55e,#16a34a)',Staff:'linear-gradient(135deg,#a855f7,#7c3aed)'};
  const ROLE_TXT={Admin:'#000',Mod:'#fff',Staff:'#fff'};
  STAFF_ACCOUNTS.push({username:u,password:p,role:r,badge:ROLE_BADGES[r]||r,avatarColor:ROLE_COLORS[r]||'linear-gradient(135deg,#6b7280,#4b5563)',avatarTxt:'#fff'});
  adminAuditLogs.unshift({admin:window._currentAdmin||'Admin',action:'Tạo tài khoản mới',player:u,old:'-',new:r,time:'Just now'});
  autoSave();
  closeAddAccountModal();
  showToast('✅ Đã tạo tài khoản '+u+' · '+r+'!', false);
  renderAdmin();
}

function deleteStaffAccount(index){
  if(window._currentRole!=='Admin'){showToast('⛔ Chỉ Admin mới có quyền!');return;}
  const acc=STAFF_ACCOUNTS[index];
  if(!acc||acc.username==='admin'){showToast('⛔ Không thể xóa tài khoản này!');return;}
  if(!confirm('Xác nhận xóa tài khoản: '+acc.username+'?')) return;
  adminAuditLogs.unshift({admin:window._currentAdmin||'Admin',action:'Xóa tài khoản',player:acc.username,old:acc.role,new:'-',time:'Just now'});
  STAFF_ACCOUNTS.splice(index,1);
  autoSave();
  showToast('🗑 Đã xóa tài khoản '+acc.username+'!', false);
  renderAdmin();
}

function setAdmin(v){isAdmin=v;renderAdmin();}

// ─── EDIT PLAYER ───
function openEditModal(playerId){
  const players=getAdminPlayers();
  const p=players.find(x=>x.id===playerId);
  if(!p)return;
  $id('editPlayerId').value=p.id;
  $id('editUsername').value=p.username;
  $id('editRobloxId').value=p.robloxId;
  $id('editRegion').value=p.region;
  $id('editRank').value=p.rank;
  $id('editWinRate').value=p.winRate;
  $id('editMatches').value=p.matches;
  $id('editScoreOverall').value=p.scores.overall||0;
  $id('editScore1v1').value=p.scores['1v1']||0;
  $id('editScore1v2').value=p.scores['1v2']||0;
  $id('editScore2v2').value=p.scores['2v2']||0;
  $id('editScoreSpeedrun').value=p.scores.speedrun||0;
  $id('editScoreSd').value=p.scores.sd||0;
  const v=getVerification(p.username);
  $id('editVerifTryouter').checked=!!v.tryouter;
  $id('editVerifDiscord').checked=!!v.discord;
  $id('editPlayerOverlay').classList.add('active');
}

function closeEditModal(){$id('editPlayerOverlay').classList.remove('active')}

function savePlayerEdit(){
  const players=getAdminPlayers();
  const id=parseInt($id('editPlayerId').value);
  const p=players.find(x=>x.id===id);
  if(!p)return;
  const oldRank=p.rank;
  const oldUsername=p.username;
  p.username=$id('editUsername').value.trim()||p.username;
  p.robloxId=$id('editRobloxId').value.trim()||p.robloxId;
  p.region=$id('editRegion').value;
  p.rank=$id('editRank').value;
  p.winRate=parseInt($id('editWinRate').value)||p.winRate;
  p.matches=parseInt($id('editMatches').value)||p.matches;
  p.scores.overall=parseInt($id('editScoreOverall').value)||0;
  p.scores['1v1']=parseInt($id('editScore1v1').value)||0;
  p.scores['1v2']=parseInt($id('editScore1v2').value)||0;
  p.scores['2v2']=parseInt($id('editScore2v2').value)||0;
  p.scores.speedrun=parseInt($id('editScoreSpeedrun').value)||0;
  p.scores.sd=parseInt($id('editScoreSd').value)||0;
  // Carry verification flags over if the username changed, then apply new values
  renameVerification(oldUsername,p.username);
  const wasTryouter=getVerification(p.username).tryouter;
  const newTryouter=$id('editVerifTryouter').checked;
  setVerification(p.username,'tryouter',newTryouter);
  setVerification(p.username,'discord',$id('editVerifDiscord').checked);
  // Sync back to global PLAYERS array
  const globalP=PLAYERS.find(x=>x.id===id);
  if(globalP)Object.assign(globalP,p,{scores:Object.assign({},p.scores)});
  adminAuditLogs.unshift({admin:'AdminUser',action:'Updated Player',player:p.username,old:oldRank,new:p.rank,time:'Just now'});
  if(wasTryouter!==newTryouter){
    adminAuditLogs.unshift({admin:'AdminUser',action:newTryouter?'Granted Tryouter Verified':'Revoked Tryouter Verified',player:p.username,old:wasTryouter?'Verified':'—',new:newTryouter?'Verified':'—',time:'Just now'});
  }
  autoSave();
  closeEditModal();
  showToast('✅ Player "'+p.username+'" updated successfully.', false);
  renderAdmin();
}

// ─── DELETE PLAYER ───
function confirmDeletePlayer(id){
  const players=getAdminPlayers();
  const p=players.find(x=>x.id===id);
  if(!p)return;
  const row=$id('arow-'+id);
  if(row){
    // Toggle confirm row
    const existing=row.querySelector('.confirm-row');
    if(existing){existing.remove();return;}
    const confirm=document.createElement('div');
    confirm.className='confirm-row';
    confirm.style.cssText='grid-column:1/-1';
    confirm.innerHTML=`<span style="font-size:13px;color:rgba(255,255,255,0.6);flex:1">Delete <strong>${p.username}</strong>? This cannot be undone.</span>
      <button class="btn-red" style="font-size:12px" onclick="deletePlayer(${id})">Delete</button>
      <button class="btn-ghost" style="font-size:12px" onclick="this.closest('.confirm-row').remove()">Cancel</button>`;
    row.appendChild(confirm);
  }
}

function deletePlayer(id){
  const players=getAdminPlayers();
  const idx=players.findIndex(x=>x.id===id);
  if(idx===-1)return;
  const name=players[idx].username;
  players.splice(idx,1);
  // Also remove from global PLAYERS
  const gi=PLAYERS.findIndex(x=>x.id===id);
  if(gi!==-1)PLAYERS.splice(gi,1);
  delete VERIFIED_USERS[name];
  adminAuditLogs.unshift({admin:'AdminUser',action:'Deleted Player',player:name,old:'-',new:'-',time:'Just now'});
  autoSave();
  showToast('🗑 Player "'+name+'" removed.', false);
  renderAdmin();
}

// ─── ADD PLAYER ───
function openAddModal(){$id('addPlayerOverlay').classList.add('active')}
function closeAddModal(){$id('addPlayerOverlay').classList.remove('active')}
function confirmAddPlayer(){
  const username=$id('addUsername').value.trim();
  const robloxId=$id('addRobloxId').value.trim();
  if(!username||!robloxId){showToast('⚠ Username and Roblox ID are required.',true);return;}
  const players=getAdminPlayers();
  const newId=Math.max(...players.map(p=>p.id))+1;
  const newPlayer={
    id:newId, username, robloxId,
    region:$id('addRegion').value,
    rank:$id('addRank').value,
    winRate:parseInt($id('addWinRate').value)||60,
    matches:parseInt($id('addMatches').value)||100,
    scores:{
      overall:parseInt($id('addScoreOverall').value)||7000,
      '1v1':parseInt($id('addScore1v1').value)||7000,
      '1v2':parseInt($id('addScore1v2').value)||7000,
      '2v2':parseInt($id('addScore2v2').value)||7000,
      speedrun:parseInt($id('addScoreSpeedrun').value)||7000,
      sd:parseInt($id('addScoreSd').value)||7000,
    }
  };
  players.push(newPlayer);
  PLAYERS.push(Object.assign({},newPlayer,{scores:Object.assign({},newPlayer.scores)}));
  adminAuditLogs.unshift({admin:'AdminUser',action:'Added Player',player:username,old:'-',new:newPlayer.rank,time:'Just now'});
  closeAddModal();
  showToast('✅ Player "'+username+'" added successfully.',false);
  renderAdmin();
}

// ─── REPORTS ───
function resolveReport(id,action){
  const r=adminReports.find(x=>x.id===id);
  if(!r)return;
  r.status='resolved';
  adminAuditLogs.unshift({admin:'AdminUser',action:action==='approve'?'Report Approved':'Report Rejected',player:r.player,old:'-',new:r.type,time:'Just now'});
  showToast(action==='approve'?'✅ Report approved.':'🗑 Report rejected.',false);
  renderAdmin();
}

// ─── TIER EDIT ───
function openTierEdit(tier,mode){
  editingTierKey=tier;
  editingTierMode=mode;
  const tierData=getAdminTierData();
  tempTierPlayers=[...((tierData[mode]&&tierData[mode][tier])||[])];
  const isOT=tier.startsWith('OT');
  const bac=tier.replace(/^[A-Z]+/,'');
  const tierLabel=tier.startsWith('OT')?'Over Tier':tier.startsWith('HT')?'High Tier':tier.startsWith('MT')?'Mid Tier':'Low Tier';
  $id('tierEditTitle').innerHTML=`✏️ <span style="color:${isOT?'#FFD700':'inherit'}">${tier}</span> <span style="font-size:12px;opacity:.5">· ${tierLabel} Bậc ${bac} · ${mode}</span>`;
  // Populate player select (players NOT already in this tier)
  const allNames=PLAYERS.map(p=>p.username);
  const sel=$id('tierAddPlayerSelect');
  sel.innerHTML=allNames.filter(n=>!tempTierPlayers.includes(n)).map(n=>`<option>${n}</option>`).join('');
  renderTierEditList();
  $id('tierEditOverlay').classList.add('active');
}

function renderTierEditList(){
  $id('tierEditList').innerHTML=tempTierPlayers.map(name=>`
    <div class="tier-edit-tag">
      <span>${name}</span>
      <button class="tier-edit-tag-rm" onclick="removeTierPlayer('${name}')">✕</button>
    </div>`).join('')||'<span style="font-size:12px;color:rgba(255,255,255,0.2)">No players</span>';
}

function removeTierPlayer(name){
  tempTierPlayers=tempTierPlayers.filter(n=>n!==name);
  // Re-add to select
  const sel=$id('tierAddPlayerSelect');
  const opt=document.createElement('option');
  opt.textContent=name;
  sel.appendChild(opt);
  renderTierEditList();
}

function addPlayerToTier(){
  const sel=$id('tierAddPlayerSelect');
  const name=sel.value;
  if(!name)return;
  if(!tempTierPlayers.includes(name)) tempTierPlayers.push(name);
  sel.remove(sel.selectedIndex);
  renderTierEditList();
}

function closeTierEdit(){$id('tierEditOverlay').classList.remove('active')}

function saveTierEdit(){
  const tierData=getAdminTierData();
  if(!tierData[editingTierMode]) tierData[editingTierMode]={};
  const old=[...((TIER_LIST_DATA[editingTierMode]&&TIER_LIST_DATA[editingTierMode][editingTierKey])||[])].join(', ');
  tierData[editingTierMode][editingTierKey]=[...tempTierPlayers];
  TIER_LIST_DATA[editingTierMode][editingTierKey]=[...tempTierPlayers];
  adminAuditLogs.unshift({admin:'AdminUser',action:'Tier List Edit',player:editingTierMode+' '+editingTierKey,old:old||'Empty',new:tempTierPlayers.join(', ')||'Empty',time:'Just now'});
  closeTierEdit();
  showToast('✅ Tier '+editingTierKey+' updated.',false);
  renderAdmin();
}

function staffSignOut(){
  isAdmin=false;
  window._currentAdmin=null;
  window._currentRole=null;
  navigate('home');
  showToast('Đã đăng xuất khỏi Staff panel.', false);
}

// ═══════════════════════════════════════════════════════════
//  STAFF LOGIN — chỉ dành cho Admin/Staff, không phải user thường
// ═══════════════════════════════════════════════════════════

const STAFF_ACCOUNTS = [
  {username:'admin',  password:'phamnam2', role:'Admin', badge:'🔐 BF META HUB Admin',      avatarColor:'linear-gradient(135deg,#FFD700,#B8860B)', avatarTxt:'#000'},
  {username:'mod',    password:'mod2024',  role:'Mod',   badge:'🛡 Moderator · BF META HUB', avatarColor:'linear-gradient(135deg,#22c55e,#16a34a)', avatarTxt:'#fff'},
  {username:'staff1', password:'staff123', role:'Staff', badge:'⭐ Staff · BF META HUB',     avatarColor:'linear-gradient(135deg,#a855f7,#7c3aed)', avatarTxt:'#fff'},
];

let adminPwVisible = false;
let adminLoginAttempts = 0;
let adminLocked = false;
let adminLockUntil = 0;

function openAdminLogin(){
  $id('adminLoginOverlay').classList.add('active');
  setTimeout(()=>{ const u=$id('adminUser'); if(u){u.focus();} },120);
}
function closeAdminLogin(){
  $id('adminLoginOverlay').classList.remove('active');
  const e=$id('adminLoginErr'); if(e) e.style.display='none';
  const p=$id('adminPass'); if(p) p.value='';
  adminPwVisible=false;
  const tog=$id('adminPwToggle');
  if(tog) tog.textContent='👁';
  const inp=$id('adminPass');
  if(inp) inp.type='password';
}

function toggleAdminPw(){
  adminPwVisible=!adminPwVisible;
  const inp=$id('adminPass'), tog=$id('adminPwToggle');
  if(inp) inp.type=adminPwVisible?'text':'password';
  if(tog) tog.textContent=adminPwVisible?'🙈':'👁';
}

async function doAdminLogin(){
  if(adminLocked){
    const rem=Math.ceil((adminLockUntil-Date.now())/1000);
    if(rem>0){
      const e=$id('adminLoginErr');
      e.textContent='Quá nhiều lần thử. Vui lòng đợi '+rem+'s.';
      e.style.display='block';
      return;
    }
    adminLocked=false; adminLoginAttempts=0;
  }
  const uEl=$id('adminUser'), pEl=$id('adminPass'), errEl=$id('adminLoginErr'), btnEl=$id('adminLoginBtn'), btnC=$id('adminLoginBtnContent');
  const u=(uEl?uEl.value:'').trim();
  const p=(pEl?pEl.value:'');
  if(!u||!p){
    errEl.textContent='Vui lòng nhập đầy đủ thông tin.';
    errEl.style.display='block';
    return;
  }
  btnEl.disabled=true;
  btnC.innerHTML='<div class="spinner" style="border-color:rgba(0,0,0,0.15);border-top-color:#000"></div><span>Đang xác thực…</span>';
  errEl.style.display='none';
  let account;
  try{
    await delay(700);
    account=STAFF_ACCOUNTS.find(a=>a.username.toLowerCase()===u.toLowerCase()&&a.password===p);
  }catch(e){
    // reset on unexpected error
  }finally{
    btnEl.disabled=false;
    btnC.innerHTML='<span>🔐</span><span>Đăng nhập Admin</span>';
  }
  if(!account){
    adminLoginAttempts++;
    if(pEl){pEl.value='';pEl.focus();}
    if(adminLoginAttempts>=5){
      adminLocked=true; adminLockUntil=Date.now()+30000;
      errEl.textContent='Quá nhiều lần thử sai. Vui lòng đợi 30 giây.';
      setTimeout(()=>{adminLocked=false;adminLoginAttempts=0;},30000);
    } else {
      errEl.textContent='Sai tài khoản hoặc mật khẩu Staff. ('+adminLoginAttempts+'/5)';
    }
    errEl.style.display='block';
    return;
  }
  adminLoginAttempts=0;
  isAdmin=true;
  window._currentAdmin = account.username;
  window._currentRole  = account.role;
  closeAdminLogin();
  showToast('✅ Chào mừng '+account.username+' · '+account.role+'!', false);
  navigate('admin');
}

document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    closeAdminLogin();
    closeEditModal();
    closeAddModal();
    closeTierEdit();
  }
});

function showToast(msg,isError){
  if(isError===undefined) isError=true;
  const t=$id('toast'),m=$id('toastMsg');
  m.textContent=msg;
  t.style.background=isError?'rgba(239,68,68,0.15)':'rgba(34,197,94,0.15)';
  t.style.borderColor=isError?'rgba(239,68,68,0.35)':'rgba(34,197,94,0.35)';
  t.querySelector('.toast-icon').textContent=isError?'⚠':'✅';
  t.classList.add('active');
  setTimeout(function(){t.classList.remove('active');},3500);
}

function delay(ms){return new Promise(function(r){setTimeout(r,ms);})}

// ══════════════════════════════════════════════════════════
//  DISCORD OAUTH2 — Link Discord account to player profile
// ══════════════════════════════════════════════════════════

// Paste your Discord Application Client ID here
const DISCORD_CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';

// This must match exactly what you set in Discord Developer Portal → OAuth2 → Redirects
const DISCORD_REDIRECT_URI = window.location.origin + window.location.pathname;

// Player ID currently being linked (set when openOAuth is called)
let pendingDiscordPlayerId = null;

/**
 * Open Discord OAuth popup for a given player.
 * @param {number|string} playerId
 */
function openOAuth(playerId) {
  pendingDiscordPlayerId = playerId != null ? Number(playerId) : null;
  const modal = $id('discordOAuthModal');
  if (modal) modal.style.display = 'flex';
}

function closeOAuth() {
  const modal = $id('discordOAuthModal');
  if (modal) modal.style.display = 'none';
  pendingDiscordPlayerId = null;
}

function handleOverlayClick(e) {
  if (e.target.id === 'discordOAuthModal') closeOAuth();
}

/**
 * Redirect to Discord OAuth2 authorization URL.
 * Uses implicit grant (token in hash) so no backend needed.
 */
function authorize() {
  if (!DISCORD_CLIENT_ID || DISCORD_CLIENT_ID === 'YOUR_DISCORD_CLIENT_ID') {
    showToast('⚠ Chưa cấu hình DISCORD_CLIENT_ID trong admin.js!', true);
    return;
  }
  // Save pending player ID to sessionStorage so we can restore after redirect
  if (pendingDiscordPlayerId != null) {
    sessionStorage.setItem('discord_oauth_player', String(pendingDiscordPlayerId));
  }
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'token',
    scope: 'identify',
  });
  window.location.href = `https://discord.com/oauth2/authorize?${params}`;
}

/**
 * Called on page load — checks if Discord redirected back with an access token.
 * If yes, fetches user info and links it to the pending player.
 */
async function handleDiscordOAuthCallback() {
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return;

  // Parse the hash fragment  (#access_token=...&token_type=Bearer&...)
  const params = new URLSearchParams(hash.slice(1));
  const accessToken = params.get('access_token');
  if (!accessToken) return;

  // Clean the URL immediately
  history.replaceState(null, '', window.location.pathname + window.location.search);

  const playerId = Number(sessionStorage.getItem('discord_oauth_player'));
  sessionStorage.removeItem('discord_oauth_player');

  if (!playerId) {
    showToast('⚠ Không tìm thấy player ID để liên kết Discord.', true);
    return;
  }

  try {
    showToast('🔄 Đang lấy thông tin Discord...', false);
    const res = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Discord API error ' + res.status);
    const user = await res.json();

    // Build avatar URL — fallback to default Discord avatar
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`;

    const displayName = user.global_name || user.username;

    // Find and update the player
    const players = getAdminPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) {
      showToast('⚠ Không tìm thấy player #' + playerId, true);
      return;
    }

    player.discordId = user.id;
    player.discordName = displayName;
    player.discordAvatar = avatarUrl;

    // Persist
    autoSave();

    showToast(`✅ Đã liên kết Discord: ${displayName} → ${player.username}`, false);

    // If currently on that player's profile, refresh it
    if (typeof currentProfile !== 'undefined' && currentProfile && currentProfile.id === playerId) {
      openProfile(player);
    }
  } catch (err) {
    showToast('⚠ Lỗi liên kết Discord: ' + err.message, true);
  }
}

/**
 * Unlink Discord from a player.
 * @param {number} playerId
 */
function unlinkDiscord(playerId) {
  const players = getAdminPlayers();
  const player = players.find(p => p.id === Number(playerId));
  if (!player) return;
  delete player.discordId;
  delete player.discordName;
  delete player.discordAvatar;
  autoSave();
  showToast(`✅ Đã hủy liên kết Discord cho ${player.username}`, false);
  if (typeof currentProfile !== 'undefined' && currentProfile && currentProfile.id === Number(playerId)) {
    openProfile(player);
  }
}


// ══════════════════════════════════════════════════════════
//  BAN SYSTEM
// ══════════════════════════════════════════════════════════

let _banTargetId = null;

function openBanModal(playerId) {
  _banTargetId = Number(playerId);
  const players = getAdminPlayers();
  const p = players.find(x => x.id === _banTargetId);
  if (!p) return;

  // Populate modal
  const modal = $id('banModal');
  const title = $id('banModalTitle');
  if (title) title.textContent = `🔨 Ban: ${p.username}`;
  // Reset fields
  const r = $id('banReason'); if (r) r.value = '';
  const d = $id('banDuration'); if (d) d.value = '';
  const t = $id('banDurationType'); if (t) t.value = 'days';
  const perm = $id('banPermanent'); if (perm) perm.checked = false;
  toggleBanPermanent();

  if (modal) modal.style.display = 'flex';
}

function closeBanModal() {
  const modal = $id('banModal');
  if (modal) modal.style.display = 'none';
  _banTargetId = null;
}

function toggleBanPermanent() {
  const perm = $id('banPermanent');
  const durWrap = $id('banDurationWrap');
  if (durWrap) durWrap.style.display = (perm && perm.checked) ? 'none' : 'flex';
}

function confirmBan() {
  const reason = ($id('banReason') || {}).value.trim();
  const isPerm = ($id('banPermanent') || {}).checked;
  const dur = parseInt(($id('banDuration') || {}).value) || 0;
  const durType = ($id('banDurationType') || {}).value || 'days';

  if (!reason) { showToast('⚠ Vui lòng nhập lí do ban!', true); return; }
  if (!isPerm && dur <= 0) { showToast('⚠ Vui lòng nhập thời gian ban!', true); return; }

  const players = getAdminPlayers();
  const p = players.find(x => x.id === _banTargetId);
  if (!p) return;

  p.banned = true;
  p.banReason = reason;
  p.bannedBy = window._currentAdmin || 'Admin';
  p.bannedAt = new Date().toLocaleString('vi-VN');

  if (isPerm) {
    p.banUntil = null; // permanent
  } else {
    const msMap = { minutes: 60000, hours: 3600000, days: 86400000, weeks: 604800000 };
    const ms = dur * (msMap[durType] || 86400000);
    p.banUntil = new Date(Date.now() + ms).toISOString();
  }

  // Sync ban status back to the global PLAYERS array (admin works on a private clone,
  // so without this the public Profile page would keep showing the player as not banned
  // until a full page reload restored data from the database).
  const globalPBan = PLAYERS.find(x => x.id === p.id);
  if (globalPBan) {
    globalPBan.banned = p.banned;
    globalPBan.banReason = p.banReason;
    globalPBan.bannedBy = p.bannedBy;
    globalPBan.bannedAt = p.bannedAt;
    globalPBan.banUntil = p.banUntil;
  }

  addAuditLog(
    (window._currentAdmin) || 'Admin',
    'Ban Player',
    p.username,
    'Active',
    isPerm ? 'Permanent' : `${dur} ${durType}`,
    'Just now'
  );
  addBanLog('Ban', p.username, reason, isPerm ? 'Permanent' : `${dur} ${durType}`, (window._currentAdmin) || 'Admin');

  autoSave();
  closeBanModal();
  showToast(`🔨 Đã ban ${p.username}${isPerm ? ' (Permanent)' : ''}`, false);
  renderAdmin();
}

function unbanPlayer(playerId) {
  const players = getAdminPlayers();
  const p = players.find(x => x.id === Number(playerId));
  if (!p) return;

  const wasBanned = p.banned;
  const prevReason = p.banReason;
  p.banned = false;
  delete p.banReason;
  delete p.banUntil;
  delete p.bannedBy;
  delete p.bannedAt;

  // Sync back to the global PLAYERS array (see note in confirmBan)
  const globalPUnban = PLAYERS.find(x => x.id === p.id);
  if (globalPUnban) {
    globalPUnban.banned = false;
    delete globalPUnban.banReason;
    delete globalPUnban.banUntil;
    delete globalPUnban.bannedBy;
    delete globalPUnban.bannedAt;
  }

  if (wasBanned) {
    addAuditLog(
      (window._currentAdmin) || 'Admin',
      'Unban Player',
      p.username,
      'Banned',
      'Active',
      'Just now'
    );
    addBanLog('Unban', p.username, prevReason || '-', '-', (window._currentAdmin) || 'Admin');
  }

  autoSave();
  showToast(`✅ Đã unban ${p.username}`, false);
  renderAdmin();

  // Refresh profile if open
  if (typeof selectedPlayer !== 'undefined' && selectedPlayer && selectedPlayer.id === Number(playerId) && typeof renderProfile === 'function') {
    renderProfile();
  }
}
