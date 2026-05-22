export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((error) => {
        console.error("Erro ao registrar service worker:", error)
      })
  })
}
