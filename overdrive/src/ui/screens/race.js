// Carrera en vivo: la simulación corre paso a paso y el canvas la dibuja.
// El jugador puede intervenir en un único punto: el nitro manual.
import * as G from "../../core/state.js";
import { CIRCUITS, RACE } from "../../core/data.js";
import { createRace, stepRace, standings, raceResult, requestNitro, trackGeometry, pointAt, runToEnd } from "../../core/race.js";
import { kmh } from "../../core/stats.js";
import { el, $, vibrate } from "../dom.js";

const SPEEDS = { 1: 4, 2: 10 }; // segundos simulados por segundo real

export default function liveRace(ctx, { circuitId, eventIdx, setup }) {
  const s = ctx.state;
  const c = CIRCUITS[circuitId];
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  const race = createRace({
    circuitId,
    eventIdx,
    seed,
    player: { name: s.name, carId: s.activeCar, stats: G.activeStats(s), condition: s.garage[s.activeCar].condition, setup, color: s.garage[s.activeCar].paint },
  });
  const me = race.cars.find((x) => x.isPlayer);
  const manual = setup.nitro === "manual";

  const root = el(`<div class="race">
    <canvas></canvas>
    <div class="race-top">
      <div class="race-pos"><b data-pos>-</b><span>/${race.cars.length}</span></div>
      <div class="race-lap"><small>VUELTA</small><b data-lap>1/${race.ev.laps}</b><small>${c.name}</small></div>
    </div>
    <div class="race-board" data-board></div>
    <div class="race-ctrl">
      <button data-speed="1" class="on">x1</button>
      <button data-speed="2">x2</button>
      <button data-skip>Saltar</button>
    </div>
    <div class="race-callout" data-callout></div>
    <div class="countdown" data-count></div>
    <div class="race-bottom">
      <div class="gauges">
        <div class="speed num"><span data-speed-v>0</span><small>km/h</small></div>
        <div class="gauge-row"><span>Nitro</span><div class="bar cyan"><i data-nitro style="width:100%"></i></div></div>
        <div class="gauge-row"><span>Neumáticos</span><div class="bar green"><i data-tire style="width:100%"></i></div></div>
      </div>
      ${manual
        ? `<button class="nitro-btn" data-nos disabled>NITRO<small data-charges>x2</small></button>`
        : `<div class="nitro-auto">NITRO AUTO<b>${RACE.nitroPlans[setup.nitro].name}</b></div>`}
    </div>
  </div>`);
  const canvas = $(root, "canvas");
  const g = canvas.getContext("2d");
  const geom = trackGeometry(race.track, 4);
  const lapLen = race.track.lapLen;
  let layout = null, staticLayer = null;
  const trails = race.cars.map(() => []);

  function computeLayout() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of geom) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    const padTop = 110, padSide = 28, padBottom = 20;
    const sc = Math.min((w - padSide * 2) / (maxX - minX), (h - padTop - padBottom) / (maxY - minY));
    const ox = (w - (maxX - minX) * sc) / 2, oy = padTop + (h - padTop - padBottom - (maxY - minY) * sc) / 2;
    layout = { dpr, w, h, sc, tx: (x) => ox + (x - minX) * sc, ty: (y) => oy + (maxY - y) * sc };
    drawStatic();
  }

  function drawStatic() {
    const { dpr, w, h, tx, ty } = layout;
    staticLayer = document.createElement("canvas");
    staticLayer.width = canvas.width;
    staticLayer.height = canvas.height;
    const k = staticLayer.getContext("2d");
    k.scale(dpr, dpr);
    // Fondo: asfalto con rejilla sutil y brillo del color del circuito.
    const bg = k.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.45, Math.max(w, h) * 0.7);
    bg.addColorStop(0, "#111821");
    bg.addColorStop(1, "#05070a");
    k.fillStyle = bg;
    k.fillRect(0, 0, w, h);
    k.strokeStyle = "rgba(255,255,255,0.025)";
    k.lineWidth = 1;
    for (let x = 0; x < w; x += 28) { k.beginPath(); k.moveTo(x, 0); k.lineTo(x, h); k.stroke(); }
    for (let y = 0; y < h; y += 28) { k.beginPath(); k.moveTo(0, y); k.lineTo(w, y); k.stroke(); }
    const path = () => {
      k.beginPath();
      geom.forEach((p, i) => (i ? k.lineTo(tx(p.x), ty(p.y)) : k.moveTo(tx(p.x), ty(p.y))));
      k.closePath();
    };
    k.lineJoin = "round";
    k.lineCap = "round";
    // Resplandor
    path(); k.strokeStyle = c.color + "22"; k.lineWidth = 34; k.stroke();
    // Bordes y asfalto
    path(); k.strokeStyle = "#d9dee5"; k.lineWidth = 20; k.stroke();
    path(); k.strokeStyle = "#232a33"; k.lineWidth = 17; k.stroke();
    // Pianos en curvas
    k.lineWidth = 20;
    for (const seg of race.track.segments) {
      if (seg.type !== "C") continue;
      k.beginPath();
      let first = true;
      for (const p of geom) {
        if (p.s < seg.start || p.s > seg.end) continue;
        first ? k.moveTo(tx(p.x), ty(p.y)) : k.lineTo(tx(p.x), ty(p.y));
        first = false;
      }
      k.setLineDash([5, 5]);
      k.strokeStyle = "#e23b3b";
      k.stroke();
      k.setLineDash([]);
    }
    path(); k.strokeStyle = "#232a33"; k.lineWidth = 15; k.stroke();
    // Línea central
    path(); k.setLineDash([6, 10]); k.strokeStyle = "rgba(255,255,255,0.12)"; k.lineWidth = 1.2; k.stroke(); k.setLineDash([]);
    // Meta a cuadros
    const p0 = pointAt(geom, lapLen, 0);
    k.save();
    k.translate(tx(p0.x), ty(p0.y));
    k.rotate(-p0.angle + Math.PI / 2);
    for (let i = -4; i < 4; i++) for (let j = 0; j < 2; j++) {
      k.fillStyle = (i + j) % 2 ? "#fff" : "#111";
      k.fillRect(i * 2, j * 2 - 2, 2, 2);
    }
    k.restore();
  }

  function drawCar(car, idx) {
    const { tx, ty } = layout;
    const p = pointAt(geom, lapLen, Math.max(0, car.pos));
    const lane = ((idx % 3) - 1) * 4;
    const nx = -Math.sin(p.angle), ny = Math.cos(p.angle);
    const x = tx(p.x + (nx * lane) / layout.sc), y = ty(p.y + (ny * lane) / layout.sc);
    const tr = trails[idx];
    tr.push({ x, y });
    if (tr.length > (car.nitroBurn > 0 ? 14 : 7)) tr.shift();
    if (tr.length > 1) {
      g.beginPath();
      tr.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)));
      g.strokeStyle = car.nitroBurn > 0 ? "rgba(34,211,238,0.85)" : car.color + "55";
      g.lineWidth = car.nitroBurn > 0 ? 5 : 3;
      g.lineCap = "round";
      g.stroke();
    }
    g.save();
    g.translate(x, y);
    g.rotate(-p.angle);
    const L = car.isPlayer ? 13 : 11, W = car.isPlayer ? 7 : 6;
    if (car.isPlayer) {
      g.shadowColor = "#ff5a1f";
      g.shadowBlur = 16;
    }
    g.fillStyle = car.color;
    roundRect(g, -L / 2, -W / 2, L, W, 2.5);
    g.fill();
    g.shadowBlur = 0;
    g.fillStyle = "rgba(0,0,0,.55)";
    g.fillRect(-1, -W / 2 + 1, 3, W - 2);
    g.fillStyle = "#fff8";
    g.fillRect(L / 2 - 2, -W / 2 + 1, 1.5, W - 2);
    g.restore();
    if (car.mistakeFlash > 0) {
      g.beginPath();
      g.arc(x, y, 10 + (1.2 - car.mistakeFlash) * 14, 0, Math.PI * 2);
      g.strokeStyle = `rgba(255,210,63,${car.mistakeFlash / 1.2})`;
      g.lineWidth = 2;
      g.stroke();
    }
    if (car.isPlayer) {
      g.font = "700 11px Inter, sans-serif";
      g.fillStyle = "#fff";
      g.textAlign = "center";
      g.fillText("TÚ", x, y - 12);
    }
  }

  function frame() {
    if (!layout) return;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(staticLayer, 0, 0);
    g.setTransform(layout.dpr, 0, 0, layout.dpr, 0, 0);
    // Dibuja de atrás hacia adelante; el jugador encima.
    race.cars.forEach((car, i) => !car.isPlayer && drawCar(car, i));
    drawCar(me, race.cars.indexOf(me));
  }

  // ---------- HUD ----------
  const posEl = $(root, "[data-pos]"), lapEl = $(root, "[data-lap]"), spdEl = $(root, "[data-speed-v]");
  const nitroEl = $(root, "[data-nitro]"), tireEl = $(root, "[data-tire]"), board = $(root, "[data-board]");
  const nos = $(root, "[data-nos]"), callout = $(root, "[data-callout]");
  let lastCallout = 0;
  function say(text, color = "#fff", force = false) {
    const t = performance.now();
    if (!force && t - lastCallout < 900) return;
    lastCallout = t;
    callout.textContent = text;
    callout.style.color = color;
    callout.classList.remove("show");
    void callout.offsetWidth;
    callout.classList.add("show");
  }
  function hud() {
    const order = standings(race);
    const pos = order.indexOf(me) + 1;
    posEl.textContent = `P${pos}`;
    lapEl.textContent = `${Math.max(1, me.lap)}/${race.ev.laps}`;
    spdEl.textContent = kmh(me.v);
    nitroEl.style.width = `${(me.nitroLeft / me.nitroTotal) * 100}%`;
    tireEl.style.width = `${(1 - me.wear) * 100}%`;
    tireEl.parentElement.className = `bar ${me.wear > 0.65 ? "red" : "green"}`;
    const leader = order[0];
    board.innerHTML = order.map((car, i) => {
      const gap = i === 0 ? "" : car.finished && leader.finished ? `+${(car.finishTime - leader.finishTime).toFixed(1)}` : `+${((leader.pos - car.pos) / Math.max(20, car.v)).toFixed(1)}`;
      return `<div class="${car.isPlayer ? "me" : ""}"><b>${i + 1}</b><i style="background:${car.color}"></i>${car.isPlayer ? "Tú" : car.name.split(" ")[0]}<small>${gap}</small></div>`;
    }).join("");
    if (nos) {
      nos.disabled = !started || me.charges <= 0 || me.nitroBurn > 0 || me.finished;
      nos.classList.toggle("firing", me.nitroBurn > 0);
      $(nos, "[data-charges]").textContent = me.charges > 0 ? `x${me.charges}` : "—";
    }
  }

  // ---------- Bucle ----------
  let speed = SPEEDS[1], acc = 0, last = 0, raf = 0, started = false, finishing = false, ended = false;
  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dtReal = Math.min(0.1, (t - (last || t)) / 1000);
    last = t;
    if (started && !race.done) {
      acc += dtReal * speed;
      while (acc >= RACE.dt && !race.done) {
        acc -= RACE.dt;
        for (const e of stepRace(race)) onEvent(e);
      }
    }
    frame();
    hud();
    if (race.done && !ended) finish();
  }
  function onEvent(e) {
    if (e.type === "overtake") say(`P${e.place}`, "#3ddc97");
    else if (e.type === "overtaken") say(`P${e.place}`, "#ff8a3d");
    else if (e.type === "mistake" && e.car === me.id) { say("¡Error!", "#ffd23f", true); vibrate(40); }
    else if (e.type === "nitro" && e.car === me.id) { say("Nitro", "#22d3ee", true); vibrate(25); }
    else if (e.type === "finish" && !finishing) {
      finishing = true;
      say("¡Meta!", "#f5b83d", true);
      setTimeout(() => { if (!race.done) speed = 60; }, 1200); // el resto termina rápido
    }
  }
  function finish() {
    ended = true;
    const result = raceResult(race);
    const outcome = G.applyRace(s, circuitId, eventIdx, result);
    ctx.save();
    setTimeout(() => ctx.go("results", { circuitId, eventIdx, result, outcome, setup, carId: s.activeCar }), 700);
  }

  // ---------- Controles ----------
  root.querySelectorAll("[data-speed]").forEach((b) =>
    b.addEventListener("click", () => {
      speed = SPEEDS[b.dataset.speed];
      root.querySelectorAll("[data-speed]").forEach((x) => x.classList.toggle("on", x === b));
    })
  );
  $(root, "[data-skip]").addEventListener("click", () => {
    if (!started || ended) return;
    runToEnd(race);
  });
  if (nos) {
    const fire = (e) => {
      e.preventDefault();
      if (requestNitro(race)) vibrate(25);
    };
    nos.addEventListener("pointerdown", fire);
  }

  // Cuenta regresiva
  const count = $(root, "[data-count]");
  const steps = ["3", "2", "1", "¡YA!"];
  steps.forEach((txt, i) =>
    setTimeout(() => {
      if (ended) return;
      count.textContent = txt;
      count.style.color = i === 3 ? "#3ddc97" : "#fff";
      if (i === 3) {
        started = true;
        setTimeout(() => (count.textContent = ""), 500);
      }
    }, 300 + i * 550)
  );

  const onResize = () => computeLayout();
  requestAnimationFrame(() => {
    computeLayout();
    raf = requestAnimationFrame(loop);
  });
  window.addEventListener("resize", onResize);

  return {
    root,
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ended = true;
    },
  };
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

