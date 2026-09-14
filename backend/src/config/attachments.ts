// ============================================================
// Configuração central de anexos (chamados e sugestões) — v1.3.2
// Um único lugar para limites e tipos permitidos. Não espalhar
// esses valores pelo código.
// ============================================================

/** Tamanho máximo por arquivo (bytes). Inicialmente 10 MB. */
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024

/** Quantidade máxima de arquivos por envio (evita abuso). */
export const MAX_ATTACHMENTS_PER_UPLOAD = 5

/**
 * base64 ocupa ~4/3 do tamanho binário. Guardamos o conteúdo como
 * base64 no banco, então o limite do texto é derivado do limite binário.
 */
export const MAX_ATTACHMENT_BASE64_LENGTH = Math.ceil((MAX_ATTACHMENT_SIZE * 4) / 3) + 128

/** Rótulo amigável do limite (para mensagens de erro/UI). */
export const MAX_ATTACHMENT_SIZE_LABEL = `${Math.round(MAX_ATTACHMENT_SIZE / 1024 / 1024)}MB`

/**
 * Allowlist de MIME types → extensões aceitas. A validação exige que
 * o MIME esteja aqui E que a extensão do nome bata com o MIME.
 */
export const ALLOWED_ATTACHMENT_MIME_TYPES: Record<string, string[]> = {
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

/**
 * Extensões explicitamente bloqueadas (defesa em profundidade). Mesmo
 * que o MIME "escape" da allowlist, essas nunca passam. Inclui formatos
 * executáveis e potencialmente executáveis (scripts, HTML/SVG com script).
 */
export const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".ps1", ".psm1", ".msi", ".msp",
  ".js", ".mjs", ".cjs", ".jar", ".sh", ".bash", ".zsh",
  ".vbs", ".vbe", ".wsf", ".wsh", ".scr", ".pif", ".cpl", ".dll", ".sys",
  ".apk", ".app", ".deb", ".rpm", ".dmg", ".bin", ".run",
  ".php", ".phtml", ".py", ".rb", ".pl", ".jsp", ".asp", ".aspx", ".cgi",
  ".htm", ".html", ".xhtml", ".svg", ".xml", ".reg", ".lnk", ".gadget",
]

/** MIME types que o navegador consegue exibir inline com segurança. */
export const INLINE_VIEWABLE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
])
