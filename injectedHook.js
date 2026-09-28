/*! SFL Treasure Radar Engine - Injected Hook v2.1.0 */
(() => {
  if (window.__SFL_HOOK_INITIALIZED__) return;
  window.__SFL_HOOK_INITIALIZED__ = true;
  console.log("[SFL Assistant] Injected hook running in context:", window.location.href);
  const topKeys = ["farmId", "linkedWallet", "nftId", "deviceTrackerId", "farmAddress", "startedAt"];
  const farmKeys = [
    "bumpkin.skills", "bumpkin.equipped", "collectibles", "buds", "aoe", "home.collectibles",
    "farmHands", "npcs", "calendar", "faction", "balance", "coins", "crimstones", "crops",
    "delivery", "potionHouse", "desert", "fruitPatches", "flowers", "gold", "inventory",
    "iron", "stones", "season", "trades.listings", "trees", "vip", "username"
  ];

  function extractSubset(source, keys) {
    if (!source || typeof source !== "object") return {};
    const result = {};
    for (const key of keys) {
      const parts = key.split(".");
      let cur = source;
      let target = result;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!cur || typeof cur !== "object" || !(p in cur)) break;
        if (i === parts.length - 1) {
          try {
            target[p] = JSON.parse(JSON.stringify(cur[p]));
          } catch (_) {
            target[p] = cur[p];
          }
        } else {
          target[p] = target[p] || {};
          target = target[p];
          cur = cur[p];
        }
      }
    }
    return result;
  }

  function postMsg(data) {
    try {
      window.postMessage(data, "*");
    } catch (_) {}
  }

  // 1. Hook Fetch
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const res = await origFetch.apply(this, args);
    try {
      const url = typeof args[0] === "string" ? args[0] : (args[0]?.url || "");
      
      if (url.includes("sunflower-land.com/session") || url.includes("/session")) {
        res.clone().json().then(data => {
          if (!data || typeof data !== "object") return;
          const farmData = data.farm || data.game;
          const payload = {
            ...extractSubset(data, topKeys),
            farm: farmData && typeof farmData === "object" ? extractSubset(farmData, farmKeys) : undefined
          };
          postMsg({ type: "SFL_SESSION_DATA", version: 1, payload });
        }).catch(() => {});
      }

      if (url.includes("sunflower-land.com/autosave") || url.includes("/autosave") || url.includes("autosave")) {
        res.clone().json().then(data => {
          if (!data || typeof data !== "object") return;
          const farmData = data.farm || data.game;
          const farmSubset = farmData && typeof farmData === "object" ? extractSubset(farmData, farmKeys) : undefined;
          postMsg({
            type: "SFL_AUTOSAVE_DATA",
            version: 1,
            payload: {
              farmId: data.farmId || data.id,
              farm: farmSubset
            }
          });
        }).catch(() => {});
      }

      if (url.includes("sunflower-land.com/event") || url.includes("/event") || url.includes("event")) {
        res.clone().json().then(data => {
          if (!data || typeof data !== "object") return;
          const stateData = data.gameState || data.game || data.farm;
          const farmSubset = stateData && typeof stateData === "object" ? extractSubset(stateData, farmKeys) : undefined;
          postMsg({
            type: "SFL_AUTOSAVE_DATA",
            version: 1,
            payload: {
              farm: farmSubset
            }
          });
        }).catch(() => {});
      }
    } catch (_) {}

    return res;
  };

  // 2. Hook XMLHttpRequest
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._reqUrl = typeof url === "string" ? url : "";
    return origOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    this.addEventListener("load", function() {
      try {
        const url = this._reqUrl || "";
        if (url.includes("session") || url.includes("autosave") || url.includes("event")) {
          let data = null;
          if (this.responseType === "" || this.responseType === "text") {
            const text = this.responseText;
            if (typeof text === "string" && (text.startsWith("{") || text.startsWith("["))) {
              data = JSON.parse(text);
            }
          } else if (this.responseType === "json") {
            data = this.response;
          }

          if (data && typeof data === "object") {
            if (url.includes("session")) {
              const farmData = data.farm || data.game;
              const payload = {
                ...extractSubset(data, topKeys),
                farm: farmData && typeof farmData === "object" ? extractSubset(farmData, farmKeys) : undefined
              };
              postMsg({ type: "SFL_SESSION_DATA", version: 1, payload });
            } else {
              const farmData = data.farm || data.game || data.gameState;
              const farmSubset = farmData && typeof farmData === "object" ? extractSubset(farmData, farmKeys) : undefined;
              postMsg({
                type: "SFL_AUTOSAVE_DATA",
                version: 1,
                payload: {
                  farmId: data.farmId || data.id,
                  farm: farmSubset
                }
              });
            }
          }
        }
      } catch (_) {}
    });

    return origSend.apply(this, [body]);
  };

  // -------------------------------------------------------------
  // 3. MEMORY MINIGAME TRACKER & FLOATING HUD (LẬT THẺ)
  // -------------------------------------------------------------
  const CROP_VN_NAMES = {
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

  const PAIR_COLORS = [
    "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6", "#ec4899",
    "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#84cc16",
    "#a855f7", "#eab308", "#6366f1", "#d946ef", "#0284c7"
  ];

  function isPhaserGame(obj) {
    if (!obj || typeof obj !== "object") return false;
    return !!(obj.scene && (obj.canvas || obj.renderer || obj.registry || obj.events || obj.scale || obj.loop || obj.textures));
  }

  // Hook Function.prototype.bind to intercept Phaser Game or TimeStep instance
  const origBind = Function.prototype.bind;
  Function.prototype.bind = function(thisArg, ...args) {
    if (thisArg && typeof thisArg === "object") {
      if (isPhaserGame(thisArg)) {
        window.__PHASER_GAME__ = thisArg;
      } else if (isPhaserGame(thisArg.game)) {
        window.__PHASER_GAME__ = thisArg.game;
      }
    }
    return origBind.apply(this, [thisArg, ...args]);
  };

  // Hook HTMLCanvasElement.prototype.getContext to mark Phaser canvas
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, ...args) {
    const ctx = origGetContext.apply(this, [type, ...args]);
    try {
      this.__sfl_game_canvas__ = true;
    } catch (_) {}
    return ctx;
  };

  function findGameInFiberTree(rootFiber, maxNodes = 600) {
    if (!rootFiber) return null;
    const queue = [rootFiber];
    const visited = new Set();
    let count = 0;

    while (queue.length > 0 && count < maxNodes) {
      const f = queue.shift();
      count++;
      if (!f || visited.has(f)) continue;
      visited.add(f);

      // 1. Check hooks linked list
      let hook = f.memoizedState;
      let hookCount = 0;
      while (hook && hookCount < 40) {
        const ms = hook.memoizedState;
        if (ms) {
          if (isPhaserGame(ms)) return ms;
          if (isPhaserGame(ms.current)) return ms.current;
          if (Array.isArray(ms)) {
            for (const item of ms) {
              if (isPhaserGame(item)) return item;
              if (item && isPhaserGame(item.current)) return item.current;
            }
          }
        }
        hook = hook.next;
        hookCount++;
      }

      // 2. Check props
      if (f.memoizedProps && typeof f.memoizedProps === "object") {
        if (isPhaserGame(f.memoizedProps.game)) return f.memoizedProps.game;
        for (const k in f.memoizedProps) {
          const val = f.memoizedProps[k];
          if (isPhaserGame(val)) return val;
          if (val && isPhaserGame(val.current)) return val.current;
        }
      }

      // 3. Check stateNode
      if (f.stateNode && typeof f.stateNode === "object") {
        if (isPhaserGame(f.stateNode)) return f.stateNode;
        if (isPhaserGame(f.stateNode.game)) return f.stateNode.game;
      }

      // Add adjacent nodes to queue
      if (f.child && !visited.has(f.child)) queue.push(f.child);
      if (f.sibling && !visited.has(f.sibling)) queue.push(f.sibling);
      if (f.return && !visited.has(f.return)) queue.push(f.return);
    }
    return null;
  }

  let loggedGameFound = false;

  function getPhaserGame() {
    if (window.__PHASER_GAME__ && isPhaserGame(window.__PHASER_GAME__)) return window.__PHASER_GAME__;

    // Direct globals
    if (isPhaserGame(window.game)) {
      window.__PHASER_GAME__ = window.game;
      return window.game;
    }
    if (window.Phaser && window.Phaser.GAMES && isPhaserGame(window.Phaser.GAMES[0])) {
      window.__PHASER_GAME__ = window.Phaser.GAMES[0];
      return window.__PHASER_GAME__;
    }

    // Check candidate DOM elements
    const candidates = [
      document.getElementById("game-content"),
      document.querySelector("canvas")?.parentElement,
      document.querySelector("canvas"),
      document.getElementById("root"),
      document.body?.firstElementChild,
      document.body
    ].filter(Boolean);

    for (const el of candidates) {
      const fiberKey = Object.keys(el).find(k => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
      if (fiberKey && el[fiberKey]) {
        const game = findGameInFiberTree(el[fiberKey]);
        if (game && isPhaserGame(game)) {
          window.__PHASER_GAME__ = game;
          if (!loggedGameFound) {
            loggedGameFound = true;
            console.log("[SFL Assistant] Phaser Game detected via Fiber:", game);
          }
          return game;
        }
      }
    }

    return null;
  }

  let loggedSceneFound = false;

  function getMemoryScene(game) {
    if (!game || !game.scene || !game.scene.scenes) return null;

    return game.scene.scenes.find(s => {
      if (!s) return false;
      if (s.gameBoard) {
        const gb = s.gameBoard;
        if (Array.isArray(gb.cards) || Array.isArray(gb._cards) || Array.isArray(gb.board)) {
          if (!loggedSceneFound) {
            loggedSceneFound = true;
            console.log("[SFL Assistant] MemoryScene detected via gameBoard:", s);
          }
          return true;
        }
        if (gb.totalMoves !== undefined || gb.flippedCards !== undefined) {
          if (!loggedSceneFound) {
            loggedSceneFound = true;
            console.log("[SFL Assistant] MemoryScene detected via gameBoard properties:", s);
          }
          return true;
        }
      }
      if (s.sceneId === "memory" || s.scene?.key === "memory" || (s.constructor && s.constructor.name === "MemoryScene")) {
        if (!loggedSceneFound) {
          loggedSceneFound = true;
          console.log("[SFL Assistant] MemoryScene detected via key/id:", s);
        }
        return true;
      }
      return false;
    });
  }

  let lastBoardSignature = "";
  let revealedCardsSet = new Set();
  let hudMinimized = false;
  let inGameHudEl = null;
  let lastMemoryHudSig = "";
  let lastMemoryPostedSig = "";

  function idxToCoord(idx, cols = 6) {
    const colLetters = ["A", "B", "C", "D", "E", "F"];
    const r = Math.floor(idx / cols) + 1;
    const c = colLetters[idx % cols] || (idx % cols + 1);
    return `${c}${r}`;
  }

  function ensureHudStyles() {
    if (document.getElementById("sfl-memory-hud-styles")) return;
    const style = document.createElement("style");
    style.id = "sfl-memory-hud-styles";
    style.textContent = `
      #sfl-memory-hud {
        position: fixed;
        bottom: 12px;
        right: 12px;
        width: 320px;
        background: rgba(15, 20, 34, 0.96);
        border: 2px solid #ffb800;
        border-radius: 12px;
        color: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 184, 0, 0.25);
        z-index: 9999999;
        overflow: hidden;
        user-select: none;
        contain: layout style paint;
        will-change: transform;
        transition: width 0.2s, height 0.2s;
      }
      #sfl-memory-hud.minimized {
        width: auto;
      }
      .sfl-mhud-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: linear-gradient(135deg, rgba(255, 184, 0, 0.2), rgba(30, 41, 59, 0.8));
        border-bottom: 1px solid rgba(255, 184, 0, 0.3);
        cursor: grab;
        touch-action: none;
      }
      .sfl-mhud-title {
        font-size: 13px;
        font-weight: 700;
        color: #fbbf24;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .sfl-mhud-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .sfl-mhud-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e2e8f0;
        border-radius: 6px;
        padding: 2px 7px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .sfl-mhud-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .sfl-mhud-btn.active {
        background: #f59e0b;
        color: #000;
        font-weight: bold;
        border-color: #fbbf24;
      }
      .sfl-mhud-body {
        padding: 8px 10px 10px;
      }
      .sfl-mhud-stats {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #94a3b8;
        margin-bottom: 6px;
        padding: 2px 4px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 6px;
      }
      .sfl-mhud-alert {
        background: rgba(16, 185, 129, 0.2);
        border: 1px solid #10b981;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        color: #6ee7b7;
        margin-bottom: 6px;
        font-weight: 600;
        text-align: center;
        animation: sflPulse 1.5s infinite;
      }
      @keyframes sflPulse {
        0%, 100% { opacity: 0.9; }
        50% { opacity: 0.5; }
      }
      .sfl-mhud-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 4px;
      }
      .sfl-mhud-card {
        aspect-ratio: 1;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        position: relative;
        cursor: default;
        transition: border-color 0.15s;
        box-sizing: border-box;
        overflow: hidden;
      }
      .sfl-mhud-card.solved {
        opacity: 0.25;
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.1);
      }
      .sfl-mhud-card.solved::after {
        content: "✓";
        position: absolute;
        font-size: 16px;
        color: #10b981;
        font-weight: bold;
      }
      .sfl-mhud-card.pair-ready {
        box-shadow: 0 0 8px currentColor;
        font-weight: bold;
      }
      .sfl-mhud-coord {
        position: absolute;
        top: 1px;
        left: 2px;
        font-size: 8px;
        color: #64748b;
      }
      .sfl-mhud-crop-name {
        font-size: 8.5px;
        text-align: center;
        line-height: 1;
        margin-top: 2px;
        max-width: 95%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sfl-mhud-icon {
        width: 18px;
        height: 18px;
        object-fit: contain;
      }
      .sfl-mhud-card.unseen {
        color: #475569;
        font-size: 13px;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }

  function renderInGameHud(board, revealedSet, solvedSet, readyPairs, gameBoard, scene) {
    if (!document.body) return;
    ensureHudStyles();

    if (!inGameHudEl) {
      inGameHudEl = document.createElement("div");
      inGameHudEl.id = "sfl-memory-hud";
      document.body.appendChild(inGameHudEl);

      // Make draggable across screen (mouse + touch)
      let isDragging = false, startX, startY, origX, origY;

      function dragStart(clientX, clientY) {
        isDragging = true;
        startX = clientX;
        startY = clientY;
        const rect = inGameHudEl.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;
        inGameHudEl.style.bottom = "auto";
        inGameHudEl.style.right = "auto";
        inGameHudEl.style.left = `${origX}px`;
        inGameHudEl.style.top = `${origY}px`;
      }

      function dragMove(clientX, clientY) {
        if (!isDragging) return;
        const dx = clientX - startX;
        const dy = clientY - startY;
        inGameHudEl.style.left = `${Math.max(10, Math.min(window.innerWidth - inGameHudEl.offsetWidth - 10, origX + dx))}px`;
        inGameHudEl.style.top = `${Math.max(10, Math.min(window.innerHeight - inGameHudEl.offsetHeight - 10, origY + dy))}px`;
      }

      function dragEnd() { isDragging = false; }

      // Mouse events
      inGameHudEl.addEventListener("mousedown", (e) => {
        const header = e.target.closest(".sfl-mhud-header");
        if (!header || e.target.tagName === "BUTTON") return;
        dragStart(e.clientX, e.clientY);
        e.preventDefault();
      });
      window.addEventListener("mousemove", (e) => { dragMove(e.clientX, e.clientY); });
      window.addEventListener("mouseup", dragEnd);

      // Touch events for mobile
      inGameHudEl.addEventListener("touchstart", (e) => {
        const header = e.target.closest(".sfl-mhud-header");
        if (!header || e.target.tagName === "BUTTON") return;
        const touch = e.touches[0];
        dragStart(touch.clientX, touch.clientY);
        // Do not prevent default to allow native clicks
      }, { passive: true });
      window.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        dragMove(touch.clientX, touch.clientY);
        if (e.cancelable) e.preventDefault();
      }, { passive: false });
      window.addEventListener("touchend", dragEnd);
    }

    // Dirty check: only mutate DOM when state actually changed!
    const hudStateSig = `${board.join(",")}|${Array.from(revealedSet).sort((a, b) => a - b).join(",")}|${Array.from(solvedSet).sort((a, b) => a - b).join(",")}|${readyPairs.map(p => `${p.idx1}_${p.idx2}`).join(",")}|${hudMinimized}`;
    if (inGameHudEl && inGameHudEl.isConnected && hudStateSig === lastMemoryHudSig) {
      return;
    }
    lastMemoryHudSig = hudStateSig;

    if (hudMinimized) {
      inGameHudEl.className = "minimized";
      inGameHudEl.innerHTML = `
        <div class="sfl-mhud-header">
          <div class="sfl-mhud-title">🧠 Thẻ (${readyPairs.length} cặp sẵn sàng)</div>
          <button class="sfl-mhud-btn" id="sfl-mhud-toggle-min">Mở</button>
        </div>
      `;
      inGameHudEl.querySelector("#sfl-mhud-toggle-min")?.addEventListener("click", () => {
        hudMinimized = false;
        lastMemoryHudSig = "";
        renderInGameHud(board, revealedSet, solvedSet, readyPairs, gameBoard, scene);
      });
      return;
    }

    inGameHudEl.className = "";
    
    // Build ready map for styling cards with pair colors
    const pairColorMap = new Map();
    readyPairs.forEach((p, idx) => {
      const color = PAIR_COLORS[idx % PAIR_COLORS.length];
      pairColorMap.set(p.idx1, color);
      pairColorMap.set(p.idx2, color);
    });

    let alertHtml = "";
    if (readyPairs.length > 0) {
      const topP = readyPairs[0];
      alertHtml = `<div class="sfl-mhud-alert">🎯 Có cặp: ${topP.vnName} (${topP.coord1} & ${topP.coord2})</div>`;
    }

    let cardsHtml = "";
    for (let i = 0; i < board.length; i++) {
      const cropName = board[i];
      const vnName = CROP_VN_NAMES[cropName] || cropName;
      const coord = idxToCoord(i);
      const isSolved = solvedSet.has(i);
      const isRevealed = revealedSet.has(i);
      const pairColor = pairColorMap.get(i);

      let cardClass = "sfl-mhud-card";
      let cardStyle = "";
      let innerContent = "";

      if (isSolved) {
        cardClass += " solved";
      } else if (pairColor) {
        cardClass += " pair-ready";
        cardStyle = `border-color: ${pairColor}; color: ${pairColor};`;
      }

      if (isRevealed) {
        innerContent = `
          <span class="sfl-mhud-coord">${coord}</span>
          <img class="sfl-mhud-icon" src="https://sunflower-land.com/play/world/crops/${cropName.toLowerCase()}/crop.png" onerror="this.style.display='none'">
          <span class="sfl-mhud-crop-name" style="${pairColor ? `color:${pairColor};font-weight:bold;` : ''}">${vnName}</span>
        `;
      } else {
        cardClass += " unseen";
        innerContent = `<span class="sfl-mhud-coord">${coord}</span>?`;
      }

      cardsHtml += `<div class="${cardClass}" style="${cardStyle}" data-idx="${i}" title="${coord}: ${isRevealed ? vnName : 'Chưa lật'}">${innerContent}</div>`;
    }

    const solvedCount = Math.floor(solvedSet.size / 2);
    const revealedCount = revealedSet.size;

    inGameHudEl.innerHTML = `
      <div class="sfl-mhud-header">
        <div class="sfl-mhud-title">🧠 Trợ Lý Lật Thẻ</div>
        <div class="sfl-mhud-actions">
          <button class="sfl-mhud-btn" id="sfl-mhud-toggle-min">_</button>
        </div>
      </div>
      <div class="sfl-mhud-body">
        <div class="sfl-mhud-stats">
          <span>Đã lật: <b>${revealedCount}/30</b></span>
          <span>Đã giải: <b>${solvedCount}/15 đôi</b></span>
          <span>Cặp chờ: <b>${readyPairs.length}</b></span>
        </div>
        ${alertHtml}
        <div class="sfl-mhud-grid">
          ${cardsHtml}
        </div>
      </div>
    `;

    inGameHudEl.querySelector("#sfl-mhud-toggle-min")?.addEventListener("click", () => {
      hudMinimized = true;
      lastMemoryHudSig = "";
      renderInGameHud(board, revealedSet, solvedSet, readyPairs, gameBoard, scene);
    });
  }

  // Memory Game Loop (polls every 180ms)
  setInterval(() => {
    try {
      const game = getPhaserGame();
      if (!game) {
        if (inGameHudEl && inGameHudEl.style.display !== "none") inGameHudEl.style.display = "none";
        lastMemoryHudSig = "";
        return;
      }

      const scene = getMemoryScene(game);
      if (!scene || !scene.gameBoard) {
        if (inGameHudEl && inGameHudEl.style.display !== "none") inGameHudEl.style.display = "none";
        lastMemoryHudSig = "";
        return;
      }

      const gb = scene.gameBoard;

      // Cards array can be gb.cards or gb._cards (during setup/pregame)
      const cardsArr = (Array.isArray(gb.cards) && gb.cards.length > 0)
        ? gb.cards
        : (Array.isArray(gb._cards) && gb._cards.length > 0 ? gb._cards : []);

      // Extract board crops: from cardsArr or gb.board
      let boardArr = [];
      if (cardsArr.length > 0) {
        boardArr = cardsArr.map(c => {
          if (!c) return "";
          if (c.name) return c.name;
          const texKey = c.image?.texture?.key;
          if (texKey && texKey.startsWith("cardFront-")) return texKey.replace("cardFront-", "");
          return "";
        });
      } else if (Array.isArray(gb.board) && gb.board.length > 0) {
        boardArr = gb.board;
      }

      if (boardArr.length === 0) {
        if (inGameHudEl && inGameHudEl.style.display !== "none") inGameHudEl.style.display = "none";
        lastMemoryHudSig = "";
        return;
      }

      // Check for new game
      const sig = boardArr.join(",");
      if (sig !== lastBoardSignature) {
        lastBoardSignature = sig;
        revealedCardsSet.clear();
        lastMemoryHudSig = "";
        lastMemoryPostedSig = "";
      }

      // Update revealed cards from cardsArr
      cardsArr.forEach((card, idx) => {
        if (!card) return;
        if (card.isFlipped || (Array.isArray(gb.flippedCards) && gb.flippedCards.includes(card))) {
          revealedCardsSet.add(idx);
        }
      });

      // Update solved cards
      const solvedSet = new Set();
      if (Array.isArray(gb.solvedCards)) {
        gb.solvedCards.forEach(c => {
          const idx = cardsArr.indexOf(c);
          if (idx !== -1) {
            solvedSet.add(idx);
            revealedCardsSet.add(idx);
          }
        });
      }
      cardsArr.forEach((c, idx) => {
        if (!c) return;
        if (!c.image || !c.image.active || (c.image.anims && c.image.anims.isPlaying)) {
          solvedSet.add(idx);
          revealedCardsSet.add(idx);
        }
      });

      // Find ready-to-match pairs
      const nameToIndices = new Map();
      boardArr.forEach((name, idx) => {
        if (!name) return;
        if (!nameToIndices.has(name)) nameToIndices.set(name, []);
        nameToIndices.get(name).push(idx);
      });

      const readyPairs = [];
      for (const [name, indices] of nameToIndices.entries()) {
        if (indices.length >= 2) {
          const [i1, i2] = indices;
          const bothRevealed = revealedCardsSet.has(i1) && revealedCardsSet.has(i2);
          const neitherSolved = !solvedSet.has(i1) && !solvedSet.has(i2);
          if (bothRevealed && neitherSolved) {
            readyPairs.push({
              name,
              vnName: CROP_VN_NAMES[name] || name,
              idx1: i1,
              idx2: i2,
              coord1: idxToCoord(i1),
              coord2: idxToCoord(i2)
            });
          }
        }
      }

      // Render Floating HUD (dirty checking inside prevents redundant DOM thrashing)
      if (inGameHudEl && inGameHudEl.style.display !== "block") {
        inGameHudEl.style.display = "block";
      }
      renderInGameHud(boardArr, revealedCardsSet, solvedSet, readyPairs, gb, scene);

      // Remaining moves and score
      const movesLeft = (scene.health !== undefined && scene.health !== null)
        ? scene.health
        : (gb.totalMoves || 0);
      const score = (scene.score !== undefined && scene.score !== null)
        ? scene.score
        : 0;

      // Post update to extension Side Panel ONLY when data changes
      const currentDataSig = `${boardArr.join(",")}|${Array.from(revealedCardsSet).sort((a, b) => a - b).join(",")}|${Array.from(solvedSet).sort((a, b) => a - b).join(",")}|${readyPairs.map(p => `${p.idx1}_${p.idx2}`).join(",")}|${movesLeft}|${score}`;
      if (currentDataSig !== lastMemoryPostedSig) {
        lastMemoryPostedSig = currentDataSig;

        const payload = {
          active: true,
          board: boardArr,
          revealed: Array.from(revealedCardsSet),
          solved: Array.from(solvedSet),
          readyPairs,
          score,
          movesLeft
        };

        postMsg({ type: "SFL_MEMORY_DATA", payload });
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "SFL_MEMORY_DATA", payload }, "*");
          }
        } catch (_) {}
        try {
          if (window.top && window.top !== window && window.top !== window.parent) {
            window.top.postMessage({ type: "SFL_MEMORY_DATA", payload }, "*");
          }
        } catch (_) {}
      }
    } catch (_) {}
  }, 180);

  // -------------------------------------------------------------
  // 4. CHAAC'S TEMPLE TRACKER & FLOATING HUD (ĐỀN CHAAC - SIMON SAYS)
  // -------------------------------------------------------------
  const CHAAC_PIECES = [
    { id: 0, key: "core", name: "Trọng Tâm", shortName: "Tâm", color: "#f8fafc", bg: "rgba(255,255,255,0.18)", border: "#e2e8f0", icon: "⚪" },
    { id: 1, key: "midyellow", name: "Vàng Giữa (Tây Bắc)", shortName: "Vàng Giữa", color: "#facc15", bg: "rgba(250,204,21,0.2)", border: "#facc15", icon: "🟡" },
    { id: 2, key: "midgreen", name: "Lục Giữa (Đông Nam)", shortName: "Lục Giữa", color: "#4ade80", bg: "rgba(74,222,128,0.2)", border: "#4ade80", icon: "🟢" },
    { id: 3, key: "midblue", name: "Lam Giữa (Đông Bắc)", shortName: "Lam Giữa", color: "#38bdf8", bg: "rgba(56,189,248,0.2)", border: "#38bdf8", icon: "🔵" },
    { id: 4, key: "midred", name: "Đỏ Giữa (Tây Nam)", shortName: "Đỏ Giữa", color: "#f87171", bg: "rgba(248,113,113,0.2)", border: "#f87171", icon: "🔴" },
    { id: 5, key: "topyellow", name: "Vàng Đáy (Nam)", shortName: "Vàng Đáy", color: "#eab308", bg: "rgba(234,179,8,0.2)", border: "#eab308", icon: "🟡" },
    { id: 6, key: "topgreen", name: "Lục Đỉnh (Bắc)", shortName: "Lục Đỉnh", color: "#22c55e", bg: "rgba(34,197,94,0.2)", border: "#22c55e", icon: "🟢" },
    { id: 7, key: "topblue", name: "Lam Trái (Tây)", shortName: "Lam Trái", color: "#0284c7", bg: "rgba(2,132,199,0.2)", border: "#0284c7", icon: "🔵" },
    { id: 8, key: "topred", name: "Đỏ Phải (Đông)", shortName: "Đỏ Phải", color: "#ef4444", bg: "rgba(239,68,68,0.2)", border: "#ef4444", icon: "🔴" }
  ];

  function getChaacScene(game) {
    if (!game || !game.scene || !game.scene.scenes) return null;
    return game.scene.scenes.find(s => {
      if (!s || !s.gameBoard) return false;
      const gb = s.gameBoard;
      return Array.isArray(gb.pieces) && gb.pieces.length >= 9 && (gb.currLength !== undefined || gb.predefinedSequence !== undefined || s.sceneId === "chaacs-temple");
    });
  }

  let inGameChaacHudEl = null;
  let chaacHudMinimized = true;
  let lastChaacHudSig = "";
  let lastChaacPostedSig = "";
  let lastOverlayTargetSig = "";

  function ensureChaacHudStyles() {
    if (document.getElementById("sfl-chaac-hud-styles")) return;
    const style = document.createElement("style");
    style.id = "sfl-chaac-hud-styles";
    style.textContent = `
      #sfl-chaac-hud {
        position: fixed;
        top: 12px;
        left: 12px;
        width: 320px;
        background: rgba(13, 20, 28, 0.96);
        border: 2px solid #14b8a6;
        border-radius: 12px;
        color: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.75), 0 0 16px rgba(20, 184, 166, 0.35);
        z-index: 9999999;
        overflow: hidden;
        user-select: none;
        contain: layout style paint;
        will-change: transform;
        transition: width 0.2s, height 0.2s;
      }
      #sfl-chaac-hud.minimized {
        width: auto;
      }
      .sfl-chud-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: linear-gradient(135deg, rgba(20, 184, 166, 0.25), rgba(15, 23, 42, 0.85));
        border-bottom: 1px solid rgba(20, 184, 166, 0.35);
        cursor: grab;
        touch-action: none;
      }
      .sfl-chud-title {
        font-size: 13px;
        font-weight: 700;
        color: #2dd4bf;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .sfl-chud-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e2e8f0;
        border-radius: 6px;
        padding: 2px 7px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .sfl-chud-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .sfl-chud-body {
        padding: 8px 10px 10px;
      }
      .sfl-chud-stats {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #cbd5e1;
        margin-bottom: 6px;
        padding: 3px 6px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
      }
      .sfl-chud-alert {
        background: rgba(20, 184, 166, 0.15);
        border: 1px solid #14b8a6;
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 11.5px;
        color: #5eead4;
        margin-bottom: 6px;
        font-weight: 600;
        text-align: center;
      }
      .sfl-chud-alert.pulse {
        animation: sflChaacPulse 1.2s infinite;
        border-color: #facc15;
        color: #fef08a;
        background: rgba(234, 179, 8, 0.2);
      }
      @keyframes sflChaacPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.02); }
      }
      .sfl-chud-seq-track {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 8px;
        max-height: 80px;
        overflow-y: auto;
      }
      .sfl-chud-step {
        display: flex;
        align-items: center;
        gap: 3px;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        background: #1e293b;
        border: 1px solid #334155;
        color: #94a3b8;
      }
      .sfl-chud-step.done {
        opacity: 0.45;
        border-color: #10b981;
        color: #6ee7b7;
      }
      .sfl-chud-step.active {
        border-color: #facc15;
        background: rgba(250, 204, 21, 0.25);
        color: #fef08a;
        font-weight: 700;
        box-shadow: 0 0 8px rgba(250, 204, 21, 0.4);
        transform: scale(1.05);
      }
      .sfl-chud-mandala {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        padding: 4px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 8px;
      }
      .sfl-chud-row {
        display: flex;
        gap: 4px;
        justify-content: center;
      }
      .sfl-chud-piece {
        padding: 3px 6px;
        border-radius: 5px;
        font-size: 9px;
        display: flex;
        align-items: center;
        gap: 2px;
        background: #1e293b;
        border: 1px solid #334155;
        cursor: default;
        transition: border-color 0.15s;
      }
      .sfl-chud-piece.target {
        border-color: #facc15;
        box-shadow: 0 0 10px #facc15;
        animation: sflChaacPulse 1s infinite;
        font-weight: 800;
      }
      #sfl-chaac-target-overlay {
        position: fixed;
        pointer-events: none !important;
        z-index: 2147483647 !important;
        transform: translate(-50%, -50%);
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition: top 0.1s ease-out, left 0.1s ease-out;
        user-select: none;
        will-change: top, left;
      }
      .chaac-ring-outer {
        position: absolute;
        width: 66px;
        height: 66px;
        border: 3.5px solid #facc15;
        border-radius: 50%;
        box-shadow: 0 0 20px #facc15, inset 0 0 12px rgba(250, 204, 21, 0.45);
        animation: chaacRingPulse 1s infinite ease-in-out;
      }
      .chaac-ring-inner {
        position: absolute;
        width: 50px;
        height: 50px;
        border: 2.5px dashed #2dd4bf;
        border-radius: 50%;
        animation: chaacRingRotate 3.5s linear infinite;
      }
      .chaac-overlay-badge {
        position: absolute;
        top: -30px;
        white-space: nowrap;
        background: rgba(15, 23, 42, 0.94);
        border: 1.5px solid #facc15;
        color: #fef08a;
        font-size: 11px;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7), 0 0 10px rgba(250, 204, 21, 0.5);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        letter-spacing: 0.3px;
        animation: chaacBadgeBounce 1.1s infinite ease-in-out;
      }
      @keyframes chaacRingPulse {
        0%, 100% { transform: scale(0.95); opacity: 0.85; box-shadow: 0 0 10px #facc15; }
        50% { transform: scale(1.18); opacity: 1; box-shadow: 0 0 24px #facc15, 0 0 8px #2dd4bf; }
      }
      @keyframes chaacRingRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes chaacBadgeBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
    `;
    document.head.appendChild(style);
  }

  let inGameChaacTargetOverlayEl = null;
  let chaacOverlayEnabled = true;

  function findPieceGameObject(scene, gb, nextPieceIdx) {
    if (!gb) return null;
    const pData = CHAAC_PIECES[nextPieceIdx];

    // 1. Direct from gb.pieces
    if (Array.isArray(gb.pieces) && gb.pieces[nextPieceIdx]) {
      const p = gb.pieces[nextPieceIdx];
      const obj = p.sprite || p.image || p.stone || p.gameObject || p.glow || p;
      if (obj && (typeof obj.x === "number" || typeof obj.getBounds === "function" || typeof obj.getWorldTransformMatrix === "function")) {
        return { obj, parent: gb };
      }
    }

    // 2. From gb.sprites or scene.sprites or scene.pieces
    const listCandidates = [gb.sprites, gb.pieceSprites, scene.pieces, scene.stones, scene.children?.list];
    for (const list of listCandidates) {
      if (Array.isArray(list) && list[nextPieceIdx]) {
        const p = list[nextPieceIdx];
        const obj = p.sprite || p.image || p.stone || p;
        if (obj && (typeof obj.x === "number" || typeof obj.getBounds === "function" || typeof obj.getWorldTransformMatrix === "function")) {
          return { obj, parent: gb };
        }
      }
    }

    // 3. Search scene children by key / name if available
    if (pData && scene.children?.list) {
      const match = scene.children.list.find(c =>
        c.name === pData.key ||
        c.key === pData.key ||
        (c.texture && typeof c.texture.key === "string" && c.texture.key.toLowerCase().includes(pData.key.toLowerCase()))
      );
      if (match) return { obj: match, parent: scene };
    }

    return null;
  }

  function getPieceWorldCoords(scene, gb, nextPieceIdx) {
    const found = findPieceGameObject(scene, gb, nextPieceIdx);
    if (!found || !found.obj) return null;

    const obj = found.obj;

    // 1. Try getBounds() (Phaser's complete world-space bounding box)
    if (typeof obj.getBounds === "function") {
      try {
        const b = obj.getBounds();
        if (b && isFinite(b.centerX) && (b.centerX !== 0 || b.centerY !== 0)) {
          return { worldX: b.centerX, worldY: b.centerY };
        }
      } catch (_) {}
    }

    // 2. Try getWorldTransformMatrix() (Phaser's world matrix for GameObjects)
    if (typeof obj.getWorldTransformMatrix === "function") {
      try {
        const m = obj.getWorldTransformMatrix();
        if (m && isFinite(m.tx) && (m.tx !== 0 || m.ty !== 0)) {
          return { worldX: m.tx, worldY: m.ty };
        }
      } catch (_) {}
    }

    // 3. Traverse parentContainer hierarchy
    if (typeof obj.x === "number" && typeof obj.y === "number") {
      let wx = obj.x;
      let wy = obj.y;
      let p = obj.parentContainer;
      while (p) {
        wx += (p.x || 0);
        wy += (p.y || 0);
        p = p.parentContainer;
      }
      if (!obj.parentContainer && found.parent && typeof found.parent.x === "number" && typeof found.parent.y === "number") {
        wx += found.parent.x;
        wy += found.parent.y;
      }
      return { worldX: wx, worldY: wy };
    }

    return null;
  }

  function updateChaacTargetOverlay(scene, gb, nextPieceIdx, isLocked, curSeqLength) {
    ensureChaacHudStyles();
    if (!inGameChaacTargetOverlayEl) {
      inGameChaacTargetOverlayEl = document.createElement("div");
      inGameChaacTargetOverlayEl.id = "sfl-chaac-target-overlay";
      inGameChaacTargetOverlayEl.innerHTML = `
        <div class="chaac-ring-outer"></div>
        <div class="chaac-ring-inner"></div>
        <div class="chaac-overlay-badge" id="sfl-chaac-overlay-badge">BẤM VÀO ĐÂY</div>
      `;
      document.body.appendChild(inGameChaacTargetOverlayEl);
    }

    if (!chaacOverlayEnabled || isLocked || nextPieceIdx === null || curSeqLength === 0) {
      if (inGameChaacTargetOverlayEl.style.display !== "none") {
        inGameChaacTargetOverlayEl.style.display = "none";
      }
      lastOverlayTargetSig = "";
      return;
    }

    const coords = getPieceWorldCoords(scene, gb, nextPieceIdx);
    const game = scene?.game || getPhaserGame();
    const canvas = scene?.sys?.game?.canvas || scene?.game?.canvas || game?.canvas || document.querySelector("canvas");

    if (!coords || !scene || !canvas) {
      if (inGameChaacTargetOverlayEl.style.display !== "none") {
        inGameChaacTargetOverlayEl.style.display = "none";
      }
      lastOverlayTargetSig = "";
      return;
    }

    const camera = scene.cameras?.main;
    const scrollX = camera ? (camera.scrollX || 0) : 0;
    const scrollY = camera ? (camera.scrollY || 0) : 0;
    const relX = coords.worldX - scrollX;
    const relY = coords.worldY - scrollY;

    let cx = relX;
    let cy = relY;

    if (camera && camera.matrix && typeof camera.matrix.transformPoint === "function") {
      try {
        const pt = camera.matrix.transformPoint(relX, relY);
        if (pt && isFinite(pt.x) && isFinite(pt.y)) {
          cx = pt.x;
          cy = pt.y;
        }
      } catch (_) {}
    } else if (camera) {
      const originX = typeof camera.originX === "number" ? camera.originX : 0.5;
      const originY = typeof camera.originY === "number" ? camera.originY : 0.5;
      const camW = camera.width || canvas.width || 800;
      const camH = camera.height || canvas.height || 600;
      const zoom = camera.zoom || 1;
      const camX = camera.x || 0;
      const camY = camera.y || 0;
      const midX = camW * originX;
      const midY = camH * originY;
      cx = camX + midX + (relX - midX) * zoom;
      cy = camY + midY + (relY - midY) * zoom;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width ? (rect.width / canvas.width) : 1;
    const scaleY = canvas.height ? (rect.height / canvas.height) : 1;

    const screenX = rect.left + cx * scaleX;
    const screenY = rect.top + cy * scaleY;

    if (!isFinite(screenX) || !isFinite(screenY)) {
      if (inGameChaacTargetOverlayEl.style.display !== "none") {
        inGameChaacTargetOverlayEl.style.display = "none";
      }
      lastOverlayTargetSig = "";
      return;
    }

    const roundedX = Math.round(screenX);
    const roundedY = Math.round(screenY);
    const overlaySig = `${nextPieceIdx}|${roundedX}|${roundedY}|${chaacOverlayEnabled}`;
    if (overlaySig === lastOverlayTargetSig && inGameChaacTargetOverlayEl.style.display === "flex") {
      return;
    }
    lastOverlayTargetSig = overlaySig;

    const pData = CHAAC_PIECES[nextPieceIdx];
    const badgeEl = inGameChaacTargetOverlayEl.querySelector("#sfl-chaac-overlay-badge");
    const outerRing = inGameChaacTargetOverlayEl.querySelector(".chaac-ring-outer");

    if (badgeEl && pData) {
      badgeEl.textContent = `👉 BẤM: ${pData.icon} ${pData.shortName}`;
      badgeEl.style.borderColor = pData.color || "#facc15";
    }
    if (outerRing && pData) {
      outerRing.style.borderColor = pData.color || "#facc15";
      outerRing.style.boxShadow = `0 0 20px ${pData.color || "#facc15"}, inset 0 0 12px ${pData.color || "#facc15"}`;
    }

    inGameChaacTargetOverlayEl.style.display = "flex";
    inGameChaacTargetOverlayEl.style.left = `${roundedX}px`;
    inGameChaacTargetOverlayEl.style.top = `${roundedY}px`;
  }

  function renderInGameChaacHud(scene, gb) {
    ensureChaacHudStyles();

    if (!inGameChaacHudEl) {
      inGameChaacHudEl = document.createElement("div");
      inGameChaacHudEl.id = "sfl-chaac-hud";
      document.body.appendChild(inGameChaacHudEl);

      // Make draggable across screen (mouse + touch)
      let isDragging = false, startX, startY, origX, origY;

      function chaacDragStart(clientX, clientY) {
        isDragging = true;
        startX = clientX;
        startY = clientY;
        const rect = inGameChaacHudEl.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;
        inGameChaacHudEl.style.bottom = "auto";
        inGameChaacHudEl.style.left = `${origX}px`;
        inGameChaacHudEl.style.top = `${origY}px`;
      }

      function chaacDragMove(clientX, clientY) {
        if (!isDragging) return;
        const dx = clientX - startX;
        const dy = clientY - startY;
        inGameChaacHudEl.style.left = `${Math.max(10, Math.min(window.innerWidth - inGameChaacHudEl.offsetWidth - 10, origX + dx))}px`;
        inGameChaacHudEl.style.top = `${Math.max(10, Math.min(window.innerHeight - inGameChaacHudEl.offsetHeight - 10, origY + dy))}px`;
      }

      function chaacDragEnd() { isDragging = false; }

      // Mouse events
      inGameChaacHudEl.addEventListener("mousedown", (e) => {
        const header = e.target.closest(".sfl-chud-header");
        if (!header || e.target.tagName === "BUTTON") return;
        chaacDragStart(e.clientX, e.clientY);
        e.preventDefault();
      });
      window.addEventListener("mousemove", (e) => { chaacDragMove(e.clientX, e.clientY); });
      window.addEventListener("mouseup", chaacDragEnd);

      // Touch events for mobile
      inGameChaacHudEl.addEventListener("touchstart", (e) => {
        const header = e.target.closest(".sfl-chud-header");
        if (!header || e.target.tagName === "BUTTON") return;
        const touch = e.touches[0];
        chaacDragStart(touch.clientX, touch.clientY);
        // Do not prevent default here to allow click events on buttons if any
      }, { passive: true });
      window.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        chaacDragMove(touch.clientX, touch.clientY);
        if (e.cancelable) e.preventDefault();
      }, { passive: false });
      window.addEventListener("touchend", chaacDragEnd);
    }

    const lives = gb.lives !== undefined ? gb.lives : 3;
    const currLength = gb.currLength || 3;
    const targetScore = gb.targetScore || 5;
    const score = scene.score || 0;
    const isLocked = !!scene.locked;
    const predefinedSeq = Array.isArray(gb.predefinedSequence) ? gb.predefinedSequence : [];
    const fullRoundSeq = predefinedSeq.slice(0, currLength);
    const curSeq = Array.isArray(gb.currentSequence) ? gb.currentSequence : [];
    const completedSteps = currLength - curSeq.length;
    const nextPieceIdx = curSeq.length > 0 ? curSeq[0] : null;
    const nextPiece = nextPieceIdx !== null ? CHAAC_PIECES[nextPieceIdx] : null;

    const currentChaacSig = `${score}|${lives}|${currLength}|${targetScore}|${isLocked}|${fullRoundSeq.join(",")}|${curSeq.join(",")}|${nextPieceIdx}|${chaacHudMinimized}|${chaacOverlayEnabled}`;

    if (inGameChaacHudEl && inGameChaacHudEl.isConnected && currentChaacSig === lastChaacHudSig) {
      return;
    }
    lastChaacHudSig = currentChaacSig;

    if (chaacHudMinimized) {
      inGameChaacHudEl.className = "minimized";
      inGameChaacHudEl.innerHTML = `
        <div class="sfl-chud-header">
          <div class="sfl-chud-title">🏛️ Chaac: ${nextPiece ? `${nextPiece.icon} ${nextPiece.shortName}` : `Vòng ${score + 1}`}</div>
          <button class="sfl-chud-btn" id="sfl-chud-restore">□</button>
        </div>
      `;
      inGameChaacHudEl.querySelector("#sfl-chud-restore")?.addEventListener("click", () => {
        chaacHudMinimized = false;
        lastChaacHudSig = "";
        renderInGameChaacHud(scene, gb);
      });
      return;
    }

    inGameChaacHudEl.className = "";

    // Status Banner
    let alertHtml = "";
    if (isLocked || curSeq.length === 0) {
      alertHtml = `<div class="sfl-chud-alert">⚡ Đang chiếu sáng chuỗi... Hãy quan sát kỹ!</div>`;
    } else if (nextPiece) {
      alertHtml = `<div class="sfl-chud-alert pulse">👉 BƯỚC TIẾP THEO: <b>${nextPiece.icon} ${nextPiece.name.toUpperCase()}</b></div>`;
    } else {
      alertHtml = `<div class="sfl-chud-alert">Đã hoàn thành lượt bấm! Đang chuẩn bị...</div>`;
    }

    // Sequence track
    let seqHtml = `<div class="sfl-chud-seq-track">`;
    fullRoundSeq.forEach((pIdx, sIdx) => {
      const p = CHAAC_PIECES[pIdx] || { shortName: "??", icon: "❓" };
      let stepClass = "sfl-chud-step";
      let iconPrefix = "";
      if (sIdx < completedSteps) {
        stepClass += " done";
        iconPrefix = "✓ ";
      } else if (sIdx === completedSteps) {
        stepClass += " active";
        iconPrefix = "▶ ";
      }
      seqHtml += `<div class="${stepClass}"><span>${iconPrefix}${sIdx + 1}.</span> <span>${p.icon}</span> <span>${p.shortName}</span></div>`;
    });
    seqHtml += `</div>`;

    // 9-Piece Diamond layout
    const pMap = {};
    CHAAC_PIECES.forEach(p => { pMap[p.key] = p; });

    function renderPieceBtn(key) {
      const p = pMap[key];
      if (!p) return "";
      const isTarget = (!isLocked && nextPiece && nextPiece.key === key);
      const pieceClass = `sfl-chud-piece ${isTarget ? 'target' : ''}`;
      const style = `border-color:${isTarget ? '#facc15' : p.border}; color:${isTarget ? '#fef08a' : p.color}; background:${p.bg};`;
      return `<div class="${pieceClass}" style="${style}" data-pidx="${p.id}" title="${p.name}">${p.icon} ${p.shortName}</div>`;
    }

    const mandalaHtml = `
      <div class="sfl-chud-mandala">
        <div class="sfl-chud-row">${renderPieceBtn("topgreen")}</div>
        <div class="sfl-chud-row">${renderPieceBtn("midyellow")} ${renderPieceBtn("midblue")}</div>
        <div class="sfl-chud-row">${renderPieceBtn("topblue")} ${renderPieceBtn("core")} ${renderPieceBtn("topred")}</div>
        <div class="sfl-chud-row">${renderPieceBtn("midred")} ${renderPieceBtn("midgreen")}</div>
        <div class="sfl-chud-row">${renderPieceBtn("topyellow")}</div>
      </div>
    `;

    const hearts = "❤️".repeat(Math.max(0, lives)) || "💀";

    inGameChaacHudEl.innerHTML = `
      <div class="sfl-chud-header">
        <div class="sfl-chud-title">🏛️ Trợ Lý Đền Chaac</div>
        <div style="display:flex;align-items:center;gap:5px;">
          <button class="sfl-chud-btn ${chaacOverlayEnabled ? 'active' : ''}" id="sfl-chud-toggle-overlay" title="Bật/Tắt vòng sáng DOM chỉ vị trí phiến đá trên màn hình">
            👁️ Vòng Sáng: ${chaacOverlayEnabled ? 'BẬT' : 'TẮT'}
          </button>
          <button class="sfl-chud-btn" id="sfl-chud-min">_</button>
        </div>
      </div>
      <div class="sfl-chud-body">
        <div class="sfl-chud-stats">
          <span>Vòng: <b>${score + 1}/${targetScore}</b></span>
          <span>Chuỗi: <b>${completedSteps}/${currLength}</b></span>
          <span>Mạng: <b>${hearts}</b></span>
        </div>
        ${alertHtml}
        ${seqHtml}
        ${mandalaHtml}
      </div>
    `;

    inGameChaacHudEl.querySelector("#sfl-chud-min")?.addEventListener("click", () => {
      chaacHudMinimized = true;
      lastChaacHudSig = "";
      renderInGameChaacHud(scene, gb);
    });

    inGameChaacHudEl.querySelector("#sfl-chud-toggle-overlay")?.addEventListener("click", () => {
      chaacOverlayEnabled = !chaacOverlayEnabled;
      if (!chaacOverlayEnabled && inGameChaacTargetOverlayEl) {
        inGameChaacTargetOverlayEl.style.display = "none";
      }
      lastChaacHudSig = "";
      renderInGameChaacHud(scene, gb);
    });
  }

  // Chaac's Temple Loop (polls every 180ms)
  setInterval(() => {
    try {
      const game = getPhaserGame();
      if (!game) {
        if (inGameChaacHudEl && inGameChaacHudEl.style.display !== "none") inGameChaacHudEl.style.display = "none";
        if (inGameChaacTargetOverlayEl && inGameChaacTargetOverlayEl.style.display !== "none") inGameChaacTargetOverlayEl.style.display = "none";
        lastChaacHudSig = "";
        lastChaacPostedSig = "";
        lastOverlayTargetSig = "";
        return;
      }

      const scene = getChaacScene(game);
      if (!scene || !scene.gameBoard) {
        if (inGameChaacHudEl && inGameChaacHudEl.style.display !== "none") inGameChaacHudEl.style.display = "none";
        if (inGameChaacTargetOverlayEl && inGameChaacTargetOverlayEl.style.display !== "none") inGameChaacTargetOverlayEl.style.display = "none";
        lastChaacHudSig = "";
        lastChaacPostedSig = "";
        lastOverlayTargetSig = "";
        return;
      }

      const gb = scene.gameBoard;
      if (!Array.isArray(gb.pieces) || gb.pieces.length < 9) {
        if (inGameChaacHudEl && inGameChaacHudEl.style.display !== "none") inGameChaacHudEl.style.display = "none";
        if (inGameChaacTargetOverlayEl && inGameChaacTargetOverlayEl.style.display !== "none") inGameChaacTargetOverlayEl.style.display = "none";
        lastChaacHudSig = "";
        lastChaacPostedSig = "";
        lastOverlayTargetSig = "";
        return;
      }

      if (inGameChaacHudEl && inGameChaacHudEl.style.display !== "block") {
        inGameChaacHudEl.style.display = "block";
      }
      renderInGameChaacHud(scene, gb);

      const predefinedSeq = Array.isArray(gb.predefinedSequence) ? gb.predefinedSequence : [];
      const currLength = gb.currLength || 3;
      const curSeq = Array.isArray(gb.currentSequence) ? gb.currentSequence : [];
      const nextPieceIdx = curSeq.length > 0 ? curSeq[0] : null;

      // Update DOM CSS Overlay beacon right over the target stone on screen!
      updateChaacTargetOverlay(scene, gb, nextPieceIdx, !!scene.locked, curSeq.length);

      const score = scene.score || 0;
      const isLocked = !!scene.locked;
      const currentChaacSig = `${score}|${gb.lives}|${currLength}|${isLocked}|${curSeq.join(",")}`;

      if (currentChaacSig !== lastChaacPostedSig) {
        lastChaacPostedSig = currentChaacSig;

        const chaacPayload = {
          active: true,
          score: score,
          targetScore: gb.targetScore || 5,
          lives: gb.lives !== undefined ? gb.lives : 3,
          currLength: currLength,
          isLocked: isLocked,
          fullSequence: predefinedSeq.slice(0, currLength),
          remainingSequence: curSeq,
          completedSteps: currLength - curSeq.length,
          nextPiece: nextPieceIdx !== null ? CHAAC_PIECES[nextPieceIdx] : null
        };

        postMsg({ type: "SFL_CHAAC_DATA", payload: chaacPayload });
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "SFL_CHAAC_DATA", payload: chaacPayload }, "*");
          }
        } catch (_) {}
        try {
          if (window.top && window.top !== window && window.top !== window.parent) {
            window.top.postMessage({ type: "SFL_CHAAC_DATA", payload: chaacPayload }, "*");
          }
        } catch (_) {}
      }
    } catch (_) {}
  }, 180);

  console.log("[SFL Treasure Radar] Injected hook v2.1.0 (with Memory & Chaac Trackers) active.");
})();
