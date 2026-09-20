// sw.js
const CACHE_NAME = "dragio-shell-v3";

// Only files guaranteed to exist at these exact paths in a Vite build.
// Vite's JS/CSS bundles get hashed filenames per build (e.g.
// /assets/index-a1b2c3.js) that can't be known ahead of time here, so
// those are cached at runtime instead (see the fetch handler below).
const APP_SHELL = [
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isApi = url.hostname.endsWith("supabase.co");
  const isStaticAsset = url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/avatars/");
  const isNavigation = event.request.mode === "navigate";

  // Supabase API calls: always hit the network, cached data would go stale instantly.
  if (isApi) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // Vite's hashed assets are genuinely immutable (a content change gets a
  // new filename), so cache-first is correct and safe here — no repeat of
  // the old static-site caching bug, since filenames aren't reused.
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Every other route is React Router's territory — always serve index.html
  // and let the client-side router figure out what to show, so a PWA launch
  // or a deep link never depends on that exact path having its own file.
  if (isNavigation) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

// ---- Web Push ----
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();

  event.waitUntil(
    self.registration.showNotification(payload.title || "Dragio", {
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/home" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
