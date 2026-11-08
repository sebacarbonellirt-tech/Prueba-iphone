// Utilidades mínimas de interfaz (sin framework).

/** Crea un elemento a partir de HTML. */
export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const $ = (root, sel) => root.querySelector(sel);
export const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));

/** Números compactos: 950, 12,4K, 3,2M. */
export function fmt(n) {
  n = Math.floor(n);
  const abs = Math.abs(n);
  const f = (v, s) => (v >= 100 ? String(Math.floor(v)) : v.toFixed(1).replace(".", ",").replace(",0", "")) + s;
  if (abs < 10000) return n.toLocaleString("es-CL");
  if (abs < 1e6) return f(n / 1e3, "K");
  if (abs < 1e9) return f(n / 1e6, "M");
  return f(n / 1e9, "B");
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(2).padStart(5, "0");
  return `${m}:${s}`;
}

export function fmtDuration(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  if (h) return `${h} h ${String(m).padStart(2, "0")} min`;
  if (m) return `${m} min ${String(r).padStart(2, "0")} s`;
  return `${r} s`;
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let toastTimer;
export function toast(msg, kind = "") {
  let t = document.getElementById("toast");
  if (!t) {
    t = el('<div id="toast" class="toast" role="status" aria-live="polite"></div>');
    document.getElementById("app").appendChild(t);
  }
  t.className = `toast show ${kind}`;
  t.innerHTML = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 2200);
}

/** Hoja modal inferior. */
export function sheet(html, { onClose } = {}) {
  const wrap = el(`<div class="sheet-wrap"><div class="sheet-backdrop"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`);
  document.getElementById("app").appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add("open"));
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    wrap.classList.remove("open");
    setTimeout(() => wrap.remove(), 250);
    onClose && onClose();
  };
  $(wrap, ".sheet-backdrop").addEventListener("click", close);
  $$(wrap, "[data-close]").forEach((b) => b.addEventListener("click", close));
  return { root: wrap, close };
}

export function vibrate(ms = 20) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch (e) {
    /* no disponible */
  }
}

/** Anima un número de 0 a "to" dentro de un elemento. */
export function countUp(node, to, ms = 900, prefix = "") {
  const start = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - start) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    node.textContent = prefix + fmt(to * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
