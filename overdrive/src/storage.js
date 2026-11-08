// Guardado local. Envuelto en try/catch: en modo privado o con almacenamiento
// bloqueado el juego sigue funcionando (sin persistir).
import { migrate, newGame } from "./core/state.js";

const KEY = "overdrive.save";

export function loadGame(now) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { state: newGame(now), fresh: true };
    return { state: migrate(JSON.parse(raw), now), fresh: false };
  } catch (e) {
    console.warn("No se pudo leer la partida", e);
    return { state: newGame(now), fresh: true };
  }
}

export function saveGame(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn("No se pudo guardar", e);
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* sin almacenamiento */
  }
}

/** Código de respaldo para copiar la partida a otro dispositivo. */
export function exportCode(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function importCode(code, now) {
  const data = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  return migrate(data, now);
}
