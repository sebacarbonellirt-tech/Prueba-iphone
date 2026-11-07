// Caché simple para que Antena abra rápido. Los canales (otros dominios) nunca se guardan.
const CACHE = "antena-tv-v3";
const FILES = ["./", "index.html", "manifest.json", "icons/icon.svg", "icons/icon-192.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("antena-") && k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// Red primero (así ves siempre tus cambios), caché si no hay conexión.
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.includes("/herramientas/")) return;
  e.respondWith(
    fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
