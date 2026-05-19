import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto"

type AuthType = "technical" | "employee"

export type AuthPayload = {
  type: AuthType
  sector?: string
  employeeId?: number
  name?: string
  exp: number
}

const TOKEN_TTL_SECONDS = 60 * 60 * 12
const PASSWORD_PREFIX = "scrypt"
const secret = process.env.AUTH_SECRET || "lifting-support-dev-secret-change-me"

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  return Buffer.from(normalized, "base64").toString("utf8")
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function hashPassword(password?: string) {
  const value = String(password || "").trim()
  if (!value) return null

  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(value, salt, 64).toString("hex")

  return `${PASSWORD_PREFIX}:${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash?: string | null) {
  const value = String(password || "").trim()
  if (!value || !storedHash) {
    return { valid: false, needsRehash: false }
  }

  if (!storedHash.startsWith(`${PASSWORD_PREFIX}:`)) {
    return { valid: false, needsRehash: false }
  }

  const [, salt, hash] = storedHash.split(":")

  if (!salt || !hash) {
    return { valid: false, needsRehash: false }
  }

  const candidate = scryptSync(value, salt, 64).toString("hex")
  return { valid: safeEqual(candidate, hash), needsRehash: false }
}

export function signToken(payload: Omit<AuthPayload, "exp">, ttlSeconds = TOKEN_TTL_SECONDS) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    })
  )
  const signature = base64UrlEncode(createHmac("sha256", secret).update(`${header}.${body}`).digest())

  return `${header}.${body}.${signature}`
}

export function verifyToken(token?: string) {
  if (!token) return null

  const [header, body, signature] = token.split(".")
  if (!header || !body || !signature) return null

  const expectedSignature = base64UrlEncode(createHmac("sha256", secret).update(`${header}.${body}`).digest())
  if (!safeEqual(expectedSignature, signature)) return null

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as AuthPayload
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

export function getTechnicalCredentials() {
  if (process.env.TECHNICAL_CREDENTIALS) {
    try {
      return JSON.parse(process.env.TECHNICAL_CREDENTIALS) as Record<string, string>
    } catch {
      console.warn("TECHNICAL_CREDENTIALS inválido. Usando credenciais padrão de desenvolvimento.")
    }
  }

  return {
    Admin: process.env.ADMIN_PIN || "2614",
    TI: process.env.TI_PIN || "1564",
    Diretoria: process.env.DIRETORIA_PIN || "0000",
  }
}
