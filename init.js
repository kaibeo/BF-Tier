// ═══════════════════════════════════════════════════════════
//  PATCHED renderAdmin — add Discord & DB tabs
// ═══════════════════════════════════════════════════════════
// Override extends the base renderAdmin defined in admin.js with new tabs
function renderAdmin(){
  const c=$id('adminContent');
  if(!isAdmin){
    c.innerHTML=`<div style="padding:80px 16px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">🔐</div>
      <h2 style="font-size:20px;font-weight:800;margin-bottom:8px">Truy cập bị từ chối</h2>
      <p style="color:rgba(255,255,255,0.4);font-size:14px;margin-bottom:24px">Khu vực này chỉ dành cho Staff.</p>
      <button onclick="openAdminLogin()" style="background:linear-gradient(135deg,#FFD700,#B8860B);border:none;border-radius:10px;color:#000;padding:12px 28px;cursor:pointer;font-size:14px;font-weight:800;font-family:inherit">🔐 Đăng nhập Staff</button>
    </div>`;
    return;
  }

  const players=getAdminPlayers();
  const totalDS=players.reduce((s,p)=>s+calcDS(p.scores),0);
  const avgDS=Math.round(totalDS/players.length);
  const pendingReports=adminReports.filter(r=>r.status==='pending').length;
  const otCount=players.filter(p=>p.rank.startsWith('OT')).length;

  const bannedCount=players.filter(p=>p.banned).length;
  const isAdminRole = window._currentRole === 'Admin';
  const statsBar=`<div class="admin-stat-grid">
    <div class="admin-stat-card gold"><div class="admin-stat-icon">👥</div><div class="admin-stat-val" style="color:#FFD700">${players.length}</div><div class="admin-stat-label">Total Players</div></div>
    <div class="admin-stat-card green"><div class="admin-stat-icon">🏆</div><div class="admin-stat-val" style="color:#22c55e">${otCount}</div><div class="admin-stat-label">OT Players</div></div>
    <div class="admin-stat-card blue"><div class="admin-stat-icon">📊</div><div class="admin-stat-val" style="color:#6366f1">${avgDS.toLocaleString()}</div><div class="admin-stat-label">Avg DS Score</div></div>
    <div class="admin-stat-card red"><div class="admin-stat-icon">⚑</div><div class="admin-stat-val" style="color:#ef4444">${pendingReports}</div><div class="admin-stat-label">Pending Reports</div></div>
    <div class="admin-stat-card" style="border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.04)"><div class="admin-stat-icon">🔨</div><div class="admin-stat-val" style="color:#ef4444">${bannedCount}</div><div class="admin-stat-label">Banned</div></div>
  </div>`;

  const TABS=[["players","👤 Players"],["tiers","🏅 Tier Lists"],["reports","⚑ Reports"],["banned","🔨 Banned"],["banlogs","📜 Ban Logs"],["logs","📋 Audit Logs"],["discord","🤖 Discord Sync"],["database","💾 Database"],
    ...(isAdminRole ? [["accounts","🔑 Accounts"]] : [])];
  let tabContent='';

  if(adminTab==='discord'){
    tabContent = renderDiscordTab();
  } else if(adminTab==='database'){
    tabContent = renderDatabaseTab();
  } else if(adminTab==='players'){
    const search=(document.querySelector('#adminPlayerSearch')||{value:''}).value||'';
    const filtered=search?players.filter(p=>p.username.toLowerCase().includes(search.toLowerCase())):players;
    tabContent=`
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap">
      <div class="search-wrap" style="max-width:260px;flex:1 1 200px">
        <span class="search-icon">⌕</span>
        <input class="search-input" id="adminPlayerSearch" placeholder="Search players..." oninput="renderAdmin()">
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn-gold" onclick="openAddModal()" style="font-size:13px;padding:9px 18px;display:flex;align-items:center;gap:6px"><span>+</span><span>Add Player</span></button>
        <button class="btn-ghost" onclick="autoSave();showToast('✅ Đã lưu database!',false)" style="font-size:12px;padding:9px 14px">💾 Save DB</button>
      </div>
    </div>
    <div class="card">
      <div class="table-header admin-player-cols">
        <span>Player</span><span>Rank</span><span class="ap-hide">Region</span><span class="ap-hide">DS Score</span><span>Actions</span>
      </div>
      ${filtered.map(p=>{
        const ds=calcDS(p.scores);
        const overallTier=Object.entries(TIER_LIST_DATA.Overall).find(([,names])=>names.includes(p.username))?.[0]||null;
        const tc=overallTier?tierColor(overallTier):'rgba(255,255,255,0.15)';
        const isOT=overallTier&&overallTier.startsWith('OT');
        return`
      <div class="table-row admin-player-cols" id="arow-${p.id}" style="${p.banned?'background:rgba(239,68,68,0.04);border-left:2px solid rgba(239,68,68,0.3)':''}"> 
        <div style="display:flex;align-items:center;gap:10px;min-width:0">
          ${avatarHTML(p.robloxId,p.username,32)}
          <div style="min-width:0">
            <div style="display:flex;align-items:center;gap:6px"><span style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.username}</span>${p.banned?`<span style="font-size:9px;font-weight:800;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#ef4444;border-radius:4px;padding:1px 5px;flex-shrink:0">BAN</span>`:''}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.3)">${p.winRate}% WR · ${p.matches.toLocaleString()} matches</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px">
          ${rankBadgeHTML(p.rank,'sm')}
          ${overallTier?`<span style="font-size:9px;font-weight:700;font-family:monospace;color:${tc};background:${tc}18;border:1px solid ${tc}33;border-radius:3px;padding:1px 5px;${isOT?`box-shadow:0 0 4px ${tc}44`:''}">OVR ${overallTier}</span>`:''}
        </div>
        <span class="ap-hide" style="font-size:12px;color:rgba(255,255,255,0.5)">${p.region}</span>
        <span class="ap-hide" style="font-family:monospace;color:#FFD700;font-weight:700">${ds.toLocaleString()}</span>
        <div style="display:flex;gap:6px">
          <button class="btn-gold" style="font-size:11px;padding:5px 10px" onclick="openEditModal(${p.id})">Edit</button>
          ${p.banned
            ? `<button class="btn-ghost" style="font-size:11px;padding:5px 8px;color:#22c55e;border-color:rgba(34,197,94,0.3)" onclick="unbanPlayer(${p.id})">✓ Unban</button>`
            : `<button class="btn-ghost" style="font-size:11px;padding:5px 8px;color:#ef4444;border-color:rgba(239,68,68,0.3)" onclick="openBanModal(${p.id})">🔨</button>`
          }
          <button class="btn-red" style="font-size:11px;padding:5px 8px" onclick="confirmDeletePlayer(${p.id})">✕</button>
        </div>
      </div>`}).join('')}
    </div>`;
  }else if(adminTab==='reports'){
    tabContent=`
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <button class="tag-btn${!window._reportFilter||window._reportFilter==='all'?' active':''}" onclick="window._reportFilter='all';renderAdmin()">All</button>
      <button class="tag-btn${window._reportFilter==='pending'?' active':''}" onclick="window._reportFilter='pending';renderAdmin()">Pending</button>
      <button class="tag-btn${window._reportFilter==='resolved'?' active':''}" onclick="window._reportFilter='resolved';renderAdmin()">Resolved</button>
    </div>
    <div class="card">
      ${adminReports.filter(r=>!window._reportFilter||window._reportFilter==='all'||r.status===window._reportFilter).map(r=>`
      <div class="report-row">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:200px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap">
              <span style="font-weight:700;font-size:14px">${r.player}</span>
              <span class="report-badge" style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#ef4444">${r.type}</span>
              <span class="report-badge" style="background:${r.status==='pending'?'rgba(255,165,0,0.1)':'rgba(34,197,94,0.1)'};border:1px solid ${r.status==='pending'?'rgba(255,165,0,0.3)':'rgba(34,197,94,0.3)'};color:${r.status==='pending'?'#FFA500':'#22c55e'}">${r.status==='pending'?'⏳ Pending':'✅ Resolved'}</span>
            </div>
            <div style="font-size:11px;color:rgba(255,255,255,0.25)">Reported by <span style="color:rgba(255,215,0,0.5)">${r.reporter}</span> · ${r.time}</div>
          </div>
          ${r.status==='pending'?`<div style="display:flex;gap:7px">
            <button class="btn-green" style="font-size:12px;padding:6px 12px" onclick="resolveReport(${r.id},'approve')">✓ Approve</button>
            <button class="btn-red" style="font-size:12px;padding:6px 12px" onclick="resolveReport(${r.id},'reject')">✕ Reject</button>
          </div>`:`<div style="font-size:12px;color:rgba(255,255,255,0.2)">Closed</div>`}
        </div>
      </div>`).join('')}
    </div>`;
  }else if(adminTab==='tiers'){
    const tierData=getAdminTierData();
    const curMode=window._adminTierMode||'Overall';
    const modeData=tierData[curMode]||{};
    const allBacs=[...new Set(TIERS.map(t=>t.replace(/^[A-Z]+/,'')))];
    tabContent=`
    <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">
      ${MODES.map(m=>`<button class="tag-btn${m===curMode?' active':''}" onclick="window._adminTierMode='${m}';renderAdmin()">${m}</button>`).join('')}
    </div>
    <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:14px;padding:0 2px">Click <strong style="color:rgba(255,215,0,0.6)">Edit</strong> để quản lý player trong từng tier</div>
    <div style="display:flex;flex-direction:column;gap:16px">
      ${allBacs.map(bac=>{
        const tiersInBac=['OT','HT','MT','LT'].map(p=>p+bac);
        return`<div style="background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.05);border-radius:12px;overflow:hidden">
          <div style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:8px">
            <span style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,0.25)">Bậc ${bac}</span>
            <div style="flex:1;height:1px;background:rgba(255,255,255,0.04)"></div>
            <span style="font-size:10px;color:rgba(255,255,255,0.15)">${tiersInBac.reduce((s,t)=>s+((modeData[t]||[]).length),0)} players</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:0">
            ${tiersInBac.map((tier,ti)=>{
              const tierPlayers=(modeData[tier])||[];
              const tm=TIER_META_STYLE[tier]||{label:'#fff',border:'rgba(255,255,255,0.1)',tag:'rgba(255,255,255,0.05)',glow:false};
              const isOT=tier.startsWith('OT');
              return`<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;${ti<3?'border-bottom:1px solid rgba(255,255,255,0.04)':''}">
                <span style="font-size:11px;font-weight:900;font-family:monospace;color:${tm.label};width:36px;flex-shrink:0;${isOT?'text-shadow:0 0 8px rgba(255,215,0,0.5)':''}">${tier}</span>
                <div style="flex:1;display:flex;flex-wrap:wrap;gap:6px;min-width:0">
                  ${tierPlayers.length?tierPlayers.map(name=>`<span style="background:${tm.tag};border:1px solid ${tm.border};border-radius:5px;padding:2px 8px;font-size:11px;color:${tm.label}">${name}</span>`).join('')
                  :`<span style="font-size:11px;color:rgba(255,255,255,0.15)">Empty</span>`}
                </div>
                <button class="btn-gold" style="font-size:10px;padding:4px 10px;flex-shrink:0" onclick="openTierEdit('${tier}','${curMode}')">Edit</button>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  } else if(adminTab==='banned'){
    const bannedPlayers=players.filter(p=>p.banned);
    tabContent=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div>
        <span style="font-size:13px;color:rgba(255,255,255,0.4)">${bannedPlayers.length} player bị ban</span>
      </div>
    </div>
    ${bannedPlayers.length===0
      ? `<div class="card" style="padding:48px;text-align:center">
          <div style="font-size:40px;margin-bottom:12px">✅</div>
          <div style="color:rgba(255,255,255,0.4);font-size:14px">Không có player nào bị ban</div>
        </div>`
      : `<div class="card" style="overflow:hidden">
          ${bannedPlayers.map(p=>{
            const unbanDate = p.banUntil ? new Date(p.banUntil) : null;
            const isPerm = !p.banUntil;
            const now = new Date();
            const expired = unbanDate && unbanDate <= now;
            const timeLeft = unbanDate && !expired
              ? (() => {
                  const diff = unbanDate - now;
                  const d = Math.floor(diff/86400000);
                  const h = Math.floor((diff%86400000)/3600000);
                  const m2 = Math.floor((diff%3600000)/60000);
                  return d>0?`${d} ngày ${h}h`:h>0?`${h}h ${m2}m`:`${m2} phút`;
                })()
              : null;
            return `<div style="display:grid;grid-template-columns:1fr auto;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(239,68,68,0.1);align-items:center">
              <div style="display:flex;align-items:center;gap:12px;min-width:0">
                <div style="width:36px;height:36px;border-radius:8px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">🔨</div>
                <div style="min-width:0">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px">
                    <span style="font-weight:700;font-size:14px;color:#fff">${p.username}</span>
                    ${expired
                      ? `<span style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);color:#22c55e;font-size:10px;font-weight:700;border-radius:4px;padding:1px 7px">Hết hạn</span>`
                      : isPerm
                        ? `<span style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.35);color:#ef4444;font-size:10px;font-weight:700;border-radius:4px;padding:1px 7px">PERMANENT</span>`
                        : `<span style="background:rgba(255,165,0,0.1);border:1px solid rgba(255,165,0,0.3);color:#FFA500;font-size:10px;font-weight:700;border-radius:4px;padding:1px 7px">Còn ${timeLeft}</span>`
                    }
                  </div>
                  <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:2px">Lí do: <span style="color:rgba(255,100,100,0.8)">${p.banReason||'Không có lí do'}</span></div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.2)">
                    Ban bởi <span style="color:rgba(255,215,0,0.5)">${p.bannedBy||'Admin'}</span> · ${p.bannedAt||'Unknown'}
                    ${isPerm?'· Permanent':unbanDate?` · Hết hạn: ${unbanDate.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}`:''}
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:6px;flex-shrink:0">
                <button class="btn-ghost" style="font-size:11px;padding:5px 10px;color:#22c55e;border-color:rgba(34,197,94,0.3)" onclick="unbanPlayer(${p.id})">✓ Unban</button>
              </div>
            </div>`;
          }).join('')}
        </div>`
    }`;
  } else if(adminTab==='banlogs'){
    tabContent=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <span style="font-size:13px;color:rgba(255,255,255,0.4)">${adminBanLogs.length} bản ghi · lịch sử ban/unban</span>
      ${isAdminRole?`<button class="btn-ghost" onclick="if(confirm('Xóa toàn bộ ban logs? Không thể hoàn tác.')){adminBanLogs=[];autoSave();renderAdmin()}" style="font-size:12px">🗑 Clear Ban Logs</button>`:''}
    </div>
    <div class="card" style="overflow:hidden">
      ${adminBanLogs.length===0
        ? '<div style="padding:24px;text-align:center;color:rgba(255,255,255,0.2)">Chưa có lịch sử ban nào</div>'
        : adminBanLogs.map(l=>`
      <div style="display:grid;grid-template-columns:100px 1fr 1fr 90px 130px;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;align-items:center">
        <span style="color:rgba(255,215,0,0.6);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.admin}</span>
        <span style="font-weight:700;color:${l.action==='Ban'?'#ef4444':'#22c55e'}">${l.action==='Ban'?'🔨 Ban':'✓ Unban'} <span style="color:#fff;font-weight:600">${l.player}</span></span>
        <span style="color:rgba(255,255,255,0.5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.reason||'-'}</span>
        <span style="color:rgba(255,255,255,0.35)">${l.duration||'-'}</span>
        <span style="color:rgba(255,255,255,0.25);text-align:right">${l.time}</span>
      </div>`).join('')}
    </div>`;
  } else if(adminTab==='accounts'){
    if(!isAdminRole){
      tabContent='<div class="card" style="text-align:center;padding:40px;color:rgba(255,255,255,0.4)">⛔ Chỉ Admin mới có quyền quản lý tài khoản.</div>';
    } else {
      const ROLE_COLORS={Admin:'#FFD700',Mod:'#22c55e',Staff:'#a855f7'};
      tabContent=`
      <div class="card" style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
          <span style="font-weight:700;font-size:15px;color:#FFD700">🔑 Danh sách tài khoản Staff (${STAFF_ACCOUNTS.length})</span>
          <button class="btn-gold" style="font-size:12px;padding:7px 15px" onclick="openAddAccountModal()">+ Tạo tài khoản</button>
        </div>
        <div class="table-header" style="grid-template-columns:1fr 1fr 1fr 80px">
          <span>Username</span><span>Role</span><span>Badge</span><span>Xóa</span>
        </div>
        ${STAFF_ACCOUNTS.map((a,i)=>`
        <div class="table-row" style="grid-template-columns:1fr 1fr 1fr 80px">
          <span style="font-weight:700;color:#fff">${a.username}</span>
          <span><span style="background:${ROLE_COLORS[a.role]||'#6b7280'}22;color:${ROLE_COLORS[a.role]||'#6b7280'};border:1px solid ${ROLE_COLORS[a.role]||'#6b7280'}55;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:700">${a.role}</span></span>
          <span style="font-size:12px;color:rgba(255,255,255,0.5)">${a.badge}</span>
          <span>${a.username==='admin'?'<span style="color:rgba(255,255,255,0.2);font-size:12px">—</span>':`<button class="btn-red-lg" style="font-size:11px;padding:4px 10px" onclick="deleteStaffAccount(${i})">Xóa</button>`}</span>
        </div>`).join('')}
      </div>`;
    }
  } else if(adminTab==='logs'){
    tabContent=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <span style="font-size:13px;color:rgba(255,255,255,0.4)">${adminAuditLogs.length} entries</span>
      <button class="btn-ghost" onclick="adminAuditLogs=[];autoSave();renderAdmin()" style="font-size:12px">🗑 Clear Logs</button>
    </div>
    <div class="card" style="overflow:hidden">
      ${adminAuditLogs.slice(0,50).map(l=>`
      <div style="display:grid;grid-template-columns:90px 1fr 1fr 80px;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;align-items:center">
        <span style="color:rgba(255,215,0,0.6);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.admin}</span>
        <span style="color:rgba(255,255,255,0.7)">${l.action} · <span style="color:#FFD700">${l.player}</span></span>
        <span style="color:rgba(255,255,255,0.3)">${l.old} → <span style="color:rgba(255,255,255,0.55)">${l.new}</span></span>
        <span style="color:rgba(255,255,255,0.25);text-align:right">${l.time}</span>
      </div>`).join('')||'<div style="padding:24px;text-align:center;color:rgba(255,255,255,0.2)">No logs</div>'}
    </div>`;
  }

  c.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <div class="page-label"><div class="page-label-bar"></div><span class="page-label-text">Restricted · Staff Only</span></div>
        <h1 class="page-title">Admin Panel</h1>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span id="dbSaveStatus" style="font-size:11px;color:#22c55e"></span>
        <button class="btn-ghost" onclick="autoSave();showToast('✅ Saved!',false)" style="font-size:12px">💾</button>
        <button class="btn-red-lg" onclick="staffSignOut()">Sign Out</button>
      </div>
    </div>
    ${statsBar}
    <div style="display:flex;gap:6px;margin-bottom:20px;flex-wrap:wrap">
      ${TABS.map(([v,l])=>`<button class="tag-btn${v===adminTab?' active':''}" onclick="setAdminTab('${v}')">${l}</button>`).join('')}
    </div>
    ${tabContent}
  `;
}

// Patch save hooks into existing functions
const _origSavePlayerEdit = savePlayerEdit;
savePlayerEdit = function(){
  _origSavePlayerEdit();
  autoSave();
};
const _origConfirmAddPlayer = confirmAddPlayer;
confirmAddPlayer = function(){
  _origConfirmAddPlayer();
  autoSave();
};
const _origDeletePlayer = deletePlayer;
deletePlayer = function(id){
  _origDeletePlayer(id);
  autoSave();
};
const _origSaveTierEdit = saveTierEdit;
saveTierEdit = function(){
  _origSaveTierEdit();
  autoSave();
};
const _origResolveReport = resolveReport;
resolveReport = function(id,action){
  _origResolveReport(id,action);
  autoSave();
};

// ═══════════════════════════════════════════════════════════
//  INIT — Load from localStorage if available
// ═══════════════════════════════════════════════════════════
(function init(){
  // Load persisted data
  const db = dbLoad();
  if(db){
    if(db.players && db.players.length){
      PLAYERS.length = 0;
      db.players.forEach(p=>PLAYERS.push(p));
    }
    if(db.tierListData) Object.assign(TIER_LIST_DATA, db.tierListData);
    if(db.auditLogs) adminAuditLogs = db.auditLogs;
    if(db.banLogs) adminBanLogs = db.banLogs;
    if(db.staffAccounts && db.staffAccounts.length){
      STAFF_ACCOUNTS.length = 0;
      db.staffAccounts.forEach(a=>STAFF_ACCOUNTS.push(a));
    }
    if(db.reports) adminReports = db.reports;
    if(db.discordConfig) Object.assign(discordConfig, db.discordConfig);
    if(db.verifiedUsers){
      Object.keys(VERIFIED_USERS).forEach(k=>delete VERIFIED_USERS[k]);
      Object.assign(VERIFIED_USERS, db.verifiedUsers);
    }
  }
  // Start auto-sync if configured
  if(discordConfig.autoSyncInterval > 0) startAutoSync();

  // Handle Discord OAuth2 redirect (implicit grant — token in URL hash)
  handleDiscordOAuthCallback();

  const modeWrap=$id('modeButtons');
  if(modeWrap) modeWrap.innerHTML=MODES.map(function(m){return'<button class="pill-btn'+(m===lbMode?' active':'')+'" onclick="setLbMode(\''+m+'\')">'+m+'</button>';}).join('');
  renderLeaderboard();
})();

