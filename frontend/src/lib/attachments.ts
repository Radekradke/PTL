// ============================================================
// Anexos — configuração central e utilitários (frontend) — v1.3.2
// Espelha os limites/tipos do backend (backend/src/config/attachments.ts).
// ============================================================

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10 MB por arquivo
export const MAX_ATTACHMENTS_PER_UPLOAD = 5
export const MAX_ATTACHMENT_SIZE_LABEL = "10MB"

// MIME → extensões aceitas
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/plain": [".txt"],
}

// extensão → MIME canônico (para quando o navegador não informa o type)
const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
}

export const ALLOWED_EXTENSIONS = Object.keys(EXT_TO_MIME)

// Atributo accept do <input type=file> (extensões + MIME para o seletor nativo)
export const ATTACHMENT_ACCEPT = [...ALLOWED_EXTENSIONS, ...Object.keys(ALLOWED_MIME_TYPES)].join(",")

export const ATTACHMENT_HINT = "PNG, JPG, WEBP, PDF, DOC, DOCX, XLS, XLSX ou TXT · máx. 10MB por arquivo"

const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".ps1", ".msi", ".js", ".mjs", ".cjs", ".jar",
  ".sh", ".vbs", ".scr", ".dll", ".apk", ".app", ".php", ".py", ".html", ".htm", ".svg",
]

export type AttachmentKind = "image" | "pdf" | "word" | "excel" | "text" | "file"

export type PendingAttachment = {
  id: string
  filename: string
  mimeType: string
  data: string // base64 puro (sem prefixo data:)
  size: number // bytes
  kind: AttachmentKind
  previewUrl?: string // data URL — só para imagens
}

// Metadados de um anexo já salvo (chamado ou sugestão)
export type StoredAttachment = {
  id: number
  ticketId?: number
  suggestionId?: number
  messageId?: number | null
  filename: string
  mimeType: string
  size?: number
}

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

export function extractExtension(filename: string): string {
  const match = /\.[A-Za-z0-9]+$/.exec(String(filename || "").trim().toLowerCase())
  return match ? match[0] : ""
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/")
}

export function kindFromMime(mime: string, filename = ""): AttachmentKind {
  if (isImageMime(mime)) return "image"
  if (mime === "application/pdf" || extractExtension(filename) === ".pdf") return "pdf"
  if (mime.includes("word") || [".doc", ".docx"].includes(extractExtension(filename))) return "word"
  if (mime.includes("sheet") || mime.includes("excel") || [".xls", ".xlsx"].includes(extractExtension(filename))) return "excel"
  if (mime === "text/plain" || extractExtension(filename) === ".txt") return "text"
  return "file"
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
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

async function compressImage(file: File): Promise<PendingAttachment> {
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
  if (!data) throw new Error("Não foi possível processar a imagem.")

  const baseName = (file.name || "imagem").replace(/\.[^.]+$/, "")
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    filename: `${baseName}.jpg`,
    mimeType: "image/jpeg",
    data,
    size: Math.floor(data.length * 0.75),
    kind: "image",
    previewUrl,
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || "")
      const base64 = result.includes(",") ? result.split(",")[1] : result
      if (!base64) reject(new Error("Não foi possível ler o arquivo."))
      else resolve(base64)
    }
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."))
    reader.readAsDataURL(file)
  })
}

/**
 * Converte um arquivo selecionado em um anexo pronto para envio.
 * Imagens são recomprimidas (JPEG) para o upload ficar leve; documentos
 * são lidos como base64 preservando nome/tipo. Lança Error com mensagem
 * amigável quando o arquivo é inválido ou grande demais.
 */
export async function fileToAttachment(file: File): Promise<PendingAttachment> {
  const ext = extractExtension(file.name)

  if (!ext || BLOCKED_EXTENSIONS.includes(ext)) {
    throw new Error(`Tipo de arquivo não permitido${ext ? ` (${ext})` : ""}.`)
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error("Tipo não permitido. Envie imagem, PDF, Word, Excel ou TXT.")
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error(`"${file.name}" excede ${MAX_ATTACHMENT_SIZE_LABEL}.`)
  }

  // Imagens: recomprime para JPEG (mais leve, gera miniatura).
  if (file.type.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    return compressImage(file)
  }

  // Documentos: mantém original. Usa o MIME canônico da extensão quando o
  // navegador não informa um type válido (comum em .docx/.xlsx).
  const mimeType = ALLOWED_MIME_TYPES[file.type] ? file.type : EXT_TO_MIME[ext]
  const data = await fileToBase64(file)

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    filename: String(file.name || `arquivo${ext}`).slice(0, 120),
    mimeType,
    data,
    size: file.size,
    kind: kindFromMime(mimeType, file.name),
  }
}

export function attachmentPayload(list: PendingAttachment[]) {
  return list.map(({ filename, mimeType, data }) => ({ filename, mimeType, data }))
}
