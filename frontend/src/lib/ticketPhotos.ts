export const MAX_TICKET_PHOTOS = 3

// Redimensiona no navegador para o upload ficar leve mesmo com foto de celular
const MAX_DIMENSION = 1400
const JPEG_QUALITY = 0.8

export type PendingPhoto = {
  id: string
  filename: string
  mimeType: string
  data: string
  previewUrl: string
}

export type MessageAttachment = {
  id: number
  ticketId: number
  messageId?: number | null
  filename: string
  mimeType: string
  size?: number
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Não foi possível ler a imagem."))
    }
    img.src = url
  })
}

export async function fileToCompressedPhoto(file: File): Promise<PendingPhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Envie apenas imagens (JPG, PNG ou WebP).")
  }

  const img = await loadImage(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))

  const context = canvas.getContext("2d")
  if (!context) {
    URL.revokeObjectURL(img.src)
    throw new Error("Não foi possível processar a imagem.")
  }

  context.drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(img.src)

  const previewUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY)
  const data = previewUrl.split(",")[1] || ""
  if (!data) {
    throw new Error("Não foi possível processar a imagem.")
  }

  const baseName = (file.name || "foto").replace(/\.[^.]+$/, "")

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    filename: `${baseName}.jpg`,
    mimeType: "image/jpeg",
    data,
    previewUrl,
  }
}
