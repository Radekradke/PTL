import rateLimit from "express-rate-limit"

export const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de login. Aguarde 1 minuto e tente novamente." },
})

// Ouvidoria: máximo 5 denúncias por IP a cada 10 minutos para evitar spam de e-mail
export const ouvidoriaLimiter = rateLimit({
  windowMs: 10 * 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas denúncias enviadas. Aguarde alguns minutos antes de tentar novamente." },
})
