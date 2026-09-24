import { solveDesertGrid, getPatternDefinitions, deduceTreasureHints, coordToLabel, ITEM_VALUES, generateRandomPracticeBoard } from "./solver.js";
import {
  BASE_CROPS,
  fetchLiveP2PPrices,
  fetchLiveExchangeRates,
  calculateBestCropRates,
  analyzeDeliveryOrders,
  calculateInventoryValuation,
  calculateResourceProfits,
  getItemIcon,
  getNpcIcon,
  getItemPrice,
  normalizeKey,
  computeAllCookingCosts,
  DEFAULT_P2P_PRICES,
  COOKING_RECIPES
} from "./market.js";
import { FLOWER_RECIPES } from "./flowerData.js";
import {
  POTIONS,
  POTION_NAME_TO_ID,
  STATUS_ICONS,
  STATUS_LABELS,
  solvePotionHouse,
  createDemoGame,
  playDemoTurn
} from "./potionSolver.js";
import {
  PET_FOOD_CATEGORIES,
  loadFoodSelections,
  saveFoodSelections,
  getCalculatedFoodList,
  loadFoodSort,
  saveFoodSort,
  loadMaxCostInput,
  saveMaxCostInput
} from "./foodListData.js";

// Embedded Base64 for essential treasures that might be missing locally
const EMBEDDED_TREASURES = {
  "Otter Pebble": "data:image/webp;base64,UklGRqgAAABXRUJQVlA4TJsAAAAvDoADED+gqG0jNlcS4w7A/aeaRlLg7Fm4A3osvDUK2rZhQ4XS/SsQSALbfrEAQOGRPF1Vqq3X1/4NXNW2YzU3gwGCglfmH+hDAIQKmDW3BlikEup/YSKi/wnMjwfu8/9rAMwR8QZQrggm9JUkDb0Hr4+hHMbsTNtubr6ntcbj/D7TUPMr00Q3juXoRAd3N5VWx3HsFNBbAKiqAAA=",
  "Pearl": "data:image/webp;base64,UklGRnYAAABXRUJQVlA4TGkAAAAvC8ACEC+goG0bpvxhtvuHj9q2bRj//6k3ey0JyKRt6l9fmYN9YxrmPwCk8iP9kHU+MIokSUp/RsDigMIBE+NgBOxB+xeDiYj+h2RLMlgTBjG5xh3174LBrgc4lfCemZkZszM75G5LsiUA"
};

function getTreasureImage(name) {
  if (!name) return "img/treasures/Sand.png";
  if (EMBEDDED_TREASURES[name]) return EMBEDDED_TREASURES[name];
  return `img/treasures/${encodeURIComponent(name)}.png`;
}

function createTreasureImg(name, className = "cell-img", altText = "") {
  const img = document.createElement("img");
  img.className = className;
  img.alt = altText || name;
  img.src = getTreasureImage(name);

  img.onerror = () => {
    if (EMBEDDED_TREASURES[name]) {
      img.onerror = null;
      img.src = EMBEDDED_TREASURES[name];
      return;
    }
    if (!img.dataset.step) {
      img.dataset.step = "remote_png";
      img.src = `https://d1g.uk/images/treasures/${encodeURIComponent(name)}.png`;
    } else if (img.dataset.step === "remote_png") {
      img.dataset.step = "remote_webp";
      img.src = `https://d1g.uk/images/treasures/${encodeURIComponent(name.toLowerCase().replace(/ /g, "_"))}.webp`;
    } else {
      img.onerror = null;
      img.src = "img/treasures/Camel Bone.png";
    }
  };

  return img;
}

// DOM Elements
const connectionStatus = document.getElementById("connectionStatus");
const farmIdVal = document.getElementById("farmIdVal");
const shovelVal = document.getElementById("shovelVal");
const shovelSub = document.getElementById("shovelSub");
const drillVal = document.getElementById("drillVal");
const streakVal = document.getElementById("streakVal");
const seasonNameBadge = document.getElementById("seasonNameBadge");
const todaysDate = document.getElementById("todaysDate");
const miniPatternsGrid = document.getElementById("miniPatternsGrid");
const recommendationBanner = document.getElementById("recommendationBanner");
const recTileName = document.getElementById("recTileName");
const recTileReason = document.getElementById("recTileReason");
const gridBody = document.getElementById("gridBody");
const btnTreasureHint = document.getElementById("btnTreasureHint");
const hintStatus = document.getElementById("hintStatus");
const hintBody = document.getElementById("hintBody");
const btnRefresh = document.getElementById("btnRefresh");
const btnDemo = document.getElementById("btnDemo");
const btnPracticeMode = document.getElementById("btnPracticeMode");
const radarQuickBar = document.getElementById("radarQuickBar");
const btnTopPractice = document.getElementById("btnTopPractice");
const btnTopRefresh = document.getElementById("btnTopRefresh");
const btnTopDemo = document.getElementById("btnTopDemo");
const practiceBar = document.getElementById("practiceBar");
const practiceShovels = document.getElementById("practiceShovels");
const practiceTargets = document.getElementById("practiceTargets");
const btnPracticeNewGame = document.getElementById("btnPracticeNewGame");
const btnPracticeReveal = document.getElementById("btnPracticeReveal");
const btnPracticeExit = document.getElementById("btnPracticeExit");
const btnPracticeToolShovel = document.getElementById("btnPracticeToolShovel");
const btnPracticeToolDrill = document.getElementById("btnPracticeToolDrill");
const recDrillTip = document.getElementById("recDrillTip");
const predictPanel = document.getElementById("predictPanel");
const predictPanelTitle = document.getElementById("predictPanelTitle");
const predictPanelContent = document.getElementById("predictPanelContent");
const closePredictPanelBtn = document.getElementById("closePredictPanelBtn");

// Multi-Tab & Economy State
let activeTab = "desert";
let practiceSelectedTool = "shovel";
let liveMarketPrices = { prices: DEFAULT_P2P_PRICES, source: "default" };
let liveExchangeRates = { sflUsd: 0.168, polUsd: 0.107, coinsPerSfl: 160, dexPriceChange24h: 0 };
let currentFullFarmData = null;
let currentTaskFilter = "all";
let currentMarketCategory = "all";
let marketSearchQuery = "";
let isGreenThumbActive = false;
let isTaxActive = false;
let invSearchQuery = "";
let lastDiggingFingerprint = null;
let isLiveDrillHighlighted = false;

function getDiggingFingerprint(digging, season) {
  if (!digging) return "";
  const grid = digging.grid || [];
  const gridKeys = grid.map(d => `${d.x},${d.y}:${Object.keys(d.items || {}).sort().join(",")}`).sort().join("|");
  const comp = (digging.completedPatterns || []).slice().sort().join(",");
  const pat = (digging.patterns || []).slice().sort().join(",");
  const modeKey = isPracticeMode ? `practice_${practiceGameData?.id || "rnd"}` : "live";
  return `${modeKey}_${season || ""}_${grid.length}_${gridKeys}_${comp}_${pat}`;
}

// Multi-Tab DOM Elements
const tasksBadge = document.getElementById("tasksBadge");
const tasksSummaryTitle = document.getElementById("tasksSummaryTitle");
const tasksResetTime = document.getElementById("tasksResetTime");
const tasksDeliveredCount = document.getElementById("tasksDeliveredCount");
const tasksEarnedSfl = document.getElementById("tasksEarnedSfl");
const tasksEarnedCoins = document.getElementById("tasksEarnedCoins");
const tasksSpentSfl = document.getElementById("tasksSpentSfl");
const tasksListContainer = document.getElementById("tasksListContainer");

const rateSflUsd = document.getElementById("rateSflUsd");
const rateSflChange = document.getElementById("rateSflChange");
const ratePolUsd = document.getElementById("ratePolUsd");
const rateCoinsSfl = document.getElementById("rateCoinsSfl");
const marketSearchInput = document.getElementById("marketSearchInput");
const btnRefreshMarket = document.getElementById("btnRefreshMarket");
const marketUpdatedText = document.getElementById("marketUpdatedText");
const marketTableBody = document.getElementById("marketTableBody");

const bestCropValue = document.getElementById("bestCropValue");
const btnToggleGreenThumb = document.getElementById("btnToggleGreenThumb");
const skillStateBadge = document.getElementById("skillStateBadge");
const coinRateTableBody = document.getElementById("coinRateTableBody");

const invTotalSfl = document.getElementById("invTotalSfl");
const invTotalUsd = document.getElementById("invTotalUsd");
const invSubInfo = document.getElementById("invSubInfo");
const invSearchInput = document.getElementById("invSearchInput");
const btnToggleTax = document.getElementById("btnToggleTax");
const taxBadge = document.getElementById("taxBadge");
const invListContainer = document.getElementById("invListContainer");

const profitCardsContainer = document.getElementById("profitCardsContainer");

// Potion House DOM Elements & State
const potionNpcText = document.getElementById("potionNpcText");
const potionRoundText = document.getElementById("potionRoundText");
const potionCandCount = document.getElementById("potionCandCount");
const potionHistoryList = document.getElementById("potionHistoryList");
const potionSuggestSlots = document.getElementById("potionSuggestSlots");
const potionSuggestSection = document.getElementById("potionSuggestSection");
const potionPossiblePanel = document.getElementById("potionPossiblePanel");
const potionPossibleList = document.getElementById("potionPossibleList");
const btnPotionDemoNew = document.getElementById("btnPotionDemoNew");
const btnPotionReset = document.getElementById("btnPotionReset");
const btnPotionStepDemo = document.getElementById("btnPotionStepDemo");

let isPotionDemoActive = false;
let demoPotionGame = null;

// Flowers DOM Elements
const flowerDeliveryGoals = document.getElementById("flowerDeliveryGoals");
const flowerMarketGoals = document.getElementById("flowerMarketGoals");
const flowersListContainer = document.getElementById("flowersListContainer");

let currentRadarData = null;
let savedGameRadarData = null;
let currentSolverResult = null;
let isHintActive = false;
let currentHints = [];

// Practice Mode State
let isPracticeMode = false;
let practiceGameData = null;
let practiceDigs = [];
let isSecretRevealed = false;
let practiceStats = {
  shovelsUsed: 0,
  drillsUsed: 0
};

// Clear all active ghost placement highlights from the grid
function clearGhosts() {
  document.querySelectorAll(".placement-ghost-bg0, .placement-ghost-bg1, .placement-ghost-bg2").forEach(el => {
    el.classList.remove("placement-ghost-bg0", "placement-ghost-bg1", "placement-ghost-bg2");
  });
  clearDrillHover();
}

function clearDrillHover() {
  document.querySelectorAll(".drill-hover-preview").forEach(el => {
    el.classList.remove("drill-hover-preview", "drill-cell-fresh", "drill-cell-dug");
  });
}

function highlightDrillArea(x, y) {
  clearDrillHover();
  const ox = Math.min(8, x);
  const oy = Math.min(8, y);
  for (let dy = 0; dy <= 1; dy++) {
    for (let dx = 0; dx <= 1; dx++) {
      const cx = ox + dx;
      const cy = oy + dy;
      const el = document.querySelector(`.cell[data-coord="${cx},${cy}"]`);
      if (el) {
        el.classList.add("drill-hover-preview");
        const isAlreadyDug = practiceDigs.some(d => d.x === cx && d.y === cy);
        if (isAlreadyDug) {
          el.classList.add("drill-cell-dug");
        } else {
          el.classList.add("drill-cell-fresh");
        }
      }
    }
  }
}

// Highlight a specific placement's ghost shapes on the board
function highlightPlacement(placement, patternColorMap) {
  clearGhosts();
  if (!placement) return;
  const colorIdx = patternColorMap?.[placement.patternName] ?? 0;
  const colorClass = `placement-ghost-bg${colorIdx}`;
  const tiles = placement.world || placement.tiles || [];
  tiles.forEach(t => {
    const cell = document.querySelector(`.cell[data-coord="${t.x},${t.y}"]`);
    if (cell) {
      cell.classList.add(colorClass);
    }
  });
}

// Open PredictionSet details panel (Modeled after original mod)
function openPredictionPanel(cellKey, sets, solverResult) {
  if (!predictPanel || !predictPanelContent) return;

  const [x, y] = cellKey.split(",").map(Number);
  const label = coordToLabel(x, y);

  predictPanel.style.display = "block";
  predictPanelContent.innerHTML = "";
  if (predictPanelTitle) {
    predictPanelTitle.textContent = `🎯 Ô ${label} có ${sets.length} PredictionSet`;
  }

  const btnContainer = document.createElement("div");
  btnContainer.className = "pset-buttons";

  const detailsContainer = document.createElement("div");
  detailsContainer.className = "pset-details";
  detailsContainer.style.display = "none";

  sets.forEach((setItem, idx) => {
    const btn = document.createElement("button");
    btn.className = "pset-btn";
    btn.textContent = `Set #${idx + 1}`;

    const placements = setItem.set || [setItem];

    btn.addEventListener("mouseenter", () => {
      clearGhosts();
      placements.forEach(pl => {
        highlightPlacement(pl, solverResult.patternColorMap);
      });
    });

    btn.addEventListener("mouseleave", () => {
      clearGhosts();
    });

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      btnContainer.querySelectorAll(".pset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const patNames = placements.map(p => p.patternName.replace(/^ARTEFACT_/, "").replace(/_/g, " ")).join(", ");
      const targetCoords = [...new Set(placements.flatMap(p =>
        (p.world || p.tiles || [])
          .filter(t => t.isTargetPiece || t.name === solverResult.seasonArtifact)
          .map(t => coordToLabel(t.x, t.y))
      ))];

      detailsContainer.style.display = "block";
      detailsContainer.innerHTML = `
        <strong>Thế #${idx + 1}:</strong> Mẫu ${patNames}<br>
        🎯 Vị trí di vật: <strong>${targetCoords.join(" · ") || label}</strong>
      `;
    });

    btnContainer.appendChild(btn);
  });

  predictPanelContent.appendChild(btnContainer);
  predictPanelContent.appendChild(detailsContainer);
}

// Close panel button
closePredictPanelBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (predictPanel) predictPanel.style.display = "none";
  clearGhosts();
});

// Click outside to close panel
document.addEventListener("click", (e) => {
  if (predictPanel && predictPanel.style.display !== "none") {
    if (!predictPanel.contains(e.target) && !e.target.closest(".cell")) {
      predictPanel.style.display = "none";
      clearGhosts();
    }
  }
});

// -------------------------------------------------------------
// RENDER 10x10 DESERT GRID (Original Mod Architecture)
// -------------------------------------------------------------
function renderGrid(diggingData, solverResult, activeHints = []) {
  if (!gridBody) return;
  gridBody.innerHTML = "";

  const dugItemMap = solverResult.dugItemMap || {};
  const sandKeys = new Set(solverResult.sandKeys || []);
  const crabKeys = new Set(solverResult.crabKeys || []);
  const sandBlockedKeys = new Set(solverResult.sandBlockedKeys || []);
  const knownArtifactBodyKeys = new Set(solverResult.knownArtifactBodyKeys || []);
  const secondaryTreasureKeys = new Set(solverResult.secondaryTreasureKeys || []);
  const secondaryTreasures = solverResult.secondaryTreasures || {};
  const predictedCrabKeys = new Set(solverResult.predictedCrabKeys || []);
  const guaranteedMap = new Map();
  for (const g of solverResult.guaranteedTargetCells || []) {
    guaranteedMap.set(g.key, g);
  }
  const artifactMap = solverResult.artifactMap || {};
  const isAllDone = solverResult.isAllCompleted;
  const bestDigKey = (!isAllDone && solverResult.bestNextDig) ? solverResult.bestNextDig.key : null;
  const targetFoundKeys = new Set((solverResult.targetPiecesFound || []).map(t => t.key));
  const patternToConfirmedCoord = solverResult.patternToConfirmedCoord || {};

  // Build map of confirmed pattern names by cell key
  const confirmedPatternBadgeMap = new Map();
  for (const [pKey, coord] of Object.entries(patternToConfirmedCoord)) {
    if (coord && coord.key) {
      confirmedPatternBadgeMap.set(coord.key, pKey.replace(/^ARTEFACT_/, "").replace(/_/g, " "));
    }
  }

  const hintMap = new Map();
  for (const h of activeHints || []) {
    hintMap.set(h.key, h);
  }

  for (let y = 0; y < 10; y++) {
    const rowEl = document.createElement("div");
    rowEl.className = "grid-row";

    // Row Label (1-10)
    const rowLbl = document.createElement("div");
    rowLbl.className = "row-lbl";
    rowLbl.textContent = y + 1;
    rowEl.appendChild(rowLbl);

    for (let x = 0; x < 10; x++) {
      const key = `${x},${y}`;
      const label = coordToLabel(x, y);
      const cellEl = document.createElement("div");
      cellEl.className = "cell";
      cellEl.dataset.coord = key;
      cellEl.dataset.label = label;

      let isDug = false;

      // 1. Dug items
      if (dugItemMap[key]) {
        isDug = true;
        const itemName = dugItemMap[key];
        cellEl.classList.add("cell-dug-item");

        if (targetFoundKeys.has(key)) {
          cellEl.classList.add("cell-found-target");
          const img = createTreasureImg(itemName, "cell-img", itemName);
          cellEl.appendChild(img);

          // Confirmed Badge (Original mod: displays pattern name on dug artifact)
          const patName = confirmedPatternBadgeMap.get(key);
          if (patName) {
            const badge = document.createElement("div");
            badge.className = "confirmed-badge";
            badge.textContent = patName;
            cellEl.appendChild(badge);
          }

          cellEl.title = `[${label}] 👑 ĐÃ ĐÀO TRÚNG DI VẬT: ${itemName}${patName ? ` (${patName})` : ""}`;
        } else {
          const img = createTreasureImg(itemName, "cell-img", itemName);
          cellEl.appendChild(img);
          cellEl.title = `[${label}] Đã đào: ${itemName}`;
        }
      } else if (sandKeys.has(key)) {
        isDug = true;
        cellEl.classList.add("cell-dug-sand");
        const img = createTreasureImg("Sand", "cell-img", "Sand");
        cellEl.appendChild(img);
        cellEl.title = `[${label}] Cát (Sand)`;
      } else if (crabKeys.has(key)) {
        isDug = true;
        cellEl.classList.add("cell-dug-crab");
        const img = createTreasureImg("Crab", "cell-img", "Crab");
        cellEl.appendChild(img);
        cellEl.title = `[${label}] Cua (Có kho báu ở 4 ô xung quanh!)`;
      }

      // Practice Mode Interaction (attached to all cells to support 2x2 drill spanning over dug cells)
      if (isPracticeMode) {
        cellEl.addEventListener("click", () => {
          handlePracticeDig(x, y);
        });
        cellEl.addEventListener("mouseenter", () => {
          if (practiceSelectedTool === "drill") {
            highlightDrillArea(x, y);
          }
        });
        cellEl.addEventListener("mouseleave", () => {
          if (practiceSelectedTool === "drill") {
            clearDrillHover();
          }
        });
      }

      // 2. Undug cells
      if (!isDug) {
        if (isPracticeMode) {
          // If secret is revealed, highlight target artifacts
          if (isSecretRevealed && practiceGameData?.secretBoard) {
            const secretItem = practiceGameData.secretBoard[key];
            if (secretItem === practiceGameData.seasonArtifact) {
              cellEl.classList.add("cell-secret-reveal");
              if (!cellEl.querySelector(".ghost-secret-reveal-img")) {
                const ghostImg = createTreasureImg(secretItem, "cell-img ghost-secret-reveal-img", secretItem);
                cellEl.appendChild(ghostImg);
              }
            }
          }
        }

        if (isAllDone) {
          cellEl.title = `[${label}] Chưa đào (Đã hoàn thành 3 di vật)${isPracticeMode ? " - Bấm để đào thử" : ""}`;
        } else if (sandBlockedKeys.has(key)) {
          // Sand Blocked area: 4 orthogonal neighbors of dug Sand CANNOT have treasure!
          cellEl.classList.add("cell-sand-blocked");
          cellEl.title = `🛑 [${label}] Vùng Cát (4 ô quanh Cát chỉ là Cát hoặc Cua - Không có kho báu!)${isPracticeMode ? " (Bấm để đào thử)" : ""}`;
        } else if (knownArtifactBodyKeys.has(key)) {
          // Known Camel Bone of an already found artifact!
          cellEl.classList.add("cell-artifact-bone");
          cellEl.title = `🦴 [${label}] Mảnh xương (Camel Bone) của di vật đã tìm thấy - Không cần đào!${isPracticeMode ? " (Bấm để đào thử)" : ""}`;
        } else if (secondaryTreasureKeys.has(key)) {
          // Deduced secondary treasure (Vase, Wood, Old Bottle, etc.) - NOT a seasonal artifact!
          const sec = secondaryTreasures[key];
          cellEl.classList.add("cell-secondary-treasure");
          const secName = sec?.name || "Kho báu phụ";
          const secPat = sec?.patternName ? ` (${sec.patternName.replace(/_/g, " ")})` : "";
          cellEl.title = `🏺 [${label}] ${secName}${secPat} - Không phải di vật (Không cần đào!)${isPracticeMode ? " (Bấm để đào thử)" : ""}`;
        } else if (predictedCrabKeys.has(key)) {
          // Guaranteed Crab halo! (Orthogonally adjacent to revealed treasure with 0 valid treasure placements)
          cellEl.classList.add("cell-predicted-crab");
          cellEl.title = `🦀 [${label}] Chắc chắn 100% là Cua (Vành đai quanh kho báu - Tuyệt đối không đào!)${isPracticeMode ? " (Bấm để đào thử)" : ""}`;
        } else {
          const sets = artifactMap[key] || [];
          const candidateCount = sets.length;

          // A. 100% Guaranteed Target Cell (Original Mod: copro-confirm-predicted)
          if (guaranteedMap.has(key)) {
            cellEl.classList.add("copro-confirm-predicted");
            const gInfo = guaranteedMap.get(key);

            // Ghost artifact icon
            const ghostImg = createTreasureImg(gInfo.pieceName, "cell-img ghost-target-img", gInfo.pieceName);
            cellEl.appendChild(ghostImg);

            // Hover preview
            cellEl.addEventListener("mouseenter", () => {
              clearGhosts();
              const pl = sets[0]?.set?.[0];
              if (pl) highlightPlacement(pl, solverResult.patternColorMap);
            });
            cellEl.addEventListener("mouseleave", clearGhosts);

            cellEl.title = `🎯 [${label}] CHẮC CHẮN 100% là ${gInfo.pieceName} (${gInfo.patternName.replace(/^ARTEFACT_/, "").replace(/_/g, " ")})!${isPracticeMode ? " (Bấm để đào)" : ""}`;
          }
          // B. Target Candidate Cell (Original Mod: copro-predict + count badge)
          else if (candidateCount > 0) {
            cellEl.classList.add("copro-predict");

            // Count badge
            const badge = document.createElement("div");
            badge.className = "copro-count-badge";
            badge.textContent = candidateCount;
            cellEl.appendChild(badge);

            if (candidateCount === 1) {
              const singlePlacement = sets[0]?.set?.[0];
              cellEl.addEventListener("mouseenter", () => {
                clearGhosts();
                if (singlePlacement) highlightPlacement(singlePlacement, solverResult.patternColorMap);
              });
              cellEl.addEventListener("mouseleave", clearGhosts);
              cellEl.title = `🔍 [${label}] 1 thế di vật đi qua (Rê chuột xem vị trí)${isPracticeMode ? " (Bấm để đào)" : ""}`;
            } else {
              if (!isPracticeMode) {
                cellEl.addEventListener("click", (e) => {
                  e.stopPropagation();
                  openPredictionPanel(key, sets, solverResult);
                });
                cellEl.title = `🔍 [${label}] ${candidateCount} thế di vật đi qua (Bấm để xem chi tiết)`;
              } else {
                cellEl.addEventListener("contextmenu", (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openPredictionPanel(key, sets, solverResult);
                });
                cellEl.title = `🔍 [${label}] ${candidateCount} thế di vật đi qua (Bấm để đào, chuột phải xem chi tiết)`;
              }
            }
          } else {
            cellEl.title = `[${label}] Chưa đào${isPracticeMode ? " (Bấm để đào)" : ""}`;
          }

          // AI 2x2 Drill Highlight (when in drill mode or toggled in live mode)
          const isDrillHighlighted = isPracticeMode ? (practiceSelectedTool === "drill") : isLiveDrillHighlighted;
          if (isDrillHighlighted && solverResult.bestDrillNext && !solverResult.isAllCompleted) {
            const drillCells = solverResult.bestDrillNext.cells || [];
            if (drillCells.some(c => c.key === key)) {
              cellEl.classList.add("ai-drill-highlight");
              cellEl.title = `⚡ [${label}] GỢI Ý KHOAN 2x2: ${solverResult.bestDrillNext.reason}`;
            }
          }

          // AI Optimal Next Shovel Dig highlight (never on sand blocked cells)
          if (key === bestDigKey && !sandBlockedKeys.has(key)) {
            cellEl.classList.add("ai-prediction-highlight");
            cellEl.title = `⚡ [${label}] GỢI Ý CUỐC AI: ${solverResult.bestNextDig.reason}${isPracticeMode ? " (Bấm để đào)" : ""}`;
          }

          // Active Hint Ranked highlight (never on sand blocked cells)
          if (hintMap.has(key) && !sandBlockedKeys.has(key)) {
            const h = hintMap.get(key);
            cellEl.classList.add("cell-hint-ranked");
            if (h.rank === 1) cellEl.classList.add("rank-1");
          }
        }
      }

      rowEl.appendChild(cellEl);
    }

    gridBody.appendChild(rowEl);
  }
}

// -------------------------------------------------------------
// RENDER TODAY'S TREASURES (Mini 4x4 Grids)
// -------------------------------------------------------------
function renderTodaysTreasures(patternsToday, seasonArtifact, completedPatternsSet, confirmedPatternKeys = new Set()) {
  if (!miniPatternsGrid) return;
  miniPatternsGrid.innerHTML = "";

  if (!patternsToday || patternsToday.length === 0) {
    miniPatternsGrid.innerHTML = `<div class="target-item-placeholder">Chưa có dữ liệu bãi đào hôm nay. Hãy mở game Sunflower Land và bấm vào bãi sa mạc.</div>`;
    return;
  }

  const allPatterns = getPatternDefinitions(seasonArtifact);

  patternsToday.forEach(pKey => {
    const patDef = allPatterns[pKey];
    if (!patDef) return;

    const card = document.createElement("div");
    card.className = "mini-pattern-card";
    const compSet = (completedPatternsSet instanceof Set)
      ? completedPatternsSet
      : new Set(Array.isArray(completedPatternsSet) ? completedPatternsSet : []);
    const isConfirmed = typeof confirmedPatternKeys.has === "function" ? confirmedPatternKeys.has(pKey) : !!confirmedPatternKeys[pKey];
    const isCompleted = compSet.has(pKey) || isConfirmed;
    if (isCompleted) {
      card.classList.add("completed");
    }
    card.title = `${patDef.displayName || pKey.replace(/_/g, " ")}${isCompleted ? " (✓ Đã xong)" : ""}`;

    // 4x4 Grid
    const grid4x4 = document.createElement("div");
    grid4x4.className = "pattern-4x4-grid";

    const partMap = new Map();
    const partsToRender = patDef.miniGridParts || patDef.parts || [];
    for (const part of partsToRender) {
      partMap.set(`${part.x},${part.y}`, part.name);
    }

    for (let gy = 0; gy < 4; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        const cell = document.createElement("div");
        cell.className = "mini-grid-cell";
        const key = `${gx},${gy}`;
        if (partMap.has(key)) {
          const itemName = partMap.get(key);
          const icon = createTreasureImg(itemName, "mini-grid-icon", itemName);
          cell.appendChild(icon);
          cell.title = itemName;
        }
        grid4x4.appendChild(cell);
      }
    }

    card.appendChild(grid4x4);

    // Ghost Placement Preview on hover (Original Mod Feature)
    card.addEventListener("mouseenter", () => {
      clearGhosts();
      const placements = currentSolverResult?.patternPlacementsMap?.[pKey] || [];
      const colorIdx = currentSolverResult?.patternColorMap?.[pKey] ?? 0;
      const colorClass = `placement-ghost-bg${colorIdx}`;
      placements.forEach(pl => {
        (pl.world || pl.tiles || []).forEach(tile => {
          const cell = document.querySelector(`.cell[data-coord="${tile.x},${tile.y}"]`);
          if (cell && !currentSolverResult?.dugItemMap?.[`${tile.x},${tile.y}`]) {
            cell.classList.add(colorClass);
          }
        });
      });
    });

    card.addEventListener("mouseleave", () => {
      clearGhosts();
    });

    miniPatternsGrid.appendChild(card);
  });
}

// -------------------------------------------------------------
// UPDATE RADAR UI
// -------------------------------------------------------------
function updateRadarUI(payload) {
  if (!payload || !payload.digging) return;
  currentRadarData = payload;

  const farmId = payload.farmId || "Chưa rõ";
  const season = payload.season || "Ascension Age";
  const digging = payload.digging || {};
  const inventory = payload.inventory || {};

  // Status & Header
  if (connectionStatus) {
    connectionStatus.innerHTML = `
      <span class="status-dot dot-live"></span>
      <span class="status-text">Đang kết nối (Live)</span>
    `;
  }
  if (farmIdVal) farmIdVal.textContent = isPracticeMode ? "Luyện tập" : "Trực tiếp";

  // Shovel stats: Dug count vs Remaining count
  const dugCount = Array.isArray(digging.grid) ? digging.grid.length : 0;
  const shovelInBag = inventory.shovel ?? 0;

  // Calculate total coins earned from dug treasures
  let totalCoins = 0;
  for (const dig of digging.grid || []) {
    for (const [item, count] of Object.entries(dig.items || {})) {
      totalCoins += (ITEM_VALUES[item] || 0) * count;
    }
  }

  if (shovelVal) shovelVal.textContent = dugCount;
  if (shovelSub) {
    shovelSub.textContent = `(còn ${shovelInBag})`;
    shovelSub.title = `Đã đào: ${dugCount} cuốc | Còn lại: ${shovelInBag} cuốc | Tổng thu hoạch: ~${Math.round(totalCoins).toLocaleString()} xu`;
  }

  if (drillVal) drillVal.textContent = inventory.drill ?? 0;
  if (streakVal) streakVal.textContent = `${digging.streak?.count || 0} ngày`;

  // Solve Desert Grid (Only re-solve if digging data or season has changed!)
  const currentFingerprint = getDiggingFingerprint(digging, season);
  let solverResult = currentSolverResult;
  if (!solverResult || currentFingerprint !== lastDiggingFingerprint) {
    solverResult = solveDesertGrid(digging, season);
    currentSolverResult = solverResult;
    lastDiggingFingerprint = currentFingerprint;
  }

  if (seasonNameBadge) {
    seasonNameBadge.textContent = `Di vật: ${solverResult.seasonArtifact}`;
  }
  if (todaysDate) {
    todaysDate.textContent = `(${new Date().toLocaleDateString("vi-VN")})`;
  }

  // Recommendation Banner Logic: "Nếu đào xong rồi thì thôi!"
  const recTitleEl = recommendationBanner?.querySelector(".rec-title");
  if (solverResult.isAllCompleted) {
    recommendationBanner.className = "recommendation-banner banner-completed";
    recommendationBanner.querySelector(".rec-icon").textContent = "🎉";
    if (recTitleEl && recTitleEl.childNodes[0]) recTitleEl.childNodes[0].textContent = "ĐÃ HOÀN THÀNH ĐÀO KHO BÁU!";
    if (recTileName) recTileName.style.display = "none";
    recTileReason.textContent = "Bạn đã đào trúng cả 3 cục di vật mục tiêu hôm nay. Hãy nghỉ ngơi và giữ cuốc cho ngày mai!";
    if (predictPanel) predictPanel.style.display = "none";
  } else if (solverResult.bestNextDig) {
    recommendationBanner.className = "recommendation-banner";
    recommendationBanner.querySelector(".rec-icon").textContent = "⚡";
    const best = solverResult.bestNextDig;
    const lbl = coordToLabel(best.x, best.y);
    const bestPct = best.percentage || `${Math.round((best.probability || 0) * 100)}%`;

    if (recTitleEl && recTitleEl.childNodes[0]) recTitleEl.childNodes[0].textContent = "GỢI Ý ĐÀO TIẾP THEO: ";
    if (recTileName) {
      recTileName.style.display = "inline-block";
      recTileName.textContent = `Ô ${lbl} (${bestPct})`;
    }
    const est = solverResult.estimatedShovels;
    const estText = (est && est.max > 0)
      ? ` (Dự kiến cần ~${est.min === est.max ? est.min : `${est.min}-${est.max}`} cuốc)`
      : "";

    // Show Top 3 alternatives with exact Bayesian posterior probability
    let topPicksSummary = "";
    if (solverResult.topPicks && solverResult.topPicks.length > 1) {
      const altPicks = solverResult.topPicks.map(p => `#${p.rank} ${p.label} (${p.percentage})`).join("  •  ");
      topPicksSummary = `\nTop ứng viên: ${altPicks}`;
    }
    recTileReason.textContent = `${best.reason}${estText}${topPicksSummary}`;
  } else {
    recommendationBanner.className = "recommendation-banner banner-completed";
    recommendationBanner.querySelector(".rec-icon").textContent = "🏁";
    if (recTitleEl && recTitleEl.childNodes[0]) recTitleEl.childNodes[0].textContent = "TẠM DỪNG ĐÀO";
    if (recTileName) recTileName.style.display = "none";
    recTileReason.textContent = "Không còn ô khả thi nào hoặc đã hoàn thành nhiệm vụ.";
  }

  // Update Drill Recommendation Tip (ALWAYS available for both Live digging & Practice)
  if (recDrillTip) {
    const drillCount = inventory.drill ?? 0;
    if (solverResult.bestDrillNext && !solverResult.isAllCompleted) {
      recDrillTip.style.display = "flex";
      const drillLabel = drillCount > 0 ? ` (Có ${drillCount} khoan)` : "";
      recDrillTip.innerHTML = `<span class="rec-drill-badge">⚙️ GỢI Ý KHOAN 2x2:</span> <b>${solverResult.bestDrillNext.label}</b> &nbsp;•&nbsp; ${solverResult.bestDrillNext.reason}${drillLabel} &nbsp;<span class="drill-tip-action">[Rê/Bấm xem vị trí]</span>`;
      recDrillTip.title = `Khối 2x2: ${solverResult.bestDrillNext.label} (${solverResult.bestDrillNext.percentage}) - Rê chuột hoặc bấm để sáng đèn trên bàn cờ`;
    } else {
      recDrillTip.style.display = "none";
    }
  }

  // Render Today's Treasures
  renderTodaysTreasures(
    digging.patterns,
    solverResult.seasonArtifact,
    digging.completedPatterns,
    solverResult.patternToConfirmedCoord
  );

  // Render Grid
  renderGrid(digging, solverResult, currentHints);

  // Trigger hint calculation if hint panel is open
  if (isHintActive) {
    triggerHintCalculation();
  }
}

// -------------------------------------------------------------
// HINT CALCULATION (Strictly 100% Focused on Seasonal Artifact)
// Uses precomputed currentSolverResult to eliminate duplicate solver run!
// -------------------------------------------------------------
function triggerHintCalculation() {
  if (!currentRadarData || !currentRadarData.digging || !currentSolverResult) return;

  const hintResult = deduceTreasureHints(currentRadarData.digging, currentRadarData.season, currentSolverResult);
  hintBody.style.display = "block";
  hintBody.innerHTML = "";

  if (hintResult.isAllCompleted) {
    hintStatus.textContent = "✓ Đã tìm đủ 3 di vật!";
    hintBody.innerHTML = `<div class="hint-not-enough">🎉 Bạn đã đào trúng đủ 3 di vật hôm nay. Dừng đào để giữ cuốc!</div>`;
    currentHints = [];
    renderGrid(currentRadarData.digging, currentSolverResult, []);
    return;
  }

  if (!hintResult.hasSufficientClues || !hintResult.hints || hintResult.hints.length === 0) {
    hintStatus.textContent = "Chưa đủ dữ kiện";
    hintBody.innerHTML = `<div class="hint-not-enough">⚠️ Chưa đủ dữ kiện để thu hẹp vị trí di vật. Hãy đào theo gợi ý AI!</div>`;
    currentHints = [];
    renderGrid(currentRadarData.digging, currentSolverResult, []);
  } else {
    hintStatus.textContent = `${hintResult.hints.length} vị trí ứng viên ${currentSolverResult.seasonArtifact}`;
    currentHints = hintResult.hints;

    // Render top ranked hints (up to 5)
    hintResult.hints.slice(0, 5).forEach(h => {
      const row = document.createElement("div");
      row.className = `hint-row ${h.rank === 1 ? "rank-1" : ""}`;
      row.style.cursor = "pointer";

      const left = document.createElement("div");
      left.className = "hint-row-left";

      const pill = document.createElement("span");
      pill.className = "hint-rank-pill";
      pill.textContent = `#${h.rank}`;
      left.appendChild(pill);

      const coord = coordToLabel(h.x, h.y);
      const tileLbl = document.createElement("span");
      tileLbl.className = "hint-tile-lbl";
      tileLbl.textContent = `Ô ${coord}`;
      left.appendChild(tileLbl);

      if (h.pieceName) {
        const itemIcon = createTreasureImg(h.pieceName, "hint-item-icon", h.pieceName);
        left.appendChild(itemIcon);
      }

      row.appendChild(left);

      const right = document.createElement("div");
      right.className = "hint-row-right";

      const reason = document.createElement("span");
      reason.className = "hint-reason-txt";
      reason.textContent = h.primaryReason;
      reason.title = h.primaryReason;
      right.appendChild(reason);

      const confPill = document.createElement("span");
      confPill.className = "hint-confidence-pill";
      confPill.textContent = h.confidence;
      right.appendChild(confPill);

      row.appendChild(right);

      // Click on hint row: open its PredictionSet or highlight ghost
      row.addEventListener("click", () => {
        const sets = currentSolverResult?.artifactMap?.[h.key] || [];
        if (sets.length > 1) {
          openPredictionPanel(h.key, sets, currentSolverResult);
        } else if (sets.length === 1) {
          highlightPlacement(sets[0]?.set?.[0], currentSolverResult.patternColorMap);
        }
      });

      hintBody.appendChild(row);
    });

    renderGrid(currentRadarData.digging, currentSolverResult, currentHints);
  }
}

// Hint Button Handler
btnTreasureHint?.addEventListener("click", () => {
  if (!currentRadarData || !currentRadarData.digging) {
    hintStatus.textContent = "Chưa có dữ liệu đào!";
    return;
  }

  isHintActive = !isHintActive;
  btnTreasureHint.classList.toggle("active", isHintActive);

  if (!isHintActive) {
    hintBody.style.display = "none";
    hintStatus.textContent = "Bấm để xem danh sách vị trí di vật tối ưu";
    currentHints = [];
    if (currentSolverResult) {
      renderGrid(currentRadarData.digging, currentSolverResult, []);
    }
  } else {
    triggerHintCalculation();
  }
});

function getUtcDayStart(now = Date.now()) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function getUtcDayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

function filterTodayTiles(grid) {
  if (!Array.isArray(grid)) return [];
  const todayStart = getUtcDayStart();
  return grid.filter(t => !t.dugAt || t.dugAt >= todayStart);
}

let lastKnownFarmId = null;
let isSyncing = false;
let lastSyncTimestamp = 0;

function extractPayloadFromRaw(raw) {
  if (!raw || typeof raw !== "object") return null;
  const farmId = raw.farmId || raw.id || null;
  const farm = raw.farm || raw;
  const todayStart = getUtcDayStart();
  let digging = farm.desert?.digging || raw.digging || null;
  if (digging) {
    digging = JSON.parse(JSON.stringify(digging));
  } else if (currentRadarData?.digging) {
    const curGrid = currentRadarData.digging.grid || [];
    const hasToday = curGrid.some(t => !t.dugAt || t.dugAt >= todayStart);
    if (hasToday || curGrid.length === 0) {
      digging = currentRadarData.digging;
    }
  }
  const season = farm.season?.season || raw.season || currentRadarData?.season || "Ascension Age";
  const inventory = {
    shovel: Number(farm.inventory?.["Sand Shovel"] || raw.inventory?.shovel || currentRadarData?.inventory?.shovel || 0),
    drill: Number(farm.inventory?.["Sand Drill"] || raw.inventory?.drill || currentRadarData?.inventory?.drill || 0)
  };

  const delivery = farm.delivery || raw.delivery || currentFullFarmData?.delivery || null;
  const fullInventory = farm.inventory || raw.fullInventory || currentFullFarmData?.fullInventory || {};
  const bumpkin = farm.bumpkin || raw.bumpkin || currentFullFarmData?.bumpkin || {};
  const potionHouse = farm.potionHouse || raw.potionHouse || currentFullFarmData?.potionHouse || null;
  const flowers = farm.flowers || raw.flowers || currentFullFarmData?.flowers || null;

  return {
    farmId,
    season,
    digging,
    inventory,
    delivery,
    fullInventory,
    bumpkin,
    potionHouse,
    flowers,
    farm,
    updatedAt: Date.now()
  };
}

function handleIncomingData(raw, isForceRefresh = false) {
  const payload = extractPayloadFromRaw(raw);
  if (!payload) return;

  currentFullFarmData = payload;

  if (payload.digging && Array.isArray(payload.digging.grid)) {
    const todayStart = getUtcDayStart();
    const curDigging = currentRadarData?.digging || savedGameRadarData?.digging || null;
    const curGrid = curDigging?.grid || [];
    const newGrid = payload.digging.grid || [];

    // Detect if this payload represents a new day or a grid reset
    const curHasOnlyYesterdayDigs = curGrid.length > 0 && curGrid.every(t => t.dugAt && t.dugAt < todayStart);
    const streakIncreased = (payload.digging.streak?.count || 0) > (curDigging?.streak?.count || 0);
    const completedReset = (curDigging?.completedPatterns?.length || 0) > 0 && (payload.digging.completedPatterns?.length || 0) === 0;
    const patternsChanged = curDigging?.patterns && payload.digging.patterns &&
      curDigging.patterns.join(",") !== payload.digging.patterns.join(",");

    const isNewDay = curHasOnlyYesterdayDigs || streakIncreased || completedReset || patternsChanged || isForceRefresh;

    if (isNewDay) {
      console.log(`[SFL Radar] New digging day or reset detected (${getUtcDayKey()}). Resetting board.`);
      if (currentRadarData?.digging) currentRadarData.digging = null;
      if (savedGameRadarData?.digging) savedGameRadarData.digging = null;
      payload.digging.grid = filterTodayTiles(newGrid);
    } else {
      // Strictly same day logic
      if (curGrid.length > 0 && newGrid.length < curGrid.length) {
        console.warn(`[SFL Radar] Rejected stale rollback: incoming has ${newGrid.length} digs, but current board has ${curGrid.length} digs.`);
        return;
      }

      // Merge only today's tiles
      const curTodayTiles = filterTodayTiles(curGrid);
      const newTodayTiles = filterTodayTiles(newGrid);
      const tileMap = new Map();
      for (const t of curTodayTiles) tileMap.set(`${t.x},${t.y}`, t);
      for (const t of newTodayTiles) tileMap.set(`${t.x},${t.y}`, t);
      payload.digging.grid = Array.from(tileMap.values());

      // Shovels can only decrease or stay same during digging with shovels
      const drillDecreased = currentRadarData?.inventory?.drill !== undefined &&
        payload.inventory?.drill !== undefined &&
        payload.inventory.drill < currentRadarData.inventory.drill;
      if (!drillDecreased && currentRadarData?.inventory?.shovel !== undefined && payload.inventory?.shovel !== undefined) {
        if (payload.digging.grid.length > curGrid.length && payload.inventory.shovel >= currentRadarData.inventory.shovel) {
          payload.inventory.shovel = Math.max(0, currentRadarData.inventory.shovel - (payload.digging.grid.length - curGrid.length));
        }
      }
    }
  }

  savedGameRadarData = payload;
  if (payload.farmId) {
    lastKnownFarmId = payload.farmId;
  }
  if (!isPracticeMode) {
    if (payload.digging) {
      updateRadarUI(payload);
    }
    renderActiveTab();
  }
}

// Live API sync (Fallback when opening extension with no data, or clicking "Làm mới")
async function syncLiveFarmData(force = false) {
  if (isPracticeMode) return;
  const farmId = currentRadarData?.farmId || savedGameRadarData?.farmId || null;
  if (!farmId) return; // Không gọi API nếu không có farm ID hợp lệ từ phiên chơi thật
  const todayStart = getUtcDayStart();

  // If we already have live dug tiles from TODAY and this is not a force-refresh, do not call external API
  const curGrid = currentRadarData?.digging?.grid || [];
  const hasTodayLiveData = curGrid.some(t => !t.dugAt || t.dugAt >= todayStart);
  if (!force && hasTodayLiveData) {
    return;
  }

  const now = Date.now();
  if (!force && (now - lastSyncTimestamp < 15000)) {
    return;
  }

  if (isSyncing && !force) return;
  isSyncing = true;

  try {
    const res = await fetch(`https://d1g.uk/.netlify/functions/sfl-api/community/farms/${farmId}`, {
      cache: "no-cache"
    });
    if (res.ok) {
      lastSyncTimestamp = Date.now();
      const json = await res.json();
      if (json) {
        handleIncomingData(json, force);
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ SFL_SESSION_DATA: json });
        }
      }
    }
  } catch (e) {
    console.warn("[SFL Treasure Radar] Live sync error:", e);
  } finally {
    isSyncing = false;
  }
}

// Load saved data from Chrome Storage
function loadSavedData() {
  const todayStart = getUtcDayStart();
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    // Xóa triệt để ID nông trại cá nhân từng lưu trong bộ nhớ trình duyệt
    chrome.storage.local.remove(["SFL_LAST_FARM_ID"]);
    chrome.storage.local.get(["SFL_SESSION_DATA", "SFL_RADAR_DATA", "SFL_P2P_LIVE_CACHE", "SFL_MEMORY_DATA", "SFL_CHAAC_DATA"], res => {
      if (res?.SFL_MEMORY_DATA) {
        handleIncomingMemoryData(res.SFL_MEMORY_DATA);
      }
      if (res?.SFL_CHAAC_DATA) {
        handleIncomingChaacData(res.SFL_CHAAC_DATA);
      }
      if (res?.SFL_P2P_LIVE_CACHE?.prices) {
        liveMarketPrices = res.SFL_P2P_LIVE_CACHE;
        if (activeTab === "foodlist") {
          renderFoodListView();
        }
      }
      const raw = res?.SFL_SESSION_DATA || res?.SFL_RADAR_DATA;
      if (raw) {
        // Discard yesterday's digging grid if cached
        const digging = raw.farm?.desert?.digging || raw.digging;
        const grid = digging?.grid || [];
        const isAllExpired = grid.length > 0 && grid.every(t => t.dugAt && t.dugAt < todayStart);
        if (isAllExpired) {
          console.log("[SFL Radar] Cached session has yesterday's digs. Discarding stale digging grid.");
          if (raw.farm?.desert?.digging) {
            raw.farm.desert.digging.grid = [];
            raw.farm.desert.digging.completedPatterns = [];
          }
          if (raw.digging) {
            raw.digging.grid = [];
            raw.digging.completedPatterns = [];
          }
          chrome.storage.local.set({ SFL_SESSION_DATA: raw });
        }
        handleIncomingData(raw);
      }
      // If still no live data for today, fetch live data
      const curGrid = currentRadarData?.digging?.grid || [];
      const hasTodayData = curGrid.some(t => !t.dugAt || t.dugAt >= todayStart);
      if (!currentRadarData || !hasTodayData) {
        syncLiveFarmData(true);
      }
    });
  } else {
    syncLiveFarmData(true);
  }
}

// Storage Listener (Zero-latency update when session or autosave data is saved)
if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.SFL_SESSION_DATA && changes.SFL_SESSION_DATA.newValue) {
        handleIncomingData(changes.SFL_SESSION_DATA.newValue);
      } else if (changes.SFL_RADAR_DATA && changes.SFL_RADAR_DATA.newValue) {
        handleIncomingData(changes.SFL_RADAR_DATA.newValue);
      } else if (changes.SFL_MEMORY_DATA && changes.SFL_MEMORY_DATA.newValue) {
        handleIncomingMemoryData(changes.SFL_MEMORY_DATA.newValue);
      } else if (changes.SFL_CHAAC_DATA && changes.SFL_CHAAC_DATA.newValue) {
        handleIncomingChaacData(changes.SFL_CHAAC_DATA.newValue);
      }
    }
  });
}

// Runtime Message Listener
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "SFL_SESSION_DATA" || msg.type === "SFL_AUTOSAVE_DATA" || msg.type === "SFL_RADAR_DATA") {
      if (msg.payload) {
        handleIncomingData(msg.payload);
      }
    } else if (msg.type === "SFL_MEMORY_DATA" && msg.payload) {
      handleIncomingMemoryData(msg.payload);
    } else if (msg.type === "SFL_CHAAC_DATA" && msg.payload) {
      handleIncomingChaacData(msg.payload);
    }
  });
}

// Refresh Button: Spinning feedback and immediate live fetch
btnRefresh?.addEventListener("click", async () => {
  btnRefresh.classList.add("refresh-spin");
  const todayStart = getUtcDayStart();
  const curGrid = currentRadarData?.digging?.grid || [];
  if (curGrid.length > 0 && curGrid.every(t => t.dugAt && t.dugAt < todayStart)) {
    if (currentRadarData?.digging) {
      currentRadarData.digging.grid = [];
      currentRadarData.digging.completedPatterns = [];
    }
  }
  await syncLiveFarmData(true);
  setTimeout(() => btnRefresh.classList.remove("refresh-spin"), 700);
});

// Render initial empty board if no data yet
function renderInitialEmptyGrid() {
  if (!gridBody || gridBody.children.length > 0) return;
  for (let y = 0; y < 10; y++) {
    const rowEl = document.createElement("div");
    rowEl.className = "grid-row";
    const rowLbl = document.createElement("div");
    rowLbl.className = "row-lbl";
    rowLbl.textContent = y + 1;
    rowEl.appendChild(rowLbl);
    for (let x = 0; x < 10; x++) {
      const cellEl = document.createElement("div");
      cellEl.className = "cell";
      cellEl.dataset.coord = `${x},${y}`;
      cellEl.dataset.label = coordToLabel(x, y);
      cellEl.title = `[${coordToLabel(x, y)}] Chưa có dữ liệu`;
      rowEl.appendChild(cellEl);
    }
    gridBody.appendChild(rowEl);
  }
}

// Demo Data Toggle (Scenario 1: Searching for remaining artifacts; Scenario 2: Completed)
let demoStep = 0;
btnDemo?.addEventListener("click", () => {
  demoStep = (demoStep + 1) % 2;
  if (demoStep === 1) {
    // Scenario 1: Searching for remaining artifacts (Otter Pebble) with candidate sets & AI recommendation
    const partialData = {
      farmId: null,
      season: "Ascension Age",
      inventory: { shovel: 18, drill: 0 },
      digging: {
        patterns: [
          "ARTEFACT_FOURTEEN",
          "ARTEFACT_SIXTEEN",
          "ARTEFACT_SEVENTEEN",
          "HIEROGLYPH",
          "SEA_CUCUMBERS",
          "WOODEN_COMPASS",
          "PEARL"
        ],
        completedPatterns: ["ARTEFACT_FOURTEEN"],
        streak: { count: 101 },
        grid: [
          { x: 4, y: 0, items: { "Otter Pebble": 1 } },
          { x: 4, y: 2, items: { "Camel Bone": 1 } },
          { x: 4, y: 1, items: { Crab: 1 } },
          { x: 7, y: 1, items: { Crab: 1 } },
          { x: 1, y: 2, items: { Crab: 1 } },
          { x: 6, y: 2, items: { Vase: 1 } },
          { x: 7, y: 2, items: { Crab: 1 } },
          { x: 2, y: 3, items: { "Camel Bone": 1 } },
          { x: 5, y: 3, items: { Sand: 1 } },
          { x: 1, y: 4, items: { Sand: 1 } },
          { x: 2, y: 4, items: { Crab: 1 } },
          { x: 4, y: 4, items: { Vase: 1 } },
          { x: 9, y: 4, items: { Wood: 1 } },
          { x: 2, y: 5, items: { Sand: 1 } },
          { x: 5, y: 5, items: { Sand: 1 } },
          { x: 9, y: 5, items: { Pearl: 1 } },
          { x: 4, y: 6, items: { Sand: 1 } },
          { x: 7, y: 7, items: { "Ancient Clock": 1 } },
          { x: 4, y: 8, items: { Crab: 1 } },
          { x: 5, y: 8, items: { Sand: 1 } }
        ]
      },
      delivery: {
        orders: [
          {
            id: "ord_betty",
            from: "betty",
            items: { Pumpkin: 85, Soybean: 55 },
            reward: { coins: 545 }
          },
          {
            id: "ord_blacksmith",
            from: "blacksmith",
            items: { Wood: 50 },
            reward: { coins: 1184 }
          },
          {
            id: "ord_gordo",
            from: "gordo",
            items: { "Parsnip Cake": 1 },
            reward: { sfl: 0.95 }
          },
          {
            id: "ord_grimtooth",
            from: "grimtooth",
            items: { "Blueberry Jam": 1 },
            reward: { sfl: 0.4 }
          },
          {
            id: "ord_oldsalty",
            from: "old salty",
            items: { Sand: 12 },
            reward: { coins: 260 }
          }
        ]
      },
      fullInventory: {
        Wood: 120,
        Stone: 45,
        Iron: 18,
        Gold: 8,
        Crimstone: 4,
        Sunflower: 4200,
        Potato: 1850,
        Pumpkin: 95,
        Soybean: 60,
        Banana: 35,
        "Parsnip Cake": 1,
        Honey: 15,
        Egg: 22,
        Sand: 30
      },
      bumpkin: {
        skills: {
          "Feller's Discount": 1,
          "Frugal Miner": 1
        }
      }
    };
    handleIncomingData(partialData);
    if (btnDemo) btnDemo.textContent = "🧪 Demo: Đã đào xong (3/3)";
  } else {
    // Scenario 2: All 3 artifacts completed
    const fullData = {
      farmId: null,
      season: "Ascension Age",
      inventory: { shovel: 23, drill: 0 },
      digging: {
        patterns: [
          "ARTEFACT_FOURTEEN",
          "ARTEFACT_SIXTEEN",
          "ARTEFACT_SEVENTEEN",
          "HIEROGLYPH",
          "SEA_CUCUMBERS",
          "WOODEN_COMPASS",
          "PEARL"
        ],
        completedPatterns: ["ARTEFACT_FOURTEEN"],
        streak: { count: 101 },
        grid: [
          { x: 4, y: 0, items: { "Otter Pebble": 1 } },
          { x: 1, y: 1, items: { "Otter Pebble": 1 } },
          { x: 2, y: 1, items: { "Otter Pebble": 1 } },
          { x: 4, y: 1, items: { Crab: 1 } },
          { x: 7, y: 1, items: { Crab: 1 } },
          { x: 8, y: 1, items: { "Otter Pebble": 1 } },
          { x: 1, y: 2, items: { Crab: 1 } },
          { x: 6, y: 2, items: { Vase: 1 } },
          { x: 7, y: 2, items: { Crab: 1 } },
          { x: 8, y: 2, items: { Crab: 1 } },
          { x: 2, y: 3, items: { "Camel Bone": 1 } },
          { x: 3, y: 3, items: { Crab: 1 } },
          { x: 5, y: 3, items: { Sand: 1 } },
          { x: 1, y: 4, items: { Sand: 1 } },
          { x: 2, y: 4, items: { Crab: 1 } },
          { x: 3, y: 4, items: { Crab: 1 } },
          { x: 4, y: 4, items: { Vase: 1 } },
          { x: 7, y: 4, items: { Crab: 1 } },
          { x: 8, y: 4, items: { Crab: 1 } },
          { x: 9, y: 4, items: { Wood: 1 } },
          { x: 2, y: 5, items: { Sand: 1 } },
          { x: 5, y: 5, items: { Sand: 1 } },
          { x: 7, y: 5, items: { Crab: 1 } },
          { x: 8, y: 5, items: { Crab: 1 } },
          { x: 9, y: 5, items: { Pearl: 1 } },
          { x: 2, y: 6, items: { Sand: 1 } },
          { x: 4, y: 6, items: { Sand: 1 } },
          { x: 1, y: 7, items: { Crab: 1 } },
          { x: 2, y: 7, items: { Crab: 1 } },
          { x: 7, y: 7, items: { "Ancient Clock": 1 } },
          { x: 3, y: 8, items: { "Otter Pebble": 1 } },
          { x: 4, y: 8, items: { Crab: 1 } },
          { x: 5, y: 8, items: { Sand: 1 } },
          { x: 3, y: 9, items: { Crab: 1 } },
          { x: 7, y: 9, items: { Crab: 1 } },
          { x: 8, y: 9, items: { Crab: 1 } }
        ]
      },
      delivery: {
        orders: [
          // Flower (SFL) Deliveries
          {
            id: "ord_guria",
            from: "guria",
            items: { "Purple Daffodil": 1 },
            reward: { sfl: 1.1 },
            completedAt: Date.now() - 3600000
          },
          {
            id: "ord_grubnuk",
            from: "grubnuk",
            items: { "Purple Cosmos": 1 },
            reward: { sfl: 0.5 },
            completedAt: Date.now() - 3000000
          },
          {
            id: "ord_gambit",
            from: "gambit",
            items: { "Tofu Scramble": 1 },
            reward: { sfl: 0.8 },
            completedAt: Date.now() - 2500000
          },
          {
            id: "ord_grimbly",
            from: "grimbly",
            items: { "Bumpkin Salad": 1 },
            reward: { sfl: 0.35 },
            completedAt: Date.now() - 2000000
          },
          {
            id: "ord_gordo",
            from: "gordo",
            items: { "Banana Blast": 2 },
            reward: { sfl: 0.9 },
            completedAt: Date.now() - 1500000
          },

          // Coin Deliveries
          {
            id: "ord_victoria",
            from: "victoria",
            items: { Potato: 100, Rice: 3 },
            reward: { coins: 1230 }
          },
          {
            id: "ord_peggy",
            from: "peggy",
            items: { "Purple Smoothie": 4 },
            reward: { coins: 588 }
          },
          {
            id: "ord_blacksmith",
            from: "blacksmith",
            items: { Iron: 2, Stone: 15 },
            reward: { coins: 2230.8 },
            completedAt: Date.now() - 1000000
          },
          {
            id: "ord_tango",
            from: "tango",
            items: { Orange: 12, Tomato: 30 },
            reward: { coins: 990 },
            completedAt: Date.now() - 500000
          },
          {
            id: "ord_betty",
            from: "betty",
            items: { Cabbage: 60, Soybean: 60 },
            reward: { coins: 795.6 },
            completedAt: Date.now() - 200000
          }
        ]
      },
      fullInventory: {
        Potato: 11829.5,
        Rice: 31,
        "Purple Smoothie": 3,
        Iron: 35,
        Stone: 80,
        Orange: 45,
        Tomato: 120,
        Cabbage: 200,
        Soybean: 150,
        Wood: 250,
        Gold: 15,
        Crimstone: 9,
        Sunflower: 8000,
        "Tofu Scramble": 2,
        "Bumpkin Salad": 2,
        "Banana Blast": 3,
        "Purple Daffodil": 1,
        "Purple Cosmos": 1,
        Honey: 35,
        Egg: 40,
        Sand: 50
      },
      bumpkin: {
        skills: {
          "Feller's Discount": 1,
          "Frugal Miner": 1
        }
      }
    };
    handleIncomingData(fullData);
    if (btnDemo) btnDemo.textContent = "🧪 Demo: Đang đào (1/3)";
  }
});

// -------------------------------------------------------------
// PRACTICE MODE (Interactive Simulator)
// -------------------------------------------------------------
function setPracticeTool(tool) {
  practiceSelectedTool = tool;
  const isDrill = tool === "drill";

  if (btnPracticeToolShovel) {
    btnPracticeToolShovel.classList.toggle("active", !isDrill);
  }
  if (btnPracticeToolDrill) {
    btnPracticeToolDrill.classList.toggle("active", isDrill);
  }

  const paneDesert = document.getElementById("pane-desert");
  if (paneDesert) {
    paneDesert.classList.toggle("practice-tool-drill", isDrill);
    paneDesert.classList.toggle("practice-tool-shovel", !isDrill);
  }

  clearDrillHover();

  if (currentRadarData && currentSolverResult) {
    renderGrid(currentRadarData.digging, currentSolverResult, currentHints);
  }
}

function startPracticeMode(newGame = false) {
  isPracticeMode = true;
  lastDiggingFingerprint = null;
  currentSolverResult = null;

  const paneDesert = document.getElementById("pane-desert");
  if (paneDesert) paneDesert.classList.add("practice-mode-active");

  if (practiceBar) practiceBar.style.display = "flex";
  if (radarQuickBar) radarQuickBar.style.display = "none";

  if (btnPracticeMode) {
    btnPracticeMode.classList.add("active");
    btnPracticeMode.textContent = "🎮 Thoát Luyện Tập";
  }
  if (btnTopPractice) {
    btnTopPractice.classList.add("active");
    btnTopPractice.textContent = "🎮 Thoát Luyện Tập";
  }

  if (newGame || !practiceGameData) {
    const dataSource = savedGameRadarData || currentRadarData;
    const activeSeason = dataSource?.season || "Ascension Age";
    const todayPatterns = dataSource?.digging?.patterns || null;
    practiceGameData = generateRandomPracticeBoard(activeSeason, todayPatterns);
    practiceDigs = [];
    practiceStats = { shovelsUsed: 0, drillsUsed: 0 };
    isSecretRevealed = false;
    setPracticeTool("shovel");
    if (btnPracticeReveal) {
      btnPracticeReveal.textContent = "👁️ Đáp án";
      btnPracticeReveal.classList.remove("active");
    }
  }

  updatePracticeRadar();
}

function exitPracticeMode() {
  isPracticeMode = false;
  lastDiggingFingerprint = null;
  currentSolverResult = null;
  practiceSelectedTool = "shovel";
  practiceStats = { shovelsUsed: 0, drillsUsed: 0 };

  const paneDesert = document.getElementById("pane-desert");
  if (paneDesert) {
    paneDesert.classList.remove("practice-mode-active", "practice-tool-drill", "practice-tool-shovel");
  }

  if (practiceBar) practiceBar.style.display = "none";
  if (radarQuickBar) radarQuickBar.style.display = "flex";

  if (btnPracticeMode) {
    btnPracticeMode.classList.remove("active");
    btnPracticeMode.textContent = "🎯 Luyện Tập";
  }
  if (btnTopPractice) {
    btnTopPractice.classList.remove("active");
    btnTopPractice.textContent = "🎯 Luyện Tập (Simulator)";
  }
  clearGhosts();
  clearDrillHover();
  if (recDrillTip) recDrillTip.style.display = "none";
  if (predictPanel) predictPanel.style.display = "none";

  // Revert to saved data from game
  if (savedGameRadarData) {
    updateRadarUI(savedGameRadarData);
  } else {
    loadSavedData();
  }
}

function handlePracticeDig(x, y) {
  if (!isPracticeMode || !practiceGameData) return;

  if (practiceSelectedTool === "drill") {
    // 2x2 Drill: dig 4 tiles simultaneously rooted at min(8, x), min(8, y)
    const ox = Math.min(8, x);
    const oy = Math.min(8, y);
    const drillCoords = [
      { x: ox, y: oy },
      { x: ox + 1, y: oy },
      { x: ox, y: oy + 1 },
      { x: ox + 1, y: oy + 1 }
    ];

    const undug = drillCoords.filter(c => !practiceDigs.some(d => d.x === c.x && d.y === c.y));
    if (undug.length === 0) {
      // All 4 cells already opened
      return;
    }

    for (const c of undug) {
      const k = `${c.x},${c.y}`;
      const item = practiceGameData.secretBoard[k] || "Sand";
      practiceDigs.push({
        x: c.x,
        y: c.y,
        items: { [item]: 1 }
      });
    }
    practiceStats.drillsUsed++;
    updatePracticeRadar();
    clearDrillHover();
  } else {
    // Standard Shovel: dig 1 tile
    const key = `${x},${y}`;
    if (practiceDigs.some(d => d.x === x && d.y === y)) return;

    const item = practiceGameData.secretBoard[key] || "Sand";
    practiceDigs.push({
      x,
      y,
      items: { [item]: 1 }
    });
    practiceStats.shovelsUsed++;
    updatePracticeRadar();
  }
}

function updatePracticeRadar() {
  if (!practiceGameData) return;
  const targetName = practiceGameData.seasonArtifact;
  const foundTargetCount = practiceDigs.filter(d => d.items && d.items[targetName]).length;

  if (practiceShovels) {
    practiceShovels.innerHTML = `⛏️ Cuốc: <b>${practiceStats.shovelsUsed}</b> &nbsp;|&nbsp; ⚙️ Khoan: <b>${practiceStats.drillsUsed}</b>`;
  }
  if (practiceTargets) {
    practiceTargets.textContent = `Di vật: ${foundTargetCount}/3`;
  }

  // Detect when any pattern in secretBoardPlacements is completely dug
  const completedInPractice = [];
  if (practiceGameData.secretBoardPlacements) {
    for (const form of practiceGameData.secretBoardPlacements) {
      const allDug = form.tiles.every(t => practiceDigs.some(d => d.x === t.x && d.y === t.y));
      if (allDug) {
        completedInPractice.push(form.patternName);
      }
    }
  }

  const practicePayload = {
    farmId: "Practice (Luyện tập)",
    season: practiceGameData.season || "Ascension Age",
    inventory: {
      shovel: Math.max(0, 50 - practiceStats.shovelsUsed),
      drill: Math.max(0, 10 - practiceStats.drillsUsed)
    },
    digging: {
      patterns: practiceGameData.allPatternsToday,
      completedPatterns: completedInPractice,
      streak: { count: 99 },
      grid: practiceDigs
    }
  };

  updateRadarUI(practicePayload);

  if (foundTargetCount >= 3) {
    if (recommendationBanner) {
      recommendationBanner.className = "recommendation-banner banner-completed";
      const iconEl = recommendationBanner.querySelector(".rec-icon");
      if (iconEl) iconEl.textContent = "🎉";
      const recTitleEl = recommendationBanner.querySelector(".rec-title");
      if (recTitleEl && recTitleEl.childNodes[0]) {
        recTitleEl.childNodes[0].textContent = "HOÀN THÀNH XUẤT SẮC!";
      }
      if (recTileName) recTileName.style.display = "none";
      if (recTileReason) {
        recTileReason.textContent = `🎉 Bạn đã tìm đủ cả 3 di vật (${targetName}) với ${practiceStats.shovelsUsed} cuốc và ${practiceStats.drillsUsed} khoan (tổng ${practiceDigs.length} ô mở)! Bấm "🎲 Ván mới" để tiếp tục luyện tập.`;
      }
    }
  }
}

// Practice Event Listeners
btnPracticeMode?.addEventListener("click", () => {
  if (isPracticeMode) {
    exitPracticeMode();
  } else {
    startPracticeMode(true);
  }
});

btnTopPractice?.addEventListener("click", () => {
  if (isPracticeMode) {
    exitPracticeMode();
  } else {
    startPracticeMode(true);
  }
});

btnTopRefresh?.addEventListener("click", () => {
  if (btnRefresh) btnRefresh.click();
});

btnTopDemo?.addEventListener("click", () => {
  if (btnDemo) btnDemo.click();
});

btnPracticeToolShovel?.addEventListener("click", () => {
  setPracticeTool("shovel");
});

btnPracticeToolDrill?.addEventListener("click", () => {
  setPracticeTool("drill");
});

recDrillTip?.addEventListener("mouseenter", () => {
  if (!isPracticeMode && currentSolverResult?.bestDrillNext) {
    highlightDrillArea(currentSolverResult.bestDrillNext.ox, currentSolverResult.bestDrillNext.oy);
  }
});

recDrillTip?.addEventListener("mouseleave", () => {
  if (!isPracticeMode && !isLiveDrillHighlighted) {
    clearDrillHover();
  }
});

recDrillTip?.addEventListener("click", () => {
  if (isPracticeMode) {
    setPracticeTool("drill");
  } else {
    isLiveDrillHighlighted = !isLiveDrillHighlighted;
    recDrillTip.classList.toggle("active", isLiveDrillHighlighted);
    if (isLiveDrillHighlighted && currentSolverResult?.bestDrillNext) {
      highlightDrillArea(currentSolverResult.bestDrillNext.ox, currentSolverResult.bestDrillNext.oy);
    } else {
      clearDrillHover();
    }
    if (currentRadarData?.digging && currentSolverResult) {
      renderGrid(currentRadarData.digging, currentSolverResult, currentHints);
    }
  }
});

btnPracticeNewGame?.addEventListener("click", () => {
  startPracticeMode(true);
});

btnPracticeReveal?.addEventListener("click", () => {
  isSecretRevealed = !isSecretRevealed;
  btnPracticeReveal.textContent = isSecretRevealed ? "🙈 Ẩn đáp án" : "👁️ Đáp án";
  btnPracticeReveal.classList.toggle("active", isSecretRevealed);
  if (isHintActive) {
    triggerHintCalculation();
  } else if (currentSolverResult && currentRadarData) {
    renderGrid(currentRadarData.digging, currentSolverResult, currentHints);
  }
});

btnPracticeExit?.addEventListener("click", () => {
  exitPracticeMode();
});

// Keyboard shortcuts for Practice Mode
document.addEventListener("keydown", (e) => {
  if (!isPracticeMode) return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

  if (e.key === "1" || e.key.toLowerCase() === "s") {
    setPracticeTool("shovel");
  } else if (e.key === "2" || e.key.toLowerCase() === "d") {
    setPracticeTool("drill");
  } else if (e.key.toLowerCase() === "r") {
    startPracticeMode(true);
  } else if (e.key === " " || e.key.toLowerCase() === "v") {
    e.preventDefault();
    btnPracticeReveal?.click();
  } else if (e.key === "Escape") {
    exitPracticeMode();
  }
});

// =============================================================
// MULTI-TAB NAVIGATION SYSTEM
// =============================================================
function initTabNavigation() {
  const tabButtons = document.querySelectorAll(".s-nav-btn, .tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;
      if (!targetTab) return;
      activeTab = targetTab;

      tabButtons.forEach(b => b.classList.toggle("active", b.dataset.tab === targetTab));
      tabPanes.forEach(pane => {
        const isTarget = pane.id === `pane-${targetTab}`;
        pane.style.display = isTarget ? "block" : "none";
        pane.classList.toggle("active", isTarget);
      });

      const panesContainer = document.querySelector(".panes-container");
      if (panesContainer) {
        panesContainer.classList.toggle("wide-layout", targetTab === "foodlist");
      }

      renderActiveTab();
    });
  });
}

// =============================================================
// LIVE MARKET DATA FETCHER (SFL.WORLD & DEXSCREENER)
// =============================================================
async function loadLiveMarketData(force = false) {
  if (btnRefreshMarket) {
    btnRefreshMarket.textContent = "⏳ Đang tải...";
    btnRefreshMarket.disabled = true;
  }

  try {
    const [p2pData, exData] = await Promise.all([
      fetchLiveP2PPrices(force),
      fetchLiveExchangeRates()
    ]);

    liveMarketPrices = p2pData;
    liveExchangeRates = exData;

    renderActiveTab();
  } catch (err) {
    console.warn("[SFL Market] Error loading market data:", err);
  } finally {
    if (btnRefreshMarket) {
      btnRefreshMarket.textContent = "🔄 Cập nhật giá";
      btnRefreshMarket.disabled = false;
    }
  }
}

// =============================================================
// ACTIVE TAB RENDER DISPATCHER
// =============================================================
function renderActiveTab() {
  if (activeTab === "tasks") {
    renderTasksView();
  } else if (activeTab === "market") {
    renderMarketView();
  } else if (activeTab === "coin") {
    renderCoinRatesView();
  } else if (activeTab === "inventory") {
    renderInventoryView();
  } else if (activeTab === "profit") {
    renderProfitView();
  } else if (activeTab === "flowers") {
    renderFlowersView();
  } else if (activeTab === "potion") {
    renderPotionView();
  } else if (activeTab === "foodlist") {
    renderFoodListView();
  } else if (activeTab === "memory") {
    renderMemoryView();
  } else if (activeTab === "chaac") {
    renderChaacView();
  }
}

function getResetTimeUtc() {
  const now = new Date();
  const nextUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const diffMs = Math.max(0, nextUtc - now);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `Reset in ${hours}h ${mins}m`;
}

function getUtcDateString() {
  const now = new Date();
  const day = now.getUTCDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[now.getUTCMonth()];
  return `Tasks (${day} ${month} , UTC)`;
}

function renderDeliveryCard(ord) {
  const isCompleted = ord.isCompleted;
  const isReady = ord.allReady && !isCompleted;

  let cardClass = "card-missing";
  let badgeClass = "badge-missing";
  let badgeHtml = `<span class="badge-icon">⊘</span> Missing`;

  if (isCompleted) {
    cardClass = "card-completed";
    badgeClass = "badge-completed";
    badgeHtml = `<span class="badge-icon">✓</span> Completed`;
  } else if (isReady) {
    cardClass = "card-ready";
    badgeClass = "badge-ready";
    badgeHtml = `<span class="badge-icon">✓</span> Ready`;
  }

  // Reward display
  let rewardHtml = "";
  if (ord.rewardCoin > 0) {
    const sflEquiv = ord.rewardSfl || (ord.rewardCoin / 1200);
    rewardHtml = `
      <img src="img/coin.png" class="d-curr-icon" alt="Coins">
      <span class="d-reward-main">${ord.rewardCoin % 1 === 0 ? ord.rewardCoin : ord.rewardCoin.toFixed(1)}</span>
      <span class="d-reward-sub">(~${sflEquiv.toFixed(3)} <img src="img/Flower.png" class="d-sfl-icon" alt="SFL">)</span>
    `;
  } else if (ord.rewardSfl > 0) {
    rewardHtml = `
      <img src="img/Flower.png" class="d-curr-icon" alt="SFL">
      <span class="d-reward-main">${ord.rewardSfl % 1 === 0 ? ord.rewardSfl : ord.rewardSfl.toFixed(2)}</span>
    `;
  } else {
    rewardHtml = `<span class="d-reward-main">Sự kiện</span>`;
  }

  // Items list
  const itemsHtml = ord.reqItems.map(item => {
    const haveFormatted = item.have % 1 === 0 ? item.have : item.have.toFixed(1);
    const isItemMissing = item.have < item.required && !isCompleted;
    return `
      <div class="d-item-row">
        <div class="d-item-info">
          <img src="${item.icon}" class="d-item-icon" alt="${item.name}" onerror="this.src='img/sunflower.png'">
          <span class="d-item-name">${item.name}</span>
        </div>
        <div class="d-item-qty">
          ${isCompleted
            ? `<span class="check-icon">✓</span> / ${item.required}`
            : `<span class="have-val ${isItemMissing ? 'missing' : ''}">${haveFormatted}</span> / ${item.required}`}
        </div>
      </div>
    `;
  }).join("");

  // Format cost cleanly like original mod (Math.round(1000 * e) / 1000)
  const costFormatted = formatSflCost(ord.totalP2PCostSfl);

  // Profit tag
  let profitTag = "";
  if (!isCompleted) {
    if (ord.netProfitSfl >= 0) {
      profitTag = `<span class="d-profit-tag pos">+${formatSflCost(ord.netProfitSfl)}</span>`;
    } else {
      profitTag = `<span class="d-profit-tag neg">${formatSflCost(ord.netProfitSfl)}</span>`;
    }
  }

  return `
    <div class="delivery-card ${cardClass}">
      <div class="d-header">
        <div class="d-reward ${ord.isLoss ? 'reward-loss' : ''}">
          ${rewardHtml}
        </div>
        <div class="d-badge ${badgeClass}">
          ${badgeHtml}
        </div>
      </div>

      <div class="d-body">
        <div class="d-npc-block">
          <img src="${ord.npcIcon}" class="d-npc-img" alt="${ord.npcName}" onerror="this.src='img/plaza/betty.png'">
          <div class="d-npc-tag">${ord.npcName}</div>
          <div class="d-npc-position">📍 ${ord.position || "Plaza"}</div>
        </div>

        <div class="d-items-block">
          ${itemsHtml}
        </div>
      </div>

      <div class="d-footer">
        <span class="d-cost-lbl">Cost</span>
        <div class="d-cost-val">
          <img src="img/Flower.png" class="d-sfl-icon" alt="SFL">
          <span>${costFormatted}</span>
          ${profitTag}
        </div>
      </div>
    </div>
  `;
}

function formatSflCost(val) {
  if (val === null || val === undefined || isNaN(val)) return "0";
  const rounded = Math.round(1000 * val) / 1000;
  return rounded === 0 ? "0" : rounded.toString();
}

function renderTasksView() {
  if (!tasksListContainer) return;

  const farmData = currentFullFarmData || savedGameRadarData;
  const delivery = farmData?.delivery || farmData?.farm?.delivery;
  const inventory = farmData?.fullInventory || farmData?.farm?.inventory || {};
  const prices = liveMarketPrices?.prices || {};

  if (!delivery || !Array.isArray(delivery.orders) || delivery.orders.length === 0) {
    tasksListContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⏳</div>
        <div class="empty-title">Chưa có dữ liệu đơn hàng hôm nay</div>
        <div class="empty-desc">Vui lòng mở game Sunflower Land và bấm vào bảng hòm thư hoặc gặp NPC giao hàng để nạp dữ liệu.</div>
      </div>
    `;
    if (tasksBadge) tasksBadge.style.display = "none";
    return;
  }

  const bestRates = calculateBestCropRates(prices, isGreenThumbActive);
  const bestRateVal = bestRates?.bestRate?.rate || 1200;
  const analyzedOrders = analyzeDeliveryOrders(delivery, inventory, prices, bestRateVal);

  // Update Summary Stats Header
  const readyOrders = analyzedOrders.filter(o => o.allReady && !o.isCompleted);
  const completedOrders = analyzedOrders.filter(o => o.isCompleted);
  const totalSflEarned = completedOrders.reduce((sum, o) => sum + (o.rewardSfl || 0), 0);
  const totalCoinsEarned = completedOrders.reduce((sum, o) => sum + (o.rewardCoin || 0), 0);
  const totalSpentSfl = completedOrders.reduce((sum, o) => sum + (o.totalP2PCostSfl || 0), 0);

  if (tasksSummaryTitle) tasksSummaryTitle.textContent = getUtcDateString();
  if (tasksResetTime) tasksResetTime.textContent = getResetTimeUtc();
  if (tasksDeliveredCount) tasksDeliveredCount.textContent = completedOrders.length;
  if (tasksEarnedSfl) tasksEarnedSfl.textContent = formatSflCost(totalSflEarned);
  if (tasksEarnedCoins) tasksEarnedCoins.textContent = totalCoinsEarned % 1 === 0 ? totalCoinsEarned : totalCoinsEarned.toFixed(1);
  if (tasksSpentSfl) tasksSpentSfl.textContent = formatSflCost(totalSpentSfl);

  if (tasksBadge) {
    if (readyOrders.length > 0) {
      tasksBadge.textContent = readyOrders.length;
      tasksBadge.style.display = "inline-block";
    } else {
      tasksBadge.style.display = "none";
    }
  }

  // Filter orders
  let filtered = analyzedOrders;
  if (currentTaskFilter === "ready") {
    filtered = analyzedOrders.filter(o => o.allReady && !o.isCompleted);
  } else if (currentTaskFilter === "missing") {
    filtered = analyzedOrders.filter(o => !o.allReady && !o.isCompleted);
  } else if (currentTaskFilter === "profit") {
    filtered = analyzedOrders.filter(o => o.netProfitSfl > 0 && !o.isCompleted);
  } else if (currentTaskFilter === "completed") {
    filtered = analyzedOrders.filter(o => o.isCompleted);
  }

  if (filtered.length === 0) {
    tasksListContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">Không tìm thấy đơn hàng phù hợp bộ lọc</div>
      </div>
    `;
    return;
  }

  // Split into Flower Orders and Coin Orders
  const flowerOrders = filtered.filter(o => o.rewardCoin === 0 && o.rewardSfl > 0);
  const coinOrders = filtered.filter(o => o.rewardCoin > 0);
  const otherOrders = filtered.filter(o => !flowerOrders.includes(o) && !coinOrders.includes(o));

  let html = "";
  if (flowerOrders.length > 0) {
    html += `
      <h3 class="delivery-section-heading">Delivery for Flower (SFL)</h3>
      <div class="tasks-section-list">
        ${flowerOrders.map(renderDeliveryCard).join("")}
      </div>
    `;
  }

  if (coinOrders.length > 0) {
    html += `
      <h3 class="delivery-section-heading">Delivery for Coins</h3>
      <div class="tasks-section-list">
        ${coinOrders.map(renderDeliveryCard).join("")}
      </div>
    `;
  }

  if (otherOrders.length > 0) {
    html += `
      <h3 class="delivery-section-heading">Other Deliveries</h3>
      <div class="tasks-section-list">
        ${otherOrders.map(renderDeliveryCard).join("")}
      </div>
    `;
  }

  tasksListContainer.innerHTML = html;
}

// =============================================================
// TAB 3: MARKET RENDERER
// =============================================================
function renderMarketView() {
  if (!marketTableBody) return;

  if (rateSflUsd) rateSflUsd.textContent = `$${liveExchangeRates.sflUsd.toFixed(4)}`;
  if (rateSflChange) {
    const ch = liveExchangeRates.dexPriceChange24h || 0;
    rateSflChange.textContent = `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%`;
    rateSflChange.style.color = ch >= 0 ? "#10b981" : "#ef4444";
  }
  if (ratePolUsd) ratePolUsd.textContent = `$${liveExchangeRates.polUsd.toFixed(3)}`;
  if (rateCoinsSfl) rateCoinsSfl.textContent = `1 SFL = ${liveExchangeRates.coinsPerSfl} C`;
  if (marketUpdatedText) {
    marketUpdatedText.textContent = `Nguồn giá: ${liveMarketPrices?.updatedText || "Google Sheets (Trực tiếp)"}`;
  }

  const raw = liveMarketPrices?.rawP2P || {};
  const entries = Object.entries(raw).map(([k, v]) => ({
    name: k,
    price: typeof v === "number" ? v : parseFloat(v) || 0,
    icon: getItemIcon(k)
  }));

  let filtered = entries;
  if (currentMarketCategory !== "all") {
    filtered = filtered.filter(item => {
      const norm = normalizeKey(item.name);
      if (currentMarketCategory === "crop") {
        return BASE_CROPS.some(c => c.category === "crop" && normalizeKey(c.name) === norm);
      } else if (currentMarketCategory === "fruit") {
        return BASE_CROPS.some(c => c.category === "fruit" && normalizeKey(c.name) === norm);
      } else if (currentMarketCategory === "resource") {
        return ["wood", "stone", "iron", "gold", "crimstone", "obsidian", "sand"].includes(norm);
      } else if (currentMarketCategory === "animal") {
        return ["egg", "honey", "milk", "wool", "merino_wool", "feather", "leather"].includes(norm);
      } else if (currentMarketCategory === "emblem") {
        return norm.includes("emblem");
      }
      return true;
    });
  }

  if (marketSearchQuery.trim()) {
    const q = normalizeKey(marketSearchQuery);
    filtered = filtered.filter(item => normalizeKey(item.name).includes(q));
  }

  filtered.sort((a, b) => b.price - a.price);

  marketTableBody.innerHTML = "";
  if (filtered.length === 0) {
    marketTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: #64748b;">Không tìm thấy vật phẩm</td></tr>`;
    return;
  }

  const sflUsdRate = liveExchangeRates.sflUsd || 0.168;

  filtered.forEach(item => {
    const tr = document.createElement("tr");
    const usdVal = (item.price * sflUsdRate).toFixed(4);
    tr.innerHTML = `
      <td>
        <div class="item-cell">
          <img src="${item.icon}" class="item-img" alt="${item.name}" onerror="this.src='img/sunflower.png'">
          <span>${item.name}</span>
        </div>
      </td>
      <td style="text-align: right;">
        <span class="val-sfl">${item.price < 0.001 ? item.price.toFixed(6) : item.price.toFixed(4)} SFL</span>
      </td>
      <td style="text-align: right;">
        <span class="val-usd">$${usdVal}</span>
      </td>
    `;
    marketTableBody.appendChild(tr);
  });
}

// =============================================================
// TAB 4: COIN RATE RENDERER
// =============================================================
function renderCoinRatesView() {
  if (!coinRateTableBody) return;

  const prices = liveMarketPrices?.prices || {};
  const { list, bestRate } = calculateBestCropRates(prices, isGreenThumbActive);

  if (bestCropValue) {
    if (bestRate && bestRate.rate > 0) {
      bestCropValue.innerHTML = `<span style="color: #fbbf24;">${bestRate.name}</span> (${bestRate.rate.toFixed(1)} Coins / 1 SFL)`;
    } else {
      bestCropValue.textContent = "Chưa đủ dữ liệu giá";
    }
  }

  if (btnToggleGreenThumb && skillStateBadge) {
    btnToggleGreenThumb.classList.toggle("active", isGreenThumbActive);
    skillStateBadge.textContent = isGreenThumbActive ? "BẬT (+10%)" : "TẮT";
  }

  coinRateTableBody.innerHTML = "";
  list.forEach((crop, idx) => {
    const tr = document.createElement("tr");
    const isTop1 = idx === 0;
    tr.innerHTML = `
      <td>
        <div class="item-cell">
          <img src="${crop.img}" class="item-img" alt="${crop.name}" onerror="this.src='img/sunflower.png'">
          <span>${crop.name}</span>
          ${isTop1 ? `<span class="rate-badge-best">TOP 1</span>` : ""}
        </div>
      </td>
      <td style="text-align: right; color: #94a3b8;">${crop.finalSale.toFixed(1)} C</td>
      <td style="text-align: right;"><span class="val-sfl">${crop.p2pPrice < 0.001 ? crop.p2pPrice.toFixed(5) : crop.p2pPrice.toFixed(4)}</span></td>
      <td style="text-align: right; font-weight: 800; color: ${isTop1 ? '#fbbf24' : '#10b981'};">
        ${crop.rate.toFixed(1)} C/SFL
      </td>
    `;
    coinRateTableBody.appendChild(tr);
  });
}

// =============================================================
// TAB 5: INVENTORY RENDERER
// =============================================================
function renderInventoryView() {
  if (!invListContainer) return;

  const farmData = currentFullFarmData || savedGameRadarData;
  const inventory = farmData?.fullInventory || farmData?.farm?.inventory || {};
  const prices = liveMarketPrices?.prices || {};

  const { items, totalSfl } = calculateInventoryValuation(inventory, prices, isTaxActive);
  const sflUsdRate = liveExchangeRates.sflUsd || 0.168;
  const totalUsd = totalSfl * sflUsdRate;

  if (invTotalSfl) invTotalSfl.textContent = `${totalSfl.toFixed(2)} SFL`;
  if (invTotalUsd) invTotalUsd.textContent = `≈ $${totalUsd.toFixed(2)} USD`;
  if (invSubInfo) invSubInfo.textContent = `${items.length} loại vật phẩm có giá trị thương mại`;

  if (btnToggleTax && taxBadge) {
    btnToggleTax.classList.toggle("active", isTaxActive);
    taxBadge.textContent = isTaxActive ? "Đã trừ -10%" : "Chưa trừ";
  }

  let filtered = items;
  if (invSearchQuery.trim()) {
    const q = normalizeKey(invSearchQuery);
    filtered = filtered.filter(it => normalizeKey(it.name).includes(q));
  }

  if (filtered.length === 0) {
    invListContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎒</div>
        <div class="empty-title">Kho chưa có vật phẩm hoặc chưa nạp dữ liệu</div>
      </div>
    `;
    return;
  }

  invListContainer.innerHTML = "";
  filtered.forEach(it => {
    const row = document.createElement("div");
    row.className = "inv-item-row";
    row.innerHTML = `
      <div class="inv-item-left">
        <img src="${it.icon}" class="item-img" alt="${it.name}" onerror="this.src='img/sunflower.png'">
        <div>
          <span class="inv-item-qty">${it.amount % 1 === 0 ? it.amount : it.amount.toFixed(1)}×</span>
          <span class="inv-item-name">${it.name}</span>
        </div>
      </div>
      <div class="inv-item-right">
        <div class="inv-item-total">${it.totalValue.toFixed(2)} SFL</div>
        <div class="inv-item-unit">${it.unitPrice < 0.001 ? it.unitPrice.toFixed(5) : it.unitPrice.toFixed(3)}/sp</div>
      </div>
    `;
    invListContainer.appendChild(row);
  });
}

// =============================================================
// TAB 6: PROFIT CALCULATOR RENDERER
// =============================================================
function renderProfitView() {
  if (!profitCardsContainer) return;

  const farmData = currentFullFarmData || savedGameRadarData;
  const prices = liveMarketPrices?.prices || {};
  const bestRateVal = calculateBestCropRates(prices, isGreenThumbActive)?.bestRate?.rate || 1200;

  const resources = calculateResourceProfits(farmData?.farm || farmData, prices, bestRateVal);

  profitCardsContainer.innerHTML = "";
  resources.forEach(res => {
    const card = document.createElement("div");
    card.className = "profit-card";
    card.innerHTML = `
      <div class="p-card-header">
        <div class="p-res-title">
          <img src="${res.icon}" class="item-img" alt="${res.name}" onerror="this.src='img/sunflower.png'">
          <span>${res.name}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #94a3b8;">
          <img src="${res.toolIcon}" style="width: 14px; height: 14px; image-rendering: pixelated;" alt="Tool" onerror="this.src='img/tools/axe.png'">
          <span>${res.toolName}</span>
        </div>
      </div>
      <div class="p-breakdown">
        <div class="p-col">
          <span class="p-label">Chi Phí Dụng Cụ</span>
          <span class="p-val-cost">-${res.toolCostSfl.toFixed(4)} SFL</span>
        </div>
        <div class="p-col">
          <span class="p-label">Thu Hoạch Dự Kiến</span>
          <span class="p-val-rev">+${res.grossRevenue.toFixed(4)} SFL</span>
        </div>
        <div class="p-col">
          <span class="p-label">Lợi Nhuận Ròng</span>
          <span class="p-val-net" style="color: ${res.netProfit >= 0 ? '#10b981' : '#ef4444'};">
            ${res.netProfit >= 0 ? "+" : ""}${res.netProfit.toFixed(4)} SFL
          </span>
        </div>
      </div>
    `;
    profitCardsContainer.appendChild(card);
  });
}

// =============================================================
// TAB 7: FLOWERS BREEDING & GOALS RENDERER
// =============================================================
function getFlowerIcon(name) {
  if (!name) return "img/Flower.png";
  return `img/flowers/${name}.png`;
}

function getSeedIcon(seedName) {
  const sanitized = seedName.toLowerCase().replace(/ /g, "_");
  return `img/flowers/${sanitized}.webp`;
}

function renderFlowersView() {
  if (!flowersListContainer) return;

  // 1. Render Suggested Flower Delivery Goals
  if (flowerDeliveryGoals) {
    const orders = currentFullFarmData?.delivery?.orders || [];
    let deliveryFlowers = [];

    // Check if any active delivery orders require flowers
    orders.forEach(ord => {
      const items = ord.items || {};
      for (const [itemName, amount] of Object.entries(items)) {
        let isFlower = false;
        for (const sData of Object.values(FLOWER_RECIPES)) {
          if (sData.recipes && sData.recipes[itemName]) {
            isFlower = true;
            break;
          }
        }
        if (isFlower) {
          deliveryFlowers.push({
            name: itemName,
            amount: Number(amount) || 1,
            reward: ord.reward?.sfl || ord.reward?.coins || 0
          });
        }
      }
    });

    // If no active flower orders, use recommended strategic goals
    if (deliveryFlowers.length === 0) {
      deliveryFlowers = [
        { name: "Red Pansy", amount: 3, reward: 0.55 },
        { name: "Blue Cosmos", amount: 3, reward: 0.55 },
        { name: "Blue Balloon Flower", amount: 3, reward: 1.20 },
        { name: "Red Balloon Flower", amount: 3, reward: 1.20 },
        { name: "Purple Daffodil", amount: 3, reward: 1.20 }
      ];
    }

    flowerDeliveryGoals.innerHTML = "";
    deliveryFlowers.forEach(f => {
      const pill = document.createElement("div");
      pill.className = "flower-goal-pill";
      pill.innerHTML = `
        <img src="img/flowers/${f.name}.png" class="flower-pill-icon" alt="${f.name}" onerror="this.src='img/Flower.png'">
        <span>${f.name}</span>
        <span class="flower-pill-sub">${f.amount}× (~${f.reward} SFL)</span>
      `;
      flowerDeliveryGoals.appendChild(pill);
    });
  }

  // 2. Render Marketplace Flowers
  if (flowerMarketGoals) {
    const marketFlowers = [
      { name: "White Lotus", coins: 0.23 },
      { name: "White Carnation", coins: 0.78 },
      { name: "Blue Lavender", coins: 1.32 },
      { name: "Purple Lavender", coins: 1.85 }
    ];

    flowerMarketGoals.innerHTML = "";
    marketFlowers.forEach(f => {
      const p2pPrice = liveMarketPrices?.prices ? getItemPrice(liveMarketPrices.prices, f.name) : 0;
      const pill = document.createElement("div");
      pill.className = "flower-goal-pill";
      pill.innerHTML = `
        <img src="img/flowers/${f.name}.png" class="flower-pill-icon" alt="${f.name}" onerror="this.src='img/Flower.png'">
        <span>${f.name}</span>
        <span class="flower-pill-sub">${p2pPrice > 0 ? p2pPrice.toFixed(2) + ' SFL' : '· ' + f.coins + ' SFL'}</span>
      `;
      flowerMarketGoals.appendChild(pill);
    });
  }

  // 3. Render Seed Groups & Accordion Recipes
  flowersListContainer.innerHTML = "";

  for (const [seedName, seedData] of Object.entries(FLOWER_RECIPES)) {
    const panel = document.createElement("div");
    panel.className = "flowers-seed-panel";

    const titleEl = document.createElement("div");
    titleEl.className = "flowers-seed-title";
    titleEl.innerHTML = `
      <img src="${getSeedIcon(seedName)}" class="seed-icon-img" alt="${seedName}" onerror="this.src='img/flowers/sunpetal_seed.webp'">
      <span>${seedName}</span>
      <span class="seed-time-sub">(${seedData.grow_time} ngày)</span>
    `;
    panel.appendChild(titleEl);

    const accordion = document.createElement("div");
    accordion.className = "flowers-recipes-accordion";

    for (const [flowerName, recipe] of Object.entries(seedData.recipes)) {
      const safeId = `recipe-${flowerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const details = document.createElement("details");
      details.className = "flowers-recipe-item";
      details.id = safeId;

      // Calculate ingredient time for fastest ingredients
      const fastestIngs = recipe.fastest_ingredients || [];
      const fastestTime = recipe.ingredients
        .filter(ing => fastestIngs.includes(ing.name))
        .reduce((sum, ing) => sum + (ing.ingredient_time || 0), 0);

      // Best ingredients chips
      const bestChipsHtml = fastestIngs.map(ingName => {
        const ingObj = recipe.ingredients.find(i => i.name === ingName) || { name: ingName, is_flower: false };
        const iconSrc = ingObj.is_flower ? `img/flowers/${ingName}.png` : getItemIcon(ingName);
        return `
          <div class="best-ing-chip" data-jump="${ingObj.is_flower ? 'recipe-' + ingName.toLowerCase().replace(/[^a-z0-9]/g, '_') : ''}" title="${ingObj.is_flower ? 'Bấm để xem công thức hoa này' : ''}">
            <img src="${iconSrc}" class="best-ing-icon" alt="${ingName}" onerror="this.src='img/Flower.png'">
            <span>${ingName}</span>
          </div>
        `;
      }).join("");

      // All ingredients chips
      const allChipsHtml = recipe.ingredients.map(ing => {
        const iconSrc = ing.is_flower ? `img/flowers/${ing.name}.png` : getItemIcon(ing.name);
        const cls = ing.is_fastest ? "ing-chip-item fastest" : "ing-chip-item normal";
        return `
          <div class="${cls}">
            <img src="${iconSrc}" class="ing-chip-icon" alt="${ing.name}" onerror="this.src='img/Flower.png'">
            <span>${ing.name} – ${ing.ingredient_time}d</span>
          </div>
        `;
      }).join("");

      details.innerHTML = `
        <summary class="flowers-recipe-summary">
          <div class="recipe-flower-info">
            <img src="img/flowers/${flowerName}.png" class="recipe-flower-img" alt="${flowerName}" onerror="this.src='img/Flower.png'">
            <span class="recipe-flower-name">${flowerName}</span>
          </div>
          <span class="recipe-arrow-indicator">▼</span>
        </summary>
        <div class="flowers-recipe-body">
          <div class="flowers-best-box">
            <div class="best-box-header">
              <span class="best-box-badge">⭐ Công Thức Tối Ưu Nhất</span>
              <span class="best-time-pill">${recipe.best_time} ngày tổng cộng</span>
            </div>
            <div class="best-ingredients-row">
              <span style="font-size: 11px; font-weight: 700; color: #cbd5e1;">Dùng:</span>
              ${bestChipsHtml}
            </div>
            <div class="best-time-breakdown">
              <span>Hạt giống: <b>${seedData.grow_time}d</b></span>
              <span>· Nguyên liệu: <b>${fastestTime}d</b></span>
              <span>· Tổng cộng: <b style="color: #4ade80;">${recipe.best_time}d</b></span>
            </div>
          </div>

          <div>
            <div class="all-ingredients-label">Tất Cả Nguyên Liệu Có Thể Phối Giống:</div>
            <div class="all-ingredients-grid">
              ${allChipsHtml}
            </div>
          </div>
        </div>
      `;

      // Jump click listener for flower ingredients
      details.querySelectorAll(".best-ing-chip[data-jump]").forEach(chip => {
        const targetId = chip.dataset.jump;
        if (targetId) {
          chip.addEventListener("click", (e) => {
            e.stopPropagation();
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
              targetEl.open = true;
              targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
              targetEl.style.boxShadow = "0 0 12px #38bdf8";
              setTimeout(() => { targetEl.style.boxShadow = ""; }, 1500);
            }
          });
        }
      });

      accordion.appendChild(details);
    }

    panel.appendChild(accordion);
    flowersListContainer.appendChild(panel);
  }
}

// =============================================================
// TAB 8: POTION HOUSE SOLVER RENDERER
// =============================================================
function renderPotionView() {
  if (!potionSuggestSlots) return;

  const farmGame = currentFullFarmData?.farm?.potionHouse?.game || currentFullFarmData?.potionHouse?.game || null;
  const game = (isPotionDemoActive && demoPotionGame) ? demoPotionGame : farmGame;

  // If in demo mode, show "🧪 Thử lượt này" button
  if (btnPotionStepDemo) {
    btnPotionStepDemo.style.display = (isPotionDemoActive && demoPotionGame && demoPotionGame.status !== "finished") ? "block" : "none";
  }

  if (!game) {
    if (potionNpcText) {
      potionNpcText.textContent = "Chưa có ván Potion House nào đang diễn ra. Hãy mở Potion House trong Sunflower Land hoặc bấm \"🎲 Ván mới\" để thử nghiệm thuật toán!";
    }
    if (potionRoundText) {
      potionRoundText.textContent = "Lượt: 1 / 3";
      potionRoundText.style.color = "#93c5fd";
    }
    if (potionCandCount) potionCandCount.textContent = "2401";
    if (potionHistoryList) {
      potionHistoryList.innerHTML = `<div style="font-size: 11px; color: #94a3b8; font-style: italic; padding: 4px 0;">Chưa có lượt pha chế nào. Hãy chọn tổ hợp gợi ý bên dưới!</div>`;
    }
    if (potionSuggestSlots) {
      const defaultGuess = [0, 1, 2, 3];
      potionSuggestSlots.innerHTML = defaultGuess.map((pid, idx) => `
        <div class="suggest-item-card">
          <span class="suggest-bottle-pos">#${idx + 1}</span>
          <img src="${POTIONS[pid].iconUrl}" class="suggest-bottle-img" alt="${POTIONS[pid].name}">
          <span class="suggest-bottle-name">${POTIONS[pid].name}</span>
        </div>
      `).join("");
    }
    if (potionPossiblePanel) potionPossiblePanel.style.display = "none";
    return;
  }

  const attempts = game.attempts || [];
  const status = game.status || "in_progress";
  const result = solvePotionHouse(attempts, status);

  // 1. Update NPC Dialogue & Status Banner
  if (status === "finished") {
    const score = (game.reward || 0) * (game.multiplier || 1);
    if (potionNpcText) {
      potionNpcText.textContent = `🎉 Thí nghiệm Potion House đã hoàn thành xuất sắc! Bạn nhận được ${score > 0 ? score + ' điểm thưởng!' : 'kết quả tuyệt vời!'}`;
    }
    if (potionRoundText) {
      potionRoundText.textContent = "ĐÃ HOÀN THÀNH";
      potionRoundText.style.color = "#34d399";
    }
    if (potionCandCount) potionCandCount.textContent = "1 (Tìm thấy!)";
  } else {
    if (potionNpcText) potionNpcText.textContent = result.message;
    if (potionRoundText) {
      potionRoundText.textContent = `Lượt: ${result.round} / 3`;
      potionRoundText.style.color = "#93c5fd";
    }
    if (potionCandCount) potionCandCount.textContent = result.candidates.length;
  }

  // 2. Render Brewing History
  if (potionHistoryList) {
    if (attempts.length === 0) {
      potionHistoryList.innerHTML = `<div style="font-size: 11px; color: #94a3b8; font-style: italic; padding: 4px 0;">Chưa có lượt pha chế nào. Hãy dùng tổ hợp gợi ý bên dưới!</div>`;
    } else {
      potionHistoryList.innerHTML = "";
      attempts.forEach((attempt, turnIdx) => {
        const row = document.createElement("div");
        row.className = "attempt-row-item";

        const turnLabel = document.createElement("div");
        turnLabel.className = "attempt-row-turn";
        turnLabel.textContent = `Lượt ${turnIdx + 1}`;
        row.appendChild(turnLabel);

        const slotsRow = document.createElement("div");
        slotsRow.className = "potion-slots-row";

        attempt.forEach(slot => {
          const potionName = slot.potion || slot.name || "";
          const pId = POTION_NAME_TO_ID[potionName] ?? 0;
          const pObj = POTIONS[pId] || POTIONS[0];
          const st = slot.status || "incorrect";
          const stIcon = STATUS_ICONS[st] || STATUS_ICONS.incorrect;
          const stDesc = STATUS_LABELS[st] || st;

          const box = document.createElement("div");
          box.className = "potion-slot-box";
          box.innerHTML = `
            <img src="${pObj.iconUrl}" class="potion-bottle-img" alt="${pObj.name}" title="${pObj.name}">
            <img src="${stIcon}" class="status-reaction-icon" alt="${st}" title="${stDesc}">
          `;
          slotsRow.appendChild(box);
        });

        row.appendChild(slotsRow);
        potionHistoryList.appendChild(row);
      });
    }
  }

  // 3. Render Suggested Combination
  if (potionSuggestSlots) {
    if (status === "finished" || !result.suggestedGuess) {
      potionSuggestSlots.innerHTML = `
        <div style="grid-column: span 4; text-align: center; padding: 12px; color: #34d399; font-weight: 700; font-size: 12px;">
          🎉 Thí nghiệm đã kết thúc. Hãy đợi tuần sau hoặc bấm "🎲 Ván mới" để luyện tập thêm!
        </div>
      `;
    } else {
      potionSuggestSlots.innerHTML = result.suggestedGuess.map((pid, idx) => `
        <div class="suggest-item-card">
          <span class="suggest-bottle-pos">#${idx + 1}</span>
          <img src="${POTIONS[pid].iconUrl}" class="suggest-bottle-img" alt="${POTIONS[pid].name}">
          <span class="suggest-bottle-name">${POTIONS[pid].name}</span>
        </div>
      `).join("");
    }
  }

  // 4. Render Possible Solutions when <= 10
  if (potionPossiblePanel && potionPossibleList) {
    if (result.candidates.length > 0 && result.candidates.length <= 10 && status !== "finished") {
      potionPossiblePanel.style.display = "block";
      potionPossibleList.innerHTML = result.candidates.map((cand, idx) => `
        <div class="candidate-item-row">
          <span class="candidate-rank">#${idx + 1}</span>
          <div class="candidate-bottles-row">
            ${cand.map(pid => `
              <img src="${POTIONS[pid].iconUrl}" class="cand-mini-bottle" alt="${POTIONS[pid].name}" title="${POTIONS[pid].name}">
            `).join("")}
          </div>
          <span style="font-size: 10px; color: #94a3b8; margin-left: 6px;">
            ${cand.map(pid => POTIONS[pid].name.split(" ")[0]).join(" + ")}
          </span>
        </div>
      `).join("");
    } else {
      potionPossiblePanel.style.display = "none";
    }
  }
}

// Potion Event Listeners
btnPotionDemoNew?.addEventListener("click", () => {
  isPotionDemoActive = true;
  demoPotionGame = createDemoGame();
  renderPotionView();
});

btnPotionReset?.addEventListener("click", () => {
  isPotionDemoActive = false;
  demoPotionGame = null;
  renderPotionView();
});

btnPotionStepDemo?.addEventListener("click", () => {
  if (isPotionDemoActive && demoPotionGame && demoPotionGame.status !== "finished") {
    const result = solvePotionHouse(demoPotionGame.attempts, demoPotionGame.status);
    const guess = result.suggestedGuess || [0, 1, 2, 3];
    playDemoTurn(demoPotionGame, guess);
    renderPotionView();
  }
});

// =============================================================
// EVENT LISTENERS FOR CONTROLS
// =============================================================
document.querySelectorAll(".tasks-filter-bar .filter-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".tasks-filter-bar .filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    currentTaskFilter = pill.dataset.taskFilter || "all";
    renderTasksView();
  });
});

document.querySelectorAll(".category-pills .cat-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".category-pills .cat-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    currentMarketCategory = pill.dataset.cat || "all";
    renderMarketView();
  });
});

marketSearchInput?.addEventListener("input", (e) => {
  marketSearchQuery = e.target.value;
  renderMarketView();
});

btnRefreshMarket?.addEventListener("click", () => {
  loadLiveMarketData(true);
});

btnToggleGreenThumb?.addEventListener("click", () => {
  isGreenThumbActive = !isGreenThumbActive;
  renderCoinRatesView();
});

btnToggleTax?.addEventListener("click", () => {
  isTaxActive = !isTaxActive;
  renderInventoryView();
});

invSearchInput?.addEventListener("input", (e) => {
  invSearchQuery = e.target.value;
  renderInventoryView();
});

// =============================================================
// =============================================================
// TAB 9: FOOD LIST (PETS) CONTROLLER - 3 PARALLEL COLUMNS
// =============================================================
let foodSelections = loadFoodSelections();
let foodSort = loadFoodSort();

function renderFoodCard(food, allItemsAcrossTiers) {
  const card = document.createElement("div");
  card.className = `food-card ${food.isSelected ? "" : "unselected"}`;

  // Recipe ingredient details
  const recipe = COOKING_RECIPES[food.name] || Object.entries(COOKING_RECIPES).find(([k]) => normalizeKey(k) === normalizeKey(food.name))?.[1];
  let recipeStr = "";
  if (recipe) {
    recipeStr = Object.entries(recipe).map(([ing, qty]) => `${qty}x ${ing}`).join(", ");
    card.title = `${food.name}\nCông thức: ${recipeStr}\nTổng chi phí: ${food.cost.toFixed(4)} SFL\nĐơn giá: ${food.costPerEnergy.toFixed(6)} SFL/⚡`;
  }

  // Top row
  const topRow = document.createElement("div");
  topRow.className = "food-card-top";

  const left = document.createElement("div");
  left.className = "food-card-left";

  const chk = document.createElement("div");
  chk.className = "food-checkbox";
  chk.textContent = food.isSelected ? "✓" : "";

  const img = document.createElement("img");
  img.className = "food-icon-img";
  img.src = food.image;
  img.alt = food.name;
  img.onerror = () => { img.src = "img/food/quick_juice.webp"; };

  const name = document.createElement("span");
  name.className = "food-item-name";
  name.textContent = food.name;

  left.appendChild(chk);
  left.appendChild(img);
  left.appendChild(name);

  const right = document.createElement("div");
  right.className = "food-total-cost";
  right.title = `Tổng chi phí nấu: ${food.cost.toFixed(4)} SFL${recipeStr ? ` (${recipeStr})` : ""}`;
  right.innerHTML = `${food.cost.toFixed(4)} <img src="img/Flower.png" class="cost-flower-icon" alt="SFL">`;

  topRow.appendChild(left);
  topRow.appendChild(right);

  // Bottom row
  const btmRow = document.createElement("div");
  btmRow.className = "food-card-bottom";

  const btmLeft = document.createElement("div");
  btmLeft.className = "food-bottom-left";

  const lbl = document.createElement("span");
  lbl.className = "food-cost-energy-lbl";
  lbl.textContent = "COST / ⚡";

  const btnSetMax = document.createElement("button");
  btnSetMax.className = "btn-set-max";
  btnSetMax.textContent = "SET MAX";
  btnSetMax.title = "Đặt ngưỡng này vào MAX COST và chọn tất cả món rẻ hơn hoặc bằng món này";

  btnSetMax.addEventListener("click", (e) => {
    e.stopPropagation();
    const targetVal = food.costPerEnergy;
    const maxCostInput = document.getElementById("foodMaxCostInput");
    if (maxCostInput) {
      maxCostInput.value = targetVal.toFixed(6);
    }
    saveMaxCostInput(targetVal.toFixed(6));

    // Select all items across all tiers where costPerEnergy <= targetVal
    allItemsAcrossTiers.forEach(item => {
      foodSelections[item.name] = (item.costPerEnergy <= targetVal + 1e-9);
    });
    saveFoodSelections(foodSelections);
    renderFoodListView();
  });

  btmLeft.appendChild(lbl);
  btmLeft.appendChild(btnSetMax);

  const btmRight = document.createElement("div");
  btmRight.className = "food-unit-cost";
  btmRight.title = `Chi phí trên mỗi đơn vị năng lượng: ${food.costPerEnergy.toFixed(6)} SFL/⚡`;
  btmRight.innerHTML = `${food.costPerEnergy.toFixed(6)} <img src="img/Flower.png" class="cost-flower-icon" alt="SFL">`;

  btmRow.appendChild(btmLeft);
  btmRow.appendChild(btmRight);

  // Toggle card selection
  topRow.addEventListener("click", () => {
    foodSelections[food.name] = !food.isSelected;
    saveFoodSelections(foodSelections);
    renderFoodListView();
  });

  card.appendChild(topRow);
  card.appendChild(btmRow);
  return card;
}

function renderFoodListView() {
  const priceMap = liveMarketPrices?.prices || DEFAULT_P2P_PRICES;
  const cookingCosts = computeAllCookingCosts(priceMap);

  foodSort = loadFoodSort();
  const sortSelect = document.getElementById("foodSortSelect");
  if (sortSelect && sortSelect.value !== foodSort) {
    sortSelect.value = foodSort;
  }

  const maxCostInput = document.getElementById("foodMaxCostInput");
  if (maxCostInput && !maxCostInput.value) {
    const saved = loadMaxCostInput();
    if (saved) maxCostInput.value = saved;
  }

  // Calculate lists for all 3 tiers with active sorting
  const easyList = getCalculatedFoodList("easy", priceMap, cookingCosts, foodSelections, foodSort);
  const medList = getCalculatedFoodList("medium", priceMap, cookingCosts, foodSelections, foodSort);
  const hardList = getCalculatedFoodList("hard", priceMap, cookingCosts, foodSelections, foodSort);

  const allItemsAcrossTiers = [...easyList, ...medList, ...hardList];

  // Update column counters
  const easySelected = easyList.filter(f => f.isSelected).length;
  const medSelected = medList.filter(f => f.isSelected).length;
  const hardSelected = hardList.filter(f => f.isSelected).length;

  const easyCountEl = document.getElementById("easyColCount");
  const medCountEl = document.getElementById("mediumColCount");
  const hardCountEl = document.getElementById("hardColCount");

  if (easyCountEl) easyCountEl.textContent = `(${easySelected}/${easyList.length})`;
  if (medCountEl) medCountEl.textContent = `(${medSelected}/${medList.length})`;
  if (hardCountEl) hardCountEl.textContent = `(${hardSelected}/${hardList.length})`;

  // Render cards in respective column containers
  const cEasy = document.getElementById("foodCardsEasy");
  const cMed = document.getElementById("foodCardsMedium");
  const cHard = document.getElementById("foodCardsHard");

  if (cEasy) {
    cEasy.innerHTML = "";
    easyList.forEach(food => cEasy.appendChild(renderFoodCard(food, allItemsAcrossTiers)));
  }
  if (cMed) {
    cMed.innerHTML = "";
    medList.forEach(food => cMed.appendChild(renderFoodCard(food, allItemsAcrossTiers)));
  }
  if (cHard) {
    cHard.innerHTML = "";
    hardList.forEach(food => cHard.appendChild(renderFoodCard(food, allItemsAcrossTiers)));
  }
}

function initFoodListControls() {
  // Select All / Deselect All for each column
  document.querySelectorAll(".food-col-actions .btn-select-all").forEach(btn => {
    btn.addEventListener("click", () => {
      const tier = btn.dataset.tier;
      if (tier && PET_FOOD_CATEGORIES[tier]) {
        PET_FOOD_CATEGORIES[tier].foods.forEach(name => {
          foodSelections[name] = true;
        });
        saveFoodSelections(foodSelections);
        renderFoodListView();
      }
    });
  });

  document.querySelectorAll(".food-col-actions .btn-deselect-all").forEach(btn => {
    btn.addEventListener("click", () => {
      const tier = btn.dataset.tier;
      if (tier && PET_FOOD_CATEGORIES[tier]) {
        PET_FOOD_CATEGORIES[tier].foods.forEach(name => {
          foodSelections[name] = false;
        });
        saveFoodSelections(foodSelections);
        renderFoodListView();
      }
    });
  });

  // Sort By select dropdown
  const sortSelect = document.getElementById("foodSortSelect");
  sortSelect?.addEventListener("change", (e) => {
    foodSort = e.target.value;
    saveFoodSort(foodSort);
    renderFoodListView();
  });

  // Auto fill button & Max Cost Input
  function applyAutoFill() {
    const maxCostInput = document.getElementById("foodMaxCostInput");
    if (!maxCostInput) return;
    const threshold = parseFloat(maxCostInput.value);
    if (isNaN(threshold) || threshold < 0) return;

    saveMaxCostInput(maxCostInput.value);

    const priceMap = liveMarketPrices?.prices || DEFAULT_P2P_PRICES;
    const cookingCosts = computeAllCookingCosts(priceMap);

    ["easy", "medium", "hard"].forEach(tier => {
      const list = getCalculatedFoodList(tier, priceMap, cookingCosts, foodSelections);
      list.forEach(item => {
        foodSelections[item.name] = (item.costPerEnergy <= threshold + 1e-9);
      });
    });

    saveFoodSelections(foodSelections);
    renderFoodListView();
  }

  document.getElementById("btnFoodAutoFill")?.addEventListener("click", applyAutoFill);
  document.getElementById("foodMaxCostInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      applyAutoFill();
    }
  });
}

// =============================================================
// TAB 10: MEMORY MINIGAME ASSISTANT (TRỢ LÝ LẬT THẺ)
// =============================================================
const MEMORY_CROPS_LIST = [
  "Sunflower", "Potato", "Pumpkin", "Carrot", "Cabbage", "Beetroot",
  "Cauliflower", "Parsnip", "Eggplant", "Corn", "Radish", "Wheat",
  "Kale", "Soybean", "Barley", "Rhubarb", "Zucchini", "Yam",
  "Broccoli", "Pepper", "Onion", "Turnip", "Artichoke", "Tomato",
  "Apple", "Orange", "Blueberry", "Banana"
];

const MEMORY_VN_MAP = {
  Sunflower: "Hướng Dương", Potato: "Khoai Tây", Pumpkin: "Bí Ngô",
  Carrot: "Cà Rốt", Cabbage: "Bắp Cải", Beetroot: "Củ Dền",
  Cauliflower: "Súp Lơ", Parsnip: "Củ Cải Trắng", Eggplant: "Cà Tím",
  Corn: "Bắp (Ngô)", Radish: "Củ Cải Đỏ", Wheat: "Lúa Mì",
  Kale: "Cải Xoăn", Soybean: "Đậu Nành", Barley: "Lúa Mạch",
  Rhubarb: "Đại Hoàng", Zucchini: "Bí Ngòi", Yam: "Khoai Mỡ",
  Broccoli: "Bông Cải Xanh", Pepper: "Ớt Chuông", Onion: "Củ Hành",
  Turnip: "Củ Cải Tròn", Artichoke: "Atisô", Tomato: "Cà Chua",
  Apple: "Táo", Orange: "Cam", Blueberry: "Việt Quất", Banana: "Chuối",
  Olive: "Quả Oliu", Grape: "Nho", Rice: "Lúa Gạo"
};

const MEM_PAIR_COLORS = [
  "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6", "#ec4899",
  "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#84cc16",
  "#a855f7", "#eab308", "#6366f1", "#d946ef", "#0284c7"
];

let liveMemoryData = {
  active: false,
  board: [],
  revealed: [],
  solved: [],
  readyPairs: [],
  score: 0,
  movesLeft: 0
};

let practiceGameState = null;

function idxToMemCoord(idx) {
  const cols = ["A", "B", "C", "D", "E", "F"];
  const r = Math.floor(idx / 6) + 1;
  const c = cols[idx % 6] || "?";
  return `${c}${r}`;
}

function resolveMemCropImage(name) {
  if (!name) return "img/sunflower.png";
  if (typeof resolveItemImage === "function") {
    return resolveItemImage(name);
  }
  return `img/delivery/${name}.png`;
}

function handleIncomingMemoryData(payload) {
  if (!payload || typeof payload !== "object") return;
  liveMemoryData = {
    active: !!payload.active,
    board: Array.isArray(payload.board) ? payload.board : [],
    revealed: Array.isArray(payload.revealed) ? payload.revealed : [],
    solved: Array.isArray(payload.solved) ? payload.solved : [],
    readyPairs: Array.isArray(payload.readyPairs) ? payload.readyPairs : [],
    score: payload.score || 0,
    movesLeft: payload.movesLeft || 0
  };

  if (!practiceGameState) {
    renderMemoryView();
  }
}

function startMemoryPractice() {
  const shuffledCrops = [...MEMORY_CROPS_LIST].sort(() => 0.5 - Math.random());
  const selectedCrops = shuffledCrops.slice(0, 15);
  const deck = [...selectedCrops, ...selectedCrops].sort(() => 0.5 - Math.random());

  practiceGameState = {
    board: deck,
    revealed: new Set(),
    solved: new Set(),
    flippedCur: [],
    moves: 0,
    isProcessing: false
  };

  renderMemoryView();
}

function handlePracticeCardClick(idx) {
  if (!practiceGameState || practiceGameState.isProcessing) return;
  if (practiceGameState.solved.has(idx)) return;
  if (practiceGameState.flippedCur.includes(idx)) return;

  practiceGameState.revealed.add(idx);
  practiceGameState.flippedCur.push(idx);
  renderMemoryView();

  if (practiceGameState.flippedCur.length === 2) {
    practiceGameState.moves++;
    practiceGameState.isProcessing = true;
    const [c1, c2] = practiceGameState.flippedCur;
    const isMatch = practiceGameState.board[c1] === practiceGameState.board[c2];

    if (isMatch) {
      practiceGameState.solved.add(c1);
      practiceGameState.solved.add(c2);
      practiceGameState.flippedCur = [];
      practiceGameState.isProcessing = false;
      renderMemoryView();

      if (practiceGameState.solved.size === 30) {
        setTimeout(() => {
          alert(`🎉 Chúc mừng! Bạn đã hoàn thành xuất sắc ván luyện tập Lật Thẻ trong ${practiceGameState.moves} lượt đi!`);
        }, 300);
      }
    } else {
      setTimeout(() => {
        practiceGameState.flippedCur = [];
        practiceGameState.isProcessing = false;
        renderMemoryView();
      }, 700);
    }
  }
}

function renderMemoryView() {
  const statusDot = document.getElementById("memoryStatusDot");
  const statusTitle = document.getElementById("memoryStatusTitle");
  const statusSub = document.getElementById("memoryStatusSub");
  const btnPractice = document.getElementById("btnMemoryPractice");
  const boardHint = document.getElementById("memBoardHint");

  const statRevealed = document.getElementById("memStatRevealed");
  const statSolved = document.getElementById("memStatSolved");
  const statReady = document.getElementById("memStatReady");
  const statMoves = document.getElementById("memStatMoves");

  const readyBanner = document.getElementById("memoryReadyBanner");
  const readyList = document.getElementById("readyPairsList");
  const gridEl = document.getElementById("memoryGrid");

  if (!gridEl) return;

  const isPractice = !!practiceGameState;
  let board = isPractice ? practiceGameState.board : liveMemoryData.board;
  let revealedSet = isPractice ? practiceGameState.revealed : new Set(liveMemoryData.revealed);
  let solvedSet = isPractice ? practiceGameState.solved : new Set(liveMemoryData.solved);
  let movesVal = isPractice ? practiceGameState.moves : (liveMemoryData.movesLeft || "--");
  let scoreVal = isPractice ? (practiceGameState.solved.size / 2 * 10) : liveMemoryData.score;

  if (isPractice) {
    statusDot.className = "memory-status-dot dot-practice";
    statusTitle.textContent = "Chế độ Luyện Tập (Simulator)";
    statusSub.textContent = "Bạn đang chơi ván tập luyện trực tiếp trên tiện ích";
    btnPractice.classList.add("btn-practice-active");
    btnPractice.innerHTML = "<span>🎮</span> Thoát Luyện Tập";
    if (boardHint) boardHint.textContent = "Click vào thẻ bất kỳ để lật thẻ";
  } else if (liveMemoryData.active && board.length === 30) {
    statusDot.className = "memory-status-dot dot-active";
    statusTitle.textContent = `Đang kết nối Minigame Memory (Điểm: ${scoreVal})`;
    statusSub.textContent = "Công cụ đang tự động ghi nhớ toàn bộ thẻ bạn đã lật";
    btnPractice.classList.remove("btn-practice-active");
    btnPractice.innerHTML = "<span>🎮</span> Luyện Tập";
    if (boardHint) boardHint.textContent = "Thẻ sẽ tự cập nhật khi bạn lật trong game";
  } else {
    statusDot.className = "memory-status-dot dot-inactive";
    statusTitle.textContent = "Chờ mở Minigame Memory";
    statusSub.textContent = "Mở minigame 'Memory' trong Sunflower Land để tự động kết nối";
    btnPractice.classList.remove("btn-practice-active");
    btnPractice.innerHTML = "<span>🎮</span> Luyện Tập";
    if (boardHint) boardHint.textContent = "Mở game hoặc bấm 'Luyện Tập' để chơi thử";
  }

  const nameToIndices = new Map();
  if (board && board.length === 30) {
    board.forEach((cropName, idx) => {
      if (!nameToIndices.has(cropName)) nameToIndices.set(cropName, []);
      nameToIndices.get(cropName).push(idx);
    });
  }

  const readyPairs = [];
  const pairColorMap = new Map();
  const pairNumMap = new Map();
  let pairCounter = 1;

  for (const [cropName, indices] of nameToIndices.entries()) {
    if (indices.length >= 2) {
      const [i1, i2] = indices;
      const bothRevealed = revealedSet.has(i1) && revealedSet.has(i2);
      const neitherSolved = !solvedSet.has(i1) && !solvedSet.has(i2);
      if (bothRevealed && neitherSolved) {
        const color = MEM_PAIR_COLORS[(pairCounter - 1) % MEM_PAIR_COLORS.length];
        pairColorMap.set(i1, color);
        pairColorMap.set(i2, color);
        pairNumMap.set(i1, pairCounter);
        pairNumMap.set(i2, pairCounter);

        readyPairs.push({
          cropName,
          vnName: MEMORY_VN_MAP[cropName] || cropName,
          idx1: i1,
          idx2: i2,
          coord1: idxToMemCoord(i1),
          coord2: idxToMemCoord(i2),
          color,
          num: pairCounter
        });
        pairCounter++;
      }
    }
  }

  const revealedCount = Math.min(30, revealedSet.size);
  const solvedPairsCount = Math.floor(solvedSet.size / 2);

  if (statRevealed) statRevealed.textContent = `${revealedCount} / 30`;
  if (statSolved) statSolved.textContent = `${solvedPairsCount} / 15 đôi`;
  if (statReady) statReady.textContent = `${readyPairs.length} cặp`;
  if (statMoves) statMoves.textContent = isPractice ? `${movesVal} lượt` : `${movesVal}`;

  if (readyBanner && readyList) {
    if (readyPairs.length > 0) {
      readyBanner.style.display = "flex";
      readyList.innerHTML = readyPairs.map(p => `
        <div class="ready-pair-tag" style="border-color: ${p.color};" data-idx1="${p.idx1}" data-idx2="${p.idx2}">
          <img src="${resolveMemCropImage(p.cropName)}" alt="${p.cropName}" onerror="this.style.display='none'">
          <span>#${p.num} ${p.vnName}</span>
          <span class="ready-pair-coords">(${p.coord1} & ${p.coord2})</span>
        </div>
      `).join("");

      readyList.querySelectorAll(".ready-pair-tag").forEach(tag => {
        tag.addEventListener("click", () => {
          const idx1 = parseInt(tag.dataset.idx1, 10);
          const idx2 = parseInt(tag.dataset.idx2, 10);
          [idx1, idx2].forEach(i => {
            const cardEl = gridEl.querySelector(`[data-idx="${i}"]`);
            if (cardEl) {
              cardEl.style.transform = "scale(1.15)";
              setTimeout(() => { cardEl.style.transform = ""; }, 400);
            }
          });
        });
      });
    } else {
      readyBanner.style.display = "none";
    }
  }

  gridEl.innerHTML = "";
  for (let i = 0; i < 30; i++) {
    const cardEl = document.createElement("div");
    cardEl.className = "mem-card";
    cardEl.dataset.idx = i;
    const coord = idxToMemCoord(i);

    const hasBoard = board && board.length === 30;
    const cropName = hasBoard ? board[i] : null;
    const vnName = cropName ? (MEMORY_VN_MAP[cropName] || cropName) : "";
    const isSolved = solvedSet.has(i);
    const isRevealed = revealedSet.has(i) && hasBoard;
    const isCurFlipped = isPractice && practiceGameState.flippedCur.includes(i);
    const pairColor = pairColorMap.get(i);
    const pairNum = pairNumMap.get(i);

    if (isSolved) {
      cardEl.classList.add("solved");
    } else if (pairColor) {
      cardEl.classList.add("pair-ready");
      cardEl.style.borderColor = pairColor;
      cardEl.style.color = pairColor;
    }

    let badgeHtml = "";
    if (pairNum && !isSolved) {
      badgeHtml = `<span class="mem-card-pair-badge" style="color:${pairColor}; border:1px solid ${pairColor};">#${pairNum}</span>`;
    }

    if (isSolved || isRevealed || isCurFlipped) {
      cardEl.classList.add("revealed");
      cardEl.title = `${coord}: ${vnName}`;
      cardEl.innerHTML = `
        <span class="mem-card-coord">${coord}</span>
        ${badgeHtml}
        <img class="mem-card-img" src="${resolveMemCropImage(cropName)}" alt="${cropName}" onerror="this.src='img/sunflower.png'">
        <span class="mem-card-title" style="${pairColor ? `color:${pairColor};font-weight:bold;` : ''}">${vnName}</span>
      `;
    } else {
      cardEl.classList.add("unseen");
      cardEl.title = `${coord}: Chưa lật`;
      cardEl.innerHTML = `
        <span class="mem-card-coord">${coord}</span>
        <span class="mem-card-symbol">?</span>
      `;
    }

    if (isPractice) {
      cardEl.addEventListener("click", () => handlePracticeCardClick(i));
    }

    gridEl.appendChild(cardEl);
  }
}

function initMemoryAssistant() {
  document.getElementById("btnMemoryPractice")?.addEventListener("click", () => {
    if (practiceGameState) {
      practiceGameState = null;
    } else {
      startMemoryPractice();
    }
    renderMemoryView();
  });

  document.getElementById("btnMemoryReset")?.addEventListener("click", () => {
    if (practiceGameState) {
      startMemoryPractice();
    } else {
      liveMemoryData.revealed = [];
      renderMemoryView();
    }
  });

  renderMemoryView();
}

// =============================================================
// TAB 11: CHAAC'S TEMPLE ASSISTANT (TRỢ LÝ ĐỀN CHAAC - SIMON SAYS)
// =============================================================
const CHAAC_STONES = [
  { id: 0, key: "core", name: "Trọng Tâm", shortName: "Tâm", color: "#f8fafc", bg: "rgba(255,255,255,0.18)", border: "#e2e8f0", icon: "⚪", pos: "center" },
  { id: 1, key: "midyellow", name: "Vàng Giữa (Tây Bắc)", shortName: "Vàng Giữa", color: "#facc15", bg: "rgba(250,204,21,0.2)", border: "#facc15", icon: "🟡", pos: "top-left" },
  { id: 2, key: "midgreen", name: "Lục Giữa (Đông Nam)", shortName: "Lục Giữa", color: "#4ade80", bg: "rgba(74,222,128,0.2)", border: "#4ade80", icon: "🟢", pos: "bottom-right" },
  { id: 3, key: "midblue", name: "Lam Giữa (Đông Bắc)", shortName: "Lam Giữa", color: "#38bdf8", bg: "rgba(56,189,248,0.2)", border: "#38bdf8", icon: "🔵", pos: "top-right" },
  { id: 4, key: "midred", name: "Đỏ Giữa (Tây Nam)", shortName: "Đỏ Giữa", color: "#f87171", bg: "rgba(248,113,113,0.2)", border: "#f87171", icon: "🔴", pos: "bottom-left" },
  { id: 5, key: "topyellow", name: "Vàng Đáy (Nam)", shortName: "Vàng Đáy", color: "#eab308", bg: "rgba(234,179,8,0.2)", border: "#eab308", icon: "🟡", pos: "bottom" },
  { id: 6, key: "topgreen", name: "Lục Đỉnh (Bắc)", shortName: "Lục Đỉnh", color: "#22c55e", bg: "rgba(34,197,94,0.2)", border: "#22c55e", icon: "🟢", pos: "top" },
  { id: 7, key: "topblue", name: "Lam Trái (Tây)", shortName: "Lam Trái", color: "#0284c7", bg: "rgba(2,132,199,0.2)", border: "#0284c7", icon: "🔵", pos: "left" },
  { id: 8, key: "topred", name: "Đỏ Phải (Đông)", shortName: "Đỏ Phải", color: "#ef4444", bg: "rgba(239,68,68,0.2)", border: "#ef4444", icon: "🔴", pos: "right" }
];

let liveChaacData = {
  active: false,
  score: 0,
  targetScore: 5,
  lives: 3,
  currLength: 3,
  isLocked: false,
  fullSequence: [],
  remainingSequence: [],
  completedSteps: 0,
  nextPiece: null
};

let isChaacPracticeMode = false;
let chaacPracticeState = null;
let chaacBlinkTimeout = null;

function handleIncomingChaacData(payload) {
  if (!payload || typeof payload !== "object") return;
  liveChaacData = {
    ...liveChaacData,
    ...payload,
    active: true
  };
  if (activeTab === "chaac" && !isChaacPracticeMode) {
    renderChaacView();
  }
}

function flashStoneElement(stoneIdx, duration = 400) {
  const el = document.querySelector(`.c-stone-btn[data-id="${stoneIdx}"]`);
  if (!el) return;
  el.classList.add("flashing");
  setTimeout(() => {
    el.classList.remove("flashing");
  }, duration);
}

function startChaacPractice() {
  if (chaacBlinkTimeout) {
    clearTimeout(chaacBlinkTimeout);
    chaacBlinkTimeout = null;
  }
  isChaacPracticeMode = true;
  const fullSeq = Array.from({ length: 100 }, () => Math.floor(Math.random() * 9));
  chaacPracticeState = {
    round: 1,
    targetScore: 5,
    lives: 3,
    seqLength: 3,
    fullSeq: fullSeq,
    currentSeq: fullSeq.slice(0, 3),
    isBlinking: true,
    userTurn: false,
    gameOver: false,
    gameWon: false
  };
  renderChaacView();
  playChaacBlinkSequence();
}

function playChaacBlinkSequence() {
  if (!chaacPracticeState) return;
  chaacPracticeState.isBlinking = true;
  chaacPracticeState.userTurn = false;
  renderChaacView();

  const roundSeq = chaacPracticeState.fullSeq.slice(0, chaacPracticeState.seqLength);
  chaacPracticeState.currentSeq = [...roundSeq];

  let step = 0;
  function blinkNext() {
    if (!chaacPracticeState || !isChaacPracticeMode) return;
    if (step >= roundSeq.length) {
      chaacPracticeState.isBlinking = false;
      chaacPracticeState.userTurn = true;
      renderChaacView();
      return;
    }
    const stoneIdx = roundSeq[step];
    flashStoneElement(stoneIdx, 450);
    step++;
    chaacBlinkTimeout = setTimeout(blinkNext, 750);
  }
  chaacBlinkTimeout = setTimeout(blinkNext, 600);
}

function handleChaacPracticeClick(stoneIdx) {
  if (!chaacPracticeState || !chaacPracticeState.userTurn || chaacPracticeState.isBlinking || chaacPracticeState.gameOver || chaacPracticeState.gameWon) {
    return;
  }

  flashStoneElement(stoneIdx, 250);

  const expectedIdx = chaacPracticeState.currentSeq[0];
  if (stoneIdx === expectedIdx) {
    // Correct!
    chaacPracticeState.currentSeq.shift();
    if (chaacPracticeState.currentSeq.length === 0) {
      // Completed round!
      if (chaacPracticeState.round >= chaacPracticeState.targetScore) {
        chaacPracticeState.gameWon = true;
        chaacPracticeState.userTurn = false;
        renderChaacView();
        return;
      }
      chaacPracticeState.round++;
      chaacPracticeState.seqLength++;
      chaacPracticeState.userTurn = false;
      renderChaacView();
      chaacBlinkTimeout = setTimeout(playChaacBlinkSequence, 1000);
    } else {
      renderChaacView();
    }
  } else {
    // Wrong! Lost a life!
    chaacPracticeState.lives--;
    if (chaacPracticeState.lives <= 0) {
      chaacPracticeState.gameOver = true;
      chaacPracticeState.userTurn = false;
      renderChaacView();
    } else {
      // Re-blink sequence after losing a life
      chaacPracticeState.userTurn = false;
      renderChaacView();
      chaacBlinkTimeout = setTimeout(playChaacBlinkSequence, 1200);
    }
  }
}

function renderChaacView() {
  const statusDot = document.getElementById("chaacStatusDot");
  const statusTitle = document.getElementById("chaacStatusTitle");
  const statusSub = document.getElementById("chaacStatusSub");
  const btnPractice = document.getElementById("btnChaacPractice");

  const statRound = document.getElementById("chaacStatRound");
  const statLength = document.getElementById("chaacStatLength");
  const statLives = document.getElementById("chaacStatLives");
  const statProgress = document.getElementById("chaacStatProgress");

  const nextBanner = document.getElementById("chaacNextBanner");
  const nextBadge = document.getElementById("chaacNextBadge");
  const nextDisplay = document.getElementById("chaacNextPieceDisplay");
  const seqTrack = document.getElementById("chaacSeqTrack");
  const seqHint = document.getElementById("chaacSeqHint");

  let isPractice = isChaacPracticeMode && chaacPracticeState !== null;

  let round = 1;
  let targetScore = 5;
  let lives = 3;
  let currLength = 3;
  let fullSequence = [];
  let currentSeq = [];
  let isLocked = false;
  let nextPiece = null;

  if (isPractice) {
    round = chaacPracticeState.round;
    targetScore = chaacPracticeState.targetScore;
    lives = chaacPracticeState.lives;
    currLength = chaacPracticeState.seqLength;
    fullSequence = chaacPracticeState.fullSeq.slice(0, currLength);
    currentSeq = chaacPracticeState.currentSeq;
    isLocked = chaacPracticeState.isBlinking || !chaacPracticeState.userTurn;
    const nextIdx = currentSeq.length > 0 ? currentSeq[0] : null;
    nextPiece = nextIdx !== null ? CHAAC_STONES[nextIdx] : null;

    if (btnPractice) {
      btnPractice.classList.add("active");
      btnPractice.innerHTML = "<span>🛑</span> Dừng Luyện";
    }

    if (statusDot) statusDot.className = "chaac-status-dot dot-practice";
    if (statusTitle) statusTitle.textContent = `Luyện Tập Đền Chaac (Vòng ${round}/${targetScore})`;
    if (statusSub) statusSub.textContent = "Chế độ mô phỏng tự do không tốn vé game";
  } else {
    round = (liveChaacData.score || 0) + 1;
    targetScore = liveChaacData.targetScore || 5;
    lives = liveChaacData.lives !== undefined ? liveChaacData.lives : 3;
    currLength = liveChaacData.currLength || 3;
    fullSequence = liveChaacData.fullSequence || [];
    currentSeq = liveChaacData.remainingSequence || [];
    isLocked = !!liveChaacData.isLocked;
    nextPiece = liveChaacData.nextPiece;

    if (btnPractice) {
      btnPractice.classList.remove("active");
      btnPractice.innerHTML = "<span>🎮</span> Luyện Tập";
    }

    if (liveChaacData.active) {
      if (statusDot) statusDot.className = "chaac-status-dot dot-active";
      if (statusTitle) statusTitle.textContent = `Đang kết nối Đền Chaac (Vòng ${round}/${targetScore})`;
      if (statusSub) statusSub.textContent = "Tự động nhận diện chuỗi đèn theo thời gian thực";
    } else {
      if (statusDot) statusDot.className = "chaac-status-dot dot-inactive";
      if (statusTitle) statusTitle.textContent = "Chờ mở Đền Chaac";
      if (statusSub) statusSub.textContent = "Mở minigame 'Chaac\\'s Temple' trong Sunflower Land để tự động kết nối";
    }
  }

  // Update Stats
  const completedSteps = currLength - currentSeq.length;
  if (statRound) statRound.textContent = `${round} / ${targetScore}`;
  if (statLength) statLength.textContent = `${currLength} bước`;
  if (statLives) statLives.textContent = "❤️".repeat(Math.max(0, lives)) || "💀";
  if (statProgress) statProgress.textContent = `${completedSteps} / ${currLength}`;

  // Next Move Display
  if (isPractice && chaacPracticeState?.gameOver) {
    if (nextBadge) nextBadge.textContent = "💀 HẾT MẠNG:";
    if (nextDisplay) {
      nextDisplay.innerHTML = `<span class="next-piece-icon">❌</span><span class="next-piece-name" style="color:#ef4444;">Ván đấu kết thúc! Bấm Đặt Lại để thử lại</span>`;
    }
  } else if (isPractice && chaacPracticeState?.gameWon) {
    if (nextBadge) nextBadge.textContent = "🏆 HOÀN THÀNH:";
    if (nextDisplay) {
      nextDisplay.innerHTML = `<span class="next-piece-icon">🎉</span><span class="next-piece-name" style="color:#2dd4bf;">Chúc mừng! Bạn đã thắng cả 5 vòng!</span>`;
    }
  } else if (isLocked || currentSeq.length === 0) {
    if (nextBadge) nextBadge.textContent = "⚡ QUAN SÁT:";
    if (nextDisplay) {
      nextDisplay.innerHTML = `<span class="next-piece-icon">✨</span><span class="next-piece-name" style="color:#facc15;">Đang chiếu sáng chuỗi đèn... Hãy ghi nhớ!</span>`;
    }
  } else if (nextPiece) {
    if (nextBadge) nextBadge.textContent = "👉 BƯỚC TIẾP THEO:";
    if (nextDisplay) {
      nextDisplay.innerHTML = `<span class="next-piece-icon">${nextPiece.icon}</span><span class="next-piece-name" style="color:${nextPiece.color};">${nextPiece.name.toUpperCase()}</span>`;
    }
  } else {
    if (nextBadge) nextBadge.textContent = "⚡ TRẠNG THÁI:";
    if (nextDisplay) {
      nextDisplay.innerHTML = `<span class="next-piece-icon">⏳</span><span class="next-piece-name">Chờ lượt chơi mới...</span>`;
    }
  }

  // Sequence Track
  if (seqTrack) {
    if (fullSequence.length === 0) {
      seqTrack.innerHTML = `<div class="chaac-empty-hint">Chưa có chuỗi nào được phát. Hãy bắt đầu ván trong game hoặc bấm Luyện Tập!</div>`;
    } else {
      let html = "";
      fullSequence.forEach((pIdx, sIdx) => {
        const p = CHAAC_STONES[pIdx] || { shortName: "??", icon: "❓" };
        let badgeClass = "c-seq-badge";
        let prefix = "";
        if (sIdx < completedSteps) {
          badgeClass += " done";
          prefix = "✓ ";
        } else if (sIdx === completedSteps) {
          badgeClass += " active";
          prefix = "▶ ";
        }
        html += `<div class="${badgeClass}"><span>${prefix}${sIdx + 1}.</span> <span>${p.icon}</span> <span>${p.shortName}</span></div>`;
      });
      seqTrack.innerHTML = html;
    }
  }

  if (seqHint) {
    seqHint.textContent = isPractice ? "Bấm vào các phiến đá bên dưới theo đúng thứ tự" : "Tự động phát hiện khi đèn sáng trong game";
  }

  // Highlight next stone on Mandala Grid
  const allStones = document.querySelectorAll("#chaacMandalaGrid .c-stone-btn");
  allStones.forEach(btn => {
    btn.classList.remove("target");
    const pId = parseInt(btn.dataset.id, 10);
    if (!isLocked && nextPiece && nextPiece.id === pId) {
      btn.classList.add("target");
    }
  });
}

function initChaacAssistant() {
  document.getElementById("btnChaacPractice")?.addEventListener("click", () => {
    if (isChaacPracticeMode) {
      isChaacPracticeMode = false;
      chaacPracticeState = null;
      if (chaacBlinkTimeout) {
        clearTimeout(chaacBlinkTimeout);
        chaacBlinkTimeout = null;
      }
    } else {
      startChaacPractice();
    }
    renderChaacView();
  });

  document.getElementById("btnChaacReset")?.addEventListener("click", () => {
    if (isChaacPracticeMode) {
      startChaacPractice();
    } else {
      liveChaacData = {
        active: false,
        score: 0,
        targetScore: 5,
        lives: 3,
        currLength: 3,
        isLocked: false,
        fullSequence: [],
        remainingSequence: [],
        completedSteps: 0,
        nextPiece: null
      };
      renderChaacView();
    }
  });

  // Stone click listeners for Practice Simulator
  document.querySelectorAll("#chaacMandalaGrid .c-stone-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const pId = parseInt(btn.dataset.id, 10);
      if (isChaacPracticeMode) {
        handleChaacPracticeClick(pId);
      }
    });
  });

  renderChaacView();
}

// Initial boot
renderInitialEmptyGrid();
initTabNavigation();
initFoodListControls();
initMemoryAssistant();
initChaacAssistant();
loadLiveMarketData();
loadSavedData();


