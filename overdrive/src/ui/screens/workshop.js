// Taller: mejoras del auto, edificios del garaje, pintura y construcción de autos.
import * as G from "../../core/state.js";
import { BUILDINGS, CARS, CIRCUITS, CLASSES, PAINTS, PARTS, PART_ORDER, STAT_KEYS, STAT_LABELS } from "../../core/data.js";
import { carSvg, icon } from "../art.js";
import { el, $, $$, fmt, fmtDuration, toast, vibrate } from "../dom.js";

const TABS = [
  ["parts", "Mejoras"],
  ["buildings", "Garaje"],
  ["paint", "Pintura"],
  ["cars", "Autos"],
];

export default function workshop(ctx, params) {
  const s = ctx.state;
  let tab = params.tab || "parts";
  const root = el(`<div>
    <div class="page-title">Taller</div>
    <p class="page-sub">Cada crédito invertido aquí se nota en la pista.</p>
    <div class="seg" role="tablist">${TABS.map(([id, l]) => `<button data-t="${id}" role="tab">${l}</button>`).join("")}</div>
    <div data-body></div>
  </div>`);
  const body = $(root, "[data-body]");

  function render() {
    $$(root, "[data-t]").forEach((b) => b.classList.toggle("on", b.dataset.t === tab));
    body.innerHTML = "";
    body.appendChild({ parts, buildings, paint, cars }[tab]());
  }
  $$(root, "[data-t]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.t; render(); }));

  function parts() {
    const carId = s.activeCar;
    const stats = G.activeStats(s);
    const max = G.partMax(s, carId);
    const node = el(`<div>
      <div class="section-title"><h2>${CARS[carId].name}</h2><small>IR <b class="cyan">${G.carIR(s)}</b> · tope de nivel ${max}/${CARS[carId].maxLevel}</small></div>
      <div class="card stats">${STAT_KEYS.map((k) => `
        <div class="stat"><span>${STAT_LABELS[k]}</span><div class="bar cyan"><i style="width:${Math.min(100, (stats[k] / 140) * 100)}%"></i></div><b>${Math.round(stats[k])}</b></div>`).join("")}
      </div>
      <div class="section-title"><h2>Piezas</h2><small>Sube la reputación para pasar el tope</small></div>
      <div data-list></div>
    </div>`);
    const list = $(node, "[data-list]");
    for (const pid of PART_ORDER) {
      const p = PARTS[pid];
      const lvl = s.garage[carId].parts[pid];
      const chk = G.canUpgradePart(s, carId, pid);
      const locked = chk.reason === "locked";
      const effect = Object.entries(p.per).map(([k, v]) => `+${v} ${STAT_LABELS[k].slice(0, 3).toLowerCase()}`).join(" · ");
      const pips = Array.from({ length: CARS[carId].maxLevel }, (_, i) => `<i class="${i < lvl ? "on" : i >= max ? "cap" : ""}"></i>`).join("");
      let btn;
      if (locked) btn = `<button class="btn sm" disabled>${icon("lock")}<small>Rep. ${chk.rep}</small></button>`;
      else if (chk.reason === "max") btn = `<button class="btn sm" disabled>MÁX</button>`;
      else if (chk.reason === "rep") btn = `<button class="btn sm" disabled>${icon("lock")}<small>Sube rep.</small></button>`;
      else {
        const cost = G.partCost(carId, pid, lvl);
        btn = `<button class="btn ${chk.ok ? "primary" : ""} sm" data-up="${pid}" ${chk.ok ? "" : "disabled"}>Nv ${lvl + 1}<small><span class="cost">${fmt(cost)} CR</span></small></button>`;
      }
      list.appendChild(el(`<div class="card part ${locked ? "locked" : ""}">
        <div class="pi">${p.icon}</div>
        <div class="pt"><b>${p.name}</b> <span class="muted">Nv ${lvl}</span><small>${locked ? `Se desbloquea con reputación ${p.unlockRep}` : `${p.desc} ${effect}`}</small><div class="lvl-pips">${pips}</div></div>
        ${btn}
      </div>`));
    }
    $$(node, "[data-up]").forEach((b) =>
      b.addEventListener("click", () => {
        const r = G.upgradePart(s, carId, b.dataset.up);
        if (r.ok) {
          vibrate(15);
          toast(`${icon("bolt")} ${PARTS[b.dataset.up].name} mejorado · IR ${G.carIR(s)}`, "good");
          ctx.save();
          render();
        }
      })
    );
    return node;
  }

  function buildings() {
    const node = el(`<div><div class="section-title"><h2>Tu garaje</h2><small>Motor de ingresos pasivos</small></div></div>`);
    for (const id of ["taller", "oficina"]) {
      const b = BUILDINGS[id];
      const lvl = s.buildings[id];
      const chk = G.canUpgradeBuilding(s, id);
      const max = G.buildingMax(s, id);
      let now, next;
      if (id === "taller") {
        now = `${G.incomePerSec(s).toFixed(2).replace(".", ",")} CR/s`;
        const t = { ...s, buildings: { ...s.buildings, taller: lvl + 1 } };
        next = `${G.incomePerSec(t).toFixed(2).replace(".", ",")} CR/s`;
      } else {
        now = `${G.capHours(s)} h de caja`;
        next = `${G.capHours(s) + 1} h de caja`;
      }
      const btn = chk.reason === "max"
        ? `<button class="btn sm" disabled>${lvl >= (b.maxLevel || 999) ? "MÁX" : `${icon("lock")}<small>Sube rep.</small>`}</button>`
        : `<button class="btn ${chk.ok ? "primary" : ""} sm" data-b="${id}" ${chk.ok ? "" : "disabled"}>Nv ${lvl + 1}<small><span class="cost">${fmt(G.buildingCost(id, lvl))} CR</span></small></button>`;
      node.appendChild(el(`<div class="card part">
        <div class="pi">${icon(id === "taller" ? "wrench" : "timer")}</div>
        <div class="pt"><b>${b.name}</b> <span class="muted">Nv ${lvl}/${max}</span><small>${b.desc}</small><small>Ahora: <b class="green">${now}</b>${chk.reason === "max" ? "" : ` → ${next}`}</small></div>
        ${btn}
      </div>`));
    }
    node.appendChild(el(`<p class="page-sub" style="margin-top:12px">El nivel máximo del Taller sube con tu reputación: ganar carreras es lo que hace crecer el negocio.</p>`));
    $$(node, "[data-b]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const r = G.upgradeBuilding(s, btn.dataset.b);
        if (r.ok) {
          vibrate(15);
          toast(`${BUILDINGS[btn.dataset.b].name} nivel ${s.buildings[btn.dataset.b]}`, "good");
          ctx.save();
          render();
        }
      })
    );
    return node;
  }

  function paint() {
    const carId = s.activeCar;
    const node = el(`<div>
      <div class="section-title"><h2>Pintura</h2><small>Gratis en el prototipo</small></div>
      <div class="card paint-preview" data-prev>${carSvg(CARS[carId].shape, s.garage[carId].paint)}</div>
      <div class="paints" style="margin:14px 0 26px">${PAINTS.map((p) => `<button class="paint ${s.garage[carId].paint === p.color ? "on" : ""}" style="background:${p.color}" data-c="${p.color}" aria-label="${p.name}"><span>${p.name}</span></button>`).join("")}</div>
      <p class="page-sub">Próximamente: vinilos, llantas, luces, humo de neumáticos y ediciones de temporada. La personalización nunca cambia el rendimiento.</p>
    </div>`);
    $$(node, "[data-c]").forEach((b) =>
      b.addEventListener("click", () => {
        G.setPaint(s, carId, b.dataset.c);
        ctx.save();
        render();
      })
    );
    return node;
  }

  function cars() {
    const node = el(`<div><div class="section-title"><h2>Colección</h2><small>Todos se consiguen corriendo</small></div></div>`);
    for (const id of Object.keys(CARS)) {
      const def = CARS[id];
      const st = G.carStatus(s, id, ctx.now());
      const cls = CLASSES[def.cls];
      let action = "";
      if (st.status === "owned") action = id === s.activeCar ? `<span class="chip">En uso</span>` : `<button class="btn sm" data-sel="${id}">Usar</button>`;
      else if (st.status === "building") action = `<span class="chip">${icon("timer")} <span data-left="${id}">${fmtDuration(st.left)}</span></span>`;
      else if (st.status === "ready") action = `<button class="btn gold sm" data-claim="${id}">Recibir</button>`;
      else if (st.status === "blueprint") action = `<button class="btn ${st.ok ? "primary" : ""} sm" data-build="${id}" ${st.ok ? "" : "disabled"}>Construir<small><span class="cost">${fmt(st.cost)} CR · ${def.build.minutes} min</span></small></button>`;
      else action = `<span class="chip">${icon("lock")} Plano</span>`;
      const how = def.unlock ? `Plano: gana «${eventName(def.unlock.event)}»` : "Auto inicial";
      node.appendChild(el(`<div class="card build-card">
        ${carSvg(def.shape, s.garage[id] ? s.garage[id].paint : st.status === "locked" ? "#1d232c" : def.defaultPaint, { glow: st.status !== "locked" })}
        <div style="flex:1;min-width:0">
          <b>${def.name}</b> <span class="chip" style="color:${cls.color}">${def.cls}</span>
          <small class="muted" style="display:block;font-size:12px;margin:3px 0 8px">${def.blurb}<br>${how} · tope Nv ${def.maxLevel}</small>
          ${action}
        </div>
      </div>`));
    }
    $$(node, "[data-sel]").forEach((b) => b.addEventListener("click", () => { G.selectCar(s, b.dataset.sel); ctx.save(); render(); }));
    $$(node, "[data-build]").forEach((b) =>
      b.addEventListener("click", () => {
        if (G.startBuild(s, b.dataset.build, ctx.now())) {
          toast(`${icon("wrench")} Construcción iniciada`, "good");
          ctx.save();
          render();
        }
      })
    );
    $$(node, "[data-claim]").forEach((b) =>
      b.addEventListener("click", () => {
        if (G.claimBuild(s, b.dataset.claim, ctx.now())) {
          G.selectCar(s, b.dataset.claim);
          toast(`${icon("star")} ¡${CARS[b.dataset.claim].name} es tuyo!`, "good");
          ctx.save();
          render();
        }
      })
    );
    return node;
  }

  function eventName(evId) {
    const [cid, n] = evId.split("-");
    return CIRCUITS[cid].events[+n - 1].name;
  }

  render();
  return {
    root,
    update() {
      if (tab === "parts" || tab === "buildings") {
        // Rehabilita botones si alcanzan los créditos (sin re-render completo).
        $$(root, "[data-up]").forEach((b) => {
          const ok = G.canUpgradePart(s, s.activeCar, b.dataset.up).ok;
          b.disabled = !ok;
          b.classList.toggle("primary", ok);
        });
        $$(root, "[data-b]").forEach((b) => {
          const ok = G.canUpgradeBuilding(s, b.dataset.b).ok;
          b.disabled = !ok;
          b.classList.toggle("primary", ok);
        });
      }
      if (tab === "cars") {
        $$(root, "[data-left]").forEach((n) => {
          const st = G.carStatus(s, n.dataset.left, ctx.now());
          if (st.status === "building") n.textContent = fmtDuration(st.left);
          else render();
        });
      }
    },
  };
}
