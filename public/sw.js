const CACHE_NAME = "gestor-planillas-shell-v4";
const SHELL_URLS = [
  "/",
  "/dashboard",
  "/login",
  "/requests",
  "/work-offers",
  "/settings",
  "/manifest.webmanifest",
  "/planillas-icon.svg",
  "/planillas-icon-192.png",
  "/planillas-icon-512.png",
  "/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/auth/")) {
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkResponse = fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseCopy = response.clone();
              void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
            }

            return response;
          })
          .catch(() => cachedResponse);

        return cachedResponse ?? networkResponse;
      })
    );
    return;
  }

  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !response.redirected) {
            const responseCopy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          return cachedPage ?? caches.match("/dashboard") ?? caches.match("/");
        })
    );
    return;
  }

  if (SHELL_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkResponse = fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseCopy = response.clone();
              void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
            }

            return response;
          })
          .catch(() => cachedResponse);

        return cachedResponse ?? networkResponse;
      })
    );
  }
});
