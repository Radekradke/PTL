import { randomUUID } from "crypto"
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  BLOCKED_EXTENSIONS,
  INLINE_VIEWABLE_MIME_TYPES,
  MAX_ATTACHMENT_BASE64_LENGTH,
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_UPLOAD,
} from "../config/attachments"

export type CleanAttachment = {
  filename: string // nome original higienizado (para exibir/baixar)
  storageKey: string // identificador interno seguro (UUID + extensão)
  mimeType: string
  data: string // conteúdo em base64
  size: number // tamanho aproximado em bytes
}

/** Extrai a extensão (com ponto, minúscula) do nome do arquivo. */
export function extractExtension(filename: string): string {
  const match = /\.[A-Za-z0-9]+$/.exec(String(filename || "").trim().toLowerCase())
  return match ? match[0] : ""
}

/**
 * Higieniza o nome enviado pelo usuário: remove componentes de caminho
 * (path traversal), caracteres de controle e caracteres perigosos.
 * NUNCA é usado como identificador físico — só para exibição/download.
 */
export function sanitizeFilename(filename: string): string {
  const base = String(filename || "").split(/[\\/]/).pop() || "arquivo"
  const cleaned = base
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f<>:"|?*]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "") // evita nomes iniciando com ponto (ocultos/traversal)
    .trim()
    .slice(0, 120)
  return cleaned || "arquivo"
}

export function isMimeAllowed(mime: string): boolean {
  return Object.prototype.hasOwnProperty.call(ALLOWED_ATTACHMENT_MIME_TYPES, mime)
}

export function isExtensionAllowedForMime(mime: string, ext: string): boolean {
  const exts = ALLOWED_ATTACHMENT_MIME_TYPES[mime]
  return Array.isArray(exts) && exts.includes(ext)
}

export function isBlockedExtension(ext: string): boolean {
  return BLOCKED_EXTENSIONS.includes(ext)
}

type ValidateResult =
  | { ok: true; value: CleanAttachment[] }
  | { ok: false; message: string }

/**
 * Valida uma lista de anexos vinda do cliente. Verifica quantidade,
 * MIME (allowlist), extensão (bate com o MIME e não está bloqueada),
 * conteúdo base64 e tamanho. Gera um storageKey interno (UUID) para cada.
 */
export function validateAttachments(value: unknown): ValidateResult {
  if (value === undefined || value === null) return { ok: true, value: [] }
  if (!Array.isArray(value)) return { ok: false, message: "Anexos inválidos." }
  if (value.length > MAX_ATTACHMENTS_PER_UPLOAD) {
    return { ok: false, message: `Máximo de ${MAX_ATTACHMENTS_PER_UPLOAD} arquivos por envio.` }
  }

  const clean: CleanAttachment[] = []

  for (const item of value as any[]) {
    const mimeType = String(item?.mimeType || "")
    const data = String(item?.data || "")
    const rawName = String(item?.filename || "arquivo")
    const filename = sanitizeFilename(rawName)
    const ext = extractExtension(filename) || extractExtension(rawName)

    if (!ext) {
      return { ok: false, message: "Arquivo sem extensão não é permitido." }
    }
    if (isBlockedExtension(ext)) {
      return { ok: false, message: `Tipo de arquivo não permitido (${ext}).` }
    }
    if (!isMimeAllowed(mimeType)) {
      return { ok: false, message: "Tipo de arquivo não permitido. Envie imagens, PDF, Word, Excel ou TXT." }
    }
    if (!isExtensionAllowedForMime(mimeType, ext)) {
      return { ok: false, message: "A extensão do arquivo não confere com o conteúdo." }
    }
    if (!data) {
      return { ok: false, message: "Arquivo vazio ou inválido." }
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(data)) {
      return { ok: false, message: "Conteúdo do arquivo inválido." }
    }
    if (data.length > MAX_ATTACHMENT_BASE64_LENGTH) {
      return { ok: false, message: `Cada arquivo deve ter no máximo ${MAX_ATTACHMENT_SIZE_LABEL}.` }
    }

    const size = Math.floor(data.length * 0.75)
    const storageKey = `${randomUUID()}${ext}`

    clean.push({ filename, storageKey, mimeType, data, size })
  }

  return { ok: true, value: clean }
}

/**
 * Monta um cabeçalho Content-Disposition seguro. Imagens/PDF/TXT abrem
 * inline (para preview); os demais forçam download. O nome é higienizado
 * e também enviado em filename* (RFC 5987) para acentos.
 */
export function contentDispositionFor(mimeType: string, filename: string): string {
  const disposition = INLINE_VIEWABLE_MIME_TYPES.has(mimeType) ? "inline" : "attachment"
  const safe = sanitizeFilename(filename).replace(/["\\]/g, "")
  const encoded = encodeURIComponent(sanitizeFilename(filename))
  return `${disposition}; filename="${safe}"; filename*=UTF-8''${encoded}`
}
