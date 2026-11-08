// Perfil: estadísticas, avance de temporada (maqueta) y respaldo de partida.
import * as G from "../../core/state.js";
import { CIRCUITS, CIRCUIT_ORDER } from "../../core/data.js";
import { clearSave, exportCode, importCode } from "../../storage.js";
import { el, $, esc, fmt, fmtTime, sheet, toast } from "../dom.js";

export default function profile(ctx) {
  const s = ctx.state;
  const records = [];
  for (const cid of CIRCUIT_ORDER) CIRCUITS[cid].events.forEach((ev, i) => {
    const p = s.progress[G.eventId(cid, i)];
    if (p && p.bestTime) records.push({ name: ev.name, time: p.bestTime, best: p.best });
  });
  const root = el(`<div>
    <div class="page-title">Perfil</div>
    <p class="page-sub">Piloto y dueño de garaje desde ${new Date(s.createdAt).toLocaleDateString("es-CL")}.</p>
    <div class="card" style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
      <label for="pname" class="muted" style="font-size:12px">Nombre</label>
      <input id="pname" maxlength="16" value="${esc(s.name)}" style="flex:1;background:#0a0d12;border:1px solid var(--line2);border-radius:10px;color:var(--text);padding:10px;font:600 15px var(--ui);-webkit-user-select:text;user-select:text" />
    </div>
    <div class="kv">
      <div class="card"><b>${s.counters.races}</b><small>Carreras</small></div>
      <div class="card"><b class="gold">${s.counters.wins}</b><small>Victorias</small></div>
      <div class="card"><b>${Object.keys(s.garage).length}</b><small>Autos</small></div>
      <div class="card"><b>${fmt(s.counters.earned)}</b><small>CR ganados</small></div>
    </div>

    <div class="card season" style="margin-top:14px">
      <span class="soon">TEMPORADA 1 · PRÓXIMAMENTE</span>
      <div class="display" style="margin-top:6px">«Costa a Cordillera»</div>
      <ul>
        <li>6 semanas · pase gratuito y premium (solo cosméticos)</li>
        <li>Liga por clase con autos normalizados</li>
        <li>Copa Monomarca semanal: todos con el mismo auto</li>
        <li>Tu garaje y tus autos nunca se reinician</li>
      </ul>
    </div>

    ${records.length ? `<div class="section-title"><h2>Récords</h2></div>
    <div class="card classif">${records.map((r) => `<div><b>${r.best}</b><span>${esc(r.name)}</span><span></span><small>${fmtTime(r.time)}</small></div>`).join("")}</div>` : ""}

    <div class="section-title"><h2>Partida</h2><small>Se guarda sola en este dispositivo</small></div>
    <div class="row">
      <button class="btn sm" data-export>Copiar respaldo</button>
      <button class="btn sm" data-import>Cargar respaldo</button>
    </div>
    <button class="btn ghost sm block" style="margin-top:10px;color:var(--red)" data-reset>Borrar partida</button>
  </div>`);

  $(root, "#pname").addEventListener("change", (e) => {
    s.name = e.target.value.trim().slice(0, 16) || "Piloto";
    ctx.save();
    toast("Nombre guardado", "good");
  });
  $(root, "[data-export]").addEventListener("click", () => {
    const code = exportCode(s);
    const sh = sheet(`<h3>Respaldo</h3><p>Guarda este código para recuperar tu partida en otro dispositivo.</p><textarea class="code" readonly>${code}</textarea><button class="btn block" style="margin-top:12px" data-copy>Copiar</button>`);
    $(sh.root, "[data-copy]").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code);
        toast("Copiado", "good");
      } catch (e) {
        $(sh.root, "textarea").select();
        toast("Selecciónalo y cópialo manualmente");
      }
    });
  });
  $(root, "[data-import]").addEventListener("click", () => {
    const sh = sheet(`<h3>Cargar respaldo</h3><p>Pega el código. Reemplazará la partida actual.</p><textarea class="code" data-code></textarea><button class="btn primary block" style="margin-top:12px" data-load>Cargar</button>`);
    $(sh.root, "[data-load]").addEventListener("click", () => {
      try {
        const st = importCode($(sh.root, "[data-code]").value, Date.now());
        sh.close();
        ctx.replaceState(st);
        toast("Partida cargada", "good");
      } catch (e) {
        toast("Código inválido", "bad");
      }
    });
  });
  $(root, "[data-reset]").addEventListener("click", () => {
    const sh = sheet(`<h3>¿Borrar partida?</h3><p>Perderás autos, mejoras y progreso de este dispositivo. No se puede deshacer.</p><div class="row"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-yes>Borrar</button></div>`);
    $(sh.root, "[data-yes]").addEventListener("click", () => {
      ctx.save = () => {}; // evita que el guardado automático reescriba la partida
      clearSave();
      location.reload();
    });
  });
  return { root };
}
