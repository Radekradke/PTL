import rateLimit from "express-rate-limit"

export const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de login. Aguarde 1 minuto e tente novamente." },
})
