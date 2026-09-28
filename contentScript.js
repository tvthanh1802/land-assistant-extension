/*! SFL Treasure Radar Engine - Content Script v2.0.1 */

function doInjectHook() {
  try {
    const target = document.head || document.documentElement;
    if (target) {
      // Check if already injected to avoid duplicates
      if (document.getElementById("sfl-injected-hook-script")) return true;
      const script = document.createElement("script");
      script.id = "sfl-injected-hook-script";
      script.src = chrome.runtime.getURL("injectedHook.js");
      script.async = false;
      target.appendChild(script);
      script.onload = () => script.remove();
      return true;
    }
  } catch (e) {
    console.warn("[SFL Assistant] Hook injection error:", e);
  }
  return false;
}

if (!doInjectHook()) {
  const observer = new MutationObserver((_, obs) => {
    if (doInjectHook()) {
      obs.disconnect();
    }
  });
  observer.observe(document, { childList: true, subtree: true });
}

let sessionMsg = null;
let autosaveMsg = null;
let isSending = false;
let retryTimer = null;

function sendQueue() {
  if (isSending) return;
  const msg = sessionMsg || autosaveMsg;
  if (!msg || !chrome.runtime?.id) return;

  isSending = true;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  chrome.runtime.sendMessage(msg, () => {
    const err = chrome.runtime.lastError;
    if (err) {
      isSending = false;
      if (err.message && err.message.includes("invalidated")) return;
      retryTimer = setTimeout(sendQueue, 1000);
    } else {
      if (msg.type === "SFL_SESSION_DATA") {
        sessionMsg = null;
      } else {
        autosaveMsg = null;
      }
      isSending = false;
      if (sessionMsg || autosaveMsg) {
        setTimeout(sendQueue, 100);
      }
    }
  });
}

window.addEventListener("message", (ev) => {
  if (!ev.data || typeof ev.data !== "object") return;
  const { type, payload } = ev.data;

  // Real-time minigame events (Memory & Chaac): Accept from current window OR nested iframes
  if (type === "SFL_MEMORY_DATA" && payload) {
    try {
      chrome.runtime.sendMessage({ type: "SFL_MEMORY_DATA", payload }, () => {
        if (chrome.runtime.lastError) {}
      });
    } catch (_) {}
    return;
  }

  if (type === "SFL_CHAAC_DATA" && payload) {
    try {
      chrome.runtime.sendMessage({ type: "SFL_CHAAC_DATA", payload }, () => {
        if (chrome.runtime.lastError) {}
      });
    } catch (_) {}
    return;
  }

  // Session & Autosave events: only from current window
  if (ev.source !== window) return;

  if (type === "SFL_SESSION_DATA" && payload) {
    sessionMsg = { type: "SFL_SESSION_DATA", payload };
    sendQueue();
  } else if (type === "SFL_AUTOSAVE_DATA" && payload) {
    if (payload.farm) {
      if (autosaveMsg) {
        for (const [k, v] of Object.entries(payload.farm)) {
          autosaveMsg.payload.farm[k] = v;
        }
      } else {
        autosaveMsg = { type: "SFL_AUTOSAVE_DATA", payload: JSON.parse(JSON.stringify(payload)) };
      }
      sendQueue();
    }
  }
});
