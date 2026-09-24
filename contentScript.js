/*! SFL Treasure Radar Engine - Content Script v1.9.1 */
try {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injectedHook.js");
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();
} catch (e) {
  console.error("[SFL Treasure Radar] Injection failed:", e);
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
  if (ev.source !== window || !ev.data || typeof ev.data !== "object") return;
  const { type, payload } = ev.data;

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
  } else if (type === "SFL_MEMORY_DATA" && payload) {
    try {
      chrome.runtime.sendMessage({ type: "SFL_MEMORY_DATA", payload }, () => {
        if (chrome.runtime.lastError) {}
      });
    } catch (_) {}
  } else if (type === "SFL_CHAAC_DATA" && payload) {
    try {
      chrome.runtime.sendMessage({ type: "SFL_CHAAC_DATA", payload }, () => {
        if (chrome.runtime.lastError) {}
      });
    } catch (_) {}
  }
});
