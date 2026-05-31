export const CHANGELOG = [
  {
    version: "v1.0.0",
    date: "May 31, 2026",
    status: "stable",
    added: ["Initial download queue", "Pause and resume UI", "Speed monitor", "Dark interface", "Basic settings screen"],
    improved: ["Startup performance", "Download status readability"],
    fixed: ["Installer layout issue"],
    known: ["Browser extension connection requires manual registration after installation"],
  },
  {
    version: "v0.9.0",
    date: "May 30, 2026",
    status: "beta",
    added: ["Segmented download engine", "Direct URL fetch", "Download activity logging"],
    improved: ["Chunk persistence after app restart"],
    fixed: ["Filename collisions for repeated downloads"],
    known: ["Unsigned Windows installer may show a SmartScreen warning"],
  },
];
