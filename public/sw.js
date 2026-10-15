const CACHE_NAME = "kantin-sekolah-v2";
const STATIC_ASSETS = [
  "/manifest.json",
  "/offline",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network only for navigation, API, Firebase, and dev routes
  if (
    event.request.mode === "navigate" ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/admin") ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    event.request.method !== "GET"
  ) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        if (event.request.mode === "navigate") {
          const cache = await caches.open(CACHE_NAME);
          const offlinePage = await cache.match("/offline");
          if (offlinePage) return offlinePage;
        }
        return new Response("Offline", { status: 503 });
      })
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
