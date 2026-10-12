/* Colmena service worker: makes the app installable and opens it offline.
   Network first for the app's own files (so updates show up immediately), cache as fallback.
   API calls and other origins are never touched. */
const CACHE = "colmena-v1";
const SHELL = ["./", "index.html", "styles.css", "app.js", "i18n.js", "icon.svg", "manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only the app's own files; never API calls, other sites, or URLs with a query (e.g. the sign-in callback).
  if (req.method !== "GET" || url.origin !== self.location.origin || url.search) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html"))),
  );
});
