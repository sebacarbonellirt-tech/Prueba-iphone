// Garaje: pantalla principal. El auto, la caja del taller (Idle) y el objetivo.
import * as G from "../../core/state.js";
import { CARS, CLASSES, CIRCUITS, CIRCUIT_ORDER } from "../../core/data.js";
import { carSvg, icon } from "../art.js";
import { el, $, $$, fmt, fmtDuration, toast, vibrate } from "../dom.js";

export function nextEvent(state) {
  let pick = null, last = null;
  for (const cid of CIRCUIT_ORDER) {
    CIRCUITS[cid].events.forEach((_, i) => {
      if (!G.eventUnlocked(state, cid, i)) return;
      last = { circuitId: cid, eventIdx: i };
      const p = state.progress[G.eventId(cid, i)];
      if (!pick && (!p || p.wins === 0)) pick = { circuitId: cid, eventIdx: i };
    });
  }
  return pick || last;
}

export default function garage(ctx) {
  const s = ctx.state;
  const carId = s.activeCar;
  const def = CARS[carId];
  const car = s.garage[carId];
  const cls = CLASSES[def.cls];
  const goal = G.currentGoal(s);
  const nxt = nextEvent(s);
  const nxtEv = CIRCUITS[nxt.circuitId].events[nxt.eventIdx];

  const otherCars = Object.keys(CARS).map((id) => ({ id, st: G.carStatus(s, id, ctx.now()) })).filter((c) => c.st.status !== "locked");

  const root = el(`<div>
    <section class="bay">
      <div class="stripes"></div>
      <div class="bay-head">
        <div>
          <div class="car-maker">${def.maker}</div>
          <div class="car-name">${def.name}</div>
          <span class="chip" style="color:${cls.color};border-color:${cls.color}55">${cls.label}</span>
        </div>
        <div class="ir"><small>ÍNDICE IR</small><b data-ir>${G.carIR(s)}</b></div>
      </div>
      ${carSvg(def.shape, car.paint)}
      ${otherCars.length > 1 ? `<div class="cars-row">${otherCars.map(({ id, st }) => `
        <button class="car-pill ${id === carId ? "active" : ""}" data-car="${id}">
          <i class="sw" style="background:${s.garage[id] ? s.garage[id].paint : CARS[id].defaultPaint}"></i>${CARS[id].name}
          ${st.status === "building" ? `<small class="muted" data-build-left="${id}">${fmtDuration(st.left)}</small>` : ""}
          ${st.status === "ready" ? `<small class="gold">¡Listo!</small>` : ""}
          ${st.status === "blueprint" ? `<small class="cyan">Plano</small>` : ""}
        </button>`).join("")}</div>` : ""}
      <div class="condition">
        <small>Estado</small>
        <div class="bar green" data-cond-bar><i style="width:${car.condition}%"></i></div>
        <small class="num" data-cond>${Math.floor(car.condition)} %</small>
        <button class="btn sm" data-repair>${icon("wrench")}<span data-repair-cost></span></button>
      </div>
    </section>


    <div class="section-title" style="margin-top:14px"><h2>Caja del taller</h2><small data-income></small></div>
    <div class="card box-card">
      <div class="top">
        <div>
          <div class="box-amount num"><span class="coin">CR</span><span data-box>0</span></div>
          <div class="box-meta" data-boxmeta></div>
        </div>
        <button class="btn gold" data-collect>Cobrar</button>
      </div>
      <div class="bar"><i data-boxbar></i></div>
      <div class="box-meta">Tu Taller de servicio (nivel ${s.buildings.taller}) trabaja aunque cierres el juego.</div>
    </div>

    ${goal ? `<div class="card goal ${goal.done ? "done" : ""}" style="margin-top:10px">
      <div class="gi">${icon(goal.done ? "star" : "flag")}</div>
      <div class="gt"><b>${goal.text}</b><small>${goal.done ? "¡Completado!" : `Progreso ${goal.progress}/${goal.target}`} · Premio ${goal.reward.cr ? `${fmt(goal.reward.cr)} CR` : ""}${goal.reward.xp ? ` + ${goal.reward.xp} XP` : ""}</small></div>
      ${goal.done ? `<button class="btn gold sm" data-claim>Cobrar</button>` : ""}
    </div>` : ""}
    <button class="btn primary cta-race" data-race>${icon("flag")} Correr · ${nxtEv.name}</button>
  </div>`);

  const boxCard = $(root, ".box-card");
  function update() {
    const cap = G.boxCap(s);
    $(root, "[data-box]").textContent = fmt(s.box);
    $(root, "[data-boxbar]").style.width = `${(s.box / cap) * 100}%`;
    const full = s.box >= cap * 0.999;
    boxCard.classList.toggle("full", full);
    const left = (cap - s.box) / G.incomePerSec(s);
    $(root, "[data-boxmeta]").textContent = full ? `¡Caja llena! Tope ${fmt(cap)} CR` : `Se llena en ${fmtDuration(left * 1000)} · tope ${fmt(cap)}`;
    $(root, "[data-income]").textContent = `+${G.incomePerSec(s) >= 10 ? fmt(G.incomePerSec(s)) : G.incomePerSec(s).toFixed(2).replace(".", ",")} CR/s`;
    const c = s.garage[carId].condition;
    $(root, "[data-cond]").textContent = `${Math.floor(c)} %`;
    $(root, "[data-cond-bar] i").style.width = `${c}%`;
    $(root, "[data-cond-bar]").className = `bar ${c < 50 ? "red" : "green"}`;
    const rc = G.repairCost(s);
    const rb = $(root, "[data-repair]");
    rb.style.visibility = rc > 0 ? "visible" : "hidden";
    rb.disabled = rc <= 0 || s.credits < rc;
    $(root, "[data-repair-cost]").textContent = rc > 0 ? fmt(rc) : "OK";
    $$(root, "[data-build-left]").forEach((n) => {
      const st = G.carStatus(s, n.dataset.buildLeft, ctx.now());
      if (st.status === "building") n.textContent = fmtDuration(st.left);
      else ctx.refresh();
    });
  }
  update();

  $(root, "[data-collect]").addEventListener("click", (e) => {
    const got = G.collect(s);
    if (got <= 0) return toast("La caja está vacía. Vuelve en un rato.");
    vibrate(15);
    const b = el(`<div class="coin-burst">+${fmt(got)}</div>`);
    const r = e.currentTarget.getBoundingClientRect(), a = document.getElementById("app").getBoundingClientRect();
    b.style.left = `${r.left - a.left + 10}px`;
    b.style.top = `${r.top - a.top - 10}px`;
    document.getElementById("app").appendChild(b);
    setTimeout(() => b.remove(), 1000);
    ctx.save();
    update();
    if (goal && !goal.done && G.currentGoal(s).done) ctx.refresh();
  });
  $(root, "[data-repair]").addEventListener("click", () => {
    if (G.repair(s)) {
      toast(`${icon("wrench")} Auto reparado al 100 %`, "good");
      ctx.save();
      update();
    }
  });
  const claim = $(root, "[data-claim]");
  if (claim)
    claim.addEventListener("click", () => {
      const g = G.claimGoal(s);
      if (!g) return;
      vibrate(30);
      toast(`${icon("star")} +${fmt(g.reward.cr || 0)} CR${g.reward.xp ? ` · +${g.reward.xp} XP` : ""}`, "good");
      ctx.save();
      ctx.refresh();
    });
  $(root, "[data-race]").addEventListener("click", () => ctx.go("prerace", nxt));
  $$(root, "[data-car]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.car;
      const st = G.carStatus(s, id, ctx.now());
      if (st.status === "owned") {
        G.selectCar(s, id);
        ctx.save();
        ctx.refresh();
      } else if (st.status === "ready") {
        G.claimBuild(s, id, ctx.now());
        G.selectCar(s, id);
        ctx.save();
        toast(`${icon("star")} ¡${CARS[id].name} entra a tu garaje!`, "good");
        ctx.refresh();
      } else {
        ctx.go("workshop", { tab: "cars" });
      }
    })
  );

  return { root, update };
}
