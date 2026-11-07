// Guía de programación: qué dan ahora y después en los canales de un país.
// Junta dos guías públicas y gratuitas (formato XMLTV) y devuelve solo los canales que
// también están en la lista de iptv-org de ese país, desde 2 horas atrás hasta 36 horas adelante.
// Vercel guarda la respuesta 3 horas en su caché, así que las guías se descargan pocas veces al día.
//
// Uso: /api/guia?pais=cl
// Respuesta: { at, pais, fuentes: [..], canales: { "<tvg-id>" | "n:<nombre>": [[inicio, fin, "Título"], …] } }
// inicio y fin van en minutos desde 1970 (UTC), para que la respuesta pese poco.

const zlib = require("zlib");

const AGENTE = "Mozilla/5.0 (compatible; AntenaTV/1.0)";
const ATRAS_MIN = 2 * 60;      // programas que ya empezaron hasta 2 horas antes
const ADELANTE_MIN = 36 * 60;  // y los de las próximas 36 horas
const MAX_POR_CANAL = 60;
const FUENTES = (cc) => [
  { nombre: "IPTV-EPG.org", url: "https://iptv-epg.org/files/epg-" + cc + ".xml.gz" },
  { nombre: "EPGShare01", url: "https://epgshare01.online/epgshare01/epg_ripper_" + cc.toUpperCase() + "1.xml.gz" },
];

// Igual que gnorm() en index.html: así un canal de la guía y uno de la lista se reconocen por su nombre.
function gnorm(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/^[a-z]{2} - /, "").replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/\b(hd|sd|fhd|uhd|4k|tv|canal|television)\b/g, " ").replace(/[^a-z0-9]/g, "");
}
const baseId = (id) => String(id || "").split("@")[0];
// Algunas guías rellenan las horas sin datos con títulos vacíos: se descartan,
// y si un canal queda sin nada, otra guía puede aportar sus horarios.
const RELLENO = /^(no data|no (programme|program|information)|sin (datos|informaci[oó]n|programaci[oó]n)|to be announced|tba|n\/a|-+)$/i;

function texto(x) {
  return String(x || "").replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}

// "20261107213000 -0300" → minutos desde 1970 (UTC)
function minutos(t) {
  const m = String(t || "").match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})\d{0,2}\s*([+-]\d{4})?/);
  if (!m) return NaN;
  const z = m[6] || "+0000";
  const off = (z[0] === "-" ? -1 : 1) * (+z.slice(1, 3) * 60 + +z.slice(3, 5));
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) / 60000 - off;
}

async function descargar(url, binario) {
  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": AGENTE } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    if (!binario) return await r.text();
    const b = Buffer.from(await r.arrayBuffer());
    return (b[0] === 0x1f && b[1] === 0x8b ? zlib.gunzipSync(b) : b).toString("utf8");
  } finally {
    clearTimeout(reloj);
  }
}

// Canales de la lista de iptv-org del país: sus tvg-id y sus nombres.
function lista(m3u) {
  const ids = new Set(), nombres = new Set();
  for (const l of String(m3u).split(/\r?\n/)) {
    if (!/^#EXTINF/i.test(l)) continue;
    const id = baseId((l.match(/tvg-id="([^"]*)"/i) || [])[1]);
    if (id) ids.add(id);
    const sinAtributos = l.replace(/([\w-]+)="[^"]*"/g, "");
    const n = gnorm(sinAtributos.slice(sinAtributos.indexOf(",") + 1));
    if (n) nombres.add(n);
  }
  return { ids, nombres };
}

// Lee una guía XMLTV y agrega a `canales` los programas de los canales que están en la lista.
function leerGuia(xml, { ids, nombres }, canales, ahora) {
  const clave = new Map(); // id de la guía → clave en la respuesta
  for (const m of xml.matchAll(/<channel\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/channel>/g)) {
    const id = texto(m[1]);
    const nombre = gnorm(texto((m[2].match(/<display-name[^>]*>([\s\S]*?)<\/display-name>/) || [])[1]));
    const k = ids.has(baseId(id)) ? baseId(id) : nombre && nombres.has(nombre) ? "n:" + nombre : "";
    if (k && !canales[k]) clave.set(id, k); // si otra guía ya trae este canal, se queda con esa
  }
  if (!clave.size) return 0;
  const desde = ahora - ATRAS_MIN, hasta = ahora + ADELANTE_MIN, nuevos = {};
  for (const m of xml.matchAll(/<programme\s([^>]*)>([\s\S]*?)<\/programme>/g)) {
    const attr = {};
    m[1].replace(/([\w-]+)="([^"]*)"/g, (_, a, v) => { attr[a] = v; return ""; });
    const k = clave.get(texto(attr.channel));
    if (!k) continue;
    const ini = minutos(attr.start), fin = minutos(attr.stop);
    if (!(fin > desde && ini < hasta && fin > ini)) continue;
    const titulo = texto((m[2].match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1]);
    if (!titulo || RELLENO.test(titulo)) continue;
    (nuevos[k] = nuevos[k] || []).push([Math.round(ini), Math.round(fin), titulo.slice(0, 120)]);
  }
  let n = 0;
  for (const [k, p] of Object.entries(nuevos)) {
    p.sort((a, b) => a[0] - b[0]);
    canales[k] = p.filter((x, i) => !i || x[0] !== p[i - 1][0]).slice(0, MAX_POR_CANAL);
    n++;
  }
  return n;
}

async function guia(cc, ahora = Date.now() / 60000) {
  const fuentes = FUENTES(cc);
  const [m3u, ...xmls] = await Promise.allSettled([
    descargar("https://iptv-org.github.io/iptv/countries/" + cc + ".m3u", false),
    ...fuentes.map((f) => descargar(f.url, true)),
  ]);
  if (m3u.status !== "fulfilled") throw new Error("Sin lista");
  const canalesLista = lista(m3u.value), canales = {}, usadas = [];
  xmls.forEach((x, i) => {
    if (x.status === "fulfilled" && leerGuia(x.value, canalesLista, canales, ahora)) usadas.push(fuentes[i].nombre);
  });
  return { pais: cc, fuentes: usadas, canales };
}

module.exports = async (req, res) => {
  const cc = (new URL(req.url, "http://x").searchParams.get("pais") || "").toLowerCase();
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("content-type", "application/json; charset=utf-8");
  if (!/^[a-z]{2}$/.test(cc)) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "País no válido" }));
  }
  try {
    const g = await guia(cc);
    res.statusCode = 200;
    // 3 horas en la caché de Vercel; hasta 12 horas más se entrega la anterior mientras se renueva
    // (sigue sirviendo porque trae 36 horas de programación).
    const vacia = !Object.keys(g.canales).length;
    res.setHeader("cache-control", vacia ? "public, max-age=600, s-maxage=3600" : "public, max-age=900, s-maxage=10800, stale-while-revalidate=43200");
    res.end(JSON.stringify({ at: Date.now(), ...g }));
  } catch {
    res.statusCode = 502;
    res.setHeader("cache-control", "public, s-maxage=300");
    res.end(JSON.stringify({ error: "No se pudo cargar la guía" }));
  }
};

module.exports.gnorm = gnorm;
module.exports.minutos = minutos;
module.exports.lista = lista;
module.exports.leerGuia = leerGuia;
module.exports.guia = guia;
