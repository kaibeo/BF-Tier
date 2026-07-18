/* ============================================
   MC TIERLIST — Application Logic
   newtiers.xyz-inspired layout
   ============================================ */

// ─── CONFIGURATION ───

// 3D bust render via crafty.gg (same API as newtiers.xyz)
const SKIN_URL = (username) =>
  `https://render.crafty.gg/3d/bust/${encodeURIComponent(username)}?width=68&height=68`;

const SKIN_URL_LG = (username) =>
  `https://render.crafty.gg/3d/bust/${encodeURIComponent(username)}?width=140&height=140`;

const TIER_ORDER = ['ht1', 'lt1', 'ht2', 'lt2', 'ht3', 'lt3', 'ht4', 'lt4', 'ht5', 'lt5'];

const TIER_META = {
  ht1: { label: 'High Tier 1', short: 'HT1', color: '#ff2244', points: 60 },
  lt1: { label: 'Low Tier 1',  short: 'LT1', color: '#ff6677', points: 40 },
  ht2: { label: 'High Tier 2', short: 'HT2', color: '#A855F7', points: 30 },
  lt2: { label: 'Low Tier 2',  short: 'LT2', color: '#C185F9', points: 20 },
  ht3: { label: 'High Tier 3', short: 'HT3', color: '#22D3EE', points: 10 },
  lt3: { label: 'Low Tier 3',  short: 'LT3', color: '#67E4F5', points: 6 },
  ht4: { label: 'High Tier 4', short: 'HT4', color: '#34D399', points: 4 },
  lt4: { label: 'Low Tier 4',  short: 'LT4', color: '#7EE8BE', points: 3 },
  ht5: { label: 'High Tier 5', short: 'HT5', color: '#60A5FA', points: 2 },
  lt5: { label: 'Low Tier 5',  short: 'LT5', color: '#94C2FB', points: 1 },
};

const TITLE_META = {
  legend:      { label: 'Legend',      color: '#FFD700', glow: 'rgba(255,215,0,0.45)' },
  grandmaster: { label: 'Grandmaster', color: '#FF3CAC', glow: 'rgba(255,60,172,0.4)' },
  tester:      { label: 'Tester',      color: '#22D3EE', glow: 'rgba(34,211,238,0.4)' },
  creator:     { label: 'Creator',     color: '#A855F7', glow: 'rgba(168,85,247,0.4)' },
  veteran:     { label: 'Veteran',     color: '#34D399', glow: 'rgba(52,211,153,0.4)' },
  rising:      { label: 'Rising Star', color: '#60A5FA', glow: 'rgba(96,165,250,0.4)' },
  // Rank-based combat titles (Overall leaderboard top 5)
  godcombat:    { label: 'God Combat',    color: '#FF2244', glow: 'rgba(255,34,68,0.5)' },
  supercombat:  { label: 'Super Combat',  color: '#A855F7', glow: 'rgba(168,85,247,0.5)' },
  hypercombat:  { label: 'Hyper Combat',  color: '#22D3EE', glow: 'rgba(34,211,238,0.5)' },
  trypercombat: { label: 'Tryper Combat', color: '#34D399', glow: 'rgba(52,211,153,0.45)' },
};

const REGION_META = {
  NA:  { color: '#60A5FA' },
  EU:  { color: '#A855F7' },
  AS:  { color: '#F472B6' },
  AU:  { color: '#34D399' },
  SA:  { color: '#FBBF24' },
};

// Matches mctiers.com's actual gamemode set
const GAMEMODES = ['overall', 'vanilla', 'uhc', 'pot', 'nethop', 'smp', 'sword', 'axe', 'mace'];

const GAMEMODE_LABELS = {
  overall: 'Overall',
  vanilla: 'Crystal PvP',
  uhc:     'UHC PvP',
  pot:     'Pot PvP',
  nethop:  'Neth PvP',
  smp:     'Smp PvP',
  sword:   'Sword PvP',
  axe:     'Axe PvP',
  mace:    'Mace PvP',
};

// Real Minecraft item art (Minecraft Wiki CDN) representing each gamemode.
// Falls back to the hand-drawn SVG icon (onerror below) if the image 404s
// or the person is offline, so the UI never breaks.
const GAMEMODE_ITEM_IMG = {
  overall: 'overall-sword.jpg',
  vanilla: 'https://minecraft.wiki/images/Invicon_End_Crystal.gif',
  uhc:     'https://minecraft.wiki/images/Invicon_Water_Bucket.png',
  pot:     'https://minecraft.wiki/images/Invicon_Potion_of_Healing.png',
  nethop:  'https://minecraft.wiki/images/Invicon_Netherite_Chestplate.png',
  smp:     'https://minecraft.wiki/images/Invicon_Shield.png',
  sword:   'https://minecraft.wiki/images/Invicon_Diamond_Sword.png',
  axe:     'https://minecraft.wiki/images/Invicon_Diamond_Axe.png',
  mace:    'https://minecraft.wiki/images/Invicon_Mace.png',
};

// Renders the item image for a gamemode; if it fails to load, swaps in the
// hand-drawn SVG icon (same one used elsewhere) so nothing ever breaks.
function gamemodeItemImgHtml(mode, size, extraClass = '') {
  const iconId = `icon-${mode === 'nethop' ? 'nethpot' : mode === 'overall' ? 'crosshair' : mode}`;
  const imgUrl = GAMEMODE_ITEM_IMG[mode];
  if (!imgUrl) {
    return `<svg width="${size}" height="${size}" class="${extraClass}"><use href="#${iconId}"/></svg>`;
  }
  return `<img src="${imgUrl}" width="${size}" height="${size}" class="gamemode-item-img ${extraClass}" alt="${GAMEMODE_LABELS[mode] || mode}" loading="lazy"
    onerror="this.outerHTML='<svg width=&quot;${size}&quot; height=&quot;${size}&quot; class=&quot;${extraClass}&quot;><use href=&quot;#${iconId}&quot;/></svg>'" />`;
}

// ─── MOCK PLAYER DATABASE ───
const PLAYERS = [
  { id: 1, username: 'ArrilDrop', region: 'EU', status: 'stable', title: 'legend', verified: true, tiers: { vanilla: 'ht1', overall: 'ht1' }, discord: 'arrildrop#7912', youtube: 'https://youtube.com/@arrildrop', stats: { wr: '56%', elo: 264, streak: 18 }, history: [{ from: 'HT1', to: 'HT1', mode: 'Vanilla', date: 'Feb 2026' }] },
  { id: 2, username: 'Falig', region: 'SA', status: 'stable', title: 'tester', verified: true, tiers: { vanilla: 'ht1', overall: 'ht1' }, discord: 'falig#8359', youtube: null, stats: { wr: '91%', elo: 278, streak: 18 }, history: [{ from: 'HT1', to: 'HT1', mode: 'Vanilla', date: 'Jul 2026' }] },
  { id: 3, username: 'QuailDrop', region: 'EU', status: 'stable', tiers: { vanilla: 'lt1', overall: 'lt1' }, discord: 'quaildrop#2584', youtube: 'https://youtube.com/@quaildrop', stats: { wr: '71%', elo: 251, streak: 4 }, history: [{ from: 'HT2', to: 'LT1', mode: 'Vanilla', date: 'May 2026' }] },
  { id: 4, username: 'ZiblageRaid', region: 'SA', status: 'stable', tiers: { vanilla: 'lt1', axe: 'lt3', overall: 'lt3' }, discord: 'ziblageraid#6925', youtube: null, stats: { wr: '74%', elo: 240, streak: 3 }, history: [{ from: 'HT1', to: 'LT1', mode: 'Vanilla', date: 'Jan 2026' }] },
  { id: 5, username: 'SwechetPvP', region: 'NA', status: 'stable', tiers: { vanilla: 'ht2', overall: 'ht2' }, discord: 'swechetpvp#6820', youtube: 'https://youtube.com/@swechetpvp', stats: { wr: '79%', elo: 203, streak: 12 }, history: [{ from: 'LT2', to: 'HT2', mode: 'Vanilla', date: 'Jun 2026' }] },
  { id: 6, username: 'WitGod', region: 'SA', status: 'up', title: 'rising', verified: true, tiers: { vanilla: 'ht2', overall: 'ht2' }, discord: 'witgod#4598', youtube: null, stats: { wr: '60%', elo: 188, streak: 15 }, history: [] },
  { id: 7, username: 'KqnieldPop', region: 'AU', status: 'stable', tiers: { vanilla: 'lt2', overall: 'lt2' }, discord: 'kqnieldpop#6155', youtube: null, stats: { wr: '63%', elo: 160, streak: 19 }, history: [{ from: 'LT3', to: 'LT2', mode: 'Vanilla', date: 'Apr 2026' }] },
  { id: 8, username: 'PotilageRaid', region: 'EU', status: 'stable', tiers: { vanilla: 'lt2', overall: 'lt2' }, discord: 'potilageraid#8019', youtube: null, stats: { wr: '65%', elo: 182, streak: 18 }, history: [] },
  { id: 9, username: 'Axsnopig', region: 'SA', status: 'stable', tiers: { vanilla: 'ht3', overall: 'ht3' }, discord: 'axsnopig#3621', youtube: 'https://youtube.com/@axsnopig', stats: { wr: '53%', elo: 138, streak: 4 }, history: [] },
  { id: 10, username: 'PeaL', region: 'AU', status: 'stable', tiers: { vanilla: 'ht3', overall: 'ht3' }, discord: 'peal#1188', youtube: null, stats: { wr: '79%', elo: 140, streak: 17 }, history: [] },
  { id: 11, username: 'DriundSlam', region: 'AS', status: 'up', tiers: { vanilla: 'ht3', axe: 'ht2', overall: 'ht3' }, discord: 'driundslam#3591', youtube: null, stats: { wr: '71%', elo: 129, streak: 4 }, history: [{ from: 'LT3', to: 'HT3', mode: 'Vanilla', date: 'May 2026' }] },
  { id: 12, username: 'RelboCrit', region: 'SA', status: 'up', tiers: { vanilla: 'lt3', overall: 'lt3' }, discord: 'relbocrit#9837', youtube: null, stats: { wr: '59%', elo: 116, streak: 12 }, history: [] },
  { id: 13, username: 'StiherKing', region: 'AU', status: 'stable', tiers: { vanilla: 'lt3', overall: 'lt3' }, discord: 'stiherking#4946', youtube: 'https://youtube.com/@stiherking', stats: { wr: '73%', elo: 117, streak: 10 }, history: [] },
  { id: 14, username: 'FlishHit', region: 'NA', status: 'down', tiers: { vanilla: 'ht4', overall: 'ht4' }, discord: 'flishhit#8787', youtube: 'https://youtube.com/@flishhit', stats: { wr: '84%', elo: 76, streak: 5 }, history: [] },
  { id: 15, username: 'SouuchBonk', region: 'SA', status: 'stable', tiers: { vanilla: 'ht4', overall: 'ht4' }, discord: 'souuchbonk#4295', youtube: null, stats: { wr: '63%', elo: 79, streak: 18 }, history: [] },
  { id: 16, username: 'AlctionRush', region: 'AU', status: 'down', tiers: { vanilla: 'lt4', overall: 'lt4' }, discord: 'alctionrush#2049', youtube: 'https://youtube.com/@alctionrush', stats: { wr: '78%', elo: 69, streak: 4 }, history: [{ from: 'LT4', to: 'LT4', mode: 'Vanilla', date: 'May 2026' }] },
  { id: 17, username: 'Stiaum', region: 'NA', status: 'stable', tiers: { vanilla: 'lt4', overall: 'lt4' }, discord: 'stiaum#4899', youtube: 'https://youtube.com/@stiaum', stats: { wr: '52%', elo: 54, streak: 11 }, history: [{ from: 'LT5', to: 'LT4', mode: 'Vanilla', date: 'Feb 2026' }] },
  { id: 18, username: 'NettionsFan', region: 'EU', status: 'up', tiers: { vanilla: 'lt4', overall: 'lt4' }, discord: 'nettionsfan#8062', youtube: 'https://youtube.com/@nettionsfan', stats: { wr: '76%', elo: 65, streak: 7 }, history: [{ from: 'LT5', to: 'LT4', mode: 'Vanilla', date: 'Apr 2026' }] },
  { id: 19, username: 'Alcitberries', region: 'NA', status: 'stable', tiers: { vanilla: 'ht5', uhc: 'ht3', overall: 'ht5' }, discord: 'alcitberries#4116', youtube: 'https://youtube.com/@alcitberries', stats: { wr: '71%', elo: 43, streak: 4 }, history: [{ from: 'HT5', to: 'HT5', mode: 'Vanilla', date: 'Apr 2026' }] },
  { id: 20, username: 'AnverRaider', region: 'EU', status: 'down', tiers: { vanilla: 'ht5', overall: 'ht5' }, discord: 'anverraider#2604', youtube: null, stats: { wr: '54%', elo: 27, streak: 15 }, history: [{ from: 'LT4', to: 'HT5', mode: 'Vanilla', date: 'Jan 2026' }] },
  { id: 21, username: 'TNTshHit', region: 'AU', status: 'stable', tiers: { vanilla: 'lt5', overall: 'lt5' }, discord: 'tntshhit#1035', youtube: 'https://youtube.com/@tntshhit', stats: { wr: '75%', elo: 0, streak: 2 }, history: [] },
  { id: 22, username: 'NetlageRaid', region: 'AS', status: 'stable', tiers: { vanilla: 'lt5', overall: 'lt5' }, discord: 'netlageraid#5861', youtube: 'https://youtube.com/@netlageraid', stats: { wr: '85%', elo: 3, streak: 16 }, history: [{ from: 'HT5', to: 'LT5', mode: 'Vanilla', date: 'May 2026' }] },
  { id: 23, username: 'Flaus', region: 'SA', status: 'stable', title: 'legend', verified: true, tiers: { uhc: 'ht1', overall: 'ht1' }, discord: 'flaus#9320', youtube: 'https://youtube.com/@flaus', stats: { wr: '83%', elo: 283, streak: 6 }, history: [{ from: 'HT1', to: 'HT1', mode: 'Uhc', date: 'Jan 2026' }] },
  { id: 24, username: 'RegpMaster', region: 'AU', status: 'stable', tiers: { uhc: 'ht1' }, discord: 'regpmaster#1651', youtube: null, stats: { wr: '86%', elo: 267, streak: 8 }, history: [] },
  { id: 25, username: 'AncShotKO', region: 'AS', status: 'down', tiers: { uhc: 'lt1', overall: 'lt1' }, discord: 'ancshotko#7484', youtube: 'https://youtube.com/@ancshotko', stats: { wr: '63%', elo: 262, streak: 11 }, history: [{ from: 'HT2', to: 'LT1', mode: 'Uhc', date: 'Apr 2026' }] },
  { id: 26, username: 'Swoaum', region: 'NA', status: 'stable', tiers: { uhc: 'lt1', mace: 'ht2' }, discord: 'swoaum#4492', youtube: 'https://youtube.com/@swoaum', stats: { wr: '86%', elo: 244, streak: 4 }, history: [{ from: 'LT1', to: 'LT1', mode: 'Uhc', date: 'Mar 2026' }] },
  { id: 27, username: 'GaptionRush', region: 'AS', status: 'stable', tiers: { uhc: 'lt1', overall: 'lt1' }, discord: 'gaptionrush#9666', youtube: null, stats: { wr: '84%', elo: 227, streak: 10 }, history: [{ from: 'HT2', to: 'LT1', mode: 'Uhc', date: 'Jun 2026' }] },
  { id: 28, username: 'SounfulPvP', region: 'NA', status: 'up', tiers: { uhc: 'ht2' }, discord: 'sounfulpvp#4450', youtube: null, stats: { wr: '59%', elo: 192, streak: 9 }, history: [] },
  { id: 29, username: 'DripWarrior', region: 'SA', status: 'stable', tiers: { uhc: 'ht2', overall: 'ht2' }, discord: 'dripwarrior#5533', youtube: null, stats: { wr: '53%', elo: 197, streak: 3 }, history: [{ from: 'LT2', to: 'HT2', mode: 'Uhc', date: 'Jul 2026' }] },
  { id: 30, username: 'SountomEdge', region: 'AU', status: 'up', tiers: { uhc: 'lt2', overall: 'lt2' }, discord: 'sountomedge#2232', youtube: 'https://youtube.com/@sountomedge', stats: { wr: '77%', elo: 173, streak: 18 }, history: [] },
  { id: 31, username: 'FroachAxe', region: 'NA', status: 'down', tiers: { uhc: 'lt2', smp: 'ht2' }, discord: 'froachaxe#3088', youtube: 'https://youtube.com/@froachaxe', stats: { wr: '87%', elo: 175, streak: 18 }, history: [{ from: 'HT3', to: 'LT2', mode: 'Uhc', date: 'Jul 2026' }] },
  { id: 32, username: 'WoopleSage', region: 'NA', status: 'stable', tiers: { uhc: 'ht3' }, discord: 'wooplesage#3532', youtube: null, stats: { wr: '85%', elo: 138, streak: 14 }, history: [] },
  { id: 33, username: 'PhaticalHit', region: 'AU', status: 'stable', tiers: { uhc: 'ht3' }, discord: 'phaticalhit#5065', youtube: null, stats: { wr: '71%', elo: 134, streak: 14 }, history: [{ from: 'LT2', to: 'HT3', mode: 'Uhc', date: 'Apr 2026' }] },
  { id: 34, username: 'Axsave', region: 'AU', status: 'stable', tiers: { uhc: 'lt3' }, discord: 'axsave#4164', youtube: 'https://youtube.com/@axsave', stats: { wr: '64%', elo: 115, streak: 8 }, history: [{ from: 'HT4', to: 'LT3', mode: 'Uhc', date: 'Jul 2026' }] },
  { id: 35, username: 'IroilDrop', region: 'AS', status: 'up', tiers: { uhc: 'lt3' }, discord: 'iroildrop#1452', youtube: null, stats: { wr: '75%', elo: 102, streak: 18 }, history: [{ from: 'HT4', to: 'LT3', mode: 'Uhc', date: 'Feb 2026' }] },
  { id: 36, username: 'RelmDestroyer', region: 'AS', status: 'up', title: 'rising', verified: true, tiers: { uhc: 'ht4', overall: 'ht4' }, discord: 'relmdestroyer#9379', youtube: null, stats: { wr: '70%', elo: 74, streak: 14 }, history: [{ from: 'HT4', to: 'HT4', mode: 'Uhc', date: 'Mar 2026' }] },
  { id: 37, username: 'GolmDestroyer', region: 'NA', status: 'stable', tiers: { uhc: 'ht4' }, discord: 'golmdestroyer#2146', youtube: null, stats: { wr: '84%', elo: 75, streak: 7 }, history: [] },
  { id: 38, username: 'PotieldPop', region: 'NA', status: 'up', tiers: { uhc: 'ht4' }, discord: 'potieldpop#7691', youtube: null, stats: { wr: '69%', elo: 84, streak: 17 }, history: [{ from: 'LT4', to: 'HT4', mode: 'Uhc', date: 'May 2026' }] },
  { id: 39, username: 'CheientDebris', region: 'EU', status: 'up', tiers: { uhc: 'lt4' }, discord: 'cheientdebris#1006', youtube: null, stats: { wr: '69%', elo: 53, streak: 13 }, history: [{ from: 'LT4', to: 'LT4', mode: 'Uhc', date: 'Apr 2026' }] },
  { id: 40, username: 'TotherKing', region: 'AU', status: 'stable', tiers: { uhc: 'lt4' }, discord: 'totherking#3780', youtube: null, stats: { wr: '63%', elo: 73, streak: 17 }, history: [] },
  { id: 41, username: 'ThrwstoneGG', region: 'NA', status: 'down', tiers: { uhc: 'ht5', overall: 'ht5' }, discord: 'thrwstonegg#4262', youtube: 'https://youtube.com/@thrwstonegg', stats: { wr: '65%', elo: 38, streak: 10 }, history: [{ from: 'LT4', to: 'HT5', mode: 'Uhc', date: 'Feb 2026' }] },
  { id: 42, username: 'Detaum', region: 'AU', status: 'stable', tiers: { uhc: 'ht5' }, discord: 'detaum#7291', youtube: 'https://youtube.com/@detaum', stats: { wr: '90%', elo: 36, streak: 19 }, history: [{ from: 'HT5', to: 'HT5', mode: 'Uhc', date: 'Feb 2026' }] },
  { id: 43, username: 'Potmpy', region: 'NA', status: 'up', tiers: { uhc: 'ht5' }, discord: 'potmpy#9486', youtube: null, stats: { wr: '64%', elo: 43, streak: 6 }, history: [{ from: 'HT5', to: 'HT5', mode: 'Uhc', date: 'Jul 2026' }] },
  { id: 44, username: 'TecerRaider', region: 'SA', status: 'down', tiers: { uhc: 'lt5', overall: 'lt5' }, discord: 'tecerraider#8251', youtube: null, stats: { wr: '88%', elo: 10, streak: 11 }, history: [] },
  { id: 45, username: 'FalimBreaker', region: 'SA', status: 'stable', tiers: { uhc: 'lt5' }, discord: 'falimbreaker#5050', youtube: null, stats: { wr: '60%', elo: 19, streak: 16 }, history: [] },
  { id: 46, username: 'SmapMaster', region: 'AS', status: 'stable', title: 'grandmaster', verified: true, tiers: { pot: 'ht1', overall: 'ht1' }, discord: 'smapmaster#6238', youtube: null, stats: { wr: '68%', elo: 297, streak: 8 }, history: [] },
  { id: 47, username: 'TecstByte', region: 'EU', status: 'stable', title: 'tester', verified: true, tiers: { pot: 'ht1' }, discord: 'tecstbyte#7678', youtube: 'https://youtube.com/@tecstbyte', stats: { wr: '59%', elo: 267, streak: 7 }, history: [{ from: 'HT2', to: 'HT1', mode: 'Pot', date: 'Apr 2026' }] },
  { id: 48, username: 'WoostLooter', region: 'AU', status: 'down', tiers: { pot: 'ht1' }, discord: 'woostlooter#7232', youtube: null, stats: { wr: '87%', elo: 266, streak: 1 }, history: [{ from: 'LT1', to: 'HT1', mode: 'Pot', date: 'Mar 2026' }] },
  { id: 49, username: 'GroachAxe', region: 'SA', status: 'down', tiers: { pot: 'lt1', overall: 'lt1', sword: 'lt5' }, discord: 'groachaxe#8956', youtube: null, stats: { wr: '81%', elo: 251, streak: 8 }, history: [{ from: 'HT2', to: 'LT1', mode: 'Pot', date: 'Jun 2026' }] },
  { id: 50, username: 'RodGod', region: 'AU', status: 'down', tiers: { pot: 'lt1' }, discord: 'rodgod#7455', youtube: 'https://youtube.com/@rodgod', stats: { wr: '89%', elo: 250, streak: 18 }, history: [{ from: 'HT1', to: 'LT1', mode: 'Pot', date: 'Jan 2026' }] },
  { id: 51, username: 'Lumus', region: 'AS', status: 'stable', tiers: { pot: 'lt1', overall: 'lt1' }, discord: 'lumus#7211', youtube: null, stats: { wr: '63%', elo: 251, streak: 15 }, history: [{ from: 'LT2', to: 'LT1', mode: 'Pot', date: 'Mar 2026' }] },
  { id: 52, username: 'CxlachAxe', region: 'NA', status: 'down', tiers: { pot: 'ht2' }, discord: 'cxlachaxe#1659', youtube: null, stats: { wr: '72%', elo: 215, streak: 8 }, history: [] },
  { id: 53, username: 'Clevxn', region: 'SA', status: 'stable', tiers: { pot: 'ht2', mace: 'ht1' }, discord: 'clevxn#4571', youtube: null, stats: { wr: '58%', elo: 200, streak: 16 }, history: [{ from: 'LT2', to: 'HT2', mode: 'Pot', date: 'Jul 2026' }] },
  { id: 54, username: 'WitnfulPvP', region: 'EU', status: 'down', tiers: { pot: 'lt2', nethop: 'lt4' }, discord: 'witnfulpvp#6111', youtube: 'https://youtube.com/@witnfulpvp', stats: { wr: '56%', elo: 157, streak: 19 }, history: [{ from: 'LT3', to: 'LT2', mode: 'Pot', date: 'Apr 2026' }] },
  { id: 55, username: 'Absave', region: 'NA', status: 'up', tiers: { pot: 'lt2', uhc: 'ht2' }, discord: 'absave#5941', youtube: 'https://youtube.com/@absave', stats: { wr: '90%', elo: 183, streak: 8 }, history: [] },
  { id: 56, username: 'Shalack', region: 'AS', status: 'stable', tiers: { pot: 'lt2', smp: 'ht5' }, discord: 'shalack#6590', youtube: 'https://youtube.com/@shalack', stats: { wr: '92%', elo: 172, streak: 12 }, history: [{ from: 'LT3', to: 'LT2', mode: 'Pot', date: 'Jul 2026' }] },
  { id: 57, username: 'FartBlock', region: 'AU', status: 'up', tiers: { pot: 'ht3' }, discord: 'fartblock#5425', youtube: null, stats: { wr: '77%', elo: 129, streak: 6 }, history: [] },
  { id: 58, username: 'BowdCharge', region: 'AU', status: 'stable', tiers: { pot: 'ht3' }, discord: 'bowdcharge#5022', youtube: null, stats: { wr: '87%', elo: 144, streak: 9 }, history: [] },
  { id: 59, username: 'AnvstonePvP', region: 'EU', status: 'up', tiers: { pot: 'ht3' }, discord: 'anvstonepvp#6511', youtube: null, stats: { wr: '86%', elo: 129, streak: 20 }, history: [{ from: 'LT3', to: 'HT3', mode: 'Pot', date: 'Feb 2026' }] },
  { id: 60, username: 'SoupWarrior', region: 'AS', status: 'stable', tiers: { pot: 'lt3' }, discord: 'soupwarrior#9464', youtube: null, stats: { wr: '88%', elo: 107, streak: 9 }, history: [] },
  { id: 61, username: 'ChoCannon', region: 'AU', status: 'up', tiers: { pot: 'lt3' }, discord: 'chocannon#9041', youtube: null, stats: { wr: '65%', elo: 102, streak: 16 }, history: [{ from: 'HT3', to: 'LT3', mode: 'Pot', date: 'Jan 2026' }] },
  { id: 62, username: 'AxseRaider', region: 'EU', status: 'stable', tiers: { pot: 'lt3', mace: 'lt2' }, discord: 'axseraider#9698', youtube: null, stats: { wr: '87%', elo: 109, streak: 12 }, history: [{ from: 'HT4', to: 'LT3', mode: 'Pot', date: 'Mar 2026' }] },
  { id: 63, username: 'HitearKing', region: 'EU', status: 'stable', tiers: { pot: 'ht4', sword: 'ht1' }, discord: 'hitearking#9779', youtube: 'https://youtube.com/@hitearking', stats: { wr: '62%', elo: 82, streak: 11 }, history: [] },
  { id: 64, username: 'LumeldBreak', region: 'EU', status: 'up', tiers: { pot: 'ht4' }, discord: 'lumeldbreak#9595', youtube: null, stats: { wr: '67%', elo: 96, streak: 19 }, history: [{ from: 'LT3', to: 'HT4', mode: 'Pot', date: 'Jul 2026' }] },
  { id: 65, username: 'StrchetPvP', region: 'AS', status: 'stable', tiers: { pot: 'ht4' }, discord: 'strchetpvp#1745', youtube: 'https://youtube.com/@strchetpvp', stats: { wr: '50%', elo: 80, streak: 18 }, history: [] },
  { id: 66, username: 'NetshHit', region: 'NA', status: 'down', tiers: { pot: 'lt4' }, discord: 'netshhit#8216', youtube: null, stats: { wr: '86%', elo: 70, streak: 10 }, history: [{ from: 'HT4', to: 'LT4', mode: 'Pot', date: 'Mar 2026' }] },
  { id: 67, username: 'PaiL', region: 'AU', status: 'stable', tiers: { pot: 'lt4', vanilla: 'ht5' }, discord: 'pail#5978', youtube: 'https://youtube.com/@pail', stats: { wr: '86%', elo: 63, streak: 2 }, history: [{ from: 'LT4', to: 'LT4', mode: 'Pot', date: 'Jan 2026' }] },
  { id: 68, username: 'DiastLooter', region: 'SA', status: 'up', tiers: { pot: 'lt4' }, discord: 'diastlooter#7232', youtube: null, stats: { wr: '89%', elo: 66, streak: 8 }, history: [{ from: 'LT5', to: 'LT4', mode: 'Pot', date: 'Mar 2026' }] },
  { id: 69, username: 'Ancym', region: 'SA', status: 'down', tiers: { pot: 'ht5' }, discord: 'ancym#5335', youtube: null, stats: { wr: '56%', elo: 31, streak: 7 }, history: [] },
  { id: 70, username: 'ChoticalHit', region: 'SA', status: 'stable', tiers: { pot: 'ht5' }, discord: 'choticalhit#8699', youtube: null, stats: { wr: '50%', elo: 26, streak: 14 }, history: [{ from: 'HT5', to: 'HT5', mode: 'Pot', date: 'Mar 2026' }] },
  { id: 71, username: 'FislageRaid', region: 'NA', status: 'up', tiers: { pot: 'ht5' }, discord: 'fislageraid#4241', youtube: null, stats: { wr: '66%', elo: 44, streak: 19 }, history: [{ from: 'HT5', to: 'HT5', mode: 'Pot', date: 'Jun 2026' }] },
  { id: 72, username: 'Blaaum', region: 'NA', status: 'stable', tiers: { pot: 'lt5' }, discord: 'blaaum#5728', youtube: null, stats: { wr: '69%', elo: 3, streak: 20 }, history: [{ from: 'LT5', to: 'LT5', mode: 'Pot', date: 'Jun 2026' }] },
  { id: 73, username: 'UHCeRaider', region: 'AS', status: 'stable', tiers: { pot: 'lt5', sword: 'lt4' }, discord: 'uhceraider#1653', youtube: 'https://youtube.com/@uhceraider', stats: { wr: '81%', elo: 4, streak: 15 }, history: [] },
  { id: 74, username: 'QuikMcVids', region: 'EU', status: 'down', title: 'creator', verified: true, tiers: { nethop: 'ht1', overall: 'ht1' }, discord: 'quikmcvids#5415', youtube: null, stats: { wr: '86%', elo: 279, streak: 19 }, history: [{ from: 'HT1', to: 'HT1', mode: 'NethOP', date: 'Apr 2026' }] },
  { id: 75, username: 'AlcGrinder', region: 'AS', status: 'stable', title: 'tester', verified: true, tiers: { nethop: 'ht1' }, discord: 'alcgrinder#9056', youtube: null, stats: { wr: '87%', elo: 297, streak: 14 }, history: [] },
  { id: 76, username: 'MagCannon', region: 'AS', status: 'stable', tiers: { nethop: 'ht1', overall: 'ht1' }, discord: 'magcannon#9117', youtube: null, stats: { wr: '56%', elo: 294, streak: 6 }, history: [{ from: 'HT2', to: 'HT1', mode: 'NethOP', date: 'Jul 2026' }] },
  { id: 77, username: 'iMaieldPop', region: 'AS', status: 'stable', tiers: { nethop: 'lt1' }, discord: 'imaieldpop#1018', youtube: null, stats: { wr: '75%', elo: 253, streak: 17 }, history: [] },
  { id: 78, username: 'EndCannon', region: 'NA', status: 'stable', tiers: { nethop: 'lt1', overall: 'lt1', smp: 'ht2' }, discord: 'endcannon#8242', youtube: null, stats: { wr: '73%', elo: 259, streak: 20 }, history: [] },
  { id: 79, username: 'Denhrite', region: 'AS', status: 'stable', tiers: { nethop: 'ht2', smp: 'ht1' }, discord: 'denhrite#4920', youtube: 'https://youtube.com/@denhrite', stats: { wr: '81%', elo: 201, streak: 4 }, history: [] },
  { id: 80, username: 'Denteh', region: 'SA', status: 'stable', tiers: { nethop: 'ht2' }, discord: 'denteh#2924', youtube: null, stats: { wr: '64%', elo: 204, streak: 4 }, history: [] },
  { id: 81, username: 'AbsafeMaster', region: 'SA', status: 'up', tiers: { nethop: 'lt2' }, discord: 'absafemaster#4993', youtube: null, stats: { wr: '76%', elo: 169, streak: 16 }, history: [{ from: 'LT2', to: 'LT2', mode: 'NethOP', date: 'Apr 2026' }] },
  { id: 82, username: 'PeatraDive', region: 'EU', status: 'down', tiers: { nethop: 'lt2', sword: 'ht2' }, discord: 'peatradive#9318', youtube: null, stats: { wr: '67%', elo: 158, streak: 14 }, history: [{ from: 'HT2', to: 'LT2', mode: 'NethOP', date: 'Mar 2026' }] },
  { id: 83, username: 'TotshHit', region: 'EU', status: 'stable', tiers: { nethop: 'ht3', vanilla: 'lt2' }, discord: 'totshhit#9903', youtube: null, stats: { wr: '80%', elo: 145, streak: 12 }, history: [{ from: 'LT3', to: 'HT3', mode: 'NethOP', date: 'Jul 2026' }] },
  { id: 84, username: 'UHCpMaster', region: 'SA', status: 'stable', tiers: { nethop: 'ht3' }, discord: 'uhcpmaster#8749', youtube: null, stats: { wr: '76%', elo: 132, streak: 2 }, history: [] },
  { id: 85, username: 'PigstByte', region: 'AU', status: 'down', tiers: { nethop: 'ht3' }, discord: 'pigstbyte#6439', youtube: null, stats: { wr: '58%', elo: 138, streak: 17 }, history: [] },
  { id: 86, username: 'CrolageRaid', region: 'NA', status: 'up', tiers: { nethop: 'lt3', axe: 'lt4' }, discord: 'crolageraid#5342', youtube: 'https://youtube.com/@crolageraid', stats: { wr: '76%', elo: 103, streak: 5 }, history: [{ from: 'LT4', to: 'LT3', mode: 'NethOP', date: 'Jun 2026' }] },
  { id: 87, username: 'GloundSlam', region: 'AU', status: 'down', tiers: { nethop: 'lt3' }, discord: 'gloundslam#1588', youtube: null, stats: { wr: '90%', elo: 102, streak: 16 }, history: [] },
  { id: 88, username: 'SplhRod', region: 'EU', status: 'up', tiers: { nethop: 'lt3' }, discord: 'splhrod#2646', youtube: null, stats: { wr: '77%', elo: 107, streak: 4 }, history: [{ from: 'HT4', to: 'LT3', mode: 'NethOP', date: 'Jan 2026' }] },
  { id: 89, username: 'FlaafeMaster', region: 'AS', status: 'stable', tiers: { nethop: 'ht4' }, discord: 'flaafemaster#3950', youtube: null, stats: { wr: '59%', elo: 84, streak: 8 }, history: [{ from: 'LT3', to: 'HT4', mode: 'NethOP', date: 'May 2026' }] },
  { id: 90, username: 'PotpMaster', region: 'AU', status: 'down', tiers: { nethop: 'ht4' }, discord: 'potpmaster#5161', youtube: null, stats: { wr: '59%', elo: 86, streak: 8 }, history: [{ from: 'LT3', to: 'HT4', mode: 'NethOP', date: 'Jul 2026' }] },
  { id: 91, username: 'RegachAxe', region: 'EU', status: 'stable', tiers: { nethop: 'lt4' }, discord: 'regachaxe#7951', youtube: null, stats: { wr: '72%', elo: 56, streak: 19 }, history: [] },
  { id: 92, username: 'Comave', region: 'AU', status: 'down', tiers: { nethop: 'lt4', sword: 'ht5' }, discord: 'comave#6881', youtube: null, stats: { wr: '56%', elo: 62, streak: 8 }, history: [{ from: 'HT5', to: 'LT4', mode: 'NethOP', date: 'Jan 2026' }] },
  { id: 93, username: 'CryilDrop', region: 'NA', status: 'up', tiers: { nethop: 'lt4', axe: 'ht3' }, discord: 'cryildrop#5689', youtube: null, stats: { wr: '53%', elo: 69, streak: 20 }, history: [] },
  { id: 94, username: 'SoueSlinger', region: 'EU', status: 'up', tiers: { nethop: 'ht5' }, discord: 'soueslinger#1645', youtube: null, stats: { wr: '92%', elo: 41, streak: 5 }, history: [{ from: 'LT5', to: 'HT5', mode: 'NethOP', date: 'Jan 2026' }] },
  { id: 95, username: 'Warhrite', region: 'NA', status: 'down', tiers: { nethop: 'ht5' }, discord: 'warhrite#3165', youtube: 'https://youtube.com/@warhrite', stats: { wr: '70%', elo: 40, streak: 14 }, history: [] },
  { id: 96, username: 'FalckClutch', region: 'EU', status: 'stable', tiers: { nethop: 'lt5' }, discord: 'falckclutch#6549', youtube: null, stats: { wr: '80%', elo: 12, streak: 10 }, history: [] },
  { id: 97, username: 'DredeRunner', region: 'EU', status: 'down', tiers: { nethop: 'lt5' }, discord: 'drederunner#7464', youtube: null, stats: { wr: '75%', elo: 10, streak: 18 }, history: [{ from: 'HT5', to: 'LT5', mode: 'NethOP', date: 'Apr 2026' }] },
  { id: 98, username: 'RegpWarrior', region: 'SA', status: 'stable', tiers: { nethop: 'lt5', pot: 'ht1' }, discord: 'regpwarrior#4830', youtube: 'https://youtube.com/@regpwarrior', stats: { wr: '90%', elo: 7, streak: 12 }, history: [{ from: 'LT5', to: 'LT5', mode: 'NethOP', date: 'May 2026' }] },
  { id: 99, username: 'BreerRaider', region: 'AS', status: 'up', title: 'legend', verified: true, tiers: { smp: 'ht1', overall: 'ht1' }, discord: 'breerraider#1609', youtube: 'https://youtube.com/@breerraider', stats: { wr: '57%', elo: 266, streak: 5 }, history: [{ from: 'HT2', to: 'HT1', mode: 'Smp', date: 'Jan 2026' }] },
  { id: 100, username: 'ChoundSlam', region: 'EU', status: 'stable', title: 'veteran', verified: true, tiers: { smp: 'ht1', overall: 'ht1' }, discord: 'choundslam#3531', youtube: null, stats: { wr: '73%', elo: 269, streak: 18 }, history: [] },
  { id: 101, username: 'DetCannon', region: 'AS', status: 'stable', tiers: { smp: 'lt1', overall: 'lt1' }, discord: 'detcannon#4868', youtube: null, stats: { wr: '73%', elo: 256, streak: 7 }, history: [] },
  { id: 102, username: 'DritionRush', region: 'SA', status: 'down', tiers: { smp: 'lt1', nethop: 'ht2' }, discord: 'dritionrush#5520', youtube: 'https://youtube.com/@dritionrush', stats: { wr: '91%', elo: 229, streak: 12 }, history: [{ from: 'HT1', to: 'LT1', mode: 'Smp', date: 'Jul 2026' }] },
  { id: 103, username: 'ThrberWolf', region: 'SA', status: 'down', tiers: { smp: 'ht2' }, discord: 'thrberwolf#3063', youtube: 'https://youtube.com/@thrberwolf', stats: { wr: '53%', elo: 190, streak: 11 }, history: [] },
  { id: 104, username: 'TapseOre', region: 'EU', status: 'up', tiers: { smp: 'ht2' }, discord: 'tapseore#1046', youtube: null, stats: { wr: '64%', elo: 197, streak: 11 }, history: [{ from: 'HT2', to: 'HT2', mode: 'Smp', date: 'Feb 2026' }] },
  { id: 105, username: 'RegticalHit', region: 'NA', status: 'up', tiers: { smp: 'ht2' }, discord: 'regticalhit#4898', youtube: 'https://youtube.com/@regticalhit', stats: { wr: '51%', elo: 220, streak: 5 }, history: [{ from: 'LT1', to: 'HT2', mode: 'Smp', date: 'Feb 2026' }] },
  { id: 106, username: 'NetstLooter', region: 'SA', status: 'stable', tiers: { smp: 'lt2' }, discord: 'netstlooter#6931', youtube: null, stats: { wr: '54%', elo: 154, streak: 16 }, history: [{ from: 'HT2', to: 'LT2', mode: 'Smp', date: 'Apr 2026' }] },
  { id: 107, username: 'Axslack', region: 'SA', status: 'stable', tiers: { smp: 'lt2' }, discord: 'axslack#8847', youtube: 'https://youtube.com/@axslack', stats: { wr: '91%', elo: 169, streak: 1 }, history: [] },
  { id: 108, username: 'Drivse', region: 'AU', status: 'up', tiers: { smp: 'lt2' }, discord: 'drivse#6277', youtube: null, stats: { wr: '78%', elo: 166, streak: 3 }, history: [] },
  { id: 109, username: 'AnvseOre', region: 'AS', status: 'stable', tiers: { smp: 'ht3' }, discord: 'anvseore#9282', youtube: null, stats: { wr: '88%', elo: 130, streak: 17 }, history: [] },
  { id: 110, username: 'UHCnfulPvP', region: 'SA', status: 'up', tiers: { smp: 'ht3' }, discord: 'uhcnfulpvp#4743', youtube: null, stats: { wr: '63%', elo: 129, streak: 14 }, history: [{ from: 'HT4', to: 'HT3', mode: 'Smp', date: 'Apr 2026' }] },
  { id: 111, username: 'FruieldPop', region: 'AU', status: 'stable', tiers: { smp: 'lt3' }, discord: 'fruieldpop#8770', youtube: null, stats: { wr: '66%', elo: 124, streak: 12 }, history: [{ from: 'HT3', to: 'LT3', mode: 'Smp', date: 'Jan 2026' }] },
  { id: 112, username: 'FrutionRush', region: 'EU', status: 'up', tiers: { smp: 'lt3' }, discord: 'frutionrush#3002', youtube: null, stats: { wr: '87%', elo: 114, streak: 18 }, history: [{ from: 'LT4', to: 'LT3', mode: 'Smp', date: 'Jul 2026' }] },
  { id: 113, username: 'FezhRod', region: 'SA', status: 'stable', tiers: { smp: 'lt3' }, discord: 'fezhrod#3535', youtube: null, stats: { wr: '56%', elo: 124, streak: 19 }, history: [] },
  { id: 114, username: 'MagtionRush', region: 'NA', status: 'up', tiers: { smp: 'ht4' }, discord: 'magtionrush#1430', youtube: null, stats: { wr: '86%', elo: 77, streak: 8 }, history: [] },
  { id: 115, username: 'PotckClutch', region: 'NA', status: 'stable', tiers: { smp: 'ht4' }, discord: 'potckclutch#3972', youtube: null, stats: { wr: '69%', elo: 95, streak: 11 }, history: [] },
  { id: 116, username: 'Blaig', region: 'NA', status: 'up', tiers: { smp: 'lt4' }, discord: 'blaig#6585', youtube: null, stats: { wr: '63%', elo: 49, streak: 13 }, history: [{ from: 'HT5', to: 'LT4', mode: 'Smp', date: 'Jun 2026' }] },
  { id: 117, username: 'Bowatpvp', region: 'NA', status: 'stable', tiers: { smp: 'lt4' }, discord: 'bowatpvp#5458', youtube: null, stats: { wr: '89%', elo: 58, streak: 2 }, history: [{ from: 'LT5', to: 'LT4', mode: 'Smp', date: 'Apr 2026' }] },
  { id: 118, username: 'MobstLooter', region: 'AS', status: 'stable', tiers: { smp: 'lt4' }, discord: 'mobstlooter#2816', youtube: null, stats: { wr: '82%', elo: 67, streak: 4 }, history: [{ from: 'LT5', to: 'LT4', mode: 'Smp', date: 'May 2026' }] },
  { id: 119, username: 'AxsingObs', region: 'SA', status: 'stable', tiers: { smp: 'ht5' }, discord: 'axsingobs#3248', youtube: null, stats: { wr: '63%', elo: 22, streak: 10 }, history: [] },
  { id: 120, username: 'Netrpness', region: 'NA', status: 'stable', tiers: { smp: 'ht5', sword: 'lt5' }, discord: 'netrpness#9725', youtube: 'https://youtube.com/@netrpness', stats: { wr: '77%', elo: 30, streak: 6 }, history: [] },
  { id: 121, username: 'ObslSand', region: 'NA', status: 'stable', tiers: { smp: 'ht5', vanilla: 'lt1' }, discord: 'obslsand#2275', youtube: 'https://youtube.com/@obslsand', stats: { wr: '52%', elo: 38, streak: 14 }, history: [] },
  { id: 122, username: 'BasstLooter', region: 'AS', status: 'stable', tiers: { smp: 'lt5' }, discord: 'basstlooter#8538', youtube: 'https://youtube.com/@basstlooter', stats: { wr: '51%', elo: 14, streak: 11 }, history: [] },
  { id: 123, username: 'iMamDestroyer', region: 'NA', status: 'stable', tiers: { smp: 'lt5', axe: 'lt3' }, discord: 'imamdestroyer#7484', youtube: null, stats: { wr: '87%', elo: 7, streak: 13 }, history: [] },
  { id: 124, username: 'QuaeSlinger', region: 'AS', status: 'up', tiers: { smp: 'lt5' }, discord: 'quaeslinger#9693', youtube: null, stats: { wr: '54%', elo: 19, streak: 17 }, history: [{ from: 'LT5', to: 'LT5', mode: 'Smp', date: 'Mar 2026' }] },
  { id: 125, username: 'ReldeRunner', region: 'AS', status: 'stable', tiers: { sword: 'ht1' }, discord: 'relderunner#2234', youtube: null, stats: { wr: '88%', elo: 278, streak: 5 }, history: [{ from: 'HT2', to: 'HT1', mode: 'Sword', date: 'Apr 2026' }] },
  { id: 126, username: 'DiastonePvP', region: 'SA', status: 'up', title: 'grandmaster', verified: true, tiers: { sword: 'ht1' }, discord: 'diastonepvp#6179', youtube: null, stats: { wr: '89%', elo: 300, streak: 11 }, history: [{ from: 'HT1', to: 'HT1', mode: 'Sword', date: 'Apr 2026' }] },
  { id: 127, username: 'Anvym', region: 'AS', status: 'stable', tiers: { sword: 'lt1' }, discord: 'anvym#1932', youtube: null, stats: { wr: '69%', elo: 243, streak: 15 }, history: [{ from: 'HT2', to: 'LT1', mode: 'Sword', date: 'Jan 2026' }] },
  { id: 128, username: 'DetlDamage', region: 'AU', status: 'stable', tiers: { sword: 'lt1', overall: 'lt1', vanilla: 'ht5' }, discord: 'detldamage#4084', youtube: null, stats: { wr: '85%', elo: 229, streak: 2 }, history: [{ from: 'LT2', to: 'LT1', mode: 'Sword', date: 'May 2026' }] },
  { id: 129, username: 'FlastonePvP', region: 'NA', status: 'down', tiers: { sword: 'lt1' }, discord: 'flastonepvp#3827', youtube: null, stats: { wr: '71%', elo: 233, streak: 3 }, history: [{ from: 'LT2', to: 'LT1', mode: 'Sword', date: 'Apr 2026' }] },
  { id: 130, username: 'BashRod', region: 'AU', status: 'stable', tiers: { sword: 'ht2' }, discord: 'bashrod#6482', youtube: 'https://youtube.com/@bashrod', stats: { wr: '71%', elo: 208, streak: 20 }, history: [{ from: 'LT1', to: 'HT2', mode: 'Sword', date: 'May 2026' }] },
  { id: 131, username: 'FisearKing', region: 'SA', status: 'down', tiers: { sword: 'ht2', overall: 'ht2' }, discord: 'fisearking#3317', youtube: null, stats: { wr: '71%', elo: 209, streak: 3 }, history: [] },
  { id: 132, username: 'UHCingObs', region: 'EU', status: 'up', tiers: { sword: 'lt2', smp: 'ht3' }, discord: 'uhcingobs#6381', youtube: null, stats: { wr: '55%', elo: 174, streak: 10 }, history: [] },
  { id: 133, username: 'UHCuchBonk', region: 'NA', status: 'up', tiers: { sword: 'lt2' }, discord: 'uhcuchbonk#6940', youtube: null, stats: { wr: '77%', elo: 174, streak: 17 }, history: [{ from: 'LT2', to: 'LT2', mode: 'Sword', date: 'Mar 2026' }] },
  { id: 134, username: 'SmaeldBreak', region: 'EU', status: 'down', tiers: { sword: 'lt2' }, discord: 'smaeldbreak#2657', youtube: null, stats: { wr: '59%', elo: 178, streak: 3 }, history: [{ from: 'HT2', to: 'LT2', mode: 'Sword', date: 'Jun 2026' }] },
  { id: 135, username: 'Pothrite', region: 'SA', status: 'stable', tiers: { sword: 'ht3' }, discord: 'pothrite#3712', youtube: null, stats: { wr: '60%', elo: 151, streak: 6 }, history: [] },
  { id: 136, username: 'TNTtBlock', region: 'EU', status: 'down', tiers: { sword: 'ht3' }, discord: 'tnttblock#8355', youtube: null, stats: { wr: '89%', elo: 127, streak: 10 }, history: [{ from: 'HT3', to: 'HT3', mode: 'Sword', date: 'Mar 2026' }] },
  { id: 137, username: 'FaceldBreak', region: 'AS', status: 'up', tiers: { sword: 'ht3', nethop: 'lt4' }, discord: 'faceldbreak#5616', youtube: null, stats: { wr: '86%', elo: 152, streak: 15 }, history: [] },
  { id: 138, username: 'Clenopig', region: 'AS', status: 'stable', tiers: { sword: 'lt3' }, discord: 'clenopig#2680', youtube: null, stats: { wr: '80%', elo: 105, streak: 12 }, history: [] },
  { id: 139, username: 'ShahRod', region: 'NA', status: 'up', tiers: { sword: 'lt3' }, discord: 'shahrod#3414', youtube: null, stats: { wr: '67%', elo: 117, streak: 15 }, history: [] },
  { id: 140, username: 'AxsstonePvP', region: 'AS', status: 'down', tiers: { sword: 'lt3' }, discord: 'axsstonepvp#7126', youtube: null, stats: { wr: '76%', elo: 102, streak: 2 }, history: [{ from: 'HT3', to: 'LT3', mode: 'Sword', date: 'Mar 2026' }] },
  { id: 141, username: 'Shlitberries', region: 'AS', status: 'up', tiers: { sword: 'ht4' }, discord: 'shlitberries#8740', youtube: null, stats: { wr: '58%', elo: 74, streak: 2 }, history: [] },
  { id: 142, username: 'DiationsFan', region: 'AU', status: 'up', tiers: { sword: 'ht4', vanilla: 'ht2' }, discord: 'diationsfan#3449', youtube: null, stats: { wr: '55%', elo: 78, streak: 1 }, history: [{ from: 'HT5', to: 'HT4', mode: 'Sword', date: 'Jan 2026' }] },
  { id: 143, username: 'Comrpness', region: 'NA', status: 'stable', tiers: { sword: 'lt4' }, discord: 'comrpness#2816', youtube: null, stats: { wr: '90%', elo: 55, streak: 20 }, history: [] },
  { id: 144, username: 'PeaundSlam', region: 'NA', status: 'up', tiers: { sword: 'lt4', smp: 'lt2' }, discord: 'peaundslam#5772', youtube: null, stats: { wr: '86%', elo: 64, streak: 8 }, history: [{ from: 'HT5', to: 'LT4', mode: 'Sword', date: 'Feb 2026' }] },
  { id: 145, username: 'CheberJack', region: 'NA', status: 'stable', tiers: { sword: 'lt4' }, discord: 'cheberjack#9914', youtube: null, stats: { wr: '73%', elo: 66, streak: 3 }, history: [{ from: 'HT4', to: 'LT4', mode: 'Sword', date: 'Apr 2026' }] },
  { id: 146, username: 'BrelinBrute', region: 'AS', status: 'stable', tiers: { sword: 'ht5' }, discord: 'brelinbrute#6649', youtube: null, stats: { wr: '51%', elo: 22, streak: 12 }, history: [{ from: 'LT4', to: 'HT5', mode: 'Sword', date: 'Jul 2026' }] },
  { id: 147, username: 'ArrwstoneGG', region: 'EU', status: 'stable', tiers: { sword: 'ht5' }, discord: 'arrwstonegg#3868', youtube: null, stats: { wr: '84%', elo: 40, streak: 11 }, history: [] },
  { id: 148, username: 'EnddCharge', region: 'EU', status: 'down', tiers: { sword: 'ht5' }, discord: 'enddcharge#4302', youtube: 'https://youtube.com/@enddcharge', stats: { wr: '54%', elo: 44, streak: 15 }, history: [{ from: 'HT5', to: 'HT5', mode: 'Sword', date: 'Jan 2026' }] },
  { id: 149, username: 'ElyingObs', region: 'SA', status: 'stable', tiers: { sword: 'lt5' }, discord: 'elyingobs#1783', youtube: null, stats: { wr: '52%', elo: 5, streak: 7 }, history: [] },
  { id: 150, username: 'Blorpness', region: 'AS', status: 'stable', tiers: { sword: 'lt5' }, discord: 'blorpness#7334', youtube: null, stats: { wr: '75%', elo: 6, streak: 15 }, history: [{ from: 'LT5', to: 'LT5', mode: 'Sword', date: 'Apr 2026' }] },
  { id: 151, username: 'HeationRush', region: 'SA', status: 'stable', tiers: { sword: 'lt5', pot: 'ht2' }, discord: 'heationrush#3956', youtube: 'https://youtube.com/@heationrush', stats: { wr: '55%', elo: 18, streak: 14 }, history: [{ from: 'LT5', to: 'LT5', mode: 'Sword', date: 'Jan 2026' }] },
  { id: 152, username: 'ThrafeMaster', region: 'AS', status: 'stable', title: 'legend', verified: true, tiers: { axe: 'ht1', overall: 'ht1' }, discord: 'thrafemaster#6759', youtube: null, stats: { wr: '77%', elo: 284, streak: 6 }, history: [{ from: 'LT1', to: 'HT1', mode: 'Axe', date: 'May 2026' }] },
  { id: 153, username: 'DreeRaider', region: 'AS', status: 'stable', title: 'creator', verified: true, tiers: { axe: 'ht1' }, discord: 'dreeraider#8179', youtube: 'https://youtube.com/@dreeraider', stats: { wr: '60%', elo: 291, streak: 1 }, history: [{ from: 'HT1', to: 'HT1', mode: 'Axe', date: 'Feb 2026' }] },
  { id: 154, username: 'Pigeki', region: 'SA', status: 'stable', tiers: { axe: 'lt1' }, discord: 'pigeki#2259', youtube: null, stats: { wr: '78%', elo: 247, streak: 12 }, history: [{ from: 'HT2', to: 'LT1', mode: 'Axe', date: 'Apr 2026' }] },
  { id: 155, username: 'AlcilDrop', region: 'EU', status: 'down', tiers: { axe: 'lt1', overall: 'lt1', nethop: 'ht1' }, discord: 'alcildrop#7340', youtube: null, stats: { wr: '51%', elo: 244, streak: 6 }, history: [] },
  { id: 156, username: 'GolstonePvP', region: 'EU', status: 'down', tiers: { axe: 'lt1' }, discord: 'golstonepvp#3223', youtube: 'https://youtube.com/@golstonepvp', stats: { wr: '68%', elo: 231, streak: 16 }, history: [] },
  { id: 157, username: 'AbsGrinder', region: 'NA', status: 'down', tiers: { axe: 'ht2' }, discord: 'absgrinder#9882', youtube: null, stats: { wr: '70%', elo: 195, streak: 12 }, history: [{ from: 'LT2', to: 'HT2', mode: 'Axe', date: 'Jul 2026' }] },
  { id: 158, username: 'AbsticalHit', region: 'AS', status: 'stable', tiers: { axe: 'ht2' }, discord: 'absticalhit#4878', youtube: null, stats: { wr: '57%', elo: 194, streak: 7 }, history: [] },
  { id: 159, username: 'WarseOre', region: 'SA', status: 'stable', tiers: { axe: 'ht2', overall: 'ht2' }, discord: 'warseore#2412', youtube: null, stats: { wr: '85%', elo: 185, streak: 5 }, history: [{ from: 'HT3', to: 'HT2', mode: 'Axe', date: 'Jun 2026' }] },
  { id: 160, username: 'TNTCannon', region: 'SA', status: 'stable', tiers: { axe: 'lt2' }, discord: 'tntcannon#9476', youtube: null, stats: { wr: '70%', elo: 170, streak: 3 }, history: [{ from: 'LT2', to: 'LT2', mode: 'Axe', date: 'Jul 2026' }] },
  { id: 161, username: 'FarlDamage', region: 'NA', status: 'down', tiers: { axe: 'lt2' }, discord: 'farldamage#3653', youtube: null, stats: { wr: '83%', elo: 156, streak: 5 }, history: [{ from: 'LT2', to: 'LT2', mode: 'Axe', date: 'Mar 2026' }] },
  { id: 162, username: 'OnehRod', region: 'NA', status: 'stable', tiers: { axe: 'lt2' }, discord: 'onehrod#5961', youtube: null, stats: { wr: '90%', elo: 183, streak: 18 }, history: [] },
  { id: 163, username: 'PotiGod', region: 'SA', status: 'down', tiers: { axe: 'ht3' }, discord: 'potigod#6531', youtube: null, stats: { wr: '59%', elo: 143, streak: 6 }, history: [] },
  { id: 164, username: 'Zibig', region: 'NA', status: 'stable', tiers: { axe: 'ht3' }, discord: 'zibig#4453', youtube: null, stats: { wr: '91%', elo: 145, streak: 19 }, history: [] },
  { id: 165, username: 'Breig', region: 'AU', status: 'down', tiers: { axe: 'lt3' }, discord: 'breig#5949', youtube: null, stats: { wr: '84%', elo: 120, streak: 10 }, history: [{ from: 'LT4', to: 'LT3', mode: 'Axe', date: 'Mar 2026' }] },
  { id: 166, username: 'Dreym', region: 'EU', status: 'stable', tiers: { axe: 'lt3' }, discord: 'dreym#3353', youtube: 'https://youtube.com/@dreym', stats: { wr: '80%', elo: 115, streak: 15 }, history: [{ from: 'HT4', to: 'LT3', mode: 'Axe', date: 'Jun 2026' }] },
  { id: 167, username: 'Bashrite', region: 'AS', status: 'stable', tiers: { axe: 'lt3', vanilla: 'ht1' }, discord: 'bashrite#3007', youtube: 'https://youtube.com/@bashrite', stats: { wr: '56%', elo: 111, streak: 11 }, history: [{ from: 'LT3', to: 'LT3', mode: 'Axe', date: 'Feb 2026' }] },
  { id: 168, username: 'StrlinBrute', region: 'SA', status: 'stable', tiers: { axe: 'ht4' }, discord: 'strlinbrute#6123', youtube: null, stats: { wr: '60%', elo: 75, streak: 11 }, history: [{ from: 'HT4', to: 'HT4', mode: 'Axe', date: 'Apr 2026' }] },
  { id: 169, username: 'EndvyCoreGG', region: 'AS', status: 'stable', tiers: { axe: 'ht4' }, discord: 'endvycoregg#4944', youtube: null, stats: { wr: '55%', elo: 90, streak: 13 }, history: [{ from: 'LT4', to: 'HT4', mode: 'Axe', date: 'Jan 2026' }] },
  { id: 170, username: 'HeationsFan', region: 'AS', status: 'stable', tiers: { axe: 'lt4' }, discord: 'heationsfan#5333', youtube: 'https://youtube.com/@heationsfan', stats: { wr: '56%', elo: 56, streak: 14 }, history: [] },
  { id: 171, username: 'BastBlock', region: 'NA', status: 'stable', tiers: { axe: 'lt4' }, discord: 'bastblock#5728', youtube: 'https://youtube.com/@bastblock', stats: { wr: '86%', elo: 72, streak: 18 }, history: [{ from: 'LT5', to: 'LT4', mode: 'Axe', date: 'Jul 2026' }] },
  { id: 172, username: 'Drirpness', region: 'EU', status: 'down', tiers: { axe: 'ht5', uhc: 'ht4' }, discord: 'drirpness#6555', youtube: null, stats: { wr: '75%', elo: 41, streak: 12 }, history: [{ from: 'LT5', to: 'HT5', mode: 'Axe', date: 'Jul 2026' }] },
  { id: 173, username: 'CletraDive', region: 'AU', status: 'stable', tiers: { axe: 'ht5', pot: 'lt3' }, discord: 'cletradive#6456', youtube: 'https://youtube.com/@cletradive', stats: { wr: '52%', elo: 25, streak: 2 }, history: [] },
  { id: 174, username: 'VilstByte', region: 'SA', status: 'down', tiers: { axe: 'ht5' }, discord: 'vilstbyte#6218', youtube: null, stats: { wr: '58%', elo: 38, streak: 11 }, history: [{ from: 'LT5', to: 'HT5', mode: 'Axe', date: 'May 2026' }] },
  { id: 175, username: 'ElyundSlam', region: 'AU', status: 'up', tiers: { axe: 'lt5' }, discord: 'elyundslam#7035', youtube: null, stats: { wr: '69%', elo: 11, streak: 16 }, history: [{ from: 'HT5', to: 'LT5', mode: 'Axe', date: 'Apr 2026' }] },
  { id: 176, username: 'Hitig', region: 'SA', status: 'stable', tiers: { axe: 'lt5' }, discord: 'hitig#1841', youtube: null, stats: { wr: '91%', elo: 14, streak: 19 }, history: [{ from: 'LT5', to: 'LT5', mode: 'Axe', date: 'May 2026' }] },
  { id: 177, username: 'RodientDebris', region: 'EU', status: 'down', tiers: { axe: 'lt5' }, discord: 'rodientdebris#2800', youtube: null, stats: { wr: '65%', elo: 15, streak: 2 }, history: [{ from: 'LT5', to: 'LT5', mode: 'Axe', date: 'Mar 2026' }] },
  { id: 178, username: 'TNTdCutter', region: 'AU', status: 'stable', tiers: { mace: 'ht1' }, discord: 'tntdcutter#2020', youtube: null, stats: { wr: '89%', elo: 272, streak: 16 }, history: [] },
  { id: 179, username: 'WooherKing', region: 'AU', status: 'stable', title: 'grandmaster', verified: true, tiers: { mace: 'ht1', axe: 'lt1' }, discord: 'wooherking#9734', youtube: null, stats: { wr: '70%', elo: 297, streak: 6 }, history: [{ from: 'LT1', to: 'HT1', mode: 'Mace', date: 'Jun 2026' }] },
  { id: 180, username: 'DetdCharge', region: 'EU', status: 'down', tiers: { mace: 'ht1' }, discord: 'detdcharge#5876', youtube: null, stats: { wr: '67%', elo: 280, streak: 18 }, history: [] },
  { id: 181, username: 'ShldCharge', region: 'AS', status: 'up', tiers: { mace: 'lt1', uhc: 'lt2' }, discord: 'shldcharge#9899', youtube: 'https://youtube.com/@shldcharge', stats: { wr: '67%', elo: 256, streak: 10 }, history: [{ from: 'LT2', to: 'LT1', mode: 'Mace', date: 'Jul 2026' }] },
  { id: 182, username: 'IrodeRunner', region: 'AS', status: 'stable', tiers: { mace: 'lt1' }, discord: 'iroderunner#5201', youtube: null, stats: { wr: '55%', elo: 246, streak: 12 }, history: [] },
  { id: 183, username: 'GrockClutch', region: 'SA', status: 'up', tiers: { mace: 'ht2', overall: 'ht2' }, discord: 'grockclutch#4920', youtube: null, stats: { wr: '58%', elo: 197, streak: 4 }, history: [{ from: 'HT2', to: 'HT2', mode: 'Mace', date: 'Jun 2026' }] },
  { id: 184, username: 'Fezitberries', region: 'AU', status: 'stable', tiers: { mace: 'ht2' }, discord: 'fezitberries#3252', youtube: null, stats: { wr: '80%', elo: 199, streak: 4 }, history: [{ from: 'HT2', to: 'HT2', mode: 'Mace', date: 'Apr 2026' }] },
  { id: 185, username: 'Alcave', region: 'AS', status: 'stable', tiers: { mace: 'lt2' }, discord: 'alcave#2465', youtube: null, stats: { wr: '91%', elo: 168, streak: 2 }, history: [] },
  { id: 186, username: 'Groeki', region: 'EU', status: 'stable', tiers: { mace: 'lt2', uhc: 'lt3' }, discord: 'groeki#7504', youtube: null, stats: { wr: '61%', elo: 160, streak: 2 }, history: [] },
  { id: 187, username: 'GapafeMaster', region: 'NA', status: 'stable', tiers: { mace: 'lt2' }, discord: 'gapafemaster#6489', youtube: 'https://youtube.com/@gapafemaster', stats: { wr: '86%', elo: 158, streak: 20 }, history: [{ from: 'LT3', to: 'LT2', mode: 'Mace', date: 'Feb 2026' }] },
  { id: 188, username: 'ShinfulPvP', region: 'AS', status: 'stable', tiers: { mace: 'ht3' }, discord: 'shinfulpvp#1230', youtube: null, stats: { wr: '79%', elo: 135, streak: 9 }, history: [] },
  { id: 189, username: 'AnceldBreak', region: 'EU', status: 'up', tiers: { mace: 'ht3' }, discord: 'anceldbreak#9442', youtube: null, stats: { wr: '90%', elo: 135, streak: 13 }, history: [{ from: 'HT4', to: 'HT3', mode: 'Mace', date: 'Jun 2026' }] },
  { id: 190, username: 'Lumnopig', region: 'AU', status: 'stable', tiers: { mace: 'ht3' }, discord: 'lumnopig#4858', youtube: null, stats: { wr: '65%', elo: 129, streak: 1 }, history: [{ from: 'LT3', to: 'HT3', mode: 'Mace', date: 'Mar 2026' }] },
  { id: 191, username: 'Rodteh', region: 'AS', status: 'up', tiers: { mace: 'lt3', smp: 'ht1' }, discord: 'rodteh#8625', youtube: null, stats: { wr: '65%', elo: 119, streak: 2 }, history: [{ from: 'LT4', to: 'LT3', mode: 'Mace', date: 'Jun 2026' }] },
  { id: 192, username: 'GolReg', region: 'NA', status: 'up', tiers: { mace: 'lt3' }, discord: 'golreg#4590', youtube: null, stats: { wr: '68%', elo: 116, streak: 12 }, history: [] },
  { id: 193, username: 'FrolageRaid', region: 'SA', status: 'stable', tiers: { mace: 'lt3' }, discord: 'frolageraid#4578', youtube: null, stats: { wr: '85%', elo: 115, streak: 16 }, history: [] },
  { id: 194, username: 'ReduchBonk', region: 'AS', status: 'stable', tiers: { mace: 'ht4', axe: 'ht4' }, discord: 'reduchbonk#9972', youtube: 'https://youtube.com/@reduchbonk', stats: { wr: '86%', elo: 91, streak: 4 }, history: [] },
  { id: 195, username: 'BlaundSlam', region: 'EU', status: 'stable', tiers: { mace: 'ht4', smp: 'ht4' }, discord: 'blaundslam#4365', youtube: 'https://youtube.com/@blaundslam', stats: { wr: '83%', elo: 80, streak: 15 }, history: [] },
  { id: 196, username: 'ElystonePvP', region: 'NA', status: 'stable', tiers: { mace: 'lt4' }, discord: 'elystonepvp#1945', youtube: null, stats: { wr: '82%', elo: 50, streak: 14 }, history: [{ from: 'HT5', to: 'LT4', mode: 'Mace', date: 'Jun 2026' }] },
  { id: 197, username: 'CryearKing', region: 'NA', status: 'up', tiers: { mace: 'lt4' }, discord: 'cryearking#6644', youtube: 'https://youtube.com/@cryearking', stats: { wr: '87%', elo: 48, streak: 3 }, history: [] },
  { id: 198, username: 'FlaL', region: 'AU', status: 'stable', tiers: { mace: 'lt4', sword: 'ht5' }, discord: 'flal#7887', youtube: null, stats: { wr: '76%', elo: 65, streak: 6 }, history: [{ from: 'LT5', to: 'LT4', mode: 'Mace', date: 'Apr 2026' }] },
  { id: 199, username: 'SweachAxe', region: 'EU', status: 'up', tiers: { mace: 'ht5' }, discord: 'sweachaxe#9802', youtube: 'https://youtube.com/@sweachaxe', stats: { wr: '72%', elo: 33, streak: 4 }, history: [{ from: 'HT5', to: 'HT5', mode: 'Mace', date: 'Jun 2026' }] },
  { id: 200, username: 'Stivxn', region: 'AS', status: 'stable', tiers: { mace: 'ht5' }, discord: 'stivxn#4762', youtube: null, stats: { wr: '84%', elo: 28, streak: 14 }, history: [{ from: 'LT5', to: 'HT5', mode: 'Mace', date: 'Feb 2026' }] },
  { id: 201, username: 'KqnstLooter', region: 'SA', status: 'up', tiers: { mace: 'ht5', axe: 'ht1' }, discord: 'kqnstlooter#2653', youtube: 'https://youtube.com/@kqnstlooter', stats: { wr: '51%', elo: 30, streak: 8 }, history: [{ from: 'LT5', to: 'HT5', mode: 'Mace', date: 'May 2026' }] },
  { id: 202, username: 'Arrlack', region: 'AU', status: 'stable', tiers: { mace: 'lt5', smp: 'lt2' }, discord: 'arrlack#1924', youtube: null, stats: { wr: '84%', elo: 3, streak: 7 }, history: [{ from: 'LT5', to: 'LT5', mode: 'Mace', date: 'Feb 2026' }] },
  { id: 203, username: 'BlaieldPop', region: 'SA', status: 'up', tiers: { mace: 'lt5' }, discord: 'blaieldpop#3347', youtube: null, stats: { wr: '70%', elo: 19, streak: 8 }, history: [] },
];


// ─── STATE ───
let activeGamemode = 'overall';
let searchQuery = '';
let regionFilter = 'all';
let sortAZ = false; // legacy, replaced with sortByElo
let sortByElo = true;

// ─── DOM REFS ───
const tierlistContainer = document.getElementById('tierlistContainer');
const searchInput = document.getElementById('searchInput');
const regionSelectWrapper = document.getElementById('regionSelectWrapper');
const regionSelectBtn = document.getElementById('regionSelectBtn');
const regionSelectMenu = document.getElementById('regionSelectMenu');
const regionSelectLabel = document.getElementById('regionSelectLabel');
const sortBtn = document.getElementById('sortBtn');
const sortLabel = document.getElementById('sortLabel');
const gamemodeTabs = document.getElementById('gamemodeTabs');
const totalPlayersEl = document.getElementById('totalPlayers');
const modalOverlay = document.getElementById('playerModal');
const modalClose = document.getElementById('modalClose');

// ─── STARFIELD CANVAS (optimized) ───
function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const STAR_COUNT = window.innerWidth < 768 ? 70 : 110;
  let resizeTimeout;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.6 + 0.3,
        speed: Math.random() * 0.12 + 0.02,
        opacity: Math.random() * 0.5 + 0.15,
        twinkleSpeed: Math.random() * 0.015 + 0.004,
        twinklePhase: Math.random() * Math.PI * 2,
        hue: 260 + Math.random() * 30, // fixed per star — was re-randomized every frame before
      });
    }
  }

  let rafId;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now() * 0.001;

    for (const star of stars) {
      const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase);
      const alpha = star.opacity + twinkle * 0.15;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${star.hue}, 50%, 82%, ${Math.max(0.04, alpha)})`;
      ctx.fill();

      if (star.size > 1.2) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${star.hue}, 70%, 70%, ${Math.max(0.01, alpha * 0.06)})`;
        ctx.fill();
      }

      star.y -= star.speed;
      if (star.y < -5) {
        star.y = canvas.height + 5;
        star.x = Math.random() * canvas.width;
      }
    }
    rafId = requestAnimationFrame(draw);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(draw);
    }
  });

  resize();
  createStars();
  draw();
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => { resize(); createStars(); }, 200);
  });
}

// ─── HELPERS ───

// Overall Elo is not a stored stat — it's the average Elo across every
// gamemode the player actually has a tier in (Overall itself excluded).
function computeOverallElo(player) {
  const modes = GAMEMODES.filter((m) => m !== 'overall' && player.tiers[m]);
  if (modes.length === 0) return null;
  const total = modes.reduce((sum) => sum + player.stats.elo, 0);
  // stats.elo is a single per-player figure (not per-mode) in this dataset,
  // so the "average across modes" collapses to that figure itself — kept as
  // a function so a future per-mode elo dataset plugs in without call-site changes.
  return Math.round(total / modes.length);
}

// Elo → tier thresholds. Elo is capped conceptually at ~2400+ for HT1;
// each full tier band spans ~600 elo down to LT5 at the bottom.
const OVERALL_TIER_THRESHOLDS = [
  { tier: 'ht1', min: 2200 },
  { tier: 'lt1', min: 2000 },
  { tier: 'ht2', min: 1850 },
  { tier: 'lt2', min: 1700 },
  { tier: 'ht3', min: 1550 },
  { tier: 'lt3', min: 1400 },
  { tier: 'ht4', min: 1250 },
  { tier: 'lt4', min: 1100 },
  { tier: 'ht5', min: 950 },
  { tier: 'lt5', min: -Infinity },
];

function computeOverallTier(elo) {
  if (elo == null) return null;
  for (const band of OVERALL_TIER_THRESHOLDS) {
    if (elo >= band.min) return band.tier;
  }
  return 'lt5';
}

function getPlayersForMode(mode) {
  if (mode === 'overall') {
    return PLAYERS.filter((p) => GAMEMODES.some((m) => m !== 'overall' && p.tiers[m]));
  }
  return PLAYERS.filter((p) => p.tiers[mode]);
}

function filterPlayers(players) {
  let filtered = players;
  if (regionFilter !== 'all') {
    filtered = filtered.filter((p) => p.region === regionFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((p) => p.username.toLowerCase().includes(q));
  }
  return filtered;
}

function sortPlayers(players) {
  return [...players].sort((a, b) => {
    if (sortByElo) {
      return b.stats.elo - a.stats.elo;
    } else {
      return a.username.localeCompare(b.username);
    }
  });
}

function getStatusIcon(status) {
  if (status === 'up') return '<svg width="11" height="11"><use href="#icon-arrow-up"/></svg>';
  if (status === 'down') return '<svg width="11" height="11"><use href="#icon-arrow-down"/></svg>';
  return '<svg width="11" height="11"><use href="#icon-dash"/></svg>';
}

function skinHtml(username, rank) {
  const url = SKIN_URL(username);
  const rankClass = rank && rank <= 3 ? ` avatar-frame-rank-${rank}` : '';
  const swirl = rank && rank <= 3 ? `
    <div class="avatar-energy-ring">
      <span class="energy-wisp w1"></span>
      <span class="energy-wisp w2"></span>
      <span class="energy-wisp w3"></span>
      <span class="energy-wisp w4"></span>
    </div>` : '';
  return `<div class="player-skin-wrap${rankClass}">${swirl}<img class="player-skin" src="${url}" alt="" loading="lazy" onerror="this.parentElement.classList.add('no-skin');this.style.display='none'"></div>`;
}

function tierTagHtml(tierId) {
  const meta = TIER_META[tierId];
  if (!meta) return '';
  const c = meta.color;
  return `<span class="tier-tag" style="color:${c};border-color:${c};background:${c}18">${meta.short}</span>`;
}

function regionBadgeHtml(region) {
  const meta = REGION_META[region];
  const c = meta ? meta.color : '#9B93B8';
  return `<span class="region-badge" style="--region-color: ${c}">${region}</span>`;
}

function verifiedBadgeHtml(verified) {
  if (!verified) return '';
  return `<svg class="verified-badge" width="13" height="13" title="Verified"><use href="#icon-verified"/></svg>`;
}

function titleBadgeHtml(titleKey) {
  const meta = TITLE_META[titleKey];
  if (!meta) return '';
  return `<span class="player-title-badge" style="--title-color: ${meta.color}; --title-glow: ${meta.glow}">${meta.label}</span>`;
}

// Rank-based combat titles for the Overall leaderboard (top 5)
function getRankTitle(rank) {
  if (rank === 1) return 'godcombat';
  if (rank === 2) return 'supercombat';
  if (rank === 3) return 'hypercombat';
  if (rank === 4 || rank === 5) return 'trypercombat';
  return null;
}

// Name block: username and verified tick inline on the same line.
function playerNameBlockHtml(player, overrides = {}) {
  const verified = overrides.verified !== undefined ? overrides.verified : player.verified;
  return `
    <div class="player-row-name-line">
      <span class="player-row-name">${player.username}</span>
      ${verifiedBadgeHtml(verified)}
    </div>
  `;
}

const crystalOrbitHtml = `
  <div class="crystal-orbit">
    <span class="crystal-shard s1"></span>
    <span class="crystal-shard s2"></span>
    <span class="crystal-shard s3"></span>
    <span class="crystal-shard s4"></span>
  </div>`;

function rankBadgeHtml(rank) {
  if (rank === 1) {
    return `
      <div class="rank-badge rank-gold rank-badge-medal">
        <svg class="rank-badge-crown" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 3 5-6 5 6 4-3-2 11H5L3 8zm2.5 12h13v2h-13v-2z"/></svg>
        ${crystalOrbitHtml}
        <div class="rank-badge-inner"><span class="rank-badge-num">1</span></div>
      </div>`;
  }
  if (rank === 2) return `<div class="rank-badge rank-silver rank-badge-medal">${crystalOrbitHtml}<div class="rank-badge-inner"><span class="rank-badge-num">2</span></div></div>`;
  if (rank === 3) return `<div class="rank-badge rank-bronze rank-badge-medal">${crystalOrbitHtml}<div class="rank-badge-inner"><span class="rank-badge-num">3</span></div></div>`;
  return `<div class="rank-badge">${rank}</div>`;
}

// Full tier-icon grid for a player — a real Minecraft item image per gamemode
// they hold a tier in, colored/labelled by that tier. Used by the Overall tab
// cards and the profile modal so both share one look (mcpvp.club-style).
function tierIconGridHtml(player, opts = {}) {
  const excludeMode = opts.excludeMode;
  const highlightMode = opts.highlightMode;
  const modes = GAMEMODES.filter((m) => m !== 'overall' && m !== excludeMode && player.tiers[m]);
  if (modes.length === 0) return '';
  return modes.map((m) => {
    const tierId = player.tiers[m];
    const meta = TIER_META[tierId];
    if (!meta) return '';
    return `
      <div class="tier-icon-cell ${m === highlightMode ? 'is-current' : ''}" style="--cell-color:${meta.color}" title="${GAMEMODE_LABELS[m]}">
        <div class="tier-icon-circle">
          ${gamemodeItemImgHtml(m, 15)}
        </div>
        <span class="tier-icon-label">${meta.short}</span>
      </div>`;
  }).join('');
}

// Vertical list version of the same data — one row per gamemode showing the
// item icon, mode name, tier badge, and its point value, sorted highest tier
// (most points) first. Used in the profile modal.
function tierListRowsHtml(player, opts = {}) {
  const highlightMode = opts.highlightMode;
  const modes = GAMEMODES.filter((m) => m !== 'overall' && player.tiers[m]);
  if (modes.length === 0) return '';
  const rows = modes.map((m) => {
    const tierId = player.tiers[m];
    const meta = TIER_META[tierId];
    if (!meta) return null;
    return { m, tierId, meta };
  }).filter(Boolean);
  rows.sort((a, b) => (b.meta.points || 0) - (a.meta.points || 0));
  return rows.map(({ m, meta }) => `
    <div class="tier-list-row ${m === highlightMode ? 'is-current' : ''}" style="--cell-color:${meta.color}">
      <div class="tier-list-row-icon">${gamemodeItemImgHtml(m, 22)}</div>
      <div class="tier-list-row-info">
        <span class="tier-list-row-mode">${GAMEMODE_LABELS[m]}</span>
        <span class="tier-list-row-tier">${meta.short}</span>
      </div>
      <span class="tier-list-row-points">${meta.points ?? '—'} <small>pts</small></span>
    </div>`).join('');
}

// ─── RENDERING ───

// Overall tab: expanded per-player cards (mcpvp.club-style) ranked by
// computed Overall Elo (average Elo across every gamemode the player holds).
// Capped at the top 100 — players ranking below that don't get an Overall slot.
const OVERALL_RANK_CAP = 100;

function renderRankedOverall(filtered, modeLabel) {
  // Global rank is computed from the unfiltered pool so a player's rank/title
  // stays fixed even when the person is searching or filtering by region.
  const globalRanking = [...getPlayersForMode('overall')]
    .map((p) => ({ p, elo: computeOverallElo(p) }))
    .sort((a, b) => b.elo - a.elo)
    .slice(0, OVERALL_RANK_CAP);
  const rankMap = new Map(globalRanking.map((entry, idx) => [entry.p.id, idx + 1]));
  const eloMap = new Map(globalRanking.map((entry) => [entry.p.id, entry.elo]));

  const ranked = [...filtered]
    .filter((p) => rankMap.has(p.id))
    .sort((a, b) => eloMap.get(b.id) - eloMap.get(a.id));

  if (ranked.length === 0) {
    tierlistContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" style="color: var(--text-muted)"><use href="#icon-search"/></svg>
        </div>
        <div class="empty-state-text">No players found</div>
        <div class="empty-state-sub">Try adjusting your search or filters</div>
      </div>`;
    return;
  }

  const cardsHTML = ranked.map((player, i) => {
    const rank = rankMap.get(player.id);
    const elo = eloMap.get(player.id);
    const overallTier = computeOverallTier(elo);
    const rankTitle = getRankTitle(rank);
    const effectiveTitle = rankTitle || player.title;
    const effectiveVerified = rankTitle ? true : player.verified;
    const nameOverrides = { verified: effectiveVerified };
    const iconGrid = tierIconGridHtml(player, {});
    return `
      <div class="overall-player-card ${rank <= 3 ? 'rank-' + rank : ''}" data-player-id="${player.id}" role="button" tabindex="0"
           style="animation-delay: ${Math.min(i, 40) * 18}ms">
        <div class="overall-player-card-head">
          <div class="overall-card-row1">
            ${rankBadgeHtml(rank)}
            ${skinHtml(player.username, rank)}
            <div class="rank-row-info">
              ${playerNameBlockHtml(player, nameOverrides)}
            </div>
            <span class="rank-row-elo">${elo}<small>pts</small></span>
          </div>
          <div class="overall-card-row2">
            ${regionBadgeHtml(player.region)}
            ${effectiveTitle ? titleBadgeHtml(effectiveTitle) : ''}
            <div class="player-row-status ${player.status}" title="${player.status}">
              ${getStatusIcon(player.status)}
            </div>
          </div>
        </div>
        ${iconGrid ? `
        <div class="overall-player-card-tiers">
          <div class="overall-player-card-tiers-label">Tiers</div>
          <div class="tier-icon-grid">${iconGrid}</div>
        </div>` : ''}
      </div>`;
  }).join('');

  tierlistContainer.innerHTML = `
    <div class="tierlist-card ranked-card">
      <div class="tierlist-card-header">
        <div>
          <div class="tierlist-card-title">${modeLabel} Rankings</div>
          <div class="tierlist-card-sub">Top ${ranked.length} players across all gamemodes</div>
        </div>
      </div>
      <div class="overall-cards-list">
        ${cardsHTML}
      </div>
    </div>`;

  tierlistContainer.querySelectorAll('.overall-player-card').forEach((row) => {
    const playerId = parseInt(row.dataset.playerId);
    const player = PLAYERS.find((p) => p.id === playerId);
    if (player) {
      row.addEventListener('click', () => openModal(player, 'overall'));
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(player, 'overall'); }
      });
    }
  });
}

function renderTierlist() {
  const allPlayers = getPlayersForMode(activeGamemode);
  const filtered = filterPlayers(allPlayers);
  const modeLabel = GAMEMODE_LABELS[activeGamemode] || activeGamemode;

  try {
    if (activeGamemode === 'overall') {
      renderRankedOverall(filtered, modeLabel);
      totalPlayersEl.textContent = allPlayers.length;
      return;
    }

    // Build the tier columns grid
    let hasAny = false;
    let columnsHTML = '';

    for (const tierId of TIER_ORDER) {
      const tierPlayers = filtered.filter((p) => p.tiers[activeGamemode] === tierId);
      const sorted = sortPlayers(tierPlayers);
      const meta = TIER_META[tierId];
      const c = meta.color;

      if (sorted.length > 0) hasAny = true;

      let playersHTML = '';
      if (sorted.length === 0) {
        playersHTML = '<div class="tier-empty">—</div>';
      } else {
        sorted.forEach((player, i) => {
          playersHTML += `
            <div class="player-row" data-player-id="${player.id}" role="button" tabindex="0"
                 style="animation-delay: ${i * 30}ms">
              ${skinHtml(player.username)}
              <div class="player-row-info">
                ${playerNameBlockHtml(player)}
                <div class="player-row-meta">
                  <span class="player-row-region">${regionBadgeHtml(player.region)}</span>
                  <span>${player.stats.elo} pts</span>
                </div>
              </div>
              <div class="player-row-status ${player.status}" title="${player.status}">
                ${getStatusIcon(player.status)}
              </div>
            </div>`;
        });
      }

      columnsHTML += `
        <div class="tier-column">
          <div class="tier-column-head" style="--tier-color: ${c}">
            <span>
              <span class="tier-column-label">${meta.short}</span>
              <span class="tier-column-sublabel">${meta.label}</span>
            </span>
            <span class="tier-column-count">${sorted.length}</span>
          </div>
          <div class="tier-column-body">
            ${playersHTML}
          </div>
        </div>`;
    }

    if (!hasAny) {
      tierlistContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="48" height="48" style="color: var(--text-muted)"><use href="#icon-search"/></svg>
          </div>
          <div class="empty-state-text">No players found</div>
          <div class="empty-state-sub">Try adjusting your search or filters</div>
        </div>`;
    } else {
      tierlistContainer.innerHTML = `
        <div class="tierlist-card">
          <div class="tierlist-card-header">
            <div>
              <div class="tierlist-card-title">${modeLabel} Tierlist</div>
              <div class="tierlist-card-sub">All ranks in ${modeLabel} PvP</div>
            </div>
          </div>
          <div class="tierlist-grid">
            ${columnsHTML}
          </div>
        </div>`;
    }

    // Bind click events to player rows
    tierlistContainer.querySelectorAll('.player-row').forEach((row) => {
      const playerId = parseInt(row.dataset.playerId);
      const player = PLAYERS.find((p) => p.id === playerId);
      if (player) {
        row.addEventListener('click', () => openModal(player, activeGamemode));
        row.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(player, activeGamemode); }
        });
      }
    });
  } catch (err) {
    // Never leave the screen blank — surface the error visibly instead
    console.error('renderTierlist failed:', err);
    tierlistContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-text">Something went wrong rendering this tier list.</div>
        <div class="empty-state-sub">${(err && err.message) || 'Unknown error'}</div>
      </div>`;
  }

  totalPlayersEl.textContent = allPlayers.length;
}

function updateTabCounts() {
  for (const mode of GAMEMODES) {
    const count = getPlayersForMode(mode).length;
    const el = document.querySelector(`[data-count="${mode}"]`);
    if (el) el.textContent = count;
  }
}

// ─── MODAL ───

function openModal(player, mode) {
  // Overall isn't a stored tier — it's computed from the player's other modes.
  const isOverall = mode === 'overall';
  const overallElo = isOverall ? computeOverallElo(player) : null;
  const tier = isOverall ? computeOverallTier(overallElo) : player.tiers[mode];
  const meta = TIER_META[tier];

  // Determine this player's rank within the current mode's leaderboard so
  // the modal avatar can show the same top-3 elemental frame as the list.
  const rankingForMode = [...getPlayersForMode(mode === 'overall' ? 'overall' : mode)]
    .map((p) => ({ p, elo: mode === 'overall' ? computeOverallElo(p) : p.stats.elo }))
    .sort((a, b) => b.elo - a.elo);
  const modalRank = rankingForMode.findIndex((entry) => entry.p.id === player.id) + 1;

  let effectiveTitle = player.title;
  let effectiveVerified = player.verified;
  if (isOverall) {
    const globalRanking = rankingForMode;
    const rank = modalRank;
    const rankTitle = getRankTitle(rank);
    if (rankTitle) {
      effectiveTitle = rankTitle;
      effectiveVerified = true;
    }
  }

  document.getElementById('modalAvatar').src = SKIN_URL_LG(player.username);
  const avatarWrap = document.getElementById('modalAvatarWrap');
  if (avatarWrap) {
    avatarWrap.className = 'modal-avatar-wrap';
    avatarWrap.querySelectorAll('.avatar-energy-ring, .energy-wisp').forEach((el) => el.remove());
    if (modalRank && modalRank <= 3) {
      avatarWrap.classList.add(`avatar-frame-rank-${modalRank}`);
      avatarWrap.insertAdjacentHTML('afterbegin', `
        <div class="avatar-energy-ring"></div>
        <span class="energy-wisp w1"></span>
      `);
    }
  }
  const headerEl = document.getElementById('modalHeader');
  if (headerEl) headerEl.style.setProperty('--banner-color', meta.color);

  document.getElementById('modalName').innerHTML = `
    <span>${player.username}</span>
    ${effectiveTitle ? titleBadgeHtml(effectiveTitle) : ''}
    ${verifiedBadgeHtml(effectiveVerified)}
  `;

  const modalTitleEl = document.getElementById('modalPlayerTitle');
  if (modalTitleEl) modalTitleEl.innerHTML = '';

  const tierEl = document.getElementById('modalTier');
  if (isOverall) {
    tierEl.innerHTML = '';
    tierEl.style.display = 'none';
  } else {
    tierEl.style.display = '';
    tierEl.innerHTML = tierTagHtml(tier) + `<span class="modal-tier-label">${meta.label}</span>`;
  }

  document.getElementById('modalRegion').innerHTML = regionBadgeHtml(player.region);

  // All Gamemode Tiers — expand the profile to show every real tier this
  // player holds (Overall excluded from the grid since it's a derived stat,
  // not a per-mode tier), with the mode the modal was opened from highlighted.
  const gamemodesSection = document.getElementById('modalGamemodesSection');
  const tierList = tierListRowsHtml(player, { highlightMode: isOverall ? null : mode });
  if (tierList) {
    document.getElementById('modalGamemodes').innerHTML = tierList;
    gamemodesSection.style.display = '';
  } else {
    gamemodesSection.style.display = 'none';
  }

  // Stats
  document.getElementById('modalStats').innerHTML = `
    <div class="modal-stat-card">
      <div class="modal-stat-value">${player.stats.wr}</div>
      <div class="modal-stat-label">Win Rate</div>
    </div>
    <div class="modal-stat-card">
      <div class="modal-stat-value">${isOverall ? overallElo : player.stats.elo}</div>
      <div class="modal-stat-label">Pts</div>
    </div>
    <div class="modal-stat-card">
      <div class="modal-stat-value">${player.stats.streak}</div>
      <div class="modal-stat-label">Win Streak</div>
    </div>
  `;

  // Links
  let linksHTML = `
    <a href="#" class="modal-link" title="Discord: ${player.discord}">
      <svg class="link-icon" width="18" height="18"><use href="#icon-discord"/></svg>
      <span>${player.discord.split('#')[0]}</span>
    </a>`;
  if (player.youtube) {
    linksHTML += `
      <a href="${player.youtube}" target="_blank" rel="noopener noreferrer" class="modal-link">
        <svg class="link-icon" width="18" height="18"><use href="#icon-youtube"/></svg>
        <span>YouTube</span>
      </a>`;
  }
  document.getElementById('modalLinks').innerHTML = linksHTML;

  // Timeline
  const timeline = document.getElementById('modalTimeline');
  if (player.history.length === 0) {
    timeline.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">No tier changes recorded</div>';
  } else {
    timeline.innerHTML = player.history.map((entry) => `
      <div class="timeline-entry">
        <span class="timeline-tier">${tierTagHtml(entry.to.toLowerCase().replace(' ', '')) || entry.to}</span>
        <span class="timeline-arrow">←</span>
        <span class="timeline-tier" style="color: var(--text-secondary)">${entry.from}</span>
        <span class="timeline-gamemode">${entry.mode}</span>
        <span class="timeline-date">${entry.date}</span>
      </div>
    `).join('');
  }

  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ─── EVENT LISTENERS ───

// Gamemode tabs
gamemodeTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.gamemode-tab');
  if (!tab || tab.classList.contains('active')) return;
  document.querySelectorAll('.gamemode-tab').forEach((t) => t.classList.remove('active'));
  tab.classList.add('active');
  activeGamemode = tab.dataset.mode;
  renderTierlist();
});

// Search (debounced)
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery = e.target.value.trim();
    renderTierlist();
  }, 120);
});

// Region filter (custom dropdown)
regionSelectBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  regionSelectWrapper.classList.toggle('open');
});

regionSelectMenu.querySelectorAll('.region-select-option').forEach((opt) => {
  opt.addEventListener('click', () => {
    regionFilter = opt.dataset.value;
    regionSelectLabel.textContent = opt.textContent;
    regionSelectMenu.querySelectorAll('.region-select-option').forEach((o) => o.classList.remove('active'));
    opt.classList.add('active');
    regionSelectWrapper.classList.remove('open');
    renderTierlist();
  });
});

document.addEventListener('click', (e) => {
  if (!regionSelectWrapper.contains(e.target)) {
    regionSelectWrapper.classList.remove('open');
  }
});

// Sort toggle
sortBtn.addEventListener('click', () => {
  sortByElo = !sortByElo;
  sortLabel.textContent = sortByElo ? 'Pts' : 'A-Z';
  renderTierlist();
});

// Modal
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  updateTabCounts();
  renderTierlist();
});
