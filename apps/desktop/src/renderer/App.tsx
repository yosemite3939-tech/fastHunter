import { useEffect, useMemo, useRef, useState } from "react";
import type { AppSettings, DownloadCategory, DownloadRecord, DownloadSnapshot, DownloadStatus } from "@fasthunter/shared-types";
import { dedupeSources, extractSupportedSources, isSupportedSource } from "@fasthunter/shared-types";
import { api } from "./lib/api";
import monogram from "./assets/fast-hunter-monogram.jpeg";

type Page = "dashboard" | "active" | "queue" | "completed" | "failed" | "categories" | "settings";

const CAT: Record<DownloadCategory, string> = {
  videos: "VID", music: "AUD", documents: "DOC", images: "IMG", archives: "ARC", apps: "APP", others: "BIN",
};

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "square"; o.frequency.value = 880;
    g.gain.setValueAtTime(0.05, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    o.start(); o.stop(ctx.currentTime + 0.26);
    o.onended = () => void ctx.close();
  } catch { /* ignore */ }
}

function bytes(value: number): string {
  if (!value) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), u.length - 1);
  return `${(value / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${u[i]}`;
}
function eta(v: number | null): string {
  if (v === null) return "--";
  if (v < 60) return `${v}s`;
  return `${Math.floor(v / 60)}m${v % 60}s`;
}
function percent(item: DownloadRecord): number {
  return item.totalBytes ? Math.min(100, Math.round((item.downloadedBytes / item.totalBytes) * 100)) : 0;
}

function Bar({ pct, width = 22, live = false }: { pct: number; width?: number; live?: boolean }) {
  const f = Math.round((pct / 100) * width);
  return <span className={`bar ${live ? "live" : ""}`}><span className="bar-f">{"█".repeat(f)}</span><span className="bar-t">{"░".repeat(width - f)}</span></span>;
}

function useTween(target: number, ms = 450): number {
  const [val, setVal] = useState(target);
  const raf = useRef(0);
  useEffect(() => {
    const from = val;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  return val;
}

function Tick({ n, fmt }: { n: number; fmt?: (v: number) => string }) {
  const v = useTween(n);
  return <>{fmt ? fmt(v) : String(Math.round(v))}</>;
}

function Titlebar({ page }: { page: Page }) {
  const send = (a: "minimize" | "maximize" | "close") => {
    const b = (window as unknown as { fasthunterWindow?: Record<string, () => void> }).fasthunterWindow;
    b?.[a]?.();
  };
  return (
    <header className="tbar">
      <div className="tbar-id"><img src={monogram} alt="" /><span>fast\HUNTER</span><i>// downloader</i></div>
      <div className="tbar-path">root@fasthunter:~/{page}$</div>
      <div className="tbar-win">
        <button className="winbtn" onClick={() => send("minimize")} title="minimize">─</button>
        <button className="winbtn" onClick={() => send("maximize")} title="maximize">▢</button>
        <button className="winbtn close" onClick={() => send("close")} title="exit">✕</button>
      </div>
    </header>
  );
}

function downloadStatus(downloads: DownloadRecord[]): string {
  if (downloads.some((d) => ["downloading", "probing", "merging"].includes(d.status))) return "Downloading....";
  if (downloads.some((d) => d.status === "paused")) return "Paused";
  if (downloads.some((d) => d.status === "queued")) return "Queued...";
  if (downloads.some((d) => d.status === "failed")) return "Download failed";
  if (downloads.some((d) => d.status === "completed") && downloads.every((d) => ["completed", "cancelled"].includes(d.status))) return "Download complete";
  return "Ready to Down a File";
}

function Rocket({ active, speed, status }: { active: boolean; speed: number; status: string }) {
  const intensity = Math.min(1, speed / 1_000_000 / 12);
  const puffs = active ? 42 + Math.round(intensity * 48) : 30;
  const dur = active ? Math.max(0.4, 1.4 - intensity) : 2.0;
  return (
    <div className={`rocket-stage ${active ? "launch" : "idle"}`} aria-hidden="true">
      <div className="rkt-status"><span key={status} className="rkt-status-text">{status}</span></div>
      <div className="rocket">
        <div className="rkt-float">
          <svg viewBox="2 0 7 13" shapeRendering="crispEdges" className="rkt-svg">
            <rect x="5" y="1" width="1" height="1" />
            <rect x="4" y="2" width="3" height="2" />
            <rect x="4" y="4" width="1" height="1" /><rect x="6" y="4" width="1" height="1" />
            <rect x="4" y="5" width="3" height="3" />
            <rect x="3" y="7" width="5" height="1" />
            <rect x="3" y="8" width="1" height="2" /><rect x="7" y="8" width="1" height="2" />
            <rect x="4" y="8" width="3" height="2" />
            <rect x="5" y="10" width="1" height="1" />
          </svg>
          <span className="flame" style={{ height: `${20 + Math.round(intensity * 26)}px`, width: `${12 + Math.round(intensity * 6)}px` }} />
          <div className="smoke">
            {Array.from({ length: puffs }).map((_, i) => (
              <span key={i} className="puff" style={{
                ["--dx" as string]: `${(i % 2 ? 1 : -1) * (3 + (i % 9) * 3)}px`,
                width: `${6 + Math.round(intensity * 4)}px`,
                height: `${6 + Math.round(intensity * 4)}px`,
                animationDuration: `${dur}s`,
                animationDelay: `${((i * dur) / puffs).toFixed(2)}s`,
              } as React.CSSProperties} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Nav({ page, onPage, downloads, speed, droneMode, onDrone }: { page: Page; onPage: (p: Page) => void; downloads: DownloadRecord[]; speed: number; droneMode: boolean; onDrone: () => void }) {
  const active = downloads.filter((d) => ["downloading", "probing", "merging"].includes(d.status)).length;
  const queued = downloads.filter((d) => d.status === "queued").length;
  const failed = downloads.filter((d) => d.status === "failed").length;
  const items: Array<[Page, string, number?]> = [
    ["dashboard", "status"], ["active", "active", active], ["queue", "queue", queued],
    ["completed", "done"], ["failed", "failed", failed], ["categories", "tags"], ["settings", "config"],
  ];
  return (
    <nav className="nav">
      <p className="nav-title"># commands</p>
      <div className="nav-box">
        {items.map(([id, label, count]) => (
          <button key={id} className={`nav-cmd ${page === id ? "on" : ""}`} onClick={() => onPage(id)}>
            <span className="ps">›</span>./{label}{count ? <b><Tick n={count} /></b> : null}
          </button>
        ))}
      </div>
      <Rocket active={active > 0} speed={speed} status={downloadStatus(downloads)} />
      <div className="nav-foot">
        <button className={`drone ${droneMode ? "on" : ""}`} onClick={onDrone} aria-label="Toggle drone mode">
          <svg viewBox="0 0 24 24" className="drone-svg" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
            <circle cx="5" cy="5" r="2.6" /><circle cx="19" cy="5" r="2.6" /><circle cx="5" cy="19" r="2.6" /><circle cx="19" cy="19" r="2.6" />
            <rect x="9" y="9" width="6" height="6" rx="1.2" className="drone-body" />
          </svg>
          <span>drone mode</span>
          <span className="drone-state">[{droneMode ? "on" : "off"}]</span>
          <span className="drone-tip"># drone mode — downloads cruise quietly in the background at a tamed speed (~1.5 MB/s) to save bandwidth. toggle off for full speed.</span>
        </button>
        <span className="nav-ver">v1.0.0 · stable</span>
      </div>
    </nav>
  );
}

function Spark({ speed }: { speed: number }) {
  const [hist, setHist] = useState<number[]>(Array(48).fill(0));
  const ref = useRef(speed);
  ref.current = speed;
  useEffect(() => {
    const t = setInterval(() => setHist((p) => [...p.slice(1), ref.current]), 1000);
    return () => clearInterval(t);
  }, []);
  const max = Math.max(10_000_000, ...hist);
  return (
    <section className="spark" aria-hidden="true">
      <div className="spark-head"><span># net.throughput --live</span><span className="spark-val"><Tick n={speed} fmt={bytes} />/s</span></div>
      <div className="spark-bars">
        {hist.map((v, i) => <span key={i} className="sb" style={{ height: `${Math.max(2, Math.round((v / max) * 100))}%` }} />)}
      </div>
      <div className="spark-axis"><span>-48s</span><span>now</span></div>
    </section>
  );
}

function ErType() {
  const full = "er.";
  const [n, setN] = useState(0);
  const dirRef = useRef(1);
  useEffect(() => {
    let delay = 240;
    if (dirRef.current === 1 && n >= full.length) { dirRef.current = -1; delay = 1300; }
    else if (dirRef.current === -1 && n <= 0) { dirRef.current = 1; delay = 700; }
    const id = setTimeout(() => setN((v) => v + dirRef.current), delay);
    return () => clearTimeout(id);
  }, [n]);
  return (
    <span className="lg-type">
      <span className="lg-ghost">{full}</span>
      <span className="lg-live">{full.slice(0, n)}<span className="lg-caret" /></span>
    </span>
  );
}

function collectDroppedSources(data: DataTransfer): string[] {
  const raw: string[] = [];
  for (const type of ["text/uri-list", "text/plain", "text", "URL", "text/x-moz-url", "DownloadURL"]) {
    const value = data.getData(type);
    if (value) raw.push(value);
  }
  const html = data.getData("text/html");
  if (html) {
    const document = new DOMParser().parseFromString(html, "text/html");
    for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
      raw.push(anchor.getAttribute("href") ?? "");
    }
  }
  return extractSupportedSources(raw);
}

function DropzoneBat() {
  return (
    <span className="dz-bat" aria-hidden="true">
      <span className="bat" />
    </span>
  );
}

function Dropzone({ onDrop, onActivate }: { onDrop: (values: string[]) => void; onActivate: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);
  const [hot, setHot] = useState(false);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const enter = (e: DragEvent) => { e.preventDefault(); dragDepth.current += 1; setHot(true); };
    const over = (e: DragEvent) => {
      e.preventDefault();
      const dt = e.dataTransfer;
      if (!dt || dt.effectAllowed === "none") return;
      dt.dropEffect = dt.effectAllowed === "copy" || dt.effectAllowed === "copyMove"
        ? "copy"
        : dt.effectAllowed === "move"
          ? "move"
          : "link";
    };
    const leave = () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (!dragDepth.current) setHot(false);
    };
    const drop = (e: DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setHot(false);
      const dt = e.dataTransfer;
      if (!dt) return;
      onDropRef.current(collectDroppedSources(dt));
    };
    el.addEventListener("dragenter", enter);
    el.addEventListener("dragover", over);
    el.addEventListener("dragleave", leave);
    el.addEventListener("drop", drop);
    return () => {
      el.removeEventListener("dragenter", enter);
      el.removeEventListener("dragover", over);
      el.removeEventListener("dragleave", leave);
      el.removeEventListener("drop", drop);
    };
  }, []);
  return (
    <div ref={ref} className={`dropzone ${hot ? "drag" : ""}`} role="button" tabIndex={0} style={{ cursor: "pointer" }} onClick={onActivate} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onActivate(); } }} aria-label="Drop zone: drag and drop a direct HTTP or HTTPS URL, or click to add a download">
      <DropzoneBat />
      <span className="dz-text">{hot ? "release to add URL" : "Drag-and-drop direct download URL"}</span>
    </div>
  );
}

function Neofetch({ data, downloads, onDrop, onActivate }: { data: DownloadSnapshot; downloads: DownloadRecord[]; onDrop: (values: string[]) => void; onActivate: () => void }) {
  const active = downloads.filter((d) => ["downloading", "probing", "merging"].includes(d.status)).length;
  const queued = downloads.filter((d) => d.status === "queued").length;
  const done = downloads.filter((d) => d.status === "completed").length;
  const failed = downloads.filter((d) => d.status === "failed").length;
  const total = downloads.reduce((s, d) => s + d.downloadedBytes, 0);
  const rows: Array<[string, number, ((v: number) => string)?, string?]> = [
    ["speed", data.aggregateSpeed, bytes, "/s"], ["active", active], ["queued", queued],
    ["done", done], ["failed", failed], ["fetched", total, bytes],
  ];
  return (
    <section className="neofetch">
      <span className="nf-logo"><span className="lg-a">fast</span>\<span className="lg-b">Hunt<ErType /></span></span>
      <div className="nf-info">
        <p className="nf-title">fast\HUNTER<span>@windows</span></p>
        <div className="nf-sep">────────────────────────</div>
        {rows.map(([k, v, fmt, suf]) => <div className="nf-row" key={k}><span>{k}</span><b><Tick n={v} fmt={fmt} />{suf}</b></div>)}
      </div>
      <div className="nf-right">
        <Dropzone onDrop={onDrop} onActivate={onActivate} />
      </div>
    </section>
  );
}

function DownloadLine({ item, onSelect }: { item: DownloadRecord; onSelect: (i: DownloadRecord) => void }) {
  const pct = percent(item);
  const prev = useRef(item.status);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (prev.current !== item.status) {
      prev.current = item.status;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 700);
      return () => clearTimeout(t);
    }
  }, [item.status]);
  const act = (e: React.MouseEvent, fn: () => Promise<void>) => { e.stopPropagation(); void fn(); };
  let host = item.url;
  try { host = new URL(item.url).hostname; } catch { /* keep raw */ }
  return (
    <article className={`dl ${flash ? "flash" : ""}`} onClick={() => onSelect(item)}>
      <div className="dl-top">
        <span className={`dl-tag c-${item.category}`}>{CAT[item.category]}</span>
        <span className="dl-name">{item.fileName}</span>
        <span className={`dl-st st-${item.status}`}>::{item.status}</span>
      </div>
      <div className="dl-bot">
        <Bar pct={pct} live={item.status === "downloading"} />
        <span className="dl-pct"><Tick n={pct} fmt={(v) => String(Math.round(v)).padStart(3, " ")} />%</span>
        <span className="dl-dim">{bytes(item.downloadedBytes)}/{bytes(item.totalBytes)}</span>
        {item.status === "downloading" ? <span className="dl-spd">↓{bytes(item.speedBytesPerSecond)}/s</span> : null}
        {item.status === "downloading" ? <span className="dl-dim">eta {eta(item.etaSeconds)}</span> : null}
        <span className="dl-dim dl-host">{host}</span>
        <span className="dl-actions">
          {item.status === "downloading" ? <button onClick={(e) => act(e, () => api.pauseDownload(item.id))}>[pause]</button> : null}
          {["paused", "queued"].includes(item.status) ? <button onClick={(e) => act(e, () => api.resumeDownload(item.id))}>[resume]</button> : null}
          {item.status === "failed" ? <button onClick={(e) => act(e, () => api.retryDownload(item.id))}>[retry]</button> : null}
          {item.status === "completed" ? <button onClick={(e) => act(e, () => api.openFolder(item.id))}>[open]</button> : null}
          <button onClick={(e) => act(e, () => api.removeDownload(item.id))}>[rm]</button>
        </span>
      </div>
      {item.status === "failed" && item.errorMessage ? <div className="dl-err"># {item.errorMessage}</div> : null}
    </article>
  );
}

function DownloadList({ title, downloads, onSelect, sort, onSort, filter, onFilter, onAdd }: {
  title: string; downloads: DownloadRecord[]; onSelect: (i: DownloadRecord) => void;
  sort: string; onSort: (s: string) => void; filter: string; onFilter: (s: string) => void; onAdd: () => void;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="ph-cmd"><span className="ps">$</span> ls ~/{title} <span className="panel-count">// {downloads.length}</span></span>
        <span className="panel-tools">
          <button className="add-btn" onClick={onAdd}>+ add</button>
          <span className="grep">grep:<input value={filter} onChange={(e) => onFilter(e.target.value)} placeholder="*" /></span>
          <select value={sort} onChange={(e) => onSort(e.target.value)}>
            <option value="date-desc">--sort=date</option>
            <option value="name-asc">--sort=name</option>
            <option value="size-desc">--sort=size</option>
          </select>
        </span>
      </div>
      <div className="panel-body">
        {downloads.length
          ? downloads.map((i) => <DownloadLine key={i.id} item={i} onSelect={onSelect} />)
          : <div className="empty"># no entries — paste a URL below and press enter</div>}
      </div>
    </section>
  );
}

function Detail({ item, onClose }: { item: DownloadRecord; onClose: () => void }) {
  const rows: Array<[string, string]> = [
    ["status", item.status],
    ["downloaded", `${bytes(item.downloadedBytes)} / ${bytes(item.totalBytes)}`],
    ["progress", `${percent(item)}%`],
    ["cur.speed", `${bytes(item.speedBytesPerSecond)}/s`],
    ["avg.speed", `${bytes(item.averageSpeedBytesPerSecond)}/s`],
    ["eta", eta(item.etaSeconds)],
    ["segments", String(item.segmentCount)],
    ["ranges", item.supportsRanges ? "yes" : "no (single stream)"],
    ["category", item.category],
  ];
  return (
    <aside className="detail">
      <div className="detail-head"><span># stat</span><button onClick={onClose}>✕</button></div>
      <p className="detail-name">{item.fileName}</p>
      <div className="detail-url">{item.url}</div>
      <div className="detail-barwrap"><Bar pct={percent(item)} width={32} /> <span className="dl-pct">{percent(item)}%</span></div>
      <div className="detail-rows">
        {rows.map(([k, v], i) => <div className="detail-row" key={k} style={{ ["--i" as string]: i } as React.CSSProperties}><span>{k}</span><b className={`st-${item.status}`}>{v}</b></div>)}
      </div>
      <div className="detail-dest"><span># save_to</span><p>{item.destination}</p></div>
      <div className="detail-log">
        <span># tail logs ({item.logs.length})</span>
        {item.logs.slice(-6).map((l) => <p key={l.id} className={`lg-${l.level}`}>[{l.level}] {l.message}</p>)}
        {item.errorMessage ? <p className="lg-error">[error] {item.errorMessage}</p> : null}
      </div>
      <div className="detail-act">
        <button onClick={() => void api.openFolder(item.id)}>[open folder]</button>
        <button className="danger" onClick={() => { void api.removeDownload(item.id); onClose(); }}>[rm]</button>
      </div>
    </aside>
  );
}

function Categories({ downloads }: { downloads: DownloadRecord[] }) {
  const cats = Object.keys(CAT) as DownloadCategory[];
  return (
    <section className="panel">
      <div className="panel-head"><span className="ph-cmd"><span className="ps">$</span> ls --group-by=tag</span></div>
      <div className="cats">
        {cats.map((c) => (
          <div className={`cat c-${c}`} key={c}>
            <span className="cat-tag">{CAT[c]}</span>
            <div><b>{c}</b><small>{downloads.filter((d) => d.category === c).length} files</small></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Settings({ settings, onPatch }: { settings: AppSettings | null; onPatch: (c: Partial<AppSettings>) => Promise<void> }) {
  const [integrationMsg, setIntegrationMsg] = useState("");
  if (!settings) return <div className="empty"># loading config...</div>;
  const toggle = (key: keyof AppSettings, label: string) => (
    <label className="set-row">
      <span># {label}</span>
      <button className={`tog ${settings[key] ? "on" : ""}`} onClick={() => void onPatch({ [key]: !settings[key] })}>
        [{settings[key] ? "x" : " "}] {settings[key] ? "true" : "false"}
      </button>
    </label>
  );
  return (
    <section className="panel settings">
      <div className="panel-head"><span className="ph-cmd"><span className="ps">$</span> nano ~/.fasthunter/config</span></div>
      <div className="set-group">
        <p className="set-h"># [appearance]</p>
        <label className="set-row"><span># theme</span>
          <select value={settings.theme} onChange={(e) => void onPatch({ theme: e.target.value as AppSettings["theme"] })}>
            <option value="system">system</option><option value="light">light</option><option value="dark">dark</option>
          </select>
        </label>
      </div>
      <div className="set-group">
        <p className="set-h"># [downloads]</p>
        <label className="set-row set-row-wide"><span># default_folder</span>
          <span className="set-folder">
            <input value={settings.defaultDownloadFolder} onChange={(e) => void onPatch({ defaultDownloadFolder: e.target.value })} />
            <button onClick={async () => { const f = await api.chooseDownloadFolder(); if (f) void onPatch({ defaultDownloadFolder: f }); }}>[browse]</button>
          </span>
        </label>
        <label className="set-row"><span># max_simultaneous</span>
          <select value={settings.maxSimultaneousDownloads} onChange={(e) => void onPatch({ maxSimultaneousDownloads: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>
        </label>
        <label className="set-row"><span># connections_per_dl</span>
          <select value={settings.maxConnectionsPerDownload} onChange={(e) => void onPatch({ maxConnectionsPerDownload: Number(e.target.value) })}>{[1, 4, 6, 8].map((n) => <option key={n}>{n}</option>)}</select>
        </label>
        {toggle("autoStartDownloads", "auto_start")}
        {toggle("autoCategorize", "auto_categorize")}
        {toggle("askBeforeDownload", "ask_before_download")}
        {toggle("minimizeToTray", "stay_hidden_on_close")}
      </div>
      <div className="set-group">
        <p className="set-h"># [speed &amp; net]</p>
        <label className="set-row"><span># retry_attempts</span>
          <select value={settings.retryCount} onChange={(e) => void onPatch({ retryCount: Number(e.target.value) })}>{[1, 2, 3, 5].map((n) => <option key={n}>{n}</option>)}</select>
        </label>
        {toggle("bandwidthLimitEnabled", "limit_bandwidth")}
        <label className="set-row"><span># limit_mb_s</span>
          <input type="number" min="1" disabled={!settings.bandwidthLimitEnabled} value={Math.round(settings.bandwidthLimitBytesPerSecond / 1048576)} onChange={(e) => void onPatch({ bandwidthLimitBytesPerSecond: Number(e.target.value) * 1048576 })} />
        </label>
        {toggle("browserCaptureEnabled", "browser_capture")}
      </div>
      <div className="set-group">
        <p className="set-h"># [on complete]</p>
        {toggle("notifications", "notifications")}
        {toggle("soundOnCompletion", "sound_on_complete")}
        {toggle("autoOpenCompletedFile", "auto_open_file")}
        {toggle("autoOpenFolder", "auto_open_folder")}
        {toggle("clearCompletedDownloads", "auto_clear_completed")}
      </div>
      <div className="set-group">
        <p className="set-h"># [integration]</p>
        <label className="set-row"><span># set_as_default_downloader</span>
          <button className={`tog ${settings.defaultDownloader ? "on" : ""}`} onClick={async () => {
            const enable = !settings.defaultDownloader;
            const res = await api.setDefaultDownloader(enable);
            if (res.ok) await onPatch({ defaultDownloader: enable });
            setIntegrationMsg(res.message);
          }}>[{settings.defaultDownloader ? "x" : " "}] {settings.defaultDownloader ? "true" : "false"}</button>
        </label>
        <p className="set-h"># asks your browser (Chrome / Edge / Brave) to route downloads through FastHunter</p>
        <label className="set-row set-row-wide"><span># published_extension_id</span>
          <input value={settings.extensionId} placeholder="paste your Web Store extension id" onChange={(e) => void onPatch({ extensionId: e.target.value.trim() })} />
        </label>
        {integrationMsg ? <p className="set-h">› {integrationMsg}</p> : null}
      </div>
    </section>
  );
}

function BootOverlay({ onSkip }: { onSkip: () => void }) {
  const lines = [
    "fast\\HUNTER v1.0.0 — segmented downloader",
    "> initializing engine.......... ok",
    "> mounting datastore........... ok",
    "> arming browser capture....... ok",
    "> ready.",
  ];
  return (
    <div className="boot" onClick={onSkip}>
      {lines.map((l, i) => <p key={i} style={{ animationDelay: `${0.12 + i * 0.3}s` }}>{l}{i === lines.length - 1 ? <span className="cur">█</span> : null}</p>)}
    </div>
  );
}

function AddDownloadModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (values: string[]) => Promise<void> }) {
  const [val, setVal] = useState("");
  const submit = async () => {
    const v = val.trim();
    if (!v) return;
    await onSubmit([v]);
    onClose();
  };
  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head"><span><span className="ps">$</span> add download</span><button onClick={onClose} aria-label="Close">✕</button></div>
        <label className="modal-row"><span># source</span>
          <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder="https://example.com/file.zip" onKeyDown={(e) => { if (e.key === "Enter") void submit(); }} />
        </label>
        <div className="modal-actions">
          <button className="primary" onClick={() => void submit()}>[add ⏎]</button>
        </div>
        <p className="modal-note"># paste a direct HTTP or HTTPS download URL</p>
      </div>
    </div>
  );
}

export function App() {
  const [page, setPage] = useState<Page>(() => {
    try { return (localStorage.getItem("fh.page") as Page) || "dashboard"; } catch { return "dashboard"; }
  });
  const [data, setData] = useState<DownloadSnapshot>({ downloads: [], aggregateSpeed: 0 });
  const [selected, setSelected] = useState<DownloadRecord | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [systemDark, setSystemDark] = useState(false);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [cmd, setCmd] = useState("");
  const [boot, setBoot] = useState(true);
  const [echo, setEcho] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState("");
  const submitSources = async (values: string[]) => {
    const list = dedupeSources(values);
    let added = 0;
    let rejected = 0;
    for (const v of list) {
      if (!isSupportedSource(v)) { rejected += 1; continue; }
      try { await api.createDownload({ url: v }); added += 1; }
      catch { rejected += 1; }
    }
    const parts: string[] = [];
    if (added) parts.push(`added ${added}`);
    if (rejected) parts.push(`rejected ${rejected} (unsupported)`);
    if (!list.length) parts.push("rejected drop (use a direct HTTP or HTTPS URL)");
    if (parts.length) {
      setToast(`> ${parts.join(" · ")}`);
      window.setTimeout(() => setToast(""), 3500);
    }
  };
  useEffect(() => {
    const t = setTimeout(() => setBoot(false), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    void api.listDownloads().then(setData);
    return api.onDownloadsUpdated(setData);
  }, []);
  useEffect(() => {
    void api.getSettings().then(setSettings);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (selected) setSelected(data.downloads.find((i) => i.id === selected.id) ?? null);
  }, [data]);

  const seenDone = useRef<Set<string>>(new Set());
  const doneInit = useRef(false);
  useEffect(() => {
    const completed = data.downloads.filter((d) => d.status === "completed");
    if (!doneInit.current) {
      completed.forEach((d) => seenDone.current.add(d.id));
      doneInit.current = true;
      return;
    }
    for (const d of completed) {
      if (seenDone.current.has(d.id)) continue;
      seenDone.current.add(d.id);
      if (settings?.notifications && "Notification" in window) {
        try { new Notification("Download complete", { body: d.fileName, silent: true }); } catch { /* ignore */ }
      }
      if (settings?.soundOnCompletion) beep();
      if (settings?.autoOpenCompletedFile) void api.openFile(d.id);
      else if (settings?.autoOpenFolder) void api.openFolder(d.id);
      if (settings?.clearCompletedDownloads) void api.removeDownload(d.id);
    }
    const ids = new Set(data.downloads.map((d) => d.id));
    for (const id of [...seenDone.current]) if (!ids.has(id)) seenDone.current.delete(id);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onVis = () => { document.body.dataset.hidden = document.hidden ? "1" : "0"; };
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const selRef = useRef(selected);
  selRef.current = selected;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "select" || tag === "textarea";
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") { e.preventDefault(); inputRef.current?.focus(); return; }
      if (typing) return;
      const sel = selRef.current;
      if (!sel) return;
      if (e.key === "Delete") { e.preventDefault(); void api.removeDownload(sel.id); }
      else if (e.key === " ") {
        e.preventDefault();
        if (sel.status === "downloading") void api.pauseDownload(sel.id);
        else if (["paused", "queued"].includes(sel.status)) void api.resumeDownload(sel.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { try { localStorage.setItem("fh.page", page); } catch { /* ignore */ } }, [page]);

  const visible = useMemo(() => {
    let list = data.downloads;
    if (page === "active") list = list.filter((i) => ["probing", "downloading", "merging"].includes(i.status));
    else if (page === "queue") list = list.filter((i) => ["queued", "paused"].includes(i.status));
    else if (page === "completed") list = list.filter((i) => i.status === "completed");
    else if (page === "failed") list = list.filter((i) => i.status === "failed");
    if (filter) {
      const q = filter.toLowerCase();
      list = list.filter((i) => i.fileName.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === "name-asc") return a.fileName.localeCompare(b.fileName);
      if (sort === "size-desc") return b.totalBytes - a.totalBytes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [page, data.downloads, filter, sort]);

  const darkMode = settings ? (settings.theme === "dark" || (settings.theme === "system" && systemDark)) : systemDark;
  const patchSettings = async (change: Partial<AppSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...change };
    setSettings(next);
    await api.saveSettings(next);
  };
  const runCmd = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = cmd.trim();
    if (!url) return;
    if (!isSupportedSource(url)) {
      setEcho("> rejected: use a direct HTTP or HTTPS URL");
      window.setTimeout(() => setEcho(""), 3000);
      return;
    }
    let name = url;
    try { name = new URL(url).pathname.split("/").filter(Boolean).pop() || url; } catch { /* keep raw */ }
    await api.createDownload({ url }).then(
      () => { setCmd(""); setEcho(`> queued: ${name}`); },
      () => setEcho("> error: could not queue download"),
    );
    window.setTimeout(() => setEcho(""), 3000);
  };

  const title = page === "dashboard" ? "recent" : page;

  return (
    <div className={`app-shell ${darkMode ? "theme-dark" : "theme-light"} ${settings?.transparentMode ? "transparent-mode" : ""}`}>
      {boot ? <BootOverlay onSkip={() => setBoot(false)} /> : null}
      <Titlebar page={page} />
      <Nav page={page} onPage={setPage} downloads={data.downloads} speed={data.aggregateSpeed} droneMode={settings?.droneMode ?? false} onDrone={() => void patchSettings({ droneMode: !(settings?.droneMode) })} />
      <main className="main">
        <div className="view" key={page}>
          {page === "settings" ? <Settings settings={settings} onPatch={patchSettings} />
            : page === "categories" ? <Categories downloads={data.downloads} />
              : (
                <>
                  {page === "dashboard" ? <><Neofetch data={data} downloads={data.downloads} onDrop={submitSources} onActivate={() => setAddOpen(true)} /><Spark speed={data.aggregateSpeed} /></> : null}
                  <DownloadList title={title} downloads={visible} onSelect={setSelected} sort={sort} onSort={setSort} filter={filter} onFilter={setFilter} onAdd={() => setAddOpen(true)} />
                </>
              )}
        </div>
      </main>
      <form className="cmdbar" onSubmit={runCmd}>
        {echo ? <span className="cmd-echo" key={echo}>{echo}</span> : null}
        <span className="ps1">root@fasthunter:~$</span>
        <span className="cmd-verb">fetch</span>
        {!cmd ? <span className="cmd-cursor">█</span> : null}
        <input ref={inputRef} aria-label="Download URL" value={cmd} onChange={(e) => setCmd(e.target.value)} placeholder="paste a direct URL and press enter…" spellCheck={false} autoFocus />
        <button type="submit" className="cmd-run">⏎ run</button>
      </form>
      {selected ? <Detail item={selected} onClose={() => setSelected(null)} /> : null}
      {addOpen ? <AddDownloadModal onClose={() => setAddOpen(false)} onSubmit={submitSources} /> : null}
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
}
