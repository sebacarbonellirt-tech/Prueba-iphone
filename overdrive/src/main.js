// Punto de entrada: carga la partida, monta la interfaz y corre el bucle Idle.
import * as G from "./core/state.js";
import { loadGame, saveGame } from "./storage.js";
import { el, $, fmt, fmtDuration, sheet, toast } from "./ui/dom.js";
import { icon, logoSvg, carSvg } from "./ui/art.js";
import { CARS } from "./core/data.js";
import garage from "./ui/screens/garage.js";
import workshop from "./ui/screens/workshop.js";
import races from "./ui/screens/races.js";
import prerace from "./ui/screens/prerace.js";
import liveRace from "./ui/screens/race.js";
import results from "./ui/screens/results.js";
import profile from "./ui/screens/profile.js";

const SCREENS = { garage, workshop, races, prerace, race: liveRace, results, profile };
const TABS = [
  { id: "garage", label: "Garaje", icon: "garage" },
  { id: "workshop", label: "Taller", icon: "wrench" },
  { id: "races", label: "Carreras", icon: "flag" },
  { id: "profile", label: "Perfil", icon: "user" },
];
const VERSION = "MVP 0.1";

const app = document.getElementById("app");
const loaded = loadGame(Date.now());
const offline = G.tick(loaded.state, Date.now());

const ctx = {
  state: loaded.state,
  now: () => Date.now(),
  save: () => saveGame(ctx.state),
  go,
  refresh: () => go(current.name, current.params, { keepScroll: true }),
  replaceState(s) {
    ctx.state = s;
    ctx.save();
    go("garage");
  },
};
window.__overdrive = ctx; // útil para depurar desde la consola

let current = { name: null, params: null, inst: null };
let hud, screenHost, tabbar;

function mountShell() {
  app.innerHTML = "";
  hud = el(`<header class="hud">
    <div class="rep">
      <div class="rep-badge"><span data-rep></span></div>
      <div class="rep-info"><div class="lbl">Reputación <span data-xp class="num"></span></div><div class="bar"><i data-xpbar></i></div></div>
    </div>
    <div class="wallet"><span class="coin">CR</span><span data-cr class="num"></span></div>
  </header>`);
  screenHost = el(`<main class="screen"></main>`);
  tabbar = el(`<nav class="tabbar">${TABS.map((t) => `<button class="tab" data-tab="${t.id}">${icon(t.icon)}<span>${t.label}</span></button>`).join("")}</nav>`);
  tabbar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (b) go(b.dataset.tab);
  });
  app.append(hud, screenHost, tabbar);
}

function updateHud() {
  const s = ctx.state;
  $(hud, "[data-rep]").textContent = s.rep;
  $(hud, "[data-cr]").textContent = fmt(s.credits);
  const need = G.xpForNext(s.rep);
  $(hud, "[data-xp]").textContent = s.rep >= 20 ? "MÁX" : `· ${fmt(s.xp)}/${fmt(need)}`;
  $(hud, "[data-xpbar]").style.width = `${Math.min(100, (s.xp / need) * 100)}%`;
  // Punto de aviso en Garaje si la caja está llena o hay objetivo por cobrar.
  const g = G.currentGoal(s);
  const alert = (g && g.done) || s.box >= G.boxCap(s) * 0.98;
  const tab = $(tabbar, '[data-tab="garage"]');
  const dot = $(tab, ".dot");
  if (alert && !dot) tab.appendChild(el('<i class="dot"></i>'));
  if (!alert && dot) dot.remove();
}

function go(name, params = null, { keepScroll = false } = {}) {
  const scroll = screenHost.scrollTop;
  if (current.inst && current.inst.destroy) current.inst.destroy();
  const def = SCREENS[name];
  current = { name, params, inst: null };
  const fullscreen = name === "race";
  hud.style.display = fullscreen ? "none" : "";
  tabbar.style.display = fullscreen ? "none" : "";
  screenHost.className = fullscreen ? "screen full" : "screen";
  screenHost.innerHTML = "";
  const inst = def(ctx, params || {});
  current.inst = inst;
  screenHost.appendChild(inst.root);
  screenHost.scrollTop = keepScroll ? scroll : 0;
  const tabId = { prerace: "races", results: "races" }[name] || name;
  tabbar.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tabId));
  updateHud();
}

function loop() {
  const r = G.tick(ctx.state, Date.now());
  for (const carId of r.finishedBuilds) {
    if (!ctx.state.builds[carId].notified) {
      ctx.state.builds[carId].notified = true;
      toast(`${icon("check")} ¡${CARS[carId].name} está listo en el garaje!`, "good");
    }
  }
  if (current.inst && current.inst.update) current.inst.update();
  if (current.name !== "race") updateHud();
}

function showSplash() {
  const car = ctx.state.garage[ctx.state.activeCar];
  const splash = el(`<div class="splash">
    <div class="lines"></div><div class="horizon"></div>
    ${logoSvg()}
    <div class="tag">Garaje · Estrategia · Velocidad</div>
    ${carSvg(CARS[ctx.state.activeCar].shape, car.paint)}
    <button class="btn primary" data-start>${icon("play")} Arrancar motor</button>
    <div class="ver">${VERSION} · Prototipo</div>
  </div>`);
  app.appendChild(splash);
  $(splash, "[data-start]").addEventListener("click", () => {
    splash.style.transition = "opacity .35s";
    splash.style.opacity = "0";
    setTimeout(() => splash.remove(), 350);
    if (!loaded.fresh && offline.elapsed > 60 && offline.gained >= 1) showOffline();
  });
}

function showOffline() {
  const s = ctx.state;
  const full = s.box >= G.boxCap(s) * 0.99;
  const sh = sheet(`
    <h3>Mientras no estabas</h3>
    <p>Tu taller atendió clientes durante ${fmtDuration(offline.elapsed * 1000)}.${full ? ` <b class="gold">La caja se llenó</b>: amplía la Oficina para acumular más de ${G.capHours(s)} h.` : ""}</p>
    <div class="offline-amount"><span class="coin">CR</span>${fmt(offline.gained)}</div>
    <button class="btn gold block" data-collect>Cobrar</button>`);
  $(sh.root, "[data-collect]").addEventListener("click", () => {
    const got = G.collect(s);
    ctx.save();
    sh.close();
    toast(`+${fmt(got)} CR`, "good");
    if (current.name === "garage") ctx.refresh();
    updateHud();
  });
}

mountShell();
go("garage");
showSplash();
setInterval(loop, 250);
setInterval(() => ctx.save(), 5000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") ctx.save();
});
window.addEventListener("pagehide", () => ctx.save());

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
