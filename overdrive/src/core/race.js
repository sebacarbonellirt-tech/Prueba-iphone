// Simulación determinista de carreras.
// - Paso fijo (RACE.dt). Misma semilla + misma configuración + mismas entradas
//   => mismo resultado, en el cliente y en un futuro servidor.
// - Sin DOM: la interfaz solo lee el estado y dibuja.
import { CIRCUITS, RACE, RIVALS } from "./data.js";
import { createRng, mixSeed } from "./rng.js";
import { physics, performanceIndex } from "./stats.js";

const DEG = Math.PI / 180;

/** Construye los tramos con su posición dentro de la vuelta. */
export function buildTrack(circuitId) {
  const c = CIRCUITS[circuitId];
  let s = 0;
  const segments = c.layout.map(([type, a, b], i) => {
    const seg =
      type === "S"
        ? { i, type: "S", len: a, r: Infinity, ang: 0 }
        : { i, type: "C", r: a, ang: b * DEG, len: Math.abs(b * DEG) * a };
    seg.start = s;
    s += seg.len;
    seg.end = s;
    return seg;
  });
  let longest = 0;
  segments.forEach((g, i) => {
    if (g.type === "S" && g.len > segments[longest].len) longest = i;
  });
  const curveLen = segments.filter((g) => g.type === "C").reduce((a, g) => a + g.len, 0);
  return { id: circuitId, segments, lapLen: s, longestStraight: longest, curveShare: curveLen / s };
}

/** Puntos (x,y) de la pista para dibujarla. Corrige el pequeño error de cierre. */
export function trackGeometry(track, step = 6) {
  const pts = [];
  let x = 0, y = 0, h = 0;
  for (const seg of track.segments) {
    const n = Math.max(2, Math.ceil(seg.len / step));
    for (let k = 0; k < n; k++) {
      const d = seg.len / n;
      if (seg.type === "S") {
        x += Math.cos(h) * d;
        y += Math.sin(h) * d;
      } else {
        const dh = (seg.ang / seg.len) * d;
        h += dh / 2;
        x += Math.cos(h) * d;
        y += Math.sin(h) * d;
        h += dh / 2;
      }
      pts.push({ x, y, s: seg.start + d * (k + 1), seg: seg.i });
    }
  }
  // Distribuye el error de cierre a lo largo de la vuelta para que cierre perfecto.
  const ex = pts[pts.length - 1].x, ey = pts[pts.length - 1].y;
  for (const p of pts) {
    const f = p.s / track.lapLen;
    p.x -= ex * f;
    p.y -= ey * f;
  }
  pts.unshift({ x: 0, y: 0, s: 0, seg: 0 });
  return pts;
}

/** Posición y orientación en la pista para una distancia dentro de la vuelta. */
export function pointAt(geom, lapLen, dist) {
  const s = ((dist % lapLen) + lapLen) % lapLen;
  let lo = 0, hi = geom.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (geom[mid].s <= s) lo = mid;
    else hi = mid;
  }
  const a = geom[lo], b = geom[hi];
  const f = (s - a.s) / (b.s - a.s || 1);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

/** Rivales de un evento. Fijos por evento, para que el jugador pueda estudiarlos. */
export function eventRivals(circuitId, eventIdx) {
  const ev = CIRCUITS[circuitId].events[eventIdx];
  const rng = createRng(mixSeed("rivals", circuitId, eventIdx));
  const pool = RIVALS.slice();
  const picks = [];
  for (let k = 0; k < ev.rivals; k++) picks.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  const track = buildTrack(circuitId);
  return picks.map((r, k) => {
    const tmpl = { vel: 40, acc: 40, ctl: 40, res: 40, efi: 40 };
    for (const [key, m] of Object.entries(r.bias)) tmpl[key] *= m;
    // El más fuerte del grupo llega al IR objetivo; el resto un poco por debajo.
    const spread = k === 0 ? 1 : 0.9 + rng() * 0.08;
    const scale = (ev.ir * spread) / performanceIndex(tmpl);
    const stats = {};
    for (const key of Object.keys(tmpl)) stats[key] = Math.round(tmpl[key] * scale * 10) / 10;
    return { name: r.name, color: r.color, stats, setup: rivalSetup(rng, ev, track) };
  });
}

function rivalSetup(rng, ev, track) {
  const dist = ev.laps * track.lapLen;
  let tire = "medio";
  if (dist < 6000 && ev.temp < 28) tire = "blando";
  if (dist > 8500 || ev.temp > 32) tire = "duro";
  if (rng() < 0.3) tire = ["blando", "medio", "duro"][Math.floor(rng() * 3)];
  const maps = ["eco", "balance", "balance", "ataque"];
  const risks = ["conservador", "normal", "normal", "agresivo"];
  const nitros = ["salida", "rectas", "rectas", "final"];
  return {
    tire,
    map: maps[Math.floor(rng() * maps.length)],
    risk: risks[Math.floor(rng() * risks.length)],
    nitro: nitros[Math.floor(rng() * nitros.length)],
  };
}

/** Lectura de pista: pistas para que el jugador tome decisiones informadas. */
export function trackReading(circuitId, eventIdx) {
  const ev = CIRCUITS[circuitId].events[eventIdx];
  const track = buildTrack(circuitId);
  const dist = ev.laps * track.lapLen;
  const tips = [];
  if (track.curveShare > 0.3) tips.push("Muchas curvas: el control y el riesgo pesan más que la punta.");
  else tips.push("Rectas largas: velocidad punta y nitro en recta rinden mucho.");
  if (ev.temp >= 30) tips.push(`Asfalto a ${ev.temp}°C: los blandos se degradan muy rápido.`);
  else if (ev.temp <= 12) tips.push(`Frío (${ev.temp}°C): el duro cuesta calentarlo y pierde agarre.`);
  if (ev.weather === "lluvia") tips.push("Lluvia: menos agarre y el doble de errores. El modo agresivo es una apuesta.");
  if (dist > 8000) tips.push(`Carrera larga (${(dist / 1000).toFixed(1)} km): cuida los neumáticos.`);
  else if (dist < 5000) tips.push(`Carrera corta (${(dist / 1000).toFixed(1)} km): el nitro de salida y el blando son tentadores.`);
  return { distance: dist, curveShare: track.curveShare, laps: ev.laps, tips };
}

/**
 * Crea una carrera.
 * @param {{circuitId:string, eventIdx:number, seed:number,
 *   player:{name:string, carId:string, stats:object, condition:number, setup:object, color:string}}} cfg
 */
export function createRace(cfg) {
  const { circuitId, eventIdx, seed, player } = cfg;
  const ev = CIRCUITS[circuitId].events[eventIdx];
  const track = buildTrack(circuitId);
  const rivals = eventRivals(circuitId, eventIdx);
  const entrants = [
    ...rivals.map((r) => ({ ...r, isPlayer: false, condition: 100 })),
    { name: player.name, color: player.color, stats: player.stats, setup: player.setup, condition: player.condition, isPlayer: true, carId: player.carId },
  ];
  // Parrilla: ordenada por IR (el más fuerte adelante).
  entrants.sort((a, b) => performanceIndex(b.stats) - performanceIndex(a.stats));
  const cars = entrants.map((e, idx) => {
    const ph = physics(e.stats, e.condition);
    const mapCfg = RACE.maps[e.setup.map];
    const nitroTotal = ph.nitroSeconds * mapCfg.nitro;
    return {
      id: idx,
      name: e.name,
      color: e.color,
      isPlayer: e.isPlayer,
      ir: performanceIndex(e.stats),
      setup: { ...e.setup },
      ph,
      rng: createRng(mixSeed(seed, idx, e.name)),
      pos: -idx * 7, // separación de parrilla
      v: 0,
      seg: 0,
      lastSeg: -1,
      lap: 0,
      wear: 0,
      nitroTotal,
      nitroLeft: nitroTotal,
      nitroBurn: 0, // segundos que quedan de la activación actual
      charges: e.setup.nitro === "manual" ? 2 : 0,
      lastRectasLap: -1,
      mistakeFlash: 0,
      recover: 0,
      finished: false,
      finishTime: 0,
      tel: { straight: 0, curve: 0, maxV: 0, mistakes: 0, nitroUsed: 0, nitroWasted: 0, lapTimes: [], manualUses: 0 },
    };
  });
  return {
    circuitId,
    eventIdx,
    seed,
    ev,
    track,
    total: ev.laps * track.lapLen,
    weather: ev.weather,
    temp: ev.temp,
    cars,
    t: 0,
    tick: 0,
    done: false,
    inputs: [], // registro de entradas del jugador (para repetición/verificación)
    pending: [],
  };
}

/** El jugador pide nitro (modo manual). Se aplica en el próximo tick. */
export function requestNitro(race) {
  const p = race.cars.find((c) => c.isPlayer);
  if (!p || p.finished || p.setup.nitro !== "manual" || p.charges <= 0 || p.nitroBurn > 0) return false;
  race.pending.push({ tick: race.tick, type: "nitro" });
  return true;
}

function activateNitro(car, seconds) {
  const s = Math.min(seconds, car.nitroLeft);
  if (s <= 0.05) return false;
  car.nitroBurn = s;
  return true;
}

function segAt(track, s) {
  const lapPos = ((s % track.lapLen) + track.lapLen) % track.lapLen;
  const segs = track.segments;
  for (let i = 0; i < segs.length; i++) if (lapPos < segs[i].end) return { seg: segs[i], lapPos };
  return { seg: segs[segs.length - 1], lapPos };
}

function curveSpeed(car, seg, race) {
  return Math.sqrt(gripOf(car, race) * RACE.gravity * seg.r) * RACE.risks[car.setup.risk].corner;
}

function gripOf(car, race) {
  const tire = RACE.tires[car.setup.tire];
  let mu = car.ph.mu * tire.grip * (1 - 0.3 * car.wear * car.wear);
  if (race.weather === "lluvia") mu *= 0.8;
  if (car.setup.tire === "duro" && race.temp <= 12) mu *= 0.97;
  return mu;
}

/** Avanza un tick. Devuelve eventos para la interfaz (errores, nitro, adelantamientos). */
export function stepRace(race) {
  if (race.done) return [];
  const dt = RACE.dt;
  const events = [];
  const { track } = race;

  // Entradas del jugador para este tick.
  if (race.pending.length) {
    for (const inp of race.pending) {
      const p = race.cars.find((c) => c.isPlayer);
      if (inp.type === "nitro" && p.charges > 0 && p.nitroBurn <= 0) {
        if (activateNitro(p, p.nitroTotal / 2)) {
          p.charges--;
          p.tel.manualUses++;
          race.inputs.push({ tick: race.tick, type: "nitro" });
          events.push({ type: "nitro", car: p.id });
        }
      }
    }
    race.pending = [];
  }

  const before = standings(race).map((c) => c.id);

  for (const car of race.cars) {
    if (car.finished) continue;
    const { seg, lapPos } = segAt(track, Math.max(0, car.pos));
    const lap = Math.floor(Math.max(0, car.pos) / track.lapLen);
    const map = RACE.maps[car.setup.map];

    // Planes automáticos de nitro.
    const plan = car.setup.nitro;
    if (car.nitroBurn <= 0 && car.nitroLeft > 0.05) {
      let fire = 0;
      if (plan === "salida" && race.tick === 0) fire = car.nitroTotal;
      if (plan === "rectas" && seg.i === track.longestStraight && car.lastRectasLap !== lap) {
        car.lastRectasLap = lap;
        fire = car.nitroTotal / race.ev.laps;
      }
      if (plan === "final" && car.pos >= race.total * 0.8) fire = car.nitroLeft;
      if (plan === "manual" && car.pos >= race.total * 0.88) fire = car.nitroLeft;
      if (fire && activateNitro(car, fire)) {
        if (plan === "manual") car.charges = 0;
        if (car.isPlayer) events.push({ type: "nitro", car: car.id, auto: true });
      }
    }
    const nitroOn = car.nitroBurn > 0;

    // Velocidad objetivo: punta, curva actual y frenada para las curvas que vienen.
    const draft = slipstream(race, car, seg) ? 1.025 : 1;
    let vmax = car.ph.vmax * map.power * draft * (nitroOn ? RACE.nitro.speed : 1);
    let target = vmax;
    if (seg.type === "C") target = Math.min(target, curveSpeed(car, seg, race));
    let ahead = seg.end - lapPos;
    let idx = seg.i;
    for (let k = 0; k < 6 && ahead < 450; k++) {
      idx = (idx + 1) % track.segments.length;
      const nx = track.segments[idx];
      if (nx.type === "C") {
        const vc = curveSpeed(car, nx, race);
        target = Math.min(target, Math.sqrt(vc * vc + 2 * car.ph.brake * ahead));
      }
      ahead += nx.len;
    }

    if (car.v < target) {
      const rec = car.recover > 0 ? 0.35 : 1;
      const a = rec * car.ph.accel * map.power * (nitroOn ? RACE.nitro.accel : 1) * Math.max(0.06, 1 - (car.v / vmax) ** 2);
      car.v = Math.min(target, car.v + a * dt);
    } else {
      car.v = Math.max(target, car.v - car.ph.brake * 1.4 * dt);
    }

    // Error al entrar a una curva.
    if (seg.i !== car.lastSeg) {
      if (seg.type === "C" && car.pos > 0) {
        let p = RACE.baseMistake * RACE.risks[car.setup.risk].mistake * car.ph.mistakeMult * (1 + car.wear * 1.2);
        if (race.weather === "lluvia") p *= 2;
        if (nitroOn) p *= 1.8;
        p *= Math.min(1.6, 30 / seg.r); // curvas cerradas castigan más
        if (car.rng() < p) {
          car.v *= RACE.mistakeSpeedKeep;
          car.recover = RACE.mistakeRecover;
          car.tel.mistakes++;
          car.mistakeFlash = 1.2;
          events.push({ type: "mistake", car: car.id });
        }
      }
      car.lastSeg = seg.i;
    }

    // Desgaste de neumáticos.
    const tire = RACE.tires[car.setup.tire];
    const tempF = 0.55 + race.temp / 38;
    const lateral = seg.type === "C" ? 1.6 : 0.35;
    car.wear = Math.min(1, car.wear + dt * car.v * 1.5e-4 * tire.wear * map.wear * car.ph.wearMult * tempF * lateral);

    // Nitro.
    if (nitroOn) {
      const burn = Math.min(dt, car.nitroBurn);
      car.nitroBurn -= burn;
      car.nitroLeft = Math.max(0, car.nitroLeft - burn);
      car.tel.nitroUsed += burn;
      if (seg.type === "C") car.tel.nitroWasted += burn;
    }

    // Telemetría.
    if (seg.type === "C") car.tel.curve += dt;
    else car.tel.straight += dt;
    car.tel.maxV = Math.max(car.tel.maxV, car.v);
    if (car.mistakeFlash > 0) car.mistakeFlash -= dt;
    if (car.recover > 0) car.recover -= dt;

    const prevPos = car.pos;
    car.pos += car.v * dt;
    const newLap = Math.floor(Math.max(0, car.pos) / track.lapLen);
    if (prevPos >= 0 && newLap > Math.floor(prevPos / track.lapLen)) {
      const lapEndT = race.t + dt;
      const prevSum = car.tel.lapTimes.reduce((a, b) => a + b, 0);
      car.tel.lapTimes.push(lapEndT - prevSum);
    }
    car.lap = Math.min(race.ev.laps, newLap + 1);
    if (car.pos >= race.total) {
      car.finished = true;
      const over = (car.pos - race.total) / Math.max(1, car.v);
      car.finishTime = race.t + dt - over;
      car.pos = race.total;
      if (car.isPlayer) events.push({ type: "finish", car: car.id });
    }
  }

  race.t += dt;
  race.tick++;

  const after = standings(race).map((c) => c.id);
  const player = race.cars.find((c) => c.isPlayer);
  const pb = before.indexOf(player.id), pa = after.indexOf(player.id);
  if (race.tick > 40 && pa < pb) events.push({ type: "overtake", car: player.id, place: pa + 1 });
  if (race.tick > 40 && pa > pb) events.push({ type: "overtaken", car: player.id, place: pa + 1 });

  if (race.cars.every((c) => c.finished) || race.t >= RACE.maxTime) race.done = true;
  return events;
}

function slipstream(race, car, seg) {
  if (seg.type !== "S") return false;
  for (const o of race.cars) {
    if (o === car || o.finished) continue;
    const gap = o.pos - car.pos;
    if (gap > 2 && gap < 30) return true;
  }
  return false;
}

/** Orden actual: terminados por tiempo, luego por distancia recorrida. */
export function standings(race) {
  return race.cars.slice().sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.pos - a.pos;
  });
}

/** Ejecuta hasta el final (para "saltar", pruebas y verificación en servidor). */
export function runToEnd(race, inputs = null) {
  const queue = inputs ? inputs.slice() : null;
  while (!race.done) {
    if (queue) while (queue.length && queue[0].tick === race.tick) race.pending.push(queue.shift());
    stepRace(race);
  }
  return raceResult(race);
}

/** Simulación completa desde cero. Determinista. */
export function simulateRace(cfg, inputs = []) {
  return runToEnd(createRace(cfg), inputs);
}

/** Resultado y análisis comparando con el ganador. */
export function raceResult(race) {
  const order = standings(race);
  const winner = order[0];
  const player = race.cars.find((c) => c.isPlayer);
  const position = order.indexOf(player) + 1;
  const time = (c) => (c.finished ? c.finishTime : race.t + (race.total - c.pos) / Math.max(10, c.v));
  return {
    position,
    field: order.length,
    order: order.map((c) => ({ name: c.name, color: c.color, isPlayer: c.isPlayer, ir: c.ir, time: time(c), gap: time(c) - time(winner), tire: c.setup.tire })),
    player: {
      time: time(player),
      wear: player.wear,
      tel: player.tel,
      setup: player.setup,
    },
    compare:
      position === 1
        ? null
        : {
            straight: player.tel.straight - winner.tel.straight,
            curve: player.tel.curve - winner.tel.curve,
            mistakes: player.tel.mistakes - winner.tel.mistakes,
            winnerSetup: winner.setup,
          },
    inputs: race.inputs.slice(),
    seed: race.seed,
  };
}
