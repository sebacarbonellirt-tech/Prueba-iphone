// Estado del jugador y todas las acciones del juego (funciones puras sobre un
// objeto serializable). La interfaz llama a estas funciones; nunca modifica el
// estado por su cuenta. En el futuro, el servidor ejecutará estas mismas reglas.
import {
  BUILDINGS, CARS, CIRCUITS, CIRCUIT_ORDER, CLASSES, ECONOMY, GOALS, PARTS, PART_ORDER, SAVE_VERSION,
} from "./data.js";
import { carStats, performanceIndex } from "./stats.js";

// ---------- Creación y migración ----------

export function newGame(now) {
  return {
    v: SAVE_VERSION,
    createdAt: now,
    lastTick: now,
    name: "Piloto",
    credits: ECONOMY.startingCredits,
    box: 90, // la caja empieza con algo para que el primer toque sea "Cobrar"
    xp: 0,
    rep: 1,
    buildings: { taller: 1, oficina: 0 },
    garage: { brisa: newCar("brisa") },
    activeCar: "brisa",
    builds: {}, // carId -> { endsAt }
    blueprints: [], // autos desbloqueados para construir
    progress: {}, // "brisa-1" -> { best, wins, races }
    lastSetup: { tire: "medio", map: "balance", risk: "normal", nitro: "rectas" },
    goals: { claimed: [] },
    counters: { collect: 0, races: 0, wins: 0, manualWin: 0, earned: 0 },
  };
}

function newCar(carId) {
  const parts = {};
  for (const p of PART_ORDER) parts[p] = 1;
  return { parts, condition: 100, paint: CARS[carId].defaultPaint };
}

/** Aplica valores por defecto a partidas guardadas antiguas. */
export function migrate(save, now) {
  if (!save || typeof save !== "object") return newGame(now);
  const base = newGame(now);
  const s = { ...base, ...save };
  s.buildings = { ...base.buildings, ...save.buildings };
  s.counters = { ...base.counters, ...save.counters };
  s.goals = { ...base.goals, ...save.goals };
  s.lastSetup = { ...base.lastSetup, ...save.lastSetup };
  for (const id of Object.keys(s.garage)) {
    if (!CARS[id]) delete s.garage[id];
    else s.garage[id] = { ...newCar(id), ...s.garage[id], parts: { ...newCar(id).parts, ...s.garage[id].parts } };
  }
  if (!s.garage[s.activeCar]) s.activeCar = Object.keys(s.garage)[0] || "brisa";
  s.v = SAVE_VERSION;
  return s;
}

// ---------- Idle: taller y caja ----------

export function incomePerSec(state) {
  const L = state.buildings.taller;
  return ECONOMY.incomeK * L * Math.pow(ECONOMY.incomeG, L - 1);
}

export function capHours(state) {
  return ECONOMY.capBaseHours + state.buildings.oficina;
}

export function boxCap(state) {
  return incomePerSec(state) * capHours(state) * 3600;
}

/**
 * Avanza el tiempo: llena la caja (hasta el tope), repara solo y termina
 * construcciones. Sirve igual para 1 segundo en línea o 10 horas offline.
 */
export function tick(state, now) {
  const elapsed = Math.max(0, (now - state.lastTick) / 1000);
  state.lastTick = now;
  const cap = boxCap(state);
  const before = state.box;
  state.box = Math.min(cap, state.box + incomePerSec(state) * elapsed);
  for (const car of Object.values(state.garage)) {
    car.condition = Math.min(100, car.condition + (ECONOMY.conditionRegenPerMin * elapsed) / 60);
  }
  const finished = [];
  for (const [carId, b] of Object.entries(state.builds)) {
    if (now >= b.endsAt) finished.push(carId);
  }
  return { gained: state.box - before, elapsed, finishedBuilds: finished };
}

export function collect(state) {
  const amount = Math.floor(state.box);
  if (amount <= 0) return 0;
  state.box -= amount;
  state.credits += amount;
  state.counters.collect++;
  state.counters.earned += amount;
  return amount;
}

// ---------- Edificios ----------

export function buildingCost(id, level) {
  const b = BUILDINGS[id];
  return Math.round(b.baseCost * Math.pow(b.growth, level - (id === "oficina" ? 0 : 1)));
}

export function buildingMax(state, id) {
  if (id === "taller") return ECONOMY.tallerBaseMax + state.rep * ECONOMY.tallerLevelsPerRep;
  return BUILDINGS[id].maxLevel;
}

export function canUpgradeBuilding(state, id) {
  const lvl = state.buildings[id];
  if (lvl >= buildingMax(state, id)) return { ok: false, reason: "max" };
  const cost = buildingCost(id, lvl);
  if (state.credits < cost) return { ok: false, reason: "credits", cost };
  return { ok: true, cost };
}

export function upgradeBuilding(state, id) {
  const chk = canUpgradeBuilding(state, id);
  if (!chk.ok) return chk;
  state.credits -= chk.cost;
  state.buildings[id]++;
  return chk;
}

// ---------- Autos y piezas ----------

export function activeStats(state, carId = state.activeCar) {
  return carStats(carId, state.garage[carId].parts);
}

export function carIR(state, carId = state.activeCar) {
  return performanceIndex(activeStats(state, carId));
}

export function partCost(carId, partId, level) {
  const p = PARTS[partId];
  return Math.round(p.baseCost * CLASSES[CARS[carId].cls].costMult * Math.pow(p.growth, level - 1));
}

export function partMax(state, carId) {
  return Math.min(CARS[carId].maxLevel, ECONOMY.partBaseMax + state.rep * ECONOMY.partLevelsPerRep);
}

export function canUpgradePart(state, carId, partId) {
  const part = PARTS[partId];
  if (state.rep < part.unlockRep) return { ok: false, reason: "locked", rep: part.unlockRep };
  const lvl = state.garage[carId].parts[partId];
  if (lvl >= CARS[carId].maxLevel) return { ok: false, reason: "max" };
  if (lvl >= partMax(state, carId)) return { ok: false, reason: "rep", rep: state.rep + 1 };
  const cost = partCost(carId, partId, lvl);
  if (state.credits < cost) return { ok: false, reason: "credits", cost };
  return { ok: true, cost };
}

export function upgradePart(state, carId, partId) {
  const chk = canUpgradePart(state, carId, partId);
  if (!chk.ok) return chk;
  state.credits -= chk.cost;
  state.garage[carId].parts[partId]++;
  return chk;
}

export function repairCost(state, carId = state.activeCar) {
  const car = state.garage[carId];
  return Math.ceil((100 - car.condition) * ECONOMY.repairCostPerPoint * CLASSES[CARS[carId].cls].costMult);
}

export function repair(state, carId = state.activeCar) {
  const cost = repairCost(state, carId);
  if (cost <= 0 || state.credits < cost) return false;
  state.credits -= cost;
  state.garage[carId].condition = 100;
  return true;
}

export function setPaint(state, carId, color) {
  if (state.garage[carId]) state.garage[carId].paint = color;
}

export function selectCar(state, carId) {
  if (state.garage[carId]) state.activeCar = carId;
}

// ---------- Construcción de autos nuevos ----------

export function carStatus(state, carId, now) {
  if (state.garage[carId]) return { status: "owned" };
  if (state.builds[carId]) {
    const left = state.builds[carId].endsAt - now;
    return left <= 0 ? { status: "ready" } : { status: "building", left };
  }
  if (state.blueprints.includes(carId)) {
    const ok = state.credits >= CARS[carId].build.cost;
    return { status: "blueprint", cost: CARS[carId].build.cost, ok };
  }
  return { status: "locked" };
}

export function startBuild(state, carId, now) {
  const st = carStatus(state, carId, now);
  if (st.status !== "blueprint" || !st.ok) return false;
  state.credits -= CARS[carId].build.cost;
  state.builds[carId] = { endsAt: now + CARS[carId].build.minutes * 60000 };
  return true;
}

export function claimBuild(state, carId, now) {
  if (carStatus(state, carId, now).status !== "ready") return false;
  delete state.builds[carId];
  state.blueprints = state.blueprints.filter((c) => c !== carId);
  state.garage[carId] = newCar(carId);
  return true;
}

// ---------- Reputación ----------

export function xpForNext(rep) {
  return Math.round(ECONOMY.xpBase * Math.pow(ECONOMY.xpGrowth, rep - 1));
}

/** Suma XP y devuelve los niveles ganados. */
export function addXp(state, xp) {
  state.xp += xp;
  const ups = [];
  while (state.rep < ECONOMY.maxRep && state.xp >= xpForNext(state.rep)) {
    state.xp -= xpForNext(state.rep);
    state.rep++;
    ups.push(state.rep);
  }
  return ups;
}

/** Qué se desbloquea al llegar a un nivel de reputación (para mostrarlo). */
export function unlocksAtRep(rep) {
  const out = [];
  for (const p of Object.values(PARTS)) if (p.unlockRep === rep && rep > 1) out.push(`Mejora: ${p.name}`);
  for (const c of Object.values(CIRCUITS)) if (c.unlockRep === rep) out.push(`Circuito: ${c.name}`);
  out.push(`Taller hasta nivel ${ECONOMY.tallerBaseMax + rep * ECONOMY.tallerLevelsPerRep}`);
  out.push(`Piezas hasta nivel ${ECONOMY.partBaseMax + rep * ECONOMY.partLevelsPerRep}`);
  return out;
}

// ---------- Eventos y recompensas ----------

export const eventId = (circuitId, idx) => `${circuitId}-${idx + 1}`;

export function circuitUnlocked(state, circuitId) {
  return state.rep >= (CIRCUITS[circuitId].unlockRep || 1);
}

export function eventUnlocked(state, circuitId, idx) {
  if (!circuitUnlocked(state, circuitId)) return false;
  if (idx === 0) return true;
  const prev = state.progress[eventId(circuitId, idx - 1)];
  return !!prev && prev.best <= 3; // podio en el anterior
}

const PLACE_CR = [1, 0.6, 0.4, 0.2, 0.15, 0.12];
const PLACE_XP = [1, 0.7, 0.5, 0.3, 0.25, 0.2];

export function eventRewards(state, circuitId, idx, position) {
  const c = CIRCUITS[circuitId];
  const ev = c.events[idx];
  const prog = state.progress[eventId(circuitId, idx)];
  const alreadyWon = !!prog && prog.wins > 0;
  const firstWin = position === 1 && !alreadyWon;
  const scale = Math.pow(1.38, idx);
  let cr = c.baseReward * scale * PLACE_CR[position - 1];
  let xp = c.baseXp * (1 + 0.35 * idx) * PLACE_XP[position - 1];
  if (firstWin) {
    cr *= 2;
    xp *= 1.5;
  } else if (alreadyWon) {
    cr *= ECONOMY.repeatMult;
    xp *= 0.6;
  }
  const unlocks = [];
  if (firstWin) {
    for (const car of Object.values(CARS)) {
      if (car.unlock && car.unlock.event === eventId(circuitId, idx) && !state.garage[car.id] && !state.blueprints.includes(car.id) && !state.builds[car.id]) {
        unlocks.push({ type: "blueprint", carId: car.id });
      }
    }
    if (idx + 1 < c.events.length) unlocks.push({ type: "event", name: c.events[idx + 1].name });
  } else if (position <= 3 && idx + 1 < c.events.length && !(prog && prog.best <= 3)) {
    unlocks.push({ type: "event", name: c.events[idx + 1].name });
  }
  void ev;
  return { cr: Math.round(cr), xp: Math.round(xp), firstWin, unlocks };
}

/** Desgaste persistente tras una carrera (según neumáticos y riesgo). */
export function conditionLoss(result) {
  const risk = { conservador: 0.7, normal: 1, agresivo: 1.4 }[result.player.setup.risk];
  return Math.round((4 + result.player.wear * 8 + result.player.tel.mistakes * 1.5) * risk);
}

/** Aplica el resultado de una carrera al estado. */
export function applyRace(state, circuitId, idx, result) {
  const id = eventId(circuitId, idx);
  const rewards = eventRewards(state, circuitId, idx, result.position);
  const prog = state.progress[id] || { best: 99, wins: 0, races: 0 };
  prog.races++;
  prog.best = Math.min(prog.best, result.position);
  if (result.position === 1) prog.wins++;
  if (!prog.bestTime || result.player.time < prog.bestTime) prog.bestTime = result.player.time;
  state.progress[id] = prog;

  state.credits += rewards.cr;
  state.counters.earned += rewards.cr;
  state.counters.races++;
  if (result.position === 1) {
    state.counters.wins++;
    if (result.player.setup.nitro === "manual" && result.player.tel.manualUses > 0) state.counters.manualWin++;
  }
  for (const u of rewards.unlocks) if (u.type === "blueprint") state.blueprints.push(u.carId);

  const car = state.garage[state.activeCar];
  const loss = conditionLoss(result);
  car.condition = Math.max(0, car.condition - loss);
  state.lastSetup = { ...result.player.setup };
  const levelUps = addXp(state, rewards.xp);
  return { ...rewards, conditionLoss: loss, levelUps };
}

// ---------- Objetivos ----------

export function goalProgress(state, goal) {
  const [kind, arg] = goal.check.split(":");
  switch (kind) {
    case "collect": return state.counters.collect;
    case "races": return state.counters.races;
    case "manualWin": return state.counters.manualWin;
    case "rep": return state.rep;
    case "part": return Math.max(...Object.values(state.garage).map((c) => c.parts[arg]));
    case "building": return state.buildings[arg];
    case "win": return state.progress[arg] && state.progress[arg].wins > 0 ? 1 : 0;
    case "owns": return state.garage[arg] ? 1 : 0;
    case "circuitWin": return CIRCUITS[arg].events.some((_, i) => (state.progress[eventId(arg, i)] || {}).wins > 0) ? 1 : 0;
    default: return 0;
  }
}

/** Objetivo actual: el primero sin reclamar. */
export function currentGoal(state) {
  const g = GOALS.find((x) => !state.goals.claimed.includes(x.id));
  if (!g) return null;
  const prog = goalProgress(state, g);
  return { ...g, progress: Math.min(prog, g.target), done: prog >= g.target };
}

export function claimGoal(state) {
  const g = currentGoal(state);
  if (!g || !g.done) return null;
  state.goals.claimed.push(g.id);
  if (g.reward.cr) {
    state.credits += g.reward.cr;
    state.counters.earned += g.reward.cr;
  }
  const levelUps = g.reward.xp ? addXp(state, g.reward.xp) : [];
  return { ...g, levelUps };
}

export { CIRCUIT_ORDER };
