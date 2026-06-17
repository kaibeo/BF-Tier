const supabase = window.supabase.createClient(
  "https://snucncoddldeqhzbcvbd.supabase.co",
  "sb_publishable_kSCd6gnAXA3AZ34xZD0ffw_V_1TWYV1"
);
// ═══════════════════════════════════════════════════════════
//  DATABASE SYSTEM — localStorage persistent storage
// ═══════════════════════════════════════════════════════════
const DB_KEY = 'bfmetahub_v4';

function dbLoad(){
  try{
    const raw = localStorage.getItem(DB_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}

function dbSave(data){
  try{
    const payload = {
      players: data.players || PLAYERS,
      tierListData: data.tierListData || TIER_LIST_DATA,
      metaUpdates: data.metaUpdates || META_UPDATES,
      auditLogs: data.auditLogs || adminAuditLogs,
      banLogs: data.banLogs || adminBanLogs,
      staffAccounts: data.staffAccounts || STAFF_ACCOUNTS,
      reports: data.reports || adminReports,
      discordConfig: data.discordConfig || discordConfig,
      verifiedUsers: data.verifiedUsers || VERIFIED_USERS,
      lastSaved: new Date().toISOString(),
      version: 5
    };
    localStorage.setItem(DB_KEY, JSON.stringify(payload));
    return true;
  }catch(e){ return false; }
}

function dbReset(){
  localStorage.removeItem(DB_KEY);
  showToast('🗑 Database reset. Tải lại trang để khôi phục dữ liệu mặc định.', false);
}

function dbExport(){
  const db = dbLoad() || buildCurrentDB();
  const blob = new Blob([JSON.stringify(db,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'bfmetahub-db-'+Date.now()+'.json';
  a.click(); URL.revokeObjectURL(url);
  showToast('✅ Database exported!', false);
}

function dbImport(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try{
      const data = JSON.parse(e.target.result);
      if(!data.players) throw new Error('Invalid format');
      // Apply imported data
      PLAYERS.length = 0;
      data.players.forEach(p=>PLAYERS.push(p));
      adminPlayers = null;
      if(data.tierListData) Object.assign(TIER_LIST_DATA, data.tierListData);
      if(data.auditLogs) adminAuditLogs = data.auditLogs;
      if(data.banLogs) adminBanLogs = data.banLogs;
      if(data.staffAccounts && data.staffAccounts.length){
        STAFF_ACCOUNTS.length = 0;
        data.staffAccounts.forEach(a=>STAFF_ACCOUNTS.push(a));
      }
      if(data.reports) adminReports = data.reports;
      if(data.discordConfig) Object.assign(discordConfig, data.discordConfig);
      if(data.verifiedUsers){
        Object.keys(VERIFIED_USERS).forEach(k=>delete VERIFIED_USERS[k]);
        Object.assign(VERIFIED_USERS, data.verifiedUsers);
      }
      dbSave(buildCurrentDB());
      showToast('✅ Database imported! '+data.players.length+' players loaded.', false);
      renderAdmin();
    }catch(err){
      showToast('⚠ Import thất bại: ' + err.message, true);
    }
  };
  reader.readAsText(file);
}

function buildCurrentDB(){
  return {
    players: getAdminPlayers(),
    tierListData: TIER_LIST_DATA,
    metaUpdates: META_UPDATES,
    auditLogs: adminAuditLogs,
    banLogs: adminBanLogs,
    staffAccounts: STAFF_ACCOUNTS,
    reports: adminReports,
    discordConfig: discordConfig,
    verifiedUsers: VERIFIED_USERS,
    lastSaved: new Date().toISOString(),
    version: 5
  };
}

function autoSave(){
  const ok = dbSave(buildCurrentDB());
  const el = $id('dbSaveStatus');
  if(el){
    el.textContent = ok ? '✅ Saved ' + new Date().toLocaleTimeString() : '⚠ Save failed';
    el.style.color = ok ? '#22c55e' : '#ef4444';
  }
}

// ═══════════════════════════════════════════════════════════
//  DISCORD BOT API SYNC
// ═══════════════════════════════════════════════════════════
let discordConfig = {
  webhookUrl: '',
  botToken: '',
  guildId: '',
  channelId: '',
  syncEnabled: false,
  lastSync: null,
  autoSyncInterval: 0, // minutes, 0 = disabled
};

let discordSyncTimer = null;

// Simulated Discord bot sync — in production this calls your real bot API
async function discordSync(direction='push'){
  const cfg = discordConfig;
  if(!cfg.webhookUrl && !cfg.botToken){
    showToast('⚠ Cấu hình Discord webhook/token trước!', true);
    return;
  }

  const syncBtn = $id('discordSyncBtn');
  if(syncBtn){ syncBtn.disabled=true; syncBtn.textContent='⏳ Đang sync...';}

  try{
    if(direction==='push' && cfg.webhookUrl){
      // Push leaderboard data to Discord webhook
      const top5 = [...PLAYERS]
        .sort((a,b)=>rankSortValue(b.rank)-rankSortValue(a.rank)||calcDS(b.scores)-calcDS(a.scores))
        .slice(0,5);

      const embeds = [{
        title: '🏆 BF META HUB · Season 7 Leaderboard',
        color: 0xFFD700,
        description: top5.map((p,i)=>{
          const medals=['','🥇','🥈','🥉','4️⃣','5️⃣'];
          return `${medals[i+1]} **${p.username}** · \`${p.rank}\` · DS: **${calcDS(p.scores).toLocaleString()}**`;
        }).join('\n'),
        footer:{text:'BF META HUB · '+new Date().toLocaleString()},
        thumbnail:{url:'https://i.imgur.com/JB6gCpI.png'}
      }];

      const res = await fetch(cfg.webhookUrl, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({username:'BF META HUB Bot', embeds})
      });

      if(res.ok || res.status===204){
        discordConfig.lastSync = new Date().toISOString();
        dbSave(buildCurrentDB());
        addAuditLog('DiscordBot','Webhook Push','Leaderboard','-','Top 5 sent','Just now');
        showToast('✅ Đã push leaderboard lên Discord!', false);
      } else {
        showToast('⚠ Webhook error: '+res.status+' '+res.statusText, true);
      }
    }

    if(direction==='pull'){
      // Simulate pull from Discord bot API
      // In production: fetch from your Discord bot's REST API
      showToast('📥 Pull từ Discord bot: chức năng này cần backend bot thực. Xem hướng dẫn trong tab Discord Sync.', false);
      addAuditLog('DiscordBot','Pull Request','Bot API','-','Simulated','Just now');
    }

    if(direction==='announce'){
      if(!cfg.webhookUrl){ showToast('⚠ Cần webhook URL!', true); return; }
      const players = getAdminPlayers();
      const newestPlayer = players[players.length-1];
      const embed = [{
        title: '🆕 Player mới tham gia BF META HUB!',
        color: 0x22c55e,
        description: newestPlayer
          ? `**${newestPlayer.username}** đã được thêm vào hệ thống!\n\`${newestPlayer.rank}\` · Region: ${newestPlayer.region}`
          : 'Có cập nhật mới từ BF META HUB!',
        footer:{text:'BF META HUB · '+new Date().toLocaleString()}
      }];
      const res = await fetch(cfg.webhookUrl, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username:'BF META HUB Bot', embeds: embed})
      });
      if(res.ok||res.status===204){
        showToast('✅ Announcement đã gửi lên Discord!', false);
        addAuditLog('DiscordBot','Announce','Discord','-','New player announced','Just now');
      } else {
        showToast('⚠ Webhook error: '+res.status, true);
      }
    }
  } catch(err){
    showToast('⚠ Lỗi kết nối: '+err.message, true);
  } finally {
    if(syncBtn){ syncBtn.disabled=false; syncBtn.textContent='🔄 Sync Now';}
    renderAdmin();
  }
}

function addAuditLog(admin,action,player,oldVal,newVal,time){
  adminAuditLogs.unshift({admin,action,player,old:oldVal,new:newVal,time});
  autoSave();
}

function addBanLog(action,player,reason,duration,admin){
  adminBanLogs.unshift({
    id: Date.now()+'_'+Math.random().toString(36).slice(2,7),
    action, player, reason, duration, admin,
    time: new Date().toLocaleString('vi-VN')
  });
  autoSave();
}

function startAutoSync(){
  if(discordSyncTimer) clearInterval(discordSyncTimer);
  if(discordConfig.autoSyncInterval > 0){
    discordSyncTimer = setInterval(()=>{
      discordSync('push');
    }, discordConfig.autoSyncInterval * 60000);
    showToast('⏱ Auto-sync mỗi '+discordConfig.autoSyncInterval+' phút đã bật.', false);
  }
}

function saveDiscordConfig(){
  discordConfig.webhookUrl = ($id('cfgWebhook')||{value:''}).value.trim();
  discordConfig.botToken = ($id('cfgToken')||{value:''}).value.trim();
  discordConfig.guildId = ($id('cfgGuild')||{value:''}).value.trim();
  discordConfig.channelId = ($id('cfgChannel')||{value:''}).value.trim();
  discordConfig.autoSyncInterval = parseInt(($id('cfgInterval')||{value:'0'}).value)||0;
  discordConfig.syncEnabled = !!discordConfig.webhookUrl;
  dbSave(buildCurrentDB());
  startAutoSync();
  showToast('✅ Đã lưu cấu hình Discord!', false);
  renderAdmin();
}

// Discord & DB Admin Tab content
function renderDiscordTab(){
  const cfg = discordConfig;
  const lastSync = cfg.lastSync ? new Date(cfg.lastSync).toLocaleString() : 'Chưa sync';
  return`
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
    @media(max-width:700px){grid-template-columns:1fr}
    <!-- Status Card -->
    <div class="card" style="padding:20px">
      <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px">🤖 Discord Bot Status</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="width:10px;height:10px;border-radius:50%;background:${cfg.syncEnabled?'#22c55e':'#6b7280'};box-shadow:0 0 8px ${cfg.syncEnabled?'#22c55e':'transparent'}"></div>
        <span style="font-size:14px;font-weight:600;color:${cfg.syncEnabled?'#22c55e':'rgba(255,255,255,0.4)'}">${cfg.syncEnabled?'Đã kết nối':'Chưa cấu hình'}</span>
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:6px">Last sync: <span style="color:rgba(255,255,255,0.5)">${lastSync}</span></div>
      <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:16px">Auto-sync: <span style="color:${cfg.autoSyncInterval?'#FFD700':'rgba(255,255,255,0.3)'}">${cfg.autoSyncInterval?'Mỗi '+cfg.autoSyncInterval+' phút':'Tắt'}</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="discordSyncBtn" class="btn-gold" onclick="discordSync('push')" style="display:flex;align-items:center;gap:6px;font-size:12px">🔄 Sync Now</button>
        <button class="btn-ghost" onclick="discordSync('pull')" style="font-size:12px">📥 Pull</button>
        <button class="btn-ghost" onclick="discordSync('announce')" style="font-size:12px">📣 Announce</button>
      </div>
    </div>
    <!-- Quick Actions -->
    <div class="card" style="padding:20px">
      <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px">⚡ Quick Actions</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="card" style="padding:12px 14px;text-align:left;cursor:pointer;border:none;width:100%;background:rgba(255,255,255,0.03);color:#fff;font-family:inherit" onclick="discordSync('push')">
          <div style="font-weight:600;font-size:13px;margin-bottom:2px">📤 Push Leaderboard</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.35)">Gửi top 5 lên Discord channel</div>
        </button>
        <button class="card" style="padding:12px 14px;text-align:left;cursor:pointer;border:none;width:100%;background:rgba(255,255,255,0.03);color:#fff;font-family:inherit" onclick="dbExport()">
          <div style="font-weight:600;font-size:13px;margin-bottom:2px">💾 Export DB → Bot</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.35)">Tải file JSON để nạp vào Discord bot</div>
        </button>
        <button class="card" style="padding:12px 14px;text-align:left;cursor:pointer;border:none;width:100%;background:rgba(88,101,242,0.08);color:#fff;font-family:inherit" onclick="document.getElementById('importJsonBot').click()">
          <div style="font-weight:600;font-size:13px;margin-bottom:2px;color:#5865F2">📥 Import từ Discord Bot</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.35)">Nạp file JSON từ bot vào web</div>
        </button>
        <input type="file" id="importJsonBot" accept=".json" style="display:none" onchange="dbImport(this.files[0])">
      </div>
    </div>
  </div>

  <!-- Config Form -->
  <div class="card" style="padding:20px;margin-bottom:16px">
    <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:.08em;text-transform:uppercase;margin-bottom:16px">⚙️ Cấu hình Discord Bot API</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="edit-field">
        <div class="edit-label">Webhook URL <span style="color:#ef4444">*</span></div>
        <input class="edit-input" id="cfgWebhook" placeholder="https://discord.com/api/webhooks/..." value="${cfg.webhookUrl||''}">
      </div>
      <div class="edit-field">
        <div class="edit-label">Bot Token (optional)</div>
        <input class="edit-input" id="cfgToken" type="password" placeholder="Bot token cho REST API..." value="${cfg.botToken||''}">
      </div>
      <div class="edit-field">
        <div class="edit-label">Guild (Server) ID</div>
        <input class="edit-input" id="cfgGuild" placeholder="123456789..." value="${cfg.guildId||''}">
      </div>
      <div class="edit-field">
        <div class="edit-label">Channel ID</div>
        <input class="edit-input" id="cfgChannel" placeholder="987654321..." value="${cfg.channelId||''}">
      </div>
      <div class="edit-field">
        <div class="edit-label">Auto-sync interval (phút, 0=tắt)</div>
        <input class="edit-input" id="cfgInterval" type="number" min="0" max="1440" value="${cfg.autoSyncInterval||0}">
      </div>
    </div>
    <button class="btn-save" onclick="saveDiscordConfig()" style="font-size:13px">💾 Lưu cấu hình</button>
  </div>

  <!-- Integration Guide -->
  <div class="card" style="padding:20px;border-color:rgba(88,101,242,0.2);background:rgba(88,101,242,0.04)">
    <div style="font-size:13px;font-weight:700;color:#5865F2;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px">📖 Hướng dẫn tích hợp Discord Bot</div>
    <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6">
      <div><span style="color:#FFD700;font-weight:700">Bước 1:</span> Tạo Discord Bot tại <a href="https://discord.com/developers/applications" target="_blank" style="color:#5865F2">discord.com/developers</a></div>
      <div><span style="color:#FFD700;font-weight:700">Bước 2:</span> Tạo Webhook trong Server Settings → Integrations → Webhooks</div>
      <div><span style="color:#FFD700;font-weight:700">Bước 3:</span> Paste Webhook URL vào trường Webhook URL ở trên</div>
      <div><span style="color:#FFD700;font-weight:700">Bước 4:</span> Nhấn <strong>Sync Now</strong> để push leaderboard lên Discord</div>
      <div><span style="color:#FFD700;font-weight:700">Bước 5 (Bot nâng cao):</span> Dùng <strong>Export DB</strong> để tải file JSON, nạp vào Discord bot của bạn với lệnh <code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px">/loaddb</code></div>
      <div style="margin-top:6px;padding:10px 14px;background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.15);border-radius:8px;font-size:12px;color:rgba(255,215,0,0.7)">
        💡 Lệnh bot mẫu: <code>/rank [username]</code> · <code>/leaderboard</code> · <code>/tier [player]</code> · <code>/sync</code>
      </div>
    </div>
  </div>`;
}

function renderDatabaseTab(){
  const db = dbLoad();
  const saved = db ? new Date(db.lastSaved).toLocaleString() : 'Chưa có dữ liệu';
  const size = localStorage.getItem(DB_KEY) ? (localStorage.getItem(DB_KEY).length/1024).toFixed(1) : '0';
  const players = getAdminPlayers();

  return`
  <!-- DB Stats -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
    <div class="admin-stat-card gold">
      <div class="admin-stat-icon">👥</div>
      <div class="admin-stat-val" style="color:#FFD700">${players.length}</div>
      <div class="admin-stat-label">Players</div>
    </div>
    <div class="admin-stat-card green">
      <div class="admin-stat-icon">💾</div>
      <div class="admin-stat-val" style="color:#22c55e;font-size:18px">${size}KB</div>
      <div class="admin-stat-label">DB Size</div>
    </div>
    <div class="admin-stat-card blue">
      <div class="admin-stat-icon">📋</div>
      <div class="admin-stat-val" style="color:#6366f1">${adminAuditLogs.length}</div>
      <div class="admin-stat-label">Audit Logs</div>
    </div>
    <div class="admin-stat-card red">
      <div class="admin-stat-icon">🔨</div>
      <div class="admin-stat-val" style="color:#ef4444">${adminBanLogs.length}</div>
      <div class="admin-stat-label">Ban Logs</div>
    </div>
    <div class="admin-stat-card red">
      <div class="admin-stat-icon">⚑</div>
      <div class="admin-stat-val" style="color:#ef4444">${adminReports.filter(r=>r.status==='pending').length}</div>
      <div class="admin-stat-label">Pending</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
    <!-- Save/Load -->
    <div class="card" style="padding:20px">
      <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px">💾 Lưu / Tải dữ liệu</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:14px">Last saved: <span style="color:rgba(255,255,255,0.5)">${saved}</span></div>
      <div style="font-size:11px;margin-bottom:12px" id="dbSaveStatus" style="color:#22c55e"></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn-gold" onclick="autoSave();renderAdmin()" style="font-size:13px;text-align:center">💾 Save Now</button>
        <button class="btn-ghost" onclick="dbExport()" style="font-size:13px">📤 Export JSON</button>
        <button class="btn-ghost" onclick="document.getElementById('importJsonDB').click()" style="font-size:13px">📥 Import JSON</button>
        <input type="file" id="importJsonDB" accept=".json" style="display:none" onchange="dbImport(this.files[0])">
      </div>
    </div>
    <!-- Danger Zone -->
    <div class="card" style="padding:20px;border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)">
      <div style="font-size:13px;font-weight:700;color:#ef4444;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px">⚠️ Danger Zone</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:14px;line-height:1.5">Xóa toàn bộ dữ liệu đã lưu và khôi phục về mặc định. Không thể hoàn tác.</div>
      <button class="btn-red-lg" style="width:100%;text-align:center" onclick="if(confirm('Xóa toàn bộ database? Không thể hoàn tác!')){dbReset();setTimeout(()=>location.reload(),1500)}">🗑 Reset Database</button>
    </div>
  </div>

  <!-- Player DB Table -->
  <div class="card" style="overflow:hidden">
    <div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between">
      <span style="font-weight:700;font-size:14px">📊 Player Database (${players.length} records)</span>
      <div style="display:flex;gap:8px">
        <button class="btn-gold" onclick="openAddModal()" style="font-size:12px">+ Add</button>
        <button class="btn-ghost" onclick="dbExport()" style="font-size:12px">Export</button>
      </div>
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.06)">
            <th style="padding:10px 14px;text-align:left;color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600">ID</th>
            <th style="padding:10px 14px;text-align:left;color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600">Username</th>
            <th style="padding:10px 14px;text-align:left;color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600">Rank</th>
            <th style="padding:10px 14px;text-align:left;color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600">Region</th>
            <th style="padding:10px 14px;text-align:right;color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600">DS Score</th>
            <th style="padding:10px 14px;text-align:right;color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600">WR%</th>
            <th style="padding:10px 14px;text-align:center;color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600">Verified</th>
            <th style="padding:10px 14px;text-align:center;color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${players.map((p,i)=>`
          <tr style="border-bottom:1px solid rgba(255,255,255,0.03);transition:background .15s" onmouseover="this.style.background='rgba(255,215,0,0.03)'" onmouseout="this.style.background=''"  >
            <td style="padding:8px 14px;color:rgba(255,255,255,0.3);font-family:monospace">${p.id}</td>
            <td style="padding:8px 14px;font-weight:600">${p.username}</td>
            <td style="padding:8px 14px">${rankBadgeHTML(p.rank)}</td>
            <td style="padding:8px 14px;color:rgba(255,255,255,0.5)">${p.region}</td>
            <td style="padding:8px 14px;text-align:right;font-family:monospace;color:#FFD700;font-weight:700">${calcDS(p.scores).toLocaleString()}</td>
            <td style="padding:8px 14px;text-align:right;color:rgba(255,255,255,0.6)">${p.winRate}%</td>
            <td style="padding:8px 14px;text-align:center;font-size:14px">${verificationBadges(p.username)||'<span style="color:rgba(255,255,255,0.15);font-size:11px">—</span>'}</td>
            <td style="padding:8px 14px;text-align:center">
              <div style="display:flex;gap:4px;justify-content:center">
                <button class="btn-gold" style="font-size:10px;padding:3px 8px" onclick="openEditModal(${p.id})">Edit</button>
                <button class="btn-red" style="font-size:10px;padding:3px 7px" onclick="confirmDeletePlayer(${p.id})">✕</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

