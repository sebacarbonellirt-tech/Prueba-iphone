// Pre-carrera: lectura de pista, rivales y configuración estratégica.
import * as G from "../../core/state.js";
import { CIRCUITS, RACE, CARS } from "../../core/data.js";
import { eventRivals, trackReading } from "../../core/race.js";
import { performanceIndex } from "../../core/stats.js";
import { icon, trackSvg } from "../art.js";
import { el, $, $$, esc, fmt } from "../dom.js";
import { difficulty } from "./races.js";

const GROUPS = [
  { key: "tire", label: "Neumáticos", src: RACE.tires },
  { key: "map", label: "Mapa de potencia", src: RACE.maps },
  { key: "nitro", label: "Plan de nitro", src: RACE.nitroPlans },
  { key: "risk", label: "Riesgo", src: RACE.risks },
];

export function tireDot(t) {
  const d = RACE.tires[t];
  return `<span class="tire-dot" style="border-color:${d.color};color:${d.color}">${d.short}</span>`;
}

export default function prerace(ctx, { circuitId, eventIdx }) {
  const s = ctx.state;
  const c = CIRCUITS[circuitId];
  const ev = c.events[eventIdx];
  const reading = trackReading(circuitId, eventIdx);
  const rivals = eventRivals(circuitId, eventIdx);
  const myIr = G.carIR(s);
  const dif = difficulty(myIr, ev.ir);
  const setup = { ...s.lastSetup };
  const cond = s.garage[s.activeCar].condition;
  const rw = G.eventRewards(s, circuitId, eventIdx, 1);
  const grid = [
    ...rivals.map((r) => ({ name: r.name, color: r.color, ir: performanceIndex(r.stats), tire: r.setup.tire })),
    { name: `${s.name} · ${CARS[s.activeCar].name}`, color: s.garage[s.activeCar].paint, ir: myIr, me: true, tire: null },
  ].sort((a, b) => b.ir - a.ir);

  const root = el(`<div>
    <section class="pre-hero">
      <button class="back" data-back>${icon("back")} Carreras</button>
      ${trackSvg(circuitId, c.color)}
      <small style="color:${c.color};letter-spacing:.12em;text-transform:uppercase;font-weight:700">${c.name}</small>
      <div class="page-title" style="font-size:30px;max-width:72%">${ev.name}</div>
      <div class="conds">
        <span class="chip">${ev.laps} vueltas · ${(reading.distance / 1000).toFixed(1)} km</span>
        <span class="chip">${icon(ev.weather === "lluvia" ? "drop" : "sun")} ${ev.weather === "lluvia" ? "Lluvia" : "Seco"} ${ev.temp}°C</span>
        <span class="chip">${Math.round(reading.curveShare * 100)} % curvas</span>
        <span class="chip ${dif.cls}">${dif.label}</span>
      </div>
    </section>

    <div class="section-title"><h2>Lectura de pista</h2><small>Tu ingeniero dice</small></div>
    <div class="card"><ul class="tips">${reading.tips.map((t) => `<li>${t}</li>`).join("")}</ul></div>

    <div class="section-title"><h2>Parrilla</h2><small>Premio: <b class="gold">${fmt(rw.cr)} CR</b>${rw.firstWin ? " (1ª victoria x2)" : ""}</small></div>
    <div class="card vs">${grid.map((g) => `
      <div class="vs-row ${g.me ? "me" : ""}">
        <span class="who"><i style="background:${g.color}"></i>${esc(g.name)}</span>
        ${g.tire ? tireDot(g.tire) : `<span data-mytire>${tireDot(setup.tire)}</span>`}
        <b>${g.ir}</b>
      </div>`).join("")}
    </div>

    <div class="section-title"><h2>Estrategia</h2><small>Las decisiones pesan</small></div>
    ${GROUPS.map((g) => `
      <div class="setup-group" data-group="${g.key}">
        <label>${g.label}</label>
        <div class="opts">${Object.entries(g.src).map(([k, v]) => `<button class="opt" data-k="${k}">${g.key === "tire" ? tireDot(k) : ""}${v.name}</button>`).join("")}</div>
        <div class="opt-desc" data-desc></div>
      </div>`).join("")}

    ${cond < 70 ? `<div class="card" style="border-color:rgba(255,77,77,.4)"><b class="red">Auto al ${Math.floor(cond)} %.</b> <span class="muted">El desgaste resta hasta un 8 % de rendimiento. Repara en el Garaje o espera: se recupera solo.</span></div>` : ""}

    <div class="go-bar"><button class="btn primary block cta-race" data-go>${icon("flag")} A la pista</button></div>
  </div>`);

  function paint() {
    for (const g of GROUPS) {
      const box = $(root, `[data-group="${g.key}"]`);
      $$(box, ".opt").forEach((b) => b.classList.toggle("on", b.dataset.k === setup[g.key]));
      $(box, "[data-desc]").textContent = g.src[setup[g.key]].desc;
    }
    $(root, "[data-mytire]").innerHTML = tireDot(setup.tire);
  }
  for (const g of GROUPS) {
    $$(root, `[data-group="${g.key}"] .opt`).forEach((b) =>
      b.addEventListener("click", () => {
        setup[g.key] = b.dataset.k;
        paint();
      })
    );
  }
  paint();
  $(root, "[data-back]").addEventListener("click", () => ctx.go("races"));
  $(root, "[data-go]").addEventListener("click", () => {
    s.lastSetup = { ...setup };
    ctx.save();
    ctx.go("race", { circuitId, eventIdx, setup });
  });
  return { root };
}
