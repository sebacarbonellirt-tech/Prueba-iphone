// Arte vectorial generado por código: autos, logo, pistas e íconos.
// Todo original. En producción se reemplaza por arte 2D/3D profesional,
// pero las proporciones y la paleta ya definen la identidad.
import { buildTrack, trackGeometry } from "../core/race.js";

let uid = 0;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const SHAPES = {
  hatch: {
    body: "M22,88 L18,66 Q16,44 34,34 Q46,27 70,26 L156,26 Q176,27 192,38 L226,54 Q278,57 297,66 Q305,71 303,81 L301,88 Z",
    glass: "M38,38 Q48,31 70,31 L112,31 L112,51 L32,51 Q32,43 38,38 Z M118,31 L154,31 Q170,32 182,42 L192,51 L118,51 Z",
    line: "M34,62 L294,66",
    wheels: [78, 246],
    head: [292, 64],
    tail: [20, 64],
    wing: null,
  },
  coupe: {
    body: "M12,86 L12,68 Q14,59 40,55 L96,42 Q114,33 142,32 L178,33 Q198,35 216,47 L242,57 Q292,59 305,69 Q311,75 309,84 L307,88 L12,88 Z",
    glass: "M104,44 Q120,37 142,37 L150,37 L150,51 L98,51 Z M156,37 L174,38 Q188,41 202,51 L156,51 Z",
    line: "M30,64 L300,70",
    wheels: [72, 256],
    head: [298, 66],
    tail: [16, 64],
    wing: "M14,54 L50,52 L50,56 L14,58 Z M28,56 L32,60 L36,56 Z",
  },
  roadster: {
    body: "M12,84 L14,70 Q20,62 52,60 L122,58 L150,44 L158,44 L150,58 L204,59 Q262,57 297,67 Q309,73 307,82 L305,88 L12,88 Z",
    glass: "M150,46 L157,46 L150,57 L143,57 Z",
    line: "M28,68 L300,72",
    wheels: [70, 252],
    head: [296, 68],
    tail: [16, 68],
    wing: "M100,58 Q110,44 124,46 L124,58 Z",
  },
};

/** Auto de perfil. */
export function carSvg(shape, paint, { glow = true, className = "" } = {}) {
  const s = SHAPES[shape] || SHAPES.hatch;
  const id = `c${++uid}`;
  const wheel = (x) => `
    <g transform="translate(${x},88)">
      <circle r="25" fill="#050608"/>
      <circle r="21" fill="url(#${id}t)"/>
      <circle r="14.5" fill="url(#${id}r)" stroke="#0b0d10" stroke-width="1.2"/>
      ${[0, 72, 144, 216, 288].map((a) => `<rect x="-1.6" y="-14" width="3.2" height="11" rx="1.4" fill="#cfd5dd" transform="rotate(${a})"/>`).join("")}
      <circle r="3.6" fill="#1a1e24" stroke="#9aa3ad" stroke-width="1"/>
      <path d="M-11,-6 A12,12 0 0 1 2,-12" stroke="${shade(paint, 40)}" stroke-width="2.4" fill="none" opacity=".9"/>
    </g>`;
  return `<svg class="car-svg ${className}" viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(paint, 55)}"/>
      <stop offset=".45" stop-color="${paint}"/>
      <stop offset="1" stop-color="${shade(paint, -70)}"/>
    </linearGradient>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9fb7d4"/><stop offset=".5" stop-color="#1b2633"/><stop offset="1" stop-color="#0a0f16"/>
    </linearGradient>
    <radialGradient id="${id}r"><stop offset="0" stop-color="#6b737d"/><stop offset="1" stop-color="#22272e"/></radialGradient>
    <radialGradient id="${id}t"><stop offset=".7" stop-color="#15181d"/><stop offset="1" stop-color="#2c3139"/></radialGradient>
    <radialGradient id="${id}h"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#bfe9ff" stop-opacity=".8"/><stop offset="1" stop-color="#bfe9ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}l"><stop offset="0" stop-color="#ff5a5a"/><stop offset="1" stop-color="#ff2020" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="160" cy="110" rx="150" ry="7" fill="#000" opacity=".55"/>
  ${s.wing ? `<path d="${s.wing}" fill="${shade(paint, -50)}"/>` : ""}
  <path d="${s.body}" fill="url(#${id}b)"/>
  <path d="${s.body}" fill="none" stroke="${shade(paint, 80)}" stroke-opacity=".35" stroke-width="1"/>
  <path d="${s.glass}" fill="url(#${id}g)"/>
  <path d="${s.line}" stroke="${shade(paint, 90)}" stroke-opacity=".5" stroke-width="1.4" fill="none"/>
  <path d="M30,84 L300,84" stroke="#000" stroke-opacity=".35" stroke-width="5"/>
  <rect x="${s.head[0] - 8}" y="${s.head[1] - 3}" width="12" height="5" rx="2" fill="#e8f7ff"/>
  <rect x="${s.tail[0]}" y="${s.tail[1] - 3}" width="9" height="5" rx="2" fill="#ff3b3b"/>
  ${glow ? `<circle cx="${s.head[0] + 6}" cy="${s.head[1]}" r="22" fill="url(#${id}h)" opacity=".7"/><circle cx="${s.tail[0]}" cy="${s.tail[1]}" r="12" fill="url(#${id}l)" opacity=".8"/>` : ""}
  ${s.wheels.map(wheel).join("")}
</svg>`;
}

/** Logotipo: OVERDRIVE en itálica condensada con barra de velocidad. */
export function logoSvg(className = "") {
  return `<svg class="logo ${className}" viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OVERDRIVE">
  <defs>
    <linearGradient id="lg1" x1="0" x2="1"><stop offset="0" stop-color="#ffb347"/><stop offset=".5" stop-color="#ff5a1f"/><stop offset="1" stop-color="#e02d10"/></linearGradient>
  </defs>
  <g transform="skewX(-12)">
    <rect x="30" y="70" width="210" height="6" fill="url(#lg1)"/>
    <rect x="248" y="70" width="40" height="6" fill="#ff5a1f" opacity=".6"/>
    <rect x="296" y="70" width="18" height="6" fill="#ff5a1f" opacity=".3"/>
  </g>
  <text x="180" y="62" text-anchor="middle" font-family="'Barlow Condensed', 'Arial Narrow', sans-serif" font-weight="800" font-style="italic" font-size="64" letter-spacing="1" fill="#f4f6f8">OVER<tspan fill="url(#lg1)">DRIVE</tspan></text>
</svg>`;
}

const trackCache = {};
export function trackPath(circuitId) {
  if (trackCache[circuitId]) return trackCache[circuitId];
  const t = buildTrack(circuitId);
  const g = trackGeometry(t, 10);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of g) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const w = maxX - minX, h = maxY - minY, sc = 100 / Math.max(w, h);
  const ox = (100 - w * sc) / 2, oy = (100 - h * sc) / 2;
  const d = g.map((p, i) => `${i ? "L" : "M"}${((p.x - minX) * sc + ox).toFixed(1)},${((maxY - p.y) * sc + oy).toFixed(1)}`).join("") + "Z";
  return (trackCache[circuitId] = d);
}

/** Silueta de pista para tarjetas. */
export function trackSvg(circuitId, color, className = "") {
  const d = trackPath(circuitId);
  return `<svg class="track-svg ${className}" viewBox="-8 -8 116 116" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${color}" stroke-opacity=".18" stroke-width="10" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>
  </svg>`;
}

const ICONS = {
  garage: '<path d="M3 10 12 4l9 6v10h-4v-7H7v7H3z"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  flag: '<path d="M5 3v18M5 4h11l-2 4 2 4H5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M9 9h6M9 12h6M9 15h6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  drop: '<path d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  paint: '<path d="M19 3H5v6h14zM12 9v4M10 13h4v8h-4z"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
};
export function icon(name, cls = "") {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}
