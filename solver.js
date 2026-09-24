// SFL Treasure Radar Engine - Local Constraint Satisfaction Solver
// Specifically optimized for locating the 3 Daily Target Artifacts and Minimizing Shovels
// Modeled directly after Sunflower Land Assistant (v1.3.2) PredictionSet Architecture

const SEASON_ARTIFACTS = {
  "Solar Flare": "Scarab",
  "Dawn Breaker": "Scarab",
  "Witches' Eve": "Scarab",
  "Catch the Kraken": "Scarab",
  "Spring Blossom": "Scarab",
  "Clash of Factions": "Scarab",
  "Pharaoh's Treasure": "Scarab",
  "Bull Run": "Cow Skull",
  "Winds of Change": "Ancient Clock",
  "Great Bloom": "Broken Pillar",
  "Better Together": "Coprolite",
  "Paw Prints": "Moon Crystal",
  "Crabs and Traps": "Ammonite Shell",
  "Salt Awakening": "Salt Dino Egg",
  "Ascension Age": "Otter Pebble"
};

export const ITEM_VALUES = Object.freeze({
  Sand: 10,
  "Camel Bone": 10,
  Crab: 15,
  "Old Bottle": 22.5,
  "Sea Cucumber": 22.5,
  Vase: 50,
  Seaweed: 75,
  "Cockle Shell": 100,
  Starfish: 112.5,
  "Wooden Compass": 131.25,
  "Iron Compass": 187.5,
  "Emerald Compass": 187.5,
  Pipi: 187.5,
  Hieroglyph: 250,
  "Clam Shell": 375,
  Coral: 1500,
  Pearl: 3750,
  "Pirate Bounty": 7500,
  Scarab: 200,
  "Cow Skull": 200,
  "Ancient Clock": 200,
  "Broken Pillar": 200,
  Coprolite: 200,
  "Moon Crystal": 200,
  "Salt Dino Egg": 200,
  "Otter Pebble": 200
});

const RAW_PATTERNS = {
  MONDAY_ARTEFACT_FORMATION: [{x:0,y:-1,name:"Camel Bone"},{x:1,y:-1,name:"$ARTIFACT"}],
  TUESDAY_ARTEFACT_FORMATION: [{x:1,y:0,name:"$ARTIFACT"},{x:1,y:2,name:"Camel Bone"}],
  WEDNESDAY_ARTEFACT_FORMATION: [{x:0,y:0,name:"Camel Bone"},{x:1,y:0,name:"$ARTIFACT"}],
  THURSDAY_ARTEFACT_FORMATION: [{x:0,y:0,name:"Camel Bone"},{x:1,y:-1,name:"$ARTIFACT"}],
  FRIDAY_ARTEFACT_FORMATION: [{x:2,y:0,name:"Camel Bone"},{x:3,y:0,name:"$ARTIFACT"}],
  SATURDAY_ARTEFACT_FORMATION: [{x:1,y:0,name:"$ARTIFACT"},{x:1,y:-1,name:"Camel Bone"}],
  SUNDAY_ARTEFACT_FORMATION: [{x:0,y:-2,name:"$ARTIFACT"}],
  ARTEFACT_ONE: [{x:0,y:0,name:"$ARTIFACT"},{x:0,y:1,name:"Camel Bone"},{x:0,y:2,name:"Camel Bone"}],
  ARTEFACT_TWO: [{x:0,y:0,name:"$ARTIFACT"},{x:1,y:0,name:"Camel Bone"},{x:0,y:2,name:"Camel Bone"}],
  ARTEFACT_THREE: [{x:0,y:0,name:"$ARTIFACT"}],
  ARTEFACT_FOUR: [{x:0,y:0,name:"$ARTIFACT"},{x:0,y:1,name:"Camel Bone"},{x:0,y:2,name:"Camel Bone"},{x:0,y:3,name:"Camel Bone"}],
  ARTEFACT_FIVE: [{x:0,y:0,name:"$ARTIFACT"},{x:-1,y:0,name:"Camel Bone"},{x:-2,y:0,name:"Camel Bone"}],
  ARTEFACT_SIX: [{x:0,y:0,name:"$ARTIFACT"},{x:-1,y:0,name:"Camel Bone"},{x:-2,y:-1,name:"Camel Bone"}],
  ARTEFACT_SEVEN: [{x:0,y:0,name:"$ARTIFACT"},{x:1,y:1,name:"Camel Bone"}],
  ARTEFACT_EIGHT: [{x:0,y:0,name:"$ARTIFACT"},{x:1,y:0,name:"Camel Bone"},{x:0,y:2,name:"Camel Bone"}],
  ARTEFACT_NINE: [{x:0,y:0,name:"$ARTIFACT"},{x:0,y:1,name:"Camel Bone"},{x:0,y:-1,name:"Camel Bone"},{x:-1,y:-1,name:"Camel Bone"}],
  ARTEFACT_TEN: [{x:0,y:0,name:"$ARTIFACT"},{x:0,y:1,name:"Camel Bone"},{x:-1,y:0,name:"Camel Bone"},{x:-1,y:1,name:"Camel Bone"}],
  ARTEFACT_ELEVEN: [{x:0,y:0,name:"$ARTIFACT"},{x:0,y:1,name:"Camel Bone"},{x:1,y:1,name:"Camel Bone"}],
  ARTEFACT_TWELVE: [{x:0,y:0,name:"$ARTIFACT"},{x:0,y:1,name:"Camel Bone"},{x:-1,y:1,name:"Camel Bone"},{x:1,y:1,name:"Camel Bone"}],
  ARTEFACT_THIRTEEN: [{x:0,y:0,name:"$ARTIFACT"},{x:2,y:0,name:"Camel Bone"}],
  ARTEFACT_FOURTEEN: [{x:0,y:0,name:"$ARTIFACT"},{x:0,y:2,name:"Camel Bone"}],
  ARTEFACT_FIFTEEN: [{x:0,y:0,name:"Camel Bone"},{x:1,y:0,name:"$ARTIFACT"},{x:2,y:0,name:"Camel Bone"}],
  ARTEFACT_SIXTEEN: [{x:0,y:0,name:"$ARTIFACT"},{x:1,y:0,name:"Camel Bone"},{x:1,y:1,name:"Camel Bone"}],
  ARTEFACT_SEVENTEEN: [{x:0,y:0,name:"Camel Bone"},{x:1,y:0,name:"Camel Bone"},{x:1,y:1,name:"$ARTIFACT"}],
  ARTEFACT_EIGHTEEN: [{x:0,y:0,name:"$ARTIFACT"},{x:1,y:0,name:"Camel Bone"},{x:0,y:1,name:"Camel Bone"},{x:1,y:1,name:"Camel Bone"}],
  ARTEFACT_NINETEEN: [{x:0,y:0,name:"Camel Bone"},{x:1,y:0,name:"Camel Bone"},{x:2,y:0,name:"Camel Bone"},{x:1,y:1,name:"$ARTIFACT"}],
  ARTEFACT_TWENTY: [{x:0,y:0,name:"Camel Bone"},{x:1,y:0,name:"Camel Bone"},{x:0,y:1,name:"$ARTIFACT"},{x:1,y:1,name:"Camel Bone"}],
  ARTEFACT_TWENTY_ONE: [{x:0,y:0,name:"$ARTIFACT"},{x:1,y:0,name:"Camel Bone"},{x:2,y:0,name:"Camel Bone"},{x:0,y:1,name:"Camel Bone"},{x:1,y:1,name:"Camel Bone"}],
  ARTEFACT_TWENTY_TWO: [{x:0,y:0,name:"Camel Bone"},{x:1,y:0,name:"Camel Bone"},{x:2,y:0,name:"Camel Bone"},{x:0,y:1,name:"Camel Bone"},{x:1,y:1,name:"$ARTIFACT"}],
  ARTEFACT_TWENTY_THREE: [{x:0,y:0,name:"Camel Bone"},{x:1,y:0,name:"Camel Bone"},{x:2,y:0,name:"Camel Bone"},{x:1,y:1,name:"Camel Bone"},{x:2,y:1,name:"$ARTIFACT"}],
  ARTEFACT_TWENTY_FOUR: [{x:0,y:0,name:"Camel Bone"},{x:1,y:0,name:"$ARTIFACT"},{x:2,y:0,name:"Camel Bone"},{x:0,y:1,name:"Camel Bone"},{x:2,y:1,name:"Camel Bone"}],
  HIEROGLYPH: [{x:0,y:0,name:"Vase"},{x:1,y:0,name:"Vase"},{x:0,y:1,name:"Hieroglyph"}],
  OLD_BOTTLE: [{x:0,y:0,name:"Old Bottle"},{x:1,y:0,name:"Old Bottle"},{x:0,y:1,name:"Old Bottle"},{x:1,y:1,name:"Old Bottle"}],
  COCKLE: [{x:0,y:0,name:"Cockle Shell"},{x:1,y:1,name:"Cockle Shell"},{x:2,y:2,name:"Cockle Shell"}],
  WOODEN_COMPASS: [{x:0,y:0,name:"Wood"},{x:1,y:0,name:"Wooden Compass"},{x:2,y:0,name:"Wood"}],
  SEA_CUCUMBERS: [{x:0,y:0,name:"Sea Cucumber"},{x:1,y:0,name:"Sea Cucumber"},{x:2,y:0,name:"Sea Cucumber"},{x:3,y:0,name:"Pipi"}],
  SEAWEED: [{x:0,y:0,name:"Seaweed"},{x:1,y:0,name:"Seaweed"},{x:2,y:0,name:"Seaweed"},{x:2,y:1,name:"Starfish"}],
  CLAM_SHELLS: [{x:0,y:0,name:"Clam Shell"},{x:1,y:0,name:"Clam Shell"},{x:0,y:-1,name:"Clam Shell"},{x:1,y:-1,name:"Clam Shell"}],
  CORAL: [{x:0,y:1,name:"Stone"},{x:0,y:0,name:"Coral"},{x:0,y:-1,name:"Stone"}],
  PEARL: [{x:0,y:1,name:"Stone"},{x:0,y:0,name:"Pearl"},{x:0,y:-1,name:"Stone"}],
  PIRATE_BOUNTY: [{x:0,y:0,name:"Pirate Bounty"}]
};

// -------------------------------------------------------------
// MODULE-SCOPE PRECOMPUTED PATTERN GEOMETRY (Eliminates repeated Math.min/max)
// -------------------------------------------------------------
const PATTERN_GEOMETRY = {};
for (const [pKey, parts] of Object.entries(RAW_PATTERNS)) {
  const xs = parts.map(p => p.x);
  const ys = parts.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const offsetX = Math.floor((4 - width) / 2) - minX;
  const offsetY = Math.floor((4 - height) / 2) - minY;

  PATTERN_GEOMETRY[pKey] = {
    minX, maxX, minY, maxY, width, height,
    offsetX, offsetY,
    parts: parts.map(p => ({
      x: p.x,
      y: p.y,
      name: p.name,
      isArtifact: p.name === "$ARTIFACT"
    }))
  };
}

export function getResolvedPatternParts(pKey, seasonArtifact) {
  const geom = PATTERN_GEOMETRY[pKey];
  if (!geom) return [];
  return geom.parts.map(p => ({
    x: p.x,
    y: p.y,
    name: p.isArtifact ? seasonArtifact : p.name
  }));
}

const COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

export function coordToLabel(x, y) {
  return `${COLS[x]}${y + 1}`;
}

function norm(s) {
  return String(s || "").toLowerCase().replace(/[\s_]+/g, " ").trim();
}

function isMatch(a, b) {
  return norm(a) === norm(b);
}

export function detectSeasonArtifact(seasonName, gridDugList) {
  if (seasonName && SEASON_ARTIFACTS[seasonName]) {
    return SEASON_ARTIFACTS[seasonName];
  }
  if (Array.isArray(gridDugList)) {
    const known = Object.values(SEASON_ARTIFACTS);
    for (const d of gridDugList) {
      for (const item of Object.keys(d.items || {})) {
        const found = known.find(k => isMatch(k, item));
        if (found) return found;
      }
    }
  }
  return "Otter Pebble";
}

function coordToKey(x, y) {
  return `${x},${y}`;
}

function keyToCoord(key) {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

function inBounds(x, y) {
  return x >= 0 && x < 10 && y >= 0 && y < 10;
}

const ORTHO = [[0, 1], [0, -1], [1, 0], [-1, 0]];

// Export pattern definitions for Today's Treasures mini-grid rendering (Optimized with PATTERN_GEOMETRY)
export function getPatternDefinitions(seasonName) {
  const seasonArtifact = detectSeasonArtifact(seasonName);
  const patterns = {};

  for (const [pKey, geom] of Object.entries(PATTERN_GEOMETRY)) {
    const resolvedParts = geom.parts.map(p => ({
      x: p.x,
      y: p.y,
      name: p.isArtifact ? seasonArtifact : p.name
    }));

    patterns[pKey] = {
      key: pKey,
      displayName: pKey.replace(/^ARTEFACT_/, "").replace(/_/g, " "),
      parts: resolvedParts,
      miniGridParts: resolvedParts.map(p => ({
        x: p.x + geom.offsetX,
        y: p.y + geom.offsetY,
        name: p.name
      }))
    };
  }

  return patterns;
}

// -------------------------------------------------------------
// MAIN CSP SOLVER - 100% Focused on the 3 Seasonal Artifacts
// -------------------------------------------------------------
export function solveDesertGrid(diggingData, seasonName, strategy = 'infogain') {
  const gridDug = diggingData?.grid || [];
  const patternsToday = diggingData?.patterns || [];
  const completedPatterns = new Set(diggingData?.completedPatterns || []);
  const seasonArtifact = detectSeasonArtifact(seasonName, gridDug);

  const sandSet = new Set();
  const crabSet = new Set();
  const dugItemMap = new Map();
  const dugCoords = new Set();

  for (const dig of gridDug) {
    const x = dig.x;
    const y = dig.y;
    const key = coordToKey(x, y);
    dugCoords.add(key);

    const items = dig.items || {};
    const itemKeys = Object.keys(items);

    if (itemKeys.includes("Sand")) {
      sandSet.add(key);
    } else if (itemKeys.includes("Crab")) {
      crabSet.add(key);
    } else {
      for (const name of itemKeys) {
        dugItemMap.set(key, name);
      }
    }
  }

  // Sand Block rule: In Sunflower Land, a dug Sand tile means none of its 4 orthogonal neighbors can contain treasure
  const sandBlockedSet = new Set(sandSet);
  for (const sKey of sandSet) {
    const { x, y } = keyToCoord(sKey);
    for (const [dx, dy] of ORTHO) {
      const nx = x + dx;
      const ny = y + dy;
      if (inBounds(nx, ny)) {
        sandBlockedSet.add(coordToKey(nx, ny));
      }
    }
  }

  // Target Patterns: Strictly the 3 seasonal artifact formations
  const targetPatternKeys = [];
  const secondaryPatternKeys = [];

  for (const pKey of patternsToday) {
    if (pKey.startsWith("ARTEFACT_") || pKey.includes("_ARTEFACT_")) {
      targetPatternKeys.push(pKey);
    } else {
      secondaryPatternKeys.push(pKey);
    }
  }

  // Assign distinct pattern color index (0, 1, 2)
  const patternColorMap = {};
  targetPatternKeys.forEach((pKey, idx) => {
    patternColorMap[pKey] = idx % 3;
  });

  // Resolved pattern dictionary
  const resolvedPatterns = {};
  for (const pKey of targetPatternKeys) {
    resolvedPatterns[pKey] = getResolvedPatternParts(pKey, seasonArtifact);
  }

  // Locate all seasonal artifact pieces dug on board
  const targetPiecesFound = [];
  for (const [key, itemName] of dugItemMap.entries()) {
    if (isMatch(itemName, seasonArtifact)) {
      const { x, y } = keyToCoord(key);
      targetPiecesFound.push({ x, y, key, name: itemName });
    }
  }

  // Deduce Secondary Formations (HIEROGLYPH, OLD_BOTTLE, WOODEN_COMPASS, etc.)
  // When any secondary item is dug, identify its candidate formation.
  // These tiles CANNOT be occupied by seasonal artifact formations!
  const secondaryTreasureMap = new Map(); // key -> { name, patternName, isGuaranteed }
  const secondaryTreasureKeys = new Set();
  const secondarySuspectProb = new Map(); // key -> probability (0.0 to 1.0)
  const confirmedSecondaryPlacements = [];

  for (const sKey of secondaryPatternKeys) {
    const geom = PATTERN_GEOMETRY[sKey];
    if (!geom || !geom.parts.length) continue;
    const sParts = geom.parts;

    // Find all dug items that match parts of sKey
    const matchingDug = [];
    for (const [dKey, dName] of dugItemMap.entries()) {
      if (sParts.some(p => isMatch(p.name, dName))) {
        matchingDug.push({ key: dKey, name: dName, ...keyToCoord(dKey) });
      }
    }

    if (matchingDug.length === 0) continue;

    const minX = geom.minX;
    const maxX = geom.maxX;
    const minY = geom.minY;
    const maxY = geom.maxY;

    const candidatePlacements = [];

    for (let oy = -minY; oy <= 9 - maxY; oy++) {
      for (let ox = -minX; ox <= 9 - maxX; ox++) {
        let fits = true;
        let coveredDugCount = 0;
        const worldTiles = [];

        for (const part of sParts) {
          const wx = ox + part.x;
          const wy = oy + part.y;
          const wKey = coordToKey(wx, wy);

          if (crabSet.has(wKey) || sandBlockedSet.has(wKey)) {
            fits = false;
            break;
          }

          if (dugItemMap.has(wKey)) {
            const dugName = dugItemMap.get(wKey);
            if (!isMatch(dugName, part.name)) {
              fits = false;
              break;
            }
            coveredDugCount++;
          }

          worldTiles.push({ x: wx, y: wy, key: wKey, name: part.name });
        }

        if (fits && coveredDugCount > 0) {
          candidatePlacements.push({
            origin: { ox, oy },
            patternName: sKey,
            tiles: worldTiles,
            coveredDugCount
          });
        }
      }
    }

    if (candidatePlacements.length === 0) continue;

    const maxCovered = Math.max(...candidatePlacements.map(pl => pl.coveredDugCount));
    const bestPlacements = candidatePlacements.filter(pl => pl.coveredDugCount === maxCovered);
    const totalBest = bestPlacements.length;

    // Track suspect probability for all tiles in best candidate placements
    for (const pl of bestPlacements) {
      for (const t of pl.tiles) {
        if (!dugCoords.has(t.key)) {
          const prev = secondarySuspectProb.get(t.key) || 0;
          secondarySuspectProb.set(t.key, Math.min(1.0, prev + (1.0 / totalBest)));
        }
      }
    }

    if (bestPlacements.length === 1) {
      const best = bestPlacements[0];
      confirmedSecondaryPlacements.push(best);
      for (const t of best.tiles) {
        if (!dugCoords.has(t.key)) {
          secondaryTreasureMap.set(t.key, { name: t.name, patternName: sKey, isGuaranteed: true });
          secondaryTreasureKeys.add(t.key);
        }
      }
    } else {
      // Multiple candidate placements: only tiles that appear in ALL best candidate placements are guaranteed!
      const commonKeys = new Set(bestPlacements[0].tiles.map(t => t.key));
      for (let i = 1; i < bestPlacements.length; i++) {
        const plKeys = new Set(bestPlacements[i].tiles.map(t => t.key));
        for (const k of commonKeys) {
          if (!plKeys.has(k)) commonKeys.delete(k);
        }
      }
      for (const k of commonKeys) {
        if (!dugCoords.has(k)) {
          const t = bestPlacements[0].tiles.find(tile => tile.key === k);
          secondaryTreasureMap.set(k, { name: t.name, patternName: sKey, isGuaranteed: true });
          secondaryTreasureKeys.add(k);
        }
      }
    }
  }

  // Placement Generator for Target Patterns
  let nextPlId = 1;
  function getPlacementsForTarget(pKey) {
    const geom = PATTERN_GEOMETRY[pKey];
    if (!geom) return [];
    const parts = resolvedPatterns[pKey] || getResolvedPatternParts(pKey, seasonArtifact);

    const minX = geom.minX;
    const maxX = geom.maxX;
    const minY = geom.minY;
    const maxY = geom.maxY;

    const validPlacements = [];

    for (let oy = -minY; oy <= 9 - maxY; oy++) {
      for (let ox = -minX; ox <= 9 - maxX; ox++) {
        let fits = true;
        const worldTiles = [];
        let coversDugTarget = false;
        let dugArtifactCoord = null;
        let dugCluesMatched = 0;

        for (const part of parts) {
          const wx = ox + part.x;
          const wy = oy + part.y;
          const wKey = coordToKey(wx, wy);

          // Cannot place on Crab or Sand-blocked area
          if (crabSet.has(wKey) || sandBlockedSet.has(wKey)) {
            fits = false;
            break;
          }

          // If tile is already dug with an item, must match part name
          if (dugItemMap.has(wKey)) {
            const dugItem = dugItemMap.get(wKey);
            if (!isMatch(dugItem, part.name)) {
              fits = false;
              break;
            }
            if (isMatch(part.name, seasonArtifact)) {
              coversDugTarget = true;
              dugArtifactCoord = { x: wx, y: wy, key: wKey };
            } else {
              dugCluesMatched++;
            }
          }

          worldTiles.push({
            x: wx,
            y: wy,
            key: wKey,
            name: part.name,
            isTargetPiece: isMatch(part.name, seasonArtifact)
          });
        }

        if (fits) {
          validPlacements.push({
            id: nextPlId++,
            patternName: pKey,
            origin: { x: ox, y: oy },
            tiles: worldTiles,
            world: worldTiles.map(t => ({ x: t.x, y: t.y, name: t.name })),
            coversDugTarget,
            dugArtifactCoord,
            dugCluesMatched
          });
        }
      }
    }
    return validPlacements;
  }

  const rawTargetPlacements = {};
  for (const pKey of targetPatternKeys) {
    rawTargetPlacements[pKey] = getPlacementsForTarget(pKey);
  }

  // Identify confirmed placements for completed patterns and dug pieces
  const confirmedPlacements = [];
  const confirmedPlacementIds = [];
  const patternToConfirmedCoord = new Map();
  const usedDugArtifactKeys = new Set();
  const claimedPatternKeys = new Set(completedPatterns);

  for (const pKey of targetPatternKeys) {
    if (completedPatterns.has(pKey)) {
      const cand = (rawTargetPlacements[pKey] || []).find(pl =>
        pl.coversDugTarget && pl.dugArtifactCoord && !usedDugArtifactKeys.has(pl.dugArtifactCoord.key)
      );
      if (cand) {
        confirmedPlacements.push(cand);
        confirmedPlacementIds.push(cand.id);
        patternToConfirmedCoord.set(pKey, cand.dugArtifactCoord);
        usedDugArtifactKeys.add(cand.dugArtifactCoord.key);
        claimedPatternKeys.add(pKey);
      }
    }
  }

  // Set of all body tiles (Camel Bones) belonging to formations where the artifact has already been found
  const knownArtifactBodyKeys = new Set();

  // Bipartite Matching between found target pieces and target patterns
  const piecePatternMatches = new Map();
  const unmatchedPieces = targetPiecesFound.filter(p => !usedDugArtifactKeys.has(p.key));
  for (const piece of unmatchedPieces) {
    const validMatches = [];
    for (const pKey of targetPatternKeys) {
      if (completedPatterns.has(pKey)) continue;
      const cands = (rawTargetPlacements[pKey] || []).filter(pl =>
        pl.coversDugTarget && pl.dugArtifactCoord && pl.dugArtifactCoord.key === piece.key
      );
      if (cands.length > 0) {
        validMatches.push({ pKey, cands });
      }
    }
    piecePatternMatches.set(piece.key, validMatches);
  }

  // Find all valid bijective matchings: piece_i -> pKey_i
  const validMatchings = [];
  const pieces = unmatchedPieces.map(p => p.key);

  function findMatchings(pIdx, currentAssignment, usedPatterns) {
    if (pIdx === pieces.length) {
      validMatchings.push({ ...currentAssignment });
      return;
    }
    const pCoord = pieces[pIdx];
    const candidateEntries = piecePatternMatches.get(pCoord) || [];
    for (const entry of candidateEntries) {
      if (!usedPatterns.has(entry.pKey)) {
        usedPatterns.add(entry.pKey);
        currentAssignment[pCoord] = entry.pKey;
        findMatchings(pIdx + 1, currentAssignment, usedPatterns);
        delete currentAssignment[pCoord];
        usedPatterns.delete(entry.pKey);
      }
    }
  }
  if (pieces.length > 0) {
    findMatchings(0, {}, new Set());
  }

  const definitelyFoundPatterns = new Set();
  const potentiallyFoundPatterns = new Set();
  if (validMatchings.length > 0) {
    for (const pKey of targetPatternKeys) {
      const appearsInAll = validMatchings.every(m => Object.values(m).includes(pKey));
      const appearsInAny = validMatchings.some(m => Object.values(m).includes(pKey));
      if (appearsInAll) definitelyFoundPatterns.add(pKey);
      if (appearsInAny) potentiallyFoundPatterns.add(pKey);
    }
  }

  // 1. Set of retired bones belonging strictly to confirmed placements of found artifacts
  const retiredBoneKeys = new Set();
  const allDugBones = Array.from(dugItemMap.entries())
    .filter(([_, item]) => isMatch(item, "Camel Bone"))
    .map(([k, _]) => k);

  // Claim all patterns that are definitely found in all valid matchings
  for (const pKey of definitelyFoundPatterns) {
    claimedPatternKeys.add(pKey);
    const matchingPieceKey = Object.entries(validMatchings[0]).find(([_, pk]) => pk === pKey)?.[0];
    if (matchingPieceKey) {
      const cand = (rawTargetPlacements[pKey] || []).find(pl =>
        pl.coversDugTarget && pl.dugArtifactCoord && pl.dugArtifactCoord.key === matchingPieceKey
      );
      if (cand) {
        confirmedPlacements.push(cand);
        confirmedPlacementIds.push(cand.id);
        patternToConfirmedCoord.set(pKey, cand.dugArtifactCoord);
        for (const t of cand.tiles) {
          if (!t.isTargetPiece) {
            knownArtifactBodyKeys.add(t.key);
            if (dugItemMap.has(t.key) && isMatch(dugItemMap.get(t.key), "Camel Bone")) {
              retiredBoneKeys.add(t.key);
            }
          }
        }
      }
    }
  }

  // Also collect body tiles from already confirmed completed patterns
  for (const cf of confirmedPlacements) {
    for (const t of cf.tiles) {
      if (!t.isTargetPiece) {
        knownArtifactBodyKeys.add(t.key);
        if (dugItemMap.has(t.key) && isMatch(dugItemMap.get(t.key), "Camel Bone")) {
          retiredBoneKeys.add(t.key);
        }
      }
    }
  }

  // All retired bones of found artifacts are known body bones
  for (const k of retiredBoneKeys) {
    knownArtifactBodyKeys.add(k);
  }

  // Unclaimed dug Camel Bones: bones that do not belong to confirmed found artifacts
  const unclaimedBoneKeys = new Set(allDugBones.filter(k => !retiredBoneKeys.has(k)));

  const uncompletedKeys = targetPatternKeys.filter(k => !patternToConfirmedCoord.has(k) && !completedPatterns.has(k));

  // CRITICAL UPGRADE 2: Secondary Crab Isolation & Quarantine
  // Any Crab directly adjacent to a dug secondary item or highly suspected secondary tile
  // exists solely to guard the secondary item. It CANNOT point to an Otter Pebble!
  const secondaryCrabSet = new Set();
  for (const cKey of crabSet) {
    const { x, y } = keyToCoord(cKey);
    for (const [dx, dy] of ORTHO) {
      const nx = x + dx;
      const ny = y + dy;
      const nKey = coordToKey(nx, ny);
      if (!inBounds(nx, ny)) continue;
      if (dugItemMap.has(nKey) && !isMatch(dugItemMap.get(nKey), seasonArtifact) && !isMatch(dugItemMap.get(nKey), "Camel Bone")) {
        secondaryCrabSet.add(cKey);
        break;
      }
      if ((secondarySuspectProb.get(nKey) || 0) > 0.25 || secondaryTreasureKeys.has(nKey)) {
        secondaryCrabSet.add(cKey);
        break;
      }
    }
  }

  // Crab Constraint Analysis:
  // Each revealed non-secondary Crab MUST have at least one treasure in its 4 orthogonal neighbors.
  const unsatisfiedCrabs = [];
  const forcedTreasureCells = new Set();

  for (const cKey of crabSet) {
    // Quarantined secondary crabs are ignored for artifact hunting!
    if (secondaryCrabSet.has(cKey)) continue;

    const { x, y } = keyToCoord(cKey);
    let satisfied = false;
    const candidateNeighbors = [];

    for (const [dx, dy] of ORTHO) {
      const nx = x + dx;
      const ny = y + dy;
      const nKey = coordToKey(nx, ny);
      if (!inBounds(nx, ny)) continue;

      if (dugItemMap.has(nKey) || knownArtifactBodyKeys.has(nKey)) {
        satisfied = true;
        break;
      }
      if (!dugCoords.has(nKey) && !sandBlockedSet.has(nKey) && !crabSet.has(nKey) && !knownArtifactBodyKeys.has(nKey)) {
        candidateNeighbors.push(nKey);
      }
    }

    if (!satisfied) {
      unsatisfiedCrabs.push({ key: cKey, candidateNeighbors });
      // If only 1 neighbor can possibly hold the treasure, it is FORCED!
      if (candidateNeighbors.length === 1) {
        const candKey = candidateNeighbors[0];
        if (!knownArtifactBodyKeys.has(candKey)) {
          forcedTreasureCells.add(candKey);
        }
      }
    }
  }

  // CSP Joint Mutual Exclusion Filter for uncompleted target patterns with MRV Ordering
  function filterMutuallyDisjointPlacements(placementsMap, remainingKeys) {
    const filtered = {};
    for (const k of remainingKeys) filtered[k] = [];

    // Filter each individual placement against confirmed placements, known body bones, and already dug target pieces
    for (const pKey of remainingKeys) {
      for (const pl of placementsMap[pKey] || []) {
        if (pl.tiles.some(t => t.isTargetPiece && knownArtifactBodyKeys.has(t.key))) continue;
        const tPiece = pl.tiles.find(t => t.isTargetPiece);
        if (tPiece && targetPiecesFound.some(p => p.key === tPiece.key)) {
          let matchedToThis = false;
          for (const m of validMatchings) {
            if (m[tPiece.key] === pKey) {
              matchedToThis = true;
              break;
            }
          }
          if (!matchedToThis) continue;
        }

        let conflictsWithConfirmed = false;
        for (const cf of confirmedPlacements) {
          if (cf.patternName === pKey) continue;
          const cfOccupied = new Set(cf.tiles.map(t => t.key));
          for (const t of pl.tiles) {
            if (cfOccupied.has(t.key)) {
              conflictsWithConfirmed = true;
              break;
            }
          }
          if (conflictsWithConfirmed) break;
        }
        if (conflictsWithConfirmed) continue;

        filtered[pKey].push(pl);
      }
    }

    if (remainingKeys.length <= 1) {
      // If only 1 pattern remains and there are unclaimed dug Camel Bones:
      // The remaining pattern MUST cover ALL unclaimed dug Camel Bones!
      if (remainingKeys.length === 1 && unclaimedBoneKeys.size > 0) {
        const pKey = remainingKeys[0];
        const coveringBones = filtered[pKey].filter(pl => {
          const plBones = new Set(pl.tiles.filter(t => t.name === "Camel Bone").map(t => t.key));
          return Array.from(unclaimedBoneKeys).every(bk => plBones.has(bk));
        });
        if (coveringBones.length > 0) {
          filtered[pKey] = coveringBones;
        }
      }
      return filtered;
    }

    // When remainingKeys.length > 1, filter by mutual exclusion and crab constraints:
    const multiFiltered = {};
    for (const k of remainingKeys) multiFiltered[k] = [];

    for (const pKey of remainingKeys) {
      const otherKeys = remainingKeys.filter(k => k !== pKey)
        .sort((a, b) => (filtered[a]?.length || 0) - (filtered[b]?.length || 0));

      for (const pl of filtered[pKey]) {
        const plOccupied = new Set(pl.tiles.map(t => t.key));

        function canPlaceRemaining(idx, currentOccupied) {
          if (idx === otherKeys.length) {
            for (const u of unsatisfiedCrabs) {
              const hasPlacedTreasure = u.candidateNeighbors.some(nk => currentOccupied.has(nk));
              if (!hasPlacedTreasure) {
                const hasOpenSlot = u.candidateNeighbors.some(nk => !currentOccupied.has(nk));
                if (!hasOpenSlot) return false;
              }
            }
            return true;
          }
          const otherKey = otherKeys[idx];
          const otherPlacements = filtered[otherKey] || [];

          for (const otherPl of otherPlacements) {
            let conflict = false;
            for (const ot of otherPl.tiles) {
              if (currentOccupied.has(ot.key)) {
                conflict = true;
                break;
              }
            }
            if (!conflict) {
              const nextOccupied = new Set(currentOccupied);
              for (const ot of otherPl.tiles) nextOccupied.add(ot.key);
              if (canPlaceRemaining(idx + 1, nextOccupied)) return true;
            }
          }
          return false;
        }

        if (canPlaceRemaining(0, plOccupied)) {
          multiFiltered[pKey].push(pl);
        }
      }
    }
    return multiFiltered;
  }

  const cspFilteredTargetPlacements = filterMutuallyDisjointPlacements(rawTargetPlacements, uncompletedKeys);

  // -------------------------------------------------------------
  // TRUE JOINT POSTERIOR PROBABILITY ENGINE (Bayesian Global Enumerator)
  // Enumerate all mutually disjoint, crab-consistent global worlds
  // that respect ALL dug target pieces AND cover ALL revealed Camel Bones!
  // -------------------------------------------------------------
  const jointTargetHits = new Map();   // key -> number of valid global worlds with target piece at key
  const jointTreasureHits = new Map(); // key -> number of valid global worlds with ANY treasure piece at key
  let validJointConfigsCount = 0;
  const MAX_CONFIGS_TO_ENUMERATE = 50000;
  const sampleWorlds = [];
  const MAX_SAMPLE_WORLDS = 400;

  if (unmatchedPieces.length > 0 && validMatchings.length > 0) {
    // Found target pieces exist: enumerate over valid bijective matchings piece -> pattern
    for (const matching of validMatchings) {
      if (validJointConfigsCount >= MAX_CONFIGS_TO_ENUMERATE) break;

      const matchedPatterns = Object.values(matching);
      const remainingPatternKeys = targetPatternKeys.filter(k => !matchedPatterns.includes(k) && !completedPatterns.has(k));

      const foundPiecePlacements = [];
      let matchingPossible = true;

      for (const [pieceKey, pKey] of Object.entries(matching)) {
        const cands = (rawTargetPlacements[pKey] || []).filter(pl =>
          pl.coversDugTarget && pl.dugArtifactCoord && pl.dugArtifactCoord.key === pieceKey
        );
        if (cands.length === 0) {
          matchingPossible = false;
          break;
        }
        foundPiecePlacements.push({ pieceKey, pKey, cands });
      }
      if (!matchingPossible) continue;

      function enumerateMatchingWorlds(fpIdx, remIdx, currentPlacements, currentOccupied, currentCoveredBones) {
        if (validJointConfigsCount >= MAX_CONFIGS_TO_ENUMERATE) return;

        // Phase 1: assign placements to each found target piece
        if (fpIdx < foundPiecePlacements.length) {
          const entry = foundPiecePlacements[fpIdx];
          for (const pl of entry.cands) {
            let conflict = false;
            for (const t of pl.tiles) {
              if (currentOccupied.has(t.key)) { conflict = true; break; }
            }
            if (!conflict) {
              const nextOcc = new Set(currentOccupied);
              const nextBones = new Set(currentCoveredBones);
              for (const t of pl.tiles) {
                nextOcc.add(t.key);
                if (dugItemMap.has(t.key) && isMatch(dugItemMap.get(t.key), "Camel Bone")) {
                  nextBones.add(t.key);
                }
              }
              currentPlacements.push(pl);
              enumerateMatchingWorlds(fpIdx + 1, 0, currentPlacements, nextOcc, nextBones);
              currentPlacements.pop();
            }
          }
          return;
        }

        // Phase 2: assign placements to remaining unfound patterns
        if (remIdx < remainingPatternKeys.length) {
          const pKey = remainingPatternKeys[remIdx];
          const cands = cspFilteredTargetPlacements[pKey] || [];
          for (const pl of cands) {
            if (pl.coversDugTarget) continue;
            let conflict = false;
            for (const t of pl.tiles) {
              if (currentOccupied.has(t.key)) { conflict = true; break; }
            }
            if (!conflict) {
              const nextOcc = new Set(currentOccupied);
              const nextBones = new Set(currentCoveredBones);
              for (const t of pl.tiles) {
                nextOcc.add(t.key);
                if (dugItemMap.has(t.key) && isMatch(dugItemMap.get(t.key), "Camel Bone")) {
                  nextBones.add(t.key);
                }
              }
              currentPlacements.push(pl);
              enumerateMatchingWorlds(fpIdx, remIdx + 1, currentPlacements, nextOcc, nextBones);
              currentPlacements.pop();
            }
          }
          return;
        }

        // Phase 3: ALL patterns placed! Check Bone Conservation & Crab Consistency
        // BONE CONSERVATION: Every dug Camel Bone on the grid MUST be covered!
        if (allDugBones.length > 0) {
          const coversAllDugBones = allDugBones.every(bk => currentCoveredBones.has(bk));
          if (!coversAllDugBones) return; // Physically impossible world!
        }

        // CRAB CONSISTENCY:
        for (const u of unsatisfiedCrabs) {
          const hasPlacedTreasure = u.candidateNeighbors.some(nk => currentOccupied.has(nk));
          if (!hasPlacedTreasure) {
            const hasOpenSlot = u.candidateNeighbors.some(nk => !currentOccupied.has(nk));
            if (!hasOpenSlot) return;
          }
        }

        validJointConfigsCount++;
        const shouldSample = (sampleWorlds.length < MAX_SAMPLE_WORLDS || Math.floor(Math.random() * validJointConfigsCount) < MAX_SAMPLE_WORLDS);
        if (shouldSample) {
          const worldTargets = new Set();
          const worldUnfoundBones = new Set();
          const worldFoundBones = new Set();
          const worldUnfoundTreasures = new Set();
          const worldTreasures = new Set();
          for (let i = 0; i < currentPlacements.length; i++) {
            const pl = currentPlacements[i];
            const isFoundPattern = i < foundPiecePlacements.length;
            for (const t of pl.tiles) {
              worldTreasures.add(t.key);
              if (t.isTargetPiece) {
                if (!isFoundPattern) {
                  worldTargets.add(t.key);
                  worldUnfoundTreasures.add(t.key);
                }
              } else {
                if (isFoundPattern) {
                  worldFoundBones.add(t.key);
                } else {
                  worldUnfoundBones.add(t.key);
                  worldUnfoundTreasures.add(t.key);
                }
              }
            }
          }
          const sampleItem = {
            targets: worldTargets,
            unfoundBones: worldUnfoundBones,
            foundBones: worldFoundBones,
            unfoundTreasures: worldUnfoundTreasures,
            treasures: worldTreasures
          };
          if (sampleWorlds.length < MAX_SAMPLE_WORLDS) {
            sampleWorlds.push(sampleItem);
          } else {
            const replaceIdx = Math.floor(Math.random() * validJointConfigsCount);
            if (replaceIdx < MAX_SAMPLE_WORLDS) {
              sampleWorlds[replaceIdx] = sampleItem;
            }
          }
        }
        for (const pl of currentPlacements) {
          for (const t of pl.tiles) {
            jointTreasureHits.set(t.key, (jointTreasureHits.get(t.key) || 0) + 1);
            if (t.isTargetPiece && !targetPiecesFound.some(p => p.key === t.key)) {
              jointTargetHits.set(t.key, (jointTargetHits.get(t.key) || 0) + 1);
            }
          }
        }
      }

      const initialOccupied = new Set();
      const initialBones = new Set();
      for (const cf of confirmedPlacements) {
        for (const t of cf.tiles) {
          initialOccupied.add(t.key);
          if (dugItemMap.has(t.key) && isMatch(dugItemMap.get(t.key), "Camel Bone")) {
            initialBones.add(t.key);
          }
        }
      }

      enumerateMatchingWorlds(0, 0, [], initialOccupied, initialBones);

      if (sampleWorlds.length > 0 && allDugBones.length > 0) {
        for (const bk of allDugBones) {
          let foundCount = 0;
          for (const w of sampleWorlds) {
            if (w.foundBones && w.foundBones.has(bk)) foundCount++;
          }
          if (foundCount / sampleWorlds.length >= 0.4) {
            retiredBoneKeys.add(bk);
            knownArtifactBodyKeys.add(bk);
            unclaimedBoneKeys.delete(bk);
          }
        }
      }
    }
  } else if (unmatchedPieces.length === 0 && uncompletedKeys.length > 0) {
    // 0 unassigned target pieces found: enumerate target patterns
    const sortedTargetKeys = uncompletedKeys.slice().sort((a, b) => 
      (cspFilteredTargetPlacements[a]?.length || 0) - (cspFilteredTargetPlacements[b]?.length || 0)
    );

    function searchJointWorlds(idx, currentOccupied, currentCoveredBones, currentPlacements) {
      if (validJointConfigsCount >= MAX_CONFIGS_TO_ENUMERATE) return;

      if (idx === sortedTargetKeys.length) {
        if (allDugBones.length > 0) {
          const coversAllDugBones = allDugBones.every(bk => currentCoveredBones.has(bk));
          if (!coversAllDugBones) return;
        }

        for (const u of unsatisfiedCrabs) {
          const hasPlacedTreasure = u.candidateNeighbors.some(nk => currentOccupied.has(nk));
          if (!hasPlacedTreasure) {
            const hasOpenSlot = u.candidateNeighbors.some(nk => !currentOccupied.has(nk));
            if (!hasOpenSlot) return;
          }
        }

        validJointConfigsCount++;
        const shouldSample = (sampleWorlds.length < MAX_SAMPLE_WORLDS || Math.floor(Math.random() * validJointConfigsCount) < MAX_SAMPLE_WORLDS);
        if (shouldSample) {
          const worldTargets = new Set();
          const worldUnfoundBones = new Set();
          const worldFoundBones = new Set();
          const worldUnfoundTreasures = new Set();
          const worldTreasures = new Set();
          for (const pl of currentPlacements) {
            for (const t of pl.tiles) {
              worldTreasures.add(t.key);
              worldUnfoundTreasures.add(t.key);
              if (t.isTargetPiece) {
                worldTargets.add(t.key);
              } else {
                worldUnfoundBones.add(t.key);
              }
            }
          }
          const sampleItem = {
            targets: worldTargets,
            unfoundBones: worldUnfoundBones,
            foundBones: worldFoundBones,
            unfoundTreasures: worldUnfoundTreasures,
            treasures: worldTreasures
          };
          if (sampleWorlds.length < MAX_SAMPLE_WORLDS) {
            sampleWorlds.push(sampleItem);
          } else {
            const replaceIdx = Math.floor(Math.random() * validJointConfigsCount);
            if (replaceIdx < MAX_SAMPLE_WORLDS) {
              sampleWorlds[replaceIdx] = sampleItem;
            }
          }
        }
        for (const pl of currentPlacements) {
          for (const t of pl.tiles) {
            jointTreasureHits.set(t.key, (jointTreasureHits.get(t.key) || 0) + 1);
            if (t.isTargetPiece) {
              jointTargetHits.set(t.key, (jointTargetHits.get(t.key) || 0) + 1);
            }
          }
        }
        return;
      }

      const pKey = sortedTargetKeys[idx];
      const placements = cspFilteredTargetPlacements[pKey] || [];

      for (const pl of placements) {
        if (validJointConfigsCount >= MAX_CONFIGS_TO_ENUMERATE) return;

        let conflict = false;
        for (const t of pl.tiles) {
          if (currentOccupied.has(t.key)) { conflict = true; break; }
        }
        if (!conflict) {
          const nextOccupied = new Set(currentOccupied);
          const nextBones = new Set(currentCoveredBones);
          for (const t of pl.tiles) {
            nextOccupied.add(t.key);
            if (dugItemMap.has(t.key) && isMatch(dugItemMap.get(t.key), "Camel Bone")) {
              nextBones.add(t.key);
            }
          }
          currentPlacements.push(pl);
          searchJointWorlds(idx + 1, nextOccupied, nextBones, currentPlacements);
          currentPlacements.pop();
        }
      }
    }

    const initialOccupied = new Set();
    const initialBones = new Set();
    for (const cf of confirmedPlacements) {
      for (const t of cf.tiles) {
        initialOccupied.add(t.key);
        if (dugItemMap.has(t.key) && isMatch(dugItemMap.get(t.key), "Camel Bone")) {
          initialBones.add(t.key);
        }
      }
    }

    searchJointWorlds(0, initialOccupied, initialBones, []);
  } else if (uncompletedKeys.length === 0) {
    validJointConfigsCount = 1;
  }

  // -------------------------------------------------------------
  // GUARANTEED CRAB DEDUCTION ENGINE (Halo Theorem)
  // In Sunflower Land, every orthogonal neighbor of ANY treasure piece
  // MUST be a Crab (unless it is a treasure itself). Sand NEVER touches a treasure.
  // If an undug cell touches a revealed treasure and cannot be part of ANY valid
  // active treasure placement, it is 100% MATHEMATICALLY GUARANTEED TO BE A CRAB!
  // -------------------------------------------------------------
  const possibleTreasureKeys = new Set();
  for (const pKey of uncompletedKeys) {
    for (const pl of (cspFilteredTargetPlacements[pKey] || [])) {
      for (const t of pl.tiles) {
        possibleTreasureKeys.add(t.key);
      }
    }
  }
  for (const cf of confirmedPlacements) {
    for (const t of cf.tiles) {
      if (!dugCoords.has(t.key)) possibleTreasureKeys.add(t.key);
    }
  }
  for (const k of secondaryTreasureKeys) {
    possibleTreasureKeys.add(k);
  }
  for (const [k] of secondaryTreasureMap.entries()) {
    possibleTreasureKeys.add(k);
  }

  const predictedCrabSet = new Set();
  for (const [tKey, tName] of dugItemMap.entries()) {
    if (isMatch(tName, "Camel Bone")) continue;
    const { x, y } = keyToCoord(tKey);
    for (const [dx, dy] of ORTHO) {
      const nx = x + dx;
      const ny = y + dy;
      if (!inBounds(nx, ny)) continue;
      const nKey = coordToKey(nx, ny);
      if (dugCoords.has(nKey) || sandBlockedSet.has(nKey)) continue;

      if (!possibleTreasureKeys.has(nKey)) {
        predictedCrabSet.add(nKey);
      }
    }
  }

  // Build artifactMap (original mod's coproMap)
  // artifactMap[coordKey] = [ { set: [placement] } ]
  const artifactMap = {};
  const guaranteedTargetCells = new Map();
  for (const k of knownArtifactBodyKeys) {
    if (!dugCoords.has(k)) {
      const { x, y } = keyToCoord(k);
      guaranteedTargetCells.set(k, {
        x,
        y,
        key: k,
        reason: "🦴 Xương Lạc Đà còn thiếu của Di vật đã tìm thấy - Phải đào để hoàn thành!"
      });
    }
  }
  const targetCandidateFrequency = new Map();
  const targetProbabilityMap = new Map();
  const candidateCluesMap = new Map();

  const targetAnalysis = [];

  for (const pKey of targetPatternKeys) {
    const isCompleted = patternToConfirmedCoord.has(pKey) || completedPatterns.has(pKey);
    const confirmedCoord = patternToConfirmedCoord.get(pKey) || null;

    if (isCompleted) {
      targetAnalysis.push({
        patternName: pKey,
        displayName: pKey.replace(/^ARTEFACT_/, "").replace(/_/g, " "),
        status: "found",
        isCompleted: true,
        confirmedCoord,
        candidateKeys: confirmedCoord ? [confirmedCoord.key] : [],
        validPlacementsCount: 1
      });
      continue;
    }

    const placements = cspFilteredTargetPlacements[pKey] || [];

    const piecePositions = new Map();
    for (const pl of placements) {
      const tPiece = pl.tiles.find(t => t.isTargetPiece);
      if (tPiece && !knownArtifactBodyKeys.has(tPiece.key) && !sandBlockedSet.has(tPiece.key) && !predictedCrabSet.has(tPiece.key)) {
        if (!piecePositions.has(tPiece.key)) {
          piecePositions.set(tPiece.key, []);
        }
        piecePositions.get(tPiece.key).push(pl);
      }
    }

    let status = "searching";
    let guaranteedKey = null;

    if (piecePositions.size === 1 && !potentiallyFoundPatterns.has(pKey)) {
      const candKey = Array.from(piecePositions.keys())[0];
      if (!dugCoords.has(candKey) && !sandBlockedSet.has(candKey) && !knownArtifactBodyKeys.has(candKey) && !predictedCrabSet.has(candKey)) {
        status = "guaranteed";
        guaranteedKey = candKey;
        const { x, y } = keyToCoord(guaranteedKey);
        guaranteedTargetCells.set(guaranteedKey, {
          x,
          y,
          key: guaranteedKey,
          patternName: pKey,
          pieceName: seasonArtifact
        });
      }
    }

    const totalPls = Math.max(1, placements.length);
    for (const [k, pls] of piecePositions.entries()) {
      if (!dugCoords.has(k) && !sandBlockedSet.has(k) && !knownArtifactBodyKeys.has(k) && !predictedCrabSet.has(k)) {
        // If joint configurations exist, only candidates present in at least 1 valid world are physically possible!
        if (validJointConfigsCount > 0 && !(jointTargetHits.get(k) > 0)) {
          continue;
        }

        if (!artifactMap[k]) artifactMap[k] = [];
        let maxClues = candidateCluesMap.get(k) || 0;
        for (const pl of pls) {
          artifactMap[k].push({ set: [pl] });
          let validClues = 0;
          for (const t of pl.tiles) {
            if (!t.isTargetPiece && dugItemMap.has(t.key) && isMatch(dugItemMap.get(t.key), "Camel Bone") && !retiredBoneKeys.has(t.key)) {
              validClues++;
            }
          }
          if (validClues > maxClues) {
            maxClues = validClues;
          }
        }
        candidateCluesMap.set(k, maxClues);
        targetCandidateFrequency.set(k, (targetCandidateFrequency.get(k) || 0) + pls.length);

        // Compute true joint posterior probability if joint worlds exist, otherwise fallback
        const trueProb = validJointConfigsCount > 0 
          ? ((jointTargetHits.get(k) || 0) / validJointConfigsCount)
          : Math.min(1.0, pls.length / totalPls);
        
        targetProbabilityMap.set(k, Math.min(1.0, trueProb));

        if (trueProb >= 0.999 && !guaranteedTargetCells.has(k)) {
          const { x, y } = keyToCoord(k);
          guaranteedTargetCells.set(k, {
            x,
            y,
            key: k,
            patternName: pKey,
            pieceName: seasonArtifact
          });
        }
      }
    }

    targetAnalysis.push({
      patternName: pKey,
      displayName: pKey.replace(/^ARTEFACT_/, "").replace(/_/g, " "),
      status,
      isCompleted: false,
      guaranteedKey,
      candidateKeys: Array.from(piecePositions.keys()),
      validPlacementsCount: placements.length
    });
  }

  // Cross-pattern deduction: if all active remaining patterns require the same cell
  for (const [cKey, freq] of targetCandidateFrequency.entries()) {
    if (dugCoords.has(cKey)) continue;
    const activeRemaining = targetAnalysis.filter(t => t.status !== "found");
    if (activeRemaining.length > 0 && !guaranteedTargetCells.has(cKey)) {
      const allRequireThis = activeRemaining.every(t => t.candidateKeys.includes(cKey) && t.candidateKeys.length === 1);
      if (allRequireThis) {
        const { x, y } = keyToCoord(cKey);
        guaranteedTargetCells.set(cKey, {
          x,
          y,
          key: cKey,
          patternName: activeRemaining[0].patternName,
          pieceName: seasonArtifact
        });
      }
    }
  }

  // Estimated Shovels Range to Complete
  let estimatedShovelsMin = 0;
  let estimatedShovelsMax = 0;
  for (const t of targetAnalysis) {
    if (t.status === "found") continue;
    if (t.status === "guaranteed") {
      estimatedShovelsMin += 1;
      estimatedShovelsMax += 1;
    } else {
      estimatedShovelsMin += 1;
      estimatedShovelsMax += Math.min(3, Math.max(1, t.candidateKeys.length));
    }
  }

  // COMPLETION CHECK: All targets needed for this specific board found
  const targetsNeededOnThisBoard = targetPatternKeys.filter(k => !completedPatterns.has(k)).length;
  const allTargetsFound = (targetPatternKeys.length === 0) || (targetsNeededOnThisBoard === 0);

  let bestNextDig = null;
  let topPicks = [];

  if (allTargetsFound) {
    bestNextDig = null;
    topPicks = [];
    guaranteedTargetCells.clear();
  } else if (strategy === 'infogain') {
    // -------------------------------------------------------------
    // STRATEGY: EXPECTED INFORMATION GAIN / BAYESIAN DECISION MODEL
    // -------------------------------------------------------------
    const candidateList = [];
    const numWorlds = sampleWorlds.length;
    const candidateKeysToScore = new Set(Object.keys(artifactMap));
    for (const key of guaranteedTargetCells.keys()) {
      candidateKeysToScore.add(key);
    }

    if (candidateKeysToScore.size === 0) {
      for (const u of unsatisfiedCrabs) {
        for (const nk of u.candidateNeighbors) candidateKeysToScore.add(nk);
      }
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          if ((x + 2 * y) % 5 === 0) candidateKeysToScore.add(coordToKey(x, y));
        }
      }
    }

    const filteredCandidateKeys = [];
    for (const key of candidateKeysToScore) {
      if (dugCoords.has(key) || sandBlockedSet.has(key) || predictedCrabSet.has(key) || secondaryTreasureKeys.has(key)) {
        continue;
      }
      if (numWorlds > 0) {
        let foundBoneCount = 0;
        for (const w of sampleWorlds) {
          if (w.foundBones && w.foundBones.has(key)) foundBoneCount++;
        }
        if (foundBoneCount / numWorlds > 0.3) continue;
      }
      filteredCandidateKeys.push(key);
    }

    const genuineUnclaimedBones = new Set();
    if (numWorlds > 0 && allDugBones.length > 0) {
      for (const bk of allDugBones) {
        let unfoundCount = 0;
        for (const w of sampleWorlds) {
          if (w.unfoundBones && w.unfoundBones.has(bk)) unfoundCount++;
        }
        if (unfoundCount / numWorlds >= 0.35) {
          genuineUnclaimedBones.add(bk);
        }
      }
    } else if (allDugBones.length > 0) {
      for (const bk of allDugBones) genuineUnclaimedBones.add(bk);
    }

    let maxBoardTargetProb = 0;
    for (const key of filteredCandidateKeys) {
      const p = targetProbabilityMap.get(key) || 0;
      if (p > maxBoardTargetProb) maxBoardTargetProb = p;
    }

    for (const key of filteredCandidateKeys) {
      const { x, y } = keyToCoord(key);

      let nTarget = 0;
      let nBone = 0;
      let nCrab = 0;
      let nSand = 0;

      if (numWorlds > 0) {
        for (const w of sampleWorlds) {
          if (w.targets.has(key)) {
            nTarget++;
          } else if (w.unfoundBones && w.unfoundBones.has(key)) {
            nBone++;
          } else {
            let touches = false;
            for (const [dx, dy] of ORTHO) {
              const nx = x + dx;
              const ny = y + dy;
              if (inBounds(nx, ny) && w.unfoundTreasures && w.unfoundTreasures.has(coordToKey(nx, ny))) {
                touches = true;
                break;
              }
            }
            if (touches) nCrab++;
            else nSand++;
          }
        }
      }

      const pTarget = validJointConfigsCount > 0 ? (targetProbabilityMap.get(key) || 0) : (numWorlds > 0 ? (nTarget / numWorlds) : 0);
      const pTreasure = validJointConfigsCount > 0 ? ((jointTreasureHits.get(key) || 0) / validJointConfigsCount) : pTarget;
      const pBone = Math.max(0, pTreasure - pTarget);
      const pCrab = numWorlds > 0 ? (nCrab / numWorlds) : 0.2;
      const pSand = Math.max(0, 1 - pTarget - pBone - pCrab);

      let entropy = 0;
      for (const p of [pTarget, pBone, pCrab, pSand]) {
        if (p > 1e-6) {
          entropy -= p * Math.log2(p);
        }
      }

      let undugNeighborsCount = 0;
      for (const [dx, dy] of ORTHO) {
        const nx = x + dx;
        const ny = y + dy;
        if (inBounds(nx, ny)) {
          const nk = coordToKey(nx, ny);
          if (!dugCoords.has(nk) && !sandBlockedSet.has(nk) && !predictedCrabSet.has(nk)) {
            undugNeighborsCount++;
          }
        }
      }

      let touchingUnsatisfiedCrabs = 0;
      let minCrabCandidates = 99;
      const isForcedByCrab = forcedTreasureCells.has(key);
      for (const u of unsatisfiedCrabs) {
        if (u.candidateNeighbors.includes(key)) {
          touchingUnsatisfiedCrabs++;
          if (u.candidateNeighbors.length < minCrabCandidates) {
            minCrabCandidates = u.candidateNeighbors.length;
          }
        }
      }

      // Clues matched against genuinely unclaimed Camel Bones
      let validClues = 0;
      if (genuineUnclaimedBones.size > 0 && artifactMap[key]) {
        for (const entry of artifactMap[key]) {
          for (const pl of entry.set) {
            let cCount = 0;
            for (const t of pl.tiles) {
              if (!t.isTargetPiece && genuineUnclaimedBones.has(t.key)) cCount++;
            }
            if (cCount > validClues) validClues = cCount;
          }
        }
      }

      const secProb = secondarySuspectProb.get(key) || 0;
      const isGuaranteed = (pTarget >= 0.999) || guaranteedTargetCells.has(key);

      let score = 0;
      if (isGuaranteed) {
        score = 1000000 + pTarget * 10000;
      } else if (isForcedByCrab && (pTarget + pBone) >= 0.5) {
        score = 500000 + (pTarget + pBone) * 10000;
      } else {
        score += pTarget * 30000;
        score += validClues * 25000;
        score += pBone * 5000;
        score += entropy * 1000;
        score += (pSand * undugNeighborsCount) * 300;

        if (touchingUnsatisfiedCrabs >= 2) {
          score += touchingUnsatisfiedCrabs * 1500;
        } else if (touchingUnsatisfiedCrabs === 1) {
          if (minCrabCandidates === 1) score += 4000;
          else if (minCrabCandidates === 2) score += 600;
        }

        if (secProb > 0) {
          score -= secProb * 4000;
        }

        const exploreWeight = Math.max(0, 1 - 2.5 * maxBoardTargetProb);
        if (exploreWeight > 0 && validClues === 0) {
          const isLatticePoint = ((x + 2 * y) % 5 === 0);
          if (isLatticePoint) score += 350 * exploreWeight;

          const distFromCenter = Math.abs(x - 4.5) + Math.abs(y - 4.5);
          score += (9 - distFromCenter) * 15 * exploreWeight;

          let unrevealedNear = 0;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (inBounds(nx, ny)) {
                const nk = coordToKey(nx, ny);
                if (!dugCoords.has(nk) && !sandBlockedSet.has(nk) && !predictedCrabSet.has(nk)) {
                  unrevealedNear++;
                }
              }
            }
          }
          score += unrevealedNear * 12 * exploreWeight;

          if (dugCoords.size > 0) {
            let minDistToDug = 99;
            for (const dk of dugCoords) {
              const { x: dx, y: dy } = keyToCoord(dk);
              const d = Math.max(Math.abs(x - dx), Math.abs(y - dy));
              if (d < minDistToDug) minDistToDug = d;
            }
            score += Math.min(4, minDistToDug) * 35 * exploreWeight;
          }

          if (targetPiecesFound.length > 0) {
            let minDistToFoundTarget = 99;
            for (const p of targetPiecesFound) {
              const d = Math.max(Math.abs(x - p.x), Math.abs(y - p.y));
              if (d < minDistToFoundTarget) minDistToFoundTarget = d;
            }
            if (minDistToFoundTarget >= 3) {
              score += Math.min(6, minDistToFoundTarget) * 40 * exploreWeight;
            }
          }
        }
      }

      const probPct = Math.round(pTarget * 100);
      let reasonText = "";
      if (isGuaranteed) {
        reasonText = `🎯 Chắc chắn 100% chứa ${seasonArtifact} - Đào ngay!`;
      } else if (isForcedByCrab && (pTarget + pBone) >= 0.5) {
        reasonText = `🎯 Ô khả dĩ duy nhất cạnh Cua - Chắc chắn chứa kho báu!`;
      } else if (validClues > 0) {
        reasonText = `🎯 Khớp ${validClues} mảnh Camel Bone chưa giải - Khả năng cực cao là ${seasonArtifact}!`;
      } else if (pTarget >= 0.3) {
        reasonText = `🎯 Xác suất ${probPct}% trúng ${seasonArtifact} (Entropy ${entropy.toFixed(2)} bit) - Tối ưu lượng cuốc!`;
      } else if (pBone >= 0.25) {
        reasonText = `🦴 Xác suất ${Math.round(pBone * 100)}% trúng Xương Lạc Đà để định vị di vật!`;
      } else if (touchingUnsatisfiedCrabs >= 2) {
        reasonText = `⚡ Giao điểm sát thủ ${touchingUnsatisfiedCrabs} Cua - Tối đa hóa khả năng trúng di vật!`;
      } else if (entropy >= 1.2) {
        reasonText = `⚡ Điểm thăm dò thông tin tối đa (Entropy ${entropy.toFixed(2)} bit) - Triệt tiêu nhiều thế nhất!`;
      } else if (((x + 2 * y) % 5 === 0)) {
        reasonText = `⚡ Thăm dò theo Lưới bước Mã tối ưu độ phủ bàn đào, tránh đào trùng cát!`;
      } else {
        reasonText = `⚡ Thăm dò giảm thiểu kỳ vọng số cuốc còn lại!`;
      }

      candidateList.push({
        x,
        y,
        key,
        score,
        probability: pTarget,
        boneProbability: pBone,
        crabProbability: pCrab,
        sandProbability: pSand,
        entropy,
        treasureProb: pTarget + pBone,
        percentage: `${probPct}%`,
        isGuaranteed,
        reason: reasonText,
        touchingCrabs: touchingUnsatisfiedCrabs
      });
    }

    candidateList.sort((a, b) => b.score - a.score);

    topPicks = candidateList.slice(0, 3).map((item, idx) => ({
      rank: idx + 1,
      x: item.x,
      y: item.y,
      key: item.key,
      label: coordToLabel(item.x, item.y),
      probability: item.probability,
      percentage: item.percentage,
      isGuaranteed: item.isGuaranteed,
      reason: item.reason,
      entropy: item.entropy,
      score: item.score
    }));

    bestNextDig = topPicks[0] || null;
  } else {
    const candidateList = [];

    // Tight Clue Detection
    const hasTightClues = Array.from(candidateCluesMap.values()).some(v => v > 0) ||
      unsatisfiedCrabs.some(u => u.candidateNeighbors.length <= 2 && u.candidateNeighbors.some(nk => (targetProbabilityMap.get(nk) || 0) >= 0.15));

    for (const [key, sets] of Object.entries(artifactMap)) {
      if (dugCoords.has(key) || sandBlockedSet.has(key) || predictedCrabSet.has(key)) continue;
      const { x, y } = keyToCoord(key);
      const trueProb = targetProbabilityMap.get(key) || 0;
      const trueTreasureProb = validJointConfigsCount > 0 ? ((jointTreasureHits.get(key) || 0) / validJointConfigsCount) : 0;
      const count = sets.length;

      // Secondary Formation Suspect Penalty
      const secProb = secondarySuspectProb.get(key) || 0;

      let isGuaranteed = (trueProb >= 0.999) || guaranteedTargetCells.has(key);
      let score = trueProb * 10000;
      if (isGuaranteed) {
        score = 100000 + trueProb * 10000;
      }

      // Clues & Treasure probability value: matched dug Camel Bones are direct physical evidence
      const clues = candidateCluesMap.get(key) || 0;
      score += clues * 30000;
      score += trueTreasureProb * 800;

      // Crab Constraints & Triangulation
      let touchingUnsatisfiedCrabs = 0;
      let isForcedByCrab = forcedTreasureCells.has(key);
      let minCrabCandidateCount = 99;

      if (isForcedByCrab) score += 5000;

      for (const u of unsatisfiedCrabs) {
        if (u.candidateNeighbors.includes(key)) {
          touchingUnsatisfiedCrabs++;
          if (u.candidateNeighbors.length < minCrabCandidateCount) {
            minCrabCandidateCount = u.candidateNeighbors.length;
          }
        }
      }

      if (touchingUnsatisfiedCrabs === 1) {
        if (minCrabCandidateCount === 1) score += 3000;
        else if (minCrabCandidateCount === 2) score += (trueProb >= 0.15 ? 800 : 300);
      } else if (touchingUnsatisfiedCrabs >= 2) {
        score += 3500;
      }
      if (touchingUnsatisfiedCrabs >= 3) {
        score += 6000;
      }

      // Penalty for suspected secondary formation pieces
      if (secProb > 0) score -= secProb * 4000;

      // In Sunflower Land, artifacts can be directly adjacent (e.g. D4 and D5).
      // We NEVER penalize proximity to found targets!
      let minDistToFoundTarget = 99;
      if (targetPiecesFound.length > 0) {
        for (const p of targetPiecesFound) {
          const d = Math.max(Math.abs(x - p.x), Math.abs(y - p.y));
          if (d < minDistToFoundTarget) minDistToFoundTarget = d;
        }
        if (targetPiecesFound.length < 3 && clues === 0 && minDistToFoundTarget >= 3) {
          score += minDistToFoundTarget * 20;
        }
      }

      // Opening moves: Knight's Move Lattice + Unrevealed Area Coverage
      if (!hasTightClues) {
        const isLatticePoint = ((x + 2 * y) % 5 === 0);
        if (isLatticePoint) score += 250;

        let unrevealedNear = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (inBounds(nx, ny)) {
              const nk = coordToKey(nx, ny);
              if (!dugCoords.has(nk) && !sandBlockedSet.has(nk) && !predictedCrabSet.has(nk)) {
                unrevealedNear++;
              }
            }
          }
        }
        score += unrevealedNear * 12;

        if (dugCoords.size > 0) {
          let minDist = 99;
          for (const dk of dugCoords) {
            const { x: dx, y: dy } = keyToCoord(dk);
            const d = Math.max(Math.abs(x - dx), Math.abs(y - dy));
            if (d < minDist) minDist = d;
          }
          score += Math.min(4, minDist) * 35;
        }
      }

      const distFromCenter = Math.abs(x - 4.5) + Math.abs(y - 4.5);
      score += (9 - distFromCenter) * 1.5;

      const probPct = Math.round(trueProb * 100);
      let reasonText = "";
      if (isGuaranteed) {
        reasonText = `🎯 Chắc chắn 100% chứa ${seasonArtifact} - Đào ngay!`;
      } else if (isForcedByCrab) {
        reasonText = `🎯 Ô khả dĩ duy nhất cạnh Cua - Chắc chắn chứa kho báu!`;
      } else if (clues > 0) {
        reasonText = `🎯 Khớp ${clues} mảnh Camel Bone đã đào - Khả năng cực cao là ${seasonArtifact}!`;
      } else if (touchingUnsatisfiedCrabs >= 2) {
        reasonText = `⚡ Giao điểm sát thủ ${touchingUnsatisfiedCrabs} Cua - Tối đa hóa khả năng trúng di vật!`;
      } else if (probPct > 0) {
        if (targetPiecesFound.length > 0 && minDistToFoundTarget >= 3) {
          reasonText = `⚡ Thăm dò góc xa (cách di vật cũ ${minDistToFoundTarget} ô, xác suất ${probPct}%) - Tối ưu tìm di vật mới!`;
        } else {
          reasonText = `⚡ Xác suất ${probPct}% trúng ${seasonArtifact} (${count} thế đi qua) - Tối ưu lượng cuốc!`;
        }
      } else {
        if (targetPiecesFound.length > 0 && minDistToFoundTarget >= 3) {
          reasonText = `⚡ Thăm dò góc xa (cách di vật cũ ${minDistToFoundTarget} ô) theo Lưới bước Mã để mở vùng đất mới!`;
        } else {
          reasonText = `⚡ Điểm thăm dò thông tin tối ưu theo Lưới bước Mã để triệt tiêu các thế sai!`;
        }
      }

      candidateList.push({
        x,
        y,
        key,
        score,
        probability: trueProb,
        treasureProb: trueTreasureProb,
        percentage: `${probPct}%`,
        isGuaranteed,
        reason: reasonText,
        touchingCrabs: touchingUnsatisfiedCrabs
      });
    }

    candidateList.sort((a, b) => b.score - a.score);

    topPicks = candidateList.slice(0, 3).map((item, idx) => ({
      rank: idx + 1,
      x: item.x,
      y: item.y,
      key: item.key,
      label: coordToLabel(item.x, item.y),
      probability: item.probability,
      percentage: item.percentage,
      isGuaranteed: item.isGuaranteed,
      reason: item.reason
    }));

    bestNextDig = topPicks[0] || null;
  }

  // Fallback probe if bestNextDig was empty but targets remain
  if (!bestNextDig && !allTargetsFound) {
      let bestProbe = null;
      let bestProbeScore = -Infinity;
      let probeReason = "⚡ Thăm dò theo Lưới bước Mã tối ưu độ phủ bàn đào, tránh đào trùng cát!";

      // Priority 1: Forced treasure cells from crabs
      for (const fc of forcedTreasureCells) {
        if (!dugCoords.has(fc) && !sandBlockedSet.has(fc) && !knownArtifactBodyKeys.has(fc)) {
          const { x, y } = keyToCoord(fc);
          bestProbe = { x, y, key: fc };
          bestProbeScore = 99999;
          probeReason = "🦀 Bắt buộc bởi Cua: Ô duy nhất lân cận có thể chứa kho báu!";
          break;
        }
      }

      // Priority 2: Candidates adjacent/connected to unclaimed dug Camel Bones!
      if (!bestProbe && unclaimedBoneKeys && unclaimedBoneKeys.size > 0) {
        for (const bk of unclaimedBoneKeys) {
          const { x: bx, y: by } = keyToCoord(bk);
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = bx + dx;
              const ny = by + dy;
              if (inBounds(nx, ny)) {
                const nk = coordToKey(nx, ny);
                if (!dugCoords.has(nk) && !sandBlockedSet.has(nk) && !knownArtifactBodyKeys.has(nk) && !crabSet.has(nk)) {
                  bestProbe = { x: nx, y: ny, key: nk };
                  bestProbeScore = 20000;
                  probeReason = `🦴 Thăm dò cạnh Xương Lạc Đà (${coordToLabel(bx, by)}) để định vị di vật!`;
                  break;
                }
              }
            }
            if (bestProbe) break;
          }
          if (bestProbe) break;
        }
      }

      // Priority 3: Candidates touching unsatisfied crabs
      if (!bestProbe) {
        for (const u of unsatisfiedCrabs) {
          for (const nk of u.candidateNeighbors) {
            if (!dugCoords.has(nk) && !sandBlockedSet.has(nk) && !knownArtifactBodyKeys.has(nk)) {
              const { x, y } = keyToCoord(nk);
              const score = 5000 + (10 - u.candidateNeighbors.length) * 1000;
              if (score > bestProbeScore) {
                bestProbeScore = score;
                bestProbe = { x, y, key: nk };
                probeReason = `🦀 Thăm dò quanh Cua (${u.candidateNeighbors.length} ô khả thi) để kích hoạt manh mối!`;
              }
            }
          }
        }
      }

      // Priority 3: Knight's move lattice on undug, non-sand-blocked, non-body cells
      if (!bestProbe) {
        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 10; x++) {
            const k = coordToKey(x, y);
            if (dugCoords.has(k) || sandBlockedSet.has(k) || predictedCrabSet.has(k) || knownArtifactBodyKeys.has(k)) continue;
            const isLattice = ((x + 2 * y) % 5 === 0);
            const score = (isLattice ? 100 : 0) + (9 - Math.abs(x - 4.5) - Math.abs(y - 4.5));
            if (score > bestProbeScore) {
              bestProbeScore = score;
              bestProbe = { x, y, key: k };
              probeReason = "⚡ Thăm dò theo Lưới bước Mã tối ưu độ phủ bàn đào, tránh đào trùng cát!";
            }
          }
        }
      }

      if (bestProbe) {
        const pLabel = coordToLabel(bestProbe.x, bestProbe.y);
        bestNextDig = {
          x: bestProbe.x,
          y: bestProbe.y,
          key: bestProbe.key,
          label: pLabel,
          score: bestProbeScore,
          probability: bestProbeScore === 99999 ? 0.99 : (bestProbeScore >= 5000 ? 0.45 : 0.15),
          percentage: bestProbeScore === 99999 ? "100%" : (bestProbeScore >= 5000 ? "45%" : "15%"),
          isGuaranteed: bestProbeScore === 99999,
          reason: probeReason
        };
        topPicks = [{
          rank: 1,
          ...bestNextDig
        }];
      }
    }

  // All placements list & Map for hover
  const allPlacementsList = [];
  const patternPlacementsMap = {};
  for (const pKey of patternsToday) {
    if (rawTargetPlacements[pKey]) {
      patternPlacementsMap[pKey] = rawTargetPlacements[pKey];
      allPlacementsList.push(...rawTargetPlacements[pKey]);
    } else {
      const parts = resolvedPatterns[pKey] || [];
      if (parts.length) {
        const minX = Math.min(...parts.map(p => p.x));
        const maxX = Math.max(...parts.map(p => p.x));
        const minY = Math.min(...parts.map(p => p.y));
        const maxY = Math.max(...parts.map(p => p.y));
        const pls = [];
        for (let oy = -minY; oy <= 9 - maxY; oy++) {
          for (let ox = -minX; ox <= 9 - maxX; ox++) {
            let fits = true;
            const wt = [];
            for (const part of parts) {
              const wx = ox + part.x;
              const wy = oy + part.y;
              const wk = coordToKey(wx, wy);
              if (crabSet.has(wk) || sandBlockedSet.has(wk)) { fits = false; break; }
              if (dugItemMap.has(wk) && !isMatch(dugItemMap.get(wk), part.name)) { fits = false; break; }
              wt.push({ x: wx, y: wy, key: wk, name: part.name });
            }
            if (fits) pls.push({ patternName: pKey, tiles: wt, world: wt });
          }
        }
        patternPlacementsMap[pKey] = pls;
      }
    }
  }

  // -------------------------------------------------------------
  // BEST 2x2 SAND DRILL RECOMMENDATION ENGINE (Khoan Cát 4 Ô)
  // Evaluates every 2x2 block to find the highest expected artifact probability & clue gain
  // -------------------------------------------------------------
  let bestDrillNext = null;
  if (!allTargetsFound) {
    let maxDrillScore = -Infinity;
    for (let oy = 0; oy <= 8; oy++) {
      for (let ox = 0; ox <= 8; ox++) {
        const blockCells = [
          { x: ox, y: oy, key: coordToKey(ox, oy) },
          { x: ox + 1, y: oy, key: coordToKey(ox + 1, oy) },
          { x: ox, y: oy + 1, key: coordToKey(ox, oy + 1) },
          { x: ox + 1, y: oy + 1, key: coordToKey(ox + 1, oy + 1) }
        ];

        let undugCount = 0;
        let probSum = 0;
        let hasGuaranteed = false;
        let sandBlockedCount = 0;
        let candidatePatternsHit = new Set();

        for (const c of blockCells) {
          if (!dugCoords.has(c.key)) {
            undugCount++;
            if (sandBlockedSet.has(c.key) || predictedCrabSet.has(c.key)) {
              sandBlockedCount++;
            } else {
              const p = targetProbabilityMap.get(c.key) || 0;
              probSum += p;
              if (guaranteedTargetCells.has(c.key) || p >= 0.99) {
                hasGuaranteed = true;
              }
              const sets = artifactMap[c.key] || [];
              for (const s of sets) {
                if (s.patternName) candidatePatternsHit.add(s.patternName);
              }
            }
          }
        }

        if (undugCount === 0) continue;

        let score = probSum * 10000 + (hasGuaranteed ? 40000 : 0);
        score += candidatePatternsHit.size * 2000;
        score += undugCount * 500;
        score -= sandBlockedCount * 1200;

        if (score > maxDrillScore) {
          maxDrillScore = score;
          const labelTopLeft = coordToLabel(ox, oy);
          const labelBottomRight = coordToLabel(ox + 1, oy + 1);
          const pct = Math.min(100, Math.round(probSum * 100));
          bestDrillNext = {
            ox,
            oy,
            cells: blockCells,
            label: `${labelTopLeft}-${labelBottomRight}`,
            probability: Math.min(1.0, probSum),
            percentage: `${pct}%`,
            undugCount,
            reason: hasGuaranteed 
              ? `⚙️ Chắc chắn 100% trúng Di Vật tại khối ${labelTopLeft}-${labelBottomRight}!`
              : `⚙️ Xác suất ~${pct}% trúng Di Vật (${undugCount}/4 ô chưa đào, ${candidatePatternsHit.size} thế đi qua)`
          };
        }
      }
    }
  }

  return {
    seasonArtifact,
    isAllCompleted: allTargetsFound,
    targetAnalysis,
    targetPiecesFound,
    targetPatternKeys,
    patternColorMap,
    artifactMap,
    coproMap: artifactMap, // original mod compatibility
    placements: allPlacementsList,
    confirmedPlacements,
    confirmedPlacementIds,
    patternToConfirmedCoord: Object.fromEntries(patternToConfirmedCoord),
    guaranteedTargetCells: Array.from(guaranteedTargetCells.values()),
    targetCandidateFrequency: Object.fromEntries(targetCandidateFrequency),
    targetProbabilityMap: Object.fromEntries(targetProbabilityMap),
    estimatedShovels: { min: estimatedShovelsMin, max: estimatedShovelsMax },
    bestNextDig,
    bestDrillNext,
    topPicks,
    validJointConfigsCount,
    sandBlockedKeys: Array.from(sandBlockedSet),
    knownArtifactBodyKeys: Array.from(knownArtifactBodyKeys),
    secondaryTreasureKeys: Array.from(secondaryTreasureKeys),
    secondaryTreasures: Object.fromEntries(secondaryTreasureMap),
    sandKeys: Array.from(sandSet),
    crabKeys: Array.from(crabSet),
    predictedCrabKeys: Array.from(predictedCrabSet),
    dugItemMap: Object.fromEntries(dugItemMap),
    patternsToday,
    completedPatterns: Array.from(completedPatterns),
    patternPlacementsMap
  };
}

// -------------------------------------------------------------
// CHỨC NĂNG GỢI Ý KHO BÁU (Treasure Hints)
// Strictly 100% Focused on the 3 Seasonal Artifacts (NO MISC ITEMS)
// Supports optional precomputedSolverRes to eliminate duplicate solving
// -------------------------------------------------------------
export function deduceTreasureHints(diggingData, seasonName, precomputedSolverRes = null) {
  const solverRes = precomputedSolverRes || solveDesertGrid(diggingData, seasonName);
  const seasonArtifact = solverRes.seasonArtifact;

  if (solverRes.isAllCompleted) {
    return {
      hasSufficientClues: true,
      isAllCompleted: true,
      message: "🎉 Đã đào trúng đủ 3 di vật hôm nay! Dừng đào để giữ cuốc.",
      hints: []
    };
  }

  const candidateHints = [];
  const guaranteedSet = new Set(solverRes.guaranteedTargetCells.map(g => g.key));

  // 1. Guaranteed target cells (100% Certainty)
  for (const g of solverRes.guaranteedTargetCells) {
    candidateHints.push({
      x: g.x,
      y: g.y,
      key: g.key,
      label: coordToLabel(g.x, g.y),
      score: 10000,
      confidence: "100%",
      isExact: true,
      pieceName: seasonArtifact,
      primaryReason: `Chắc chắn 100%: Mẫu ${g.patternName.replace(/ARTEFACT_/, "").replace(/_/g, " ")} duy nhất tại đây`
    });
  }

  // 2. Candidate cells strictly from artifactMap
  for (const [key, sets] of Object.entries(solverRes.artifactMap)) {
    if (guaranteedSet.has(key)) continue;
    const { x, y } = keyToCoord(key);
    const prob = solverRes.targetProbabilityMap[key] || 0;
    const pct = Math.round(prob * 100);
    const count = sets.length;

    const patternNames = Array.from(new Set(sets.flatMap(s => s.set.map(pl => pl.patternName.replace(/ARTEFACT_/, "").replace(/_/g, " ")))));

    candidateHints.push({
      x,
      y,
      key,
      label: coordToLabel(x, y),
      score: prob * 1000 + count * 50,
      confidence: `${pct}%`,
      isExact: false,
      pieceName: seasonArtifact,
      primaryReason: `Xác suất ${pct}%: Có ${count} thế di vật (${patternNames.join(", ")}) đi qua ô này`
    });
  }

  // Align #1 hint with solverRes.bestNextDig if present
  if (solverRes.bestNextDig) {
    const bKey = solverRes.bestNextDig.key;
    const match = candidateHints.find(h => h.key === bKey);
    if (match) {
      match.score += 50000;
    } else if (!guaranteedSet.has(bKey)) {
      // If bestNextDig is a strategic lattice/entropy probe, include it as top hint
      const { x, y } = keyToCoord(bKey);
      candidateHints.push({
        x,
        y,
        key: bKey,
        label: coordToLabel(x, y),
        score: 50000,
        confidence: `${Math.round((solverRes.bestNextDig.probability || 0.1) * 100)}%`,
        isExact: false,
        pieceName: seasonArtifact,
        primaryReason: solverRes.bestNextDig.reason
      });
    }
  }

  candidateHints.sort((a, b) => b.score - a.score);

  if (candidateHints.length === 0) {
    return {
      hasSufficientClues: false,
      isAllCompleted: false,
      message: "Chưa đủ dữ kiện để thu hẹp vị trí di vật.",
      hints: []
    };
  }

  const rankedHints = candidateHints.map((h, idx) => ({
    ...h,
    rank: idx + 1
  }));

  return {
    hasSufficientClues: true,
    isAllCompleted: false,
    message: `Đã xác định ${rankedHints.length} vị trí có khả năng chứa ${seasonArtifact}!`,
    hints: rankedHints
  };
}

// -------------------------------------------------------------
// PRACTICE MODE: Random SFL Desert Digging Board Generator
// 100% compliant with SFL desert digging rules & constraints
// Generates authentic 7-pattern board matching Today's Treasures
// -------------------------------------------------------------
export function generateRandomPracticeBoard(seasonName = "Ascension Age", customPatterns = null) {
  const seasonArtifact = detectSeasonArtifact(seasonName);

  let allPatterns = [];
  let targetKeys = [];

  if (Array.isArray(customPatterns) && customPatterns.length > 0) {
    allPatterns = [...customPatterns];
    targetKeys = allPatterns.filter(p => p.startsWith("ARTEFACT_") || p.includes("_ARTEFACT_"));
    if (targetKeys.length < 3) {
      const targetPool = [
        "ARTEFACT_ONE", "ARTEFACT_TWO", "ARTEFACT_FOUR", "ARTEFACT_SIX",
        "ARTEFACT_SEVEN", "ARTEFACT_EIGHT", "ARTEFACT_ELEVEN", "ARTEFACT_TWELVE",
        "ARTEFACT_THIRTEEN", "ARTEFACT_FOURTEEN", "ARTEFACT_SIXTEEN", "ARTEFACT_SEVENTEEN",
        "ARTEFACT_EIGHTEEN", "ARTEFACT_TWENTY", "ARTEFACT_TWENTY_ONE", "ARTEFACT_TWENTY_TWO"
      ].filter(k => !targetKeys.includes(k)).sort(() => Math.random() - 0.5);
      while (targetKeys.length < 3 && targetPool.length > 0) {
        targetKeys.push(targetPool.pop());
      }
    }
    const secondary = allPatterns.filter(p => !targetKeys.includes(p));
    if (secondary.length < 4) {
      const secondaryPool = [
        "HIEROGLYPH", "OLD_BOTTLE", "COCKLE", "WOODEN_COMPASS",
        "SEA_CUCUMBERS", "PEARL", "CORAL", "SEAWEED"
      ].filter(k => !secondary.includes(k)).sort(() => Math.random() - 0.5);
      while (secondary.length < 4 && secondaryPool.length > 0) {
        secondary.push(secondaryPool.pop());
      }
    }
    allPatterns = [...targetKeys.slice(0, 3), ...secondary.slice(0, 4)];
  } else {
    // 3 Target artifact patterns
    const targetPool = [
      "ARTEFACT_ONE", "ARTEFACT_TWO", "ARTEFACT_FOUR", "ARTEFACT_SIX",
      "ARTEFACT_SEVEN", "ARTEFACT_EIGHT", "ARTEFACT_ELEVEN", "ARTEFACT_TWELVE",
      "ARTEFACT_THIRTEEN", "ARTEFACT_FOURTEEN", "ARTEFACT_SIXTEEN", "ARTEFACT_SEVENTEEN",
      "ARTEFACT_EIGHTEEN", "ARTEFACT_TWENTY", "ARTEFACT_TWENTY_ONE", "ARTEFACT_TWENTY_TWO"
    ];
    const shuffledTargets = [...targetPool].sort(() => Math.random() - 0.5);
    targetKeys = shuffledTargets.slice(0, 3);

    // 4 Secondary patterns to make exactly 7 patterns (matching Today's Treasures)
    const secondaryPool = [
      "HIEROGLYPH", "OLD_BOTTLE", "COCKLE", "WOODEN_COMPASS",
      "SEA_CUCUMBERS", "PEARL", "CORAL", "SEAWEED"
    ];
    const shuffledSecondary = [...secondaryPool].sort(() => Math.random() - 0.5);
    const secondaryKeys = shuffledSecondary.slice(0, 4);

    allPatterns = [...targetKeys, ...secondaryKeys];
  }

  // Resolve parts with seasonArtifact
  const resolved = {};
  for (const pKey of allPatterns) {
    resolved[pKey] = (RAW_PATTERNS[pKey] || []).map(p => ({
      x: p.x,
      y: p.y,
      name: p.name === "$ARTIFACT" ? seasonArtifact : p.name
    }));
  }

  // Attempt placement of all 7 formations without overlap (Outer loop + inner attempts)
  let secretBoardMap = new Map();
  let placedFormations = [];

  for (let outer = 0; outer < 10; outer++) {
    for (let attempt = 0; attempt < 350; attempt++) {
      const candidateMap = new Map();
      const currentPlaced = [];
      let allPlaced = true;

      for (const pKey of allPatterns) {
        const parts = resolved[pKey];
        if (!parts || !parts.length) continue;
        const minX = Math.min(...parts.map(p => p.x));
        const maxX = Math.max(...parts.map(p => p.x));
        const minY = Math.min(...parts.map(p => p.y));
        const maxY = Math.max(...parts.map(p => p.y));

        const origins = [];
        for (let oy = -minY; oy <= 9 - maxY; oy++) {
          for (let ox = -minX; ox <= 9 - maxX; ox++) {
            origins.push({ ox, oy });
          }
        }
        origins.sort(() => Math.random() - 0.5);

        let placed = false;
        for (const { ox, oy } of origins) {
          let conflict = false;
          for (const part of parts) {
            const wx = ox + part.x;
            const wy = oy + part.y;
            if (candidateMap.has(`${wx},${wy}`)) {
              conflict = true;
              break;
            }
          }
          if (!conflict) {
            const formTiles = [];
            for (const part of parts) {
              const tx = ox + part.x;
              const ty = oy + part.y;
              candidateMap.set(`${tx},${ty}`, part.name);
              formTiles.push({ x: tx, y: ty, name: part.name });
            }
            currentPlaced.push({ patternName: pKey, tiles: formTiles });
            placed = true;
            break;
          }
        }

        if (!placed) {
          allPlaced = false;
          break;
        }
      }

      if (allPlaced && currentPlaced.length === allPatterns.length) {
        secretBoardMap = candidateMap;
        placedFormations = currentPlaced;
        break;
      }
    }
    if (placedFormations.length === allPatterns.length) {
      break;
    }
  }

  // 1. All cells directly adjacent to any treasure piece (and not a treasure itself) MUST be Crab
  // In Sunflower Land, Sand NEVER touches a treasure orthogonally!
  const treasureKeys = Array.from(secretBoardMap.keys());
  for (const tKey of treasureKeys) {
    const { x, y } = keyToCoord(tKey);
    for (const [dx, dy] of ORTHO) {
      const cx = x + dx;
      const cy = y + dy;
      const cKey = `${cx},${cy}`;
      if (inBounds(cx, cy) && !secretBoardMap.has(cKey)) {
        secretBoardMap.set(cKey, "Crab");
      }
    }
  }

  // 2. All remaining cells on the 10x10 board are Sand!
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const key = `${x},${y}`;
      if (!secretBoardMap.has(key)) {
        secretBoardMap.set(key, "Sand");
      }
    }
  }

  return {
    id: `practice_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    season: seasonName,
    seasonArtifact,
    targetPatterns: targetKeys,
    patterns: allPatterns,
    allPatternsToday: allPatterns,
    secretBoard: Object.fromEntries(secretBoardMap),
    secretBoardPlacements: placedFormations
  };
}
