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
    <div className="group relative overflow-hidden rounded-[1.15rem] border border-[#DDE8E2] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FCFA_100%)] p-3 shadow-[0_10px_28px_rgba(16,42,67,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BFEFD7] hover:shadow-[0_20px_54px_rgba(16,42,67,0.12)] sm:rounded-[1.5rem] sm:p-5 sm:shadow-[0_16px_44px_rgba(16,42,67,0.07)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A859]/45 to-transparent" />
      <div className={`absolute left-0 top-0 h-full w-1 sm:w-1.5 ${styles.accent}`} />
      <div className="flex items-start justify-between gap-2 pl-1 sm:gap-3">
        <p className={`${styles.label} max-w-[12rem] text-[11px] font-black uppercase leading-4 tracking-[0.11em] sm:text-xs sm:leading-5`}>
          {title}
        </p>
        <div className={`${styles.icon} flex h-6 w-6 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8 sm:rounded-2xl`}>
          <Icon size={13} className="sm:hidden" />
          <Icon size={15} className="hidden sm:block" />
        </div>
      </div>
      <h2 className={`${styles.value} mt-3 pl-1 text-2xl font-black leading-none tracking-[-0.045em] sm:mt-4 sm:text-4xl sm:tracking-[-0.055em]`}>
        {displayValue}
      </h2>
    </div>
  )
}
