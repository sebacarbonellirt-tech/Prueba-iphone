// Generador pseudoaleatorio determinista (mulberry32).
// Misma semilla => misma secuencia. Es la base para que el servidor pueda
// re-simular una carrera y verificar que el resultado enviado es legítimo.

/** @param {number} seed */
export function createRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash de texto a entero de 32 bits (FNV-1a). */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Combina varias semillas en una. */
export function mixSeed(...parts) {
  return hashString(parts.join("|"));
}
