/* QueueSetu service worker: keeps the app itself on the phone so it opens with no signal.
   Live queue data (/api, /socket.io) is never cached here. The app keeps its own last copy. */
const VERSION = "queuesetu-v17";
const SHELL = ["/", "/index.html", "/styles.css", "/app.js", "/shared.js", "/vendor/qrcode.js", "/vendor/jsqr.js", "/socket.io/socket.io.js",
  "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Fresh copy if the network answers within 3 seconds, otherwise the copy saved on the phone. */
function fresh(req, key) {
  return new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done && r) { done = true; resolve(r); } };
    const saved = caches.match(key || req);
    const timer = setTimeout(() => saved.then(finish), 3000);
    fetch(req).then(r => {
      if (r && (r.ok || r.type === "opaque")) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(key || req, copy)); }
      clearTimeout(timer); finish(r);
    }).catch(() => { clearTimeout(timer); saved.then(hit => finish(hit || Response.error())); });
  });
}
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.origin === location.origin && url.pathname.startsWith("/api/")) return;
  if (url.origin === location.origin && url.pathname.startsWith("/socket.io/") && url.pathname !== "/socket.io/socket.io.js") return;
  if (url.origin === location.origin && url.pathname === "/socket.io/socket.io.js") { e.respondWith(fresh(req, "/socket.io/socket.io.js")); return; }
  e.respondWith(fresh(req, req.mode === "navigate" ? "/index.html" : null));
});
