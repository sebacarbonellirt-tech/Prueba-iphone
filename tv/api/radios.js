// Radios en vivo de un país, desde el directorio público y gratuito Radio Browser (radio-browser.info),
// donde cada radio publica su propia señal. Deja solo las que el iPhone puede tocar (MP3/AAC por https),
// junta las repetidas, prueba que respondan y pone primero las más conocidas.
// Vercel guarda la respuesta 12 horas, así que el directorio se consulta pocas veces al día.
//
// Uso: /api/radios?pais=cl
// Respuesta: { at, radios: [{ nombre, url, logo, hls }] }

const SERVIDORES = ["de1.api.radio-browser.info", "de2.api.radio-browser.info", "fi1.api.radio-browser.info", "all.api.radio-browser.info"];
const AGENTE = "AntenaTV/1.0";
const TIEMPO_POR_RADIO = 6000;
const MAXIMO = 80;

// Las más escuchadas de Chile van primero, en este orden.
const CONOCIDAS = {
  cl: ["biobio", "cooperativa", "adn", "agricultura", "pudahuel", "rock and pop", "futuro", "corazon", "los40", "concierto",
    "duna", "infinita", "imagina", "carolina", "tiempo", "romantica", "sonar", "play fm", "positiva", "oasis", "universo",
    "fm dos", "fmdos", "horizonte", "zero", "uno", "candela", "activa", "radioactiva", "t13 radio", "13 radio", "beethoven", "uchile", "universidad de chile"],
};

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Nombre para juntar repetidas: «RADIO COOPERATIVA», «Cooperativa 93.3» y «Cooperativa» son la misma.
const clave = (s) => norm(s).replace(/&/g, " and ").replace(/\b(radio|fm|am|chile|cl|en vivo|online|oficial|santiago|principales|uc|m)\b/g, " ")
  .replace(/\d+([.,]\d+)?/g, " ").replace(/[^a-z0-9]/g, "");

// Nombre para mostrar: sin «cl» ni signos sueltos al final, y sin MAYÚSCULAS sostenidas.
function limpio(s) {
  let n = String(s).replace(/\s+/g, " ").replace(/[\s|.\-–]+$/g, "").replace(/\s+(cl|m)$/i, "").trim();
  if (n === n.toUpperCase() && /[A-Z]{4}/.test(n)) n = n.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  return n;
}
// Logos que en realidad son el ícono de otro sitio.
const LOGO_MALO = /(wix\.com|zeno\.fm|twitter\.com|gstatic\.com|googleusercontent\.com)\//i;
// Links con permiso que vence (dejan de sonar a los minutos) o mal copiados.
const LINK_MALO = (u) => /[?&](zt|dpssid|sid)=/i.test(u) || u.indexOf("http", 8) > 0;

// Algunos servidores de radio también atienden por https: se usa esa versión (la web es https).
function seguro(u) {
  if (/^https:\/\//i.test(u)) return u;
  let m = u.match(/^http:\/\/[\w.-]*live\.streamtheworld\.com(?::\d+)?\/([A-Z0-9_]+)/i);
  if (m) return "https://playerservices.streamtheworld.com/api/livestream-redirect/" + m[1];
  m = u.match(/^http:\/\/stream\.zeno\.fm\/(.+)$/i);
  if (m) return "https://stream.zeno.fm/" + m[1];
  return "";
}

async function directorio(cc) {
  const q = "/json/stations/search?countrycode=" + cc.toUpperCase() + "&order=clickcount&reverse=true&limit=400&hidebroken=true";
  for (const s of SERVIDORES) {
    try {
      const r = await fetch("https://" + s + q, { headers: { "user-agent": AGENTE }, signal: AbortSignal.timeout(10000) });
      if (r.ok) return await r.json();
    } catch {}
  }
  throw new Error("Radio Browser no respondió");
}

function elegir(lista, cc) {
  const grupos = new Map();
  for (const s of lista) {
    const codec = String(s.codec || "").toUpperCase();
    if (!s.hls && !/^(MP3|AAC|AAC\+)$/.test(codec)) continue; // FLAC/OGG no suenan en iPhone
    if (/\b(xxx|adult|porn|erotic)/i.test(s.name + " " + s.tags)) continue;
    const url = seguro(String(s.url_resolved || s.url || "").trim());
    const k = clave(s.name);
    if (!url || !k || LINK_MALO(url)) continue;
    const logo = /^https:\/\//i.test(s.favicon || "") && !LOGO_MALO.test(s.favicon) ? s.favicon : "";
    const r = { nombre: limpio(s.name), url, logo,
      hls: !!s.hls, votos: (s.clickcount || 0) + (s.votes || 0) / 10 };
    const g = grupos.get(k) || [...grupos.values()].find((x) => x.url === url);
    if (!g) grupos.set(k, r);
    else {
      if (!g.logo && r.logo) g.logo = r.logo;
      if (r.votos > g.votos) Object.assign(g, { url: r.url, hls: r.hls, votos: r.votos, nombre: g.nombre.length <= r.nombre.length ? g.nombre : r.nombre });
    }
  }
  const top = CONOCIDAS[cc] || [];
  const rango = (r) => { const n = norm(r.nombre), i = top.findIndex((t) => new RegExp("(^|[^a-z0-9])" + t + "(?![a-z0-9])").test(n)); return i < 0 ? 999 : i; };
  return [...grupos.values()].sort((a, b) => rango(a) - rango(b) || b.votos - a.votos);
}

// Una radio responde si su servidor contesta con audio (o una lista HLS).
async function responde(url) {
  const ctrl = new AbortController(), reloj = setTimeout(() => ctrl.abort(), TIEMPO_POR_RADIO);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1" } });
    const tipo = r.headers.get("content-type") || "";
    r.body?.cancel?.();
    return r.ok && /audio|mpegurl|octet-stream|aac|mpeg|ogg/i.test(tipo);
  } catch { return false; }
  finally { clearTimeout(reloj); ctrl.abort(); }
}

async function radios(cc) {
  const lista = elegir(await directorio(cc), cc).slice(0, MAXIMO * 2);
  const ok = await Promise.all(lista.map((r) => responde(r.url)));
  return lista.filter((_, i) => ok[i]).slice(0, MAXIMO).map(({ votos, ...r }) => r);
}

module.exports = async (req, res) => {
  const cc = (new URL(req.url, "http://x").searchParams.get("pais") || "cl").toLowerCase();
  res.setHeader("content-type", "application/json; charset=utf-8");
  if (!/^[a-z]{2}$/.test(cc)) { res.statusCode = 400; return res.end(JSON.stringify({ error: "País no válido", radios: [] })); }
  try {
    const lista = await radios(cc);
    res.statusCode = 200;
    res.setHeader("cache-control", lista.length ? "public, max-age=1800, s-maxage=43200, stale-while-revalidate=86400" : "public, s-maxage=600");
    res.end(JSON.stringify({ at: Date.now(), radios: lista }));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader("cache-control", "public, s-maxage=300");
    res.end(JSON.stringify({ error: String(e.message || e), radios: [] }));
  }
};
module.exports.clave = clave;
module.exports.seguro = seguro;
module.exports.elegir = elegir;
module.exports.radios = radios;
