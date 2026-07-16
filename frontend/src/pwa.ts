import { API_URL, TECHNICAL_USER_KEY } from "./services/api"

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((error) => {
        console.error("Erro ao registrar service worker:", error)
      })
  })
}

function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Cria (ou reaproveita) a subscription e registra no backend.
// `recreate` força uma subscription nova — usado no login explícito.
async function syncSubscription(recreate: boolean): Promise<void> {
  const registration = await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()

  if (subscription && recreate) {
    await subscription.unsubscribe()
    subscription = null
  }

  if (!subscription) {
    // Busca a chave pública VAPID do backend
    const keyRes = await fetch(`${API_URL}/push/vapid-public-key`)
    if (!keyRes.ok) return
    const { publicKey } = await keyRes.json()

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const stored = localStorage.getItem(TECHNICAL_USER_KEY)
  if (!stored) return
  const { token } = JSON.parse(stored)

  await fetch(`${API_URL}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(subscription.toJSON()),
  })
}

// Fluxo com gesto do usuário (login, botão): pede permissão e assina do zero.
export async function subscribeToPush(): Promise<void> {
  if (!isPushSupported()) return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return

    await syncSubscription(true)
  } catch (err) {
    console.error("Erro ao inscrever em push:", err)
  }
}

// Fluxo silencioso (app aberto com sessão já ativa): só age se a permissão
// já foi concedida, reaproveitando a subscription existente quando houver.
// Garante que quem instalou o PWA depois do login continue recebendo push.
export async function ensurePushSubscription(): Promise<void> {
  if (!isPushSupported()) return
  if (Notification.permission !== "granted") return

  try {
    await syncSubscription(false)
  } catch (err) {
    console.error("Erro ao renovar inscrição de push:", err)
  }
}
