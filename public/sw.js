// sw.js
const CACHE_NAME = "dragio-shell-v2";
const APP_SHELL = [
  "/index.html",
  "/home.html",
  "/signin.html",
  "/forgot-password.html",
  "/reset-password.html",
  "/css/styles.css",
  "/js/supabaseClient.js",
  "/js/ui.js",
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

// Network-first for everything same-origin (HTML, JS, CSS) so code changes
// show up immediately for anyone online — the cache is purely an offline
// fallback, never the default source of truth. Only truly static binary
// assets (icons) skip the network round-trip. Supabase API calls always hit
// the network too, since cached API data would go stale immediately.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isApi = url.hostname.endsWith("supabase.co");
  const isIcon = url.pathname.startsWith("/icons/");

  if (isApi) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  if (isIcon) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html")))
  );
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
      data: { url: payload.url || "/home.html" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/home.html";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
