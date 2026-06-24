const CACHE_VERSION = "ptl-pwa-v2"
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/favicon.png",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const requestUrl = new URL(event.request.url)

  if (
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith("/api") ||
    requestUrl.pathname.startsWith("/auth")
  ) {
    return
  }

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/")))
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse

        const responseToCache = networkResponse.clone()
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, responseToCache))

        return networkResponse
      })
    })
  )
})

// ── Push notification handler ──
self.addEventListener("push", (event) => {
  if (!event.data) return

  let data = {}
  try { data = event.data.json() } catch { return }

  const title   = data.title || "PTL · Lifting Support"
  const body    = data.body  || "Você tem um novo chamado."
  const url     = data.url   || "/tickets"

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  "/pwa-icon-192.png",
      badge: "/pwa-icon-192.png",
      tag:   `ticket-${data.ticketId || Date.now()}`,
      renotify: true,
      data: { url },
      vibrate: [200, 100, 200],
    })
  )
})

// ── Click na notificação → abre a aba de chamados ──
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || "/tickets"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        return existing.navigate(targetUrl)
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
