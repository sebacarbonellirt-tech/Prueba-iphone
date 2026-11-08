// Resultados: recompensas, desbloqueos y el análisis del ingeniero.
import * as G from "../../core/state.js";
import { CARS, CIRCUITS, RACE } from "../../core/data.js";
import { icon } from "../art.js";
import { el, $, countUp, esc, fmt, fmtTime } from "../dom.js";
import { tireDot } from "./prerace.js";

/** Consejos concretos a partir de la telemetría. Máximo 3. */
export function coachTips(result, ev, myIr) {
  const tips = [];
  const t = result.player.tel;
  const st = result.player.setup;
  const cmp = result.compare;
  if (st.nitro === "manual" && t.manualUses === 0) tips.push("No tocaste el nitro: salió solo al final. Actívalo al <b>salir de una curva lenta hacia una recta larga</b>.");
  if (t.nitroWasted > 0.6) tips.push(`Gastaste <b>${t.nitroWasted.toFixed(1)} s de nitro en curvas</b>, donde no sirve y aumenta los errores.`);
  if (result.player.wear > 0.85) tips.push(`Neumáticos al ${Math.round((1 - result.player.wear) * 100)} % al final: perdiste agarre. Prueba un compuesto más duro o el mapa Eco.`);
  else if (result.player.wear < 0.3 && st.tire !== "blando" && result.position > 1) tips.push("Tus neumáticos llegaron casi nuevos: un compuesto más blando te daría más ritmo.");
  if (t.mistakes >= 3) tips.push(`<b>${t.mistakes} errores</b> en curva. Bajar el riesgo puede valer más que la velocidad.`);
  else if (t.mistakes === 0 && st.risk === "conservador" && result.position > 1) tips.push("Cero errores en modo Conservador: tienes margen para arriesgar más.");
  if (cmp) {
    if (cmp.curve > 1.2 && cmp.curve >= cmp.straight) tips.push(`Perdiste <b>${cmp.curve.toFixed(1)} s en curvas</b> frente al ganador. Neumáticos, Suspensión y Aerodinámica suben el Control.`);
    else if (cmp.straight > 1.2) tips.push(`Perdiste <b>${cmp.straight.toFixed(1)} s en rectas</b> frente al ganador. El Motor y la Transmisión ayudan aquí.`);
  }
  if (result.position > 1 && myIr < ev.ir - 8) tips.push(`Tu auto (IR ${myIr}) está por debajo del rival más fuerte (IR ${ev.ir}). Pasa por el Taller.`);
  if (!tips.length) tips.push(result.position === 1 ? "Carrera limpia. Prueba el siguiente evento o busca mejor tiempo." : "Estuviste cerca. Cambia una sola variable y vuelve a intentarlo.");
  return tips.slice(0, 3);
}

export default function results(ctx, { circuitId, eventIdx, result, outcome, setup, carId }) {
  const s = ctx.state;
  const c = CIRCUITS[circuitId];
  const ev = c.events[eventIdx];
  const pos = result.position;
  const verdicts = ["¡Victoria!", "Segundo lugar", "Podio", "Fuera del podio", "Fuera del podio", "Fuera del podio"];
  const myIr = G.carIR(s, carId);
  const tips = coachTips(result, ev, myIr);
  const nextOpen = eventIdx + 1 < c.events.length && G.eventUnlocked(s, circuitId, eventIdx + 1);
  const t = result.player.tel;

  const root = el(`<div class="results">
    <div class="res-hero ${pos === 1 ? "p1" : ""}">
      <div class="place">P${pos}</div>
      <div class="verdict">${verdicts[pos - 1]}</div>
      <small>${esc(ev.name)} · ${fmtTime(result.player.time)}${pos > 1 ? ` · +${result.order[pos - 1].gap.toFixed(2)} s` : ""}</small>
    </div>

    <div class="rewards">
      <div class="card reward"><b class="gold num" data-cr>0</b><small>Créditos</small>${outcome.firstWin ? `<div class="tag">1ª VICTORIA x2</div>` : ""}</div>
      <div class="card reward"><b class="num" data-xp style="color:var(--ember2)">0</b><small>Reputación XP</small><div class="tag" style="background:rgba(255,77,77,.15);color:#ff9a9a">Estado −${outcome.conditionLoss} %</div></div>
    </div>

    ${outcome.levelUps.map((lv) => `<div class="card levelup">
      <div class="display">Reputación ${lv}</div>
      <ul>${G.unlocksAtRep(lv).map((u) => `<li>${u}</li>`).join("")}</ul>
    </div>`).join("")}

    ${outcome.unlocks.map((u) => u.type === "blueprint"
      ? `<div class="card unlock"><div class="ui">${icon("star")}</div><div><b>¡Plano del ${CARS[u.carId].name}!</b><small>Constrúyelo en Taller → Autos (${fmt(CARS[u.carId].build.cost)} CR · ${CARS[u.carId].build.minutes} min).</small></div></div>`
      : `<div class="card unlock"><div class="ui">${icon("flag")}</div><div><b>Evento desbloqueado</b><small>${esc(u.name)}</small></div></div>`).join("")}

    <div class="section-title"><h2>Ingeniero</h2><small>Qué cambiar</small></div>
    <div class="card">
      <div class="insight">
        <div class="line"><span class="muted">Tu configuración</span><span>${tireDot(setup.tire)} ${RACE.maps[setup.map].name} · ${RACE.nitroPlans[setup.nitro].name} · ${RACE.risks[setup.risk].name}</span></div>
        <div class="line"><span class="muted">Velocidad máxima</span><span>${Math.round(t.maxV * 3.6)} km/h</span></div>
        <div class="line"><span class="muted">Errores en curva</span><span class="${t.mistakes ? "gold" : "green"}">${t.mistakes}</span></div>
        <div class="line"><span class="muted">Nitro en rectas / curvas</span><span>${(t.nitroUsed - t.nitroWasted).toFixed(1)} s / <span class="${t.nitroWasted > 0.6 ? "red" : ""}">${t.nitroWasted.toFixed(1)} s</span></span></div>
        <div class="line"><span class="muted">Neumáticos al final</span><span class="${result.player.wear > 0.8 ? "red" : ""}">${Math.round((1 - result.player.wear) * 100)} %</span></div>
        ${t.lapTimes.length ? `<div class="line"><span class="muted">Mejor vuelta</span><span>${fmtTime(Math.min(...t.lapTimes))}</span></div>` : ""}
      </div>
      <ul class="coach">${tips.map((x) => `<li>${x}</li>`).join("")}</ul>
    </div>

    <div class="section-title"><h2>Clasificación</h2></div>
    <div class="card classif">${result.order.map((o, i) => `
      <div class="${o.isPlayer ? "me" : ""}"><b>${i + 1}</b><span>${o.isPlayer ? "Tú" : esc(o.name)} <small>IR ${o.ir}</small></span>${tireDot(o.tire)}<small>${i === 0 ? fmtTime(o.time) : `+${o.gap.toFixed(2)}`}</small></div>`).join("")}
    </div>

    <div class="row" style="margin-top:14px">
      <button class="btn" data-retry>Repetir</button>
      <button class="btn" data-shop>${icon("wrench")} Taller</button>
    </div>
    ${nextOpen ? `<button class="btn primary block cta-race" data-next>Siguiente · ${esc(c.events[eventIdx + 1].name)}</button>` : `<button class="btn primary block cta-race" data-home>${icon("garage")} Al garaje</button>`}
  </div>`);

  countUp($(root, "[data-cr]"), outcome.cr, 900, "+");
  countUp($(root, "[data-xp]"), outcome.xp, 900, "+");
  $(root, "[data-retry]").addEventListener("click", () => ctx.go("prerace", { circuitId, eventIdx }));
  $(root, "[data-shop]").addEventListener("click", () => ctx.go("workshop"));
  const n = $(root, "[data-next]");
  if (n) n.addEventListener("click", () => ctx.go("prerace", { circuitId, eventIdx: eventIdx + 1 }));
  const h = $(root, "[data-home]");
  if (h) h.addEventListener("click", () => ctx.go("garage"));
  return { root };
}
