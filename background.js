/*! SFL Treasure Radar Engine - Background Worker v1.9.1 */

function injectContentScripts() {
  try {
    if (chrome.tabs && chrome.scripting) {
      chrome.tabs.query({ url: ["https://sunflower-land.com/*", "https://*.sunflower-land.com/*", "https://*.minigames.sunflower-land.com/*"] }, (tabs) => {
        for (const t of tabs || []) {
          if (t.id) {
            chrome.scripting.executeScript({
              target: { tabId: t.id, allFrames: true },
              files: ["contentScript.js"]
            }).catch(() => {});
          }
        }
      });
    }
  } catch (_) {}
}

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
  injectContentScripts();
});

chrome.runtime.onStartup?.addListener(() => {
  injectContentScripts();
});

chrome.action.onClicked.addListener(() => {
  injectContentScripts();
});

function getUtcDayStart(now = Date.now()) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function filterTodayTiles(grid) {
  if (!Array.isArray(grid)) return [];
  const todayStart = getUtcDayStart();
  return grid.filter(t => !t.dugAt || t.dugAt >= todayStart);
}

function isNewDiggingDay(oldDigging, newDigging) {
  if (!oldDigging || !newDigging) return false;
  const todayStart = getUtcDayStart();

  const oldGrid = Array.isArray(oldDigging.grid) ? oldDigging.grid : [];
  const oldHasOnlyExpired = oldGrid.length > 0 && oldGrid.every(t => t.dugAt && t.dugAt < todayStart);
  if (oldHasOnlyExpired) return true;

  if ((newDigging.streak?.count || 0) > (oldDigging.streak?.count || 0)) return true;

  const oldComp = oldDigging.completedPatterns?.length || 0;
  const newComp = newDigging.completedPatterns?.length || 0;
  if (oldComp > 0 && newComp < oldComp) return true;

  const oldPatterns = Array.isArray(oldDigging.patterns) ? oldDigging.patterns.join(",") : "";
  const newPatterns = Array.isArray(newDigging.patterns) ? newDigging.patterns.join(",") : "";
  if (oldPatterns && newPatterns && oldPatterns !== newPatterns) return true;

  return false;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SFL_SESSION_DATA" && message.payload) {
    chrome.storage.local.get(["SFL_SESSION_DATA"], (res) => {
      let session = res.SFL_SESSION_DATA || {};
      const newPayload = message.payload;
      const oldDigging = session.farm?.desert?.digging;
      const newDigging = newPayload.farm?.desert?.digging;

      if (newDigging) {
        if (isNewDiggingDay(oldDigging, newDigging)) {
          newDigging.grid = filterTodayTiles(newDigging.grid);
        } else if (oldDigging?.grid && newDigging?.grid) {
          const curTiles = filterTodayTiles(oldDigging.grid);
          const newTiles = filterTodayTiles(newDigging.grid);
          const tileMap = new Map();
          for (const t of curTiles) tileMap.set(`${t.x},${t.y}`, t);
          for (const t of newTiles) tileMap.set(`${t.x},${t.y}`, t);
          newDigging.grid = Array.from(tileMap.values());
        }
      }

      chrome.storage.local.set({ SFL_SESSION_DATA: newPayload }, () => {
        sendResponse({ status: "OK" });
      });
    });
    return true;
  }

  if (message.type === "SFL_AUTOSAVE_DATA" && message.payload) {
    chrome.storage.local.get(["SFL_SESSION_DATA"], (res) => {
      let session = res.SFL_SESSION_DATA || {};
      session.farm = session.farm || {};
      if (message.payload.farm) {
        for (const [k, v] of Object.entries(message.payload.farm)) {
          if (k === "desert") {
            const oldDigging = session.farm.desert?.digging;
            const newDigging = v?.digging;
            if (newDigging) {
              if (isNewDiggingDay(oldDigging, newDigging)) {
                newDigging.grid = filterTodayTiles(newDigging.grid);
              } else if (oldDigging?.grid && newDigging?.grid) {
                const curTiles = filterTodayTiles(oldDigging.grid);
                const newTiles = filterTodayTiles(newDigging.grid);
                const tileMap = new Map();
                for (const t of curTiles) tileMap.set(`${t.x},${t.y}`, t);
                for (const t of newTiles) tileMap.set(`${t.x},${t.y}`, t);
                newDigging.grid = Array.from(tileMap.values());
              }
            }
          }
          session.farm[k] = v;
        }
      }
      if (message.payload.farmId) {
        session.farmId = message.payload.farmId;
      }
      chrome.storage.local.set({ SFL_SESSION_DATA: session }, () => {
        sendResponse({ status: "OK" });
      });
    });
    return true;
  }

  if (message.type === "SFL_MEMORY_DATA" && message.payload) {
    chrome.storage.local.set({ SFL_MEMORY_DATA: message.payload }, () => {
      sendResponse({ status: "OK" });
    });
    return true;
  }

  if (message.type === "SFL_CHAAC_DATA" && message.payload) {
    chrome.storage.local.set({ SFL_CHAAC_DATA: message.payload }, () => {
      sendResponse({ status: "OK" });
    });
    return true;
  }
});
