const CACHE = "crm-romanychev-v334";
const ASSETS = ["./", "./index.html", "./styles.css?v=99", "./mobile-v2.css?v=178", "./app.js?v=282", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response.ok && response.status !== 206) {
          try {
            const cache = await caches.open(CACHE);
            await cache.put(event.request, response.clone());
          } catch (error) {
            console.warn("Не удалось обновить offline-кэш", error);
          }
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          return caches.match(new URL("./index.html", self.registration.scope));
        }
        return Response.error();
      })
  );
});
