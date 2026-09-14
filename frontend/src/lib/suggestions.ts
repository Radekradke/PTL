import type { StoredAttachment } from "@/lib/attachments"

export const SUGGESTION_CATEGORIES = [
  "Sistema / Tecnologia",
  "Processo",
  "Equipamento",
  "Infraestrutura",
  "Segurança",
  "Comunicação",
  "Outro",
] as const

export const SUGGESTION_STATUSES = [
  "Nova",
  "Em análise",
  "Aprovada",
  "Planejada",
  "Implementada",
  "Não aprovada",
  "Adiada",
] as const

export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number]

export type Suggestion = {
  id: number
  title: string
  description: string
  improvement?: string | null
  category: string
  sectorName?: string | null
  status: string
  isAnonymous: boolean
  author?: string | null
  employeeId?: number | null
  internalNote?: string
  createdAt: string
  updatedAt: string
  attachments: StoredAttachment[]
}

// Estilos de badge por status — discretos, alinhados ao design.
export const statusBadge: Record<string, string> = {
  "Nova": "border-slate-200 bg-slate-100 text-slate-600",
  "Em análise": "border-amber-200 bg-amber-50 text-amber-700",
  "Aprovada": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Planejada": "border-sky-200 bg-sky-50 text-sky-700",
  "Implementada": "border-teal-200 bg-teal-50 text-teal-700",
  "Não aprovada": "border-rose-200 bg-rose-50 text-rose-700",
  "Adiada": "border-zinc-200 bg-zinc-100 text-zinc-500",
}

export const statusDot: Record<string, string> = {
  "Nova": "#94A3B8",
  "Em análise": "#F59E0B",
  "Aprovada": "#059669",
  "Planejada": "#0EA5E9",
  "Implementada": "#0D9488",
  "Não aprovada": "#E11D48",
  "Adiada": "#A1A1AA",
}

export function suggestionBadgeClass(status: string): string {
  return statusBadge[status] || statusBadge["Nova"]
}
