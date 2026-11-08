// Cálculo de estadísticas de un auto y conversión a física de carrera.
import { CARS, PARTS, STAT_KEYS, RACE } from "./data.js";

/**
 * Puntos de estadística de un auto con sus mejoras.
 * @param {string} carId
 * @param {Record<string, number>} partLevels nivel por pieza (1 = de fábrica)
 */
export function carStats(carId, partLevels = {}) {
  const car = CARS[carId];
  const s = { ...car.base };
  for (const [partId, part] of Object.entries(PARTS)) {
    const extra = Math.max(0, (partLevels[partId] || 1) - 1);
    for (const [k, v] of Object.entries(part.per)) s[k] += v * extra;
  }
  for (const k of STAT_KEYS) s[k] = Math.round(s[k] * 10) / 10;
  return s;
}

/** Índice de Rendimiento: un número para comparar autos de un vistazo. */
export function performanceIndex(s) {
  return Math.round(s.vel * 1.0 + s.acc * 0.9 + s.ctl * 1.1 + s.res * 0.3 + s.efi * 0.3);
}

/** Multiplicador de rendimiento por estado mecánico (0-100). Máx. -8 %. */
export function conditionFactor(condition) {
  return 0.92 + 0.08 * Math.max(0, Math.min(100, condition)) / 100;
}

/**
 * Convierte puntos a magnitudes físicas usadas por la simulación.
 * @param {{vel:number,acc:number,ctl:number,res:number,efi:number}} s
 * @param {number} condition estado mecánico 0-100
 */
export function physics(s, condition = 100) {
  const cf = conditionFactor(condition);
  return {
    vmax: (38 + s.vel * 0.42) * (0.97 + 0.03 * cf), // m/s
    accel: (2.6 + s.acc * 0.075) * cf, // m/s²
    mu: (0.85 + s.ctl * 0.0085) * (0.96 + 0.04 * cf), // coeficiente de agarre
    brake: 7 + s.ctl * 0.04, // m/s²
    wearMult: 1 / (0.6 + s.res / 115),
    mistakeMult: Math.max(0.45, 1.4 - s.res / 120),
    nitroSeconds: RACE.nitro.baseSeconds + s.efi * RACE.nitro.perEfi,
  };
}

/** Velocidad en km/h para mostrar. */
export function kmh(ms) {
  return Math.round(ms * 3.6);
}
