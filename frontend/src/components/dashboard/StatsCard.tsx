import { useEffect, useMemo, useState } from "react"
import { AlertCircle, AlertTriangle, Anchor, CheckCircle2, Clock, LayoutList } from "lucide-react"

type StatsCardTone = "neutral" | "warning" | "info" | "success" | "danger" | "base"

interface Props {
  title: string
  value: string
  color?: string
  tone?: StatsCardTone
}

const toneStyles: Record<StatsCardTone, { label: string; value: string; accent: string; icon: string }> = {
  neutral: { label: "text-slate-500", value: "text-[#111827]", accent: "bg-[#073B2A]", icon: "bg-slate-100 text-slate-500" },
  warning: { label: "text-amber-700", value: "text-amber-700", accent: "bg-[#F59E0B]", icon: "bg-amber-100 text-amber-600" },
  info: { label: "text-blue-700", value: "text-blue-700", accent: "bg-[#2563EB]", icon: "bg-blue-100 text-blue-700" },
  success: { label: "text-[#073B2A]", value: "text-[#00A859]", accent: "bg-[#00A859]", icon: "bg-emerald-100 text-emerald-700" },
  danger: { label: "text-rose-700", value: "text-rose-700", accent: "bg-rose-500", icon: "bg-rose-100 text-rose-600" },
  base: { label: "text-cyan-700", value: "text-cyan-700", accent: "bg-cyan-500", icon: "bg-cyan-100 text-cyan-700" },
}

const toneIcons: Record<StatsCardTone, React.ElementType> = {
  neutral: LayoutList,
  warning: AlertCircle,
  info: Clock,
  success: CheckCircle2,
  danger: AlertTriangle,
  base: Anchor,
}

function resolveTone(tone?: StatsCardTone, color?: string): StatsCardTone {
  if (tone) return tone
  if (color?.includes("yellow") || color?.includes("amber")) return "warning"
  if (color?.includes("blue") || color?.includes("sky")) return "info"
  if (color?.includes("green") || color?.includes("emerald")) return "success"
  if (color?.includes("red") || color?.includes("rose")) return "danger"
  if (color?.includes("purple") || color?.includes("indigo")) return "base"
  return "neutral"
}

export function StatsCard({ title, value, color, tone }: Props) {
  const resolvedTone = resolveTone(tone, color)
  const styles = toneStyles[resolvedTone]
  const Icon = toneIcons[resolvedTone]
  const numericValue = useMemo(() => {
    if (!/^\d+$/.test(value)) return null
    return Number(value)
  }, [value])
  const [animatedValue, setAnimatedValue] = useState(numericValue ?? 0)

  useEffect(() => {
    if (numericValue === null) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduceMotion) {
      setAnimatedValue(numericValue)
      return
    }

    let frame = 0
    const startValue = animatedValue
    const difference = numericValue - startValue
    const startTime = performance.now()
    const duration = 650

    function tick(currentTime: number) {
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)

      setAnimatedValue(Math.round(startValue + difference * easedProgress))

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick)
      }
    }

    frame = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(frame)
  }, [numericValue])

  const displayValue = numericValue === null ? value : String(animatedValue)

  return (
    <div className="ls-glass group relative overflow-hidden p-3 transition-all duration-200 hover:-translate-y-0.5 sm:p-5">
      <div className={`absolute left-0 top-0 h-full w-1 sm:w-1.5 ${styles.accent}`} />
      <div className="flex items-start justify-between gap-2 pl-1 sm:gap-3">
        <p className={`${styles.label} max-w-[12rem] text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] sm:text-xs sm:leading-5`}>
          {title}
        </p>
        <div className={`${styles.icon} flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8 sm:rounded-xl`}>
          <Icon size={13} className="sm:hidden" strokeWidth={2} />
          <Icon size={15} className="hidden sm:block" strokeWidth={2} />
        </div>
      </div>
      <h2 className={`${styles.value} ls-num mt-3 pl-1 text-2xl font-bold leading-none tracking-[-0.04em] sm:mt-4 sm:text-4xl sm:tracking-[-0.05em]`}>
        {displayValue}
      </h2>
    </div>
  )
}
