const $ = (selector) => document.querySelector(selector);
const statusEl = $("#status");
const conn = $("#conn");
const pageUrl = $("#page-url");
const auto = $("#auto");
const manual = $("#manual");
let currentUrl = "";
let capture = false;

const message = (payload) => new Promise((resolve) => chrome.runtime.sendMessage(payload, resolve));
const setStatus = (text) => { statusEl.textContent = `# ${text}`; };

async function send(url) {
  if (!url) return;
  setStatus("sending\u2026");
  const response = await message({ type: "enqueue", url });
  setStatus(response?.ok ? "queued in FastHunter \u2713" : (response?.error || "desktop app not reachable"));
}

function paintCapture() {
  auto.classList.toggle("on", capture);
  auto.textContent = capture ? "[x]" : "[ ]";
}

async function initialize() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentUrl = tab?.url || "";
  pageUrl.textContent = currentUrl || "this page has no URL";
  const response = await message({ type: "ping" });
  const ok = Boolean(response?.ok);
  conn.classList.toggle("ready", ok);
  conn.textContent = ok ? "[on]" : "[off]";
  const saved = await chrome.storage.local.get(["automaticCapture", "lastTransfer"]);
  capture = Boolean(saved.automaticCapture);
  paintCapture();
  if (saved.lastTransfer?.ok) setStatus("last download routed to FastHunter \u2713");
  else if (saved.lastTransfer?.error) setStatus(`last capture failed: ${saved.lastTransfer.error}`);
  else setStatus(ok ? "desktop app connected" : "desktop offline \u2014 open FastHunter, enable default downloader");
}

$("#send").addEventListener("click", () => send(currentUrl));
$("#send-manual").addEventListener("click", () => send(manual.value.trim()));
manual.addEventListener("keydown", (event) => { if (event.key === "Enter") send(manual.value.trim()); });
$("#row-auto").addEventListener("click", () => {
  capture = !capture;
  paintCapture();
  chrome.storage.local.set({ automaticCapture: capture });
});
void initialize();
