import { test } from "node:test";
import assert from "node:assert/strict";
import * as G from "../src/core/state.js";
import { createRace, stepRace, requestNitro, runToEnd, simulateRace, buildTrack, trackGeometry } from "../src/core/race.js";
import { carStats, performanceIndex } from "../src/core/stats.js";
import { CIRCUITS, CIRCUIT_ORDER, ECONOMY } from "../src/core/data.js";

const T0 = Date.UTC(2026, 0, 1);
const setup = { tire: "medio", map: "balance", risk: "normal", nitro: "rectas" };
const cfg = (over = {}) => ({
  circuitId: "brisa",
  eventIdx: 1,
  seed: 42,
  player: { name: "Test", carId: "brisa", stats: carStats("brisa", {}), condition: 100, setup, color: "#fff" },
  ...over,
});

test("la carrera es determinista con la misma semilla", () => {
  const a = simulateRace(cfg());
  const b = simulateRace(cfg());
  assert.equal(a.player.time, b.player.time);
  assert.deepEqual(a.order.map((o) => o.name), b.order.map((o) => o.name));
});

test("semillas distintas producen variación", () => {
  const times = new Set();
  for (let s = 0; s < 8; s++) times.add(simulateRace(cfg({ seed: s })).player.time.toFixed(3));
  assert.ok(times.size > 1);
});

test("una carrera con nitro manual se puede re-simular desde el registro de entradas", () => {
  const manual = { ...setup, nitro: "manual" };
  const live = createRace(cfg({ player: { ...cfg().player, setup: manual } }));
  while (!live.done) {
    if (live.tick === 300 || live.tick === 900) requestNitro(live);
    stepRace(live);
  }
  const liveRes = runToEnd(live);
  assert.equal(liveRes.inputs.length, 2);
  const replay = simulateRace(cfg({ player: { ...cfg().player, setup: manual } }), liveRes.inputs);
  assert.equal(replay.player.time, liveRes.player.time);
  assert.equal(replay.position, liveRes.position);
});

test("la geometría de cada pista cierra el circuito", () => {
  for (const cid of CIRCUIT_ORDER) {
    const g = trackGeometry(buildTrack(cid));
    const last = g[g.length - 1];
    assert.ok(Math.hypot(last.x, last.y) < 1e-6, cid);
    const total = CIRCUITS[cid].layout.filter((x) => x[0] === "C").reduce((a, x) => a + x[2], 0);
    assert.equal(total, 360, `${cid}: los ángulos deben sumar 360`);
  }
});

test("la estrategia importa: el blando gana en frío y corto, el duro en calor y largo", () => {
  const avg = (circuitId, eventIdx, tire) => {
    let t = 0;
    for (let s = 0; s < 6; s++) {
      const st = { ...setup, tire };
      t += simulateRace({ circuitId, eventIdx, seed: s, player: { name: "T", stats: carStats("kodiak", {}), condition: 100, setup: st, color: "#fff" } }).player.time;
    }
    return t / 6;
  };
  assert.ok(avg("cumbre", 1, "blando") < avg("cumbre", 1, "duro"), "cumbre-2 (9°C, 3 vueltas): blando");
  assert.ok(avg("brisa", 3, "duro") < avg("brisa", 3, "blando"), "brisa-4 (36°C, 4 vueltas): duro");
});

test("la caja se llena con el tiempo y respeta el tope offline", () => {
  const s = G.newGame(T0);
  s.box = 0;
  G.tick(s, T0 + 60_000);
  assert.ok(Math.abs(s.box - G.incomePerSec(s) * 60) < 1e-6);
  G.tick(s, T0 + 48 * 3600_000);
  assert.equal(s.box, G.boxCap(s));
  assert.equal(G.capHours(s), ECONOMY.capBaseHours);
});

test("cobrar mueve la caja a los créditos", () => {
  const s = G.newGame(T0);
  const before = s.credits;
  const got = G.collect(s);
  assert.equal(got, 90);
  assert.equal(s.credits, before + 90);
  assert.equal(s.box, 0);
});

test("mejorar una pieza cobra, sube el nivel y el IR", () => {
  const s = G.newGame(T0);
  s.credits = 10_000;
  const ir = G.carIR(s);
  const cost = G.partCost("brisa", "motor", 1);
  assert.ok(G.upgradePart(s, "brisa", "motor").ok);
  assert.equal(s.credits, 10_000 - cost);
  assert.equal(s.garage.brisa.parts.motor, 2);
  assert.ok(G.carIR(s) > ir);
});

test("las piezas respetan el bloqueo y el tope por reputación", () => {
  const s = G.newGame(T0);
  s.credits = 1e9;
  assert.equal(G.canUpgradePart(s, "brisa", "suspension").reason, "locked");
  while (G.upgradePart(s, "brisa", "motor").ok);
  assert.equal(s.garage.brisa.parts.motor, G.partMax(s, "brisa"));
  assert.equal(G.canUpgradePart(s, "brisa", "motor").reason, "rep");
});

test("los costos crecen más rápido que el ingreso (sin inflación descontrolada)", () => {
  const s = G.newGame(T0);
  let prevPayback = 0;
  for (let L = 1; L < 40; L++) {
    s.buildings.taller = L;
    const inc = G.incomePerSec(s);
    s.buildings.taller = L + 1;
    const delta = G.incomePerSec(s) - inc;
    const payback = G.buildingCost("taller", L) / delta;
    assert.ok(payback > prevPayback, `nivel ${L}`);
    prevPayback = payback;
  }
});

test("podio desbloquea el siguiente evento y la 1ª victoria paga doble", () => {
  const s = G.newGame(T0);
  assert.equal(G.eventUnlocked(s, "brisa", 1), false);
  const first = G.eventRewards(s, "brisa", 0, 1);
  const fake = { position: 1, player: { time: 100, wear: 0.3, tel: { mistakes: 0, manualUses: 0 }, setup } };
  G.applyRace(s, "brisa", 0, fake);
  assert.equal(G.eventUnlocked(s, "brisa", 1), true);
  const repeat = G.eventRewards(s, "brisa", 0, 1);
  assert.ok(first.cr > repeat.cr * 2);
});

test("ganar la final de Costanera entrega el plano del Kodiak R y se puede construir", () => {
  const s = G.newGame(T0);
  const fake = { position: 1, player: { time: 100, wear: 0.3, tel: { mistakes: 0, manualUses: 0 }, setup } };
  const out = G.applyRace(s, "brisa", 4, fake);
  assert.ok(out.unlocks.some((u) => u.carId === "kodiak"));
  s.credits = 1e6;
  assert.ok(G.startBuild(s, "kodiak", T0));
  assert.equal(G.carStatus(s, "kodiak", T0 + 1000).status, "building");
  assert.ok(G.claimBuild(s, "kodiak", T0 + 3 * 3600_000));
  assert.ok(s.garage.kodiak);
});

test("los autos nuevos parten mejores que el inicial", () => {
  const base = performanceIndex(carStats("brisa", {}));
  assert.ok(performanceIndex(carStats("kodiak", {})) > base + 30);
  assert.ok(performanceIndex(carStats("vespera", {})) > performanceIndex(carStats("kodiak", {})));
});

test("los objetivos avanzan y se cobran en orden", () => {
  const s = G.newGame(T0);
  assert.equal(G.currentGoal(s).id, "g1");
  assert.equal(G.claimGoal(s), null);
  G.collect(s);
  assert.ok(G.currentGoal(s).done);
  const before = s.credits;
  G.claimGoal(s);
  assert.equal(s.credits, before + 60);
  assert.equal(G.currentGoal(s).id, "g2");
});

test("migrar una partida antigua completa los campos faltantes", () => {
  const s = G.migrate({ credits: 500, garage: { brisa: { parts: { motor: 3 } } } }, T0);
  assert.equal(s.credits, 500);
  assert.equal(s.garage.brisa.parts.motor, 3);
  assert.equal(s.garage.brisa.parts.aero, 1);
  assert.equal(s.buildings.taller, 1);
});

test("el primer evento es ganable con el auto inicial y buena estrategia", () => {
  let wins = 0;
  for (let seed = 0; seed < 10; seed++) {
    const r = simulateRace({ circuitId: "brisa", eventIdx: 0, seed, player: { name: "T", stats: carStats("brisa", {}), condition: 100, setup: { tire: "blando", map: "balance", risk: "normal", nitro: "salida" }, color: "#fff" } });
    if (r.position === 1) wins++;
  }
  assert.ok(wins >= 5, `ganó ${wins}/10`);
});
