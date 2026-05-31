import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "release/store-assets");
await mkdir(out, { recursive: true });

const FONT = "Consolas, 'JetBrains Mono', 'DejaVu Sans Mono', monospace";
const C = { bg: "#0a0a0a", panel: "#141414", line: "#2a2a2a", text: "#ededed", dim: "#7c7c7c", ac: "#ff8a3d" };
const L = { bg: "#f3f3f3", panel: "#ffffff", line: "#dcdcdc", text: "#141414", dim: "#6b6b6b", ac: "#ff8a3d" };

const logo = (x, y, size, t) =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${t.text}">fast<tspan fill="${t.dim}">\\</tspan>Hunter<tspan fill="${t.ac}">.</tspan></text>`;

// Extension popup mock, native size 330x430, drawn at 0,0.
const popup = (t) => `
<g font-family="${FONT}">
  <rect width="330" height="430" rx="14" fill="${t.bg}" stroke="${t.line}" stroke-width="1.5"/>
  <circle cx="24" cy="28" r="5" fill="${t.ac}"/><circle cx="40" cy="28" r="5" fill="${t.line}"/><circle cx="56" cy="28" r="5" fill="${t.line}"/>
  ${logo(110, 34, 17, t)}
  <text x="312" y="33" font-size="13" font-weight="700" fill="${t.ac}" text-anchor="end">[on]</text>
  <line x1="14" y1="48" x2="316" y2="48" stroke="${t.line}" stroke-dasharray="4 4"/>
  <text x="16" y="73" font-size="13" fill="${t.dim}">root@fasthunter:~$ <tspan fill="${t.ac}">_</tspan></text>
  <rect x="14" y="86" width="302" height="94" rx="9" fill="${t.panel}" stroke="${t.line}"/>
  <text x="28" y="108" font-size="11" fill="${t.dim}"># current_page</text>
  <text x="28" y="129" font-size="12" fill="${t.text}">https://releases.example.com/build.zip</text>
  <rect x="28" y="142" width="274" height="26" rx="6" fill="none" stroke="${t.ac}" stroke-width="1.5"/>
  <text x="165" y="159" font-size="12" font-weight="700" fill="${t.ac}" text-anchor="middle">[ send ]</text>
  <rect x="14" y="190" width="302" height="92" rx="9" fill="${t.panel}" stroke="${t.line}"/>
  <text x="28" y="212" font-size="11" fill="${t.dim}"># paste_url</text>
  <rect x="28" y="222" width="274" height="26" rx="6" fill="${t.bg}" stroke="${t.line}"/>
  <text x="38" y="239" font-size="11" fill="${t.dim}">https://example.com/file.iso</text>
  <rect x="28" y="254" width="274" height="22" rx="6" fill="none" stroke="${t.ac}" stroke-width="1.5"/>
  <text x="165" y="269" font-size="11" font-weight="700" fill="${t.ac}" text-anchor="middle">[ fetch ]</text>
  <rect x="14" y="292" width="302" height="56" rx="9" fill="${t.panel}" stroke="${t.line}"/>
  <text x="28" y="316" font-size="12" font-weight="700" fill="${t.text}"># auto_capture</text>
  <text x="28" y="334" font-size="10" fill="${t.dim}">route browser downloads to FastHunter</text>
  <text x="304" y="323" font-size="15" font-weight="700" fill="${t.ac}" text-anchor="end">[x]</text>
  <line x1="14" y1="362" x2="316" y2="362" stroke="${t.line}" stroke-dasharray="4 4"/>
  <text x="16" y="386" font-size="11" fill="${t.dim}"># desktop app connected</text>
  <text x="16" y="406" font-size="11" fill="${t.ac}">> last download routed to FastHunter</text>
</g>`;

const seg = (x, y, w, n, fill, t) => {
  const gap = 3, sw = (w - gap * (n - 1)) / n;
  let s = "";
  for (let i = 0; i < n; i++) s += `<rect x="${x + i * (sw + gap)}" y="${y}" width="${sw}" height="14" rx="2" fill="${i < fill ? t.ac : t.line}"/>`;
  return s;
};

const frame = (w, h, inner, bg = C.bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${inner}</svg>`;

const bullets = (x, y, items, t, size = 22, gap = 40) =>
  items.map((it, i) => `<text x="${x}" y="${y + i * gap}" font-family="${FONT}" font-size="${size}" fill="${t.dim}"><tspan fill="${t.ac}">> </tspan>${it}</text>`).join("");

// 1) HERO 1280x800
const hero = frame(1280, 800, `
  <text x="80" y="120" font-family="${FONT}" font-size="20" fill="${C.ac}">// FastHunter Downloader</text>
  ${logo(78, 230, 78, C)}
  <text x="80" y="300" font-family="${FONT}" font-size="40" font-weight="700" fill="${C.text}">Hunt your downloads down.</text>
  ${bullets(80, 380, ["Segmented, multi-connection speed", "Pause, resume + retry, no lost progress", "One-click capture from any tab", "Terminal-clean UI, dark + light"], C, 24, 50)}
  <text x="80" y="700" font-family="${FONT}" font-size="18" fill="${C.dim}">root@fasthunter:~$ <tspan fill="${C.ac}">fetch --turbo</tspan> <tspan fill="${C.text}">everything</tspan></text>
  <g transform="translate(838,140) scale(1.25)">${popup(C)}</g>`);

// 2) CAPTURE (context menu) 1280x800
const menuRow = (y, label, hot) => `
  <rect x="772" y="${y}" width="420" height="44" fill="${hot ? "#1c1c1c" : "#141414"}"/>
  <text x="792" y="${y + 28}" font-family="${FONT}" font-size="16" fill="${hot ? C.ac : C.text}">${label}</text>`;
const capture = frame(1280, 800, `
  ${logo(80, 110, 40, C)}
  <text x="80" y="180" font-family="${FONT}" font-size="48" font-weight="700" fill="${C.text}">One-click capture</text>
  <text x="80" y="232" font-family="${FONT}" font-size="22" fill="${C.dim}">Right-click any link, video, or audio.</text>
  <rect x="80" y="300" width="600" height="420" rx="12" fill="#101010" stroke="${C.line}"/>
  <text x="110" y="350" font-family="${FONT}" font-size="18" fill="${C.dim}"># a web page</text>
  <text x="110" y="430" font-family="${FONT}" font-size="20" fill="${C.ac}">ubuntu-24.04-desktop.iso</text>
  <text x="110" y="470" font-family="${FONT}" font-size="16" fill="${C.dim}">big-dataset.tar.gz</text>
  <text x="110" y="510" font-family="${FONT}" font-size="16" fill="${C.dim}">4k-trailer.mp4</text>
  <rect x="770" y="392" width="424" height="232" rx="10" fill="${C.panel}" stroke="${C.line}"/>
  ${menuRow(400, "Open link in new tab", false)}
  ${menuRow(444, "Copy link address", false)}
  ${menuRow(488, "Download with FastHunter", true)}
  ${menuRow(532, "Send page URL to FastHunter", false)}
  ${menuRow(576, "Inspect", false)}`);

// 3) SPEED 1280x800
const speed = frame(1280, 800, `
  ${logo(80, 110, 40, C)}
  <text x="80" y="180" font-family="${FONT}" font-size="48" font-weight="700" fill="${C.text}">Multi-segment speed</text>
  <text x="80" y="232" font-family="${FONT}" font-size="22" fill="${C.dim}">Every file split across parallel connections.</text>
  <rect x="80" y="290" width="1120" height="150" rx="12" fill="${C.panel}" stroke="${C.line}"/>
  <text x="108" y="335" font-family="${FONT}" font-size="20" fill="${C.text}">build-image.iso</text>
  <text x="1172" y="335" font-family="${FONT}" font-size="18" fill="${C.ac}" text-anchor="end">::downloading</text>
  ${seg(108, 360, 1064, 16, 11, C)}
  <text x="108" y="410" font-family="${FONT}" font-size="16" fill="${C.dim}">68%  -  2.6/3.8 GB  -  <tspan fill="${C.ac}">48.2 MB/s</tspan>  -  6 segments  -  eta 26s</text>
  <rect x="80" y="470" width="1120" height="250" rx="12" fill="${C.panel}" stroke="${C.line}"/>
  <text x="108" y="512" font-family="${FONT}" font-size="16" fill="${C.dim}"># net.throughput --live</text>
  ${Array.from({ length: 40 }).map((_, i) => { const h = 30 + Math.round(120 * Math.abs(Math.sin(i * 0.5)) * (0.4 + (i / 40))); return `<rect x="${110 + i * 27}" y="${690 - h}" width="18" height="${h}" rx="2" fill="${C.ac}" opacity="${0.45 + (i / 80)}"/>`; }).join("")}`);

// 4) THEMES 1280x800
const themes = frame(1280, 800, `
  ${logo(80, 110, 40, C)}
  <text x="80" y="180" font-family="${FONT}" font-size="48" font-weight="700" fill="${C.text}">Adapts to your theme</text>
  <text x="80" y="232" font-family="${FONT}" font-size="22" fill="${C.dim}">Automatic dark and light, monochrome by design.</text>
  <g transform="translate(220,300) scale(1.05)">${popup(C)}</g>
  <g transform="translate(720,300) scale(1.05)">${popup(L)}</g>`, C.bg);

// 5) PRIVATE / desktop 1280x800
const dlRow = (y, name, tag, st, fill) => `
  <rect x="120" y="${y}" width="1040" height="70" rx="9" fill="${C.panel}" stroke="${C.line}"/>
  <rect x="138" y="${y + 22}" width="42" height="26" rx="5" fill="none" stroke="${C.ac}"/>
  <text x="159" y="${y + 40}" font-family="${FONT}" font-size="12" fill="${C.ac}" text-anchor="middle">${tag}</text>
  <text x="200" y="${y + 30}" font-family="${FONT}" font-size="16" fill="${C.text}">${name}</text>
  <text x="1142" y="${y + 30}" font-family="${FONT}" font-size="14" fill="${C.ac}" text-anchor="end">::${st}</text>
  ${seg(200, y + 44, 760, 16, fill, C)}`;
const priv = frame(1280, 800, `
  <rect x="80" y="70" width="1120" height="660" rx="16" fill="#0d0d0d" stroke="${C.line}"/>
  <circle cx="112" cy="104" r="6" fill="${C.ac}"/><circle cx="134" cy="104" r="6" fill="${C.line}"/><circle cx="156" cy="104" r="6" fill="${C.line}"/>
  ${logo(420, 112, 26, C)}
  <text x="1168" y="110" font-family="${FONT}" font-size="14" fill="${C.dim}" text-anchor="end">root@fasthunter:~/active$</text>
  <line x1="80" y1="132" x2="1200" y2="132" stroke="${C.line}"/>
  <text x="120" y="180" font-family="${FONT}" font-size="34" font-weight="700" fill="${C.text}">Your files. Your machine.</text>
  <text x="120" y="220" font-family="${FONT}" font-size="18" fill="${C.dim}">No accounts. No tracking. A local bridge to your own app.</text>
  ${dlRow(270, "ubuntu-24.04-desktop.iso", "APP", "downloading", 10)}
  ${dlRow(360, "design-resources-2026.zip", "ARC", "completed", 16)}
  ${dlRow(450, "focus-session.flac", "AUD", "queued", 0)}
  ${dlRow(540, "aerial-film-4k.mp4", "VID", "downloading", 6)}
  <text x="120" y="690" font-family="${FONT}" font-size="16" fill="${C.dim}"># aggregate <tspan fill="${C.ac}">66.9 MB/s</tspan>  -  4 transfers  -  drone mode [off]</text>`);

// Small promo 440x280
const small = frame(440, 280, `
  <circle cx="40" cy="44" r="6" fill="${C.ac}"/><circle cx="58" cy="44" r="6" fill="${C.line}"/><circle cx="76" cy="44" r="6" fill="${C.line}"/>
  ${logo(34, 130, 46, C)}
  <text x="36" y="172" font-family="${FONT}" font-size="18" fill="${C.ac}">Browser downloads,</text>
  <text x="36" y="198" font-family="${FONT}" font-size="18" fill="${C.text}">hunted down.</text>
  <rect x="36" y="222" width="240" height="30" rx="7" fill="none" stroke="${C.ac}" stroke-width="1.5"/>
  <text x="156" y="242" font-family="${FONT}" font-size="14" font-weight="700" fill="${C.ac}" text-anchor="middle">[ fetch --turbo ]</text>`);

// Marquee 1400x560
const marquee = frame(1400, 560, `
  <text x="90" y="120" font-family="${FONT}" font-size="20" fill="${C.ac}">// FastHunter Downloader</text>
  ${logo(88, 250, 86, C)}
  <text x="90" y="320" font-family="${FONT}" font-size="34" font-weight="700" fill="${C.text}">Hunt your downloads down.</text>
  ${bullets(90, 390, ["Segmented multi-connection speed", "One-click capture - dark + light - private"], C, 22, 42)}
  <text x="90" y="500" font-family="${FONT}" font-size="18" fill="${C.dim}">root@fasthunter:~$ <tspan fill="${C.ac}">fetch</tspan> everything</text>
  <g transform="translate(980,70) scale(1.0)">${popup(C)}</g>`);

const jobs = [
  ["screenshot-1-hero.png", hero],
  ["screenshot-2-capture.png", capture],
  ["screenshot-3-speed.png", speed],
  ["screenshot-4-themes.png", themes],
  ["screenshot-5-private.png", priv],
  ["promo-small-440x280.png", small],
  ["promo-marquee-1400x560.png", marquee],
];

for (const [name, svg] of jobs) {
  await sharp(Buffer.from(svg))
    .flatten({ background: C.bg })
    .removeAlpha()
    .png()
    .toFile(resolve(out, name));
}
console.log("Generated", jobs.length, "store assets in release/store-assets");
