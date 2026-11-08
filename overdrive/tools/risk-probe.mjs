import { createRace, runToEnd, eventRivals } from "../src/core/race.js";
const [cid, ei] = [process.argv[2] || "cumbre", +(process.argv[3] || 1)];
const st = eventRivals(cid, ei)[0].stats;
for (const risk of ["conservador", "normal", "agresivo"]) {
  let t = 0, m = 0, w = 0; const N = 30;
  for (let s = 0; s < N; s++) { const r = runToEnd(createRace({ circuitId: cid, eventIdx: ei, seed: s, player: { name: "P", stats: st, condition: 100, setup: { tire: "medio", map: "balance", risk, nitro: "rectas" }, color: "#fff" } })); t += r.player.time; m += r.player.tel.mistakes; if (r.position === 1) w++; }
  console.log(risk, (t / N).toFixed(2), "errores", (m / N).toFixed(2), "victorias", w + "/" + N);
}
