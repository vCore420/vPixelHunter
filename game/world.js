export function createWorldHelpers({
  worldSeed,
  routeProfiles,
  getPlayer,
  getTownships,
  getParty,
  getStats,
  getCaughtMonsterCounter,
  setCaughtMonsterCounter,
  badgeCount,
  hasBadge,
  terrainAt
}) {
  function key(x, y) {
    return `${x},${y}`;
  }

  function chunkKey(cx, cy) {
    return `${cx},${cy}`;
  }

  function hashValue(x, y, salt = 0) {
    const raw = Math.sin((x * 127.1) + (y * 311.7) + (salt * 74.7) + (worldSeed * 0.0001)) * 43758.5453123;
    return raw - Math.floor(raw);
  }

  function townshipNameForProfile(profile) {
    return `${profile.label} Township`;
  }

  function axisDistanceToSegment(x, y, startX, startY, endX, endY) {
    if (startX === endX) {
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      if (y >= minY && y <= maxY) return Math.abs(x - startX);
      return Math.abs(x - startX) + Math.min(Math.abs(y - startY), Math.abs(y - endY));
    }

    if (startY === endY) {
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      if (x >= minX && x <= maxX) return Math.abs(y - startY);
      return Math.abs(y - startY) + Math.min(Math.abs(x - startX), Math.abs(x - endX));
    }

    return Math.abs(x - startX) + Math.abs(y - startY);
  }

  function pointNearRouteCorridor(x, y, startX, startY, endX, endY, width = 1, salt = 0) {
    const horizontalFirst = hashValue(startX + endX, startY + endY, 401 + salt) > 0.5;
    const jog = Math.floor((hashValue(startX - endX, startY - endY, 409 + salt) - 0.5) * 6);
    const segments = horizontalFirst
      ? [
          [startX, startY, endX + jog, startY],
          [endX + jog, startY, endX + jog, endY],
          [endX + jog, endY, endX, endY]
        ]
      : [
          [startX, startY, startX, endY + jog],
          [startX, endY + jog, endX, endY + jog],
          [endX, endY + jog, endX, endY]
        ];

    return segments.some(([ax, ay, bx, by]) => axisDistanceToSegment(x, y, ax, ay, bx, by) <= width);
  }

  function townshipCandidateAngle(index, attempt) {
    const spokeCount = 10;
    const spokeIndex = (Math.floor(hashValue(index + 1, 0, 293) * spokeCount) + attempt) % spokeCount;
    const baseAngle = (Math.PI * 2 * spokeIndex) / spokeCount;
    const wobble = (hashValue(index + 1, attempt + 1, 301) - 0.5) * 0.72;
    return baseAngle + wobble;
  }

  let cachedTownshipSignature = '';
  let cachedRouteConnections = [];
  let cachedDungeonSignature = '';
  let cachedDungeonZone = null;

  function getRouteConnections() {
    const townships = getTownships();
    const signature = townships.map(town => `${town.key}:${town.x},${town.y}`).join('|');
    if (signature === cachedTownshipSignature) return cachedRouteConnections;

    const connections = [];
    const townCount = townships.length;
    if (!townCount) {
      cachedTownshipSignature = signature;
      cachedRouteConnections = connections;
      return connections;
    }

    const origin = { x: 0, y: 0 };
    const byDistance = [...townships].sort((left, right) => (Math.abs(left.x) + Math.abs(left.y)) - (Math.abs(right.x) + Math.abs(right.y)));
    const connectedKeys = new Set();

    byDistance.forEach((town, index) => {
      const earlier = byDistance.slice(0, index);
      let primary = origin;
      if (earlier.length) {
        primary = earlier.reduce((best, candidate) => {
          const bestDistance = Math.abs(best.x - town.x) + Math.abs(best.y - town.y);
          const nextDistance = Math.abs(candidate.x - town.x) + Math.abs(candidate.y - town.y);
          return nextDistance < bestDistance ? candidate : best;
        }, earlier[0]);
      }

      connections.push({ fromX: primary.x, fromY: primary.y, toX: town.x, toY: town.y, width: index >= 7 ? 2 : 1, salt: 40 + index });
      connectedKeys.add(`${primary.x},${primary.y}->${town.x},${town.y}`);

      if (earlier.length > 1) {
        const alternatives = earlier
          .filter(candidate => candidate !== primary)
          .sort((left, right) => (Math.abs(left.x - town.x) + Math.abs(left.y - town.y)) - (Math.abs(right.x - town.x) + Math.abs(right.y - town.y)));
        const alternate = alternatives.find((candidate, altIndex) => {
          const distance = Math.abs(candidate.x - town.x) + Math.abs(candidate.y - town.y);
          return distance <= 120 && hashValue(town.x + candidate.x, town.y + candidate.y, 71 + altIndex) > 0.58;
        });
        if (alternate) {
          connections.push({ fromX: alternate.x, fromY: alternate.y, toX: town.x, toY: town.y, width: 1, salt: 90 + index });
        }
      }
    });

    for (let index = 0; index < byDistance.length; index++) {
      const town = byDistance[index];
      for (let offset = index + 1; offset < byDistance.length; offset++) {
        const otherTown = byDistance[offset];
        const distance = Math.abs(otherTown.x - town.x) + Math.abs(otherTown.y - town.y);
        if (distance < 28 || distance > 84) continue;
        if (Math.abs(index - offset) > 3) continue;
        if (hashValue(town.x + otherTown.x, town.y + otherTown.y, 133 + index + offset) <= 0.82) continue;
        connections.push({ fromX: town.x, fromY: town.y, toX: otherTown.x, toY: otherTown.y, width: 1, salt: 140 + index * 7 + offset });
      }
    }

    cachedTownshipSignature = signature;
    cachedRouteConnections = connections;
    return connections;
  }

  function biomeDistanceRange(index) {
    if (index === 0) {
      return { min: 5, max: 16 };
    }

    return {
      min: 10 + index * 18,
      max: 20 + index * 20
    };
  }

  function hasNearbyRoute(centerX, centerY, searchRadius = 8) {
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > searchRadius + 2) continue;
        if (baseTerrainAt(centerX + dx, centerY + dy) === 'path') {
          return true;
        }
      }
    }
    return false;
  }

  function getDungeonZone() {
    const townships = getTownships();
    const signature = townships.map(town => `${town.key}:${town.x},${town.y}`).join('|');
    if (signature === cachedDungeonSignature) return cachedDungeonZone;

    cachedDungeonSignature = signature;
    cachedDungeonZone = null;

    const minIndex = Math.min(routeProfiles.length - 1, 3);
    const maxIndex = Math.max(minIndex, Math.min(routeProfiles.length - 2, 8));
    const candidateCount = Math.max(1, maxIndex - minIndex + 1);
    const startOffset = Math.floor(hashValue(0, 0, 881) * candidateCount);

    for (let offset = 0; offset < candidateCount; offset++) {
      const profileIndex = minIndex + ((startOffset + offset) % candidateCount);
      const profile = routeProfiles[profileIndex];
      const range = biomeDistanceRange(profileIndex);

      for (let attempt = 0; attempt < 180; attempt++) {
        const angle = townshipCandidateAngle(profileIndex + 7, attempt + 1);
        const distance = range.min + Math.floor(hashValue(profileIndex + 1, attempt + 1, 889) * Math.max(1, range.max - range.min + 1));
        const centerX = Math.round(Math.cos(angle) * distance + (hashValue(profileIndex + 1, attempt + 1, 907) - 0.5) * 10);
        const centerY = Math.round(Math.sin(angle) * distance + (hashValue(profileIndex + 1, attempt + 1, 919) - 0.5) * 10);
        const radiusX = 4 + Math.floor(hashValue(profileIndex + 1, attempt + 1, 929) * 3);
        const radiusY = 4 + Math.floor(hashValue(profileIndex + 1, attempt + 1, 937) * 3);

        if (routeProfileAt(centerX, centerY) !== profile) continue;
        if (!isTownshipFootprintClear(centerX, centerY)) continue;
        if (!hasNearbyRoute(centerX, centerY, 8)) continue;

        const overlapsTown = townships.some(town => Math.abs(town.x - centerX) <= radiusX + 3 && Math.abs(town.y - centerY) <= radiusY + 3);
        if (overlapsTown) continue;

        cachedDungeonZone = {
          key: 'dungeon-1',
          x: centerX,
          y: centerY,
          radiusX,
          radiusY,
          profile,
          label: `${profile.label} Depths`
        };
        return cachedDungeonZone;
      }
    }

    return cachedDungeonZone;
  }

  function getDungeonZoneAt(x = getPlayer().x, y = getPlayer().y) {
    const zone = getDungeonZone();
    if (!zone) return null;
    if (routeProfileAt(x, y) !== zone.profile) return null;

    const dx = (x - zone.x) / Math.max(1, zone.radiusX);
    const dy = (y - zone.y) / Math.max(1, zone.radiusY);
    const distance = dx * dx + dy * dy;
    const edgeNoise = (hashValue(Math.floor((x + zone.x) / 2), Math.floor((y + zone.y) / 2), 947) - 0.5) * 0.24;
    return distance <= 1.02 + edgeNoise ? zone : null;
  }

  function routeProfileAt(x = getPlayer().x, y = getPlayer().y) {
    const distance = Math.abs(x) + Math.abs(y);
    const band = Math.min(routeProfiles.length - 1, Math.max(0, Math.floor(Math.max(0, distance - 4) / 28)));
    return routeProfiles[band];
  }

  function baseTerrainAt(x, y) {
    const routeBandX = Math.abs((((x + Math.floor(hashValue(0, Math.floor(y / 5), 3) * 8)) % 22) + 22) % 22 - 11) <= 0;
    const routeBandY = Math.abs((((y + Math.floor(hashValue(Math.floor(x / 5), 0, 5) * 8)) % 24) + 24) % 24 - 12) <= 0;
    const meadowNoise = hashValue(Math.floor(x / 4), Math.floor(y / 4), 9);
    const waterNoise = hashValue(Math.floor(x / 3), Math.floor(y / 3), 11);
    const treeNoise = hashValue(Math.floor(x / 2), Math.floor(y / 2), 17);
    const townships = getTownships();

    if (townships.length) {
      const routeConnections = getRouteConnections();
      for (const connection of routeConnections) {
        if (pointNearRouteCorridor(x, y, connection.fromX, connection.fromY, connection.toX, connection.toY, connection.width, connection.salt)) {
          return 'path';
        }
      }
      for (const town of townships) {
        if (Math.abs(x - town.x) <= 2 && Math.abs(y - town.y) <= 2) {
          return 'path';
        }
      }
    }

    if (getDungeonZoneAt(x, y)) return 'dungeon';

    if ((routeBandX || routeBandY) && meadowNoise > 0.18) return 'path';
    if (waterNoise > 0.84 && meadowNoise > 0.32) return 'water';
    if (treeNoise > 0.76 && meadowNoise > 0.2) return 'tree';
    if (meadowNoise > 0.28) return 'grass';
    return 'plain';
  }

  function isTownshipFootprintClear(centerX, centerY) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = centerX + dx;
        const ty = centerY + dy;
        const terrain = baseTerrainAt(tx, ty);
        if (terrain === 'water' || terrain === 'tree') return false;
      }
    }
    return true;
  }

  function createTownshipForProfile(profile, index, existingTownships = []) {
    const range = biomeDistanceRange(index);
    const overlapsExistingTownship = (centerX, centerY) => existingTownships.some(town =>
      Math.abs(town.x - centerX) <= 4 && Math.abs(town.y - centerY) <= 4
    );

    for (let attempt = 0; attempt < 220; attempt++) {
      const distance = range.min + Math.floor(hashValue(index + 1, attempt + 1, 307) * Math.max(1, range.max - range.min + 1));
      const angle = townshipCandidateAngle(index, attempt);
      const radialJitter = Math.floor((hashValue(index + 1, attempt + 1, 313) - 0.5) * 6);
      const lateralJitter = Math.floor((hashValue(index + 1, attempt + 1, 317) - 0.5) * 12);
      const centerX = Math.round(Math.cos(angle) * (distance + radialJitter) + Math.sin(angle) * lateralJitter * 0.5);
      const centerY = Math.round(Math.sin(angle) * (distance + radialJitter) - Math.cos(angle) * lateralJitter * 0.5);

      if (routeProfileAt(centerX, centerY) !== profile) continue;
      if (!isTownshipFootprintClear(centerX, centerY)) continue;
      if (overlapsExistingTownship(centerX, centerY)) continue;

      return {
        key: `town-${index}`,
        name: townshipNameForProfile(profile),
        profile,
        x: centerX,
        y: centerY
      };
    }

    for (let attempt = 0; attempt < 180; attempt++) {
      const angle = townshipCandidateAngle(index, 300 + attempt);
      const ringProgress = (attempt % 12) / 11;
      const distance = Math.round(range.min + (range.max - range.min) * ringProgress);
      const centerX = Math.round(Math.cos(angle) * distance);
      const centerY = Math.round(Math.sin(angle) * distance);
      if (routeProfileAt(centerX, centerY) !== profile) continue;
      if (!isTownshipFootprintClear(centerX, centerY)) continue;
      if (overlapsExistingTownship(centerX, centerY)) continue;
      return {
        key: `town-${index}`,
        name: townshipNameForProfile(profile),
        profile,
        x: centerX,
        y: centerY
      };
    }

    const fallbackAngle = townshipCandidateAngle(index, 999);
    const fallbackDistance = Math.max(range.min, Math.round((range.min + range.max) / 2));
    return {
      key: `town-${index}`,
      name: townshipNameForProfile(profile),
      profile,
      x: Math.round(Math.cos(fallbackAngle) * fallbackDistance),
      y: Math.round(Math.sin(fallbackAngle) * fallbackDistance)
    };
  }

  function buildTownships() {
    const nextTownships = [];
    routeProfiles.forEach((profile, index) => {
      nextTownships.push(createTownshipForProfile(profile, index, nextTownships));
    });
    return nextTownships;
  }

  function getTownshipAt(x = getPlayer().x, y = getPlayer().y) {
    return getTownships().find(town => Math.abs(town.x - x) <= 1 && Math.abs(town.y - y) <= 1) || null;
  }

  function isTownShopTile(x = getPlayer().x, y = getPlayer().y) {
    const town = getTownshipAt(x, y);
    return !!(town && town.x === x && town.y === y);
  }

  function currentScore() {
    const { score } = getStats();
    return Number.isFinite(score) ? score : 0;
  }

  function adventureProgress() {
    const { captures, defeated } = getStats();
    return captures + defeated + Math.max(0, getParty().length - 1);
  }

  function distanceFromOrigin(x, y) {
    return Math.abs(x) + Math.abs(y);
  }

  function progressionLevelCap() {
    return 8 + badgeCount() * 6;
  }

  function highestPartyLevel() {
    return getParty().reduce((highest, monster) => Math.max(highest, monster?.level || 0), 1);
  }

  function averagePartyLevel() {
    const party = getParty();
    if (!party.length) return 1;
    return party.reduce((total, monster) => total + (monster?.level || 0), 0) / party.length;
  }

  function monsterDisplayName(monster) {
    if (!monster) return '';
    return monster.name;
  }

  function assignCaughtMonsterTag(monster) {
    if (!monster || monster.catchTag) return monster;
    const nextCounter = getCaughtMonsterCounter() + 1;
    setCaughtMonsterCounter(nextCounter);
    monster.catchTag = `#${String(nextCounter).padStart(2, '0')}`;
    return monster;
  }

  function directionLabel(dx, dy) {
    const horizontal = dx === 0 ? '' : `${Math.abs(dx)}${dx > 0 ? 'E' : 'W'}`;
    const vertical = dy === 0 ? '' : `${Math.abs(dy)}${dy > 0 ? 'S' : 'N'}`;
    return [horizontal, vertical].filter(Boolean).join(' ');
  }

  function nextTownshipTarget() {
    const remainingRoute = routeProfiles.find(profile => !hasBadge(profile));
    if (!remainingRoute) return null;
    return getTownships().find(town => town.profile === remainingRoute) || null;
  }

  function nextTownshipHint() {
    const player = getPlayer();
    const town = nextTownshipTarget();
    if (!town) return 'All towns cleared';
    const dx = town.x - player.x;
    const dy = town.y - player.y;
    if (dx === 0 && dy === 0) return 'Town Here';
    return `${town.profile.label} ${directionLabel(dx, dy)}`;
  }

  function battleBannerTitle(target) {
    if (!target) return 'Battle End';
    if (target.isBoss) return `${target.badgeName} Badge Won`;
    if (target.isTrainer) return 'Trainer Down';
    return 'Victory';
  }

  function earlyGameRelief(x = getPlayer().x, y = getPlayer().y) {
    const distanceRelief = Math.max(0, 1 - (distanceFromOrigin(x, y) / 26));
    const progressRelief = Math.max(0, 1 - (adventureProgress() / 9));
    return Math.max(distanceRelief * 0.55, progressRelief * 0.75);
  }

  function lootTierAt(x, y) {
    return Math.min(4, Math.floor(distanceFromOrigin(x, y) / 24));
  }

  function routeLabelAt(x = getPlayer().x, y = getPlayer().y) {
    const town = getTownshipAt(x, y);
    if (town) return town.name;
    const dungeonZone = getDungeonZoneAt(x, y);
    return dungeonZone ? dungeonZone.label : routeProfileAt(x, y).label;
  }

  function routeSortIndex(route) {
    const baseRoute = (route || '').replace(/ Waters$/, '').replace(/ Depths$/, '');
    const index = routeProfiles.findIndex(profile => profile.label === baseRoute);
    return index >= 0 ? index : routeProfiles.length;
  }

  function hasLandmarkAt(x, y, profile = routeProfileAt(x, y), type = terrainAt(x, y)) {
    if (!profile || type === 'grass' || type === 'water' || type === 'heal' || type === 'town' || type === 'shop' || type === 'dungeon') return false;
    return hashValue(x, y, 201) >= 0.958;
  }

  function routesForSpecies(speciesName) {
    return routeProfiles
      .filter(profile =>
        profile.pool.some(entry => entry.species === speciesName)
        || (profile.specials || []).some(entry => entry.species === speciesName)
        || (profile.fishPool || []).some(entry => entry.species === speciesName)
        || (profile.fishSpecials || []).some(entry => entry.species === speciesName)
      )
      .map(profile => ((profile.fishPool || []).some(entry => entry.species === speciesName) || (profile.fishSpecials || []).some(entry => entry.species === speciesName))
        ? `${profile.label} Waters`
        : profile.label);
  }

  return {
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
    getDungeonZoneAt,
    hasLandmarkAt,
    routesForSpecies,
    baseTerrainAt
  };
}