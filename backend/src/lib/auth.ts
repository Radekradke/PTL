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
const DEV_AUTH_SECRET = "lifting-support-dev-secret-change-me"
const REQUIRED_TECHNICAL_SECTORS = ["Admin", "TI", "RH", "Infraestrutura"]

function isProduction() {
  return process.env.NODE_ENV === "production"
}

function getAuthSecret() {
  const secret = String(process.env.AUTH_SECRET || "").trim()

  if (secret.length >= 32) {
    return secret
  }

  if (isProduction()) {
    throw new Error("AUTH_SECRET deve ter pelo menos 32 caracteres em produção.")
  }

  return DEV_AUTH_SECRET
}

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
  const secret = getAuthSecret()
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

  const secret = getAuthSecret()
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
      const credentials = JSON.parse(process.env.TECHNICAL_CREDENTIALS) as Record<string, string>
      const hasAllCredentials = REQUIRED_TECHNICAL_SECTORS.every((sector) => String(credentials[sector] || "").trim())

      if (!hasAllCredentials) {
        throw new Error("TECHNICAL_CREDENTIALS deve conter Admin, TI e Diretoria.")
      }

      return credentials
    } catch {
      if (isProduction()) {
        throw new Error("TECHNICAL_CREDENTIALS inválido em produção.")
      }

      console.warn("TECHNICAL_CREDENTIALS inválido. Usando credenciais de desenvolvimento.")
    }
  }

  const envCredentials = {
    Admin: process.env.ADMIN_PIN,
    TI: process.env.TI_PIN,
    RH: process.env.RH_PIN,
    Infraestrutura: process.env.INFRAESTRUTURA_PIN,
  }

  const hasAllEnvPins = REQUIRED_TECHNICAL_SECTORS.every((sector) => String(envCredentials[sector as keyof typeof envCredentials] || "").trim())

  if (hasAllEnvPins) {
    return envCredentials as Record<string, string>
  }

  if (isProduction()) {
    throw new Error("Configure TECHNICAL_CREDENTIALS ou ADMIN_PIN, TI_PIN e DIRETORIA_PIN em produção.")
  }

  return {
    Admin: process.env.ADMIN_PIN || "2614",
    TI: process.env.TI_PIN || "1564",
    RH: process.env.RH_PIN || "3344",
    Infraestrutura: process.env.INFRAESTRUTURA_PIN || "5566",
  }
}

export function assertAuthConfig() {
  getAuthSecret()
  getTechnicalCredentials()
}
