// Herramienta de balance: compara configuraciones en cada evento.
import { CIRCUITS, CIRCUIT_ORDER } from "../src/core/data.js";
import { createRace, runToEnd, eventRivals } from "../src/core/race.js";
import { carStats, performanceIndex } from "../src/core/stats.js";

const tires = ["blando", "medio", "duro"], maps = ["eco", "balance", "ataque"], risks = ["conservador", "normal", "agresivo"], nitros = ["salida", "rectas", "final"];
const stats = process.argv[2] ? JSON.parse(process.argv[2]) : null;
for (const cid of CIRCUIT_ORDER) {
  CIRCUITS[cid].events.forEach((ev, i) => {
    const st = stats || eventRivals(cid, i)[0].stats; // mismo nivel que el rival top
    const res = [];
    for (const tire of tires) for (const map of maps) for (const risk of risks) for (const nitro of nitros) {
      let time = 0, wins = 0;
      const N = +(process.env.N || 6);
      for (let s = 0; s < N; s++) {
        const r = runToEnd(createRace({ circuitId: cid, eventIdx: i, seed: 1000 + s, player: { name: "P", carId: "brisa", stats: st, condition: 100, setup: { tire, map, risk, nitro }, color: "#fff" } }));
        time += r.player.time; if (r.position === 1) wins++;
      }
      res.push({ k: `${tire}/${map}/${risk}/${nitro}`, time: time / N, wins });
    }
    res.sort((a, b) => a.time - b.time);
    const byTire = tires.map((t) => t + ":" + Math.min(...res.filter((r) => r.k.startsWith(t)).map((r) => r.time)).toFixed(1));
    console.log(`${cid}-${i + 1} ${ev.laps}v ${ev.temp}C ${ev.weather} | best ${res[0].k} ${res[0].time.toFixed(1)}s w${res[0].wins} | worst ${res.at(-1).k} ${res.at(-1).time.toFixed(1)} | ${byTire.join(" ")}`);
  });
}
