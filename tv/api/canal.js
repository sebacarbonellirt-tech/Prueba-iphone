// Link para compartir un canal o una radio: https://antena-tv.vercel.app/c/<canal>
// (vercel.json manda /c/<canal> aquí). Devuelve una página mínima con el nombre y el logo del canal,
// que WhatsApp, Instagram, etc. muestran como vista previa, y que abre la tele en ese canal.
// Vercel guarda la respuesta 1 día.

const LISTA = "https://iptv-org.github.io/iptv/languages/spa.m3u";
const IMAGEN = "og.png"; // vista previa general (si el canal no tiene logo)

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Igual que slug() en index.html.
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const html = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Busca el canal en la lista (por su tvg-id o por su nombre).
function buscar(texto, id) {
  let info = null;
  for (const crudo of String(texto).split(/\r?\n/)) {
    const l = crudo.trim();
    if (/^#EXTINF/i.test(l)) {
      const a = {};
      l.replace(/([\w-]+)="([^"]*)"/g, (_, k, v) => { a[k.toLowerCase()] = v.trim(); return ""; });
      const sin = l.replace(/([\w-]+)="[^"]*"/g, "");
      const nombre = sin.slice(sin.indexOf(",") + 1).replace(/\[[^\]]*\]/g, "")
        .replace(/\s*\((\d{3,4}[pi]|4K|SD|HD|FHD|UHD)\)/gi, "").replace(/\s+/g, " ").trim();
      info = { nombre, tid: (a["tvg-id"] || "").split("@")[0], logo: a["tvg-logo"] || "" };
    } else if (info && /^https?:\/\//i.test(l)) {
      if ((info.tid && slug(info.tid) === id) || slug(info.nombre) === id) return info;
      info = null;
    }
  }
  return null;
}

async function datos(id, base) {
  try {
    if (id.startsWith("radio-")) {
      const r = await fetch(base + "api/radios?pais=cl", { signal: AbortSignal.timeout(8000) });
      const j = await r.json();
      const x = (j.radios || []).find((x) => "radio-" + slug(x.nombre) === id);
      if (x) return { nombre: x.nombre, logo: x.logo, radio: true };
    } else {
      const r = await fetch(LISTA, { signal: AbortSignal.timeout(8000) });
      const x = buscar(await r.text(), id);
      if (x) return x;
    }
  } catch {}
  return null;
}

module.exports = async (req, res) => {
  const u = new URL(req.url, "http://x");
  const id = slug(u.searchParams.get("id") || "");
  const base = "https://" + (req.headers["x-forwarded-host"] || req.headers.host || "antena-tv.vercel.app") + "/";
  const d = id ? await datos(id, base) : null;
  const nombre = d ? d.nombre : "";
  const titulo = nombre ? nombre + (d.radio ? " · radio en vivo" : " en vivo") + " · Antena" : "Antena · Tele gratis en vivo";
  const texto = nombre ? (d.radio ? "Escúchala" : "Míralo") + " gratis en Antena, sin registrarte." : "Noticias, deportes, música e infantil. Canales abiertos, sin registrarte.";
  const imagen = d && /^https:\/\//i.test(d.logo || "") ? d.logo : base + IMAGEN;
  const destino = base + (id ? "?canal=" + encodeURIComponent(id) : "");
  res.statusCode = 200;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", d ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" : "public, s-maxage=600");
  res.end(`<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${html(titulo)}</title>
<meta name="description" content="${html(texto)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Antena">
<meta property="og:title" content="${html(titulo)}">
<meta property="og:description" content="${html(texto)}">
<meta property="og:image" content="${html(imagen)}">
<meta property="og:url" content="${html(base + "c/" + id)}">
<meta name="twitter:card" content="${imagen.endsWith(IMAGEN) ? "summary_large_image" : "summary"}">
<meta http-equiv="refresh" content="0; url=${html(destino)}">
<link rel="icon" href="${html(base)}icons/icon.svg" type="image/svg+xml">
</head><body style="font-family:system-ui,sans-serif;background:#0E0D12;color:#F4F2F7;display:grid;place-items:center;min-height:90vh">
<p><a href="${html(destino)}" style="color:#FF6B4F">Abrir ${html(nombre || "Antena")}</a></p>
<script>location.replace(${JSON.stringify(destino)});</script>
</body></html>`);
};
module.exports.slug = slug;
module.exports.buscar = buscar;
