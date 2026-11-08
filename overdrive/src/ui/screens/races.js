// Lista de circuitos y eventos.
import * as G from "../../core/state.js";
import { CIRCUITS, CIRCUIT_ORDER } from "../../core/data.js";
import { icon, trackSvg } from "../art.js";
import { el, $$, fmt } from "../dom.js";

export function difficulty(myIr, evIr) {
  const d = myIr - evIr;
  if (d >= 10) return { label: "Favorito", cls: "green" };
  if (d >= -4) return { label: "Parejo", cls: "cyan" };
  if (d >= -14) return { label: "Difícil", cls: "gold" };
  return { label: "Muy difícil", cls: "red" };
}

export default function races(ctx) {
  const s = ctx.state;
  const ir = G.carIR(s);
  const root = el(`<div>
    <div class="page-title">Carreras</div>
    <p class="page-sub">Sube al podio para desbloquear el siguiente evento. Tu IR: <b class="cyan">${ir}</b></p>
    <div data-list></div>
    <div class="card season" style="margin-top:14px">
      <span class="soon">PRÓXIMAMENTE</span>
      <div class="display" style="margin-top:6px">Liga y torneos</div>
      <p class="page-sub" style="margin:4px 0 0">Carreras contra fantasmas de otros jugadores, con autos normalizados por clase. Primero validamos que correr sea divertido.</p>
    </div>
  </div>`);
  const list = root.querySelector("[data-list]");
  for (const cid of CIRCUIT_ORDER) {
    const c = CIRCUITS[cid];
    const unlocked = G.circuitUnlocked(s, cid);
    const wins = c.events.filter((_, i) => (s.progress[G.eventId(cid, i)] || {}).wins > 0).length;
    const card = el(`<div class="card circuit ${unlocked ? "" : "locked"}">
      <div class="circuit-head">
        ${trackSvg(cid, c.color)}
        <div style="flex:1;min-width:0">
          <small style="color:${c.color};letter-spacing:.12em;text-transform:uppercase;font-weight:700">${c.region}</small>
          <h3>${c.name}</h3>
          <small>${c.style}</small>
          <div class="bar prog"><i style="width:${(wins / c.events.length) * 100}%"></i></div>
        </div>
        ${unlocked ? `<small class="muted">${wins}/${c.events.length}</small>` : `<span class="chip">${icon("lock")} Rep. ${c.unlockRep}</span>`}
      </div>
      ${unlocked ? `<div class="events">${c.events.map((ev, i) => {
        const id = G.eventId(cid, i);
        const p = s.progress[id];
        const open = G.eventUnlocked(s, cid, i);
        const state = p && p.wins > 0 ? "won" : p && p.best <= 3 ? "podium" : "";
        const dif = difficulty(ir, ev.ir);
        const rw = G.eventRewards(s, cid, i, 1);
        return `<button class="event ${state} ${ev.final ? "final" : ""}" data-ev="${cid}|${i}" ${open ? "" : "disabled"}>
          <span class="en">${state === "won" ? icon("trophy") : open ? i + 1 : icon("lock")}</span>
          <span class="et"><b>${ev.name}</b>
            <small>${ev.laps} vueltas · ${icon(ev.weather === "lluvia" ? "drop" : "sun")} ${ev.temp}°C ${open ? `· <span class="diff ${dif.cls}">${dif.label}</span>` : "· Podio en el anterior"}</small></span>
          <span class="er"><b>${ev.ir}</b>${open ? `<span class="gold">${fmt(rw.cr)} CR</span>` : "IR"}</span>
        </button>`;
      }).join("")}</div>` : ""}
    </div>`);
    list.appendChild(card);
  }
  $$(root, "[data-ev]").forEach((b) =>
    b.addEventListener("click", () => {
      const [circuitId, i] = b.dataset.ev.split("|");
      ctx.go("prerace", { circuitId, eventIdx: +i });
    })
  );
  return { root };
}
