// Revisa qué señales de una lista de iptv-org responden y devuelve las que no.
// Vercel guarda la respuesta 6 horas en su caché (y la renueva en segundo plano),
// así que la revisión corre pocas veces al día aunque entren miles de personas.
//
// Uso: /api/estado?lista=https://iptv-org.github.io/iptv/countries/cl.m3u
// Respuesta: { at, total, revisados, caidos: [links], bloqueados: n }

const PERMITIDO = /^https:\/\/iptv-org\.github\.io\/iptv\/[a-z0-9/_-]+\.m3u$/i;
const TIEMPO_POR_SENAL = 6000; // ms antes de dar una señal por caída
const SIMULTANEAS = 120;       // señales que se prueban a la vez
const LIMITE_TOTAL = 50000;    // ms máximos de revisión (después, lo no revisado queda como activo)
const AGENTE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// Saca los links de una lista M3U (sin canales para adultos, igual que la web).
function links(texto) {
  const out = [];
  let grupo = "";
  for (const crudo of String(texto).split(/\r?\n/)) {
    const l = crudo.trim();
    if (/^#EXTINF/i.test(l)) { const m = l.match(/group-title="([^"]*)"/i); grupo = m ? m[1] : ""; }
    else if (/^https?:\/\//i.test(l)) { if (!/\b(xxx|adult)/i.test(grupo)) out.push(l); grupo = ""; }
  }
  return [...new Set(out)];
}

// Lee solo el comienzo de la respuesta (las listas .m3u8 parten con #EXTM3U).
async function comienzo(r, bytes) {
  if (!r.body || !r.body.getReader) return (await r.text()).slice(0, bytes);
  const lector = r.body.getReader();
  let texto = "";
  const dec = new TextDecoder();
  while (texto.length < bytes) {
    const { value, done } = await lector.read();
    if (done) break;
    texto += dec.decode(value, { stream: true });
  }
  lector.cancel().catch(() => {});
  return texto;
}

// "ok" responde · "caido" no responde · "bloqueado" responde pero niega el acceso (suele ser por país)
async function probar(url) {
  // La web es https: el navegador bloquea las señales http, así que para el público están caídas.
  if (/^http:\/\//i.test(url) && !process.env.ANTENA_PRUEBA_HTTP) return "caido";
  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), TIEMPO_POR_SENAL);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": AGENTE, accept: "*/*" } });
    if ([401, 403, 407, 429, 451].includes(r.status)) { r.body?.cancel?.(); return "bloqueado"; }
    if (!r.ok) { r.body?.cancel?.(); return "caido"; }
    const tipo = r.headers.get("content-type") || "";
    if (/\.m3u8?(\?|$)/i.test(url) || /mpegurl/i.test(tipo)) {
      return (await comienzo(r, 2048)).includes("#EXTM3U") ? "ok" : "caido";
    }
    r.body?.cancel?.();
    return "ok";
  } catch {
    return "caido";
  } finally {
    clearTimeout(reloj);
  }
}

async function revisar(lista, ahora = Date.now) {
  const inicio = ahora();
  const caidos = [];
  let revisados = 0, bloqueados = 0, i = 0;
  async function trabajador() {
    while (i < lista.length && ahora() - inicio < LIMITE_TOTAL) {
      const url = lista[i++];
      const r = await probar(url);
      revisados++;
      if (r === "caido") caidos.push(url);
      else if (r === "bloqueado") bloqueados++;
    }
  }
  await Promise.all(Array.from({ length: Math.min(SIMULTANEAS, lista.length) }, trabajador));
  return { total: lista.length, revisados, bloqueados, caidos };
}

module.exports = async (req, res) => {
  const lista = new URL(req.url, "http://x").searchParams.get("lista") || "";
  res.setHeader("access-control-allow-origin", "*");
  if (!PERMITIDO.test(lista)) {
    res.statusCode = 400;
    res.setHeader("content-type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ error: "Lista no permitida" }));
  }
  try {
    const r = await fetch(lista, { headers: { "user-agent": AGENTE } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const resultado = await revisar(links(await r.text()));
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    // 6 horas en la caché de Vercel; hasta 1 día más se entrega la anterior mientras se renueva.
    res.setHeader("cache-control", "public, max-age=600, s-maxage=21600, stale-while-revalidate=86400");
    res.end(JSON.stringify({ at: Date.now(), ...resultado }));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "public, s-maxage=300");
    res.end(JSON.stringify({ error: "No se pudo revisar la lista" }));
  }
};

module.exports.links = links;
module.exports.probar = probar;
module.exports.revisar = revisar;
