import { useEffect, useState } from "react"
import { apiFetch } from "@/services/api"

export const DEFAULT_SECTOR_COLOR = "#00A859"

// Cor neutra para setores desconhecidos/desativados ("Sem setor")
const UNKNOWN_SECTOR_COLOR = "#64748B"

export type SectorColorMap = Record<string, string>

export function buildSectorColorMap(
  sectors: Array<{ name: string; color?: string | null }>
): SectorColorMap {
  const map: SectorColorMap = {}
  for (const sector of sectors) {
    map[sector.name] = sector.color || DEFAULT_SECTOR_COLOR
  }
  return map
}

// Busca os setores uma vez e devolve o mapa nome → cor.
export function useSectorColors(): SectorColorMap {
  const [colors, setColors] = useState<SectorColorMap>({})

  useEffect(() => {
    let cancelled = false

    apiFetch("/sectors")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setColors(buildSectorColorMap(data))
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return colors
}

export function SectorBadge({ name, color }: { name: string; color?: string }) {
  const badgeColor = color || UNKNOWN_SECTOR_COLOR

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold"
      style={{ background: `${badgeColor}1A`, color: badgeColor }}
    >
      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: badgeColor }} />
      {name}
    </span>
  )
}
