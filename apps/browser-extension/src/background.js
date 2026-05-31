const HOST = "com.fasthunter.downloader";
const MENU_LINK = "fasthunter-download-link";
const MENU_PAGE = "fasthunter-download-page";
const RESTORE_GRACE_MS = 15_000;
const DUPLICATE_WINDOW_MS = 30_000;
const STARTUP_QUARANTINE_MS = 20_000;
const recentCaptures = new Map();

function sendNative(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(HOST, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response ?? { ok: false, error: "The desktop app did not respond." });
      }
    });
  });
}

function showBadge(text, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 3000);
}

async function saveTransfer(response, url) {
  await chrome.storage.local.set({
    lastTransfer: {
      ok: Boolean(response?.ok),
      url,
      error: response?.error || null,
      createdAt: new Date().toISOString(),
    },
  });
}

function isFreshBrowserDownload(item, url) {
  const startedAt = Date.parse(item.startTime || "");
  const now = Date.now();
  if (Number.isFinite(startedAt) && now - startedAt > RESTORE_GRACE_MS) return false;
  const lastCapture = recentCaptures.get(url) || 0;
  if (now - lastCapture < DUPLICATE_WINDOW_MS) return false;
  recentCaptures.set(url, now);
  for (const [capturedUrl, capturedAt] of recentCaptures) {
    if (now - capturedAt >= DUPLICATE_WINDOW_MS) recentCaptures.delete(capturedUrl);
  }
  return true;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: MENU_LINK, title: "Download with FastHunter", contexts: ["link", "video", "audio"] });
  chrome.contextMenus.create({ id: MENU_PAGE, title: "Send page URL to FastHunter", contexts: ["page"] });
  chrome.storage.local.get("automaticCapture", ({ automaticCapture }) => {
    if (typeof automaticCapture === "undefined") chrome.storage.local.set({ automaticCapture: true });
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ automaticCaptureReadyAt: Date.now() + STARTUP_QUARANTINE_MS });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  const url = info.linkUrl || info.srcUrl || info.pageUrl;
  if (url) await sendNative({ type: "enqueue", url });
});

chrome.downloads.onCreated.addListener(async (item) => {
  const { automaticCapture = false, automaticCaptureReadyAt = 0 } = await chrome.storage.local.get([
    "automaticCapture",
    "automaticCaptureReadyAt",
  ]);
  if (!automaticCapture || !item.url || item.url.startsWith("blob:") || item.url.startsWith("data:")) return;
  if (Date.now() < automaticCaptureReadyAt) return;
  const url = item.finalUrl || item.url;
  if (!isFreshBrowserDownload(item, url)) return;
  const response = await sendNative({ type: "enqueue", url });
  await saveTransfer(response, url);
  if (!response?.ok) {
    showBadge("!", "#c94c55");
    return;
  }
  showBadge("OK", "#3b9f69");
  try {
    await chrome.downloads.cancel(item.id);
  } catch {
    // The browser may finish very small files before cancellation reaches it.
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "ping" || message?.type === "enqueue") {
    sendNative(message).then(sendResponse);
    return true;
  }
});
