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

const TIER_ORDER = ['ht1', 'lt1', 'ht2', 'lt2', 'ht3', 'lt3'];

const TIER_META = {
  ht1: { label: 'High Tier 1', short: 'HT1', color: '#ff2244' },
  lt1: { label: 'Low Tier 1',  short: 'LT1', color: '#ff6677' },
  ht2: { label: 'High Tier 2', short: 'HT2', color: '#A855F7' },
  lt2: { label: 'Low Tier 2',  short: 'LT2', color: '#22D3EE' },
  ht3: { label: 'High Tier 3', short: 'HT3', color: '#34D399' },
  lt3: { label: 'Low Tier 3',  short: 'LT3', color: '#60A5FA' },
};

const REGION_FLAGS = {
  NA:  '🇺🇸',
  EU:  '🇪🇺',
  AS:  '🇯🇵',
  OCE: '🇦🇺',
  SA:  '🇧🇷',
};

const GAMEMODES = ['sword', 'axe', 'crystal', 'pot', 'uhc'];

const GAMEMODE_LABELS = {
  sword:   'Sword',
  axe:     'Axe',
  crystal: 'Crystal',
  pot:     'Pot',
  uhc:     'UHC',
};

// ─── MOCK PLAYER DATABASE ───
const PLAYERS = [
  // ── SWORD ──
  { id: 1,  username: 'Stimpy',       region: 'NA',  status: 'stable', tiers: { sword: 'ht1', axe: 'ht2', uhc: 'lt1' }, discord: 'stimpy#0001', youtube: 'https://youtube.com/@stimpy', stats: { wr: '87%', elo: 2340, streak: 14 }, history: [{ from: 'LT1', to: 'HT1', mode: 'Sword', date: 'Jun 2026' }, { from: 'HT2', to: 'LT1', mode: 'Sword', date: 'Mar 2026' }] },
  { id: 2,  username: 'Danteh',       region: 'NA',  status: 'up',     tiers: { sword: 'ht1', pot: 'lt1' }, discord: 'danteh#1234', youtube: 'https://youtube.com/@danteh', stats: { wr: '84%', elo: 2290, streak: 11 }, history: [{ from: 'LT1', to: 'HT1', mode: 'Sword', date: 'Jul 2026' }] },
  { id: 3,  username: 'Cxlvxn',       region: 'NA',  status: 'stable', tiers: { sword: 'ht1', crystal: 'ht1' }, discord: 'cxlvxn#4321', youtube: 'https://youtube.com/@cxlvxn', stats: { wr: '91%', elo: 2420, streak: 22 }, history: [{ from: 'HT1', to: 'HT1', mode: 'Sword', date: 'May 2026' }] },
  { id: 4,  username: 'Quig',         region: 'EU',  status: 'up',     tiers: { sword: 'ht1', uhc: 'ht1' }, discord: 'quig#5555', youtube: null, stats: { wr: '89%', elo: 2380, streak: 18 }, history: [{ from: 'LT1', to: 'HT1', mode: 'Sword', date: 'Jul 2026' }] },
  { id: 5,  username: 'Kqneki',       region: 'EU',  status: 'stable', tiers: { sword: 'lt1', pot: 'ht2' }, discord: 'kqneki#2222', youtube: null, stats: { wr: '78%', elo: 2100, streak: 8 }, history: [{ from: 'HT2', to: 'LT1', mode: 'Sword', date: 'Apr 2026' }] },
  { id: 6,  username: 'Ziblacking',   region: 'NA',  status: 'down',   tiers: { sword: 'lt1', axe: 'lt1' }, discord: 'ziblacking#3333', youtube: 'https://youtube.com/@ziblacking', stats: { wr: '76%', elo: 2050, streak: 5 }, history: [{ from: 'HT1', to: 'LT1', mode: 'Sword', date: 'Jun 2026' }, { from: 'LT1', to: 'HT1', mode: 'Sword', date: 'Jan 2026' }] },
  { id: 7,  username: 'Fezus',        region: 'EU',  status: 'stable', tiers: { sword: 'lt1', crystal: 'lt2' }, discord: 'fezus#7777', youtube: null, stats: { wr: '75%', elo: 2010, streak: 6 }, history: [{ from: 'HT2', to: 'LT1', mode: 'Sword', date: 'May 2026' }] },
  { id: 8,  username: 'Flaym',        region: 'EU',  status: 'up',     tiers: { sword: 'ht2', uhc: 'ht2' }, discord: 'flaym#4444', youtube: null, stats: { wr: '73%', elo: 1950, streak: 9 }, history: [{ from: 'LT2', to: 'HT2', mode: 'Sword', date: 'Jul 2026' }] },
  { id: 9,  username: 'TapL',         region: 'NA',  status: 'stable', tiers: { sword: 'ht2', uhc: 'lt1' }, discord: 'tapl#6666', youtube: 'https://youtube.com/@TapL', stats: { wr: '71%', elo: 1920, streak: 4 }, history: [{ from: 'LT2', to: 'HT2', mode: 'Sword', date: 'Mar 2026' }] },
  { id: 10, username: 'Dreaum',       region: 'NA',  status: 'down',   tiers: { sword: 'ht2', pot: 'ht3' }, discord: 'dreaum#8888', youtube: null, stats: { wr: '68%', elo: 1850, streak: 3 }, history: [{ from: 'LT1', to: 'HT2', mode: 'Sword', date: 'Jun 2026' }] },
  { id: 11, username: 'Sweatpvp',     region: 'AS',  status: 'up',     tiers: { sword: 'ht2' }, discord: 'sweatpvp#9999', youtube: null, stats: { wr: '70%', elo: 1880, streak: 7 }, history: [{ from: 'LT2', to: 'HT2', mode: 'Sword', date: 'Jul 2026' }] },
  { id: 12, username: 'iMakeMcVids',  region: 'NA',  status: 'stable', tiers: { sword: 'lt2', axe: 'ht3' }, discord: 'imakemcvids#1111', youtube: 'https://youtube.com/@imakemcvids', stats: { wr: '65%', elo: 1780, streak: 5 }, history: [{ from: 'HT3', to: 'LT2', mode: 'Sword', date: 'Apr 2026' }] },
  { id: 13, username: 'Fruitberries', region: 'NA',  status: 'stable', tiers: { sword: 'lt2', uhc: 'ht2' }, discord: 'fruitberries#2345', youtube: 'https://youtube.com/@fruitberries', stats: { wr: '67%', elo: 1810, streak: 6 }, history: [{ from: 'HT3', to: 'LT2', mode: 'Sword', date: 'May 2026' }] },
  { id: 14, username: 'Relvse',       region: 'SA',  status: 'up',     tiers: { sword: 'lt2' }, discord: 'relvse#3456', youtube: null, stats: { wr: '64%', elo: 1760, streak: 4 }, history: [{ from: 'HT3', to: 'LT2', mode: 'Sword', date: 'Jun 2026' }] },
  { id: 15, username: 'PainfulPvP',   region: 'OCE', status: 'stable', tiers: { sword: 'lt2' }, discord: 'painfulpvp#4567', youtube: null, stats: { wr: '63%', elo: 1740, streak: 3 }, history: [{ from: 'HT3', to: 'LT2', mode: 'Sword', date: 'Feb 2026' }] },
  { id: 16, username: 'Sharpness',    region: 'EU',  status: 'down',   tiers: { sword: 'ht3' }, discord: 'sharpness#5678', youtube: null, stats: { wr: '58%', elo: 1620, streak: 2 }, history: [{ from: 'LT2', to: 'HT3', mode: 'Sword', date: 'Jul 2026' }] },
  { id: 17, username: 'Nethrite',     region: 'NA',  status: 'stable', tiers: { sword: 'ht3', axe: 'lt3' }, discord: 'nethrite#6789', youtube: null, stats: { wr: '60%', elo: 1650, streak: 4 }, history: [{ from: 'LT3', to: 'HT3', mode: 'Sword', date: 'Mar 2026' }] },
  { id: 18, username: 'Technopig',    region: 'NA',  status: 'up',     tiers: { sword: 'ht3', uhc: 'ht3' }, discord: 'technopig#7890', youtube: 'https://youtube.com/@technopig', stats: { wr: '61%', elo: 1680, streak: 5 }, history: [{ from: 'LT3', to: 'HT3', mode: 'Sword', date: 'Jun 2026' }] },
  { id: 19, username: 'BladeRunner',  region: 'AS',  status: 'stable', tiers: { sword: 'lt3' }, discord: 'bladerunner#8901', youtube: null, stats: { wr: '55%', elo: 1540, streak: 2 }, history: [{ from: 'LT3', to: 'LT3', mode: 'Sword', date: 'May 2026' }] },
  { id: 20, username: 'FrostByte',    region: 'EU',  status: 'stable', tiers: { sword: 'lt3' }, discord: 'frostbyte#9012', youtube: null, stats: { wr: '54%', elo: 1520, streak: 1 }, history: [] },
  { id: 21, username: 'PhantomEdge',  region: 'OCE', status: 'up',     tiers: { sword: 'lt3' }, discord: 'phantomedge#0123', youtube: null, stats: { wr: '56%', elo: 1560, streak: 3 }, history: [{ from: 'New', to: 'LT3', mode: 'Sword', date: 'Jul 2026' }] },

  // ── AXE ──
  { id: 22, username: 'AxeGod',       region: 'NA',  status: 'stable', tiers: { axe: 'ht1' }, discord: 'axegod#1111', youtube: null, stats: { wr: '86%', elo: 2310, streak: 16 }, history: [{ from: 'LT1', to: 'HT1', mode: 'Axe', date: 'Apr 2026' }] },
  { id: 23, username: 'CriticalHit',  region: 'EU',  status: 'up',     tiers: { axe: 'ht1', sword: 'lt1' }, discord: 'criticalhit#2222', youtube: 'https://youtube.com/@criticalhit', stats: { wr: '83%', elo: 2260, streak: 12 }, history: [{ from: 'LT1', to: 'HT1', mode: 'Axe', date: 'Jun 2026' }] },
  { id: 24, username: 'LumberJack',   region: 'NA',  status: 'stable', tiers: { axe: 'lt1' }, discord: 'lumberjack#3333', youtube: null, stats: { wr: '77%', elo: 2070, streak: 8 }, history: [{ from: 'HT2', to: 'LT1', mode: 'Axe', date: 'May 2026' }] },
  { id: 25, username: 'ShieldBreak',  region: 'EU',  status: 'down',   tiers: { axe: 'lt1' }, discord: 'shieldbreak#4444', youtube: null, stats: { wr: '74%', elo: 1990, streak: 5 }, history: [{ from: 'HT1', to: 'LT1', mode: 'Axe', date: 'Jul 2026' }] },
  { id: 26, username: 'Cleave',       region: 'AS',  status: 'up',     tiers: { axe: 'ht2' }, discord: 'cleave#5555', youtube: null, stats: { wr: '69%', elo: 1860, streak: 6 }, history: [{ from: 'LT2', to: 'HT2', mode: 'Axe', date: 'Jun 2026' }] },
  { id: 27, username: 'WoodCutter',   region: 'SA',  status: 'stable', tiers: { axe: 'ht2' }, discord: 'woodcutter#6666', youtube: null, stats: { wr: '67%', elo: 1820, streak: 4 }, history: [] },
  { id: 28, username: 'TimberWolf',   region: 'NA',  status: 'stable', tiers: { axe: 'lt2' }, discord: 'timberwolf#7777', youtube: null, stats: { wr: '62%', elo: 1730, streak: 3 }, history: [] },
  { id: 29, username: 'AxeSlinger',   region: 'OCE', status: 'down',   tiers: { axe: 'lt2' }, discord: 'axeslinger#8888', youtube: null, stats: { wr: '60%', elo: 1700, streak: 2 }, history: [{ from: 'HT2', to: 'LT2', mode: 'Axe', date: 'Jul 2026' }] },
  { id: 30, username: 'HatchetPvP',   region: 'EU',  status: 'stable', tiers: { axe: 'ht3' }, discord: 'hatchetpvp#9999', youtube: null, stats: { wr: '57%', elo: 1600, streak: 3 }, history: [] },
  { id: 31, username: 'ChopMaster',   region: 'NA',  status: 'up',     tiers: { axe: 'lt3' }, discord: 'chopmaster#0000', youtube: null, stats: { wr: '53%', elo: 1500, streak: 1 }, history: [{ from: 'New', to: 'LT3', mode: 'Axe', date: 'Jul 2026' }] },

  // ── CRYSTAL ──
  { id: 32, username: 'CrystalKing',  region: 'NA',  status: 'stable', tiers: { crystal: 'ht1', sword: 'ht2' }, discord: 'crystalking#1010', youtube: 'https://youtube.com/@crystalking', stats: { wr: '90%', elo: 2400, streak: 20 }, history: [{ from: 'HT1', to: 'HT1', mode: 'Crystal', date: 'Jul 2026' }] },
  { id: 33, username: 'EndCrystal',   region: 'EU',  status: 'up',     tiers: { crystal: 'ht1' }, discord: 'endcrystal#2020', youtube: null, stats: { wr: '85%', elo: 2280, streak: 15 }, history: [{ from: 'LT1', to: 'HT1', mode: 'Crystal', date: 'Jul 2026' }] },
  { id: 34, username: 'Obsidian',     region: 'NA',  status: 'stable', tiers: { crystal: 'lt1' }, discord: 'obsidian#3030', youtube: null, stats: { wr: '79%', elo: 2130, streak: 9 }, history: [{ from: 'HT2', to: 'LT1', mode: 'Crystal', date: 'May 2026' }] },
  { id: 35, username: 'AnchorPvP',    region: 'AS',  status: 'stable', tiers: { crystal: 'lt1' }, discord: 'anchorpvp#4040', youtube: null, stats: { wr: '76%', elo: 2040, streak: 7 }, history: [] },
  { id: 36, username: 'BlastRadius',  region: 'SA',  status: 'up',     tiers: { crystal: 'ht2' }, discord: 'blastradius#5050', youtube: null, stats: { wr: '72%', elo: 1940, streak: 6 }, history: [{ from: 'LT2', to: 'HT2', mode: 'Crystal', date: 'Jun 2026' }] },
  { id: 37, username: 'TotemPop',     region: 'NA',  status: 'down',   tiers: { crystal: 'ht2' }, discord: 'totempop#6060', youtube: 'https://youtube.com/@totempop', stats: { wr: '69%', elo: 1870, streak: 4 }, history: [{ from: 'LT1', to: 'HT2', mode: 'Crystal', date: 'Jul 2026' }] },
  { id: 38, username: 'BedrockBoi',   region: 'EU',  status: 'stable', tiers: { crystal: 'lt2' }, discord: 'bedrockboi#7070', youtube: null, stats: { wr: '64%', elo: 1770, streak: 3 }, history: [] },
  { id: 39, username: 'PearlClutch',  region: 'OCE', status: 'stable', tiers: { crystal: 'lt2' }, discord: 'pearlclutch#8080', youtube: null, stats: { wr: '62%', elo: 1720, streak: 2 }, history: [] },
  { id: 40, username: 'WitherSkull',  region: 'NA',  status: 'up',     tiers: { crystal: 'ht3' }, discord: 'witherskull#9090', youtube: null, stats: { wr: '59%', elo: 1640, streak: 4 }, history: [{ from: 'LT3', to: 'HT3', mode: 'Crystal', date: 'Jul 2026' }] },
  { id: 41, username: 'Detonator',    region: 'EU',  status: 'stable', tiers: { crystal: 'lt3' }, discord: 'detonator#1212', youtube: null, stats: { wr: '54%', elo: 1510, streak: 1 }, history: [] },

  // ── POT ──
  { id: 42, username: 'PotGod',       region: 'NA',  status: 'stable', tiers: { pot: 'ht1' }, discord: 'potgod#1313', youtube: 'https://youtube.com/@potgod', stats: { wr: '88%', elo: 2360, streak: 17 }, history: [{ from: 'HT1', to: 'HT1', mode: 'Pot', date: 'Jul 2026' }] },
  { id: 43, username: 'SplashMaster', region: 'EU',  status: 'up',     tiers: { pot: 'ht1' }, discord: 'splashmaster#1414', youtube: null, stats: { wr: '82%', elo: 2240, streak: 13 }, history: [{ from: 'LT1', to: 'HT1', mode: 'Pot', date: 'Jun 2026' }] },
  { id: 44, username: 'BrewCraft',    region: 'NA',  status: 'stable', tiers: { pot: 'lt1' }, discord: 'brewcraft#1515', youtube: null, stats: { wr: '77%', elo: 2080, streak: 7 }, history: [] },
  { id: 45, username: 'PotionLord',   region: 'SA',  status: 'down',   tiers: { pot: 'lt1' }, discord: 'potionlord#1616', youtube: null, stats: { wr: '75%', elo: 2020, streak: 5 }, history: [{ from: 'HT1', to: 'LT1', mode: 'Pot', date: 'Jul 2026' }] },
  { id: 46, username: 'Alchemy',      region: 'AS',  status: 'stable', tiers: { pot: 'ht2' }, discord: 'alchemy#1717', youtube: null, stats: { wr: '70%', elo: 1890, streak: 6 }, history: [] },
  { id: 47, username: 'ThrowPot',     region: 'EU',  status: 'up',     tiers: { pot: 'ht2' }, discord: 'throwpot#1818', youtube: null, stats: { wr: '68%', elo: 1840, streak: 5 }, history: [{ from: 'LT2', to: 'HT2', mode: 'Pot', date: 'Jul 2026' }] },
  { id: 48, username: 'HealRush',     region: 'NA',  status: 'stable', tiers: { pot: 'lt2' }, discord: 'healrush#1919', youtube: null, stats: { wr: '63%', elo: 1750, streak: 3 }, history: [] },
  { id: 49, username: 'RegenKing',    region: 'OCE', status: 'down',   tiers: { pot: 'lt2' }, discord: 'regenking#2020', youtube: null, stats: { wr: '61%', elo: 1710, streak: 2 }, history: [{ from: 'HT2', to: 'LT2', mode: 'Pot', date: 'Jun 2026' }] },
  { id: 50, username: 'DrinkFast',    region: 'NA',  status: 'stable', tiers: { pot: 'ht3' }, discord: 'drinkfast#2121', youtube: null, stats: { wr: '58%', elo: 1630, streak: 3 }, history: [] },
  { id: 51, username: 'PotFlick',     region: 'EU',  status: 'up',     tiers: { pot: 'lt3' }, discord: 'potflick#2222', youtube: null, stats: { wr: '52%', elo: 1480, streak: 1 }, history: [{ from: 'New', to: 'LT3', mode: 'Pot', date: 'Jul 2026' }] },

  // ── UHC ──
  { id: 52, username: 'UHCLegend',    region: 'EU',  status: 'stable', tiers: { uhc: 'ht1', sword: 'ht2' }, discord: 'uhclegend#2323', youtube: 'https://youtube.com/@uhclegend', stats: { wr: '85%', elo: 2300, streak: 14 }, history: [{ from: 'LT1', to: 'HT1', mode: 'UHC', date: 'May 2026' }] },
  { id: 53, username: 'GoldenHead',   region: 'NA',  status: 'up',     tiers: { uhc: 'ht1' }, discord: 'goldenhead#2424', youtube: null, stats: { wr: '83%', elo: 2250, streak: 11 }, history: [{ from: 'LT1', to: 'HT1', mode: 'UHC', date: 'Jul 2026' }] },
  { id: 54, username: 'Absorption',   region: 'NA',  status: 'stable', tiers: { uhc: 'lt1' }, discord: 'absorption#2525', youtube: null, stats: { wr: '78%', elo: 2100, streak: 8 }, history: [] },
  { id: 55, username: 'RodMaster',    region: 'EU',  status: 'down',   tiers: { uhc: 'lt1' }, discord: 'rodmaster#2626', youtube: null, stats: { wr: '75%', elo: 2030, streak: 6 }, history: [{ from: 'HT1', to: 'LT1', mode: 'UHC', date: 'Jun 2026' }] },
  { id: 56, username: 'FlintSteel',   region: 'AS',  status: 'stable', tiers: { uhc: 'ht2' }, discord: 'flintsteel#2727', youtube: null, stats: { wr: '71%', elo: 1910, streak: 5 }, history: [] },
  { id: 57, username: 'ArrowSnipe',   region: 'SA',  status: 'up',     tiers: { uhc: 'ht2' }, discord: 'arrowsnipe#2828', youtube: null, stats: { wr: '69%', elo: 1870, streak: 7 }, history: [{ from: 'LT2', to: 'HT2', mode: 'UHC', date: 'Jul 2026' }] },
  { id: 58, username: 'GappleKing',   region: 'EU',  status: 'stable', tiers: { uhc: 'lt2' }, discord: 'gappleking#2929', youtube: null, stats: { wr: '65%', elo: 1790, streak: 4 }, history: [] },
  { id: 59, username: 'SwordRush',    region: 'OCE', status: 'stable', tiers: { uhc: 'lt2' }, discord: 'swordrush#3030', youtube: null, stats: { wr: '63%', elo: 1750, streak: 3 }, history: [] },
  { id: 60, username: 'DiamondGrind', region: 'NA',  status: 'down',   tiers: { uhc: 'ht3' }, discord: 'diamondgrind#3131', youtube: null, stats: { wr: '59%', elo: 1650, streak: 2 }, history: [{ from: 'LT2', to: 'HT3', mode: 'UHC', date: 'Jul 2026' }] },
  { id: 61, username: 'IronSight',    region: 'AS',  status: 'stable', tiers: { uhc: 'ht3' }, discord: 'ironsight#3232', youtube: null, stats: { wr: '57%', elo: 1610, streak: 3 }, history: [] },
  { id: 62, username: 'BowSpam',      region: 'NA',  status: 'up',     tiers: { uhc: 'lt3' }, discord: 'bowspam#3333', youtube: null, stats: { wr: '53%', elo: 1490, streak: 2 }, history: [{ from: 'New', to: 'LT3', mode: 'UHC', date: 'Jul 2026' }] },
  { id: 63, username: 'NetherRod',    region: 'EU',  status: 'stable', tiers: { uhc: 'lt3' }, discord: 'netherrod#3434', youtube: null, stats: { wr: '51%', elo: 1460, streak: 1 }, history: [] },
];


// ─── STATE ───
let activeGamemode = 'sword';
let searchQuery = '';
let regionFilter = 'all';
let sortAZ = false; // legacy, replaced with sortByElo
let sortByElo = true;

// ─── DOM REFS ───
const tierlistContainer = document.getElementById('tierlistContainer');
const searchInput = document.getElementById('searchInput');
const regionSelect = document.getElementById('regionFilter');
const sortBtn = document.getElementById('sortBtn');
const sortLabel = document.getElementById('sortLabel');
const gamemodeTabs = document.getElementById('gamemodeTabs');
const totalPlayersEl = document.getElementById('totalPlayers');
const modalOverlay = document.getElementById('playerModal');
const modalClose = document.getElementById('modalClose');

// ─── STARFIELD CANVAS ───
function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const STAR_COUNT = 160;

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
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now() * 0.001;

    for (const star of stars) {
      const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase);
      const alpha = star.opacity + twinkle * 0.15;
      const hue = 260 + Math.random() * 30;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 50%, 82%, ${Math.max(0.04, alpha)})`;
      ctx.fill();

      if (star.size > 1.2) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 70%, 70%, ${Math.max(0.01, alpha * 0.06)})`;
        ctx.fill();
      }

      star.y -= star.speed;
      if (star.y < -5) {
        star.y = canvas.height + 5;
        star.x = Math.random() * canvas.width;
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  createStars();
  draw();
  window.addEventListener('resize', () => { resize(); createStars(); });
}

// ─── HELPERS ───

function getPlayersForMode(mode) {
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

function skinHtml(username) {
  const url = SKIN_URL(username);
  return `<div class="player-skin-wrap"><img class="player-skin" src="${url}" alt="" loading="lazy" onerror="this.parentElement.classList.add('no-skin');this.style.display='none'"></div>`;
}

function tierTagHtml(tierId) {
  const meta = TIER_META[tierId];
  if (!meta) return '';
  const c = meta.color;
  return `<span class="tier-tag" style="color:${c};border-color:${c};background:${c}18">${meta.short}</span>`;
}

// ─── RENDERING ───

function renderTierlist() {
  const allPlayers = getPlayersForMode(activeGamemode);
  const filtered = filterPlayers(allPlayers);
  const modeLabel = GAMEMODE_LABELS[activeGamemode] || activeGamemode;

  // Fade out
  tierlistContainer.style.opacity = '0';
  tierlistContainer.style.transform = 'translateY(8px)';

  setTimeout(() => {
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
                <div class="player-row-name">${player.username}</div>
                <div class="player-row-meta">
                  <span class="player-row-region">
                    <span class="player-row-region-flag">${REGION_FLAGS[player.region]}</span>
                    <span class="player-row-region-label">${player.region}</span>
                  </span>
                  <span>${player.stats.elo} elo</span>
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

    // Fade in
    requestAnimationFrame(() => {
      tierlistContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      tierlistContainer.style.opacity = '1';
      tierlistContainer.style.transform = 'translateY(0)';
    });
  }, 180);

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
  const tier = player.tiers[mode];
  const meta = TIER_META[tier];

  document.getElementById('modalAvatar').src = SKIN_URL_LG(player.username);
  document.getElementById('modalName').textContent = player.username;

  const tierEl = document.getElementById('modalTier');
  tierEl.innerHTML = tierTagHtml(tier) + `<span style="margin-left: 8px; color: var(--text-secondary)">${meta.label}</span>`;

  document.getElementById('modalRegion').innerHTML = `
    <span>${REGION_FLAGS[player.region]}</span>
    <span>${player.region}</span>
  `;

  // Stats
  document.getElementById('modalStats').innerHTML = `
    <div class="modal-stat-card">
      <div class="modal-stat-value">${player.stats.wr}</div>
      <div class="modal-stat-label">Win Rate</div>
    </div>
    <div class="modal-stat-card">
      <div class="modal-stat-value">${player.stats.elo}</div>
      <div class="modal-stat-label">Elo</div>
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

// Region filter
regionSelect.addEventListener('change', (e) => {
  regionFilter = e.target.value;
  renderTierlist();
});

// Sort toggle
sortBtn.addEventListener('click', () => {
  sortByElo = !sortByElo;
  sortLabel.textContent = sortByElo ? 'Elo' : 'A-Z';
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
