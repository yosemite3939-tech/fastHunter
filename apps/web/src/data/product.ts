export const DOWNLOADS = {
  installer: "/downloads/FastHunter-Downloader-1.0.0.exe",
  extension: "/downloads/fasthunter-browser-extension.zip",
};

export const PRODUCT = {
  name: "fast\\Hunter.",
  version: "v1.0.0",
  platform: "Windows 10+",
  architecture: "x64",
  license: "Free",
  channel: "Stable",
  releaseDate: "May 31, 2026",
  installerSize: "95.1 MB",
  sha256: "214C5E53D42D02B103F745D5845E862E8534FC917AD84A8A797B5E3CA879FE8B",
};

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/download", label: "Download" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/donate", label: "Donate" },
  { href: "/forum", label: "Forum" },
  { href: "/support", label: "Support" },
  { href: "/changelog", label: "Changelog" },
];

export const FEATURES = [
  ["Fast downloads", "Segmented HTTP range requests when the source supports them."],
  ["Pause and resume", "Stop the transfer. Continue when you are ready."],
  ["Clean queue", "Know what is active, waiting, complete, or failed."],
  ["Speed monitor", "Live throughput with a readable activity graph."],
  ["Smart retry", "Failed segments retry with a measured backoff."],
  ["Simple controls", "Useful actions stay close to the file."],
  ["Lightweight interface", "A focused desktop app without the usual noise."],
  ["Direct URL fetch", "Paste a source URL and start the hunt."],
  ["No clutter", "No ads, bundled offers, or crowded surfaces."],
  ["Built for Windows", "Packaged as an installable Windows x64 desktop app."],
];

export const SCREENSHOTS = [
  { src: "/assets/screenshot-1-hero.png", title: "Dashboard", caption: "One clear surface for the current hunt." },
  { src: "/assets/screenshot-2-capture.png", title: "Browser capture", caption: "Send links from the browser extension." },
  { src: "/assets/screenshot-3-speed.png", title: "Speed monitor", caption: "Watch each transfer without the clutter." },
];
