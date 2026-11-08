// Bot de progresión: simula un jugador "razonable" que entra varias veces al día.
// Uso: node tools/progression-bot.mjs [días] [sesiones_por_día] [minutos_por_sesión]
import { CIRCUITS, CIRCUIT_ORDER, PART_ORDER, CARS } from "../src/core/data.js";
import * as G from "../src/core/state.js";
import { createRace, runToEnd, buildTrack } from "../src/core/race.js";

const DAYS = +(process.argv[2] || 7), PER_DAY = +(process.argv[3] || 5), MIN = +(process.argv[4] || 8);
let now = Date.UTC(2026, 0, 1, 8);
const s = G.newGame(now);
const log = (m) => console.log(`d${((now - Date.UTC(2026, 0, 1, 8)) / 864e5).toFixed(2)} cr=${Math.round(s.credits)} rep=${s.rep} IR=${G.carIR(s)} ${s.activeCar} | ${m}`);
const seen = new Set();
function setupFor(cid, i) {
  const ev = CIRCUITS[cid].events[i]; const d = ev.laps * buildTrack(cid).lapLen;
  let tire = "medio"; if (d < 6000 && ev.temp < 28) tire = "blando"; if (d > 8500 || ev.temp > 32) tire = "duro";
  return { tire, map: "balance", risk: ev.weather === "lluvia" ? "conservador" : "normal", nitro: "rectas" };
}
function spend() {
  for (let guard = 0; guard < 200; guard++) {
    // Construcción de autos
    for (const id of Object.keys(CARS)) {
      const st = G.carStatus(s, id, now);
      if (st.status === "ready") { G.claimBuild(s, id, now); G.selectCar(s, id); log("auto listo " + id); }
      if (st.status === "blueprint" && st.ok) { G.startBuild(s, id, now); log("construye " + id); }
    }
    const opts = [];
    for (const p of PART_ORDER) { const c = G.canUpgradePart(s, s.activeCar, p); if (c.ok) opts.push({ c: c.cost * 0.8, f: () => G.upgradePart(s, s.activeCar, p) }); }
    for (const b of ["taller", "oficina"]) { const c = G.canUpgradeBuilding(s, b); if (c.ok) opts.push({ c: c.cost * (b === "taller" ? 0.7 : 1.2), f: () => G.upgradeBuilding(s, b) }); }
    // Ahorra para un auto si hay plano pendiente
    const saving = s.blueprints.find((id) => !s.builds[id]);
    if (saving && s.credits - Math.min(...opts.map((o) => o.c), Infinity) < CARS[saving].build.cost && opts.length && Math.min(...opts.map(o=>o.c)) > CARS[saving].build.cost * 0.15) break;
    if (!opts.length) break;
    opts.sort((a, b) => a.c - b.c); opts[0].f();
  }
}
let seed = 1;
for (let d = 0; d < DAYS; d++) for (let k = 0; k < PER_DAY; k++) {
  now = Date.UTC(2026, 0, 1 + d, 8) + k * (14 / PER_DAY) * 36e5;
  G.tick(s, now); G.collect(s); spend();
  for (let m = 0; m < MIN; m++) {
    now += 60000; G.tick(s, now); G.collect(s);
    while (G.claimGoal(s));
    // Elige el evento más difícil desbloqueado aún no ganado (o el último)
    let pick = null;
    for (const cid of CIRCUIT_ORDER) CIRCUITS[cid].events.forEach((_, i) => { if (G.eventUnlocked(s, cid, i)) { const p = s.progress[G.eventId(cid, i)]; if (!p || p.wins === 0) pick = pick || [cid, i]; } });
    if (!pick) { // farmea el último desbloqueado
      for (const cid of CIRCUIT_ORDER) CIRCUITS[cid].events.forEach((_, i) => { if (G.eventUnlocked(s, cid, i)) pick = [cid, i]; });
    }
    if (s.garage[s.activeCar].condition < 70) G.repair(s);
    const [cid, i] = pick;
    const r = runToEnd(createRace({ circuitId: cid, eventIdx: i, seed: seed++, player: { name: "Bot", carId: s.activeCar, stats: G.activeStats(s), condition: s.garage[s.activeCar].condition, setup: setupFor(cid, i), color: "#fff" } }));
    const res = G.applyRace(s, cid, i, r);
    const id = G.eventId(cid, i);
    if (r.position === 1 && !seen.has(id)) { seen.add(id); log(`GANA ${id} (${s.progress[id].races} intentos) +${res.cr}`); }
    if (res.levelUps.length) log("rep " + res.levelUps.join(","));
    spend();
  }
}
log(`FIN ingreso/s=${G.incomePerSec(s).toFixed(1)} taller=${s.buildings.taller} oficina=${s.buildings.oficina} partes=${JSON.stringify(s.garage[s.activeCar].parts)}`);
