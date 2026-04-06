import {
  speciesList,
  speciesByName,
  rarityMeta,
  typeMeta,
  speciesTypesBySpecies,
  typeChart,
  evolutionData,
  statusMeta,
  passiveTraitsBySpecies,
  thirdMovesBySpecies,
  routeTrainerNames,
  routeTrainerTitles,
  routeNpcDialogues,
  routeProfiles,
  playerSprites,
  defaultPlayerSpriteId,
  playerSprite,
  trainerSprite,
  tallGrassSprite,
  treeSprite,
  fieldStationSprite,
  capsuleSprite,
  coinSprite,
  tonicSprite,
  cacheSprite,
  charmSprite,
  bobberSprite,
  landmarkSprites
} from './data.js';
import {
  getHighScore,
  setHighScore,
  clearHighScore,
  writeStoredJson,
  writeStoredValue,
  prepareVPixelHunterSession,
  createStageShell,
  bindStandaloneControls
} from './shell.js';
import { wrapIndex, colorWithAlpha, blendHex } from './utils.js';
import { createWorldHelpers } from './world.js';

let releaseVPixelHunterControls = null;
let releaseHighScoreResetListener = null;
let releasePersistenceFlushListeners = null;

const playerSpriteSheetUrls = {
  sheet1: new URL('./assets/sprites1.png', import.meta.url).href,
  sheet2: new URL('./assets/sprites2.png', import.meta.url).href
};
const npcSpriteSheetUrls = {
  npcSheet1: new URL('./assets/npc1.png', import.meta.url).href,
  npcSheet2: new URL('./assets/npc2.png', import.meta.url).href,
  npcSheet3: new URL('./assets/npc3.png', import.meta.url).href
};

const gameKey = 'vPixelHunter';
const legacyGameKey = ['monster', 'Tamer'].join('');
const saveKey = `${gameKey}RunSave`;
const legacySaveKey = `${legacyGameKey}RunSave`;
const dexKey = `${gameKey}Dex`;
const legacyDexKey = `${legacyGameKey}Dex`;
const highScoreResetEvent = 'vPixelHunter:high-score-reset';
const legacyHighScoreResetEvent = `${legacyGameKey}:high-score-reset`;
const shinySeenKey = `${gameKey}ShinySeen`;
const spriteGridSize = 16;
const tilePixelScale = 3;
const tile = spriteGridSize * tilePixelScale;
const viewCols = 13;
const viewRows = 9;
const mapOffsetX = 8;
const chunkSize = 16;
const chunkRadius = 2;
const viewWidth = mapOffsetX + viewCols * tile + mapOffsetX;
const viewHeight = viewRows * tile;
const canvasResolutionScale = 2;
const fieldSpriteScale = tilePixelScale;
const lootSpriteScale = tilePixelScale;
const menuSpriteScale = 3;
const battleSpriteScale = 4;
const worldHalfSprite = fieldSpriteScale * (spriteGridSize / 2);
const lootHalfSprite = lootSpriteScale * (spriteGridSize / 2);
const canvasUiFont = 'Trebuchet MS';
const framedSceneDesignWidth = 312;
const framedSceneDesignHeight = 208;
const framedScenePadding = 20;
const spriteSheetFrameSize = 16;
const playerFacingRows = {
  down: 0,
  left: 1,
  right: 2,
  up: 3
};

function facingForStep(dx, dy, fallback = 'down') {
  if (dx < 0) return 'left';
  if (dx > 0) return 'right';
  if (dy < 0) return 'up';
  if (dy > 0) return 'down';
  return fallback;
}

function canvasFont(size, weight = '700', family = canvasUiFont) {
  return `${weight} ${size}px ${family}`;
}

function tileUnit(value) {
  return Math.round(value * tilePixelScale);
}

export function startVPixelHunterGame({ renderScreen, readLocalJson, goBack, controls, setScrollHandler, getSelectedPlayerSpriteId }) {
  prepareVPixelHunterSession();
  if (releaseVPixelHunterControls) { releaseVPixelHunterControls(); releaseVPixelHunterControls = null; }

  const savedRun = readLocalJson(saveKey, readLocalJson(legacySaveKey, null));

  renderScreen(
    createStageShell(`
      <div class="monster-stage">
        <canvas id="mtCanvas" width="${viewWidth}" height="${viewHeight}" style="background:#d8f0be;border:2px solid #3e5032;border-radius:10px;"></canvas>
        <div class="monster-statusbar">
          <div id="mtMsg" style="min-height:18px;font-size:0.84em;text-align:center;line-height:1.25;">Leave town and start hunting</div>
        </div>
      </div>
    `)
  );

  const canvas = document.getElementById('mtCanvas');
  const ctx = canvas.getContext('2d');
  const characterSpriteSheetImages = Object.fromEntries(
    Object.entries({ ...playerSpriteSheetUrls, ...npcSpriteSheetUrls }).map(([sheetId, sheetUrl]) => {
      const image = new Image();
      image.src = sheetUrl;
      image.addEventListener('load', () => {
        drawTamerWorld();
      });
      return [sheetId, image];
    })
  );
  canvas.width = viewWidth * canvasResolutionScale;
  canvas.height = viewHeight * canvasResolutionScale;
  ctx.setTransform(canvasResolutionScale, 0, 0, canvasResolutionScale, 0, 0);
  let worldSeed = Number.isFinite(savedRun?.worldSeed) ? savedRun.worldSeed : Math.floor(Math.random() * 1000000);
  ctx.imageSmoothingEnabled = false;

  function selectedPlayerSpriteConfig() {
    const spriteId = typeof getSelectedPlayerSpriteId === 'function'
      ? getSelectedPlayerSpriteId()
      : defaultPlayerSpriteId;
    return playerSprites[spriteId] || playerSprites[defaultPlayerSpriteId] || { sprite: playerSprite };
  }

  function fitCanvasText(text, maxWidth) {
    const value = String(text || '');
    if (ctx.measureText(value).width <= maxWidth) return value;
    let trimmed = value;
    while (trimmed.length > 1 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    return `${trimmed}...`;
  }

  function wrapCanvasText(text, maxWidth, maxLines = Infinity) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    words.forEach(word => {
      const next = current ? `${current} ${word}` : word;
      if (!current || ctx.measureText(next).width <= maxWidth) {
        current = next;
        return;
      }
      lines.push(current);
      current = word;
    });

    if (current) lines.push(current);
    if (lines.length <= maxLines) return lines;

    const clipped = lines.slice(0, maxLines);
    clipped[maxLines - 1] = fitCanvasText(clipped[maxLines - 1], maxWidth);
    return clipped;
  }

  function drawFramedScene(drawScene) {
    const sceneScale = Math.max(1, Math.min(
      (viewWidth - framedScenePadding * 2) / framedSceneDesignWidth,
      (viewHeight - framedScenePadding * 2) / framedSceneDesignHeight
    ));
    const frameWidth = Math.floor(framedSceneDesignWidth * sceneScale);
    const frameHeight = Math.floor(framedSceneDesignHeight * sceneScale);
    const frameX = Math.floor((viewWidth - frameWidth) / 2);
    const frameY = Math.floor((viewHeight - frameHeight) / 2);
    ctx.save();
    ctx.translate(frameX, frameY);
    ctx.scale(sceneScale, sceneScale);
    drawScene(framedSceneDesignWidth, framedSceneDesignHeight, sceneScale);
    ctx.restore();
  }

  function drawFullCanvasScene(drawScene) {
    const scaleX = viewWidth / framedSceneDesignWidth;
    const scaleY = viewHeight / framedSceneDesignHeight;
    ctx.save();
    ctx.scale(scaleX, scaleY);
    drawScene(framedSceneDesignWidth, framedSceneDesignHeight, Math.min(scaleX, scaleY));
    ctx.restore();
  }

  let highScore = getHighScore(readLocalJson, gameKey, [legacyGameKey]);
  let chunks = new Map();
  let player = { x: 0, y: 1 };
  let party = [];
  let storedMonsters = [];
  const activePartyLimit = 6;
  let activeIndex = 0;
  let captures = 0;
  let defeated = 0;
  let steps = 0;
  let score = 0;
  let nextTravelScoreStep = 20;
  let gameOver = false;
  let battleTarget = null;
  let worldTick = 0;
  let renderTick = 0;
  let playerFacing = 'down';
  let playerWalkFrame = 0;
  let playerWalkAnimationUntil = 0;
  let encounterRollCounter = 0;
  let coins = 20;
  let capsules = 5;
  let tonics = 0;
  let rods = 0;
  let charms = 0;
  let caughtMonsterCounter = 0;
  let badges = [];
  const shinyChance = 1 / 128;
  const maxCapsules = 20;
  const maxTonics = 20;
  const maxRods = 20;
  const tonicHealAmount = 12;
  const battleRootOptions = [
    { key: 'attack', label: 'Attack' },
    { key: 'item', label: 'Item' },
    { key: 'switch', label: 'Switch' },
    { key: 'run', label: 'Run' },
    { key: 'capture', label: 'Capture' }
  ];
  const shopItems = [
    { key: 'heal', label: 'Heal Party', cost: 0 },
    { key: 'capsule', label: 'Buy Capsule', cost: 18 },
    { key: 'rod', label: 'Buy Fishing Rod', cost: 22 },
    { key: 'tonic', label: 'Buy Tonic', cost: 18 },
    { key: 'boss', label: 'Town Boss', cost: 0 },
    { key: 'index', label: 'Monster Index', cost: 0 },
    { key: 'storage', label: 'Storage Box', cost: 0 },
    { key: 'leave', label: 'Leave Town', cost: 0 }
  ];
  let townMenuOpen = false;
  let townSelection = 0;
  let indexMenuOpen = false;
  let indexSelection = 0;
  let storageMenuOpen = false;
  let storageMenuColumn = 'party';
  let storagePartySelection = 0;
  let storageBoxSelection = 0;
  let storageSwapPending = null;
  let playerMenuOpen = false;
  let playerMenuMode = 'party';
  let playerMenuSelection = 0;
  let playerMenuActionSelection = 0;
  let playerMenuSwapSelection = 0;
  let townships = [];
  let activeTownship = null;
  let encounterTransition = null;
  let encounterTransitionFrame = null;
  let battleAnimation = null;
  let battleAnimationFrame = null;
  let battleResultBanner = null;
  let evolutionAnimation = null;
  let evolutionAnimationQueue = [];
  let fishingAnimation = null;
  let fishingAnimationFrame = null;
  let ambientAnimationFrame = null;
  let ambientLastAt = 0;
  let battleMenuMode = 'root';
  let battleMenuSelection = 0;
  let battleSubSelection = 0;
  let monsterDex = readLocalJson(dexKey, readLocalJson(legacyDexKey, {}));
  let runGoalSpecies = {};
  let runGoalDungeonLoot = false;
  let lastMessageText = 'Leave town, discover route monsters, and return to town to check your index.';
  let runSaveTimer = null;
  let dexSaveTimer = null;
  let runSaveDirty = false;
  let dexSaveDirty = false;
  let storageWarningShown = false;

  const {
    key,
    chunkKey,
    hashValue,
    buildTownships,
    getTownshipAt,
    isTownShopTile,
    currentScore,
    adventureProgress,
    distanceFromOrigin,
    progressionLevelCap,
    highestPartyLevel,
    averagePartyLevel,
    monsterDisplayName,
    assignCaughtMonsterTag,
    nextTownshipHint,
    battleBannerTitle,
    earlyGameRelief,
    lootTierAt,
    routeProfileAt,
    routeLabelAt,
    routeSortIndex,
    getDungeonZone,
    hasLandmarkAt,
    routesForSpecies,
    baseTerrainAt
  } = createWorldHelpers({
    worldSeed,
    routeProfiles,
    getPlayer: () => player,
    getTownships: () => townships,
    getParty: () => party,
    getStats: () => ({ captures, defeated, steps, coins, score }),
    getCaughtMonsterCounter: () => caughtMonsterCounter,
    setCaughtMonsterCounter: (nextValue) => { caughtMonsterCounter = nextValue; },
    badgeCount,
    hasBadge,
    terrainAt: (x, y) => terrainAt(x, y)
  });

  function trainerSpriteConfigForPosition(x, y, seedOffset = 0) {
    const trainerSpriteIndex = Math.floor(hashValue(x, y, 541 + seedOffset) * 16);
    const sheetIndex = Math.floor(trainerSpriteIndex / 8);
    const sheetSpriteIndex = trainerSpriteIndex % 8;
    return {
      sheetId: sheetIndex === 0 ? 'npcSheet1' : 'npcSheet2',
      sheetFrameX: (sheetSpriteIndex % 4) * 3,
      sheetFrameY: Math.floor(sheetSpriteIndex / 4) * 4
    };
  }

  function npcSpriteConfigForPosition(x, y, seedOffset = 0) {
    const spriteIndex = Math.floor(hashValue(x, y, 647 + seedOffset) * 8);
    return {
      sheetId: 'npcSheet3',
      sheetFrameX: (spriteIndex % 4) * 3,
      sheetFrameY: Math.floor(spriteIndex / 4) * 4
    };
  }

  function showBattleResult(title, detail, durationMs = 1500) {
    battleResultBanner = {
      title,
      detail,
      expiresAt: performance.now() + durationMs
    };
  }

  function evolutionVisualForMonster(monster, fallbackSpeciesName = '') {
    const species = speciesByName[monster?.species || fallbackSpeciesName] || speciesByName[fallbackSpeciesName] || null;
    return {
      name: monster?.name || species?.name || fallbackSpeciesName || 'Unknown',
      species: monster?.species || species?.name || fallbackSpeciesName || 'Unknown',
      color: monster?.color || species?.color || '#ffffff',
      accent: monster?.accent || species?.accent || '#dfe8ff',
      sprite: monster?.sprite || species?.sprite || playerSprite,
      battleSprite: monster?.battleSprite || species?.battleSprite || null,
      shiny: !!monster?.shiny
    };
  }

  function queueEvolutionAnimation(previousMonster, evolvedMonster) {
    evolutionAnimationQueue.push({
      from: evolutionVisualForMonster(previousMonster, previousMonster?.species),
      to: evolutionVisualForMonster(evolvedMonster, evolvedMonster?.species)
    });
    if (!evolutionAnimation) {
      startNextEvolutionAnimation();
    }
  }

  function startNextEvolutionAnimation() {
    const nextEvolution = evolutionAnimationQueue.shift();
    if (!nextEvolution) {
      evolutionAnimation = null;
      return false;
    }
    battleResultBanner = null;
    evolutionAnimation = {
      ...nextEvolution,
      startedAt: performance.now(),
      durationMs: 2100,
      promptAtMs: 1500
    };
    drawTamerWorld();
    return true;
  }

  function advanceEvolutionAnimation() {
    if (!evolutionAnimation) return false;
    const elapsed = performance.now() - evolutionAnimation.startedAt;
    if (elapsed < evolutionAnimation.promptAtMs) return true;
    evolutionAnimation = null;
    if (startNextEvolutionAnimation()) {
      return true;
    }
    drawTamerWorld();
    return true;
  }

  function summarizeVPixelHunterMessage(text) {
    if (!text) return '';

    let match = null;

    const exact = new Map([
      ['Your party rested at town.', 'Party healed'],
      ['Town services are open. Stock up or check your index.', 'Town services open'],
      ['Monster Index opened. Browse routes and discoveries.', 'Index open'],
      ['Storage Box opened. Swap active and stored monsters.', 'Storage open'],
      ['Party menu opened. Check stats, move partners, or use items.', 'Party menu open'],
      ['Back to town services.', 'Back to town'],
      ['Back to your party list.', 'Back to party'],
      ['Closed the party menu.', 'Party menu closed'],
      ['You head back out onto the route.', 'Back on route'],
      ['The town nurse patched up your party.', 'Party healed'],
      ['Not enough coins for that purchase.', 'Not enough coins'],
      ['Your capsule bag is already full.', 'Capsules full'],
      ['You bought one fishing rod.', '+1 rod'],
      ['You bought one capsule.', '+1 capsule'],
      ['Nothing to interact with here right now.', 'Nothing here'],
      ['Only one healthy partner is ready right now.', 'Only one partner ready'],
      ['You are out of capsules. Return to town and buy more.', 'Out of capsules'],
      ['You need a fishing rod first.', 'Need a rod'],
      ['Stand beside water to fish.', 'Need water'],
      ['Water nearby. Enter/Spacebar to Fish.', 'Fish here'],
      ['Use Up/Down to browse the Monster Index.', 'Browse index'],
      ['Use Left/Right to change columns and Up/Down to browse the Storage Box.', 'Browse storage'],
      ['Use Up/Down to browse your party.', 'Browse party'],
      ['Choose a party action.', 'Choose party action'],
      ['Choose a partner to swap positions with.', 'Choose swap target'],
      ['Use Up/Down to browse town services.', 'Browse town menu'],
      ['You are in battle. Enter/Spacebar to Interact.', 'In battle'],
      ['You are back in town. Enter/Spacebar to Open.', 'Back in town'],
      ['Leave town, discover route monsters, and return to town to check your index.', 'Leave town and start hunting'],
      ['No lead monster to treat.', 'No lead monster'],
      ['You leave the shop and head back outside.', 'Left the shop']
    ]);

    if (exact.has(text)) {
      return exact.get(text);
    }

    match = text.match(/^(.+) selected\.$/);
    if (match) return match[1];

    match = text.match(/^(.+) entry selected\.$/);
    if (match) return `${match[1]} info`;

    match = text.match(/^(.+) is already at full HP\.$/);
    if (match) return `${match[1]} full HP`;

    match = text.match(/^(.+) recovered with a tonic\.$/);
    if (match) return `${match[1]} healed`;

    if (text === 'You found a field tonic.') return '+1 tonic';
    if (text === 'You bought one tonic.') return '+1 tonic';
    if (text === 'You are out of tonics.') return 'Out of tonics';
    if (text === 'No stored monsters are available right now.') return 'Box empty';
    if (text === 'Party is full. Choose a party monster to swap out.') return 'Choose party swap';
    if (text === 'Choose a boxed monster to swap in.') return 'Choose box swap';
    if (text === 'Choose a party monster to swap out.') return 'Choose party swap';
    if (text === 'Choose an attack.') return 'Choose attack';
    if (text === 'Choose an item.') return 'Choose item';
    if (text === 'Choose a partner.') return 'Choose partner';
    if (text === 'No usable items right now.') return 'No items';
    if (text === 'No healthy partners can switch in.') return 'No partner ready';
    if (text === 'Choose Attack, Item, Switch, Run, or Capture.') return 'Choose action';

    match = text.match(/^Boss (.+) sent out (.+) for the (.+) Badge\.$/);
    if (match) return `${match[3]} Badge boss`;

    match = text.match(/^(.+) won the (.+) Badge and (\d+)c\.(?: (.+))?$/);
    if (match) return `${match[2]} Badge +${match[3]}c`;

    match = text.match(/^(.+) stepped in\.$/);
    if (match) return `Switched ${match[1]}`;

    match = text.match(/^(.+) evolved into (.+)!$/);
    if (match) return `${match[2]} evolved`;

    match = text.match(/^Need (.+) before (.+) can be challenged\.$/);
    if (match) return `${match[2]} locked`;

    match = text.match(/^You escaped from (.+)\.$/);
    if (match) return `Escaped ${match[1]}`;

    match = text.match(/^Couldn't escape! (.+) cuts you off for (\d+)\.$/);
    if (match) return `Run failed · ${match[1]} ${match[2]}`;

    match = text.match(/^You found (\d+) coins in a weathered cache\.$/);
    if (match) return `+${match[1]} coins`;

    match = text.match(/^You found (\d+) capsule(?:s)? in a supply pod\.$/);
    if (match) return `+${match[1]} capsule`;

    match = text.match(/^You found a field tonic\. (.+) recovered (\d+) HP\.$/);
    if (match) return `${match[1]} +${match[2]} HP`;

    match = text.match(/^You found a field tonic\. No one needed it, so you traded it for (\d+) coins\.$/);
    if (match) return `Tonic traded · +${match[1]}c`;

    match = text.match(/^You uncovered a (.+) and found (\d+) coins\.$/);
    if (match) return `${match[1]} · +${match[2]}c`;

    match = text.match(/^You uncovered a (.+) and found (\d+) capsules\.$/);
    if (match) return `${match[1]} · +${match[2]} cap`;

    match = text.match(/^You uncovered a (.+) and restored (\d+) HP across your party\.$/);
    if (match) return `${match[1]} · +${match[2]} HP`;

    if (text === 'You found a capture charm. Your next capture attempt will be stronger.') return '+1 charm';

    if (text === 'You cast out, but nothing bites. The rod still looks usable.') return 'No bite · Rod kept';
    if (text === 'You cast out, but nothing bites. The rod snapped.') return 'No bite · Rod broke';

    match = text.match(/^Capture charm flared\. You caught the (.+) (.+)! (?:.+ recovered \d+ HP\. )?Party (\d+)\. Capsules left: (\d+)\.$/);
    if (match) return `Charm catch · ${match[2]} · Cap ${match[4]}`;

    match = text.match(/^Something tugged the line in (.+)\.$/);
    if (match) return `Fishing · ${match[1]}`;

    match = text.match(/^Capture charm faded\. (.+) lashes out for (\d+)\. Capsules left: (\d+)\.$/);
    if (match) return `Charm spent · ${match[1]} hit ${match[2]}`;

    match = text.match(/^(.+) Final score: (\d+)\.$/);
    if (match) return `${match[1]} Score ${match[2]}`;

    match = text.match(/^A (.+) (.+) appeared on .+ Capsules left: (\d+)\.(?: Shiny Glint theme unlocked\.)?$/);
    if (match) return `${match[1]} ${match[2]} spotted · Cap ${match[3]}`;

    match = text.match(/^(.+) won, earned (\d+)c(?:, (?:and )?grew to Lv(\d+))?(?:, and recovered (\d+) HP)?\.$/);
    if (match) return `${match[1]} won · +${match[2]}c · Lv${match[3]}`;

    match = text.match(/^(.+) defeated (.+), earned (\d+)c(?:, and recovered (\d+) HP)?\.$/);
    if (match) return `${match[1]} beat ${match[2]} · +${match[3]}c`;

    match = text.match(/^(.+) hits (.+) for (\d+)\.$/);
    if (match) return `${match[1]} hit ${match[2]} · ${match[3]}`;

    match = text.match(/^(.+) knocked out (.+)\.$/);
    if (match) return `${match[2]} fainted`;

    match = text.match(/^Lead monster: (.+)\.$/);
    if (match) return `Lead: ${match[1]}`;

    match = text.match(/^(.+) was sent to storage\.$/);
    if (match) return `${match[1]} boxed`;

    match = text.match(/^(.+) joined your party from storage\.$/);
    if (match) return `${match[1]} withdrawn`;

    match = text.match(/^Swapped party (.+) with stored (.+)\.$/);
    if (match) return `${match[1]} ⇄ ${match[2]}`;

    match = text.match(/^You caught the (.+) (.+)! (?:.+ recovered \d+ HP\. )?Party (\d+)\. Capsules left: (\d+)\.$/);
    if (match) return `Caught ${match[2]} · Party ${match[3]} · Cap ${match[4]}`;

    match = text.match(/^Capture failed\. (.+) lashes out for (\d+)\. Capsules left: (\d+)\.$/);
    if (match) return `Missed catch · ${match[1]} hit ${match[2]} · Cap ${match[3]}`;

    match = text.match(/^Tall grass rustles on (.+)\.$/);
    if (match) return `Grass rustles · ${match[1]}`;

    match = text.match(/^You are on (.+)\. Stronger monsters live farther out\.$/);
    if (match) return `Route: ${match[1]}`;

    if (text === 'Thick trees block the route.') return 'Trees block the way';
    if (text === 'Water cuts off the path.') return 'Water blocks the way';

    return text;
  }

  function vPixelHunterMessageDuration(message) {
    if (!message) return 2200;
    if (/Caught|spotted|Score|won|Party healed/.test(message)) return 3000;
    if (/In battle|Browse|Route:|Lead:/.test(message)) return 1800;
    return 2200;
  }

  function setMessage(text) {
    const summary = summarizeVPixelHunterMessage(text);
    if (!summary) return;

    lastMessageText = text;

    const el = document.getElementById('mtMsg');
    if (el) el.textContent = summary;

    persistRunState();
  }

  function activeMonster() {
    return party[activeIndex] || null;
  }

  function reportStorageFailure(context) {
    if (storageWarningShown) return;
    storageWarningShown = true;
    console.warn(`vPixelHunter storage write failed during ${context}. Progress may not persist.`);
    const el = document.getElementById('mtMsg');
    if (el && !gameOver) {
      el.textContent = 'Storage unavailable. Progress may not persist.';
    }
  }

  function markRunGoalSpecies(monsterOrSpecies) {
    const speciesName = typeof monsterOrSpecies === 'string'
      ? monsterOrSpecies
      : monsterOrSpecies?.species || monsterOrSpecies?.name;
    if (!speciesName) return;
    runGoalSpecies[speciesName] = true;
  }

  function runGoalSpeciesCount() {
    return Object.keys(runGoalSpecies).length;
  }

  function serializeChunks() {
    return Array.from(chunks.entries()).map(([id, chunk]) => [
      id,
      [
        (chunk.monsters || []).map(monster => ({ ...monster })),
        (chunk.loot || []).map(item => ({ ...item }))
      ]
    ]);
  }

  function parseSavedChunkId(id) {
    const [rawCx, rawCy] = String(id || '').split(',');
    const cx = Number(rawCx);
    const cy = Number(rawCy);
    return {
      cx: Number.isFinite(cx) ? cx : 0,
      cy: Number.isFinite(cy) ? cy : 0
    };
  }

  function deserializeSavedChunk(id, savedChunk) {
    const { cx, cy } = parseSavedChunkId(id);
    const normalizedChunk = Array.isArray(savedChunk)
      ? { monsters: savedChunk[0], loot: savedChunk[1] }
      : savedChunk;
    return {
      cx: Number.isFinite(normalizedChunk?.cx) ? normalizedChunk.cx : cx,
      cy: Number.isFinite(normalizedChunk?.cy) ? normalizedChunk.cy : cy,
      monsters: Array.isArray(normalizedChunk?.monsters)
        ? normalizedChunk.monsters.map(monster => ensureNpcSpriteState(ensureTrainerSpriteState({ ...monster })))
        : [],
      loot: Array.isArray(normalizedChunk?.loot)
        ? normalizedChunk.loot.map(item => ({ ...item }))
        : []
    };
  }

  function buildRunSaveState() {
    return {
      version: 2,
      worldSeed,
      player: { ...player },
      party: party.map(monster => ({ ...monster })),
      storedMonsters: storedMonsters.map(monster => ({ ...monster })),
      activeIndex,
      captures,
      defeated,
      steps,
      score,
      nextTravelScoreStep,
      gameOver,
      coins,
      capsules,
      tonics,
      rods,
      charms,
      caughtMonsterCounter,
      badges: [...badges],
      encounterRollCounter,
      townMenuOpen,
      townSelection,
      indexMenuOpen,
      indexSelection,
      storageMenuOpen,
      storageMenuColumn,
      storagePartySelection,
      storageBoxSelection,
      storageSwapPending: storageSwapPending ? { ...storageSwapPending } : null,
      playerMenuOpen,
      playerMenuMode,
      playerMenuSelection,
      playerMenuActionSelection,
      playerMenuSwapSelection,
      battleMenuMode,
      battleMenuSelection,
      battleSubSelection,
      battleTarget: battleTarget ? { ...battleTarget } : null,
      battleResultBanner: battleResultBanner ? {
        title: battleResultBanner.title,
        detail: battleResultBanner.detail,
        expiresAt: battleResultBanner.expiresAt
      } : null,
      runGoalSpecies,
      runGoalDungeonLoot,
      lastMessageText,
      chunks: serializeChunks(),
      monsterDex
    };
  }

  function flushRunSave() {
    if (!runSaveDirty || !canvas) return true;
    runSaveDirty = false;
    if (runSaveTimer) {
      clearTimeout(runSaveTimer);
      runSaveTimer = null;
    }
    const didWrite = writeStoredJson(saveKey, buildRunSaveState());
    if (!didWrite) reportStorageFailure('run save');
    return didWrite;
  }

  function flushDexSave() {
    if (!dexSaveDirty) return true;
    dexSaveDirty = false;
    if (dexSaveTimer) {
      clearTimeout(dexSaveTimer);
      dexSaveTimer = null;
    }
    const didWrite = writeStoredJson(dexKey, monsterDex);
    if (!didWrite) reportStorageFailure('monster index save');
    return didWrite;
  }

  function flushPendingStorageWrites() {
    flushDexSave();
    flushRunSave();
  }

  function findSavedChunkMonsterById(monsterId) {
    if (!monsterId) return null;
    for (const chunk of chunks.values()) {
      const found = (chunk.monsters || []).find(monster => monster.id === monsterId);
      if (found) return found;
    }
    return null;
  }

  function persistRunState({ immediate = false } = {}) {
    if (!canvas) return;
    runSaveDirty = true;
    if (immediate) {
      flushRunSave();
      return;
    }
    if (runSaveTimer) return;
    runSaveTimer = window.setTimeout(() => {
      runSaveTimer = null;
      flushRunSave();
    }, 180);
  }

  function restoreRunState(saveState) {
    if (!saveState || typeof saveState !== 'object') return false;

    worldSeed = Number.isFinite(saveState.worldSeed) ? saveState.worldSeed : worldSeed;
    player = saveState.player && Number.isFinite(saveState.player.x) && Number.isFinite(saveState.player.y)
      ? { x: saveState.player.x, y: saveState.player.y }
      : player;
    party = Array.isArray(saveState.party) ? saveState.party.map(monster => ({ ...monster })) : party;
    storedMonsters = Array.isArray(saveState.storedMonsters) ? saveState.storedMonsters.map(monster => ({ ...monster })) : storedMonsters;
    activeIndex = Number.isFinite(saveState.activeIndex) ? saveState.activeIndex : activeIndex;
    captures = Number.isFinite(saveState.captures) ? saveState.captures : captures;
    defeated = Number.isFinite(saveState.defeated) ? saveState.defeated : defeated;
    steps = Number.isFinite(saveState.steps) ? saveState.steps : steps;
    score = Number.isFinite(saveState.score) ? saveState.score : inferArcadeScore(saveState);
    nextTravelScoreStep = Number.isFinite(saveState.nextTravelScoreStep)
      ? saveState.nextTravelScoreStep
      : (Math.floor(Math.max(0, steps) / 20) + 1) * 20;
    gameOver = !!saveState.gameOver;
    coins = Number.isFinite(saveState.coins) ? saveState.coins : coins;
    capsules = Number.isFinite(saveState.capsules) ? saveState.capsules : capsules;
    tonics = Number.isFinite(saveState.tonics) ? saveState.tonics : tonics;
    rods = Number.isFinite(saveState.rods) ? saveState.rods : rods;
    charms = Number.isFinite(saveState.charms) ? saveState.charms : charms;
    caughtMonsterCounter = Number.isFinite(saveState.caughtMonsterCounter) ? saveState.caughtMonsterCounter : caughtMonsterCounter;
    badges = Array.isArray(saveState.badges) ? [...saveState.badges] : badges;
    encounterRollCounter = Number.isFinite(saveState.encounterRollCounter) ? saveState.encounterRollCounter : encounterRollCounter;

    townMenuOpen = !!saveState.townMenuOpen;
    townSelection = Number.isFinite(saveState.townSelection) ? saveState.townSelection : townSelection;
    indexMenuOpen = !!saveState.indexMenuOpen;
    indexSelection = Number.isFinite(saveState.indexSelection) ? saveState.indexSelection : indexSelection;
    storageMenuOpen = !!saveState.storageMenuOpen;
    storageMenuColumn = saveState.storageMenuColumn === 'storage' ? 'storage' : 'party';
    storagePartySelection = Number.isFinite(saveState.storagePartySelection) ? saveState.storagePartySelection : storagePartySelection;
    storageBoxSelection = Number.isFinite(saveState.storageBoxSelection) ? saveState.storageBoxSelection : storageBoxSelection;
    storageSwapPending = saveState.storageSwapPending ? { ...saveState.storageSwapPending } : null;
    playerMenuOpen = !!saveState.playerMenuOpen;
    playerMenuMode = saveState.playerMenuMode || 'party';
    playerMenuSelection = Number.isFinite(saveState.playerMenuSelection) ? saveState.playerMenuSelection : playerMenuSelection;
    playerMenuActionSelection = Number.isFinite(saveState.playerMenuActionSelection) ? saveState.playerMenuActionSelection : playerMenuActionSelection;
    playerMenuSwapSelection = Number.isFinite(saveState.playerMenuSwapSelection) ? saveState.playerMenuSwapSelection : playerMenuSwapSelection;
    battleMenuMode = saveState.battleMenuMode || 'root';
    battleMenuSelection = Number.isFinite(saveState.battleMenuSelection) ? saveState.battleMenuSelection : battleMenuSelection;
    battleSubSelection = Number.isFinite(saveState.battleSubSelection) ? saveState.battleSubSelection : battleSubSelection;
    battleResultBanner = saveState.battleResultBanner ? {
      title: saveState.battleResultBanner.title,
      detail: saveState.battleResultBanner.detail,
      expiresAt: saveState.battleResultBanner.expiresAt
    } : null;
    runGoalSpecies = saveState.runGoalSpecies && typeof saveState.runGoalSpecies === 'object'
      ? { ...saveState.runGoalSpecies }
      : {};
    runGoalDungeonLoot = !!saveState.runGoalDungeonLoot;
    if (!Object.keys(runGoalSpecies).length) {
      [...party, ...storedMonsters].forEach(monster => markRunGoalSpecies(monster));
    }
    lastMessageText = saveState.lastMessageText || lastMessageText;
    monsterDex = saveState.monsterDex && typeof saveState.monsterDex === 'object' ? saveState.monsterDex : monsterDex;

    townships = buildTownships();
    activeTownship = townMenuOpen ? getTownshipAt() : null;
    chunks = new Map(
      Array.isArray(saveState.chunks)
        ? saveState.chunks.map(([id, chunk]) => [id, deserializeSavedChunk(id, chunk)])
        : []
    );

    battleTarget = saveState.battleTarget
      ? findSavedChunkMonsterById(saveState.battleTarget.id) || ensureNpcSpriteState(ensureTrainerSpriteState({ ...saveState.battleTarget }))
      : null;

    return true;
  }

  function badgeCount() {
    return badges.length;
  }

  const rarityScoreBonus = {
    common: 0,
    uncommon: 35,
    rare: 80,
    legendary: 160,
    mythic: 320
  };

  function inferArcadeScore(saveState) {
    const partySnapshot = Array.isArray(saveState?.party) ? saveState.party : [];
    const storedSnapshot = Array.isArray(saveState?.storedMonsters) ? saveState.storedMonsters : [];
    const totalLevelUps = [...partySnapshot, ...storedSnapshot]
      .reduce((total, monster) => total + Math.max(0, (monster?.level || 1) - 1), 0);
    const totalCaptures = Number.isFinite(saveState?.captures) ? saveState.captures : 0;
    const totalDefeats = Number.isFinite(saveState?.defeated) ? saveState.defeated : 0;
    const totalSteps = Number.isFinite(saveState?.steps) ? saveState.steps : 0;
    const totalBadges = Array.isArray(saveState?.badges) ? saveState.badges.length : 0;
    return totalCaptures * 150
      + totalDefeats * 95
      + totalLevelUps * 90
      + totalBadges * 750
      + Math.floor(totalSteps / 20) * 25;
  }

  function awardScore(points) {
    const safePoints = Math.max(0, Math.round(points || 0));
    if (!safePoints) return 0;
    score += safePoints;
    return safePoints;
  }

  function rarityScoreForMonster(monster) {
    return rarityScoreBonus[monster?.rarity] || 0;
  }

  function apexEncounterRewardBonus(monster) {
    return monster?.apexEncounter ? 260 : 0;
  }

  function evolvedEncounterRewardBonus(monster) {
    const depth = Math.max(0, monster?.evolvedEncounterDepth || 0);
    return depth > 0 ? 180 * depth : 0;
  }

  function captureScoreForMonster(monster) {
    return 120 + (monster?.level || 1) * 25 + rarityScoreForMonster(monster) + evolvedEncounterRewardBonus(monster) + apexEncounterRewardBonus(monster);
  }

  function victoryScoreForMonster(monster, { finalTrainerMon = false } = {}) {
    const isTrainerBattle = !!monster?.isTrainer;
    let points = (isTrainerBattle ? 140 : 80) + (monster?.level || 1) * (isTrainerBattle ? 25 : 20) + rarityScoreForMonster(monster) + evolvedEncounterRewardBonus(monster) + apexEncounterRewardBonus(monster);
    if (monster?.isBoss) {
      points += 750;
    } else if (finalTrainerMon) {
      points += 220;
    }
    return points;
  }

  function levelUpScore(levelsGained) {
    return Math.max(0, levelsGained) * 90;
  }

  function awardTravelScore() {
    let points = 0;
    while (steps >= nextTravelScoreStep) {
      points += 25;
      nextTravelScoreStep += 20;
    }
    return awardScore(points);
  }

  function battleRewardDetail({ points = 0, coins: rewardCoins = 0, note = '' } = {}) {
    return [
      points > 0 ? `+${points} pts` : '',
      rewardCoins > 0 ? `+${rewardCoins}c` : '',
      note
    ].filter(Boolean).join(' · ');
  }

  function badgeKeyForProfile(profile) {
    return profile?.boss?.badge || '';
  }

  function hasBadge(profile) {
    const keyName = badgeKeyForProfile(profile);
    return !!(keyName && badges.includes(keyName));
  }

  function ensureMonsterState(monster) {
    if (!monster) return null;
    if (!monster.statusKey) monster.statusKey = '';
    if (!Number.isFinite(monster.statusTurns)) monster.statusTurns = 0;
    if (!Number.isFinite(monster.statusPotency)) monster.statusPotency = 0;
    return monster;
  }

  function ensureTrainerSpriteState(monster) {
    if (!monster?.isTrainer) return monster;
    if (!monster.trainerSpriteConfig) {
      monster.trainerSpriteConfig = trainerSpriteConfigForPosition(monster.x || 0, monster.y || 0);
    }
    if (!Number.isFinite(monster.roamBias)) {
      monster.roamBias = Math.floor(hashValue(monster.x || 0, monster.y || 0, 607) * 4);
    }
    if (!monster.spriteFacing) monster.spriteFacing = 'down';
    if (!Number.isFinite(monster.spriteWalkFrame)) monster.spriteWalkFrame = 1;
    if (!Number.isFinite(monster.spriteWalkAnimationUntil)) monster.spriteWalkAnimationUntil = 0;
    return monster;
  }

  function ensureNpcSpriteState(monster) {
    if (!monster?.isNpc) return monster;
    if (!monster.npcSpriteConfig) {
      monster.npcSpriteConfig = npcSpriteConfigForPosition(monster.x || 0, monster.y || 0, monster.dialogueIndex || 0);
    }
    if (!Number.isFinite(monster.roamBias)) {
      monster.roamBias = Math.floor(hashValue(monster.x || 0, monster.y || 0, 653) * 4);
    }
    if (!monster.spriteFacing) monster.spriteFacing = 'down';
    if (!Number.isFinite(monster.spriteWalkFrame)) monster.spriteWalkFrame = 1;
    if (!Number.isFinite(monster.spriteWalkAnimationUntil)) monster.spriteWalkAnimationUntil = 0;
    return monster;
  }

  function clearMonsterStatus(monster) {
    ensureMonsterState(monster);
    monster.statusKey = '';
    monster.statusTurns = 0;
    monster.statusPotency = 0;
  }

  function statusShortLabel(monster) {
    ensureMonsterState(monster);
    if (!monster?.statusKey) return '';
    const meta = statusMeta[monster.statusKey];
    return meta ? meta.short : monster.statusKey;
  }

  function statusText(monster) {
    const short = statusShortLabel(monster);
    return short ? ` · ${short}` : '';
  }

  function setMonsterStatus(monster, effect) {
    ensureMonsterState(monster);
    if (!monster || !effect?.type) return false;
    monster.statusKey = effect.type;
    monster.statusTurns = Math.max(1, effect.turns || 1);
    monster.statusPotency = Math.max(1, effect.potency || 1);
    return true;
  }

  function effectLabel(effect) {
    if (!effect?.type) return '';
    const meta = statusMeta[effect.type];
    return meta ? meta.label : effect.type;
  }

  function typeKeyForMonster(monster) {
    return speciesTypesBySpecies[monster?.species || monster?.name] || 'stone';
  }

  function typeMetaForMonster(monster) {
    return typeMeta[typeKeyForMonster(monster)] || typeMeta.stone;
  }

  function typeLabelForMonster(monster) {
    return typeMetaForMonster(monster).label;
  }

  function typeShortForMonster(monster) {
    return typeMetaForMonster(monster).short;
  }

  function moveTypeKey(move, source) {
    return move?.type || typeKeyForMonster(source);
  }

  function moveTypeLabel(move, source) {
    return (typeMeta[moveTypeKey(move, source)] || typeMeta.stone).label;
  }

  function typeModifierForAttack(move, source, target) {
    const attackType = moveTypeKey(move, source);
    const defendType = typeKeyForMonster(target);
    return typeChart[attackType]?.[defendType] || 1;
  }

  function sameTypeAttackBonus(move, source) {
    return moveTypeKey(move, source) === typeKeyForMonster(source) ? 1.12 : 1;
  }

  function typeEffectText(multiplier) {
    if (multiplier >= 1.25) return ' It is super effective.';
    if (multiplier <= 0.86) return ' It is not very effective.';
    return '';
  }

  function moveDetailText(move) {
    if (!move) return '';
    const parts = [moveTypeLabel(move), `${Math.round((move.power || 1) * 100)}%`, `${((move.accuracy || 1) * 100) | 0}%`];
    if (move.effect) parts.push(effectLabel(move.effect));
    if (move.selfEffect) parts.push(`Self ${effectLabel(move.selfEffect)}`);
    if (move.healRatio) parts.push('Drain');
    return parts.join(' · ');
  }

  function passiveTraitForMonster(monster) {
    const speciesKey = monster?.species || monster?.name || null;
    return speciesKey ? passiveTraitsBySpecies[speciesKey] || null : null;
  }

  function passiveTraitText(monster) {
    const trait = passiveTraitForMonster(monster);
    return trait ? `${trait.name}: ${trait.description}` : 'No passive trait';
  }

  function passiveTraitShort(monster) {
    return passiveTraitForMonster(monster)?.name || 'No Trait';
  }

  function applyPassiveTurnStart(monster) {
    const trait = passiveTraitForMonster(monster);
    if (!trait || !trait.turnHeal || monster.hp <= 0 || monster.hp >= monster.maxHp) return '';
    const recovered = Math.min(trait.turnHeal, monster.maxHp - monster.hp);
    if (recovered <= 0) return '';
    monster.hp += recovered;
    return `${monster.name}'s ${trait.name} restored ${recovered} HP.`;
  }

  function passiveOutgoingBonus(source, target) {
    const trait = passiveTraitForMonster(source);
    if (!trait) return 0;
    let bonus = 0;
    if (trait.highHpBonus && source.hp > source.maxHp / 2) bonus += trait.highHpBonus;
    if (trait.statusHunter && target?.statusKey) bonus += trait.statusHunter;
    if (trait.enemyHealthyBonus && target && target.hp >= Math.ceil(target.maxHp * 0.7)) bonus += trait.enemyHealthyBonus;
    if (trait.levelHunter && target && target.level > source.level) bonus += trait.levelHunter;
    return bonus;
  }

  function passiveIncomingReduction(target) {
    return passiveTraitForMonster(target)?.incomingReduction || 0;
  }

  function passiveAfterHit(source, damage) {
    const trait = passiveTraitForMonster(source);
    if (!trait || !trait.healOnHit || damage <= 0 || source.hp <= 0 || source.hp >= source.maxHp) return '';
    const recovered = Math.min(trait.healOnHit, source.maxHp - source.hp);
    if (recovered <= 0) return '';
    source.hp += recovered;
    return `${source.name}'s ${trait.name} restored ${recovered} HP.`;
  }

  function joinBattleText(...parts) {
    return parts.filter(Boolean).join(' ');
  }

  function startTurnStatus(monster) {
    ensureMonsterState(monster);
    if (!monster || !monster.statusKey || monster.hp <= 0) {
      return { canAct: true, text: '', fainted: false };
    }

    if (monster.statusKey === 'burn') {
      const damage = Math.max(1, monster.statusPotency + Math.floor(monster.level / 4));
      monster.hp = Math.max(0, monster.hp - damage);
      monster.statusTurns = Math.max(0, monster.statusTurns - 1);
      const text = `${monster.name} is burned for ${damage}.`;
      if (monster.statusTurns <= 0 || monster.hp <= 0) clearMonsterStatus(monster);
      return { canAct: monster.hp > 0, text, fainted: monster.hp <= 0 };
    }

    if (monster.statusKey === 'regen') {
      const recovered = Math.min(monster.maxHp - monster.hp, monster.statusPotency + 1);
      if (recovered > 0) {
        monster.hp += recovered;
      }
      monster.statusTurns = Math.max(0, monster.statusTurns - 1);
      const text = recovered > 0 ? `${monster.name} recovered ${recovered} HP.` : '';
      if (monster.statusTurns <= 0) clearMonsterStatus(monster);
      return { canAct: true, text, fainted: false };
    }

    if (monster.statusKey === 'stun') {
      const blocked = Math.random() < Math.min(0.85, 0.45 + monster.statusPotency * 0.1);
      monster.statusTurns = Math.max(0, monster.statusTurns - 1);
      if (monster.statusTurns <= 0) clearMonsterStatus(monster);
      return {
        canAct: !blocked,
        text: blocked ? `${monster.name} is stunned and cannot move.` : `${monster.name} shook off the stun.`,
        fainted: false
      };
    }

    if (monster.statusKey === 'exposed') {
      monster.statusTurns = Math.max(0, monster.statusTurns - 1);
      const text = monster.statusTurns <= 0 ? `${monster.name} steadied its guard.` : '';
      if (monster.statusTurns <= 0) clearMonsterStatus(monster);
      return { canAct: true, text, fainted: false };
    }

    return { canAct: true, text: '', fainted: false };
  }

  function damageAgainstTarget(baseDamage, target, move, source) {
    ensureMonsterState(target);
    const exposedBonus = target?.statusKey === 'exposed' ? 1 + target.statusPotency : 0;
    const typedDamage = Math.round((baseDamage + exposedBonus) * sameTypeAttackBonus(move, source) * typeModifierForAttack(move, source, target));
    return Math.max(1, typedDamage);
  }

  function applyMoveEffects(source, target, move) {
    const messages = [];
    if (move?.effect && target && Math.random() <= (move.effect.chance || 1)) {
      if (setMonsterStatus(target, move.effect)) {
        messages.push(`${target.name} is afflicted with ${effectLabel(move.effect).toLowerCase()}.`);
      }
    }
    if (move?.selfEffect && source && Math.random() <= (move.selfEffect.chance || 1)) {
      if (setMonsterStatus(source, move.selfEffect)) {
        messages.push(`${source.name} gains ${effectLabel(move.selfEffect).toLowerCase()}.`);
      }
    }
    return messages;
  }

  function switchLeadToIndex(nextIndex) {
    if (!Number.isFinite(nextIndex) || nextIndex < 0 || nextIndex >= party.length || nextIndex === activeIndex) return false;
    if ((party[nextIndex]?.hp || 0) <= 0) return false;
    activeIndex = nextIndex;
    return true;
  }

  function switchMenuEntries() {
    return party
      .map((monster, index) => ({
        index,
        label: monsterDisplayName(monster),
        detail: `Lv${monster.level} · HP ${monster.hp}/${monster.maxHp}${statusText(monster)}`
      }))
      .filter(entry => entry.index !== activeIndex && party[entry.index]?.hp > 0);
  }

  function selectedStorageMonster(column = storageMenuColumn) {
    if (column === 'party') return party[storagePartySelection] || null;
    return storedMonsters[storageBoxSelection] || null;
  }

  function resetStorageMenuState() {
    storageMenuColumn = 'party';
    storagePartySelection = Math.max(0, Math.min(storagePartySelection, Math.max(0, party.length - 1)));
    storageBoxSelection = Math.max(0, Math.min(storageBoxSelection, Math.max(0, storedMonsters.length - 1)));
    storageSwapPending = null;
  }

  function openStorageMenu() {
    storageMenuOpen = true;
    indexMenuOpen = false;
    resetStorageMenuState();
    storageMenuColumn = storedMonsters.length ? 'storage' : 'party';
    setMessage('Storage Box opened. Swap active and stored monsters.');
    drawTamerWorld();
  }

  function closeStorageMenu(message = 'Back to town services.') {
    storageMenuOpen = false;
    resetStorageMenuState();
    if (message) setMessage(message);
    updateTamerUi();
    drawTamerWorld();
  }

  function moveStorageSelection(step) {
    if (!storageMenuOpen) return;

    if (storageMenuColumn === 'party') {
      if (!party.length) return;
      storagePartySelection = wrapIndex(storagePartySelection + step, party.length);
      setMessage(`${party[storagePartySelection]?.name || 'Party'} selected.`);
    } else {
      if (!storedMonsters.length) {
        setMessage('No stored monsters are available right now.');
        drawTamerWorld();
        return;
      }
      storageBoxSelection = wrapIndex(storageBoxSelection + step, storedMonsters.length);
      setMessage(`${storedMonsters[storageBoxSelection]?.name || 'Stored'} selected.`);
    }

    drawTamerWorld();
  }

  function moveStorageColumn(step) {
    if (!storageMenuOpen) return;

    const nextColumn = step < 0 ? 'party' : 'storage';
    if (nextColumn === storageMenuColumn) {
      drawTamerWorld();
      return;
    }

    if (nextColumn === 'storage' && !storedMonsters.length) {
      setMessage('No stored monsters are available right now.');
      drawTamerWorld();
      return;
    }

    if (nextColumn === 'party' && !party.length) {
      setMessage('No party monsters are available right now.');
      drawTamerWorld();
      return;
    }

    storageMenuColumn = nextColumn;
    setMessage(`${monsterDisplayName(selectedStorageMonster()) || (nextColumn === 'party' ? 'Party' : 'Stored')} selected.`);
    drawTamerWorld();
  }

  function handleStorageBack() {
    if (!storageMenuOpen) return false;

    if (storageSwapPending) {
      storageSwapPending = null;
      storageMenuColumn = storedMonsters.length ? 'storage' : 'party';
      setMessage('Swap cancelled. Browse the storage box.');
      drawTamerWorld();
      return true;
    }

    closeStorageMenu('Back to town services.');
    return true;
  }

  function swapPartyWithStorage(partyIndex, storageIndex) {
    if (partyIndex < 0 || storageIndex < 0 || partyIndex >= party.length || storageIndex >= storedMonsters.length) return false;
    const partyMonster = party[partyIndex];
    const storageMonster = storedMonsters[storageIndex];
    party[partyIndex] = storageMonster;
    storedMonsters[storageIndex] = partyMonster;
    if (activeIndex === partyIndex) activeIndex = partyIndex;
    return { partyName: partyMonster.name, storedName: storageMonster.name };
  }

  function movePartyMonsterToStorage(partyIndex) {
    if (partyIndex < 0 || partyIndex >= party.length) return null;
    if (party.length <= 1) return { error: 'You need at least one monster in your party.' };

    const boxedMonster = party.splice(partyIndex, 1)[0];
    storedMonsters.push(boxedMonster);

    if (activeIndex === partyIndex) {
      activeIndex = Math.max(0, firstHealthyMonsterIndex());
    } else if (activeIndex > partyIndex) {
      activeIndex -= 1;
    }

    storagePartySelection = Math.max(0, Math.min(storagePartySelection, Math.max(0, party.length - 1)));
    storageBoxSelection = Math.max(0, storedMonsters.length - 1);
    return { boxedName: monsterDisplayName(boxedMonster) };
  }

  function handleStorageConfirm() {
    if (!storageMenuOpen) return;

    if (storageSwapPending) {
      if (storageSwapPending.source === 'party' && storageMenuColumn === 'storage' && storedMonsters.length) {
        const result = swapPartyWithStorage(storageSwapPending.index, storageBoxSelection);
        resetStorageMenuState();
        if (result) {
          setMessage(`Swapped party ${result.partyName} with stored ${result.storedName}.`);
          updateTamerUi();
        }
        drawTamerWorld();
        return;
      }

      if (storageSwapPending.source === 'storage' && storageMenuColumn === 'party' && party.length) {
        const result = swapPartyWithStorage(storagePartySelection, storageSwapPending.index);
        resetStorageMenuState();
        if (result) {
          setMessage(`Swapped party ${result.partyName} with stored ${result.storedName}.`);
          updateTamerUi();
        }
        drawTamerWorld();
        return;
      }
    }

    if (storageMenuColumn === 'party') {
      if (!party.length) return;
      const result = movePartyMonsterToStorage(storagePartySelection);
      if (result?.error) {
        setMessage(result.error);
        drawTamerWorld();
        return;
      }
      storageMenuColumn = 'storage';
      setMessage(`${result?.boxedName || 'Monster'} moved to storage.`);
      updateTamerUi();
      drawTamerWorld();
      return;
    }

    if (!storedMonsters.length) {
      setMessage('No stored monsters are available right now.');
      drawTamerWorld();
      return;
    }

    if (party.length < activePartyLimit) {
      const monster = storedMonsters.splice(storageBoxSelection, 1)[0];
      party.push(monster);
      storageBoxSelection = Math.max(0, Math.min(storageBoxSelection, storedMonsters.length - 1));
      setMessage(`${monsterDisplayName(monster)} joined your party from storage.`);
      updateTamerUi();
      drawTamerWorld();
      return;
    }

    storageSwapPending = { source: 'storage', index: storageBoxSelection };
    storageMenuColumn = 'party';
    storagePartySelection = Math.max(0, Math.min(storagePartySelection, party.length - 1));
    setMessage(`${monsterDisplayName(storedMonsters[storageBoxSelection]) || 'Stored monster'} selected. Party is full, choose a party monster to swap out.`);
    drawTamerWorld();
  }

  function selectedPartyMonster() {
    return party[playerMenuSelection] || null;
  }

  function swapPartyMembers(firstIndex, secondIndex) {
    if (firstIndex === secondIndex) return false;
    if (firstIndex < 0 || secondIndex < 0 || firstIndex >= party.length || secondIndex >= party.length) return false;

    [party[firstIndex], party[secondIndex]] = [party[secondIndex], party[firstIndex]];

    if (activeIndex === firstIndex) {
      activeIndex = secondIndex;
    } else if (activeIndex === secondIndex) {
      activeIndex = firstIndex;
    }

    return true;
  }

  function usePotionOnMonster(monster) {
    if (!monster) return 'No monster selected.';
    if (tonics <= 0) return 'You are out of tonics.';
    if (monster.hp >= monster.maxHp) return `${monsterDisplayName(monster)} is already at full HP.`;
    tonics -= 1;
    monster.hp = Math.min(monster.maxHp, monster.hp + tonicHealAmount);
    return `${monsterDisplayName(monster)} recovered with a tonic.`;
  }

  function playerMenuActions(monster = selectedPartyMonster()) {
    if (!monster) {
      return [{ key: 'close', label: 'Close', detail: 'Return to play' }];
    }

    return [
      { key: 'lead', label: activeIndex === playerMenuSelection ? 'Lead Ready' : 'Set As Lead', detail: activeIndex === playerMenuSelection ? 'Already leading' : 'Make first battler' },
      { key: 'swap', label: 'Swap Position', detail: party.length > 1 ? 'Reorder party slots' : 'Need another monster' },
      { key: 'tonic', label: `Use Tonic x${tonics}`, detail: `Heal ${tonicHealAmount} HP` },
      { key: 'close', label: 'Close', detail: 'Return to play' }
    ];
  }

  function openPlayerMenu() {
    if (gameOver || encounterTransition || battleAnimation || fishingAnimation || battleTarget) return false;
    playerMenuOpen = true;
    playerMenuMode = 'party';
    playerMenuSelection = Math.max(0, Math.min(activeIndex, Math.max(0, party.length - 1)));
    playerMenuActionSelection = 0;
    playerMenuSwapSelection = Math.max(0, Math.min(playerMenuSelection, Math.max(0, party.length - 1)));
    setMessage('Party menu opened. Check stats, move partners, or use items.');
    updateTamerUi();
    drawTamerWorld();
    return true;
  }

  function closePlayerMenu(message = 'Closed the party menu.') {
    playerMenuOpen = false;
    playerMenuMode = 'party';
    playerMenuActionSelection = 0;
    playerMenuSwapSelection = 0;
    if (message) setMessage(message);
    updateTamerUi();
    drawTamerWorld();
  }

  function movePlayerMenuSelection(step) {
    if (!playerMenuOpen) return;

    if (playerMenuMode === 'party') {
      if (!party.length) return;
      playerMenuSelection = wrapIndex(playerMenuSelection + step, party.length);
      setMessage(`${monsterDisplayName(selectedPartyMonster()) || 'Party'} selected.`);
    } else if (playerMenuMode === 'actions') {
      const actions = playerMenuActions();
      playerMenuActionSelection = wrapIndex(playerMenuActionSelection + step, actions.length);
      setMessage(`${actions[playerMenuActionSelection]?.label || 'Action'} selected.`);
    } else if (playerMenuMode === 'swap') {
      if (party.length <= 1) return;
      playerMenuSwapSelection = wrapIndex(playerMenuSwapSelection + step, party.length);
      setMessage(`${monsterDisplayName(party[playerMenuSwapSelection]) || 'Partner'} selected.`);
    }

    drawTamerWorld();
  }

  function handlePlayerMenuConfirm() {
    if (!playerMenuOpen) return;

    const monster = selectedPartyMonster();
    if (!monster) {
      closePlayerMenu();
      return;
    }

    if (playerMenuMode === 'party') {
      playerMenuMode = 'actions';
      playerMenuActionSelection = 0;
      setMessage('Choose a party action.');
      drawTamerWorld();
      return;
    }

    if (playerMenuMode === 'swap') {
      if (playerMenuSwapSelection === playerMenuSelection) {
        setMessage('Choose a different partner to swap with.');
        drawTamerWorld();
        return;
      }
      if (swapPartyMembers(playerMenuSelection, playerMenuSwapSelection)) {
        const movedMonster = party[playerMenuSwapSelection];
        playerMenuSelection = playerMenuSwapSelection;
        playerMenuMode = 'party';
        playerMenuActionSelection = 0;
        setMessage(`${movedMonster?.name || 'Party'} moved to slot ${playerMenuSelection + 1}.`);
        updateTamerUi();
        drawTamerWorld();
      }
      return;
    }

    const action = playerMenuActions(monster)[playerMenuActionSelection];
    if (!action) return;

    if (action.key === 'lead') {
      activeIndex = playerMenuSelection;
      playerMenuMode = 'party';
      setMessage(`Lead monster: ${monsterDisplayName(activeMonster() || monster)}.`);
      updateTamerUi();
      drawTamerWorld();
      return;
    }

    if (action.key === 'swap') {
      if (party.length <= 1) {
        setMessage('Only one partner is in your party right now.');
        drawTamerWorld();
        return;
      }
      playerMenuMode = 'swap';
      playerMenuSwapSelection = wrapIndex(playerMenuSelection + 1, party.length);
      setMessage('Choose a partner to swap positions with.');
      drawTamerWorld();
      return;
    }

    if (action.key === 'tonic') {
      const result = usePotionOnMonster(monster);
      playerMenuMode = 'party';
      setMessage(result);
      updateTamerUi();
      drawTamerWorld();
      return;
    }

    if (action.key === 'close') {
      closePlayerMenu();
    }
  }

  function handlePlayerMenuBack() {
    if (!playerMenuOpen) return false;
    if (playerMenuMode === 'swap' || playerMenuMode === 'actions') {
      playerMenuMode = 'party';
      playerMenuActionSelection = 0;
      setMessage('Back to your party list.');
      drawTamerWorld();
      return true;
    }
    closePlayerMenu();
    return true;
  }

  function maybeEvolveMonster(monster) {
    ensureMonsterState(monster);
    const rule = evolutionData[monster?.species];
    if (!rule || monster.level < rule.minLevel || badgeCount() < rule.minBadges) return '';
    const evolvedSpecies = speciesByName[rule.evolvesTo];
    if (!evolvedSpecies) return '';

    const previousName = monster.name;
    const previousMonster = evolutionVisualForMonster(monster, monster?.species);
    const hpRatio = monster.maxHp > 0 ? monster.hp / monster.maxHp : 1;
    monster.species = evolvedSpecies.name;
    monster.name = evolvedSpecies.name;
    monster.color = evolvedSpecies.color;
    monster.accent = evolvedSpecies.accent;
    monster.sprite = evolvedSpecies.sprite;
    monster.battleSprite = evolvedSpecies.battleSprite || null;
    monster.catchBase = evolvedSpecies.catchBase;
    monster.maxHp = Math.max(monster.maxHp + 4, evolvedSpecies.hp + monster.level + 2);
    monster.atkMin = Math.max(monster.atkMin + 1, evolvedSpecies.atkMin + Math.floor((monster.level - 1) / 2));
    monster.atkMax = Math.max(monster.atkMax + 1, evolvedSpecies.atkMax + Math.floor(monster.level / 2));
    monster.hp = Math.max(1, Math.min(monster.maxHp, Math.round(monster.maxHp * Math.max(0.45, hpRatio))));
    clearMonsterStatus(monster);
    queueEvolutionAnimation(previousMonster, monster);
    return `${previousName} evolved into ${monster.name}!`;
  }

  function maybeEvolveParty() {
    return party.map(monster => maybeEvolveMonster(monster)).filter(Boolean);
  }

  function bossStateForTown(town = activeTownship || getTownshipAt()) {
    const boss = town?.profile?.boss;
    if (!boss) {
      return { ready: false, cleared: true, short: 'None', message: 'No boss battle is set for this town.' };
    }

    if (hasBadge(town.profile)) {
      return { ready: false, cleared: true, short: 'Won', message: `${boss.badge} Badge already earned here.` };
    }

    const needs = [];
    if (badgeCount() < (boss.requiredBadges || 0)) needs.push(`${boss.requiredBadges - badgeCount()} badge${boss.requiredBadges - badgeCount() === 1 ? '' : 's'}`);
    if (captures < (boss.minCaptures || 0)) needs.push(`${boss.minCaptures - captures} capture${boss.minCaptures - captures === 1 ? '' : 's'}`);
    if (defeated < (boss.minDefeated || 0)) needs.push(`${boss.minDefeated - defeated} win${boss.minDefeated - defeated === 1 ? '' : 's'}`);
    if ((activeMonster()?.level || 0) < (boss.minLeadLevel || 1)) needs.push(`lead Lv${boss.minLeadLevel}`);
    if (needs.length) {
      return { ready: false, cleared: false, short: 'Locked', message: `Need ${needs.join(', ')} before ${boss.trainer} can be challenged.` };
    }

    return { ready: true, cleared: false, short: 'Ready', message: `${boss.trainer} is ready. Win the ${boss.badge} Badge.` };
  }

  function createBossMonster(town) {
    const boss = town?.profile?.boss;
    const species = speciesByName[boss?.species] || speciesList[0];
    const strongest = highestPartyLevel();
    const average = averagePartyLevel();
    const baseLevel = Math.max(boss?.minLeadLevel || 4, regionLevel(town.x, town.y) + (boss?.levelBonus || 0));
    const scaledLevel = Math.max(baseLevel, Math.ceil(average + 2), Math.ceil(strongest * 0.72));
    const level = Math.min(72, scaledLevel);
    const monster = {
      ...cloneMonster(species, level),
      id: `mt-boss-${town.key}`,
      x: town.x,
      y: town.y,
      route: town.name,
      rarity: 'legendary',
      ephemeral: true,
      isBoss: true,
      trainerName: boss.trainer,
      badgeName: boss.badge,
      bossRewardCoins: boss.rewardCoins || 0,
      bossMove: {
        name: `${boss.badge} Burst`,
        power: 1.45,
        accuracy: 0.88,
        effect: ['Fern Trail'].includes(town.profile.label) ? null : { type: ['Dusk Hollow', 'Thunder Ridge'].includes(town.profile.label) ? 'stun' : town.profile.label === 'Wild Crown' ? 'burn' : 'exposed', turns: 2, potency: 1, chance: 0.65 },
        selfEffect: ['Fern Trail'].includes(town.profile.label) ? { type: 'regen', turns: 2, potency: 2, chance: 1 } : null
      }
    };
    monster.maxHp += 16 + routeProfiles.indexOf(town.profile) * 5 + Math.floor(strongest * 0.8);
    monster.hp = monster.maxHp;
    monster.atkMin += 2 + Math.floor(routeProfiles.indexOf(town.profile) / 2) + Math.floor(strongest / 8);
    monster.atkMax += 3 + Math.floor(routeProfiles.indexOf(town.profile) / 2) + Math.floor(strongest / 7);
    return monster;
  }

  function startBossBattle() {
    const town = activeTownship || getTownshipAt();
    const state = bossStateForTown(town);
    if (state.cleared || !town?.profile?.boss) {
      setMessage(state.message);
      drawTamerWorld();
      return;
    }
    if (!state.ready) {
      setMessage(state.message);
      drawTamerWorld();
      return;
    }
    townMenuOpen = false;
    indexMenuOpen = false;
    beginBattle(createBossMonster(town));
  }

  function currentTownSelectionDetail() {
    if (!townMenuOpen || indexMenuOpen) return '';
    const choice = shopItems[townSelection];
    if (!choice) return '';
    if (choice.key === 'storage') return `Storage holds ${storedMonsters.length} monster${storedMonsters.length === 1 ? '' : 's'}. Active party ${party.length}/${activePartyLimit}.`;
    if (choice.key !== 'boss') return `${choice.label} selected.`;

    const bossState = bossStateForTown(activeTownship || getTownshipAt());
    if (bossState.cleared) return bossState.message;
    if (bossState.ready) return `${activeTownship?.profile?.boss?.trainer || 'Town boss'} is ready. Win the ${activeTownship?.profile?.boss?.badge || 'town'} Badge.`;
    return bossState.message;
  }

  function resetBattleMenu() {
    battleMenuMode = 'root';
    battleMenuSelection = 0;
    battleSubSelection = 0;
  }

  function isTownTile(x = player.x, y = player.y) {
    return !!getTownshipAt(x, y);
  }

  function cloneMonster(species, level = 1) {
    return {
      species: species.name,
      name: species.name,
      color: species.color,
      accent: species.accent,
      shiny: false,
      sprite: species.sprite,
      level,
      xp: 0,
      xpToNext: 5 + level * 4,
      maxHp: species.hp + level,
      hp: species.hp + level,
      atkMin: species.atkMin + Math.floor((level - 1) / 2),
      atkMax: species.atkMax + Math.floor(level / 2),
      catchBase: species.catchBase,
      statusKey: '',
      statusTurns: 0,
      statusPotency: 0
    };
  }

  const signatureMovesBySpecies = {
    'Ember Pup': { name: 'Cinder Dash', power: 1.2, accuracy: 0.9, effect: { type: 'burn', turns: 2, potency: 1, chance: 0.55 } },
    'Mossling': { name: 'Sap Sip', power: 0.8, accuracy: 0.95, healRatio: 0.45, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.8 } },
    'Volt Finch': { name: 'Bolt Dive', power: 1.35, accuracy: 0.82, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.5 } },
    'Gloom Bat': { name: 'Night Siphon', power: 0.9, accuracy: 0.93, healRatio: 0.35, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.55 } },
    'Tide Cub': { name: 'Wave Crash', power: 1.15, accuracy: 0.92, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.65 } },
    'Petal Lynx': { name: 'Bloom Slash', power: 1.25, accuracy: 0.88, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.55 } },
    'Brookfin': { name: 'Current Snap', power: 1.15, accuracy: 0.92, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.5 } },
    'Cinder Moth': { name: 'Ash Flutter', power: 1.1, accuracy: 0.93, effect: { type: 'burn', turns: 2, potency: 1, chance: 0.42 } },
    'Bramble Hog': { name: 'Thorn Rush', power: 1.15, accuracy: 0.91, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.46 } },
    'Marsh Mite': { name: 'Bog Bubble', power: 0.95, accuracy: 0.96, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.28 } },
    'Quartz Beetle': { name: 'Prism Shell', type: 'volt', power: 1.05, accuracy: 0.94, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.55 } },
    'Gale Antler': { name: 'Wind Rack', power: 1.2, accuracy: 0.9, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.38 } },
    'Ripple Fry': { name: 'Bubble Pop', power: 0.95, accuracy: 0.96, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.3 } },
    'Pebble Koi': { name: 'Stone Spray', power: 1.05, accuracy: 0.94, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.45 } },
    'Tangle Crab': { name: 'Clamp Crush', power: 1.25, accuracy: 0.87, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.35 } },
    'Lantern Eel': { name: 'Flash Surge', power: 1.3, accuracy: 0.84, effect: { type: 'burn', turns: 2, potency: 1, chance: 0.4 } },
    'Storm Ray': { name: 'Tempest Arc', power: 1.4, accuracy: 0.8, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.55 } },
    'Mire Owl': { name: 'Dusk Cry', type: 'gale', power: 1.1, accuracy: 0.92, effect: { type: 'burn', turns: 2, potency: 1, chance: 0.4 } },
    'Static Ram': { name: 'Thunder Rush', power: 1.35, accuracy: 0.83, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.5 } },
    'Crownwyrm': { name: 'Royal Flame', power: 1.45, accuracy: 0.79, effect: { type: 'burn', turns: 3, potency: 1, chance: 0.6 } },
    'Bloom Seraph': { name: 'Halo Bloom', power: 1.38, accuracy: 0.87, selfEffect: { type: 'regen', turns: 3, potency: 2, chance: 0.9 } },
    'Abyss Pike': { name: 'Undertow Lance', power: 1.4, accuracy: 0.86, effect: { type: 'exposed', turns: 3, potency: 1, chance: 0.72 } },
    'Hollow Hydra': { name: 'Grave Torrent', power: 1.42, accuracy: 0.84, effect: { type: 'burn', turns: 2, potency: 2, chance: 0.58 } },
    'Sun Stag': { name: 'Solar Charge', type: 'flame', power: 1.46, accuracy: 0.83, effect: { type: 'stun', turns: 1, potency: 2, chance: 0.6 } },
    'Ember Hound': { name: 'Blaze Charge', power: 1.35, accuracy: 0.9, effect: { type: 'burn', turns: 2, potency: 2, chance: 0.65 } },
    'Moss Guardian': { name: 'Verdant Ward', power: 0.95, accuracy: 0.94, selfEffect: { type: 'regen', turns: 3, potency: 2, chance: 1 } },
    'Volt Talon': { name: 'Storm Talon', power: 1.45, accuracy: 0.84, effect: { type: 'stun', turns: 1, potency: 2, chance: 0.6 } },
    'Dread Bat': { name: 'Nocturne Fang', power: 1.15, accuracy: 0.92, healRatio: 0.45, effect: { type: 'exposed', turns: 2, potency: 2, chance: 0.7 } },
    Riverclaw: { name: 'Riptide Crush', power: 1.3, accuracy: 0.91, effect: { type: 'exposed', turns: 3, potency: 1, chance: 0.75 } },
    'Rose Lynx': { name: 'Petal Storm', power: 1.4, accuracy: 0.89, selfEffect: { type: 'regen', turns: 2, potency: 2, chance: 0.8 } },
    Searhorn: { name: 'Flare Ram', power: 1.48, accuracy: 0.84, effect: { type: 'burn', turns: 2, potency: 2, chance: 0.58 } },
    'Prism Jackal': { name: 'Flash Fang', power: 1.5, accuracy: 0.83, effect: { type: 'stun', turns: 1, potency: 2, chance: 0.56 } },
    'Glass Heron': { name: 'Shatter Dive', power: 1.44, accuracy: 0.87, healRatio: 0.3 },
    'Murk Lotus': { name: 'Bog Crown', power: 1.26, accuracy: 0.91, selfEffect: { type: 'regen', turns: 3, potency: 2, chance: 1 } },
    'Cinder Scarab': { name: 'Forge Slam', type: 'flame', power: 1.52, accuracy: 0.82, effect: { type: 'exposed', turns: 2, potency: 2, chance: 0.54 } },
    'Hex Coil': { name: 'Circuit Hex', power: 1.5, accuracy: 0.84, effect: { type: 'burn', turns: 2, potency: 2, chance: 0.5 } },
    Lunarkoi: { name: 'Moonwake Lance', power: 1.48, accuracy: 0.85, effect: { type: 'exposed', turns: 3, potency: 1, chance: 0.64 } },
    'Veil Crane': { name: 'Phantom Gust', type: 'shade', power: 1.46, accuracy: 0.86, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.48 } },
    'Bastion Stag': { name: 'Rampart Break', power: 1.54, accuracy: 0.82, effect: { type: 'stun', turns: 1, potency: 2, chance: 0.52 } },
    Rootback: { name: 'Ancient Bough', power: 1.28, accuracy: 0.9, selfEffect: { type: 'regen', turns: 3, potency: 2, chance: 1 } },
    'Comet Drake': { name: 'Meteor Rend', power: 1.58, accuracy: 0.81, effect: { type: 'burn', turns: 3, potency: 2, chance: 0.58 } },
    'Astral Leviathan': { name: 'Starbreaker Tide', power: 1.56, accuracy: 0.82, effect: { type: 'exposed', turns: 3, potency: 2, chance: 0.56 } },
    'Forge Colossus': { name: 'Crucible Quake', power: 1.62, accuracy: 0.8, effect: { type: 'burn', turns: 3, potency: 2, chance: 0.54 } },
    'Void Basilisk': { name: 'Eclipse Fang', power: 1.6, accuracy: 0.81, effect: { type: 'exposed', turns: 3, potency: 2, chance: 0.54 } },
    Infernyx: { name: 'Solar Talon', power: 1.62, accuracy: 0.8, effect: { type: 'burn', turns: 3, potency: 2, chance: 0.62 } },
    'Cataclysm Roc': { name: 'Cataclysm Dive', power: 1.78, accuracy: 0.76, effect: { type: 'burn', turns: 3, potency: 3, chance: 0.66 } },
    Nightfang: { name: 'Dread Rend', power: 1.6, accuracy: 0.81, effect: { type: 'exposed', turns: 3, potency: 2, chance: 0.6 } },
    'Eclipse Fenrir': { name: 'Eclipse Hunt', power: 1.76, accuracy: 0.77, effect: { type: 'exposed', turns: 3, potency: 3, chance: 0.66 } },
    Riftfin: { name: 'Rift Crash', power: 1.62, accuracy: 0.8, effect: { type: 'exposed', turns: 3, potency: 2, chance: 0.62 } },
    'Abyss Sovereign': { name: 'Sovereign Maw', power: 1.78, accuracy: 0.77, healRatio: 0.3, effect: { type: 'exposed', turns: 3, potency: 3, chance: 0.64 } },
    Stormlure: { name: 'Tempest Lure', power: 1.64, accuracy: 0.79, effect: { type: 'stun', turns: 1, potency: 2, chance: 0.62 } },
    'Tempest Leviathan': { name: 'Leviathan Surge', power: 1.8, accuracy: 0.76, effect: { type: 'stun', turns: 1, potency: 3, chance: 0.68 } }
  };

  const masteryMovesByType = {
    flame: { name: 'Inferno Crown', power: 1.72, accuracy: 0.8, effect: { type: 'burn', turns: 3, potency: 2, chance: 0.62 } },
    bloom: { name: 'Verdant Pulse', power: 1.54, accuracy: 0.88, selfEffect: { type: 'regen', turns: 3, potency: 2, chance: 1 } },
    tide: { name: 'Riptide Nova', power: 1.7, accuracy: 0.82, effect: { type: 'exposed', turns: 3, potency: 2, chance: 0.64 } },
    volt: { name: 'Volt Breaker', power: 1.74, accuracy: 0.79, effect: { type: 'stun', turns: 1, potency: 2, chance: 0.66 } },
    shade: { name: 'Umbral Howl', power: 1.68, accuracy: 0.81, effect: { type: 'exposed', turns: 3, potency: 2, chance: 0.58 } },
    stone: { name: 'Fault Rupture', power: 1.72, accuracy: 0.8, effect: { type: 'exposed', turns: 2, potency: 2, chance: 0.56 } },
    gale: { name: 'Sky Sever', power: 1.7, accuracy: 0.82, effect: { type: 'stun', turns: 1, potency: 2, chance: 0.58 } }
  };

  const apexBaseSpeciesNames = new Set(['Infernyx', 'Nightfang', 'Riftfin', 'Stormlure']);
  const apexSpeciesNames = new Set(['Infernyx', 'Cataclysm Roc', 'Nightfang', 'Eclipse Fenrir', 'Riftfin', 'Abyss Sovereign', 'Stormlure', 'Tempest Leviathan']);

  const basicAttackNamesBySpecies = {
    'Ember Pup': 'Paw Swipe',
    Mossling: 'Vine Tap',
    'Volt Finch': 'Quick Peck',
    'Gloom Bat': 'Wing Flick',
    'Tide Cub': 'Splash Bite',
    'Petal Lynx': 'Petal Claw',
    Brookfin: 'Fin Jab',
    'Cinder Moth': 'Wing Ember',
    'Bramble Hog': 'Bramble Nudge',
    'Marsh Mite': 'Mud Nip',
    'Quartz Beetle': 'Carapace Tap',
    'Gale Antler': 'Hoof Slice',
    'Ripple Fry': 'Tail Flick',
    'Pebble Koi': 'Koi Bump',
    'Tangle Crab': 'Pinch',
    'Lantern Eel': 'Spark Nip',
    'Storm Ray': 'Glide Cut',
    'Mire Owl': 'Shadow Peck',
    'Static Ram': 'Horn Jab',
    Crownwyrm: 'Scale Strike',
    'Bloom Seraph': 'Petal Lance',
    'Abyss Pike': 'Deep Bite',
    'Hollow Hydra': 'Night Snap',
    'Sun Stag': 'Radiant Kick',
    Searhorn: 'Horn Swipe',
    'Prism Jackal': 'Spark Bite',
    'Glass Heron': 'Beak Slice',
    'Murk Lotus': 'Petal Lash',
    'Cinder Scarab': 'Shell Ram',
    'Hex Coil': 'Shade Fang',
    Lunarkoi: 'Fin Arc',
    'Veil Crane': 'Wing Slice',
    'Bastion Stag': 'Antler Bash',
    Rootback: 'Root Slam',
    'Comet Drake': 'Claw Rake',
    'Astral Leviathan': 'Tail Crush',
    'Forge Colossus': 'Forge Slam',
    'Void Basilisk': 'Fang Lash',
    Infernyx: 'Talon Scorch',
    'Cataclysm Roc': 'Ruin Talon',
    Nightfang: 'Shade Claw',
    'Eclipse Fenrir': 'Umbra Fang',
    Riftfin: 'Rift Bite',
    'Abyss Sovereign': 'Throne Snap',
    Stormlure: 'Spark Fin',
    'Tempest Leviathan': 'Tempest Tail'
  };

  const evolvedSpeciesNames = new Set(Object.values(evolutionData).map(rule => rule.evolvesTo));

  function evolutionStageForSpecies(speciesName) {
    if (evolvedSpeciesNames.has(speciesName)) return 1;
    if (evolutionData[speciesName]) return 0;
    return 0;
  }

  function moveUnlockLevel(monster, slot) {
    const stage = evolutionStageForSpecies(monster?.species);
    const level = monster?.level || 1;
    if (slot === 'signature') return Math.max(1, 4 - stage * 2);
    if (slot === 'advanced') return Math.max(3, 8 - stage * 3);
    if (slot === 'mastery') {
      const lateSpeciesAdjustment = level >= 18 ? 1 : 0;
      return Math.max(6, 13 - stage * 4 - lateSpeciesAdjustment);
    }
    return 1;
  }

  function basicAttackForMonster(monster, basicName, nativeType) {
    const level = monster?.level || 1;
    const stage = evolutionStageForSpecies(monster?.species);
    const power = 1 + (level >= 6 ? 0.06 : 0) + (level >= 12 ? 0.08 : 0) + (level >= 18 ? 0.08 : 0) + stage * 0.06;
    const accuracy = Math.min(0.99, 0.96 + (level >= 10 ? 0.01 : 0) + (level >= 20 ? 0.01 : 0));
    return { name: basicName, power, accuracy, type: nativeType };
  }

  function masteryMoveForMonster(monster, nativeType) {
    return { type: nativeType, ...(masteryMovesByType[nativeType] || { name: 'Master Strike', power: 1.65, accuracy: 0.82 }) };
  }

  function moveProgressionForMonster(monster) {
    if (!monster) return [];
    const nativeType = typeKeyForMonster(monster);
    const basicName = basicAttackNamesBySpecies[monster.species] || basicAttackNamesBySpecies[monster.name] || 'Strike';
    return [
      {
        unlockLevel: 1,
        slot: 'Basic',
        move: basicAttackForMonster({ ...monster, level: 1 }, basicName, nativeType)
      },
      {
        unlockLevel: moveUnlockLevel(monster, 'signature'),
        slot: 'Signature',
        move: { type: nativeType, ...(signatureMovesBySpecies[monster.species] || { name: 'Wild Burst', power: 1.2, accuracy: 0.9 }) }
      },
      {
        unlockLevel: moveUnlockLevel(monster, 'advanced'),
        slot: 'Advanced',
        move: { type: nativeType, ...(thirdMovesBySpecies[monster.species] || { name: 'Second Wind', power: 1.02, accuracy: 0.94, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.5 } }) }
      },
      {
        unlockLevel: moveUnlockLevel(monster, 'mastery'),
        slot: 'Mastery',
        move: masteryMoveForMonster(monster, nativeType)
      }
    ].map(entry => ({
      ...entry,
      detail: moveDetailText(entry.move)
    }));
  }

  function attacksForMonster(monster) {
    if (!monster) return [];
    const basicName = basicAttackNamesBySpecies[monster.species] || basicAttackNamesBySpecies[monster.name] || 'Strike';

    const nativeType = typeKeyForMonster(monster);
    const moves = [basicAttackForMonster(monster, basicName, nativeType)];

    if ((monster.level || 1) >= moveUnlockLevel(monster, 'signature')) {
      moves.push({ type: nativeType, ...(signatureMovesBySpecies[monster.species] || { name: 'Wild Burst', power: 1.2, accuracy: 0.9 }) });
    }

    if ((monster.level || 1) >= moveUnlockLevel(monster, 'advanced')) {
      moves.push({ type: nativeType, ...(thirdMovesBySpecies[monster.species] || { name: 'Second Wind', power: 1.02, accuracy: 0.94, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.5 } }) });
    }

    if ((monster.level || 1) >= moveUnlockLevel(monster, 'mastery')) {
      moves.push(masteryMoveForMonster(monster, nativeType));
    }

    if (monster.bossMove) {
      moves.push({ type: nativeType, ...monster.bossMove });
    }
    return moves.map(move => ({ ...move, detail: move.detail || moveDetailText(move) }));
  }

  function battleItemsForPlayer() {
    const items = [];
    if (tonics > 0) {
      items.push({ key: 'tonic', label: `Tonic x${tonics}`, detail: `Heal ${tonicHealAmount} HP` });
    }
    return items;
  }

  function currentBattleMenuEntries() {
    if (battleMenuMode === 'attack') {
      return attacksForMonster(activeMonster());
    }
    if (battleMenuMode === 'item') {
      return battleItemsForPlayer();
    }
    if (battleMenuMode === 'switch') {
      return switchMenuEntries();
    }
    return battleRootOptions;
  }

  function moveBattleSelection(step) {
    const entries = currentBattleMenuEntries();
    if (!entries.length) return;
    if (battleMenuMode === 'root') {
      battleMenuSelection = wrapIndex(battleMenuSelection + step, entries.length);
      setMessage(`${entries[battleMenuSelection].label} selected.`);
    } else {
      battleSubSelection = wrapIndex(battleSubSelection + step, entries.length);
      setMessage(`${entries[battleSubSelection].name || entries[battleSubSelection].label} selected.`);
    }
    drawTamerWorld();
  }

  function easeRetaliationDamage(baseDamage, x = player.x, y = player.y) {
    const relief = earlyGameRelief(x, y);
    const reduction = relief >= 0.82 ? 2 : relief >= 0.45 ? 1 : 0;
    return Math.max(1, baseDamage - reduction);
  }

  function recoverLeadAfterEncounter(baseAmount = 2, x = player.x, y = player.y) {
    const lead = activeMonster();
    if (!lead || lead.hp <= 0) return 0;
    const amount = Math.max(0, Math.round(baseAmount + earlyGameRelief(x, y) * 2));
    if (amount <= 0) return 0;
    const recovered = Math.min(amount, lead.maxHp - lead.hp);
    lead.hp += recovered;
    return recovered;
  }

  function saveMonsterDex({ immediate = false } = {}) {
    dexSaveDirty = true;
    if (immediate) {
      flushDexSave();
      return;
    }
    if (dexSaveTimer) return;
    dexSaveTimer = window.setTimeout(() => {
      dexSaveTimer = null;
      flushDexSave();
    }, 180);
  }

  function recordDexEntry(monster, status = 'seen') {
    if (!monster || !monster.species) return;
    const existing = monsterDex[monster.species] || { seen: false, caught: false, routes: [] };
    existing.seen = existing.seen || status === 'seen' || status === 'caught';
    existing.caught = existing.caught || status === 'caught';
    const route = monster.route || routeLabelAt(monster.x, monster.y);
    if (route && route !== 'Town' && !existing.routes.includes(route)) {
      existing.routes.push(route);
      existing.routes.sort((a, b) => routeSortIndex(a) - routeSortIndex(b));
    }
    monsterDex[monster.species] = existing;
    if (status === 'caught') {
      markRunGoalSpecies(monster.species);
    }
    saveMonsterDex();
  }

  function updateHighScore() {
    const score = currentScore();
    if (score > highScore) {
      highScore = score;
      if (!setHighScore(gameKey, highScore)) {
        reportStorageFailure('high score save');
      }
    }
  }

  function setGoalState(goalId, progressId, complete, progressText) {
    const goalEl = document.getElementById(goalId);
    const progressEl = document.getElementById(progressId);
    if (goalEl) {
      goalEl.dataset.complete = complete ? 'true' : 'false';
    }
    if (progressEl) {
      progressEl.textContent = progressText;
    }
  }

  function updateGoalUi() {
    const badgeTotal = routeProfiles.length;
    const caughtSpeciesTotal = runGoalSpeciesCount();
    const speciesTotal = speciesList.length;
    const partyTotal = Math.min(activePartyLimit, party.length);
    const scoreTarget = 10000;
    const liveScore = currentScore();
    const mythicalSpecies = ['Infernyx', 'Nightfang', 'Riftfin', 'Stormlure'];
    const caughtMythicals = mythicalSpecies.filter(speciesName => runGoalSpecies[speciesName]).length;

    setGoalState('goalParty', 'goalPartyProgress', partyTotal >= activePartyLimit, `${partyTotal}/${activePartyLimit}`);
    setGoalState('goalBadges', 'goalBadgesProgress', badgeCount() >= badgeTotal, `${badgeCount()}/${badgeTotal}`);
    setGoalState('goalDex', 'goalDexProgress', caughtSpeciesTotal >= speciesTotal, `${caughtSpeciesTotal}/${speciesTotal}`);
    setGoalState('goalScore', 'goalScoreProgress', liveScore >= scoreTarget, `${Math.min(liveScore, scoreTarget)}/${scoreTarget}`);
    setGoalState('goalMythicals', 'goalMythicalsProgress', caughtMythicals >= mythicalSpecies.length, `${caughtMythicals}/${mythicalSpecies.length}`);
    setGoalState('goalDungeonLoot', 'goalDungeonLootProgress', runGoalDungeonLoot, `${runGoalDungeonLoot ? 1 : 0}/1`);
  }

  function updateTamerUi() {
    const lead = activeMonster();
    const leadEl = document.getElementById('mtLead');
    const hpEl = document.getElementById('mtPartyHp');
    const caughtEl = document.getElementById('mtCaught');
    const badgeEl = document.getElementById('mtBadges');
    const capsuleEl = document.getElementById('mtCapsules');
    const tonicEl = document.getElementById('mtTonics');
    const rodEl = document.getElementById('mtRods');
    const coinEl = document.getElementById('mtCoins');
    const charmEl = document.getElementById('mtCharm');
    const scoreEl = document.getElementById('mtScore');
    const highEl = document.getElementById('mtHigh');
    if (leadEl) leadEl.textContent = lead ? `${monsterDisplayName(lead)} Lv${lead.level}${statusText(lead)}` : 'None';
    if (hpEl) hpEl.textContent = lead ? `${lead.hp}/${lead.maxHp} XP ${lead.xp}/${lead.xpToNext}` : '0/0';
    if (caughtEl) caughtEl.textContent = `${captures} Caught / ${party.length} Party`;
    if (badgeEl) badgeEl.textContent = `${badgeCount()}/${routeProfiles.length}`;
    if (capsuleEl) capsuleEl.textContent = String(capsules);
    if (tonicEl) tonicEl.textContent = `${tonics}/${maxTonics}`;
    if (rodEl) rodEl.textContent = `${rods}/${maxRods}`;
    if (coinEl) coinEl.textContent = String(coins);
    if (charmEl) charmEl.textContent = String(charms);
    if (scoreEl) scoreEl.textContent = String(currentScore());
    if (highEl) highEl.textContent = String(highScore);
    updateGoalUi();
    persistRunState();
  }

  if (releaseHighScoreResetListener) {
    releaseHighScoreResetListener();
    releaseHighScoreResetListener = null;
  }

  if (releasePersistenceFlushListeners) {
    releasePersistenceFlushListeners();
    releasePersistenceFlushListeners = null;
  }

  const onHighScoreReset = event => {
    if (event?.detail?.gameKey && event.detail.gameKey !== gameKey) {
      return;
    }
    clearHighScore(gameKey, [legacyGameKey]);
    highScore = 0;
    updateTamerUi();
  };

  window.addEventListener(highScoreResetEvent, onHighScoreReset);
  window.addEventListener(legacyHighScoreResetEvent, onHighScoreReset);
  releaseHighScoreResetListener = () => {
    window.removeEventListener(highScoreResetEvent, onHighScoreReset);
    window.removeEventListener(legacyHighScoreResetEvent, onHighScoreReset);
  };

  const onPageHide = () => flushPendingStorageWrites();
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      flushPendingStorageWrites();
    }
  };

  window.addEventListener('pagehide', onPageHide);
  document.addEventListener('visibilitychange', onVisibilityChange);
  releasePersistenceFlushListeners = () => {
    window.removeEventListener('pagehide', onPageHide);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };

  function terrainAt(x, y) {
    const town = getTownshipAt(x, y);
    if (town) {
      return (town.x === x && town.y === y) ? 'shop' : 'town';
    }

    return baseTerrainAt(x, y);
  }

  function isBlocked(x, y) {
    const terrain = terrainAt(x, y);
    return terrain === 'tree' || terrain === 'water';
  }

  function isRouteOrNearRoute(x, y) {
    if (terrainAt(x, y) === 'path') return true;
    return [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => terrainAt(x + dx, y + dy) === 'path');
  }

  function getRelevantChunks(radius = chunkRadius) {
    const cx = Math.floor(player.x / chunkSize);
    const cy = Math.floor(player.y / chunkSize);
    const relevant = [];
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        relevant.push(getChunk(x, y));
      }
    }
    return relevant;
  }

  function getMonsterAt(x, y) {
    for (const chunk of getRelevantChunks()) {
      const found = chunk.monsters.find(monster => monster.x === x && monster.y === y);
      if (found) return found;
    }
    return null;
  }

  function getLootAt(x, y) {
    for (const chunk of getRelevantChunks()) {
      const found = (chunk.loot || []).find(item => item.x === x && item.y === y);
      if (found) return found;
    }
    return null;
  }

  function adjacentWaterTile(x = player.x, y = player.y) {
    return [[0, -1], [1, 0], [0, 1], [-1, 0]]
      .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .find(tilePos => terrainAt(tilePos.x, tilePos.y) === 'water') || null;
  }

  function firstHealthyMonsterIndex() {
    return party.findIndex(monster => monster.hp > 0);
  }

  function chooseEncounter(x, y, seedOffset = 0) {
    const profile = routeProfileAt(x, y);
    const terrain = terrainAt(x, y);

    if (terrain === 'dungeon') {
      const dungeonPool = ((profile.dungeonPool && profile.dungeonPool.length) ? profile.dungeonPool : profile.pool || []).map(entry => ({
        species: entry.species,
        rarity: entry.rarity,
        weight: Math.max(1, Math.round(entry.weight * ({ common: 0.55, uncommon: 0.95, rare: 1.35, legendary: 1.65, mythic: 1.8 }[entry.rarity] || 1)))
      }));
      const eligibleSpecials = (profile.specials || []).filter(entry => {
        if ((entry.minSteps || 0) > steps) return false;
        if ((entry.minCaptures || 0) > captures) return false;
        if ((entry.minDefeated || 0) > defeated) return false;
        if ((entry.minBadges || 0) > badgeCount()) return false;
        return true;
      }).map(entry => ({
        species: entry.species,
        rarity: entry.rarity,
        weight: Math.max(1, Math.round(entry.chance * 180))
      }));
      const pool = [...dungeonPool, ...eligibleSpecials];
      const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
      let roll = Math.random() * Math.max(1, totalWeight);
      let picked = pool[0] || { species: profile.pool[0]?.species || speciesList[0].name, rarity: profile.pool[0]?.rarity || 'common', weight: 1 };
      for (const entry of pool) {
        roll -= entry.weight;
        if (roll <= 0) {
          picked = entry;
          break;
        }
      }
      return {
        profile,
        rarity: picked.rarity,
        species: speciesByName[picked.species] || speciesList[0]
      };
    }

    const specials = (profile.specials || []).filter(entry => {
      if (entry.terrain && entry.terrain !== terrain) return false;
      if ((entry.minSteps || 0) > steps) return false;
      if ((entry.minCaptures || 0) > captures) return false;
      if ((entry.minDefeated || 0) > defeated) return false;
      if ((entry.minBadges || 0) > badgeCount()) return false;
      return true;
    });

    if (specials.length) {
      const specialRoll = Math.random();
      const pickedSpecial = specials.find(entry => specialRoll < entry.chance);
      if (pickedSpecial) {
        return {
          profile,
          rarity: pickedSpecial.rarity,
          species: speciesByName[pickedSpecial.species] || speciesList[0]
        };
      }
    }

    const totalWeight = profile.pool.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;
    let picked = profile.pool[0];
    for (const entry of profile.pool) {
      roll -= entry.weight;
      if (roll <= 0) {
        picked = entry;
        break;
      }
    }
    return {
      profile,
      rarity: picked.rarity,
      species: speciesByName[picked.species] || speciesList[0]
    };
  }

  function chooseFishingEncounter(x, y, seedOffset = 0) {
    const profile = routeProfileAt(x, y);
    const specials = (profile.fishSpecials || []).filter(entry => {
      if ((entry.minSteps || 0) > steps) return false;
      if ((entry.minCaptures || 0) > captures) return false;
      if ((entry.minDefeated || 0) > defeated) return false;
      if ((entry.minBadges || 0) > badgeCount()) return false;
      return true;
    });

    if (specials.length) {
      const specialRoll = Math.random();
      const pickedSpecial = specials.find(entry => specialRoll < entry.chance);
      if (pickedSpecial) {
        return {
          profile,
          rarity: pickedSpecial.rarity,
          species: speciesByName[pickedSpecial.species] || speciesList[0]
        };
      }
    }

    const pool = profile.fishPool || [];
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * Math.max(1, totalWeight);
    let picked = pool[0] || { species: 'Ripple Fry', rarity: 'common', weight: 1 };
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) {
        picked = entry;
        break;
      }
    }
    return {
      profile,
      rarity: picked.rarity,
      species: speciesByName[picked.species] || speciesList[0]
    };
  }

  function evolveEncounterSpecies(species, profile, level, x, y, seedOffset = 0, source = 'wild') {
    let nextSpecies = species;
    let depth = 0;
    const profileIndex = Math.max(0, routeProfiles.indexOf(profile));

    while (nextSpecies && depth < 3) {
      if (apexBaseSpeciesNames.has(nextSpecies.name)) break;
      const rule = evolutionData[nextSpecies.name];
      if (!rule) break;

      const evolvedSpecies = speciesByName[rule.evolvesTo];
      if (!evolvedSpecies) break;

      const minBadges = rule.minBadges || 0;
      const minLevel = rule.minLevel || 1;
      if (badgeCount() < minBadges || level < minLevel) break;

      const lateRoutePush = Math.max(0, profileIndex - Math.max(0, minBadges - 1));
      const sourceBonus = source === 'fish' ? 0.015 : 0;
      const evolveChance = Math.min(0.18, 0.015 + lateRoutePush * 0.035 + Math.max(0, level - minLevel) * 0.006 + sourceBonus);
      const evolveRoll = hashValue(x + depth, y - depth, 641 + seedOffset * 11 + profileIndex * 13 + depth * 17);
      if (evolveRoll > evolveChance) break;

      nextSpecies = evolvedSpecies;
      depth += 1;
    }

    return {
      species: nextSpecies || species,
      depth
    };
  }

  function applyEvolvedEncounterBoost(monster, profile, depth, source = 'wild') {
    const safeDepth = Math.max(0, depth || 0);
    if (!monster || safeDepth <= 0) return monster;

    const profileIndex = Math.max(0, routeProfiles.indexOf(profile));
    const sourceHpBonus = source === 'fish' ? 2 : 4;
    const sourceAtkBonus = source === 'fish' ? 1 : 2;
    const hpBoost = 6 + safeDepth * (4 + sourceHpBonus) + Math.max(0, profileIndex - 5) * 2;
    const atkMinBoost = sourceAtkBonus + safeDepth * 2 + Math.floor(Math.max(0, profileIndex - 4) / 2);
    const atkMaxBoost = sourceAtkBonus + safeDepth * 3 + Math.max(0, profileIndex - 4);

    monster.evolvedEncounterDepth = safeDepth;
    monster.maxHp += hpBoost;
    monster.hp = monster.maxHp;
    monster.atkMin += atkMinBoost;
    monster.atkMax += atkMaxBoost;
    monster.catchBase = Math.max(0.08, monster.catchBase - (0.08 + safeDepth * 0.03));
    return monster;
  }

  function applyApexEncounterBoost(monster, profile, source = 'wild') {
    if (!monster || !apexBaseSpeciesNames.has(monster.species)) return monster;

    const profileIndex = Math.max(0, routeProfiles.indexOf(profile));
    const sourceHpBonus = source === 'fish' ? 8 : 10;
    const sourceAtkBonus = source === 'fish' ? 3 : 4;
    monster.apexEncounter = true;
    monster.maxHp += 18 + sourceHpBonus + Math.max(0, profileIndex - 8) * 3;
    monster.hp = monster.maxHp;
    monster.atkMin += 4 + sourceAtkBonus + Math.floor(Math.max(0, profileIndex - 7) / 2);
    monster.atkMax += 6 + sourceAtkBonus + Math.max(0, profileIndex - 7);
    monster.level = Math.min(36, monster.level + 3 + (source === 'fish' ? 0 : 1));
    monster.maxHp = Math.max(monster.maxHp, speciesByName[monster.species].hp + monster.level + 14);
    monster.hp = monster.maxHp;
    monster.catchBase = Math.max(0.03, monster.catchBase - 0.16);
    return monster;
  }

  function regionLevel(x, y) {
    return Math.min(12, 1 + Math.floor((Math.abs(x) + Math.abs(y)) / 18));
  }

  function createWildMonster(x, y, bonusLevel = 0, seedOffset = 0) {
    const encounter = chooseEncounter(x, y, seedOffset);
    const rarity = rarityMeta[encounter.rarity] || rarityMeta.common;
    const profileIndex = Math.max(0, routeProfiles.indexOf(encounter.profile));
    const inDungeon = terrainAt(x, y) === 'dungeon';
    const relief = earlyGameRelief(x, y);
    const lateRouteLevelBonus = profileIndex >= 6 ? 1 + Math.floor((profileIndex - 5) / 2) : 0;
    const dungeonBonus = inDungeon ? 2 + (profileIndex >= 6 ? 1 : 0) : 0;
    const wildLevelCap = (profileIndex >= 8 ? 24 : profileIndex >= 6 ? 20 : 16) + (inDungeon ? 3 : 0);
    const baseLevel = Math.min(wildLevelCap, regionLevel(x, y) + bonusLevel + rarity.levelBonus + lateRouteLevelBonus + dungeonBonus + (hashValue(x + seedOffset, y - seedOffset, 37 + seedOffset * 5) > 0.82 ? 1 : 0));
    const level = Math.max(1, baseLevel - (relief >= 0.52 ? 1 : 0));
    const evolvedEncounter = evolveEncounterSpecies(encounter.species, encounter.profile, level, x, y, seedOffset, 'wild');
    encounterRollCounter += 1;
    const monster = {
      id: `mt-${encounterRollCounter}-${Date.now()}-${x}-${y}`,
      x,
      y,
      ...cloneMonster(evolvedEncounter.species, level),
      shiny: rollEncounterShiny(),
      rarity: encounter.rarity,
      route: routeLabelAt(x, y),
      inDungeon,
      roamBias: Math.floor(hashValue(x, y, 43 + seedOffset * 3) * 4)
    };
    monster.catchBase = Math.min(0.9, Math.max(0.16, monster.catchBase + rarity.catchAdjust + relief * 0.16 - (inDungeon ? 0.04 : 0)));
    applyEvolvedEncounterBoost(monster, encounter.profile, evolvedEncounter.depth, 'wild');
    return applyApexEncounterBoost(monster, encounter.profile, 'wild');
  }

  function createFishingMonster(x, y) {
    const encounter = chooseFishingEncounter(x, y, steps + captures + defeated);
    const rarity = rarityMeta[encounter.rarity] || rarityMeta.common;
    const profileIndex = Math.max(0, routeProfiles.indexOf(encounter.profile));
    const lateRouteLevelBonus = profileIndex >= 6 ? 1 + Math.floor((profileIndex - 5) / 2) : 0;
    const fishingLevelCap = profileIndex >= 8 ? 22 : profileIndex >= 6 ? 18 : 14;
    const level = Math.min(fishingLevelCap, regionLevel(x, y) + rarity.levelBonus + lateRouteLevelBonus + (hashValue(x, y, 521) > 0.72 ? 1 : 0));
    const evolvedEncounter = evolveEncounterSpecies(encounter.species, encounter.profile, level, x, y, steps + captures + defeated, 'fish');
    const monster = {
      id: `mt-fish-${Math.floor(hashValue(x, y, 523) * 1000000)}-${x}-${y}`,
      x,
      y,
      ...cloneMonster(evolvedEncounter.species, level),
      shiny: rollEncounterShiny(),
      rarity: encounter.rarity,
      route: `${encounter.profile.label} Waters`,
      ephemeral: true,
      fromFishing: true
    };
    monster.catchBase = Math.max(0.1, monster.catchBase + rarity.catchAdjust - 0.03);
    applyEvolvedEncounterBoost(monster, encounter.profile, evolvedEncounter.depth, 'fish');
    return applyApexEncounterBoost(monster, encounter.profile, 'fish');
  }

  function trainerTeamPoolForProfile(profile) {
    const poolSpecies = [
      ...(profile.pool || []).map(entry => entry.species),
      ...(profile.fishPool || []).map(entry => entry.species),
      ...(profile.specials || []).map(entry => entry.species),
      ...(profile.fishSpecials || []).map(entry => entry.species)
    ];
    return [...new Set(poolSpecies)].filter(name => speciesByName[name] && !apexSpeciesNames.has(name));
  }

  function trainerSpeciesForRoute(species, profileIndex, x, y, seedOffset = 0, slotIndex = 0) {
    let nextSpecies = species;
    let depth = 0;

    while (nextSpecies && depth < 3) {
      const rule = evolutionData[nextSpecies.name];
      if (!rule) break;
      const evolvedSpecies = speciesByName[rule.evolvesTo];
      if (!evolvedSpecies) break;

      const badgeWindow = Math.max(0, (rule.minBadges || 0) - 1);
      const evolveChance = Math.min(0.95, 0.24 + Math.max(0, profileIndex - badgeWindow) * 0.18);
      const evolveRoll = hashValue(x + depth, y + slotIndex, 613 + seedOffset * 7 + profileIndex * 11 + depth * 17);
      if (profileIndex < badgeWindow || evolveRoll > evolveChance) break;

      nextSpecies = evolvedSpecies;
      depth += 1;
    }

    return nextSpecies || species;
  }

  function createRouteTrainer(x, y, seedOffset = 0) {
    const profile = routeProfileAt(x, y);
    const profileIndex = Math.max(0, routeProfiles.indexOf(profile));
    const namePool = routeTrainerNames[profile.label] || ['Ari', 'Tess', 'Milo', 'Rune'];
    const trainerName = `${routeTrainerTitles[Math.floor(hashValue(x, y, 571 + seedOffset) * routeTrainerTitles.length)]} ${namePool[Math.floor(hashValue(x, y, 577 + seedOffset) * namePool.length)]}`;
    const teamPool = trainerTeamPoolForProfile(profile);
    const maxTeamSize = profileIndex >= 9 ? 5 : profileIndex >= 6 ? 4 : 3;
    const extraLateSlot = profileIndex >= 7 ? 1 : 0;
    const teamSize = Math.min(maxTeamSize, 1 + Math.floor(profileIndex / 2) + (hashValue(x, y, 583 + seedOffset) > 0.72 ? 1 : 0) + extraLateSlot);
    const team = [];

    for (let index = 0; index < teamSize; index++) {
      const speciesName = teamPool[Math.floor(hashValue(x, y, 589 + seedOffset * 3 + index) * teamPool.length)] || profile.pool[0]?.species || speciesList[0].name;
      const baseSpecies = speciesByName[speciesName] || speciesList[0];
      const species = trainerSpeciesForRoute(baseSpecies, profileIndex, x, y, seedOffset, index);
      const lateGameLevelBonus = profileIndex >= 6 ? 2 + Math.floor((profileIndex - 6) / 2) : 0;
      const level = Math.min(30, Math.max(2 + Math.floor(profileIndex / 2), regionLevel(x, y) + lateGameLevelBonus + (index === 0 ? 2 : 0) + Math.floor(hashValue(x, y, 601 + index + seedOffset) * 3)));
      const trainerMonster = {
        ...cloneMonster(species, level),
        shiny: false,
        rarity: index === 0 ? 'rare' : profileIndex >= 8 ? 'rare' : 'uncommon',
        route: profile.label,
        trainerRewardCoins: 18 + profileIndex * 11
      };
      const lateTrainerBoost = Math.max(0, profileIndex - 5);
      if (lateTrainerBoost > 0) {
        trainerMonster.maxHp += lateTrainerBoost * 3 + Math.max(0, teamSize - index - 1);
        trainerMonster.hp = trainerMonster.maxHp;
        trainerMonster.atkMin += Math.max(1, Math.floor(lateTrainerBoost / 2));
        trainerMonster.atkMax += lateTrainerBoost + (index === 0 ? 1 : 0);
      }
      team.push(trainerMonster);
    }

    const [leadMonster, ...reserve] = team;
    return {
      id: `mt-trainer-${x}-${y}-${seedOffset}`,
      x,
      y,
      ...leadMonster,
      isTrainer: true,
      trainerName,
      trainerReserve: reserve,
      trainerSpriteConfig: trainerSpriteConfigForPosition(x, y, seedOffset),
      roamBias: Math.floor(hashValue(x, y, 607 + seedOffset) * 4),
      spriteFacing: 'down',
      spriteWalkFrame: 1,
      spriteWalkAnimationUntil: 0
    };
  }

  function createRouteNpc(x, y, seedOffset = 0) {
    const dialogueIndex = Math.floor(hashValue(x, y, 659 + seedOffset) * routeNpcDialogues.length);
    return {
      id: `mt-npc-${x}-${y}-${seedOffset}`,
      x,
      y,
      isNpc: true,
      dialogueIndex,
      dialogue: routeNpcDialogues[dialogueIndex] || routeNpcDialogues[0],
      npcSpriteConfig: npcSpriteConfigForPosition(x, y, seedOffset),
      roamBias: Math.floor(hashValue(x, y, 661 + seedOffset) * 4),
      spriteFacing: 'down',
      spriteWalkFrame: 1,
      spriteWalkAnimationUntil: 0
    };
  }

  function createLandmarkLoot(x, y, seedOffset = 0) {
    const profile = routeProfileAt(x, y);
    const tier = lootTierAt(x, y);
    const bonusRoll = hashValue(x, y, 127 + seedOffset * 19);
    const themedRewards = {
      signpost: { kind: 'coins', label: 'trail cache', amount: 7 + tier * 4 + Math.floor(bonusRoll * (4 + tier * 2)) },
      fern: { kind: 'party-heal', label: 'herb satchel', amount: 8 + tier * 3 + Math.floor(bonusRoll * (3 + tier * 2)) },
      reeds: { kind: 'capsule', label: 'drift crate', amount: 1 + (tier >= 2 ? 1 : 0) },
      obelisk: { kind: 'charm', label: 'dusk relic', amount: 1 },
      teslapost: { kind: bonusRoll > 0.45 ? 'charm' : 'capsule', label: 'storm battery', amount: bonusRoll > 0.45 ? 1 : 1 + (tier >= 3 ? 1 : 0) },
      crowntree: { kind: bonusRoll > 0.38 ? 'charm' : 'party-heal', label: 'crown stash', amount: bonusRoll > 0.38 ? 1 : 12 + tier * 4 + Math.floor(bonusRoll * (4 + tier * 2)) }
    };
    const reward = themedRewards[profile.landmark] || themedRewards.signpost;
    return {
      id: `loot-landmark-${x}-${y}`,
      x,
      y,
      type: 'landmark-cache',
      rewardType: reward.kind,
      label: reward.label,
      amount: reward.amount,
      profileKey: profile.landmark
    };
  }

  function createWorldLoot(x, y, seedOffset = 0) {
    const tier = lootTierAt(x, y);
    const primaryRoll = hashValue(x, y, 89 + seedOffset * 17);
    const bonusRoll = hashValue(x, y, 97 + seedOffset * 17);

    if (tier >= 3 && primaryRoll > 0.965) {
      return {
        id: `loot-charm-${x}-${y}`,
        x,
        y,
        type: 'charm',
        amount: 1
      };
    }

    if (primaryRoll < Math.max(0.42 - tier * 0.05, 0.2)) {
      return {
        id: `loot-coins-${x}-${y}`,
        x,
        y,
        type: 'coins',
        amount: 4 + tier * 3 + Math.floor(bonusRoll * (4 + tier * 2))
      };
    }

    if (primaryRoll < Math.max(0.72 - tier * 0.02, 0.56)) {
      return {
        id: `loot-capsule-${x}-${y}`,
        x,
        y,
        type: 'capsule',
        amount: 1 + (tier >= 3 && bonusRoll > 0.74 ? 1 : 0)
      };
    }

    return {
      id: `loot-tonic-${x}-${y}`,
      x,
      y,
      type: 'tonic',
      amount: 1
    };
  }

  function createDungeonCoreLoot(zone) {
    const profileIndex = Math.max(0, routeProfiles.indexOf(zone.profile));
    return {
      id: `loot-dungeon-core-${zone.key}`,
      x: zone.x,
      y: zone.y,
      type: 'dungeon-cache',
      label: `${zone.profile.label} reliquary`,
      coinAmount: 28 + profileIndex * 9,
      capsuleAmount: profileIndex >= 6 ? 3 : 2,
      tonicAmount: profileIndex >= 7 ? 2 : 1,
      charmAmount: profileIndex >= 5 ? 2 : 1
    };
  }

  function getChunk(cx, cy) {
    const id = chunkKey(cx, cy);
    if (!chunks.has(id)) {
      const chunk = { cx, cy, monsters: [], loot: [] };
      const attempts = 1 + Math.floor(hashValue(cx, cy, 47) * 3);
      const occupied = new Set();
      for (let i = 0; i < attempts; i++) {
        const mx = cx * chunkSize + Math.floor(hashValue(cx, cy, 53 + i) * chunkSize);
        const my = cy * chunkSize + Math.floor(hashValue(cx, cy, 61 + i) * chunkSize);
        if (Math.abs(mx) + Math.abs(my) < 7) continue;
        if (occupied.has(key(mx, my))) continue;
        const terrain = terrainAt(mx, my);
        if (terrain !== 'grass' && terrain !== 'dungeon') continue;
        if (terrain === 'grass' && isRouteOrNearRoute(mx, my)) continue;
        occupied.add(key(mx, my));
        chunk.monsters.push(createWildMonster(mx, my, i % 2, (cx + 11) * 17 + (cy + 13) * 23 + i * 5));
      }

      if (distanceFromOrigin(cx * chunkSize, cy * chunkSize) > 12 && hashValue(cx, cy, 565) > 0.62) {
        const trainerAttempts = 3 + Math.floor(hashValue(cx, cy, 581) * 3);
        for (let i = 0; i < trainerAttempts; i++) {
          const tx = cx * chunkSize + Math.floor(hashValue(cx, cy, 567 + i) * chunkSize);
          const ty = cy * chunkSize + Math.floor(hashValue(cx, cy, 573 + i) * chunkSize);
          const terrain = terrainAt(tx, ty);
          const allowOffRouteTrainer = hashValue(tx, ty, 593 + i) > 0.92;
          if (occupied.has(key(tx, ty))) continue;
          if (terrain !== 'path' && !(allowOffRouteTrainer && isRouteOrNearRoute(tx, ty))) continue;
          if (getTownshipAt(tx, ty)) continue;
          occupied.add(key(tx, ty));
          chunk.monsters.push(createRouteTrainer(tx, ty, i));
          break;
        }
      }

      if (distanceFromOrigin(cx * chunkSize, cy * chunkSize) > 8 && hashValue(cx, cy, 665) > 0.48) {
        const npcAttempts = 4 + Math.floor(hashValue(cx, cy, 667) * 4);
        for (let i = 0; i < npcAttempts; i++) {
          const nx = cx * chunkSize + Math.floor(hashValue(cx, cy, 671 + i) * chunkSize);
          const ny = cy * chunkSize + Math.floor(hashValue(cx, cy, 677 + i) * chunkSize);
          const terrain = terrainAt(nx, ny);
          const onRoute = terrain === 'path';
          const offRouteAllowed = hashValue(nx, ny, 683 + i) > 0.94;
          if (occupied.has(key(nx, ny))) continue;
          if (getTownshipAt(nx, ny)) continue;
          if (!onRoute && !(offRouteAllowed && (terrain === 'plain' || terrain === 'grass'))) continue;
          occupied.add(key(nx, ny));
          chunk.monsters.push(createRouteNpc(nx, ny, i));
          break;
        }
      }

      const lootAttempts = Math.floor(hashValue(cx, cy, 71) * 2) + (distanceFromOrigin(cx * chunkSize, cy * chunkSize) > 36 ? 1 : 0);
      for (let i = 0; i < lootAttempts; i++) {
        const lx = cx * chunkSize + Math.floor(hashValue(cx, cy, 79 + i) * chunkSize);
        const ly = cy * chunkSize + Math.floor(hashValue(cx, cy, 83 + i) * chunkSize);
        const terrain = terrainAt(lx, ly);
        if (distanceFromOrigin(lx, ly) < 5) continue;
        if (occupied.has(key(lx, ly))) continue;
        if (terrain !== 'plain' && terrain !== 'grass' && terrain !== 'path' && terrain !== 'dungeon') continue;
        occupied.add(key(lx, ly));
        chunk.loot.push(createWorldLoot(lx, ly, i));
      }

      const dungeonZone = getDungeonZone();
      if (dungeonZone && dungeonZone.x >= cx * chunkSize && dungeonZone.x < (cx + 1) * chunkSize && dungeonZone.y >= cy * chunkSize && dungeonZone.y < (cy + 1) * chunkSize) {
        occupied.add(key(dungeonZone.x, dungeonZone.y));
        chunk.loot.push(createDungeonCoreLoot(dungeonZone));
      }

      for (let i = 0; i < 5; i++) {
        const lx = cx * chunkSize + Math.floor(hashValue(cx, cy, 131 + i) * chunkSize);
        const ly = cy * chunkSize + Math.floor(hashValue(cx, cy, 137 + i) * chunkSize);
        const terrain = terrainAt(lx, ly);
        if (distanceFromOrigin(lx, ly) < 10) continue;
        if (occupied.has(key(lx, ly))) continue;
        if (!hasLandmarkAt(lx, ly, routeProfileAt(lx, ly), terrain)) continue;
        if (hashValue(lx, ly, 143) < 0.18) continue;
        occupied.add(key(lx, ly));
        chunk.loot.push(createLandmarkLoot(lx, ly, i));
      }

      chunks.set(id, chunk);
    }
    return chunks.get(id);
  }

  function ensureWorld() {
    getRelevantChunks(chunkRadius + 1);
  }

  function removeMonster(target) {
    if (!target || target.ephemeral) return;
    for (const chunk of getRelevantChunks(chunkRadius + 1)) {
      const idx = chunk.monsters.findIndex(monster => monster === target || monster.id === target.id);
      if (idx >= 0) {
        chunk.monsters.splice(idx, 1);
        return;
      }
    }
  }

  function removeLoot(target) {
    if (!target) return;
    for (const chunk of getRelevantChunks(chunkRadius + 1)) {
      const idx = (chunk.loot || []).findIndex(item => item === target || item.id === target.id);
      if (idx >= 0) {
        chunk.loot.splice(idx, 1);
        return;
      }
    }
  }

  function monsterOccupied(x, y, ignore) {
    return getRelevantChunks(chunkRadius + 1).some(chunk => chunk.monsters.some(monster => monster !== ignore && monster.x === x && monster.y === y));
  }

  function collectWorldLoot() {
    const item = getLootAt(player.x, player.y);
    if (!item) return false;

    removeLoot(item);

    if (item.type === 'coins') {
      coins += item.amount;
      setMessage(`You found ${item.amount} coins in a weathered cache.`);
    } else if (item.type === 'capsule') {
      const room = Math.max(0, maxCapsules - capsules);
      const gained = Math.min(room, item.amount);
      const overflowCoins = gained < item.amount ? (item.amount - gained) * 8 : 0;
      capsules += gained;
      coins += overflowCoins;
      if (gained > 0) {
        setMessage(`You found ${gained} capsule${gained === 1 ? '' : 's'} in a supply pod.`);
      } else {
        setMessage(`You found ${overflowCoins} coins in a weathered cache.`);
      }
    } else if (item.type === 'tonic') {
      if (tonics < maxTonics) {
        tonics += 1;
        setMessage('You found a field tonic.');
      } else {
        coins += 5;
        setMessage('You found a field tonic. No one needed it, so you traded it for 5 coins.');
      }
    } else if (item.type === 'charm') {
      charms += item.amount;
      setMessage('You found a capture charm. Your next capture attempt will be stronger.');
    } else if (item.type === 'landmark-cache') {
      if (item.rewardType === 'coins') {
        coins += item.amount;
        setMessage(`You uncovered a ${item.label} and found ${item.amount} coins.`);
      } else if (item.rewardType === 'capsule') {
        const room = Math.max(0, maxCapsules - capsules);
        const gained = Math.min(room, item.amount);
        const overflowCoins = Math.max(0, item.amount - gained) * 10;
        capsules += gained;
        coins += overflowCoins;
        if (gained > 0) {
          setMessage(`You uncovered a ${item.label} and found ${gained} capsules.`);
        } else {
          setMessage(`You uncovered a ${item.label} and found ${overflowCoins} coins.`);
        }
      } else if (item.rewardType === 'party-heal') {
        let totalRecovered = 0;
        party.forEach(monster => {
          const recovered = Math.min(item.amount, monster.maxHp - monster.hp);
          monster.hp += recovered;
          totalRecovered += recovered;
        });
        if (totalRecovered > 0) {
          setMessage(`You uncovered a ${item.label} and restored ${totalRecovered} HP across your party.`);
        } else {
          coins += 6;
          setMessage(`You uncovered a ${item.label} and found 6 coins.`);
        }
      } else if (item.rewardType === 'charm') {
        charms += item.amount;
        setMessage('You found a capture charm. Your next capture attempt will be stronger.');
      }
    } else if (item.type === 'dungeon-cache') {
      runGoalDungeonLoot = true;
      const capsuleRoom = Math.max(0, maxCapsules - capsules);
      const gainedCapsules = Math.min(capsuleRoom, item.capsuleAmount || 0);
      const tonicRoom = Math.max(0, maxTonics - tonics);
      const gainedTonics = Math.min(tonicRoom, item.tonicAmount || 0);
      capsules += gainedCapsules;
      tonics += gainedTonics;
      charms += item.charmAmount || 0;
      coins += item.coinAmount || 0;
      party.forEach(monster => {
        monster.hp = monster.maxHp;
      });
      setMessage(`At the heart of ${routeLabelAt(item.x, item.y)}, you opened the ${item.label} and found ${item.coinAmount} coins, ${gainedCapsules} capsules, ${gainedTonics} tonics, and ${item.charmAmount} charm${item.charmAmount === 1 ? '' : 's'}. Your party was fully restored.`);
    }

    updateHighScore();
    updateTamerUi();
    return true;
  }

  function healParty() {
    party.forEach(monster => {
      monster.hp = monster.maxHp;
    });
    if (activeMonster()) activeIndex = Math.max(0, firstHealthyMonsterIndex());
    setMessage('Your party rested at town.');
    updateTamerUi();
    drawTamerWorld();
  }

  function openTownMenu() {
    activeTownship = getTownshipAt();
    townMenuOpen = true;
    indexMenuOpen = false;
    storageMenuOpen = false;
    townSelection = 0;
    const bossState = bossStateForTown(activeTownship);
    setMessage(bossState.ready ? `${activeTownship?.profile?.boss?.trainer || 'Town boss'} is ready. Win the ${activeTownship?.profile?.boss?.badge || 'town'} Badge.` : 'Town services are open. Stock up or check your index.');
    drawTamerWorld();
  }

  function castFishingLine() {
    const waterTile = adjacentWaterTile();
    if (!waterTile) {
      setMessage('Stand beside water to fish.');
      drawTamerWorld();
      return true;
    }
    if (rods <= 0) {
      setMessage('You need a fishing rod first.');
      drawTamerWorld();
      return true;
    }

    const biteChance = Math.min(0.68, 0.34 + lootTierAt(waterTile.x, waterTile.y) * 0.07);
    if (Math.random() < biteChance) {
      setMessage(`Something tugged the line in ${routeLabelAt(waterTile.x, waterTile.y)} Waters.`);
      startFishingAnimation(waterTile, { type: 'battle', waterTile });
      updateTamerUi();
      return true;
    }

    setMessage('Casting...');
    startFishingAnimation(waterTile, { type: 'empty', breaksRod: Math.random() >= 0.14 });
    updateTamerUi();
    return true;
  }

  function closeTownMenu(message) {
    townMenuOpen = false;
    indexMenuOpen = false;
    storageMenuOpen = false;
    activeTownship = null;
    if (message) setMessage(message);
    updateTamerUi();
    drawTamerWorld();
  }

  function moveTownSelection(step) {
    if (!townMenuOpen) return;
    if (indexMenuOpen) {
      moveIndexSelection(step);
      return;
    }
    if (storageMenuOpen) {
      moveStorageSelection(step);
      return;
    }
    townSelection = wrapIndex(townSelection + step, shopItems.length);
    setMessage(currentTownSelectionDetail());
    drawTamerWorld();
  }

  function openMonsterIndex() {
    indexMenuOpen = true;
    indexSelection = 0;
    setMessage('Monster Index opened. Browse routes and discoveries.');
    drawTamerWorld();
  }

  function closeMonsterIndex(message) {
    indexMenuOpen = false;
    if (message) setMessage(message);
    drawTamerWorld();
  }

  function moveIndexSelection(step) {
    indexSelection = wrapIndex(indexSelection + step, speciesList.length);
    setMessage(`${speciesList[indexSelection].name} entry selected.`);
    drawTamerWorld();
  }

  function usePotionOnLead() {
    const lead = activeMonster();
    if (!lead) return 'No lead monster to treat.';
    return usePotionOnMonster(lead);
  }

  function buyTownItem() {
    if (!townMenuOpen) return;
    if (indexMenuOpen) {
      closeMonsterIndex('Back to town services.');
      return;
    }
    if (storageMenuOpen) {
      handleStorageConfirm();
      return;
    }
    const choice = shopItems[townSelection];
    if (!choice) return;
    if (choice.key === 'leave') {
      closeTownMenu('You head back out onto the route.');
      return;
    }
    if (choice.key === 'index') {
      openMonsterIndex();
      return;
    }
    if (choice.key === 'storage') {
      openStorageMenu();
      return;
    }
    if (choice.key === 'boss') {
      startBossBattle();
      return;
    }
    if (choice.key === 'heal') {
      healParty();
      setMessage('The town nurse patched up your party.');
      drawTamerWorld();
      return;
    }
    if (coins < choice.cost) {
      setMessage('Not enough coins for that purchase.');
      drawTamerWorld();
      return;
    }
    if (choice.key === 'capsule') {
      if (capsules >= maxCapsules) {
        setMessage('Your capsule bag is already full.');
        drawTamerWorld();
        return;
      }
      coins -= choice.cost;
      capsules += 1;
      setMessage('You bought one capsule.');
    } else if (choice.key === 'rod') {
      if (rods >= maxRods) {
        setMessage('Your rod pouch is already full.');
        drawTamerWorld();
        return;
      }
      coins -= choice.cost;
      rods += 1;
      setMessage('You bought one fishing rod.');
    } else if (choice.key === 'tonic') {
      if (tonics >= maxTonics) {
        setMessage('Your tonic pouch is already full.');
        drawTamerWorld();
        return;
      }
      coins -= choice.cost;
      tonics += 1;
      setMessage('You bought one tonic.');
    }
    updateHighScore();
    updateTamerUi();
    drawTamerWorld();
  }

  function drawPixelSprite(sprite, palette, px, py, scale) {
    const normalizedSprite = normalizeSpriteGrid(sprite);
    for (let sy = 0; sy < normalizedSprite.length; sy++) {
      const row = normalizedSprite[sy];
      for (let sx = 0; sx < row.length; sx++) {
        const pixel = row[sx];
        if (pixel === '.') continue;
        const fill = palette[pixel];
        if (!fill) continue;
        ctx.fillStyle = fill;
        ctx.fillRect(px + sx * scale, py + sy * scale, scale, scale);
      }
    }
  }

  function drawTypeBadge(typeKey, label, x, y, options = {}) {
    const meta = typeMeta[typeKey] || typeMeta.stone;
    const text = label || meta.short;
    const font = options.font || canvasFont(9);
    const paddingX = options.paddingX || 4;
    const height = options.height || 11;
    const minWidth = options.minWidth || 26;
    const radius = options.radius || 2;

    ctx.save();
    ctx.font = font;
    const width = Math.max(minWidth, Math.ceil(ctx.measureText(text).width) + paddingX * 2);
    ctx.fillStyle = colorWithAlpha(meta.color, 0.95);
    ctx.strokeStyle = 'rgba(49,63,42,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fff0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + height / 2 + 0.5);
    ctx.restore();
    return width;
  }

  function drawOutlinedPixelSprite(sprite, palette, outlineColor, px, py, scale) {
    const normalizedSprite = normalizeSpriteGrid(sprite);
    const offsets = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ];

    ctx.fillStyle = outlineColor;
    for (let sy = 0; sy < normalizedSprite.length; sy++) {
      const row = normalizedSprite[sy];
      for (let sx = 0; sx < row.length; sx++) {
        if (row[sx] === '.') continue;
        offsets.forEach(([ox, oy]) => {
          const nx = sx + ox;
          const ny = sy + oy;
          const neighbor = normalizedSprite[ny]?.[nx] || '.';
          if (neighbor !== '.') return;
          ctx.fillRect(px + nx * scale, py + ny * scale, scale, scale);
        });
      }
    }

    drawPixelSprite(normalizedSprite, palette, px, py, scale);
  }

  function drawCharacterSpriteFrame(spriteConfig, px, py, scale, frameIndex, facing, fallbackSprite, fallbackPalette, fallbackOutlineColor) {
    const frameRow = playerFacingRows[facing] ?? playerFacingRows.down;
    const sourceFrameX = ((spriteConfig?.sheetFrameX || 0) + frameIndex) * spriteSheetFrameSize;
    const sourceFrameY = ((spriteConfig?.sheetFrameY || 0) + frameRow) * spriteSheetFrameSize;
    const targetSize = spriteSheetFrameSize * scale;
    const spriteSheetImage = characterSpriteSheetImages[spriteConfig?.sheetId || 'sheet1'];

    if (spriteSheetImage?.complete && spriteSheetImage.naturalWidth > 0) {
      ctx.drawImage(
        spriteSheetImage,
        sourceFrameX,
        sourceFrameY,
        spriteSheetFrameSize,
        spriteSheetFrameSize,
        px,
        py,
        targetSize,
        targetSize
      );
      return;
    }

    drawOutlinedPixelSprite(fallbackSprite, fallbackPalette, fallbackOutlineColor, px, py, scale);
  }

  function drawPlayerSpriteFrame(spriteConfig, px, py, scale, frameIndex, facing) {
    drawCharacterSpriteFrame(
      spriteConfig,
      px,
      py,
      scale,
      frameIndex,
      facing,
      playerSprite,
      { '1': '#d4b9f6', '2': '#fae9df', '3': '#a184e3', '4': '#4a3d61' },
      'rgba(71, 56, 95, 0.45)'
    );
  }

  function drawTrainerSpriteFrame(spriteConfig, px, py, scale, frameIndex, facing) {
    drawCharacterSpriteFrame(
      spriteConfig,
      px,
      py,
      scale,
      frameIndex,
      facing,
      trainerSprite,
      { '1': '#5d6f4d', '2': '#f0e0c3', '3': '#8aa665', '4': '#4e5a70', '5': '#704f7d' },
      'rgba(57,70,46,0.35)'
    );
  }

  const normalizedSpriteCache = new WeakMap();

  function normalizeSpriteGrid(sprite) {
    if (!Array.isArray(sprite) || !sprite.length) return sprite;
    const cached = normalizedSpriteCache.get(sprite);
    if (cached) return cached;

    const width = Math.max(...sprite.map(row => row.length));
    const paddedSource = sprite.map(row => row.padEnd(width, '.'));
    let normalized = paddedSource;

    if (width === 8 && paddedSource.length === 8) {
      normalized = paddedSource.flatMap(row => {
        const expandedRow = row.split('').map(pixel => `${pixel}${pixel}`).join('');
        return [expandedRow, expandedRow];
      });
    } else if (width !== spriteGridSize || paddedSource.length !== spriteGridSize) {
      const trimmedWidth = Math.min(width, spriteGridSize);
      const trimmedHeight = Math.min(paddedSource.length, spriteGridSize);
      const offsetX = Math.floor((spriteGridSize - trimmedWidth) / 2);
      const offsetY = Math.floor((spriteGridSize - trimmedHeight) / 2);
      normalized = Array.from({ length: spriteGridSize }, () => '.'.repeat(spriteGridSize));
      for (let y = 0; y < trimmedHeight; y++) {
        const sourceRow = paddedSource[y].slice(0, trimmedWidth);
        const targetY = y + offsetY;
        const left = normalized[targetY].slice(0, offsetX);
        const right = normalized[targetY].slice(offsetX + trimmedWidth);
        normalized[targetY] = `${left}${sourceRow}${right}`;
      }
    }

    normalizedSpriteCache.set(sprite, normalized);
    return normalized;
  }

  function shinyPaletteForMonster(monster) {
    return {
      color: blendHex(monster?.color || '#ffffff', '#f5d14a', 0.58),
      accent: blendHex(monster?.accent || '#ffffff', '#8ef4ff', 0.5)
    };
  }

  function shinyLabel(monster) {
    return monster?.shiny ? 'Shiny ' : '';
  }

  function rollShiny() {
    return Math.random() < shinyChance;
  }

  function rollEncounterShiny() {
    return rollShiny();
  }

  function battlePaletteForMonster(monster) {
    const shinyPalette = monster?.shiny ? shinyPaletteForMonster(monster) : null;
    return {
      primary: shinyPalette ? shinyPalette.color : (monster?.color || '#ffb36b'),
      secondary: shinyPalette ? shinyPalette.accent : (monster?.accent || '#ffffff'),
      primaryGlow: colorWithAlpha(shinyPalette ? shinyPalette.color : (monster?.color || '#ffb36b'), 0.88),
      secondaryGlow: colorWithAlpha(shinyPalette ? shinyPalette.accent : (monster?.accent || '#ffffff'), 0.92)
    };
  }

  function stopFishingAnimation() {
    if (fishingAnimationFrame) {
      cancelAnimationFrame(fishingAnimationFrame);
      fishingAnimationFrame = null;
    }
    fishingAnimation = null;
  }

  function stopEncounterTransition() {
    if (encounterTransitionFrame) {
      cancelAnimationFrame(encounterTransitionFrame);
      encounterTransitionFrame = null;
    }
    encounterTransition = null;
  }

  function stopBattleAnimation() {
    if (battleAnimationFrame) {
      cancelAnimationFrame(battleAnimationFrame);
      battleAnimationFrame = null;
    }
    battleAnimation = null;
  }

  function finishBattleAnimation() {
    if (!battleAnimation) return;
    const onComplete = battleAnimation.onComplete;
    stopBattleAnimation();
    if (typeof onComplete === 'function') {
      onComplete();
    }
  }

  function tickBattleAnimation(now) {
    if (!battleAnimation) return;
    const elapsed = now - battleAnimation.startedAt;
    if (elapsed >= battleAnimation.durationMs) {
      finishBattleAnimation();
      return;
    }

    drawTamerWorld();
    battleAnimationFrame = requestAnimationFrame(tickBattleAnimation);
  }

  function startBattleAnimation(type, data, onComplete, durationMs = 620) {
    stopBattleAnimation();
    battleAnimation = {
      type,
      data,
      onComplete,
      startedAt: performance.now(),
      durationMs
    };
    battleAnimationFrame = requestAnimationFrame(tickBattleAnimation);
  }

  function unlockTheme(themeKey) {
    const unlocked = new Set(readLocalJson('unlockedThemes', []));
    const wasUnlocked = unlocked.has(themeKey);
    if (!wasUnlocked) {
      unlocked.add(themeKey);
      if (!writeStoredJson('unlockedThemes', [...unlocked])) {
        reportStorageFailure('theme unlock save');
      }
    }
    return !wasUnlocked;
  }

  function finishEncounterTransition() {
    if (!encounterTransition) return;
    const nextMonster = encounterTransition.monster;
    stopEncounterTransition();
    battleTarget = nextMonster;
    resetBattleMenu();
    recordDexEntry(nextMonster, 'seen');
    ensureMonsterState(nextMonster);
    const rarityLabel = (rarityMeta[nextMonster.rarity] || rarityMeta.common).label.toLowerCase();
    let unlockSuffix = '';
    if (nextMonster.shiny) {
      if (!writeStoredValue(shinySeenKey, 'true')) {
        reportStorageFailure('shiny flag save');
      }
      if (unlockTheme('shinyglint')) {
        unlockSuffix = ' Shiny Glint theme unlocked.';
      }
    }
    if (nextMonster.isBoss) {
      setMessage(`Boss ${nextMonster.trainerName} sent out ${nextMonster.name} for the ${nextMonster.badgeName} Badge.`);
    } else if (nextMonster.isTrainer) {
      setMessage(`Trainer ${nextMonster.trainerName} challenged you with ${nextMonster.name}.`);
    } else {
      setMessage(`A ${nextMonster.shiny ? 'shiny ' : ''}${rarityLabel} ${nextMonster.name} appeared on ${nextMonster.route || routeLabelAt(nextMonster.x, nextMonster.y)}. Capsules left: ${capsules}.${unlockSuffix}`);
    }
    updateTamerUi();
    drawTamerWorld();
  }

  function tickEncounterTransition(now) {
    if (!encounterTransition) return;
    const elapsed = now - encounterTransition.startedAt;
    const progress = Math.min(1, elapsed / encounterTransition.durationMs);

    if (!encounterTransition.switched && progress >= 0.52) {
      encounterTransition.switched = true;
      battleTarget = encounterTransition.monster;
    }

    if (progress >= 1) {
      finishEncounterTransition();
      return;
    }

    drawTamerWorld();
    encounterTransitionFrame = requestAnimationFrame(tickEncounterTransition);
  }

  function startEncounterTransition(monster) {
    stopEncounterTransition();
    encounterTransition = {
      monster,
      startedAt: performance.now(),
      durationMs: 760,
      switched: false
    };
    battleTarget = null;
    encounterTransitionFrame = requestAnimationFrame(tickEncounterTransition);
  }

  function drawEncounterTransitionOverlay() {
    if (!encounterTransition) return;

    const elapsed = performance.now() - encounterTransition.startedAt;
    const progress = Math.min(1, elapsed / encounterTransition.durationMs);
    const pulse = Math.sin(progress * Math.PI * 6) * 0.5 + 0.5;
    const shutterWidth = Math.ceil((viewWidth / 2) * Math.min(1, progress * 1.8));

    ctx.fillStyle = `rgba(10, 14, 10, ${0.18 + progress * 0.36})`;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    ctx.fillStyle = `rgba(241, 248, 224, ${Math.max(0, 0.42 - progress * 0.55)})`;
    for (let y = 0; y < viewHeight; y += 12) {
      ctx.fillRect(0, y, viewWidth, 6);
    }

    ctx.fillStyle = `rgba(24, 28, 20, ${0.72 - progress * 0.16})`;
    ctx.fillRect(0, 0, shutterWidth, viewHeight);
    ctx.fillRect(viewWidth - shutterWidth, 0, shutterWidth, viewHeight);

    const flashAlpha = progress < 0.58 ? 0 : Math.max(0, 0.9 - ((progress - 0.58) / 0.42) * 1.2);
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(246, 250, 238, ${flashAlpha})`;
      ctx.fillRect(0, 0, viewWidth, viewHeight);
    }

    ctx.strokeStyle = `rgba(255,255,255,${0.25 + pulse * 0.35})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(12 + pulse * 3, 12 + pulse * 2, viewWidth - 24 - pulse * 6, viewHeight - 24 - pulse * 4);
  }

  function resolveFishingAnimation() {
    if (!fishingAnimation) return;

    const outcome = fishingAnimation.outcome;
    stopFishingAnimation();

    if (outcome.type === 'battle') {
      rods = Math.max(0, rods - 1);
      beginBattle(createFishingMonster(outcome.waterTile.x, outcome.waterTile.y));
      return;
    }

    if (outcome.breaksRod) {
      rods = Math.max(0, rods - 1);
      setMessage('You cast out, but nothing bites. The rod snapped.');
    } else {
      setMessage('You cast out, but nothing bites. The rod still looks usable.');
    }
    updateTamerUi();
    drawTamerWorld();
  }

  function tickFishingAnimation(now) {
    if (!fishingAnimation) return;
    const elapsed = now - fishingAnimation.startedAt;
    if (elapsed >= fishingAnimation.durationMs) {
      resolveFishingAnimation();
      return;
    }

    drawTamerWorld();
    fishingAnimationFrame = requestAnimationFrame(tickFishingAnimation);
  }

  function startFishingAnimation(waterTile, outcome) {
    stopFishingAnimation();
    fishingAnimation = {
      waterTile,
      outcome,
      startedAt: performance.now(),
      durationMs: outcome.type === 'battle' ? 900 : 780
    };
    fishingAnimationFrame = requestAnimationFrame(tickFishingAnimation);
  }

  function drawFishingAnimation(cameraX, cameraY) {
    if (!fishingAnimation) return;

    const elapsed = performance.now() - fishingAnimation.startedAt;
    const castDuration = 260;
    const totalDuration = fishingAnimation.durationMs;
    const travelProgress = Math.min(1, elapsed / castDuration);
    const settleProgress = Math.max(0, Math.min(1, (elapsed - castDuration) / Math.max(1, totalDuration - castDuration)));
    const playerSx = mapOffsetX + Math.floor(viewCols / 2) * tile + tile / 2;
    const playerSy = Math.floor(viewRows / 2) * tile + tile / 2;
    const waterSx = mapOffsetX + (fishingAnimation.waterTile.x - cameraX) * tile + tile / 2;
    const waterSy = (fishingAnimation.waterTile.y - cameraY) * tile + tile / 2;
    const bobX = playerSx + (waterSx - playerSx) * travelProgress;
    const bobY = playerSy + (waterSy - playerSy) * travelProgress - Math.sin(travelProgress * Math.PI) * 10;
    const finalBobY = waterSy + Math.sin(elapsed * 0.02) * 1.5;
    const renderBobY = travelProgress < 1 ? bobY : finalBobY;
    const tugOffset = fishingAnimation.outcome.type === 'battle' && settleProgress > 0.55
      ? Math.sin((settleProgress - 0.55) * Math.PI * 10) * 2.5
      : 0;

    ctx.strokeStyle = 'rgba(58,54,47,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(playerSx, playerSy - 1);
    ctx.lineTo(bobX, renderBobY + tugOffset);
    ctx.stroke();

    if (travelProgress >= 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      const rippleRadius = 3 + Math.sin(settleProgress * Math.PI * 4) * 1.2;
      ctx.beginPath();
      ctx.arc(waterSx, waterSy + tugOffset, rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
      if (fishingAnimation.outcome.type === 'battle') {
        ctx.beginPath();
        ctx.arc(waterSx, waterSy + tugOffset, rippleRadius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    drawPixelSprite(bobberSprite, { '1': '#ffffff', '2': '#e54d4d', '3': '#2d2d2d' }, bobX - lootHalfSprite, renderBobY - lootHalfSprite + tugOffset, lootSpriteScale);
  }

  function drawLandmark(profile, sx, sy, worldX, worldY, type) {
    if (!profile || type === 'grass' || type === 'water' || type === 'heal') return;
    const landmark = landmarkSprites[profile.landmark];
    if (!landmark) return;
    if (!hasLandmarkAt(worldX, worldY, profile, type)) return;
    drawPixelSprite(landmark.sprite, landmark.palette, sx, sy, fieldSpriteScale);
  }

  function drawWorldTile(type, sx, sy, worldX, worldY) {
    const profile = routeProfileAt(worldX, worldY);
    const palette = profile.palette || { plain: '#98cd72', grass: '#7fbe57', path: '#cab47b', water: '#5aa4de' };
    const town = getTownshipAt(worldX, worldY);
    if (type === 'path') {
      ctx.fillStyle = palette.path;
      ctx.fillRect(sx, sy, tile, tile);
      ctx.fillStyle = '#b09a61';
      ctx.fillRect(sx + tileUnit(2), sy + tileUnit(3), tileUnit(3), tileUnit(2));
      ctx.fillRect(sx + tileUnit(10), sy + tileUnit(8), tileUnit(2), tileUnit(2));
      ctx.fillRect(sx + tileUnit(6), sy + tileUnit(12), tileUnit(4), tileUnit(2));
      drawLandmark(profile, sx, sy, worldX, worldY, type);
      return;
    }
    if (type === 'grass') {
      ctx.fillStyle = palette.grass;
      ctx.fillRect(sx, sy, tile, tile);
      drawPixelSprite(tallGrassSprite, { '1': '#54903a' }, sx, sy, fieldSpriteScale);
      ctx.fillStyle = colorWithAlpha('#dff5b4', 0.12 + hashValue(worldX, worldY, 901) * 0.08);
      ctx.fillRect(sx + tileUnit(2) + Math.sin((renderTick + worldX + worldY) * 0.15) * tileUnit(0.5), sy + tileUnit(5), tileUnit(2), tileUnit(5));
      ctx.fillRect(sx + tileUnit(9) + Math.sin((renderTick + worldX * 2 + worldY) * 0.17) * tileUnit(0.5), sy + tileUnit(4), tileUnit(2), tileUnit(6));
      return;
    }
    if (type === 'water') {
      ctx.fillStyle = palette.water;
      ctx.fillRect(sx, sy, tile, tile);
      ctx.fillStyle = '#8ed0ff';
      ctx.fillRect(sx + tileUnit(1), sy + tileUnit(4), tileUnit(6), tileUnit(2));
      ctx.fillRect(sx + tileUnit(8), sy + tileUnit(10), tileUnit(6), tileUnit(2));
      ctx.fillRect(sx + tileUnit(5), sy + tileUnit(14), tileUnit(5), Math.max(1, tileUnit(1)));
      ctx.fillStyle = colorWithAlpha('#ffffff', 0.16);
      ctx.fillRect(sx + tileUnit((((renderTick + worldX + worldY) % 12 + 12) % 12) / 1), sy + tileUnit(3), tileUnit(4), Math.max(1, tileUnit(1)));
      ctx.fillRect(sx + tileUnit(((((renderTick * 1.4) + worldX * 3 + worldY) % 14 + 14) % 14) / 1), sy + tileUnit(9), tileUnit(3), Math.max(1, tileUnit(1)));
      return;
    }
    if (type === 'dungeon') {
      ctx.fillStyle = '#5f616d';
      ctx.fillRect(sx, sy, tile, tile);
      ctx.fillStyle = '#777b8d';
      ctx.fillRect(sx + tileUnit(1), sy + tileUnit(2), tileUnit(5), tileUnit(2));
      ctx.fillRect(sx + tileUnit(8), sy + tileUnit(5), tileUnit(4), tileUnit(2));
      ctx.fillRect(sx + tileUnit(4), sy + tileUnit(10), tileUnit(6), tileUnit(2));
      ctx.fillStyle = 'rgba(214, 220, 244, 0.14)';
      ctx.fillRect(sx + tileUnit(3), sy + tileUnit(3), tileUnit(2), tileUnit(8));
      ctx.fillRect(sx + tileUnit(11), sy + tileUnit(7), tileUnit(1), tileUnit(5));
      ctx.strokeStyle = 'rgba(28, 30, 38, 0.35)';
      ctx.beginPath();
      ctx.moveTo(sx + tileUnit(2), sy + tileUnit(13));
      ctx.lineTo(sx + tileUnit(5), sy + tileUnit(9));
      ctx.lineTo(sx + tileUnit(7), sy + tileUnit(11));
      ctx.lineTo(sx + tileUnit(10), sy + tileUnit(6));
      ctx.stroke();
      return;
    }
    ctx.fillStyle = type === 'heal' ? '#d8f0be' : palette.plain;
    ctx.fillRect(sx, sy, tile, tile);
    ctx.fillStyle = '#8ac166';
    ctx.fillRect(sx + tileUnit(2), sy + tileUnit(2), tileUnit(2), tileUnit(2));
    ctx.fillRect(sx + tileUnit(11), sy + tileUnit(6), tileUnit(2), tileUnit(2));
    ctx.fillRect(sx + tileUnit(6), sy + tileUnit(12), tileUnit(3), tileUnit(2));
    if (type === 'tree') {
      drawPixelSprite(treeSprite, { '1': '#245b2f', '2': '#387c44', '3': '#4f9658', '4': '#6c4b2d' }, sx, sy, fieldSpriteScale);
      return;
    }
    if (type === 'town' || type === 'shop') {
      const townPalette = {
        '1': '#3f4f34',
        '2': '#efe8cf',
        '3': profile.palette?.path || '#d45252',
        '4': profile.palette?.water || '#87b8e2'
      };

      ctx.fillStyle = profile.palette?.path || '#cab47b';
      ctx.fillRect(sx, sy, tile, tile);
      ctx.strokeStyle = 'rgba(57,70,46,0.35)';
      ctx.strokeRect(sx + 1, sy + 1, tile - 2, tile - 2);

      if (type === 'shop') {
        drawPixelSprite(fieldStationSprite, townPalette, sx, sy, fieldSpriteScale);
      } else if (town) {
        const landmark = landmarkSprites[town.profile.landmark];
        if (landmark) {
          drawPixelSprite(landmark.sprite, landmark.palette, sx, sy, fieldSpriteScale);
        }
      }
      return;
    }
    drawLandmark(profile, sx, sy, worldX, worldY, type);
  }

  function drawMonsterSprite(monster, sx, sy, scale, variant = 'field') {
    const shinyPalette = monster?.shiny ? shinyPaletteForMonster(monster) : null;
    const sprite = normalizeSpriteGrid(variant === 'battle' && monster?.battleSprite ? monster.battleSprite : monster.sprite);
    const spriteWidth = Math.max(...sprite.map(row => row.length));
    const spriteHeight = sprite.length;
    const offsetX = Math.floor((spriteGridSize - spriteWidth) * scale / 2);
    const offsetY = Math.floor((spriteGridSize - spriteHeight) * scale / 2);
    drawPixelSprite(sprite, {
      '1': shinyPalette ? shinyPalette.color : monster.color,
      '2': shinyPalette ? shinyPalette.accent : monster.accent,
      '3': '#2f2f2f',
      '4': '#ffffff'
    }, sx + offsetX, sy + offsetY, scale);
  }

  function drawShinySparkles(cx, cy, radius = 22, phase = performance.now() * 0.004) {
    for (let i = 0; i < 4; i++) {
      const angle = phase + (i * Math.PI / 2);
      const sparkleX = cx + Math.cos(angle) * radius;
      const sparkleY = cy + Math.sin(angle) * (radius * 0.62);
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,241,161,0.95)' : 'rgba(164,247,255,0.95)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sparkleX - 3, sparkleY);
      ctx.lineTo(sparkleX + 3, sparkleY);
      ctx.moveTo(sparkleX, sparkleY - 3);
      ctx.lineTo(sparkleX, sparkleY + 3);
      ctx.stroke();
    }
  }

  function battleLayout() {
    return {
      enemyX: 206,
      enemyY: 50,
      allyX: 54,
      allyY: 116,
      enemyCenterX: 222,
      enemyCenterY: 66,
      allyCenterX: 70,
      allyCenterY: 132
    };
  }

  function stopAmbientAnimation() {
    if (ambientAnimationFrame) {
      cancelAnimationFrame(ambientAnimationFrame);
      ambientAnimationFrame = null;
    }
    ambientLastAt = 0;
  }

  function tickAmbientAnimation(now) {
    if (!ambientLastAt) {
      ambientLastAt = now;
    }

    const elapsed = Math.min(42, now - ambientLastAt);
    ambientLastAt = now;

    if (!encounterTransition && !battleAnimation && !fishingAnimation) {
      renderTick += elapsed * 0.024;
      drawTamerWorld();
    }

    ambientAnimationFrame = requestAnimationFrame(tickAmbientAnimation);
  }

  function startAmbientAnimation() {
    stopAmbientAnimation();
    ambientAnimationFrame = requestAnimationFrame(tickAmbientAnimation);
  }

  function drawBattleAnimationEffects(layout) {
    if (!battleAnimation) return { allyOffsetX: 0, allyOffsetY: 0, enemyOffsetX: 0, enemyOffsetY: 0 };

    const elapsed = performance.now() - battleAnimation.startedAt;
    const progress = Math.min(1, elapsed / battleAnimation.durationMs);
    const effects = { allyOffsetX: 0, allyOffsetY: 0, enemyOffsetX: 0, enemyOffsetY: 0 };

    if (battleAnimation.type === 'attack-projectile') {
      const fromEnemy = battleAnimation.data.from === 'enemy';
      const palette = battlePaletteForMonster(battleAnimation.data.monster);
      const startX = fromEnemy ? layout.enemyCenterX : layout.allyCenterX;
      const startY = fromEnemy ? layout.enemyCenterY : layout.allyCenterY;
      const endX = fromEnemy ? layout.allyCenterX : layout.enemyCenterX;
      const endY = fromEnemy ? layout.allyCenterY : layout.enemyCenterY;
      const pulse = Math.sin(progress * Math.PI);
      const shotX = startX + (endX - startX) * progress;
      const shotY = startY + (endY - startY) * progress - Math.sin(progress * Math.PI) * 10;

      ctx.strokeStyle = palette.primaryGlow;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(shotX, shotY);
      ctx.stroke();

      ctx.strokeStyle = palette.secondaryGlow;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, startY - 2);
      ctx.lineTo(shotX, shotY - 2);
      ctx.stroke();

      ctx.fillStyle = palette.primary;
      ctx.beginPath();
      ctx.arc(shotX, shotY, 4 + pulse * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.secondary;
      ctx.beginPath();
      ctx.arc(shotX, shotY, 2 + pulse, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 3; i++) {
        const trailOffset = i * 0.1;
        const trailProgress = Math.max(0, progress - trailOffset);
        const trailX = startX + (endX - startX) * trailProgress;
        const trailY = startY + (endY - startY) * trailProgress - Math.sin(trailProgress * Math.PI) * 10;
        ctx.fillStyle = colorWithAlpha(battleAnimation.data.monster?.color || '#ffffff', 0.18 - i * 0.04);
        ctx.beginPath();
        ctx.arc(trailX, trailY, 4 - i, 0, Math.PI * 2);
        ctx.fill();
      }

      if (progress > 0.7) {
        const impactPulse = (progress - 0.7) / 0.3;
        ctx.strokeStyle = palette.secondaryGlow;
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.arc(endX, endY, 4 + impactPulse * (10 + i * 6), 0, Math.PI * 2);
          ctx.stroke();
        }
        if (fromEnemy) {
          effects.allyOffsetX = Math.sin(progress * Math.PI * 16) * 2.2;
          effects.allyOffsetY = Math.sin(progress * Math.PI * 10) * 0.8;
        } else {
          effects.enemyOffsetX = Math.sin(progress * Math.PI * 16) * 2.2;
          effects.enemyOffsetY = Math.sin(progress * Math.PI * 10) * 0.8;
        }
      }
    } else if (battleAnimation.type === 'capsule-throw') {
      const startX = layout.allyCenterX - 8;
      const startY = layout.allyCenterY - 6;
      const endX = layout.enemyCenterX;
      const endY = layout.enemyCenterY + 2;
      const throwProgress = Math.min(1, progress / 0.68);
      const arcX = startX + (endX - startX) * throwProgress;
      const arcY = startY + (endY - startY) * throwProgress - Math.sin(throwProgress * Math.PI) * 28;
      const shakePhase = progress > 0.68 ? (progress - 0.68) / 0.32 : 0;

      if (progress <= 0.68) {
        drawPixelSprite(capsuleSprite, { '1': '#7b5cff', '2': '#c6b8ff', '3': '#2d2d2d', '4': '#ffffff' }, arcX - lootHalfSprite, arcY - lootHalfSprite, lootSpriteScale);
      } else {
        const shakeX = endX + Math.sin(shakePhase * Math.PI * 8) * 5;
        const shakeY = endY + Math.sin(shakePhase * Math.PI * 4) * 1.5;
        drawPixelSprite(capsuleSprite, { '1': '#7b5cff', '2': '#c6b8ff', '3': '#2d2d2d', '4': '#ffffff' }, shakeX - lootHalfSprite, shakeY - lootHalfSprite, lootSpriteScale);
        ctx.strokeStyle = battleAnimation.data.success ? 'rgba(214,255,180,0.9)' : 'rgba(255,210,210,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(endX, endY, 8 + shakePhase * 16, 0, Math.PI * 2);
        ctx.stroke();
        effects.enemyOffsetX = Math.sin(shakePhase * Math.PI * 8) * 2;

        const sparkleCount = battleAnimation.data.success ? 5 : 3;
        for (let i = 0; i < sparkleCount; i++) {
          const angle = (Math.PI * 2 * i) / sparkleCount + shakePhase * Math.PI;
          const distance = 10 + shakePhase * 16;
          const sparkleX = endX + Math.cos(angle) * distance;
          const sparkleY = endY + Math.sin(angle) * distance;
          ctx.strokeStyle = battleAnimation.data.success ? 'rgba(225,255,190,0.9)' : 'rgba(255,168,168,0.82)';
          ctx.beginPath();
          ctx.moveTo(sparkleX - 2, sparkleY);
          ctx.lineTo(sparkleX + 2, sparkleY);
          ctx.moveTo(sparkleX, sparkleY - 2);
          ctx.lineTo(sparkleX, sparkleY + 2);
          ctx.stroke();
        }
      }
    }

    return effects;
  }

  function drawBattleResultOverlay() {
    if (!battleResultBanner) return;

    const remaining = battleResultBanner.expiresAt - performance.now();
    if (remaining <= 0) {
      battleResultBanner = null;
      return;
    }

    const titleText = battleResultBanner.title || 'Battle End';
    const detailText = (battleResultBanner.detail || '').slice(0, 34);
    const overlayWidth = 208;
    const overlayHeight = 48;
    const overlayX = Math.floor((viewWidth - overlayWidth) / 2);
    const overlayY = 68;
    const overlayCenterX = overlayX + overlayWidth / 2;

    ctx.fillStyle = 'rgba(20,28,18,0.7)';
    ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight);
    ctx.strokeStyle = 'rgba(240,248,220,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(overlayX, overlayY, overlayWidth, overlayHeight);
    ctx.fillStyle = '#eef8d7';
    ctx.font = canvasFont(15);
    ctx.textAlign = 'center';
    ctx.fillText(titleText, overlayCenterX, overlayY + 18);
    ctx.font = canvasFont(11, '600');
    ctx.fillText(detailText, overlayCenterX, overlayY + 34);
  }

  function drawEvolutionAnimationOverlay() {
    if (!evolutionAnimation) return;

    const elapsed = performance.now() - evolutionAnimation.startedAt;
    const progress = Math.min(1, elapsed / evolutionAnimation.durationMs);
    const pulse = Math.sin(progress * Math.PI * 8) * 0.5 + 0.5;
    const reveal = Math.max(0, Math.min(1, (elapsed - 760) / 780));
    const promptVisible = elapsed >= evolutionAnimation.promptAtMs;
    const fromMonster = evolutionAnimation.from;
    const toMonster = evolutionAnimation.to;

    ctx.fillStyle = 'rgba(10, 16, 22, 0.76)';
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    drawFullCanvasScene((sceneWidth, sceneHeight) => {
      const centerX = sceneWidth / 2;
      const centerY = sceneHeight / 2 - 10;
      const ringRadius = 24 + pulse * 9;
      const outerRadius = 46 + pulse * 16;
      const spriteScale = 4;

      ctx.fillStyle = 'rgba(235, 242, 255, 0.08)';
      ctx.fillRect(0, 0, sceneWidth, sceneHeight);

      ctx.strokeStyle = `rgba(255, 244, 194, ${0.42 + pulse * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(147, 233, 255, ${0.28 + pulse * 0.26})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      for (let index = 0; index < 8; index++) {
        const angle = progress * Math.PI * 2 + (index / 8) * Math.PI * 2;
        const sparkRadius = 34 + pulse * 20;
        const sparkX = centerX + Math.cos(angle) * sparkRadius;
        const sparkY = centerY + Math.sin(angle) * sparkRadius * 0.55;
        ctx.strokeStyle = index % 2 === 0 ? 'rgba(255, 240, 170, 0.85)' : 'rgba(159, 244, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(sparkX - 3, sparkY);
        ctx.lineTo(sparkX + 3, sparkY);
        ctx.moveTo(sparkX, sparkY - 3);
        ctx.lineTo(sparkX, sparkY + 3);
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#eef8ff';
      ctx.font = canvasFont(15);
      ctx.fillText('Evolution', centerX, 34);
      ctx.font = canvasFont(11, '600');
      ctx.fillStyle = '#d8e6f5';
      ctx.fillText(`${fromMonster.name} is changing form...`, centerX, 50);

      const fromAlpha = reveal < 1 ? 1 - reveal * 0.85 : 0.18;
      const toAlpha = Math.max(0, reveal);
      const flashAlpha = Math.max(0, 1 - Math.abs(reveal - 0.5) * 3.2);

      ctx.save();
      ctx.globalAlpha = fromAlpha;
      drawMonsterSprite(fromMonster, centerX - 32, centerY - 34, spriteScale, 'battle');
      ctx.restore();

      if (flashAlpha > 0.02) {
        ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 4, 28 + flashAlpha * 24, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.globalAlpha = toAlpha;
      drawMonsterSprite(toMonster, centerX - 32, centerY - 34, spriteScale, 'battle');
      ctx.restore();

      if (toMonster.shiny) {
        drawShinySparkles(centerX, centerY + 6, 34 + pulse * 4, performance.now() * 0.01);
      }

      ctx.fillStyle = '#eff8d8';
      ctx.font = canvasFont(13, '700');
      ctx.fillText(`${fromMonster.name} -> ${toMonster.name}`, centerX, sceneHeight - 34);

      if (promptVisible) {
        ctx.font = canvasFont(9, '600');
        ctx.fillStyle = pulse > 0.45 ? '#fff4bf' : '#dbe9f5';
        ctx.fillText('Enter, Spacebar, Backspace, or X to continue', centerX, sceneHeight - 18);
      }
    });
  }

  function drawTamerWorld() {
    ctx.clearRect(0, 0, viewWidth, viewHeight);
    ctx.fillStyle = '#d8f0be';
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    if (battleTarget && !encounterTransition) {
      drawBattleScene();
      return;
    }

    if (playerMenuOpen) {
      drawPlayerMenu();
      return;
    }

    if (indexMenuOpen) {
      drawMonsterIndex();
      return;
    }

    if (storageMenuOpen) {
      drawStorageMenu();
      return;
    }

    if (townMenuOpen) {
      drawTownScene();
      return;
    }

    const cameraX = player.x - Math.floor(viewCols / 2);
    const cameraY = player.y - Math.floor(viewRows / 2);

    for (let vy = 0; vy < viewRows; vy++) {
      for (let vx = 0; vx < viewCols; vx++) {
        const worldX = cameraX + vx;
        const worldY = cameraY + vy;
        drawWorldTile(terrainAt(worldX, worldY), mapOffsetX + vx * tile, vy * tile, worldX, worldY);
      }
    }

    const visibleMonsters = [];
    const visibleLoot = [];
    getRelevantChunks(chunkRadius + 1).forEach(chunk => {
      chunk.monsters.forEach(monster => {
        const sx = monster.x - cameraX;
        const sy = monster.y - cameraY;
        if (sx >= 0 && sx < viewCols && sy >= 0 && sy < viewRows) {
          visibleMonsters.push({ monster, sx, sy });
        }
      });

      (chunk.loot || []).forEach(item => {
        const sx = item.x - cameraX;
        const sy = item.y - cameraY;
        if (sx >= 0 && sx < viewCols && sy >= 0 && sy < viewRows) {
          visibleLoot.push({ item, sx, sy });
        }
      });
    });

    visibleLoot.forEach(({ item, sx, sy }) => {
      const px = mapOffsetX + sx * tile;
      const bob = Math.sin((renderTick + sx * 2 + sy * 3) * 0.55) * 1.5;
      const py = sy * tile + bob;
      const isCache = item.type === 'landmark-cache';
      const isDungeonCache = item.type === 'dungeon-cache';
      const isCharm = item.type === 'charm' || item.rewardType === 'charm';
      ctx.fillStyle = isCharm
        ? 'rgba(246,219,112,0.26)'
        : isDungeonCache
          ? 'rgba(127, 214, 255, 0.24)'
        : isCache
          ? 'rgba(208,147,88,0.22)'
          : item.type === 'coins'
            ? 'rgba(201,146,45,0.22)'
            : item.type === 'capsule'
              ? 'rgba(123,92,255,0.2)'
              : 'rgba(86,167,184,0.2)';
      ctx.beginPath();
      ctx.arc(px + tile / 2, py + tile / 2, Math.round(tile * 0.22), 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) {
        const sparkleAngle = ((renderTick * 0.35) + (i * Math.PI)) + (sx + sy) * 0.4;
        const sparkleX = px + tile / 2 + Math.cos(sparkleAngle) * tileUnit(2);
        const sparkleY = py + tile / 2 + Math.sin(sparkleAngle) * tileUnit(2);
        ctx.beginPath();
        ctx.moveTo(sparkleX - 1.5, sparkleY);
        ctx.lineTo(sparkleX + 1.5, sparkleY);
        ctx.moveTo(sparkleX, sparkleY - 1.5);
        ctx.lineTo(sparkleX, sparkleY + 1.5);
        ctx.stroke();
      }

      if (item.type === 'coins') {
        drawPixelSprite(coinSprite, { '1': '#c9922d', '2': '#f2cf67', '3': '#9b6b22' }, px, py, lootSpriteScale);
      } else if (item.type === 'capsule') {
        drawPixelSprite(capsuleSprite, { '1': '#7b5cff', '2': '#c6b8ff', '3': '#2d2d2d', '4': '#ffffff' }, px, py, lootSpriteScale);
      } else if (item.type === 'charm') {
        drawPixelSprite(charmSprite, { '1': '#f6db70', '2': '#fff4c2', '3': '#eaa94a', '4': '#ffffff' }, px, py, lootSpriteScale);
      } else if (item.type === 'dungeon-cache') {
        drawPixelSprite(cacheSprite, {
          '1': '#4d5f7a',
          '2': '#8fd5ff',
          '3': '#b6a26b',
          '4': '#f3f4ff'
        }, px, py, lootSpriteScale);
      } else if (item.type === 'landmark-cache') {
        drawPixelSprite(cacheSprite, {
          '1': '#7a5332',
          '2': '#b68149',
          '3': routeProfileAt(item.x, item.y).palette?.path || '#d8bc78',
          '4': '#e9dcb7'
        }, px, py, lootSpriteScale);
      } else {
        drawPixelSprite(tonicSprite, { '1': '#3f98a5', '2': '#8de0ea', '3': '#53b4c5', '4': '#d9f6fb' }, px, py, lootSpriteScale);
      }
    });

    visibleMonsters.forEach(({ monster, sx, sy }) => {
      const idleBob = Math.sin((renderTick + sx * 3 + sy * 5) * 0.16) * 1.2;
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(mapOffsetX + sx * tile + Math.round(fieldSpriteScale * 4), sy * tile + Math.round(fieldSpriteScale * 12), Math.round(fieldSpriteScale * 8), Math.max(4, Math.round(fieldSpriteScale * 1.5)));
      if (monster.isTrainer) {
        const trainerFrameIndex = performance.now() < (monster.spriteWalkAnimationUntil || 0)
          ? (monster.spriteWalkFrame ?? 1)
          : 1;
        drawTrainerSpriteFrame(monster.trainerSpriteConfig, mapOffsetX + sx * tile, sy * tile + idleBob, fieldSpriteScale, trainerFrameIndex, monster.spriteFacing || 'down');
        drawTypeBadge(typeKeyForMonster(monster), typeShortForMonster(monster), mapOffsetX + sx * tile - 2, sy * tile - 2 + idleBob, { minWidth: 20, height: 9, font: 'bold 7px Trebuchet MS', paddingX: 3 });
      } else if (monster.isNpc) {
        const npcFrameIndex = performance.now() < (monster.spriteWalkAnimationUntil || 0)
          ? (monster.spriteWalkFrame ?? 1)
          : 1;
        drawTrainerSpriteFrame(monster.npcSpriteConfig, mapOffsetX + sx * tile, sy * tile + idleBob, fieldSpriteScale, npcFrameIndex, monster.spriteFacing || 'down');
      } else {
        drawMonsterSprite(monster, mapOffsetX + sx * tile, sy * tile + idleBob, fieldSpriteScale);
        if (monster.shiny) {
          drawShinySparkles(mapOffsetX + sx * tile + tile / 2, sy * tile + tile / 2 + idleBob, Math.round(tile * 0.4), performance.now() * 0.008 + sx * 0.4 + sy * 0.3);
        }
      }
    });

    const playerBob = Math.sin(renderTick * 0.18) * 0.6;
    const playerFrameIndex = performance.now() < playerWalkAnimationUntil ? playerWalkFrame : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(mapOffsetX + Math.floor(viewCols / 2) * tile + Math.round(fieldSpriteScale * 4), Math.floor(viewRows / 2) * tile + Math.round(fieldSpriteScale * 12), Math.round(fieldSpriteScale * 8), Math.max(4, Math.round(fieldSpriteScale * 1.5)));
    const playerSpriteConfig = selectedPlayerSpriteConfig();
    drawPlayerSpriteFrame(playerSpriteConfig, mapOffsetX + Math.floor(viewCols / 2) * tile, Math.floor(viewRows / 2) * tile + playerBob, fieldSpriteScale, playerFrameIndex, playerFacing);

    drawFishingAnimation(cameraX, cameraY);

    ctx.fillStyle = 'rgba(34,50,20,0.74)';
    ctx.fillRect(0, 0, viewWidth, 18);
    ctx.fillStyle = '#eef8d7';
    ctx.font = canvasFont(11);
    ctx.textAlign = 'left';
    ctx.fillText(routeLabelAt(), 8, 12);
    ctx.textAlign = 'center';
    ctx.fillText(`Badges ${badgeCount()}/${routeProfiles.length}`, viewWidth / 2, 12);
    ctx.textAlign = 'right';
    ctx.fillText(nextTownshipHint(), viewWidth - 8, 12);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, viewWidth, viewHeight);
      ctx.fillStyle = '#fff';
      ctx.font = canvasFont(24);
      ctx.textAlign = 'center';
      ctx.fillText('Party Wiped', viewWidth / 2, viewHeight / 2 - 12);
      ctx.font = canvasFont(14, '600');
      ctx.fillText('Enter/Spacebar to start a new hunt', viewWidth / 2, viewHeight / 2 + 14);
    }

    drawBattleResultOverlay();

    drawEvolutionAnimationOverlay();
    drawEncounterTransitionOverlay();
  }

  function drawTownScene() {
    const town = activeTownship || getTownshipAt() || townships[0];
    const profile = town?.profile || routeProfiles[0];
    const panelFill = 'rgba(255,255,255,0.95)';
    const landmark = landmarkSprites[profile.landmark];
    const boss = profile.boss;
    const bossState = bossStateForTown(town);
    const visibleShopRows = 5;
    const shopListStart = Math.max(0, Math.min(
      townSelection - Math.floor(visibleShopRows / 2),
      Math.max(0, shopItems.length - visibleShopRows)
    ));
    const visibleShopItems = shopItems.slice(shopListStart, shopListStart + visibleShopRows);
    drawFramedScene((sceneWidth, sceneHeight) => {
      const panelX = 12;
      const panelY = 10;
      const panelWidth = sceneWidth - 24;
      const panelHeight = sceneHeight - 20;
      const footerHeight = 42;
      const listTop = 70;
      const listRowHeight = 18;
      const listBoxX = panelX + 12;
      const listBoxWidth = panelWidth - 24;
      const headerText = boss
        ? `${boss.badge} Badge · ${boss.trainer} · ${bossState.short}`
        : `Coins ${coins}  Cap ${capsules}/${maxCapsules}  Rods ${rods}`;
      ctx.fillStyle = profile.palette?.plain || '#d7efc3';
      ctx.fillRect(0, 0, sceneWidth, sceneHeight);
      ctx.fillStyle = profile.palette?.grass || '#8fc16d';
      ctx.fillRect(0, 134, sceneWidth, 74);
      ctx.fillStyle = profile.palette?.path || '#6e9d51';
      ctx.fillRect(0, 148, sceneWidth, 60);

      ctx.fillStyle = '#eadfbc';
      ctx.fillRect(28, 58, 110, 82);
      ctx.fillRect(176, 74, 96, 66);
      ctx.fillStyle = '#cc6a54';
      ctx.fillRect(20, 44, 126, 24);
      ctx.fillRect(168, 62, 112, 18);
      ctx.fillStyle = '#39462e';
      ctx.fillRect(72, 105, 22, 35);
      ctx.fillRect(208, 104, 28, 36);
      ctx.fillStyle = '#9cc8f2';
      ctx.fillRect(42, 78, 20, 16);
      ctx.fillRect(102, 78, 20, 16);
      ctx.fillRect(188, 88, 18, 14);
      ctx.fillRect(242, 88, 18, 14);

      ctx.fillStyle = panelFill;
      ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
      ctx.strokeStyle = '#465538';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
      ctx.fillStyle = 'rgba(207,229,184,0.38)';
      ctx.fillRect(panelX + 10, 18, panelWidth - 20, 34);
      ctx.fillStyle = 'rgba(70,85,56,0.12)';
      ctx.fillRect(listBoxX, 60, listBoxWidth, 92);

      ctx.fillStyle = '#465538';
      ctx.font = canvasFont(15);
      ctx.textAlign = 'center';
      ctx.fillText(town ? town.name : 'Town Services', sceneWidth / 2, 32);
      ctx.font = canvasFont(9, '600');
      wrapCanvasText(headerText, panelWidth - 52, 2).forEach((line, index) => {
        ctx.fillText(line, sceneWidth / 2, 44 + index * 8);
      });

      drawPixelSprite(capsuleSprite, { '1': '#7b5cff', '2': '#c6b8ff', '3': '#2d2d2d', '4': '#ffffff' }, 34, 26, 1);
      drawPixelSprite(coinSprite, { '1': '#c9922d', '2': '#f2cf67', '3': '#9b6b22' }, 262, 26, 1);
      if (landmark) {
        drawPixelSprite(landmark.sprite, landmark.palette, 152, 45, 0.5);
      }

      visibleShopItems.forEach((item, offset) => {
        const index = shopListStart + offset;
        const y = listTop + offset * listRowHeight;
        if (index === townSelection) {
          ctx.fillStyle = colorWithAlpha('#cfe5b8', 0.8 + Math.sin(performance.now() * 0.01) * 0.08);
          ctx.fillRect(listBoxX + 2, y - 8, listBoxWidth - 8, 17);
        }
        ctx.fillStyle = '#39462e';
        ctx.font = canvasFont(9, '600');
        ctx.textAlign = 'left';
        ctx.fillText(fitCanvasText(item.label, listBoxWidth - 84), listBoxX + 10, y);
        ctx.textAlign = 'right';
        ctx.font = canvasFont(9, '700');
        ctx.fillText(item.cost
          ? `${item.cost}c`
          : item.key === 'leave'
            ? 'Exit'
            : item.key === 'boss'
              ? bossState.short
              : 'Free', listBoxX + listBoxWidth - 8, y);
      });

      if (shopListStart > 0) {
        ctx.fillStyle = '#5c724a';
        ctx.font = canvasFont(9);
        ctx.textAlign = 'right';
        ctx.fillText('^', listBoxX + listBoxWidth - 2, 66);
      }
      if (shopListStart + visibleShopRows < shopItems.length) {
        ctx.fillStyle = '#5c724a';
        ctx.font = canvasFont(9);
        ctx.textAlign = 'right';
        ctx.fillText('v', listBoxX + listBoxWidth - 2, 151);
      }

      const footerDetail = currentTownSelectionDetail();
      const footerLines = wrapCanvasText(footerDetail || 'Wheel/Prev/Next: Browse town services', panelWidth - 24, 3);
      ctx.fillStyle = 'rgba(45,56,34,0.92)';
      ctx.fillRect(panelX, panelY + panelHeight - footerHeight, panelWidth, footerHeight);
      ctx.fillStyle = '#eff7df';
      ctx.textAlign = 'center';
      ctx.font = canvasFont(7, '600');
      footerLines.forEach((line, index) => {
        ctx.fillText(line, sceneWidth / 2, panelY + panelHeight - footerHeight + 8 + index * 8);
      });
      ctx.font = canvasFont(7);
      ctx.fillText('Up/Down Scroll  |  Enter/Space Select  |  Backspace/X Exit', sceneWidth / 2, panelY + panelHeight - 6);
    });
  }

  function drawMonsterIndex() {
    const species = speciesList[indexSelection];
    const dex = monsterDex[species.name] || { seen: false, caught: false, routes: [] };
    const knownRoutes = dex.routes.length ? dex.routes : routesForSpecies(species.name);
    const rarity = routeProfiles.flatMap(profile => ([...(profile.pool || []), ...(profile.specials || []), ...(profile.fishPool || []), ...(profile.fishSpecials || [])]))
      .find(entry => entry.species === species.name)?.rarity || 'common';
    const passiveText = passiveTraitText(species);
    const typeText = typeLabelForMonster(species);
    const moveProgression = moveProgressionForMonster({ species: species.name, name: species.name, level: 1 });

    drawFramedScene((sceneWidth, sceneHeight) => {
      const panelX = 10;
      const panelY = 10;
      const panelWidth = sceneWidth - 20;
      const panelHeight = sceneHeight - 20;
      const spriteX = 22;
      const spriteY = 62;
      const spriteScale = 2;
      const infoX = 72;
      const infoTop = 62;
      const infoGap = 8;
      const infoColumnGap = 10;
      const infoColumnWidth = 94;
      const rightInfoX = infoX + infoColumnWidth + infoColumnGap;
      const lowerBoxX = 20;
      const lowerBoxWidth = panelWidth - 20;
      ctx.fillStyle = '#eef4df';
      ctx.fillRect(0, 0, sceneWidth, sceneHeight);
      ctx.fillStyle = '#d9e6bc';
      ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
      ctx.strokeStyle = '#5a7044';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(panelX + 8, 18, panelWidth - 16, 30);

      ctx.fillStyle = '#415435';
      ctx.font = canvasFont(15);
      ctx.textAlign = 'center';
      ctx.fillText('Monster Index', sceneWidth / 2, 30);
      ctx.font = canvasFont(9, '600');
      wrapCanvasText(`${species.name}  |  ${(rarityMeta[rarity] || rarityMeta.common).label}`, panelWidth - 28, 2).forEach((line, index) => {
        ctx.fillText(line, sceneWidth / 2, 42 + index * 8);
      });
      drawTypeBadge(typeKeyForMonster(species), typeLabelForMonster(species), panelX + panelWidth - 58, 20, { minWidth: 48, height: 12, font: canvasFont(7) });

      ctx.fillStyle = 'rgba(255,255,255,0.84)';
      ctx.fillRect(18, 56, 40, 50);
      ctx.strokeStyle = '#6a7f57';
      ctx.lineWidth = 1;
      ctx.strokeRect(18, 56, 40, 50);
      drawMonsterSprite({ ...species, sprite: species.sprite }, spriteX, spriteY, spriteScale, 'battle');

      ctx.textAlign = 'left';
      ctx.fillStyle = '#415435';
      ctx.font = canvasFont(8, '700');
      ctx.fillText('Dex Data', infoX, infoTop);
      ctx.fillText('Combat Data', rightInfoX, infoTop);

      ctx.font = canvasFont(8, '600');
      ctx.fillText(`Seen: ${dex.seen ? 'Yes' : 'No'}`, infoX, infoTop + infoGap * 2);
      ctx.fillText(`Caught: ${dex.caught ? 'Yes' : 'No'}`, infoX, infoTop + infoGap * 3);
      ctx.fillText(`Type: ${fitCanvasText(typeText, infoColumnWidth - 18)}`, infoX, infoTop + infoGap * 4);
      ctx.fillText(`Routes: ${knownRoutes.length}`, infoX, infoTop + infoGap * 5);

      ctx.fillText(`Base HP: ${species.hp}`, rightInfoX, infoTop + infoGap * 2);
      ctx.fillText(`Atk: ${species.atkMin}-${species.atkMax}`, rightInfoX, infoTop + infoGap * 3);
      ctx.fillText(`Rarity: ${(rarityMeta[rarity] || rarityMeta.common).label}`, rightInfoX, infoTop + infoGap * 4);
      ctx.fillText(`Trait: ${fitCanvasText(passiveTraitShort(species), infoColumnWidth - 18)}`, rightInfoX, infoTop + infoGap * 5);

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(lowerBoxX, 112, lowerBoxWidth, 30);
      ctx.fillRect(lowerBoxX, 146, lowerBoxWidth, 34);
      ctx.strokeStyle = '#6a7f57';
      ctx.strokeRect(lowerBoxX, 112, lowerBoxWidth, 30);
      ctx.strokeRect(lowerBoxX, 146, lowerBoxWidth, 34);

      ctx.fillStyle = '#415435';
      ctx.font = canvasFont(8, '700');
      ctx.fillText('Passive', lowerBoxX + 6, 121);
      ctx.font = canvasFont(7, '500');
      const passiveLines = wrapCanvasText(passiveText, lowerBoxWidth - 12, 3);
      passiveLines.forEach((line, index) => {
        ctx.fillText(line.trim(), lowerBoxX + 6, 129 + index * 7);
      });

      ctx.fillStyle = '#415435';
      ctx.font = canvasFont(8, '700');
      ctx.fillText('Move Growth', lowerBoxX + 6, 155);
      ctx.font = canvasFont(6, '500');
      moveProgression.slice(0, 4).forEach((entry, index) => {
        const moveLabel = `Lv${entry.unlockLevel} ${entry.move.name}`;
        ctx.fillText(fitCanvasText(moveLabel, lowerBoxWidth - 12), lowerBoxX + 6, 162 + index * 4.5);
      });

      ctx.fillStyle = 'rgba(45,56,34,0.92)';
      ctx.fillRect(panelX, panelY + panelHeight - 24, panelWidth, 24);
      ctx.fillStyle = '#eff7df';
      ctx.textAlign = 'center';
      ctx.font = canvasFont(9, '600');
      ctx.fillText('Up/Down Browse  |  Enter/Space Back  |  X Close', sceneWidth / 2, panelY + panelHeight - 8);
    });
  }

  function drawStorageMenu() {
    const uiFont = canvasUiFont;
    const selectedMonster = selectedStorageMonster();
    const activeStart = Math.max(0, Math.min(storagePartySelection, Math.max(0, party.length - 5)));
    const storedStart = Math.max(0, Math.min(storageBoxSelection, Math.max(0, storedMonsters.length - 5)));

    drawFramedScene((sceneWidth, sceneHeight) => {
      const panelX = 10;
      const panelY = 10;
      const panelWidth = sceneWidth - 20;
      const panelHeight = sceneHeight - 20;
      const infoWidth = 58;
      const columnGap = 8;
      const columnWidth = Math.floor((panelWidth - 16 - infoWidth - columnGap * 2) / 2);
      const leftX = 18;
      const rightX = leftX + columnWidth + columnGap;
      const infoX = rightX + columnWidth + columnGap;
      const rowsTop = 84;
      const rowHeight = 17;
      ctx.fillStyle = '#edf3e2';
      ctx.fillRect(0, 0, sceneWidth, sceneHeight);
      ctx.fillStyle = '#d8e5cd';
      ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
      ctx.strokeStyle = '#5a7044';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

      ctx.fillStyle = '#415435';
      ctx.font = canvasFont(12, '600', uiFont);
      ctx.textAlign = 'center';
      ctx.fillText('Storage Box', sceneWidth / 2, 26);
      ctx.font = canvasFont(8 , '500', uiFont);
      ctx.fillText(`Party ${party.length}/${activePartyLimit}  •  Stored ${storedMonsters.length}`, sceneWidth / 2, 41);

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(leftX, 50, columnWidth, 104);
      ctx.fillRect(rightX, 50, columnWidth, 104);
      ctx.fillRect(infoX, 50, infoWidth, 104);
      ctx.strokeStyle = '#6a7f57';
      ctx.strokeRect(leftX, 50, columnWidth, 104);
      ctx.strokeRect(rightX, 50, columnWidth, 104);
      ctx.strokeRect(infoX, 50, infoWidth, 104);

      ctx.fillStyle = '#415435';
      ctx.font = canvasFont(7, '400', uiFont);
      ctx.textAlign = 'center';
      ctx.fillText('Active Party', leftX + columnWidth / 2, 62);
      ctx.fillText('Storage Box', rightX + columnWidth / 2, 62);
      ctx.fillText('Info', infoX + infoWidth / 2, 62);

      party.slice(activeStart, activeStart + 5).forEach((monster, offset) => {
        const index = activeStart + offset;
        const rowY = rowsTop + offset * rowHeight;
        const highlighted = storageMenuColumn === 'party' && index === storagePartySelection;
        const pending = storageSwapPending?.source === 'party' && storageSwapPending.index === index;
        ctx.fillStyle = pending ? '#f6e29d' : highlighted ? '#d5ebb9' : 'rgba(81,100,69,0.08)';
        ctx.fillRect(leftX + 4, rowY - 10, columnWidth - 8, 15);
        ctx.fillStyle = '#304027';
        ctx.font = canvasFont(6, '400', uiFont);
        ctx.textAlign = 'left';
        ctx.fillText(fitCanvasText(`${index === activeIndex ? '> ' : ''}${monsterDisplayName(monster)}`, columnWidth - 28), leftX + 6, rowY - 1);
        ctx.textAlign = 'right';
        ctx.fillText(`Lv${monster.level}`, leftX + columnWidth - 6, rowY - 1);
      });

      storedMonsters.slice(storedStart, storedStart + 5).forEach((monster, offset) => {
        const index = storedStart + offset;
        const rowY = rowsTop + offset * rowHeight;
        const highlighted = storageMenuColumn === 'storage' && index === storageBoxSelection;
        const pending = storageSwapPending?.source === 'storage' && storageSwapPending.index === index;
        ctx.fillStyle = pending ? '#f6e29d' : highlighted ? '#d5ebb9' : 'rgba(81,100,69,0.08)';
        ctx.fillRect(rightX + 4, rowY - 10, columnWidth - 8, 15);
        ctx.fillStyle = '#304027';
        ctx.font = canvasFont(6, '400', uiFont);
        ctx.textAlign = 'left';
        ctx.fillText(fitCanvasText(monsterDisplayName(monster), columnWidth - 28), rightX + 6, rowY - 1);
        ctx.textAlign = 'right';
        ctx.fillText(`Lv${monster.level}`, rightX + columnWidth - 6, rowY - 1);
      });

      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.fillRect(18, 160, 276, 18);
      ctx.strokeStyle = '#6a7f57';
      ctx.strokeRect(18, 160, 276, 18);
      const pendingMonster = storageSwapPending
        ? (storageSwapPending.source === 'party'
          ? party[storageSwapPending.index]
          : storedMonsters[storageSwapPending.index])
        : null;
      if (selectedMonster) {
        drawMonsterSprite(selectedMonster, infoX + 14, 80, 2, 'battle');
        if (selectedMonster.shiny) {
          const iconCx = infoX + infoWidth - 9;
          const iconCy = 73;
          ctx.fillStyle = 'rgba(255, 240, 156, 0.95)';
          ctx.fillRect(iconCx - 4, iconCy - 4, 8, 8);
          ctx.strokeStyle = '#9f8742';
          ctx.lineWidth = 1;
          ctx.strokeRect(iconCx - 4, iconCy - 4, 8, 8);
          ctx.strokeStyle = '#fff6c7';
          ctx.beginPath();
          ctx.moveTo(iconCx - 2, iconCy);
          ctx.lineTo(iconCx + 2, iconCy);
          ctx.moveTo(iconCx, iconCy - 2);
          ctx.lineTo(iconCx, iconCy + 2);
          ctx.stroke();
          ctx.fillStyle = '#8b6f1f';
          ctx.font = canvasFont(5, '700', uiFont);
          ctx.textAlign = 'center';
          ctx.fillText('*', iconCx, iconCy + 2);
        }
        ctx.fillStyle = '#415435';
        ctx.font = canvasFont(6, '400', uiFont);
        ctx.textAlign = 'center';
        ctx.fillText(fitCanvasText(monsterDisplayName(selectedMonster), infoWidth - 6), infoX + infoWidth / 2, 74);
        ctx.font = canvasFont(6, '400', uiFont);
        ctx.fillText(`Lv ${selectedMonster.level}`, infoX + infoWidth / 2, 112);
        ctx.fillText(fitCanvasText(typeShortForMonster(selectedMonster), infoWidth - 8), infoX + infoWidth / 2, 121);
        ctx.fillText(fitCanvasText(`HP ${selectedMonster.hp}/${selectedMonster.maxHp}`, infoWidth - 8), infoX + infoWidth / 2, 130);
        ctx.fillText(fitCanvasText(`ATK ${selectedMonster.atkMin}-${selectedMonster.atkMax}`, infoWidth - 8), infoX + infoWidth / 2, 139);

        ctx.textAlign = 'center';
        ctx.fillText(
          fitCanvasText(
            storageSwapPending && pendingMonster
              ? `Swap: ${monsterDisplayName(pendingMonster)} -> ${storageMenuColumn === 'party' ? 'pick party target' : 'pick storage target'}`
              : `${passiveTraitShort(selectedMonster)}  •  ${selectedMonster.status ? statusShortLabel(selectedMonster) : 'OK'}`,
            262
          ),
          sceneWidth / 2,
          171
        );
      } else {
        ctx.fillStyle = '#5a7044';
        ctx.font = canvasFont(6, '400', uiFont);
        ctx.textAlign = 'center';
        ctx.fillText('Select a', infoX + infoWidth / 2, 102);
        ctx.fillText('monster', infoX + infoWidth / 2, 111);
        ctx.fillText('to view', infoX + infoWidth / 2, 120);
        ctx.fillText('details', infoX + infoWidth / 2, 129);
      }

      ctx.fillStyle = 'rgba(45,56,34,0.92)';
      ctx.fillRect(18, 180, 276, 18);
      ctx.fillStyle = '#eff7df';
      ctx.textAlign = 'center';
      ctx.font = canvasFont(6, '400', uiFont);
      if (storageSwapPending?.source === 'party') {
        ctx.fillText('Left/Right column  •  Up/Down row  •  Enter swap  •  X cancel', sceneWidth / 2, 191);
      } else if (storageSwapPending?.source === 'storage') {
        ctx.fillText('Left/Right column  •  Up/Down row  •  Enter swap  •  X cancel', sceneWidth / 2, 191);
      } else if (storageMenuColumn === 'storage' && party.length < activePartyLimit) {
        ctx.fillText('Left/Right column  •  Up/Down row  •  Enter withdraw  •  X back', sceneWidth / 2, 191);
      } else if (storageMenuColumn === 'party') {
        ctx.fillText('Left/Right column  •  Up/Down row  •  Enter box  •  X back', sceneWidth / 2, 191);
      } else {
        ctx.fillText('Left/Right column  •  Up/Down row  •  Enter select  •  X back', sceneWidth / 2, 191);
      }
    });
  }

  function drawPlayerMenu() {
    const monster = selectedPartyMonster();
    const actions = playerMenuActions(monster);
    const selectedAction = actions[playerMenuActionSelection] || actions[0];
    const currentListIndex = playerMenuMode === 'swap' ? playerMenuSwapSelection : playerMenuSelection;
    const listStart = Math.max(0, Math.min(currentListIndex, Math.max(0, party.length - 5)));
    const uiFont = canvasUiFont;
    const drawMeter = (x, y, width, height, fillRatio, fillColor, backColor = 'rgba(57,80,57,0.16)', borderColor = 'rgba(63,87,63,0.55)') => {
      const clamped = Math.max(0, Math.min(1, fillRatio || 0));
      ctx.fillStyle = backColor;
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = fillColor;
      ctx.fillRect(x + 1, y + 1, Math.max(0, Math.round((width - 2) * clamped)), Math.max(0, height - 2));
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
    };

    drawFramedScene((sceneWidth, sceneHeight) => {
      const listWidth = 104;
      const detailX = 126;
      const detailWidth = sceneWidth - detailX - 18;
      const bgGradient = ctx.createLinearGradient(0, 0, 0, sceneHeight);
      bgGradient.addColorStop(0, '#edf4e4');
      bgGradient.addColorStop(1, '#c9dcb8');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, sceneWidth, sceneHeight);
      ctx.fillStyle = 'rgba(116,149,94,0.18)';
      for (let y = 0; y < sceneHeight; y += 12) {
        ctx.fillRect(0, y, sceneWidth, 5);
      }

      ctx.fillStyle = '#d8e4cf';
      ctx.fillRect(8, 8, sceneWidth - 16, sceneHeight - 16);
      ctx.fillStyle = '#5b7247';
      ctx.fillRect(8, 8, sceneWidth - 16, 6);
      ctx.fillRect(8, sceneHeight - 14, sceneWidth - 16, 6);
      ctx.fillRect(8, 8, 6, sceneHeight - 16);
      ctx.fillRect(sceneWidth - 14, 8, 6, sceneHeight - 16);
      ctx.strokeStyle = '#516445';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, sceneWidth - 16, sceneHeight - 16);
      ctx.strokeStyle = 'rgba(247,252,238,0.8)';
      ctx.strokeRect(13, 13, sceneWidth - 26, sceneHeight - 26);

      [[20, 20], [sceneWidth - 20, 20], [20, sceneHeight - 20], [sceneWidth - 20, sceneHeight - 20]].forEach(([cx, cy]) => {
        ctx.fillStyle = '#f4f7ec';
        ctx.fillRect(cx - 2, cy - 2, 4, 4);
        ctx.fillStyle = '#7a9460';
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
      });

      ctx.fillStyle = '#395039';
      ctx.font = canvasFont(16, '700', uiFont);
      ctx.textAlign = 'center';
      ctx.fillText('Party', sceneWidth / 2, 28);
      ctx.font = canvasFont(9, '600', uiFont);
      wrapCanvasText(`Party ${party.length}  •  Tonics ${tonics}  •  Lead ${monsterDisplayName(activeMonster()) || 'None'}`, 246, 2).forEach((line, index) => {
        ctx.fillText(line, sceneWidth / 2, 40 + index * 8);
      });

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(16, 48, listWidth, 120);
      ctx.fillRect(detailX, 48, detailWidth, 120);
      ctx.strokeStyle = '#6a7f57';
      ctx.strokeRect(16, 48, listWidth, 120);
      ctx.strokeRect(detailX, 48, detailWidth, 120);

      ctx.fillStyle = '#395039';
      ctx.font = canvasFont(11, '700', uiFont);
      ctx.textAlign = 'left';
      ctx.fillText(playerMenuMode === 'swap' ? 'Swap Target' : 'Party List', 24, 62);

      party.slice(listStart, listStart + 5).forEach((entry, offset) => {
        const index = listStart + offset;
        const rowY = 80 + offset * 18;
        const highlighted = playerMenuMode === 'swap' ? index === playerMenuSwapSelection : index === playerMenuSelection;
        ctx.fillStyle = highlighted ? '#d5ebb9' : 'rgba(81,100,69,0.08)';
        ctx.fillRect(20, rowY - 11, listWidth - 8, 18);
        ctx.fillStyle = highlighted ? '#263926' : '#395039';
        ctx.font = canvasFont(9, '700', uiFont);
        ctx.fillText(fitCanvasText(`${index === activeIndex ? '> ' : ''}${monsterDisplayName(entry)}`, listWidth - 30), 24, rowY - 1);
        ctx.textAlign = 'right';
        ctx.fillText(`Lv${entry.level}`, 16 + listWidth - 8, rowY - 1);
        ctx.textAlign = 'left';
        ctx.font = canvasFont(8, '500', uiFont);
        ctx.fillStyle = '#546954';
        ctx.fillText(fitCanvasText(`HP ${entry.hp}/${entry.maxHp}${statusText(entry)}`, listWidth - 16), 24, rowY + 7);
      });

      if (monster) {
        const spriteX = detailX + 6;
        const spriteY = 54;
        const metaX = detailX + 42;
        const statsX = detailX + 6;
        const sideX = detailX + 78;
        const moveColumnGap = 42;
        drawMonsterSprite(monster, spriteX, spriteY, 2, 'battle');
        drawTypeBadge(typeKeyForMonster(monster), typeLabelForMonster(monster), detailX + detailWidth - 56, 54, { minWidth: 42, height: 11, font: canvasFont(6) });
        ctx.fillStyle = '#395039';
        ctx.font = canvasFont(10, '700', uiFont);
        ctx.textAlign = 'left';
        ctx.fillText(fitCanvasText(`${monsterDisplayName(monster)}${monster.shiny ? ' *' : ''}`, 74), metaX, 63);

        ctx.font = canvasFont(7, '500', uiFont);
        ctx.fillStyle = '#4e624e';
        ctx.fillText(fitCanvasText(`Species: ${monster.species}`, 104), metaX, 73);
        ctx.fillText(fitCanvasText(`Status: ${statusShortLabel(monster) || 'OK'}`, 104), metaX, 81);
        ctx.fillText(fitCanvasText(`Trait: ${passiveTraitShort(monster)}`, 104), metaX, 89);

        const hpRatio = monster.maxHp > 0 ? monster.hp / monster.maxHp : 0;
        const xpRatio = monster.xpToNext > 0 ? monster.xp / monster.xpToNext : 0;
        ctx.font = canvasFont(7, '700', uiFont);
        ctx.fillStyle = '#395039';
        ctx.fillText('HP', metaX, 98);
        ctx.fillText('XP', metaX + 52, 98);
        drawMeter(metaX, 101, 42, 6, hpRatio, '#da6f6f');
        drawMeter(metaX + 52, 101, 42, 6, xpRatio, '#6d96d7');

        const statLines = [
          `Lv ${monster.level}`,
          `HP ${monster.hp}/${monster.maxHp}`,
          `XP ${monster.xp}/${monster.xpToNext}`,
          `ATK ${monster.atkMin}-${monster.atkMax}`
        ];
        ctx.font = canvasFont(7, '700', uiFont);
        ctx.fillStyle = '#395039';
        ctx.fillText('Stats', statsX, 116);
        statLines.forEach((line, index) => {
          ctx.fillText(fitCanvasText(line, 74), statsX, 124 + index * 8);
        });

        ctx.font = canvasFont(7, '700', uiFont);
        ctx.fillText('Trait', sideX, 116);
        ctx.font = canvasFont(7, '500', uiFont);
        ctx.fillStyle = '#4e624e';
        wrapCanvasText(passiveTraitText(monster), 80, 2).forEach((line, index) => {
          ctx.fillText(line, sideX, 124 + index * 8);
        });

        ctx.font = canvasFont(7, '700', uiFont);
        ctx.fillStyle = '#395039';
        ctx.fillText('Moves', sideX, 146);
        ctx.font = canvasFont(6, '500', uiFont);
        attacksForMonster(monster).slice(0, 4).forEach((move, index) => {
          const column = index % 2;
          const row = Math.floor(index / 2);
          ctx.fillText(
            fitCanvasText(`${index + 1}. ${move.name}`, 40),
            sideX + column * moveColumnGap,
            154 + row * 7
          );
        });
      }

      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.fillRect(16, 172, 278, 26);
      ctx.strokeStyle = '#6a7f57';
      ctx.strokeRect(16, 172, 278, 26);
      ctx.fillStyle = '#395039';
      ctx.font = canvasFont(8, '700', uiFont);
      ctx.textAlign = 'center';

      if (playerMenuMode === 'actions') {
        const actionLines = wrapCanvasText(`${selectedAction?.label || 'Action'} • ${selectedAction?.detail || ''}`, 248, 2);
        actionLines.forEach((line, index) => {
          ctx.fillText(line, sceneWidth / 2, 180 + index * 8);
        });
        ctx.fillText('Up/Down Scroll Actions  |  Enter/Spacebar Confirm  |  Backspace/X Cancel', sceneWidth / 2, 195);
      } else if (playerMenuMode === 'swap') {
        ctx.fillText('Choose who trades positions with the selected monster.', sceneWidth / 2, 181);
        ctx.fillText('Up/Down Target  |  Enter/Spacebar Swap  |  Backspace/X Cancel', sceneWidth / 2, 191);
      } else {
        ctx.fillText('Up/Down Scroll  |  Enter/Spacebar Actions', sceneWidth / 2, 181);
        ctx.fillText('Backspace/X Close  |  > Marks the Lead Monster', sceneWidth / 2, 191);
      }
    });
  }

  function drawBattleScene() {
    const lead = activeMonster();
    const layout = battleLayout();
    const now = performance.now();
    const battleSceneSpriteScale = 3;
    const enemyIdle = Math.sin(now * 0.005 + 0.8) * 1.3;
    const allyIdle = Math.sin(now * 0.005 + 2.4) * 1.1;
    const enemyNameText = battleTarget.isBoss
      ? `${battleTarget.trainerName} · ${battleTarget.name} Lv${battleTarget.level}${statusText(battleTarget)}`
      : `${shinyLabel(battleTarget)}${(rarityMeta[battleTarget.rarity] || rarityMeta.common).label} ${battleTarget.name} Lv${battleTarget.level}${statusText(battleTarget)}`;
    const enemyHpText = `HP ${battleTarget.hp}/${battleTarget.maxHp}`;
    const enemyTraitText = `${typeShortForMonster(battleTarget)} · ${passiveTraitShort(battleTarget)}`;
    const leadNameText = `${lead ? `${shinyLabel(lead)}${monsterDisplayName(lead)}` : 'No Lead'} Lv${lead ? lead.level : 0}${lead ? statusText(lead) : ''}`;
    const leadHpText = `HP ${lead ? lead.hp : 0}/${lead ? lead.maxHp : 0}`;
    const leadTraitText = lead ? `${typeShortForMonster(lead)} · ${passiveTraitShort(lead)}` : 'No Trait';

    drawFullCanvasScene((sceneWidth, sceneHeight) => {
      const battleFooterHeight = 50;
      const battleFooterY = sceneHeight - battleFooterHeight;
      const battleFooterInnerX = 10;
      const battleFooterInnerWidth = sceneWidth - battleFooterInnerX * 2;
      ctx.fillStyle = '#d6efbf';
      ctx.fillRect(0, 0, sceneWidth, sceneHeight);
      ctx.fillStyle = '#afd67e';
      ctx.fillRect(0, 130, sceneWidth, 78);
      ctx.fillStyle = '#96c36f';
      ctx.fillRect(0, 145, sceneWidth, 63);

      ctx.font = canvasFont(10, '600');
      const panelPadding = 4;
      const panelMinWidth = 118;
      const panelMaxWidth = 154;
      const enemyPanelWidth = Math.max(
        panelMinWidth,
        Math.min(panelMaxWidth, Math.ceil(Math.max(ctx.measureText(enemyNameText).width, ctx.measureText(enemyHpText).width)) + panelPadding * 2)
      );
      const leadPanelWidth = Math.max(
        panelMinWidth,
        Math.min(panelMaxWidth, Math.ceil(Math.max(ctx.measureText(leadNameText).width, ctx.measureText(leadHpText).width)) + panelPadding * 2)
      );
      const enemyPanelX = 12;
      const leadPanelX = sceneWidth - 14 - leadPanelWidth;
      const wrapBattleText = (text, maxWidth, maxLines = Infinity) => {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let current = '';

        words.forEach(word => {
          const next = current ? `${current} ${word}` : word;
          if (!current || ctx.measureText(next).width <= maxWidth) {
            current = next;
            return;
          }
          lines.push(current);
          current = word;
        });

        if (current) lines.push(current);
        return lines.slice(0, maxLines);
      };
      const enemyNameLines = wrapBattleText(enemyNameText, enemyPanelWidth - 48, 2);
      const enemyTraitLines = wrapBattleText(enemyTraitText, enemyPanelWidth - 48, 2);
      const leadNameLines = wrapBattleText(leadNameText, leadPanelWidth - 48, 2);
      const leadTraitLines = wrapBattleText(leadTraitText, leadPanelWidth - 48, 2);
      const panelLineHeight = 8;
      const panelTopPadding = 4;
      const enemyPanelHeight = panelTopPadding + (enemyNameLines.length * panelLineHeight) + panelLineHeight + (enemyTraitLines.length * panelLineHeight) + 4;
      const leadPanelHeight = panelTopPadding + (leadNameLines.length * panelLineHeight) + panelLineHeight + (leadTraitLines.length * panelLineHeight) + 4;

          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.beginPath();
          ctx.ellipse(layout.enemyCenterX + 10, layout.enemyCenterY + 24, 28 + Math.sin(now * 0.004) * 1.5, 8, 0, 0, Math.PI * 2);
          ctx.ellipse(layout.allyCenterX + 16, layout.allyCenterY + 28, 26 + Math.sin(now * 0.004 + 1.2) * 1.2, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          const animationEffects = drawBattleAnimationEffects(layout);

          drawMonsterSprite(battleTarget, layout.enemyX + animationEffects.enemyOffsetX + 8, layout.enemyY + animationEffects.enemyOffsetY + enemyIdle - 4, battleSceneSpriteScale, 'battle');
          if (battleTarget.shiny) {
            drawShinySparkles(layout.enemyCenterX, layout.enemyCenterY - 2, 25, now * 0.006);
          }
          if (lead) {
            drawMonsterSprite(lead, layout.allyX + animationEffects.allyOffsetX + 10, layout.allyY + animationEffects.allyOffsetY + allyIdle - 4, battleSceneSpriteScale, 'battle');
            if (lead.shiny) {
              drawShinySparkles(layout.allyCenterX, layout.allyCenterY, 20, now * 0.006 + 1.2);
            }
          }

          ctx.fillStyle = '#eef7df';
          ctx.fillRect(enemyPanelX, 14, enemyPanelWidth, enemyPanelHeight);
          ctx.fillRect(leadPanelX, 98, leadPanelWidth, leadPanelHeight);
          ctx.strokeStyle = '#39462e';
          ctx.lineWidth = 1;
          ctx.strokeRect(enemyPanelX, 14, enemyPanelWidth, enemyPanelHeight);
          ctx.strokeRect(leadPanelX, 98, leadPanelWidth, leadPanelHeight);

          ctx.fillStyle = '#39462e';
          ctx.textAlign = 'left';
          ctx.font = canvasFont(9, '600');
          enemyNameLines.forEach((line, index) => {
            ctx.fillText(line, enemyPanelX + panelPadding, 23 + index * panelLineHeight);
          });
          ctx.fillText(enemyHpText, enemyPanelX + panelPadding, 23 + enemyNameLines.length * panelLineHeight + 2);
          enemyTraitLines.forEach((line, index) => {
            ctx.fillText(line, enemyPanelX + panelPadding, 23 + enemyNameLines.length * panelLineHeight + 2 + panelLineHeight + index * panelLineHeight);
          });
          drawTypeBadge(typeKeyForMonster(battleTarget), typeShortForMonster(battleTarget), enemyPanelX + enemyPanelWidth - 28, 16, { minWidth: 20, height: 9, font: canvasFont(6, '700') });
          leadNameLines.forEach((line, index) => {
            ctx.fillText(line, leadPanelX + panelPadding, 107 + index * panelLineHeight);
          });
          ctx.fillText(leadHpText, leadPanelX + panelPadding, 107 + leadNameLines.length * panelLineHeight + 2);
          leadTraitLines.forEach((line, index) => {
            ctx.fillText(line, leadPanelX + panelPadding, 107 + leadNameLines.length * panelLineHeight + 2 + panelLineHeight + index * panelLineHeight);
          });
          if (lead) {
            drawTypeBadge(typeKeyForMonster(lead), typeShortForMonster(lead), leadPanelX + leadPanelWidth - 28, 100, { minWidth: 20, height: 9, font: canvasFont(6, '700') });
          }

          ctx.fillStyle = 'rgba(45,56,34,0.94)';
          ctx.fillRect(0, battleFooterY, sceneWidth, battleFooterHeight);
          ctx.strokeStyle = 'rgba(239,247,223,0.18)';
          ctx.strokeRect(0, battleFooterY, sceneWidth, battleFooterHeight);
          ctx.font = canvasFont(10, '600');

          if (battleMenuMode === 'root') {
            ctx.fillStyle = '#eff7df';
            ctx.textAlign = 'center';
            ctx.fillText('Choose action', sceneWidth / 2, battleFooterY + 10);
            const rootRows = [battleRootOptions.slice(0, 3), battleRootOptions.slice(3)];
            rootRows.forEach((rowItems, rowIndex) => {
              const gutter = 8;
              const rowWidth = battleFooterInnerWidth - (rowItems.length - 1) * gutter;
              const boxWidth = Math.floor(rowWidth / rowItems.length);
              const totalWidth = boxWidth * rowItems.length + gutter * (rowItems.length - 1);
              const rowStartX = Math.floor((sceneWidth - totalWidth) / 2);
              rowItems.forEach((option, colIndex) => {
                const index = battleRootOptions.indexOf(option);
                const boxX = rowStartX + colIndex * (boxWidth + gutter);
                const boxY = battleFooterY + 16 + rowIndex * 16;
                const selected = index === battleMenuSelection;
                ctx.fillStyle = selected ? '#d7efb9' : 'rgba(239,247,223,0.14)';
                ctx.fillRect(boxX, boxY, boxWidth, 13);
                ctx.strokeStyle = selected ? '#eff7df' : 'rgba(239,247,223,0.22)';
                ctx.strokeRect(boxX, boxY, boxWidth, 13);
                ctx.fillStyle = selected ? '#304027' : '#eff7df';
                ctx.textAlign = 'center';
                ctx.fillText(option.label, boxX + boxWidth / 2, boxY + 10);
              });
            });
          } else {
            const entries = currentBattleMenuEntries();
            ctx.fillStyle = '#eff7df';
            ctx.textAlign = 'center';
            ctx.fillText(battleMenuMode === 'attack' ? 'Choose an attack' : battleMenuMode === 'item' ? 'Choose an item' : 'Choose a partner', sceneWidth / 2, battleFooterY + 10);

            if (entries.length > 2) {
                ctx.textAlign = 'right';
                ctx.font = canvasFont(8, '600');
                ctx.fillStyle = '#eff7df';
                ctx.fillText(`${battleSubSelection + 1}/${entries.length}`, sceneWidth - 10, sceneHeight - 40);
              }

            if (!entries.length) {
              ctx.fillText(battleMenuMode === 'switch' ? 'No healthy partners' : 'No usable items', sceneWidth / 2, battleFooterY + 32);
            } else {
              const windowStart = Math.max(0, Math.min(battleSubSelection, Math.max(0, entries.length - 2)));
              entries.slice(windowStart, windowStart + 2).forEach((entry, offset) => {
                const index = windowStart + offset;
                const boxY = battleFooterY + 15 + offset * 17;
                const boxHeight = 15;
                const selected = index === battleSubSelection;
                const titleLines = wrapBattleText(entry.name || entry.label, 156, 2);
                ctx.fillStyle = selected ? '#d7efb9' : 'rgba(239,247,223,0.14)';
                ctx.fillRect(battleFooterInnerX, boxY, battleFooterInnerWidth, boxHeight);
                ctx.strokeStyle = selected ? '#eff7df' : 'rgba(239,247,223,0.22)';
                ctx.strokeRect(battleFooterInnerX, boxY, battleFooterInnerWidth, boxHeight);
                ctx.fillStyle = selected ? '#304027' : '#eff7df';
                ctx.textAlign = 'left';
                ctx.font = canvasFont(9, '600');
                titleLines.forEach((line, lineIndex) => {
                  ctx.fillText(line, battleFooterInnerX + 7, boxY + 10 + lineIndex * 6.5);
                });
                const detail = entry.detail || moveDetailText(entry);
                const detailLines = wrapBattleText(detail, 112, 2);
                ctx.font = canvasFont(7, '500');
                ctx.fillStyle = selected ? '#304027' : '#d9ebc8';
                detailLines.forEach((line, lineIndex) => {
                  ctx.fillText(line, sceneWidth - 118, boxY + 6.5 + lineIndex * 6.5);
                });
              });
            }
          }
      });
  }

  function endRun(reason) {
    stopEncounterTransition();
    stopBattleAnimation();
    stopFishingAnimation();
    gameOver = true;
    battleTarget = null;
    updateHighScore();
    setMessage(`${reason} Final score: ${currentScore()}.`);
    updateTamerUi();
    flushPendingStorageWrites();
    drawTamerWorld();
  }

  function switchToHealthyLead() {
    const idx = firstHealthyMonsterIndex();
    if (idx >= 0) {
      activeIndex = idx;
      return true;
    }
    return false;
  }

  function awardExperience(monster, amount) {
    if (!monster) return 0;
    const cap = progressionLevelCap();
    const overCap = Math.max(0, monster.level - cap);
    const modifier = overCap <= 0 ? 1 : Math.max(0.08, 0.48 - overCap * 0.06);
    let levelsGained = 0;
    monster.xp += Math.max(1, Math.round(amount * modifier));
    while (monster.xp >= monster.xpToNext) {
      monster.xp -= monster.xpToNext;
      monster.level += 1;
      monster.maxHp += 2;
      monster.hp = monster.maxHp;
      monster.atkMin += 1;
      if (monster.level % 2 === 0) monster.atkMax += 1;
      monster.xpToNext = 5 + monster.level * 4;
      levelsGained += 1;
    }
    return levelsGained;
  }

  function awardSupportExperience(leadMonster, defeatedMonster) {
    const supportGain = Math.max(1, Math.floor((2 + defeatedMonster.level) * 0.6));
    let levelsGained = 0;
    party.forEach(monster => {
      if (!monster || monster === leadMonster || monster.hp <= 0) return;
      levelsGained += awardExperience(monster, supportGain);
    });
    return levelsGained;
  }

  function stepWorld() {
    worldTick += 1;
    getRelevantChunks(chunkRadius + 1).forEach(chunk => {
      chunk.monsters.forEach(monster => {
        const stayStillChance = monster.isTrainer ? 0.8 : monster.isNpc ? 0.84 : 0.68;
        if (Math.random() < stayStillChance) return;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const choice = dirs[wrapIndex(monster.roamBias + worldTick + monster.x + monster.y, dirs.length)];
        if (!choice) return;
        const nx = monster.x + choice[0];
        const ny = monster.y + choice[1];
        if (Math.abs(nx - player.x) > viewCols || Math.abs(ny - player.y) > viewRows) return;
        if (isBlocked(nx, ny) || (nx === player.x && ny === player.y) || monsterOccupied(nx, ny, monster)) return;
        if (monster.isTrainer || monster.isNpc) {
          monster.spriteFacing = facingForStep(choice[0], choice[1], monster.spriteFacing || 'down');
          monster.spriteWalkFrame = monster.spriteWalkFrame === 0 ? 2 : 0;
          monster.spriteWalkAnimationUntil = performance.now() + 180;
        }
        monster.x = nx;
        monster.y = ny;
      });
    });

    if (steps % 9 === 0) {
      for (let i = 0; i < 6; i++) {
        const px = player.x + Math.floor(Math.random() * (viewCols + 6)) - Math.floor(viewCols / 2) - 3;
        const py = player.y + Math.floor(Math.random() * (viewRows + 4)) - Math.floor(viewRows / 2) - 2;
        if (Math.abs(px - player.x) + Math.abs(py - player.y) < 5) continue;
        const terrain = terrainAt(px, py);
        if (terrain !== 'grass' && terrain !== 'dungeon') continue;
        if (terrain === 'grass' && isRouteOrNearRoute(px, py)) continue;
        if (monsterOccupied(px, py)) continue;
        getChunk(Math.floor(px / chunkSize), Math.floor(py / chunkSize)).monsters.push(createWildMonster(px, py, Math.random() < 0.35 ? 1 : 0, worldTick + steps + i));
        break;
      }
    }

    updateHighScore();
    updateTamerUi();
    drawTamerWorld();
  }

  function beginBattle(monster) {
    resetBattleMenu();
    startEncounterTransition(monster);
    updateTamerUi();
    drawTamerWorld();
  }

  function sendNextTrainerMonster(trainerMonster, introMessage = '') {
    if (!trainerMonster?.isTrainer || !trainerMonster.trainerReserve?.length) return false;

    const nextMonster = trainerMonster.trainerReserve.shift();
    const preserved = {
      id: trainerMonster.id,
      x: trainerMonster.x,
      y: trainerMonster.y,
      isTrainer: true,
      trainerName: trainerMonster.trainerName,
      trainerReserve: trainerMonster.trainerReserve,
      trainerSpriteConfig: trainerMonster.trainerSpriteConfig,
      roamBias: trainerMonster.roamBias,
      spriteFacing: trainerMonster.spriteFacing,
      spriteWalkFrame: trainerMonster.spriteWalkFrame,
      spriteWalkAnimationUntil: trainerMonster.spriteWalkAnimationUntil
    };

    Object.assign(trainerMonster, nextMonster, preserved);
    battleTarget = trainerMonster;
    resetBattleMenu();
    setMessage(joinBattleText(introMessage, `Trainer ${trainerMonster.trainerName} sent out ${trainerMonster.name}.`));
    updateHighScore();
    updateTamerUi();
    drawTamerWorld();
    return true;
  }

  function resolveBattleVictory(ally, defeatedMonster) {
    const xpGain = 2 + defeatedMonster.level;
    const finalTrainerMon = defeatedMonster.isTrainer && !(defeatedMonster.trainerReserve || []).length;
    const evolvedCoinBonus = Math.max(0, (defeatedMonster.evolvedEncounterDepth || 0) * 12);
    const apexCoinBonus = defeatedMonster.apexEncounter ? 26 : 0;
    const coinGain = 3 + defeatedMonster.level * 2 + Math.max(0, (rarityMeta[defeatedMonster.rarity] || rarityMeta.common).coinBonus - 1) + evolvedCoinBonus + apexCoinBonus + (defeatedMonster.bossRewardCoins || 0) + (finalTrainerMon ? Math.max(0, (defeatedMonster.trainerRewardCoins || 0) - 4) : 0);
    const levels = awardExperience(ally, xpGain);
    const supportLevels = awardSupportExperience(ally, defeatedMonster);
    const scoreGain = awardScore(victoryScoreForMonster(defeatedMonster, { finalTrainerMon })) + awardScore(levelUpScore(levels + supportLevels));
    coins += coinGain;
    const recovery = recoverLeadAfterEncounter(2, defeatedMonster.x, defeatedMonster.y);
    const evolutionMessage = maybeEvolveMonster(ally);
    let victoryMessage = levels > 0
      ? recovery > 0
        ? `${ally.name} won, earned ${coinGain}c, grew to Lv${ally.level}, and recovered ${recovery} HP.`
        : `${ally.name} won, earned ${coinGain}c, and grew to Lv${ally.level}.`
      : recovery > 0
        ? `${ally.name} defeated ${defeatedMonster.name}, earned ${coinGain}c, and recovered ${recovery} HP.`
        : `${ally.name} defeated ${defeatedMonster.name} and earned ${coinGain}c.`;

    if (defeatedMonster.isBoss && defeatedMonster.badgeName && !badges.includes(defeatedMonster.badgeName)) {
      badges.push(defeatedMonster.badgeName);
      victoryMessage = `${ally.name} won the ${defeatedMonster.badgeName} Badge and ${coinGain}c.`;
      const badgeEvolutions = maybeEvolveParty();
      if (badgeEvolutions.length) {
        victoryMessage = joinBattleText(victoryMessage, badgeEvolutions.join(' '));
      }
    }

    if (defeatedMonster.isTrainer && defeatedMonster.trainerReserve?.length) {
      showBattleResult(battleBannerTitle(defeatedMonster), battleRewardDetail({ points: scoreGain, coins: coinGain }));
      defeated += 1;
      sendNextTrainerMonster(defeatedMonster, joinBattleText(victoryMessage, evolutionMessage));
      return;
    }

    if (finalTrainerMon) {
      victoryMessage = `${ally.name} beat Trainer ${defeatedMonster.trainerName} and earned ${coinGain}c.`;
      if (levels > 0) victoryMessage = `${victoryMessage} ${ally.name} grew to Lv${ally.level}.`;
      if (recovery > 0) victoryMessage = `${victoryMessage} ${ally.name} recovered ${recovery} HP.`;
    }

    showBattleResult(battleBannerTitle(defeatedMonster), battleRewardDetail({ points: scoreGain, coins: coinGain, note: coinGain <= 0 && scoreGain <= 0 ? 'Battle cleared' : '' }));
    setMessage(joinBattleText(victoryMessage, evolutionMessage));
    removeMonster(defeatedMonster);
    battleTarget = null;
    defeated += 1;
    resetBattleMenu();
    stepWorld();
  }

  function chooseEnemyMove(enemy) {
    const moves = attacksForMonster(enemy);
    if (!moves.length) return null;
    if (enemy.hp <= Math.ceil(enemy.maxHp * 0.4)) {
      const sustainMove = moves.find(move => move.healRatio || move.selfEffect?.type === 'regen');
      if (sustainMove && Math.random() < 0.7) return sustainMove;
    }
    if (enemy.statusKey !== 'stun') {
      const controlMove = moves.find(move => move.effect?.type === 'stun');
      if (controlMove && Math.random() < 0.35) return controlMove;
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  function resolveEnemyRetaliation(move, message) {
    const ally = activeMonster();
    if (!battleTarget || !ally || !move) return;
    const enemyState = startTurnStatus(battleTarget);
    const passiveStartMessage = applyPassiveTurnStart(battleTarget);
    if (enemyState.fainted) {
      resolveBattleVictory(ally, battleTarget);
      return;
    }
    if (!enemyState.canAct) {
      setMessage(joinBattleText(message, enemyState.text, passiveStartMessage));
      updateHighScore();
      updateTamerUi();
      drawTamerWorld();
      return;
    }
    startBattleAnimation('attack-projectile', { from: 'enemy', monster: battleTarget }, () => {
      if (!battleTarget) return;

      if (Math.random() > (move.accuracy || 1)) {
        setMessage(joinBattleText(message, enemyState.text, passiveStartMessage, `${battleTarget.name}'s ${move.name} missed.`));
        updateHighScore();
        updateTamerUi();
        drawTamerWorld();
        return;
      }

      const baseDamage = battleTarget.atkMin + Math.floor(Math.random() * (battleTarget.atkMax - battleTarget.atkMin + 1));
      const typeMultiplier = typeModifierForAttack(move, battleTarget, ally);
      const retaliation = Math.max(
        1,
        damageAgainstTarget(easeRetaliationDamage(Math.max(1, Math.round(baseDamage * (move.power || 1))), battleTarget.x, battleTarget.y), ally, move, battleTarget)
        + passiveOutgoingBonus(battleTarget, ally)
        - passiveIncomingReduction(ally)
      );
      ally.hp = Math.max(0, ally.hp - retaliation);
      let recovered = 0;
      if (move.healRatio) {
        recovered = Math.min(Math.max(1, Math.round(retaliation * move.healRatio)), battleTarget.maxHp - battleTarget.hp);
        battleTarget.hp += recovered;
      }
      const effectMessages = applyMoveEffects(battleTarget, ally, move);
      const passiveAfterMessage = passiveAfterHit(battleTarget, retaliation);
      let followUpMessage = joinBattleText(message, enemyState.text, passiveStartMessage, `${battleTarget.name} used ${move.name} for ${retaliation}.${typeEffectText(typeMultiplier)}${recovered > 0 ? ` ${battleTarget.name} recovered ${recovered} HP.` : ''}`, passiveAfterMessage, ...effectMessages);

      if (!ally || ally.hp <= 0) {
        if (!switchToHealthyLead()) {
          endRun('All your monsters fainted.');
          return;
        }
        followUpMessage = joinBattleText(followUpMessage, `${activeMonster()?.name || 'A partner'} stepped in.`);
      }

      setMessage(followUpMessage);
      updateHighScore();
      updateTamerUi();
      drawTamerWorld();
    }, 560);
  }

  function takePlayerTurn(onAct) {
    const ally = activeMonster();
    if (!ally || !battleTarget) return;
    const state = startTurnStatus(ally);
    const passiveStartMessage = applyPassiveTurnStart(ally);
    if (state.fainted) {
      if (!switchToHealthyLead()) {
        endRun('All your monsters fainted.');
        return;
      }
      const enemyMove = chooseEnemyMove(battleTarget);
      resolveEnemyRetaliation(enemyMove, joinBattleText(state.text, passiveStartMessage, `${activeMonster()?.name || 'A partner'} stepped in.`));
      return;
    }
    if (!state.canAct) {
      const enemyMove = chooseEnemyMove(battleTarget);
      resolveEnemyRetaliation(enemyMove, joinBattleText(state.text, passiveStartMessage));
      return;
    }
    onAct(joinBattleText(state.text, passiveStartMessage));
  }

  function useBattleAttack(move) {
    const ally = activeMonster();
    if (!ally || !battleTarget || !move) return;

    takePlayerTurn((prefix) => {
      startBattleAnimation('attack-projectile', { from: 'ally', monster: ally }, () => {
        if (!battleTarget) return;

        if (Math.random() > (move.accuracy || 1)) {
          const enemyMove = chooseEnemyMove(battleTarget);
          resolveEnemyRetaliation(enemyMove, joinBattleText(prefix, `${ally.name}'s ${move.name} missed.`));
          return;
        }

        const baseDamage = ally.atkMin + Math.floor(Math.random() * (ally.atkMax - ally.atkMin + 1));
        const typeMultiplier = typeModifierForAttack(move, ally, battleTarget);
        const damage = Math.max(
          1,
          damageAgainstTarget(Math.max(1, Math.round(baseDamage * (move.power || 1))), battleTarget, move, ally)
          + passiveOutgoingBonus(ally, battleTarget)
          - passiveIncomingReduction(battleTarget)
        );
        battleTarget.hp = Math.max(0, battleTarget.hp - damage);
        let recovered = 0;
        if (move.healRatio) {
          recovered = Math.min(Math.max(1, Math.round(damage * move.healRatio)), ally.maxHp - ally.hp);
          ally.hp += recovered;
        }
        const effectMessages = applyMoveEffects(ally, battleTarget, move);
        const passiveAfterMessage = passiveAfterHit(ally, damage);

        if (battleTarget.hp <= 0) {
          resolveBattleVictory(ally, battleTarget);
          return;
        }

        const enemyMove = chooseEnemyMove(battleTarget);
        resolveEnemyRetaliation(enemyMove, joinBattleText(prefix, `${ally.name} used ${move.name} for ${damage}.${typeEffectText(typeMultiplier)}${recovered > 0 ? ` ${ally.name} recovered ${recovered} HP.` : ''}`, passiveAfterMessage, ...effectMessages));
      }, 540);
    });
  }

  function useBattleItem(item) {
    if (!item || item.key !== 'tonic') {
      setMessage('No usable items right now.');
      drawTamerWorld();
      return;
    }

    takePlayerTurn((prefix) => {
      const result = usePotionOnLead();
      if (result === 'You are out of tonics.' || /full HP|No lead/.test(result)) {
        setMessage(result);
        updateTamerUi();
        drawTamerWorld();
        return;
      }

      resetBattleMenu();
      const enemyMove = chooseEnemyMove(battleTarget);
      resolveEnemyRetaliation(enemyMove, joinBattleText(prefix, result));
    });
  }

  function escapeChanceForTarget(target) {
    if (!target) return 0;
    const rarityPenalty = ({ common: 0, uncommon: 0.08, rare: 0.18, legendary: 0.3 })[target.rarity] || 0.1;
    const levelGapPenalty = Math.max(0, target.level - (activeMonster()?.level || target.level)) * 0.04;
    const ephemeralBonus = target.ephemeral ? 0.12 : 0;
    return Math.max(0.12, Math.min(0.92, 0.72 - rarityPenalty - levelGapPenalty + ephemeralBonus));
  }

  function attemptRunFromBattle() {
    if (!battleTarget) return;
    if (battleTarget.isTrainer) {
      setMessage(`Trainer ${battleTarget.trainerName} will not let you run.`);
      updateTamerUi();
      drawTamerWorld();
      return;
    }
    const currentTarget = battleTarget;
    takePlayerTurn((prefix) => {
      const chance = escapeChanceForTarget(currentTarget) - (currentTarget.isBoss ? 0.28 : 0);
      if (Math.random() < chance) {
        battleTarget = null;
        resetBattleMenu();
        setMessage(joinBattleText(prefix, `You escaped from ${currentTarget.name}.`));
        updateTamerUi();
        drawTamerWorld();
        return;
      }

      resetBattleMenu();
      const enemyMove = chooseEnemyMove(currentTarget);
      resolveEnemyRetaliation(enemyMove, joinBattleText(prefix, `Couldn't escape! ${currentTarget.name} cuts you off.`));
    });
  }

  function useBattleSwitch(entry) {
    takePlayerTurn((prefix) => {
      if (!switchLeadToIndex(entry?.index)) {
        setMessage('No healthy partners can switch in.');
        updateTamerUi();
        drawTamerWorld();
        return;
      }

      resetBattleMenu();
      const enemyMove = chooseEnemyMove(battleTarget);
      resolveEnemyRetaliation(enemyMove, joinBattleText(prefix, `${activeMonster().name} stepped in.`));
    });
  }

  function handleBattleConfirm() {
    if (!battleTarget) return;

    if (battleMenuMode === 'root') {
      const action = battleRootOptions[battleMenuSelection];
      if (!action) return;

      if (action.key === 'attack') {
        battleMenuMode = 'attack';
        battleSubSelection = 0;
        setMessage('Choose an attack.');
        drawTamerWorld();
        return;
      }
      if (action.key === 'item') {
        battleMenuMode = 'item';
        battleSubSelection = 0;
        setMessage(battleItemsForPlayer().length ? 'Choose an item.' : 'No usable items right now.');
        drawTamerWorld();
        return;
      }
      if (action.key === 'switch') {
        battleMenuMode = 'switch';
        battleSubSelection = 0;
        setMessage(switchMenuEntries().length ? 'Choose a partner.' : 'No healthy partners can switch in.');
        drawTamerWorld();
        return;
      }
      if (action.key === 'run') {
        attemptRunFromBattle();
        return;
      }
      if (action.key === 'capture') {
        tryCatch();
      }
      return;
    }

    const entries = currentBattleMenuEntries();
    const selected = entries[battleSubSelection];
    if (!selected) {
      setMessage('No usable options right now.');
      drawTamerWorld();
      return;
    }

    if (battleMenuMode === 'attack') {
      resetBattleMenu();
      useBattleAttack(selected);
      return;
    }

    if (battleMenuMode === 'item') {
      useBattleItem(selected);
      return;
    }

    if (battleMenuMode === 'switch') {
      useBattleSwitch(selected);
    }
  }

  function handleBattleBack() {
    if (!battleTarget) return false;
    if (battleMenuMode !== 'root') {
      resetBattleMenu();
      setMessage('Choose Attack, Item, Switch, Run, or Capture.');
      drawTamerWorld();
      return true;
    }
    setMessage('Choose Attack, Item, Switch, Run, or Capture.');
    drawTamerWorld();
    return true;
  }

  function attackWild() {
    if (encounterTransition) {
      return;
    }
    if (battleAnimation) {
      return;
    }
    if (fishingAnimation) {
      return;
    }
    if (gameOver) {
      startRun();
      return;
    }
    if (playerMenuOpen) {
      handlePlayerMenuConfirm();
      return;
    }
    const ally = activeMonster();
    if (!ally) {
      endRun('No monsters left to fight with.');
      return;
    }
    if (!battleTarget) {
      if (townMenuOpen) {
        if (indexMenuOpen) {
          closeMonsterIndex('Back to town services.');
          return;
        }
        buyTownItem();
        return;
      }
      if (isTownShopTile()) {
        openTownMenu();
        return;
      }
      if (isTownTile()) {
        setMessage('Find the shop in town.');
        drawTamerWorld();
        return;
      }
      const nearby = [[0, -1], [1, 0], [0, 1], [-1, 0]]
        .map(([dx, dy]) => getMonsterAt(player.x + dx, player.y + dy))
        .find(Boolean);
      if (nearby) {
        if (nearby.isNpc) {
          nearby.spriteFacing = facingForStep(player.x - nearby.x, player.y - nearby.y, nearby.spriteFacing || 'down');
          setMessage(nearby.dialogue || routeNpcDialogues[0]);
          updateTamerUi();
          drawTamerWorld();
          return;
        }
        beginBattle(nearby);
        return;
      }
      if (adjacentWaterTile()) {
        castFishingLine();
        return;
      }
      setMessage('Nothing to interact with here right now.');
      drawTamerWorld();
      return;
    }

    handleBattleConfirm();
  }

  function tryCatch() {
    if (encounterTransition) {
      return;
    }
    if (battleAnimation) {
      return;
    }
    if (fishingAnimation) {
      return;
    }
    if (gameOver) {
      startRun();
      return;
    }
    if (playerMenuOpen) {
      handlePlayerMenuBack();
      return;
    }
    if (townMenuOpen) {
      if (indexMenuOpen) {
        closeMonsterIndex('Back to town services.');
        return;
      }
      if (storageMenuOpen) {
        handleStorageBack();
        return;
      }
      closeTownMenu('You leave the shop and head back outside.');
      return;
    }
    if (!battleTarget) {
      openPlayerMenu();
      return;
    }

    if (capsules <= 0) {
      setMessage('You are out of capsules. Return to town and buy more.');
      drawTamerWorld();
      return;
    }

    if (battleTarget.isBoss || battleTarget.isTrainer) {
      setMessage(battleTarget.isTrainer ? 'Trainer monsters cannot be captured.' : 'Boss monsters refuse capture.');
      drawTamerWorld();
      return;
    }

    takePlayerTurn((prefix) => {
      capsules -= 1;

      const healthFactor = 1 - (battleTarget.hp / battleTarget.maxHp);
      const chance = Math.min(0.92, battleTarget.catchBase + healthFactor * 0.55 + earlyGameRelief(battleTarget.x, battleTarget.y) * 0.08);
      const usedCharm = charms > 0;
      const boostedChance = Math.min(0.96, chance + (usedCharm ? 0.14 : 0));
      const catchSucceeded = Math.random() < boostedChance;
      if (usedCharm) {
        charms -= 1;
      }

      startBattleAnimation('capsule-throw', { success: catchSucceeded }, () => {
        if (!battleTarget) return;
        if (catchSucceeded) {
          const caughtEncounter = battleTarget;
          const caughtMonster = {
            name: battleTarget.name,
            species: battleTarget.species,
            color: battleTarget.color,
            accent: battleTarget.accent,
            shiny: !!battleTarget.shiny,
            sprite: battleTarget.sprite,
            level: battleTarget.level,
            xp: 0,
            xpToNext: 5 + battleTarget.level * 4,
            maxHp: battleTarget.maxHp,
            hp: Math.max(1, Math.floor(battleTarget.maxHp * 0.75)),
            atkMin: battleTarget.atkMin,
            atkMax: battleTarget.atkMax,
            catchBase: battleTarget.catchBase,
            rarity: battleTarget.rarity || 'common',
            statusKey: '',
            statusTurns: 0,
            statusPotency: 0
          };
          assignCaughtMonsterTag(caughtMonster);
          const caughtX = battleTarget.x;
          const caughtY = battleTarget.y;
          const sentToStorage = party.length >= activePartyLimit;
          if (sentToStorage) {
            storedMonsters.push(caughtMonster);
          } else {
            party.push(caughtMonster);
          }
          const scoreGain = awardScore(captureScoreForMonster(battleTarget));
          captures += 1;
          coins += 2 + battleTarget.level + Math.max(0, (battleTarget.evolvedEncounterDepth || 0) * 10) + (battleTarget.apexEncounter ? 24 : 0);
          const recovery = recoverLeadAfterEncounter(3, caughtEncounter.x, caughtEncounter.y);
          recordDexEntry(battleTarget, 'caught');
          removeMonster(battleTarget);
          showBattleResult('Capture Complete', battleRewardDetail({ points: scoreGain, note: sentToStorage ? 'Sent to box' : `Party ${party.length}` }));
          setMessage(joinBattleText(prefix, usedCharm
            ? recovery > 0
              ? `Capture charm flared. You caught the ${battleTarget.shiny ? 'shiny ' : ''}${(rarityMeta[battleTarget.rarity] || rarityMeta.common).label.toLowerCase()} ${battleTarget.name}! ${activeMonster()?.name || 'Lead'} recovered ${recovery} HP. ${sentToStorage ? `${battleTarget.name} was sent to storage.` : `Party ${party.length}.`} Capsules left: ${capsules}.`
              : `Capture charm flared. You caught the ${battleTarget.shiny ? 'shiny ' : ''}${(rarityMeta[battleTarget.rarity] || rarityMeta.common).label.toLowerCase()} ${battleTarget.name}! ${sentToStorage ? `${battleTarget.name} was sent to storage.` : `Party ${party.length}.`} Capsules left: ${capsules}.`
            : recovery > 0
              ? `You caught the ${battleTarget.shiny ? 'shiny ' : ''}${(rarityMeta[battleTarget.rarity] || rarityMeta.common).label.toLowerCase()} ${battleTarget.name}! ${activeMonster()?.name || 'Lead'} recovered ${recovery} HP. ${sentToStorage ? `${battleTarget.name} was sent to storage.` : `Party ${party.length}.`} Capsules left: ${capsules}.`
              : `You caught the ${battleTarget.shiny ? 'shiny ' : ''}${(rarityMeta[battleTarget.rarity] || rarityMeta.common).label.toLowerCase()} ${battleTarget.name}! ${sentToStorage ? `${battleTarget.name} was sent to storage.` : `Party ${party.length}.`} Capsules left: ${capsules}.`));
          battleTarget = null;
          resetBattleMenu();
          updateHighScore();
          updateTamerUi();
          drawTamerWorld();
          return;
        }

        const enemyMove = chooseEnemyMove(battleTarget);
        resolveEnemyRetaliation(enemyMove, joinBattleText(prefix, usedCharm
          ? `Capture charm faded. Capsules left: ${capsules}.`
          : `Capture failed. Capsules left: ${capsules}.`));
      }, 960);
    });
  }

  function movePlayer(dx, dy) {
    if (encounterTransition) {
      return;
    }
    if (battleAnimation) {
      return;
    }
    if (fishingAnimation) {
      return;
    }
    if (gameOver) {
      drawTamerWorld();
      return;
    }
    if (playerMenuOpen) {
      setMessage('Use Up/Down to browse your party.');
      drawTamerWorld();
      return;
    }
    if (indexMenuOpen) {
      setMessage('Use Up/Down to browse the Monster Index.');
      drawTamerWorld();
      return;
    }
    if (townMenuOpen) {
      if (storageMenuOpen) {
        setMessage('Storage uses Left/Right for columns, Up/Down for rows, Enter to confirm, X to back.');
        drawTamerWorld();
        return;
      }
      setMessage('Use Up/Down to browse town services.');
      drawTamerWorld();
      return;
    }
    if (battleTarget) {
      setMessage('You are in battle. Use Enter/Spacebar to interact or Backspace/X to cancel.');
      drawTamerWorld();
      return;
    }

    playerFacing = facingForStep(dx, dy, playerFacing);

    const nx = player.x + dx;
    const ny = player.y + dy;
    const terrain = terrainAt(nx, ny);
    if (isBlocked(nx, ny)) {
      setMessage(terrain === 'tree' ? 'Thick trees block the route.' : 'Water cuts off the path.');
      drawTamerWorld();
      return;
    }

    const target = getMonsterAt(nx, ny);
    if (target) {
      if (target.isNpc) {
        target.spriteFacing = facingForStep(player.x - target.x, player.y - target.y, target.spriteFacing || 'down');
        setMessage(target.dialogue || routeNpcDialogues[0]);
        updateTamerUi();
        drawTamerWorld();
        return;
      }
      beginBattle(target);
      return;
    }

    player.x = nx;
    player.y = ny;
  playerWalkFrame = playerWalkFrame === 0 ? 2 : 0;
  playerWalkAnimationUntil = performance.now() + 180;
    steps += 1;
    awardTravelScore();
    ensureWorld();
    if (collectWorldLoot()) {
      stepWorld();
      return;
    }
    if ((terrain === 'grass' || terrain === 'dungeon') && Math.random() < (terrain === 'dungeon' ? 0.16 + Math.min(0.06, adventureProgress() * 0.005) : 0.11 + Math.min(0.05, adventureProgress() * 0.006))) {
      const wild = createWildMonster(player.x, player.y, 1);
      wild.ephemeral = true;
      beginBattle(wild);
      return;
    }
    if (isTownShopTile()) {
      setMessage('At the shop. Enter/Spacebar to Open.');
    } else if (isTownTile()) {
      setMessage(`In ${routeLabelAt()}. Find the shop.`);
    } else if (adjacentWaterTile()) {
      setMessage('Water nearby. Enter/Spacebar can fish.');
    } else if (terrain === 'dungeon') {
      setMessage(`You are in ${routeLabelAt()}. The air feels heavier here.`);
    } else if (terrain === 'grass') {
      setMessage(`Tall grass rustles on ${routeLabelAt()}.`);
    } else {
      setMessage(`You are on ${routeLabelAt()}. Stronger monsters live farther out.`);
    }
    stepWorld();
  }

  function startRun() {
    stopEncounterTransition();
    stopBattleAnimation();
    stopFishingAnimation();
    highScore = getHighScore(readLocalJson, gameKey, [legacyGameKey]);
    captures = 0;
    defeated = 0;
    steps = 0;
    score = 0;
    nextTravelScoreStep = 20;
    renderTick = 0;
    battleResultBanner = null;
    evolutionAnimation = null;
    evolutionAnimationQueue = [];
    gameOver = false;
    battleTarget = null;
    townMenuOpen = false;
    townSelection = 0;
    indexMenuOpen = false;
    indexSelection = 0;
    storageMenuOpen = false;
    storageMenuColumn = 'party';
    storagePartySelection = 0;
    storageBoxSelection = 0;
    storageSwapPending = null;
    playerMenuOpen = false;
    playerMenuMode = 'party';
    playerMenuSelection = 0;
    playerMenuActionSelection = 0;
    playerMenuSwapSelection = 0;
    runGoalSpecies = {};
    runGoalDungeonLoot = false;
    townships = buildTownships();
    activeTownship = null;
    chunks = new Map();
    party = [cloneMonster(speciesList[0], 1), cloneMonster(speciesList[1], 1)];
    caughtMonsterCounter = 0;
    party.forEach(assignCaughtMonsterTag);
    party.forEach(monster => markRunGoalSpecies(monster.species));
    storedMonsters = [];
    activeIndex = 0;
    coins = 24;
    capsules = 6;
    tonics = 0;
    rods = 0;
    charms = 0;
    badges = [];
    const homeTown = townships[0] || { x: 0, y: 0 };
    player = { x: homeTown.x, y: homeTown.y + 1 };
    playerFacing = 'down';
    playerWalkFrame = 0;
    playerWalkAnimationUntil = 0;
    lastMessageText = 'Leave town, discover route monsters, and return to town to check your index.';
    ensureWorld();
    setMessage('Leave town, discover route monsters, and return to town to check your index.');
    updateTamerUi();
    drawTamerWorld();
  }

  if (savedRun && restoreRunState(savedRun)) {
    ensureWorld();
    setMessage(lastMessageText);
    updateTamerUi();
    drawTamerWorld();
  } else {
    startRun();
  }
  startAmbientAnimation();

  releaseVPixelHunterControls = bindStandaloneControls(controls, {
    onLeft: () => {
      if (evolutionAnimation) return;
      playerMenuOpen ? movePlayerMenuSelection(-1) : battleTarget ? moveBattleSelection(-1) : storageMenuOpen ? moveStorageColumn(-1) : (townMenuOpen || indexMenuOpen) ? moveTownSelection(-1) : movePlayer(-1, 0);
    },
    onRight: () => {
      if (evolutionAnimation) return;
      playerMenuOpen ? movePlayerMenuSelection(1) : battleTarget ? moveBattleSelection(1) : storageMenuOpen ? moveStorageColumn(1) : (townMenuOpen || indexMenuOpen) ? moveTownSelection(1) : movePlayer(1, 0);
    },
    onConfirm: () => {
      if (evolutionAnimation) {
        advanceEvolutionAnimation();
        return;
      }
      attackWild();
    },
    onBack: () => evolutionAnimation
      ? advanceEvolutionAnimation()
      : gameOver
      ? startRun()
      : playerMenuOpen
        ? handlePlayerMenuBack()
        : battleTarget
          ? handleBattleBack()
          : storageMenuOpen
            ? handleStorageBack()
            : indexMenuOpen
              ? closeMonsterIndex('Back to town services.')
              : townMenuOpen
                ? closeTownMenu('You leave the shop and head back outside.')
                : openPlayerMenu()
  });

  setScrollHandler((dir) => {
    if (evolutionAnimation) {
      return;
    }
    if (playerMenuOpen) {
      movePlayerMenuSelection(dir > 0 ? 1 : -1);
      return;
    }
    if (battleTarget) {
      moveBattleSelection(dir > 0 ? 1 : -1);
      return;
    }
    if (storageMenuOpen) {
      moveStorageSelection(dir > 0 ? 1 : -1);
      return;
    }
    if (townMenuOpen || indexMenuOpen) {
      moveTownSelection(dir > 0 ? 1 : -1);
      return;
    }
    movePlayer(0, dir > 0 ? 1 : -1);
  });

  function confirmLeaveVPixelHunter() {
    return window.confirm('Leave vPixelHunter? Progress is not saved!');
  }

  const menuControl = controls?.menu;
  const oldMenu = menuControl?.onclick || null;
  if (menuControl) menuControl.onclick = () => {
    if (!confirmLeaveVPixelHunter()) {
      drawTamerWorld();
      return;
    }
    stopAmbientAnimation();
    stopEncounterTransition();
    stopBattleAnimation();
    stopFishingAnimation();
    battleTarget = null;
    gameOver = false;
    if (releaseVPixelHunterControls) releaseVPixelHunterControls();
    releaseVPixelHunterControls = null;
    flushPendingStorageWrites();
    if (releasePersistenceFlushListeners) releasePersistenceFlushListeners();
    releasePersistenceFlushListeners = null;
    setScrollHandler(null);
    menuControl.onclick = oldMenu;
    goBack();
  };
}
