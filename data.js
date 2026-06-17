// ═══════════════════════════════════════════════════════════
//  DATA

// Verification flags, keyed by username (kept in sync with player records
// and persisted via dbSave/dbLoad so admin changes survive a page reload).
const VERIFIED_USERS = {
  Kaimc:{tryouter:true,discord:true},
};

function getVerification(username){
  return VERIFIED_USERS[username] || {tryouter:false,discord:false};
}

function setVerification(username,key,value){
  if(!VERIFIED_USERS[username]) VERIFIED_USERS[username]={tryouter:false,discord:false};
  VERIFIED_USERS[username][key]=!!value;
  // Clean up empty entries so the object doesn't grow forever
  const v=VERIFIED_USERS[username];
  if(!v.tryouter && !v.discord) delete VERIFIED_USERS[username];
}

// Rename a key when a player's username is edited, so verification follows them.
function renameVerification(oldUsername,newUsername){
  if(oldUsername===newUsername) return;
  if(VERIFIED_USERS[oldUsername]){
    VERIFIED_USERS[newUsername]=VERIFIED_USERS[oldUsername];
    delete VERIFIED_USERS[oldUsername];
  }
}

// Running counter so every rendered tryouter badge gets a unique SVG
// gradient id (SVG <defs> ids must be unique per document, and a player's
// name can appear many times across leaderboard/podium/profile at once).
let _tryoBadgeSeq=0;

function tryouterBadgeSVG(){
  const uid='tryoHoloGrad'+(_tryoBadgeSeq++);
  return `<span class="verif-badge verif-tryouter" title="Tryouter Verified — đã qua tryout, được Admin xác nhận">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFE9A8"/>
          <stop offset="25%" stop-color="#FFD700"/>
          <stop offset="50%" stop-color="#FF9DE2"/>
          <stop offset="75%" stop-color="#9FD8FF"/>
          <stop offset="100%" stop-color="#FFD700"/>
        </linearGradient>
      </defs>
      <g class="tryo-grad-rotor">
        <path class="tryo-facet" style="fill:url(#${uid})" d="M 12 1.4 L 14.97 9.03 L 22.6 12 L 14.97 14.97 L 12 22.6 L 9.03 14.97 L 1.4 12 L 9.03 9.03 Z"/>
      </g>
      <path class="tryo-core" d="M 12 6.2 L 13.63 10.37 L 17.8 12 L 13.63 13.63 L 12 17.8 L 10.37 13.63 L 6.2 12 L 10.37 10.37 Z"/>
      <circle class="tryo-sparkle" cx="15.6" cy="8.4" r="0.85"/>
    </svg>
  </span>`;
}

function verificationBadges(username){
  const v=VERIFIED_USERS[username];
  if(!v) return '';
  let h='';
  // Tryouter badge comes first and is visually primary — it means the
  // player actually proved their skill in a live tryout, judged by an admin.
  if(v.tryouter) h+=tryouterBadgeSVG();
  if(v.discord) h+='<span class="verif-badge verif-discord" title="Discord Verified — đã liên kết &amp; được Admin duyệt"> ✔</span>';
  return h;
}


// ═══════════════════════════════════════════════════════════
const REGIONS = ["Global","Vietnam","Thailand","Indonesia","Philippines","Malaysia","Singapore","North America","Europe"];
const MODES   = ["Overall","Solo","Dual","Speed Run"];
// 40-tier system: OT1 (highest) → LT10 (lowest), displayed top to bottom
const TIERS = (()=>{
  const rows=[];
  for(let n=1;n<=10;n++){
    rows.push('OT'+n,'HT'+n,'MT'+n,'LT'+n);
  }
  return rows;
})();
const RANK_TIERS = ["LT","MT","HT","OT"];

const RANK_COLORS = {
  LT:{text:"#9CA3AF",bg:"rgba(156,163,175,0.1)",border:"rgba(156,163,175,0.3)"},
  MT:{text:"#FFFFFF",bg:"rgba(255,255,255,0.1)",border:"rgba(255,255,255,0.3)"},
  HT:{text:"#C0C0C0",bg:"rgba(192,192,192,0.12)",border:"rgba(192,192,192,0.4)"},
  OT:{text:"#FFD700",bg:"rgba(255,215,0,0.12)",border:"rgba(255,215,0,0.4)"},
};

const PLAYERS = [
  {id:1,username:"Kaimc",robloxId:"2661309510",region:"Vietnam",rank:"OT1",scores:{overall:9800,"1v1":9750,"1v2":9700,"2v2":9600,speedrun:9500,sd:9820},winRate:87,matches:1240},
  {id:2,username:"Shadow",robloxId:"987654321",region:"Philippines",rank:"OT1",scores:{overall:9600,"1v1":9500,"1v2":9650,"2v2":9400,speedrun:9300,sd:9550},winRate:84,matches:980},
  {id:3,username:"Dragon",robloxId:"112233445",region:"Thailand",rank:"HT1",scores:{overall:9400,"1v1":9300,"1v2":9200,"2v2":9100,speedrun:9000,sd:9350},winRate:81,matches:1100},
  {id:4,username:"Alpha",robloxId:"556677889",region:"Indonesia",rank:"HT1",scores:{overall:9200,"1v1":9100,"1v2":9000,"2v2":8900,speedrun:8800,sd:9150},winRate:79,matches:870},
  {id:5,username:"NightKing",robloxId:"223344556",region:"Malaysia",rank:"MT1",scores:{overall:9000,"1v1":8900,"1v2":8800,"2v2":8700,speedrun:8600,sd:8950},winRate:77,matches:760},
  {id:6,username:"ViperX",robloxId:"334455667",region:"Singapore",rank:"MT1",scores:{overall:8800,"1v1":8700,"1v2":8600,"2v2":8500,speedrun:8400,sd:8750},winRate:75,matches:650},
  {id:7,username:"ZeroTwo",robloxId:"445566778",region:"North America",rank:"LT1",scores:{overall:8600,"1v1":8500,"1v2":8400,"2v2":8300,speedrun:8200,sd:8550},winRate:73,matches:540},
  {id:8,username:"Phoenix",robloxId:"556677880",region:"Europe",rank:"LT1",scores:{overall:8400,"1v1":8300,"1v2":8200,"2v2":8100,speedrun:8000,sd:8350},winRate:71,matches:430},
  {id:9,username:"BlazeFist",robloxId:"667788991",region:"Vietnam",rank:"OT2",scores:{overall:8200,"1v1":8100,"1v2":8000,"2v2":7900,speedrun:7800,sd:8150},winRate:69,matches:390},
  {id:10,username:"IceLord",robloxId:"778899002",region:"Global",rank:"OT2",scores:{overall:8000,"1v1":7900,"1v2":7800,"2v2":7700,speedrun:7600,sd:7950},winRate:67,matches:340},
  {id:11,username:"StormBlade",robloxId:"889900113",region:"Philippines",rank:"HT2",scores:{overall:7800,"1v1":7700,"1v2":7600,"2v2":7500,speedrun:7400,sd:7750},winRate:65,matches:280},
  {id:12,username:"Specter",robloxId:"990011224",region:"Indonesia",rank:"HT2",scores:{overall:7600,"1v1":7500,"1v2":7400,"2v2":7300,speedrun:7200,sd:7550},winRate:63,matches:240},
  {id:13,username:"Falcon",robloxId:"101122335",region:"Thailand",rank:"MT2",scores:{overall:7400,"1v1":7300,"1v2":7200,"2v2":7100,speedrun:7000,sd:7350},winRate:61,matches:210},
  {id:14,username:"GhostWing",robloxId:"112233446",region:"Malaysia",rank:"MT2",scores:{overall:7200,"1v1":7100,"1v2":7000,"2v2":6900,speedrun:6800,sd:7150},winRate:59,matches:190},
  {id:15,username:"TitanX",robloxId:"223344557",region:"Europe",rank:"LT2",scores:{overall:7000,"1v1":6900,"1v2":6800,"2v2":6700,speedrun:6600,sd:6950},winRate:57,matches:170},
];

const TIER_LIST_DATA = {
  Overall:{
    "OT1":["Kaimc","Shadow"],
    "HT1":["Dragon","Alpha"],
    "MT1":["NightKing","ViperX"],
    "LT1":["ZeroTwo","Phoenix"],
    "OT2":["BlazeFist","IceLord"],
    "HT2":["StormBlade","Specter"],
    "MT2":["Falcon","GhostWing"],
    "LT2":["TitanX"],
  },
  Solo:{
    "OT1":["Kaimc","Shadow"],
    "HT1":["Alpha","Dragon"],
    "MT1":["NightKing","ViperX"],
    "LT1":["ZeroTwo","Phoenix"],
    "OT2":["BlazeFist"],
    "HT2":["Specter"],
    "MT2":["IceLord"],
    "LT2":["TitanX"],
  },
  Dual:{
    "OT1":["Alpha","Kaimc"],
    "HT1":["Shadow","Dragon"],
    "MT1":["NightKing","ZeroTwo"],
    "LT1":["ViperX","Phoenix"],
    "OT2":["BlazeFist"],
    "HT2":["Specter"],
    "MT2":["GhostWing"],
    "LT2":["TitanX"],
  },
  "Speed Run":{
    "OT1":["Dragon","Kaimc"],
    "HT1":["Shadow","NightKing"],
    "MT1":["Alpha","ViperX"],
    "LT1":["ZeroTwo","BlazeFist"],
    "OT2":["Phoenix"],
    "HT2":["IceLord"],
    "MT2":["StormBlade"],
    "LT2":["Falcon"],
  },
};

const META_UPDATES = [
  {id:1,type:"buff",title:"Leopard Fruit",desc:"Combo damage increased by 15%. Now viable in Solo meta.",date:"Jun 10, 2026",icon:"⬆"},
  {id:2,type:"nerf",title:"Dragon Fruit",desc:"Z move cooldown increased from 8s to 12s. Top-tier pick impacted.",date:"Jun 10, 2026",icon:"⬇"},
  {id:3,type:"rank",title:"Ranking Reset",desc:"Season 7 begins. All OT1 players retain rank, LT1 players reset to LT2.",date:"Jun 8, 2026",icon:"🏆"},
  {id:4,type:"season",title:"Season 7 Launch",desc:"New region: Europe now officially tracked. New Speed Run leaderboard.",date:"Jun 8, 2026",icon:"⚡"},
  {id:5,type:"buff",title:"Dough Fruit",desc:"Awakened moves reverted to pre-patch values after community feedback.",date:"Jun 5, 2026",icon:"⬆"},
  {id:6,type:"nerf",title:"Kitsune Fruit",desc:"Passive healing reduced by 20% in PvP modes.",date:"Jun 3, 2026",icon:"⬇"},
];

const MATCH_HISTORY = [
  {id:1,mode:"Solo",result:"W",opponent:"Shadow",score:"3-1",date:"2h ago"},
  {id:2,mode:"Dual",result:"W",opponent:"Dragon & Alpha",score:"3-2",date:"4h ago"},
  {id:3,mode:"1v2",result:"L",opponent:"NightKing & ViperX",score:"1-3",date:"6h ago"},
  {id:4,mode:"SD",result:"W",opponent:"ZeroTwo",score:"5-2",date:"1d ago"},
  {id:5,mode:"Solo",result:"W",opponent:"Phoenix",score:"3-0",date:"1d ago"},
];

const AUDIT_LOGS = [
  {admin:"AdminUser",action:"Updated Rank",player:"Kaimc",old:"HT1",new:"OT1",time:"2h ago"},
  {admin:"AdminUser",action:"Updated DS Score",player:"Shadow",old:"9200",new:"9550",time:"5h ago"},
  {admin:"AdminUser",action:"Tier List Edit",player:"Dragon",old:"S",new:"A+",time:"1d ago"},
  {admin:"ModUser",action:"Report Approved",player:"Alpha",old:"-",new:"Wrong Region",time:"1d ago"},
];

