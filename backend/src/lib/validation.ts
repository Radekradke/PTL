export const TICKET_STATUSES = ["Aberto", "Em andamento", "Aguardando usuário", "Finalizado"] as const
export const TICKET_ORIGINS = ["Administrativo", "Operacional"] as const
export const TICKET_CATEGORIES = ["PC", "Impressora", "Rede", "Sistema", "E-mail", "Câmera", "Outro"] as const

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string }

function cleanText(value: unknown) {
  return String(value || "").trim()
}

function isOneOf<T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return allowed.includes(value)
}

export function validateId(value: unknown, fieldName: string): ValidationResult<number> {
  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: `${fieldName} inválido.` }
  }

  return { ok: true, value: id }
}

export function validateName(value: unknown, fieldName = "Nome"): ValidationResult<string> {
  const text = cleanText(value)

  if (text.length < 2 || text.length > 80) {
    return { ok: false, message: `${fieldName} deve ter entre 2 e 80 caracteres.` }
  }

  return { ok: true, value: text }
}

export function validateUsername(value: unknown): ValidationResult<string> {
  const text = cleanText(value).toLowerCase()

  if (!/^[a-z0-9._-]{3,40}$/.test(text)) {
    return {
      ok: false,
      message: "Usuário deve ter 3 a 40 caracteres e usar apenas letras, números, ponto, hífen ou underline.",
    }
  }

  return { ok: true, value: text }
}

export function validatePassword(value: unknown, required = true): ValidationResult<string | null> {
  const text = cleanText(value)

  if (!text && !required) {
    return { ok: true, value: null }
  }

  if (text.length < 6 || text.length > 72) {
    return { ok: false, message: "Senha deve ter entre 6 e 72 caracteres." }
  }

  return { ok: true, value: text }
}

export function validatePin(value: unknown): ValidationResult<string> {
  const text = cleanText(value)

  if (!/^\d{4,8}$/.test(text)) {
    return { ok: false, message: "PIN deve conter de 4 a 8 números." }
  }

  return { ok: true, value: text }
}

export function validateTicketCategory(value: unknown): ValidationResult<string> {
  const text = cleanText(value)

  if (!isOneOf(text, TICKET_CATEGORIES)) {
    return { ok: false, message: "Categoria inválida." }
  }

  return { ok: true, value: text }
}

export function validateTicketOrigin(value: unknown): ValidationResult<string> {
  const text = cleanText(value)

  if (!isOneOf(text, TICKET_ORIGINS)) {
    return { ok: false, message: "Origem inválida." }
  }

  return { ok: true, value: text }
}

export function validateTicketStatus(value: unknown): ValidationResult<string> {
  const text = cleanText(value)

  if (!isOneOf(text, TICKET_STATUSES)) {
    return { ok: false, message: "Status inválido." }
  }

  return { ok: true, value: text }
}

export function validateLongText(value: unknown, fieldName: string, min = 3, max = 2000): ValidationResult<string> {
  const text = cleanText(value)

  if (text.length < min || text.length > max) {
    return { ok: false, message: `${fieldName} deve ter entre ${min} e ${max} caracteres.` }
  }

  return { ok: true, value: text }
}
